export interface LoginVO {
  token: string
  userId: number
  nickname: string
  avatarUrl?: string
  roles?: string[]
  permissions?: string[]
}

export interface VideoInfo {
  id: number
  title: string
  description?: string
  coverUrl?: string
  /** 播放地址只有 /videos/{id}/play-url 给，实体上没有 url 字段 */
  hlsUrl?: string
  videoKey?: string
  duration?: number
  width?: number
  height?: number
  fileSize?: number
  userId: number
  categoryId?: number
  playCount?: number
  likeCount?: number
  commentCount?: number
  shareCount?: number
  /** 收藏数在 interact 的 ActionCounts 上，video_info 表里没有这一列 */
  status?: number
  visibility?: number
  publishTime?: string
}

export interface PageResult<T> {
  records: T[]
  total: number
  current: number
  size: number
  pages: number
}

export interface ActionCounts {
  targetType: string
  targetId: number
  likeCount: number
  favoriteCount: number
  shareCount: number
  liked: boolean
  favorited: boolean
}

export interface ActionRequest {
  targetType: string
  targetId: number
  actionType: number
  active: boolean
}

/**
 * interact_action 行本身。/actions/favorites 分页装的是它，
 * 里面只有 targetId，没有标题封面——要展示成视频卡片必须再批量查一次视频。
 */
export interface InteractAction {
  id: number
  userId: number
  targetType: string
  targetId: number
  /** 1-点赞 2-收藏 3-分享 */
  actionType: number
  /** 1-生效 0-已取消 */
  status: number
  createTime?: string
}

export interface CommentView {
  id: number
  videoId: number
  userId: number
  nickname?: string
  avatarUrl?: string
  parentId?: number
  rootId?: number
  content: string
  likeCount: number
  replyCount?: number
  createTime: string
  replies?: CommentView[]
}

export interface CommentCreateRequest {
  videoId: number
  content: string
  parentId?: number
}

export interface Danmaku {
  id: number
  videoId: number
  userId: number
  content: string
  appearTime: number
  color: string
  fontSize: number
  position: number
  status?: number
}

export interface DanmakuSendRequest {
  videoId: number
  content: string
  appearTime: number
  color?: string
  fontSize?: number
  position?: number
}

export interface VideoTotals {
  videoId: number
  playCount: number
  likeCount: number
  commentCount: number
  shareCount: number
}

export interface ConversationView {
  conversationId?: number
  peerId: number
  peerNickname?: string
  peerAvatarUrl?: string
  lastMsgContent?: string
  lastMsgTime?: string
  unreadCount: number
}

export interface MessageView {
  id: number
  msgType: number
  senderId: number
  receiverId: number
  content: string
  extra?: string
  read: boolean
  createTime: string
}

export interface UnreadSummary {
  systemCount: number
  interactCount: number
  privateCount: number
  total: number
  conversationCount: number
}

export interface Category {
  id: number
  name: string
  parentId?: number
  iconUrl?: string
  /** 后端是 sortOrder（content_category.sort_order），不叫 sort */
  sortOrder?: number
  status?: number
  /** 只有 /categories/tree 会带；/categories/list 是平铺的，没有这个字段 */
  children?: Category[]
}

export interface HotSearch {
  id: number
  keyword: string
  /** 后端字段名是 heat_score。这里以前写的 heat 在响应里根本不存在，热搜榜的热度列一直是空的 */
  heatScore: number
  rank: number
  searchCount?: number
  status?: number
  rankDate?: string
}

export interface Tag {
  id: number
  name: string
  useCount?: number
}

export interface RecommendResult {
  id: number
  userId: number
  videoId: number
  scene: string
  score?: number
  algoType?: string
  /** 后端是 tinyint 0/1，不是布尔 */
  isExposed?: number
  isClicked?: number
}

export interface SearchHistory {
  id: number
  keyword: string
  searchCount: number
  lastSearchTime: string
}

export interface SearchSuggest {
  id: number
  keyword: string
  weight?: number
  /** 词来源档位，后端是 int */
  source?: number
}

export interface MultipartInitRequest {
  fileName: string
  fileHash?: string
  fileSize: number
  chunkSize: number
}

export interface MultipartInitResult {
  uploadId: string
  totalChunks: number
  chunkSize: number
  instant: boolean
  uploadedIndexes: number[]
}

export interface MultipartCompleteRequest {
  uploadId: string
  title?: string
  description?: string
  categoryId?: number
}

export interface TranscodeTask {
  id: number
  videoId: number
  /** 0-待处理 1-处理中 2-成功 3-失败（video_transcode_task.status，与 video_info.status 的档位不是一套） */
  status: number
  progress: number
  /** 失败原因，只有 status=3 时后端才写 */
  errorMsg?: string | null
}

/** GET /videos/{id}/owner 的出口，对应后端 RemoteUserDTO——只有这四个字段 */
export interface UserInfo {
  id: number
  nickname: string
  avatarUrl?: string
  status?: number
}
