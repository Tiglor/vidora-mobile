# 需求规范（requirements）

## 1. 这个端在产品里的定位与边界

vidora 是一个视频播放类应用，由四个工程组成：

| 工程 | 角色 | 技术栈 |
| --- | --- | --- |
| `vidora-mobile`（本仓库） | 消费端手机 App / H5 / 微信小程序 | uni-app + Vue3 + TS，编译到 H5 / mp-weixin / app |
| `vidora-web` | 消费端 Web 站点 | 面向浏览器 |
| `vidora-admin` | 管理后台 | 运营/审核/配置 |
| `vidora-cloud` | 后端 Spring Cloud 微服务 | gateway + auth/system/video/content/interact/search/recommend/message 等服务 |

本端的职责是「看视频、搜视频、互动（点赞/收藏/分享/评论/弹幕）、收发消息、上传」。它**只做客户端呈现与交互**，不做业务规则裁决。

边界（越界前停下问用户）：

- 计数怎么算、权限怎么判、字段以什么为准——由 `vidora-cloud` 的 controller 决定，前端不自己发明口径。例如点赞/收藏后不要在前端 `+1/-1`，服务端 `setActive` 会回最新计数直接覆盖（见 `api/interact.ts` 注释与 `pages/video/detail.vue`）。
- 「资源不存在」返回 `code:200 + data:null` 这类语义是后端定的，前端要按可空处理（`getOwner`、`getTranscodeTask`），不是前端能改后端来迁就的。
- 需要新接口、改字段、动鉴权口径时，这是跨端变更，先谈后端再落前端；不要在本仓库单方面假设一个后端没有的出口。
- web/admin 各自的页面不归本端管，别顺手改过去。

## 2. 四段式需求写法

接到任务，先用这四段把它固定下来，写不清楚就先问，不要边猜边写：

1. **背景**：为什么要做，用户/业务在解决什么问题。一句话讲清触发点。
2. **范围**：这次做什么、明确不做什么。落到具体文件/页面/接口，例如「只动 `pages/discover` 和 `api/search.ts`，不动登录链路」。
3. **约束**：技术/契约限制。常包括——依赖版本锁死不能升级；契约以某个后端 controller 为准；需同时兼容 H5 与小程序；样式沿用既有主题色；错误走 request 层统一 toast。
4. **验收标准**：怎样算通过，且必须可验证。写成能跑命令或能在浏览器点出来的形式，例如「`npx vue-tsc --noEmit` 无错、`npm run build:h5` 成功、H5 里从首页点进详情能看到标题与播放地址、翻页能续上」。

## 3. 契约以什么为准

- **接口契约以后端 controller 为准**，路径都在 `vidora-cloud` 各服务的 `*Controller.java`。前端 `src/api/*.ts` 里的 URL、方法、参数名、返回结构必须和 controller 对得上。
- **类型契约以 `src/types/index.ts` 为准**，但它是手写的、会和后端 DTO 漂移。改动前先开对应 controller / DTO 核对字段名与是否可空，再看这里现有条目的来源注释（很多已写明「后端叫 X 不叫 Y」「此字段来自另一张表」「tinyint 0/1 非布尔」）。
- 分页统一形状是 `PageResult<T>`（`records/total/current/pages`），来自后端 MyBatis-Plus 分页；列表赋值记得兜底空值（历史踩过 records 为 null 直接 spread 报错的坑）。
- 请求外壳 `{ code, message, data }` 与状态码链见 `coding-standards.md` 第 9 节。

## 4. 什么算完成

一个需求只有在满足以下才算 done：

- 代码符合 `coding-standards.md`，新增页面已在 `src/pages.json` 登记。
- 至少过了 `npx vue-tsc --noEmit`；触及跨端公共面（pages.json/manifest/全局样式/request 层）则 `build:h5` 与 `build:mp-weixin` 都过。
- 运行时行为有证据：能在 H5 里实测的，按 `skills/run-h5-in-browser.md` 真点一遍（记住是 hash 路由）；只能真机/小程序开发者工具验的，如实说明未验。
- 契约相关处已对过后端 controller，类型同步且标注了可空性。
- 交付汇报区分「已验证 / 未验证」（见 `agent-rules.md` 第 5 节），遗留问题如实列出。

没跑过的东西不能声称跑过；没验的运行时行为标「未验证」而不是默认当成对的。
