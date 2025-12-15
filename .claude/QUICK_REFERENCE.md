# 🎯 SIGP Quick Reference - Claude Code

Referencia rápida de comandos y agentes para desarrollo en SIGP Frontend.

---

## 📌 Comandos Más Usados

### Generar Código
```bash
# CRUD completo de una entidad
/sigp-crud-generator [EntityName] [--scrum|--kanban]

# Componente React optimizado
/nextjs-component-generator [ComponentName] [--client|--server]

# Middleware Next.js
/nextjs-middleware-creator
```

### Validación y Testing
```bash
# Validar patrones del proyecto
/sigp-validate-patterns [file-path or module]

# Test de APIs backend
/nextjs-api-tester

# Auditoría de performance
/nextjs-performance-audit [--lighthouse|--bundle|--runtime|--all]
```

### Helpers
```bash
# Ayuda con migraciones Next.js
/nextjs-migration-helper
```

---

## 🤖 Agentes Especializados

### Desarrollo
```
"Agente frontend-developer: [tarea de UI/componentes]"
"Agente fullstack-developer: [tarea completa front+back]"
"Agente nextjs-architecture-expert: [decisiones arquitectónicas]"
```

### Diseño y Testing
```
"Agente ui-ux-designer: [diseño de interfaces]"
"Agente test-engineer: [testing y QA]"
"Agente code-reviewer: [revisión de código]"
```

### Arquitectura
```
"Agente database-architect: [diseño de BD]"
"Agente context-manager: [tareas multi-sesión]"
"Agente Explore: [explorar codebase] --thoroughness=very thorough"
```

---

## 🔥 Workflows Rápidos

### Nuevo Módulo Completo
```
1. /sigp-crud-generator Proyecto --scrum
2. "Agente frontend-developer: Refina UI con shadcn/ui"
3. /sigp-validate-patterns poi
4. "Agente code-reviewer: Revisa módulo POI"
```

### Fix de Bug
```
1. "Agente Explore: Encuentra archivos relacionados con [problema]"
2. [Hacer fix]
3. /sigp-validate-patterns [archivo-modificado]
4. "Agente test-engineer: Test de regresión para [bug]"
```

### Optimización
```
1. /nextjs-performance-audit --all
2. "Agente frontend-developer: Optimiza [componente] según audit"
3. /nextjs-performance-audit --lighthouse  # Validar mejora
```

---

## 📐 Patrones del Proyecto

### Rutas
```typescript
❌ <Link href="/poi/proyecto/backlog">
✅ import { paths } from '@/lib/paths';
   <Link href={paths.poi.proyecto.backlog.base}>
```

### Permisos
```typescript
❌ <PermissionGate module="POI" permission="CREATE">
✅ import { MODULES, PERMISSIONS } from '@/lib/definitions';
   <PermissionGate module={MODULES.POI} permission={PERMISSIONS.CREATE}>
```

### Tipos
```typescript
❌ interface Proyecto { ... }  // En component file
✅ import type { Proyecto } from '@/lib/definitions';
```

### Data Fetching
```typescript
❌ fetch('http://localhost:3010/api/proyectos')  // En Client Component
✅ import { getProyectos } from '@/lib/actions';
   const proyectos = await getProyectos();  // En Server Component
```

### Imports
```typescript
❌ import { Button } from '../../../components/ui/button';
✅ import { Button } from '@/components/ui/button';
```

---

## 🎨 Componentes

### Server Component Template
```typescript
// app/[module]/page.tsx
import { getEntities } from '@/lib/actions';
import { PermissionGate } from '@/components/auth/permission-gate';
import { MODULES, PERMISSIONS } from '@/lib/definitions';

export const metadata = {
  title: 'Título | SIGP',
};

export default async function Page() {
  const data = await getEntities();

  return (
    <PermissionGate module={MODULES.XXX} permission={PERMISSIONS.VIEW}>
      <Component data={data} />
    </PermissionGate>
  );
}
```

### Client Component Template
```typescript
// components/[module]/component.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Entity } from '@/lib/definitions';

interface ComponentProps {
  data: Entity;
}

export function Component({ data }: ComponentProps) {
  const [state, setState] = useState();

  return <div>...</div>;
}
```

### Server Action Template
```typescript
// lib/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { Entity } from './definitions';

export async function createEntity(input: CreateEntityInput): Promise<Entity> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE}/api/v1/entities`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) throw new Error('Error');

  const data = await response.json();
  revalidatePath('/module/entities');

  return data.data || data;
}
```

---

## 🔐 Sistema de Permisos

### Roles y Accesos
```
ADMINISTRADOR   → Solo RRHH (full)
PMO             → PGD, POI, RRHH, Dashboard (full)
COORDINADOR     → POI (create/edit), RRHH (read)
SCRUM_MASTER    → POI (edit, no create), RRHH (read)
DESARROLLADOR   → POI (view + update own tasks)
IMPLEMENTADOR   → POI (view + update own tasks)
USUARIO         → POI (view), Notificaciones
```

### Helper Functions
```typescript
import {
  canAccessModule,
  hasPermission,
  canEdit,
  getDefaultRouteForRole,
} from '@/lib/permissions';

canAccessModule(ROLES.PMO, MODULES.PGD)  // true
hasPermission(ROLES.DESARROLLADOR, MODULES.POI, PERMISSIONS.CREATE)  // false
canEdit(ROLES.COORDINADOR, MODULES.POI)  // true
getDefaultRouteForRole(ROLES.PMO)  // '/pgd'
```

---

## 🎯 Dual System Scrum/Kanban

### SCRUM (Proyectos)
```typescript
Proyecto → Épica → Historia Usuario → Tarea
- Sprints (2-4 semanas)
- Story points
- Burndown charts
- NO subtareas
```

### KANBAN (Actividades)
```typescript
Actividad → Tarea → Subtarea
- Flujo continuo
- Lead time, cycle time
- WIP limits
- SÍ subtareas
```

### Entidad Tarea Unificada
```typescript
interface Tarea {
  tipo: 'SCRUM' | 'KANBAN';
  historiaUsuarioId?: number;  // Solo SCRUM
  actividadId?: number;         // Solo KANBAN
  // ...
}
```

---

## 🛠️ Debugging Rápido

### Backend no responde
```bash
curl http://localhost:3010/api/v1/health
# Si falla, iniciar backend: cd ../sigp-backend && npm run dev
```

### Frontend no compila
```bash
npm run lint
npm run build
# Ver errores TypeScript
```

### Token expirado
```javascript
// Limpiar localStorage
localStorage.clear()
// Volver a hacer login
```

### Permission denied
```javascript
// Verificar rol del usuario en console
console.log('User:', user, 'Role:', user?.rol)
// Verificar si módulo permite ese rol
import { ROLE_PERMISSIONS } from '@/lib/permissions'
console.log(ROLE_PERMISSIONS[user.rol])
```

---

## 📊 Checklist Pre-Commit

```bash
# 1. Validar patrones
/sigp-validate-patterns [module]

# 2. Lint
npm run lint

# 3. Type check
npx tsc --noEmit

# 4. Tests (cuando existan)
npm run test

# 5. Build check
npm run build

# 6. Code review (opcional pero recomendado)
"Agente code-reviewer: Revisa cambios"
```

---

## 🆘 Ayuda Rápida

| Problema | Comando/Acción |
|----------|----------------|
| No sé por dónde empezar | Lee `CLAUDE.md` |
| Necesito un CRUD | `/sigp-crud-generator [Entity]` |
| ¿Sigue los patrones? | `/sigp-validate-patterns [file]` |
| Performance lenta | `/nextjs-performance-audit --all` |
| Bug en producción | `"Agente Explore: Encuentra archivos de [feature]"` |
| Decisión arquitectónica | `"Agente nextjs-architecture-expert: [pregunta]"` |
| Diseñar interfaz | `"Agente ui-ux-designer: [descripción]"` |
| Refactor grande | `"Agente context-manager: Trackea [refactor]"` |

---

## 📚 Documentación

```
CLAUDE.md                        → Guía principal del proyecto
.claude/SIGP_WORKFLOW_GUIDE.md   → Workflows paso a paso
CLAUDE_CODE_SETUP.md             → Setup completo y getting started
docs/api/API_REFERENCE.md        → Endpoints del backend
docs/specs/03_ARQUITECTURA_SISTEMA.md → Arquitectura completa
```

---

## 🎓 Pro Tips

1. **Combina comandos**: `/sigp-crud-generator` + `frontend-developer` + `/sigp-validate-patterns`
2. **Sé específico**: Menciona CLAUDE.md, paths.ts, permissions.ts en tus prompts
3. **Valida frecuente**: `/sigp-validate-patterns` después de cada feature
4. **Context managers**: Para refactors que toman varios días
5. **Performance**: `/nextjs-performance-audit` semanalmente

---

**Última actualización**: Diciembre 2024
**Versión**: 1.0

💡 **Tip**: Imprime esta página y tenla cerca mientras desarrollas!
