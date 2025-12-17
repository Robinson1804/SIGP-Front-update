/**
 * Daily Meeting Service
 *
 * Servicios para gestión de reuniones diarias (Scrum)
 */

import { apiClient, ENDPOINTS } from '@/lib/api';
import type {
  DailyMeeting,
  DailyMeetingSummary,
  CreateDailyMeetingDto,
  UpdateDailyMeetingDto,
  RegistrarParticipacionDto,
  DailyMeetingFilters,
} from '../types';

/**
 * Obtener todas las dailies de un sprint
 */
export async function getDailiesBySprint(
  sprintId: number | string,
  filters?: Omit<DailyMeetingFilters, 'sprintId'>
): Promise<{ data: DailyMeeting[]; total: number }> {
  const response = await apiClient.get<{ data: DailyMeeting[]; total: number }>(
    ENDPOINTS.DAILY_MEETINGS.BASE(sprintId),
    { params: filters }
  );
  return response.data;
}

/**
 * Obtener una daily meeting por ID
 */
export async function getDailyMeetingById(
  sprintId: number | string,
  meetingId: number | string
): Promise<DailyMeeting> {
  const response = await apiClient.get<DailyMeeting>(
    ENDPOINTS.DAILY_MEETINGS.BY_ID(sprintId, meetingId)
  );
  return response.data;
}

/**
 * Crear una nueva daily meeting
 */
export async function createDailyMeeting(
  data: CreateDailyMeetingDto
): Promise<DailyMeeting> {
  const response = await apiClient.post<DailyMeeting>(
    ENDPOINTS.DAILY_MEETINGS.BASE(data.sprintId),
    data
  );
  return response.data;
}

/**
 * Actualizar una daily meeting
 */
export async function updateDailyMeeting(
  sprintId: number | string,
  meetingId: number | string,
  data: UpdateDailyMeetingDto
): Promise<DailyMeeting> {
  const response = await apiClient.patch<DailyMeeting>(
    ENDPOINTS.DAILY_MEETINGS.BY_ID(sprintId, meetingId),
    data
  );
  return response.data;
}

/**
 * Eliminar una daily meeting
 */
export async function deleteDailyMeeting(
  sprintId: number | string,
  meetingId: number | string
): Promise<void> {
  await apiClient.delete(ENDPOINTS.DAILY_MEETINGS.BY_ID(sprintId, meetingId));
}

/**
 * Registrar participación de un miembro en la daily
 */
export async function registrarParticipacion(
  sprintId: number | string,
  meetingId: number | string,
  data: RegistrarParticipacionDto
): Promise<void> {
  await apiClient.post(
    `${ENDPOINTS.DAILY_MEETINGS.BY_ID(sprintId, meetingId)}/participantes`,
    data
  );
}

/**
 * Actualizar participación de un miembro
 */
export async function actualizarParticipacion(
  sprintId: number | string,
  meetingId: number | string,
  participanteId: number | string,
  data: Partial<RegistrarParticipacionDto>
): Promise<void> {
  await apiClient.patch(
    `${ENDPOINTS.DAILY_MEETINGS.BY_ID(sprintId, meetingId)}/participantes/${participanteId}`,
    data
  );
}

/**
 * Obtener resumen de dailies del sprint
 */
export async function getDailySummary(
  sprintId: number | string
): Promise<DailyMeetingSummary> {
  const response = await apiClient.get<DailyMeetingSummary>(
    `${ENDPOINTS.DAILY_MEETINGS.BASE(sprintId)}/summary`
  );
  return response.data;
}

/**
 * Finalizar una daily meeting
 */
export async function finalizarDaily(
  sprintId: number | string,
  meetingId: number | string,
  horaFin: string
): Promise<DailyMeeting> {
  const response = await apiClient.post<DailyMeeting>(
    `${ENDPOINTS.DAILY_MEETINGS.BY_ID(sprintId, meetingId)}/finalizar`,
    { horaFin }
  );
  return response.data;
}

/**
 * Exportar servicio como objeto
 */
export const dailyMeetingService = {
  getDailiesBySprint,
  getDailyMeetingById,
  createDailyMeeting,
  updateDailyMeeting,
  deleteDailyMeeting,
  registrarParticipacion,
  actualizarParticipacion,
  getDailySummary,
  finalizarDaily,
};
