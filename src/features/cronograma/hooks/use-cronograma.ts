'use client';

/**
 * useCronograma Hook
 *
 * Hook para gestionar el estado y operaciones del cronograma de un proyecto
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/lib/hooks/use-toast';
import type {
  Cronograma,
  TareaCronograma,
  DependenciaCronograma,
  CreateTareaCronogramaInput,
  UpdateTareaCronogramaInput,
  CreateDependenciaInput,
  CreateCronogramaInput,
  FormatoExportacion,
} from '../types';
import * as cronogramaService from '../services/cronograma.service';

interface UseCronogramaOptions {
  /** ID del proyecto */
  proyectoId: number | string;
  /** Cargar automaticamente al montar */
  autoFetch?: boolean;
}

interface UseCronogramaReturn {
  // Estado
  cronograma: Cronograma | null;
  tareas: TareaCronograma[];
  dependencias: DependenciaCronograma[];
  isLoading: boolean;
  error: Error | null;
  exists: boolean;

  // Acciones principales
  fetchCronograma: () => Promise<void>;
  createCronograma: (data: CreateCronogramaInput) => Promise<Cronograma | null>;

  // Operaciones de tareas
  createTarea: (data: CreateTareaCronogramaInput) => Promise<TareaCronograma | null>;
  updateTarea: (tareaId: string, data: UpdateTareaCronogramaInput) => Promise<TareaCronograma | null>;
  deleteTarea: (tareaId: string) => Promise<boolean>;
  updateTareaFechas: (tareaId: string, inicio: Date, fin: Date) => Promise<TareaCronograma | null>;
  updateTareaProgreso: (tareaId: string, progreso: number) => Promise<TareaCronograma | null>;

  // Operaciones de dependencias
  addDependencia: (data: CreateDependenciaInput) => Promise<DependenciaCronograma | null>;
  removeDependencia: (dependenciaId: string) => Promise<boolean>;

  // Exportacion
  exportar: (formato: FormatoExportacion) => Promise<void>;

  // Utilidades
  refresh: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook para gestionar el cronograma de un proyecto
 *
 * @example
 * const {
 *   cronograma,
 *   tareas,
 *   isLoading,
 *   createTarea,
 *   updateTareaFechas
 * } = useCronograma({ proyectoId: 123 });
 */
export function useCronograma({
  proyectoId,
  autoFetch = true,
}: UseCronogramaOptions): UseCronogramaReturn {
  const { toast } = useToast();

  // Estado
  const [cronograma, setCronograma] = useState<Cronograma | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Derivados
  const tareas = cronograma?.tareas ?? [];
  const dependencias = cronograma?.dependencias ?? [];
  const exists = cronograma !== null;

  // Cargar cronograma
  const fetchCronograma = useCallback(async () => {
    if (!proyectoId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await cronogramaService.getCronogramaByProyecto(proyectoId);
      setCronograma(data);
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el cronograma',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [proyectoId, toast]);

  // Crear cronograma
  const createCronograma = useCallback(
    async (data: CreateCronogramaInput): Promise<Cronograma | null> => {
      if (!proyectoId) return null;

      setIsLoading(true);
      try {
        const newCronograma = await cronogramaService.createCronograma(proyectoId, data);
        setCronograma(newCronograma);
        toast({
          title: 'Exito',
          description: 'Cronograma creado correctamente',
        });
        return newCronograma;
      } catch (err) {
        const error = err as Error;
        setError(error);
        toast({
          title: 'Error',
          description: 'No se pudo crear el cronograma',
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [proyectoId, toast]
  );

  // Crear tarea
  const createTarea = useCallback(
    async (data: CreateTareaCronogramaInput): Promise<TareaCronograma | null> => {
      let currentCronograma = cronograma;

      // Si no existe cronograma, crearlo automáticamente
      if (!currentCronograma) {
        try {
          const newCronograma = await cronogramaService.createCronograma(proyectoId, {
            nombre: `Cronograma del Proyecto`,
            descripcion: 'Cronograma creado automáticamente',
          });
          currentCronograma = newCronograma;
          setCronograma(newCronograma);
        } catch (err) {
          toast({
            title: 'Error',
            description: 'No se pudo crear el cronograma',
            variant: 'destructive',
          });
          return null;
        }
      }

      try {
        const newTarea = await cronogramaService.createTarea(currentCronograma.id, data);

        // Actualizar estado local
        setCronograma((prev) =>
          prev
            ? {
                ...prev,
                tareas: [...prev.tareas, newTarea],
              }
            : null
        );

        toast({
          title: 'Exito',
          description: 'Tarea agregada al cronograma',
        });
        return newTarea;
      } catch (err) {
        toast({
          title: 'Error',
          description: 'No se pudo crear la tarea',
          variant: 'destructive',
        });
        return null;
      }
    },
    [cronograma, proyectoId, toast]
  );

  // Actualizar tarea
  const updateTarea = useCallback(
    async (
      tareaId: string,
      data: UpdateTareaCronogramaInput
    ): Promise<TareaCronograma | null> => {
      if (!cronograma) return null;

      try {
        const updatedTarea = await cronogramaService.updateTarea(
          cronograma.id,
          tareaId,
          data
        );

        // Actualizar estado local
        setCronograma((prev) =>
          prev
            ? {
                ...prev,
                tareas: prev.tareas.map((t) =>
                  t.id === tareaId ? updatedTarea : t
                ),
              }
            : null
        );

        return updatedTarea;
      } catch (err) {
        toast({
          title: 'Error',
          description: 'No se pudo actualizar la tarea',
          variant: 'destructive',
        });
        return null;
      }
    },
    [cronograma, toast]
  );

  // Eliminar tarea
  const deleteTarea = useCallback(
    async (tareaId: string): Promise<boolean> => {
      if (!cronograma) return false;

      try {
        await cronogramaService.deleteTarea(cronograma.id, tareaId);

        // Actualizar estado local
        setCronograma((prev) =>
          prev
            ? {
                ...prev,
                tareas: prev.tareas.filter((t) => t.id !== tareaId),
                dependencias: prev.dependencias.filter(
                  (d) => d.tareaOrigenId !== tareaId && d.tareaDestinoId !== tareaId
                ),
              }
            : null
        );

        toast({
          title: 'Exito',
          description: 'Tarea eliminada del cronograma',
        });
        return true;
      } catch (err) {
        toast({
          title: 'Error',
          description: 'No se pudo eliminar la tarea',
          variant: 'destructive',
        });
        return false;
      }
    },
    [cronograma, toast]
  );

  // Actualizar fechas de tarea (para drag & drop)
  const updateTareaFechas = useCallback(
    async (
      tareaId: string,
      inicio: Date,
      fin: Date
    ): Promise<TareaCronograma | null> => {
      if (!cronograma) return null;

      try {
        const updatedTarea = await cronogramaService.updateTareaFechas(
          cronograma.id,
          tareaId,
          inicio.toISOString(),
          fin.toISOString()
        );

        // Actualizar estado local
        setCronograma((prev) =>
          prev
            ? {
                ...prev,
                tareas: prev.tareas.map((t) =>
                  t.id === tareaId ? updatedTarea : t
                ),
              }
            : null
        );

        return updatedTarea;
      } catch (err) {
        toast({
          title: 'Error',
          description: 'No se pudieron actualizar las fechas',
          variant: 'destructive',
        });
        // Revertir cambios recargando
        fetchCronograma();
        return null;
      }
    },
    [cronograma, toast, fetchCronograma]
  );

  // Actualizar progreso de tarea
  const updateTareaProgreso = useCallback(
    async (tareaId: string, progreso: number): Promise<TareaCronograma | null> => {
      if (!cronograma) return null;

      // Validar progreso
      const validProgreso = Math.max(0, Math.min(100, progreso));

      try {
        const updatedTarea = await cronogramaService.updateTareaProgreso(
          cronograma.id,
          tareaId,
          validProgreso
        );

        // Actualizar estado local
        setCronograma((prev) =>
          prev
            ? {
                ...prev,
                tareas: prev.tareas.map((t) =>
                  t.id === tareaId ? updatedTarea : t
                ),
              }
            : null
        );

        return updatedTarea;
      } catch (err) {
        toast({
          title: 'Error',
          description: 'No se pudo actualizar el progreso',
          variant: 'destructive',
        });
        return null;
      }
    },
    [cronograma, toast]
  );

  // Agregar dependencia
  const addDependencia = useCallback(
    async (data: CreateDependenciaInput): Promise<DependenciaCronograma | null> => {
      if (!cronograma) return null;

      // Validar que no sea dependencia circular
      if (data.tareaOrigenId === data.tareaDestinoId) {
        toast({
          title: 'Error',
          description: 'Una tarea no puede depender de si misma',
          variant: 'destructive',
        });
        return null;
      }

      try {
        const newDependencia = await cronogramaService.createDependencia(
          cronograma.id,
          data
        );

        // Actualizar estado local
        setCronograma((prev) =>
          prev
            ? {
                ...prev,
                dependencias: [...prev.dependencias, newDependencia],
              }
            : null
        );

        toast({
          title: 'Exito',
          description: 'Dependencia agregada',
        });
        return newDependencia;
      } catch (err) {
        toast({
          title: 'Error',
          description: 'No se pudo agregar la dependencia',
          variant: 'destructive',
        });
        return null;
      }
    },
    [cronograma, toast]
  );

  // Eliminar dependencia
  const removeDependencia = useCallback(
    async (dependenciaId: string): Promise<boolean> => {
      if (!cronograma) return false;

      try {
        await cronogramaService.deleteDependencia(cronograma.id, dependenciaId);

        // Actualizar estado local
        setCronograma((prev) =>
          prev
            ? {
                ...prev,
                dependencias: prev.dependencias.filter((d) => d.id !== dependenciaId),
              }
            : null
        );

        toast({
          title: 'Exito',
          description: 'Dependencia eliminada',
        });
        return true;
      } catch (err) {
        toast({
          title: 'Error',
          description: 'No se pudo eliminar la dependencia',
          variant: 'destructive',
        });
        return false;
      }
    },
    [cronograma, toast]
  );

  // Exportar cronograma
  const exportar = useCallback(
    async (formato: FormatoExportacion): Promise<void> => {
      if (!cronograma) {
        toast({
          title: 'Error',
          description: 'No hay cronograma para exportar',
          variant: 'destructive',
        });
        return;
      }

      try {
        setIsLoading(true);
        const { url, filename } = await cronogramaService.exportCronograma(
          cronograma.id,
          formato
        );
        cronogramaService.downloadFile(url, filename);
        toast({
          title: 'Exito',
          description: `Cronograma exportado a ${formato.toUpperCase()}`,
        });
      } catch (err) {
        toast({
          title: 'Error',
          description: `No se pudo exportar a ${formato.toUpperCase()}`,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [cronograma, toast]
  );

  // Utilidades
  const refresh = useCallback(() => fetchCronograma(), [fetchCronograma]);
  const clearError = useCallback(() => setError(null), []);

  // Auto-fetch al montar
  useEffect(() => {
    if (autoFetch && proyectoId) {
      fetchCronograma();
    }
  }, [autoFetch, proyectoId, fetchCronograma]);

  return {
    // Estado
    cronograma,
    tareas,
    dependencias,
    isLoading,
    error,
    exists,

    // Acciones principales
    fetchCronograma,
    createCronograma,

    // Operaciones de tareas
    createTarea,
    updateTarea,
    deleteTarea,
    updateTareaFechas,
    updateTareaProgreso,

    // Operaciones de dependencias
    addDependencia,
    removeDependencia,

    // Exportacion
    exportar,

    // Utilidades
    refresh,
    clearError,
  };
}
