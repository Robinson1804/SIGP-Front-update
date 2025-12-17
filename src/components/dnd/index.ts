/**
 * Drag & Drop Components
 *
 * Reusable Kanban board components using @hello-pangea/dnd
 * Supports both Scrum and Kanban methodologies
 */

// Components
export { KanbanBoard, DEFAULT_COLUMNS, useKanbanBoard } from './kanban-board';
export { TaskCard } from './task-card';

// Types (from individual files for backward compatibility)
export type { KanbanColumn } from './kanban-board';
export type { DndTask, TareaEstado, TareaPrioridad } from './task-card';

// All types and helpers (from types.ts)
export type {
  TareaTipo,
  TaskResponsible,
  KanbanBoardProps,
  TaskCardProps,
  MoverTareaRequest,
  ApiResponse,
  TaskUpdate,
  DragHandlers,
  ColumnStats,
  BoardConfig,
  DropResult,
  DraggableLocation,
} from './types';

export {
  isScrumTask,
  isKanbanTask,
  isTaskOverdue,
  getPriorityColor,
  getPriorityLabel,
  groupTasksByStatus,
  calculateColumnStats,
} from './types';
