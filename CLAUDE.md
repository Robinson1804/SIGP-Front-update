# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.


## Project Overview

**SIGP Frontend** - Sistema Integrado de Gestión de Proyectos

This is a **Next.js 14 frontend application** for managing institutional projects and activities using agile methodologies (Scrum/Kanban). Built for INEI (Instituto Nacional de Estadística e Informática) to manage strategic planning (PGD) and operational execution (POI).

**CRITICAL**: This is a **refactoring project**, NOT a greenfield build. You are adapting and improving existing code, not writing from scratch.

### Stack
- **Framework**: Next.js 14 (App Router with Route Groups)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Forms**: React Hook Form + Zod
- **State**: Zustand with persistence middleware
- **Backend**: NestJS API on `localhost:3010`

**Recent Changes** (Dec 2024):
- ✅ Migrated from Context API to Zustand
- ✅ Implemented route groups for better organization
- ✅ Converted pages to Server Components
- ✅ Added middleware for edge authentication
- ✅ Feature-based architecture implemented
- ❌ Removed React Query (not needed)

---

## Essential Commands

### Development
```bash
npm run dev              # Dev server on port 3000 (configured in package.json)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint
```

**Note**: `next.config.mjs` currently has `ignoreBuildErrors: true` and `ignoreDuringBuilds: true` - this is temporary for development. Do NOT rely on this; fix TypeScript and ESLint errors properly.

### Port Configuration
- **Frontend**: `localhost:3000` (default Next.js dev server)
- **Backend API**: `localhost:3010`
- **Swagger Docs**: `localhost:3010/api/docs`

---

## Architecture Overview

### Directory Structure
```
src/
├── app/                          # Next.js 14 App Router with Route Groups
│   ├── (auth)/                  # 🔓 Public routes (no auth required)
│   │   ├── login/              # Authentication page
│   │   ├── unauthorized/       # Access denied page
│   │   └── layout.tsx          # Minimal layout for auth pages
│   │
│   ├── (dashboard)/            # 🔒 Protected routes (auth required)
│   │   ├── dashboard/          # Main dashboard
│   │   ├── pgd/               # Strategic planning (4-year plans)
│   │   │   ├── oei/          # Institutional strategic objectives
│   │   │   ├── ogd/          # Digital government objectives
│   │   │   ├── oegd/         # Specific digital government objectives
│   │   │   ├── ae/           # Strategic actions
│   │   │   └── proyectos/    # Projects linked to planning
│   │   ├── poi/              # Operational planning (annual)
│   │   │   ├── proyectos/    # New Scrum-based projects (active)
│   │   │   ├── proyecto/     # DEPRECATED: Old project system (redirects)
│   │   │   └── actividad/    # Kanban-based activities
│   │   ├── recursos-humanos/ # HR management
│   │   ├── notificaciones/   # Notifications
│   │   ├── perfil/          # User profile
│   │   └── layout.tsx        # Full app layout with auth validation
│   │
│   └── page.tsx              # Root - Server Component redirect to login
│
├── features/                 # Feature-based architecture
│   ├── auth/                # Authentication domain
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── PermissionGate.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── services/
│   │   │   └── auth.service.ts
│   │   └── index.ts         # Barrel export
│   │
│   ├── proyectos/          # POI Proyectos domain
│   │   ├── components/
│   │   │   ├── ProyectoCard.tsx
│   │   │   ├── ProyectoForm.tsx
│   │   │   ├── ProyectoFilters.tsx
│   │   │   └── ProyectoList.tsx
│   │   ├── services/
│   │   │   └── proyectos.service.ts
│   │   └── index.ts         # Barrel export
│   │
│   └── actividades/        # POI Actividades domain
│       └── (similar structure)
│
├── stores/                  # Zustand state management
│   ├── auth.store.ts       # Authentication state with persistence
│   └── index.ts            # Barrel export
│
├── lib/
│   ├── api/
│   │   ├── client.ts       # Axios instance with interceptors
│   │   └── index.ts
│   ├── hooks/              # Custom React hooks
│   │   └── use-permissions.ts
│   ├── actions.ts          # Server actions (auth, data fetching)
│   ├── definitions.ts      # TypeScript types and enums (single source of truth)
│   ├── paths.ts            # Route constants
│   └── permissions.ts      # Permission system logic
│
├── components/             # Shared UI components
│   ├── ui/                # shadcn/ui base components
│   └── layout/            # AppLayout, Header, Sidebar
│
├── contexts/              # React Context (legacy - mostly removed)
│   └── sidebar-context.tsx  # Only sidebar state remains
│
└── middleware.ts          # Edge middleware for authentication (root level)
```

**Key Changes** (Dec 2024):
- ✅ Route groups: `(auth)` for public, `(dashboard)` for protected
- ✅ Feature folders: Code organized by domain (auth, proyectos, actividades)
- ✅ Stores: Zustand replaces Context API for state management
- ❌ Removed: `components/auth/` (moved to `features/auth/`)
- ❌ Removed: `components/poi/` (moved to `features/proyectos/`)
- ❌ Removed: `contexts/auth-context.tsx` (replaced by Zustand)

### Key Architectural Concepts

#### 1. Dual Methodology System
The system supports **two parallel workflows**:

**SCRUM (for Proyectos - Projects)**
- Time-boxed sprints (2-4 weeks)
- Hierarchy: Proyecto → Épica → Historia de Usuario → Tarea
- Story points, velocity tracking, burndown charts
- Sprint planning, daily meetings, retrospectives
- NO subtasks allowed

**KANBAN (for Actividades - Activities)**
- Continuous flow, no sprints
- Hierarchy: Actividad → Tarea → Subtarea
- Lead time, cycle time, throughput metrics
- WIP limits, continuous delivery
- Subtasks ARE allowed

#### 2. Role-Based Permission System

Seven roles with hierarchical permissions defined in `src/lib/permissions.ts`:

```typescript
ADMINISTRADOR    → Full access to RRHH only
PMO              → Access to PGD, POI, RRHH, Dashboard, Notificaciones
COORDINADOR      → POI (create/edit), RRHH (read-only), Notificaciones
SCRUM_MASTER     → POI (no create), RRHH (read-only), Notificaciones
DESARROLLADOR    → POI (view + update own tasks only)
IMPLEMENTADOR    → POI (view + update own tasks only)
USUARIO          → POI (view only), Notificaciones
```

**Permission helpers** (use these, don't reinvent):
- `canAccessModule(role, module)` - Can user access this module?
- `hasPermission(role, module, permission)` - Specific permission check
- `canEdit(role, module)` - Can create/edit/delete?
- `getDefaultRouteForRole(role)` - Where to redirect after login

#### 3. Strategic Planning Hierarchy (PGD)

```
PGD (Plan de Gobierno Digital - 4 years)
 ├─ OEI (Objetivo Estratégico Institucional)
 ├─ OGD (Objetivo de Gobierno Digital)
 ├─ OEGD (Objetivo Específico de Gobierno Digital)
 └─ AE (Acción Estratégica)
      └─ POI (Plan Operativo Informático - annual)
           ├─ Proyectos (Scrum)
           └─ Actividades (Kanban)
```

Each POI initiative (Proyecto or Actividad) must link to an Acción Estratégica (AE) for traceability.

---

## Backend Integration

### API Configuration
- **Base URL**: `http://localhost:3010/api/v1`
- **Auth**: JWT Bearer tokens in `Authorization` header
- **Response Format**: All responses wrapped in `{ data, statusCode, message }`

### Authentication Flow
1. User logs in at `/login` → POST `/api/v1/auth/login`
2. Receive `{ accessToken, refreshToken, user }`
3. Store tokens (implementation in `src/stores/auth.store.ts` with Zustand persist)
4. Include `Authorization: Bearer {accessToken}` in all requests (via API client interceptor)
5. On 401, refresh using `/api/v1/auth/refresh`
6. On refresh failure, redirect to `/login`

**New Architecture** (Dec 2024):
- **Edge Middleware**: `middleware.ts` validates auth at edge before rendering
- **Zustand Store**: `src/stores/auth.store.ts` with localStorage persistence
- **API Interceptor**: `src/lib/api/client.ts` automatically injects Bearer token
- **Route Groups**: `(auth)` for public, `(dashboard)` for protected routes

### Key Backend Entities

Refer to `docs/specs/04_ARQUITECTURA_BD.md` for complete database schema. Key entities:

**Planning (schema: planning)**
- `pgd`, `oei`, `ogd`, `oegd`, `acciones_estrategicas`

**POI (schema: poi)**
- `proyectos`, `actividades`, `subproyectos`
- `documentos`, `actas`, `requerimientos`, `cronogramas`
- `informes_sprint`, `informes_actividad`

**Agile (schema: agile)**
- `epicas`, `sprints`, `historias_usuario`
- `tareas` (unified entity with `tipo: 'SCRUM' | 'KANBAN'`)
- `subtareas` (only for KANBAN tareas)
- `criterios_aceptacion`, `daily_meetings`

**RRHH (schema: rrhh)**
- `personal`, `divisiones`, `habilidades`, `asignaciones`

**Auth (schema: public)**
- `usuarios`, `sesiones`

### Important Backend Enums

```typescript
// Project States
'Pendiente' | 'En planificacion' | 'En desarrollo' | 'Finalizado' | 'Cancelado'

// Sprint States
'Planificado' | 'Activo' | 'Completado'

// HU States
'Pendiente' | 'En analisis' | 'Lista' | 'En desarrollo' | 'En pruebas' | 'En revision' | 'Terminada'

// Task States (both Scrum & Kanban)
'Por hacer' | 'En progreso' | 'En revision' | 'Finalizado'

// MoSCoW Priority
'Must' | 'Should' | 'Could' | 'Wont'

// User Roles
'ADMIN' | 'PMO' | 'COORDINADOR' | 'SCRUM_MASTER' | 'PATROCINADOR' | 'DESARROLLADOR' | 'IMPLEMENTADOR'
```

---

## Critical Implementation Patterns

### 1. Route Protection

**New Architecture** (Dec 2024):
- Edge-level protection via `middleware.ts` (validates before component renders)
- Route groups: `(auth)` for public, `(dashboard)` for protected
- Per-component permission checks with `PermissionGate`

**Pages** (Server Components):
```tsx
// No wrapper needed! Middleware handles auth at edge
// Layout handled by route group (dashboard)/layout.tsx

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'POI | SIGP',
  description: '...',
};

export default function POIPage() {
  return <div>{/* Your content */}</div>;
}
```

**Components** (Conditional Rendering):
```tsx
// Client Components - use PermissionGate for granular permissions
import { PermissionGate } from '@/features/auth';
import { MODULES, PERMISSIONS } from '@/lib/definitions';

function ProjectActions() {
  return (
    <div>
      {/* Everyone with POI access sees this */}
      <button>View</button>

      {/* Only users with CREATE permission see this */}
      <PermissionGate module={MODULES.POI} permission={PERMISSIONS.CREATE}>
        <button>Create New</button>
      </PermissionGate>
    </div>
  );
}
```

**State Management**:
```tsx
// Use Zustand hooks for auth checks
"use client";

import { useAuth, useRole } from '@/stores';

function MyComponent() {
  const { user, isAuthenticated } = useAuth();
  const { isAdmin, isPmo } = useRole();

  if (!isAuthenticated) return null;

  return (
    <div>
      <p>Welcome, {user?.name}</p>
      {(isAdmin || isPmo) && <AdminPanel />}
    </div>
  );
}
```

### 2. Path Management

**ALWAYS use** `src/lib/paths.ts` for navigation, never hardcode routes:

```tsx
import { paths } from '@/lib/paths';
import Link from 'next/link';

// Good
<Link href={paths.poi.proyecto.backlog.tablero}>Tablero</Link>

// Bad
<Link href="/poi/proyecto/backlog/tablero">Tablero</Link>
```

### 3. Type Definitions

Central types in `src/lib/definitions.ts`:

```typescript
// Use these enums, don't create duplicates
export const ROLES = { ... }
export const MODULES = { ... }
export const PERMISSIONS = { ... }

// Type exports
export type Role = typeof ROLES[keyof typeof ROLES];
export type Module = typeof MODULES[keyof typeof MODULES];
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
```

### 4. Server Actions vs Client Components

- **Server Actions** (`src/lib/actions.ts`): Data fetching, mutations, auth logic
- **Client Components**: Use `'use client'` for interactivity, forms, state

Example pattern:
```tsx
// actions.ts (Server Action)
export async function getProyectos() {
  const response = await fetch(`${API_BASE}/proyectos`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

// page.tsx (Server Component)
export default async function ProyectosPage() {
  const proyectos = await getProyectos();
  return <ProyectosList data={proyectos} />;
}

// ProyectosList.tsx (Client Component)
'use client';
export function ProyectosList({ data }) {
  // Interactive logic here
}
```

---

## Special Considerations

### Tarea Entity (Unified Design)

The `tareas` table handles BOTH Scrum and Kanban tasks via a discriminator field `tipo`:

**When tipo = 'SCRUM'**:
- `historia_usuario_id` is NOT NULL
- `actividad_id` is NULL
- No subtareas allowed

**When tipo = 'KANBAN'**:
- `actividad_id` is NOT NULL
- `historia_usuario_id` is NULL
- Can have subtareas

Never try to create subtareas for Scrum tasks or assign Kanban tasks to user stories.

### Document Approval Workflows

Different approval chains depending on document type:

**Acta de Constitución (Project Charter)**:
```
Scrum Master → Coordinador → Patrocinador (final approval)
```

**Acta de Reunión**:
```
Scrum Master → Coordinador → PMO
```

**Informe de Sprint**:
```
Scrum Master → Coordinador → PMO
```

**Informe de Actividad**:
```
Coordinador → PMO
```

### Notifications

Auto-generated on key events:
- Task assignment/reassignment
- Sprint start/end
- Document awaiting approval
- Project status changes
- Upcoming deadlines

WebSocket integration (planned, not yet implemented).

---

## Common Gotchas & Solutions

### Issue: "404 This page could not be found" on root path
**Cause**: Root redirect logic not handling authentication state properly.
**Solution**: Check `src/app/page.tsx` - should redirect to login if not authenticated, or user's default route if authenticated.

### Issue: Permission denied even with correct role
**Cause**: Permission check using wrong module constant.
**Solution**: Always use `MODULES.X` from `src/lib/definitions.ts`, not string literals.

### Issue: Type errors with form submissions
**Cause**: shadcn/ui form components expect specific prop types.
**Solution**: Use Zod schemas for validation, React Hook Form for state management. See existing forms in `src/components/auth/login-form.tsx` as template.

### Issue: Build fails with TypeScript errors
**Cause**: `ignoreBuildErrors: true` in `next.config.mjs` is masking issues.
**Solution**: Fix all TypeScript errors. This flag is temporary scaffolding only.

---

## Documentation References

**When you need to understand**:
- **System architecture**: `docs/specs/03_ARQUITECTURA_SISTEMA.md`
- **Database schema**: `docs/specs/04_ARQUITECTURA_BD.md`
- **API endpoints**: `docs/api/API_REFERENCE.md`
- **Backend structure**: `docs/guides/BACKEND_STRUCTURE_GUIDE.md`
- **Business requirements**: `docs/specs/01_RESUMEN_EJECUTIVO.md`
- **Permissions matrix**: `docs/specs/07_MATRIZ_PERMISOS.md`

**Quick API testing**: `http://localhost:3010/api/docs` (Swagger UI)

---

## Coding Conventions

### TypeScript
- Use explicit types, avoid `any`
- Prefer interfaces for object shapes, types for unions
- Use enums from `definitions.ts`, don't create new ones

### Component Structure
```tsx
// 1. Imports (grouped: react, next, external, internal, types)
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { paths } from '@/lib/paths';
import type { Proyecto } from '@/lib/definitions';

// 2. Types/Interfaces (if not in definitions.ts)
interface ComponentProps {
  proyecto: Proyecto;
}

// 3. Component
export function Component({ proyecto }: ComponentProps) {
  // Hooks first
  const router = useRouter();
  const [state, setState] = useState();

  // Event handlers
  const handleClick = () => { ... };

  // Render
  return (...);
}
```

### Naming
- Components: `PascalCase` (e.g., `ProyectoCard`)
- Files: `kebab-case` (e.g., `proyecto-card.tsx`)
- Hooks: `useCamelCase` (e.g., `usePermissions`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `PERMISSIONS.VIEW`)

### Tailwind
- Use utility classes directly, no custom CSS files except `globals.css`
- Prefer semantic spacing (`gap-4`, `p-6`) over arbitrary values
- Use CSS variables for colors (defined in `globals.css`)

---

## Environment Variables

Required in `.env.local`:

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3010
NEXT_PUBLIC_API_VERSION=v1

# WebSockets (future)
NEXT_PUBLIC_WS_URL=ws://localhost:3010

# Debug (optional)
NEXT_PUBLIC_DEBUG=false
```

**Never commit** `.env.local` or put secrets in code.

---

## Testing Strategy (Future)

Currently no tests. When implementing:
- Unit tests: Vitest
- Integration tests: Playwright
- Component tests: React Testing Library

---

## Git Workflow

From recent commits, the pattern is:
1. Make changes
2. Test manually with running backend
3. Commit with descriptive Spanish messages
4. No formal PR process (direct to main)

**Before committing**:
- Verify login flow works
- Check role-based redirects
- Test permission gates on protected routes

---

## Known Limitations

1. **No offline support** - requires backend connection
2. **No WebSocket real-time updates yet** - planned for backlog/notifications
3. **No automated tests** - manual testing only
4. **TypeScript errors ignored in build** - temporary, needs cleanup

## Architectural Decisions (Dec 2024)

**React Query Status**: ❌ **Removed**

**Decision**: Not needed for current architecture
**Rationale**:
- Next.js 14 Server Components provide built-in caching
- Zustand handles client-side state management
- Server Actions handle mutations efficiently
- Simplifies architecture and reduces bundle size

**Future**: Can be re-added if advanced client-side caching becomes necessary

**Migration Documentation**:
- Complete changelog: `docs/guides/REFACTORING_CHANGES.md`
- Developer guide: `docs/guides/MIGRATION_GUIDE.md`

---

## Getting Help

- **Backend not responding**: Check `http://localhost:3010/api/v1/health`
- **CORS errors**: Verify backend `.env` has `FRONTEND_URL=http://localhost:3000`
- **Auth loops**: Clear localStorage, check token expiration logic
- **Permission issues**: Console.log user role and check `ROLE_PERMISSIONS` mapping

For architectural questions, always refer to `docs/` first before making assumptions.
