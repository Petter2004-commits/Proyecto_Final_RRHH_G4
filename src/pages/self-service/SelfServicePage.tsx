import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { selfServiceApi } from '../../api/endpoints/selfService'
import { useAuthStore } from '../../stores/authStore'

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

export default function SelfServicePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [form, setForm] = useState({
    type: 'VACATION' as 'VACATION' | 'SICK_LEAVE' | 'PERSONAL' | 'OTHER',
    startDate: '',
    endDate: '',
    reason: '',
  })

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

  // Mis solicitudes
  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['self-service-requests', statusFilter],
    queryFn: () => selfServiceApi.getMyRequests({ page: 1, limit: 50, status: statusFilter || undefined }),
  })

  const requests = requestsData?.items ?? []

  // Crear solicitud
  const createMutation = useMutation({
    mutationFn: selfServiceApi.createRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['self-service-requests'] })
      queryClient.invalidateQueries({ queryKey: ['self-service-balance'] })
      setShowForm(false)
      setForm({ type: 'VACATION', startDate: '', endDate: '', reason: '' })
      setFormError(null)
    },
 onError: (err: any) => {
  const code = err?.response?.data?.error?.code
  const msg = err?.response?.data?.error?.message ?? ''
  if (code === 'EMPLOYEE_PROFILE_NOT_FOUND' || msg.includes('not linked')) {
    setFormError('Tu usuario no tiene un perfil de empleado vinculado. Contacta al administrador.')
  } else if (msg.includes('overlap') || msg.includes('traslape')) {
    setFormError('Ya tienes una solicitud aprobada o pendiente en esas fechas.')
  } else if (msg.includes('ALREADY_STARTED')) {
    setFormError('No puedes solicitar vacaciones en fechas que ya comenzaron.')
  } else if (msg.includes('balance') || msg.includes('saldo')) {
    setFormError('No tienes suficientes dias de vacaciones disponibles.')
  } else {
    setFormError(msg || 'Error al crear la solicitud.')
  }
      },
    })

  // Cancelar solicitud
  const cancelMutation = useMutation({
    mutationFn: selfServiceApi.cancelMyRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['self-service-requests'] })
      queryClient.invalidateQueries({ queryKey: ['self-service-balance'] })
      setShowDetail(false)
      setCancelError(null)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? 'No se puede cancelar esta solicitud'
      setCancelError(msg)
    },
  })

  const handleSubmit = () => {
    if (!form.startDate || !form.endDate || !form.reason.trim()) {
      setFormError('Todos los campos son obligatorios.')
      return
    }
    if (form.startDate > form.endDate) {
      setFormError('La fecha de inicio no puede ser mayor a la fecha de fin.')
      return
    }
    setFormError(null)
    createMutation.mutate(form)
  }

  const openDetail = (req: any) => {
    setSelected(req)
    setCancelError(null)
    setShowDetail(true)
  }

  const canCancel = (req: any) => {
    if (TERMINAL_STATES.includes(req.status)) return false
    const today = new Date().toISOString().split('T')[0]
    return req.startDate >= today
  }

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
        <button onClick={() => { setShowForm(true); setFormError(null) }}
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
            <table className="w-full">
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Tipo', 'Desde', 'Hasta', 'Motivo', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#64748b' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((req: any, i: number) => (
                  <tr key={req.id} style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: '#0f172a' }}>
                      {TYPE_LABELS[req.type] ?? req.type}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#64748b' }}>
                      {new Date(req.startDate).toLocaleDateString('es-GT')}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#64748b' }}>
                      {new Date(req.endDate).toLocaleDateString('es-GT')}
                    </td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate" style={{ color: '#64748b' }}>
                      {req.reason}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full"
                        style={{ color: STATUS_LABELS[req.status]?.color, background: STATUS_LABELS[req.status]?.bg }}>
                        {STATUS_LABELS[req.status]?.label}
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
          )}
        </div>
      </main>

      {/* MODAL NUEVA SOLICITUD */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold" style={{ color: '#0f172a' }}>Nueva solicitud</h2>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>Completa los datos de tu solicitud</p>
              </div>
              <button onClick={() => { setShowForm(false); setFormError(null) }}
                className="text-lg font-bold" style={{ color: '#94a3b8' }}>✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#374151' }}>Tipo de ausencia</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: '1px solid #e2e8f0', color: '#0f172a' }}>
                  <option value="VACATION">Vacaciones</option>
                  <option value="SICK_LEAVE">Enfermedad</option>
                  <option value="PERSONAL">Personal</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: '#374151' }}>Fecha inicio</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #e2e8f0', color: '#0f172a' }} />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: '#374151' }}>Fecha fin</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #e2e8f0', color: '#0f172a' }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#374151' }}>Motivo</label>
                <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
                  rows={3} placeholder="Describe el motivo de tu solicitud..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                  style={{ border: '1px solid #e2e8f0', color: '#0f172a' }} />
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
                <button onClick={() => { setShowForm(false); setFormError(null) }}
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
      {showDetail && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: '#0f172a' }}>Detalle de solicitud</h2>
              <button onClick={() => setShowDetail(false)} className="text-lg font-bold" style={{ color: '#94a3b8' }}>✕</button>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Tipo', value: TYPE_LABELS[selected.type] ?? selected.type },
                { label: 'Desde', value: new Date(selected.startDate).toLocaleDateString('es-GT') },
                { label: 'Hasta', value: new Date(selected.endDate).toLocaleDateString('es-GT') },
                { label: 'Motivo', value: selected.reason },
                { label: 'Creada', value: new Date(selected.createdAt).toLocaleDateString('es-GT') },
              ].map(item => (
                <div key={item.label} className="flex justify-between py-2 border-b" style={{ borderColor: '#f1f5f9' }}>
                  <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>{item.label}</span>
                  <span className="text-xs font-semibold" style={{ color: '#0f172a' }}>{item.value}</span>
                </div>
              ))}

              <div className="flex justify-between py-2 border-b" style={{ borderColor: '#f1f5f9' }}>
                <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>Estado</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ color: STATUS_LABELS[selected.status]?.color, background: STATUS_LABELS[selected.status]?.bg }}>
                  {STATUS_LABELS[selected.status]?.label}
                </span>
              </div>

              {selected.reviewComment && (
                <div className="px-3 py-2 rounded-lg text-xs" style={{ background: '#fef2f2', color: '#dc2626' }}>
                  <span className="font-semibold">Comentario del revisor: </span>{selected.reviewComment}
                </div>
              )}

              {cancelError && (
                <div className="px-3 py-2 rounded-lg text-xs" style={{ background: '#fef2f2', color: '#dc2626' }}>
                  {cancelError}
                </div>
              )}

              {TERMINAL_STATES.includes(selected.status) && (
                <div className="px-3 py-2 rounded-lg text-xs" style={{ background: '#f8fafc', color: '#64748b' }}>
                  Esta solicitud está en estado terminal y no puede modificarse.
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowDetail(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: '#f1f5f9', color: '#64748b' }}>
                Cerrar
              </button>
              {canCancel(selected) && (
                <button onClick={() => cancelMutation.mutate(selected.id)}
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
