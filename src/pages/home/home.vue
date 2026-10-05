<template>
  <view class="home">
    <scroll-view
      scroll-x
      class="category-bar"
      v-if="categories.length"
    >
      <view
        v-for="cat in categories"
        :key="cat.id"
        class="category-item"
        :class="{ active: activeCategoryId === cat.id }"
        @click="onCategoryClick(cat.id)"
      >
        <text>{{ cat.name }}</text>
      </view>
    </scroll-view>

    <scroll-view
      scroll-y
      class="video-list"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMore"
    >
      <VideoCard
        v-for="item in list"
        :key="item.id"
        :video="item"
        @click="onVideoClick(item)"
      />
      <view class="loading-tip" v-if="loading">
        <text>加载中...</text>
      </view>
      <view class="loading-tip" v-if="!hasMore && list.length > 0">
        <text>没有更多了</text>
      </view>
      <view class="empty" v-if="!loading && list.length === 0">
        <text>暂无视频</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import VideoCard from '../../components/VideoCard.vue'
import { usePagination } from '../../composables/usePagination'
import { listVideos, getVideo } from '../../api/video'
import { useDictStore } from '../../stores/dict'
import { getFeed, reportClick } from '../../api/recommend'
import type { VideoInfo } from '../../types'

// 分区是全站字典，和上传页共用 store 里那一份
const dict = useDictStore()
const categories = computed(() => dict.categories)
const activeCategoryId = ref<number | null>(null)
const refreshing = ref(false)

const { list, loading, hasMore, refresh, loadMore } = usePagination<VideoInfo>(
  async (page, size) => {
    return listVideos({ current: page, size, categoryId: activeCategoryId.value || undefined })
  },
  { pageSize: 10 }
)

onMounted(async () => {
  try {
    await dict.loadCategories()
  } catch { /* 分区拉不到不影响列表，频道条留空 */ }
  await refresh()
})

let firstShow = true
onShow(() => {
  if (!firstShow) return
  firstShow = false
})

function onCategoryClick(id: number) {
  activeCategoryId.value = activeCategoryId.value === id ? null : id
  refresh()
}

async function onRefresh() {
  refreshing.value = true
  await refresh()
  refreshing.value = false
}

function onLoadMore() {
  loadMore()
}

function onVideoClick(item: VideoInfo) {
  uni.navigateTo({ url: `/pages/video/detail?id=${item.id}` })
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.category-bar {
  white-space: nowrap;
  background-color: #fff;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #eee;
}
.category-item {
  display: inline-block;
  padding: 8rpx 28rpx;
  font-size: 26rpx;
  color: #666;
  border-radius: 24rpx;
  margin: 0 12rpx;
  background-color: #f5f5f5;
}
.category-item.active {
  background-color: #333;
  color: #fff;
}
.video-list {
  flex: 1;
}
.loading-tip {
  text-align: center;
  padding: 24rpx;
  color: #999;
  font-size: 24rpx;
}
.empty {
  text-align: center;
  padding: 120rpx 0;
  color: #ccc;
  font-size: 28rpx;
}
</style>
