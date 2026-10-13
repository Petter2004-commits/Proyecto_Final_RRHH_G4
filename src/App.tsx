import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ProtectedRoute from './components/layout/ProtectedRoute'
import EmployeesPage from './pages/employees/EmployeesPage'
import SystemParamsPage from './pages/system-params/SystemParamsPage'
import SelfServicePage from './pages/self-service/SelfServicePage'
import LeaveRequestsPage from './pages/leave-requests/LeaveRequestsPage'

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: '#f1f5f9' }}>
      <div className="text-center">
        <p className="text-4xl mb-4">🚧</p>
        <h1 className="text-xl font-bold" style={{ color: '#0f172a' }}>{title}</h1>
        <p className="text-sm mt-2" style={{ color: '#94a3b8' }}>Esta pagina esta en construccion</p>
        <a href="/dashboard" className="inline-block mt-6 text-sm font-medium" style={{ color: '#2563eb' }}>
          ← Volver al dashboard
        </a>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
      <Route path="/self-service/leave-requests" element={<SelfServicePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/leave-requests" element={<LeaveRequestsPage />} />
        <Route path="/system-params" element={<SystemParamsPage />} />
        <Route path="/system-params" element={<ComingSoon title="Parametros del Sistema" />} />
        <Route path="/self-service/profile" element={<ComingSoon title="Mi Perfil" />} />
        <Route path="/self-service/leave-requests" element={<ComingSoon title="Mis Solicitudes" />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}