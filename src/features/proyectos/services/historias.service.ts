/**
 * Historias de Usuario Service
 *
 * Servicios para gestion de historias de usuario en proyectos Scrum
 */

import { apiClient, del, ENDPOINTS } from '@/lib/api';
import type { PaginatedResponse } from '@/types';
import type { PrioridadMoSCoW } from './epicas.service';

// Re-export para conveniencia
export type { PrioridadMoSCoW } from './epicas.service';

// ============================================
// TIPOS
// ============================================

/**
 * Estados posibles de una historia de usuario
 */
export type HistoriaEstado =
  | 'Pendiente'
  | 'En analisis'
  | 'Lista'
  | 'En desarrollo'
  | 'En pruebas'
  | 'En revision'
  | 'Terminada';

/**
 * Interfaz de Historia de Usuario basada en el backend schema
 */
export interface HistoriaUsuario {
  id: number;
  codigo: string;
  titulo: string;
  descripcion: string | null;
  comoUsuario: string | null;
  quiero: string | null;
  para: string | null;
  proyectoId: number;
  epicaId: number | null;
  sprintId: number | null;
  estado: HistoriaEstado;
  prioridad: PrioridadMoSCoW | null;
  puntos: number | null;
  valorNegocio: number | null;
  orden: number;
  fechaInicio: string | null;
  fechaFin: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  // Relaciones opcionales
  epica?: {
    id: number;
    nombre: string;
    color: string | null;
  } | null;
  sprint?: {
    id: number;
    nombre: string;
    numero: number;
  } | null;
  tareas?: TareaResumen[];
  criteriosAceptacion?: CriterioAceptacion[];
}

/**
 * Resumen de tarea (para listados)
 */
export interface TareaResumen {
  id: number;
  titulo: string;
  estado: string;
  responsableId: number | null;
}

/**
 * Criterio de aceptacion
 */
export interface CriterioAceptacion {
  id: number;
  descripcion: string;
  completado: boolean;
  orden: number;
}

/**
 * Datos para crear una historia de usuario
 */
export interface CreateHistoriaData {
  codigo?: string;
  titulo: string;
  descripcion?: string;
  comoUsuario?: string;
  quiero?: string;
  para?: string;
  proyectoId: number;
  epicaId?: number;
  sprintId?: number;
  prioridad?: PrioridadMoSCoW;
  puntos?: number;
  valorNegocio?: number;
  orden?: number;
  fechaInicio?: string;
  fechaFin?: string;
  criteriosAceptacion?: Omit<CriterioAceptacion, 'id'>[];
}

/**
 * Datos para actualizar una historia de usuario
 */
export interface UpdateHistoriaData extends Partial<Omit<CreateHistoriaData, 'proyectoId'>> {
  estado?: HistoriaEstado;
}

/**
 * Filtros para consultar historias
 */
export interface HistoriaQueryFilters {
  estado?: HistoriaEstado;
  prioridad?: PrioridadMoSCoW;
  epicaId?: number;
  sprintId?: number;
  sinSprint?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * Estructura del backlog
 */
export interface BacklogData {
  historias: HistoriaUsuario[];
  totalPuntos: number;
  historiasConPuntos: number;
  historiasSinPuntos: number;
  distribucionPrioridad: {
    prioridad: PrioridadMoSCoW;
    cantidad: number;
    puntos: number;
  }[];
}

// ============================================
// SERVICIOS
// ============================================

/**
 * Obtener backlog de un proyecto (historias sin sprint asignado)
 */
export async function getBacklog(
  proyectoId: number | string,
  filters?: HistoriaQueryFilters
): Promise<BacklogData> {
  const response = await apiClient.get<BacklogData>(
    `${ENDPOINTS.PROYECTOS.BY_ID(proyectoId)}/historias-usuario/backlog`,
    { params: filters }
  );
  return response.data;
}

/**
 * Obtener historias de usuario de un sprint
 */
export async function getHistoriasBySprint(
  sprintId: number | string,
  filters?: HistoriaQueryFilters
): Promise<HistoriaUsuario[]> {
  const response = await apiClient.get<HistoriaUsuario[]>(
    `${ENDPOINTS.SPRINTS.BY_ID(sprintId)}/historias-usuario`,
    { params: filters }
  );
  return response.data;
}

/**
 * Obtener historias de usuario de una epica
 */
export async function getHistoriasByEpica(
  epicaId: number | string,
  filters?: HistoriaQueryFilters
): Promise<HistoriaUsuario[]> {
  const response = await apiClient.get<HistoriaUsuario[]>(
    `/epicas/${epicaId}/historias-usuario`,
    { params: filters }
  );
  return response.data;
}

/**
 * Obtener una historia de usuario por ID
 */
export async function getHistoriaById(id: number | string): Promise<HistoriaUsuario> {
  const response = await apiClient.get<HistoriaUsuario>(
    ENDPOINTS.HISTORIAS.BY_ID(id)
  );
  return response.data;
}

/**
 * Crear una nueva historia de usuario
 */
export async function createHistoria(data: CreateHistoriaData): Promise<HistoriaUsuario> {
  const response = await apiClient.post<HistoriaUsuario>(
    ENDPOINTS.HISTORIAS.BASE,
    data
  );
  return response.data;
}

/**
 * Actualizar una historia de usuario existente
 */
export async function updateHistoria(
  id: number | string,
  data: UpdateHistoriaData
): Promise<HistoriaUsuario> {
  const response = await apiClient.patch<HistoriaUsuario>(
    ENDPOINTS.HISTORIAS.BY_ID(id),
    data
  );
  return response.data;
}

/**
 * Eliminar una historia de usuario
 */
export async function deleteHistoria(id: number | string): Promise<void> {
  await del(ENDPOINTS.HISTORIAS.BY_ID(id));
}

/**
 * Cambiar estado de una historia de usuario
 */
export async function cambiarEstadoHistoria(
  id: number | string,
  estado: HistoriaEstado
): Promise<HistoriaUsuario> {
  const response = await apiClient.patch<HistoriaUsuario>(
    `${ENDPOINTS.HISTORIAS.BY_ID(id)}/estado`,
    { estado }
  );
  return response.data;
}

/**
 * Mover una historia de usuario a un sprint
 */
export async function moverHistoriaASprint(
  id: number | string,
  sprintId: number | null
): Promise<HistoriaUsuario> {
  const response = await apiClient.patch<HistoriaUsuario>(
    ENDPOINTS.HISTORIAS.MOVER_SPRINT(id),
    { sprintId }
  );
  return response.data;
}

/**
 * Reordenar historias en el backlog de un proyecto
 */
export async function reordenarBacklog(
  proyectoId: number | string,
  ordenIds: number[]
): Promise<HistoriaUsuario[]> {
  const response = await apiClient.patch<HistoriaUsuario[]>(
    `${ENDPOINTS.PROYECTOS.BY_ID(proyectoId)}/historias-usuario/backlog/reordenar`,
    { ordenIds }
  );
  return response.data;
}

/**
 * Obtener tareas de una historia de usuario
 */
export async function getHistoriaTareas(historiaId: number | string) {
  const response = await apiClient.get(
    ENDPOINTS.HISTORIAS.TAREAS(historiaId)
  );
  return response.data;
}

/**
 * Obtener criterios de aceptacion de una historia
 */
export async function getHistoriaCriterios(historiaId: number | string): Promise<CriterioAceptacion[]> {
  const response = await apiClient.get<CriterioAceptacion[]>(
    ENDPOINTS.HISTORIAS.CRITERIOS(historiaId)
  );
  return response.data;
}

/**
 * Agregar criterio de aceptacion a una historia
 */
export async function agregarCriterio(
  historiaId: number | string,
  data: Omit<CriterioAceptacion, 'id'>
): Promise<CriterioAceptacion> {
  const response = await apiClient.post<CriterioAceptacion>(
    ENDPOINTS.HISTORIAS.CRITERIOS(historiaId),
    data
  );
  return response.data;
}

/**
 * Actualizar criterio de aceptacion
 */
export async function actualizarCriterio(
  historiaId: number | string,
  criterioId: number | string,
  data: Partial<Omit<CriterioAceptacion, 'id'>>
): Promise<CriterioAceptacion> {
  const response = await apiClient.patch<CriterioAceptacion>(
    `${ENDPOINTS.HISTORIAS.CRITERIOS(historiaId)}/${criterioId}`,
    data
  );
  return response.data;
}

/**
 * Eliminar criterio de aceptacion
 */
export async function eliminarCriterio(
  historiaId: number | string,
  criterioId: number | string
): Promise<void> {
  await del(`${ENDPOINTS.HISTORIAS.CRITERIOS(historiaId)}/${criterioId}`);
}
