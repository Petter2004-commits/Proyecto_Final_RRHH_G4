// Validaciones del formulario de solicitud de ausencia (g04).
// Ajusta los nombres de campos y valores de `type` a los de tu API.

export interface LeaveRequestForm {
  type: string        // ej. 'VACATION'
  startDate: string   // 'YYYY-MM-DD'
  endDate: string     // 'YYYY-MM-DD'
  reason: string
}

export type LeaveRequestErrors = Partial<Record<keyof LeaveRequestForm, string>>

export interface ExistingRequest {
  startDate: string
  endDate: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
}

// Fecha local (no UTC) en formato YYYY-MM-DD
export const getToday = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const day = (s: string) => s.split('T')[0]

// Muestra YYYY-MM-DD (o ISO) como dd/mm/yyyy sin desfase de zona horaria
export const formatDate = (s: string) => {
  const [y, m, d] = day(s).split('-')
  return `${d}/${m}/${y}`
}

// Solo se puede cancelar ANTES de la fecha de inicio (el mismo día ya no)
export const canCancelByDate = (startDate: string) => day(startDate) > getToday()

const toUTC = (s: string) => {
  const [y, m, d] = day(s).split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

// Días naturales, inclusivo (sin feriados ni días hábiles, según g04)
export const countDays = (start: string, end: string) =>
  Math.round((toUTC(end) - toUTC(start)) / 86_400_000) + 1

export function validateLeaveRequest(
  form: LeaveRequestForm,
  options: {
    existing?: ExistingRequest[]   // solicitudes del propio empleado
    availableDays?: number | null  // saldo disponible (solo aplica a VACATION)
  } = {}
): LeaveRequestErrors {
  const errors: LeaveRequestErrors = {}
  const today = getToday()

  if (!form.type) errors.type = 'Selecciona un tipo de ausencia'

  if (!form.startDate) {
    errors.startDate = 'La fecha de inicio es requerida'
  } else if (form.startDate < today) {
    errors.startDate = 'La fecha de inicio no puede ser anterior a hoy'
  }

  if (!form.endDate) {
    errors.endDate = 'La fecha de fin es requerida'
  } else if (form.startDate && form.endDate < form.startDate) {
    errors.endDate = 'La fecha de fin debe ser igual o posterior a la de inicio'
  }

  // Traslape inclusivo con solicitudes PENDING o APPROVED del mismo empleado
  if (!errors.startDate && !errors.endDate && options.existing) {
    const overlap = options.existing.find(
      (r) =>
        (r.status === 'PENDING' || r.status === 'APPROVED') &&
        form.startDate <= day(r.endDate) &&
        form.endDate >= day(r.startDate)
    )
    if (overlap) {
      errors.startDate = `Se traslapa con una solicitud ${overlap.status === 'APPROVED' ? 'aprobada' : 'pendiente'} (${day(overlap.startDate)} a ${day(overlap.endDate)})`
    }
  }

  // Saldo anual: solo para VACATION
  if (
    !errors.startDate && !errors.endDate &&
    form.type === 'VACATION' &&
    options.availableDays != null
  ) {
    const days = countDays(form.startDate, form.endDate)
    if (days > options.availableDays) {
      errors.endDate = `Solicitas ${days} día(s) y tu saldo disponible es ${options.availableDays}`
    }
  }

  if (!form.reason.trim()) errors.reason = 'El motivo es obligatorio'
  else if (form.reason.length > 500) errors.reason = 'Máximo 500 caracteres'

  return errors
}