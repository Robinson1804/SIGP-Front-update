'use client';

/**
 * useDailyMeetings Hook
 *
 * Hook para gestionar daily meetings de un sprint
 */

import { useState, useCallback } from 'react';
import {
  dailyMeetingService,
  type DailyMeeting,
  type DailyMeetingSummary,
  type CreateDailyMeetingDto,
  type UpdateDailyMeetingDto,
  type RegistrarParticipacionDto,
} from '../';

interface UseDailyMeetingsState {
  dailies: DailyMeeting[];
  currentDaily: DailyMeeting | null;
  summary: DailyMeetingSummary | null;
  isLoading: boolean;
  error: string | null;
}

interface UseDailyMeetingsActions {
  loadDailies: () => Promise<void>;
  loadDaily: (meetingId: number | string) => Promise<void>;
  loadSummary: () => Promise<void>;
  createDaily: (data: Omit<CreateDailyMeetingDto, 'sprintId'>) => Promise<DailyMeeting>;
  updateDaily: (meetingId: number | string, data: UpdateDailyMeetingDto) => Promise<void>;
  deleteDaily: (meetingId: number | string) => Promise<void>;
  finalizarDaily: (meetingId: number | string, horaFin: string) => Promise<void>;
  registrarParticipacion: (
    meetingId: number | string,
    data: RegistrarParticipacionDto
  ) => Promise<void>;
  actualizarParticipacion: (
    meetingId: number | string,
    participanteId: number | string,
    data: Partial<RegistrarParticipacionDto>
  ) => Promise<void>;
  clearError: () => void;
}

export function useDailyMeetings(sprintId: number | string): UseDailyMeetingsState & UseDailyMeetingsActions {
  const [state, setState] = useState<UseDailyMeetingsState>({
    dailies: [],
    currentDaily: null,
    summary: null,
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

  const loadDailies = useCallback(async () => {
    setLoading(true);
    try {
      const response = await dailyMeetingService.getDailiesBySprint(sprintId);
      setState((prev) => ({
        ...prev,
        dailies: response.data,
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      setError('Error al cargar las daily meetings');
      console.error('Error loading dailies:', err);
    }
  }, [sprintId]);

  const loadDaily = useCallback(
    async (meetingId: number | string) => {
      setLoading(true);
      try {
        const daily = await dailyMeetingService.getDailyMeetingById(
          sprintId,
          meetingId
        );
        setState((prev) => ({
          ...prev,
          currentDaily: daily,
          isLoading: false,
          error: null,
        }));
      } catch (err) {
        setError('Error al cargar la daily meeting');
        console.error('Error loading daily:', err);
      }
    },
    [sprintId]
  );

  const loadSummary = useCallback(async () => {
    try {
      const summary = await dailyMeetingService.getDailySummary(sprintId);
      setState((prev) => ({ ...prev, summary }));
    } catch (err) {
      console.error('Error loading summary:', err);
    }
  }, [sprintId]);

  const createDaily = useCallback(
    async (data: Omit<CreateDailyMeetingDto, 'sprintId'>) => {
      setLoading(true);
      try {
        const newDaily = await dailyMeetingService.createDailyMeeting({
          ...data,
          sprintId: Number(sprintId),
        });
        setState((prev) => ({
          ...prev,
          dailies: [newDaily, ...prev.dailies],
          currentDaily: newDaily,
          isLoading: false,
          error: null,
        }));
        return newDaily;
      } catch (err) {
        setError('Error al crear la daily meeting');
        console.error('Error creating daily:', err);
        throw err;
      }
    },
    [sprintId]
  );

  const updateDaily = useCallback(
    async (meetingId: number | string, data: UpdateDailyMeetingDto) => {
      setLoading(true);
      try {
        const updated = await dailyMeetingService.updateDailyMeeting(
          sprintId,
          meetingId,
          data
        );
        setState((prev) => ({
          ...prev,
          dailies: prev.dailies.map((d) =>
            d.id === Number(meetingId) ? updated : d
          ),
          currentDaily:
            prev.currentDaily?.id === Number(meetingId)
              ? updated
              : prev.currentDaily,
          isLoading: false,
          error: null,
        }));
      } catch (err) {
        setError('Error al actualizar la daily meeting');
        console.error('Error updating daily:', err);
        throw err;
      }
    },
    [sprintId]
  );

  const deleteDaily = useCallback(
    async (meetingId: number | string) => {
      setLoading(true);
      try {
        await dailyMeetingService.deleteDailyMeeting(sprintId, meetingId);
        setState((prev) => ({
          ...prev,
          dailies: prev.dailies.filter((d) => d.id !== Number(meetingId)),
          currentDaily:
            prev.currentDaily?.id === Number(meetingId)
              ? null
              : prev.currentDaily,
          isLoading: false,
          error: null,
        }));
      } catch (err) {
        setError('Error al eliminar la daily meeting');
        console.error('Error deleting daily:', err);
        throw err;
      }
    },
    [sprintId]
  );

  const finalizarDaily = useCallback(
    async (meetingId: number | string, horaFin: string) => {
      setLoading(true);
      try {
        const updated = await dailyMeetingService.finalizarDaily(
          sprintId,
          meetingId,
          horaFin
        );
        setState((prev) => ({
          ...prev,
          dailies: prev.dailies.map((d) =>
            d.id === Number(meetingId) ? updated : d
          ),
          currentDaily:
            prev.currentDaily?.id === Number(meetingId)
              ? updated
              : prev.currentDaily,
          isLoading: false,
          error: null,
        }));
      } catch (err) {
        setError('Error al finalizar la daily meeting');
        console.error('Error finalizing daily:', err);
        throw err;
      }
    },
    [sprintId]
  );

  const registrarParticipacion = useCallback(
    async (meetingId: number | string, data: RegistrarParticipacionDto) => {
      try {
        await dailyMeetingService.registrarParticipacion(
          sprintId,
          meetingId,
          data
        );
        // Reload the current daily to get updated participants
        await loadDaily(meetingId);
      } catch (err) {
        setError('Error al registrar participación');
        console.error('Error registering participation:', err);
        throw err;
      }
    },
    [sprintId, loadDaily]
  );

  const actualizarParticipacion = useCallback(
    async (
      meetingId: number | string,
      participanteId: number | string,
      data: Partial<RegistrarParticipacionDto>
    ) => {
      try {
        await dailyMeetingService.actualizarParticipacion(
          sprintId,
          meetingId,
          participanteId,
          data
        );
        // Reload the current daily to get updated participants
        await loadDaily(meetingId);
      } catch (err) {
        setError('Error al actualizar participación');
        console.error('Error updating participation:', err);
        throw err;
      }
    },
    [sprintId, loadDaily]
  );

  return {
    ...state,
    loadDailies,
    loadDaily,
    loadSummary,
    createDaily,
    updateDaily,
    deleteDaily,
    finalizarDaily,
    registrarParticipacion,
    actualizarParticipacion,
    clearError,
  };
}
