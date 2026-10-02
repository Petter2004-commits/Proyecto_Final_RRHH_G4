import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )},
  { label: 'Solicitudes', path: '/leave-requests', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )},
  { label: 'Empleados', path: '/employees', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )},
  { label: 'Parametros', path: '/system-params', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )},
]

const generalItems = [
  { label: 'Mi perfil', path: '/self-service/profile', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )},
]

export default function DashboardPage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!user) navigate('/login', { replace: true })
  }, [user, navigate])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const roleLabel: Record<string, string> = {
    ADMIN: 'Administrador',
    HR_MANAGER: 'Recursos Humanos',
    EMPLOYEE: 'Empleado',
  }

  const stats = [
    { label: 'Total Solicitudes', value: '—', color: '#2563eb', bg: '#eff6ff', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    )},
    { label: 'Pendientes', value: '—', color: '#f59e0b', bg: '#fffbeb', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { label: 'Aprobadas', value: '—', color: '#22c55e', bg: '#f0fdf4', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { label: 'Rechazadas', value: '—', color: '#ef4444', bg: '#fef2f2', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
  ]

  return (
    <div className="flex min-h-screen" style={{ background: '#f1f5f9' }}>

      {/* SIDEBAR */}
      <aside className="w-64 flex flex-col fixed h-full z-10"
        style={{ background: '#0f172a', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Logo */}
        <div className="px-6 py-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-white text-base leading-none">CoreHR</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>G04 — V&A</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-2">
          <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-3"
            style={{ color: 'rgba(255,255,255,0.25)' }}>Menu</p>
          <div className="space-y-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path
              return (
                <button key={item.path} onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
                  style={{
                    background: active ? 'rgba(37,99,235,0.2)' : 'transparent',
                    color: active ? '#60a5fa' : 'rgba(255,255,255,0.5)',
                    borderLeft: active ? '3px solid #2563eb' : '3px solid transparent',
                  }}>
                  <span style={{ color: active ? '#60a5fa' : 'rgba(255,255,255,0.4)' }}>{item.icon}</span>
                  {item.label}
                </button>
              )
            })}
          </div>

          <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-3 mt-6"
            style={{ color: 'rgba(255,255,255,0.25)' }}>General</p>
          <div className="space-y-1">
            {generalItems.map((item) => {
              const active = location.pathname === item.path
              return (
                <button key={item.path} onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
                  style={{
                    background: active ? 'rgba(37,99,235,0.2)' : 'transparent',
                    color: active ? '#60a5fa' : 'rgba(255,255,255,0.5)',
                    borderLeft: active ? '3px solid #2563eb' : '3px solid transparent',
                  }}>
                  <span style={{ color: active ? '#60a5fa' : 'rgba(255,255,255,0.4)' }}>{item.icon}</span>
                  {item.label}
                </button>
              )
            })}

            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
              style={{ color: 'rgba(239,68,68,0.7)', borderLeft: '3px solid transparent' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
                e.currentTarget.style.color = '#ef4444'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'rgba(239,68,68,0.7)'
              }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesion
            </button>
          </div>
        </nav>

        {/* User info */}
        <div className="px-4 py-4 mx-4 mb-4 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium truncate text-white">{user?.email}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {roleLabel[user?.role ?? ''] ?? user?.role}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* CONTENIDO */}
      <div className="flex-1 flex flex-col" style={{ marginLeft: '256px' }}>

        {/* TOPBAR */}
        <header className="bg-white border-b px-8 py-4 flex items-center justify-between sticky top-0 z-10"
          style={{ borderColor: '#e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#0f172a' }}>Dashboard</h1>
            <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>Vacaciones y Ausencias — Grupo 04</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-3 py-1.5 rounded-full font-semibold"
              style={{ background: '#eff6ff', color: '#2563eb' }}>
              {roleLabel[user?.role ?? ''] ?? user?.role}
            </span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* MAIN */}
        <main className="flex-1 px-8 py-8">

          {/* Saludo */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold" style={{ color: '#0f172a' }}>
              Bienvenido, {roleLabel[user?.role ?? ''] ?? user?.role}
            </h2>
            <p className="text-sm mt-1" style={{ color: '#64748b' }}>
              Aqui tienes un resumen del sistema de Vacaciones y Ausencias.
            </p>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {stats.map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-5 border"
                style={{ borderColor: '#e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#94a3b8' }}>{s.label}</p>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: s.bg, color: s.color }}>
                    {s.icon}
                  </div>
                </div>
                <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* BOTTOM GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Accesos rapidos */}
            <div className="bg-white rounded-2xl border p-6"
              style={{ borderColor: '#e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <h3 className="text-sm font-bold mb-5" style={{ color: '#0f172a' }}>Accesos rapidos</h3>
              <div className="space-y-2">
                {[
                  { label: 'Ver solicitudes de ausencias', path: '/leave-requests', color: '#2563eb' },
                  { label: 'Gestionar empleados', path: '/employees', color: '#4f46e5' },
                  { label: 'Parametros del sistema', path: '/system-params', color: '#0891b2' },
                  { label: 'Mi perfil', path: '/self-service/profile', color: '#059669' },
                ].map((item) => (
                  <button key={item.path} onClick={() => navigate(item.path)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all text-left"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}>
                    {item.label}
                    <span style={{ color: item.color, fontSize: '18px' }}>→</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Info sistema */}
            <div className="bg-white rounded-2xl border p-6"
              style={{ borderColor: '#e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <h3 className="text-sm font-bold mb-5" style={{ color: '#0f172a' }}>Informacion del sistema</h3>
              <div className="space-y-3">
                {[
                  { label: 'Sistema', value: 'CoreHR G04' },
                  { label: 'Modulo', value: 'Vacaciones y Ausencias' },
                  { label: 'Estado API', value: 'Conectado' },
                  { label: 'Usuario', value: user?.email ?? '—' },
                  { label: 'Rol', value: roleLabel[user?.role ?? ''] ?? user?.role ?? '—' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2.5 border-b last:border-0"
                    style={{ borderColor: '#f1f5f9' }}>
                    <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>{item.label}</span>
                    <span className="text-xs font-semibold" style={{ color: '#0f172a' }}>
                      {item.label === 'Estado API'
                        ? <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: '#f0fdf4', color: '#16a34a' }}>Conectado</span>
                        : item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}