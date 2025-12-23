/**
 * Subtareas Service
 *
 * Servicios para gestión de Subtareas (SOLO para tareas Kanban)
 * Conecta con el backend NestJS en localhost:3010/api/v1
 *
 * IMPORTANTE: Las subtareas SOLO existen para tareas tipo KANBAN.
 * Las tareas SCRUM (asociadas a Historias de Usuario) NO pueden tener subtareas.
 */

import { apiClient, ENDPOINTS } from '@/lib/api';
import type {
  Subtarea,
  CreateSubtareaInput,
  UpdateSubtareaInput,
  SubtareaQueryFilters,
  SubtareaEstado,
  SubtareaEstadisticas,
} from '../types';

// ============================================
// CRUD Operations
// ============================================

/**
 * Obtener todas las subtareas de una tarea
 *
 * @param tareaId - ID de la tarea padre
 * @param filters - Filtros opcionales
 * @returns Lista de subtareas
 *
 * @example
 * const subtareas = await getSubtareasByTarea(1, { estado: 'En progreso' });
 */
export async function getSubtareasByTarea(
  tareaId: number | string,
  filters?: Omit<SubtareaQueryFilters, 'tareaId'>
): Promise<Subtarea[]> {
  const response = await apiClient.get<Subtarea[]>(
    `${ENDPOINTS.TAREAS.BY_ID(tareaId)}/subtareas`,
    { params: filters }
  );
  return response.data;
}

/**
 * Obtener una subtarea por su ID
 *
 * @param id - ID de la subtarea
 * @returns Datos completos de la subtarea
 *
 * @example
 * const subtarea = await getSubtareaById(1);
 */
export async function getSubtareaById(id: number | string): Promise<Subtarea> {
  const response = await apiClient.get<Subtarea>(`/subtareas/${id}`);
  return response.data;
}

/**
 * Crear una nueva subtarea
 *
 * @param data - Datos para crear la subtarea
 * @returns Subtarea creada
 *
 * @example
 * const nuevaSubtarea = await createSubtarea({
 *   tareaId: 1,
 *   nombre: 'Revisar sección A',
 *   prioridad: 'Alta',
 *   responsable: 5,
 * });
 */
export async function createSubtarea(
  data: CreateSubtareaInput
): Promise<Subtarea> {
  const response = await apiClient.post<Subtarea>('/subtareas', data);
  return response.data;
}

/**
 * Actualizar una subtarea existente
 *
 * @param id - ID de la subtarea a actualizar
 * @param data - Datos a actualizar
 * @returns Subtarea actualizada
 *
 * @example
 * const subtareaActualizada = await updateSubtarea(1, {
 *   nombre: 'Nuevo nombre',
 *   prioridad: 'Media',
 * });
 */
export async function updateSubtarea(
  id: number | string,
  data: UpdateSubtareaInput
): Promise<Subtarea> {
  const response = await apiClient.patch<Subtarea>(`/subtareas/${id}`, data);
  return response.data;
}

/**
 * Eliminar una subtarea (soft delete)
 *
 * @param id - ID de la subtarea a eliminar
 *
 * @example
 * await deleteSubtarea(1);
 */
export async function deleteSubtarea(id: number | string): Promise<void> {
  await apiClient.delete(`/subtareas/${id}`);
}

// ============================================
// Estado Operations
// ============================================

/**
 * Cambiar estado de una subtarea
 *
 * @param id - ID de la subtarea
 * @param estado - Nuevo estado
 * @returns Subtarea actualizada
 *
 * @example
 * const subtarea = await cambiarEstadoSubtarea(1, 'En progreso');
 */
export async function cambiarEstadoSubtarea(
  id: number | string,
  estado: SubtareaEstado
): Promise<Subtarea> {
  const response = await apiClient.patch<Subtarea>(
    `/subtareas/${id}/estado`,
    { estado }
  );
  return response.data;
}

/**
 * Iniciar trabajo en una subtarea
 *
 * @param id - ID de la subtarea
 * @returns Subtarea actualizada
 */
export async function iniciarSubtarea(id: number | string): Promise<Subtarea> {
  return cambiarEstadoSubtarea(id, 'En progreso');
}

/**
 * Finalizar una subtarea
 *
 * @param id - ID de la subtarea
 * @param evidenciaUrl - URL de la evidencia (opcional)
 * @returns Subtarea finalizada
 */
export async function finalizarSubtarea(
  id: number | string,
  evidenciaUrl?: string
): Promise<Subtarea> {
  if (evidenciaUrl) {
    await updateSubtarea(id, { evidenciaUrl });
  }
  return cambiarEstadoSubtarea(id, 'Finalizado');
}

// ============================================
// Validación Operations
// ============================================

/**
 * Validar una subtarea
 * Solo puede ser validada por el responsable de la tarea o superior
 *
 * @param id - ID de la subtarea
 * @param observacion - Observación opcional sobre la validación
 * @returns Subtarea validada
 *
 * @example
 * const subtarea = await validarSubtarea(1, 'Trabajo correcto');
 */
export async function validarSubtarea(
  id: number | string,
  observacion?: string
): Promise<Subtarea> {
  const response = await apiClient.patch<Subtarea>(
    `/subtareas/${id}/validar`,
    { observacion }
  );
  return response.data;
}

/**
 * Rechazar validación de una subtarea
 *
 * @param id - ID de la subtarea
 * @param observacion - Motivo del rechazo
 * @returns Subtarea con validación rechazada
 */
export async function rechazarValidacionSubtarea(
  id: number | string,
  observacion: string
): Promise<Subtarea> {
  const response = await apiClient.patch<Subtarea>(
    `/subtareas/${id}/rechazar-validacion`,
    { observacion }
  );
  return response.data;
}

// ============================================
// Estadísticas Operations
// ============================================

/**
 * Obtener estadísticas de subtareas de una tarea
 *
 * @param tareaId - ID de la tarea padre
 * @returns Estadísticas de las subtareas
 *
 * @example
 * const stats = await getSubtareaEstadisticas(1);
 * console.log(`Completado: ${stats.porcentajeCompletado}%`);
 */
export async function getSubtareaEstadisticas(
  tareaId: number | string
): Promise<SubtareaEstadisticas> {
  const response = await apiClient.get<SubtareaEstadisticas>(
    `${ENDPOINTS.TAREAS.BY_ID(tareaId)}/subtareas/estadisticas`
  );
  return response.data;
}

/**
 * Calcular estadísticas de subtareas localmente
 * Útil cuando ya tienes las subtareas cargadas
 *
 * @param subtareas - Array de subtareas
 * @returns Estadísticas calculadas
 */
export function calcularEstadisticasLocal(
  subtareas: Subtarea[]
): SubtareaEstadisticas {
  const total = subtareas.length;
  const porHacer = subtareas.filter((s) => s.estado === 'Por hacer').length;
  const enProgreso = subtareas.filter((s) => s.estado === 'En progreso').length;
  const finalizadas = subtareas.filter((s) => s.estado === 'Finalizado').length;
  const validadas = subtareas.filter((s) => s.estado === 'Validado').length;

  const completadas = finalizadas + validadas;
  const porcentajeCompletado = total > 0 ? (completadas / total) * 100 : 0;

  const horasEstimadas = subtareas.reduce(
    (sum, s) => sum + (s.horasEstimadas || 0),
    0
  );
  const horasReales = subtareas.reduce(
    (sum, s) => sum + (s.horasReales || 0),
    0
  );

  return {
    total,
    porHacer,
    enProgreso,
    finalizadas,
    validadas,
    porcentajeCompletado: Math.round(porcentajeCompletado * 100) / 100,
    horasEstimadas,
    horasReales,
  };
}

// ============================================
// Asignación Operations
// ============================================

/**
 * Asignar subtarea a un responsable
 *
 * @param id - ID de la subtarea
 * @param responsableId - ID del usuario responsable
 * @returns Subtarea actualizada
 */
export async function asignarSubtarea(
  id: number | string,
  responsableId: number
): Promise<Subtarea> {
  return updateSubtarea(id, { responsable: responsableId });
}

/**
 * Desasignar subtarea (quitar responsable)
 *
 * @param id - ID de la subtarea
 * @returns Subtarea sin responsable
 */
export async function desasignarSubtarea(
  id: number | string
): Promise<Subtarea> {
  return updateSubtarea(id, { responsable: undefined });
}

// ============================================
// Evidencia Operations
// ============================================

/**
 * Agregar evidencia a una subtarea
 *
 * @param id - ID de la subtarea
 * @param evidenciaUrl - URL de la evidencia
 * @returns Subtarea actualizada
 */
export async function agregarEvidenciaSubtarea(
  id: number | string,
  evidenciaUrl: string
): Promise<Subtarea> {
  return updateSubtarea(id, { evidenciaUrl });
}

// ============================================
// Utility Functions
// ============================================

/**
 * Obtener subtareas por estado
 *
 * @param tareaId - ID de la tarea padre
 * @param estado - Estado a filtrar
 * @returns Lista de subtareas con el estado especificado
 */
export async function getSubtareasByEstado(
  tareaId: number | string,
  estado: SubtareaEstado
): Promise<Subtarea[]> {
  return getSubtareasByTarea(tareaId, { estado });
}

/**
 * Obtener subtareas asignadas a un usuario
 *
 * @param tareaId - ID de la tarea padre
 * @param responsableId - ID del usuario responsable
 * @returns Lista de subtareas asignadas al usuario
 */
export async function getSubtareasByResponsable(
  tareaId: number | string,
  responsableId: number
): Promise<Subtarea[]> {
  return getSubtareasByTarea(tareaId, { responsable: responsableId });
}

/**
 * Obtener subtareas pendientes de validación
 *
 * @param tareaId - ID de la tarea padre
 * @returns Lista de subtareas finalizadas pero no validadas
 */
export async function getSubtareasPendientesValidacion(
  tareaId: number | string
): Promise<Subtarea[]> {
  const subtareas = await getSubtareasByTarea(tareaId, {
    estado: 'Finalizado',
  });
  return subtareas.filter((subtarea) => !subtarea.validada);
}

/**
 * Registrar horas trabajadas en una subtarea
 *
 * @param id - ID de la subtarea
 * @param horas - Horas a agregar
 * @returns Subtarea actualizada
 */
export async function registrarHorasSubtarea(
  id: number | string,
  horas: number
): Promise<Subtarea> {
  const subtarea = await getSubtareaById(id);
  const horasActuales = subtarea.horasReales || 0;
  return updateSubtarea(id, { horasReales: horasActuales + horas });
}

/**
 * Devolver subtarea a "Por hacer"
 *
 * @param id - ID de la subtarea
 * @returns Subtarea actualizada
 */
export async function devolverSubtarea(
  id: number | string
): Promise<Subtarea> {
  return cambiarEstadoSubtarea(id, 'Por hacer');
}

/**
 * Verificar si una subtarea existe
 *
 * @param id - ID de la subtarea
 * @returns true si existe, false si no
 */
export async function subtareaExists(id: number | string): Promise<boolean> {
  try {
    await getSubtareaById(id);
    return true;
  } catch {
    return false;
  }
}

/**
 * Verificar si todas las subtareas de una tarea están completadas
 *
 * @param tareaId - ID de la tarea padre
 * @returns true si todas están completadas o validadas
 */
export async function todasSubtareasCompletadas(
  tareaId: number | string
): Promise<boolean> {
  const subtareas = await getSubtareasByTarea(tareaId);

  if (subtareas.length === 0) {
    return true; // Sin subtareas, se considera completa
  }

  return subtareas.every(
    (subtarea) =>
      subtarea.estado === 'Finalizado' || subtarea.estado === 'Validado'
  );
}

/**
 * Crear múltiples subtareas a la vez
 *
 * @param subtareas - Array de datos para crear subtareas
 * @returns Array de subtareas creadas
 */
export async function createMultipleSubtareas(
  subtareas: CreateSubtareaInput[]
): Promise<Subtarea[]> {
  const promises = subtareas.map((data) => createSubtarea(data));
  return Promise.all(promises);
}

// ============================================
// Reordering Operations (Drag & Drop)
// ============================================

/**
 * Reordenar subtareas de una tarea
 *
 * @param tareaId - ID de la tarea padre
 * @param orden - Array de IDs de subtareas en el nuevo orden
 * @returns Lista de subtareas reordenadas
 *
 * @example
 * // Mover subtarea con ID 3 al inicio
 * const subtareas = await reordenarSubtareas(1, [3, 1, 2, 4]);
 */
export async function reordenarSubtareas(
  tareaId: number | string,
  orden: number[]
): Promise<Subtarea[]> {
  const response = await apiClient.patch<Subtarea[]>(
    `${ENDPOINTS.TAREAS.BY_ID(tareaId)}/subtareas/reordenar`,
    { orden }
  );
  return response.data;
}
