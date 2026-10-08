import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import type { Role } from '../../types'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: Role[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuthStore()

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  // Si hay roles permitidos y el usuario no tiene el rol, redirigir
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'EMPLOYEE') {
      return <Navigate to="/self-service/profile" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}