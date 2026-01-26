'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Loader2, AlertCircle, RefreshCw, Plus, MoreHorizontal, Eye, Edit, Trash2, ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTableroData, type HistoriaConTareas } from '../hooks/use-tablero-data';
import { HistoriaFormModal } from '../components/historia-form-modal';
import { TareaFormModal } from '../components/tarea-form-modal';
import type { HistoriaUsuario, HistoriaEstado } from '@/features/proyectos/services/historias.service';
import { cn, formatDate as formatDateUtil } from '@/lib/utils';

interface TableroViewProps {
  proyectoId: number;
  onCreateHistoria?: (sprintId?: number) => void;
  onEditHistoria?: (historia: HistoriaUsuario) => void;
  onViewHistoria?: (historia: HistoriaUsuario) => void;
  onDeleteHistoria?: (historia: HistoriaUsuario) => void;
  proyectoFechaInicio?: string | null;
  proyectoFechaFin?: string | null;
  /** Modo solo lectura */
  isReadOnly?: boolean;
}

// Colores para avatares basados en iniciales
const avatarColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-cyan-500',
];

function getAvatarColor(name: string): string {
  const index = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[index];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Colores para prioridades de HU
const prioridadColors: Record<string, string> = {
  Alta: 'text-red-600 bg-red-50',
  Media: 'text-orange-600 bg-orange-50',
  Baja: 'text-green-600 bg-green-50',
};

// Colores para columnas de estado
const columnColors: Record<HistoriaEstado, { bg: string; border: string; headerBg: string }> = {
  'Por hacer': { bg: 'bg-gray-50', border: 'border-gray-200', headerBg: 'bg-gray-100' },
  'En progreso': { bg: 'bg-blue-50', border: 'border-blue-200', headerBg: 'bg-blue-100' },
  'En revision': { bg: 'bg-amber-50', border: 'border-amber-200', headerBg: 'bg-amber-100' },
  'Finalizado': { bg: 'bg-green-50', border: 'border-green-200', headerBg: 'bg-green-100' },
};

export function TableroView({
  proyectoId,
  onCreateHistoria,
  onEditHistoria,
  onViewHistoria,
  onDeleteHistoria,
  proyectoFechaInicio,
  proyectoFechaFin,
  isReadOnly = false,
}: TableroViewProps) {
  const {
    tableroData,
    sprints,
    selectedSprintId,
    isLoading,
    isLoadingSprints,
    error,
    setSelectedSprintId,
    moverHistoriaEnTablero,
    refresh,
  } = useTableroData(proyectoId);

  // Modal states
  const [isHistoriaModalOpen, setIsHistoriaModalOpen] = useState(false);
  const [isTareaModalOpen, setIsTareaModalOpen] = useState(false);
  const [selectedHistoriaForTarea, setSelectedHistoriaForTarea] = useState<number | null>(null);

  // Get selected sprint
  const selectedSprint = sprints.find((s) => s.id === selectedSprintId);

  // Handlers
  const handleSprintChange = (value: string) => {
    if (value === '__none__') {
      setSelectedSprintId(null);
    } else {
      setSelectedSprintId(parseInt(value));
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    // Disable drag and drop in read-only mode
    if (isReadOnly) return;

    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Mover historia al nuevo estado
    const historiaId = parseInt(draggableId.replace('historia-', ''));
    const nuevoEstado = destination.droppableId as HistoriaEstado;

    try {
      await moverHistoriaEnTablero(historiaId, nuevoEstado);
    } catch (err) {
      console.error('Error al mover historia:', err);
    }
  };

  const handleAddHistoria = () => {
    if (onCreateHistoria && selectedSprintId) {
      onCreateHistoria(selectedSprintId);
    } else {
      setIsHistoriaModalOpen(true);
    }
  };

  const handleHistoriaSuccess = () => {
    setIsHistoriaModalOpen(false);
    refresh();
  };

  const handleCreateTarea = (historiaId: number) => {
    setSelectedHistoriaForTarea(historiaId);
    setIsTareaModalOpen(true);
  };

  const handleTareaSuccess = () => {
    setIsTareaModalOpen(false);
    setSelectedHistoriaForTarea(null);
    refresh();
  };

  // Render loading state
  if (isLoadingSprints && sprints.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#018CD1]" />
        <span className="ml-2 text-gray-500">Cargando sprints...</span>
      </div>
    );
  }

  // Render no sprints state
  if (sprints.length === 0) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium text-gray-700">No hay sprints disponibles</p>
        <p className="text-sm text-gray-500 mt-2">
          Crea un sprint en el Backlog para ver el tablero
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white border-b border-gray-200 pb-4">
        <div className="flex items-center gap-4">
          {/* Sprint selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Filtrar por Sprint:</span>
            <Select
              value={selectedSprintId?.toString() || '__none__'}
              onValueChange={handleSprintChange}
              disabled={isLoadingSprints}
            >
              <SelectTrigger className="w-[280px] bg-white">
                <SelectValue placeholder="Seleccionar sprint">
                  {selectedSprint && (
                    <span>
                      Sprint {selectedSprint.numero}{' '}
                      <span className="text-gray-500">
                        {selectedSprint.fechaInicio && selectedSprint.fechaFin
                          ? `${formatDateUtil(selectedSprint.fechaInicio, { day: '2-digit', month: '2-digit', year: 'numeric' })} - ${formatDateUtil(selectedSprint.fechaFin, { day: '2-digit', month: '2-digit', year: 'numeric' })}`
                          : ''}
                      </span>
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {sprints.map((sprint) => (
                  <SelectItem
                    key={sprint.id}
                    value={sprint.id.toString()}
                    className="group"
                  >
                    <div className="flex items-center gap-2">
                      <span>Sprint {sprint.numero}</span>
                      <span className="text-xs text-gray-500 group-hover:text-white group-focus:text-white group-data-[state=checked]:text-white">
                        {sprint.fechaInicio && sprint.fechaFin
                          ? `${formatDateUtil(sprint.fechaInicio, { day: '2-digit', month: '2-digit', year: 'numeric' })} - ${formatDateUtil(sprint.fechaFin, { day: '2-digit', month: '2-digit', year: 'numeric' })}`
                          : ''}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Metrics */}
          {tableroData?.metricas && (
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>{tableroData.metricas.totalHistorias} historias</span>
              <span className="text-gray-300">|</span>
              <span>{tableroData.metricas.totalPuntos} pts totales</span>
              <span className="text-gray-300">|</span>
              <span className="text-green-600">{tableroData.metricas.puntosCompletados} pts completados</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
            className="text-gray-600"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          {!isReadOnly && (
            <Button
              size="sm"
              onClick={handleAddHistoria}
              disabled={!selectedSprintId}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nueva Historia
            </Button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading tablero */}
      {isLoading && !tableroData ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#018CD1]" />
          <span className="ml-2 text-gray-500">Cargando tablero...</span>
        </div>
      ) : !tableroData || !selectedSprintId ? (
        <div className="text-center py-16">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-700">Selecciona un sprint</p>
          <p className="text-sm text-gray-500 mt-2">
            Elige un sprint del selector para ver su tablero
          </p>
        </div>
      ) : (
        /* Tablero Kanban - 4 columnas de HU por estado */
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto">
            <div className="inline-flex gap-4 min-h-[600px] w-full min-w-max pb-4">
              {tableroData.columnasHU.map((columna) => {
                const colors = columnColors[columna.id] || columnColors['Por hacer'];
                return (
                  <div
                    key={columna.id}
                    className={cn(
                      'w-[320px] flex-shrink-0 flex flex-col rounded-lg border',
                      colors.bg,
                      colors.border
                    )}
                  >
                    {/* Column Header */}
                    <div className={cn(
                      'flex items-center justify-between px-3 py-3 rounded-t-lg border-b',
                      colors.headerBg,
                      colors.border
                    )}>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800">{columna.nombre}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {columna.totalHistorias}
                        </Badge>
                      </div>
                      {columna.totalPuntos > 0 && (
                        <span className="text-xs font-medium text-gray-600">
                          {columna.totalPuntos} pts
                        </span>
                      )}
                    </div>

                    {/* Column Content - Droppable area for historias */}
                    <Droppable droppableId={columna.id} type="historia">
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={cn(
                            'flex-1 p-2 space-y-3 overflow-y-auto min-h-[500px]',
                            snapshot.isDraggingOver && 'bg-blue-100/50 ring-2 ring-blue-300 ring-inset'
                          )}
                        >
                          {columna.historias.length === 0 ? (
                            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                              Sin historias
                            </div>
                          ) : (
                            columna.historias.map((historia, index) => (
                              <Draggable
                                key={historia.id}
                                draggableId={`historia-${historia.id}`}
                                index={index}
                                isDragDisabled={isReadOnly}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={cn(
                                      'bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow',
                                      !isReadOnly && 'cursor-grab',
                                      snapshot.isDragging && 'shadow-lg rotate-1 cursor-grabbing'
                                    )}
                                  >
                                    <HistoriaCard
                                      historia={historia}
                                      onView={onViewHistoria}
                                      onEdit={isReadOnly ? undefined : onEditHistoria}
                                      onDelete={isReadOnly ? undefined : onDeleteHistoria}
                                      onCreateTarea={isReadOnly ? undefined : handleCreateTarea}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            ))
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </div>
        </DragDropContext>
      )}

      {/* Modal para crear historia */}
      <HistoriaFormModal
        open={isHistoriaModalOpen}
        onOpenChange={setIsHistoriaModalOpen}
        proyectoId={proyectoId}
        sprintId={selectedSprintId || undefined}
        onSuccess={handleHistoriaSuccess}
        proyectoFechaInicio={proyectoFechaInicio}
        proyectoFechaFin={proyectoFechaFin}
      />

      {/* Modal para crear tarea */}
      {selectedHistoriaForTarea && (
        <TareaFormModal
          open={isTareaModalOpen}
          onOpenChange={(open) => {
            setIsTareaModalOpen(open);
            if (!open) setSelectedHistoriaForTarea(null);
          }}
          historiaUsuarioId={selectedHistoriaForTarea}
          onSuccess={handleTareaSuccess}
        />
      )}
    </div>
  );
}

// Componente de tarjeta de historia para el tablero
interface HistoriaCardProps {
  historia: HistoriaConTareas;
  onView?: (historia: HistoriaUsuario) => void;
  onEdit?: (historia: HistoriaUsuario) => void;
  onDelete?: (historia: HistoriaUsuario) => void;
  onCreateTarea?: (historiaId: number) => void;
}

function HistoriaCard({ historia, onView, onEdit, onDelete, onCreateTarea }: HistoriaCardProps) {
  // Calcular progreso de tareas
  const totalTareas = historia.tareas?.length || 0;
  const tareasFinalizadas = historia.tareas?.filter((t) => t.estado === 'Finalizado').length || 0;
  const progreso = totalTareas > 0 ? Math.round((tareasFinalizadas / totalTareas) * 100) : 0;

  return (
    <div className="p-3">
      {/* Header: Code and menu */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-gray-500">
            {historia.codigo}
          </span>
          {historia.prioridad && (
            <Badge
              variant="secondary"
              className={cn(
                'text-[10px] px-1.5 py-0',
                prioridadColors[historia.prioridad] || 'bg-gray-100'
              )}
            >
              {historia.prioridad}
            </Badge>
          )}
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-gray-400 hover:text-gray-600">
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
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              {onCreateTarea && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onCreateTarea(historia.id)}>
                    <ListTodo className="h-4 w-4 mr-2" />
                    <Plus className="h-3 w-3 -ml-1 mr-1" />
                    Crear tarea
                  </DropdownMenuItem>
                </>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(historia)}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
        {historia.titulo}
      </h4>

      {/* Epica badge */}
      {historia.epica && (
        <div className="flex items-center gap-1.5 mb-2">
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
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {historia.storyPoints && (
            <span className="font-semibold text-blue-600">
              {historia.storyPoints} pts
            </span>
          )}
          {totalTareas > 0 && (
            <span>
              {tareasFinalizadas}/{totalTareas} tareas
            </span>
          )}
        </div>
        {progreso > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${progreso}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-500">{progreso}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
