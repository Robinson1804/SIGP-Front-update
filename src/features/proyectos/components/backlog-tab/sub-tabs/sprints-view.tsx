'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Loader2,
  Calendar,
  Play,
  Square,
  ChevronRight,
  LayoutList,
  Target,
  Clock,
  Pencil,
  Trash2,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Sprint } from '@/features/proyectos/types';
import { getSprintsByProyecto } from '@/features/proyectos/services/sprints.service';
import { parseLocalDate, formatDate } from '@/lib/utils';
import { useAuth } from '@/stores';
import { ROLES } from '@/lib/definitions';

interface SprintsViewProps {
  proyectoId: number;
  /** ID del subproyecto (si aplica) */
  subproyectoId?: number;
  sprints: Sprint[];
  isLoading: boolean;
  onCreateSprint: () => void;
  onIniciarSprint: (sprintId: number) => void;
  onCerrarSprint: (sprint: Sprint) => void;
  onSprintPlanning: (sprint: Sprint) => void;
  onEditSprint: (sprint: Sprint) => void;
  onDeleteSprint: (sprint: Sprint) => void;
  onRefresh: () => void;
  /** Modo solo lectura */
  isReadOnly?: boolean;
}

const ESTADO_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Por hacer': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  'En progreso': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
  'Finalizado': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  // Fallback para valores antiguos
  Planificado: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  Activo: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
  Completado: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
};

const ESTADO_BADGE: Record<string, string> = {
  'Por hacer': 'bg-gray-100 text-gray-800',
  'En progreso': 'bg-blue-100 text-blue-800',
  'Finalizado': 'bg-green-100 text-green-800',
  // Fallback para valores antiguos
  Planificado: 'bg-gray-100 text-gray-800',
  Activo: 'bg-blue-100 text-blue-800',
  Completado: 'bg-green-100 text-green-800',
};

export function SprintsView({
  proyectoId,
  subproyectoId,
  sprints: initialSprints,
  isLoading: initialLoading,
  onCreateSprint,
  onIniciarSprint,
  onCerrarSprint,
  onSprintPlanning,
  onEditSprint,
  onDeleteSprint,
  onRefresh,
  isReadOnly = false,
}: SprintsViewProps) {
  const { user } = useAuth();
  const isPmo = user?.role === ROLES.PMO;
  const [sprints, setSprints] = useState<Sprint[]>(initialSprints);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos');

  useEffect(() => {
    setSprints(initialSprints);
  }, [initialSprints]);

  useEffect(() => {
    setIsLoading(initialLoading);
  }, [initialLoading]);

  // Helpers para identificar estados (soporta formatos nuevos y antiguos)
  const isActivo = (estado: string) => estado === 'En progreso' || estado === 'Activo';
  const isPlanificado = (estado: string) => estado === 'Por hacer' || estado === 'Planificado';
  const isFinalizado = (estado: string) => estado === 'Finalizado' || estado === 'Completado';

  // Filtrar sprints según el filtro seleccionado
  const sprintsFiltrados = sprints.filter((s) => {
    if (estadoFiltro === 'todos') return true;
    if (estadoFiltro === 'en_progreso') return isActivo(s.estado);
    if (estadoFiltro === 'por_hacer') return isPlanificado(s.estado);
    if (estadoFiltro === 'finalizado') return isFinalizado(s.estado);
    return true;
  });

  const sprintActivo = sprintsFiltrados.find((s) => isActivo(s.estado));
  const sprintsPlanificados = sprintsFiltrados.filter((s) => isPlanificado(s.estado));
  const sprintsCompletados = sprintsFiltrados.filter((s) => isFinalizado(s.estado));

  // Contadores para mostrar en el filtro
  const countActivo = sprints.filter((s) => isActivo(s.estado)).length;
  const countPlanificados = sprints.filter((s) => isPlanificado(s.estado)).length;
  const countFinalizados = sprints.filter((s) => isFinalizado(s.estado)).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h4 className="text-lg font-semibold">Sprints del Proyecto</h4>
          <Badge variant="secondary">{sprints.length}</Badge>
        </div>
        <div className="flex items-center gap-3">
          {/* Filtro de estado */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">
                  Todos ({sprints.length})
                </SelectItem>
                <SelectItem value="en_progreso">
                  En progreso ({countActivo})
                </SelectItem>
                <SelectItem value="por_hacer">
                  Por hacer ({countPlanificados})
                </SelectItem>
                <SelectItem value="finalizado">
                  Finalizado ({countFinalizados})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!isReadOnly && (
            <Button onClick={onCreateSprint} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Sprint
            </Button>
          )}
        </div>
      </div>

      {/* Sprint Timeline */}
      <div className="relative">
        <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="space-y-4">
          {/* Sprint Activo */}
          {sprintActivo && (
            <SprintTimelineItem
              sprint={sprintActivo}
              isActive
              onIniciar={() => {}}
              onCerrar={isReadOnly ? () => {} : () => onCerrarSprint(sprintActivo)}
              onPlanning={() => onSprintPlanning(sprintActivo)}
              onEdit={isReadOnly ? () => {} : () => onEditSprint(sprintActivo)}
              onDelete={isReadOnly ? () => {} : () => onDeleteSprint(sprintActivo)}
              isReadOnly={isReadOnly}
              hidePlanning={isPmo}
            />
          )}

          {/* Sprints Planificados */}
          {sprintsPlanificados.length > 0 && (
            <div className="space-y-4">
              <h5 className="text-sm font-medium text-gray-500 ml-12">
                Sprints Planificados
              </h5>
              {sprintsPlanificados.map((sprint) => (
                <SprintTimelineItem
                  key={sprint.id}
                  sprint={sprint}
                  onIniciar={isReadOnly ? () => {} : () => onIniciarSprint(sprint.id)}
                  onCerrar={() => {}}
                  onPlanning={() => onSprintPlanning(sprint)}
                  onEdit={isReadOnly ? () => {} : () => onEditSprint(sprint)}
                  onDelete={isReadOnly ? () => {} : () => onDeleteSprint(sprint)}
                  isReadOnly={isReadOnly}
                  hidePlanning={isPmo}
                />
              ))}
            </div>
          )}

          {/* Sprints Completados */}
          {sprintsCompletados.length > 0 && (
            <div className="space-y-4">
              <h5 className="text-sm font-medium text-gray-500 ml-12">
                Sprints Completados
              </h5>
              {sprintsCompletados.map((sprint) => (
                <SprintTimelineItem
                  key={sprint.id}
                  sprint={sprint}
                  isCompleted
                  onIniciar={() => {}}
                  onCerrar={() => {}}
                  onPlanning={() => {}}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  isReadOnly={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Empty state - No sprints at all */}
      {sprints.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center mb-4">
              No hay sprints creados para este proyecto.
              <br />
              {isReadOnly ? 'No se pueden crear sprints en un proyecto finalizado.' : 'Crea un sprint para comenzar a planificar el trabajo.'}
            </p>
            {!isReadOnly && (
              <Button onClick={onCreateSprint} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Crear primer Sprint
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty state - Filter has no results */}
      {sprints.length > 0 && sprintsFiltrados.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Filter className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center mb-4">
              No hay sprints con el estado seleccionado.
            </p>
            <Button onClick={() => setEstadoFiltro('todos')} variant="outline" className="gap-2">
              Ver todos los sprints
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface SprintTimelineItemProps {
  sprint: Sprint;
  isActive?: boolean;
  isCompleted?: boolean;
  onIniciar: () => void;
  onCerrar: () => void;
  onPlanning: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isReadOnly?: boolean;
  hidePlanning?: boolean;
}

function SprintTimelineItem({
  sprint,
  isActive,
  isCompleted,
  onIniciar,
  onCerrar,
  onPlanning,
  onEdit,
  onDelete,
  isReadOnly = false,
  hidePlanning = false,
}: SprintTimelineItemProps) {
  const colors = ESTADO_COLORS[sprint.estado] || ESTADO_COLORS.Planificado;
  const porcentaje =
    sprint.totalPuntos && sprint.totalPuntos > 0
      ? Math.round(((sprint.puntosCompletados || 0) / sprint.totalPuntos) * 100)
      : 0;

  const fechaInicioStr = formatDate(sprint.fechaInicio, { day: '2-digit', month: 'short' });
  const fechaFinStr = formatDate(sprint.fechaFin, { day: '2-digit', month: 'short' });

  const getDaysRemaining = () => {
    if (!sprint.fechaFin || (sprint.estado !== 'En progreso' && sprint.estado !== 'Activo')) return null;
    const end = parseLocalDate(sprint.fechaFin);
    if (!end) return null;
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <div className="relative flex gap-4 ml-0">
      {/* Timeline dot */}
      <div
        className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 ${
          isActive
            ? 'bg-blue-600 border-blue-600'
            : isCompleted
            ? 'bg-green-600 border-green-600'
            : 'bg-white border-gray-300'
        }`}
      >
        {isActive ? (
          <Play className="h-4 w-4 text-white fill-white" />
        ) : isCompleted ? (
          <Square className="h-4 w-4 text-white fill-white" />
        ) : (
          <Calendar className="h-4 w-4 text-gray-400" />
        )}
      </div>

      {/* Content card */}
      <Card
        className={`flex-1 ${colors.bg} border ${colors.border} ${
          isActive ? 'ring-2 ring-blue-200' : ''
        }`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{sprint.nombre}</CardTitle>
                <Badge className={ESTADO_BADGE[sprint.estado]}>
                  {sprint.estado}
                </Badge>
              </div>
              {sprint.objetivo && (
                <CardDescription className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {sprint.objetivo}
                </CardDescription>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Editar y Eliminar siempre visibles (excepto en sprints completados o readonly) */}
              {!isCompleted && !isReadOnly && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onEdit}
                    className="gap-1"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDelete}
                    className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                  </Button>
                </>
              )}
              {(sprint.estado === 'Por hacer' || sprint.estado === 'Planificado') && (
                <>
                  {!hidePlanning && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onPlanning}
                      className="gap-1"
                    >
                      <LayoutList className="h-3.5 w-3.5" />
                      Planning
                    </Button>
                  )}
                  {!isReadOnly && (
                    <Button size="sm" onClick={onIniciar} className="gap-1">
                      <Play className="h-3.5 w-3.5" />
                      Iniciar
                    </Button>
                  )}
                </>
              )}
              {(sprint.estado === 'En progreso' || sprint.estado === 'Activo') && (
                <>
                  {!hidePlanning && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onPlanning}
                      className="gap-1"
                    >
                      <LayoutList className="h-3.5 w-3.5" />
                      Ver Planning
                    </Button>
                  )}
                  {!isReadOnly && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={onCerrar}
                      className="gap-1"
                    >
                      <Square className="h-3.5 w-3.5" />
                      Cerrar Sprint
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Stats row */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-1.5 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>
                {fechaInicioStr} - {fechaFinStr}
              </span>
            </div>

            {daysRemaining !== null && (
              <div
                className={`font-medium ${
                  daysRemaining <= 2
                    ? 'text-red-600'
                    : daysRemaining <= 5
                    ? 'text-orange-600'
                    : 'text-gray-600'
                }`}
              >
                {daysRemaining > 0
                  ? `${daysRemaining} dias restantes`
                  : daysRemaining === 0
                  ? 'Ultimo dia'
                  : 'Sprint vencido'}
              </div>
            )}

            {sprint.velocidadPlanificada && (
              <div className="text-gray-500">
                Velocidad: <strong>{sprint.velocidadPlanificada}</strong> SP
              </div>
            )}
          </div>

          {/* Progress */}
          {(sprint.totalPuntos || 0) > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Progreso del Sprint</span>
                <span>
                  {sprint.puntosCompletados || 0} / {sprint.totalPuntos} SP ({porcentaje}%)
                </span>
              </div>
              <Progress
                value={porcentaje}
                className={`h-2 ${isCompleted ? '[&>div]:bg-green-600' : ''}`}
              />
            </div>
          )}

          {/* Velocity comparison for completed sprints */}
          {isCompleted && sprint.velocidadReal && (
            <div className="flex items-center gap-4 text-sm pt-2 border-t">
              <div>
                <span className="text-gray-500">Velocidad planificada: </span>
                <strong>{sprint.velocidadPlanificada || 0} SP</strong>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <div>
                <span className="text-gray-500">Velocidad real: </span>
                <strong
                  className={
                    sprint.velocidadReal >= (sprint.velocidadPlanificada || 0)
                      ? 'text-green-600'
                      : 'text-orange-600'
                  }
                >
                  {sprint.velocidadReal} SP
                </strong>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
