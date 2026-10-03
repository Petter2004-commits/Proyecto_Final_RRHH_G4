import { apiClient } from '../client'
import type { AuthUser } from '../../types'

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password })
    const { user, tokens } = res.data.data

    // normaliza role si viene como objeto
    const role = typeof user.role === 'object' ? user.role.code : user.role

    const normalizedUser: AuthUser = {
      id: user.id,
      email: user.email,
      role,
      employeeId: user.employeeId,
    }

    return {
      user: normalizedUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }
  },

  refresh: async (refreshToken: string) => {
    const res = await apiClient.post('/auth/refresh', { refreshToken })
    const { tokens } = res.data.data
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }
  },

  logout: async (refreshToken: string) => {
    await apiClient.post('/auth/logout', { refreshToken })
  },

  me: async () => {
    const res = await apiClient.get('/auth/me')
    return res.data.data as AuthUser
  },
}