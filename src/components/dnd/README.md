# Drag & Drop Components

Reusable Kanban board components for SIGP frontend using `@hello-pangea/dnd`.

## Components

### KanbanBoard

Main drag-and-drop board component that supports both Scrum and Kanban workflows.

**Features:**
- Responsive grid layout (1 col mobile, 2 cols tablet, 4 cols desktop)
- Customizable columns with WIP limits
- Task count badges
- Overdue task indicators
- Optimistic updates
- SSR-safe rendering

**Props:**
```typescript
interface KanbanBoardProps {
  tasks: DndTask[];                                    // Array of tasks to display
  columns?: KanbanColumn[];                            // Custom column config (optional)
  onDragEnd: (result: DropResult, updatedTasks: DndTask[]) => void | Promise<void>;
  onTaskClick?: (task: DndTask) => void;              // Task click handler
  isLoading?: boolean;                                 // Show loading skeleton
  className?: string;                                  // Additional CSS classes
}
```

**Default Columns:**
- Por hacer (To Do) - Gray
- En progreso (In Progress) - Blue
- En revision (In Review) - Yellow
- Finalizado (Done) - Green

### TaskCard

Draggable task card component with rich metadata display.

**Features:**
- Priority badges (Must/Should/Could/Wont)
- Due date with overdue indicators
- Story points (Scrum) or estimated hours (Kanban)
- Subtask count (Kanban only)
- Responsible avatars (up to 3 shown)
- Hover effects and drag feedback

**Props:**
```typescript
interface TaskCardProps {
  task: DndTask;                    // Task data
  index: number;                    // Position in column
  onClick?: (task: DndTask) => void; // Click handler
}
```

## Types

### DndTask

```typescript
interface DndTask {
  id: number;
  titulo: string;
  descripcion?: string | null;
  estado: 'Por hacer' | 'En progreso' | 'En revision' | 'Finalizado';
  prioridad?: 'Must' | 'Should' | 'Could' | 'Wont' | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  orden?: number | null;
  tipo: 'SCRUM' | 'KANBAN';

  // Display metadata
  responsables?: Array<{
    id: number;
    nombre: string;
    avatar?: string;
  }>;
  storyPoints?: number | null;      // Scrum only
  horasEstimadas?: number | null;   // Kanban only
  subtareasCount?: number;          // Kanban only
}
```

### KanbanColumn

```typescript
interface KanbanColumn {
  id: TareaEstado;
  title: string;
  description?: string;
  color: string;        // Tailwind classes
  limit?: number;       // WIP limit (Kanban)
}
```

## Usage

### Basic Example

```tsx
'use client';

import { useState } from 'react';
import { KanbanBoard, DndTask } from '@/components/dnd';

export default function TaskBoard() {
  const [tasks, setTasks] = useState<DndTask[]>([]);

  const handleDragEnd = async (result, updatedTasks) => {
    setTasks(updatedTasks);

    // Update backend
    await fetch(`/api/v1/tareas/${result.draggableId}/mover`, {
      method: 'PATCH',
      body: JSON.stringify({
        estado: result.destination.droppableId,
        orden: result.destination.index,
      }),
    });
  };

  return (
    <KanbanBoard
      tasks={tasks}
      onDragEnd={handleDragEnd}
    />
  );
}
```

### SSR-Safe Dynamic Import (Recommended)

```tsx
import dynamic from 'next/dynamic';

const KanbanBoard = dynamic(
  () => import('@/components/dnd').then(mod => ({ default: mod.KanbanBoard })),
  { ssr: false }
);

export default function Page() {
  return <KanbanBoard tasks={tasks} onDragEnd={handler} />;
}
```

### Custom Columns with WIP Limits

```tsx
const scrumColumns = [
  {
    id: 'Por hacer',
    title: 'Sprint Backlog',
    color: 'bg-gray-100 border-gray-300',
  },
  {
    id: 'En progreso',
    title: 'In Development',
    color: 'bg-blue-100 border-blue-300',
    limit: 3, // Max 3 tasks in progress
  },
  {
    id: 'En revision',
    title: 'Code Review',
    color: 'bg-purple-100 border-purple-300',
    limit: 2,
  },
  {
    id: 'Finalizado',
    title: 'Done',
    color: 'bg-green-100 border-green-300',
  },
];

<KanbanBoard tasks={tasks} columns={scrumColumns} onDragEnd={handler} />
```

### Full Integration with Backend

```tsx
'use client';

import { useState, useEffect } from 'react';
import { KanbanBoard, DndTask } from '@/components/dnd';
import { useToast } from '@/lib/hooks/use-toast';

export default function KanbanPage() {
  const [tasks, setTasks] = useState<DndTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch tasks
  useEffect(() => {
    async function fetchTasks() {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('http://localhost:3010/api/v1/tareas', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const result = await response.json();
        setTasks(result.data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las tareas',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchTasks();
  }, []);

  // Handle drag end with optimistic updates
  const handleDragEnd = async (result, updatedTasks) => {
    if (!result.destination) return;

    // Optimistic update
    const previousTasks = tasks;
    setTasks(updatedTasks);

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

      toast({ title: 'Tarea actualizada correctamente' });
    } catch (error) {
      // Rollback on error
      setTasks(previousTasks);
      toast({
        title: 'Error al actualizar tarea',
        variant: 'destructive',
      });
    }
  };

  const handleTaskClick = (task) => {
    router.push(`/poi/actividad/detalles?id=${task.id}`);
  };

  return (
    <KanbanBoard
      tasks={tasks}
      onDragEnd={handleDragEnd}
      onTaskClick={handleTaskClick}
      isLoading={isLoading}
    />
  );
}
```

## Backend Integration

### API Endpoint

```
PATCH /api/v1/tareas/:id/mover
```

**Request Body:**
```json
{
  "estado": "En progreso",
  "orden": 2
}
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Tarea actualizada",
  "data": {
    "id": 123,
    "titulo": "Implementar login",
    "estado": "En progreso",
    "orden": 2
  }
}
```

## Styling

Components use Tailwind CSS with the project's design system:

- **Column colors**: Customizable via `column.color` prop
- **Priority badges**: Pre-defined color scheme (Must=red, Should=orange, etc.)
- **Drag feedback**: Blue ring on dragging, blue background on drag over
- **Overdue tasks**: Red border and red date indicator
- **Responsive**: Grid adjusts from 1 col (mobile) to 4 cols (desktop)

## Accessibility

- Keyboard navigation supported via `@hello-pangea/dnd`
- ARIA attributes automatically handled
- Focus indicators on drag
- Screen reader announcements for drag events

## Performance

- Virtualization not needed for typical task counts (<100 per column)
- Optimistic updates for instant UI feedback
- Memoization in parent components recommended for large datasets
- SSR disabled to avoid hydration issues

## Common Issues

### SSR Hydration Error

**Problem:** `window is not defined` or hydration mismatch

**Solution:** Use dynamic import with `ssr: false`

```tsx
const KanbanBoard = dynamic(() => import('@/components/dnd'), { ssr: false });
```

### Tasks Not Updating

**Problem:** Drag works but backend not updating

**Solution:** Ensure `onDragEnd` handler calls backend API and updates state

```tsx
const handleDragEnd = async (result, updatedTasks) => {
  setTasks(updatedTasks); // Update local state
  await updateBackend(result); // Update backend
};
```

### WIP Limit Not Working

**Problem:** Tasks can exceed `limit` in column config

**Solution:** WIP limits are visual warnings only. Enforce server-side or add validation in `onDragEnd`:

```tsx
const handleDragEnd = (result, updatedTasks) => {
  const destColumn = columns.find(c => c.id === result.destination.droppableId);
  const tasksInDest = updatedTasks.filter(t => t.estado === destColumn.id);

  if (destColumn.limit && tasksInDest.length > destColumn.limit) {
    toast({ title: 'WIP limit exceeded', variant: 'destructive' });
    return; // Don't update
  }

  setTasks(updatedTasks);
};
```

## Testing

Example unit test structure:

```tsx
import { render, screen } from '@testing-library/react';
import { KanbanBoard } from './kanban-board';

describe('KanbanBoard', () => {
  it('renders all columns', () => {
    render(<KanbanBoard tasks={[]} onDragEnd={jest.fn()} />);
    expect(screen.getByText('Por hacer')).toBeInTheDocument();
    expect(screen.getByText('En progreso')).toBeInTheDocument();
  });

  it('displays task count', () => {
    const tasks = [{ id: 1, estado: 'Por hacer', ... }];
    render(<KanbanBoard tasks={tasks} onDragEnd={jest.fn()} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
```

## Future Enhancements

- [ ] Swimlanes (group by assignee/priority)
- [ ] Virtual scrolling for 100+ tasks
- [ ] Drag between boards
- [ ] Inline task editing
- [ ] Filtering and search
- [ ] Batch operations
- [ ] Undo/redo
- [ ] Real-time collaboration via WebSockets

## Dependencies

- `@hello-pangea/dnd@^18.0.1` - Drag and drop library
- `lucide-react` - Icons
- `tailwindcss` - Styling
- `@radix-ui/*` via shadcn/ui - Base components

## References

- [@hello-pangea/dnd docs](https://github.com/hello-pangea/dnd)
- [SIGP Architecture](../../../docs/specs/03_ARQUITECTURA_SISTEMA.md)
- [API Reference](../../../docs/api/API_REFERENCE.md)
