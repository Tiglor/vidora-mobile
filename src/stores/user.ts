import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi } from '../api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const userId = ref(0)
  const nickname = ref('')
  const avatarUrl = ref('')
  const roles = ref<string[]>([])
  const permissions = ref<string[]>([])

  const isLoggedIn = computed(() => !!token.value)

  function hasPermission(perm: string) {
    return permissions.value.includes(perm)
  }

  function loadFromStorage() {
    token.value = uni.getStorageSync('token') || ''
    userId.value = Number(uni.getStorageSync('userId')) || 0
    nickname.value = uni.getStorageSync('nickname') || ''
    avatarUrl.value = uni.getStorageSync('avatarUrl') || ''
    try {
      roles.value = JSON.parse(uni.getStorageSync('roles') || '[]')
    } catch { roles.value = [] }
    try {
      permissions.value = JSON.parse(uni.getStorageSync('permissions') || '[]')
    } catch { permissions.value = [] }
  }

  async function login(phone: string, password: string) {
    const vo = await loginApi(phone, password)
    token.value = vo.token
    userId.value = vo.userId
    nickname.value = vo.nickname
    avatarUrl.value = vo.avatarUrl || ''
    roles.value = vo.roles || []
    permissions.value = vo.permissions || []
    uni.setStorageSync('token', vo.token)
    uni.setStorageSync('userId', String(vo.userId))
    uni.setStorageSync('nickname', vo.nickname)
    if (vo.avatarUrl) uni.setStorageSync('avatarUrl', vo.avatarUrl)
    uni.setStorageSync('roles', JSON.stringify(vo.roles || []))
    uni.setStorageSync('permissions', JSON.stringify(vo.permissions || []))
  }

  function logout() {
    token.value = ''
    userId.value = 0
    nickname.value = ''
    avatarUrl.value = ''
    roles.value = []
    permissions.value = []
    uni.removeStorageSync('token')
    uni.removeStorageSync('userId')
    uni.removeStorageSync('nickname')
    uni.removeStorageSync('avatarUrl')
    uni.removeStorageSync('roles')
    uni.removeStorageSync('permissions')
  }

  return { token, userId, nickname, avatarUrl, roles, permissions, isLoggedIn, hasPermission, loadFromStorage, login, logout }
})
