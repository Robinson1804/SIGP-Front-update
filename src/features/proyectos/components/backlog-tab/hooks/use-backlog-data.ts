'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getSprintsByProyecto,
  type Sprint,
} from '@/features/proyectos/services/sprints.service';
import {
  getBacklog,
  getHistoriasBySprint,
  type HistoriaUsuario,
  type BacklogData,
} from '@/features/proyectos/services/historias.service';
import {
  getEpicasByProyecto,
  type Epica,
} from '@/features/proyectos/services/epicas.service';

export interface SprintWithHistorias extends Sprint {
  historias: HistoriaUsuario[];
}

export interface UseBacklogDataReturn {
  // Data
  sprints: SprintWithHistorias[];
  backlogHistorias: HistoriaUsuario[];
  epicas: Epica[];
  backlogStats: {
    total: number;
    porPrioridad: Record<string, number>;
    porEstado: Record<string, number>;
  } | null;

  // Loading states
  isLoading: boolean;
  isLoadingSprints: boolean;
  isLoadingBacklog: boolean;

  // Error
  error: string | null;

  // Actions
  refresh: () => Promise<void>;
  refreshSprint: (sprintId: number) => Promise<void>;
  refreshBacklog: () => Promise<void>;
}

export function useBacklogData(proyectoId: number): UseBacklogDataReturn {
  const [sprints, setSprints] = useState<SprintWithHistorias[]>([]);
  const [backlogHistorias, setBacklogHistorias] = useState<HistoriaUsuario[]>([]);
  const [backlogStats, setBacklogStats] = useState<UseBacklogDataReturn['backlogStats']>(null);
  const [epicas, setEpicas] = useState<Epica[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSprints, setIsLoadingSprints] = useState(false);
  const [isLoadingBacklog, setIsLoadingBacklog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEpicas = useCallback(async () => {
    try {
      const data = await getEpicasByProyecto(proyectoId);
      setEpicas(data);
    } catch (err) {
      console.error('Error fetching epicas:', err);
    }
  }, [proyectoId]);

  const fetchBacklog = useCallback(async () => {
    try {
      setIsLoadingBacklog(true);
      const data = await getBacklog(proyectoId);
      setBacklogHistorias(data.backlog || []);
      setBacklogStats(data.metricas || {
        total: 0,
        porPrioridad: {},
        porEstado: {},
      });
    } catch (err) {
      console.error('Error fetching backlog:', err);
      throw err;
    } finally {
      setIsLoadingBacklog(false);
    }
  }, [proyectoId]);

  const fetchSprintsWithHistorias = useCallback(async () => {
    try {
      setIsLoadingSprints(true);

      // Get all sprints for the project
      const sprintsData = await getSprintsByProyecto(proyectoId);

      // Filter to non-completed sprints (Activo and Planificado)
      const activeSprints = sprintsData.filter(
        (s) => s.estado === 'Activo' || s.estado === 'Planificado'
      );

      // Fetch historias for each sprint
      const sprintsWithHistorias = await Promise.all(
        activeSprints.map(async (sprint) => {
          try {
            const historias = await getHistoriasBySprint(sprint.id);
            return {
              ...sprint,
              historias,
            };
          } catch {
            return {
              ...sprint,
              historias: [],
            };
          }
        })
      );

      // Sort: Activo first, then Planificado by number
      sprintsWithHistorias.sort((a, b) => {
        if (a.estado === 'Activo' && b.estado !== 'Activo') return -1;
        if (a.estado !== 'Activo' && b.estado === 'Activo') return 1;
        return a.numero - b.numero;
      });

      setSprints(sprintsWithHistorias);
    } catch (err) {
      console.error('Error fetching sprints:', err);
      throw err;
    } finally {
      setIsLoadingSprints(false);
    }
  }, [proyectoId]);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await Promise.all([
        fetchSprintsWithHistorias(),
        fetchBacklog(),
        fetchEpicas(),
      ]);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Error al cargar los datos del backlog');
    } finally {
      setIsLoading(false);
    }
  }, [fetchSprintsWithHistorias, fetchBacklog, fetchEpicas]);

  const refreshSprint = useCallback(async (sprintId: number) => {
    try {
      const historias = await getHistoriasBySprint(sprintId);
      setSprints((prev) =>
        prev.map((s) =>
          s.id === sprintId ? { ...s, historias } : s
        )
      );
    } catch (err) {
      console.error('Error refreshing sprint:', err);
    }
  }, []);

  const refreshBacklog = useCallback(async () => {
    await fetchBacklog();
  }, [fetchBacklog]);

  // Initial load
  useEffect(() => {
    if (proyectoId) {
      refresh();
    }
  }, [proyectoId, refresh]);

  return {
    sprints,
    backlogHistorias,
    epicas,
    backlogStats,
    isLoading,
    isLoadingSprints,
    isLoadingBacklog,
    error,
    refresh,
    refreshSprint,
    refreshBacklog,
  };
}
