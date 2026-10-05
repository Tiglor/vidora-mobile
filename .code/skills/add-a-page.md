# Skill: 新增一个 uni-app 页面

目标：加一个能被路由到、样式与既有页一致的 uni-app 页面。

## 关键前提

`src/pages.json` 是 uni-app 的页面注册表。**页面 .vue 文件写完但没在这里登记，路由根本不存在**——`navigateTo` 会静默失败或落到别处，白干一场。这是本任务最容易漏的一步。

## 步骤

1. **建目录/文件**：在 `src/pages/<模块>/` 下新建 `<name>.vue`。
   - 已有模块直接放：home / discover / message / profile / login / video / upload。
   - 例：详情页 `pages/video/detail.vue`、tabBar 页 `pages/discover/discover.vue`。
   - 骨架用 `<script setup lang="ts">`（见 `coding-standards.md` 第 3 节）。

2. **登记到 pages.json 的 `pages` 数组**（这一步别跳）：
   ```json
   {
     "path": "pages/<模块>/<name>",
     "style": { "navigationBarTitleText": "标题" }
   }
   ```
   - `path` 不带前导 `/`、不带 `.vue`。
   - 数组第一项是启动首页，非首页的新页面插到列表末尾即可，别乱序影响首屏。

3. **若要作为 tabBar 页**：还要在 `pages.json` 的 `tabBar.list` 里加一项 `{ "pagePath": "pages/<模块>/<name>", "text": "名称" }`，并确保该 path 也在 `pages` 数组里。现有四个 tab：home / discover / message / profile。tabBar 页之间跳转用 `uni.switchTab`，不能用 `navigateTo`。

4. **入口接线**：从别的页面跳过来时写清 url 和参数。
   - 普通跳转：`uni.navigateTo({ url: '/pages/<模块>/<name>?id=xxx' })`。
   - 目标页在 `onLoad((options) => { ... })` 里读参数，参考 `pages/video/detail.vue` 末尾的 `onLoad` 取 `options.id`。

5. **样式**：`<style scoped>`，尺寸用 rpx，配色沿用主题色（红 `#ff2442`、蓝 `#4a90d9`、文字 `#333/#666/#999`、底 `#f5f5f5`）。全局基线已在 `App.vue`，不要在页面重复定义 `page` 背景。

## 验证

- `npx vue-tsc --noEmit` —— 新页面语法/类型无误。
- `npm run build:h5` —— 改了 `pages.json` 属于跨端公共面，构建要过。
- 起本地：`npm run dev:h5`，按 `skills/run-h5-in-browser.md` 用 **hash 形式 URL** 打开新页面路径实测能否渲染。
- 若加了 tabBar 项，`npm run build:mp-weixin` 也要过（小程序对 tabBar 配置更严）。

## 常见坑

- 只写了 .vue 忘了在 `pages.json` 登记 → 页面永远打不开。
- `path` 写成带 `/` 开头或带 `.vue` 后缀 → 匹配不到。
- 新页面当首页插到了 `pages` 数组第一位，改变了启动页 → 除非有意为之，放末尾。
- tabBar 页用了 `navigateTo` 跳转不生效 → 应 `switchTab`。
- 生命周期钩子从 `vue` 导入而非 `@dcloudio/uni-app` → onLoad/onShow 不触发。
