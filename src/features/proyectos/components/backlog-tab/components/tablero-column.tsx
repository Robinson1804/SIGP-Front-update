'use client';

import { Droppable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { type TableroColumna, type HistoriaConTareas } from '../hooks/use-tablero-data';
import { HistoriaKanbanCard } from './historia-kanban-card';
import type { Tarea } from '@/features/proyectos/services/tareas.service';
import type { HistoriaUsuario } from '@/features/proyectos/services/historias.service';

interface TableroColumnProps {
  columna: TableroColumna;
  onCreateTarea?: (historia: HistoriaConTareas) => void;
  onEditTarea?: (tarea: Tarea) => void;
  onViewHistoria?: (historia: HistoriaUsuario) => void;
  onEditHistoria?: (historia: HistoriaUsuario) => void;
}

const columnColors: Record<string, { bg: string; border: string; header: string }> = {
  'Por hacer': {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    header: 'bg-gray-100 text-gray-700',
  },
  'En progreso': {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    header: 'bg-blue-100 text-blue-700',
  },
  'En revision': {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    header: 'bg-amber-100 text-amber-700',
  },
  'Finalizado': {
    bg: 'bg-green-50',
    border: 'border-green-200',
    header: 'bg-green-100 text-green-700',
  },
};

export function TableroColumn({
  columna,
  onCreateTarea,
  onEditTarea,
  onViewHistoria,
  onEditHistoria,
}: TableroColumnProps) {
  const colors = columnColors[columna.id] || columnColors['Por hacer'];

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border',
        colors.bg,
        colors.border
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'px-3 py-2 rounded-t-lg border-b',
          colors.header,
          colors.border
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{columna.nombre}</span>
            <span className="text-xs bg-white/50 px-1.5 py-0.5 rounded">
              {columna.historias.length}
            </span>
          </div>
          {columna.totalPuntos > 0 && (
            <span className="text-xs font-medium">
              {columna.totalPuntos} pts
            </span>
          )}
        </div>
      </div>

      {/* Content - Droppable area for tareas */}
      <Droppable droppableId={columna.id} type="tarea">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 p-2 space-y-2 min-h-[400px] overflow-y-auto',
              snapshot.isDraggingOver && 'bg-opacity-80 ring-2 ring-blue-300 ring-inset'
            )}
          >
            {columna.historias.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Sin historias
              </div>
            ) : (
              columna.historias.map((historia, index) => (
                <HistoriaKanbanCard
                  key={historia.id}
                  historia={historia}
                  columnId={columna.id}
                  index={index}
                  onCreateTarea={onCreateTarea}
                  onEditTarea={onEditTarea}
                  onView={onViewHistoria}
                  onEdit={onEditHistoria}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
