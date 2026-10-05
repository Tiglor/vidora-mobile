# vidora-mobile — AI 开发入口

**开始任何开发前，必须先完整阅读 `.code/` 下的四份规范（README / agent-rules / requirements / coding-standards），再按任务类型翻 `.code/skills/` 里对应的手册。** 本仓库此前没有任何 AI 指令文件，规范自带全部上下文，每条都指得到具体源码，不要凭记忆或常识替代现场查证。

## 项目一句话简介

vidora 视频播放平台的手机端：uni-app + Vue3 + TypeScript，编译到 H5 / 微信小程序 / App；是 vidora 四端之一（另有 `vidora-web` 消费端、`vidora-admin` 管理端、`vidora-cloud` Spring Cloud 后端）。只做客户端呈现与交互，业务口径以后端 controller 为准。

## 验证命令

```bash
npx vue-tsc --noEmit        # 类型检查（两端通用兜底）
npm run build:h5            # H5 构建，产物 dist/build/h5
npm run build:mp-weixin     # 微信小程序构建，产物 dist/build/mp-weixin
npm run dev:h5              # 本地起 H5（改完想实测时；注意 hash 路由，见 skills/run-h5-in-browser.md）
```

依赖版本（尤其 `@dcloudio/*` 的 alpha 串）钉死，未经用户同意不得安装/升级/改 `package.json`。更多禁止动作与「需先征求同意的改动」见 `.code/agent-rules.md`。

## .code 导览

| 路径 | 讲什么 |
| --- | --- |
| `.code/README.md` | 索引：四份规范各讲什么、阅读顺序、任务→skill 对照表 |
| `.code/agent-rules.md` | AI 行为规范：动手前必读、不凭记忆断言、验证门禁具体命令、禁止动作、交付如何区分已验证/未验证 |
| `.code/coding-standards.md` | 编码规范：目录职责、命名、页面写法、rpx/样式、生命周期、API 层与类型层、注释、错误处理链 |
| `.code/requirements.md` | 需求规范：本端定位与边界、四段式需求写法、契约以 controller 为准、什么算完成 |
| `.code/skills/add-a-page.md` | 新增 uni-app 页面（pages.json 登记是关键一步，漏了白干） |
| `.code/skills/add-or-adjust-api-call.md` | 新增/调整 API 调用并同步手写类型 |
| `.code/skills/run-h5-in-browser.md` | 浏览器跑 H5 验证一次改动（H5 是 hash 路由） |
| `.code/skills/paginated-list-with-usepagination.md` | 分页列表页接 usePagination |
