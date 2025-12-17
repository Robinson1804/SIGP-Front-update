/**
 * OGD Service
 *
 * Servicios para gestión de Objetivos de Gobierno Digital
 */

import { apiClient, del } from '@/lib/api';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type {
  OGD,
  CreateOGDInput,
  UpdateOGDInput,
  OGDQueryFilters,
} from '../types';

/**
 * Obtener lista de OGDs con filtros opcionales
 */
export async function getOGDs(filters?: OGDQueryFilters): Promise<OGD[]> {
  const response = await apiClient.get<OGD[]>(ENDPOINTS.PLANNING.OGD, {
    params: filters,
  });
  return response.data;
}

/**
 * Obtener OGDs por PGD
 */
export async function getOGDsByPGD(pgdId: number | string): Promise<OGD[]> {
  return getOGDs({ pgdId: Number(pgdId) });
}

/**
 * Obtener un OGD por ID
 */
export async function getOGDById(id: number | string): Promise<OGD> {
  const response = await apiClient.get<OGD>(ENDPOINTS.PLANNING.OGD_BY_ID(id));
  return response.data;
}

/**
 * Crear un nuevo OGD
 */
export async function createOGD(data: CreateOGDInput): Promise<OGD> {
  const response = await apiClient.post<OGD>(ENDPOINTS.PLANNING.OGD, data);
  return response.data;
}

/**
 * Actualizar un OGD existente
 */
export async function updateOGD(
  id: number | string,
  data: UpdateOGDInput
): Promise<OGD> {
  const response = await apiClient.patch<OGD>(
    ENDPOINTS.PLANNING.OGD_BY_ID(id),
    data
  );
  return response.data;
}

/**
 * Eliminar un OGD (soft delete)
 */
export async function deleteOGD(id: number | string): Promise<void> {
  await del(ENDPOINTS.PLANNING.OGD_BY_ID(id));
}

/**
 * Activar/Desactivar un OGD
 */
export async function toggleOGDActivo(
  id: number | string,
  activo: boolean
): Promise<OGD> {
  return updateOGD(id, { activo });
}
