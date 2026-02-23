/**
 * Requerimientos Service
 *
 * Servicios para gestión de requerimientos del proyecto
 * Nota: Los requerimientos no tienen flujo de validación/aprobación.
 * Solo son creados, editados y eliminados por ADMIN y SCRUM_MASTER.
 */

import { apiClient } from '@/lib/api';
import type {
  Requerimiento,
  CreateRequerimientoInput,
  UpdateRequerimientoInput,
  RequerimientoFilters,
} from '../types';

// Endpoints para requerimientos
const ENDPOINTS = {
  BASE: '/requerimientos',
  BY_ID: (id: number | string) => `/requerimientos/${id}`,
  BY_PROYECTO: (proyectoId: number | string) => `/proyectos/${proyectoId}/requerimientos`,
  BY_SUBPROYECTO: (subproyectoId: number | string) => `/subproyectos/${subproyectoId}/requerimientos`,
  FUNCIONALES_BY_PROYECTO: (proyectoId: number | string) => `/proyectos/${proyectoId}/requerimientos/funcionales`,
  FUNCIONALES_BY_SUBPROYECTO: (subproyectoId: number | string) => `/subproyectos/${subproyectoId}/requerimientos/funcionales`,
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
 * Obtener requerimientos de un subproyecto
 */
export async function getRequerimientosBySubproyecto(
  subproyectoId: number | string,
  filters?: RequerimientoFilters
): Promise<Requerimiento[]> {
  const params: Record<string, string> = {};

  if (filters?.tipo) params.tipo = filters.tipo;
  if (filters?.prioridad) params.prioridad = filters.prioridad;
  if (filters?.activo !== undefined) params.activo = String(filters.activo);

  const response = await apiClient.get<Requerimiento[]>(
    ENDPOINTS.BY_SUBPROYECTO(subproyectoId),
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
 * Obtener solo requerimientos funcionales de un proyecto
 * Usado en el formulario de Historias de Usuario
 */
export async function getRequerimientosFuncionalesByProyecto(
  proyectoId: number | string
): Promise<Requerimiento[]> {
  const response = await apiClient.get<Requerimiento[]>(
    ENDPOINTS.FUNCIONALES_BY_PROYECTO(proyectoId)
  );
  return response.data;
}

/**
 * Obtener solo requerimientos funcionales de un subproyecto
 * Usado en el formulario de Historias de Usuario
 */
export async function getRequerimientosFuncionalesBySubproyecto(
  subproyectoId: number | string
): Promise<Requerimiento[]> {
  const response = await apiClient.get<Requerimiento[]>(
    ENDPOINTS.FUNCIONALES_BY_SUBPROYECTO(subproyectoId)
  );
  return response.data;
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
 * Eliminar un requerimiento (soft delete)
 */
export async function deleteRequerimiento(id: number | string): Promise<void> {
  await apiClient.delete(ENDPOINTS.BY_ID(id));
}

/**
 * Obtener siguiente código de requerimiento para un proyecto
 * Usa max+1 para ser robusto ante eliminaciones (REQ-001, REQ-002, ...)
 */
export async function getNextCodigoByProyecto(
  proyectoId: number | string
): Promise<string> {
  const requerimientos = await getRequerimientosByProyecto(proyectoId);
  let maxNum = 0;
  for (const req of requerimientos) {
    const match = req.codigo?.match(/REQ-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `REQ-${String(maxNum + 1).padStart(3, '0')}`;
}

/**
 * Obtener siguiente código de requerimiento para un subproyecto
 * Usa max+1 para ser robusto ante eliminaciones (REQ-001, REQ-002, ...)
 * Scoped al subproyecto: independiente de los requerimientos del proyecto padre
 */
export async function getNextCodigoBySubproyecto(
  subproyectoId: number | string
): Promise<string> {
  const requerimientos = await getRequerimientosBySubproyecto(subproyectoId);
  let maxNum = 0;
  for (const req of requerimientos) {
    const match = req.codigo?.match(/REQ-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `REQ-${String(maxNum + 1).padStart(3, '0')}`;
}

/**
 * @deprecated Usar getNextCodigoByProyecto en su lugar
 */
export async function countRequerimientosByProyecto(
  proyectoId: number | string
): Promise<number> {
  const requerimientos = await getRequerimientosByProyecto(proyectoId);
  return requerimientos.length;
}

/**
 * @deprecated Usar getNextCodigoBySubproyecto en su lugar
 */
export async function countRequerimientosBySubproyecto(
  subproyectoId: number | string
): Promise<number> {
  const requerimientos = await getRequerimientosBySubproyecto(subproyectoId);
  return requerimientos.length;
}
