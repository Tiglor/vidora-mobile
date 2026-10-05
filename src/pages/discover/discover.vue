<template>
  <view class="discover">
    <view class="search-bar">
      <input
        class="search-input"
        placeholder="搜索视频"
        :value="keyword"
        @input="onInput"
        @confirm="onSearch"
      />
      <text class="search-btn" @click="onSearch">搜索</text>
    </view>

    <scroll-view
      v-if="showSuggestions && suggestions.length"
      class="suggestions"
      scroll-y
    >
      <view
        v-for="(s, i) in suggestions"
        :key="i"
        class="suggestion-item"
        @click="onSuggestionClick(s.keyword)"
      >
        <text>{{ s.keyword }}</text>
      </view>
    </scroll-view>

    <scroll-view
      v-if="!searching"
      class="content-area"
      scroll-y
    >
      <view v-if="!keyword" class="section">
        <view class="section-header">
          <text class="section-title">热搜榜</text>
        </view>
        <view
          v-for="(h, i) in hotSearches"
          :key="h.id"
          class="hot-item"
          @click="onSuggestionClick(h.keyword)"
        >
          <text class="hot-rank" :class="{ top3: i < 3 }">{{ i + 1 }}</text>
          <text class="hot-keyword">{{ h.keyword }}</text>
          <text class="hot-heat">{{ h.heatScore }}</text>
        </view>
        <view v-if="hotSearches.length === 0" class="empty-tip">
          <text>暂无热搜</text>
        </view>
      </view>

      <view v-if="!keyword" class="section">
        <view class="section-header">
          <text class="section-title">搜索历史</text>
          <text class="clear-btn" @click="onClearHistory">清空</text>
        </view>
        <view class="history-tags">
          <view
            v-for="h in history"
            :key="h.id"
            class="history-tag"
            @click="onSuggestionClick(h.keyword)"
          >
            <text>{{ h.keyword }}</text>
            <text class="tag-close" @click.stop="onDeleteHistory(h.id)">×</text>
          </view>
        </view>
        <view v-if="history.length === 0" class="empty-tip">
          <text>暂无搜索历史</text>
        </view>
      </view>
    </scroll-view>

    <scroll-view
      v-if="searching && searchDone"
      class="content-area"
      scroll-y
      @scrolltolower="onLoadMore"
    >
      <VideoCard
        v-for="item in resultList"
        :key="item.id"
        :video="item"
        @click="onVideoClick(item)"
      />
      <view class="loading-tip" v-if="resultLoading">
        <text>加载中...</text>
      </view>
      <view class="empty-tip" v-if="!resultLoading && resultList.length === 0">
        <text>未找到相关视频</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import VideoCard from '../../components/VideoCard.vue'
import { usePagination } from '../../composables/usePagination'
import { useDebounce } from '../../composables/useDebounce'
import { getSearchSuggests, getSearchHistory, removeSearchHistory, clearSearchHistory, recordSearch } from '../../api/search'
import { getHotSearches } from '../../api/content'
import { listVideos } from '../../api/video'
import type { SearchSuggest, HotSearch, SearchHistory, VideoInfo } from '../../types'

const keyword = ref('')
const suggestions = ref<SearchSuggest[]>([])
const showSuggestions = ref(false)
const hotSearches = ref<HotSearch[]>([])
const history = ref<SearchHistory[]>([])
const searching = ref(false)
const searchDone = ref(false)

const { list: resultList, total: resultTotal, loading: resultLoading, hasMore, refresh: refreshResults, loadMore } = usePagination<VideoInfo>(
  (page, size) => listVideos({ current: page, size, keyword: keyword.value }),
  { pageSize: 10 }
)

onMounted(() => {
  loadHotSearches()
  loadHistory()
})

onShow(() => {
  loadHistory()
})

async function loadHotSearches() {
  try {
    hotSearches.value = await getHotSearches()
  } catch { /* ignore */ }
}

async function loadHistory() {
  try {
    const res = await getSearchHistory({ current: 1, size: 20 })
    history.value = res.records
  } catch { /* ignore */ }
}

const fetchSuggestions = useDebounce(async (prefix: string) => {
  try {
    suggestions.value = await getSearchSuggests(prefix, 10)
    showSuggestions.value = suggestions.value.length > 0
  } catch {
    suggestions.value = []
    showSuggestions.value = false
  }
}, 300)

function onInput(e: any) {
  keyword.value = e.detail.value
  if (keyword.value.trim()) {
    fetchSuggestions(keyword.value.trim())
  } else {
    suggestions.value = []
    showSuggestions.value = false
    searching.value = false
    searchDone.value = false
  }
}

async function onSearch() {
  const kw = keyword.value.trim()
  if (!kw) return
  showSuggestions.value = false
  searching.value = true
  searchDone.value = false
  await refreshResults()
  searchDone.value = true
  try {
    // 上报的是后端给的总命中数，不是这一页的条数。
    // resultCount 进的是当天全站词频的「平均结果数」和内容缺口分析，
    // 用 resultList.length 的话最多只能报到 pageSize(10)，同一个词从 web 报 250、从这里报 10，统计就没法看了。
    await recordSearch(kw, resultTotal.value)
    await loadHistory()
  } catch { /* ignore */ }
}

function onSuggestionClick(kw: string) {
  keyword.value = kw
  showSuggestions.value = false
  onSearch()
}

async function onDeleteHistory(id: number) {
  try {
    await removeSearchHistory(id)
    await loadHistory()
  } catch { /* ignore */ }
}

async function onClearHistory() {
  try {
    await clearSearchHistory()
    history.value = []
  } catch { /* ignore */ }
}

function onLoadMore() {
  loadMore()
}

function onVideoClick(item: VideoInfo) {
  uni.navigateTo({ url: `/pages/video/detail?id=${item.id}` })
}
</script>

<style scoped>
.discover {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}
.search-bar {
  display: flex;
  flex-direction: row;
  padding: 16rpx 24rpx;
  background-color: #fff;
  align-items: center;
}
.search-input {
  flex: 1;
  height: 64rpx;
  background-color: #f5f5f5;
  border-radius: 32rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
}
.search-btn {
  margin-left: 16rpx;
  font-size: 28rpx;
  color: #333;
  padding: 8rpx 16rpx;
}
.suggestions {
  background-color: #fff;
  max-height: 400rpx;
  border-bottom: 1rpx solid #eee;
}
.suggestion-item {
  padding: 20rpx 32rpx;
  font-size: 28rpx;
  color: #333;
  border-bottom: 1rpx solid #f5f5f5;
}
.content-area {
  flex: 1;
}
.section {
  background-color: #fff;
  margin-top: 16rpx;
  padding: 24rpx;
}
.section-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}
.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}
.clear-btn {
  font-size: 24rpx;
  color: #999;
}
.hot-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 16rpx 0;
}
.hot-rank {
  width: 48rpx;
  font-size: 28rpx;
  color: #999;
  text-align: center;
}
.hot-rank.top3 {
  color: #ff4444;
  font-weight: bold;
}
.hot-keyword {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  margin-left: 16rpx;
}
.hot-heat {
  font-size: 22rpx;
  color: #bbb;
}
.history-tags {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
.history-tag {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8rpx 20rpx;
  background-color: #f5f5f5;
  border-radius: 24rpx;
  margin: 8rpx 12rpx 8rpx 0;
  font-size: 24rpx;
  color: #666;
}
.tag-close {
  margin-left: 8rpx;
  color: #ccc;
  font-size: 28rpx;
}
.loading-tip, .empty-tip {
  text-align: center;
  padding: 40rpx;
  color: #999;
  font-size: 24rpx;
}
</style>
