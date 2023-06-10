当首次启动 `vite` 时，`Vite` 在本地加载你的站点之前预构建了项目依赖。默认情况下，它是自动且透明地完成的。并在`node_modules`下生成`.vite/deps`下生成产物,这一步是使用`esbuild`来完成的。

<el-divider />

围绕着预构建我们先来看一下几个问题

1. 为什么需要预构建
2. 预构建的内容是什么？/ 哪些模块需要进行预构建？
3. 如何找到需要预构建的模块？

## 为什么需要预构建

这个问题可从官网中寻找答案

1. **CommonJS 和 UMD 兼容性:** 在开发阶段中，`Vite` 的开发服务器将所有代码视为**原生 ES 模块**。因此，`Vite` 必须先将以 `CommonJS `或 `UMD` 形式提供的依赖项转换为 ES 模块。

   在转换 `CommonJS `依赖项时，`Vite` 会进行智能导入分析，这样即使模块的导出是动态分配的（例如 `React`），具名导入（named imports）也能正常工作：

```javascript
// 符合预期
import React, { useState } from "react";
```

2. **性能：** 为了提高后续页面的加载性能，`Vite`将那些具有许多内部模块的 ESM 依赖项转换为单个模块。有些包将它们的 ES 模块构建为许多单独的文件，彼此导入。例如，[lodash-es 有超过 600 个内置模块](https://unpkg.com/browse/lodash-es/)！当我们执行 `import { debounce } from 'lodash-es'` 时，浏览器同时发出 600 多个 HTTP 请求！即使服务器能够轻松处理它们，但大量请求会导致浏览器端的网络拥塞，使页面加载变得明显缓慢。通过将 `lodash-es` 预构建成单个模块，现在我们只需要一个 HTTP 请求！
   <a name="BDnKn"></a>

## 预构建内容

对于`vite`来说，它只会预构建`bare Import`(期望从 node_modules 中解析)。
<a name="usxM4"></a>

### 什么是 bare Import

```javascript
import Vue from "vue"; // true

import foo from "./foo.js"; // false
```

简单来说只要不是用路径并且它的路径包含`node_modules`去访问的就会被`vite`认为是`bare Import`

```typescript
function esbuildScanPlugin(){
  return {
     setup(){
       build.onResolve({},()=>{
         // 触发vite 插件 resovleId
          const resolved = await resolve(id, importer, {
            custom: {
              depScan: { loader: pluginData?.htmlType?.loader },
            },
           })
           if (resolved) {
             // 关键
            if (resolved.includes('node_modules') || include?.includes(id)) {
              // dependency or forced included, externalize and stop crawling
              if (isOptimizable(resolved, config.optimizeDeps)) {
                depImports[id] = resolved
              }
              return externalUnlessEntry({ path: id })
            }
       })
     }
  }
}


```

<a name="pDyUt"></a>

### 为什么只对 bare import 进行预构建？

这些依赖一般来说都属于第三方模块，一般来说不会修改。<br />如果对开发者代码也进行预构建，那也就意味着会将项目打包成一个`chunk`。那不就回到了以前`webpack`的时代，先将代码打包成`chunk`热更新时重新分析依赖再打包成`chunk`。对于`vite`来说就没有意义了。
<a name="v379H"></a>

### monorepo 下的模块也会被预构建吗？

不会,`vite`比我们想象的更加**聪明一点**。当我们使用软链接链接到项目的时候,它的实际路径实际上是不会在本项目的`node_modules`中。但是**node 的寻址机制可以将其打包。**

```javascript
// PS E:\code\vite> pnpm link -g @mom/formula
// C:\Users\QiYuei\AppData\Local\pnpm\global\5:
// + @mom/formula 1.2.1 <- E:\翰智\bugfix\V44\Mom-Component\packages\formula

console.log(require.resolve("@mom/formula"));
//E:\bugfix\V44\Mom-Component\packages\formula\dist\index.cjs.js

console.log(require.resolve("fast-glob"));
// E:\code\vite\node_modules\.pnpm\fast-glob@3.2.12\node_modules\fast-glob\out\index.js
```

---

<a name="yxxuW"></a>

## 如何寻找到需要预构建的模块

---

![image.png](https://cdn.nlark.com/yuque/0/2023/png/1363969/1680833349481-c7ae9959-369c-4a28-94a1-294545fc38d7.png#averageHue=%23faf9f9&clientId=u65a03cf3-b673-4&from=paste&height=592&id=ue1f88294&name=image.png&originHeight=740&originWidth=1421&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=98061&status=done&style=none&taskId=u731e9cf1-3b8e-46c4-a43c-c78c7a6bca2&title=&width=1136.8)
<a name="b9yEL"></a>

### 依赖扫描实现思路

要扫描出所有的 `bare import`就需要对一整棵依赖树进行深度遍历。这一点绝大部分打包工具都可以做到(webpack/rollup)等。至于为什么选择`esbuild`则是因为它**更快。**

说到深度递归就需要有终止条件

- 遇到`bare import`时就记录下该依赖,不继续遍历下去
- 对于其他与`JS`无关的模块,如`css/svg`等也不需要遍历

当所有**能够扫描**的节点都扫描过一遍之后,依赖收集就算完成了。此时需要记录`bare import`的入口文件路径即可。
<a name="wHOFl"></a>

### 依赖扫描实现细节

上面对于依赖扫描的实现思路其实不难,就是递归。而递归这件事`esbuild`也能帮我们完成,我们只需要提供终止条件以及逻辑处理就好了。

`esbuild`在插件中也提供了`onResolve`和`onLoad`的事件,再加上内置的过滤器实现起来就更加的快速。<br />在这里需要先了解下`Vite/esbuild`插件的基本用法

- esbuild 插件在读取内容时会先触发`onResolve`事件,回调中需要返回**文件的真实路径**和**触发 onload 的过滤的命名空间**(默认是:file)
- 在获取文件真实路径的时候会调用`vite`的**插件容器**里面的`resolveId`钩子
  <a name="ekCWC"></a>

#### 解析 html

对于`esbuild`来说它只认`JS`,并不会处理其他文件格式的内容。而`vite`的入口文件默认是`index.html`所以需要对`html`类型进行解析。<br />首先先拿到绝对路径

```typescript
const htmlTypesRE = /\.(html|vue|svelte|astro|imba)$/;
// html types: extract script contents -----------------------------------
build.onResolve({ filter: htmlTypesRE }, async ({ path, importer }) => {
  // vite的插件容器
  const resolved = await resolve(path, importer);
  if (!resolved) return;
  // It is possible for the scanner to scan html types in node_modules.
  // If we can optimize this html type, skip it so it's handled by the
  // bare import resolve, and recorded as optimization dep.
  if (
    resolved.includes("node_modules") &&
    isOptimizable(resolved, config.optimizeDeps)
  )
    return;
  return {
    path: resolved,
    namespace: "html",
  };
});
```

再处理`html`文件中可能加载的`<script>`内容路径，需要用**正则**匹配`script`中的`src`

```typescript
// extract scripts inside HTML-like files and treat it as a js module
build.onLoad({ filter: htmlTypesRE, namespace: "html" }, async ({ path }) => {
  let raw = fs.readFileSync(path, "utf-8");
  // Avoid matching the content of the comment
  raw = raw.replace(commentRE, "<!---->");
  const isHtml = path.endsWith(".html");
  // 这个正则里面就包括了.vue文件内 script 的 解析
  const regex = isHtml ? scriptModuleRE : scriptRE;
  regex.lastIndex = 0;
  let js = "";
  let scriptId = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(raw))) {
    const [, openTag, content] = match;
    const typeMatch = openTag.match(typeRE);
    const srcMatch = openTag.match(srcRE);
    if (srcMatch) {
      const src = srcMatch[1] || srcMatch[2] || srcMatch[3];
      // 关键点 拼成 import 的语法
      js += `import ${JSON.stringify(src)}\n`;
    } else if (content.trim()) {
      // The reason why virtual modules are needed:
      // 1. There can be module scripts (`<script context="module">` in Svelte and `<script>` in Vue)
      // or local scripts (`<script>` in Svelte and `<script setup>` in Vue)
      // 2. There can be multiple module scripts in html
      // We need to handle these separately in case variable names are reused between them

      // append imports in TS to prevent esbuild from removing them
      // since they may be used in the template

      // 对内联script的处理
      const contents =
        content + (loader.startsWith("ts") ? extractImportPaths(content) : "");

      const key = `${path}?id=${scriptId++}`;
      if (contents.includes("import.meta.glob")) {
        scripts[key] = {
          loader: "js", // since it is transpiled
          contents: await doTransformGlobImport(contents, path, loader),
          pluginData: {
            htmlType: { loader },
          },
        };
      } else {
        scripts[key] = {
          loader,
          contents,
          pluginData: {
            htmlType: { loader },
          },
        };
      }

      const virtualModulePath = JSON.stringify(virtualModulePrefix + key);

      const contextMatch = openTag.match(contextRE);
      const context =
        contextMatch && (contextMatch[1] || contextMatch[2] || contextMatch[3]);

      // Especially for Svelte files, exports in <script context="module"> means module exports,
      // exports in <script> means component props. To avoid having two same export name from the
      // star exports, we need to ignore exports in <script>
      if (path.endsWith(".svelte") && context !== "module") {
        js += `import ${virtualModulePath}\n`;
      } else {
        js += `export * from ${virtualModulePath}\n`;
      }
    }
  }

  // This will trigger incorrectly if `export default` is contained
  // anywhere in a string. Svelte and Astro files can't have
  // `export default` as code so we know if it's encountered it's a
  // false positive (e.g. contained in a string)
  if (!path.endsWith(".vue") || !js.includes("export default")) {
    js += "\nexport default {}";
  }

  return {
    loader: "js",
    contents: js,
  };
});
```

总结下来：

- 读取文件源码
- 正则匹配出所有的 script 标签，并对每个 script 标签的内容进行处理
  - 外部 script，改为用 **import 引入**
  - 内联 script，改为引入**虚拟模块**，并将对应的虚拟模块的内容**缓存到 script 对象。**
- 最后返回转换后的 js

#### 解析 JS

**esbuild 本身就能处理 JS 语法**，因此 JS 是不需要任何处理的，esbuild 能够分析出 JS 文件中的依赖，并进一步深入处理这些依赖。

### 依赖扫描结果

下面是一个 depImport 对象的例子：

```typescript
{
  "vue": "D:/app/vite/node_modules/.pnpm/vue@3.2.37/node_modules/vue/dist/vue.runtime.esm-bundler.js",
  "vue/dist/vue.d.ts": "D:/app/vite/node_modules/.pnpm/vue@3.2.37/node_modules/vue/dist/vue.d.ts",
  "lodash-es": "D:/app/vite/node_modules/.pnpm/lodash-es@4.17.21/node_modules/lodash-es/lodash.js"
}
```

- key：模块名称
- value：模块的真实路径
