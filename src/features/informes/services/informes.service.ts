/**
 * Informes Service
 *
 * Servicios para gestión de informes de sprint y actividad
 */

import { get, post, put, del } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type {
  InformeSprint,
  InformeActividad,
  CreateInformeSprintInput,
  UpdateInformeSprintInput,
  CreateInformeActividadInput,
  UpdateInformeActividadInput,
  GenerarInformeSprintData,
  GenerarInformeResponse,
} from '../types';

// ============================================
// INFORMES DE SPRINT
// ============================================

/**
 * Obtiene todos los informes de sprint
 */
export async function getInformesSprint(): Promise<InformeSprint[]> {
  return get<InformeSprint[]>(ENDPOINTS.INFORMES.SPRINT.BASE);
}

/**
 * Obtiene un informe de sprint por ID
 */
export async function getInformeSprint(id: number): Promise<InformeSprint> {
  return get<InformeSprint>(ENDPOINTS.INFORMES.SPRINT.BY_ID(id));
}

/**
 * Obtiene el informe de un sprint específico
 */
export async function getInformeBySprint(sprintId: number): Promise<InformeSprint | null> {
  try {
    return await get<InformeSprint>(ENDPOINTS.INFORMES.SPRINT.BY_SPRINT(sprintId));
  } catch (error) {
    // Si no existe, retornar null
    return null;
  }
}

/**
 * Crea un nuevo informe de sprint
 */
export async function createInformeSprint(
  data: CreateInformeSprintInput
): Promise<InformeSprint> {
  return post<InformeSprint>(ENDPOINTS.INFORMES.SPRINT.BASE, data);
}

/**
 * Actualiza un informe de sprint
 */
export async function updateInformeSprint(
  id: number,
  data: UpdateInformeSprintInput
): Promise<InformeSprint> {
  return put<InformeSprint>(ENDPOINTS.INFORMES.SPRINT.BY_ID(id), data);
}

/**
 * Elimina un informe de sprint
 */
export async function deleteInformeSprint(id: number): Promise<void> {
  return del<void>(ENDPOINTS.INFORMES.SPRINT.BY_ID(id));
}

/**
 * Genera un informe de sprint automáticamente basado en métricas
 */
export async function generarInformeSprint(
  data: GenerarInformeSprintData
): Promise<GenerarInformeResponse> {
  return post<GenerarInformeResponse>(
    ENDPOINTS.INFORMES.SPRINT.GENERAR(data.sprintId)
  );
}

// ============================================
// INFORMES DE ACTIVIDAD
// ============================================

/**
 * Obtiene todos los informes de actividad
 */
export async function getInformesActividad(): Promise<InformeActividad[]> {
  return get<InformeActividad[]>(ENDPOINTS.INFORMES.ACTIVIDAD.BASE);
}

/**
 * Obtiene un informe de actividad por ID
 */
export async function getInformeActividad(id: number): Promise<InformeActividad> {
  return get<InformeActividad>(ENDPOINTS.INFORMES.ACTIVIDAD.BY_ID(id));
}

/**
 * Obtiene los informes de una actividad específica
 */
export async function getInformesByActividad(
  actividadId: number
): Promise<InformeActividad[]> {
  return get<InformeActividad[]>(ENDPOINTS.INFORMES.ACTIVIDAD.BY_ACTIVIDAD(actividadId));
}

/**
 * Crea un nuevo informe de actividad
 */
export async function createInformeActividad(
  data: CreateInformeActividadInput
): Promise<InformeActividad> {
  return post<InformeActividad>(ENDPOINTS.INFORMES.ACTIVIDAD.BASE, data);
}

/**
 * Actualiza un informe de actividad
 */
export async function updateInformeActividad(
  id: number,
  data: UpdateInformeActividadInput
): Promise<InformeActividad> {
  return put<InformeActividad>(ENDPOINTS.INFORMES.ACTIVIDAD.BY_ID(id), data);
}

/**
 * Elimina un informe de actividad
 */
export async function deleteInformeActividad(id: number): Promise<void> {
  return del<void>(ENDPOINTS.INFORMES.ACTIVIDAD.BY_ID(id));
}
