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

const ONLY_LETTERS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/
const TODAY = new Date().toISOString().split('T')[0]

const defaultForm = {
  firstName: '', lastName: '', dpi: '', email: '', phone: '',
  address: '', birthDate: '', hireDate: '', baseSalary: '',
  departmentId: '', positionId: ''
}

function validate(form: typeof defaultForm) {
  const errors: Partial<typeof defaultForm> = {}
  if (!ONLY_LETTERS.test(form.firstName) || form.firstName.trim().length < 2)
    errors.firstName = 'Solo letras, mínimo 2 caracteres'
  if (!ONLY_LETTERS.test(form.lastName) || form.lastName.trim().length < 2)
    errors.lastName = 'Solo letras, mínimo 2 caracteres'
  if (!/^\d{13}$/.test(form.dpi))
    errors.dpi = 'El DPI debe tener exactamente 13 dígitos'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = 'Correo inválido'
  if (!/^\d{8}$/.test(form.phone.replace(/[-\s]/g, '')))
    errors.phone = 'El teléfono debe tener 8 dígitos'
  if (!form.address.trim())
    errors.address = 'La dirección es requerida'
  if (!form.birthDate || form.birthDate >= TODAY)
    errors.birthDate = 'La fecha de nacimiento debe ser anterior a hoy'
  if (!form.hireDate || form.hireDate > TODAY)
    errors.hireDate = 'La fecha de ingreso no puede ser futura'
  if (!form.baseSalary || parseFloat(form.baseSalary) <= 0)
    errors.baseSalary = 'El salario debe ser mayor a 0'
  if (!form.departmentId)
    errors.departmentId = 'Selecciona un departamento'
  if (!form.positionId)
    errors.positionId = 'Selecciona un puesto'
  return errors
}

export default function EmployeesPage() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [departments, setDepartments] = useState<Catalog[]>([])
  const [positions, setPositions] = useState<Catalog[]>([])
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<typeof defaultForm>>({})
  const [form, setForm] = useState(defaultForm)
  const [editingId, setEditingId] = useState<string | null>(null)

  const isEditing = !!editingId

  const fetchEmployees = async () => {
    setIsLoading(true)
    try {
      const res = await apiClient.get('/employees', { params: { page: 1, limit: 100 } })
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

  useEffect(() => { fetchEmployees() }, [])
  useEffect(() => { fetchCatalogs() }, [])

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setForm(defaultForm)
    setFieldErrors({})
    setCreateError(null)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(defaultForm)
    setFieldErrors({})
    setCreateError(null)
    setShowModal(true)
  }

  const openEdit = (emp: Employee) => {
    setForm({
      firstName: emp.firstName ?? '',
      lastName: emp.lastName ?? '',
      dpi: emp.dpi ?? '',
      email: emp.email ?? '',
      phone: emp.phone ?? '',
      address: emp.address ?? '',
      birthDate: emp.birthDate?.split('T')[0] ?? '',
      hireDate: emp.hireDate?.split('T')[0] ?? '',
      baseSalary: String(emp.baseSalary ?? ''),
      departmentId: emp.department?.id ?? '',
      positionId: emp.position?.id ?? '',
    })
    setEditingId(emp.id)
    setSelectedEmployee(null)
    setFieldErrors({})
    setCreateError(null)
    setShowModal(true)
  }

  const handleEdit = async () => {
    const errors = validate(form)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setCreating(true)
    setCreateError(null)
    try {
      await apiClient.patch(`/employees/${editingId}`, {
        phone: form.phone,
        address: form.address,
        baseSalary: parseFloat(form.baseSalary),
        departmentId: form.departmentId,
        positionId: form.positionId,
      })
      closeModal()
      fetchEmployees()
    } catch (err) {
      setCreateError(handleApiError(err).message)
    } finally {
      setCreating(false)
    }
  }

  const handleCreate = async () => {
    const errors = validate(form)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setCreating(true)
    setCreateError(null)
    try {
      await apiClient.post('/employees', {
        ...form,
        baseSalary: parseFloat(form.baseSalary)
      })
      closeModal()
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

  const filtered = employees.filter(emp => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase()
    const matchSearch = !search || fullName.includes(search.toLowerCase()) || emp.email.toLowerCase().includes(search.toLowerCase())
    const matchDept = !filterDept || emp.department?.id === filterDept
    const matchStatus = !filterStatus || emp.status === filterStatus
    return matchSearch && matchDept && matchStatus
  })

  const activeCount = employees.filter(e => e.status === 'ACTIVE').length
  const inactiveCount = employees.filter(e => e.status !== 'ACTIVE').length
  const colors = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626']

  // Función (no componente) para que los inputs no pierdan el foco en cada render
  const inputField = ({ label, fieldKey, type = 'text', placeholder = '', disabled = false }: {
    label: string
    fieldKey: keyof typeof defaultForm
    type?: string
    placeholder?: string
    disabled?: boolean
  }) => (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={form[fieldKey]}
        disabled={disabled}
        max={type === 'date' ? TODAY : undefined}
        onChange={(e) => {
          setForm({ ...form, [fieldKey]: e.target.value })
          if (fieldErrors[fieldKey]) setFieldErrors({ ...fieldErrors, [fieldKey]: undefined })
        }}
        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          border: `1px solid ${fieldErrors[fieldKey] ? '#fca5a5' : '#e2e8f0'}`,
          background: fieldErrors[fieldKey] ? '#fff5f5' : '#f8fafc',
          color: '#1e293b'
        }}
      />
      {fieldErrors[fieldKey] && (
        <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{fieldErrors[fieldKey]}</p>
      )}
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>

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
        <button onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)', boxShadow: '0 4px 14px rgba(37,99,235,0.25)' }}>
          + Nuevo empleado
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">

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
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                {s.icon}
              </div>
              <div>
                <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border p-4 mb-6 flex flex-wrap gap-3" style={{ borderColor: '#e2e8f0' }}>
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" fill="none" stroke="#94a3b8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Buscar por nombre o correo..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: '1px solid #e2e8f0', background: '#f8fafc', color: '#1e293b' }} />
          </div>
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}
            className="px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ border: '1px solid #e2e8f0', background: '#f8fafc', color: '#1e293b', minWidth: '160px' }}>
            <option value="">Todos los departamentos</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ border: '1px solid #e2e8f0', background: '#f8fafc', color: '#1e293b', minWidth: '130px' }}>
            <option value="">Todos los estados</option>
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
          </select>
        </div>

        {isLoading && (
          <div className="text-center py-16">
            <div className="inline-block w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm" style={{ color: '#94a3b8' }}>Cargando empleados...</p>
          </div>
        )}
        {error && (
          <div className="rounded-xl px-4 py-3 text-sm mb-4" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>{error}</div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border" style={{ borderColor: '#e2e8f0' }}>
            <p className="font-medium" style={{ color: '#1e293b' }}>No hay empleados</p>
            <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Intenta otro filtro o crea un nuevo empleado</p>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((emp, i) => (
              <div key={emp.id}
                className="bg-white rounded-2xl border p-5 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ borderColor: '#e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                onClick={() => setSelectedEmployee(emp)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ background: colors[i % colors.length] }}>
                    {emp.firstName.charAt(0)}
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ background: emp.status === 'ACTIVE' ? '#f0fdf4' : '#fef2f2', color: emp.status === 'ACTIVE' ? '#16a34a' : '#dc2626' }}>
                    {emp.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <h3 className="font-semibold mb-0.5" style={{ color: '#1e293b' }}>{emp.firstName} {emp.lastName}</h3>
                <p className="text-xs mb-4 truncate" style={{ color: '#94a3b8' }}>{emp.email}</p>
                <div className="flex flex-wrap gap-2">
                  {emp.department?.name && (
                    <span className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ background: '#eff6ff', color: '#2563eb' }}>{emp.department.name}</span>
                  )}
                  {emp.position?.name && (
                    <span className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ background: '#f5f3ff', color: '#7c3aed' }}>{emp.position.name}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL DETALLE */}
      {selectedEmployee && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 overflow-hidden"
            style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0' }}>
            <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: '#e2e8f0' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: '#2563eb' }}>
                  {selectedEmployee.firstName.charAt(0)}
                </div>
                <div>
                  <h2 className="font-bold text-base" style={{ color: '#1e293b' }}>{selectedEmployee.firstName} {selectedEmployee.lastName}</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: selectedEmployee.status === 'ACTIVE' ? '#f0fdf4' : '#fef2f2', color: selectedEmployee.status === 'ACTIVE' ? '#16a34a' : '#dc2626' }}>
                    {selectedEmployee.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedEmployee(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ background: '#f1f5f9', color: '#64748b' }}>✕</button>
            </div>
            <div className="px-6 py-5 space-y-3 max-h-[65vh] overflow-y-auto">
              {[
                { label: 'Correo electrónico', value: selectedEmployee.email },
                { label: 'DPI', value: selectedEmployee.dpi },
                { label: 'Teléfono', value: selectedEmployee.phone },
                { label: 'Dirección', value: selectedEmployee.address },
                { label: 'Fecha de nacimiento', value: selectedEmployee.birthDate },
                { label: 'Fecha de ingreso', value: selectedEmployee.hireDate },
                { label: 'Salario base', value: selectedEmployee.baseSalary ? `Q${Number(selectedEmployee.baseSalary).toLocaleString('es-GT', { minimumFractionDigits: 2 })}` : '-' },
                { label: 'Departamento', value: selectedEmployee.department?.name },
                { label: 'Puesto', value: selectedEmployee.position?.name },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b" style={{ borderColor: '#f1f5f9' }}>
                  <span className="text-xs font-medium" style={{ color: '#64748b' }}>{label}</span>
                  <span className="text-sm font-semibold" style={{ color: '#1e293b' }}>{value || '—'}</span>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t flex justify-between" style={{ borderColor: '#e2e8f0' }}>
              <button onClick={() => openEdit(selectedEmployee)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: '#eff6ff', color: '#2563eb' }}>
                Editar
              </button>
              <button onClick={() => setSelectedEmployee(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: '#f1f5f9', color: '#64748b' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 overflow-hidden"
            style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0' }}>
            <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: '#e2e8f0' }}>
              <div>
                <h2 className="font-bold text-base" style={{ color: '#1e293b' }}>
                  {isEditing ? 'Editar empleado' : 'Nuevo empleado'}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                  {isEditing ? 'Actualiza los datos del colaborador' : 'Completa los datos del nuevo colaborador'}
                </p>
              </div>
              <button onClick={closeModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ background: '#f1f5f9', color: '#64748b' }}>✕</button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
              {createError && (
                <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>{createError}</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {inputField({ label: 'Nombre', fieldKey: 'firstName', placeholder: 'Juan', disabled: isEditing })}
                {inputField({ label: 'Apellido', fieldKey: 'lastName', placeholder: 'Pérez', disabled: isEditing })}
                {inputField({ label: 'DPI (13 dígitos)', fieldKey: 'dpi', placeholder: '0000000000000', disabled: isEditing })}
                {inputField({ label: 'Correo', fieldKey: 'email', type: 'email', placeholder: 'correo@empresa.com', disabled: isEditing })}
                {inputField({ label: 'Teléfono (8 dígitos)', fieldKey: 'phone', placeholder: '55550000' })}
                {inputField({ label: 'Salario base', fieldKey: 'baseSalary', placeholder: '5000.00' })}
                {inputField({ label: 'Fecha nacimiento', fieldKey: 'birthDate', type: 'date', disabled: isEditing })}
                {inputField({ label: 'Fecha ingreso', fieldKey: 'hireDate', type: 'date', disabled: isEditing })}
              </div>
              {inputField({ label: 'Dirección', fieldKey: 'address', placeholder: 'Zona 1, Guatemala' })}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Departamento</label>
                  <select value={form.departmentId}
                    onChange={(e) => { setForm({ ...form, departmentId: e.target.value, positionId: '' }); if (fieldErrors.departmentId) setFieldErrors({ ...fieldErrors, departmentId: undefined }) }}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ border: `1px solid ${fieldErrors.departmentId ? '#fca5a5' : '#e2e8f0'}`, background: fieldErrors.departmentId ? '#fff5f5' : '#f8fafc', color: '#1e293b' }}>
                    <option value="">Seleccionar...</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  {fieldErrors.departmentId && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{fieldErrors.departmentId}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Puesto</label>
                  <select value={form.positionId}
                    onChange={(e) => { setForm({ ...form, positionId: e.target.value }); if (fieldErrors.positionId) setFieldErrors({ ...fieldErrors, positionId: undefined }) }}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ border: `1px solid ${fieldErrors.positionId ? '#fca5a5' : '#e2e8f0'}`, background: fieldErrors.positionId ? '#fff5f5' : '#f8fafc', color: '#1e293b' }}>
                    <option value="">Seleccionar...</option>
                    {filteredPositions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  {fieldErrors.positionId && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{fieldErrors.positionId}</p>}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ borderColor: '#e2e8f0' }}>
              <button onClick={closeModal}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: '#f1f5f9', color: '#64748b' }}>Cancelar</button>
              <button onClick={isEditing ? handleEdit : handleCreate} disabled={creating}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}>
                {creating
                  ? (isEditing ? 'Guardando...' : 'Creando...')
                  : (isEditing ? 'Guardar cambios' : 'Crear empleado')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}