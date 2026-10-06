# Skill: 新增或调整一个 API 调用

目标：加/改一个后端接口调用，URL、方法、返回类型和后端 controller 对齐，类型与本端手写的契约副本同步维护。

## 前提认知

- 请求地基在 `src/utils/request.ts`，页面**不要裸调 `uni.request`**，一律经 `src/api/*.ts`。
- api 里的路径**自带 `/api` 前缀**（与网关路由一致），`request.ts` 只拼「源」那一段；H5 源为空串走同源+devServer 代理，App/小程序是绝对地址。别在 api 函数里自己拼 host。
- 类型是本端抄的：`src/types/index.ts` 是一份**手写副本**，没有生成脚本会刷新它（曾经的 `../vidora-cloud/openapi/<服务>.json` → `npm run gen:api` → `src/types/generated/*.gen.ts` 链路已于 2026-10-06 整条撤销）。后果是抄错、抄漏、后端改名，`npm run typecheck` 都不会报——历史上漂过的 `heat`→实为 `heatScore`（`index.ts` 的 `HotSearch` 一节）、`sort`→实为 `sortOrder`（`Category` 一节）、`isExposed` 是 tinyint 0/1 非布尔（`RecommendResult` 一节），今天都只是这份文件里的注释，没有任何东西会替你复验它们还成立。
- **所以第 1 步核对 controller 是本任务唯一的契约保证**，不能跳。副本和后端不一致时，就地改 `src/types/index.ts` 让它贴住后端，并在旁边写下依据（后端哪一行代码、DDL 哪一列）；不要另建一份类型文件、也不要给同一个后端形状起第二个名字。

## 步骤

1. **核对后端契约**（这一步没有命令可跑，只能打开文件读）：`../vidora-cloud` 对应服务的 `*Controller.java`，确认路径、HTTP 方法、入参名、返回结构，以及「资源不存在时是否回 data:null」；连它出入参的 VO / DTO / entity 一起读，档位与可空性再对 `../vidora-cloud/SQL/vidora_cloud.sql` 的列注释。需要完整接口描述时，起服务读该端口的 `/v3/api-docs`（8101–8108）。这是需求规范第 3 节说的「以 controller 为准」。

2. **对齐本端类型**（`src/types/index.ts`，手写的副本，改它是常态不是违规）：
   - 先在这份文件里找现成的 interface（`VideoInfo` / `CommentView` / `ActionCounts`…），有就直接 `import type { Foo } from '../types'`，别另起一个名字。
   - 后端已有这个形状但本端没声明 → 照着 controller 的返回类**逐字抄**一份新 interface：字段名一致、后端可空的列才加 `?`，上方注释写清出处（哪个接口 / 对应后端哪个类），旁边注明哪些字段来自别的接口（如收藏数在 `ActionCounts`，不在 `VideoInfo`）。
   - 副本里的字段名或可选性与后端对不上 → 就地改正，并在交付里点名改了哪几处；不要为了「页面想好看」重命名字段。
   - 后端确实没有这个出口 → 这是跨端变更，先谈后端（需求规范第 1 节的边界），别在前端造一个不存在的字段。

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
   - 「资源不存在会回 data:null」的出口必须在调用泛型里写 `| null`（`src/types/index.ts` 里的 interface 只声明形状，说不出这件事；标成非空就是详情页第一个 TypeError）。
   - 数字枚举按后端档位补注释（如 `actionType 1-赞 2-藏 3-分享`、`status 0-待处理…3-失败`）：档位只有后端 Javadoc 与 DDL 列注释里有，读不到就别凭感觉填，抄过来时在本端注释里保留出处。

4. **页面调用**：`await` 后直接用返回的 `data`（request 层已 resolve 出 `result.data`）。错误默认已由 request 层统一 toast，页面里**别再弹同样文案**；纯展示型请求要降级就用 `try/catch {}` 吞掉，别让一个失败请求废掉整页（参考 `discover.vue` 的 loadHotSearches、`detail.vue` 的 reportClick().catch()）。

## 验证

- `npm run typecheck` —— 它证明的只有「页面与 `src/types/index.ts` 这份手写副本自洽」；副本对不对、`src/api/*.ts` 里手写的路径与方法对不对，都要回 controller 对，typecheck 一概看不出来。
- 契约核对的证据写进交付：读过哪个 `*Controller.java`、哪个 VO/DTO/entity、`SQL/vidora_cloud.sql` 的哪一节，以及本端改了哪几处类型。没读就直说「未与后端核对」。
- 第 1 步发现副本过期：改 `src/types/index.ts` → 再 `npm run typecheck`，确认没有页面还按旧字段名取值（改名这类变更 TS 能查出引用点，新增字段查不出后端给不给）。
- `npm run build:h5`；若逻辑涉及平台差异，另跑 `npm run build:mp-weixin`。
- 运行时联调需后端网关起来（默认 `http://127.0.0.1:8080`，可用 `.env` 的 `VITE_GATEWAY` 改），H5 靠 vite 代理转发 `/api`。起法见 `skills/run-h5-in-browser.md`。没起后端就如实标「未做真实接口验证」。

## 常见坑

- typecheck 绿就当「已和后端对齐」—— 类型是手抄的，后端改名这里一片绿。第 1 步对过 controller 才算数。
- 没读后端就往 `src/types/index.ts` 加一个「应该是这样」的字段 —— 副本本来就可能落后，再加一条猜测等于自己造契约；补字段的前提是第 1 步真的在 controller / VO 里看到了这一列，并把出处写进注释。
- 把可空出口标成非空 → 详情页渲染第一个 TypeError。
- 在 api 里多写了 host 或漏了 `/api` 前缀 → H5 下代理不到 / 404。
- catch 后又 `showToast` 相同内容 → 叠两条重复提示（request 层已有 1.5s 节流，但绕不过你手动再弹的那条）。
- 顺手升级 axios/fetch 之类依赖来「更好用」→ 违反 agent-rules 禁止动作，本项目只有 uni.request。
