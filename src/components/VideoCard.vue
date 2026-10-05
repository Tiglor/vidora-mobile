<template>
  <view class="video-card" @click="$emit('click')">
    <image
      class="cover"
      :src="video.coverUrl || '/static/logo.png'"
      mode="aspectFill"
    />
    <view class="info">
      <text class="title text-ellipsis-2">{{ video.title }}</text>
      <view class="meta">
        <text class="author">{{ video.userId ? 'UP' + video.userId : '' }}</text>
        <text class="play-count" v-if="video.playCount">{{ video.playCount }}次播放</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { VideoInfo } from '../types'

defineProps<{ video: VideoInfo }>()
defineEmits(['click'])
</script>

<style scoped>
.video-card {
  display: flex;
  flex-direction: row;
  padding: 16rpx 24rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;
}
.cover {
  width: 240rpx;
  height: 160rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}
.info {
  flex: 1;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.title {
  font-size: 28rpx;
  color: #333;
  line-height: 1.4;
}
.meta {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
.author {
  font-size: 24rpx;
  color: #999;
}
.play-count {
  font-size: 22rpx;
  color: #bbb;
}
</style>
