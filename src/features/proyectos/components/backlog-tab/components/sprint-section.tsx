'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Play } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type Sprint } from '@/features/proyectos/services/sprints.service';
import { type HistoriaUsuario } from '@/features/proyectos/services/historias.service';
import { HistoriaTable } from './historia-table';
import { cn } from '@/lib/utils';

interface SprintSectionProps {
  sprint: Sprint;
  historias: HistoriaUsuario[];
  onAddHistoria?: () => void;
  onIniciarSprint?: () => void;
  onViewHistoria?: (historia: HistoriaUsuario) => void;
  onEditHistoria?: (historia: HistoriaUsuario) => void;
  onDeleteHistoria?: (historia: HistoriaUsuario) => void;
  defaultOpen?: boolean;
}

const estadoConfig: Record<string, { bg: string; text: string; label: string }> = {
  'Planificado': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Planificado' },
  'Activo': { bg: 'bg-green-100', text: 'text-green-700', label: 'Activo' },
  'Completado': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Completado' },
};

export function SprintSection({
  sprint,
  historias,
  onAddHistoria,
  onIniciarSprint,
  onViewHistoria,
  onEditHistoria,
  onDeleteHistoria,
  defaultOpen = true,
}: SprintSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const estadoStyle = estadoConfig[sprint.estado] || estadoConfig['Planificado'];
  const canIniciar = sprint.estado === 'Planificado';

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-PE', {
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
                  | {formatDate(sprint.fechaInicio)} - {formatDate(sprint.fechaFin)}
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
              onView={onViewHistoria}
              onEdit={onEditHistoria}
              onDelete={onDeleteHistoria}
              showSprintAction={false}
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
}
