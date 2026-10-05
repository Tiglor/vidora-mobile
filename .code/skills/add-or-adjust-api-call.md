# Skill: 新增或调整一个 API 调用并同步类型

目标：加/改一个后端接口调用，URL、方法、返回类型和后端 controller 对齐，且手写类型不漂移。

## 前提认知

- 请求地基在 `src/utils/request.ts`，页面**不要裸调 `uni.request`**，一律经 `src/api/*.ts`。
- api 里的路径**自带 `/api` 前缀**（与网关路由一致），`request.ts` 只拼「源」那一段；H5 源为空串走同源+devServer 代理，App/小程序是绝对地址。别在 api 函数里自己拼 host。
- `src/types/index.ts` 手写、易和后端 DTO 漂移（历史：`heat`→实为 `heatScore`、`sort`→实为 `sortOrder`、`isExposed` 是 tinyint 0/1 非布尔）。所以**先对 controller 再动类型**。

## 步骤

1. **核对后端契约**：打开 `vidora-cloud` 对应服务的 `*Controller.java`，确认路径、HTTP 方法、入参名、返回结构、以及「资源不存在时是否回 data:null」。这是需求规范第 3 节说的「以 controller 为准」。

2. **补/改类型** `src/types/index.ts`：
   - 用对齐后端的字段名；数字枚举按档位写注释；可能为 null 的出口在调用泛型里标 `| null`，不要标成非空。
   - 「实体上没有、要靠别的接口补」的字段注明来源（如收藏数在 `ActionCounts`，不在 `VideoInfo`）。保留文件里既有的来源注释。

3. **写/改 api 函数** `src/api/<域>.ts`，照现有风格（箭头函数 + 泛型标注）：
   ```ts
   import { get, post } from '../utils/request'
   import type { Foo } from '../types'

   export const getFoo = (id: number) => get<Foo | null>(`/api/foos/${id}`)
   export const createFoo = (data: FooReq) => post<Foo>('/api/foos', data)
   ```
   - 分页返回用 `get<PageResult<T>>('/api/xxx/page', params)`。
   - 批量取详情参考 `listVideosByIds`：服务端顺序不保证、只回存在的行，调用方要按 id 建 Map 再取，别按下标对齐。
   - 上传类走 `uploadFile(url, filePath, name, formData)`（见 `api/video.ts`）。
   - 需要 clientId 的（登录/注册）从 `config/client.ts` 取 `CLIENT_ID` 一起传（见 `api/auth.ts`）。

4. **页面调用**：`await` 后直接用返回的 `data`（request 层已 resolve 出 `result.data`）。错误默认已由 request 层统一 toast，页面里**别再弹同样文案**；纯展示型请求要降级就用 `try/catch {}` 吞掉，别让一个失败请求废掉整页（参考 `discover.vue` 的 loadHotSearches、`detail.vue` 的 reportClick().catch()）。

## 验证

- `npx vue-tsc --noEmit` —— 类型链闭合（最能抓漂移的一步）。
- `npm run build:h5`；若逻辑涉及平台差异，另跑 `npm run build:mp-weixin`。
- 运行时联调需后端网关起来（默认 `http://127.0.0.1:8080`，可用 `.env` 的 `VITE_GATEWAY` 改），H5 靠 vite 代理转发 `/api`。起法见 `skills/run-h5-in-browser.md`。没起后端就如实标「未做真实接口验证」。

## 常见坑

- 没对 controller 就凭印象写字段名 → TS 过了但运行时字段是 undefined（就是历史上的 heat/sort 事故）。
- 把可空出口标成非空 → 详情页渲染第一个 TypeError。
- 在 api 里多写了 host 或漏了 `/api` 前缀 → H5 下代理不到 / 404。
- catch 后又 `showToast` 相同内容 → 叠两条重复提示（request 层已有 1.5s 节流，但绕不过你手动再弹的那条）。
- 顺手升级 axios/fetch 之类依赖来「更好用」→ 违反 agent-rules 禁止动作，本项目只有 uni.request。
