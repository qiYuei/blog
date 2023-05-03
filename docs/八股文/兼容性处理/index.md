# 手机端

## 有效时间时间戳

在苹果系统上解析`YYYY-MM-DD HH:mm:ss`这种日期格式会报错`Invalid Date`，但在安卓系统上解析这种日期格式完全无问题。

```
new Date("2019-03-31 21:30:00"); // Invalid Date
复制代码
```

查看`Safari`相关开发手册发现可用`YYYY/MM/DD HH:mm:ss`这种日期格式，简单概括就是年月日必须使用`/`衔接而不能使用`-`衔接。当然安卓系统也支持该格式，然而接口返回字段的日期格式通常是`YYYY-MM-`<br />`DD HH:mm:ss`，那么需替换其中的`-`为`/`。

```
const date = "2019-03-31 21:30:00";
new Date(date.replace(/\-/g, "/"));
```

# PC

## el-input type=number 输入中文，焦点上移

解决办法

```javascript
<style scoped>
::v-deep .el-input__inner {
    line-height: 1px !important;
}
</style>
```

## el-input type=number 去除聚焦时的上下箭头

解决办法

```javascript
<el-input class="clear-number-input" type="number"></el-input>

<style scoped>
.clear-number-input ::v-deep input[type="number"]::-webkit-outer-spin-button,
.clear-number-input ::v-deep input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none !important;
}
</style>
```

## XLSX 导入时间格式变成 5 位数字

解决办法

```javascript
XLSX.read(data, {
  type: "binary",
  cellDates: true, // 加入这个解析时间格式
});
```
