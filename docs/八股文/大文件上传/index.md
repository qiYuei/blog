---

大文件上传实际上就是靠 `js` 中的 `Blob` 中的 `slice()` 方法把一个大文件切割成小块,再由服务端将这种小块用 `流`合并成一个新的文件。期间考虑文件改变的话就是让整个文件进行一次 `hash` 处理。加上 `web-worker`的加持让 `js` 主线程的压力降到最小。

### 项目地址

[实现大文件上传 Demo](https://github.com/qiYuei/upload-demo)

#### 技术栈

> vue+elementUI+spark-md5(处理文件 hash)+koa2

#### Start

- 前端> cd /file-upload

> npm i

> npm run serve

- 服务端> cd /server

> npm i

> nodemon ./app.js

#### 功能包括

- worker 进程对文件 md5 处理
- 限制并发请求
- 断点续传
- 秒传
- 错误重试

#### API

```javascript
Blob.slice(); // 文件分割  用法跟分割字符串一样

// 开启一个worker线程
/*
 *  Web Worker 的作用，就是为 JavaScript 创造多线程环境，允许主线程创建 Worker 线程，将一些任务分配给后者运行。
 *  在主线程运行的同时，Worker 线程在后台运行，两者互不干扰。等到 Worker 线程完成计算任务，再把结果返回给主线程。
 */
const worker = new Worker();

// 主线程向worker线程传递数据
worker.onpostMessage();

// 主线程监听woker线程回传数据
worker.onmessage(cb); // 接收一个回调

// 服务端

fse.existsSync(path); //同步读取某个路径的文件或者文件夹是否存在 返回true或false

fse.move(); // 移动路径所在的文件

fse.createWriteStream(); // 创建一个可写流

fse.createReadStream(); // 创建一个可读流

ReadStream.pipe(); //  创建一个管道 将可读流的数据写入 可写流
```

#### 参考链接

[字节跳动面试官：请你实现一个大文件上传和断点续传](https://juejin.im/post/6844904046436843527#heading-23)
