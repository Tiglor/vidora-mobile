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
  types/        index.ts —— 手写 DTO 类型
  App.vue       应用级生命周期 + 全局样式
  main.ts       createSSRApp + pinia
```

新增东西先想清楚落在哪个目录，别在页面里裸调 `uni.request`——一律走 `api/*.ts` → `utils/request.ts`。

## 2. 命名

- 页面/组件文件用功能名小写：`detail.vue`、`discover.vue`、`VideoCard.vue`（组件 PascalCase）。
- API 函数动词开头、语义贴后端：`listVideos` / `getVideo` / `getPlayUrl` / `createComment` / `setActive`。批量用 `ByIds` 后缀（`listVideosByIds`）。
- 类型名对齐后端 DTO/VO：`VideoInfo`、`LoginVO`、`ActionCounts`、`PageResult<T>`、`TranscodeTask`。不要自创和后端对不上的名字。
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

`src/types/index.ts` 是**手写**的，历史上多次因和后端 DTO 漂移踩坑（`HotSearch.heat` 其实后端叫 `heatScore`、`Category` 用 `sortOrder` 不是 `sort`、`RecommendResult.isExposed` 是 tinyint 0/1 不是布尔）。因此：

- 加/改字段前先打开对应 controller 核对，不要照前端旧印象写。
- 数字枚举要按后端档位写注释（如 `actionType 1-赞 2-藏 3-分享`、`status 0-待处理…3-失败`）。
- 「实体上没有、要靠别的接口补」的字段要注明来源（如收藏数在 `ActionCounts`，不在 `VideoInfo`）。这类说明已在文件里，改动时保留。

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
