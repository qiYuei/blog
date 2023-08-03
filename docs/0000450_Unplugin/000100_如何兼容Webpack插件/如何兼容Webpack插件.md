# unplugin

> Unified plugin system for Vite, Rollup, Webpack, esbuild, and more

我们知道每个打包工具都有它自己的插件系统，插件系统的 API 又是各种不一样。`rollup` `esbuild` 插件系统都还好并不多 `api`,老大哥 `webpack` 的插件系统那真是复杂得一批。

对于我自己来说我可能只关心**加载和转换**，这两件事情在`webpack` 中类似 `loader` 的功能。那我如果还在在插件方面做一些事情，这有涉及到 `loader` 和 `plugin` 通信想想头都大。

`unplugin` 对标 `rollup` 的插件系统，对市面上的打包工具都做了一些兼容性处理，这篇文章就来看看是如何兼容 `webpack` 生态的

## 源码分析

从本质上来说还是通过配置的`hook` 去找 `webpack` 合适的钩子函数进行监听。比如下方

```ts
if (plugin.buildEnd) {
  compiler.hooks.emit.tapPromise(plugin.name, async (compilation) => {
    await plugin.buildEnd!.call(createContext(compilation));
  });
}

if (plugin.writeBundle) {
  compiler.hooks.afterEmit.tap(plugin.name, () => {
    plugin.writeBundle!();
  });
}
```

对于 `rollup` 来说会先调用 `resolveId` -> `load` -> `transform` 。

- resolveId 将模块转换成绝对路径或者是 虚拟模块
- load 对某些路径进行内容读取
- transform 对读取的内容进行转换

这三部分熟悉 `webpack` 的都知道是 `loader` 的责任。`unplugin` 中如何在 `plugin` 中实现 `loader` 的功能是本篇文章的重点。

### load

`load` 钩子在 `rollup` 中是通过路径,去获取文件内容。而在 `webpack` 的 `loader` 中则是 `webpack`自身读取内容，再将内容通过参数传输给我们。省去读取的动作。

好在 `webpack`的 `loader` 中有`include`选项作为筛选处理的文件类型，这也正好对应 `unplugin` 的 `loadIncludes` 的钩子。在插件中我们在最前面插入一个 **自定义 loader** ,这个`自定义loader`就做一件事情,调用 `load` 钩子，并处理返回值.

```ts
compiler.options.module.rules.unshift({
  include(id) {
    if (plugin.loadInclude && !plugin.loadInclude(id)) return false;
    return true;
  },
  enforce: plugin.enforce,
  use: [{ loader: custom_loader }], // 自定义loader
});

function custom_loader(source, map) {
  const callback = this.async(); // 转换成异步loader
  const id = this.this.resource; // 获取转换模块的路径

  if (!plugin?.load || !id) return callback(null, source, map);

  const res = await plugin.load.call(
    Object.assign(
      this._compilation && (createContext(this._compilation) as any),
      context
    ),
    normalizeAbsolutePath(id)
  );

  if (res == null) callback(null, source, map);
  else if (typeof res !== "string") callback(null, res.code, res.map ?? map);
  else callback(null, res, map);
}
```

这种在`plugin` 中插入新 `rule` 的想法真是太棒了！

### transform

通过上文的分析，我们也大概知道要怎么去做，以及思路。实际上 `unplugin` 也是通过动态加入新`rules`思路去实现 `transform`钩子.值得注意的点就是顺序问题,按照 `rollup` 的执行规则是先 `load->transform`. 而在 `unplugin` 的源码中因为 判断的位置原因导致变成 `transform->load` 。这里我也提了个[pr](https://github.com/unjs/unplugin/pull/326) 来解决这个问题。

```js
const path = require("path");

function loaderPath(loaders) {
  return loaders.map((loader) =>
    path.resolve(__dirname, "loaders", loader + ".js")
  );
}
module.exports = {
  mode: "development",
  entry: "./src/index.js",
  output: {
    filename: "bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: loaderPath(["pre-loader1", "pre-loader2"]),
      },
      // normal loader
      {
        test: /\.js$/,
        use: loaderPath(["normal-loader1", "normal-loader2"]),
      },
      // post loader
      {
        test: /\.js$/,
        enforce: "post",
        use: loaderPath(["post-loader1", "post-loader2"]),
      },
    ],
  },
};
```

上面配置中需要注意的点

1. 通过 enforce 属性，设置 loader 的执行顺序
2. 通过!分割 inline-loader

看下运行结果

```text
// index.js 执行的loader

normal-loader2
normal-loader1
pre-loader2
pre-loader1
post-loader2
post-loader1
```

### 虚拟模块

虚拟模块这一概念由 `rollup` 提出，是一种很实用的模式，使你可以对使用 ESM 语法的源文件传入一些编译时信息。

```js
export default function myPlugin() {
  const virtualModuleId = "virtual:my-module";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  return {
    name: "my-plugin", // 必须的，将会在 warning 和 error 中显示
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return `export const msg = "from virtual module"`;
      }
    },
  };
}
```

这使得可以在 `JavaScript` 中引入这些模块：

```js
import { msg } from "virtual:my-module";

console.log(msg); // from virtual module
```

::: info
在内部，使用了虚拟模块的插件在解析时应该将模块 `ID` 加上前缀 **\0**，这一约定来自 `rollup` 生态。这避免了其他插件尝试处理这个 `ID`（比如 `node` 解析），而例如 `sourcemap` 这些核心功能可以利用这一信息来区别虚拟模块和正常文件。`\0` 在导入 `URL` 中不是一个被允许的字符，因此我们需要在导入分析时替换掉它们。
:::

而这一特性在`webpack` 中通过 `webpack-virtual-modules` 插件实现还支持热更新。

那就让我们来看看 `unplugin` 中是怎么使用这个插件的

首先得知道的是怎么判断一个模块是否为虚拟模块

1. fs 文件系统查找不到 fs.existsSync() === false
2. 模块的路径(id)不是一个绝对路径

在 `unplugin` 中我们最早能拿到模块路径的钩子是 `resolveId`,所以我们重点来看看这个钩子

```ts
if (plugin.resolveId) {
  // 找到用户是否已经注册了 虚拟模块插件
  let vfs = compiler.options.plugins.find(
    (i) => i instanceof VirtualModulesPlugin
  ) as VirtualModulesPlugin;

  if (!vfs) {
    // 没有则加上
    vfs = new VirtualModulesPlugin();
    compiler.options.plugins.push(vfs);
  }

  // 收集那些模块是虚拟模块
  plugin.__vfsModules = new Set();
  plugin.__vfs = vfs;

  // 在解析的时候添加一个  resolve 插件
  const resolverPlugin: ResolvePluginInstance = {
    apply(resolver) {
      const target = resolver.ensureHook("resolve");

      resolver
        .getHook("resolve")
        .tapAsync(plugin.name, async (request, resolveContext, callback) => {
          if (!request.request) return callback();

          // filter out invalid requests
          if (
            normalizeAbsolutePath(request.request).startsWith(
              plugin.__virtualModulePrefix
            )
          )
            return callback();
          // 去除绝对路径
          const id = normalizeAbsolutePath(request.request);

          const requestContext = (
            request as unknown as { context: { issuer: string } }
          ).context;

          const importer =
            requestContext.issuer !== "" ? requestContext.issuer : undefined;
          const isEntry = requestContext.issuer === "";

          // call hook
          const resolveIdResult = await plugin.resolveId!(id, importer, {
            isEntry,
          });

          if (resolveIdResult == null) return callback();

          let resolved =
            typeof resolveIdResult === "string"
              ? resolveIdResult
              : resolveIdResult.id;

          const isExternal =
            typeof resolveIdResult === "string"
              ? false
              : resolveIdResult.external === true;
          if (isExternal) externalModules.add(resolved);

          // If the resolved module does not exist,
          // we treat it as a virtual module
          // 如果返回的路径不是一个可查找的路径,那就当他是一个虚拟模块
          if (!fs.existsSync(resolved)) {
            resolved = normalizeAbsolutePath(
              plugin.__virtualModulePrefix + encodeURIComponent(resolved) // URI encode id so webpack doesn't think it's part of the path
            );

            // webpack virtual module should pass in the correct path
            // https://github.com/unjs/unplugin/pull/155
            if (!plugin.__vfsModules!.has(resolved)) {
              plugin.__vfs!.writeModule(resolved, "");
              plugin.__vfsModules!.add(resolved);
            }
          }

          // construct the new request
          const newRequest = {
            ...request,
            request: resolved,
          };

          // redirect the resolver
          resolver.doResolve(
            target,
            newRequest,
            null,
            resolveContext,
            callback
          );
        });
    },
  };

  compiler.options.resolve.plugins = compiler.options.resolve.plugins || [];
  compiler.options.resolve.plugins.push(resolverPlugin);
}
```

上面只知道我们确定了某些条件下这个模块就是一个虚拟模块，并且用 `__vfs!.writeModule` 根据路径写了一个空文件。那些真实的文件内容是什么时候写进去的呢？

//todo
我们接下来继续分析 `load`
