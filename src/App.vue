<script setup lang="ts">
import { onLaunch, onHide, onShow } from '@dcloudio/uni-app'
import { useUserStore } from './stores/user'
import { useMessageStore } from './stores/message'

onLaunch(() => {
  const userStore = useUserStore()
  userStore.loadFromStorage()
  if (userStore.isLoggedIn) {
    useMessageStore().startPolling()
  }
})

onHide(() => {
  useMessageStore().stopPolling()
})

onShow(() => {
  if (useUserStore().isLoggedIn) {
    useMessageStore().startPolling()
  }
})
</script>

<style>
page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: #f5f5f5;
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-ellipsis-2 {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
