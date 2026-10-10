# React + TypeScript + Vite

Proyecto G04 —  Vacaciones y Ausencias

Proyecto final del curso 036 Desarrollo Web, Universidad Mariano Gálvez de Guatemala.
Grupo 04 — Especialización: Vacaciones y Ausencias.

Integrantes

Petter Deiman ALvarez

Jorge Mario Rivas Picon

Jose Alejandro Roldan Valenzuela

Stack

React 18 + Vite + TypeScript

TailwindCSS

React Router

TanStack Query

Zustand

react-hook-form + Zod

Axios

Requisitos

Node.js v18 o superior

npm v9 o superior

Instalación

git clone https://github.com/Petter2004-commits/Proyecto_Final_RRHH_G4.git
cd Proyecto_Final_RRHH_G4
npm install

Variables de entorno

Copia el archivo de ejemplo y agrega la URL de la API:

cp .env.example .env

Edita .env y configura las variables que aparecen en .env.example.

Comandos

# Desarrollo
npm run dev

# Build producción
npm run build

Versión publicada

https://proyecto-final-rrhh-g4-murex.vercel.app

Guía por rol

ADMIN

Correo: admin.g04@example.edu

Acceso: Dashboard, Empleados, Solicitudes, Parámetros del sistema

HR_MANAGER

Correo: hr.g04@example.edu

Acceso: Dashboard, Empleados, Solicitudes

EMPLOYEE

Correo: employee.g04@example.edu

Acceso: Mi perfil, Mis solicitudes de vacaciones

Funcionalidades implementadas

Login con JWT y refresh rotatorio

Rutas protegidas por rol

Dashboard con datos reales de la API

Gestión de empleados: listar, buscar, crear

Solicitudes de vacaciones y ausencias: listar, filtrar, aprobar, rechazar, cancelar

Manejo de errores HTTP (400, 401, 403, 404, 409, 422, 429, 500, 503)

Diseño responsive
