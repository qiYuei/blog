## useState

```js
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    // 每次点击都让 count 循环增加
    for (let i = 0; i < 6; i++) {
      setCount(count + 1);
    }
  }

  return (
    <>
      <span>{count}</span>
      <button onClick={handleClick}>{count}</button>
    </>
  );
}
```

### 现象分析

组件只会渲染 `1` 次, 并且此时 `count = 1`;

导致这个原因是因为 函数组件在执行过程后会形成一个闭包,这个闭包中的 count 指向最初执行时的初始值 `0`。
所以相当于执行了 6 次 `setCount(0+1)` 在 `useState` 内部会有一个比较 `Object.is()` 来判断是否需要重新渲染页面。

想实现的是 `count` 变成 6，只渲染一次,可将代码改成下面这样

```js
function handleClick() {
  // 每次点击都让 count 循环增加
  for (let i = 0; i < 6; i++) {
    setCount((pre) => pre + 1);
  }
}
```

或者说我们想更复杂一点 `count` 变成 6，但是渲染也要`6`次

```js
function handleClick() {
  // 每次点击都让 count 循环增加
  for (let i = 0; i < 6; i++) {
    flushSync(() => {
      setCount((pre) => pre + 1);
    });
  }
}
```

### 同步更新还是异步

`setState是同步还是异步` 这是一道很常见的面试题。

一般会这么回答

在 `react18` 之前，`setState`只有在生命周期`componentDidUpdate(除外)`和事件处理函数中才是 **异步更新**。其他都是**同步行为**

如果在`setTimeout`中多次调用`setState`页面将会更新多次

在 `react18` 之后，`setState` 都是 **异步更新**。在`setTimeout`中多次调用`setState`页面只会更新一次。
