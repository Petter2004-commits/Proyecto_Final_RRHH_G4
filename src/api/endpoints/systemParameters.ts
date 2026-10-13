import { apiClient } from '../client'

export interface SystemParameter {
  id: string
  key: string
  value: string
  description: string
  status: 'ACTIVE' | 'INACTIVE'
  effectiveDate: string
  createdAt: string
  updatedAt: string
}

export const systemParametersApi = {
  getAll: async () => {
    const res = await apiClient.get('/system-parameters')
    return res.data.data
  },

  getById: async (id: string) => {
    const res = await apiClient.get(`/system-parameters/${id}`)
    return res.data.data
  },

  getCurrent: async (key: string) => {
    const res = await apiClient.get(`/system-parameters/current/${key}`)
    return res.data.data
  },

  create: async (data: { key: string; value: string; description: string; effectiveDate: string }) => {
    const res = await apiClient.post('/system-parameters', data)
    return res.data.data
  },

  update: async (id: string, data: { value?: string; description?: string; effectiveDate?: string }) => {
    const res = await apiClient.patch(`/system-parameters/${id}`, data)
    return res.data.data
  },

  toggleStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE') => {
    const res = await apiClient.patch(`/system-parameters/${id}/status`, { status })
    return res.data.data
  },
}