'use client';

import { GripVertical, User, Clock, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn, parseLocalDate } from '@/lib/utils';
import type { Tarea, TareaPrioridad } from '@/features/proyectos/services/tareas.service';

interface TareaKanbanCardProps {
  tarea: Tarea;
  isDragging?: boolean;
  onEdit?: (tarea: Tarea) => void;
}

const prioridadConfig: Record<TareaPrioridad, { bg: string; text: string; dot: string }> = {
  Alta: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  Media: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  Baja: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
};

export function TareaKanbanCard({
  tarea,
  isDragging = false,
  onEdit,
}: TareaKanbanCardProps) {
  const prioridadStyle = prioridadConfig[tarea.prioridad] || prioridadConfig.Media;

  const formatTareaDate = (date: string | null) => {
    if (!date) return null;
    const parsedDate = parseLocalDate(date);
    if (!parsedDate) return null;
    return parsedDate.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
    });
  };

  const isOverdue =
    tarea.fechaLimite &&
    (parseLocalDate(tarea.fechaLimite)?.getTime() || 0) < new Date().getTime() &&
    tarea.estado !== 'Finalizado';

  return (
    <div
      className={cn(
        'group flex items-start gap-2 p-2 rounded-md border bg-white transition-all cursor-pointer',
        isDragging
          ? 'shadow-lg border-blue-300 ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm',
        onEdit && 'hover:bg-gray-50'
      )}
      onClick={() => onEdit?.(tarea)}
    >
      {/* Drag handle */}
      <div className="mt-0.5 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-center gap-1.5 mb-1">
          <span
            className={cn(
              'w-2 h-2 rounded-full flex-shrink-0',
              prioridadStyle.dot
            )}
          />
          <span className="text-xs font-medium text-gray-900 truncate">
            {tarea.nombre}
          </span>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Codigo */}
          {tarea.codigo && (
            <span className="text-[10px] font-mono text-gray-400">
              {tarea.codigo}
            </span>
          )}

          {/* Responsable */}
          {tarea.responsable && (
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-2.5 w-2.5 text-gray-500" />
              </div>
              <span className="text-[10px] text-gray-500 truncate max-w-[60px]">
                {tarea.responsable.nombre.split(' ')[0]}
              </span>
            </div>
          )}

          {/* Horas estimadas */}
          {tarea.horasEstimadas && (
            <div className="flex items-center gap-0.5 text-[10px] text-gray-500">
              <Clock className="h-3 w-3" />
              <span>{tarea.horasEstimadas}h</span>
            </div>
          )}

          {/* Fecha limite */}
          {tarea.fechaLimite && (
            <div
              className={cn(
                'flex items-center gap-0.5 text-[10px]',
                isOverdue ? 'text-red-600' : 'text-gray-500'
              )}
            >
              <Calendar className="h-3 w-3" />
              <span>{formatTareaDate(tarea.fechaLimite)}</span>
            </div>
          )}

          {/* Prioridad badge (compact) */}
          <Badge
            variant="secondary"
            className={cn(
              'text-[9px] px-1 py-0 h-4',
              prioridadStyle.bg,
              prioridadStyle.text
            )}
          >
            {tarea.prioridad}
          </Badge>
        </div>
      </div>
    </div>
  );
}
