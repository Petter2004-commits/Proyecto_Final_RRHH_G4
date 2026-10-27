import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { leaveRequestsApi } from '../../api/endpoints/leaveRequests'
import { apiClient } from '../../api/client'
import { handleApiError } from '../../utils/errorHandler'
import type { LeaveRequest } from '../../types'

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:   { label: 'Pendiente',  color: '#d97706', bg: '#fffbeb' },
  APPROVED:  { label: 'Aprobada',   color: '#059669', bg: '#f0fdf4' },
  REJECTED:  { label: 'Rechazada',  color: '#dc2626', bg: '#fef2f2' },
  CANCELLED: { label: 'Cancelada',  color: '#64748b', bg: '#f1f5f9' },
}

const TYPE_LABELS: Record<string, string> = {
  VACATION:   'Vacaciones',
  SICK_LEAVE: 'Enfermedad',
  PERSONAL:   'Personal',
  OTHER:      'Otro',
}

export default function LeaveRequestsPage() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<LeaveRequest | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [reviewComment, setReviewComment] = useState('')
  const [deciding, setDeciding] = useState(false)
  const [decideError, setDecideError] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<'APPROVED' | 'REJECTED' | 'CANCELLED' | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [employees, setEmployees] = useState<{ id: string; firstName: string; lastName: string }[]>([])
  const [employeeSearch, setEmployeeSearch] = useState('')
  const location = useLocation()
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false)
  const [createForm, setCreateForm] = useState({
    employeeId: '', type: 'VACATION' as 'VACATION' | 'SICK_LEAVE' | 'OTHER',
    startDate: '', endDate: '', reason: '',
  })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const fetchRequests = async () => {
    setIsLoading(true)
    try {
      const data = await leaveRequestsApi.getAll({
        page: 1, limit: 50,
        status: statusFilter || undefined,
      })
      setRequests(data.items)
    } catch (err) {
      setError(handleApiError(err).message)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const res = await apiClient.get('/employees', { params: { page: 1, limit: 100 } })
      setEmployees(res.data.data.items)
    } catch {}
  }

  useEffect(() => { fetchRequests() }, [statusFilter])

useEffect(() => {
  if (!isLoading && requests.length > 0) {
    const params = new URLSearchParams(location.search)
    const openId = params.get('openId')
    if (openId) {
      const req = requests.find(r => r.id === openId)
      if (req) openDetail(req)
    }
  }
}, [isLoading, requests])

  const filteredEmployees = employees.filter((e) => {
    const q = employeeSearch.toLowerCase()
    return `${e.firstName} ${e.lastName}`.toLowerCase().includes(q)
  })

  const selectedEmployee = employees.find((e) => e.id === createForm.employeeId)

  const openDetail = (req: LeaveRequest) => {
    setSelected(req)
    setReviewComment('')
    setDecideError(null)
    setConfirmAction(null)
    setShowModal(true)
  }

  const handleDecide = async (status: 'APPROVED' | 'REJECTED') => {
    if (status === 'REJECTED' && !reviewComment.trim()) {
      setDecideError('El comentario es obligatorio al rechazar.')
      return
    }
    setDeciding(true)
    setDecideError(null)
    try {
      await leaveRequestsApi.decide(selected!.id, {
        status,
        reviewComment: reviewComment || undefined,
      })
      setShowModal(false)
      fetchRequests()
    } catch (err) {
      setDecideError(handleApiError(err).message)
    } finally {
      setDeciding(false)
    }
  }

  const handleCancel = async () => {
    setDeciding(true)
    setDecideError(null)
    try {
      await leaveRequestsApi.cancel(selected!.id)
      setShowModal(false)
      fetchRequests()
    } catch (err) {
      setDecideError(handleApiError(err).message)
    } finally {
      setDeciding(false)
    }
  }

  const handleCreate = async () => {
    if (!createForm.employeeId || !createForm.startDate || !createForm.endDate) {
      setCreateError('Empleado, fecha inicio y fecha fin son obligatorios.')
      return
    }
    if (createForm.startDate > createForm.endDate) {
      setCreateError('La fecha de inicio no puede ser posterior a la fecha fin.')
      return
    }
    setCreating(true)
    setCreateError(null)
    try {
      await leaveRequestsApi.createForEmployee({
        ...createForm,
        reason: createForm.reason || 'Sin motivo especificado',
      })
      setShowCreateModal(false)
      setCreateForm({ employeeId: '', type: 'VACATION', startDate: '', endDate: '', reason: '' })
      setEmployeeSearch('')
      fetchRequests()
    } catch (err: any) {
      if (err?.response?.data?.error?.code === 'LEAVE_REQUEST_DATE_OVERLAP') {
        setCreateError('Las fechas se traslapan con otra solicitud pendiente o aprobada del mismo empleado.')
      } else {
        setCreateError(handleApiError(err).message)
      }
    } finally {
      setCreating(false)
    }
  }

  const sorted = [...requests].sort((a, b) => {
    const nameA = `${a.employee.firstName} ${a.employee.lastName}`.toLowerCase()
    const nameB = `${b.employee.firstName} ${b.employee.lastName}`.toLowerCase()
    return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
  })

  const pendingCount = requests.filter(r => r.status === 'PENDING').length
  const approvedCount = requests.filter(r => r.status === 'APPROVED').length
  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>

      {/* HEADER */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: '#e2e8f0' }}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg"
            style={{ color: '#2563eb', background: '#eff6ff' }}>
            ← Dashboard
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#2563eb' }}>Administración</p>
            <h1 className="text-lg font-bold" style={{ color: '#1e293b' }}>Solicitudes de Vacaciones y Ausencias</h1>
          </div>
        </div>
        <button
          onClick={() => { setShowCreateModal(true); fetchEmployees() }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)', boxShadow: '0 4px 14px rgba(37,99,235,0.25)' }}
        >
          + Nueva solicitud
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Pendientes', value: pendingCount, color: '#d97706', bg: '#fffbeb',
              icon: <svg className="w-5 h-5" fill="none" stroke="#d97706" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
            { label: 'Aprobadas', value: approvedCount, color: '#059669', bg: '#f0fdf4',
              icon: <svg className="w-5 h-5" fill="none" stroke="#059669" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
            { label: 'Rechazadas', value: rejectedCount, color: '#dc2626', bg: '#fef2f2',
              icon: <svg className="w-5 h-5" fill="none" stroke="#dc2626" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
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

        {/* FILTRO */}
        <div className="bg-white rounded-xl border p-4 mb-6 flex flex-wrap gap-2" style={{ borderColor: '#e2e8f0' }}>
          {[
            { value: '', label: 'Todas' },
            { value: 'PENDING', label: 'Pendientes' },
            { value: 'APPROVED', label: 'Aprobadas' },
            { value: 'REJECTED', label: 'Rechazadas' },
            { value: 'CANCELLED', label: 'Canceladas' },
          ].map((f) => (
            <button key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: statusFilter === f.value ? '#2563eb' : '#f1f5f9',
                color: statusFilter === f.value ? '#ffffff' : '#64748b',
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* ESTADOS */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="inline-block w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm" style={{ color: '#94a3b8' }}>Cargando solicitudes...</p>
          </div>
        )}
        {error && (
          <div className="rounded-xl px-4 py-3 text-sm mb-4" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
            {error}
          </div>
        )}
        {!isLoading && requests.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border" style={{ borderColor: '#e2e8f0' }}>
            <p className="font-medium" style={{ color: '#1e293b' }}>No hay solicitudes</p>
            <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>No se encontraron solicitudes con ese filtro</p>
          </div>
        )}

        {/* TABLA */}
        {!isLoading && requests.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm" style={{ color: "#64748b" }}>{requests.length} solicitud(es)</p>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "#f1f5f9", color: "#64748b" }}
              >
                {sortOrder === 'asc' ? '↑ A-Z' : '↓ Z-A'}
              </button>
            </div>
            <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      {['Empleado', 'Tipo', 'Desde', 'Hasta', 'Estado', 'Acciones'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: '#64748b' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((req, i) => {
                      const s = STATUS_LABELS[req.status] ?? STATUS_LABELS.PENDING
                      return (
                        <tr key={req.id} style={{ borderBottom: i < requests.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                          <td className="px-4 py-3 font-medium" style={{ color: '#1e293b' }}>
                            {req.employee.firstName} {req.employee.lastName}
                          </td>
                          <td className="px-4 py-3" style={{ color: '#64748b' }}>
                            {TYPE_LABELS[req.type] ?? req.type}
                          </td>
                          <td className="px-4 py-3" style={{ color: '#64748b' }}>
                            {new Date(req.startDate).toLocaleDateString('es-GT')}
                          </td>
                          <td className="px-4 py-3" style={{ color: '#64748b' }}>
                            {new Date(req.endDate).toLocaleDateString('es-GT')}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{ background: s.bg, color: s.color }}>
                              {s.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => openDetail(req)}
                              className="text-xs px-3 py-1.5 rounded-lg font-medium"
                              style={{ background: '#eff6ff', color: '#2563eb' }}>
                              Ver detalle
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* MODAL DETALLE */}
      {showModal && selected && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
            style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0' }}>
            <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: '#e2e8f0' }}>
              <h2 className="font-bold text-base" style={{ color: '#1e293b' }}>Detalle de solicitud</h2>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ background: '#f1f5f9', color: '#64748b' }}>✕</button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {[
                { label: 'Tipo', value: TYPE_LABELS[selected.type] ?? selected.type },
                { label: 'Desde', value: new Date(selected.startDate).toLocaleDateString('es-GT') },
                { label: 'Hasta', value: new Date(selected.endDate).toLocaleDateString('es-GT') },
                { label: 'Motivo', value: selected.reason },
                { label: 'Estado', value: STATUS_LABELS[selected.status]?.label ?? selected.status },
              ].map((item) => (
                <div key={item.label} className="flex justify-between py-2 border-b last:border-0"
                  style={{ borderColor: '#f1f5f9' }}>
                  <span className="text-xs" style={{ color: '#94a3b8' }}>{item.label}</span>
                  <span className="text-xs font-medium" style={{ color: '#1e293b' }}>{item.value}</span>
                </div>
              ))}
              {selected.status === 'PENDING' && (
                <div className="pt-2">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>
                    Comentario de revisión <span style={{ color: '#dc2626' }}>(obligatorio al rechazar)</span>
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    placeholder="Escribe un comentario..."
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                    style={{ border: '1px solid #e2e8f0', background: '#f8fafc', color: '#1e293b' }}
                  />
                </div>
              )}
              {decideError && (
                <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                  {decideError}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t flex flex-wrap justify-end gap-2" style={{ borderColor: '#e2e8f0' }}>
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: '#f1f5f9', color: '#64748b' }}>
                Cerrar
              </button>
              {selected.status === 'PENDING' && (
                <>
                  {confirmAction === 'REJECTED' ? (
                    <button onClick={() => handleDecide('REJECTED')} disabled={deciding}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                      style={{ background: '#dc2626' }}>
                      {deciding ? 'Rechazando...' : 'Confirmar rechazo'}
                    </button>
                  ) : (
                    <button onClick={() => setConfirmAction('REJECTED')}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                      style={{ background: '#dc2626' }}>
                      Rechazar
                    </button>
                  )}
                  {confirmAction === 'APPROVED' ? (
                    <button onClick={() => handleDecide('APPROVED')} disabled={deciding}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                      style={{ background: '#059669' }}>
                      {deciding ? 'Aprobando...' : 'Confirmar aprobación'}
                    </button>
                  ) : (
                    <button onClick={() => setConfirmAction('APPROVED')}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                      style={{ background: '#059669' }}>
                      Aprobar
                    </button>
                  )}
                </>
              )}
              {(selected.status === 'PENDING' || selected.status === 'APPROVED') && (
                <>
                  {confirmAction === 'CANCELLED' ? (
                    <button onClick={handleCancel} disabled={deciding}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                      style={{ background: '#64748b' }}>
                      {deciding ? 'Cancelando...' : 'Confirmar cancelación'}
                    </button>
                  ) : (
                    <button onClick={() => setConfirmAction('CANCELLED')}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                      style={{ background: '#64748b' }}>
                      Cancelar solicitud
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVA SOLICITUD */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
            style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0' }}>
            <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: '#e2e8f0' }}>
              <h2 className="font-bold text-base" style={{ color: '#1e293b' }}>Nueva solicitud</h2>
              <button onClick={() => { setShowCreateModal(false); setEmployeeSearch(''); setCreateForm({ employeeId: '', type: 'VACATION', startDate: '', endDate: '', reason: '' }) }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ background: '#f1f5f9', color: '#64748b' }}>✕</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {createError && (
                <div className="px-4 py-3 rounded-xl text-sm"
                  style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                  {createError}
                </div>
              )}

              {/* BUSCADOR DE EMPLEADO */}
              <div className="relative">
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Empleado</label>
                <input
                  type="text"
                  value={selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : employeeSearch}
                  onChange={(e) => {
                    setEmployeeSearch(e.target.value)
                    setCreateForm({ ...createForm, employeeId: '' })
                    setShowEmployeeDropdown(true)
                  }}
                  onFocus={() => { if (!createForm.employeeId) setShowEmployeeDropdown(true) }}
                  onBlur={() => setTimeout(() => setShowEmployeeDropdown(false), 150)}
                  placeholder="Buscar empleado por nombre..."
                  autoComplete="off"
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: '1px solid #e2e8f0', background: '#f8fafc', color: '#1e293b' }}
                />
                {createForm.employeeId && (
                  <button
                    type="button"
                    onClick={() => { setCreateForm({ ...createForm, employeeId: '' }); setEmployeeSearch('') }}
                    className="absolute right-3 top-8 text-xs"
                    style={{ color: '#94a3b8' }}
                  >✕</button>
                )}
                {showEmployeeDropdown && !createForm.employeeId && (
                  <div className="absolute z-50 w-full mt-1 rounded-lg border overflow-auto"
                    style={{ background: '#fff', borderColor: '#e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: '200px' }}>
                    {filteredEmployees.length === 0 ? (
                      <div className="px-4 py-3 text-sm" style={{ color: '#94a3b8' }}>
                        {employees.length === 0 ? 'Cargando empleados...' : 'No se encontraron resultados'}
                      </div>
                    ) : (
                      filteredEmployees.map((e) => (
                        <button
                          key={e.id}
                          type="button"
                          onMouseDown={() => {
                            setCreateForm({ ...createForm, employeeId: e.id })
                            setEmployeeSearch('')
                            setShowEmployeeDropdown(false)
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                          style={{ color: '#1e293b' }}
                          onMouseEnter={(ev) => ev.currentTarget.style.background = '#f1f5f9'}
                          onMouseLeave={(ev) => ev.currentTarget.style.background = 'transparent'}
                        >
                          {e.firstName} {e.lastName}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Tipo</label>
                <select value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as typeof createForm.type })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: '1px solid #e2e8f0', background: '#f8fafc', color: '#1e293b' }}>
                  <option value="VACATION">Vacaciones</option>
                  <option value="SICK_LEAVE">Enfermedad</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Fecha inicio</label>
                  <input type="date" value={createForm.startDate}
                    onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #e2e8f0', background: '#f8fafc', color: '#1e293b' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Fecha fin</label>
                  <input type="date" value={createForm.endDate}
                    onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #e2e8f0', background: '#f8fafc', color: '#1e293b' }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Motivo (opcional)</label>
                <input type="text" value={createForm.reason}
                  onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: '1px solid #e2e8f0', background: '#f8fafc', color: '#1e293b' }} />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ borderColor: '#e2e8f0' }}>
              <button onClick={() => { setShowCreateModal(false); setEmployeeSearch(''); setCreateForm({ employeeId: '', type: 'VACATION', startDate: '', endDate: '', reason: '' }) }}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: '#f1f5f9', color: '#64748b' }}>
                Cancelar
              </button>
              <button onClick={handleCreate} disabled={creating}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}>
                {creating ? 'Creando...' : 'Crear solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}