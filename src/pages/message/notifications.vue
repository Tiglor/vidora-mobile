<template>
  <view class="notifications">
    <view class="action-bar" v-if="messages.length > 0">
      <text class="mark-all" @click="onMarkAllRead">全部已读</text>
    </view>

    <scroll-view scroll-y class="msg-list" @scrolltolower="onLoadMore">
      <view
        v-for="msg in messages"
        :key="msg.id"
        class="msg-item"
        :class="{ unread: !msg.read }"
      >
        <view class="msg-content">
          <text class="msg-text">{{ msg.content }}</text>
          <text class="msg-time">{{ msg.createTime }}</text>
        </view>
        <text class="delete-btn" @click="onDelete(msg.id)">删除</text>
      </view>
      <view class="loading-tip" v-if="loading">
        <text>加载中...</text>
      </view>
      <view class="empty-tip" v-if="!loading && messages.length === 0">
        <text>暂无通知</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getInbox, markRead, deleteMessage } from '../../api/message'
import type { MessageView } from '../../types'

const msgType = ref(0)
const messages = ref<MessageView[]>([])
const loading = ref(false)
let currentPage = 1
let hasMore = true

onLoad((query) => {
  msgType.value = Number(query?.msgType ?? 0)
  loadMessages()
})

async function loadMessages() {
  loading.value = true
  try {
    const res = await getInbox({ msgType: msgType.value, current: currentPage, size: 20 })
    messages.value.push(...res.records)
    hasMore = currentPage < res.pages
    currentPage++
  } catch { /* ignore */ }
  loading.value = false
}

function onLoadMore() {
  if (!loading.value && hasMore) loadMessages()
}

async function onMarkAllRead() {
  try {
    await markRead(msgType.value)
    messages.value.forEach(m => m.read = true)
  } catch { /* ignore */ }
}

async function onDelete(id: number) {
  try {
    await deleteMessage(id)
    messages.value = messages.value.filter(m => m.id !== id)
  } catch { /* ignore */ }
}
</script>

<style scoped>
.notifications {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}
.action-bar {
  padding: 16rpx 24rpx;
  background-color: #fff;
  text-align: right;
}
.mark-all {
  font-size: 26rpx;
  color: #4a90d9;
}
.msg-list {
  flex: 1;
}
.msg-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 24rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #f5f5f5;
}
.msg-item.unread {
  background-color: #f0f7ff;
}
.msg-content {
  flex: 1;
}
.msg-text {
  font-size: 28rpx;
  color: #333;
}
.msg-time {
  font-size: 22rpx;
  color: #bbb;
  margin-top: 8rpx;
  display: block;
}
.delete-btn {
  font-size: 24rpx;
  color: #ff4444;
  margin-left: 16rpx;
}
.loading-tip, .empty-tip {
  text-align: center;
  padding: 40rpx;
  color: #999;
  font-size: 24rpx;
}
</style>
