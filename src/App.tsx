import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import EmployeesPage from "./pages/employees/EmployeesPage";
import LeaveRequestsPage from './pages/leave-requests/LeaveRequestsPage'

function ComingSoon({ title }: { title: string }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: "#f1f5f9" }}
    >
      <div className="text-center">
        <p className="text-4xl mb-4">🚧</p>
        <h1 className="text-xl font-bold" style={{ color: "#0f172a" }}>
          {title}
        </h1>
        <p className="text-sm mt-2" style={{ color: "#94a3b8" }}>
          Esta página está en construcción
        </p>
        <a
          href="/dashboard"
          className="inline-block mt-6 text-sm font-medium"
          style={{ color: "#2563eb" }}
        >
          ← Volver al dashboard
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Pública */}
      <Route path="/login" element={<LoginPage />} />

      {/* Solo ADMIN y HR_MANAGER */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "HR_MANAGER"]}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leave-requests"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "HR_MANAGER"]}>
          <LeaveRequestsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "HR_MANAGER"]}>
            <EmployeesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/system-params"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <ComingSoon title="Parámetros del Sistema" />
          </ProtectedRoute>
        }
      />

      {/* Solo EMPLOYEE */}
      <Route
        path="/self-service/profile"
        element={
          <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
            <ComingSoon title="Mi Perfil" />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
