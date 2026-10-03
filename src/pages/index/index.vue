<template>
  <view class="container">
    <text class="title">视频推荐</text>
    <view class="video-list">
      <view class="video-item" v-for="item in videoList" :key="item.id" @click="goDetail(item.id)">
        <image class="cover" :src="item.coverUrl || '/static/logo.png'" mode="aspectFill" />
        <view class="info">
          <text class="name">{{ item.title }}</text>
          <text class="author">UP主 ID：{{ item.userId }}</text>
          <text class="play">播放 {{ item.playCount || 0 }}</text>
        </view>
      </view>
    </view>
    <view v-if="!videoList.length" class="empty">暂无视频，请先上传</view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { get } from '../../utils/request'

interface VideoItem {
  id: number
  title: string
  coverUrl: string
  userId: number
  playCount: number
}

const videoList = ref<VideoItem[]>([])

onMounted(async () => {
  try {
    const page = await get<{ records: VideoItem[] }>('/api/videos/page?size=20')
    videoList.value = page.records || []
  } catch (e) {
    uni.showToast({ title: String(e), icon: 'none' })
  }
})

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/video/detail?id=${id}` })
}
</script>

<style scoped>
.container {
  padding: 20rpx;
}
.title {
  font-size: 40rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}
.video-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.video-item {
  display: flex;
  background: #fff;
  border-radius: 12rpx;
  overflow: hidden;
}
.cover {
  width: 240rpx;
  height: 180rpx;
}
.info {
  flex: 1;
  padding: 16rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.name {
  font-size: 32rpx;
  color: #333;
}
.author {
  font-size: 26rpx;
  color: #999;
  margin-top: 10rpx;
}
.play {
  font-size: 24rpx;
  color: #bbb;
  margin-top: 6rpx;
}
.empty {
  text-align: center;
  color: #999;
  margin-top: 80rpx;
}
</style>
