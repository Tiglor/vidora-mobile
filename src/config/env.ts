/**
 * 运行时环境配置，来自 .env / .env.development / .env.production（vite 的 VITE_ 前缀变量）。
 *
 * 为什么必须可配：这里原来是硬编码的 `http://127.0.0.1:8080`。
 * - H5：页面自己跑在 5173，再请求 8080 属于跨源；网关没有配 CORS，预检直接被拦 ——
 *   也就是 H5 端一个接口都调不通。留空走同源 + devServer 代理才对。
 * - App/小程序：跑在手机上，127.0.0.1 指手机自己，永远连不到开发机，必须填局域网 IP。
 */

// 空串在 H5 下是合法的「同源」取值，所以只能用 ?? 判有没有配，不能用 ||
let origin: string = import.meta.env.VITE_API_ORIGIN ?? ''

// #ifndef H5
// 非 H5 端没有「同源」可用，没配就退回本机网关（模拟器场景）；真机调试请改成 http://<内网IP>:8080
if (!origin) origin = 'http://127.0.0.1:8080'
// #endif

export const API_ORIGIN = origin

/** devServer 代理的目标，只在 H5 本地开发时用到 */
export const GATEWAY_TARGET: string = import.meta.env.VITE_GATEWAY || 'http://127.0.0.1:8080'
