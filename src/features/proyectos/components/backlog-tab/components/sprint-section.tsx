'use client';

import { useState, memo } from 'react';
import { ChevronDown, ChevronRight, Plus, Play, Pencil, Trash2, Lock, Clock } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { type Sprint } from '@/features/proyectos/services/sprints.service';
import { type HistoriaUsuario } from '@/features/proyectos/services/historias.service';
import { type Tarea } from '@/features/proyectos/services/tareas.service';
import { HistoriaTable } from './historia-table';
import { cn, parseLocalDate } from '@/lib/utils';

interface MiembroEquipo {
  id: number;
  nombre: string;
}

interface SprintSectionProps {
  sprint: Sprint;
  historias: HistoriaUsuario[];
  equipo?: MiembroEquipo[];
  onAddHistoria?: () => void;
  onIniciarSprint?: () => void;
  /** Nombre del sprint actualmente activo (bloquea el inicio de este sprint) */
  sprintActivoNombre?: string;
  onEditSprint?: () => void;
  onDeleteSprint?: () => void;
  onViewHistoria?: (historia: HistoriaUsuario) => void;
  onEditHistoria?: (historia: HistoriaUsuario) => void;
  onDeleteHistoria?: (historia: HistoriaUsuario) => void;
  onCreateTarea?: (historiaId: number) => void;
  onEditTarea?: (tarea: Tarea) => void;
  onDeleteTarea?: (tarea: Tarea) => void;
  defaultOpen?: boolean;
  tareasRefreshKey?: number;
  // Acciones de validacion (solo para SCRUM_MASTER)
  onVerDocumento?: (historia: HistoriaUsuario) => void;
  onValidarHu?: (historia: HistoriaUsuario) => void;
  /** Modo solo lectura */
  isReadOnly?: boolean;
  /** Current user ID for task ownership checks */
  currentUserId?: number;
  /** Developer-only mode - restrict edit/delete to owned tasks */
  isDeveloperOnly?: boolean;
}

const estadoConfig: Record<string, { bg: string; text: string; label: string }> = {
  'Por hacer': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Por hacer' },
  'En progreso': { bg: 'bg-green-100', text: 'text-green-700', label: 'En progreso' },
  'Finalizado': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Finalizado' },
  // Fallback para valores antiguos (compatibilidad)
  'Planificado': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Por hacer' },
  'Activo': { bg: 'bg-green-100', text: 'text-green-700', label: 'En progreso' },
  'Completado': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Finalizado' },
};

export const SprintSection = memo(function SprintSection({
  sprint,
  historias,
  equipo = [],
  onAddHistoria,
  onIniciarSprint,
  sprintActivoNombre,
  onEditSprint,
  onDeleteSprint,
  onViewHistoria,
  onEditHistoria,
  onDeleteHistoria,
  onCreateTarea,
  onEditTarea,
  onDeleteTarea,
  defaultOpen = true,
  tareasRefreshKey,
  onVerDocumento,
  onValidarHu,
  isReadOnly = false,
  currentUserId,
  isDeveloperOnly = false,
}: SprintSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const estadoStyle = estadoConfig[sprint.estado] || estadoConfig['Por hacer'];
  const canIniciar = sprint.estado === 'Por hacer' || sprint.estado === 'Planificado';
  const isFinalizado = sprint.estado === 'Finalizado' || sprint.estado === 'Completado';

  const formatSprintDate = (date: string | null) => {
    if (!date) return '-';
    const parsedDate = parseLocalDate(date);
    if (!parsedDate) return '-';
    return parsedDate.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const totalPuntos = historias.reduce((acc, h) => acc + (h.storyPoints || 0), 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-lg bg-white">
        {/* Header */}
        <CollapsibleTrigger asChild>
          <div
            className={cn(
              'flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors',
              isOpen && 'border-b'
            )}
          >
            <div className="flex items-center gap-3">
              {isOpen ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}

              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900">
                  {sprint.nombre || `Tablero Sprint ${sprint.numero ?? sprint.id}`}
                </span>

                <span className="text-sm text-gray-500">
                  | {formatSprintDate(sprint.fechaInicio)} - {formatSprintDate(sprint.fechaFin)}
                </span>

                <Badge
                  variant="secondary"
                  className={cn('text-xs', estadoStyle.bg, estadoStyle.text)}
                >
                  {estadoStyle.label}
                </Badge>

                <span className="text-sm text-gray-600">
                  {historias.length} elementos
                </span>

                {totalPuntos > 0 && (
                  <span className="text-sm text-blue-600 font-medium">
                    {totalPuntos} pts
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {/* Editar y Eliminar solo visibles si el sprint NO está finalizado */}
              {!isFinalizado && onEditSprint && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onEditSprint}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              )}
              {!isFinalizado && onDeleteSprint && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={onDeleteSprint}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Eliminar
                </Button>
              )}
              {/* Botón Iniciar Sprint: habilitado solo si es el turno de este sprint */}
              {canIniciar && (
                sprintActivoNombre ? (
                  // Otro sprint está activo — mostrar deshabilitado con explicación
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            size="sm"
                            disabled
                            className="bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed gap-1"
                          >
                            <Lock className="h-3.5 w-3.5" />
                            Iniciar Sprint
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs text-center">
                        <p className="text-xs">
                          <strong>{sprintActivoNombre}</strong> está activo.
                          <br />
                          Debe finalizar primero para iniciar este sprint.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : onIniciarSprint ? (
                  <Button
                    size="sm"
                    className="bg-[#018CD1] hover:bg-[#0179b5] text-white"
                    onClick={onIniciarSprint}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Iniciar Sprint
                  </Button>
                ) : null
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Content */}
        <CollapsibleContent>
          <div className="p-4 pt-0">
            {/* Banner informativo cuando el sprint está en espera */}
            {sprintActivoNombre && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
                <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-800">Sprint en espera</p>
                  <p className="text-amber-700 mt-0.5">
                    <strong>{sprintActivoNombre}</strong> está activo. Este sprint no puede iniciarse
                    ni recibir nuevas tareas hasta que el sprint activo finalice.
                  </p>
                </div>
              </div>
            )}

            <HistoriaTable
              historias={historias}
              equipo={equipo}
              onView={onViewHistoria}
              onEdit={onEditHistoria}
              onDelete={onDeleteHistoria}
              onCreateTarea={sprintActivoNombre ? undefined : onCreateTarea}
              onEditTarea={sprintActivoNombre ? undefined : onEditTarea}
              onDeleteTarea={sprintActivoNombre ? undefined : onDeleteTarea}
              showSprintAction={false}
              tareasRefreshKey={tareasRefreshKey}
              onVerDocumento={onVerDocumento}
              onValidarHu={onValidarHu}
              currentUserId={currentUserId}
              isDeveloperOnly={isDeveloperOnly}
            />

            {/* Add historia button */}
            {onAddHistoria && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#018CD1] hover:text-[#0179b5] hover:bg-blue-50"
                  onClick={onAddHistoria}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar historia de usuario
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
});

SprintSection.displayName = 'SprintSection';
