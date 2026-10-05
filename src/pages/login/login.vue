<template>
  <view class="container">
    <text class="title">登录</text>
    <input class="input" v-model="form.phone" placeholder="手机号" type="number" />
    <input class="input" v-model="form.password" placeholder="密码" password />
    <button class="btn" @click="handleLogin">登录</button>
    <button class="btn ghost" @click="handleRegister">注册</button>
  </view>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { post } from '../../utils/request'
import { useUserStore } from '../../stores/user'
import { useMessageStore } from '../../stores/message'

const userStore = useUserStore()
const messageStore = useMessageStore()

const form = reactive({
  phone: '',
  password: ''
})

let redirectUrl = ''

onLoad((options) => {
  form.phone = uni.getStorageSync('lastPhone') || ''
  redirectUrl = options?.redirect || ''
})

async function handleLogin() {
  if (!form.phone || !form.password) {
    uni.showToast({ title: '请输入手机号和密码', icon: 'none' })
    return
  }
  try {
    await userStore.login(form.phone, form.password)
    uni.setStorageSync('lastPhone', form.phone)
    messageStore.startPolling()
    uni.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(() => {
      if (redirectUrl) {
        uni.navigateTo({ url: redirectUrl })
      } else {
        uni.switchTab({ url: '/pages/home/home' })
      }
    }, 500)
  } catch (e) {
    uni.showToast({ title: String(e), icon: 'none' })
  }
}

async function handleRegister() {
  if (!form.phone || !form.password) {
    uni.showToast({ title: '请输入手机号和密码', icon: 'none' })
    return
  }
  try {
    await post('/api/auth/register', { ...form, nickname: form.phone })
    uni.showToast({ title: '注册成功，请登录', icon: 'none' })
  } catch (e) {
    uni.showToast({ title: String(e), icon: 'none' })
  }
}
</script>

<style scoped>
.container {
  padding: 40rpx;
}
.title {
  font-size: 48rpx;
  font-weight: bold;
  text-align: center;
  margin-bottom: 60rpx;
}
.input {
  height: 90rpx;
  border-bottom: 1rpx solid #ddd;
  margin-bottom: 30rpx;
  padding: 0 10rpx;
}
.btn {
  margin-top: 30rpx;
  background: #ff2442;
  color: #fff;
}
.btn.ghost {
  background: #fff;
  color: #ff2442;
  border: 1rpx solid #ff2442;
}
</style>
