import { defineStore } from 'pinia'
import { ref } from 'vue'
import { listCategories } from '../api/content'
import type { Category } from '../types'

/**
 * 分区字典：首页频道条和上传页分类选择器都要用。
 * 移动端上传页是 navigateTo 打开的，每进一次就重新拉一遍分区——后端那层 Redis 缓存
 * 省的是查库，网关到 App 的这一趟网络往返一次都没省。缓存一份，全站共用。
 *
 * 这里用 /categories/list（平铺）而不是 /categories/tree：两端都只做一层横向频道条，
 * 没有层级要画，tree 白带回 children。
 */
export const useDictStore = defineStore('dict', () => {
  const categories = ref<Category[]>([])
  const loaded = ref(false)
  // 在途请求：首页和上传页几乎同时挂载时共用同一个 promise
  let inflight: Promise<Category[]> | null = null

  function loadCategories(force = false): Promise<Category[]> {
    if (loaded.value && !force) return Promise.resolve(categories.value)
    if (!inflight) {
      inflight = listCategories()
        .then((list) => {
          categories.value = list || []
          loaded.value = true
          return categories.value
        })
        .finally(() => {
          inflight = null
        })
    }
    return inflight
  }

  return { categories, loadCategories }
})
