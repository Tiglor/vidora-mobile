# vidora-mobile AI 协作规范

这是 vidora 手机端（uni-app + Vue3 + TypeScript，编译到 H5 / 微信小程序 / App）的 AI 开发规范目录。
vidora 由四个工程组成：本仓库、`../vidora-web` 消费端 Web 站点、`../vidora-admin` 管理后台、`../vidora-cloud` Spring Cloud 后端；三端打同一个网关、同一套 JWT，业务口径一律以后端 controller 为准。
项目此前没有任何 AI 指令文件，所以本目录自带全部上下文：每条规则都能指到具体源码文件，不靠记忆和常识。

**开始任何开发工作之前，必须先完整读完本目录下的四份规范（`agent-rules.md` / `coding-standards.md` / `requirements.md` 与本文件），再按下面的任务映射翻 `.code/skills/` 里对应的手册。**
本仓库**刻意不放根 `AGENTS.md`**：入口只留这一处，避免两份文件各说一套、改一处忘一处。
这份要求适用于所有 AI 工具（Qoder / Codex / Cursor / Claude Code 等），不因工具而异。

## 四份规范讲什么

| 文件 | 内容 | 什么时候看 |
| --- | --- | --- |
| `agent-rules.md` | AI 行为规范：动手前必读清单、不许凭记忆断言代码现状、验证门禁的具体命令、禁止动作、需先征求同意的改动、交付时如何区分「已验证/未验证」 | 每次开工前 |
| `coding-standards.md` | 编码规范：目录职责、命名、页面写法、rpx 与样式、生命周期选用、API 层与类型层约定、注释规范、错误处理 | 写代码时 |
| `requirements.md` | 需求规范：本端在产品里的定位与边界、四段式需求写法、契约以什么为准、什么算完成 | 接到需求、评估范围时 |

## 验证命令（package.json 的 scripts 只有这七条）

```powershell
npm run dev:h5             # uni，本地起 H5（hash 路由，见 skills/run-h5-in-browser.md）
npm run dev:mp-weixin      # uni -- -p mp-weixin
npm run dev:app            # uni -- -p app
npm run build:h5           # uni build，产物 dist/build/h5
npm run build:mp-weixin    # uni build -p mp-weixin，产物 dist/build/mp-weixin
npm run build:app          # uni build -p app，产物 dist/build/app，未实测
npm run typecheck          # vue-tsc --noEmit，读 tsconfig.json
```

没有 lint、没有 test 脚本、没有测试框架，**不要声称跑过它们**。`typecheck` 是本端最快的机械门禁，但它核对的是 `src/types/index.ts` 那份**手写副本**：绿只证明页面与这份文件自洽，不证明它和今天的后端一致。

## 目录速览

| 路径 | 职责 |
| --- | --- |
| `src/pages.json` | uni-app 页面与 tabBar 注册表；**新增页面必须在这里登记**，漏了路由不存在 |
| `src/manifest.json` | 各端 appid / 版本号 / 平台开关 |
| `src/api/*.ts` | 按后端服务域拆分的接口封装，URL／方法／参数名手写，须与 controller 对齐 |
| `src/types/index.ts` | 契约类型的**手抄本**，无生成脚本覆盖；改字段前先读后端 |
| `src/utils/request.ts` | 全站请求地基：注入 JWT、按 code 剥 `{ code, message, data }` 外壳只留 data、401 单飞跳登录、错误 toast 1.5s 去重 |
| `src/stores/` | pinia 组合式 store：user / message / dict |
| `src/composables/` | usePagination / useDebounce / useAuth |
| `src/config/env.ts`, `src/config/client.ts` | API 源按端切换、`CLIENT_ID`（值须与库里的 sys_client 对得上） |
| `vite.config.ts` | H5 的 `/api` devServer 代理 + 把 `vue` alias 到 uni-h5 的 runtime |

## 建议阅读顺序

1. `agent-rules.md` —— 先搞清楚能做什么、不能做什么、怎么自证改动是对的。
2. `requirements.md` —— 再搞清楚这个端的边界，避免把别的端的活揽过来或越界改后端契约。
3. `coding-standards.md` —— 最后落到怎么写才符合本项目既有风格。

三份都读完，再按下面的任务对照表翻对应的 skill 手册。

## 什么任务翻哪份 skill

| 你要做的事 | 看这份 skill |
| --- | --- |
| 新增一个 uni-app 页面（含 tabBar 页） | `skills/add-a-page.md` |
| 新增或调整一个 API 调用，对后端契约并落手写类型 | `skills/add-or-adjust-api-call.md` |
| 在浏览器里跑 H5 端验证一次改动 | `skills/run-h5-in-browser.md` |
| 分页列表页怎么接 `usePagination` | `skills/paginated-list-with-usepagination.md` |

skill 是「可执行步骤清单」：改哪些文件、什么顺序、每步怎么验证、常见坑。照着做即可，不必通读全仓。

## 一句话红线（详见 agent-rules.md）

- `@dcloudio/*` 版本钉死为同一个 alpha 串，不要顺手升级；未经用户同意不得安装/升级依赖，也不得改动 `package.json`。
- 新增页面必须先在 `src/pages.json` 登记，否则白做。
- 契约类型是本端手写的副本（`src/types/index.ts`），没有任何脚本会刷新它：`npm run typecheck` 绿只证明页面与这份副本自洽，后端改名或删字段本端不会报错。**动接口/字段前现场读后端 controller 与其 VO/DTO/实体，以及 `../vidora-cloud/SQL/vidora_cloud.sql` 的列注释**；null 语义、某字段只有详情接口给、数字枚举有哪些档位，这些类型文件里本来就没有答案。
- 后端交付时要点名「改了哪个接口、哪个字段、哪些档位」以及本端哪个文件要跟着改；拿不到这句话就当作契约未对齐。
- 交付时明确标出哪些命令真跑过、哪些没跑。
