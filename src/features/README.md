# Features Directory

Esta carpeta contiene todos los módulos funcionales del sistema SIGP, organizados por dominio.

## Estructura de cada Feature

Cada feature sigue la misma estructura:

```
feature-name/
├── components/      # Componentes específicos del feature
├── hooks/          # Custom hooks del feature
├── services/       # Lógica de negocio y llamadas API
├── types/          # Tipos TypeScript específicos
└── index.ts        # Exportaciones públicas del feature
```

## Features Disponibles

### 🔐 auth
Autenticación y autorización de usuarios
- Login/Logout
- Gestión de sesiones
- Permisos y roles

### 📊 proyectos
Gestión de proyectos Scrum
- CRUD de proyectos
- Product backlog
- Sprint management
- Métricas y reportes

### 📋 actividades
Gestión de actividades Kanban
- CRUD de actividades
- Tablero Kanban
- Métricas de flujo

### 🏃 sprints
Gestión de sprints
- Planificación de sprints
- Daily meetings
- Sprint review y retrospectiva

### 📝 historias
Historias de usuario
- CRUD de historias
- Criterios de aceptación
- Estimación y priorización

### ✅ tareas
Gestión de tareas
- Tareas Scrum y Kanban
- Estados y transiciones
- Asignaciones

### 🎯 planning
Planificación estratégica (PGD)
- OEI, OGD, OEGD
- Acciones estratégicas
- Vinculación con POI

### 👥 rrhh
Recursos Humanos
- Gestión de personal
- Habilidades y competencias
- Asignaciones a proyectos

### 📈 dashboard
Dashboards y KPIs
- Vista general del sistema
- Métricas en tiempo real
- Alertas y notificaciones

### 📊 reportes
Generación de reportes
- Reportes de sprints
- Reportes de actividades
- Exportación (PDF, Excel)

## Principios de Organización

1. **Separación de Concerns**: Cada feature es autónomo
2. **Importaciones Centralizadas**: Usar `index.ts` para exportar
3. **Tipado Fuerte**: Tipos específicos en `types/`
4. **Lógica en Services**: No en componentes
5. **Hooks Reutilizables**: Custom hooks por feature

## Ejemplo de Uso

```typescript
// Importar desde un feature
import { LoginForm, useAuth } from '@/features/auth';
import { ProyectoCard, useProyectos } from '@/features/proyectos';
```
