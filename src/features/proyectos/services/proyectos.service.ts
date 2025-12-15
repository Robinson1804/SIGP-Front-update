/**
 * Proyectos Service
 *
 * Servicios para gestión de proyectos
 */

import { apiClient, del, ENDPOINTS } from '@/lib/api';
import type { Proyecto } from '@/lib/definitions';
import type { PaginatedResponse } from '@/types';

export interface ProyectoQueryFilters {
  search?: string;
  estado?: string;
  tipo?: 'Proyecto' | 'Actividad';
  anno?: number;
  page?: number;
  pageSize?: number;
}

export interface CreateProyectoData {
  nombre: string;
  descripcion?: string;
  tipo: 'Proyecto' | 'Actividad';
  anno: number;
  estadoInicial?: string;
  accionEstrategicaId?: number;
  responsableId?: number;
}

export interface UpdateProyectoData extends Partial<CreateProyectoData> {
  estado?: string;
}

/**
 * Obtener lista de proyectos con filtros opcionales
 */
export async function getProyectos(
  filters?: ProyectoQueryFilters
): Promise<PaginatedResponse<Proyecto>> {
  const response = await apiClient.get<PaginatedResponse<Proyecto>>(
    ENDPOINTS.PROYECTOS.BASE,
    { params: filters }
  );
  return response.data;
}

/**
 * Obtener un proyecto por ID
 */
export async function getProyectoById(id: number | string): Promise<Proyecto> {
  const response = await apiClient.get<Proyecto>(
    ENDPOINTS.PROYECTOS.BY_ID(id)
  );
  return response.data;
}

/**
 * Crear un nuevo proyecto
 */
export async function createProyecto(data: CreateProyectoData): Promise<Proyecto> {
  const response = await apiClient.post<Proyecto>(
    ENDPOINTS.PROYECTOS.BASE,
    data
  );
  return response.data;
}

/**
 * Actualizar un proyecto existente
 */
export async function updateProyecto(
  id: number | string,
  data: UpdateProyectoData
): Promise<Proyecto> {
  const response = await apiClient.patch<Proyecto>(
    ENDPOINTS.PROYECTOS.BY_ID(id),
    data
  );
  return response.data;
}

/**
 * Eliminar un proyecto
 */
export async function deleteProyecto(id: number | string): Promise<void> {
  await del(ENDPOINTS.PROYECTOS.BY_ID(id));
}

/**
 * Obtener backlog de un proyecto
 */
export async function getProyectoBacklog(proyectoId: number | string) {
  const response = await apiClient.get(
    ENDPOINTS.PROYECTOS.BACKLOG(proyectoId)
  );
  return response.data;
}

/**
 * Obtener épicas de un proyecto
 */
export async function getProyectoEpicas(proyectoId: number | string) {
  const response = await apiClient.get(
    ENDPOINTS.PROYECTOS.EPICAS(proyectoId)
  );
  return response.data;
}

/**
 * Obtener sprints de un proyecto
 */
export async function getProyectoSprints(proyectoId: number | string) {
  const response = await apiClient.get(
    ENDPOINTS.PROYECTOS.SPRINTS(proyectoId)
  );
  return response.data;
}

/**
 * Obtener historias de usuario de un proyecto
 */
export async function getProyectoHistorias(proyectoId: number | string) {
  const response = await apiClient.get(
    ENDPOINTS.PROYECTOS.HISTORIAS(proyectoId)
  );
  return response.data;
}

/**
 * Obtener tareas de un proyecto
 * Nota: Las tareas están asociadas a historias de usuario y sprints
 */
export async function getProyectoTareas(proyectoId: number | string) {
  // Las tareas se obtienen a través de las historias o sprints
  // Esta es una función de conveniencia que obtiene tareas filtradas por proyecto
  const response = await apiClient.get(
    ENDPOINTS.TAREAS.BASE,
    { params: { proyectoId } }
  );
  return response.data;
}

/**
 * Obtener documentos de un proyecto
 */
export async function getProyectoDocumentos(proyectoId: number | string) {
  const response = await apiClient.get(
    ENDPOINTS.PROYECTOS.DOCUMENTOS(proyectoId)
  );
  return response.data;
}

/**
 * Obtener actas de un proyecto
 */
export async function getProyectoActas(proyectoId: number | string) {
  const response = await apiClient.get(
    ENDPOINTS.PROYECTOS.ACTAS(proyectoId)
  );
  return response.data;
}

/**
 * Obtener equipo de un proyecto
 */
export async function getProyectoEquipo(proyectoId: number | string) {
  const response = await apiClient.get(
    ENDPOINTS.PROYECTOS.EQUIPO(proyectoId)
  );
  return response.data;
}
