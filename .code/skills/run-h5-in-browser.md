# Skill: 在浏览器里跑 H5 验证一次改动

目标：本地起 H5，真点一遍改动是否生效，拿到「运行时已验证」的证据。

## 最重要的一条：H5 是 hash 路由

uni-app H5 默认用 **hash 路由**。要打开某个页面，必须访问带 `#` 的形式：

```
http://localhost:<port>/#/pages/<模块>/<name>
带参数：http://localhost:<port>/#/pages/video/detail?id=123
```

**用路径式 URL（`http://localhost:5174/pages/xxx/xxx`，没有 `#`）会静默落到首页**——你以为在验详情页，其实停在 home，验证结论全是错的。看到地址栏没有 `#` 就说明进错门了。

## 端口是多少

项目没有在 `vite.config.ts` 里写死端口。Vite 默认从 **5173** 起；如果 5173 被占用，会自动顺延到 5174、5175……所以别照抄某个固定数字。**以终端实际打印的 Local 地址为准。**

## 步骤

1. **确认网关在跑**：H5 的请求经 vite devServer 把 `/api` 代理到网关（`vite.config.ts` 的 server.proxy，目标取 `.env` 的 `VITE_GATEWAY`，默认 `http://127.0.0.1:8080`）。网关没起来时接口全红是正常的，不代表前端改错。

2. **起 dev**：
   ```bash
   npm run dev:h5
   ```
   （脚本是 `uni`。）看终端输出的 Local 地址和端口。

3. **用 hash URL 打开目标页**：`http://localhost:<实际端口>/#/pages/<模块>/<name>`（见上）。从首页点进去也能到达，但直接敲 hash URL 最快定位到一个深页。

4. **开 DevTools Network**：确认 `/api/...` 请求发出、状态码与 body 里的 `code`。注意本项目 4xx/5xx 也会被 `uni.request` 当 success 处理（`utils/request.ts`），所以要看 statusCode 而不只看有没有进 catch。

5. **交互验证**：按需求的验收标准点操作（翻页、点赞、搜索、跳转…）。分页/滚动加载类改动，重点验「续拉第二页」「到底不再拉」「空列表不报错」。

## 停止 / 兜底

- Ctrl+C 停 dev。
- 只想验证能编译过、不需要跑起来时，用 `npm run build:h5`（产物 `dist/build/h5`），它不起服务但会真正编译一遍所有页面。

## 常见坑

- 用了无 `#` 的路径 URL → 静默落首页，误判为「页面没问题」。
- 照抄 5174/5173 等固定端口而端口已被占顺延 → 打开的是别的实例或打不开；永远看终端实际地址。
- 后端网关没起就断定前端坏了 → 先分清是网络层失败（request 的 fail 分支 toast「网络连接失败」）还是业务码非 200。
- 小程序专有 API（如 `uni.uploadFile` 真机行为、微信登录）在 H5 下表现不同 → H5 验过的不等于 mp-weixin 通过，涉及平台差异要另跑 `npm run build:mp-weixin` 并用微信开发者工具验。
