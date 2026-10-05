import { get, post, del } from '../utils/request'
import type { PageResult, SearchHistory, SearchSuggest } from '../types'

export const recordSearch = (keyword: string, resultCount?: number) =>
  post<void>('/api/search/record', { keyword, resultCount })

/** 后端返的是分页壳子（records/total/...），取 history 要拿 records，不是整个 data */
export const getSearchHistory = (params?: Record<string, any>) =>
  get<PageResult<SearchHistory>>('/api/search/history', params)

export const removeSearchHistory = (id: number) =>
  del<boolean>(`/api/search/history/${id}`)

/** 返回清掉的行数 */
export const clearSearchHistory = () =>
  del<number>('/api/search/history')

export const getSearchSuggests = (prefix?: string, limit?: number) =>
  get<SearchSuggest[]>('/api/search/suggests', { prefix, limit })
