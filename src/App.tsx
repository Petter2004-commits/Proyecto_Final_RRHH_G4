import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'

// Error temporal para rutas pendientes
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
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/leave-requests" element={<ComingSoon title="Solicitudes de Ausencias" />} />
      <Route path="/employees" element={<ComingSoon title="Empleados" />} />
      <Route path="/system-params" element={<ComingSoon title="Parametros del Sistema" />} />
      <Route path="/self-service/profile" element={<ComingSoon title="Mi Perfil" />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}