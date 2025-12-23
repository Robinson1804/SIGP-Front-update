'use client';

import { useState } from 'react';
import { Loader2, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { moverHistoriaASprint } from '@/features/proyectos/services/historias.service';
import { type Sprint } from '@/features/proyectos/services/sprints.service';

interface SprintAssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  historiaIds: number[];
  sprints: Sprint[];
  onSuccess: () => void;
}

export function SprintAssignModal({
  open,
  onOpenChange,
  historiaIds,
  sprints,
  onSuccess,
}: SprintAssignModalProps) {
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedSprintId || historiaIds.length === 0) return;

    try {
      setIsSubmitting(true);

      // Assign all selected historias to the sprint
      await Promise.all(
        historiaIds.map((id) =>
          moverHistoriaASprint(id, parseInt(selectedSprintId))
        )
      );

      setSelectedSprintId('');
      onSuccess();
    } catch (err) {
      console.error('Error assigning to sprint:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedSprintId('');
    }
    onOpenChange(newOpen);
  };

  const activeSprint = sprints.find((s) => s.estado === 'Activo');
  const plannedSprints = sprints.filter((s) => s.estado === 'Planificado');

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Asignar a Sprint
          </DialogTitle>
          <DialogDescription>
            Asigna {historiaIds.length} historia(s) seleccionada(s) a un sprint.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            {historiaIds.length} historia(s) seran asignadas al sprint seleccionado.
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Seleccionar Sprint</label>
            <Select value={selectedSprintId} onValueChange={setSelectedSprintId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un sprint" />
              </SelectTrigger>
              <SelectContent>
                {sprints.length === 0 ? (
                  <div className="text-center py-4 text-sm text-gray-500">
                    No hay sprints disponibles
                  </div>
                ) : (
                  <>
                    {activeSprint && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                          Sprint Activo
                        </div>
                        <SelectItem value={activeSprint.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span>Sprint {activeSprint.numero}</span>
                            <Badge variant="default" className="text-xs bg-green-600">
                              Activo
                            </Badge>
                          </div>
                        </SelectItem>
                      </>
                    )}

                    {plannedSprints.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                          Sprints Planificados
                        </div>
                        {plannedSprints.map((sprint) => (
                          <SelectItem key={sprint.id} value={sprint.id.toString()}>
                            <div className="flex items-center gap-2">
                              <span>Sprint {sprint.numero}</span>
                              {sprint.fechaInicio && (
                                <span className="text-xs text-gray-500">
                                  {new Date(sprint.fechaInicio).toLocaleDateString('es-PE', {
                                    day: 'numeric',
                                    month: 'short',
                                  })}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </>
                )}
              </SelectContent>
            </Select>

            {sprints.length === 0 && (
              <p className="text-xs text-gray-500">
                Crea un sprint primero para poder asignar historias.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedSprintId}
            className="bg-[#018CD1] hover:bg-[#0179b5]"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Asignar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
