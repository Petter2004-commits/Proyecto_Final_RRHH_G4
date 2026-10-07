import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { handleApiError } from '../../utils/errorHandler'
import type { Employee } from '../../types'

export default function EmployeesPage() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await apiClient.get('/employees', {
          params: { page: 1, limit: 20, search }
        })
        setEmployees(res.data.data.items)
      } catch (err) {
        setError(handleApiError(err).message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchEmployees()
  }, [search])

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4" style={{ borderColor: '#e2e8f0' }}>
        <button onClick={() => navigate('/dashboard')} style={{ color: '#2563eb' }}>← Dashboard</button>
        <h1 className="text-lg font-bold" style={{ color: '#1e293b' }}>Empleados</h1>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-6">
        <input
          type="text"
          placeholder="Buscar empleado..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg text-sm outline-none mb-4"
          style={{ border: '1px solid #e2e8f0', background: '#fff' }}
        />
        {isLoading && <p style={{ color: '#94a3b8' }}>Cargando...</p>}
        {error && <p style={{ color: '#dc2626' }}>{error}</p>}
        {!isLoading && employees.length === 0 && <p style={{ color: '#94a3b8' }}>No hay empleados.</p>}
        <div className="space-y-2">
          {employees.map((emp) => (
            <div key={emp.id} className="bg-white rounded-xl border px-5 py-4 flex items-center justify-between"
              style={{ borderColor: '#e2e8f0' }}>
              <div>
                <p className="font-medium text-sm" style={{ color: '#1e293b' }}>{emp.firstName} {emp.lastName}</p>
                <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{emp.email}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full font-medium"
                style={{ background: emp.status === 'ACTIVE' ? '#f0fdf4' : '#fef2f2', color: emp.status === 'ACTIVE' ? '#16a34a' : '#dc2626' }}>
                {emp.status}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}