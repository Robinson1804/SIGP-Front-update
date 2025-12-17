/**
 * RRHH Service
 *
 * Servicios para gestión de recursos humanos
 */

import { apiClient, ENDPOINTS } from '@/lib/api';
import type {
  Personal,
  Division,
  Habilidad,
  Asignacion,
  CargaTrabajo,
  PersonalFilters,
  CreatePersonalInput,
  UpdatePersonalInput,
  CreateAsignacionInput,
  UpdateAsignacionInput,
  RRHHStats,
} from '../types';

// ============================================
// PERSONAL
// ============================================

/**
 * Obtener todo el personal
 */
export async function getPersonal(filters?: PersonalFilters): Promise<Personal[]> {
  const response = await apiClient.get<Personal[]>(ENDPOINTS.RRHH.PERSONAL, {
    params: filters,
  });
  return response.data;
}

/**
 * Obtener personal por ID
 */
export async function getPersonalById(id: number | string): Promise<Personal> {
  const response = await apiClient.get<Personal>(ENDPOINTS.RRHH.PERSONAL_BY_ID(id));
  return response.data;
}

/**
 * Obtener personal disponible (con capacidad)
 */
export async function getPersonalDisponible(): Promise<Personal[]> {
  const response = await apiClient.get<Personal[]>(ENDPOINTS.RRHH.PERSONAL_DISPONIBLE);
  return response.data;
}

/**
 * Crear nuevo personal
 */
export async function createPersonal(data: CreatePersonalInput): Promise<Personal> {
  const response = await apiClient.post<Personal>(ENDPOINTS.RRHH.PERSONAL, data);
  return response.data;
}

/**
 * Actualizar personal
 */
export async function updatePersonal(
  id: number | string,
  data: UpdatePersonalInput
): Promise<Personal> {
  const response = await apiClient.patch<Personal>(
    ENDPOINTS.RRHH.PERSONAL_BY_ID(id),
    data
  );
  return response.data;
}

/**
 * Eliminar personal
 */
export async function deletePersonal(id: number | string): Promise<void> {
  await apiClient.delete(ENDPOINTS.RRHH.PERSONAL_BY_ID(id));
}

// ============================================
// DIVISIONES
// ============================================

/**
 * Obtener todas las divisiones
 */
export async function getDivisiones(): Promise<Division[]> {
  const response = await apiClient.get<Division[]>(ENDPOINTS.RRHH.DIVISIONES);
  return response.data;
}

/**
 * Obtener división por ID
 */
export async function getDivisionById(id: number | string): Promise<Division> {
  const response = await apiClient.get<Division>(`${ENDPOINTS.RRHH.DIVISIONES}/${id}`);
  return response.data;
}

/**
 * Crear división
 */
export async function createDivision(
  data: Partial<Division>
): Promise<Division> {
  const response = await apiClient.post<Division>(ENDPOINTS.RRHH.DIVISIONES, data);
  return response.data;
}

/**
 * Actualizar división
 */
export async function updateDivision(
  id: number | string,
  data: Partial<Division>
): Promise<Division> {
  const response = await apiClient.patch<Division>(
    `${ENDPOINTS.RRHH.DIVISIONES}/${id}`,
    data
  );
  return response.data;
}

// ============================================
// HABILIDADES
// ============================================

/**
 * Obtener todas las habilidades
 */
export async function getHabilidades(): Promise<Habilidad[]> {
  const response = await apiClient.get<Habilidad[]>(ENDPOINTS.RRHH.HABILIDADES);
  return response.data;
}

/**
 * Crear habilidad
 */
export async function createHabilidad(
  data: Partial<Habilidad>
): Promise<Habilidad> {
  const response = await apiClient.post<Habilidad>(ENDPOINTS.RRHH.HABILIDADES, data);
  return response.data;
}

/**
 * Asignar habilidades a personal
 */
export async function asignarHabilidades(
  personalId: number | string,
  habilidadIds: number[]
): Promise<void> {
  await apiClient.post(`${ENDPOINTS.RRHH.PERSONAL_BY_ID(personalId)}/habilidades`, {
    habilidades: habilidadIds,
  });
}

// ============================================
// ASIGNACIONES
// ============================================

/**
 * Obtener todas las asignaciones
 */
export async function getAsignaciones(): Promise<Asignacion[]> {
  const response = await apiClient.get<Asignacion[]>(ENDPOINTS.RRHH.ASIGNACIONES);
  return response.data;
}

/**
 * Obtener asignaciones de una persona
 */
export async function getAsignacionesByPersona(
  personalId: number | string
): Promise<Asignacion[]> {
  const response = await apiClient.get<Asignacion[]>(
    ENDPOINTS.RRHH.ASIGNACIONES_PERSONA(personalId)
  );
  return response.data;
}

/**
 * Crear asignación
 */
export async function createAsignacion(
  data: CreateAsignacionInput
): Promise<Asignacion> {
  const response = await apiClient.post<Asignacion>(
    ENDPOINTS.RRHH.ASIGNACIONES,
    data
  );
  return response.data;
}

/**
 * Actualizar asignación
 */
export async function updateAsignacion(
  id: number | string,
  data: UpdateAsignacionInput
): Promise<Asignacion> {
  const response = await apiClient.patch<Asignacion>(
    `${ENDPOINTS.RRHH.ASIGNACIONES}/${id}`,
    data
  );
  return response.data;
}

/**
 * Finalizar asignación
 */
export async function finalizarAsignacion(
  id: number | string,
  horasReales?: number
): Promise<Asignacion> {
  const response = await apiClient.post<Asignacion>(
    `${ENDPOINTS.RRHH.ASIGNACIONES}/${id}/finalizar`,
    { horasReales }
  );
  return response.data;
}

/**
 * Obtener carga de trabajo de una persona
 */
export async function getCargaTrabajo(
  personalId: number | string
): Promise<CargaTrabajo> {
  const response = await apiClient.get<CargaTrabajo>(
    `${ENDPOINTS.RRHH.PERSONAL_BY_ID(personalId)}/carga-trabajo`
  );
  return response.data;
}

// ============================================
// ESTADÍSTICAS
// ============================================

/**
 * Obtener estadísticas de RRHH
 */
export async function getRRHHStats(): Promise<RRHHStats> {
  const response = await apiClient.get<RRHHStats>(`${ENDPOINTS.RRHH.PERSONAL}/stats`);
  return response.data;
}

/**
 * Exportar servicio como objeto
 */
export const rrhhService = {
  // Personal
  getPersonal,
  getPersonalById,
  getPersonalDisponible,
  createPersonal,
  updatePersonal,
  deletePersonal,
  // Divisiones
  getDivisiones,
  getDivisionById,
  createDivision,
  updateDivision,
  // Habilidades
  getHabilidades,
  createHabilidad,
  asignarHabilidades,
  // Asignaciones
  getAsignaciones,
  getAsignacionesByPersona,
  createAsignacion,
  updateAsignacion,
  finalizarAsignacion,
  getCargaTrabajo,
  // Stats
  getRRHHStats,
};
