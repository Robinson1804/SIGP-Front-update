'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getSprintsByProyecto,
  getSprintHistorias,
  type Sprint,
} from '@/features/proyectos/services/sprints.service';
import {
  type HistoriaUsuario,
  type HistoriaEstado,
  cambiarEstadoHistoria,
} from '@/features/proyectos/services/historias.service';
import {
  getTareasByHistoria,
  moverTarea,
  type Tarea,
  type TareaEstado,
} from '@/features/proyectos/services/tareas.service';

// ============================================
// TIPOS
// ============================================

/**
 * Historia de usuario con tareas cargadas
 */
export interface HistoriaConTareas extends HistoriaUsuario {
  tareas: Tarea[];
}

/**
 * Tarea con información de la historia padre
 */
export interface TareaConHistoria extends Tarea {
  historia: HistoriaUsuario;
}

/**
 * Columna del tablero Kanban (basado en estado de HU)
 */
export interface TableroColumnaHU {
  id: HistoriaEstado;
  nombre: string;
  historias: HistoriaConTareas[];
  totalHistorias: number;
  totalPuntos: number;
}

/**
 * Columna del tablero Kanban (basado en tareas) - legacy
 */
export interface TableroColumna {
  id: TareaEstado;
  nombre: string;
  tareas: TareaConHistoria[];
  totalTareas: number;
}

/**
 * Metricas del tablero
 */
export interface TableroMetricas {
  totalHistorias: number;
  totalTareas: number;
  tareasCompletadas: number;
  totalPuntos: number;
  puntosCompletados: number;
}

/**
 * Datos completos del tablero
 */
export interface TableroData {
  sprint: Sprint | null;
  columnas: TableroColumna[];
  columnasHU: TableroColumnaHU[];
  metricas: TableroMetricas;
  historias: HistoriaConTareas[];
}

/**
 * Resultado del hook useTableroData
 */
export interface UseTableroDataReturn {
  // Data
  tableroData: TableroData | null;
  sprints: Sprint[];
  selectedSprintId: number | null;

  // Loading states
  isLoading: boolean;
  isLoadingSprints: boolean;

  // Error
  error: string | null;

  // Actions
  setSelectedSprintId: (id: number | null) => void;
  moverTareaEnTablero: (tareaId: number, nuevoEstado: TareaEstado, orden?: number) => Promise<void>;
  moverHistoriaEnTablero: (historiaId: number, nuevoEstado: HistoriaEstado) => Promise<void>;
  cambiarEstadoHU: (historiaId: number, nuevoEstado: HistoriaEstado) => Promise<void>;
  refresh: () => Promise<void>;
}

// Estados de las tareas para las columnas del tablero (legacy)
const COLUMNAS_TABLERO: { id: TareaEstado; nombre: string }[] = [
  { id: 'Por hacer', nombre: 'Por hacer' },
  { id: 'En progreso', nombre: 'En progreso' },
  { id: 'En revision', nombre: 'En revisión' },
  { id: 'Finalizado', nombre: 'Finalizado' },
];

// Estados de las HU para las columnas del tablero
const COLUMNAS_HU: { id: HistoriaEstado; nombre: string }[] = [
  { id: 'Por hacer', nombre: 'Por hacer' },
  { id: 'En progreso', nombre: 'En progreso' },
  { id: 'En revision', nombre: 'En revisión' },
  { id: 'Finalizado', nombre: 'Finalizado' },
];

// ============================================
// HOOK
// ============================================

export function useTableroData(proyectoId: number): UseTableroDataReturn {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null);
  const [tableroData, setTableroData] = useState<TableroData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSprints, setIsLoadingSprints] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Cargar sprints del proyecto
   */
  const fetchSprints = useCallback(async () => {
    try {
      setIsLoadingSprints(true);
      const sprintsData = await getSprintsByProyecto(proyectoId);

      // Filtrar sprints activos y planificados (soporta ambos formatos de estado)
      const isEnProgreso = (estado: string) => estado === 'En progreso' || estado === 'Activo';
      const isPorHacer = (estado: string) => estado === 'Por hacer' || estado === 'Planificado';

      const activeSprints = sprintsData.filter(
        (s) => isEnProgreso(s.estado) || isPorHacer(s.estado)
      );

      // Ordenar: En progreso primero, luego Por hacer por numero
      activeSprints.sort((a, b) => {
        if (isEnProgreso(a.estado) && !isEnProgreso(b.estado)) return -1;
        if (!isEnProgreso(a.estado) && isEnProgreso(b.estado)) return 1;
        return a.numero - b.numero;
      });

      setSprints(activeSprints);

      // Auto-seleccionar el primer sprint en progreso
      if (activeSprints.length > 0 && !selectedSprintId) {
        const sprintActivo = activeSprints.find((s) => isEnProgreso(s.estado));
        setSelectedSprintId(sprintActivo?.id || activeSprints[0].id);
      }
    } catch (err) {
      console.error('Error fetching sprints:', err);
      setError('Error al cargar los sprints');
    } finally {
      setIsLoadingSprints(false);
    }
  }, [proyectoId, selectedSprintId]);

  /**
   * Cargar datos del tablero para el sprint seleccionado
   * AHORA MUESTRA TAREAS DIRECTAMENTE EN LAS COLUMNAS
   */
  const fetchTableroData = useCallback(async () => {
    if (!selectedSprintId) {
      setTableroData(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Obtener sprint actual
      const sprint = sprints.find((s) => s.id === selectedSprintId) || null;

      // Obtener historias del sprint
      const historias: HistoriaUsuario[] = await getSprintHistorias(selectedSprintId);

      // Cargar tareas para cada historia
      const historiasConTareas: HistoriaConTareas[] = await Promise.all(
        historias.map(async (historia) => {
          try {
            const tareas = await getTareasByHistoria(historia.id);
            return { ...historia, tareas };
          } catch {
            return { ...historia, tareas: [] };
          }
        })
      );

      // Aplanar todas las tareas con referencia a su historia
      const todasLasTareas: TareaConHistoria[] = historiasConTareas.flatMap((historia) =>
        historia.tareas.map((tarea) => ({
          ...tarea,
          historia: historia,
        }))
      );

      // Agrupar tareas por estado en columnas (legacy)
      const columnas: TableroColumna[] = COLUMNAS_TABLERO.map((col) => {
        const tareasEnColumna = todasLasTareas.filter((t) => t.estado === col.id);

        return {
          ...col,
          tareas: tareasEnColumna,
          totalTareas: tareasEnColumna.length,
        };
      });

      // Agrupar HUs por estado en columnas
      const columnasHU: TableroColumnaHU[] = COLUMNAS_HU.map((col) => {
        const historiasEnColumna = historiasConTareas.filter((h) => h.estado === col.id);

        return {
          ...col,
          historias: historiasEnColumna,
          totalHistorias: historiasEnColumna.length,
          totalPuntos: historiasEnColumna.reduce((acc, h) => acc + (h.storyPoints || 0), 0),
        };
      });

      // Calcular metricas
      const metricas: TableroMetricas = {
        totalHistorias: historiasConTareas.length,
        totalTareas: todasLasTareas.length,
        tareasCompletadas: todasLasTareas.filter((t) => t.estado === 'Finalizado').length,
        totalPuntos: historiasConTareas.reduce((acc, h) => acc + (h.storyPoints || 0), 0),
        puntosCompletados: historiasConTareas
          .filter((h) => h.estado === 'Finalizado')
          .reduce((acc, h) => acc + (h.storyPoints || 0), 0),
      };

      setTableroData({
        sprint,
        columnas,
        columnasHU,
        metricas,
        historias: historiasConTareas,
      });
    } catch (err) {
      console.error('Error fetching tablero data:', err);
      setError('Error al cargar el tablero');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSprintId, sprints]);

  /**
   * Mover una tarea a un nuevo estado (drag & drop)
   */
  const moverTareaEnTablero = useCallback(
    async (tareaId: number, nuevoEstado: TareaEstado, orden?: number) => {
      try {
        await moverTarea(tareaId, nuevoEstado, orden ?? 0);

        // Actualizar estado local optimisticamente
        if (tableroData) {
          setTableroData((prev) => {
            if (!prev) return prev;

            // Mover la tarea de una columna a otra
            const nuevasColumnas = prev.columnas.map((col) => {
              // Quitar la tarea de la columna actual
              const tareasActualizadas = col.tareas.filter((t) => t.id !== tareaId);

              // Si es la columna destino, agregar la tarea
              if (col.id === nuevoEstado) {
                const tareaMovida = prev.columnas
                  .flatMap((c) => c.tareas)
                  .find((t) => t.id === tareaId);

                if (tareaMovida) {
                  tareasActualizadas.push({ ...tareaMovida, estado: nuevoEstado });
                }
              }

              return {
                ...col,
                tareas: tareasActualizadas,
                totalTareas: tareasActualizadas.length,
              };
            });

            return { ...prev, columnas: nuevasColumnas };
          });
        }

        // Refrescar datos completos
        await fetchTableroData();
      } catch (err) {
        console.error('Error moving task:', err);
        throw err;
      }
    },
    [tableroData, fetchTableroData]
  );

  /**
   * Mover una historia de usuario a un nuevo estado (drag & drop en tablero HU)
   */
  const moverHistoriaEnTablero = useCallback(
    async (historiaId: number, nuevoEstado: HistoriaEstado) => {
      try {
        await cambiarEstadoHistoria(historiaId, nuevoEstado);

        // Actualizar estado local optimisticamente
        if (tableroData) {
          setTableroData((prev) => {
            if (!prev) return prev;

            // Mover la historia de una columna a otra
            const nuevasColumnasHU = prev.columnasHU.map((col) => {
              // Quitar la historia de la columna actual
              const historiasActualizadas = col.historias.filter((h) => h.id !== historiaId);

              // Si es la columna destino, agregar la historia
              if (col.id === nuevoEstado) {
                const historiaMovida = prev.columnasHU
                  .flatMap((c) => c.historias)
                  .find((h) => h.id === historiaId);

                if (historiaMovida) {
                  historiasActualizadas.push({ ...historiaMovida, estado: nuevoEstado });
                }
              }

              return {
                ...col,
                historias: historiasActualizadas,
                totalHistorias: historiasActualizadas.length,
                totalPuntos: historiasActualizadas.reduce((acc, h) => acc + (h.storyPoints || 0), 0),
              };
            });

            return { ...prev, columnasHU: nuevasColumnasHU };
          });
        }

        // Refrescar datos completos
        await fetchTableroData();
      } catch (err) {
        console.error('Error moving historia:', err);
        throw err;
      }
    },
    [tableroData, fetchTableroData]
  );

  /**
   * Cambiar estado de una historia de usuario
   */
  const cambiarEstadoHU = useCallback(
    async (historiaId: number, nuevoEstado: HistoriaEstado) => {
      try {
        await cambiarEstadoHistoria(historiaId, nuevoEstado);
        await fetchTableroData();
      } catch (err) {
        console.error('Error changing historia status:', err);
        throw err;
      }
    },
    [fetchTableroData]
  );

  /**
   * Refrescar todos los datos
   */
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await fetchSprints();
      await fetchTableroData();
    } catch (err) {
      console.error('Error refreshing tablero:', err);
      setError('Error al actualizar el tablero');
    } finally {
      setIsLoading(false);
    }
  }, [fetchSprints, fetchTableroData]);

  // Cargar sprints al montar
  useEffect(() => {
    if (proyectoId) {
      fetchSprints();
    }
  }, [proyectoId, fetchSprints]);

  // Cargar tablero cuando cambia el sprint seleccionado
  useEffect(() => {
    if (selectedSprintId) {
      fetchTableroData();
    }
  }, [selectedSprintId, fetchTableroData]);

  return {
    tableroData,
    sprints,
    selectedSprintId,
    isLoading,
    isLoadingSprints,
    error,
    setSelectedSprintId,
    moverTareaEnTablero,
    moverHistoriaEnTablero,
    cambiarEstadoHU,
    refresh,
  };
}
