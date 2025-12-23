/**
 * Proyectos Service
 *
 * Servicios para gestión de proyectos
 */

import { apiClient, del, ENDPOINTS } from '@/lib/api';
import type { Proyecto } from '@/lib/definitions';

// The backend returns projects as a simple array, not paginated
export interface ProyectosResponse {
  data: Proyecto[];
}

export interface ProyectoQueryFilters {
  search?: string;
  estado?: string;
  clasificacion?: string;
  tipo?: 'Proyecto' | 'Actividad';
  anno?: number;
  accionEstrategicaId?: number;
  scrumMasterId?: number;
  coordinadorId?: number;
  activo?: boolean;
  page?: number;
  pageSize?: number;
}

// Interface para costos anuales
export interface CostoAnual {
  anio: number;
  monto: number;
}

export interface CreateProyectoData {
  codigo: string;
  nombre: string;
  descripcion?: string;
  clasificacion?: 'Al ciudadano' | 'Gestion interna';
  accionEstrategicaId?: number;
  coordinadorId?: number;
  scrumMasterId?: number;
  patrocinadorId?: number;
  coordinacion?: string;
  areaResponsable?: string;
  areasFinancieras?: string[];
  montoAnual?: number;
  anios?: number[];
  costosAnuales?: CostoAnual[];
  alcances?: string[];
  problematica?: string;
  beneficiarios?: string;
  beneficios?: string[];
  fechaInicio?: string;
  fechaFin?: string;
}

export interface UpdateProyectoData extends Partial<CreateProyectoData> {
  estado?: string;
}

/**
 * Obtener lista de proyectos con filtros opcionales
 */
export async function getProyectos(
  filters?: ProyectoQueryFilters
): Promise<ProyectosResponse> {
  const response = await apiClient.get<Proyecto[]>(
    ENDPOINTS.PROYECTOS.BASE,
    { params: filters }
  );
  // The API returns { success: true, data: [...] } - apiClient extracts the body
  // response.data is the full API response, we need to handle both cases
  const data = Array.isArray(response.data) ? response.data : (response.data as unknown as ProyectosResponse).data || [];
  return { data };
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

/**
 * Cambiar estado de un proyecto
 */
export async function cambiarEstadoProyecto(
  id: number | string,
  estado: string
): Promise<Proyecto> {
  const response = await apiClient.post<Proyecto>(
    `${ENDPOINTS.PROYECTOS.BY_ID(id)}/cambiar-estado`,
    { estado }
  );
  return response.data;
}

/**
 * Obtener requerimientos de un proyecto
 */
export async function getProyectoRequerimientos(proyectoId: number | string) {
  const response = await apiClient.get(
    ENDPOINTS.PROYECTOS.REQUERIMIENTOS(proyectoId)
  );
  return response.data;
}

/**
 * Obtener métricas de velocidad del proyecto
 */
export async function getProyectoVelocity(proyectoId: number | string) {
  const response = await apiClient.get(
    ENDPOINTS.PROYECTOS.VELOCITY(proyectoId)
  );
  return response.data;
}

/**
 * Obtener proyectos por Acción Estratégica
 */
export async function getProyectosByAccionEstrategica(
  accionEstrategicaId: number | string
): Promise<Proyecto[]> {
  const response = await getProyectos({ accionEstrategicaId: Number(accionEstrategicaId) });
  return response.data || [];
}

/**
 * Obtener proyectos vinculados a un PGD
 * (a través de las Acciones Estratégicas)
 */
export async function getProyectosByPGD(
  pgdId: number | string,
  accionesEstrategicasIds: number[]
): Promise<Proyecto[]> {
  if (accionesEstrategicasIds.length === 0) return [];

  // Get all projects and filter by the AE IDs
  const response = await getProyectos({});
  const allProyectos = response.data || [];

  return allProyectos.filter(
    (p: Proyecto) => p.accionEstrategicaId && accionesEstrategicasIds.includes(p.accionEstrategicaId)
  );
}
