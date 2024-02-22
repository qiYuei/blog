## 闭包

简单来说当一个函数内可以访问另一个函数作用域中的变量时，就产生了闭包。

### 闭包一定会产生内存泄漏吗

不一定，如果闭包中的变量被释放了，那么就不会产生内存泄漏。

下面这种写法网络上很多文章说是内存泄漏，其实**并不是**。这是因为在 `IE5/IE6` 中的垃圾回收机制的缺陷导致。在**谷歌浏览器** 中已经被解决

```js
const button = document.getElementById("button");

button.onclick = function () {
  alert(button.id);
};

// 在以前需要手动吧button的引用去掉
button = null;
```

## 垃圾回收

在现代的 `V8引擎` 中主要将堆内存分成 `新生代` 和 `老生代` 两种。对于这两种垃圾回收器，其回收策略是不一样的。

- `新生代`: `V8` 会将这一部分内存分成两个部分 一个用来 `存放`,一个是 `空闲` 。在我们赋值新对象的时候都会将内存分配在存放区域，在垃圾回收的时候使用 `Scavenge` 算法检查一遍 `存放` 区域内的对象，如果对象`被引用`则将其`有序复制`到 `空闲` 区域。没有被引用则是直接回收掉，当所有被引用的对象都复制到`空闲区域`后。两个区域的只能发生转换，`存放` 区域转换为 `空闲` 区域，`空闲` 区域转换为 `存放` 区域。
- `老生代` : 在一个对象在进行多次`新生代垃圾回收`后仍然没有被回收掉，那就晋升为 `老生代`。 老生代的垃圾回收主要是靠 `标记-清除` 和 `整理`。也是会遍历所有堆内存对象并打上**标记**，一些在代码环境 `使用的变量以及强引用变量则会取消标记` 剩下就是要删除的内存，为了防止内存进行删除后出现`碎片化`，还会进行一次`整理`

## this

需要注意以下几点

1. 箭头函数中的`this` 指向的是定义时的`this`

   ```js
   const obj = {
     name: "李明",
     say: () => {
       console.log(this.name);
     },
   };
   var name = "张三";
   obj.say(); // 输出 张三
   let fn = obj.say;
   fn(); // 输出 张三

   // 通过babel编译后更好理解
   var that = this;
   const obj = {
     name: "李明",
     say: function () {
       console.log(that.name);
     },
   };
   ```

2. 普通函数中的`this` 指向的是调用时的`this`
3. 函数通过 `bind` 多次调用后, `this` 仍然指向第一次

   ```js
   function fn() {
     console.log(this.name);
   }
   const obj = { name: "李明" };
   const obj1 = { name: "李明1" };
   const obj2 = { name: "李明2" };

   const fn1 = fn.bind(obj).bind(obj1).bind(obj2);
   fn1(); // 输出：李明
   ```

### 箭头函数注意事项

1. 箭头函数本身没有 `argument/prototype/this`,所以不能作为构造函数也就不能 `new`
2. 箭头函数的 `this` 在定义是就确定了，不能通过 `call/apply/bind` 改变
3. 箭头函数不能使用 `yield`

### bind 的实现

```js
Function.prototype.mybind = function (context, ...arg) {
  const that = this;
  function fn(...args) {
    return this instanceof fn
      ? that.apply(this, [...arg, ...args])
      : that.apply(context, [...arg, ...args]);
  }
  fn.prototype = that.prototype;
  return fn;
};
```

## 原型链

每个对象都有一个 `__proto__` 的属性指向它的构造函数的原型对象`(prototype)`,而该原型对象是也有自己的`__proto__` 直到原型对象为 `null`。这样就就行了一条链条

```js
var obj = {};
obj.__proto__ === Object.prototype; // true
obj.__proto__ === Object.__proto__; // false
Object.prototype.__proto__ === null; // true
Object.__proto__ === Function.prototype; // true
```

### new 实现

```js
function myNew(fn, ...args) {
  const obj = {};
  obj.__proto__ = fn.prototype;
  const result = fn.apply(obj, args);
  return typeof result === "object" ? result : obj;
}
```

## 继承

- `call继承`: 原型链的属性无法继承
- `原型链继承`: 采用 `child.prototype = new Father()` 的方式，缺陷是公用原型链对象
- `组合式继承`: 原型链属性和构造函数属性都能继承,缺陷是构造函数被调用了两次
- `extends`: babel 编译后就是**寄生式继承**
- `寄生式继承`

  ```js
  function Father() {}
  function Son() {
    Father.call(this);
  }
  function fn() {}
  fn.prototype = Object.create(Father.prototype);
  Son.prototype = new fn();
  Son.prototype.constructor = Son;
  ```

## 精度

主要是因为 `JS` 的浮点数最大精度是`64位`，多余的将会被**截取**。就造成了 `0.1+0.2!==0.3` 的原因

可以采用以下方式解决

- 换成字符串计算
- 使用 `math.js` 或者是 `bigint` 等库进行计算

## 如何判断准确数据类型

使用 `Object.prototype.toString.call` 方法来精准判断

```js
function resolveType(target) {
  return Object.prototype.toString.call(target).slice(8, -1);
}

resolveType(1); // 'Number'
resolveType("123"); // 'String'
resolveType(new Promise()); // 'Promise'
resolveType(Symbol(1)); // 'Symbol'
resolveType(async function () {}); // 'AsyncFunction'
```

## 隐式转换

## setTimeout 和 setInterval 的缺陷

因为两者都是宏任务，所以会存在**事件堆积**的问题，导致定时器执行延迟。执行的时间不一定是用户所设置的时间。

- `setTimeout` 的执行时间不一定是延迟时间，需要看主线程的任务是否执行完毕
- `setInterval` 的执行时间有可能会被跳过。当主线程的任务执行时间过长，会导致跳过某次执行
- 页签隐藏/被切换到其他页面，定时器也会暂停

对于有`倒计时`需求的功能，

:::warning 注意开始时间
Date.now () 返回的是设备的时间。一定要**请求服务器时间**!!!
:::

1. 使用 `requestAnimationFrame` 替代 `setInterval`

::: details

```js
function delayLoop(fn, delay) {
  let startTime = Date.now();
  let timer = null;
  function loop() {
    const now = Date.now();
    if (now - startTime >= delay) {
      fn();
      startTime = Date.now();
    }
    timer = requestAnimationFrame(loop);
  }
  loop();
}
let nowTime = new Date().getTime();
let prevTime = 0;
console.log("开始执行");
delayLoop(() => {
  prevTime = nowTime;
  nowTime = new Date().getTime();
  console.log("过去了 1s,具体时差：", nowTime - prevTime);
}, 3000);
```

:::

2. 是使用 通过不断修正`setTimeout`的时间来`setInterval`

::: details

```js
function delayLoop(fn, delay) {
  let starTime = Date.now();

  let realDelay = delay;

  function loop() {
    realDelay = delay - (Date.now() - starTime);
    console.log(`误差：${realDelay} ms，下一次执行：${realDelay} ms 后`);
    if (realDelay < 0) {
      fn();
      starTime = Date.now();
      loop();
      return;
    }
    const timer = setTimeout(() => {
      fn();
      starTime = Date.now();
      loop();
    }, realDelay);
  }
  loop();
}

let flag = false;

let nowTime = new Date().getTime();
let prevTime = 0;
console.log("开始执行");
delayLoop(() => {
  prevTime = nowTime;
  nowTime = new Date().getTime();
  console.log("过去了1s,具体时差：", nowTime - prevTime);
}, 3000);
```

:::

3. 使用`worker`线程进行计算，通过`postMessage` 和`onmessage`进行通信
