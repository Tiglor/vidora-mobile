# Vidora uni-app

消费端移动形态：uni-app + Vue 3 + TypeScript，**一份代码编三个目标**（H5 / 微信小程序 / App），通过网关 REST API 与后端通信。与 `vidora-web` 是同一批消费功能的两种形态，业务口径以后端 controller 为准。

## 开发与构建

```powershell
npm install
npm run typecheck          # = vue-tsc --noEmit，只保证页面与本端手写的 src/types/index.ts 自洽
npm run dev:h5             # 本地起 H5（hash 路由）
npm run build:h5           # 产物 dist/build/h5
npm run build:mp-weixin    # 产物 dist/build/mp-weixin
npm run build:app          # 产物 dist/build/app，未实测
```

网关地址与 Token 处理集中在 `src/utils/request.ts`，接口在 `src/api/`。

契约类型是**手写的**：`src/types/index.ts` 里每个 interface 都是对着后端抄下来的一份副本，没有 `@generated` 标记，也不会被任何脚本覆盖。接口文档唯一的出口是每个服务自己端口的 `/v3/api-docs`（auth 8101 / video 8102 / content 8103 / interact 8104 / message 8105 / search 8106 / recommend 8107 / system 8108），内容由 controller 与 DTO／VO／实体上的 Javadoc 经 therapi 在编译期烘出来；导进 Apifox 由人工执行，仓库不做聚合、也不生成任何前端代码。

因此 `npm run typecheck` 绿只说明「页面与这份手写副本自洽」：后端把字段改名或删掉，本端不会有任何编译错误，只会悄悄变成过期副本。动接口或字段前先现场读后端 `*Controller.java` 与其出入参类，以及 `../vidora-cloud/SQL/vidora_cloud.sql` 的列注释（档位与可空性的判据）。曾经落地的「离线 OpenAPI 快照 + openapi-typescript 生成三端类型」已于 2026-10-06 整条撤掉——快照要靠人手重跑脚本，忘跑时「类型检查通过」证明的是旧契约，比根本没有门禁更容易误导。

## 当前页面

- 登录（login）
- 首页视频列表（home）与发现页（discover）
- 视频详情与播放（video）
- 消息中心：站内通知与私信（message）
- 个人中心（profile）与投稿上传（upload）

## 构建产物不进 git

`dist/`（CLI 产物）与 `unpackage/`（HBuilderX 产物）都在 `.gitignore` 里。`dist/build` 下 99 个文件曾被误提交进 f9a12c5，现已从索引摘除；**提交前用 `git status --short` 确认没有 `dist/` 路径**。

## 验收状态

H5 与 mp-weixin 构建通过；App 目标只有脚本、未实测；微信小程序 appid 仍是 `touristappid` 占位，真机或开发者工具验收前需换成正式 appid。

