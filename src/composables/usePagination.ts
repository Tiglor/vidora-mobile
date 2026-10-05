import { ref } from 'vue'
import type { Ref } from 'vue'
import type { PageResult } from '../types'

export function usePagination<T>(
  fetchFn: (page: number, size: number) => Promise<PageResult<T>>,
  options?: { pageSize?: number }
) {
  // 必须保持 Ref 类型对外暴露：以前这里 cast 成 { value: T[] }，
  // 运行时没问题，但 <template> 里的自动解包是按 Ref 判的，于是 list.length、item.id 全部失真
  const list = ref<T[]>([]) as unknown as Ref<T[]>
  const loading = ref(false)
  const hasMore = ref(true)
  // 后端返回的总条数。列表页要拿它上报搜索结果数（/search/record 的 resultCount 进的是全站词频统计），
  // 只有 list.length 的话最多只能报到 pageSize，统计口径就和 web 端对不上了
  const total = ref(0)
  const pageSize = options?.pageSize ?? 10
  let current = 1

  async function refresh() {
    current = 1
    hasMore.value = true
    list.value = []
    total.value = 0
    await loadMore()
  }

  async function loadMore() {
    if (loading.value || !hasMore.value) return
    loading.value = true
    try {
      const res = await fetchFn(current, pageSize)
      list.value.push(...res.records)
      total.value = res.total ?? list.value.length
      if (current >= res.pages || res.records.length < pageSize) {
        hasMore.value = false
      }
      current++
    } catch {
      hasMore.value = false
    } finally {
      loading.value = false
    }
  }

  return { list, total, loading, hasMore, refresh, loadMore }
}
