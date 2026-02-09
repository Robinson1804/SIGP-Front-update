'use client';

import { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { BacklogToolbar } from '../components/backlog-toolbar';
import { SprintSection } from '../components/sprint-section';
import { BacklogSection } from '../components/backlog-section';
import { type SprintWithHistorias } from '../hooks/use-backlog-data';
import { type HistoriaUsuario } from '@/features/proyectos/services/historias.service';
import { type Tarea } from '@/features/proyectos/services/tareas.service';
import { type Epica } from '@/features/proyectos/services/epicas.service';

interface MiembroEquipo {
  id: number;
  nombre: string;
}

interface BacklogViewProps {
  sprints: SprintWithHistorias[];
  backlogHistorias: HistoriaUsuario[];
  epicas: Epica[];
  equipo?: MiembroEquipo[];
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
  onEditSprint?: (sprint: SprintWithHistorias) => void;
  onDeleteSprint?: (sprint: SprintWithHistorias) => void;
  onCreateTarea?: (historiaId: number) => void;
  onEditTarea?: (tarea: Tarea) => void;
  onDeleteTarea?: (tarea: Tarea) => void;
  tareasRefreshKey?: number;
  // Acciones de validacion (solo para SCRUM_MASTER)
  onVerDocumento?: (historia: HistoriaUsuario) => void;
  onValidarHu?: (historia: HistoriaUsuario) => void;
  /** Modo solo lectura - deshabilita todas las acciones de edición */
  isReadOnly?: boolean;
  /** Current user ID for task ownership checks */
  currentUserId?: number;
  /** Developer-only mode - restrict edit/delete to owned tasks */
  isDeveloperOnly?: boolean;
}

export function BacklogView({
  sprints,
  backlogHistorias,
  epicas,
  equipo = [],
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
  onEditSprint,
  onDeleteSprint,
  onCreateTarea,
  onEditTarea,
  onDeleteTarea,
  tareasRefreshKey,
  onVerDocumento,
  onValidarHu,
  isReadOnly = false,
  currentUserId,
  isDeveloperOnly = false,
}: BacklogViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEpicaId, setSelectedEpicaId] = useState('all');
  const [selectedBacklogIds, setSelectedBacklogIds] = useState<number[]>([]);
  const [selectedSprintEstado, setSelectedSprintEstado] = useState('todos');

  // Helpers para identificar estados de sprint (soporta formatos nuevos y antiguos)
  const isActivo = (estado: string) => estado === 'En progreso' || estado === 'Activo';
  const isPlanificado = (estado: string) => estado === 'Por hacer' || estado === 'Planificado';
  const isFinalizado = (estado: string) => estado === 'Finalizado' || estado === 'Completado';

  // Contadores de sprints por estado
  const sprintCounts = useMemo(() => ({
    total: sprints.length,
    activo: sprints.filter((s) => isActivo(s.estado)).length,
    planificados: sprints.filter((s) => isPlanificado(s.estado)).length,
    finalizados: sprints.filter((s) => isFinalizado(s.estado)).length,
  }), [sprints]);

  // Filtrar sprints por estado seleccionado
  const sprintsFiltradosPorEstado = useMemo(() => {
    return sprints.filter((s) => {
      if (selectedSprintEstado === 'todos') return true;
      if (selectedSprintEstado === 'no_finalizado') return isActivo(s.estado) || isPlanificado(s.estado);
      if (selectedSprintEstado === 'en_progreso') return isActivo(s.estado);
      if (selectedSprintEstado === 'por_hacer') return isPlanificado(s.estado);
      if (selectedSprintEstado === 'finalizado') return isFinalizado(s.estado);
      return true;
    });
  }, [sprints, selectedSprintEstado]);

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

  // Filtered data - aplica filtro de estado de sprint + filtro de historias
  const filteredSprints = useMemo(() => {
    return sprintsFiltradosPorEstado.map((sprint) => ({
      ...sprint,
      historias: filterHistorias(sprint.historias),
    }));
  }, [sprintsFiltradosPorEstado, searchTerm, selectedEpicaId]);

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
        selectedSprintEstado={selectedSprintEstado}
        onSprintEstadoChange={setSelectedSprintEstado}
        sprintCounts={sprintCounts}
      />

      {/* Sprint sections */}
      {filteredSprints.map((sprint) => (
        <SprintSection
          key={sprint.id}
          sprint={sprint}
          historias={sprint.historias}
          equipo={equipo}
          onAddHistoria={isReadOnly || !onCreateHistoria ? undefined : () => onCreateHistoria(sprint.id)}
          onIniciarSprint={
            isReadOnly || !onIniciarSprint ? undefined :
            (sprint.estado === 'Por hacer' || sprint.estado === 'Planificado')
              ? () => onIniciarSprint(sprint.id)
              : undefined
          }
          onEditSprint={isReadOnly || !onEditSprint ? undefined : () => onEditSprint(sprint)}
          onDeleteSprint={isReadOnly || !onDeleteSprint ? undefined : () => onDeleteSprint(sprint)}
          onViewHistoria={onViewHistoria}
          onEditHistoria={isReadOnly ? undefined : onEditHistoria}
          onDeleteHistoria={isReadOnly ? undefined : onDeleteHistoria}
          onCreateTarea={isReadOnly ? undefined : onCreateTarea}
          onEditTarea={isReadOnly ? undefined : onEditTarea}
          onDeleteTarea={isReadOnly ? undefined : onDeleteTarea}
          defaultOpen={sprint.estado === 'En progreso' || sprint.estado === 'Activo'}
          tareasRefreshKey={tareasRefreshKey}
          onVerDocumento={onVerDocumento}
          onValidarHu={isReadOnly ? undefined : onValidarHu}
          isReadOnly={isReadOnly}
          currentUserId={currentUserId}
          isDeveloperOnly={isDeveloperOnly}
        />
      ))}

      {/* Backlog section - Sin opción de crear tareas (solo en Sprints) */}
      <BacklogSection
        historias={filteredBacklog}
        equipo={equipo}
        selectedIds={selectedBacklogIds}
        onSelectionChange={isReadOnly ? undefined : handleBacklogSelectionChange}
        onCreateSprint={isReadOnly ? undefined : onCreateSprint}
        onAssignToSprint={isReadOnly ? undefined : handleAssignSelected}
        onAddHistoria={isReadOnly || !onCreateHistoria ? undefined : () => onCreateHistoria()}
        onViewHistoria={onViewHistoria}
        onEditHistoria={isReadOnly ? undefined : onEditHistoria}
        onDeleteHistoria={isReadOnly ? undefined : onDeleteHistoria}
        onAssignHistoriaToSprint={isReadOnly || !onAssignToSprint ? undefined : (h) => onAssignToSprint([h.id])}
        onVerDocumento={onVerDocumento}
        onValidarHu={isReadOnly ? undefined : onValidarHu}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}
