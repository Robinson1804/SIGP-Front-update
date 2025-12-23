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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Sprint } from '@/features/proyectos/types';
import { getSprintsByProyecto } from '@/features/proyectos/services/sprints.service';

interface SprintsViewProps {
  proyectoId: number;
  sprints: Sprint[];
  isLoading: boolean;
  onCreateSprint: () => void;
  onIniciarSprint: (sprintId: number) => void;
  onCerrarSprint: (sprint: Sprint) => void;
  onSprintPlanning: (sprint: Sprint) => void;
  onRefresh: () => void;
}

const ESTADO_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Planificado: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  Activo: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
  Completado: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
};

const ESTADO_BADGE: Record<string, string> = {
  Planificado: 'bg-gray-100 text-gray-800',
  Activo: 'bg-blue-100 text-blue-800',
  Completado: 'bg-green-100 text-green-800',
};

export function SprintsView({
  proyectoId,
  sprints: initialSprints,
  isLoading: initialLoading,
  onCreateSprint,
  onIniciarSprint,
  onCerrarSprint,
  onSprintPlanning,
  onRefresh,
}: SprintsViewProps) {
  const [sprints, setSprints] = useState<Sprint[]>(initialSprints);
  const [isLoading, setIsLoading] = useState(initialLoading);

  useEffect(() => {
    setSprints(initialSprints);
  }, [initialSprints]);

  const sprintActivo = sprints.find((s) => s.estado === 'Activo');
  const sprintsPlanificados = sprints.filter((s) => s.estado === 'Planificado');
  const sprintsCompletados = sprints.filter((s) => s.estado === 'Completado');

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
        <Button onClick={onCreateSprint} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Sprint
        </Button>
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
              onCerrar={() => onCerrarSprint(sprintActivo)}
              onPlanning={() => onSprintPlanning(sprintActivo)}
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
                  onIniciar={() => onIniciarSprint(sprint.id)}
                  onCerrar={() => {}}
                  onPlanning={() => onSprintPlanning(sprint)}
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
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      {sprints.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center mb-4">
              No hay sprints creados para este proyecto.
              <br />
              Crea un sprint para comenzar a planificar el trabajo.
            </p>
            <Button onClick={onCreateSprint} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Crear primer Sprint
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
}

function SprintTimelineItem({
  sprint,
  isActive,
  isCompleted,
  onIniciar,
  onCerrar,
  onPlanning,
}: SprintTimelineItemProps) {
  const colors = ESTADO_COLORS[sprint.estado] || ESTADO_COLORS.Planificado;
  const porcentaje =
    sprint.totalPuntos && sprint.totalPuntos > 0
      ? Math.round(((sprint.puntosCompletados || 0) / sprint.totalPuntos) * 100)
      : 0;

  const fechaInicio = sprint.fechaInicio
    ? new Date(sprint.fechaInicio).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
      })
    : '--';
  const fechaFin = sprint.fechaFin
    ? new Date(sprint.fechaFin).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
      })
    : '--';

  const getDaysRemaining = () => {
    if (!sprint.fechaFin || sprint.estado !== 'Activo') return null;
    const end = new Date(sprint.fechaFin);
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
              {sprint.estado === 'Planificado' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onPlanning}
                    className="gap-1"
                  >
                    <LayoutList className="h-3.5 w-3.5" />
                    Planning
                  </Button>
                  <Button size="sm" onClick={onIniciar} className="gap-1">
                    <Play className="h-3.5 w-3.5" />
                    Iniciar
                  </Button>
                </>
              )}
              {sprint.estado === 'Activo' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onPlanning}
                    className="gap-1"
                  >
                    <LayoutList className="h-3.5 w-3.5" />
                    Ver Planning
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={onCerrar}
                    className="gap-1"
                  >
                    <Square className="h-3.5 w-3.5" />
                    Cerrar Sprint
                  </Button>
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
                {fechaInicio} - {fechaFin}
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
