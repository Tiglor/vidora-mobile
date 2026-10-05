/// <reference types="@dcloudio/types" />

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// tsconfig 的 types 只挂了 @dcloudio/types，没有 vite/client，
// 所以 import.meta.env 的字段要自己声明，否则 strict 下取 VITE_API_ORIGIN 直接 TS2339
interface ImportMetaEnv {
  readonly VITE_API_ORIGIN?: string
  readonly VITE_GATEWAY?: string
  readonly VITE_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
