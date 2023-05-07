# 什么是 cookie

由于 `HTTP` 是无状态协议,但是比如一个网站我不可能每打开一个页面都登陆一次吧。总要有一个东西来记录用户的状态~。这时候 `cookie`就诞生了。

```javascript
// 完整格式如下
Set-Cookie: "name=value;domain=.domain.com;path=/;expires=Sat, 11 Jun 2016 11:29:42 GMT;HttpOnly;secure"
```

其中 `name=value`是一个必填项

## domain

这里可以设置 cookie 对于哪个域是有效的。值得注意的是这个值可以包含子域。比如 `domain=.taobao.com`那么他的子域`A.taobao.com` 又或者是 `B.taobao.com` 都可以访问。但是如果设置了`A.taobao.com`那么只有`A.taobao.com`这个域才能获取到这个 cookie。

## path

类似 `domain` 但是 `path` 对应得是路径，可以设置`/login`那这个路径下包括`/login/xxx`都可以访问到这个 `cookie`。

## expires

过期时间，和 `max-age` 一样都是临时会话的时间。 `max-age` 是秒数。如果两者同一时间出现则`max-age`的优先级更高。cookie 的生命周期默认为 `session`，即浏览器关闭后删除。如果设置了 `expires`，则由 `expires` 控制，如果浏览器关闭还没到过期时间，则会保存在硬盘中

## HttpOnly

`JS脚本`是否可以获取（默认可以获取，为`false`）。如果设置为`true`则可以有效防止`XSS攻击`。该属性只能在服务的设置

## Secure

S 脚本是否可以获取（默认可以获取，为 false)。若为 true，那么 Cookie 只能在 `HTTPS`连接中传输；若为 false，HTTP、HTTPS 连接都行。

## Samesite

- None 同站请求、跨站请求发送`cookie`，但是在 chrome80+以后，设置为`None`需要同时设置`Secure`，也就意味着必须要`https`连接。
- Strict 仅发送同站点的请求的 cookie
- Lax Chrome80 后默认为这个值。仅`get请求跨站`。大多数情况也是不发送第三方 cookie。 包括三种情况：`链接，预加载请求，get 表单`

设置为 `Lax,Strict`可以杜绝大部分`csrf攻击`。

{% asset_img 1.png  %}

### 跨域跨站

其中`同站(same-site)`/`跨站(cross-site)`」和`第一方(first-party)`/`第三方(third-party)`是等价的。

举几个例子，`www.taobao.com` 和 `www.baidu.com` 是跨站，`www.a.taobao.com` 和 `www.b.taobao.com` 是同站，`a.github.io` 和 `b.github.io` 是跨站(注意是跨站)。

### cookie 与 session 的区别

`session` 是服务端的一种机制，使用类似散列表的数据结构来保存用于用户信息，如登录状态。<br />`cookie` 则可以用于服务端保存登录状态，比如为客户端设置 `cookie` 来保存 `session` 对应的 `sessionID`，下次请求时客户端自动携带 `cookie`，服务的从中取出 `sessionID`，在从 `session` 表中获取用户登录状态及用户信息。

### cookie 和 token 的关系

`token` 是另一种流行的处理 `http` 无状态的方式，一般设置在请求头中。当用户登录成功时返回 `token` 给客户端，客户端再次请求时携带 `token`，服务端获取 `token` 后，再从 `session` 中获取用户信息及登录状态。<br />与 `cookie` 相比，因为 `token` 在代码中设置，不会在访问第三方网站时携带 `cookie`，可以有效避免 `csrf` 攻击。

### cookie 缺点

- `cookie` 的大小一般被浏览器限制为 `4kb`
- 请求自动携带 `cookie` 其实会造成无效的带宽浪费
- 安全问题（csrf 与 xss）

# XSS 攻击

`xss攻击`就是跨站脚本攻击。一般可以分为三类，我认为实际上可以分为两类`存储型和非存储型`

### 反射型

反射型一般构造在`url`中。如果服务端中没有做过处理，直接将内容返回给客户端则会触发在`url`中隐藏的`<script></script>`代码。形如

```javascript
www.baidu.com?<srcipt>alert('xss')</script>
```

但是这样主要还是需要构造`url`然后去触发。

### 存储型

存储型就是将`xss攻击`保存到数据库中。比如我一个评论中注入恶意代码

```javascript
<img onerror="alert('xss')" src="">
```

这样存储在数据库的攻击危害是最大的。因为每一个见到这个评论的人都会受到攻击。

### DOM 型

`DOM型`实际上是最难的，因为他需要构造一个带有`XSS攻击`的 DOM。然后诱导用户去操作才会触发。

### XSS 注入方法

在 `HTML` 中内嵌的文本中，恶意内容以 `script` 标签形成注入。<br />在内联的 `JavaScript`中，拼接的数据突破了原本的限制（字符串，变量，方法名等）。<br />在标签属性中，恶意内容包含引号，从而突破属性值的限制，注入其他属性或者标签。<br />在标签的 `href、src` 等属性中，包含 `javascript:` 等可执行代码。<br />在 `onload、onerror、onclick` 等事件中，注入不受控制代码。<br />在 `style` 属性和标签中，包含类似 `background-image:url("javascript:...")`; 的代码（新版本浏览器已经可以防范）。<br />在 `style` 属性和标签中，包含类似 `expression(...)`的 CSS 表达式代码（新版本浏览器已经可以防范）。

### 解决办法

- 对用户提交的可能存在 xss 攻击的地方进行转义，服务端中也需要。
- 服务端在`http`中设置`set-cookie:Httponly`
- 用`innerText`和`setAttribute()`代替`innerHtml`

# CSRF 攻击

`CSRF`攻击就是跨站请求伪造，简单点就是我冒用你的身份去做你不知道的事情。<br />比如之前的钓鱼网址就是。比如小明登陆了 A 网站。这时候 A 网站就会有小明的`cookie`。小明再被我诱导点击我写好`document.cookie`的空页面。一进入这个页面就会拿到小明的`cookie`并且去请求 A 网站的接口做一些坏事。因为我用的是小明的`cookie`这样就是我冒用小明对他造成了一系列损失。

### 解决办法

- 在服务端中设置 SameSite 为`LUX`,这样因为我的网站是相对于 A 来说是第三方网站。即便是`<a>`跳转的。请求时也不会携带 cookie。
- 判断请求头中的`Origin Header Referer Header`检测是否同源。（协议，域名，端口完全相同）<br />这两个 Header 在浏览器发起请求时，大多数情况会自动带上，并且不能由前端自定义内容。 服务器可以通过解析这两个 Header 中的域名，确定请求的来源域。<br />`Origin Header`请求的 Header 中会携带 Origin 字段。字段内包含请求的域名（不包含 path 及 query）。<br />`Referer Header`在 HTTP 头中有一个字段叫 Referer，记录了该 HTTP 请求的来源地址。<br />对于 Ajax 请求，图片和 script 等资源请求，Referer 为发起请求的页面地址。对于页面跳转，Referer 为打开页面历史记录的前一个页面地址。因此我们使用 Referer 中链接的 Origin 部分可以得知请求的来源域名。
- 采用`token`
