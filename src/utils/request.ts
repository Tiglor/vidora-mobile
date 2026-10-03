const BASE_URL = 'http://127.0.0.1:8080'

interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export function request<T = any>(options: UniApp.RequestOptions): Promise<T> {
  const token = uni.getStorageSync('token')
  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      url: `${BASE_URL}${options.url}`,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.header
      },
      success: (res) => {
        const result = res.data as ApiResponse<T>
        if (result && result.code === 200) {
          resolve(result.data)
        } else if (result && result.code === 401) {
          uni.removeStorageSync('token')
          uni.reLaunch({ url: '/pages/login/login' })
          reject(result.message || '未登录')
        } else {
          reject(result?.message || '请求失败')
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

export function get<T = any>(url: string, params?: any): Promise<T> {
  return request<T>({ url, method: 'GET', data: params })
}

export function post<T = any>(url: string, data?: any): Promise<T> {
  return request<T>({ url, method: 'POST', data })
}
