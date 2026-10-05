<template>
  <view class="upload-page">
    <view class="picker-area" @click="chooseVideo" v-if="!selectedFile">
      <text class="picker-icon">+</text>
      <text class="picker-text">选择视频</text>
    </view>

    <view class="file-preview" v-else>
      <text class="file-name text-ellipsis">{{ selectedFile.name || '已选择视频' }}</text>
      <text class="file-size">{{ formatSize(selectedFile.size) }}</text>
      <text class="reselect" @click="chooseVideo">重新选择</text>
    </view>

    <view class="form" v-if="selectedFile">
      <view class="form-item">
        <text class="label">标题</text>
        <input class="input" placeholder="输入视频标题" v-model="title" />
      </view>
      <view class="form-item">
        <text class="label">描述</text>
        <textarea class="textarea" placeholder="输入视频描述" v-model="description" />
      </view>
      <view class="form-item">
        <text class="label">分类</text>
        <scroll-view scroll-x class="category-scroll">
          <view
            v-for="cat in categories"
            :key="cat.id"
            class="cat-tag"
            :class="{ active: categoryId === cat.id }"
            @click="categoryId = categoryId === cat.id ? 0 : cat.id"
          >
            <text>{{ cat.name }}</text>
          </view>
        </scroll-view>
      </view>
      <view class="form-item">
        <text class="label">标签</text>
        <input class="input" placeholder="输入标签关键词" v-model="tagKeyword" @input="onTagInput" />
        <view class="tag-suggestions" v-if="tagSuggestions.length">
          <text
            v-for="t in tagSuggestions"
            :key="t.id"
            class="tag-sug"
            @click="selectedTag = t.name; tagSuggestions = []"
          >{{ t.name }}</text>
        </view>
        <text class="selected-tag" v-if="selectedTag">已选: {{ selectedTag }}</text>
      </view>
    </view>

    <view class="progress-area" v-if="uploading">
      <text class="progress-label">上传进度</text>
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: progress + '%' }" />
      </view>
      <text class="progress-text">{{ progress }}%</text>
    </view>

    <view class="progress-area" v-if="transcoding">
      <text class="progress-label">转码中...</text>
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: transcodeProgress + '%' }" />
      </view>
      <text class="progress-text">{{ transcodeProgress }}%</text>
    </view>

    <view class="submit-area" v-if="selectedFile && !uploading && !transcoding && !finishState">
      <view class="submit-btn" @click="onSubmit">
        <text>开始上传</text>
      </view>
    </view>

    <view class="result-area" v-if="finishState">
      <text class="result-text" :class="{ 'result-text-failed': finishState === 'failed' }">{{ finishText }}</text>
      <text class="result-error" v-if="transcodeError">{{ transcodeError }}</text>
      <view class="submit-btn" @click="finishState === 'failed' ? onSubmit() : goBack()">
        <text>{{ finishState === 'failed' ? '重新上传' : '返回' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onUnload } from '@dcloudio/uni-app'
import { useAuth } from '../../composables/useAuth'
import { suggestTags } from '../../api/content'
import { useDictStore } from '../../stores/dict'
import { multipartInit, multipartChunk, multipartComplete, getTranscodeTask } from '../../api/video'
import type { Tag } from '../../types'

const { requireLogin } = useAuth()
const dict = useDictStore()

const selectedFile = ref<any>(null)
const title = ref('')
const description = ref('')
const categoryId = ref(0)
const tagKeyword = ref('')
const selectedTag = ref('')
const tagSuggestions = ref<Tag[]>([])
const categories = computed(() => dict.categories)
const uploading = ref(false)
const transcoding = ref(false)
const progress = ref(0)
const transcodeProgress = ref(0)
// 转码轮询的四种终态：成功 / 失败 / 后端压根没建任务（transcode.enabled=false）/
// 轮询到上限仍没结论（转码节点没起来、网关一直不通）。
// 之前只有一个 uploadDone 布尔，失败和成功都渲染成「上传成功！」，
// 用户拿着一个转码挂掉的视频回首页，列表里点不开还不知道为什么。
const finishState = ref<'success' | 'failed' | 'skipped' | 'pending' | ''>('')
const transcodeError = ref('')
let poll: ReturnType<typeof setInterval> | null = null

// 轮询的两个兜底：任务可能永远停在 status=1，网关也可能一直连不上，
// 两种情况都不该让一个开着（却没被卸载）的页面每 3 秒打一次后端打到天荒地老。
const POLL_TIMEOUT_MS = 5 * 60 * 1000
const MAX_POLL_FAILURES = 3

function stopPolling() {
  if (poll) {
    clearInterval(poll)
    poll = null
  }
}

// 终态四选一。收口在这里，保证「停轮询 + 收起转码条 + 落状态」不会漏其中一步
function finish(state: 'success' | 'failed' | 'skipped' | 'pending', error = '') {
  stopPolling()
  transcoding.value = false
  transcodeError.value = error
  finishState.value = state
}

// 页面返回时 interval 不会自己停：它会继续每 3 秒打一次网关，
// 操作的还是已经销毁的页面里的 ref。
onUnload(stopPolling)

const finishText = computed(() => {
  if (finishState.value === 'success') return '上传成功，转码完成！'
  if (finishState.value === 'failed') return '视频已提交，但转码失败'
  if (finishState.value === 'skipped') return '上传成功！后端未开启转码，源文件可直接播放'
  // 没结论不等于失败：稿件已经落在服务端，只是这一次没等到结果
  if (finishState.value === 'pending') return '视频已提交，转码还没结束，稍后到「我的」里查看'
  return ''
})

async function init() {
  try {
    // store 里已有就直接命中缓存，不再为每次进上传页打一遍网关
    await dict.loadCategories()
  } catch { /* 分区没拉到就不预选，标题/文件仍可用 */ }
}
init()

function chooseVideo() {
  uni.chooseVideo({
    sourceType: ['album', 'camera'],
    success: (res) => {
      selectedFile.value = {
        path: res.tempFilePath,
        name: res.tempFilePath.split('/').pop(),
        size: res.size,
        duration: res.duration,
      }
    },
  })
}

function onTagInput() {
  if (tagKeyword.value.trim().length < 1) {
    tagSuggestions.value = []
    return
  }
  suggestTags(tagKeyword.value.trim(), 5).then(tags => {
    tagSuggestions.value = tags
  }).catch(() => { tagSuggestions.value = [] })
}

async function onSubmit() {
  if (!requireLogin()) return
  if (!selectedFile.value) return

  uploading.value = true
  progress.value = 0
  // 失败后点「重试」会重新走一遍上传，要把上一轮的终态清掉，
  // 否则新的转码还在跑，界面仍然挂着「转码失败」。
  finishState.value = ''
  transcodeError.value = ''

  const CHUNK_SIZE = 5 * 1024 * 1024
  const fileSize = selectedFile.value.size

  try {
    const initResult = await multipartInit({
      fileName: selectedFile.value.name || 'video.mp4',
      fileSize,
      chunkSize: CHUNK_SIZE,
    })

    if (initResult.instant) {
      await completeUpload(initResult.uploadId)
      return
    }

    const totalChunks = initResult.totalChunks
    const uploaded = new Set(initResult.uploadedIndexes)
    const pendingChunks: number[] = []
    for (let i = 0; i < totalChunks; i++) {
      if (!uploaded.has(i)) pendingChunks.push(i)
    }

    const concurrency = 3
    let completed = uploaded.size
    let idx = 0

    async function uploadNext() {
      if (idx >= pendingChunks.length) return
      const chunkIdx = pendingChunks[idx++]
      await multipartChunk(selectedFile.value.path, {
        uploadId: initResult.uploadId,
        chunkIndex: chunkIdx,
      })
      completed++
      progress.value = Math.round((completed / totalChunks) * 100)
      await uploadNext()
    }

    const workers = Array.from({ length: Math.min(concurrency, pendingChunks.length) }, () => uploadNext())
    await Promise.all(workers)

    await completeUpload(initResult.uploadId)
  } catch (e: any) {
    uni.showToast({ title: e?.message || '上传失败', icon: 'none' })
    uploading.value = false
  }
}

async function completeUpload(uploadId: string) {
  uploading.value = false
  try {
    const video = await multipartComplete({
      uploadId,
      title: title.value || undefined,
      description: description.value || undefined,
      categoryId: categoryId.value || undefined,
    })

    stopPolling()
    transcoding.value = true
    transcodeProgress.value = 0

    const deadline = Date.now() + POLL_TIMEOUT_MS
    let failures = 0
    poll = setInterval(async () => {
      if (Date.now() > deadline) {
        return finish('pending', '超过 5 分钟还没等到转码结果，可能是转码节点没起来。')
      }
      try {
        const task = await getTranscodeTask(video.id)
        failures = 0
        // data:null：后端没开转码，永远不会有任务。不当终态处理就会每 3 秒空转到天荒地老
        if (!task) return finish('skipped')
        transcodeProgress.value = task.progress || 0
        if (task.status === 2) finish('success')
        else if (task.status === 3) finish('failed', task.errorMsg || '转码失败，请重新上传或换个视频源')
      } catch {
        // 单次失败（网关抖动）等下一轮，连着失败就别再打了
        if (++failures >= MAX_POLL_FAILURES) {
          finish('pending', '连续几次都查不到转码状态，后端可能不可用。')
        }
      }
    }, 3000)
  } catch (e: any) {
    uni.showToast({ title: e?.message || '上传完成但提交失败', icon: 'none' })
  }
}

function goBack() {
  uni.navigateBack()
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}
</script>

<style scoped>
.upload-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 24rpx;
}
.picker-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300rpx;
  background-color: #fff;
  border-radius: 16rpx;
  border: 2rpx dashed #ccc;
}
.picker-icon {
  font-size: 64rpx;
  color: #ccc;
}
.picker-text {
  font-size: 26rpx;
  color: #999;
  margin-top: 12rpx;
}
.file-preview {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 24rpx;
  background-color: #fff;
  border-radius: 16rpx;
}
.file-name {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}
.file-size {
  font-size: 24rpx;
  color: #999;
  margin: 0 16rpx;
}
.reselect {
  font-size: 24rpx;
  color: #4a90d9;
}
.form {
  margin-top: 24rpx;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 16rpx 24rpx;
}
.form-item {
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}
.label {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 8rpx;
  display: block;
}
.input {
  height: 60rpx;
  font-size: 28rpx;
  color: #333;
}
.textarea {
  height: 120rpx;
  font-size: 28rpx;
  color: #333;
  width: 100%;
}
.category-scroll {
  white-space: nowrap;
  margin-top: 8rpx;
}
.cat-tag {
  display: inline-block;
  padding: 8rpx 24rpx;
  font-size: 24rpx;
  color: #666;
  background-color: #f5f5f5;
  border-radius: 20rpx;
  margin-right: 12rpx;
}
.cat-tag.active {
  background-color: #4a90d9;
  color: #fff;
}
.tag-suggestions {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin-top: 8rpx;
}
.tag-sug {
  padding: 6rpx 16rpx;
  font-size: 22rpx;
  color: #4a90d9;
  background-color: #e8f0fe;
  border-radius: 12rpx;
  margin: 4rpx 8rpx 4rpx 0;
}
.selected-tag {
  font-size: 22rpx;
  color: #999;
  margin-top: 8rpx;
}
.progress-area {
  margin-top: 24rpx;
  padding: 24rpx;
  background-color: #fff;
  border-radius: 16rpx;
}
.progress-label {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 12rpx;
}
.progress-bar {
  height: 12rpx;
  background-color: #eee;
  border-radius: 6rpx;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background-color: #4a90d9;
  border-radius: 6rpx;
  transition: width 0.3s;
}
.progress-text {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
  text-align: right;
}
.submit-area, .result-area {
  margin-top: 40rpx;
}
.submit-btn {
  padding: 24rpx;
  background-color: #4a90d9;
  border-radius: 16rpx;
  text-align: center;
}
.submit-btn text {
  color: #fff;
  font-size: 30rpx;
}
.result-text {
  text-align: center;
  font-size: 30rpx;
  color: #333;
  margin-bottom: 24rpx;
}
.result-text-failed {
  color: #e54d42;
}
.result-error {
  display: block;
  margin: -12rpx 0 24rpx;
  color: #999;
  font-size: 24rpx;
  line-height: 1.5;
}
</style>
