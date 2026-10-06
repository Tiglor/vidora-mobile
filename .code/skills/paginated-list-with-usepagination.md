# Skill: 分页列表页怎么接 usePagination

目标：给一个「下拉/滚动加载更多」的列表页接上 `src/composables/usePagination.ts`，行为对齐 home / profile / discover。

## 契约

```ts
usePagination<T>(
  fetchFn: (page, size) => Promise<PageResult<T>>,   // 必须返回后端分页壳 PageResult
  options?: { pageSize?: number }                     // 默认 10
)
// 返回 { list, total, loading, hasMore, refresh, loadMore }
```

- `fetchFn` 拿到的必须是 `PageResult<T>`（`records/total/current/size/pages`，见 `src/types/index.ts` 的 `PageResult`），所以里面通常就是某个 `get<PageResult<T>>('/api/xxx/page', { current: page, size })`。
- `refresh()` 重置到第 1 页并清空；`loadMore()` 追加下一页。
- `hasMore` 在 `current >= res.pages` 或本页不足 pageSize 时置 false。
- `loadMore` 内部已 catch 并把 `hasMore` 置 false，页面不用自己兜它的错。
- `list` 是 Ref，模板里直接 `v-for="item in list"`，别 cast 成普通对象（`usePagination.ts` 顶部注释说明过解包失真这个坑）。

## 标准接法（以 home.vue 为模板）

1. 建筛选状态：
   ```ts
   const activeCategoryId = ref<number | null>(null)
   ```
2. 接 composable，fetchFn 里带上当前筛选参数：
   ```ts
   const { list, loading, hasMore, refresh, loadMore } = usePagination<VideoInfo>(
     (page, size) => listVideos({ current: page, size, categoryId: activeCategoryId.value || undefined }),
     { pageSize: 10 }
   )
   ```
3. 首屏加载放 `onMounted`：
   ```ts
   onMounted(() => refresh())
   ```
4. 模板用 `<scroll-view scroll-y @scrolltolower="onLoadMore">` 承载列表：
   ```html
   <VideoCard v-for="item in list" :key="item.id" :video="item" />
   <view v-if="loading">加载中...</view>
   <view v-if="!hasMore && list.length > 0">没有更多了</view>
   <view v-if="!loading && list.length === 0">暂无视频</view>
   ```
5. 交互函数：
   - 切换筛选条件后调 `refresh()`（home.vue 的 `onCategoryClick`）。
   - `onLoadMore()` 里调 `loadMore()`。
   - 下拉刷新（`refresher-enabled` + `@refresherrefresh`）：置 `refreshing=true` → `await refresh()` → 置回 false（home.vue 的 `onRefresh`）。

## 数据形状不是 VideoInfo 怎么办（profile 收藏的做法）

当接口分页装的是「行为行」（只有 targetId、没标题封面），fetchFn 里补一次批量查再重组成 `PageResult<VideoInfo>`：
```ts
usePagination<VideoInfo>(async (page, size) => {
  const res = await myFavorites({ current: page, size })      // PageResult<InteractAction>
  const ids = res.records.map(r => r.targetId)
  const videos = ids.length ? await listVideosByIds(ids) : [] // batch 只回存在的行
  const byId = new Map(videos.map(v => [v.id, v]))
  return { ...res, records: ids.map(id => byId.get(id)).filter((v): v is VideoInfo => !!v) }
}, { pageSize: 10 })
```
要点：保持后端给的排序；补不到的（已下架）就地跳过，不要按下标硬对齐。

## tabBar 页每次切回来要刷新

profile.vue 用 `onShow` 触发 `refresh()`（登录态下），而不是 onMounted——tab 页切回来 onMounted 不再执行。区分见 `coding-standards.md` 第 5 节。

## total 的特殊用途

discover.vue 搜索完会 `recordSearch(kw, resultTotal.value)` 上报**后端总命中数**而非当页条数——因为 resultCount 进全站词频统计，用 `list.length` 最多只能报到 pageSize。需要这个口径就从返回值里取 `total`。

## 验证

- `npm run typecheck` —— 只保证页面与 `src/types/index.ts` 那份手写副本自洽；这个分页接口实际回不回 `pages`、字段名有没有漂，它看不出来。
- `npm run build:h5`。
- 浏览器实测按 `skills/run-h5-in-browser.md`（hash URL）：滚到底能续拉第二页、到底显示「没有更多了」、切筛选回到第一页、空数据显示空态不报错。这些没真点过就标「未验证」。

## 常见坑

- fetchFn 忘了把 `page` 透传成 `current`，永远拉第 1 页 → 无限重复同几条。
- 直接在模板外把 `list` 当普通数组解构丢掉了 Ref → 解包失真。
- tabBar 页只在 onMounted 里 refresh，切回来不更新 → 该用 onShow。
- 后端 records 可能为 null 就直接 `push(...res.records)` → 展开报错（赋值前先兜底空数组）。
