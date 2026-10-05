import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUnreadSummary } from '../api/message'
import type { UnreadSummary } from '../types'

export const useMessageStore = defineStore('message', () => {
  const unread = ref<UnreadSummary | null>(null)
  let timer: ReturnType<typeof setInterval> | null = null

  async function fetchUnread() {
    try {
      unread.value = await getUnreadSummary()
    } catch { /* ignore */ }
  }

  function startPolling(intervalMs = 30000) {
    if (timer) return
    fetchUnread()
    timer = setInterval(fetchUnread, intervalMs)
  }

  function stopPolling() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  return { unread, fetchUnread, startPolling, stopPolling }
})
