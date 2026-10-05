import { useUserStore } from '../stores/user'

export function useAuth() {
  function requireLogin(): boolean {
    const store = useUserStore()
    if (!store.isLoggedIn) {
      uni.navigateTo({ url: '/pages/login/login' })
      return false
    }
    return true
  }

  return { requireLogin }
}
