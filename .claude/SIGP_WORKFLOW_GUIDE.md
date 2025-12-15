# Guía de Flujo de Trabajo Claude Code para SIGP Frontend

Esta guía detalla cómo usar los agentes, comandos y MCP servers configurados para desarrollar eficientemente el proyecto SIGP.

---

## 🎯 Estrategia de Uso por Fase del Proyecto

### FASE 1: ANÁLISIS Y PLANIFICACIÓN

#### Usar: `Explore Agent` (Task tool)
**Cuándo**: Al comenzar a trabajar en un nuevo módulo o feature
```
Necesito implementar el módulo de Proyectos POI
↓
Task tool → Explore agent → "very thorough"
- Encuentra todos los archivos relacionados con POI
- Identifica patrones existentes de componentes
- Analiza la estructura de permisos
```

#### Usar: `nextjs-architecture-expert` Agent
**Cuándo**: Decidir arquitectura de un módulo nuevo
```bash
Ejemplo:
"Necesito diseñar la arquitectura del módulo de Backlog para proyectos Scrum.
Debe mostrar historias de usuario con drag & drop, filtros por prioridad,
y actualizaciones en tiempo real cuando otros usuarios muevan items."
```
**Salida esperada**:
- Estructura de carpetas recomendada
- Server Components vs Client Components
- Estrategia de fetching (Server Components + mutations)
- Estado compartido (Context vs URL state)

#### Usar: MCP Server `context7`
**Cuándo**: Necesitas mantener contexto entre sesiones
```
Escenario: Trabajando en refactorización del sistema de permisos
1. Sesión 1: Analizas src/lib/permissions.ts
2. context7 guarda el contexto
3. Sesión 2: Retomas y context7 recupera lo que estabas haciendo
```

---

## 📦 FASE 2: GENERACIÓN DE COMPONENTES

### Comando: `/nextjs-component-generator`

#### Caso de Uso 1: Componente de Proyecto Card
```bash
/nextjs-component-generator ProyectoCard --client

# Genera automáticamente:
# - components/ProyectoCard/ProyectoCard.tsx
# - components/ProyectoCard/types.ts
# - components/ProyectoCard/ProyectoCard.test.tsx
# - components/ProyectoCard/index.ts
```

**Adaptación para SIGP**:
Después de generar, adapta:
1. Añadir imports de `paths` y `permissions`
2. Integrar `PermissionGate` para botones de acción
3. Usar tipos de `src/lib/definitions.ts`
4. Aplicar Tailwind según `globals.css`

#### Caso de Uso 2: Página de Lista de Proyectos
```bash
/nextjs-component-generator ProyectosList --server --page

# Genera Server Component con:
# - Data fetching integrado
# - Metadata para SEO
# - Streaming con Suspense
```

**Adaptación para SIGP**:
```typescript
// Después de generar, modifica para integrar con backend:
import { getProyectos } from '@/lib/actions';
import { PermissionGate } from '@/components/auth/permission-gate';

export default async function ProyectosPage() {
  const proyectos = await getProyectos(); // Server Action

  return (
    <PermissionGate module={MODULES.POI} permission={PERMISSIONS.VIEW}>
      <ProyectosList data={proyectos} />
    </PermissionGate>
  );
}
```

### Agente: `frontend-developer`

**Cuándo usar**: Necesitas componentes complejos con interactividad

**Ejemplo - Tablero Kanban**:
```
Prompt al agente frontend-developer:

"Crea un componente KanbanBoard que:
- Muestra tareas en columnas (Por hacer, En progreso, En revisión, Finalizado)
- Permite drag & drop de tareas entre columnas
- Actualiza el backend via Server Action cuando se mueve una tarea
- Muestra el estado de validación (tareas Scrum requieren validación de SM)
- Es responsive (stack vertical en móvil)
- Tiene loading states optimistas

Usa @dnd-kit para drag & drop (ya instalado en package.json).
La estructura de Tarea viene de src/lib/definitions.ts.
La acción de mover debe llamar a updateTareaEstado en src/lib/actions.ts"
```

**Salida esperada**:
- Componente completo con TypeScript
- Integración con @dnd-kit
- Optimistic updates con useOptimistic (React 19)
- Manejo de errores y loading states
- Test básico

---

## 🗄️ FASE 3: INTEGRACIÓN CON BACKEND

### MCP Server: `postgresql`

**Configuración requerida**:
```json
// .mcp.json - actualiza con tus credenciales del backend
{
  "postgresql": {
    "env": {
      "POSTGRES_CONNECTION_STRING": "postgresql://sigp_user:sigp_pass@localhost:5432/sigp_db"
    }
  }
}
```

**Uso**:
```
Pregunta a Claude:
"Usando el MCP postgresql, muéstrame la estructura de la tabla agile.tareas
y genera los tipos TypeScript correspondientes para src/lib/definitions.ts"
```

**Flujo automático**:
1. Claude consulta la BD via MCP
2. Lee esquema de la tabla
3. Genera tipos TypeScript exactos
4. Valida contra documentación en docs/specs/04_ARQUITECTURA_BD.md

### Comando: `/nextjs-api-tester`

**Caso de Uso**: Probar endpoints del backend antes de integrar
```bash
/nextjs-api-tester

# Testear:
# - POST http://localhost:3010/api/v1/auth/login
# - GET http://localhost:3010/api/v1/proyectos
# - POST http://localhost:3010/api/v1/sprints
```

**Automatiza**:
- Verifica formato de respuesta
- Valida tokens JWT
- Comprueba enums y estados
- Genera funciones helper para src/lib/actions.ts

### Agente: `fullstack-developer`

**Cuándo usar**: Necesitas implementar flujo completo (frontend + backend integration)

**Ejemplo - Sistema de Aprobación de Actas**:
```
Prompt:

"Implementa el flujo completo de aprobación de Acta de Constitución:

BACKEND (para referencia - ya existe):
- POST /api/v1/actas/constitucion - Crear acta
- PATCH /api/v1/actas/:id/aprobar - Aprobar (requiere rol PATROCINADOR)
- GET /api/v1/actas/:id/historial - Ver historial de aprobaciones

FRONTEND (implementar):
1. Formulario de creación (src/app/poi/proyecto/actas/nueva/page.tsx)
2. Vista de detalles con botón aprobar (src/app/poi/proyecto/actas/[id]/page.tsx)
3. Server Actions en src/lib/actions.ts
4. Permisos: solo SCRUM_MASTER crea, solo PATROCINADOR aprueba

Workflow:
SM crea → Coordinador revisa → Patrocinador aprueba"
```

**Salida esperada**:
- Formulario con React Hook Form + Zod
- Server Actions con manejo de errores
- PermissionGate integrado
- Notificaciones toast (shadcn/ui)
- Redirección después de submit

---

## 🎨 FASE 4: UI/UX Y DISEÑO

### Agente: `ui-ux-designer`

**Caso de Uso 1: Diseño del Dashboard POI**
```
Prompt:

"Diseña el dashboard principal del módulo POI que muestra:
- KPIs: total proyectos, proyectos activos, sprints en curso, tareas pendientes
- Gráfico de burndown del sprint actual
- Lista de próximas actividades (tabla)
- Timeline de proyectos (diagrama Gantt simplificado)

Consideraciones:
- Usuarios: PMO, Coordinador, Scrum Master (permisos diferentes)
- Debe ser responsive (desktop + tablet)
- Usar shadcn/ui components ya instalados
- Paleta de colores en src/app/globals.css
- Exportar a PDF (botón en header)"
```

**Salida esperada**:
- Wireframe en ASCII art o descripción detallada
- Estructura de componentes
- Responsive breakpoints
- Variantes por rol (PMO ve todo, SM solo sus proyectos)

### Agente: `frontend-developer` + Comando `/nextjs-component-generator`

**Flujo combinado** para implementar el diseño:
```bash
# 1. Genera componentes base
/nextjs-component-generator DashboardKPIs --client
/nextjs-component-generator BurndownChart --client
/nextjs-component-generator ProximasActividades --server

# 2. Usa frontend-developer para refinar
"Toma los componentes generados y:
- Integra recharts para BurndownChart
- Añade filtros por fecha en ProximasActividades
- Implementa skeleton loading states
- Añade animaciones sutiles con Tailwind"
```

---

## 🧪 FASE 5: TESTING Y OPTIMIZACIÓN

### Comando: `/nextjs-performance-audit`

**Uso recomendado**: Ejecutar semanalmente o antes de merge a main
```bash
/nextjs-performance-audit --all

# Genera reporte completo:
# - Lighthouse scores
# - Bundle analysis
# - Core Web Vitals
# - Recomendaciones específicas
```

**Para SIGP específicamente**, el audit detectará:
- Componentes pesados (POI modal, Tablero Kanban)
- Imágenes sin optimizar (avatares de usuarios)
- JavaScript bundles grandes (shadcn/ui, react-hook-form, zod)

**Acción inmediata**:
```typescript
// Resultado del audit: "POIModal es muy grande (250KB)"

// Optimizar con dynamic import:
import dynamic from 'next/dynamic';

const POIModal = dynamic(() => import('@/components/poi/poi-modal'), {
  loading: () => <ModalSkeleton />,
  ssr: false // No se necesita en server
});
```

### Agente: `test-engineer`

**Caso de Uso**: Testing del sistema de permisos
```
Prompt:

"Crea suite de tests para el sistema de permisos (src/lib/permissions.ts):

Tests unitarios:
- canAccessModule() con todos los roles
- hasPermission() para casos edge
- getDefaultRouteForRole() para cada rol
- canAccessRoute() con rutas válidas e inválidas

Tests de integración:
- PermissionGate renderiza/oculta según rol
- ProtectedRoute redirige correctamente
- Middleware bloquea rutas no autorizadas

Casos especiales SIGP:
- ADMINISTRADOR solo ve RRHH
- SCRUM_MASTER puede editar POI pero no crear
- DESARROLLADOR solo actualiza sus tareas"
```

**Salida esperada**:
- Tests en Vitest (o Jest si prefieres)
- Mocks de usuario con diferentes roles
- Tests de integración con React Testing Library
- Coverage report

### Agente: `code-reviewer`

**Uso**: Antes de commit importante
```
Prompt:

"Revisa el código del módulo de Backlog que acabo de implementar:

Archivos:
- src/app/poi/proyecto/backlog/page.tsx
- src/app/poi/proyecto/backlog/tablero/page.tsx
- src/components/poi/backlog-list.tsx
- src/lib/actions.ts (funciones relacionadas con backlog)

Enfócate en:
- Seguridad: validación de permisos, sanitización de inputs
- Performance: tamaño de componentes, memoization apropiada
- TypeScript: tipos correctos, no any
- Accesibilidad: ARIA labels, keyboard navigation
- Consistencia con patrones del proyecto (ver CLAUDE.md)"
```

**Salida esperada**:
- Issues de seguridad (ej: falta validación de rol)
- Optimizaciones de performance (ej: usar useCallback)
- Sugerencias de accesibilidad
- Código refactorizado si es necesario

---

## 🔄 FASE 6: REFACTORING Y MANTENIMIENTO

### MCP Server: `DeepGraph Next.js`

**Uso**: Analizar dependencias y arquitectura
```
Pregunta a Claude:

"Usando DeepGraph Next.js MCP, analiza las dependencias del módulo POI
y muestra qué componentes dependen de src/lib/permissions.ts"
```

**Utilidad para refactoring**:
- Antes de cambiar permissions.ts, ves impacto
- Detecta dependencias circulares
- Identifica código muerto

### Agente: `context-manager`

**Caso de Uso**: Refactoring grande que toma múltiples sesiones
```
Prompt inicial:

"Voy a refactorizar el sistema de autenticación de Context API a Zustand.
Usa context-manager para trackear el progreso en múltiples sesiones:

Sesión 1: Análisis de auth-context.tsx actual
Sesión 2: Diseño de nuevo store con Zustand
Sesión 3: Migración gradual (pages por páginas)
Sesión 4: Testing y validación
Sesión 5: Cleanup del código antiguo

Guarda contexto de decisiones tomadas y bloqueadores encontrados."
```

### Comando: `/nextjs-migration-helper`

**Uso**: Si decides migrar alguna parte a nuevas funcionalidades de Next.js
```bash
# Ejemplo: Migrar de getServerSideProps a Server Components
/nextjs-migration-helper src/app/dashboard/page.tsx

# O migrar a Parallel Routes para mejor UX
/nextjs-migration-helper src/app/poi --parallel-routes
```

---

## 📋 WORKFLOWS RECOMENDADOS POR ESCENARIO

### Escenario 1: "Necesito implementar un módulo completo desde cero"

```
1. Explore Agent → Analiza módulos similares existentes
   "Explora el módulo PGD y muéstrame patrones de componentes,
    servicios y permisos que puedo replicar para el módulo POI"

2. nextjs-architecture-expert Agent → Diseña arquitectura
   "Diseña la arquitectura del módulo POI con Server/Client Components"

3. postgresql MCP → Genera tipos desde BD
   "Lee el schema poi.proyectos y genera tipos TypeScript"

4. /nextjs-component-generator → Genera componentes base
   "/nextjs-component-generator ProyectoCard --client"

5. fullstack-developer Agent → Implementa lógica de negocio
   "Implementa CRUD completo de proyectos con Server Actions"

6. frontend-developer Agent → Refina UI
   "Mejora ProyectoCard con estados de carga y animaciones"

7. code-reviewer Agent → Revisa antes de commit
   "Revisa el módulo POI completo enfocándote en seguridad y performance"
```

### Escenario 2: "Hay un bug en producción que debo solucionar rápido"

```
1. Explore Agent → Encuentra archivos relacionados
   "Encuentra todos los archivos que manejan autenticación de usuarios"

2. DeepGraph Next.js MCP → Analiza dependencias
   "Muestra qué componentes usan auth-context.tsx"

3. Bash tool → Reproduce el bug localmente
   !npm run dev
   !curl -X POST http://localhost:3000/api/auth/login

4. nextjs-api-tester → Valida backend
   "/nextjs-api-tester POST /auth/login"

5. Fix el bug directamente

6. test-engineer Agent → Crea test de regresión
   "Crea un test que valide que este bug no vuelva a ocurrir"
```

### Escenario 3: "Optimizar performance de la app"

```
1. /nextjs-performance-audit --all
   # Genera reporte completo

2. Analiza resultados y prioriza fixes

3. frontend-developer Agent → Implementa optimizaciones
   "Optimiza el componente POIModal usando dynamic imports
    y code splitting según el reporte de performance"

4. /nextjs-performance-audit --lighthouse
   # Valida mejora

5. Repite hasta alcanzar scores deseados
```

---

## 🎯 MEJORES PRÁCTICAS ESPECÍFICAS PARA SIGP

### 1. Siempre Valida Permisos
```typescript
// Antes de generar componente, pregunta a frontend-developer:
"Genera ProyectoEditForm que SOLO sea visible para roles PMO y COORDINADOR
usando PermissionGate de src/components/auth/permission-gate.tsx"
```

### 2. Usa Tipos del Proyecto
```typescript
// Instruye a agentes:
"Usa los tipos de src/lib/definitions.ts, NO crees nuevos.
Los enums de roles están en ROLES, los módulos en MODULES,
y los permisos en PERMISSIONS"
```

### 3. Rutas Centralizadas
```typescript
// Siempre recuerda a agentes:
"Usa rutas de src/lib/paths.ts, NUNCA hardcodees strings de rutas"
```

### 4. Server Actions para Mutaciones
```typescript
// Patrón a seguir:
"Crea Server Actions en src/lib/actions.ts para todas las mutaciones.
NO uses fetch directo en Client Components"
```

### 5. Dual System Scrum/Kanban
```typescript
// Crucial para agentes:
"Ten en cuenta que:
- Proyectos usan SCRUM (sprints, HUs, NO subtareas)
- Actividades usan KANBAN (flujo continuo, SÍ subtareas)
La entidad Tarea tiene campo 'tipo' discriminador"
```

---

## 🚀 ATAJOS Y COMANDOS RÁPIDOS

### Generar CRUD completo
```bash
# Comando personalizado a crear:
/sigp-crud-generator Proyecto

# Genera:
# - Lista (Server Component)
# - Detalles (Server Component)
# - Formulario Create (Client Component)
# - Formulario Edit (Client Component)
# - Server Actions (actions.ts)
# - Tipos (definitions.ts)
# - Tests básicos
```

### Validar integración backend
```bash
/nextjs-api-tester --validate-types

# Compara:
# - Tipos de src/lib/definitions.ts
# - vs Respuestas del backend
# - vs Swagger en localhost:3010/api/docs
# Reporta inconsistencias
```

### Generar documentación
```bash
# Usa code-reviewer:
"Genera documentación JSDoc para todos los componentes
del módulo POI siguiendo el estándar del proyecto"
```

---

## 📊 MÉTRICAS DE ÉXITO

Monitorea que el uso de agentes/comandos resulte en:

✅ **Consistencia**: Código sigue patrones del proyecto (paths, permissions, types)
✅ **Velocidad**: Features completas en 50% menos tiempo
✅ **Calidad**: Code reviews pasan en primer intento
✅ **Performance**: Lighthouse scores > 90
✅ **Tests**: Coverage > 80%
✅ **Seguridad**: 0 vulnerabilidades de permisos

---

## 🆘 TROUBLESHOOTING

### "El agente no respeta los patrones del proyecto"
**Solución**: Incluye contexto explícito
```
"Lee CLAUDE.md antes de empezar. Sigue los patrones de:
- paths.ts para rutas
- permissions.ts para permisos
- definitions.ts para tipos"
```

### "El código generado no compila"
**Solución**: Pide al agente que lea dependencias
```
"Lee package.json y tsconfig.json para saber qué librerías
están disponibles y la configuración de TypeScript"
```

### "Los tipos no coinciden con el backend"
**Solución**: Usa postgresql MCP
```
"Usa el MCP postgresql para leer el schema real de la BD
y genera tipos exactos, no asumas la estructura"
```

---

**Última actualización**: Diciembre 2024
**Versión SIGP**: 1.0
