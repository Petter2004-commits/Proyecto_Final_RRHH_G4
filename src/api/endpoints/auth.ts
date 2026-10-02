import { apiClient } from '../client'
import type { LoginResponse, AuthUser } from '../../types'

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await apiClient.post<{ data: LoginResponse }>('/auth/login', {
      email,
      password,
    })
    return res.data.data
  },

  refresh: async (refreshToken: string) => {
    const res = await apiClient.post<{ data: LoginResponse }>('/auth/refresh', {
      refreshToken,
    })
    return res.data.data
  },

  logout: async (refreshToken: string) => {
    await apiClient.post('/auth/logout', { refreshToken })
  },

  me: async () => {
    const res = await apiClient.get<{ data: AuthUser }>('/auth/me')
    return res.data.data
  },
}