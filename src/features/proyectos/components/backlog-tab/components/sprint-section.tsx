'use client';

import { useState, memo } from 'react';
import { ChevronDown, ChevronRight, Plus, Play, Pencil, Trash2 } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
                  Tablero Sprint {sprint.numero}
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
              {canIniciar && onIniciarSprint && (
                <Button
                  size="sm"
                  className="bg-[#018CD1] hover:bg-[#0179b5] text-white"
                  onClick={onIniciarSprint}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Iniciar Sprint
                </Button>
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Content */}
        <CollapsibleContent>
          <div className="p-4 pt-0">
            <HistoriaTable
              historias={historias}
              equipo={equipo}
              onView={onViewHistoria}
              onEdit={onEditHistoria}
              onDelete={onDeleteHistoria}
              onCreateTarea={onCreateTarea}
              onEditTarea={onEditTarea}
              onDeleteTarea={onDeleteTarea}
              showSprintAction={false}
              tareasRefreshKey={tareasRefreshKey}
              onVerDocumento={onVerDocumento}
              onValidarHu={onValidarHu}
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
