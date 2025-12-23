'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Loader2, AlertCircle, RefreshCw, Plus, MoreHorizontal, Calendar, MessageSquare, Eye, Edit, FileText } from 'lucide-react';
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
import { useTableroData, type TareaConHistoria, type HistoriaConTareas } from '../hooks/use-tablero-data';
import { TareaFormModal } from '../components/tarea-form-modal';
import { TareaDetailModal } from '../components/tarea-detail-modal';
import { HistoriaFormModal } from '../components/historia-form-modal';
import type { TareaEstado, Tarea } from '@/features/proyectos/services/tareas.service';
import type { HistoriaUsuario } from '@/features/proyectos/services/historias.service';
import { cn } from '@/lib/utils';

interface TableroViewProps {
  proyectoId: number;
  onCreateHistoria?: (sprintId?: number) => void;
  onEditHistoria?: (historia: HistoriaUsuario) => void;
  onViewHistoria?: (historia: HistoriaUsuario) => void;
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

function formatDate(dateString?: string | null): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }).toUpperCase();
}

// Colores para prioridades de tareas
const prioridadColors: Record<string, string> = {
  Alta: 'text-red-600',
  Media: 'text-orange-600',
  Baja: 'text-green-600',
};

export function TableroView({
  proyectoId,
  onCreateHistoria,
  onEditHistoria,
  onViewHistoria,
}: TableroViewProps) {
  const {
    tableroData,
    sprints,
    selectedSprintId,
    isLoading,
    isLoadingSprints,
    error,
    setSelectedSprintId,
    moverTareaEnTablero,
    refresh,
  } = useTableroData(proyectoId);

  // Modal states
  const [isTareaModalOpen, setIsTareaModalOpen] = useState(false);
  const [editingTarea, setEditingTarea] = useState<Tarea | null>(null);
  const [targetHistoriaId, setTargetHistoriaId] = useState<number | null>(null);
  const [isHistoriaModalOpen, setIsHistoriaModalOpen] = useState(false);

  // Tarea Detail Modal states
  const [isTareaDetailOpen, setIsTareaDetailOpen] = useState(false);
  const [selectedTareaId, setSelectedTareaId] = useState<number | null>(null);

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
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Mover tarea al nuevo estado
    const tareaId = parseInt(draggableId.replace('tarea-', ''));
    const nuevoEstado = destination.droppableId as TareaEstado;

    try {
      await moverTareaEnTablero(tareaId, nuevoEstado, destination.index);
    } catch (err) {
      console.error('Error al mover tarea:', err);
    }
  };

  const handleCreateTarea = (historiaId: number) => {
    setTargetHistoriaId(historiaId);
    setEditingTarea(null);
    setIsTareaModalOpen(true);
  };

  const handleEditTarea = (tarea: Tarea) => {
    setEditingTarea(tarea);
    setTargetHistoriaId(tarea.historiaUsuarioId);
    setIsTareaModalOpen(true);
  };

  const handleTareaSuccess = () => {
    setIsTareaModalOpen(false);
    setEditingTarea(null);
    setTargetHistoriaId(null);
    refresh();
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

  // Ver detalle de tarea
  const handleViewTareaDetail = (tareaId: number) => {
    setSelectedTareaId(tareaId);
    setIsTareaDetailOpen(true);
  };

  const handleTareaDetailClose = (open: boolean) => {
    setIsTareaDetailOpen(open);
    if (!open) {
      setSelectedTareaId(null);
    }
  };

  const handleTareaDetailUpdate = () => {
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

  // Obtener primera historia para crear tareas si no hay ninguna seleccionada
  const getDefaultHistoriaId = (): number | null => {
    if (tableroData?.historias && tableroData.historias.length > 0) {
      return tableroData.historias[0].id;
    }
    return null;
  };

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
                          ? `${new Date(selectedSprint.fechaInicio).toLocaleDateString('es-PE')} - ${new Date(selectedSprint.fechaFin).toLocaleDateString('es-PE')}`
                          : ''}
                      </span>
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {sprints.map((sprint) => (
                  <SelectItem key={sprint.id} value={sprint.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span>Sprint {sprint.numero}</span>
                      <span className="text-gray-500 text-xs">
                        {sprint.fechaInicio && sprint.fechaFin
                          ? `${new Date(sprint.fechaInicio).toLocaleDateString('es-PE')} - ${new Date(sprint.fechaFin).toLocaleDateString('es-PE')}`
                          : ''}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estado filter badge */}
          <Badge variant="outline" className="bg-gray-50 text-gray-600 font-normal">
            Por hacer
          </Badge>

          {/* Metrics */}
          {tableroData?.metricas && (
            <span className="text-sm text-gray-500">
              ({tableroData.metricas.totalHistorias} historias)
            </span>
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
          <Button
            variant="outline"
            size="sm"
            className="text-gray-600"
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar columna
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-gray-600"
          >
            Cerrar Sprint
          </Button>
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
        /* Tablero Kanban - 4 columnas horizontales lado a lado */
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto">
            <div className="inline-flex gap-4 min-h-[600px] w-full min-w-max pb-4">
              {tableroData.columnas.map((columna) => (
                <div key={columna.id} className="w-[280px] flex-shrink-0 flex flex-col bg-gray-50 rounded-lg">
                {/* Column Header */}
                <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{columna.nombre}</h3>
                    <span className="text-sm text-gray-500">({columna.totalTareas})</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Editar columna</DropdownMenuItem>
                      <DropdownMenuItem>Ocultar columna</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Column Content - Droppable area for tasks */}
                <Droppable droppableId={columna.id} type="tarea">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        'flex-1 p-2 space-y-3 overflow-y-auto min-h-[500px]',
                        snapshot.isDraggingOver && 'bg-blue-50'
                      )}
                    >
                      {columna.tareas.map((tarea, index) => (
                        <Draggable
                          key={tarea.id}
                          draggableId={`tarea-${tarea.id}`}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                'bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-grab',
                                snapshot.isDragging && 'shadow-lg rotate-1 cursor-grabbing'
                              )}
                            >
                              {/* Task Card Content - Clickable to open detail */}
                              <div
                                className="p-3 cursor-pointer"
                                onClick={(e) => {
                                  // Evitar abrir el modal si se hace clic en el menú
                                  if ((e.target as HTMLElement).closest('[data-no-click]')) {
                                    return;
                                  }
                                  handleViewTareaDetail(tarea.id);
                                }}
                              >
                                {/* Title and menu */}
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
                                    {tarea.nombre}
                                  </h4>
                                  <div data-no-click onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 text-gray-400 hover:text-gray-600">
                                          <MoreHorizontal className="h-3.5 w-3.5" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleViewTareaDetail(tarea.id)}>
                                          <Eye className="h-4 w-4 mr-2" />
                                          Ver detalles
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleEditTarea(tarea)}>
                                          <Edit className="h-4 w-4 mr-2" />
                                          Editar tarea
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => onViewHistoria?.(tarea.historia)}>
                                          <FileText className="h-4 w-4 mr-2" />
                                          Ver historia
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>

                                {/* Historia badge */}
                                <div className="flex items-center justify-between mb-3">
                                  <Badge
                                    variant="secondary"
                                    className="text-xs px-2 py-0.5 font-normal"
                                    style={{
                                      backgroundColor: tarea.historia.epica?.color ? `${tarea.historia.epica.color}20` : '#f3f4f6',
                                      color: tarea.historia.epica?.color || '#6b7280',
                                    }}
                                  >
                                    {tarea.historia.epica?.nombre || tarea.historia.codigo}
                                  </Badge>
                                  {tarea.fechaLimite && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                      <Calendar className="h-3 w-3" />
                                      <span>{formatDate(tarea.fechaLimite)}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Footer: Code, priority, comments, avatar */}
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                  <div className="flex items-center gap-3 text-xs">
                                    <span className={cn('font-medium', prioridadColors[tarea.prioridad] || 'text-gray-600')}>
                                      {tarea.historia.codigo}
                                    </span>
                                    {tarea.horasEstimadas && (
                                      <span className="text-blue-600 font-semibold">
                                        {tarea.horasEstimadas}h
                                      </span>
                                    )}
                                    <div className="flex items-center gap-1 text-gray-500">
                                      <MessageSquare className="h-3 w-3" />
                                      <span>{tarea.historia.tareas?.length || 0}</span>
                                    </div>
                                  </div>
                                  {tarea.responsable ? (
                                    <div
                                      className={cn(
                                        'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium',
                                        getAvatarColor(tarea.responsable.nombre || 'U')
                                      )}
                                      title={tarea.responsable.nombre}
                                    >
                                      {getInitials(tarea.responsable.nombre || 'U')}
                                    </div>
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                                      ?
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {/* Add new task button */}
                      <button
                        onClick={() => {
                          const defaultHistoriaId = getDefaultHistoriaId();
                          if (defaultHistoriaId) {
                            handleCreateTarea(defaultHistoriaId);
                          } else {
                            handleAddHistoria();
                          }
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Nuevo</span>
                      </button>
                    </div>
                  )}
                </Droppable>
              </div>
              ))}
            </div>
          </div>
        </DragDropContext>
      )}

      {/* Modal para crear/editar tarea */}
      <TareaFormModal
        open={isTareaModalOpen}
        onOpenChange={setIsTareaModalOpen}
        historiaUsuarioId={targetHistoriaId || 0}
        tarea={editingTarea}
        onSuccess={handleTareaSuccess}
      />

      {/* Modal para crear historia */}
      <HistoriaFormModal
        open={isHistoriaModalOpen}
        onOpenChange={setIsHistoriaModalOpen}
        proyectoId={proyectoId}
        sprintId={selectedSprintId || undefined}
        onSuccess={handleHistoriaSuccess}
      />

      {/* Modal para ver detalle de tarea */}
      {selectedTareaId && (
        <TareaDetailModal
          open={isTareaDetailOpen}
          onOpenChange={handleTareaDetailClose}
          tareaId={selectedTareaId}
          proyectoId={proyectoId}
          onUpdate={handleTareaDetailUpdate}
        />
      )}
    </div>
  );
}
