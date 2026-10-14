import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ProtectedRoute from './components/layout/ProtectedRoute'
import EmployeesPage from './pages/employees/EmployeesPage'
import SystemParamsPage from './pages/system-params/SystemParamsPage'
import SelfServicePage from './pages/self-service/SelfServicePage'
import ProfilePage from './pages/self-service/ProfilePage'
import LeaveRequestsPage from './pages/leave-requests/LeaveRequestsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/leave-requests" element={<LeaveRequestsPage />} />
        <Route path="/system-params" element={<SystemParamsPage />} />
        <Route path="/self-service/profile" element={<ProfilePage />} />
        <Route path="/self-service/leave-requests" element={<SelfServicePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}