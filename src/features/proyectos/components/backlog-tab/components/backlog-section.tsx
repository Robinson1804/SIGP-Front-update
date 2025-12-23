'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { type HistoriaUsuario } from '@/features/proyectos/services/historias.service';
import { HistoriaTable } from './historia-table';
import { cn } from '@/lib/utils';

interface BacklogSectionProps {
  historias: HistoriaUsuario[];
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  onCreateSprint?: () => void;
  onAssignToSprint?: () => void;
  onAddHistoria?: () => void;
  onViewHistoria?: (historia: HistoriaUsuario) => void;
  onEditHistoria?: (historia: HistoriaUsuario) => void;
  onDeleteHistoria?: (historia: HistoriaUsuario) => void;
  onAssignHistoriaToSprint?: (historia: HistoriaUsuario) => void;
  defaultOpen?: boolean;
}

export function BacklogSection({
  historias,
  selectedIds,
  onSelectionChange,
  onCreateSprint,
  onAssignToSprint,
  onAddHistoria,
  onViewHistoria,
  onEditHistoria,
  onDeleteHistoria,
  onAssignHistoriaToSprint,
  defaultOpen = true,
}: BacklogSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const hasSelection = selectedIds.length > 0;
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
                <span className="font-semibold text-gray-900">Backlog</span>

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
              {onCreateSprint && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCreateSprint}
                >
                  Crear Sprint
                </Button>
              )}

              {onAssignToSprint && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAssignToSprint}
                  disabled={!hasSelection}
                >
                  Asignar Sprint
                </Button>
              )}

              {onAddHistoria && (
                <Button
                  size="sm"
                  className="bg-[#018CD1] hover:bg-[#0179b5] text-white"
                  onClick={onAddHistoria}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar historia de usuario
                </Button>
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Content */}
        <CollapsibleContent>
          <div className="p-4 pt-0">
            {/* Selection info */}
            {hasSelection && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {selectedIds.length} historia(s) seleccionada(s)
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-700 hover:bg-blue-100"
                  onClick={() => onSelectionChange([])}
                >
                  Limpiar seleccion
                </Button>
              </div>
            )}

            <HistoriaTable
              historias={historias}
              showCheckbox={true}
              selectedIds={selectedIds}
              onSelectionChange={onSelectionChange}
              onView={onViewHistoria}
              onEdit={onEditHistoria}
              onDelete={onDeleteHistoria}
              onAssignToSprint={onAssignHistoriaToSprint}
              showSprintAction={true}
            />

            {historias.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No hay historias en el backlog</p>
                {onAddHistoria && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={onAddHistoria}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar primera historia
                  </Button>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
