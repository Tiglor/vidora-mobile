import { get, post, uploadFile } from '../utils/request'
import type { VideoInfo, PageResult, MultipartInitRequest, MultipartInitResult, MultipartCompleteRequest, TranscodeTask, UserInfo } from '../types'

export const listVideos = (params?: Record<string, any>) =>
  get<PageResult<VideoInfo>>('/api/videos/page', params)

/**
 * 按 id 批量取视频。服务端夹到 50 个、只回存在的行、顺序不保证，
 * 所以调用方要自己按 id 建映射再按原顺序取，别按下标对齐。
 */
export const listVideosByIds = (ids: number[]) =>
  post<VideoInfo[]>('/api/videos/batch', ids)

export const getVideo = (id: number) =>
  get<VideoInfo>(`/api/videos/${id}`)

export const getPlayUrl = (id: number) =>
  get<string>(`/api/videos/${id}/play-url`)

// UP 主被注销时，system-service 的 /users/{id} 是 code:200 + data:null，owner() 原样透传，
// 所以这里必须标成可空——当成非空就是详情页渲染函数里的第一个 TypeError。
export const getOwner = (id: number) =>
  get<UserInfo | null>(`/api/videos/${id}/owner`)

export const uploadVideo = (filePath: string, formData?: Record<string, any>) =>
  uploadFile<VideoInfo>('/api/videos/upload', filePath, 'file', formData)

export const multipartInit = (data: MultipartInitRequest) =>
  post<MultipartInitResult>('/api/videos/multipart/init', data)

export const multipartChunk = (filePath: string, formData: Record<string, any>) =>
  uploadFile<void>('/api/videos/multipart/chunk', filePath, 'chunk', formData)

export const multipartProgress = (uploadId: string) =>
  get<{ uploadedIndexes: number[] }>('/api/videos/multipart/progress', { uploadId })

export const multipartComplete = (data: MultipartCompleteRequest) =>
  post<VideoInfo>('/api/videos/multipart/complete', data)

// 后端 transcode.enabled=false 时不会有任务记录，latest() 返回 null，接口就是 data:null。
// 类型标成非空，调用方就会以为 status 一定读得到，实际取属性时抛 TypeError。
export const getTranscodeTask = (id: number) =>
  get<TranscodeTask | null>(`/api/videos/${id}/transcode-task`)
