import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { selfServiceApi } from '../../api/endpoints/selfService'
import { useAuthStore } from '../../stores/authStore'
import type { LeaveRequest, LeaveType } from '../../types'
import {
  validateLeaveRequest,
  getToday,
  formatDate,
  canCancelByDate,
  countDays,
} from '../../utils/leaveRequestValidation'
import type { LeaveRequestErrors } from '../../utils/leaveRequestValidation'

const TYPE_LABELS: Record<string, string> = {
  VACATION:   'Vacaciones',
  SICK_LEAVE: 'Enfermedad',
  PERSONAL:   'Personal',
  OTHER:      'Otro',
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:   { label: 'Pendiente',  color: '#d97706', bg: '#fffbeb' },
  APPROVED:  { label: 'Aprobada',   color: '#059669', bg: '#f0fdf4' },
  REJECTED:  { label: 'Rechazada',  color: '#dc2626', bg: '#fef2f2' },
  CANCELLED: { label: 'Cancelada',  color: '#64748b', bg: '#f1f5f9' },
}

const TERMINAL_STATES = ['REJECTED', 'CANCELLED']

const emptyForm = {
  type: 'VACATION' as LeaveType,
  startDate: '',
  endDate: '',
  reason: '',
}

// Traduce los errores del backend a mensajes claros
function mapApiError(err: any, context: 'create' | 'cancel'): string {
  const code: string = err?.response?.data?.error?.code ?? ''
  const msg: string = err?.response?.data?.error?.message ?? ''
  const status: number | undefined = err?.response?.status
  const text = `${code} ${msg}`.toLowerCase()

  if (code === 'EMPLOYEE_PROFILE_NOT_FOUND' || text.includes('not linked'))
    return 'Tu usuario no tiene un perfil de empleado vinculado. Contacta al administrador.'
  if (text.includes('already_started') || text.includes('already started'))
    return context === 'cancel'
      ? 'No se puede cancelar: la solicitud ya comenzó (solo se cancela antes de la fecha de inicio).'
      : 'No puedes solicitar una ausencia cuya fecha de inicio ya pasó.'
  if (text.includes('overlap') || text.includes('traslape'))
    return 'Ya tienes una solicitud aprobada o pendiente que se traslapa con esas fechas.'
  if (text.includes('balance') || text.includes('saldo') || text.includes('insufficient'))
    return 'No tienes suficientes días de vacaciones disponibles.'
  if (status === 409)
    return msg || 'La solicitud cambió en el servidor. Actualizamos la lista, revisa e intenta de nuevo.'
  return msg || (context === 'cancel' ? 'No se puede cancelar esta solicitud.' : 'Error al crear la solicitud.')
}

export default function SelfServicePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<LeaveRequest | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<LeaveRequestErrors>({})
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const today = getToday()

  // Perfil
  const { data: profile } = useQuery({
    queryKey: ['self-service-profile'],
    queryFn: selfServiceApi.getProfile,
  })

  // Saldo de vacaciones
  const { data: balance } = useQuery({
    queryKey: ['self-service-balance'],
    queryFn: selfServiceApi.getMyBalance,
  })

  // Mis solicitudes (con filtro, para la tabla)
  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['self-service-requests', statusFilter],
    queryFn: () => selfServiceApi.getMyRequests({ page: 1, limit: 50, status: statusFilter || undefined }),
  })
  const requests = (requestsData?.items ?? []) as LeaveRequest[]

  // Todas mis solicitudes (sin filtro, para validar traslapes)
  const { data: allRequestsData } = useQuery({
    queryKey: ['self-service-requests', 'all-for-validation'],
    queryFn: () => selfServiceApi.getMyRequests({ page: 1, limit: 100 }),
  })
  const allRequests = (allRequestsData?.items ?? []) as LeaveRequest[]

  // La solicitud abierta siempre se muestra con los datos más recientes de la lista
  const current = selected
    ? (allRequests.find(r => r.id === selected.id) ?? requests.find(r => r.id === selected.id) ?? selected)
    : null

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['self-service-requests'] })
    queryClient.invalidateQueries({ queryKey: ['self-service-balance'] })
  }

  // Crear solicitud
  const createMutation = useMutation({
    mutationFn: selfServiceApi.createRequest,
    onSuccess: () => {
      refreshAll()
      closeForm()
    },
    onError: (err: any) => {
      setFormError(mapApiError(err, 'create'))
      if (err?.response?.status === 409) refreshAll()
    },
  })

  // Cancelar solicitud
  const cancelMutation = useMutation({
    mutationFn: selfServiceApi.cancelMyRequest,
    onSuccess: () => {
      refreshAll()
      setSelected(null)
      setCancelError(null)
    },
    onError: (err: any) => {
      setCancelError(mapApiError(err, 'cancel'))
      // Si el estado cambió en el servidor (409), refrescamos para ocultar botones imposibles
      if (err?.response?.status === 409) refreshAll()
    },
  })

  const openForm = () => {
    setForm(emptyForm)
    setFieldErrors({})
    setFormError(null)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setForm(emptyForm)
    setFieldErrors({})
    setFormError(null)
  }

  const clearFieldError = (key: keyof LeaveRequestErrors) => {
    if (fieldErrors[key]) setFieldErrors({ ...fieldErrors, [key]: undefined })
  }

  const handleSubmit = () => {
    const errors = validateLeaveRequest(
      { type: form.type, startDate: form.startDate, endDate: form.endDate, reason: form.reason },
      { existing: allRequests, availableDays: balance?.availableDays ?? null }
    )
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setFormError(null)
      return
    }
    setFieldErrors({})
    setFormError(null)
    createMutation.mutate({ ...form, reason: form.reason.trim() })
  }

  const openDetail = (req: LeaveRequest) => {
    setSelected(req)
    setCancelError(null)
  }

  // Solo PENDING o APPROVED, y solo ANTES de la fecha de inicio
  const canCancel = (req: LeaveRequest) =>
    !TERMINAL_STATES.includes(req.status) && canCancelByDate(req.startDate)

  const fieldStyle = (err?: string) => ({
    border: `1px solid ${err ? '#fca5a5' : '#e2e8f0'}`,
    background: err ? '#fff5f5' : '#ffffff',
    color: '#0f172a',
  })

  const requestedDays =
    form.startDate && form.endDate && form.endDate >= form.startDate
      ? countDays(form.startDate, form.endDate)
      : null

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
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#2563eb' }}>AUTOSERVICIO</p>
            <h1 className="text-xl font-bold" style={{ color: '#0f172a' }}>Mis Vacaciones y Ausencias</h1>
          </div>
        </div>
        <button onClick={openForm}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}>
          + Nueva solicitud
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* PERFIL Y SALDO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border lg:col-span-2" style={{ borderColor: '#e2e8f0' }}>
            <p className="text-xs font-semibold uppercase mb-3" style={{ color: '#94a3b8' }}>Mi información</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}>
                {user?.firstName?.charAt(0) ?? user?.email?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="font-bold" style={{ color: '#0f172a' }}>
                  {profile ? `${profile.firstName} ${profile.lastName}` : user?.email}
                </p>
                <p className="text-sm" style={{ color: '#64748b' }}>
                  {profile?.position ?? '—'} · {profile?.department ?? '—'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                  {profile?.branch ?? '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: '#e2e8f0' }}>
            <p className="text-xs font-semibold uppercase mb-1" style={{ color: '#94a3b8' }}>Saldo de vacaciones</p>
            {balance ? (
              <>
                <p className="text-3xl font-bold" style={{ color: '#2563eb' }}>{balance.availableDays ?? '—'}</p>
                <p className="text-xs mt-1" style={{ color: '#64748b' }}>días disponibles</p>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#94a3b8' }}>Total anual</span>
                    <span style={{ color: '#0f172a' }}>{balance.totalDays ?? '—'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#94a3b8' }}>Usados</span>
                    <span style={{ color: '#0f172a' }}>{balance.usedDays ?? '—'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#94a3b8' }}>Pendientes</span>
                    <span style={{ color: '#f59e0b' }}>{balance.pendingDays ?? '—'}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm mt-2" style={{ color: '#94a3b8' }}>Sin información de saldo</p>
            )}
          </div>
        </div>

        {/* FILTROS */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {[
            { label: 'Todas', value: '' },
            { label: 'Pendientes', value: 'PENDING' },
            { label: 'Aprobadas', value: 'APPROVED' },
            { label: 'Rechazadas', value: 'REJECTED' },
            { label: 'Canceladas', value: 'CANCELLED' },
          ].map(f => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: statusFilter === f.value ? '#2563eb' : '#ffffff',
                color: statusFilter === f.value ? '#ffffff' : '#64748b',
                border: `1px solid ${statusFilter === f.value ? '#2563eb' : '#e2e8f0'}`,
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* LISTA DE SOLICITUDES */}
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
          {isLoading && (
            <div className="px-6 py-12 text-center text-sm" style={{ color: '#94a3b8' }}>Cargando...</div>
          )}

          {!isLoading && requests.length === 0 && (
            <div className="px-6 py-16 text-center">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-sm font-medium" style={{ color: '#0f172a' }}>No tienes solicitudes</p>
              <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>Crea tu primera solicitud de vacaciones o ausencia</p>
            </div>
          )}

          {!isLoading && requests.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Tipo', 'Desde', 'Hasta', 'Días', 'Motivo', 'Estado', 'Acciones'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#64748b' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req, i) => (
                    <tr key={req.id} style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: '#0f172a' }}>
                        {TYPE_LABELS[req.type] ?? req.type}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#64748b' }}>
                        {formatDate(req.startDate)}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#64748b' }}>
                        {formatDate(req.endDate)}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#64748b' }}>
                        {req.totalDays ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-sm max-w-xs truncate" style={{ color: '#64748b' }}>
                        {req.reason}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2 py-1 rounded-full"
                          style={{ color: STATUS_LABELS[req.status]?.color, background: STATUS_LABELS[req.status]?.bg }}>
                          {STATUS_LABELS[req.status]?.label ?? req.status}
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* MODAL NUEVA SOLICITUD */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold" style={{ color: '#0f172a' }}>Nueva solicitud</h2>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>Completa los datos de tu solicitud</p>
              </div>
              <button onClick={closeForm} className="text-lg font-bold" style={{ color: '#94a3b8' }}>✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#374151' }}>Tipo de ausencia</label>
                <select value={form.type}
                  onChange={e => { setForm({ ...form, type: e.target.value as LeaveType }); clearFieldError('type') }}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={fieldStyle(fieldErrors.type)}>
                  <option value="VACATION">Vacaciones</option>
                  <option value="SICK_LEAVE">Enfermedad</option>
                  <option value="PERSONAL">Personal</option>
                  <option value="OTHER">Otro</option>
                </select>
                {fieldErrors.type && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{fieldErrors.type}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: '#374151' }}>Fecha inicio</label>
                  <input type="date" value={form.startDate} min={today}
                    onChange={e => {
                      const start = e.target.value
                      // si la fecha fin quedó antes de la nueva fecha inicio, se limpia
                      setForm({ ...form, startDate: start, endDate: form.endDate && form.endDate < start ? '' : form.endDate })
                      clearFieldError('startDate')
                    }}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={fieldStyle(fieldErrors.startDate)} />
                  {fieldErrors.startDate && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{fieldErrors.startDate}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: '#374151' }}>Fecha fin</label>
                  <input type="date" value={form.endDate} min={form.startDate || today}
                    disabled={!form.startDate}
                    onChange={e => { setForm({ ...form, endDate: e.target.value }); clearFieldError('endDate') }}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                    style={fieldStyle(fieldErrors.endDate)} />
                  {fieldErrors.endDate && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{fieldErrors.endDate}</p>}
                </div>
              </div>

              {requestedDays !== null && (
                <p className="text-xs" style={{ color: '#64748b' }}>
                  Duración: <span className="font-semibold">{requestedDays} día(s)</span> naturales
                </p>
              )}

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#374151' }}>Motivo</label>
                <textarea value={form.reason}
                  onChange={e => { setForm({ ...form, reason: e.target.value }); clearFieldError('reason') }}
                  rows={3} maxLength={500} placeholder="Describe el motivo de tu solicitud..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                  style={fieldStyle(fieldErrors.reason)} />
                {fieldErrors.reason && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{fieldErrors.reason}</p>}
              </div>

              {form.type === 'VACATION' && balance && (
                <div className="px-3 py-2 rounded-lg text-xs" style={{ background: '#eff6ff', color: '#2563eb' }}>
                  Tienes {balance.availableDays} días disponibles de vacaciones
                </div>
              )}

              {formError && (
                <div className="px-3 py-2 rounded-lg text-xs" style={{ background: '#fef2f2', color: '#dc2626' }}>
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={closeForm}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: '#f1f5f9', color: '#64748b' }}>
                  Cancelar
                </button>
                <button onClick={handleSubmit} disabled={createMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)', opacity: createMutation.isPending ? 0.7 : 1 }}>
                  {createMutation.isPending ? 'Enviando...' : 'Enviar solicitud'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE */}
      {current && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: '#0f172a' }}>Detalle de solicitud</h2>
              <button onClick={() => setSelected(null)} className="text-lg font-bold" style={{ color: '#94a3b8' }}>✕</button>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Tipo', value: TYPE_LABELS[current.type] ?? current.type },
                { label: 'Desde', value: formatDate(current.startDate) },
                { label: 'Hasta', value: formatDate(current.endDate) },
                { label: 'Días', value: current.totalDays ?? '—' },
                { label: 'Motivo', value: current.reason },
                { label: 'Creada', value: new Date(current.createdAt).toLocaleDateString('es-GT') },
              ].map(item => (
                <div key={item.label} className="flex justify-between gap-4 py-2 border-b" style={{ borderColor: '#f1f5f9' }}>
                  <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>{item.label}</span>
                  <span className="text-xs font-semibold text-right" style={{ color: '#0f172a' }}>{item.value}</span>
                </div>
              ))}

              <div className="flex justify-between py-2 border-b" style={{ borderColor: '#f1f5f9' }}>
                <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>Estado</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ color: STATUS_LABELS[current.status]?.color, background: STATUS_LABELS[current.status]?.bg }}>
                  {STATUS_LABELS[current.status]?.label ?? current.status}
                </span>
              </div>

              {current.reviewComment && (
                <div className="px-3 py-2 rounded-lg text-xs" style={{ background: '#f8fafc', color: '#475569' }}>
                  <span className="font-semibold">Comentario del revisor: </span>{current.reviewComment}
                </div>
              )}

              {cancelError && (
                <div className="px-3 py-2 rounded-lg text-xs" style={{ background: '#fef2f2', color: '#dc2626' }}>
                  {cancelError}
                </div>
              )}

              {TERMINAL_STATES.includes(current.status) && (
                <div className="px-3 py-2 rounded-lg text-xs" style={{ background: '#f8fafc', color: '#64748b' }}>
                  Esta solicitud está en estado terminal y no puede modificarse.
                </div>
              )}

              {!TERMINAL_STATES.includes(current.status) && !canCancel(current) && (
                <div className="px-3 py-2 rounded-lg text-xs" style={{ background: '#f8fafc', color: '#64748b' }}>
                  Solo se puede cancelar antes de la fecha de inicio.
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setSelected(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: '#f1f5f9', color: '#64748b' }}>
                Cerrar
              </button>
              {canCancel(current) && (
                <button onClick={() => cancelMutation.mutate(current.id)}
                  disabled={cancelMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: '#fef2f2', color: '#dc2626', opacity: cancelMutation.isPending ? 0.7 : 1 }}>
                  {cancelMutation.isPending ? 'Cancelando...' : 'Cancelar solicitud'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}