import { defineConfig, loadEnv } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, 'VITE_')
  const gateway = env.VITE_GATEWAY || 'http://127.0.0.1:8080'

  return {
    plugins: [uni()],
    resolve: {
      alias: {
        vue: path.resolve(__dirname, 'node_modules/@dcloudio/uni-h5-vue/dist/vue.runtime.esm.js'),
      },
    },
    server: {
      // H5 端 VITE_API_ORIGIN 是空串，请求走同源 /api/**，由这里转给网关。
      // 网关没有配 CORS，浏览器直连 8080 会被预检拦掉——这条代理是 H5 能联调的前提。
      proxy: {
        '/api': {
          target: gateway,
          changeOrigin: true
        }
      }
    }
  }
})
