<template>
  <view class="comment-item">
    <view class="avatar">
      <text class="avatar-text">{{ displayName(comment).charAt(0) }}</text>
    </view>
    <view class="content">
      <text class="username">{{ displayName(comment) }}</text>
      <text class="text">{{ comment.content }}</text>
      <view class="meta">
        <text class="time">{{ formatTime(comment.createTime) }}</text>
        <text class="like">❤ {{ comment.likeCount || 0 }}</text>
        <text class="reply-btn" @click="$emit('reply', comment)">回复</text>
      </view>
      <view v-if="comment.replies && comment.replies.length > 0" class="replies">
        <CommentItem
          v-for="reply in comment.replies.slice(0, 2)"
          :key="reply.id"
          :comment="reply"
          @reply="$emit('reply', $event)"
        />
        <text
          v-if="comment.replyCount && comment.replyCount > 2"
          class="more-replies"
          @click="$emit('loadMore', comment)"
        >
          查看更多回复 ({{ comment.replyCount }})
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { CommentView } from '../types'

defineProps<{
  comment: CommentView
}>()

defineEmits<{
  reply: [comment: CommentView]
  loadMore: [comment: CommentView]
}>()

function displayName(comment: CommentView) {
  // CommentView 只有 userId，昵称头像后端刻意不给（CommentView.java 类注释）：
  // 逐条查用户会把一屏评论变成一屏远程调用，要显示真实昵称得先有批量查用户的接口。
  return '用户' + comment.userId
}

function formatTime(time: string) {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return time.substring(0, 10)
}
</script>

<style scoped>
.comment-item {
  display: flex;
  padding: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}
.avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 30rpx;
  background: #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
}
.avatar-text {
  font-size: 28rpx;
  color: #666;
}
.content {
  flex: 1;
}
.username {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 8rpx;
}
.text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.5;
  margin-bottom: 12rpx;
}
.meta {
  display: flex;
  align-items: center;
  gap: 20rpx;
}
.time {
  font-size: 24rpx;
  color: #999;
}
.like {
  font-size: 24rpx;
  color: #999;
}
.reply-btn {
  font-size: 24rpx;
  color: #ff2442;
}
.replies {
  margin-top: 16rpx;
  padding-left: 20rpx;
  border-left: 2rpx solid #f0f0f0;
}
.more-replies {
  font-size: 24rpx;
  color: #666;
  margin-top: 12rpx;
}
</style>
