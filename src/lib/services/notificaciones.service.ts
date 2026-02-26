/**
 * Notificaciones Service
 *
 * Servicios para gestión de notificaciones del usuario
 */

import { apiClient, invalidateCache } from '@/lib/api';
import { ENDPOINTS } from '@/lib/api/endpoints';

// Types
export interface Notificacion {
  id: number;
  usuarioId: number;
  tipo: 'proyecto' | 'sprint' | 'tarea' | 'aprobacion' | 'retraso' | 'hu_revision' | 'hu_validated' | 'hu_rejected' | 'sistema';
  titulo: string;
  mensaje: string;
  leida: boolean;
  entidadTipo?: 'proyecto' | 'actividad' | 'sprint' | 'tarea' | 'historia';
  entidadId?: number;
  entidadNombre?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  readAt?: string;
}

export interface NotificacionesResponse {
  notificaciones: Notificacion[];
  total: number;
  noLeidas: number;
  page: number;
  limit: number;
}

export interface NotificacionFilters {
  tipo?: string;
  leida?: boolean;
  limit?: number;
  page?: number;
  proyectoId?: number;
  actividadId?: number;
  entidadId?: number;
  entidadTipo?: string;
}

export interface ProyectoGroup {
  proyectoId: number;
  proyectoCodigo: string;
  proyectoNombre: string;
  total: number;
  noLeidas: number;
}

export interface SprintGroup {
  sprintId: number;
  sprintNombre: string;
  total: number;
  noLeidas: number;
}

export interface ActividadGroup {
  actividadId: number;
  actividadCodigo: string;
  actividadNombre: string;
  total: number;
  noLeidas: number;
}

export interface ActividadSeccionCounts {
  asignaciones: { total: number; noLeidas: number };
  tareas: { total: number; noLeidas: number };
}

export interface SeccionCounts {
  asignaciones: { total: number; noLeidas: number };
  sprints: { total: number; noLeidas: number };
  aprobaciones: { total: number; noLeidas: number };
  validaciones: { total: number; noLeidas: number };
}

/**
 * Obtener todas las notificaciones del usuario
 */
export async function getNotificaciones(
  filters?: NotificacionFilters
): Promise<NotificacionesResponse> {
  try {
    const response = await apiClient.get(
      ENDPOINTS.NOTIFICACIONES.BASE,
      { params: filters }
    );
    const raw = response.data;

    // Case 1: Backend returned { data: [...], meta: {...} } (findAll wraps in object)
    // After the interceptor unwraps the outer envelope, raw = { data: [...], meta: {...} }
    if (raw && !Array.isArray(raw) && Array.isArray(raw.data)) {
      const meta = raw.meta || {};
      return {
        notificaciones: raw.data,
        total: meta.total ?? raw.data.length,
        noLeidas: raw.data.filter((n: any) => !n.leida).length,
        page: meta.page ?? 1,
        limit: meta.limit ?? 20,
      };
    }

    // Case 2: Direct array response (interceptor extracted data.data directly)
    if (raw && Array.isArray(raw)) {
      const meta = (response as any).meta || {};
      return {
        notificaciones: raw,
        total: meta.total ?? raw.length,
        noLeidas: raw.filter((n: any) => !n.leida).length,
        page: meta.page ?? 1,
        limit: meta.limit ?? 20,
      };
    }

    return { notificaciones: [], total: 0, noLeidas: 0, page: 1, limit: 20 };
  } catch (error) {
    console.error('Error fetching notificaciones:', error);
    return { notificaciones: [], total: 0, noLeidas: 0, page: 1, limit: 20 };
  }
}

/**
 * Obtener notificaciones no leídas
 */
export async function getNotificacionesNoLeidas(): Promise<Notificacion[]> {
  try {
    const response = await apiClient.get<Notificacion[]>(
      ENDPOINTS.NOTIFICACIONES.NO_LEIDAS
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching unread notificaciones:', error);
    return [];
  }
}

/**
 * Obtener contador de notificaciones no leídas
 */
export async function getNotificacionesCount(): Promise<number> {
  try {
    const response = await apiClient.get<{ count: number }>(
      ENDPOINTS.NOTIFICACIONES.COUNT
    );
    return response.data.count;
  } catch (error) {
    console.error('Error fetching notificaciones count:', error);
    return 0;
  }
}

/**
 * Marcar una notificación como leída
 */
export async function marcarNotificacionLeida(id: number | string): Promise<void> {
  await apiClient.patch(ENDPOINTS.NOTIFICACIONES.MARCAR_LEIDA(id));
  // Invalidar caché de notificaciones para reflejar cambios inmediatamente
  invalidateCache('/notificaciones');
}

/**
 * Marcar todas las notificaciones como leídas
 */
export async function marcarTodasLeidas(): Promise<void> {
  await apiClient.patch(ENDPOINTS.NOTIFICACIONES.MARCAR_TODAS_LEIDAS);
  // Invalidar caché de notificaciones para reflejar cambios inmediatamente
  invalidateCache('/notificaciones');
}

/**
 * Eliminar una notificación
 */
export async function deleteNotificacion(id: number | string): Promise<void> {
  await apiClient.delete(ENDPOINTS.NOTIFICACIONES.BY_ID(id));
}

/**
 * Obtener notificaciones agrupadas por proyecto
 */
export async function getNotificacionesAgrupadasPorProyecto(pgdId?: number): Promise<ProyectoGroup[]> {
  try {
    const response = await apiClient.get<ProyectoGroup[]>(
      ENDPOINTS.NOTIFICACIONES.AGRUPADAS_PROYECTOS,
      pgdId ? { params: { pgdId } } : undefined
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching grouped notifications by project:', error);
    return [];
  }
}

/**
 * Obtener notificaciones agrupadas por sprint para un proyecto
 */
export async function getNotificacionesAgrupadasPorSprint(proyectoId: number): Promise<SprintGroup[]> {
  try {
    const response = await apiClient.get<SprintGroup[]>(
      ENDPOINTS.NOTIFICACIONES.AGRUPADAS_SPRINTS(proyectoId)
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching grouped notifications by sprint:', error);
    return [];
  }
}

/**
 * Obtener conteos de notificaciones por sección para un proyecto (PMO view)
 */
export async function getSeccionCountsByProyecto(proyectoId: number): Promise<SeccionCounts> {
  try {
    const response = await apiClient.get<SeccionCounts>(
      ENDPOINTS.NOTIFICACIONES.SECCIONES_PROYECTO(proyectoId)
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching section counts by project:', error);
    return {
      asignaciones: { total: 0, noLeidas: 0 },
      sprints: { total: 0, noLeidas: 0 },
      aprobaciones: { total: 0, noLeidas: 0 },
      validaciones: { total: 0, noLeidas: 0 },
    };
  }
}

/**
 * Obtener notificaciones de un proyecto específico
 */
export async function getNotificacionesPorProyecto(
  proyectoId: number,
  filters?: Omit<NotificacionFilters, 'proyectoId'>
): Promise<NotificacionesResponse> {
  return getNotificaciones({ ...filters, proyectoId });
}

/**
 * Marcar todas como leídas por proyecto
 */
export async function marcarTodasLeidasPorProyecto(proyectoId: number): Promise<void> {
  await apiClient.patch(ENDPOINTS.NOTIFICACIONES.LEER_TODAS_PROYECTO(proyectoId));
  // Invalidar caché de notificaciones para reflejar cambios inmediatamente
  invalidateCache('/notificaciones');
}

/**
 * Soft delete masivo de notificaciones por IDs
 */
export async function bulkDeleteNotificaciones(ids: number[]): Promise<{ eliminadas: number }> {
  const response = await apiClient.delete<{ eliminadas: number }>(
    ENDPOINTS.NOTIFICACIONES.BULK_DELETE,
    { data: { ids } }
  );
  return response.data;
}

/**
 * Soft delete de todas las notificaciones de proyectos específicos
 */
export async function bulkDeleteByProyectos(proyectoIds: number[]): Promise<{ eliminadas: number }> {
  const response = await apiClient.delete<{ eliminadas: number }>(
    ENDPOINTS.NOTIFICACIONES.BULK_DELETE_PROYECTOS,
    { data: { proyectoIds } }
  );
  return response.data;
}

// ==========================================
// Activity-related functions (PMO Actividades tab)
// ==========================================

/**
 * Obtener notificaciones agrupadas por actividad
 */
export async function getNotificacionesAgrupadasPorActividad(pgdId?: number): Promise<ActividadGroup[]> {
  try {
    const response = await apiClient.get<ActividadGroup[]>(
      ENDPOINTS.NOTIFICACIONES.AGRUPADAS_ACTIVIDADES,
      pgdId ? { params: { pgdId } } : undefined
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching grouped notifications by activity:', error);
    return [];
  }
}

/**
 * Obtener conteos de notificaciones por sección para una actividad (PMO view)
 */
export async function getSeccionCountsByActividad(actividadId: number): Promise<ActividadSeccionCounts> {
  try {
    const response = await apiClient.get<ActividadSeccionCounts>(
      ENDPOINTS.NOTIFICACIONES.SECCIONES_ACTIVIDAD(actividadId)
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching section counts by activity:', error);
    return {
      asignaciones: { total: 0, noLeidas: 0 },
      tareas: { total: 0, noLeidas: 0 },
    };
  }
}

/**
 * Marcar todas como leídas por actividad
 */
export async function marcarTodasLeidasPorActividad(actividadId: number): Promise<void> {
  await apiClient.patch(ENDPOINTS.NOTIFICACIONES.LEER_TODAS_ACTIVIDAD(actividadId));
  // Invalidar caché de notificaciones para reflejar cambios inmediatamente
  invalidateCache('/notificaciones');
}

/**
 * Soft delete de todas las notificaciones de actividades específicas
 */
export async function bulkDeleteByActividades(actividadIds: number[]): Promise<{ eliminadas: number }> {
  const response = await apiClient.delete<{ eliminadas: number }>(
    ENDPOINTS.NOTIFICACIONES.BULK_DELETE_ACTIVIDADES,
    { data: { actividadIds } }
  );
  return response.data;
}

// Export service object
export const notificacionesService = {
  getNotificaciones,
  getNotificacionesNoLeidas,
  getNotificacionesCount,
  marcarNotificacionLeida,
  marcarTodasLeidas,
  deleteNotificacion,
  getNotificacionesAgrupadasPorProyecto,
  getNotificacionesAgrupadasPorSprint,
  getSeccionCountsByProyecto,
  getNotificacionesPorProyecto,
  marcarTodasLeidasPorProyecto,
  bulkDeleteNotificaciones,
  bulkDeleteByProyectos,
  // Activity-related
  getNotificacionesAgrupadasPorActividad,
  getSeccionCountsByActividad,
  marcarTodasLeidasPorActividad,
  bulkDeleteByActividades,
};
