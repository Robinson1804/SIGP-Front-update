/**
 * Tareas Kanban Service
 *
 * Servicios para gestión de Tareas tipo KANBAN (asociadas a Actividades)
 * Conecta con el backend NestJS en localhost:3010/api/v1
 *
 * IMPORTANTE: Las tareas KANBAN pertenecen a Actividades y SÍ pueden tener subtareas.
 * A diferencia de las tareas SCRUM que pertenecen a Historias de Usuario y NO pueden tener subtareas.
 */

import { apiClient, ENDPOINTS } from '@/lib/api';
import type { PaginatedResponse } from '@/types';
import type {
  TareaKanban,
  CreateTareaKanbanInput,
  UpdateTareaKanbanInput,
  TareaKanbanQueryFilters,
  TareaEstado,
  CambiarEstadoTareaInput,
  MoverTareaInput,
} from '../types';

// ============================================
// CRUD Operations
// ============================================

/**
 * Obtener todas las tareas de una actividad
 *
 * @param actividadId - ID de la actividad
 * @param filters - Filtros opcionales
 * @returns Lista de tareas de la actividad
 *
 * @example
 * const tareas = await getTareasByActividad(1, { estado: 'En progreso' });
 */
export async function getTareasByActividad(
  actividadId: number | string,
  filters?: Omit<TareaKanbanQueryFilters, 'actividadId'>
): Promise<TareaKanban[]> {
  const response = await apiClient.get<TareaKanban[]>(
    ENDPOINTS.ACTIVIDADES.TAREAS(actividadId),
    { params: filters }
  );
  return response.data;
}

/**
 * Obtener una tarea por su ID
 *
 * @param id - ID de la tarea
 * @returns Datos completos de la tarea
 *
 * @example
 * const tarea = await getTareaById(1);
 */
export async function getTareaById(id: number | string): Promise<TareaKanban> {
  const response = await apiClient.get<TareaKanban>(
    ENDPOINTS.TAREAS.BY_ID(id)
  );
  return response.data;
}

/**
 * Crear una nueva tarea Kanban
 *
 * @param data - Datos para crear la tarea
 * @returns Tarea creada
 *
 * @example
 * const nuevaTarea = await createTarea({
 *   nombre: 'Revisar documentación',
 *   actividadId: 1,
 *   prioridad: 'Alta',
 *   asignadoA: 5,
 * });
 */
export async function createTarea(
  data: CreateTareaKanbanInput
): Promise<TareaKanban> {
  // Aseguramos que se envíe el tipo KANBAN
  const payload = {
    ...data,
    tipo: 'KANBAN' as const,
  };

  const response = await apiClient.post<TareaKanban>(
    ENDPOINTS.TAREAS.BASE,
    payload
  );
  return response.data;
}

/**
 * Actualizar una tarea existente
 *
 * @param id - ID de la tarea a actualizar
 * @param data - Datos a actualizar
 * @returns Tarea actualizada
 *
 * @example
 * const tareaActualizada = await updateTarea(1, {
 *   nombre: 'Nuevo nombre',
 *   prioridad: 'Media',
 * });
 */
export async function updateTarea(
  id: number | string,
  data: UpdateTareaKanbanInput
): Promise<TareaKanban> {
  const response = await apiClient.patch<TareaKanban>(
    ENDPOINTS.TAREAS.BY_ID(id),
    data
  );
  return response.data;
}

/**
 * Eliminar una tarea (soft delete)
 *
 * @param id - ID de la tarea a eliminar
 *
 * @example
 * await deleteTarea(1);
 */
export async function deleteTarea(id: number | string): Promise<void> {
  await apiClient.delete(ENDPOINTS.TAREAS.BY_ID(id));
}

// ============================================
// Estado y Movimiento Operations
// ============================================

/**
 * Cambiar estado de una tarea
 * Endpoint específico para cambios de estado
 *
 * @param id - ID de la tarea
 * @param estado - Nuevo estado
 * @returns Tarea actualizada
 *
 * @example
 * const tarea = await cambiarEstado(1, 'En progreso');
 */
export async function cambiarEstado(
  id: number | string,
  estado: TareaEstado
): Promise<TareaKanban> {
  const payload: CambiarEstadoTareaInput = { estado };
  const response = await apiClient.patch<TareaKanban>(
    ENDPOINTS.TAREAS.CAMBIAR_ESTADO(id),
    payload
  );
  return response.data;
}

/**
 * Mover una tarea en el tablero Kanban
 * Permite cambiar estado y orden en una sola operación
 *
 * @param id - ID de la tarea
 * @param estado - Nuevo estado (columna destino)
 * @param orden - Posición en la columna (opcional)
 * @returns Tarea actualizada
 *
 * @example
 * // Mover tarea a "En progreso" en la posición 2
 * const tarea = await moverTarea(1, 'En progreso', 2);
 */
export async function moverTarea(
  id: number | string,
  estado: TareaEstado,
  orden?: number
): Promise<TareaKanban> {
  const payload: MoverTareaInput = { estado, orden };
  const response = await apiClient.patch<TareaKanban>(
    `${ENDPOINTS.TAREAS.BY_ID(id)}/mover`,
    payload
  );
  return response.data;
}

// ============================================
// Validación Operations
// ============================================

/**
 * Validar una tarea
 * Solo puede ser validada por Scrum Master o Coordinador
 *
 * @param id - ID de la tarea
 * @param observacion - Observación opcional sobre la validación
 * @returns Tarea validada
 *
 * @example
 * const tarea = await validarTarea(1, 'Trabajo bien realizado');
 */
export async function validarTarea(
  id: number | string,
  observacion?: string
): Promise<TareaKanban> {
  const response = await apiClient.patch<TareaKanban>(
    `${ENDPOINTS.TAREAS.BY_ID(id)}/validar`,
    { observacion }
  );
  return response.data;
}

/**
 * Rechazar validación de una tarea
 *
 * @param id - ID de la tarea
 * @param observacion - Motivo del rechazo
 * @returns Tarea con validación rechazada
 *
 * @example
 * const tarea = await rechazarValidacion(1, 'Falta evidencia completa');
 */
export async function rechazarValidacion(
  id: number | string,
  observacion: string
): Promise<TareaKanban> {
  const response = await apiClient.patch<TareaKanban>(
    `${ENDPOINTS.TAREAS.BY_ID(id)}/rechazar-validacion`,
    { observacion }
  );
  return response.data;
}

// ============================================
// Asignación Operations
// ============================================

/**
 * Asignar tarea a un usuario
 *
 * @param id - ID de la tarea
 * @param usuarioId - ID del usuario a asignar
 * @returns Tarea actualizada
 *
 * @example
 * const tarea = await asignarTarea(1, 5);
 */
export async function asignarTarea(
  id: number | string,
  usuarioId: number
): Promise<TareaKanban> {
  const response = await apiClient.patch<TareaKanban>(
    ENDPOINTS.TAREAS.ASIGNAR(id),
    { usuarioId }
  );
  return response.data;
}

/**
 * Desasignar tarea (quitar asignación)
 *
 * @param id - ID de la tarea
 * @returns Tarea sin asignación
 */
export async function desasignarTarea(
  id: number | string
): Promise<TareaKanban> {
  return updateTarea(id, { asignadoA: undefined });
}

// ============================================
// Evidencia Operations
// ============================================

/**
 * Agregar evidencia a una tarea
 *
 * @param id - ID de la tarea
 * @param evidenciaUrl - URL de la evidencia
 * @returns Tarea actualizada
 *
 * @example
 * const tarea = await agregarEvidencia(1, 'https://storage.example.com/evidencia.pdf');
 */
export async function agregarEvidencia(
  id: number | string,
  evidenciaUrl: string
): Promise<TareaKanban> {
  return updateTarea(id, { evidenciaUrl });
}

// ============================================
// Comentarios Operations
// ============================================

/**
 * Obtener comentarios de una tarea
 *
 * @param id - ID de la tarea
 * @returns Lista de comentarios
 */
export async function getTareaComentarios(id: number | string) {
  const response = await apiClient.get(ENDPOINTS.TAREAS.COMENTARIOS(id));
  return response.data;
}

/**
 * Agregar comentario a una tarea
 *
 * @param id - ID de la tarea
 * @param contenido - Contenido del comentario
 * @returns Comentario creado
 */
export async function agregarComentario(
  id: number | string,
  contenido: string
) {
  const response = await apiClient.post(ENDPOINTS.TAREAS.COMENTARIOS(id), {
    contenido,
  });
  return response.data;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Obtener tareas por estado
 *
 * @param actividadId - ID de la actividad
 * @param estado - Estado a filtrar
 * @returns Lista de tareas con el estado especificado
 */
export async function getTareasByEstado(
  actividadId: number | string,
  estado: TareaEstado
): Promise<TareaKanban[]> {
  return getTareasByActividad(actividadId, { estado });
}

/**
 * Obtener tareas asignadas a un usuario
 *
 * @param actividadId - ID de la actividad
 * @param usuarioId - ID del usuario
 * @returns Lista de tareas asignadas al usuario
 */
export async function getTareasByUsuario(
  actividadId: number | string,
  usuarioId: number
): Promise<TareaKanban[]> {
  return getTareasByActividad(actividadId, { asignadoA: usuarioId });
}

/**
 * Obtener tareas pendientes de validación
 *
 * @param actividadId - ID de la actividad
 * @returns Lista de tareas finalizadas pero no validadas
 */
export async function getTareasPendientesValidacion(
  actividadId: number | string
): Promise<TareaKanban[]> {
  const todasTareas = await getTareasByActividad(actividadId, {
    estado: 'Finalizado',
  });
  return todasTareas.filter((tarea) => !tarea.validada);
}

/**
 * Iniciar trabajo en una tarea
 * Cambia el estado a "En progreso"
 *
 * @param id - ID de la tarea
 * @returns Tarea actualizada
 */
export async function iniciarTarea(id: number | string): Promise<TareaKanban> {
  return cambiarEstado(id, 'En progreso');
}

/**
 * Enviar tarea a revisión
 * Cambia el estado a "En revision"
 *
 * @param id - ID de la tarea
 * @returns Tarea actualizada
 */
export async function enviarARevision(
  id: number | string
): Promise<TareaKanban> {
  return cambiarEstado(id, 'En revision');
}

/**
 * Finalizar tarea
 * Cambia el estado a "Finalizado"
 *
 * @param id - ID de la tarea
 * @param evidenciaUrl - URL de la evidencia (requerida para finalizar)
 * @returns Tarea finalizada
 */
export async function finalizarTarea(
  id: number | string,
  evidenciaUrl?: string
): Promise<TareaKanban> {
  if (evidenciaUrl) {
    await agregarEvidencia(id, evidenciaUrl);
  }
  return cambiarEstado(id, 'Finalizado');
}

/**
 * Devolver tarea a "Por hacer"
 *
 * @param id - ID de la tarea
 * @returns Tarea actualizada
 */
export async function devolverTarea(id: number | string): Promise<TareaKanban> {
  return cambiarEstado(id, 'Por hacer');
}

/**
 * Registrar horas trabajadas en una tarea
 *
 * @param id - ID de la tarea
 * @param horas - Horas trabajadas
 * @returns Tarea actualizada
 */
export async function registrarHoras(
  id: number | string,
  horas: number
): Promise<TareaKanban> {
  const tarea = await getTareaById(id);
  const horasActuales = tarea.horasReales || 0;
  return updateTarea(id, { horasReales: horasActuales + horas });
}

/**
 * Verificar si una tarea existe
 *
 * @param id - ID de la tarea
 * @returns true si existe, false si no
 */
export async function tareaExists(id: number | string): Promise<boolean> {
  try {
    await getTareaById(id);
    return true;
  } catch {
    return false;
  }
}
