/**
 * Notificaciones Service
 *
 * Servicios para gestión de notificaciones del usuario
 */

import { apiClient } from '@/lib/api';
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
}

export interface NotificacionFilters {
  tipo?: string;
  leida?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Obtener todas las notificaciones del usuario
 */
export async function getNotificaciones(
  filters?: NotificacionFilters
): Promise<NotificacionesResponse> {
  try {
    const response = await apiClient.get<Notificacion[]>(
      ENDPOINTS.NOTIFICACIONES.BASE,
      { params: filters }
    );
    // Backend returns array directly in data, wrap it in expected format
    const notificaciones = Array.isArray(response.data) ? response.data : [];
    return {
      notificaciones,
      total: notificaciones.length,
      noLeidas: notificaciones.filter(n => !n.leida).length,
    };
  } catch (error) {
    console.error('Error fetching notificaciones:', error);
    // Return empty response if endpoint not available
    return { notificaciones: [], total: 0, noLeidas: 0 };
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
}

/**
 * Marcar todas las notificaciones como leídas
 */
export async function marcarTodasLeidas(): Promise<void> {
  await apiClient.patch(ENDPOINTS.NOTIFICACIONES.MARCAR_TODAS_LEIDAS);
}

/**
 * Eliminar una notificación
 */
export async function deleteNotificacion(id: number | string): Promise<void> {
  await apiClient.delete(ENDPOINTS.NOTIFICACIONES.BY_ID(id));
}

// Export service object
export const notificacionesService = {
  getNotificaciones,
  getNotificacionesNoLeidas,
  getNotificacionesCount,
  marcarNotificacionLeida,
  marcarTodasLeidas,
  deleteNotificacion,
};
