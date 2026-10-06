import { API_ORIGIN } from '../config/env'

interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// api/*.ts 里的路径本身就带着 /api（和网关的路由前缀一致），所以这里只拼「源」这一段：
// H5 用空串（同源 + devServer 代理），App/小程序用 http://内网IP:8080 这样的绝对源。
const BASE_URL = API_ORIGIN

// 同一条错误在 1.5s 内只弹一次。
// 一个页面并发发好几个请求、后端整体挂掉时，不节流就会叠出四五条一模一样的 toast。
let lastToastText = ''
let lastToastAt = 0
function showError(text?: string) {
  const title = (text || '网络异常，请稍后再试').slice(0, 30)
  const now = Date.now()
  if (title === lastToastText && now - lastToastAt < 1500) return
  lastToastText = title
  lastToastAt = now
  uni.showToast({ title, icon: 'none', duration: 2500 })
}

// 401 单飞：token 过期时首屏往往有 3-5 个请求同时在跑，
// 每个都 reLaunch 会把登录页压栈好几次，返回时得连按好几次返回键。
let redirecting = false
function handleUnauthorized() {
  uni.removeStorageSync('token')
  if (redirecting) return
  redirecting = true
  uni.reLaunch({
    url: '/pages/login/login',
    complete: () => setTimeout(() => { redirecting = false }, 1000)
  })
}

/** 网关的 401 只设状态码、不带 body，所以业务码不能当唯一依据 */
function pickMessage(result: ApiResponse | undefined, fallback: string) {
  return result && result.message ? result.message : fallback
}

export function request<T = any>(options: UniApp.RequestOptions): Promise<T> {
  const token = uni.getStorageSync('token')
  const isGet = (options.method || 'GET').toUpperCase() === 'GET'
  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      url: `${BASE_URL}${options.url}`,
      // GET 不需要 Content-Type；带上它反而让浏览器先发一次 CORS 预检。
      // 小程序/App 走的是原生请求没有预检，所以这里只是少走一趟往返。
      header: {
        ...(isGet ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.header
      },
      timeout: 15000,
      success: (res) => {
        const result = res.data as ApiResponse<T>
        // uni.request 对 4xx/5xx 也走 success（只有网络错误才走 fail），所以状态码要自己判。
        // 网关的 401 只设状态码、**不写 body**，res.data 是空串——只看 body 里的 code 会漏掉它，
        // 于是 token 过期后既清不掉本地 token 也不跳登录，只会一直弹「请求失败」。
        // 业务服务经 GlobalExceptionHandler 抛的 401 状态码同样是 401，走这一条就够了。
        if (res.statusCode === 401) {
          handleUnauthorized()
          reject('未登录')
          return
        }
        if (res.statusCode === 403) {
          const msg = pickMessage(result, '没有该操作权限')
          showError(msg)
          reject(msg)
          return
        }
        if (res.statusCode >= 500) {
          showError('服务暂时不可用，请稍后再试')
          reject('服务异常')
          return
        }
        if (result && result.code === 200) {
          resolve(result.data)
          return
        }
        const msg = pickMessage(result, '请求失败')
        showError(msg)
        reject(msg)
      },
      fail: (err) => {
        // 网络层失败（域名不通、超时、离线）。H5 下这是跨源被拦或后端没起的典型表现。
        showError('网络连接失败，请检查网络')
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

export function put<T = any>(url: string, data?: any): Promise<T> {
  return request<T>({ url, method: 'PUT', data })
}

export function del<T = any>(url: string): Promise<T> {
  return request<T>({ url, method: 'DELETE' })
}

/**
 * 上传一个文件。单次请求可以带整个视频，所以进度（onProgress）和超时（timeoutMs，默认 60s）都由调用方给：
 * 分片流程要整文件哈希才能秒传，本端没有，见 api/video.ts 的注释。
 */
export function uploadFile<T = any>(
  url: string,
  filePath: string,
  name: string,
  formData?: Record<string, any>,
  options?: { onProgress?: (percent: number) => void; timeoutMs?: number }
): Promise<T> {
  const token = uni.getStorageSync('token')
  return new Promise((resolve, reject) => {
    const task = uni.uploadFile({
      url: `${BASE_URL}${url}`,
      filePath,
      name,
      formData,
      timeout: options?.timeoutMs ?? 60000,
      header: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success: (res) => {
        if (res.statusCode === 401) {
          handleUnauthorized()
          reject('未登录')
          return
        }
        try {
          const result = JSON.parse(res.data) as ApiResponse<T>
          if (result.code === 200) {
            resolve(result.data)
            return
          }
          showError(pickMessage(result, '上传失败'))
          reject(pickMessage(result, '上传失败'))
        } catch {
          showError('上传响应解析失败')
          reject('上传响应解析失败')
        }
      },
      fail: (err) => {
        showError('上传失败，请检查网络')
        reject(err)
      },
    })
    const onProgress = options?.onProgress
    if (onProgress) {
      task.onProgressUpdate((res) => onProgress(res.progress))
    }
  })
}
