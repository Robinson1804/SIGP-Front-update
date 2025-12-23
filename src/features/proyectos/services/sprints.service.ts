/**
 * Sprints Service
 *
 * Servicios para gestion de sprints en proyectos Scrum
 */

import { apiClient, del, ENDPOINTS } from '@/lib/api';
import type { PaginatedResponse } from '@/types';

// ============================================
// TIPOS
// ============================================

/**
 * Estados posibles de un sprint
 */
export type SprintEstado = 'Planificado' | 'Activo' | 'Completado';

/**
 * Interfaz de Sprint basada en el backend schema
 */
export interface Sprint {
  id: number;
  nombre: string;
  objetivo: string | null;
  numero: number;
  proyectoId: number;
  estado: SprintEstado;
  fechaInicio: string | null;
  fechaFin: string | null;
  velocidadPlanificada: number | null;
  velocidadReal: number | null;
  totalPuntos: number | null;
  puntosCompletados: number | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
}

/**
 * Datos para crear un sprint
 */
export interface CreateSprintData {
  nombre: string;
  objetivo?: string;
  proyectoId: number;
  fechaInicio?: string;
  fechaFin?: string;
  velocidadPlanificada?: number;
}

/**
 * Datos para actualizar un sprint
 */
export interface UpdateSprintData extends Partial<Omit<CreateSprintData, 'proyectoId'>> {
  estado?: SprintEstado;
}

/**
 * Filtros para consultar sprints
 */
export interface SprintQueryFilters {
  estado?: SprintEstado;
  page?: number;
  pageSize?: number;
}

/**
 * Datos del grafico burndown
 */
export interface BurndownData {
  dias: {
    fecha: string;
    puntosRestantes: number;
    puntosIdeales: number;
    puntosCompletados: number;
  }[];
  totalPuntos: number;
  diasTranscurridos: number;
  diasRestantes: number;
}

/**
 * Datos del tablero de sprint
 */
export interface SprintTableroData {
  sprint: Sprint;
  columnas: {
    id: string;
    nombre: string;
    tareas: SprintTarea[];
  }[];
  metricas: {
    totalTareas: number;
    tareasCompletadas: number;
    puntosTotal: number;
    puntosCompletados: number;
  };
}

export interface SprintTarea {
  id: number;
  nombre: string;
  estado: string;
  responsableId: number | null;
  responsable: {
    id: number;
    nombre: string;
  } | null;
  puntos: number | null;
  prioridad: string;
}

// ============================================
// SERVICIOS
// ============================================

/**
 * Obtener sprints de un proyecto
 */
export async function getSprintsByProyecto(
  proyectoId: number | string,
  filters?: SprintQueryFilters
): Promise<Sprint[]> {
  const response = await apiClient.get<Sprint[]>(
    ENDPOINTS.PROYECTOS.SPRINTS(proyectoId),
    { params: filters }
  );
  return response.data;
}

/**
 * Obtener un sprint por ID
 */
export async function getSprintById(id: number | string): Promise<Sprint> {
  const response = await apiClient.get<Sprint>(
    ENDPOINTS.SPRINTS.BY_ID(id)
  );
  return response.data;
}

/**
 * Crear un nuevo sprint
 */
export async function createSprint(data: CreateSprintData): Promise<Sprint> {
  const response = await apiClient.post<Sprint>(
    ENDPOINTS.SPRINTS.BASE,
    data
  );
  return response.data;
}

/**
 * Actualizar un sprint existente
 */
export async function updateSprint(
  id: number | string,
  data: UpdateSprintData
): Promise<Sprint> {
  const response = await apiClient.patch<Sprint>(
    ENDPOINTS.SPRINTS.BY_ID(id),
    data
  );
  return response.data;
}

/**
 * Eliminar un sprint
 */
export async function deleteSprint(id: number | string): Promise<void> {
  await del(ENDPOINTS.SPRINTS.BY_ID(id));
}

/**
 * Iniciar un sprint (cambiar estado a 'Activo')
 */
export async function iniciarSprint(id: number | string): Promise<Sprint> {
  const response = await apiClient.patch<Sprint>(
    ENDPOINTS.SPRINTS.START(id)
  );
  return response.data;
}

/**
 * Cerrar un sprint (cambiar estado a 'Completado')
 */
export async function cerrarSprint(id: number | string): Promise<Sprint> {
  const response = await apiClient.patch<Sprint>(
    ENDPOINTS.SPRINTS.COMPLETE(id)
  );
  return response.data;
}

/**
 * Obtener datos del grafico burndown de un sprint
 */
export async function getSprintBurndown(id: number | string): Promise<BurndownData> {
  const response = await apiClient.get<BurndownData>(
    `${ENDPOINTS.SPRINTS.BY_ID(id)}/burndown`
  );
  return response.data;
}

/**
 * Obtener tablero de un sprint con tareas agrupadas por estado
 */
export async function getSprintTablero(id: number | string): Promise<SprintTableroData> {
  const response = await apiClient.get<SprintTableroData>(
    `${ENDPOINTS.SPRINTS.BY_ID(id)}/tablero`
  );
  return response.data;
}

/**
 * Obtener historias de usuario de un sprint
 */
export async function getSprintHistorias(sprintId: number | string) {
  const response = await apiClient.get(
    ENDPOINTS.SPRINTS.HISTORIAS(sprintId)
  );
  return response.data;
}

/**
 * Obtener tareas de un sprint
 */
export async function getSprintTareas(sprintId: number | string) {
  const response = await apiClient.get(
    ENDPOINTS.SPRINTS.TAREAS(sprintId)
  );
  return response.data;
}

/**
 * Obtener daily meetings de un sprint
 */
export async function getSprintDailyMeetings(sprintId: number | string) {
  const response = await apiClient.get(
    ENDPOINTS.SPRINTS.DAILY_MEETINGS(sprintId)
  );
  return response.data;
}
