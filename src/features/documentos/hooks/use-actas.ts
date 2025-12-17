"use client";

/**
 * Hook para manejo de actas
 *
 * Proporciona estado y operaciones para gestion de actas
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/lib/hooks/use-toast';
import {
  getActasByProyecto,
  getActaById,
  createActa,
  updateActa,
  deleteActa,
  aprobarActa,
  rechazarActa,
  getActasPendientesAprobacion,
  getActaHistorial,
} from '../services/actas.service';
import type {
  Acta,
  CreateActaInput,
  UpdateActaInput,
  ActaQueryFilters,
  ActaHistorialAprobacion,
} from '../types';

interface UseActasOptions {
  proyectoId?: number | string;
  autoFetch?: boolean;
  filters?: ActaQueryFilters;
}

interface UseActasReturn {
  actas: Acta[];
  actasPendientes: Acta[];
  isLoading: boolean;
  error: string | null;
  selectedActa: Acta | null;
  historialAprobacion: ActaHistorialAprobacion[];
  // Acciones
  fetchActas: () => Promise<void>;
  fetchActasPendientes: () => Promise<void>;
  fetchHistorial: (actaId: number | string) => Promise<void>;
  selectActa: (acta: Acta | null) => void;
  createNewActa: (data: CreateActaInput) => Promise<Acta | null>;
  updateExistingActa: (id: number | string, data: Partial<UpdateActaInput>) => Promise<Acta | null>;
  deleteExistingActa: (id: number | string) => Promise<boolean>;
  aprobar: (id: number | string, motivo?: string) => Promise<boolean>;
  rechazar: (id: number | string, motivo: string) => Promise<boolean>;
  // Filtros
  setFilters: (filters: ActaQueryFilters) => void;
}

export function useActas({
  proyectoId,
  autoFetch = true,
  filters: initialFilters = {},
}: UseActasOptions = {}): UseActasReturn {
  const [actas, setActas] = useState<Acta[]>([]);
  const [actasPendientes, setActasPendientes] = useState<Acta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedActa, setSelectedActa] = useState<Acta | null>(null);
  const [historialAprobacion, setHistorialAprobacion] = useState<ActaHistorialAprobacion[]>([]);
  const [filters, setFiltersState] = useState<ActaQueryFilters>(initialFilters);

  /**
   * Obtiene las actas del proyecto
   */
  const fetchActas = useCallback(async () => {
    if (!proyectoId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getActasByProyecto(proyectoId, filters);
      setActas(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar actas';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [proyectoId, filters]);

  /**
   * Obtiene las actas pendientes de aprobacion del usuario
   */
  const fetchActasPendientes = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await getActasPendientesAprobacion();
      setActasPendientes(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar actas pendientes';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Obtiene el historial de aprobaciones de un acta
   */
  const fetchHistorial = useCallback(async (actaId: number | string) => {
    try {
      const data = await getActaHistorial(actaId);
      setHistorialAprobacion(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar historial';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, []);

  /**
   * Selecciona un acta
   */
  const selectActa = useCallback((acta: Acta | null) => {
    setSelectedActa(acta);
    if (acta) {
      // Cargar historial automaticamente
      fetchHistorial(acta.id);
    } else {
      setHistorialAprobacion([]);
    }
  }, [fetchHistorial]);

  /**
   * Crea un nuevo acta
   */
  const createNewActa = useCallback(async (data: CreateActaInput): Promise<Acta | null> => {
    try {
      const newActa = await createActa(data);
      setActas(prev => [...prev, newActa]);
      toast({
        title: 'Acta creada',
        description: 'El acta se ha creado correctamente.',
      });
      return newActa;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear acta';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, []);

  /**
   * Actualiza un acta existente
   */
  const updateExistingActa = useCallback(async (
    id: number | string,
    data: Partial<UpdateActaInput>
  ): Promise<Acta | null> => {
    try {
      const updatedActa = await updateActa(id, data);
      setActas(prev => prev.map(a => a.id === updatedActa.id ? updatedActa : a));
      if (selectedActa?.id === updatedActa.id) {
        setSelectedActa(updatedActa);
      }
      toast({
        title: 'Acta actualizada',
        description: 'El acta se ha actualizado correctamente.',
      });
      return updatedActa;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar acta';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [selectedActa]);

  /**
   * Elimina un acta
   */
  const deleteExistingActa = useCallback(async (id: number | string): Promise<boolean> => {
    try {
      await deleteActa(id);
      setActas(prev => prev.filter(a => a.id !== id));
      if (selectedActa?.id === id) {
        setSelectedActa(null);
      }
      toast({
        title: 'Acta eliminada',
        description: 'El acta se ha eliminado correctamente.',
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar acta';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  }, [selectedActa]);

  /**
   * Aprueba un acta
   */
  const aprobar = useCallback(async (id: number | string, motivo?: string): Promise<boolean> => {
    try {
      const result = await aprobarActa(id, motivo ? { motivo } : undefined);
      // Actualizar el acta en el estado
      setActas(prev => prev.map(a => a.id === result.acta.id ? result.acta : a));
      if (selectedActa?.id === result.acta.id) {
        setSelectedActa(result.acta);
        // Recargar historial
        fetchHistorial(result.acta.id);
      }
      // Actualizar pendientes si aplica
      setActasPendientes(prev => prev.filter(a => a.id !== id));

      toast({
        title: 'Acta aprobada',
        description: result.mensaje,
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al aprobar acta';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  }, [selectedActa, fetchHistorial]);

  /**
   * Rechaza un acta
   */
  const rechazar = useCallback(async (id: number | string, motivo: string): Promise<boolean> => {
    try {
      const result = await rechazarActa(id, motivo);
      // Actualizar el acta en el estado
      setActas(prev => prev.map(a => a.id === result.acta.id ? result.acta : a));
      if (selectedActa?.id === result.acta.id) {
        setSelectedActa(result.acta);
        // Recargar historial
        fetchHistorial(result.acta.id);
      }
      // Actualizar pendientes si aplica
      setActasPendientes(prev => prev.filter(a => a.id !== id));

      toast({
        title: 'Acta rechazada',
        description: result.mensaje,
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al rechazar acta';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  }, [selectedActa, fetchHistorial]);

  /**
   * Actualiza los filtros
   */
  const setFilters = useCallback((newFilters: ActaQueryFilters) => {
    setFiltersState(newFilters);
  }, []);

  // Auto-fetch al montar o cambiar proyectoId/filters
  useEffect(() => {
    if (autoFetch && proyectoId) {
      fetchActas();
    }
  }, [autoFetch, proyectoId, fetchActas]);

  return {
    actas,
    actasPendientes,
    isLoading,
    error,
    selectedActa,
    historialAprobacion,
    fetchActas,
    fetchActasPendientes,
    fetchHistorial,
    selectActa,
    createNewActa,
    updateExistingActa,
    deleteExistingActa,
    aprobar,
    rechazar,
    setFilters,
  };
}
