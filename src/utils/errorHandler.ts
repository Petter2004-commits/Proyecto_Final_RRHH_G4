import { AxiosError } from 'axios'

export interface ApiErrorResponse {
  code: string
  message: string
  requestId?: string
}

export function handleApiError(error: unknown): ApiErrorResponse {
  if (error instanceof AxiosError) {
    const status = error.response?.status
    const data = error.response?.data
    const requestId = data?.requestId

    // Error con respuesta del servidor
    if (data?.error) {
      return {
        code: data.error.code,
        message: data.error.message,
        requestId,
      }
    }

    // Errores HTTP estándar
    switch (status) {
      case 400:
        return { code: 'BAD_REQUEST', message: 'Datos inválidos. Revisa el formulario.', requestId }
      case 401:
        return { code: 'UNAUTHORIZED', message: 'Sesión vencida. Inicia sesión nuevamente.', requestId }
      case 403:
        return { code: 'FORBIDDEN', message: 'No tienes permiso para realizar esta acción.', requestId }
      case 404:
        return { code: 'NOT_FOUND', message: 'El recurso solicitado no existe.', requestId }
      case 409:
        return { code: 'CONFLICT', message: 'Conflicto con el estado actual del recurso.', requestId }
      case 422:
        return { code: 'UNPROCESSABLE', message: 'No se puede procesar la solicitud. Verifica la configuración.', requestId }
      case 429:
        return { code: 'TOO_MANY_REQUESTS', message: 'Demasiadas solicitudes. Espera un momento.', requestId }
      case 500:
        return { code: 'SERVER_ERROR', message: 'Error interno del servidor.', requestId }
      case 503:
        return { code: 'SERVICE_UNAVAILABLE', message: 'Servicio temporalmente no disponible. Intenta de nuevo.', requestId }
      default:
        return { code: 'UNKNOWN', message: 'Error desconocido.', requestId }
    }
  }

  // Error de red
  if (error instanceof Error && error.message === 'Network Error') {
    return { code: 'NETWORK_ERROR', message: 'Sin conexión. Verifica tu internet.' }
  }

  return { code: 'UNKNOWN', message: 'Ocurrió un error inesperado.' }
}