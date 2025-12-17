'use client';

import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskCard, DndTask, TareaEstado } from './task-card';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

// Column configuration
export interface KanbanColumn {
  id: TareaEstado;
  title: string;
  description?: string;
  color: string;
  limit?: number; // WIP limit for Kanban
}

// Default columns (can be customized)
export const DEFAULT_COLUMNS: KanbanColumn[] = [
  {
    id: 'Por hacer',
    title: 'Por hacer',
    description: 'Tareas pendientes de iniciar',
    color: 'bg-slate-100 border-slate-300',
  },
  {
    id: 'En progreso',
    title: 'En progreso',
    description: 'Tareas actualmente en desarrollo',
    color: 'bg-blue-100 border-blue-300',
  },
  {
    id: 'En revision',
    title: 'En revisión',
    description: 'Tareas en proceso de revisión',
    color: 'bg-yellow-100 border-yellow-300',
  },
  {
    id: 'Finalizado',
    title: 'Finalizado',
    description: 'Tareas completadas',
    color: 'bg-green-100 border-green-300',
  },
];

interface KanbanBoardProps {
  tasks: DndTask[];
  columns?: KanbanColumn[];
  onDragEnd: (result: DropResult, updatedTasks: DndTask[]) => void | Promise<void>;
  onTaskClick?: (task: DndTask) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Reusable Kanban board component with drag & drop
 * Supports both Scrum and Kanban methodologies
 *
 * Usage:
 * ```tsx
 * <KanbanBoard
 *   tasks={tasks}
 *   onDragEnd={async (result, updatedTasks) => {
 *     // Update backend
 *     await updateTaskStatus(result.draggableId, result.destination.droppableId);
 *   }}
 *   onTaskClick={(task) => router.push(`/task/${task.id}`)}
 * />
 * ```
 */
export function KanbanBoard({
  tasks,
  columns = DEFAULT_COLUMNS,
  onDragEnd,
  onTaskClick,
  isLoading = false,
  className,
}: KanbanBoardProps) {
  // Group tasks by status
  const tasksByStatus = columns.reduce((acc, column) => {
    acc[column.id] = tasks
      .filter(task => task.estado === column.id)
      .sort((a, b) => (a.orden || 0) - (b.orden || 0));
    return acc;
  }, {} as Record<TareaEstado, DndTask[]>);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside any droppable
    if (!destination) return;

    // Dropped in same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceStatus = source.droppableId as TareaEstado;
    const destStatus = destination.droppableId as TareaEstado;

    // Create new tasks array with updated positions
    const sourceTasks = [...tasksByStatus[sourceStatus]];
    const destTasks = sourceStatus === destStatus
      ? sourceTasks
      : [...tasksByStatus[destStatus]];

    // Remove from source
    const [movedTask] = sourceTasks.splice(source.index, 1);

    // Add to destination with updated status and order
    const updatedTask: DndTask = {
      ...movedTask,
      estado: destStatus,
      orden: destination.index,
    };
    destTasks.splice(destination.index, 0, updatedTask);

    // Recalculate order for affected columns
    const reorderedSourceTasks = sourceTasks.map((task, index) => ({
      ...task,
      orden: index,
    }));

    const reorderedDestTasks = destTasks.map((task, index) => ({
      ...task,
      orden: index,
      estado: destStatus,
    }));

    // Merge all tasks
    const allUpdatedTasks = tasks.map(task => {
      if (task.estado === sourceStatus) {
        return reorderedSourceTasks.find(t => t.id === task.id) || task;
      }
      if (task.estado === destStatus) {
        return reorderedDestTasks.find(t => t.id === task.id) || task;
      }
      return task;
    });

    // Call parent handler
    onDragEnd(result, allUpdatedTasks);
  };

  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
        {columns.map((column) => (
          <Card key={column.id} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-5 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-20 bg-gray-100 rounded"></div>
                <div className="h-20 bg-gray-100 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
        {columns.map((column) => {
          const columnTasks = tasksByStatus[column.id] || [];
          const isOverLimit = column.limit && columnTasks.length > column.limit;

          return (
            <Card key={column.id} className={cn('flex flex-col', column.color)}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{column.title}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-sm font-normal px-2 py-0.5 rounded-full',
                      isOverLimit ? 'bg-red-500 text-white' : 'bg-white/80'
                    )}>
                      {columnTasks.length}
                      {column.limit && ` / ${column.limit}`}
                    </span>
                    {isOverLimit && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </CardTitle>
                {column.description && (
                  <p className="text-xs text-muted-foreground">{column.description}</p>
                )}
              </CardHeader>

              <CardContent className="flex-1 overflow-hidden">
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        'min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto rounded-md p-2 transition-colors',
                        snapshot.isDraggingOver && 'bg-blue-50/50 ring-2 ring-blue-300'
                      )}
                    >
                      {columnTasks.length === 0 && (
                        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground border-2 border-dashed rounded-md">
                          No hay tareas
                        </div>
                      )}
                      {columnTasks.map((task, index) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          index={index}
                          onClick={onTaskClick}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DragDropContext>
  );
}

/**
 * Hook to handle SSR issues with @hello-pangea/dnd
 * Use this in page components that need the board
 *
 * Usage:
 * ```tsx
 * 'use client';
 * import { useKanbanBoard } from '@/components/dnd';
 *
 * export default function Page() {
 *   const { KanbanBoardComponent, isReady } = useKanbanBoard();
 *
 *   if (!isReady) return <div>Loading...</div>;
 *
 *   return <KanbanBoardComponent tasks={tasks} onDragEnd={handler} />;
 * }
 * ```
 */
export function useKanbanBoard() {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    setIsReady(true);
  }, []);

  return {
    KanbanBoardComponent: KanbanBoard,
    isReady,
  };
}

// Import React for the hook
import * as React from 'react';
