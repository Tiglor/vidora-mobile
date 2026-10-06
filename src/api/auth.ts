import { get, post, put, del } from '../utils/request'
import { CLIENT_ID } from '../config/client'
import type { LoginVO } from '../types'

export const login = (phone: string, password: string) =>
  post<LoginVO>('/api/auth/login', { phone, password, clientId: CLIENT_ID })

/** 注册只回新用户的 id，不回 token：想直接进登录态还得再调一次 login */
export const register = (phone: string, password: string, nickname?: string) =>
  post<number>('/api/auth/register', { phone, password, nickname: nickname || phone })
