import { apiClient } from '../client'

export const leaveRequestsApi = {
  getAll: async (params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    employeeId?: string
  }) => {
    const res = await apiClient.get('/leave-requests', { params })
    return res.data.data
  },

  getById: async (id: string) => {
    const res = await apiClient.get(`/leave-requests/${id}`)
    return res.data.data
  },

  getBalance: async (employeeId: string) => {
    const res = await apiClient.get(`/leave-requests/${employeeId}/balance`)
    return res.data.data
  },

  decide: async (id: string, data: { status: 'APPROVED' | 'REJECTED', reviewComment?: string }) => {
    const res = await apiClient.patch(`/leave-requests/${id}/decision`, data)
    return res.data.data
  },

  cancel: async (id: string) => {
    const res = await apiClient.patch(`/leave-requests/${id}/cancel`, {})
    return res.data.data
  },
}