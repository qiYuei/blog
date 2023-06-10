### 浏览器的渲染原理

根据 dom 生成 dom 树,然后根据 css 生成 css 树。然后 dom 树和 css 树生成一棵 render 树，因为节点中可能有 `display:none`；所以 render 树和 dom 树并不是一一对应的。接着就会遍历渲染书并调用渲染对象的 point()方法将他们的内容显示在屏幕上。注意:浏览器为了更好地用户体验采取渲染一部分就显示一部分。<br />如果渲染的过程中遇到 JS 文件的加载、解析、与执行。则会阻止解析过程,因为 JS 中可能会有对 dom 的一系列操作，所以需要等待 JS 执行完毕,这就会造成长时间的白屏。解决办法就是将 `<script></script>` 放置 body 的下面。<br />或者是 在 `<script></script>` 中加入 `async` 或者 `defer`让 JS 异步加载

#### defer 和 async

`defer`异步加载 JS 文件，延迟执行。也就是说加载 JS 时`html并未停止解析`。两个过程是并行的。在等整个 document 文档解析完再执行 JS 脚本。文档解析完成时，脚本被执行，此时也会触发 domcontentloaded 事件，优先执行脚本

`async`异步加载 JS 文件但是 它是先加载完就立刻执行所以执行的顺序不一定，也就是说他的执行也会`阻塞文档的解析`

#### css 解析为什么会阻碍页面渲染

首先、css 解析并不会影响 dom 的解析，但是会阻碍页面的渲染

css 选择器<br />!important > style > id > Class|属性|伪类 > 元素选择器

### 回流和重绘

    回流：页面进行重新渲染，与重绘不同的是，回流会重新计算几何的宽高之类的。<br />    触发回流的操作

- 改变元素的宽高
- 改变元素的显示状态
- getClientHeight,getClientWidth 等;
- 改变字体大小
- 内容变化，比如 input 输入内容
- 窗口大小发生改变

  重绘:对几何的颜色相关进行改变，就会发生重绘

** 回流一定会发生重绘 **

#### 减少回流的操作

1. 操作动画是尽量让其 position:absolute;脱离文档流，不影响其他元素
2. 用 tranform:tranlate() 代替 left 和 top 等；
3. 频繁增加或者删除 dom 时，使用 documentFragment 文档碎片。
4. 少使用 table 布局，table 布局一丁点改变都会重新渲染
5. 修改 style 时，最好用 class 来代替。
