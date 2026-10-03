# Vidora uni-app

面向 Android/iOS/H5 的 uni-app 移动端示例，使用 Vue 3，通过网关 REST API 与后端通信。

## 开发

```powershell
npm install
```

使用 HBuilderX 或 uni-app CLI 运行目标平台。网关地址和 Token 处理集中在 `src/utils/request.ts`，登录和视频详情页面位于 `src/pages`。

## 当前页面

- 登录
- 首页视频列表
- 视频详情与播放

后续可按同一接口契约继续补充搜索、评论、个人中心和上传页面。

