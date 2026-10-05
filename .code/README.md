# vidora-mobile AI 协作规范

这是 vidora 手机端（uni-app + Vue3 + TypeScript，编译到 H5 / 微信小程序 / App）的 AI 开发规范目录。
项目此前没有任何 AI 指令文件，所以本目录自带全部上下文：每条规则都能指到具体源码文件，不靠记忆和常识。

任何 AI（Qoder / Codex / Cursor / Claude Code 等）在动手改这个仓库前，先读这里。

## 四份规范讲什么

| 文件 | 内容 | 什么时候看 |
| --- | --- | --- |
| `agent-rules.md` | AI 行为规范：动手前必读清单、不许凭记忆断言代码现状、验证门禁的具体命令、禁止动作、需先征求同意的改动、交付时如何区分「已验证/未验证」 | 每次开工前 |
| `coding-standards.md` | 编码规范：目录职责、命名、页面写法、rpx 与样式、生命周期选用、API 层与类型层约定、注释规范、错误处理 | 写代码时 |
| `requirements.md` | 需求规范：本端在产品里的定位与边界、四段式需求写法、契约以什么为准、什么算完成 | 接到需求、评估范围时 |

## 建议阅读顺序

1. `agent-rules.md` —— 先搞清楚能做什么、不能做什么、怎么自证改动是对的。
2. `requirements.md` —— 再搞清楚这个端的边界，避免把别的端的活揽过来或越界改后端契约。
3. `coding-standards.md` —— 最后落到怎么写才符合本项目既有风格。

三份都读完，再按下面的任务对照表翻对应的 skill 手册。

## 什么任务翻哪份 skill

| 你要做的事 | 看这份 skill |
| --- | --- |
| 新增一个 uni-app 页面（含 tabBar 页） | `skills/add-a-page.md` |
| 新增或调整一个 API 调用，并同步手写类型 | `skills/add-or-adjust-api-call.md` |
| 在浏览器里跑 H5 端验证一次改动 | `skills/run-h5-in-browser.md` |
| 分页列表页怎么接 `usePagination` | `skills/paginated-list-with-usepagination.md` |

skill 是「可执行步骤清单」：改哪些文件、什么顺序、每步怎么验证、常见坑。照着做即可，不必通读全仓。

## 一句话红线（详见 agent-rules.md）

- `@dcloudio/*` 版本钉死为同一个 alpha 串，不要顺手升级。
- 新增页面必须先在 `src/pages.json` 登记，否则白做。
- 手写类型 `src/types/index.ts` 会和后端 DTO 漂移，改接口前先对 controller。
- 交付时明确标出哪些命令真跑过、哪些没跑。
