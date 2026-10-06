import { get, post, uploadFile } from '../utils/request'
import type { VideoInfo, PageResult, TranscodeTask, UserInfo } from '../types'

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

/**
 * 单次整片上传，打到 video-service 的 POST /videos/upload（服务端 max-file-size 2GB）。
 *
 * 没用 /videos/multipart/*：init 的 fileHash 是 @NotBlank，且要求 32~64 位十六进制
 * （MultipartInitRequest:35-38），本端拿不到整文件字节算摘要，而传个假哈希会让秒传按
 * (hash, size) 命中别人的 blob。代价是断点续传在移动端不可用，中断了得整片重传。
 */
const UPLOAD_TIMEOUT_MS = 30 * 60 * 1000

export const uploadVideo = (
  filePath: string,
  formData?: Record<string, any>,
  onProgress?: (percent: number) => void
) => uploadFile<VideoInfo>('/api/videos/upload', filePath, 'file', formData, {
  onProgress,
  timeoutMs: UPLOAD_TIMEOUT_MS,
})

// 后端 transcode.enabled=false 时不会有任务记录，latest() 返回 null，接口就是 data:null。
// 类型标成非空，调用方就会以为 status 一定读得到，实际取属性时抛 TypeError。
export const getTranscodeTask = (id: number) =>
  get<TranscodeTask | null>(`/api/videos/${id}/transcode-task`)
