主要为了方便自身复习和巩固知识，并非全为面试题

### 1. 盒模型

`css` 中盒模型有两种 `标准盒模型` 和 `IE 盒模型`,可以通过 `box-sizing` 属性来改变盒模型
其中 `content-box` 代表标准盒模型且是默认值，`border-box` 代表 IE 盒模型

两者的计算方式不同

- 标准盒模型盒子大小: width/height + border + padding + margin
- IE 盒模型盒子大小: width/height(包括 border 和 padding) + margin

### 2. BFC

`BFC` 即 `Block Formatting Context` 块级格式化上下文。它决定了元素如何对其内容进行定位，以及与其他元素的关系和相互作用。

主要用于解决元素之间的布局问题，比如**外边距重叠、清除浮动**等。

触发条件

- 根元素
- display: inline-block / table / flex / inline-flex
- position: absolute / fixed
- overflow !== visible (可以为 auto / scroll / hidden )

### 3. 外边距重叠

外边距重叠结果遵循下列计算规则：

- 两个相邻的外边距都是正数时，折叠结果是它们两者之间较大的值。
- 两个相邻的外边距都是负数时，折叠结果是两者绝对值的较大值。
- 两个外边距一正一负时，折叠结果是两者的相加的和。

### 4. 清除浮动

#### 影响

会造成父元素的高度塌陷和与浮动元素同级的非浮动元素会填补原有位置

#### 解决方式

- 给父元素设置一个高度
- 给父元素设置`overflow: hidden`
- 在浮动元素后面添加一个空的标签并添加`clear: both`
- 在父元素中利用伪元素

目前建议使用`伪元素 (before / after)` 来清除

```css
.clearfix::after {
  content: "";
  clear: both;
  display: block;
}
```

### 5. 水平垂直居中

- 子元素未知，父元素设置 display:flex;并 justify-content:center;align-item:center;
- 子元素是块元素，父元素设置 display:flex;子元素设置 margin:auto;
- 子元素已知具体高度可以利用定位解决
  ```css
  .parent {
    position: relative;
  }
  .child {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
  ```

### 6. CSS 的权重和优先级

<el-table :data="tableData">
  <el-table-column prop="name" label="属性" ></el-table-column>
  <el-table-column prop="weight" label="权重" ></el-table-column>
</el-table>

<script setup>
import { ref } from 'vue'
const tableData = ref([
  { name: '!important', weight: '10000' },
  { name: '内联样式', weight: '1000' },
  { name: 'id 选择器', weight: '100' },
  { name: 'class / 伪类选择器 / 属性', weight: '10'},
  { name: '标签选择器 / 伪元素选择器', weight: '1' },
  { name: '相邻兄弟 / 子选择器 / 后代选择器 / 通配符', weight: '0'}
])
</script>
<style>
table{
  margin:0;
}  
</style>

`!important` > `内联样式` > `id选择器` > `class选择器 / 伪类选择器` > `标签选择器` > `*`

### 7. 如何优化动画性能问题

1. 开启硬件加速
2. 使用 `transform` 代替 `top` 和 `left` 减少不必要的重排
3. 使用 `requestAnimationFrame` 代替 `setTimeout` 减少重排
4. 利用 `requestIdleCallback` 在空闲时才执行任务

### 8. 如何开启硬件加速

- 可通过 CSS 中设置 `transform:translateZ(0);`
- 使用 `will-change` 属性, 如 `will-change:transform;` 来告诉浏览器这个属性将要做改变来提前优化
- `opacity` 属性也会触发硬件加速

### 9. link 和 @import 的区别

- `link` 属于 `HTML` 标签，而 `@import` 属于 CSS 提供的语法规则
- `link` 在 `html` 解析的时候会并行加载，而 `@import` 则会等到 `DomContentLoaded` 事件触发后并在 `load` 事件触发前加载（样式表没有加载完，浏览器是不会继续渲染所以可能会阻碍页面渲染）
- `link` 没有兼容性问题，而 `@import` 不支持 `ie5` 以下版本
