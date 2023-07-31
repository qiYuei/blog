这里主要分享下几道常见的 `webpack` 面试题。看多的多脑子有个大概印象但是总归要写写才能加深印象

## webpack 的构建原理

1. 初始化参数。这一个阶段在启动 `webpack` 服务的时候它会合并命令行中的参数以及`webpack.config.js` 中的参数
2. 开始编译。根据配置实例化 `complier` 对象，注册并调用用户注册 `plugins` 的 `apply` 方法，最终调用 `complier.run()` 开始进行编译
3. 确定入口，编译模块。根据配置的入口文件开始扫描建立图谱,遇到非`.js/.json` 的文件匹配对应的 `loader` 进行解析
4. 完成编译。根据入口和模块之间的依赖关系，将解析后的代码块合并成一个个 `Chunk`
5. 输出资源。通过文件系统输出所有的`Chunk`，形成具体的文件

## 如何加快 webpack 构建速度

1. 开启多线程构建 `thread-loader`
2. 缩小打包作用域
   - `loader` 中加上 `includes/excludes` 缩小转换路径
   - `resolve.extensions` 尽可能减少后缀尝试的可能性
   - `noParse` 对完全不需要解析的库进行忽略
3. 使用 CDN
   利用 `externals` 将一些库通过 `cdn` 引入,缩小构建体积
4. 生产环境关闭生成 `source-map`
5. 合理利用缓存
   - `babel-loader` 开启缓存
   - `terser-webpack-plugin` 开启缓存
   - 使用 `cache-loader` 或者 `hard-source-webpack-plugin` (webpack5 已经内置)
6. 将不经常更新的包进行分包处理,最大可能利用缓存 (`optimization.splitChunks`进行拆分)

## loader 和 plugin 的区别

loader: `Webpack` 在设计时只认识`.js/.json` 这两种文件格式。而为了打包 `.css` 这种文件就必须需要一种转换器将 `.css` 变成 `.js` 。`loader`对其他类型的资源进行转译的预处理工作

plugin: `Webpack` 基于 `tapable` 在运行的整个生命周期中会暴露出大量的事件,通过监听这些事件可以改变输出结果

## 有写过 loader 吗

## 有写过 plugin 吗

## webpack 热更新原理

:::warning
这个是 webpack4 版本的 hrm,webpack5 与这个有一点点区别
:::

在`webpack.config.js` 的 `devServer` 中加上`hot` 开启热更新。在启动 `webpack-dev-server` 的时候就会通过`html-webpack-plugin` 来注入客户端热更新逻辑，建立一个 `websocket` 连接

当文件修改时重新编译完成后,`webpack-hot-middleware-server` 就会根据这次编译的信息得到一个`manifest`包含两个文件

一个包括最新`hash`和变化`chunkId`,和一个根据影响的`模块内容`所打包的`chunk`

```json
{ "h": "0fc80707d2fd379a748c", "c": { "app": true } }
```

然后通过 `websocket` 发送消息`hash` 数据是这个最新的 `hash`

客户端接收到这个消息后就会跟本地最新的`hash` 作对比,如果两者一样那代表已经更新过不做任何处理
如果不一样则会去请求这个 `hash` 所对应的 `json`文件也就是上面的`json`。这样就拿到这次改变 `hash` 对应更新的 `chunkId`。遍历`c`的`key`去采用`jsonp`请求对应的 `chunkId` 内容。最后替换掉旧内容缓存起来。

:::info
接下来是 webpack5 版本的热更新
:::

至于 webpack5 则是将生成的 update.json 的数据结构改变

```json
{"c":["main"."c"],"m":[],"r":[]}
```

其中 `c` 还是指此次更新所涉及的 `ChunkId`. `m` 指被删除的模块,`r` 指

## 聊聊 source-map

我们在打包后代码可能会被压缩以及混淆，就导致我们很难去定位源码。而 `source-map` 通过算法来映射了源码和打包后打码的关系。

`webpack` 提供了很多种 `source-map` 的生成方式主要分为

- eval 不生成`source-map`但是会在 eval 的代码中添加 `//# sourceURL=；`
- cheap 只记录行信息，不记录列信息
- module 记录打包后代码与源码文件信息
- hidden 生成 `source-map` 但不在文件后面加上 `//# sourceMappingURL`,配合埋点使用

最佳实践

- 开发阶段推荐使用 `source-map` 和 `cheap-module-source-map`
- 生产阶段推荐使用 `false` 或者是 `hidden-source-map`

https://juejin.cn/post/7175077774787346489?searchId=2023071921191499A5169E0ADAAF955312

## 聊聊文件指纹(hash,content-hash,chunk-hash)

- hash 跟着整个项目走,只要项目中某个文件改变这个就会改变
- content-hash 跟着文件内容走，只有文件内容变才会改变
- chunk-hash chunk 中的某个文件改变才会改变

## treeShaking 机制

`treeShaking` 旨在打包的时候去掉无用的代码或者是死代码，来减少打包的体积。

原理就是利用 `esmodule` 的静态分析，就可以得到哪些代码是没有使用的。既然没有使用的那就是可以删除的

但是并不是所有的代码都是没有用的比如工具库大部分都是让用户来使用,所以现在通过 `package.sideEffects` 来告诉打包器哪一些是有用的,不能简单去掉

`rollup` 中可以无需配置即可享受，但是 `webpack` 的话并不支持直接删除,他只会在代码中进行标记,最后利用 `Terser、UglifyJS`等插件删除这部分代码

如果打包器中有使用`babel` 的话需要将`@babel/preset-env`中设置成`modules:false` 。如果是 `modules:'commonjs'` 将会把代码转换成 commonjs 规范

https://juejin.cn/post/7002410645316436004#heading-0

## webpack5 新特性

- 内置缓存 在这之前需要安装 cache-loader
- 联邦模块

## 模块联邦

将某个模块作为打包入口进行打包，通过配置信息实现代码共享。虎牙有一个微前端框架就是使用这个

模块联邦可以在多个 `webpack` 的产物之间进行共享模块、依赖、页面甚至是整个应用。通过全局变量的组合还可以获取到其他模块的数据。通过配置实现真正可插拔式的使用，比如我们想要在 a 模块中使用 b 模块的表格。首先需要将 b 模块的表格进行暴露出去，然后再 a 模块中注册。这样就可以通过 `import Table from 'b/table'` 来进行使用。

## swc 和 esbuild 为什么能这么快

`swc` 使用 `rust` 语言编写在 `webpack` 中 可以使用 `swc-loader` 代替。在官网中并没有说明为什么比 `babel` 快这么多，最大可能还是因为
`babel` 是 `JS` 写的，单线程的原因。

`esbuild` 使用 `go` 语言编写在 `webpack` 中可以使用 `esbuild-loader`代替。快的原因

1. go 语言的多线程优势
2. 不使用第三方模块，减少数据结构的相互转换
3. 尽可能复用 AST。 在 `webpack` 可能会变成 `ts->Ast->js string-> Ast -> 低版本JS -> Ast`
