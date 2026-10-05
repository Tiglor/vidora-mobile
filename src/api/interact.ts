import { get, post, put, del } from '../utils/request'
import type { CommentView, CommentCreateRequest, ActionCounts, ActionRequest, InteractAction, Danmaku, DanmakuSendRequest, VideoTotals, PageResult } from '../types'

export const listComments = (videoId: number, params?: Record<string, any>) =>
  get<PageResult<CommentView>>(`/api/comments/video/${videoId}`, params)

export const listReplies = (rootId: number, params?: Record<string, any>) =>
  get<PageResult<CommentView>>(`/api/comments/replies/${rootId}`, params)

export const createComment = (data: CommentCreateRequest) =>
  post<CommentView>('/api/comments', data)

export const deleteComment = (id: number) =>
  del<void>(`/api/comments/${id}`)

/**
 * 点亮/取消一个动作。返回的是服务端重算后的最新计数，
 * 调用方直接覆盖本地状态，不要再自己 +1/-1——重复点击、并发、审核回滚都会让本地数字和库里对不上。
 */
export const setActive = (data: ActionRequest) =>
  put<ActionCounts>('/api/actions', data)

export const getActionCounts = (targetType: string, targetId: number) =>
  get<ActionCounts>('/api/actions/counts', { targetType, targetId })

/** 我的收藏：分页里是行为行，只有 targetId，标题封面要再批量查视频 */
export const myFavorites = (params?: Record<string, any>) =>
  get<PageResult<InteractAction>>('/api/actions/favorites', params)

export const listDanmaku = (videoId: number, params?: Record<string, any>) =>
  get<Danmaku[]>(`/api/danmaku/video/${videoId}`, params)

export const sendDanmaku = (data: DanmakuSendRequest) =>
  post<Danmaku>('/api/danmaku', data)

export const reportPlay = (videoId: number) =>
  post<boolean>(`/api/play-counts/${videoId}`)

export const getPlayTotals = (videoId: number) =>
  get<VideoTotals>(`/api/play-counts/${videoId}`)
