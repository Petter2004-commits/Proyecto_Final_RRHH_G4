import { apiClient } from '../client'

export interface DashboardReport {
  workforce: {
    total: number
    active: number
    suspended: number
    retired: number
  }
  leaveRequests: {
    pending: number
    upcomingApproved: number
  }
  documents: {
    expired: number
    expiringNext30Days: number
  }
  records: {
    complete: number
    inProgress: number
    incomplete: number
    compliancePercentage: string
  }
  latestPayrollPeriod: {
    name: string
    status: string
    employeeCount: number
  } | null
  generatedAt: string
}

export const reportsApi = {
  dashboard: async (): Promise<DashboardReport> => {
    const res = await apiClient.get<{ data: DashboardReport }>('/reports/dashboard')
    return res.data.data
  },
}