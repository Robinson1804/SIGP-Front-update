/**
 * Tareas Service
 *
 * Servicios para gestion de tareas en proyectos Scrum
 *
 * IMPORTANTE: Las tareas Scrum NO pueden tener subtareas.
 * Las tareas Scrum siempre estan asociadas a una Historia de Usuario.
 */

import { apiClient, del, ENDPOINTS } from '@/lib/api';
import type { PaginatedResponse } from '@/types';

// ============================================
// TIPOS
// ============================================

/**
 * Estados posibles de una tarea
 */
export type TareaEstado = 'Por hacer' | 'En progreso' | 'En revision' | 'Finalizado';

/**
 * Prioridad de tarea
 */
export type TareaPrioridad = 'Alta' | 'Media' | 'Baja';

/**
 * Tipo de tarea (discriminador Scrum vs Kanban)
 */
export type TareaTipo = 'SCRUM' | 'KANBAN';

/**
 * Interfaz de Tarea basada en el backend schema
 */
export interface Tarea {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  tipo: TareaTipo;

  // Relaciones - Solo una estara presente segun el tipo
  historiaUsuarioId: number | null; // Solo SCRUM
  actividadId: number | null;       // Solo KANBAN

  estado: TareaEstado;
  prioridad: TareaPrioridad;

  // Asignacion
  responsableId: number | null;
  responsable?: {
    id: number;
    nombre: string;
    email: string;
  } | null;

  // Estimacion
  horasEstimadas: number | null;
  horasReales: number | null;

  // Fechas
  fechaInicio: string | null;
  fechaFin: string | null;
  fechaLimite: string | null;

  // Ordenamiento
  orden: number;

  // Auditoria
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: number;

  // Relaciones opcionales (cargadas segun la consulta)
  historiaUsuario?: {
    id: number;
    codigo: string;
    nombre: string;
  } | null;
  comentarios?: TareaComentario[];
}

/**
 * Comentario de tarea
 */
export interface TareaComentario {
  id: number;
  texto: string;
  usuarioId: number;
  usuario: {
    id: number;
    nombre: string;
    apellido?: string;
  };
  createdAt: string;
  respuestas?: TareaComentario[];
}

/**
 * Evidencia de tarea
 */
export interface TareaEvidencia {
  id: number;
  tareaId: number;
  nombre: string;
  descripcion: string | null;
  url: string;
  tipo: string | null; // 'documento', 'imagen', 'video', 'enlace'
  tamanoBytes: number | null;
  subidoPor: number;
  usuario?: {
    id: number;
    nombre: string;
  };
  createdAt: string;
}

/**
 * Datos para crear evidencia
 */
export interface CreateEvidenciaData {
  nombre: string;
  descripcion?: string;
  url: string;
  tipo?: string;
  tamanoBytes?: number;
}

/**
 * Datos para crear una tarea Scrum
 */
export interface CreateTareaData {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  historiaUsuarioId: number;
  prioridad?: TareaPrioridad;
  responsableId?: number;
  horasEstimadas?: number;
  fechaInicio?: string;
  fechaFin?: string;
  fechaLimite?: string;
  orden?: number;
}

/**
 * Datos para actualizar una tarea
 */
export interface UpdateTareaData extends Partial<Omit<CreateTareaData, 'historiaUsuarioId'>> {
  estado?: TareaEstado;
  horasReales?: number;
}

/**
 * Filtros para consultar tareas
 */
export interface TareaQueryFilters {
  estado?: TareaEstado;
  prioridad?: TareaPrioridad;
  responsableId?: number;
  page?: number;
  pageSize?: number;
}

/**
 * Datos para mover una tarea (drag & drop)
 */
export interface MoverTareaData {
  estado: TareaEstado;
  orden: number;
}

// ============================================
// SERVICIOS
// ============================================

/**
 * Obtener tareas de una historia de usuario
 */
export async function getTareasByHistoria(
  historiaId: number | string,
  filters?: TareaQueryFilters
): Promise<Tarea[]> {
  const response = await apiClient.get<Tarea[]>(
    ENDPOINTS.HISTORIAS.TAREAS(historiaId),
    { params: filters }
  );
  return response.data;
}

/**
 * Obtener una tarea por ID
 */
export async function getTareaById(id: number | string): Promise<Tarea> {
  const response = await apiClient.get<Tarea>(
    ENDPOINTS.TAREAS.BY_ID(id)
  );
  return response.data;
}

/**
 * Crear una nueva tarea
 *
 * NOTA: Para tareas Scrum, siempre debe incluir historiaUsuarioId
 */
export async function createTarea(data: CreateTareaData): Promise<Tarea> {
  const tareaData = {
    ...data,
    tipo: 'SCRUM' as TareaTipo,
  };

  const response = await apiClient.post<Tarea>(
    ENDPOINTS.TAREAS.BASE,
    tareaData
  );
  return response.data;
}

/**
 * Actualizar una tarea existente
 */
export async function updateTarea(
  id: number | string,
  data: UpdateTareaData
): Promise<Tarea> {
  const response = await apiClient.patch<Tarea>(
    ENDPOINTS.TAREAS.BY_ID(id),
    data
  );
  return response.data;
}

/**
 * Eliminar una tarea
 */
export async function deleteTarea(id: number | string): Promise<void> {
  await del(ENDPOINTS.TAREAS.BY_ID(id));
}

/**
 * Cambiar estado de una tarea
 */
export async function cambiarEstadoTarea(
  id: number | string,
  estado: TareaEstado
): Promise<Tarea> {
  const response = await apiClient.patch<Tarea>(
    ENDPOINTS.TAREAS.CAMBIAR_ESTADO(id),
    { estado }
  );
  return response.data;
}

/**
 * Mover una tarea (cambiar estado y/o orden - para drag & drop en tablero)
 */
export async function moverTarea(
  id: number | string,
  estado: TareaEstado,
  orden: number
): Promise<Tarea> {
  const response = await apiClient.patch<Tarea>(
    `${ENDPOINTS.TAREAS.BY_ID(id)}/mover`,
    { estado, orden }
  );
  return response.data;
}

/**
 * Asignar una tarea a un responsable
 */
export async function asignarTarea(
  id: number | string,
  responsableId: number | null
): Promise<Tarea> {
  const response = await apiClient.patch<Tarea>(
    ENDPOINTS.TAREAS.ASIGNAR(id),
    { responsableId }
  );
  return response.data;
}

/**
 * Obtener comentarios de una tarea
 */
export async function getTareaComentarios(tareaId: number | string): Promise<TareaComentario[]> {
  const response = await apiClient.get<TareaComentario[]>(
    ENDPOINTS.TAREAS.COMENTARIOS(tareaId)
  );
  return response.data;
}

/**
 * Agregar comentario a una tarea
 */
export async function agregarComentario(
  tareaId: number | string,
  texto: string
): Promise<TareaComentario> {
  const response = await apiClient.post<TareaComentario>(
    ENDPOINTS.TAREAS.COMENTARIOS(tareaId),
    { texto }
  );
  return response.data;
}

/**
 * Eliminar comentario de una tarea
 */
export async function eliminarComentario(
  tareaId: number | string,
  comentarioId: number | string
): Promise<void> {
  await del(`${ENDPOINTS.TAREAS.COMENTARIOS(tareaId)}/${comentarioId}`);
}

/**
 * Registrar horas trabajadas en una tarea
 */
export async function registrarHoras(
  id: number | string,
  horas: number
): Promise<Tarea> {
  const response = await apiClient.patch<Tarea>(
    `${ENDPOINTS.TAREAS.BY_ID(id)}/registrar-horas`,
    { horas }
  );
  return response.data;
}

/**
 * Obtener tareas asignadas al usuario actual
 */
export async function getMisTareas(filters?: TareaQueryFilters): Promise<Tarea[]> {
  const response = await apiClient.get<Tarea[]>(
    `${ENDPOINTS.TAREAS.BASE}/mis-tareas`,
    { params: filters }
  );
  return response.data;
}

/**
 * Obtener resumen de tareas de un proyecto
 */
export async function getTareasResumenProyecto(proyectoId: number | string) {
  const response = await apiClient.get(
    `${ENDPOINTS.PROYECTOS.BY_ID(proyectoId)}/tareas/resumen`
  );
  return response.data;
}

// ============================================
// EVIDENCIAS
// ============================================

/**
 * Obtener evidencias de una tarea
 */
export async function getTareaEvidencias(tareaId: number | string): Promise<TareaEvidencia[]> {
  const response = await apiClient.get<TareaEvidencia[]>(
    `${ENDPOINTS.TAREAS.BY_ID(tareaId)}/evidencias`
  );
  return response.data;
}

/**
 * Agregar evidencia a una tarea
 */
export async function agregarEvidencia(
  tareaId: number | string,
  data: CreateEvidenciaData
): Promise<TareaEvidencia> {
  const response = await apiClient.post<TareaEvidencia>(
    `${ENDPOINTS.TAREAS.BY_ID(tareaId)}/evidencias`,
    data
  );
  return response.data;
}

/**
 * Eliminar evidencia de una tarea
 */
export async function eliminarEvidencia(
  tareaId: number | string,
  evidenciaId: number | string
): Promise<void> {
  await del(`${ENDPOINTS.TAREAS.BY_ID(tareaId)}/evidencias/${evidenciaId}`);
}
