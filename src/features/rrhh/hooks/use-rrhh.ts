'use client';

/**
 * useRRHH Hook
 *
 * Hook para gestión de recursos humanos
 */

import { useState, useCallback } from 'react';
import { rrhhService } from '../services';
import type {
  Personal,
  Division,
  Habilidad,
  Asignacion,
  PersonalFilters,
  CreatePersonalInput,
  UpdatePersonalInput,
  RRHHStats,
} from '../types';

interface UseRRHHState {
  personal: Personal[];
  divisiones: Division[];
  habilidades: Habilidad[];
  asignaciones: Asignacion[];
  stats: RRHHStats | null;
  selectedPersona: Personal | null;
  isLoading: boolean;
  error: string | null;
}

interface UseRRHHActions {
  loadPersonal: (filters?: PersonalFilters) => Promise<void>;
  loadDivisiones: () => Promise<void>;
  loadHabilidades: () => Promise<void>;
  loadStats: () => Promise<void>;
  createPersona: (data: CreatePersonalInput) => Promise<Personal>;
  updatePersona: (id: number, data: UpdatePersonalInput) => Promise<void>;
  deletePersona: (id: number) => Promise<void>;
  selectPersona: (persona: Personal | null) => void;
  loadAsignaciones: (personalId: number) => Promise<void>;
  clearError: () => void;
}

export function useRRHH(): UseRRHHState & UseRRHHActions {
  const [state, setState] = useState<UseRRHHState>({
    personal: [],
    divisiones: [],
    habilidades: [],
    asignaciones: [],
    stats: null,
    selectedPersona: null,
    isLoading: false,
    error: null,
  });

  const setLoading = (isLoading: boolean) =>
    setState((prev) => ({ ...prev, isLoading }));

  const setError = (error: string | null) =>
    setState((prev) => ({ ...prev, error, isLoading: false }));

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const loadPersonal = useCallback(async (filters?: PersonalFilters) => {
    setLoading(true);
    try {
      const data = await rrhhService.getPersonal(filters);
      setState((prev) => ({
        ...prev,
        personal: data,
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      setError('Error al cargar el personal');
      console.error('Error loading personal:', err);
    }
  }, []);

  const loadDivisiones = useCallback(async () => {
    try {
      const data = await rrhhService.getDivisiones();
      setState((prev) => ({ ...prev, divisiones: data }));
    } catch (err) {
      console.error('Error loading divisiones:', err);
    }
  }, []);

  const loadHabilidades = useCallback(async () => {
    try {
      const data = await rrhhService.getHabilidades();
      setState((prev) => ({ ...prev, habilidades: data }));
    } catch (err) {
      console.error('Error loading habilidades:', err);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await rrhhService.getRRHHStats();
      setState((prev) => ({ ...prev, stats: data }));
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, []);

  const createPersona = useCallback(
    async (data: CreatePersonalInput): Promise<Personal> => {
      setLoading(true);
      try {
        const newPersona = await rrhhService.createPersonal(data);
        setState((prev) => ({
          ...prev,
          personal: [newPersona, ...prev.personal],
          isLoading: false,
          error: null,
        }));
        return newPersona;
      } catch (err) {
        setError('Error al crear el personal');
        console.error('Error creating personal:', err);
        throw err;
      }
    },
    []
  );

  const updatePersona = useCallback(
    async (id: number, data: UpdatePersonalInput) => {
      setLoading(true);
      try {
        const updated = await rrhhService.updatePersonal(id, data);
        setState((prev) => ({
          ...prev,
          personal: prev.personal.map((p) => (p.id === id ? updated : p)),
          selectedPersona:
            prev.selectedPersona?.id === id ? updated : prev.selectedPersona,
          isLoading: false,
          error: null,
        }));
      } catch (err) {
        setError('Error al actualizar el personal');
        console.error('Error updating personal:', err);
        throw err;
      }
    },
    []
  );

  const deletePersona = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await rrhhService.deletePersonal(id);
      setState((prev) => ({
        ...prev,
        personal: prev.personal.filter((p) => p.id !== id),
        selectedPersona:
          prev.selectedPersona?.id === id ? null : prev.selectedPersona,
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      setError('Error al eliminar el personal');
      console.error('Error deleting personal:', err);
      throw err;
    }
  }, []);

  const selectPersona = useCallback((persona: Personal | null) => {
    setState((prev) => ({ ...prev, selectedPersona: persona }));
  }, []);

  const loadAsignaciones = useCallback(async (personalId: number) => {
    try {
      const data = await rrhhService.getAsignacionesByPersona(personalId);
      setState((prev) => ({ ...prev, asignaciones: data }));
    } catch (err) {
      console.error('Error loading asignaciones:', err);
    }
  }, []);

  return {
    ...state,
    loadPersonal,
    loadDivisiones,
    loadHabilidades,
    loadStats,
    createPersona,
    updatePersona,
    deletePersona,
    selectPersona,
    loadAsignaciones,
    clearError,
  };
}
