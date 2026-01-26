'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  TareaKanban,
  TareaEstado,
  TareaPrioridad,
  TableroKanban,
  KanbanColumna,
} from '../types';
import { getTablero } from '../services/actividades.service';
import { moverTarea as moverTareaApi } from '../services/tareas-kanban.service';
import type { TaskFiltersState } from '../components/TaskFilters';

// WIP Limits por defecto
const DEFAULT_WIP_LIMITS: Record<TareaEstado, number | null> = {
  'Por hacer': null,
  'En progreso': 5,
  'Finalizado': null,
};

interface UseKanbanBoardOptions {
  actividadId: number;
  autoLoad?: boolean;
  wipLimits?: Record<TareaEstado, number | null>;
}

interface UseKanbanBoardReturn {
  tablero: TableroKanban | null;
  columnas: KanbanColumna[];
  isLoading: boolean;
  error: string | null;
  filters: TaskFiltersState;
  setFilters: (filters: TaskFiltersState) => void;
  wipLimits: Record<TareaEstado, number | null>;
  refresh: () => Promise<void>;
  moverTarea: (tareaId: number, nuevoEstado: TareaEstado) => Promise<boolean>;
  canMoveToColumn: (estado: TareaEstado) => boolean;
  getColumnCount: (estado: TareaEstado) => number;
  filteredColumnas: KanbanColumna[];
}

const initialFilters: TaskFiltersState = {
  search: '',
  prioridad: 'todas',
  asignadoA: 'todos',
  conSubtareas: null,
};

export function useKanbanBoard({
  actividadId,
  autoLoad = true,
  wipLimits = DEFAULT_WIP_LIMITS,
}: UseKanbanBoardOptions): UseKanbanBoardReturn {
  const [tablero, setTablero] = useState<TableroKanban | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFiltersState>(initialFilters);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTablero(actividadId);
      setTablero(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar el tablero';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [actividadId]);

  useEffect(() => {
    if (autoLoad && actividadId) {
      refresh();
    }
  }, [autoLoad, actividadId, refresh]);

  const columnas = useMemo(() => {
    return tablero?.columnas || [];
  }, [tablero]);

  const getColumnCount = useCallback(
    (estado: TareaEstado): number => {
      const columna = columnas.find((c) => c.id === estado);
      return columna?.tareas.length || 0;
    },
    [columnas]
  );

  const canMoveToColumn = useCallback(
    (estado: TareaEstado): boolean => {
      const limit = wipLimits[estado];
      if (limit === null) return true;
      return getColumnCount(estado) < limit;
    },
    [wipLimits, getColumnCount]
  );

  const moverTarea = useCallback(
    async (tareaId: number, nuevoEstado: TareaEstado): Promise<boolean> => {
      // Check WIP limit
      if (!canMoveToColumn(nuevoEstado)) {
        setError(`Limite WIP alcanzado en columna "${nuevoEstado}"`);
        return false;
      }

      // Optimistic update
      setTablero((prev) => {
        if (!prev) return prev;

        const newColumnas = prev.columnas.map((col) => {
          // Remove from old column
          const tareaToMove = col.tareas.find((t) => t.id === tareaId);
          if (tareaToMove) {
            return {
              ...col,
              tareas: col.tareas.filter((t) => t.id !== tareaId),
            };
          }
          return col;
        });

        // Find the task and add to new column
        let movedTarea: TareaKanban | undefined;
        for (const col of prev.columnas) {
          movedTarea = col.tareas.find((t) => t.id === tareaId);
          if (movedTarea) break;
        }

        if (movedTarea) {
          return {
            ...prev,
            columnas: newColumnas.map((col) => {
              if (col.id === nuevoEstado) {
                return {
                  ...col,
                  tareas: [...col.tareas, { ...movedTarea!, estado: nuevoEstado }],
                };
              }
              return col;
            }),
          };
        }

        return prev;
      });

      try {
        await moverTareaApi(tareaId, nuevoEstado);
        return true;
      } catch (err) {
        // Revert on error
        await refresh();
        const message = err instanceof Error ? err.message : 'Error al mover la tarea';
        setError(message);
        return false;
      }
    },
    [canMoveToColumn, refresh]
  );

  // Filter tasks
  const filteredColumnas = useMemo(() => {
    return columnas.map((col) => ({
      ...col,
      tareas: col.tareas.filter((tarea) => {
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchesSearch =
            tarea.nombre.toLowerCase().includes(searchLower) ||
            tarea.codigo.toLowerCase().includes(searchLower);
          if (!matchesSearch) return false;
        }

        // Priority filter
        if (filters.prioridad !== 'todas' && tarea.prioridad !== filters.prioridad) {
          return false;
        }

        // Assignee filter
        if (
          filters.asignadoA !== 'todos' &&
          tarea.asignadoA !== filters.asignadoA
        ) {
          return false;
        }

        return true;
      }),
    }));
  }, [columnas, filters]);

  return {
    tablero,
    columnas,
    isLoading,
    error,
    filters,
    setFilters,
    wipLimits,
    refresh,
    moverTarea,
    canMoveToColumn,
    getColumnCount,
    filteredColumnas,
  };
}
