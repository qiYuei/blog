`vite`在开发模式下使用`esbuild`进行构建,而生产模式下则使用`rollup`构建。这就会引出两个疑问

- 为什么生产还是需要打包
- 为什么生产环境不能使用`esbuild`来构建

---

## 为什么生产环境仍需打包

尽管原生 `ESM `现在得到了广泛支持，但由于嵌套导入会导致额外的网络往返，在生产环境中发布未打包的 `ESM`仍然效率低下（即使使用 HTTP/2）。为了在生产环境中获得最佳的加载性能，最好还是将代码进行 `tree-shaking`、懒加载和 `chunk` 分割（以获得更好的缓存）。<br />要确保开发服务器和生产环境构建之间的最优输出和行为一致并不容易。所以 Vite 附带了一套 [构建优化](https://cn.vitejs.dev/guide/features.html#build-optimizations) 的 [构建命令](https://cn.vitejs.dev/guide/build.html)，开箱即用。

## 为何不用 ESBuild 打包？

`Vite` 目前的插件 `API` 与使用 `esbuild` 作为打包器并不兼容。尽管 `esbuild` 速度更快，但 `Vite` 采用了 `Rollup` 灵活的插件 `API `和基础建设，这对 `Vite` 在生态中的成功起到了重要作用。目前来看，我们认为 `Rollup` 提供了更好的性能与灵活性方面的权衡。<br />即便如此，`esbuild` 在过去几年有了很大进展，我们不排除在未来使用 `esbuild` 进行生产构建的可能性。我们将继续利用他们所发布的新功能，就像我们在 JS 和 CSS 最小化压缩方面所做的那样，`esbuild` 使 `Vite` 在避免对其生态造成干扰的同时获得了性能提升。

---

由于生产环境的打包，使用的是 `Rollup`，`Vite` 需要保证，同一套 Vite 配置文件和源码，**在开发环境和生产环境下的表现是一致的**。

## Vite 兼容了什么？

我们先来看看`vite`的`Plugin`都暴露了什么钩子。

1. 服务器启动时调用

- options
- buildStart

2. 每个传入模块请求时被调用

- resolveId
- load
- transform

3. 服务器关闭时调用

- buildEnd
- closeBundle

4. HMR 相关钩子
5. transformHtml 针对 html 模板文件

有些钩子是`rollup`中也有的,但是有一些钩子则是`Vite`特有。那也就是说**Vite 其实并不是完全兼容 Rollup 插件生态，能够兼容兼容的也是部分而已。**

> 这里强调一下，是部分兼容、部分替代，不是完全的，因为 Vite 的部分实现是与 Rollup 不同的

---

## 如何做到兼容

上面提到的关于打包的钩子可能`rollup`有用,但是对于`esbuild`却是没有用。那`Vite`是如何将他们之间的差异抹平的？

`Vite`因为只需要模拟`rollup`的部分钩子以及对应的行为(并发,优先级执行)等，以及对应钩子的`rollup`上下文、工具方法等等。<br />这些在源码中都在`pluginContainer`(插件容器)中实现。

`pluginContainer`主要承担了以下工作:

- 实现 `rollup`钩子的调度
- 提供与生产模式下相同的 `Context`上下文对象
- 对不同钩子的返回值进行处理
- 实现钩子的类型提示

```typescript
async createPluginContainer(){
  const container = {
    options: await (async () => {
      let options = rollupOptions
      for (const optionsHook of getSortedPluginHooks('options')) {
        options = (await optionsHook.call(minimalContext, options)) || options
      }
      return options;
    })(),

    // 钩子类型：异步、并行
    async buildStart() {
      // 实现并行的钩子类型：用 Promise.all 执行
      await hookParallel(
        'buildStart',
        (plugin) => new Context(plugin),
        () => [container.options as NormalizedInputOptions],
      )
    },

    // 钩子类型：异步、优先
    async load(id, options) {
      const ctx = new Context()
      for (const plugin of getSortedPlugins('load')) {
        if (!plugin.load) continue
        ctx._activePlugin = plugin
        const handler =
          'handler' in plugin.load ? plugin.load.handler : plugin.load
        const result = await handler.call(ctx as any, id, { ssr })
        if (result != null) {
          if (isObject(result)) {
            updateModuleInfo(id, result)
          }
          return result
        }
      }
      return null
    },

  }

  return container
}
```

---

有了这个`pluginContainer`后只需要在特定的时期调用一次**容器的方法**即可。至于在哪里调用什么钩子，这里不做展开

### 小技巧

`Vite`的插件钩子允许用户在注册钩子事件是可以自己控制执行控制,而且这些顺序是在注册插件的时候就可以确定的。如果每次调用都要去进行一次排序这看起来就有点不聪明。<br />在创建容器的时候，我们就可以利用闭包的特性。将我们的各种事件钩子缓存起来，并添加排序。

```typescript
async function createPluginHookUtils(plugins) {
  const sortedPluginsCache = new Map<keyof Plugin, Plugin[]>();

  function getSortedPlugins(hookName: keyof Plugin): Plugin[] {
    if (sortedPluginsCache.has(hookName))
      return sortedPluginsCache.get(hookName)!;
    const sorted = getSortedPluginsByHook(hookName, plugins);
    sortedPluginsCache.set(hookName, sorted);
    return sorted;
  }
  function getSortedPluginHooks<K extends keyof Plugin>(
    hookName: K
  ): Plugin[K][] {
    // NonNullable<HookHandler<Plugin[K]>>[]
    const plugins = getSortedPlugins(hookName);
    return plugins
      .map((p) => {
        const hook = p[hookName]!;
        return typeof hook === "object" && "handler" in hook
          ? hook.handler
          : hook;
      })
      .filter(Boolean);
  }

  return {
    getSortedPlugins,
    getSortedPluginHooks,
  };
}

export function getSortedPluginsByHook(
  hookName: keyof Plugin,
  plugins: readonly Plugin[]
): Plugin[] {
  const pre: Plugin[] = [];
  const normal: Plugin[] = [];
  const post: Plugin[] = [];
  for (const plugin of plugins) {
    const hook = plugin[hookName];
    if (hook) {
      if (typeof hook === "object") {
        if (hook.order === "pre") {
          pre.push(plugin);
          continue;
        }
        if (hook.order === "post") {
          post.push(plugin);
          continue;
        }
      }
      normal.push(plugin);
    }
  }
  return [...pre, ...normal, ...post];
}

// 外部调用
const { getSortedPluginHooks } = createPluginHookUtils(plugins);

const loadPluginFNs = getSortedPluginHooks("load");
```
