import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '../../api/endpoints/auth'
import { useAuthStore } from '../../stores/authStore'
import { handleApiError } from '../../utils/errorHandler'

const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const [apiError, setApiError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setApiError(null)
    try {
      const res = await authApi.login(data.email, data.password)
      setUser(res.user, res.accessToken, res.refreshToken)
      if (res.user.role === 'EMPLOYEE') {
        navigate('/self-service/profile')
      } else {
        navigate('/dashboard')
      }
    } catch (error) {
      const err = handleApiError(error)
      setApiError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-8"
      style={{
        background: '#f1f5f9',
        backgroundImage: `
          radial-gradient(circle at 10% 15%, rgba(37,99,235,0.06), transparent 30%),
          radial-gradient(circle at 90% 85%, rgba(79,70,229,0.05), transparent 30%)
        `,
      }}
    >
      <div
        className="w-full max-w-6xl overflow-hidden rounded-2xl border"
        style={{
          background: '#ffffff',
          borderColor: '#e2e8f0',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <header className="flex items-center px-6 sm:px-10 py-5 border-b" style={{ borderColor: '#e2e8f0' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-wide" style={{ color: '#1e293b' }}>
              V&A_HR<span style={{ color: '#2563eb' }}>.</span>
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="flex flex-col justify-center px-7 py-10 sm:px-12 lg:px-14 lg:py-14 bg-white">
            <div className="mb-8">
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#2563eb' }}>
                ACCESO AL SISTEMA
              </span>
              <h1 className="text-3xl font-bold mt-3 mb-2" style={{ color: '#1e293b' }}>Bienvenido</h1>
              <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
                Ingresa tus credenciales para acceder al sistema.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  Correo electrónico
                </label>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="usuario@empresa.com"
                  disabled={isLoading}
                  className="w-full px-4 py-3.5 rounded-lg text-sm outline-none transition-all disabled:opacity-50"
                  style={{ background: '#f8fafc', border: `1px solid ${errors.email ? '#fca5a5' : '#e2e8f0'}`, color: '#1e293b' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = errors.email ? '#fca5a5' : '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
                />
                {errors.email && (
                  <p role="alert" className="text-xs mt-1.5" style={{ color: '#dc2626' }}>⚠ {errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="w-full px-4 py-3.5 pr-12 rounded-lg text-sm outline-none transition-all disabled:opacity-50"
                    style={{ background: '#f8fafc', border: `1px solid ${errors.password ? '#fca5a5' : '#e2e8f0'}`, color: '#1e293b' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = errors.password ? '#fca5a5' : '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }}>
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p role="alert" className="text-xs mt-1.5" style={{ color: '#dc2626' }}>⚠ {errors.password.message}</p>
                )}
              </div>

              {apiError && (
                <div className="px-4 py-3 rounded-lg text-sm flex items-center gap-2"
                  style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {apiError}
                </div>
              )}

              <button type="submit" disabled={isLoading}
                className="w-full py-3.5 rounded-lg text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.99]"
                style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)', boxShadow: '0 5px 18px rgba(37,99,235,0.25)' }}>
                {isLoading ? 'Verificando...' : 'Iniciar sesión'}
              </button>
            </form>

            <div className="grid grid-cols-2 gap-3 mt-8">
              <div className="rounded-lg p-3 border" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
                <p className="text-sm font-semibold" style={{ color: '#2563eb' }}>Vacaciones</p>
                <p className="text-xs mt-1" style={{ color: '#64748b' }}>Control de solicitudes</p>
              </div>
              <div className="rounded-lg p-3 border" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
                <p className="text-sm font-semibold" style={{ color: '#2563eb' }}>Ausencias</p>
                <p className="text-xs mt-1" style={{ color: '#64748b' }}>Gestión de permisos</p>
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-center overflow-hidden min-h-[430px] lg:min-h-[620px] p-8 sm:p-12"
            style={{ background: 'linear-gradient(145deg, #0f2744, #0D1C29)' }}>
            <div className="absolute w-96 h-96 rounded-full"
              style={{ background: 'rgba(37,99,235,0.08)', filter: 'blur(80px)', top: '20%', left: '20%' }} />
            <div className="relative z-10 flex flex-col items-center w-full">
              <h2 className="text-2xl font-bold mt-2 tracking-wide" style={{ color: '#ffffff' }}>V&A_RH</h2>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Sistema de Gestión de Recursos Humanos</p>
            </div>
          </div>
        </div>

        <footer className="px-6 py-4 text-center border-t" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
          <p className="text-xs" style={{ color: '#94a3b8' }}>V&A_RH — Sistema de Gestión de Recursos Humanos</p>
        </footer>
      </div>
    </div>
  )
}