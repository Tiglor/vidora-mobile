import { get, post } from '../utils/request'
import type { RecommendResult, PageResult } from '../types'

export const getFeed = (scene: string, size?: number) =>
  get<RecommendResult[]>('/api/recommends/feed', { scene, size })

export const reportClick = (id: number) =>
  post<boolean>(`/api/recommends/${id}/click`)

export const getRecommendHistory = (params?: Record<string, any>) =>
  get<PageResult<RecommendResult>>('/api/recommends/history', params)
