# MIGRATION GUIDE - SIGP Frontend

Developer guide for adapting to the new Next.js 14 App Router architecture after the December 2024 refactoring.

**Target Audience**: Developers working on SIGP Frontend
**Prerequisites**: Familiarity with Next.js 13+, TypeScript, React hooks

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [State Management Migration](#state-management-migration)
3. [Component Imports](#component-imports)
4. [Page Structure](#page-structure)
5. [Authentication](#authentication)
6. [API Calls](#api-calls)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### What Changed?

| Category | Old (❌) | New (✅) |
|----------|---------|---------|
| State | Context API | Zustand |
| Auth | AuthContext | Zustand store |
| Routing | Flat structure | Route groups |
| Components | Client by default | Server by default |
| POI Components | `components/poi/` | `features/proyectos/` |

### Update Your Dependencies

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Verify build
npm run build
```

---

## State Management Migration

### Old Pattern: Context API

```typescript
// ❌ OLD - Don't use anymore
import { useAuth } from '@/contexts/auth-context';

function MyComponent() {
  const { user, logout } = useAuth();

  return (
    <div>
      <p>{user?.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### New Pattern: Zustand

```typescript
// ✅ NEW - Use Zustand stores
import { useAuth } from '@/stores';

function MyComponent() {
  const { user, logout } = useAuth();

  return (
    <div>
      <p>{user?.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

**Migration Steps**:

1. Replace import:
   ```typescript
   // Change this line:
   - import { useAuth } from '@/contexts/auth-context';
   + import { useAuth } from '@/stores';
   ```

2. The hook API is **identical** - no code changes needed in component body!

### Available Hooks

#### `useAuth()` - Main auth hook

```typescript
import { useAuth } from '@/stores';

const {
  user,              // Current user or null
  isLoading,         // Loading state
  isAuthenticated,   // Boolean
  logout,            // Function to logout
  checkAccess,       // (pathname: string) => boolean
} = useAuth();
```

#### `useRole()` - Role-based checks

```typescript
import { useRole } from '@/stores';

const {
  role,                // Current user role or null
  isAdmin,            // Boolean
  isPmo,              // Boolean
  isScrumMaster,      // Boolean
  isDesarrollador,    // Boolean
  isCoordinador,      // Boolean
  isUsuario,          // Boolean
  accessibleModules,  // Module[]
} = useRole();
```

#### `useAuthStore()` - Direct store access

```typescript
import { useAuthStore } from '@/stores';

// Select specific state
const user = useAuthStore((state) => state.user);
const token = useAuthStore((state) => state.token);

// Call actions
const setAuth = useAuthStore((state) => state.setAuth);
setAuth(user, token);
```

---

## Component Imports

### POI Components

```typescript
// ❌ OLD - Folder deleted
import { ProyectoCard } from '@/components/poi/proyecto-card';
import { ProyectoForm } from '@/components/poi/proyecto-form';

// ✅ NEW - Use feature folders
import { ProyectoCard, ProyectoForm } from '@/features/proyectos';
```

### Auth Components

```typescript
// ✅ Correct import path
import { PermissionGate, ProtectedRoute } from '@/features/auth';
```

### File Location Reference

| Component | Old Path | New Path |
|-----------|----------|----------|
| ProyectoCard | `components/poi/` | `features/proyectos/components/` |
| ProyectoForm | `components/poi/` | `features/proyectos/components/` |
| ProyectoFilters | `components/poi/` | `features/proyectos/components/` |
| ProyectoList | `components/poi/` | `features/proyectos/components/` |
| PermissionGate | `components/auth/` | `features/auth/components/` |
| ProtectedRoute | `components/auth/` | `features/auth/components/` |

---

## Page Structure

### Old Pattern: Client Component Wrappers

```typescript
// ❌ OLD - Don't wrap pages anymore
"use client";

import { ProtectedRoute } from '@/features/auth';
import AppLayout from '@/components/layout/app-layout';
import { MODULES } from '@/lib/definitions';

export default function MyPage() {
  return (
    <ProtectedRoute module={MODULES.POI}>
      <AppLayout breadcrumbs={[{ label: 'POI' }]}>
        <div>
          {/* Page content */}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
```

### New Pattern: Server Components

```typescript
// ✅ NEW - Server Component by default
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'POI | SIGP',
  description: 'Plan Operativo Informático',
};

export default function MyPage() {
  return (
    <div>
      {/* Page content directly */}
      {/* AppLayout wrapper is in (dashboard)/layout.tsx */}
      {/* Authentication checked by middleware.ts */}
    </div>
  );
}
```

**Key Changes**:

1. **No `"use client"`** - Pages are Server Components by default
2. **No ProtectedRoute wrapper** - Middleware handles auth
3. **No AppLayout wrapper** - Route group layout handles it
4. **Add metadata export** - For SEO

### When to Use `"use client"`

Only add `"use client"` when you need:
- React hooks (`useState`, `useEffect`, etc.)
- Event handlers (`onClick`, `onChange`, etc.)
- Browser APIs (`localStorage`, `window`, etc.)
- Third-party hooks (Zustand hooks, form hooks, etc.)

```typescript
// ✅ Client Component - needs interactivity
"use client";

import { useState } from 'react';
import { useAuth } from '@/stores';

export default function InteractivePage() {
  const [count, setCount] = useState(0);
  const { user } = useAuth();

  return (
    <button onClick={() => setCount(count + 1)}>
      {user?.name}: {count}
    </button>
  );
}
```

---

## Authentication

### Login Flow

```typescript
// ✅ In login form component
"use client";

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { authService } from '@/features/auth';

function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (email: string, password: string) => {
    try {
      const { user, accessToken } = await authService.login(email, password);

      // Set auth state
      setAuth(user, accessToken);

      // Redirect based on role
      const defaultRoute = getDefaultRouteForRole(user.role);
      router.push(defaultRoute);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (/* form JSX */);
}
```

### Logout Flow

```typescript
"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from '@/stores';
import { paths } from '@/lib/paths';

function LogoutButton() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout(); // Clears store and localStorage
    router.push(paths.login);
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

### Protected Content

Use `PermissionGate` for conditional rendering:

```typescript
import { PermissionGate } from '@/features/auth';
import { MODULES, PERMISSIONS } from '@/lib/definitions';

function ProjectPage() {
  return (
    <div>
      {/* Everyone can view */}
      <h1>Project Details</h1>

      {/* Only users with CREATE permission can see this */}
      <PermissionGate module={MODULES.POI} permission={PERMISSIONS.CREATE}>
        <button>Create New Project</button>
      </PermissionGate>

      {/* Only PMO and above can see this */}
      <PermissionGate module={MODULES.POI} permission={PERMISSIONS.MANAGE_BACKLOG}>
        <button>Manage Backlog</button>
      </PermissionGate>
    </div>
  );
}
```

---

## API Calls

### Old Pattern: Direct Fetch

```typescript
// ❌ OLD - Manual fetch with token handling
const response = await fetch('/api/v1/proyectos', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
const data = await response.json();
```

### New Pattern: Service Layer

```typescript
// ✅ NEW - Use service functions
import { proyectosService } from '@/features/proyectos';

// Service handles token injection automatically
const proyectos = await proyectosService.getAll();
const proyecto = await proyectosService.getById(1);
const newProyecto = await proyectosService.create(data);
```

### Server Actions (Server Components)

```typescript
// ✅ In Server Component
import { getProyectos } from '@/lib/actions';

export default async function ProyectosPage() {
  const proyectos = await getProyectos();

  return <ProyectosList data={proyectos} />;
}
```

### Client-Side Mutations (Client Components)

```typescript
// ✅ In Client Component
"use client";

import { useState } from 'react';
import { proyectosService } from '@/features/proyectos';

function CreateProyectoForm() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateProyectoDto) => {
    setIsLoading(true);
    try {
      await proyectosService.create(data);
      // Handle success
    } catch (error) {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  return (/* form JSX */);
}
```

---

## Common Patterns

### Check User Role

```typescript
import { useRole } from '@/stores';

function AdminButton() {
  const { isAdmin, isPmo } = useRole();

  // Only admins and PMO can see this
  if (!isAdmin && !isPmo) {
    return null;
  }

  return <button>Admin Action</button>;
}
```

### Check Module Access

```typescript
import { useAuth } from '@/stores';
import { MODULES } from '@/lib/definitions';

function Navigation() {
  const { checkAccess } = useAuth();

  return (
    <nav>
      {checkAccess(MODULES.PGD) && <Link href="/pgd">PGD</Link>}
      {checkAccess(MODULES.POI) && <Link href="/poi">POI</Link>}
      {checkAccess(MODULES.RRHH) && <Link href="/recursos-humanos">RRHH</Link>}
    </nav>
  );
}
```

### Conditional Rendering by Permission

```typescript
import { PermissionGate } from '@/features/auth';
import { MODULES, PERMISSIONS } from '@/lib/definitions';

function ProjectActions() {
  return (
    <div>
      {/* View is always visible (assuming user has access to POI) */}
      <button>View</button>

      {/* Create only visible if user has CREATE permission */}
      <PermissionGate module={MODULES.POI} permission={PERMISSIONS.CREATE}>
        <button>Create</button>
      </PermissionGate>

      {/* Edit only visible if user has EDIT permission */}
      <PermissionGate module={MODULES.POI} permission={PERMISSIONS.EDIT}>
        <button>Edit</button>
      </PermissionGate>

      {/* Delete only visible if user has DELETE permission */}
      <PermissionGate module={MODULES.POI} permission={PERMISSIONS.DELETE}>
        <button>Delete</button>
      </PermissionGate>
    </div>
  );
}
```

### Loading States with Zustand

```typescript
"use client";

import { useAuth } from '@/stores';

function UserProfile() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Not authenticated</div>;
  }

  return <div>Welcome, {user.name}!</div>;
}
```

---

## Troubleshooting

### "Module not found" errors

**Problem**: `Module '"@/contexts/auth-context"' not found`

**Solution**: Update import to use Zustand:
```typescript
- import { useAuth } from '@/contexts/auth-context';
+ import { useAuth } from '@/stores';
```

---

### "useAuth must be used within AuthProvider" error

**Problem**: Old Context API error message

**Solution**: This shouldn't happen anymore. If you see it:
1. Verify you're importing from `@/stores`, not `@/contexts/auth-context`
2. Check for cached build artifacts: `rm -rf .next && npm run build`

---

### Component not found in POI

**Problem**: `Module '"@/components/poi/proyecto-card"' not found`

**Solution**: Update import to use feature folder:
```typescript
- import { ProyectoCard } from '@/components/poi/proyecto-card';
+ import { ProyectoCard } from '@/features/proyectos';
```

---

### Page redirects to login immediately

**Problem**: Middleware is blocking access

**Possible causes**:
1. Token not in cookies/localStorage
2. User logged out but page still cached
3. Token expired

**Solution**:
```typescript
// Check if user is authenticated
import { useAuth } from '@/stores';

function MyComponent() {
  const { isAuthenticated, user } = useAuth();

  console.log('Authenticated:', isAuthenticated);
  console.log('User:', user);

  // Debug: check localStorage
  if (typeof window !== 'undefined') {
    console.log('Token:', localStorage.getItem('auth-token'));
  }
}
```

---

### 401 Unauthorized on API calls

**Problem**: Token not being sent to API

**Check**:
1. Token exists in localStorage
2. Axios interceptor is working
3. Token hasn't expired

**Debug**:
```typescript
import { apiClient } from '@/lib/api';

// Check if interceptor is adding token
apiClient.interceptors.request.use((config) => {
  console.log('Request headers:', config.headers);
  return config;
});
```

---

### Build fails with TypeScript errors

**Problem**: Type mismatches after refactoring

**Common fixes**:

1. **User type**:
   ```typescript
   // Use the exported type
   import type { User } from '@/stores';
   // or
   import type { AuthUser } from '@/lib/definitions';
   ```

2. **Module type**:
   ```typescript
   import { MODULES, type Module } from '@/lib/definitions';
   ```

3. **Clear build cache**:
   ```bash
   rm -rf .next
   npm run build
   ```

---

### React Query not found

**Problem**: `Module '"@tanstack/react-query"' not found`

**Reason**: React Query was removed in FASE 5 as it wasn't needed

**Solution**:
- Use Server Components for data fetching
- Use Zustand for client state
- Use Server Actions for mutations

If you absolutely need React Query:
```bash
npm install @tanstack/react-query
```

Then configure providers as needed.

---

## Cheat Sheet

### Quick Import Reference

```typescript
// State Management
import { useAuth, useRole, useAuthStore } from '@/stores';

// Auth Components
import { PermissionGate, ProtectedRoute } from '@/features/auth';

// POI Components
import {
  ProyectoCard,
  ProyectoForm,
  ProyectoFilters,
  ProyectoList
} from '@/features/proyectos';

// Services
import { authService } from '@/features/auth';
import { proyectosService } from '@/features/proyectos';

// API Client
import { apiClient } from '@/lib/api';

// Server Actions
import { getProyectos, createProyecto } from '@/lib/actions';

// Types & Constants
import { ROLES, MODULES, PERMISSIONS } from '@/lib/definitions';
import type { AuthUser, Role, Module, Permission } from '@/lib/definitions';

// Routes
import { paths } from '@/lib/paths';

// Permissions
import { canAccessModule, hasPermission } from '@/lib/permissions';
```

---

## Best Practices

### ✅ Do

- Use Server Components by default
- Add `"use client"` only when needed
- Import from barrel exports (`@/features/auth` vs `@/features/auth/components/PermissionGate`)
- Use `paths.ts` constants for navigation
- Use service layer for API calls
- Use `PermissionGate` for conditional rendering
- Use `metadata` export for SEO

### ❌ Don't

- Don't wrap pages in `<ProtectedRoute>` or `<AppLayout>` - route groups handle it
- Don't import from deleted folders (`@/contexts/auth-context`, `@/components/poi`)
- Don't make API calls directly - use service layer
- Don't hardcode route paths - use `paths.ts`
- Don't create new auth state - use Zustand store
- Don't mix Server and Client Components unnecessarily

---

## Migration Checklist

When working on a new feature or updating existing code:

- [ ] Check imports - update any from old locations
- [ ] Use Zustand hooks (`@/stores`) for auth
- [ ] Remove unnecessary `"use client"` directives
- [ ] Use service layer for API calls
- [ ] Use `PermissionGate` for auth checks
- [ ] Use `paths.ts` for navigation
- [ ] Add `metadata` export to pages
- [ ] Test build: `npm run build`
- [ ] Test authentication flow
- [ ] Test permission gates

---

## Need Help?

1. **Check documentation**:
   - This guide (MIGRATION_GUIDE.md)
   - `docs/guides/REFACTORING_CHANGES.md` - Full changelog
   - `CLAUDE.md` - Architecture overview

2. **Search codebase for examples**:
   ```bash
   # Find usage of useAuth
   grep -r "useAuth" src/app

   # Find PermissionGate usage
   grep -r "PermissionGate" src

   # Find service usage
   grep -r "Service" src/features
   ```

3. **Common issues**: See Troubleshooting section above

---

**Last Updated**: 2025-12-14
**Version**: 1.0
**Maintainer**: Development Team
