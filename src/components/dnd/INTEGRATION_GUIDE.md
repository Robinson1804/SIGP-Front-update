# DnD Components Integration Guide

## Installation Complete

### Installed Package
```bash
npm install @hello-pangea/dnd@18.0.1
```

### Created Files

1. **src/components/dnd/task-card.tsx** - Draggable task card component
2. **src/components/dnd/kanban-board.tsx** - Main Kanban board with drag & drop
3. **src/components/dnd/index.ts** - Barrel exports
4. **src/components/dnd/example-usage.tsx** - Usage examples (reference only)
5. **src/components/dnd/README.md** - Complete documentation

## Quick Start

### 1. Import Components

```tsx
import { KanbanBoard, DndTask } from '@/components/dnd';
```

### 2. Basic Implementation (Scrum Sprint Board)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { KanbanBoard, DndTask } from '@/components/dnd';
import type { DropResult } from '@hello-pangea/dnd';

export default function SprintBoardPage() {
  const [tasks, setTasks] = useState<DndTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch sprint tasks
    async function loadTasks() {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        'http://localhost:3010/api/v1/tareas?tipo=SCRUM&sprintId=1',
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const result = await response.json();
      setTasks(result.data);
      setIsLoading(false);
    }
    loadTasks();
  }, []);

  const handleDragEnd = async (result: DropResult, updatedTasks: DndTask[]) => {
    if (!result.destination) return;

    // Optimistic update
    setTasks(updatedTasks);

    // Update backend
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(
        `http://localhost:3010/api/v1/tareas/${result.draggableId}/mover`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            estado: result.destination.droppableId,
            orden: result.destination.index,
          }),
        }
      );
    } catch (error) {
      console.error('Failed to update task:', error);
      // Consider adding rollback logic here
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Sprint Board</h1>
      <KanbanBoard
        tasks={tasks}
        onDragEnd={handleDragEnd}
        isLoading={isLoading}
      />
    </div>
  );
}
```

### 3. Kanban Activity Board with WIP Limits

```tsx
const kanbanColumns = [
  {
    id: 'Por hacer' as const,
    title: 'Backlog',
    color: 'bg-slate-100 border-slate-300',
  },
  {
    id: 'En progreso' as const,
    title: 'En Desarrollo',
    color: 'bg-blue-100 border-blue-300',
    limit: 3, // WIP limit
  },
  {
    id: 'En revision' as const,
    title: 'Revisión',
    color: 'bg-yellow-100 border-yellow-300',
    limit: 2,
  },
  {
    id: 'Finalizado' as const,
    title: 'Completado',
    color: 'bg-green-100 border-green-300',
  },
];

<KanbanBoard
  tasks={tasks}
  columns={kanbanColumns}
  onDragEnd={handleDragEnd}
/>
```

## Integration Points

### Where to Use

1. **Sprint Board** - `src/app/poi/proyecto/backlog/tablero/page.tsx`
   - Replace current static board with KanbanBoard
   - Filter tasks by current sprint
   - tipo: 'SCRUM'

2. **Activity Kanban** - `src/app/poi/actividad/tablero/page.tsx`
   - Use for Kanban activities
   - tipo: 'KANBAN'
   - Enable subtasks display

3. **Project Backlog** - `src/app/poi/proyecto/backlog/page.tsx`
   - Optional: Use for product backlog management
   - Group by epic or priority

### Backend API Integration

The components expect this API endpoint:

```
PATCH http://localhost:3010/api/v1/tareas/:id/mover
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "estado": "En progreso",  // New status
  "orden": 2                // New position in column
}

Response:
{
  "statusCode": 200,
  "message": "Tarea actualizada correctamente",
  "data": {
    "id": 123,
    "titulo": "...",
    "estado": "En progreso",
    "orden": 2,
    ...
  }
}
```

**Backend Implementation Needed:**
1. Create `PATCH /tareas/:id/mover` endpoint
2. Update `estado` and `orden` fields
3. Reorder other tasks in source/destination columns if needed
4. Return updated task

### Data Mapping

Convert backend `Tarea` entity to `DndTask` format:

```tsx
function mapTareaToDndTask(tarea: any): DndTask {
  return {
    id: tarea.id,
    titulo: tarea.titulo,
    descripcion: tarea.descripcion,
    estado: tarea.estado, // Must be one of: 'Por hacer' | 'En progreso' | 'En revision' | 'Finalizado'
    prioridad: tarea.prioridad, // 'Must' | 'Should' | 'Could' | 'Wont'
    fechaInicio: tarea.fechaInicio,
    fechaFin: tarea.fechaFin,
    orden: tarea.orden,
    tipo: tarea.tipo, // 'SCRUM' | 'KANBAN'
    responsables: tarea.responsables?.map(r => ({
      id: r.id,
      nombre: r.nombre,
      avatar: r.avatar || undefined,
    })),
    storyPoints: tarea.storyPoints,
    horasEstimadas: tarea.horasEstimadas,
    subtareasCount: tarea.subtareas?.length || 0,
  };
}
```

## SSR Handling

**Option 1: Dynamic Import (Recommended)**
```tsx
import dynamic from 'next/dynamic';

const KanbanBoard = dynamic(
  () => import('@/components/dnd').then(mod => ({ default: mod.KanbanBoard })),
  { ssr: false }
);
```

**Option 2: Client-Only Mounting**
```tsx
'use client';

const [isMounted, setIsMounted] = useState(false);

useEffect(() => {
  setIsMounted(true);
}, []);

if (!isMounted) return <LoadingSkeleton />;

return <KanbanBoard ... />;
```

## Testing Checklist

- [ ] Tasks load from backend
- [ ] Drag task between columns
- [ ] Task updates in database
- [ ] Optimistic updates work
- [ ] Error handling shows feedback
- [ ] WIP limits display correctly
- [ ] Overdue tasks show red indicator
- [ ] Responsibles display with avatars
- [ ] Story points show for Scrum tasks
- [ ] Subtasks count shows for Kanban tasks
- [ ] Task click navigation works
- [ ] Mobile responsive layout
- [ ] No SSR hydration errors

## Performance Optimization

For large task lists (100+ tasks):

```tsx
import { memo } from 'react';

const MemoizedTaskCard = memo(TaskCard);

// In KanbanBoard render:
{columnTasks.map((task, index) => (
  <MemoizedTaskCard key={task.id} task={task} index={index} />
))}
```

## Common Patterns

### Filter by Sprint

```tsx
const sprintTasks = allTasks.filter(t => t.sprintId === currentSprintId);
<KanbanBoard tasks={sprintTasks} ... />
```

### Filter by User (My Tasks)

```tsx
const myTasks = tasks.filter(t =>
  t.responsables?.some(r => r.id === currentUserId)
);
```

### Group by Priority

```tsx
const highPriorityTasks = tasks.filter(t => t.prioridad === 'Must');
const normalTasks = tasks.filter(t => t.prioridad !== 'Must');
```

## Next Steps

1. **Integrate in Sprint Board**
   - Edit `src/app/poi/proyecto/backlog/tablero/page.tsx`
   - Replace current implementation with KanbanBoard
   - Add backend API endpoint

2. **Integrate in Activity Board**
   - Edit `src/app/poi/actividad/tablero/page.tsx`
   - Configure Kanban columns with WIP limits
   - Add subtask support

3. **Add Task Detail Modal**
   - Create `TaskDetailModal` component
   - Trigger on `onTaskClick` callback
   - Show full task info, comments, attachments

4. **Add Real-time Updates** (Future)
   - Integrate WebSocket events
   - Update board when other users move tasks
   - Show active users on the board

## Troubleshooting

### Tasks don't update after drag

**Check:**
- Network tab shows PATCH request
- Backend returns 200 status
- `onDragEnd` handler updates state
- Token is valid in Authorization header

### Columns show wrong count

**Check:**
- Task `estado` matches column `id` exactly
- No typos in state values ('En progreso' not 'En Progreso')

### SSR errors

**Solution:**
- Use dynamic import with `ssr: false`
- Or use `useKanbanBoard` hook
- Never access `window` in component body

## Resources

- [Component README](./README.md) - Full API documentation
- [Example Usage](./example-usage.tsx) - Code examples
- [Backend API Docs](http://localhost:3010/api/docs) - Swagger UI
- [@hello-pangea/dnd](https://github.com/hello-pangea/dnd) - Library docs

## Support

For issues or questions:
1. Check [README.md](./README.md) for common solutions
2. Review [example-usage.tsx](./example-usage.tsx) for patterns
3. Verify backend API is running on `localhost:3010`
4. Check browser console for errors
