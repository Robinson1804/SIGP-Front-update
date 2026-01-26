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
    ENDPOINTS.DAILY_MEETINGS.BY_SPRINT(sprintId),
    { params: filters }
  );
  return response.data;
}

/**
 * Obtener una daily meeting por ID
 */
export async function getDailyMeetingById(
  meetingId: number | string
): Promise<DailyMeeting> {
  const response = await apiClient.get<DailyMeeting>(
    ENDPOINTS.DAILY_MEETINGS.BY_ID(meetingId)
  );
  return response.data;
}

/**
 * Crear una nueva daily meeting
 * POST /daily-meetings
 */
export async function createDailyMeeting(
  data: CreateDailyMeetingDto
): Promise<DailyMeeting> {
  const response = await apiClient.post<DailyMeeting>(
    ENDPOINTS.DAILY_MEETINGS.ROOT,
    data
  );
  return response.data;
}

/**
 * Actualizar una daily meeting
 */
export async function updateDailyMeeting(
  meetingId: number | string,
  data: UpdateDailyMeetingDto
): Promise<DailyMeeting> {
  const response = await apiClient.patch<DailyMeeting>(
    ENDPOINTS.DAILY_MEETINGS.BY_ID(meetingId),
    data
  );
  return response.data;
}

/**
 * Eliminar una daily meeting
 */
export async function deleteDailyMeeting(
  meetingId: number | string
): Promise<void> {
  await apiClient.delete(ENDPOINTS.DAILY_MEETINGS.BY_ID(meetingId));
}

/**
 * Registrar participación de un miembro en la daily
 * POST /daily-meetings/:id/participantes
 */
export async function registrarParticipacion(
  meetingId: number | string,
  data: RegistrarParticipacionDto
): Promise<void> {
  await apiClient.post(
    ENDPOINTS.DAILY_MEETINGS.PARTICIPANTES(meetingId),
    data
  );
}

/**
 * Actualizar participación de un miembro
 * PATCH /daily-meetings/participantes/:participanteId
 */
export async function actualizarParticipacion(
  participanteId: number | string,
  data: Partial<RegistrarParticipacionDto>
): Promise<void> {
  await apiClient.patch(
    ENDPOINTS.DAILY_MEETINGS.PARTICIPANTE(participanteId),
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
    `${ENDPOINTS.DAILY_MEETINGS.BY_SPRINT(sprintId)}/summary`
  );
  return response.data;
}

/**
 * Finalizar una daily meeting
 */
export async function finalizarDaily(
  meetingId: number | string,
  horaFin: string
): Promise<DailyMeeting> {
  const response = await apiClient.post<DailyMeeting>(
    `${ENDPOINTS.DAILY_MEETINGS.BY_ID(meetingId)}/finalizar`,
    { horaFin }
  );
  return response.data;
}

/**
 * Eliminar participante de una daily
 * DELETE /daily-meetings/participantes/:participanteId
 */
export async function eliminarParticipante(
  participanteId: number | string
): Promise<void> {
  await apiClient.delete(ENDPOINTS.DAILY_MEETINGS.PARTICIPANTE(participanteId));
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
  eliminarParticipante,
  getDailySummary,
  finalizarDaily,
};
