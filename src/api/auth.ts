import { get, post, put, del } from '../utils/request'
import { CLIENT_ID } from '../config/client'
import type { LoginVO } from '../types'

export const login = (phone: string, password: string) =>
  post<LoginVO>('/api/auth/login', { phone, password, clientId: CLIENT_ID })

export const register = (phone: string, password: string, nickname?: string) =>
  post<LoginVO>('/api/auth/register', { phone, password, nickname: nickname || phone })
