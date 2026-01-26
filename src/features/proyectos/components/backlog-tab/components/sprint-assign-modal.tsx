'use client';

import { useState, useMemo } from 'react';
import { Loader2, Calendar, AlertTriangle } from 'lucide-react';
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { moverHistoriaASprint, type HistoriaUsuario } from '@/features/proyectos/services/historias.service';
import { type Sprint } from '@/features/proyectos/services/sprints.service';
import { formatDate } from '@/lib/utils';

interface SprintAssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  historiaIds: number[];
  sprints: Sprint[];
  onSuccess: () => void;
  /** Historias del backlog (para validar fechas) */
  historias?: HistoriaUsuario[];
}

// Función para validar si una HU tiene fechas fuera del rango del sprint
function checkHistoriaDateConflict(
  historia: HistoriaUsuario,
  sprint: Sprint
): { hasConflict: boolean; message: string } {
  if (!sprint.fechaInicio || !sprint.fechaFin) {
    return { hasConflict: false, message: '' };
  }

  const sprintInicio = new Date(sprint.fechaInicio.substring(0, 10) + 'T00:00:00');
  const sprintFin = new Date(sprint.fechaFin.substring(0, 10) + 'T00:00:00');
  const conflicts: string[] = [];

  if (historia.fechaInicio) {
    const huInicio = new Date(historia.fechaInicio.substring(0, 10) + 'T00:00:00');
    if (huInicio < sprintInicio || huInicio > sprintFin) {
      conflicts.push('fecha inicio');
    }
  }

  if (historia.fechaFin) {
    const huFin = new Date(historia.fechaFin.substring(0, 10) + 'T00:00:00');
    if (huFin < sprintInicio || huFin > sprintFin) {
      conflicts.push('fecha fin');
    }
  }

  if (conflicts.length > 0) {
    return {
      hasConflict: true,
      message: `${historia.codigo}: ${conflicts.join(' y ')} fuera del rango del sprint`,
    };
  }

  return { hasConflict: false, message: '' };
}

export function SprintAssignModal({
  open,
  onOpenChange,
  historiaIds,
  sprints,
  onSuccess,
  historias = [],
}: SprintAssignModalProps) {
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Obtener las historias que se van a asignar
  const historiasToAssign = useMemo(() => {
    return historias.filter(h => historiaIds.includes(h.id));
  }, [historias, historiaIds]);

  // Verificar conflictos de fechas cuando se selecciona un sprint
  const dateConflicts = useMemo(() => {
    if (!selectedSprintId) return [];

    const sprint = sprints.find(s => s.id.toString() === selectedSprintId);
    if (!sprint) return [];

    const conflicts: { codigo: string; conflictType: string }[] = [];
    historiasToAssign.forEach(historia => {
      // Solo verificar si la historia tiene fechas definidas
      if (historia.fechaInicio || historia.fechaFin) {
        const result = checkHistoriaDateConflict(historia, sprint);
        if (result.hasConflict) {
          conflicts.push({
            codigo: historia.codigo,
            conflictType: result.message.replace(`${historia.codigo}: `, ''),
          });
        }
      }
    });

    return conflicts;
  }, [selectedSprintId, sprints, historiasToAssign]);

  // No permitir asignar si hay conflictos de fechas
  const hasDateConflicts = dateConflicts.length > 0;

  const handleSubmit = async () => {
    if (!selectedSprintId || historiaIds.length === 0) return;

    // Bloquear si hay conflictos de fechas
    if (hasDateConflicts) {
      return;
    }

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

  const handleSprintChange = (value: string) => {
    setSelectedSprintId(value);
  };

  const activeSprint = sprints.find((s) => s.estado === 'En progreso' || s.estado === 'Activo');
  const plannedSprints = sprints.filter((s) => s.estado === 'Por hacer' || s.estado === 'Planificado');

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

          {/* Error de conflictos de fechas - bloquea la asignación */}
          {hasDateConflicts && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No se puede asignar: Fechas fuera de rango</AlertTitle>
              <AlertDescription>
                <p className="mb-2">Las siguientes historias tienen fechas que no coinciden con el rango del sprint:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {dateConflicts.map((conflict, index) => (
                    <li key={index}>
                      <span className="font-medium">{conflict.codigo}</span>: {conflict.conflictType}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-sm">
                  Modifique las fechas de las historias para que coincidan con el rango del sprint antes de asignarlas.
                </p>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Seleccionar Sprint</label>
            <Select value={selectedSprintId} onValueChange={handleSprintChange}>
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
                                  {formatDate(sprint.fechaInicio, {
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
            disabled={isSubmitting || !selectedSprintId || hasDateConflicts}
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
