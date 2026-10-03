<template>
  <view class="container">
    <video class="player" :src="video.url" controls autoplay />
    <view class="meta">
      <text class="title">{{ video.title }}</text>
      <text class="desc">{{ video.description }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { get } from '../../utils/request'

interface VideoDetail {
  id: number
  title: string
  description: string
  url: string
}

const video = ref<VideoDetail>({
  id: 0,
  title: '',
  description: '',
  url: ''
})

async function loadVideo(id: string) {
  if (!id) return
  try {
    const detail = await get<VideoDetail>(`/api/videos/${id}`)
    video.value.id = detail.id
    video.value.title = detail.title
    video.value.description = detail.description || ''
    video.value.url = await get<string>(`/api/videos/${id}/play-url`)
  } catch (e) {
    uni.showToast({ title: String(e), icon: 'none' })
  }
}

onLoad((options) => {
  loadVideo(String(options?.id || ''))
})
</script>

<style scoped>
.container {
  background: #000;
  min-height: 100vh;
}
.player {
  width: 100vw;
  height: 420rpx;
}
.meta {
  padding: 20rpx;
  background: #fff;
}
.title {
  font-size: 36rpx;
  font-weight: bold;
}
.desc {
  font-size: 28rpx;
  color: #666;
  margin-top: 10rpx;
}
</style>
