'use client';

import { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Eye,
  Pencil,
  MoreHorizontal,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { type HistoriaConTareas } from '../hooks/use-tablero-data';
import { TareaKanbanCard } from './tarea-kanban-card';
import type { Tarea, TareaEstado } from '@/features/proyectos/services/tareas.service';
import type { HistoriaUsuario, PrioridadMoSCoW } from '@/features/proyectos/services/historias.service';

interface HistoriaKanbanCardProps {
  historia: HistoriaConTareas;
  columnId: TareaEstado;
  index: number;
  onCreateTarea?: (historia: HistoriaConTareas) => void;
  onEditTarea?: (tarea: Tarea) => void;
  onView?: (historia: HistoriaUsuario) => void;
  onEdit?: (historia: HistoriaUsuario) => void;
}

const prioridadConfig: Record<PrioridadMoSCoW, { bg: string; text: string }> = {
  Must: { bg: 'bg-red-100', text: 'text-red-700' },
  Should: { bg: 'bg-orange-100', text: 'text-orange-700' },
  Could: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  Wont: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

export function HistoriaKanbanCard({
  historia,
  columnId,
  index,
  onCreateTarea,
  onEditTarea,
  onView,
  onEdit,
}: HistoriaKanbanCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Filtrar tareas para esta columna
  const tareasEnColumna = historia.tareas.filter((t) => t.estado === columnId);
  const totalTareas = historia.tareas.length;
  const tareasFinalizadas = historia.tareas.filter(
    (t) => t.estado === 'Finalizado'
  ).length;

  // Calcular progreso
  const progreso = totalTareas > 0 ? Math.round((tareasFinalizadas / totalTareas) * 100) : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="p-3">
          <div className="flex items-start gap-2">
            {/* Expand/Collapse button */}
            <CollapsibleTrigger asChild>
              <button className="mt-0.5 p-0.5 rounded hover:bg-gray-100 transition-colors">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </CollapsibleTrigger>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Code and title */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-medium text-gray-500">
                  {historia.codigo}
                </span>
                {historia.prioridad && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-[10px] px-1 py-0',
                      prioridadConfig[historia.prioridad].bg,
                      prioridadConfig[historia.prioridad].text
                    )}
                  >
                    {historia.prioridad}
                  </Badge>
                )}
              </div>
              <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                {historia.titulo}
              </h4>

              {/* Epica badge */}
              {historia.epica && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: historia.epica.color || '#888' }}
                  />
                  <span className="text-xs text-gray-500 truncate">
                    {historia.epica.nombre}
                  </span>
                </div>
              )}

              {/* Stats row */}
              <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                {historia.storyPoints && (
                  <span className="font-medium text-blue-600">
                    {historia.storyPoints} pts
                  </span>
                )}
                {totalTareas > 0 && (
                  <span>
                    {tareasFinalizadas}/{totalTareas} tareas
                  </span>
                )}
                {progreso > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${progreso}%` }}
                      />
                    </div>
                    <span className="text-[10px]">{progreso}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <DropdownMenuItem onClick={() => onView(historia)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver detalle
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(historia)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                )}
                {onCreateTarea && (
                  <DropdownMenuItem onClick={() => onCreateTarea(historia)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar tarea
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tareas list */}
        <CollapsibleContent>
          <div className="border-t border-gray-100 px-3 pb-2">
            {tareasEnColumna.length === 0 ? (
              <div className="py-3 text-center">
                <p className="text-xs text-gray-400 mb-2">
                  Sin tareas en este estado
                </p>
                {onCreateTarea && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-[#018CD1] hover:text-[#0179b5]"
                    onClick={() => onCreateTarea(historia)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Agregar tarea
                  </Button>
                )}
              </div>
            ) : (
              <div className="pt-2 space-y-1.5">
                {tareasEnColumna.map((tarea, tareaIndex) => (
                  <Draggable
                    key={tarea.id}
                    draggableId={`tarea-${tarea.id}`}
                    index={tareaIndex}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <TareaKanbanCard
                          tarea={tarea}
                          isDragging={snapshot.isDragging}
                          onEdit={onEditTarea}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}

                {/* Add task button */}
                {onCreateTarea && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs text-gray-500 hover:text-[#018CD1] hover:bg-blue-50 justify-start"
                    onClick={() => onCreateTarea(historia)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Agregar tarea
                  </Button>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
