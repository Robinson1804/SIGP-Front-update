'use client';

import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, User, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Task state type matching backend enums
export type TareaEstado = 'Por hacer' | 'En progreso' | 'En revision' | 'Finalizado';

// Task priority type
export type TareaPrioridad = 'Must' | 'Should' | 'Could' | 'Wont';

// Base task interface
export interface DndTask {
  id: number;
  nombre: string;
  descripcion?: string | null;
  estado: TareaEstado;
  prioridad?: TareaPrioridad | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  orden?: number | null;
  tipo: 'SCRUM' | 'KANBAN';

  // Relations (for display)
  responsables?: Array<{
    id: number;
    nombre: string;
    avatar?: string;
  }>;

  // Additional metadata
  storyPoints?: number | null;
  horasEstimadas?: number | null;
  subtareasCount?: number;
}

interface TaskCardProps {
  task: DndTask;
  index: number;
  onClick?: (task: DndTask) => void;
}

// Priority colors
const priorityColors: Record<TareaPrioridad, string> = {
  Must: 'bg-red-100 text-red-800 border-red-300',
  Should: 'bg-orange-100 text-orange-800 border-orange-300',
  Could: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Wont: 'bg-gray-100 text-gray-800 border-gray-300',
};

// Priority labels
const priorityLabels: Record<TareaPrioridad, string> = {
  Must: 'Crítico',
  Should: 'Alto',
  Could: 'Medio',
  Wont: 'Bajo',
};

/**
 * Draggable task card component
 * Used in both Scrum and Kanban boards
 */
export function TaskCard({ task, index, onClick }: TaskCardProps) {
  const handleClick = () => {
    onClick?.(task);
  };

  // Calculate if task is overdue
  const isOverdue = task.fechaFin
    ? new Date(task.fechaFin) < new Date() && task.estado !== 'Finalizado'
    : false;

  return (
    <Draggable draggableId={task.id.toString()} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            'mb-2 cursor-pointer transition-shadow hover:shadow-md',
            snapshot.isDragging && 'shadow-xl ring-2 ring-blue-500',
            isOverdue && 'border-red-300'
          )}
          onClick={handleClick}
        >
          <CardHeader className="p-3 pb-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-medium leading-tight line-clamp-2">
                {task.nombre}
              </h4>
              {task.prioridad && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs shrink-0',
                    priorityColors[task.prioridad]
                  )}
                >
                  {priorityLabels[task.prioridad]}
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-3 pt-0">
            {/* Description preview */}
            {task.descripcion && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {task.descripcion}
              </p>
            )}

            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {/* Date indicator */}
              {task.fechaFin && (
                <div className={cn(
                  'flex items-center gap-1',
                  isOverdue && 'text-red-600 font-medium'
                )}>
                  {isOverdue && <AlertCircle className="h-3 w-3" />}
                  <Calendar className="h-3 w-3" />
                  <span>
                    {new Date(task.fechaFin).toLocaleDateString('es-PE', {
                      day: '2-digit',
                      month: 'short'
                    })}
                  </span>
                </div>
              )}

              {/* Story points (Scrum only) */}
              {task.tipo === 'SCRUM' && task.storyPoints && (
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-blue-600">{task.storyPoints}</span>
                  <span>pts</span>
                </div>
              )}

              {/* Estimated hours (Kanban) */}
              {task.tipo === 'KANBAN' && task.horasEstimadas && (
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{task.horasEstimadas}</span>
                  <span>hrs</span>
                </div>
              )}

              {/* Subtasks count (Kanban only) */}
              {task.tipo === 'KANBAN' && task.subtareasCount && task.subtareasCount > 0 && (
                <div className="flex items-center gap-1">
                  <span>{task.subtareasCount} subtareas</span>
                </div>
              )}
            </div>

            {/* Responsibles */}
            {task.responsables && task.responsables.length > 0 && (
              <div className="flex items-center gap-1 mt-2">
                {task.responsables.slice(0, 3).map((responsable) => (
                  <Avatar key={responsable.id} className="h-6 w-6">
                    <AvatarImage src={responsable.avatar} alt={responsable.nombre} />
                    <AvatarFallback className="text-xs">
                      {responsable.nombre
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {task.responsables.length > 3 && (
                  <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                    +{task.responsables.length - 3}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
}
