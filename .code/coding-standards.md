# 编码规范（coding-standards）

以本仓库既有代码为准提炼，不是通用最佳实践。每条尽量给到真实文件出处。

## 1. 目录职责

```
src/
  pages/        页面，一个页面一个目录或按功能聚合；路径与 pages.json 的 path 一致
  components/   可复用组件（VideoCard.vue / CommentItem.vue / DanmakuOverlay.vue）
  api/          按后端服务域拆分的接口封装：auth / video / interact / content / search / recommend / message
  utils/        request.ts —— 全站请求地基
  stores/       pinia store：user / message / dict（组合式写法 defineStore('id', () => {...})）
  composables/  可复用逻辑：usePagination / useDebounce / useAuth
  config/       env.ts（API 源按端切换）、client.ts（CLIENT_ID）
  types/        index.ts —— 契约类型，本端手写的副本（对着后端 controller / VO / DDL 抄下来）
                没有 generated/ 目录，也没有任何脚本会覆盖这个文件
  App.vue       应用级生命周期 + 全局样式
  main.ts       createSSRApp + pinia
```

新增东西先想清楚落在哪个目录，别在页面里裸调 `uni.request`——一律走 `api/*.ts` → `utils/request.ts`。

## 2. 命名

- 页面/组件文件用功能名小写：`detail.vue`、`discover.vue`、`VideoCard.vue`（组件 PascalCase）。
- API 函数动词开头、语义贴后端：`listVideos` / `getVideo` / `getPlayUrl` / `createComment` / `setActive`。批量用 `ByIds` 后缀（`listVideosByIds`）。
- 字段名不是本端定的：`src/types/index.ts` 里的每个字段都是对着后端抄的手写副本，改名或拼错**不会**有编译错误，只会在运行时读到 `undefined`。这份文件导出的 interface（`VideoInfo`、`LoginVO`、`ActionCounts`、`CommentView`、`TranscodeTask`，外加壳类型 `PageResult<T>`，见第 7 节）是本端唯一词汇表——同一个后端形状不要起第二个名字，也不要为了页面顺手好看去重命名字段。
- store 工厂统一 `use` 前缀：`useUserStore`、`useMessageStore`、`useDictStore`。
- composable 同 `use` 前缀，参数化返回响应式状态：`usePagination`、`useDebounce`。

## 3. 页面写法

- 一律 `<script setup lang="ts">`。全仓现有页面都是这种，没有 Options API。参考 `pages/video/detail.vue`、`pages/profile/profile.vue`。
- import 顺序：vue 运行时 API → `@dcloudio/uni-app` 生命周期 → 组件 → composables/api/store → 类型（`import type`）。
- 状态用 `ref` / `computed`；跨页共享才进 store。
- 模板里的解包依赖 Ref 类型，不要把 ref 随手 cast 成普通对象（`usePagination.ts` 顶部注释解释过这个坑）。

## 4. rpx 与样式

- 尺寸优先用 `rpx`（uni-app 自适应单位），字号常见 `22–36rpx`，间距 `8/12/16/20/24/32rpx`。整屏宽用 `100vw`、满高用 `100vh`。见 `detail.vue` 的 `.player-wrapper { height: 420rpx }`。
- 页面 `<style scoped>`；只有真正的全局基线（字体、`page` 背景、`.text-ellipsis`、`.safe-bottom`）才放 `App.vue` 的无 scoped `<style>`。
- 主题色沿用既有值：品牌红 `#ff2442`、强调蓝 `#4a90d9`、文字 `#333/#666/#999`、背景 `#f5f5f5`。不要引入新的一套配色。
- 安全区底部留白用 `env(safe-area-inset-bottom)`（`App.vue` 的 `.safe-bottom`）。

## 5. 生命周期：onLoad/onShow vs Vue 生命周期

规则：**「进入页面要拿路由参数」用 `onLoad`；「每次显示要刷新」用 `onShow`；纯组件内的初始化用 `onMounted`。**

- `onLoad((options) => {...})`：只在首次进入触发，用来读 query。见 `detail.vue` 末尾 `onLoad` 取 `options.id` 再 `loadVideo(id)`。
- `onShow`：tabBar 页切回来也要刷新时用。`profile.vue` 用 `onShow` 重拉列表；`discover.vue` 用 `onShow` 重读搜索历史。
- `onMounted`：组件级一次性初始化，不代表「页面每次可见」。`home.vue`/`discover.vue` 用它做首屏加载。
- 从 `@dcloudio/uni-app` 导入这些钩子，不要从 vue 导。
- 应用级启动/前后台：在 `App.vue` 用 `onLaunch`/`onShow`/`onHide`（那里挂 message 轮询的起停）。

## 6. API 层约定

- 每个模块只 import `{ get, post, put, del, uploadFile } from '../utils/request'`，导出箭头函数，泛型标注返回类型。见 `api/video.ts`、`api/interact.ts`。
- 路径**自带 `/api` 前缀**（和网关路由前缀一致），`request.ts` 只拼「源」这一段。H5 源为空串走同源+代理，App/小程序为绝对地址。别在 api 里自己拼 host。
- 可能为 null 的后端出口要在泛型里标 `| null`，例如 `getOwner(): UserInfo | null`、`getTranscodeTask(): TranscodeTask | null`——因为后端「资源不存在」会回 data:null，标非空就是详情页第一个 TypeError。
- 需要 clientId 的调用（登录/注册）从 `config/client.ts` 取 `CLIENT_ID` 一起传，见 `api/auth.ts`。

## 7. 类型层约定（重点）

`src/types/index.ts` 是**手写的契约副本**：每个 interface 都是对着后端 controller / VO / entity 与 `../vidora-cloud/SQL/vidora_cloud.sql` 抄下来的，没有 `@generated` 标记，也没有任何脚本会刷新它（曾经的「`../vidora-cloud/openapi/*.json` 快照 → `npm run gen:api` → `src/types/generated/*.gen.ts`」链路已于 2026-10-06 整条撤销，理由：快照靠人手重跑脚本，忘跑时「类型检查通过」证明的是旧契约，比根本没有门禁更容易误导）。

这带来一个必须写明白的后果：**`npm run typecheck` 绿，只证明页面与这份副本自洽，不证明它和今天的后端一致。** 后端把字段改名或删掉，本端不会有任何编译错误，只会悄悄变成过期副本。历史上真实漂过的三起——热搜 `heat` 实为 `heatScore`（`index.ts` 的 `HotSearch` 一节）、`Category` 用 `sortOrder` 不是 `sort`（`Category` 一节）、`RecommendResult.isExposed` 是 tinyint 0/1 不是布尔（`RecommendResult` 一节）——今天仍然只是文件里的注释，没有任何东西会替你复验它们还成立。

所以纪律换成人工的：

- **动接口/字段之前，现场读** `../vidora-cloud` 对应服务的 `*Controller.java`，连它出入参的 VO / DTO / entity 一起看，再对 `SQL/vidora_cloud.sql` 的列注释确认档位与可空性；要看完整接口描述就起服务读该端口的 `/v3/api-docs`（8101–8108）。
- **后端交付时要点名**「改了哪个接口、哪个字段、哪些档位」，并点名本端哪个文件要跟着改。拿不到这句话，就当契约未对齐，不要靠猜。

副本回答不了的三类信息，本来就只能在后端读到：

- **可空语义**。TS 里的 `?` 只说得出「可能没值」，说不出后端是省掉这个键还是真的回 `null`；本仓库也没有一份能照着推的「全局序列化配置」。判空一律用 `??` 或 `== null` 这种两边都接的写法。「资源不存在」回 `code:200 + data:null` 这类出口必须在泛型上标 `| null`（见 `api/video.ts` 的 `getOwner`、`getTranscodeTask`），标成非空就是详情页第一个 TypeError。
- **字段在哪个接口出现、值是不是活的**。收藏数只在 interact 的 `ActionCounts` 上、`video_info` 没有这一列（`index.ts` 的 `VideoInfo` 一节就写着这件事）；`VideoInfo` 上的 `playCount`/`likeCount`/`commentCount`/`shareCount` 虽然对应 DDL 的四列，但后端 `VideoInfo.java:62-68` 写明插入时写死 0、无人累加，真实计数只在 `ActionCounts` / `VideoTotals`。这类判断类型文件给不出答案。
- **数字枚举的档位**。`status`、`actionType`、`source` 这些 int 的含义只存在于后端注释与 DDL 列注释里。

写这份文件的规矩：

- 字段名照后端逐字抄，**不要**为了好看改名、也不要顺手把可选字段收成必填——可选性一变，页面的判空分支就跟着变。每处偏离后端声明的地方都要在旁边写依据（DDL 哪一列、或 impl 一定会 set）。
- **后端不返回的字段，这里也不许声明**。TS 对多余的可选字段一声不响，页面读它就永远走兜底。2026-10-06 清掉的两处即此类：`CommentView` 挂着 `nickname`/`avatarUrl`（后端类注释写明「只带 userId，不带昵称头像」）、`ConversationView` 挂着 `peerNickname`/`peerAvatarUrl`（后端一共 6 个字段，没有对方资料），两处的真实做法都是页面自己现算名字（`CommentItem.vue` 的 `displayName()`、`message.vue` 的 `peerName()`）。
- 数字枚举按后端档位写注释（如 `actionType 1-赞 2-藏 3-分享`、`status 0-待处理…3-失败`），与 `SQL/vidora_cloud.sql` 的列注释保持一致。
- 「实体上没有、要靠别的接口补」的字段要注明来源（如收藏数在 `ActionCounts`，不在 `VideoInfo`）。这类说明已在文件里，改动时保留。
- `PageResult<T>` 保持现在这个精简壳（`records/total/current/size/pages`）。后端分页对象是 MyBatis-Plus 的 `IPage` 原样，还带着 `countId` / `maxLimit` / `optimizeCountSql` / `orders` 这些框架内部字段，页面不该看见它们。本端也没有 `ApiResult` 类型：`request.ts` 已按 code 剥过一层，页面只看到 data。

## 8. 注释规范

只在「为什么」不显然处写**一行中文注释**；代码在做什么靠命名说清楚，不要复述语法。

反例（废话，删掉）：
```ts
// 设置 loading 为 true
loading.value = true
```
正例（讲清非显然的原因，本项目里到处都是这种）：
```ts
// GET 带上 Content-Type 反而让浏览器多发一次 CORS 预检，这里只是少走一趟往返
header: { ...(isGet ? {} : { 'Content-Type': 'application/json' }), ... }
```
```ts
// 服务端算完直接把最新计数拿回来覆盖，前端不要再 +1/-1
```
块注释留给「契约陷阱」（null 语义、批量接口顺序不保证、字段来自另一张表），格式对齐 `types/index.ts` 与 `api/video.ts` 现有风格。

## 9. 错误处理约定

理解这条链才能写对，它全在 `src/utils/request.ts`：

- `statusCode === 401` → `handleUnauthorized()`：清本地 token，并**单飞**跳登录（`redirecting` 标志防止首屏并发多个 401 把登录页压好几次栈），reject `'未登录'`。
- `statusCode === 403` → toast `result.message` 或兜底「没有该操作权限」，reject。
- `statusCode >= 500` → toast「服务暂时不可用，请稍后再试」，reject。
- 其余看 body：`result.code === 200` 才 `resolve(result.data)`；否则 toast `result.message`（兜底「请求失败」）并 reject。
- 网络层失败（域名不通/超时/离线）走 `fail`，toast「网络连接失败，请检查网络」。
- 同一条错误 1.5s 内只弹一次（`showError` 节流），别绕过它自己叠 toast。

调用方姿势：

- **默认不重复 toast**。request 层已经弹过一次了，页面里 catch 到别再 `showToast` 同样内容（除非要就地反馈特定文案，如 detail.vue 提交评论失败）。
- **降级展示**要显式吞异常：热搜/历史/计数这类「挂了不该拖垮整页」的请求用 `try/catch {}` 或 `.catch(() => {})`，见 `discover.vue`、`home.vue`、`detail.vue` 的 `reportClick().catch()`。
- 分页 `usePagination.loadMore` 内部 catch 后只置 `hasMore=false`，不再弹层——所以列表页不用自己兜 loadMore 的错误。
- 未登录守卫在页面层做：动作前判 `userStore.isLoggedIn`，没登录就 toast「请先登录」并 return，别让 401 去触发跳登录（detail.vue 各 toggle 都这样）。
