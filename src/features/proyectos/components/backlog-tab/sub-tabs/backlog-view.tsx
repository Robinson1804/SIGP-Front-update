'use client';

import { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { BacklogToolbar } from '../components/backlog-toolbar';
import { SprintSection } from '../components/sprint-section';
import { BacklogSection } from '../components/backlog-section';
import { type SprintWithHistorias } from '../hooks/use-backlog-data';
import { type HistoriaUsuario } from '@/features/proyectos/services/historias.service';
import { type Epica } from '@/features/proyectos/services/epicas.service';

interface BacklogViewProps {
  sprints: SprintWithHistorias[];
  backlogHistorias: HistoriaUsuario[];
  epicas: Epica[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  // Modal handlers
  onCreateHistoria?: (sprintId?: number) => void;
  onEditHistoria?: (historia: HistoriaUsuario) => void;
  onViewHistoria?: (historia: HistoriaUsuario) => void;
  onDeleteHistoria?: (historia: HistoriaUsuario) => void;
  onAssignToSprint?: (historiaIds: number[]) => void;
  onCreateSprint?: () => void;
  onIniciarSprint?: (sprintId: number) => void;
}

export function BacklogView({
  sprints,
  backlogHistorias,
  epicas,
  isLoading,
  error,
  onRefresh,
  onCreateHistoria,
  onEditHistoria,
  onViewHistoria,
  onDeleteHistoria,
  onAssignToSprint,
  onCreateSprint,
  onIniciarSprint,
}: BacklogViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEpicaId, setSelectedEpicaId] = useState('all');
  const [selectedBacklogIds, setSelectedBacklogIds] = useState<number[]>([]);

  // Filter function
  const filterHistorias = (historias: HistoriaUsuario[]) => {
    if (!historias || !Array.isArray(historias)) return [];
    return historias.filter((historia) => {
      // Search filter
      const matchesSearch =
        searchTerm === '' ||
        historia.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        historia.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (historia.notas?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

      // Epic filter
      const matchesEpica =
        selectedEpicaId === 'all' ||
        historia.epicaId?.toString() === selectedEpicaId;

      return matchesSearch && matchesEpica;
    });
  };

  // Filtered data
  const filteredSprints = useMemo(() => {
    return sprints.map((sprint) => ({
      ...sprint,
      historias: filterHistorias(sprint.historias),
    }));
  }, [sprints, searchTerm, selectedEpicaId]);

  const filteredBacklog = useMemo(() => {
    return filterHistorias(backlogHistorias);
  }, [backlogHistorias, searchTerm, selectedEpicaId]);

  // Clear selection when backlog changes
  const handleBacklogSelectionChange = (ids: number[]) => {
    setSelectedBacklogIds(ids);
  };

  const handleAssignSelected = () => {
    if (selectedBacklogIds.length > 0 && onAssignToSprint) {
      onAssignToSprint(selectedBacklogIds);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={onRefresh}
          className="text-[#018CD1] hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <BacklogToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedEpicaId={selectedEpicaId}
        onEpicaChange={setSelectedEpicaId}
        epicas={epicas}
      />

      {/* Sprint sections */}
      {filteredSprints.map((sprint) => (
        <SprintSection
          key={sprint.id}
          sprint={sprint}
          historias={sprint.historias}
          onAddHistoria={() => onCreateHistoria?.(sprint.id)}
          onIniciarSprint={
            sprint.estado === 'Planificado'
              ? () => onIniciarSprint?.(sprint.id)
              : undefined
          }
          onViewHistoria={onViewHistoria}
          onEditHistoria={onEditHistoria}
          onDeleteHistoria={onDeleteHistoria}
          defaultOpen={sprint.estado === 'Activo'}
        />
      ))}

      {/* Backlog section */}
      <BacklogSection
        historias={filteredBacklog}
        selectedIds={selectedBacklogIds}
        onSelectionChange={handleBacklogSelectionChange}
        onCreateSprint={onCreateSprint}
        onAssignToSprint={handleAssignSelected}
        onAddHistoria={() => onCreateHistoria?.()}
        onViewHistoria={onViewHistoria}
        onEditHistoria={onEditHistoria}
        onDeleteHistoria={onDeleteHistoria}
        onAssignHistoriaToSprint={(h) => onAssignToSprint?.([h.id])}
      />
    </div>
  );
}
