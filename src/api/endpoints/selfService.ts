import { apiClient } from '../client'

export const selfServiceApi = {
  // Perfil
  getProfile: async () => {
    const res = await apiClient.get('/self-service/profile')
    return res.data.data
  },

  // Solicitudes propias
  getMyRequests: async (params?: { page?: number; limit?: number; status?: string }) => {
    const res = await apiClient.get('/self-service/leave-requests', { params })
    return res.data.data
  },

  getMyRequestById: async (id: string) => {
    const res = await apiClient.get(`/self-service/leave-requests/${id}`)
    return res.data.data
  },

  getMyBalance: async () => {
    const res = await apiClient.get('/self-service/leave-requests/balance')
    return res.data.data
  },

  createRequest: async (data: {
    type: 'VACATION' | 'SICK_LEAVE' | 'PERSONAL' | 'OTHER'
    startDate: string
    endDate: string
    reason: string
  }) => {
    const res = await apiClient.post('/self-service/leave-requests', data)
    return res.data.data
  },

  cancelMyRequest: async (id: string) => {
    const res = await apiClient.patch(`/self-service/leave-requests/${id}/cancel`, {})
    return res.data.data
  },
}