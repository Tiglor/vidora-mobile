<template>
  <view class="profile">
    <view v-if="!isLoggedIn" class="login-prompt">
      <view class="avatar-large">
        <text>?</text>
      </view>
      <text class="prompt-text">登录后享受更多功能</text>
      <view class="login-btn" @click="goLogin">
        <text>去登录</text>
      </view>
    </view>

    <view v-else>
      <view class="user-header">
        <view class="avatar-large">
          <text>{{ nickname.charAt(0) || '?' }}</text>
        </view>
        <view class="user-info">
          <text class="nickname">{{ nickname }}</text>
          <text class="user-id">ID: {{ userId }}</text>
        </view>
      </view>

      <view class="segment-bar">
        <text
          class="segment-item"
          :class="{ active: activeTab === 'videos' }"
          @click="activeTab = 'videos'"
        >我的视频</text>
        <text
          class="segment-item"
          :class="{ active: activeTab === 'favorites' }"
          @click="switchToFavorites"
        >我的收藏</text>
      </view>

      <scroll-view scroll-y class="video-list" @scrolltolower="onLoadMore">
        <VideoCard
          v-for="item in shownList"
          :key="item.id"
          :video="item"
          @click="onVideoClick(item)"
        />
        <view class="loading-tip" v-if="shownLoading">
          <text>加载中...</text>
        </view>
        <view class="empty-tip" v-if="!shownLoading && shownList.length === 0">
          <text>{{ activeTab === 'videos' ? '暂无上传' : '暂无收藏' }}</text>
        </view>
      </scroll-view>

      <view class="actions">
        <view class="action-item" @click="goUpload">
          <text>上传视频</text>
        </view>
        <view class="action-item logout" @click="onLogout">
          <text>退出登录</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import VideoCard from '../../components/VideoCard.vue'
import { useUserStore } from '../../stores/user'
import { useMessageStore } from '../../stores/message'
import { usePagination } from '../../composables/usePagination'
import { listVideos, listVideosByIds } from '../../api/video'
import { myFavorites } from '../../api/interact'
import type { VideoInfo } from '../../types'

const userStore = useUserStore()
const messageStore = useMessageStore()
const isLoggedIn = computed(() => userStore.isLoggedIn)
const nickname = computed(() => userStore.nickname)
const userId = computed(() => userStore.userId)

const activeTab = ref<'videos' | 'favorites'>('videos')

const { list: videoList, loading, hasMore, refresh, loadMore } = usePagination<VideoInfo>(
  (page, size) => listVideos({ current: page, size }),
  { pageSize: 10 }
)

const { list: favList, loading: favLoading, refresh: refreshFav, loadMore: loadMoreFav } = usePagination<VideoInfo>(
  async (page, size) => {
    // /actions/favorites 分页装的是 interact_action 行为行，只有 targetId；
    // 标题封面在 video 库，所以拿完这一页再一次性批量补全，别逐条 getVideo
    const res = await myFavorites({ current: page, size })
    const ids = res.records.map(r => r.targetId)
    const videos = ids.length ? await listVideosByIds(ids) : []
    const byId = new Map(videos.map(v => [v.id, v] as [number, VideoInfo]))
    // 保持 interact 给的收藏时间倒序；视频已下架的补不到，就地跳过
    return { ...res, records: ids.map(id => byId.get(id)).filter((v): v is VideoInfo => !!v) }
  },
  { pageSize: 10 }
)

const shownList = computed(() => (activeTab.value === 'videos' ? videoList.value : favList.value))
const shownLoading = computed(() => (activeTab.value === 'videos' ? loading.value : favLoading.value))

onShow(() => {
  if (isLoggedIn.value) {
    if (activeTab.value === 'videos') {
      refresh()
    } else {
      refreshFav()
    }
  }
})

function switchToFavorites() {
  activeTab.value = 'favorites'
  refreshFav()
}

function onLoadMore() {
  if (activeTab.value === 'videos') {
    loadMore()
  } else {
    loadMoreFav()
  }
}

function goLogin() {
  uni.navigateTo({ url: '/pages/login/login' })
}

function goUpload() {
  uni.navigateTo({ url: '/pages/upload/upload' })
}

function onVideoClick(item: VideoInfo) {
  uni.navigateTo({ url: `/pages/video/detail?id=${item.id}` })
}

function onLogout() {
  userStore.logout()
  messageStore.stopPolling()
  uni.reLaunch({ url: '/pages/home/home' })
}
</script>

<style scoped>
.profile {
  min-height: 100vh;
  background-color: #f5f5f5;
}
.login-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}
.avatar-large {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background-color: #4a90d9;
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar-large text {
  color: #fff;
  font-size: 48rpx;
}
.prompt-text {
  margin-top: 24rpx;
  font-size: 28rpx;
  color: #999;
}
.login-btn {
  margin-top: 32rpx;
  padding: 16rpx 64rpx;
  background-color: #4a90d9;
  border-radius: 32rpx;
}
.login-btn text {
  color: #fff;
  font-size: 28rpx;
}
.user-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 32rpx 24rpx;
  background-color: #fff;
}
.user-info {
  margin-left: 24rpx;
}
.nickname {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}
.user-id {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}
.segment-bar {
  display: flex;
  flex-direction: row;
  background-color: #fff;
  margin-top: 16rpx;
  border-bottom: 1rpx solid #eee;
}
.segment-item {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  font-size: 28rpx;
  color: #666;
  border-bottom: 4rpx solid transparent;
}
.segment-item.active {
  color: #333;
  font-weight: bold;
  border-bottom-color: #333;
}
.video-list {
  min-height: 400rpx;
}
.actions {
  margin-top: 32rpx;
  background-color: #fff;
}
.action-item {
  padding: 28rpx 24rpx;
  font-size: 28rpx;
  color: #333;
  border-bottom: 1rpx solid #f5f5f5;
  text-align: center;
}
.action-item.logout {
  color: #ff4444;
}
.loading-tip, .empty-tip {
  text-align: center;
  padding: 40rpx;
  color: #999;
  font-size: 24rpx;
}
</style>
