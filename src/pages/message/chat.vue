<template>
  <view class="chat-page">
    <scroll-view
      scroll-y
      class="msg-list"
      :scroll-into-view="scrollToId"
      @scrolltoupper="loadOlder"
    >
      <view v-if="loadingOlder" class="loading-tip">
        <text>加载中...</text>
      </view>
      <view
        v-for="msg in messages"
        :key="msg.id"
        :id="'msg-' + msg.id"
        class="msg-row"
        :class="{ mine: msg.senderId === myUserId }"
      >
        <view class="bubble" :class="{ mine: msg.senderId === myUserId }">
          <text>{{ msg.content }}</text>
        </view>
        <text class="msg-time">{{ formatTime(msg.createTime) }}</text>
      </view>
    </scroll-view>

    <view class="input-bar safe-bottom">
      <input
        class="msg-input"
        placeholder="输入消息"
        v-model="inputText"
        @confirm="onSend"
      />
      <text class="send-btn" :class="{ disabled: !inputText.trim() }" @click="onSend">发送</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '../../stores/user'
import { getThread, sendPrivateMessage, markConversationRead } from '../../api/message'
import type { MessageView } from '../../types'

const userStore = useUserStore()
const myUserId = computed(() => userStore.userId)

const peerId = ref(0)
const messages = ref<MessageView[]>([])
const inputText = ref('')
const scrollToId = ref('')
const loadingOlder = ref(false)
let currentPage = 1
let hasMore = true

onLoad(async (query) => {
  peerId.value = Number(query?.peerId)
  if (peerId.value) {
    await loadMessages()
    try {
      await markConversationRead(peerId.value)
    } catch { /* ignore */ }
    scrollToBottom()
  }
})

async function loadMessages() {
  loadingOlder.value = true
  try {
    const res = await getThread(peerId.value, { current: currentPage, size: 20 })
    const newMsgs = res.records.reverse()
    if (currentPage === 1) {
      messages.value = newMsgs
    } else {
      messages.value = [...newMsgs, ...messages.value]
    }
    hasMore = currentPage < res.pages
    currentPage++
  } catch { /* ignore */ }
  loadingOlder.value = false
}

async function loadOlder() {
  if (loadingOlder.value || !hasMore) return
  await loadMessages()
  if (messages.value.length > 0) {
    scrollToId.value = 'msg-' + messages.value[0].id
  }
}

async function onSend() {
  const content = inputText.value.trim()
  if (!content) return
  inputText.value = ''
  try {
    const msg = await sendPrivateMessage({ receiverId: peerId.value, content })
    messages.value.push(msg)
    scrollToBottom()
  } catch { /* ignore */ }
}

function scrollToBottom() {
  if (messages.value.length > 0) {
    setTimeout(() => {
      scrollToId.value = 'msg-' + messages.value[messages.value.length - 1].id
    }, 100)
  }
}

function formatTime(t: string) {
  const d = new Date(t)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}
.msg-list {
  flex: 1;
  padding: 16rpx 24rpx;
}
.msg-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 24rpx;
  align-items: flex-start;
}
.msg-row.mine {
  align-items: flex-end;
}
.bubble {
  max-width: 70%;
  padding: 16rpx 24rpx;
  border-radius: 16rpx;
  background-color: #fff;
  font-size: 28rpx;
  color: #333;
}
.bubble.mine {
  background-color: #4a90d9;
  color: #fff;
}
.msg-time {
  font-size: 20rpx;
  color: #bbb;
  margin-top: 4rpx;
}
.input-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 16rpx 24rpx;
  background-color: #fff;
  border-top: 1rpx solid #eee;
}
.msg-input {
  flex: 1;
  height: 64rpx;
  background-color: #f5f5f5;
  border-radius: 32rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
}
.send-btn {
  margin-left: 16rpx;
  font-size: 28rpx;
  color: #4a90d9;
  padding: 8rpx 16rpx;
}
.send-btn.disabled {
  color: #ccc;
}
.loading-tip {
  text-align: center;
  padding: 20rpx;
  color: #999;
  font-size: 24rpx;
}
</style>
