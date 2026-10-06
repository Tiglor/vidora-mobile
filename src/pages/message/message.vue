<template>
  <view class="message-page">
    <view class="section">
      <view class="section-header">
        <text class="section-title">私聊消息</text>
        <text class="badge" v-if="unread && unread.privateCount > 0">{{ unread.privateCount }}</text>
      </view>
      <view
        v-for="conv in conversations"
        :key="conv.peerId"
        class="conv-item"
        @click="onChatClick(conv)"
      >
        <view class="avatar-placeholder">
          <text>{{ peerName(conv).charAt(0) }}</text>
        </view>
        <view class="conv-info">
          <view class="conv-top">
            <text class="conv-name">{{ peerName(conv) }}</text>
            <text class="conv-time">{{ formatTime(conv.lastMsgTime) }}</text>
          </view>
          <text class="conv-last text-ellipsis">{{ conv.lastMsgContent || '暂无消息' }}</text>
        </view>
        <view class="unread-dot" v-if="conv.unreadCount > 0">
          <text>{{ conv.unreadCount > 99 ? '99+' : conv.unreadCount }}</text>
        </view>
      </view>
      <view v-if="conversations.length === 0" class="empty-tip">
        <text>暂无会话</text>
      </view>
    </view>

    <view class="section">
      <view class="section-header" @click="goNotifications(0)">
        <text class="section-title">系统通知</text>
        <text class="badge" v-if="unread && unread.systemCount > 0">{{ unread.systemCount }}</text>
      </view>
      <view class="section-header" @click="goNotifications(1)">
        <text class="section-title">互动通知</text>
        <text class="badge" v-if="unread && unread.interactCount > 0">{{ unread.interactCount }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useMessageStore } from '../../stores/message'
import { getConversations } from '../../api/message'
import { useAuth } from '../../composables/useAuth'
import type { ConversationView } from '../../types'

const messageStore = useMessageStore()
const { requireLogin } = useAuth()
const conversations = ref<ConversationView[]>([])
const unread = computed(() => messageStore.unread)

onShow(async () => {
  if (!requireLogin()) return
  await loadConversations()
  messageStore.fetchUnread()
})

async function loadConversations() {
  try {
    const res = await getConversations({ current: 1, size: 50 })
    conversations.value = res.records
  } catch { /* ignore */ }
}

function peerName(conv: ConversationView) {
  // ConversationView.java 只有 6 个字段，没有对方昵称头像；要真名字得先有批量查用户的接口
  return '用户' + conv.peerId
}

function onChatClick(conv: ConversationView) {
  // 只带 peerId：chat.vue 的 onLoad 也只读这一个参数，昵称传过去没人接
  uni.navigateTo({ url: `/pages/message/chat?peerId=${conv.peerId}` })
}

function goNotifications(msgType: number) {
  uni.navigateTo({ url: `/pages/message/notifications?msgType=${msgType}` })
}

function formatTime(t?: string) {
  if (!t) return ''
  const d = new Date(t)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }
  return `${d.getMonth() + 1}/${d.getDate()}`
}
</script>

<style scoped>
.message-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}
.section {
  background-color: #fff;
  margin-top: 16rpx;
}
.section-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}
.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}
.badge {
  background-color: #ff4444;
  color: #fff;
  font-size: 20rpx;
  padding: 2rpx 12rpx;
  border-radius: 16rpx;
}
.conv-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 20rpx 24rpx;
  border-bottom: 1rpx solid #f5f5f5;
}
.avatar-placeholder {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  background-color: #4a90d9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.avatar-placeholder text {
  color: #fff;
  font-size: 32rpx;
}
.conv-info {
  flex: 1;
  margin-left: 20rpx;
  overflow: hidden;
}
.conv-top {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
.conv-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}
.conv-time {
  font-size: 22rpx;
  color: #bbb;
}
.conv-last {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}
.unread-dot {
  background-color: #ff4444;
  color: #fff;
  font-size: 20rpx;
  min-width: 36rpx;
  height: 36rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
  margin-left: 12rpx;
}
.empty-tip {
  text-align: center;
  padding: 40rpx;
  color: #ccc;
  font-size: 26rpx;
}
</style>
