import axios, { AxiosError } from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
})

let refreshPromise: Promise<string> | null = null

function getTokens() {
  return {
    access: localStorage.getItem('accessToken'),
    refresh: localStorage.getItem('refreshToken'),
  }
}

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken)
  localStorage.setItem('refreshToken', refreshToken)
}

export function clearTokens() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { access } = getTokens()
  if (access) config.headers.Authorization = `Bearer ${access}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/login') &&
      !original.url?.includes('/auth/refresh')
    ) {
      original._retry = true

      try {
        if (!refreshPromise) {
          const { refresh } = getTokens()
          refreshPromise = axios
  .post(`${BASE_URL}/api/v1/auth/refresh`, { refreshToken: refresh })
  .then((res) => {
    const { tokens } = res.data.data
    saveTokens(tokens.accessToken, tokens.refreshToken)
    return tokens.accessToken
  })
            .finally(() => {
              refreshPromise = null
            })
        }

        const newAccessToken = await refreshPromise
        original.headers.Authorization = `Bearer ${newAccessToken}`
        return apiClient(original)
            } catch {
        clearTokens()
        window.dispatchEvent(new Event('auth:logout'))
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)