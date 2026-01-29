/**
 * RRHH Service
 *
 * Servicios para gestión de recursos humanos
 * Sincronizado con Backend - Dic 2024
 */

import { apiClient, ENDPOINTS } from '@/lib/api';
import type {
  Personal,
  Division,
  Habilidad,
  PersonalHabilidad,
  Asignacion,
  DisponibilidadResponse,
  AlertaSobrecarga,
  RRHHStats,
  PersonalFilters,
  DivisionFilters,
  HabilidadFilters,
  AsignacionFilters,
} from '../types';
import type {
  CreatePersonalDto,
  UpdatePersonalDto,
  CreateDivisionDto,
  UpdateDivisionDto,
  CreateHabilidadDto,
  UpdateHabilidadDto,
  AsignarHabilidadDto,
  UpdatePersonalHabilidadDto,
  CreateAsignacionDto,
  UpdateAsignacionDto,
  FinalizarAsignacionDto,
} from '../types/dto';

// ============================================================================
// PERSONAL
// ============================================================================

/**
 * Obtener todo el personal con filtros opcionales
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
 * Obtener disponibilidad de un personal
 */
export async function getPersonalDisponibilidad(
  id: number | string
): Promise<DisponibilidadResponse> {
  const response = await apiClient.get<DisponibilidadResponse>(
    ENDPOINTS.RRHH.PERSONAL_DISPONIBILIDAD(id)
  );
  return response.data;
}

/**
 * Crear nuevo personal
 */
export async function createPersonal(data: CreatePersonalDto): Promise<Personal> {
  const response = await apiClient.post<Personal>(ENDPOINTS.RRHH.PERSONAL, data);
  return response.data;
}

/**
 * Actualizar personal
 */
export async function updatePersonal(
  id: number | string,
  data: UpdatePersonalDto
): Promise<Personal> {
  const response = await apiClient.patch<Personal>(
    ENDPOINTS.RRHH.PERSONAL_BY_ID(id),
    data
  );
  return response.data;
}

/**
 * Eliminar personal (soft delete)
 */
export async function deletePersonal(id: number | string): Promise<void> {
  await apiClient.delete(ENDPOINTS.RRHH.PERSONAL_BY_ID(id));
}

// ============================================================================
// PERSONAL - HABILIDADES
// ============================================================================

/**
 * Obtener habilidades de un personal
 */
export async function getPersonalHabilidades(
  personalId: number | string
): Promise<PersonalHabilidad[]> {
  const response = await apiClient.get<PersonalHabilidad[]>(
    ENDPOINTS.RRHH.PERSONAL_HABILIDADES(personalId)
  );
  return response.data;
}

/**
 * Asignar habilidad a un personal
 */
export async function asignarHabilidadPersonal(
  personalId: number | string,
  data: AsignarHabilidadDto
): Promise<PersonalHabilidad> {
  const response = await apiClient.post<PersonalHabilidad>(
    ENDPOINTS.RRHH.PERSONAL_HABILIDADES(personalId),
    data
  );
  return response.data;
}

/**
 * Actualizar habilidad de un personal
 */
export async function updatePersonalHabilidad(
  personalId: number | string,
  habilidadId: number | string,
  data: UpdatePersonalHabilidadDto
): Promise<PersonalHabilidad> {
  const response = await apiClient.patch<PersonalHabilidad>(
    ENDPOINTS.RRHH.PERSONAL_HABILIDAD(personalId, habilidadId),
    data
  );
  return response.data;
}

/**
 * Quitar habilidad de un personal
 */
export async function removePersonalHabilidad(
  personalId: number | string,
  habilidadId: number | string
): Promise<void> {
  await apiClient.delete(ENDPOINTS.RRHH.PERSONAL_HABILIDAD(personalId, habilidadId));
}

// ============================================================================
// DIVISIONES
// ============================================================================

/**
 * Obtener todas las divisiones con filtros opcionales
 */
export async function getDivisiones(filters?: DivisionFilters): Promise<Division[]> {
  const response = await apiClient.get<Division[]>(ENDPOINTS.RRHH.DIVISIONES, {
    params: filters,
  });
  return response.data;
}

/**
 * Obtener el siguiente código de división disponible
 */
export async function getDivisionSiguienteCodigo(): Promise<string> {
  const response = await apiClient.get<{ codigo: string }>(
    ENDPOINTS.RRHH.DIVISIONES_SIGUIENTE_CODIGO
  );
  return response.data.codigo;
}

/**
 * Obtener árbol jerárquico de divisiones
 */
export async function getDivisionesArbol(): Promise<Division[]> {
  const response = await apiClient.get<Division[]>(ENDPOINTS.RRHH.DIVISIONES_ARBOL);
  return response.data;
}

/**
 * Obtener división por ID
 */
export async function getDivisionById(id: number | string): Promise<Division> {
  const response = await apiClient.get<Division>(ENDPOINTS.RRHH.DIVISION_BY_ID(id));
  return response.data;
}

/**
 * Obtener personal de una división
 */
export async function getDivisionPersonal(id: number | string): Promise<Personal[]> {
  const response = await apiClient.get<Personal[]>(ENDPOINTS.RRHH.DIVISION_PERSONAL(id));
  return response.data;
}

/**
 * Crear división
 */
export async function createDivision(data: CreateDivisionDto): Promise<Division> {
  const response = await apiClient.post<Division>(ENDPOINTS.RRHH.DIVISIONES, data);
  return response.data;
}

/**
 * Actualizar división
 */
export async function updateDivision(
  id: number | string,
  data: UpdateDivisionDto
): Promise<Division> {
  const response = await apiClient.patch<Division>(
    ENDPOINTS.RRHH.DIVISION_BY_ID(id),
    data
  );
  return response.data;
}

/**
 * Eliminar división (soft delete)
 */
export async function deleteDivision(id: number | string): Promise<void> {
  await apiClient.delete(ENDPOINTS.RRHH.DIVISION_BY_ID(id));
}

/**
 * Asignar coordinador a una división
 */
export async function asignarCoordinador(
  divisionId: number | string,
  personalId: number
): Promise<Division> {
  const response = await apiClient.post<Division>(
    ENDPOINTS.RRHH.DIVISION_COORDINADOR(divisionId),
    { personalId }
  );
  return response.data;
}

/**
 * Remover coordinador de una división
 */
export async function removerCoordinador(divisionId: number | string): Promise<Division> {
  const response = await apiClient.delete<Division>(
    ENDPOINTS.RRHH.DIVISION_COORDINADOR(divisionId)
  );
  return response.data;
}

/**
 * Obtener scrum masters de una división
 */
export async function getScrumMasters(divisionId: number | string): Promise<Personal[]> {
  const response = await apiClient.get<Personal[]>(
    ENDPOINTS.RRHH.DIVISION_SCRUM_MASTERS(divisionId)
  );
  return response.data;
}

/**
 * Asignar scrum master a una división
 */
export async function asignarScrumMaster(
  divisionId: number | string,
  personalId: number
): Promise<Division> {
  const response = await apiClient.post<Division>(
    ENDPOINTS.RRHH.DIVISION_SCRUM_MASTERS(divisionId),
    { personalId }
  );
  return response.data;
}

/**
 * Remover scrum master de una división
 */
export async function removerScrumMaster(
  divisionId: number | string,
  personalId: number | string
): Promise<Division> {
  const response = await apiClient.delete<Division>(
    ENDPOINTS.RRHH.DIVISION_SCRUM_MASTER(divisionId, personalId)
  );
  return response.data;
}

// ============================================================================
// HABILIDADES
// ============================================================================

/**
 * Obtener todas las habilidades con filtros opcionales
 */
export async function getHabilidades(filters?: HabilidadFilters): Promise<Habilidad[]> {
  const response = await apiClient.get<Habilidad[]>(ENDPOINTS.RRHH.HABILIDADES, {
    params: filters,
  });
  return response.data;
}

/**
 * Obtener habilidad por ID
 */
export async function getHabilidadById(id: number | string): Promise<Habilidad> {
  const response = await apiClient.get<Habilidad>(ENDPOINTS.RRHH.HABILIDAD_BY_ID(id));
  return response.data;
}

/**
 * Crear habilidad
 */
export async function createHabilidad(data: CreateHabilidadDto): Promise<Habilidad> {
  const response = await apiClient.post<Habilidad>(ENDPOINTS.RRHH.HABILIDADES, data);
  return response.data;
}

/**
 * Actualizar habilidad
 */
export async function updateHabilidad(
  id: number | string,
  data: UpdateHabilidadDto
): Promise<Habilidad> {
  const response = await apiClient.patch<Habilidad>(
    ENDPOINTS.RRHH.HABILIDAD_BY_ID(id),
    data
  );
  return response.data;
}

/**
 * Eliminar habilidad (soft delete)
 */
export async function deleteHabilidad(id: number | string): Promise<void> {
  await apiClient.delete(ENDPOINTS.RRHH.HABILIDAD_BY_ID(id));
}

// ============================================================================
// ASIGNACIONES
// ============================================================================

/**
 * Obtener todas las asignaciones con filtros opcionales
 */
export async function getAsignaciones(filters?: AsignacionFilters): Promise<Asignacion[]> {
  const response = await apiClient.get<Asignacion[]>(ENDPOINTS.RRHH.ASIGNACIONES, {
    params: filters,
  });
  return response.data;
}

/**
 * Obtener asignación por ID
 */
export async function getAsignacionById(id: number | string): Promise<Asignacion> {
  const response = await apiClient.get<Asignacion>(ENDPOINTS.RRHH.ASIGNACION_BY_ID(id));
  return response.data;
}

/**
 * Obtener asignaciones de un proyecto
 */
export async function getAsignacionesProyecto(
  proyectoId: number | string
): Promise<Asignacion[]> {
  const response = await apiClient.get<Asignacion[]>(
    ENDPOINTS.RRHH.ASIGNACIONES_PROYECTO(proyectoId)
  );
  return response.data;
}

/**
 * Obtener asignaciones de una actividad
 */
export async function getAsignacionesActividad(
  actividadId: number | string
): Promise<Asignacion[]> {
  const response = await apiClient.get<Asignacion[]>(
    ENDPOINTS.RRHH.ASIGNACIONES_ACTIVIDAD(actividadId)
  );
  return response.data;
}

/**
 * Obtener alertas de sobrecarga
 */
export async function getAlertasSobrecarga(): Promise<AlertaSobrecarga[]> {
  const response = await apiClient.get<AlertaSobrecarga[]>(
    ENDPOINTS.RRHH.ASIGNACIONES_ALERTAS
  );
  return response.data;
}

/**
 * Crear asignación
 */
export async function createAsignacion(data: CreateAsignacionDto): Promise<Asignacion> {
  const response = await apiClient.post<Asignacion>(ENDPOINTS.RRHH.ASIGNACIONES, data);
  return response.data;
}

/**
 * Actualizar asignación
 */
export async function updateAsignacion(
  id: number | string,
  data: UpdateAsignacionDto
): Promise<Asignacion> {
  const response = await apiClient.patch<Asignacion>(
    ENDPOINTS.RRHH.ASIGNACION_BY_ID(id),
    data
  );
  return response.data;
}

/**
 * Finalizar asignación
 */
export async function finalizarAsignacion(
  id: number | string,
  data?: FinalizarAsignacionDto
): Promise<Asignacion> {
  const response = await apiClient.patch<Asignacion>(
    ENDPOINTS.RRHH.ASIGNACION_BY_ID(id),
    { ...data, activo: false }
  );
  return response.data;
}

/**
 * Eliminar asignación
 */
export async function deleteAsignacion(id: number | string): Promise<void> {
  await apiClient.delete(ENDPOINTS.RRHH.ASIGNACION_BY_ID(id));
}

// ============================================================================
// ESTADÍSTICAS
// ============================================================================

/**
 * Obtener estadísticas de RRHH
 * TODO: Implementar endpoint en backend si no existe
 */
export async function getRRHHStats(): Promise<RRHHStats> {
  // Por ahora calculamos estadísticas básicas del lado del cliente
  try {
    const [personal, divisiones, asignaciones, alertas] = await Promise.all([
      getPersonal(),
      getDivisiones(),
      getAsignaciones({ activo: true }),
      getAlertasSobrecarga(),
    ]);

    const personalActivo = personal.filter((p) => p.activo);
    const personalDisponible = personalActivo.filter((p) => p.disponible);

    return {
      totalPersonal: personal.length,
      personalActivo: personalActivo.length,
      personalDisponible: personalDisponible.length,
      totalDivisiones: divisiones.filter((d) => d.activo).length,
      totalAsignaciones: asignaciones.length,
      promedioDisponibilidad: personalActivo.length > 0
        ? (personalDisponible.length / personalActivo.length) * 100
        : 0,
      alertasSobrecarga: alertas.length,
    };
  } catch {
    // Si falla, retornar stats vacías
    return {
      totalPersonal: 0,
      personalActivo: 0,
      personalDisponible: 0,
      totalDivisiones: 0,
      totalAsignaciones: 0,
      promedioDisponibilidad: 0,
      alertasSobrecarga: 0,
    };
  }
}

// ============================================================================
// EXPORTAR SERVICIO COMO OBJETO
// ============================================================================

export const rrhhService = {
  // Personal
  getPersonal,
  getPersonalById,
  getPersonalDisponibilidad,
  createPersonal,
  updatePersonal,
  deletePersonal,

  // Personal - Habilidades
  getPersonalHabilidades,
  asignarHabilidadPersonal,
  updatePersonalHabilidad,
  removePersonalHabilidad,

  // Divisiones
  getDivisiones,
  getDivisionesArbol,
  getDivisionById,
  getDivisionPersonal,
  getDivisionSiguienteCodigo,
  createDivision,
  updateDivision,
  deleteDivision,
  asignarCoordinador,
  removerCoordinador,
  getScrumMasters,
  asignarScrumMaster,
  removerScrumMaster,

  // Habilidades
  getHabilidades,
  getHabilidadById,
  createHabilidad,
  updateHabilidad,
  deleteHabilidad,

  // Asignaciones
  getAsignaciones,
  getAsignacionById,
  getAsignacionesProyecto,
  getAsignacionesActividad,
  getAlertasSobrecarga,
  createAsignacion,
  updateAsignacion,
  finalizarAsignacion,
  deleteAsignacion,

  // Stats
  getRRHHStats,
};
