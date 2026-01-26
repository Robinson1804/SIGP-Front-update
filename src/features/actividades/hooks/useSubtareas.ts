'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Subtarea, CreateSubtareaInput, UpdateSubtareaInput } from '../types';
import {
  getSubtareasByTarea,
  createSubtarea,
  updateSubtarea,
  deleteSubtarea,
  reordenarSubtareas,
  calcularEstadisticasLocal,
} from '../services/subtareas.service';

interface UseSubtareasOptions {
  tareaId: number;
  autoLoad?: boolean;
}

interface UseSubtareasReturn {
  subtareas: Subtarea[];
  isLoading: boolean;
  error: string | null;
  stats: ReturnType<typeof calcularEstadisticasLocal>;
  refresh: () => Promise<void>;
  add: (data: Omit<CreateSubtareaInput, 'tareaId'>) => Promise<Subtarea | null>;
  update: (id: number, data: UpdateSubtareaInput) => Promise<Subtarea | null>;
  remove: (id: number) => Promise<boolean>;
  reorder: (orden: number[]) => Promise<boolean>;
  toggleComplete: (id: number) => Promise<Subtarea | null>;
}

export function useSubtareas({
  tareaId,
  autoLoad = true,
}: UseSubtareasOptions): UseSubtareasReturn {
  const [subtareas, setSubtareas] = useState<Subtarea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSubtareasByTarea(tareaId);
      setSubtareas(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar subtareas';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [tareaId]);

  useEffect(() => {
    if (autoLoad && tareaId) {
      refresh();
    }
  }, [autoLoad, tareaId, refresh]);

  const add = useCallback(
    async (data: Omit<CreateSubtareaInput, 'tareaId'>): Promise<Subtarea | null> => {
      try {
        const newSubtarea = await createSubtarea({ ...data, tareaId });
        setSubtareas((prev) => [...prev, newSubtarea]);
        return newSubtarea;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al crear subtarea';
        setError(message);
        return null;
      }
    },
    [tareaId]
  );

  const update = useCallback(
    async (id: number, data: UpdateSubtareaInput): Promise<Subtarea | null> => {
      try {
        const updated = await updateSubtarea(id, data);
        setSubtareas((prev) => prev.map((s) => (s.id === id ? updated : s)));
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al actualizar subtarea';
        setError(message);
        return null;
      }
    },
    []
  );

  const remove = useCallback(async (id: number): Promise<boolean> => {
    try {
      await deleteSubtarea(id);
      setSubtareas((prev) => prev.filter((s) => s.id !== id));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar subtarea';
      setError(message);
      return false;
    }
  }, []);

  const reorder = useCallback(
    async (orden: number[]): Promise<boolean> => {
      // Optimistic update
      const newOrder = orden.map((id) => subtareas.find((s) => s.id === id)!).filter(Boolean);
      setSubtareas(newOrder);

      try {
        await reordenarSubtareas(tareaId, orden);
        return true;
      } catch (err) {
        // Revert on error
        await refresh();
        const message = err instanceof Error ? err.message : 'Error al reordenar subtareas';
        setError(message);
        return false;
      }
    },
    [tareaId, subtareas, refresh]
  );

  const toggleComplete = useCallback(
    async (id: number): Promise<Subtarea | null> => {
      const subtarea = subtareas.find((s) => s.id === id);
      if (!subtarea) return null;

      const isCompleted = subtarea.estado === 'Finalizado';
      const nuevoEstado = isCompleted ? 'Por hacer' : 'Finalizado';

      return update(id, { estado: nuevoEstado });
    },
    [subtareas, update]
  );

  const stats = calcularEstadisticasLocal(subtareas);

  return {
    subtareas,
    isLoading,
    error,
    stats,
    refresh,
    add,
    update,
    remove,
    reorder,
    toggleComplete,
  };
}
