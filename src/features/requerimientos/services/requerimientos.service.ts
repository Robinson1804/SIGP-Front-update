/**
 * Requerimientos Service
 *
 * Servicios para gestión de requerimientos del proyecto
 */

import { apiClient } from '@/lib/api';
import type {
  Requerimiento,
  CreateRequerimientoInput,
  UpdateRequerimientoInput,
  AprobarRequerimientoInput,
  RequerimientoFilters,
} from '../types';

// Endpoints para requerimientos
const ENDPOINTS = {
  BASE: '/requerimientos',
  BY_ID: (id: number | string) => `/requerimientos/${id}`,
  BY_PROYECTO: (proyectoId: number | string) => `/proyectos/${proyectoId}/requerimientos`,
  APROBAR: (id: number | string) => `/requerimientos/${id}/aprobar`,
};

/**
 * Obtener requerimientos de un proyecto
 */
export async function getRequerimientosByProyecto(
  proyectoId: number | string,
  filters?: RequerimientoFilters
): Promise<Requerimiento[]> {
  const params: Record<string, string> = {};

  if (filters?.tipo) params.tipo = filters.tipo;
  if (filters?.prioridad) params.prioridad = filters.prioridad;
  if (filters?.estado) params.estado = filters.estado;
  if (filters?.activo !== undefined) params.activo = String(filters.activo);

  const response = await apiClient.get<Requerimiento[]>(
    ENDPOINTS.BY_PROYECTO(proyectoId),
    { params }
  );

  let data = response.data;

  // Filtrar por búsqueda en cliente (el backend no tiene búsqueda fulltext)
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    data = data.filter(
      (req) =>
        req.codigo.toLowerCase().includes(searchLower) ||
        req.nombre.toLowerCase().includes(searchLower) ||
        req.descripcion?.toLowerCase().includes(searchLower)
    );
  }

  return data;
}

/**
 * Obtener todos los requerimientos con filtros
 */
export async function getAllRequerimientos(
  filters?: RequerimientoFilters
): Promise<Requerimiento[]> {
  const params: Record<string, string> = {};

  if (filters?.tipo) params.tipo = filters.tipo;
  if (filters?.prioridad) params.prioridad = filters.prioridad;
  if (filters?.estado) params.estado = filters.estado;
  if (filters?.activo !== undefined) params.activo = String(filters.activo);

  const response = await apiClient.get<Requerimiento[]>(ENDPOINTS.BASE, { params });
  return response.data;
}

/**
 * Obtener un requerimiento por ID
 */
export async function getRequerimiento(id: number | string): Promise<Requerimiento> {
  const response = await apiClient.get<Requerimiento>(ENDPOINTS.BY_ID(id));
  return response.data;
}

/**
 * Crear un nuevo requerimiento
 */
export async function createRequerimiento(
  data: CreateRequerimientoInput
): Promise<Requerimiento> {
  const response = await apiClient.post<Requerimiento>(ENDPOINTS.BASE, data);
  return response.data;
}

/**
 * Actualizar un requerimiento
 */
export async function updateRequerimiento(
  id: number | string,
  data: UpdateRequerimientoInput
): Promise<Requerimiento> {
  const response = await apiClient.patch<Requerimiento>(ENDPOINTS.BY_ID(id), data);
  return response.data;
}

/**
 * Aprobar o rechazar un requerimiento
 */
export async function aprobarRequerimiento(
  id: number | string,
  data: AprobarRequerimientoInput
): Promise<Requerimiento> {
  const response = await apiClient.post<Requerimiento>(ENDPOINTS.APROBAR(id), data);
  return response.data;
}

/**
 * Eliminar un requerimiento (soft delete)
 */
export async function deleteRequerimiento(id: number | string): Promise<void> {
  await apiClient.delete(ENDPOINTS.BY_ID(id));
}

/**
 * Contar requerimientos por tipo en un proyecto
 * Útil para generar códigos automáticos
 */
export async function countRequerimientosByTipo(
  proyectoId: number | string,
  tipo: string
): Promise<number> {
  const requerimientos = await getRequerimientosByProyecto(proyectoId, {
    tipo: tipo as any,
  });
  return requerimientos.length;
}
