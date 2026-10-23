# Proyecto G04 — Vacaciones y Ausencias

Proyecto final del curso **036 Desarrollo Web**, Universidad Mariano Gálvez de Guatemala.  
Grupo 04 — Especialización: Vacaciones y Ausencias.

---

## Integrantes

 Nombres                            
 -----------------------------------------------------------------
 Petter Deiman Alvarez Garcia      
 Jorge Mario Rivas Picón           
 Jose Alejandro Roldan Valenzuela  

-------------------------------------------------------------------

## Stack tecnológico

- React 18 + Vite + TypeScript
- TailwindCSS
- React Router
- TanStack Query
- Zustand
- react-hook-form + Zod
- Axios

---------------------------------------------------------------------

## Requisitos

- Node.js v18 o superior
- npm v9 o superior

----------------------------------------------------------------------

## Instalación

```bash
git clone https://github.com/Petter2004-commits/Proyecto_Final_RRHH_G4.git
cd Proyecto_Final_RRHH_G4
npm install
```

--------------------------------------------------------------------------

## Variables de entorno

Copia el archivo de ejemplo y configura la URL de la API:

```bash
cp .env.example .env
```

Edita `.env` y completa las variables indicadas en `.env.example`.  

-------------------------------------------------------------------

## Comandos

### Desarrollo
```bash
npm run dev
```

### Build de producción
```bash
npm run build
```

------------------------------------------------------------------

## Versión publicada

[https://proyecto-final-rrhh-g4-murex.vercel.app](https://proyecto-final-rrhh-g4-murex.vercel.app)

-------------------------------------------------------------------

## Guía por rol

| Rol         | Correo                        | Acceso                                              |
|-------------|-------------------------------|-----------------------------------------------------|
| ADMIN       | admin.g04@example.edu         | Dashboard, Empleados, Solicitudes, Parámetros       |
| HR_MANAGER  | hr.g04@example.edu            | Dashboard, Empleados, Solicitudes                   |
| EMPLOYEE    | employee.g04@example.edu      | Mi perfil, Mis solicitudes de vacaciones            |


--------------------------------------------------------------------
## Estructura del proyecto

```
src/
├── api/
│   └── endpoints/        # Llamadas a la API por módulo (auth, employees, leaveRequests, selfService)
├── assets/               # Recursos estáticos
├── components/
│   ├── layout/           # Componentes de estructura (Header, Sidebar)
│   └── ui/               # Componentes reutilizables (botones, modales, guards)
├── hooks/                # Hooks personalizados con TanStack Query
├── pages/
│   ├── auth/             # Login
│   ├── dashboard/        # Dashboard por rol
│   ├── employees/        # Gestión de empleados
│   ├── leave-requests/   # Solicitudes (ADMIN / HR_MANAGER)
│   ├── self-service/     # Portal del empleado
│   └── system-params/    # Parámetros del sistema
├── stores/               # Estado global con Zustand (authStore)
├── types/                # Interfaces y tipos compartidos
└── utils/                # Manejo de errores y utilidades
```
------------------------------------------------------------------------
## Funcionalidades implementadas

- Login con JWT y refresh token rotatorio
- Rutas protegidas por rol (ADMIN, HR_MANAGER, EMPLOYEE)
- Dashboard con métricas reales de la API
- Gestión de empleados: listar, buscar, filtrar, crear, editar
- Paginación de empleados
- Solicitudes de vacaciones y ausencias: listar, filtrar, crear, aprobar, rechazar, cancelar
- Creación de solicitudes por parte de ADMIN/HR_MANAGER para cualquier empleado
- Manejo de error 409 por traslape de fechas
- Manejo de errores HTTP: 400, 401, 403, 404, 409, 422, 429, 500, 503
- Diseño responsive

-------------------------------------------------------------------------
########################################################################################################
