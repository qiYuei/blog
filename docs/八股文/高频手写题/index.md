## new

### new 关键字做了什么事

1. 创建一个新的对象
2. 将构造函数的原型链赋值到新的对象中
3. 构造函数中是否返回引用类型的值不是则返回创建的对象

### 实现

```javascript
function myNew(ctx, ...arg) {
  // 1.创建新对象
  let obj = {};
  // 2. 将构造函数的原型链赋值到新的对象中
  obj.__proto__ = ctx.prototype;
  // 3构造函数中是否返回引用类型的值不是则返回创建的对象
  let result = ctx.apply(obj, arg);

  return typeof result === "object" ? result : obj;
}
```

### 测试一下

```javascript
function foo(name) {
  this.name = name;
}
foo.prototype.age = function () {
  console.log("不要问我年龄,问就是18");
};
const newFoo = myNew(foo, "小明");
newFoo.name; // 小明
newFoo.age(); // 不要问我年龄,问就是18
```
