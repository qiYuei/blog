# 困境

## ContentEditable

先了解一下什么是 contentEditable，先上 MDN 的解释

> [https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Editable_content](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Editable_content)
> In HTML, any element can be editable. By using some JavaScript event handlers,
> you can transform your web page into a full and fast rich text editor.
> This article provides some information about this functionality.

再来看看它的兼容性 **can i use**<br />![image.png](https://cdn.nlark.com/yuque/0/2021/png/1363969/1618750664845-68b805a6-6d59-4803-8eb9-8c4b10227353.png#averageHue=%23e3d6c0&height=264&id=S1qDg&originHeight=527&originWidth=1723&originalType=binary&ratio=1&rotation=0&showTitle=false&size=104765&status=done&style=none&title=&width=861.5)<br />可以看出基本上现代浏览器都支持这个属性，但是。对但是各个浏览器厂商对他们的实现却是不同

### 标签生成的差异

使用`contenteditable`不同的浏览器已经痛苦了很长的时间，因为在浏览器之间生成的标记的差异。例如，即使是像按 Enter / Return 键在可编辑元素内创建新行文本时一样简单的操作，在主要浏览器上也有不同的处理方式（使用 Firefox 插入 `<br>`  元素，使用 IE / Opera，使用 `<p>` Chrome / Safari `<div>` ）。

幸运的是，在现代浏览器中，情况更加一致。从[Firefox 60 开始](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/60)，Firefox 将进行更新以将单独的行包装在 `<div>`  元素中，以匹配 Chrome，现代 Opera，Edge 和 Safari 的行为。

总结下来就是

- Chrome/Safari 是 div 标签
- Firefox 在 60 版本之前，是在当前的行级标签中加一个<br/>
- Firefox 在 60 版本之后，趋同于 Chrome/Safari，是 div 标签
- IE/Opera 是 p 标签

## document.execCommand

老规矩先看 MDN 的介绍

> **已废弃**
> This feature is obsolete.
> Although it may still work in some browsers, its use is discouraged since it could be removed at any time. Try to avoid using it.

再来看看它的兼容性 **can i use**<br />![image.png](https://cdn.nlark.com/yuque/0/2021/png/1363969/1618753268487-b470dfd8-de05-4d89-8b9b-b33ee0acd0c5.png#averageHue=%23e6dac5&height=198&id=i2JjQ&originHeight=396&originWidth=1709&originalType=binary&ratio=1&rotation=0&showTitle=false&size=78002&status=done&style=none&title=&width=854.5)<br />调用一下浏览器 API，就能轻轻松松实现一个富文本编辑器。<br />**听起来很美好，但现实却往往很残酷**。<br />如果这样就能做好一个富文本编辑器，那他也不配被称为前端领域几大天坑了。

接下来看看各位对这个 `api`  的吐槽以及坑点

[https://github.com/guardian/scribe/blob/master/BROWSERINCONSISTENCIES.md](https://github.com/guardian/scribe/blob/master/BROWSERINCONSISTENCIES.md)

[https://www.oschina.net/translate/why-contenteditable-is-terrible?lang=chs&p=1](https://www.oschina.net/translate/why-contenteditable-is-terrible?lang=chs&p=1)

# 破局

实现富文本在是否抱紧浏览器这个巨人上可以分成三类

1. **L0 完全拥抱巨人(基于 ConententEditable+document.execCommand)**
2. **L1 站在巨人的肩膀上 (基于 ConententEditable+自己实现操作命令)**
3. **L2 站在巨人的脚上(自己实现 ConententEditable+自己实现操作命令)**

**引入知乎大佬对三个等级的基本介绍和优劣**<br />![image.png](https://cdn.nlark.com/yuque/0/2021/png/1363969/1618755558106-d0a3adbd-b8aa-4efd-a65c-d32553109e6d.png#averageHue=%23424b55&height=287&id=njXlb&originHeight=574&originWidth=1056&originalType=binary&ratio=1&rotation=0&showTitle=false&size=401796&status=done&style=none&title=&width=528)<br />![image.png](https://cdn.nlark.com/yuque/0/2021/png/1363969/1618755573162-7f7f4943-236f-44ab-987c-30660c6544f1.png#averageHue=%23949c9e&height=250&id=bgITX&originHeight=500&originWidth=1064&originalType=binary&ratio=1&rotation=0&showTitle=false&size=204354&status=done&style=none&title=&width=532)

拿 `wangEditor`  来说就是典型的 `L0`  级别。并不是说 `L0`  级别的东西不好，是说对于用户量和需求功能增长来说， `L0`  的缺点就越发的明显。<br />有句话就很合适。

> 人民群众日益增长的富文本编辑需求和浏览器 contenteditable 提供的落后生产力之间的矛盾

举个例子<br />![image.png](https://cdn.nlark.com/yuque/0/2021/png/1363969/1618837564976-58c1d962-6ec5-44a9-9e43-4a250e1ee115.png#averageHue=%23f9f9f9&height=169&id=b3Fmg&originHeight=338&originWidth=1809&originalType=binary&ratio=1&rotation=0&showTitle=false&size=57685&status=done&style=none&title=&width=904.5)<br />如果我取消其中两个字的加粗，它的 `dom结构`  就会变成这样<br />![image.png](https://cdn.nlark.com/yuque/0/2021/png/1363969/1618837640968-2e0e2182-3ec9-4127-b776-ca58980812d3.png#averageHue=%23faf9f9&height=150&id=wy1U5&originHeight=299&originWidth=1808&originalType=binary&ratio=1&rotation=0&showTitle=false&size=50900&status=done&style=none&title=&width=904)<br />我再加上点这些加粗后的字体再来点颜色。它又会变成这样<br />![image.png](https://cdn.nlark.com/yuque/0/2021/png/1363969/1618838177315-8ed8ede4-4824-4820-a91d-9a2c3bd984a4.png#averageHue=%23faf9f9&height=153&id=iAZgN&originHeight=305&originWidth=766&originalType=binary&ratio=1&rotation=0&showTitle=false&size=19729&status=done&style=none&title=&width=383)<br />这样子看结构就变得很复杂了。

**那我们能不能优化成这样**

- 如果 `Range`  是的 `start`  和 `end`  是这个选中 `dom`  的 `startoffset`  和 `endoffset`  那就直接在这个 `dom`  加 `style`
- 其他情况跟原来一样，采用添加标签的方式

```html
<p>我<b style="color:#46acc8;">加粗</b>了<b style="color:#8baa4a;">嗯哼</b></p>
<p></p>

<p>
  我<b style="color:#46acc8;">加粗</b>了<b><font color="#8baa4a">嗯</font>哼</b>
</p>
<p></p>
```

再加上我们**数据驱动**视图的思想，就可以转化成这样一段 数据模型，称之为 `model`

```javascript
[
  {
    type:'p',
    children:[
      '我',
      {type:'b',attrs:{ style:{color:'#46acc8'},children:['加粗']}},
      '了'，
      {type:'b',attrs:{ style:{color:'#8baa4a'},children:['嗯哼']}},
    ]
  }
]
```

**自建数据模型的富文本编辑器有 Quill、Draft、Slate、ProseMirror 等，就目前我看到的一些网友的评论和了解，Draft 的限制可能更大一些。这其中，Quill 和 ProseMirror 的设计对协同支持较好。**

> **Draft.js 的硬伤在于性能和体验，根源在于它底层的设计和富文本的描述 schema。**

> **ProseMirror 是有 schema 的，所以定义好了 schema 以后 ProseMirror 可以替你实现自动化 parser，但是对于结构不好的数据，parse 过程中可能会丢弃大段的内容，这样以来如果你希望你的编辑器能够支持从别的编辑器里粘贴东西进来还能尽可能保持格式，就会有点头疼。**

**形成数据模型后的好处，对于渲染页面完全由代码控制，细节不同的各版本浏览器（execCommand）处理。**

关于 `slate.js` 的介绍可以参考

> [https://www.zhihu.com/column/c_1312084184400162816](https://www.zhihu.com/column/c_1312084184400162816)

### 疑惑

也许会提问，我一个副本的的内容这么多，都变成了 `数据模型`  那这样如果要找到某个节点或者合并一些节点。那岂不是要遍历整个 `数据模型` 直到找到这个节点  ？？？。 这不就费时又费力，性能也不好。<br />这个问题， `slate.js`  引入 `节点寻址`  的方案加以解决。

参考地址

> [https://zhuanlan.zhihu.com/p/336878823](https://zhuanlan.zhihu.com/p/336878823)

# 总结

`**Slate、ProseMirror**`  目前这两个开源方案是可以解决 99%需求，但是 `Slate`  已经完全拥抱 `react` ，而 `ProseMirror`  是没有框架要求的。我又是没有 `react`  经验正好可以趁这个机会学习学习。(狗头保命)

# 参考文献

1. [https://github.com/guardian/scribe/blob/master/BROWSERINCONSISTENCIES.md](https://github.com/guardian/scribe/blob/master/BROWSERINCONSISTENCIES.md)
2. [https://www.zhihu.com/question/404836496/answer/1319881686](https://www.zhihu.com/question/404836496/answer/1319881686)
3. [https://zhuanlan.zhihu.com/p/356707603](https://zhuanlan.zhihu.com/p/356707603)
4. [https://www.zhihu.com/column/c_1312084184400162816](https://www.zhihu.com/column/c_1312084184400162816)
