import { get, post, put, del } from '../utils/request'
import type { MessageView, ConversationView, UnreadSummary, PageResult } from '../types'

export const getInbox = (params?: Record<string, any>) =>
  get<PageResult<MessageView>>('/api/messages', params)

export const getUnreadSummary = () =>
  get<UnreadSummary>('/api/messages/unread')

export const getThread = (peerId: number, params?: Record<string, any>) =>
  get<PageResult<MessageView>>(`/api/messages/thread/${peerId}`, params)

export const sendPrivateMessage = (data: { receiverId: number; content: string }) =>
  post<MessageView>('/api/messages/private', data)

/**
 * 标记已读，返回被标记的条数。
 * 后端绑的是 @RequestParam（msgType 必填），Spring 不从 JSON body 取值，
 * 所以这两个参数必须走查询串——放 body 里发过去就是一句「请求失败」。
 */
export const markRead = (msgType: number, peerId?: number) =>
  put<number>(
    `/api/messages/read?msgType=${msgType}${peerId == null ? '' : `&peerId=${peerId}`}`
  )

/** 后端是 ApiResult<Void>，data 恒为 null，别指望拿返回值判断成败 */
export const deleteMessage = (id: number) =>
  del<void>(`/api/messages/${id}`)

export const getConversations = (params?: Record<string, any>) =>
  get<PageResult<ConversationView>>('/api/conversations', params)

export const markConversationRead = (peerId: number) =>
  put<number>(`/api/conversations/${peerId}/read`)
