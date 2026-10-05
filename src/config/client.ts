// 客户端标识：登录时传给 auth-service，服务端查 sys_client 表换这一端的 token 有效期与设备类型。
// 值必须和库里的 client_id 对得上，所以放 .env，别散在代码里。
export const CLIENT_ID = import.meta.env.VITE_CLIENT_ID || 'vidora-mobile-2024'
