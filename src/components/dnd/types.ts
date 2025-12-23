/**
 * Type definitions for DnD components
 * Centralized type exports for consistent usage across the application
 */

import type { DropResult, DraggableLocation } from '@hello-pangea/dnd';

// Re-export library types for convenience
export type { DropResult, DraggableLocation };

/**
 * Task state matching backend enum
 */
export type TareaEstado = 'Por hacer' | 'En progreso' | 'En revision' | 'Finalizado';

/**
 * Task priority (MoSCoW method)
 */
export type TareaPrioridad = 'Must' | 'Should' | 'Could' | 'Wont';

/**
 * Task type (methodology discriminator)
 */
export type TareaTipo = 'SCRUM' | 'KANBAN';

/**
 * Responsible person assigned to a task
 */
export interface TaskResponsible {
  id: number;
  nombre: string;
  avatar?: string;
}

/**
 * Main task interface for drag & drop
 * This is the minimal required structure for tasks to work with KanbanBoard
 */
export interface DndTask {
  id: number;
  nombre: string;
  descripcion?: string | null;
  estado: TareaEstado;
  prioridad?: TareaPrioridad | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  orden?: number | null;
  tipo: TareaTipo;

  // Display metadata
  responsables?: TaskResponsible[];
  storyPoints?: number | null;      // Scrum only
  horasEstimadas?: number | null;   // Kanban only
  subtareasCount?: number;          // Kanban only - calculated field
}

/**
 * Column configuration for Kanban board
 */
export interface KanbanColumn {
  id: TareaEstado;
  title: string;
  description?: string;
  color: string;        // Tailwind CSS classes
  limit?: number;       // WIP limit (optional)
}

/**
 * Props for KanbanBoard component
 */
export interface KanbanBoardProps {
  tasks: DndTask[];
  columns?: KanbanColumn[];
  onDragEnd: (result: DropResult, updatedTasks: DndTask[]) => void | Promise<void>;
  onTaskClick?: (task: DndTask) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Props for TaskCard component
 */
export interface TaskCardProps {
  task: DndTask;
  index: number;
  onClick?: (task: DndTask) => void;
}

/**
 * Backend API request for moving a task
 */
export interface MoverTareaRequest {
  estado: TareaEstado;
  orden: number;
}

/**
 * Backend API response wrapper
 */
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

/**
 * Helper type for task updates
 */
export type TaskUpdate = Partial<DndTask> & { id: number };

/**
 * Drag event handlers
 */
export interface DragHandlers {
  onDragStart?: (task: DndTask) => void;
  onDragEnd: (result: DropResult, updatedTasks: DndTask[]) => void | Promise<void>;
  onDragCancel?: () => void;
}

/**
 * Column statistics
 */
export interface ColumnStats {
  id: TareaEstado;
  count: number;
  limit?: number;
  isOverLimit: boolean;
  tasks: DndTask[];
}

/**
 * Board configuration
 */
export interface BoardConfig {
  columns: KanbanColumn[];
  enableWipLimits: boolean;
  allowedStates: TareaEstado[];
  defaultColumn: TareaEstado;
}

/**
 * Type guard to check if task is Scrum
 */
export function isScrumTask(task: DndTask): boolean {
  return task.tipo === 'SCRUM';
}

/**
 * Type guard to check if task is Kanban
 */
export function isKanbanTask(task: DndTask): boolean {
  return task.tipo === 'KANBAN';
}

/**
 * Type guard to check if task is overdue
 */
export function isTaskOverdue(task: DndTask): boolean {
  if (!task.fechaFin || task.estado === 'Finalizado') {
    return false;
  }
  return new Date(task.fechaFin) < new Date();
}

/**
 * Helper to get task priority color classes
 */
export function getPriorityColor(priority: TareaPrioridad | null | undefined): string {
  if (!priority) return 'bg-gray-100 text-gray-800 border-gray-300';

  const colors: Record<TareaPrioridad, string> = {
    Must: 'bg-red-100 text-red-800 border-red-300',
    Should: 'bg-orange-100 text-orange-800 border-orange-300',
    Could: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Wont: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  return colors[priority];
}

/**
 * Helper to get task priority label
 */
export function getPriorityLabel(priority: TareaPrioridad | null | undefined): string {
  if (!priority) return 'Sin prioridad';

  const labels: Record<TareaPrioridad, string> = {
    Must: 'Crítico',
    Should: 'Alto',
    Could: 'Medio',
    Wont: 'Bajo',
  };

  return labels[priority];
}

/**
 * Helper to group tasks by status
 */
export function groupTasksByStatus(tasks: DndTask[]): Record<TareaEstado, DndTask[]> {
  const groups: Record<TareaEstado, DndTask[]> = {
    'Por hacer': [],
    'En progreso': [],
    'En revision': [],
    'Finalizado': [],
  };

  tasks.forEach(task => {
    if (groups[task.estado]) {
      groups[task.estado].push(task);
    }
  });

  // Sort by orden within each group
  Object.keys(groups).forEach(estado => {
    groups[estado as TareaEstado].sort((a, b) => (a.orden || 0) - (b.orden || 0));
  });

  return groups;
}

/**
 * Helper to calculate column statistics
 */
export function calculateColumnStats(
  tasks: DndTask[],
  columns: KanbanColumn[]
): ColumnStats[] {
  const grouped = groupTasksByStatus(tasks);

  return columns.map(column => {
    const columnTasks = grouped[column.id] || [];
    return {
      id: column.id,
      count: columnTasks.length,
      limit: column.limit,
      isOverLimit: column.limit ? columnTasks.length > column.limit : false,
      tasks: columnTasks,
    };
  });
}
