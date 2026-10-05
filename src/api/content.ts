import { get } from '../utils/request'
import type { Category, Tag, HotSearch } from '../types'

export const listCategories = () =>
  get<Category[]>('/api/categories/list')

export const getCategoryTree = () =>
  get<Category[]>('/api/categories/tree')

export const getHotTags = (limit?: number) =>
  get<Tag[]>('/api/tags/hot', { limit })

export const suggestTags = (keyword?: string, limit?: number) =>
  get<Tag[]>('/api/tags/suggest', { keyword, limit })

export const getFeedConfigs = (feedType: string) =>
  get<Record<string, string>>(`/api/feed-configs/configs/${feedType}`)

export const getHotSearches = (date?: string) =>
  get<HotSearch[]>('/api/hot-searches', { date })
