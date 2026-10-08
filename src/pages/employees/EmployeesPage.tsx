import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { handleApiError } from '../../utils/errorHandler'
import type { Employee } from '../../types'

interface Catalog {
  id: string
  name: string
  departmentIds?: string[]
}

export default function EmployeesPage() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [departments, setDepartments] = useState<Catalog[]>([])
  const [positions, setPositions] = useState<Catalog[]>([])
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [form, setForm] = useState({
    firstName: '', lastName: '', dpi: '', email: '', phone: '',
    address: '', birthDate: '', hireDate: '', baseSalary: '',
    departmentId: '', positionId: ''
  })

  const fetchEmployees = async () => {
    setIsLoading(true)
    try {
      const res = await apiClient.get('/employees', { params: { page: 1, limit: 50, search } })
      setEmployees(res.data.data.items)
    } catch (err) {
      setError(handleApiError(err).message)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCatalogs = async () => {
    try {
      const res = await apiClient.get('/employee-catalogs')
      setDepartments(res.data.data.departments)
      setPositions(res.data.data.positions)
    } catch {}
  }

  useEffect(() => { fetchEmployees() }, [search])
  useEffect(() => { fetchCatalogs() }, [])

  const handleCreate = async () => {
    setCreating(true)
    setCreateError(null)
    try {
      await apiClient.post('/employees', { ...form })
      setShowModal(false)
      setForm({ firstName: '', lastName: '', dpi: '', email: '', phone: '', address: '', birthDate: '', hireDate: '', baseSalary: '', departmentId: '', positionId: '' })
      fetchEmployees()
    } catch (err) {
      setCreateError(handleApiError(err).message)
    } finally {
      setCreating(false)
    }
  }

  const filteredPositions = form.departmentId
    ? positions.filter(p => p.departmentIds?.includes(form.departmentId))
    : positions

  const activeCount = employees.filter(e => e.status === 'ACTIVE').length
  const inactiveCount = employees.filter(e => e.status !== 'ACTIVE').length
  const colors = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626']

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>

      {/* TOPBAR */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: '#e2e8f0' }}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-all"
            style={{ color: '#2563eb', background: '#eff6ff' }}>
            ← Dashboard
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#2563eb' }}>Recursos Humanos</p>
            <h1 className="text-lg font-bold" style={{ color: '#1e293b' }}>Empleados</h1>
          </div>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)', boxShadow: '0 4px 14px rgba(37,99,235,0.25)' }}>
          + Nuevo empleado
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">

        {/* STATS */}
<div className="grid grid-cols-3 gap-4 mb-6">
  {[
    {
      label: 'Total empleados', value: employees.length, color: '#2563eb', bg: '#eff6ff',
      icon: <svg className="w-5 h-5" fill="none" stroke="#2563eb" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    },
    {
      label: 'Activos', value: activeCount, color: '#059669', bg: '#f0fdf4',
      icon: <svg className="w-5 h-5" fill="none" stroke="#059669" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    },
    {
      label: 'Inactivos', value: inactiveCount, color: '#d97706', bg: '#fffbeb',
      icon: <svg className="w-5 h-5" fill="none" stroke="#d97706" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
    },
  ].map((s) => (
    <div key={s.label} className="bg-white rounded-2xl border p-5 flex items-center gap-4"
      style={{ borderColor: '#e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: s.bg }}>
        {s.icon}
      </div>
      <div>
        <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
        <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{s.label}</p>
      </div>
    </div>
  ))}
</div>

        {/* BÚSQUEDA */}
        <div className="bg-white rounded-xl border p-4 mb-6" style={{ borderColor: '#e2e8f0' }}>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" fill="none" stroke="#94a3b8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: '1px solid #e2e8f0', background: '#f8fafc', color: '#1e293b' }}
            />
          </div>
        </div>

        {/* ESTADOS */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="inline-block w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm" style={{ color: '#94a3b8' }}>Cargando empleados...</p>
          </div>
        )}
        {error && (
          <div className="rounded-xl px-4 py-3 text-sm mb-4" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
            {error}
          </div>
        )}
        {!isLoading && employees.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border" style={{ borderColor: '#e2e8f0' }}>
            <p className="text-5xl mb-3">👥</p>
            <p className="font-medium" style={{ color: '#1e293b' }}>No hay empleados</p>
            <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Crea el primer empleado con el botón de arriba</p>
          </div>
        )}

        {/* CARDS */}
        {!isLoading && employees.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((emp, i) => (
              <div key={emp.id}
                className="bg-white rounded-2xl border p-5 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ borderColor: '#e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                onClick={() => navigate(`/employees/${emp.id}`)}>

                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ background: colors[i % colors.length] }}>
                    {emp.firstName.charAt(0)}
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{
                      background: emp.status === 'ACTIVE' ? '#f0fdf4' : '#fef2f2',
                      color: emp.status === 'ACTIVE' ? '#16a34a' : '#dc2626',
                    }}>
                    {emp.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <h3 className="font-semibold mb-0.5" style={{ color: '#1e293b' }}>
                  {emp.firstName} {emp.lastName}
                </h3>
                <p className="text-xs mb-4 truncate" style={{ color: '#94a3b8' }}>{emp.email}</p>

                <div className="flex flex-wrap gap-2">
                  {emp.department?.name && (
                    <span className="text-xs px-2.5 py-1 rounded-lg font-medium"
                      style={{ background: '#eff6ff', color: '#2563eb' }}>
                      {emp.department.name}
                    </span>
                  )}
                  {emp.position?.name && (
                    <span className="text-xs px-2.5 py-1 rounded-lg font-medium"
                      style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                      {emp.position.name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 overflow-hidden"
            style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0' }}>

            <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: '#e2e8f0' }}>
              <div>
                <h2 className="font-bold text-base" style={{ color: '#1e293b' }}>Nuevo empleado</h2>
                <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>Completa los datos del nuevo colaborador</p>
              </div>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ background: '#f1f5f9', color: '#64748b' }}>✕</button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
              {createError && (
                <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                  {createError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Nombre', key: 'firstName', type: 'text', placeholder: 'Juan' },
                  { label: 'Apellido', key: 'lastName', type: 'text', placeholder: 'Pérez' },
                  { label: 'DPI', key: 'dpi', type: 'text', placeholder: '0000000000000' },
                  { label: 'Correo', key: 'email', type: 'email', placeholder: 'correo@empresa.com' },
                  { label: 'Teléfono', key: 'phone', type: 'text', placeholder: '5555-0000' },
                  { label: 'Salario base', key: 'baseSalary', type: 'text', placeholder: '5000.00' },
                  { label: 'Fecha nacimiento', key: 'birthDate', type: 'date', placeholder: '' },
                  { label: 'Fecha ingreso', key: 'hireDate', type: 'date', placeholder: '' },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>{f.label}</label>
                    <input
                      type={f.type}
                      placeholder={f.placeholder}
                      value={(form as any)[f.key]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                      style={{ border: '1px solid #e2e8f0', background: '#f8fafc', color: '#1e293b' }}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Dirección</label>
                <input
                  type="text"
                  placeholder="Zona 1, Guatemala"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: '1px solid #e2e8f0', background: '#f8fafc', color: '#1e293b' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Departamento</label>
                  <select
                    value={form.departmentId}
                    onChange={(e) => setForm({ ...form, departmentId: e.target.value, positionId: '' })}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #e2e8f0', background: '#f8fafc', color: '#1e293b' }}>
                    <option value="">Seleccionar...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Puesto</label>
                  <select
                    value={form.positionId}
                    onChange={(e) => setForm({ ...form, positionId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #e2e8f0', background: '#f8fafc', color: '#1e293b' }}>
                    <option value="">Seleccionar...</option>
                    {filteredPositions.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ borderColor: '#e2e8f0' }}>
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: '#f1f5f9', color: '#64748b' }}>
                Cancelar
              </button>
              <button onClick={handleCreate} disabled={creating}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}>
                {creating ? 'Creando...' : 'Crear empleado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}