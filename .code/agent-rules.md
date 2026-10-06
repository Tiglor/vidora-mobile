# AI 行为规范（agent-rules）

面向所有接入本仓库的 AI。目标是：改得对、可复现、不越界、诚实交付。

## 0. 动手前必读清单（按顺序，别跳）

1. 本目录四份规范：`README.md` → `agent-rules.md`（本文）→ `requirements.md` → `coding-standards.md`。
2. 与任务相关的 skill（见 README 对照表）。
3. 项目现状的真实来源，按需打开：
   - `package.json` —— 依赖与脚本。**注意**：全部 `@dcloudio/*` 钉死为同一个 alpha 版本串 `3.0.0-alpha-5030120260930001`，vue/pinia/@vue/shared 也是精确版本，没有 `^`/`~` 的是被刻意锁死的。
   - `vite.config.ts` —— H5 靠 devServer 把 `/api` 代理到网关（默认 `http://127.0.0.1:8080`，可用 `VITE_GATEWAY` 覆盖），并把 `vue` alias 到 `@dcloudio/uni-h5-vue` 的 runtime。这条代理是 H5 能联调的前提，网关没配 CORS。
   - `src/pages.json` —— uni-app 的页面与 tabBar 注册表。**新增页面必须在这里登记**，否则路由不存在。
   - `src/manifest.json` —— 各端 appid / 版本号 / 平台开关。
   - `src/utils/request.ts` —— 请求契约（见下）。
   - `src/config/env.ts` + `.env` —— API 源如何按端切换。
   - `src/types/index.ts` —— 类型契约，**本端手写的副本**：每个 interface 都是对着后端抄下来的，没有 `@generated` 标记，也没有任何脚本会刷新或覆盖它（曾经的 `src/types/generated/` + `npm run gen:api` 已在 2026-10-06 整条撤销）。它给页面的价值是一份统一的取数字段表，代价是后端改了字段名或删了字段时这里不会报错，只会变成过期副本。接口文档的出口只有各服务自己端口的 `/v3/api-docs`（8101–8108），需要时现场读后端 controller 与其出入参类。
   - 你要改的那个页面/组件本身。

## 1. 不许凭记忆断言代码现状

重要结论必须现场查证再下判断，不要「我记得 uni-app 是这样的」「一般 request 封装会……」。
本项目多处行为和其它工程不同，且都有注释写明原因，例如：

- `request.ts` 里 `uni.request` 对 4xx/5xx 也走 `success`，状态码要自己判；
- 网关的 401 **只设状态码不带 body**，只看 body 里的 code 会漏掉它；
- `usePagination` 的 `list` 故意 cast 成 `Ref<T[]>`，因为模板自动解包按 Ref 判；
- `src/types/index.ts` 里的字段名靠人抄，不是从后端推出来的：`VideoInfo` 上的 `playCount`/`likeCount`/`commentCount`/`shareCount` 确实对应 `video_info` 的四列，但后端 `VideoInfo.java:62-68` 的注释写明这几列插入时写死 0、之后无人累加，真实计数只在 interact 的 `ActionCounts` / `VideoTotals` 上；`favoriteCount` 更是表里根本没有这一列。判断「这个响应到底有没有某字段、值是不是活的」要读 controller 与 impl，不能数类型文件的字段。
- 本端的字段清单不是后端响应的完整出口：后端实体比这份手抄副本多列——`BaseEntity.java:39` 的 `isDeleted` 上方注释写明它没加 `@JsonIgnore`、仍会随实体序列化进响应体，而 `src/types/index.ts` 里既没有它也没有 `passwordHash`（后者在 system-service 的 `User.java:36` 上是 `@JsonProperty(access = WRITE_ONLY)`）。别拿本端有几个字段去推后端回什么；后端注释里「网关已拦住某前缀」这类说法也要以现场代码为准，注释和实现是会漂的。

这些只能读源码确认。拿不准就 Read/Grep，别看一眼就猜。引用文件时给绝对路径。

## 2. 验证门禁：具体命令

改完必须至少跑类型检查 + 对应端的构建。命令以 `package.json` 的 scripts 为准：

- 类型检查（H5 / 小程序 / App 都吃这一关，等价于 `vue-tsc --noEmit`，读 `tsconfig.json`）：
  ```bash
  npm run typecheck
  ```
  它核对的是 `src/types/index.ts` 那份手写副本，**绿只证明页面与这份文件自洽，不证明与今天的后端一致**；后端改名或删字段时这里不会报错。所以「跑过 typecheck」不能写进交付当成契约保证。
- 契约核对（没有命令可跑，只能人工做）：动接口或字段前，打开 `../vidora-cloud` 对应服务的 `*Controller.java` 与其出入参 VO/DTO/entity，再对 `../vidora-cloud/SQL/vidora_cloud.sql` 的列注释确认档位与可空性；需要看完整接口描述时，起服务后读该端口的 `/v3/api-docs`（8101–8108 共八个服务）。发现副本与后端不一致，就地改 `src/types/index.ts` 并在交付里点名改了哪几处。
- H5 构建：
  ```bash
  npm run build:h5
  ```
  （实际执行 `uni build`，产物在 `dist/build/h5`。）
- 微信小程序构建：
  ```bash
  npm run build:mp-weixin
  ```
  （实际执行 `uni build -p mp-weixin`，产物在 `dist/build/mp-weixin`。）
- App 构建：`npm run build:app`（`uni build -p app`）。除非任务明确涉及 App 打包，一般不必跑。

本地起 H5 调试：`npm run dev:h5`（`uni`）。详见 `skills/run-h5-in-browser.md`。

约定：改动只影响某端逻辑时，至少要过 `npm run typecheck`；碰了 `pages.json` / `manifest.json` / 全局样式 / 请求层这类跨端公共面，H5 和 mp-weixin 两个 build 都跑一遍。

## 3. 禁止动作（未经用户明确要求，一律不做）

- 不得安装或升级依赖、不得改动 `package.json` 里的版本号、不得重生成 `package-lock.json`。`@dcloudio` 那串 alpha 版本尤其不能动。
- 不得改 CI/CD 配置（本仓库当前没有 CI 配置文件，也不要去新建，除非用户要求）。
- 不得删除任何既有文件。
- 不得 `git push`、不得建/推分支到远端。
- 不得用 `--no-verify` 跳过 git 钩子；钩子失败要查根因，不要绕过。
- 不得运行会改写仓库状态的命令（`npm install`、`mvn`、格式化全仓等）。只读命令（`ls`/`cat`/`grep`/`node --version` 之类）可以。曾经唯一的例外 `npm run gen:api`（重写 `src/types/generated/`）已连同脚本一起删除，现在**没有任何例外**。
- 不得改动 `vidora-mobile` 以外的目录（后端 `vidora-cloud`、`vidora-web`、`vidora-admin` 只在被明确要求跨端时才碰，且需各自同意）。

## 4. 哪些改动必须先征求同意

先说明打算怎么改、为什么，得到确认再动手：

- 改动 `src/types/index.ts` 里某个 interface 的字段可选性（加/去掉 `?`、加 `| null`）或删除整个 interface——页面按它判空，可选性一变，运行时走的就是另一条兜底路径。这份文件是手写的，改它等于改契约声明，得先说清依据（后端哪一行代码或 DDL 哪一列）。
- 改 `src/utils/request.ts` 的错误处理链（401/403/>=500/code!==200 那套）。这是全站请求的地基，牵一发动全身。
- 改 `vite.config.ts`、`.env`、`manifest.json`、`tsconfig.json` 等工程配置。
- 新增第三方依赖。
- 触及 tabBar 结构、登录态存储 key（`token`/`userId`/`nickname`/`roles`/`permissions`）、`CLIENT_ID` 对应的库值。
- 需要后端配合的契约变更（前端单改无法闭环时）。

## 5. 交付时如何区分「已验证」与「未验证」

结束时如实汇报，绝不把「应该没问题」写成「已验证通过」：

- **已验证**：列出真跑过的命令与其结果（如 `npm run typecheck` 无报错、`npm run build:h5` 成功产出）。只写你真执行的。
- **类型检查通过 ≠ 契约是新的**：`src/types/index.ts` 是手写副本，没有任何机制保证它跟得上后端。交付里必须单列一句「契约怎么核过的」——现场读过哪些后端 `*Controller.java` / VO / DTO / entity、比对过 `SQL/vidora_cloud.sql` 的哪一节；没读就直说「未与后端核对，仅本端自洽」，不要让人读成「已跟后端对齐」。
- **未验证**：明确点名。凡是没跑的类型检查/构建/浏览器实测，都要写「未验证」并说明原因（环境不具备、需要真机、需要后端起来等）。
- 运行时行为（跳转是否正确、toast 是否弹对、分页是否续上）在没有浏览器实测证据时，一律标为「未验证」。
- 遗留问题、看起来可疑但没动的地方，主动列出，不要藏。
