# SIGP - Arquitectura del Sistema Frontend

**Sistema Integral de Gestión de Proyectos**
**Versión:** 1.0
**Fecha:** 2025-12-14
**Autor:** OTIN (Oficina Técnica de Informática)

---

## Tabla de Contenidos

1. [Stack Tecnológico](#1-stack-tecnológico)
2. [Estructura de Directorios](#2-estructura-de-directorios)
3. [Arquitectura de Componentes](#3-arquitectura-de-componentes)
4. [Gestión de Estado](#4-gestión-de-estado)
5. [Enrutamiento](#5-enrutamiento)
6. [Integración con API](#6-integración-con-api)
7. [Autenticación y Autorización](#7-autenticación-y-autorización)
8. [Módulos Funcionales](#8-módulos-funcionales)
9. [Diseño UI/UX](#9-diseño-uiux)
10. [Optimización y Performance](#10-optimización-y-performance)
11. [Testing](#11-testing)
12. [Deployment](#12-deployment)

---

## 1. Stack Tecnológico

### Core Framework
- **Next.js 14.x** - React framework con App Router
- **React 18.x** - Library UI
- **TypeScript 5.x** - Tipado estático

### Styling & UI
- **TailwindCSS 3.x** - Utility-first CSS framework
- **Radix UI** - Componentes accesibles headless
- **shadcn/ui** - Componentes pre-construidos con Radix
- **Lucide React** - Iconos
- **tailwind-merge** - Merge de clases Tailwind
- **clsx** - Utilidad para clases condicionales

### State Management
- **Zustand** - State management global
- **React Query (TanStack Query)** - Server state management
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de schemas

### Data Visualization
- **Recharts** - Gráficos y charts
- **@tanstack/react-table** - Tablas avanzadas

### Drag & Drop
- **@dnd-kit** - Drag and drop (Kanban boards)

### Utilities
- **date-fns** - Manipulación de fechas
- **axios** - HTTP client
- **socket.io-client** - WebSocket client
- **react-hot-toast** - Notificaciones

### Development Tools
- **ESLint** - Linter
- **Prettier** - Formatter
- **Husky** - Git hooks
- **lint-staged** - Pre-commit linting

---

## 2. Estructura de Directorios

```
sigp-frontend/
├── public/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── src/
│   ├── app/                          # App Router (Next.js 14)
│   │   ├── (auth)/                   # Group: Authentication routes
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/              # Group: Protected routes
│   │   │   ├── layout.tsx            # Dashboard layout
│   │   │   ├── page.tsx              # Dashboard home
│   │   │   │
│   │   │   ├── planning/             # Módulo: Planificación Estratégica
│   │   │   │   ├── pgd/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── edit/page.tsx
│   │   │   │   │   └── new/page.tsx
│   │   │   │   ├── oei/
│   │   │   │   ├── ogd/
│   │   │   │   ├── oegd/
│   │   │   │   ├── acciones-estrategicas/
│   │   │   │   └── layout.tsx
│   │   │   │
│   │   │   ├── proyectos/            # Módulo: Proyectos (Scrum)
│   │   │   │   ├── page.tsx          # Lista de proyectos
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx      # Detalle proyecto
│   │   │   │   │   ├── backlog/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── sprints/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── [sprintId]/
│   │   │   │   │   │       ├── page.tsx
│   │   │   │   │   │       └── board/page.tsx
│   │   │   │   │   ├── epicas/
│   │   │   │   │   ├── historias/
│   │   │   │   │   ├── equipo/
│   │   │   │   │   ├── reportes/
│   │   │   │   │   └── configuracion/
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── layout.tsx
│   │   │   │
│   │   │   ├── actividades/          # Módulo: Actividades (Kanban)
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── board/page.tsx
│   │   │   │   │   ├── tareas/
│   │   │   │   │   ├── reportes/
│   │   │   │   │   └── configuracion/
│   │   │   │   └── layout.tsx
│   │   │   │
│   │   │   ├── rrhh/                 # Módulo: RRHH
│   │   │   │   ├── personal/
│   │   │   │   ├── divisiones/
│   │   │   │   ├── habilidades/
│   │   │   │   ├── asignaciones/
│   │   │   │   └── layout.tsx
│   │   │   │
│   │   │   ├── reportes/             # Módulo: Reportes
│   │   │   │   ├── sprints/
│   │   │   │   ├── actividades/
│   │   │   │   ├── dashboard/
│   │   │   │   └── layout.tsx
│   │   │   │
│   │   │   ├── configuracion/        # Módulo: Configuración
│   │   │   │   ├── usuarios/
│   │   │   │   ├── sistema/
│   │   │   │   ├── notificaciones/
│   │   │   │   └── layout.tsx
│   │   │   │
│   │   │   └── perfil/
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/                      # API Routes (opcional)
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts
│   │   │
│   │   ├── layout.tsx                # Root layout
│   │   ├── loading.tsx               # Global loading
│   │   ├── error.tsx                 # Global error
│   │   ├── not-found.tsx             # 404 page
│   │   └── globals.css               # Global styles
│   │
│   ├── components/                   # Componentes reutilizables
│   │   ├── ui/                       # Componentes base (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── table.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/                   # Componentes de layout
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── breadcrumbs.tsx
│   │   │   └── page-header.tsx
│   │   │
│   │   ├── forms/                    # Componentes de formularios
│   │   │   ├── form-field.tsx
│   │   │   ├── form-error.tsx
│   │   │   ├── date-picker.tsx
│   │   │   ├── multi-select.tsx
│   │   │   ├── file-upload.tsx
│   │   │   └── rich-text-editor.tsx
│   │   │
│   │   ├── data-display/             # Visualización de datos
│   │   │   ├── data-table.tsx
│   │   │   ├── pagination.tsx
│   │   │   ├── empty-state.tsx
│   │   │   ├── loading-skeleton.tsx
│   │   │   ├── stats-card.tsx
│   │   │   └── progress-bar.tsx
│   │   │
│   │   ├── charts/                   # Componentes de gráficos
│   │   │   ├── burndown-chart.tsx
│   │   │   ├── velocity-chart.tsx
│   │   │   ├── pie-chart.tsx
│   │   │   ├── bar-chart.tsx
│   │   │   └── line-chart.tsx
│   │   │
│   │   ├── kanban/                   # Componentes Kanban
│   │   │   ├── kanban-board.tsx
│   │   │   ├── kanban-column.tsx
│   │   │   ├── kanban-card.tsx
│   │   │   └── kanban-filters.tsx
│   │   │
│   │   ├── scrum/                    # Componentes Scrum
│   │   │   ├── sprint-board.tsx
│   │   │   ├── backlog-list.tsx
│   │   │   ├── story-card.tsx
│   │   │   ├── task-card.tsx
│   │   │   ├── epic-timeline.tsx
│   │   │   └── sprint-timeline.tsx
│   │   │
│   │   ├── notifications/            # Sistema de notificaciones
│   │   │   ├── notification-bell.tsx
│   │   │   ├── notification-list.tsx
│   │   │   └── notification-item.tsx
│   │   │
│   │   └── shared/                   # Componentes compartidos
│   │       ├── user-avatar.tsx
│   │       ├── user-select.tsx
│   │       ├── status-badge.tsx
│   │       ├── priority-badge.tsx
│   │       ├── role-badge.tsx
│   │       ├── search-input.tsx
│   │       ├── filter-panel.tsx
│   │       └── confirm-dialog.tsx
│   │
│   ├── features/                     # Features por módulo
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── login-form.tsx
│   │   │   │   ├── logout-button.tsx
│   │   │   │   └── password-reset-form.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-auth.ts
│   │   │   │   └── use-session.ts
│   │   │   ├── services/
│   │   │   │   └── auth.service.ts
│   │   │   └── types/
│   │   │       └── auth.types.ts
│   │   │
│   │   ├── proyectos/
│   │   │   ├── components/
│   │   │   │   ├── proyecto-card.tsx
│   │   │   │   ├── proyecto-form.tsx
│   │   │   │   ├── proyecto-list.tsx
│   │   │   │   └── proyecto-filters.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-proyectos.ts
│   │   │   │   ├── use-proyecto.ts
│   │   │   │   └── use-proyecto-mutations.ts
│   │   │   ├── services/
│   │   │   │   └── proyectos.service.ts
│   │   │   └── types/
│   │   │       └── proyecto.types.ts
│   │   │
│   │   ├── sprints/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── types/
│   │   │
│   │   ├── historias-usuario/
│   │   ├── tareas/
│   │   ├── actividades/
│   │   ├── planning/
│   │   ├── rrhh/
│   │   ├── dashboard/
│   │   └── reportes/
│   │
│   ├── lib/                          # Utilidades y configuración
│   │   ├── api/
│   │   │   ├── client.ts             # Axios client configurado
│   │   │   ├── endpoints.ts          # Definición de endpoints
│   │   │   ├── interceptors.ts       # Request/Response interceptors
│   │   │   └── websocket.ts          # Socket.io client
│   │   │
│   │   ├── auth/
│   │   │   ├── auth-provider.tsx     # Context provider
│   │   │   ├── protected-route.tsx   # HOC para rutas protegidas
│   │   │   └── permissions.ts        # Lógica de permisos
│   │   │
│   │   ├── utils/
│   │   │   ├── cn.ts                 # clsx + tailwind-merge
│   │   │   ├── format.ts             # Formateo de datos
│   │   │   ├── validation.ts         # Validaciones
│   │   │   ├── dates.ts              # Utilidades de fechas
│   │   │   └── constants.ts          # Constantes globales
│   │   │
│   │   └── hooks/
│   │       ├── use-debounce.ts
│   │       ├── use-local-storage.ts
│   │       ├── use-media-query.ts
│   │       ├── use-pagination.ts
│   │       └── use-filters.ts
│   │
│   ├── stores/                       # Zustand stores
│   │   ├── auth.store.ts
│   │   ├── ui.store.ts
│   │   ├── notifications.store.ts
│   │   └── filters.store.ts
│   │
│   ├── types/                        # TypeScript types globales
│   │   ├── api.types.ts
│   │   ├── common.types.ts
│   │   ├── role.types.ts
│   │   └── entities/
│   │       ├── proyecto.ts
│   │       ├── actividad.ts
│   │       ├── sprint.ts
│   │       ├── historia-usuario.ts
│   │       └── ...
│   │
│   ├── config/                       # Configuración
│   │   ├── site.ts                   # Configuración del sitio
│   │   ├── navigation.ts             # Navegación
│   │   └── permissions.ts            # Matriz de permisos
│   │
│   └── styles/                       # Estilos adicionales
│       ├── globals.css
│       └── themes/
│           ├── light.css
│           └── dark.css
│
├── .env.local
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 3. Arquitectura de Componentes

### 3.1 Jerarquía de Componentes

```
┌─────────────────────────────────────────┐
│          App Layout (Root)              │
│  - Providers (Auth, Query, Theme)       │
│  - Toast/Notifications                  │
└─────────────────────────────────────────┘
              │
              ├─ (auth) Group
              │    └─ Auth Layout
              │         └─ Login/Forgot Password Pages
              │
              └─ (dashboard) Group
                   └─ Dashboard Layout
                        ├─ Header (Logo, User Menu, Notifications)
                        ├─ Sidebar (Navigation)
                        └─ Main Content
                             └─ Module Pages
                                  ├─ Page Header
                                  ├─ Filters/Actions
                                  └─ Content (Tables/Boards/Forms)
```

### 3.2 Patrones de Componentes

#### Componente Base (Presentacional)
```tsx
// components/ui/button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ ... }) => { ... }
```

#### Componente de Feature
```tsx
// features/proyectos/components/proyecto-card.tsx
import { Proyecto } from '@/types/entities/proyecto';

interface ProyectoCardProps {
  proyecto: Proyecto;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export const ProyectoCard: React.FC<ProyectoCardProps> = ({ ... }) => {
  const { mutate: deleteProyecto } = useDeleteProyecto();
  // Component logic
}
```

#### Componente de Página
```tsx
// app/(dashboard)/proyectos/page.tsx
'use client';

export default function ProyectosPage() {
  const { data, isLoading } = useProyectos();

  return (
    <div>
      <PageHeader title="Proyectos" />
      <ProyectoFilters />
      <ProyectoList proyectos={data?.data} />
    </div>
  );
}
```

---

## 4. Gestión de Estado

### 4.1 Server State (React Query)

```tsx
// features/proyectos/hooks/use-proyectos.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { proyectosService } from '../services/proyectos.service';

export const useProyectos = (filters?: ProyectoFilters) => {
  return useQuery({
    queryKey: ['proyectos', filters],
    queryFn: () => proyectosService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateProyecto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: proyectosService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      toast.success('Proyecto creado exitosamente');
    },
  });
};
```

### 4.2 Client State (Zustand)

```tsx
// stores/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'auth-storage' }
  )
);
```

### 4.3 UI State (Zustand)

```tsx
// stores/ui.store.ts
interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  theme: 'light',
  setTheme: (theme) => set({ theme }),
}));
```

---

## 5. Enrutamiento

### 5.1 Estructura de Rutas (App Router)

```
/                                    # Redirect to /dashboard
/login                               # Login page
/forgot-password                     # Password recovery

/dashboard                           # Dashboard home (KPIs generales)

/planning
  /pgd                               # Lista de PGDs
  /pgd/:id                           # Detalle PGD
  /oei                               # Objetivos Estratégicos
  /ogd                               # Objetivos GD
  /oegd                              # Objetivos Específicos
  /acciones-estrategicas             # Acciones Estratégicas

/proyectos                           # Lista de proyectos
  /:id                               # Detalle del proyecto
  /:id/backlog                       # Product Backlog
  /:id/sprints                       # Lista de sprints
  /:id/sprints/:sprintId             # Detalle sprint
  /:id/sprints/:sprintId/board       # Sprint Board (Kanban)
  /:id/epicas                        # Épicas del proyecto
  /:id/historias                     # Historias de Usuario
  /:id/equipo                        # Equipo del proyecto
  /:id/reportes                      # Reportes del proyecto
  /:id/configuracion                 # Configuración

/actividades                         # Lista de actividades
  /:id                               # Detalle actividad
  /:id/board                         # Kanban Board
  /:id/tareas                        # Tareas de la actividad
  /:id/reportes                      # Reportes
  /:id/configuracion                 # Configuración

/rrhh
  /personal                          # Gestión de personal
  /divisiones                        # Divisiones organizacionales
  /habilidades                       # Habilidades
  /asignaciones                      # Asignaciones a proyectos/actividades

/reportes
  /sprints                           # Reportes de sprints
  /actividades                       # Reportes de actividades
  /dashboard                         # Dashboard de reportes

/configuracion
  /usuarios                          # Gestión de usuarios
  /sistema                           # Configuración del sistema
  /notificaciones                    # Preferencias de notificaciones

/perfil                              # Perfil de usuario
```

### 5.2 Middleware de Autenticación

```tsx
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/proyectos', '/actividades', ...];
const authRoutes = ['/login', '/forgot-password'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;

  // Redirect authenticated users away from auth pages
  if (token && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users to login
  if (!token && protectedRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}
```

---

## 6. Integración con API

### 6.1 Axios Client

```tsx
// lib/api/client.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 6.2 Endpoints

```tsx
// lib/api/endpoints.ts
export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },

  // Proyectos
  PROYECTOS: {
    BASE: '/proyectos',
    BY_ID: (id: number) => `/proyectos/${id}`,
    SPRINTS: (proyectoId: number) => `/proyectos/${proyectoId}/sprints`,
    BACKLOG: (proyectoId: number) => `/proyectos/${proyectoId}/backlog`,
    EQUIPO: (proyectoId: number) => `/proyectos/${proyectoId}/equipo`,
  },

  // Sprints
  SPRINTS: {
    BASE: '/sprints',
    BY_ID: (id: number) => `/sprints/${id}`,
    HISTORIAS: (sprintId: number) => `/sprints/${sprintId}/historias`,
    START: (sprintId: number) => `/sprints/${sprintId}/start`,
    COMPLETE: (sprintId: number) => `/sprints/${sprintId}/complete`,
  },

  // Historias de Usuario
  HISTORIAS: {
    BASE: '/historias-usuario',
    BY_ID: (id: number) => `/historias-usuario/${id}`,
    TAREAS: (huId: number) => `/historias-usuario/${huId}/tareas`,
  },

  // Dashboard
  DASHBOARD: {
    GENERAL: '/dashboard/general',
    PROYECTO: (id: number) => `/dashboard/proyecto/${id}`,
    ACTIVIDAD: (id: number) => `/dashboard/actividad/${id}`,
    OEI: (id: number) => `/dashboard/oei/${id}`,
  },
};
```

### 6.3 Service Layer

```tsx
// features/proyectos/services/proyectos.service.ts
import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type { Proyecto, CreateProyectoDto, UpdateProyectoDto } from '../types';

export const proyectosService = {
  getAll: async (params?: ProyectoFilters) => {
    return apiClient.get<PaginatedResponse<Proyecto>>(
      ENDPOINTS.PROYECTOS.BASE,
      { params }
    );
  },

  getById: async (id: number) => {
    return apiClient.get<Proyecto>(ENDPOINTS.PROYECTOS.BY_ID(id));
  },

  create: async (data: CreateProyectoDto) => {
    return apiClient.post<Proyecto>(ENDPOINTS.PROYECTOS.BASE, data);
  },

  update: async (id: number, data: UpdateProyectoDto) => {
    return apiClient.patch<Proyecto>(ENDPOINTS.PROYECTOS.BY_ID(id), data);
  },

  delete: async (id: number) => {
    return apiClient.delete(ENDPOINTS.PROYECTOS.BY_ID(id));
  },
};
```

### 6.4 WebSocket Integration

```tsx
// lib/api/websocket.ts
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3010';

class WebSocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('notification', (data) => {
      // Handle notification
    });
  }

  disconnect() {
    this.socket?.disconnect();
  }

  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }
}

export const wsService = new WebSocketService();
```

---

## 7. Autenticación y Autorización

### 7.1 Auth Provider

```tsx
// lib/auth/auth-provider.tsx
'use client';

import { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { wsService } from '@/lib/api/websocket';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuthStore();

  useEffect(() => {
    if (token) {
      wsService.connect(token);
    }
    return () => wsService.disconnect();
  }, [token]);

  return <>{children}</>;
};
```

### 7.2 Role-Based Access Control

```tsx
// lib/auth/permissions.ts
import { Role } from '@/types/role.types';

export const PERMISSIONS = {
  PROYECTOS: {
    VIEW: [Role.ADMIN, Role.PMO, Role.COORDINADOR, Role.SCRUM_MASTER, Role.DESARROLLADOR],
    CREATE: [Role.ADMIN, Role.PMO, Role.COORDINADOR],
    EDIT: [Role.ADMIN, Role.PMO, Role.COORDINADOR, Role.SCRUM_MASTER],
    DELETE: [Role.ADMIN, Role.PMO],
  },
  SPRINTS: {
    VIEW: [Role.ADMIN, Role.PMO, Role.COORDINADOR, Role.SCRUM_MASTER, Role.DESARROLLADOR],
    CREATE: [Role.ADMIN, Role.PMO, Role.SCRUM_MASTER],
    EDIT: [Role.ADMIN, Role.PMO, Role.SCRUM_MASTER],
    DELETE: [Role.ADMIN, Role.PMO, Role.SCRUM_MASTER],
  },
  // ... más permisos
};

export const hasPermission = (userRole: Role, permission: Role[]): boolean => {
  return permission.includes(userRole);
};
```

### 7.3 Protected Route HOC

```tsx
// lib/auth/protected-route.tsx
import { redirect } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { hasPermission } from './permissions';

export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission?: Role[]
) => {
  return (props: P) => {
    const { user } = useAuthStore();

    if (!user) {
      redirect('/login');
    }

    if (requiredPermission && !hasPermission(user.rol, requiredPermission)) {
      redirect('/dashboard'); // Or 403 page
    }

    return <Component {...props} />;
  };
};
```

---

## 8. Módulos Funcionales

### 8.1 Módulo: Dashboard

**Componentes:**
- `DashboardOverview` - Vista general con KPIs
- `ProjectHealthChart` - Salud de proyectos
- `VelocityChart` - Velocidad de equipos
- `AlertsList` - Lista de alertas
- `RecentActivity` - Actividad reciente

**Funcionalidad:**
- KPIs en tiempo real
- Gráficos de burndown, velocidad
- Alertas de proyectos en riesgo
- Recursos sobrecargados

### 8.2 Módulo: Proyectos (Scrum)

**Componentes:**
- `ProyectoList` - Lista de proyectos con filtros
- `ProyectoCard` - Card de proyecto con métricas
- `ProyectoForm` - Formulario creación/edición
- `BacklogList` - Product Backlog
- `SprintBoard` - Tablero Kanban del sprint
- `BurndownChart` - Gráfico burndown
- `VelocityChart` - Velocidad del equipo

**Funcionalidad:**
- CRUD de proyectos
- Gestión de backlog (priorización, estimación)
- Sprint planning
- Daily meetings tracking
- Reportes de sprint
- Gestión de equipo

### 8.3 Módulo: Actividades (Kanban)

**Componentes:**
- `ActividadList` - Lista de actividades
- `ActividadCard` - Card de actividad
- `KanbanBoard` - Tablero Kanban
- `KanbanColumn` - Columna con tareas
- `TareaCard` - Card de tarea (drag & drop)
- `MetricsPanel` - Lead Time, Cycle Time, Throughput

**Funcionalidad:**
- CRUD de actividades
- Tablero Kanban con drag & drop
- WIP limits
- Métricas Kanban
- Reportes periódicos

### 8.4 Módulo: Historias de Usuario

**Componentes:**
- `HistoriaCard` - Card de HU
- `HistoriaForm` - Formulario de HU
- `CriteriosAceptacion` - Lista de criterios
- `TareasList` - Tareas de la HU
- `DependenciasGraph` - Gráfico de dependencias

**Funcionalidad:**
- CRUD de HUs
- Gestión de criterios de aceptación
- Story points (Fibonacci)
- Dependencias entre HUs
- Estados (Backlog, En Progreso, Finalizado)

### 8.5 Módulo: Planning Estratégico

**Componentes:**
- `PgdTimeline` - Timeline de PGD
- `OeiCard` - Card de OEI
- `HierarchyTree` - Árbol jerárquico (PGD → OEI → OGD → OEGD → AE)
- `ProgressIndicator` - Indicador de avance

**Funcionalidad:**
- Gestión de PGD, OEI, OGD, OEGD, AE
- Vinculación con proyectos/actividades
- Dashboard de avance estratégico

### 8.6 Módulo: RRHH

**Componentes:**
- `PersonalList` - Lista de personal
- `PersonalCard` - Card de persona
- `DivisionTree` - Árbol de divisiones
- `HabilidadesList` - Lista de habilidades
- `AsignacionForm` - Asignación a proyectos

**Funcionalidad:**
- Gestión de personal
- Estructura organizacional
- Habilidades y competencias
- Asignaciones a proyectos/actividades
- Carga de trabajo

### 8.7 Módulo: Reportes

**Componentes:**
- `ReportGenerator` - Generador de reportes
- `SprintReport` - Reporte de sprint
- `ActividadReport` - Reporte de actividad
- `ExportButton` - Exportar (PDF, Excel)

**Funcionalidad:**
- Reportes de sprints (burndown, velocity)
- Reportes de actividades (métricas Kanban)
- Exportación a PDF/Excel
- Flujos de aprobación

---

## 9. Diseño UI/UX

### 9.1 Sistema de Diseño

**Paleta de Colores:**
```css
:root {
  /* Primary */
  --primary-50: #eff6ff;
  --primary-500: #3b82f6;
  --primary-900: #1e3a8a;

  /* Secondary */
  --secondary-500: #8b5cf6;

  /* Success */
  --success-500: #10b981;

  /* Warning */
  --warning-500: #f59e0b;

  /* Error */
  --error-500: #ef4444;

  /* Neutral */
  --gray-50: #f9fafb;
  --gray-900: #111827;
}
```

**Typography:**
- Font Family: Inter (primary), Roboto Mono (code)
- Heading: font-semibold
- Body: font-normal
- Scale: text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, ...

**Spacing:**
- Basado en múltiplos de 4px (0.25rem)
- Spacing scale: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, ...

**Border Radius:**
- sm: 0.125rem (2px)
- DEFAULT: 0.25rem (4px)
- md: 0.375rem (6px)
- lg: 0.5rem (8px)
- xl: 0.75rem (12px)
- 2xl: 1rem (16px)
- full: 9999px

### 9.2 Componentes Base (shadcn/ui)

Componentes headless de Radix UI estilizados con Tailwind:
- Button (variants: default, destructive, outline, secondary, ghost, link)
- Input, Textarea, Select
- Dialog, Sheet, Popover
- Table, DataTable
- Card, Badge, Avatar
- Tabs, Accordion
- Calendar, DatePicker
- Toast, Alert

### 9.3 Layouts Responsivos

**Breakpoints:**
```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

**Mobile First:**
- Sidebar colapsable
- Tablas con scroll horizontal
- Cards apiladas
- Bottom navigation (mobile)

### 9.4 Accesibilidad

- Keyboard navigation
- ARIA labels
- Focus states
- Color contrast (WCAG AA)
- Screen reader support

---

## 10. Optimización y Performance

### 10.1 Code Splitting

```tsx
// Dynamic imports para rutas pesadas
const KanbanBoard = dynamic(() => import('@/components/kanban/kanban-board'), {
  loading: () => <LoadingSkeleton />,
  ssr: false,
});
```

### 10.2 Lazy Loading

```tsx
// Lazy load de componentes
import { lazy, Suspense } from 'react';

const Chart = lazy(() => import('@/components/charts/burndown-chart'));

<Suspense fallback={<LoadingSkeleton />}>
  <Chart data={data} />
</Suspense>
```

### 10.3 Optimización de Imágenes

```tsx
// Next.js Image component
import Image from 'next/image';

<Image
  src="/avatar.jpg"
  alt="Avatar"
  width={40}
  height={40}
  priority={false}
/>
```

### 10.4 Caching Strategy

- React Query: staleTime, cacheTime
- SWR para datos en tiempo real
- localStorage para preferencias de usuario

### 10.5 Bundle Optimization

```js
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
  },
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};
```

---

## 11. Testing

### 11.1 Testing Stack

- **Jest** - Test runner
- **React Testing Library** - Component testing
- **MSW (Mock Service Worker)** - API mocking
- **Playwright** - E2E testing

### 11.2 Estructura de Tests

```
src/
├── features/
│   └── proyectos/
│       ├── components/
│       │   ├── proyecto-card.tsx
│       │   └── proyecto-card.test.tsx
│       ├── hooks/
│       │   ├── use-proyectos.ts
│       │   └── use-proyectos.test.ts
│       └── services/
│           ├── proyectos.service.ts
│           └── proyectos.service.test.ts
```

### 11.3 Ejemplo de Test

```tsx
// features/proyectos/components/proyecto-card.test.tsx
import { render, screen } from '@testing-library/react';
import { ProyectoCard } from './proyecto-card';

describe('ProyectoCard', () => {
  it('renders proyecto information', () => {
    const proyecto = {
      id: 1,
      codigo: 'PRY-0001',
      nombre: 'Test Project',
      estado: 'En Progreso',
    };

    render(<ProyectoCard proyecto={proyecto} />);

    expect(screen.getByText('PRY-0001')).toBeInTheDocument();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });
});
```

---

## 12. Deployment

### 12.1 Build Process

```bash
# Build para producción
npm run build

# Start en modo producción
npm run start
```

### 12.2 Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3010/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:3010
NEXT_PUBLIC_APP_NAME=SIGP
```

### 12.3 Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

### 12.4 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      # Deploy steps...
```

---

## Resumen

Este documento define la arquitectura completa del frontend de SIGP, incluyendo:

✅ **Stack tecnológico moderno** (Next.js 14, React 18, TypeScript)
✅ **Estructura de directorios clara** y escalable
✅ **Patrones de componentes** reutilizables
✅ **Gestión de estado** con React Query + Zustand
✅ **Integración completa con API** backend
✅ **Sistema de autenticación** robusto
✅ **Módulos funcionales** por dominio
✅ **UI/UX consistente** con sistema de diseño
✅ **Optimización** y mejores prácticas
✅ **Testing** y deployment

El frontend está diseñado para ser **mantenible**, **escalable** y **performante**, siguiendo las mejores prácticas de la industria.

---

**Documento generado:** 2025-12-14
**Versión:** 1.0
**Estado:** Aprobado para implementación
