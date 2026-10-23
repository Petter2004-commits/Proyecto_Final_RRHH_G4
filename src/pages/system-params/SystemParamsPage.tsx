import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { systemParametersApi } from '../../api/endpoints/systemParameters'
import type { SystemParameter } from '../../api/endpoints/systemParameters'

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE:   { label: 'Activo',   color: '#059669', bg: '#f0fdf4' },
  INACTIVE: { label: 'Inactivo', color: '#64748b', bg: '#f1f5f9' },
}

export default function SystemParamsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<SystemParameter | null>(null)
  const [form, setForm] = useState({ key: '', value: '', description: '', effectiveDate: '' })
  const [formError, setFormError] = useState<string | null>(null)

  const { data: params = [], isLoading, error } = useQuery({
    queryKey: ['system-parameters'],
    queryFn: systemParametersApi.getAll,
  })

  const createMutation = useMutation({
    mutationFn: systemParametersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-parameters'] })
      setShowModal(false)
      resetForm()
    },
    onError: (err: any) => setFormError(err?.response?.data?.error?.message ?? 'Error al crear parametro'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => systemParametersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-parameters'] })
      setShowModal(false)
      resetForm()
    },
    onError: (err: any) => setFormError(err?.response?.data?.error?.message ?? 'Error al actualizar'),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) =>
      systemParametersApi.toggleStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system-parameters'] }),
  })

  const resetForm = () => {
    setForm({ key: '', value: '', description: '', effectiveDate: '' })
    setEditing(null)
    setFormError(null)
  }

  const openCreate = () => {
    resetForm()
    setShowModal(true)
  }

  const openEdit = (param: SystemParameter) => {
    setEditing(param)
    setForm({
      key: param.key,
      value: param.value,
      description: param.description,
      effectiveDate: param.effectiveDate?.split('T')[0] ?? '',
    })
    setFormError(null)
    setShowModal(true)
  }

  const handleSubmit = () => {
    if (!form.key || !form.value || !form.description || !form.effectiveDate) {
      setFormError('Todos los campos son obligatorios.')
      return
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: { value: form.value, description: form.description, effectiveDate: form.effectiveDate } })
    } else {
      createMutation.mutate(form)
    }
  }

  const activeCount = Array.isArray(params) ? params.filter((p: SystemParameter) => p.status === 'ACTIVE').length : 0
  const totalCount = Array.isArray(params) ? params.length : 0

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
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#2563eb' }}>ADMINISTRACIÓN</p>
            <h1 className="text-xl font-bold" style={{ color: '#0f172a' }}>Parámetros del Sistema</h1>
          </div>
        </div>
        <button onClick={openCreate}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}>
          + Nuevo parámetro
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* STATS */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: '#e2e8f0' }}>
            <p className="text-xs font-semibold uppercase" style={{ color: '#94a3b8' }}>Total parámetros</p>
            <p className="text-3xl font-bold mt-1" style={{ color: '#0f172a' }}>{totalCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: '#e2e8f0' }}>
            <p className="text-xs font-semibold uppercase" style={{ color: '#94a3b8' }}>Activos</p>
            <p className="text-3xl font-bold mt-1" style={{ color: '#059669' }}>{activeCount}</p>
          </div>
        </div>

        {/* TABLA */}
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: '#e2e8f0' }}>
            <h2 className="text-sm font-bold" style={{ color: '#0f172a' }}>Lista de parámetros</h2>
          </div>

          {isLoading && (
            <div className="px-6 py-12 text-center text-sm" style={{ color: '#94a3b8' }}>Cargando...</div>
          )}

          {error && (
            <div className="px-6 py-4 text-sm" style={{ color: '#dc2626' }}>Error al cargar parámetros.</div>
          )}

          {!isLoading && Array.isArray(params) && params.length === 0 && (
            <div className="px-6 py-12 text-center text-sm" style={{ color: '#94a3b8' }}>
              No hay parámetros configurados. Crea el primero.
            </div>
          )}

                    {!isLoading && Array.isArray(params) && params.length > 0 && (
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Clave', 'Valor', 'Descripción', 'Vigencia', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#64748b' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {params.map((param: SystemParameter, i: number) => (
                  <tr key={param.id} style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono font-bold px-2 py-1 rounded" style={{ background: '#eff6ff', color: '#2563eb' }}>
                        {param.key}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold" style={{ color: '#0f172a' }}>{param.value}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#64748b' }}>{param.description}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#64748b' }}>
                      {param.effectiveDate ? new Date(param.effectiveDate).toLocaleDateString('es-GT') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full"
                        style={{ color: STATUS_LABELS[param.status]?.color, background: STATUS_LABELS[param.status]?.bg }}>
                        {STATUS_LABELS[param.status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(param)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium"
                          style={{ background: '#eff6ff', color: '#2563eb' }}>
                          Editar
                        </button>
                        <button
                          onClick={() => toggleMutation.mutate({ id: param.id, status: param.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium"
                          style={{ background: param.status === 'ACTIVE' ? '#fef2f2' : '#f0fdf4', color: param.status === 'ACTIVE' ? '#dc2626' : '#059669' }}>
                          {param.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                           </tbody>
            </table>
            </div>
          )}
        </div>
      </main>

      {/* MODAL */}
      {showModal && (
       <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold" style={{ color: '#0f172a' }}>
                  {editing ? 'Editar parámetro' : 'Nuevo parámetro'}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                  {editing ? 'Modifica el valor o descripción' : 'Configura un nuevo parámetro del sistema'}
                </p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm() }}
                className="text-lg font-bold" style={{ color: '#94a3b8' }}>✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#374151' }}>Clave</label>
                <input value={form.key} onChange={e => setForm({ ...form, key: e.target.value })}
                  disabled={!!editing}
                  placeholder="ej. VACATION_ANNUAL_DAYS"
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: '1px solid #e2e8f0', background: editing ? '#f8fafc' : '#fff', color: '#0f172a' }} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#374151' }}>Valor</label>
                <input value={form.value} onChange={e => setForm({ ...form, value: e.target.value })}
                  placeholder="ej. 15"
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: '1px solid #e2e8f0', color: '#0f172a' }} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#374151' }}>Descripción</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="ej. Dias anuales de vacaciones"
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: '1px solid #e2e8f0', color: '#0f172a' }} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#374151' }}>Fecha de vigencia</label>
                <input type="date" value={form.effectiveDate} onChange={e => setForm({ ...form, effectiveDate: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: '1px solid #e2e8f0', color: '#0f172a' }} />
              </div>

              {formError && (
                <div className="text-xs px-3 py-2 rounded-lg" style={{ background: '#fef2f2', color: '#dc2626' }}>
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowModal(false); resetForm() }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: '#f1f5f9', color: '#64748b' }}>
                  Cancelar
                </button>
                <button onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)', opacity: createMutation.isPending || updateMutation.isPending ? 0.7 : 1 }}>
                  {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear parámetro'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}