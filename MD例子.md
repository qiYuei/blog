# Markdown 常用语法

## 标题

- 输入
  ```bash
    # h1
    ## h2
    ### h3
    #### h4
    ##### h5
  ```
- 输出
  # h1
  ### h3
  #### h4
  ##### h5

## 文本内容

- 输入
  ```bash
  **加粗**
  _斜体_
  ~~删除线~~
  `行内突出`
  ```
- 输出

  **加粗**

  _斜体 xieti_

  ~~删除线~~

  `行内突出`

## 段落

- 输入
  ```bash
  > 我是第一段落
  >> 我是第二段落
  >>> 我是第三段落
  ```
- 输出
  > 我是第一段落
  >
  > > 我是第二段落
  > >
  > > > 我是第三段落

## 外链

- 输入
  ```bash
  [我是外链](http://www.example.com)
  ```
- 输出

  [我是外链](http://www.example.com)

## 路由

- 输入
  ```html
  <!-- [主页](/首页/index) -->
  <!-- <a href="/detail/index">跳转到detail文件夹下的index.md</a>
  <a href="/Help/FAQ/sample#代码块">跳转示例页面下的代码块锚点</a> -->
  ```
- 输出

```js
// <!-- [主页](/首页/index) -->

// <!-- <a href="/Help/FAQ/sample">跳转到 FAQ 文件夹下的 sample.md</a>

// <a href="/Help/FAQ/sample#代码块">跳转示例页面下的代码块锚点</a> -->
```

## 图片

- 输入
  ```bash
  ![alt 属性文本](图片地址)
  ```
- 输出
  ![alt 属性文本](https://www.baidu.com/img/PCtm_d9c8750bed0b3c7d089fa7d55720d6cf.png)

## 本地图片

- 输入
  ```html
  <!-- 图片路径：@img表示公共资源下的图片文件夹，如：./resource/image -->
  <!-- <img src="@img/axios_img.jpeg" /> -->
  ```
- 输出

```js
// <img src="@img/axios_img.jpeg" />
```

## 远程视频

- 输入
  ```html
  <video controls>
    <source src="http://www.runoob.com/try/demo_source/movie.mp4" />
  </video>
  ```
- 输出
  <video controls>
    <source src="http://www.runoob.com/try/demo_source/movie.mp4">
  </video>

## 表格

- 输入
  ```bash
  | 产品          |      数量      | 单价   |
  | ------------- |:-------------:| -----:|
  | 英规十字螺丝刀  |    10         | $16  |
  | 螺纹钢         | 100           | $120 |
  ```
- 输出
  | 产品 | 数量 | 单价 |
  | ------------- |:-------------:| -----:|
  | 英规十字螺丝刀 | 10 | $16 |
  | 螺纹钢 | 100 | $120 |

## 状态容器

- 输入

  ```bash
  ::: info
  信息盒子
  :::

  ::: tip
  提示盒子
  :::

  ::: warning
  警告盒子
  :::

  ::: danger
  危险盒子
  :::

  ::: details
  详情盒子
  :::

  ```

- 输出
  ::: info
  信息盒子
  :::

  ::: tip
  提示盒子
  :::

  ::: warning
  警告盒子
  :::

  ::: danger
  危险盒子
  :::

  ::: details
  详情盒子
  :::

## 代码块

- 输入

  ````js
  // 使用代码块
    ```填写技术栈（如bash, js, ts, java）

    ```结束符
  ````

- 输出
  ```js
  const log = "js";
  console.log(`hello ${log}`); // hello js
  ```

## 流程图

- 输入
  ````bash
    ```mermaid
      graph LR
      抽奖界面需求-->登录
      抽奖界面需求-->未登录
      未登录-->登录
        登录-->第一次抽奖
        登录-->已抽过奖
            第一次抽奖-->中奖
                中奖-->分享中奖信息
                    分享中奖信息-->结束
            第一次抽奖-->未中奖
                未中奖-->结束
            已抽过奖-->显示奖品/未中奖
  ````
- 输出
  ```mermaid
    graph LR
    抽奖界面需求-->登录
    抽奖界面需求-->未登录
    未登录-->登录
      登录-->第一次抽奖
      登录-->已抽过奖
          第一次抽奖-->中奖
              中奖-->分享中奖信息
                  分享中奖信息-->结束
          第一次抽奖-->未中奖
              未中奖-->结束
          已抽过奖-->显示奖品/未中奖
  ```
