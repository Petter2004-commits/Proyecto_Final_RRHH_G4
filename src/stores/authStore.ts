import { create } from 'zustand'
import type { AuthUser } from '../types'
import { clearTokens, saveTokens } from '../api/client'

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: AuthUser, accessToken: string, refreshToken: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    try {
      const u = localStorage.getItem('user')
      return u ? JSON.parse(u) : null
    } catch { return null }
  })(),
  isAuthenticated: (() => {
    try {
      return !!localStorage.getItem('user')
    } catch { return false }
  })(),
  isLoading: false,

  setUser: (user, accessToken, refreshToken) => {
    saveTokens(accessToken, refreshToken)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, isAuthenticated: true, isLoading: false })
  },

  logout: () => {
    clearTokens()
    localStorage.removeItem('user')
    set({ user: null, isAuthenticated: false, isLoading: false })
  },

  setLoading: (loading) => set({ isLoading: loading }),
}))
// logout forzado cuando el refresh falla
if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    useAuthStore.getState().logout()
  })
}