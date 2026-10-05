<template>
  <view class="danmaku-overlay">
    <view
      v-for="dm in visibleDanmaku"
      :key="dm.id"
      class="danmaku-item"
      :class="[`mode-${dm.position || 0}`]"
      :style="{
        color: dm.color || '#fff',
        fontSize: (dm.fontSize || 25) + 'rpx',
        top: dm._top + 'rpx',
        animationDuration: (dm._duration || 8) + 's'
      }"
    >
      {{ dm.content }}
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Danmaku } from '../types'

const props = defineProps<{
  danmakuList: Danmaku[]
  currentTime: number
}>()

const visibleDanmaku = computed(() => {
  const current = props.currentTime
  const filtered = props.danmakuList.filter(dm => {
    const appearTime = dm.appearTime || 0
    return current >= appearTime && current <= appearTime + 10
  })

  const limited = filtered.slice(0, 50)

  return limited.map((dm, idx) => {
    const position = dm.position || 0
    let top = 0
    if (position === 0) {
      top = 50 + (idx % 10) * 60
    } else if (position === 1) {
      top = 50
    } else if (position === 2) {
      top = 600
    }
    const duration = 8 + Math.random() * 4
    return { ...dm, _top: top, _duration: duration }
  })
})
</script>

<style scoped>
.danmaku-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
}
.danmaku-item {
  position: absolute;
  white-space: nowrap;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  font-weight: bold;
}
.mode-0 {
  animation: danmaku-scroll linear forwards;
  right: -100%;
}
.mode-1 {
  left: 50%;
  transform: translateX(-50%);
  animation: danmaku-fade 5s linear forwards;
}
.mode-2 {
  left: 50%;
  transform: translateX(-50%);
  animation: danmaku-fade 5s linear forwards;
}
@keyframes danmaku-scroll {
  from {
    right: -100%;
  }
  to {
    right: 100%;
  }
}
@keyframes danmaku-fade {
  0%, 80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>
