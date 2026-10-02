// ─── Respuestas base ───────────────────────────────────────────────
export interface ApiSuccess<T> {
  success: true
  data: T
  timestamp: string
  path: string
  requestId: string
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export interface PaginatedData<T> {
  items: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ─── Auth ──────────────────────────────────────────────────────────
export type Role = 'ADMIN' | 'HR_MANAGER' | 'EMPLOYEE'

export interface AuthUser {
  id: string
  email: string
  role: Role
  employeeId?: string
}

export interface LoginResponse {
  user: AuthUser
  accessToken: string
  refreshToken: string
}

// ─── Leave Requests ────────────────────────────────────────────────
export type LeaveType = 'VACATION' | 'SICK_LEAVE' | 'PERSONAL' | 'OTHER'
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface LeaveRequest {
  id: string
  employeeId: string
  type: LeaveType
  status: LeaveStatus
  startDate: string
  endDate: string
  reason: string
  reviewComment?: string
  reviewedBy?: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
}

export interface LeaveBalance {
  employeeId: string
  year: number
  totalDays: number
  usedDays: number
  pendingDays: number
  availableDays: number
}

// ─── System Parameters ─────────────────────────────────────────────
export type ParamStatus = 'ACTIVE' | 'INACTIVE'

export interface SystemParameter {
  id: string
  key: string
  value: string
  description: string
  status: ParamStatus
  effectiveDate: string
  createdAt: string
  updatedAt: string
}

// ─── Employees ─────────────────────────────────────────────────────
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED'

export interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  status: EmployeeStatus
  departmentId: string
  positionId: string
  branchId: string
  hireDate: string
  createdAt: string
}

// ─── Self Service Profile ──────────────────────────────────────────
export interface SelfServiceProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  address?: string
  emergencyContact?: string
  department: string
  position: string
  branch: string
  hireDate: string
}