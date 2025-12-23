'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Target,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { Sprint, HistoriaUsuario } from '@/features/proyectos/types';
import {
  getSprintHistorias,
  updateSprint,
} from '@/features/proyectos/services/sprints.service';
import { updateHistoria } from '@/features/proyectos/services/historias.service';

interface SprintPlanningViewProps {
  proyectoId: number;
  sprint: Sprint;
  backlogHistorias: HistoriaUsuario[];
  onSuccess: () => void;
}

const PRIORIDAD_COLORS: Record<string, string> = {
  Must: 'bg-red-100 text-red-800 border-red-200',
  Should: 'bg-orange-100 text-orange-800 border-orange-200',
  Could: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Wont: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function SprintPlanningView({
  proyectoId,
  sprint,
  backlogHistorias,
  onSuccess,
}: SprintPlanningViewProps) {
  const [sprintHistorias, setSprintHistorias] = useState<HistoriaUsuario[]>([]);
  const [availableHistorias, setAvailableHistorias] = useState<HistoriaUsuario[]>(
    backlogHistorias
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedBacklog, setSelectedBacklog] = useState<number[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<number[]>([]);

  useEffect(() => {
    loadSprintHistorias();
  }, [sprint.id]);

  const loadSprintHistorias = async () => {
    try {
      setIsLoading(true);
      const historias = await getSprintHistorias(sprint.id);
      setSprintHistorias(historias);

      // Filter out historias already in sprint from available
      const sprintIds = new Set(historias.map((h: HistoriaUsuario) => h.id));
      setAvailableHistorias(backlogHistorias.filter((h) => !sprintIds.has(h.id)));
    } catch (err) {
      console.error('Error loading sprint historias:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const moveToSprint = async () => {
    if (selectedBacklog.length === 0) return;

    try {
      setIsSaving(true);

      // Update each historia to assign to sprint
      await Promise.all(
        selectedBacklog.map((id) =>
          updateHistoria(id, { sprintId: sprint.id })
        )
      );

      // Update local state
      const movedHistorias = availableHistorias.filter((h) =>
        selectedBacklog.includes(h.id)
      );
      setSprintHistorias([...sprintHistorias, ...movedHistorias]);
      setAvailableHistorias(
        availableHistorias.filter((h) => !selectedBacklog.includes(h.id))
      );
      setSelectedBacklog([]);
    } catch (err) {
      console.error('Error moving historias to sprint:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const moveToBacklog = async () => {
    if (selectedSprint.length === 0) return;

    try {
      setIsSaving(true);

      // Update each historia to remove from sprint
      await Promise.all(
        selectedSprint.map((id) =>
          updateHistoria(id, { sprintId: null })
        )
      );

      // Update local state
      const movedHistorias = sprintHistorias.filter((h) =>
        selectedSprint.includes(h.id)
      );
      setAvailableHistorias([...availableHistorias, ...movedHistorias]);
      setSprintHistorias(
        sprintHistorias.filter((h) => !selectedSprint.includes(h.id))
      );
      setSelectedSprint([]);
    } catch (err) {
      console.error('Error moving historias to backlog:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleBacklogSelection = (id: number) => {
    setSelectedBacklog((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSprintSelection = (id: number) => {
    setSelectedSprint((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Calculate totals
  const backlogSP = availableHistorias.reduce((sum, h) => sum + (h.puntos || 0), 0);
  const sprintSP = sprintHistorias.reduce((sum, h) => sum + (h.puntos || 0), 0);
  const capacidad = sprint.velocidadPlanificada || 0;
  const capacidadRestante = capacidad - sprintSP;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sprint info header */}
      <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span className="font-medium">{sprint.objetivo || 'Sin objetivo definido'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            {sprint.fechaInicio && sprint.fechaFin && (
              <span>
                {new Date(sprint.fechaInicio).toLocaleDateString('es-PE')} -{' '}
                {new Date(sprint.fechaFin).toLocaleDateString('es-PE')}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-gray-500">Capacidad:</span>{' '}
            <strong className={capacidadRestante < 0 ? 'text-red-600' : 'text-green-600'}>
              {sprintSP}/{capacidad} SP
            </strong>
            {capacidadRestante < 0 && (
              <span className="text-red-500 ml-2">
                ({Math.abs(capacidadRestante)} SP excedido)
              </span>
            )}
          </div>
          <Button onClick={onSuccess} variant="outline" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Finalizar Planning
          </Button>
        </div>
      </div>

      {/* Split view */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4">
        {/* Backlog column */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                Product Backlog
                <Badge variant="secondary">{availableHistorias.length}</Badge>
              </CardTitle>
              <span className="text-sm text-gray-500">{backlogSP} SP</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              {availableHistorias.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No hay historias en el backlog
                </div>
              ) : (
                <div className="divide-y">
                  {availableHistorias.map((historia) => (
                    <HistoriaItem
                      key={historia.id}
                      historia={historia}
                      isSelected={selectedBacklog.includes(historia.id)}
                      onToggle={() => toggleBacklogSelection(historia.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex flex-col items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={moveToSprint}
            disabled={selectedBacklog.length === 0 || isSaving}
            className="h-10 w-10"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={moveToBacklog}
            disabled={selectedSprint.length === 0 || isSaving}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Sprint column */}
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-blue-900">
                {sprint.nombre}
                <Badge variant="secondary">{sprintHistorias.length}</Badge>
              </CardTitle>
              <span
                className={`text-sm font-medium ${
                  capacidadRestante < 0 ? 'text-red-600' : 'text-blue-600'
                }`}
              >
                {sprintSP} SP
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              {sprintHistorias.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Selecciona historias del backlog para agregar al sprint
                </div>
              ) : (
                <div className="divide-y">
                  {sprintHistorias.map((historia) => (
                    <HistoriaItem
                      key={historia.id}
                      historia={historia}
                      isSelected={selectedSprint.includes(historia.id)}
                      onToggle={() => toggleSprintSelection(historia.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface HistoriaItemProps {
  historia: HistoriaUsuario;
  isSelected: boolean;
  onToggle: () => void;
}

function HistoriaItem({ historia, isSelected, onToggle }: HistoriaItemProps) {
  return (
    <div
      className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer ${
        isSelected ? 'bg-blue-50' : ''
      }`}
      onClick={onToggle}
    >
      <Checkbox checked={isSelected} onCheckedChange={onToggle} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-500">{historia.codigo}</span>
          {historia.prioridad && (
            <Badge
              variant="outline"
              className={`text-xs ${PRIORIDAD_COLORS[historia.prioridad] || ''}`}
            >
              {historia.prioridad}
            </Badge>
          )}
        </div>
        <p className="text-sm font-medium truncate">{historia.titulo}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {historia.puntos || 0} SP
        </Badge>
      </div>
    </div>
  );
}
