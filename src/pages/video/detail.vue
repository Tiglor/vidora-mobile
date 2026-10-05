<template>
  <view class="container">
    <view class="player-wrapper">
      <video
        v-if="playUrl"
        class="player"
        :src="playUrl"
        controls
        autoplay
        @timeupdate="onTimeUpdate"
      />
      <view v-else class="player player-tip">
        <text class="tip-text">{{ statusTip }}</text>
      </view>
      <DanmakuOverlay v-if="playUrl" :danmakuList="danmakuList" :currentTime="currentTime" />
    </view>

    <view class="danmaku-input">
      <input
        v-model="danmakuText"
        placeholder="发送弹幕..."
        class="danmaku-field"
        @confirm="sendDanmakuMsg"
      />
      <button class="danmaku-btn" @click="sendDanmakuMsg">发送</button>
    </view>

    <view class="video-info">
      <text class="title">{{ video.title }}</text>
      <view class="stats">
        <text class="stat">{{ formatCount(stats.playCount) }}播放</text>
        <text class="stat">{{ formatCount(stats.likeCount) }}点赞</text>
        <text class="stat">{{ formatCount(stats.commentCount) }}评论</text>
      </view>
      <view class="owner">
        <view class="owner-avatar">
          <text class="owner-avatar-text">{{ owner.nickname?.charAt(0) || 'UP' }}</text>
        </view>
        <text class="owner-name">{{ owner.nickname || 'UP主' }}</text>
      </view>
      <text class="desc" :class="{ expanded: descExpanded }" @click="descExpanded = !descExpanded">
        {{ video.description || '暂无简介' }}
      </text>
    </view>

    <view class="actions">
      <view class="action-btn" @click="toggleLike">
        <text class="action-icon">{{ actionCounts.liked ? '❤' : '♡' }}</text>
        <text class="action-count">{{ actionCounts.likeCount || 0 }}</text>
      </view>
      <view class="action-btn" @click="toggleFavorite">
        <text class="action-icon">{{ actionCounts.favorited ? '★' : '☆' }}</text>
        <text class="action-count">{{ actionCounts.favoriteCount || 0 }}</text>
      </view>
      <view class="action-btn" @click="share">
        <text class="action-icon">↗</text>
        <text class="action-count">{{ actionCounts.shareCount || 0 }}</text>
      </view>
    </view>

    <view class="related">
      <text class="section-title">相关推荐</text>
      <scroll-view scroll-x class="related-scroll">
        <view v-for="item in relatedVideos" :key="item.id" class="related-item" @click="goVideo(item.id)">
          <image :src="item.coverUrl" class="related-cover" mode="aspectFill" />
          <text class="related-title">{{ item.title }}</text>
        </view>
      </scroll-view>
    </view>

    <view class="comments">
      <text class="section-title">评论 ({{ stats.commentCount }})</text>
      <view class="comment-input">
        <input
          v-model="commentText"
          :placeholder="replyTo ? `回复 用户#${replyTo.userId}...` : '发表评论...'"
          class="comment-field"
          @confirm="submitComment"
        />
        <button class="comment-btn" @click="submitComment">发送</button>
      </view>
      <scroll-view scroll-y class="comment-list">
        <CommentItem
          v-for="comment in comments"
          :key="comment.id"
          :comment="comment"
          @reply="setReply"
          @loadMore="loadReplies"
        />
        <view v-if="comments.length === 0" class="empty">暂无评论</view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getVideo, getPlayUrl, getOwner, listVideosByIds } from '../../api/video'
import {
  listComments,
  listReplies,
  createComment,
  getActionCounts,
  getPlayTotals,
  setActive,
  listDanmaku,
  sendDanmaku,
  reportPlay
} from '../../api/interact'
import { getFeed, reportClick } from '../../api/recommend'
import { useUserStore } from '../../stores/user'
import type { VideoInfo, UserInfo, ActionCounts, CommentView, Danmaku, VideoTotals } from '../../types'
import CommentItem from '../../components/CommentItem.vue'
import DanmakuOverlay from '../../components/DanmakuOverlay.vue'

const userStore = useUserStore()

const videoId = ref(0)
const video = ref<VideoInfo>({ id: 0, title: '', userId: 0 })
const playUrl = ref('')
const owner = ref<UserInfo>({ id: 0, nickname: '' })
const actionCounts = ref<ActionCounts>({
  targetType: 'video',
  targetId: 0,
  likeCount: 0,
  favoriteCount: 0,
  shareCount: 0,
  liked: false,
  favorited: false
})
const comments = ref<CommentView[]>([])
/**
 * 播放/点赞/评论的真实累计值在 interact 的按天统计表里（GET /api/play-counts/{id}）；
 * video_info 上的那几个计数列只在建视频时写 0，没有任何写入方，直接显示就是一片 0。
 */
const totals = ref<VideoTotals | null>(null)
const stats = computed(() => ({
  playCount: totals.value?.playCount ?? video.value.playCount,
  likeCount: actionCounts.value.likeCount ?? totals.value?.likeCount ?? video.value.likeCount,
  commentCount: totals.value?.commentCount ?? video.value.commentCount
}))
// video_info.status：0-上传中 1-转码中 2-审核中 3-已发布 4-已下架
const statusTip = computed(() => {
  switch (video.value.status) {
    case 2:
      return '该视频正在审核中，暂不可播放'
    case 4:
      return '该视频已下架'
    case 3:
      return '该视频暂无可播放地址'
    default:
      return '视频还在处理中，请稍后刷新重试'
  }
})
const danmakuList = ref<Danmaku[]>([])
const currentTime = ref(0)
const relatedVideos = ref<VideoInfo[]>([])
/** 相关推荐的 videoId → 推荐记录 id，点击时回传给推荐服务用 */
const clickTargets = ref<Map<number, number>>(new Map())
const descExpanded = ref(false)
const commentText = ref('')
const replyTo = ref<CommentView | null>(null)
const danmakuText = ref('')

function onTimeUpdate(e: any) {
  currentTime.value = e.detail.currentTime || 0
}

function formatCount(count?: number) {
  if (!count) return '0'
  if (count >= 10000) return (count / 10000).toFixed(1) + '万'
  return String(count)
}

async function loadVideo(id: number) {
  try {
    video.value = await getVideo(id)
    // 与 web 端 VideoDetailView 同口径：只有「已发布(3)」才去取播放地址。
    // 0/1 是还没处理完，2 审核中、4 已下架压根不该对外播放，
    // 而后端 getPlayUrl 不看状态、没转码时会直接回源文件地址。
    playUrl.value = video.value.status === 3 ? await getPlayUrl(id) : ''
    // 拿不到 UP 主（用户已注销）就留着占位值：模板里的「UP主」兜底只有在 owner 非空时才生效
    const ownerInfo = await getOwner(id)
    if (ownerInfo) owner.value = ownerInfo
    actionCounts.value = await getActionCounts('video', id)
    comments.value = (await listComments(id, { current: 1, size: 20 })).records
    danmakuList.value = await listDanmaku(id)
    await reportPlay(id)

    const feed = await getFeed('detail', 10)
    const candidates = feed.filter(r => r.videoId !== id).slice(0, 6)
    const videoIds = candidates.map(r => r.videoId)
    // 一次批量拿，别逐条 getVideo：逐条的话任意一条视频被删就整体 reject，
    // 整屏相关推荐跟着消失；batch 只回存在的行，缺几条正好就地跳过
    const details = await listVideosByIds(videoIds)
    const byId = new Map(details.map(v => [v.id, v] as [number, VideoInfo]))
    relatedVideos.value = videoIds
      .map(vid => byId.get(vid))
      .filter((v): v is VideoInfo => !!v)
    // 记住「视频 → 推荐记录 id」，点进去时才有东西可回传给推荐服务
    clickTargets.value = new Map(candidates.map(r => [r.videoId, r.id] as [number, number]))
    // 计数是纯展示数据，放最后取：它挂了不该把前面已经加载好的内容一起废掉
    totals.value = await getPlayTotals(id)
  } catch (e) {
    uni.showToast({ title: String(e), icon: 'none' })
  }
}

async function toggleLike() {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  // 服务端算完直接把最新计数拿回来覆盖，前端不要再 +1/-1
  actionCounts.value = await setActive({
    targetType: 'video',
    targetId: videoId.value,
    actionType: 1,
    active: !actionCounts.value.liked
  })
}

async function toggleFavorite() {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  actionCounts.value = await setActive({
    targetType: 'video',
    targetId: videoId.value,
    actionType: 2,
    active: !actionCounts.value.favorited
  })
}

function share() {
  uni.setClipboardData({
    data: `https://vidora.com/video/${videoId.value}`,
    success: () => {
      uni.showToast({ title: '链接已复制', icon: 'success' })
      // 未登录不能上报：setActive 要 userId，401 会被 request.ts 当成 token 失效跳登录页
      if (!userStore.isLoggedIn) return
      // 分享只增不减（后端也拦了取消分享），计数交给服务端算
      setActive({ targetType: 'video', targetId: videoId.value, actionType: 3, active: true })
        .then(counts => { actionCounts.value = counts })
        .catch(() => { /* 计数上报失败不该把「已复制」改成报错 */ })
    }
  })
}

function setReply(comment: CommentView) {
  replyTo.value = comment
}

async function submitComment() {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  if (!commentText.value.trim()) return
  try {
    await createComment({
      videoId: videoId.value,
      content: commentText.value,
      parentId: replyTo.value?.id
    })
    commentText.value = ''
    replyTo.value = null
    comments.value = (await listComments(videoId.value, { current: 1, size: 20 })).records
    // 就地 +1：totals 那侧有缓存，等它过期再纠正
    if (totals.value) totals.value.commentCount += 1
  } catch (e) {
    uni.showToast({ title: String(e), icon: 'none' })
  }
}

async function loadReplies(comment: CommentView) {
  const replies = await listReplies(comment.id, { current: 1, size: 10 })
  comment.replies = replies.records
}

async function sendDanmakuMsg() {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  if (!danmakuText.value.trim()) return
  try {
    await sendDanmaku({
      videoId: videoId.value,
      content: danmakuText.value,
      appearTime: currentTime.value
    })
    danmakuText.value = ''
    danmakuList.value = await listDanmaku(videoId.value)
  } catch (e) {
    uni.showToast({ title: String(e), icon: 'none' })
  }
}

function goVideo(id: number) {
  const recommendId = clickTargets.value.get(id)
  if (recommendId) {
    // 回传点击是推荐闭环里唯一的学习信号，吞掉异常：跳过去看视频才是用户要的事
    reportClick(recommendId).catch(() => { /* 上报失败不影响跳转 */ })
  }
  uni.navigateTo({ url: `/pages/video/detail?id=${id}` })
}

onLoad((options) => {
  videoId.value = Number(options?.id || 0)
  if (videoId.value) loadVideo(videoId.value)
})
</script>

<style scoped>
.container {
  background: #fff;
  min-height: 100vh;
}
.player-wrapper {
  position: relative;
  width: 100vw;
  height: 420rpx;
}
.player {
  width: 100%;
  height: 100%;
}
/* 没有播放地址时占住播放器的位置，别让整块塌成一个黑条 */
.player-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
}
.tip-text {
  color: #b8b8b8;
  font-size: 26rpx;
}
.danmaku-input {
  display: flex;
  padding: 16rpx 20rpx;
  background: #f5f5f5;
  gap: 16rpx;
}
.danmaku-field {
  flex: 1;
  height: 60rpx;
  background: #fff;
  border-radius: 30rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
}
.danmaku-btn {
  height: 60rpx;
  line-height: 60rpx;
  padding: 0 30rpx;
  background: #ff2442;
  color: #fff;
  border-radius: 30rpx;
  font-size: 28rpx;
}
.video-info {
  padding: 20rpx;
}
.title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
}
.stats {
  display: flex;
  gap: 20rpx;
  margin-bottom: 16rpx;
}
.stat {
  font-size: 24rpx;
  color: #999;
}
.owner {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}
.owner-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 30rpx;
  background: #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
}
.owner-avatar-text {
  font-size: 28rpx;
  color: #666;
}
.owner-name {
  font-size: 28rpx;
  color: #333;
}
.desc {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.desc.expanded {
  -webkit-line-clamp: unset;
}
.actions {
  display: flex;
  justify-content: space-around;
  padding: 20rpx;
  border-top: 1rpx solid #f0f0f0;
  border-bottom: 1rpx solid #f0f0f0;
}
.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}
.action-icon {
  font-size: 48rpx;
  color: #ff2442;
}
.action-count {
  font-size: 24rpx;
  color: #666;
}
.related {
  padding: 20rpx;
}
.section-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
}
.related-scroll {
  white-space: nowrap;
}
.related-item {
  display: inline-block;
  width: 240rpx;
  margin-right: 16rpx;
}
.related-cover {
  width: 240rpx;
  height: 160rpx;
  border-radius: 8rpx;
}
.related-title {
  font-size: 26rpx;
  color: #333;
  margin-top: 8rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: normal;
}
.comments {
  padding: 20rpx;
}
.comment-input {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}
.comment-field {
  flex: 1;
  height: 60rpx;
  background: #f5f5f5;
  border-radius: 30rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
}
.comment-btn {
  height: 60rpx;
  line-height: 60rpx;
  padding: 0 30rpx;
  background: #ff2442;
  color: #fff;
  border-radius: 30rpx;
  font-size: 28rpx;
}
.comment-list {
  max-height: 600rpx;
}
.empty {
  text-align: center;
  padding: 40rpx;
  color: #999;
  font-size: 28rpx;
}
</style>
