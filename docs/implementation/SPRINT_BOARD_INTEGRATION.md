# Sprint Board Integration - Complete

## Summary

Successfully integrated the Sprint Board (Tablero) page with real API backend and drag & drop functionality using the KanbanBoard DnD component.

## Files Modified

### Primary File
- **E:\Sistema de Gestion de Proyectos\sigp-frontend\src\app\(dashboard)\poi\proyecto\backlog\tablero\page.tsx**
  - Complete rewrite from mock data to real API integration
  - Integrated with `@hello-pangea/dnd` via dynamic import (SSR disabled)
  - Connected to Sprint and Task services

## Key Features Implemented

### 1. Sprint Selection
- Dropdown selector to choose from available sprints
- Auto-selects active sprint on load
- Displays sprint status badge (Planificado/Activo/Completado)
- Shows task count for selected sprint

### 2. Drag & Drop Functionality
- Full kanban board with 4 columns:
  - Por hacer
  - En progreso
  - En revision
  - Finalizado
- Real-time task movement between columns
- Optimistic UI updates
- Automatic rollback on API error
- Order preservation within columns

### 3. API Integration
```typescript
// Services used:
- getSprintsByProyecto(proyectoId) - Fetch all sprints for a project
- getSprintTablero(sprintId) - Fetch board data with tasks grouped by status
- moverTarea(tareaId, estado, orden) - Move task to new column/position
- cerrarSprint(sprintId) - Close active sprint
```

### 4. State Management
- Project ID from URL search params: `?proyectoId=123`
- Fallback to localStorage for project data
- Loading states for board and sprint operations
- Error handling with toast notifications

### 5. Role-Based Features
- **Scrum Master**: Can close sprints, full DnD access
- **Developer**: Read-only view, can view tasks
- **Others**: Based on permission matrix

### 6. User Experience
- Loading skeleton while board loads
- Empty state when no sprints exist
- Helpful error messages
- Confirmation dialog before closing sprint
- Redirect to backlog after closing sprint

## Data Flow

```
1. Page loads → Get proyectoId from URL
2. Fetch sprints for project → Auto-select active sprint
3. Fetch sprint board data → Map to DndTask format
4. User drags task → Optimistic update in state
5. Call moverTarea API → Success: toast notification
                       → Error: rollback state + refetch
```

## Type Mapping

Backend `SprintTarea` → Frontend `DndTask`:

```typescript
function mapTareaToDndTask(tarea: SprintTarea): DndTask {
  return {
    id: tarea.id,
    titulo: tarea.titulo,
    estado: tarea.estado,
    prioridad: tarea.prioridad,
    tipo: 'SCRUM',
    storyPoints: tarea.puntos,
    responsables: [tarea.responsable],
  };
}
```

## Components Used

### From `@/components/dnd`
- **KanbanBoard**: Main board component with drag & drop
- **TaskCard**: Individual task cards (rendered internally by KanbanBoard)
- **Types**: DndTask, TareaEstado, DropResult

### From `@/features/proyectos/services`
- **sprints.service.ts**: Sprint CRUD and board operations
- **tareas.service.ts**: Task movement operations

### UI Components
- AppLayout (breadcrumbs, secondary header)
- Button, Badge, Label, Select
- Card (for loading skeleton)
- Toast (notifications)

## Error Handling

1. **Sprint loading fails**: Toast error + empty state
2. **Board loading fails**: Toast error + empty board
3. **Task move fails**: Toast error + automatic rollback via refetch
4. **Close sprint fails**: Toast error + keep current state

## Edge Cases Handled

- No sprints exist → Show empty state with link to Backlog
- No proyecto ID in URL → Redirect to POI home
- Sprint is completed → Hide "Cerrar Sprint" button
- Only Scrum Master can close sprints
- Network errors during drag → Rollback to correct state

## Testing Checklist

- [ ] Page loads with valid proyectoId in URL
- [ ] Sprints dropdown populates correctly
- [ ] Active sprint is auto-selected
- [ ] Board displays tasks in correct columns
- [ ] Drag task between columns updates backend
- [ ] Drag within same column updates order
- [ ] Error during drag shows toast and rollbacks
- [ ] Close sprint button only visible for Scrum Master
- [ ] Close sprint confirmation dialog works
- [ ] Redirect to backlog after closing sprint
- [ ] Empty state shows when no sprints exist
- [ ] Loading skeleton displays while fetching

## API Endpoints Used

```
GET /api/v1/proyectos/{proyectoId}/sprints
GET /api/v1/sprints/{sprintId}/tablero
PATCH /api/v1/tareas/{tareaId}/mover
PATCH /api/v1/sprints/{sprintId}/complete
```

## Performance Optimizations

1. **Dynamic import**: KanbanBoard loaded client-side only (no SSR)
2. **Optimistic updates**: UI updates immediately before API call
3. **Memoization**: React components properly memoized in DnD library
4. **Suspense boundary**: Lazy loading with fallback

## Known Limitations

1. Task click handler is TODO (currently console.log)
2. No real-time updates (WebSocket not implemented yet)
3. No task creation from board (done in Backlog view)
4. No custom columns (4 fixed columns only)

## Future Enhancements

- [ ] Task details modal on click
- [ ] Inline task creation from board
- [ ] Task filtering by epic/responsible
- [ ] WebSocket updates for collaborative editing
- [ ] Keyboard shortcuts for task navigation
- [ ] Bulk task operations
- [ ] Custom column configuration
- [ ] WIP limits per column

## Files Reference

### Services
- `src/features/proyectos/services/sprints.service.ts`
- `src/features/proyectos/services/tareas.service.ts`

### DnD Components
- `src/components/dnd/kanban-board.tsx`
- `src/components/dnd/task-card.tsx`
- `src/components/dnd/types.ts`
- `src/components/dnd/index.ts`

### API Client
- `src/lib/api/client.ts`
- `src/lib/api/endpoints.ts`

### Utilities
- `src/lib/hooks/use-toast.ts`
- `src/lib/paths.ts`
- `src/lib/definitions.ts`

## Usage Example

```typescript
// Navigate to sprint board with project context
router.push(`${paths.poi.proyecto.backlog.tablero}?proyectoId=123`);

// Or from project details page
const handleViewBoard = () => {
  router.push(`${paths.poi.proyecto.backlog.tablero}?proyectoId=${project.id}`);
};
```

## Architecture Notes

- **Client Component**: Marked with 'use client' for hooks/state
- **Suspense Wrapper**: Handles async loading states
- **Protected Route**: Wrapped with PermissionGate for POI module
- **Dynamic Import**: KanbanBoard loaded with ssr: false to avoid hydration issues
- **Search Params**: Uses Next.js 14 App Router useSearchParams hook

## Integration Status

- [x] Sprint selection dropdown
- [x] Board data loading from API
- [x] Drag & drop task movement
- [x] Optimistic UI updates
- [x] Error handling and rollback
- [x] Close sprint functionality
- [x] Loading states
- [x] Empty states
- [x] Toast notifications
- [x] Role-based permissions
- [x] Responsive design (via KanbanBoard component)

## Next Steps for Backlog Page

The Product Backlog page (`src/app/(dashboard)/poi/proyecto/backlog/page.tsx`) needs similar integration:

1. Fetch backlog user stories via `getBacklog(proyectoId)`
2. Display stories not assigned to any sprint
3. Add drag-to-sprint functionality
4. Sprint planning features
5. Story creation/editing

Refer to this Sprint Board implementation as a template for the Backlog page integration.
