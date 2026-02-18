'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getSprintsByProyecto,
  getSprintsBySubproyecto,
  type Sprint,
} from '@/features/proyectos/services/sprints.service';
import {
  getBacklog,
  getBacklogBySubproyecto,
  getHistoriasBySprint,
  type HistoriaUsuario,
  type BacklogData,
} from '@/features/proyectos/services/historias.service';
import {
  getEpicasByProyecto,
  getEpicasBySubproyecto,
  type Epica,
} from '@/features/proyectos/services/epicas.service';
import { apiClient, ENDPOINTS } from '@/lib/api';

export interface MiembroEquipo {
  id: number;
  usuarioId?: number;
  nombre: string;
}

export interface SprintWithHistorias extends Sprint {
  historias: HistoriaUsuario[];
}

export interface UseBacklogDataReturn {
  // Data
  sprints: SprintWithHistorias[];
  backlogHistorias: HistoriaUsuario[];
  epicas: Epica[];
  equipo: MiembroEquipo[];
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

export function useBacklogData(proyectoId: number, subproyectoId?: number): UseBacklogDataReturn {
  const [sprints, setSprints] = useState<SprintWithHistorias[]>([]);
  const [backlogHistorias, setBacklogHistorias] = useState<HistoriaUsuario[]>([]);
  const [backlogStats, setBacklogStats] = useState<UseBacklogDataReturn['backlogStats']>(null);
  const [epicas, setEpicas] = useState<Epica[]>([]);
  const [equipo, setEquipo] = useState<MiembroEquipo[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSprints, setIsLoadingSprints] = useState(false);
  const [isLoadingBacklog, setIsLoadingBacklog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEpicas = useCallback(async () => {
    try {
      const data = subproyectoId
        ? await getEpicasBySubproyecto(subproyectoId)
        : await getEpicasByProyecto(proyectoId);
      setEpicas(data);
    } catch (err) {
      console.error('Error fetching epicas:', err);
    }
  }, [proyectoId, subproyectoId]);

  const fetchEquipo = useCallback(async () => {
    try {
      // Obtener asignaciones del proyecto/subproyecto para mapear personalId -> nombre
      const endpoint = subproyectoId
        ? ENDPOINTS.RRHH.ASIGNACIONES_SUBPROYECTO(subproyectoId)
        : ENDPOINTS.RRHH.ASIGNACIONES_PROYECTO(proyectoId);
      const response = await apiClient.get(endpoint);
      // El backend envuelve la respuesta en { data: [...] }, pero el interceptor puede ya haberlo desenvuelto
      const responseData = response.data;
      const asignaciones = Array.isArray(responseData) ? responseData : (responseData?.data || responseData || []);

      const equipoMapeado: MiembroEquipo[] = asignaciones
        .map((asignacion: {
          id: number;
          personalId: number;
          personal?: {
            id: number;
            usuarioId?: number;
            nombres?: string;
            apellidos?: string;
            usuario?: {
              id: number;
              nombre?: string;
              apellido?: string;
            };
          };
        }) => {
          // Usar personalId como ID (es lo que se guarda en asignadoA)
          const id = asignacion.personalId || asignacion.personal?.id;

          if (!id) return null;

          // Obtener usuarioId del personal (vinculación con tabla usuarios)
          const usuarioId = asignacion.personal?.usuarioId || asignacion.personal?.usuario?.id;

          // Mostrar nombres + apellidos del personal
          const nombres = asignacion.personal?.nombres || '';
          const apellidos = asignacion.personal?.apellidos || '';
          const nombreCompleto = `${nombres} ${apellidos}`.trim() || `Personal ${id}`;

          return { id, usuarioId, nombre: nombreCompleto };
        })
        .filter((item: MiembroEquipo | null): item is MiembroEquipo => item !== null);

      setEquipo(equipoMapeado);
    } catch (err) {
      console.error('Error fetching equipo:', err);
    }
  }, [proyectoId, subproyectoId]);

  const fetchBacklog = useCallback(async () => {
    try {
      setIsLoadingBacklog(true);
      const data = subproyectoId
        ? await getBacklogBySubproyecto(subproyectoId)
        : await getBacklog(proyectoId);
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
  }, [proyectoId, subproyectoId]);

  const fetchSprintsWithHistorias = useCallback(async () => {
    try {
      setIsLoadingSprints(true);

      // Get ALL sprints for the project/subproyecto (including completed ones)
      const sprintsData = subproyectoId
        ? await getSprintsBySubproyecto(subproyectoId)
        : await getSprintsByProyecto(proyectoId);

      // Helper para verificar estados (soporta ambos formatos)
      const isEnProgreso = (estado: string) => estado === 'En progreso' || estado === 'Activo';
      const isPorHacer = (estado: string) => estado === 'Por hacer' || estado === 'Planificado';
      const isFinalizado = (estado: string) => estado === 'Finalizado' || estado === 'Completado';

      // Fetch historias for each sprint (ALL sprints, not just active)
      const sprintsWithHistorias = await Promise.all(
        sprintsData.map(async (sprint) => {
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

      // Sort: En progreso first, then Por hacer, then Finalizado - all by number
      sprintsWithHistorias.sort((a, b) => {
        // En progreso tiene prioridad
        if (isEnProgreso(a.estado) && !isEnProgreso(b.estado)) return -1;
        if (!isEnProgreso(a.estado) && isEnProgreso(b.estado)) return 1;
        // Luego Por hacer
        if (isPorHacer(a.estado) && isFinalizado(b.estado)) return -1;
        if (isFinalizado(a.estado) && isPorHacer(b.estado)) return 1;
        // Finalmente por número
        return a.numero - b.numero;
      });

      setSprints(sprintsWithHistorias);
    } catch (err) {
      console.error('Error fetching sprints:', err);
      throw err;
    } finally {
      setIsLoadingSprints(false);
    }
  }, [proyectoId, subproyectoId]);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await Promise.all([
        fetchSprintsWithHistorias(),
        fetchBacklog(),
        fetchEpicas(),
        fetchEquipo(),
      ]);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Error al cargar los datos del backlog');
    } finally {
      setIsLoading(false);
    }
  }, [fetchSprintsWithHistorias, fetchBacklog, fetchEpicas, fetchEquipo]);

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
    if (subproyectoId || proyectoId) {
      refresh();
    }
  }, [proyectoId, subproyectoId, refresh]);

  return {
    sprints,
    backlogHistorias,
    epicas,
    equipo,
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
