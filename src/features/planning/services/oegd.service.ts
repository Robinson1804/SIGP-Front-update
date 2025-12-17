/**
 * OEGD Service
 *
 * Servicios para gestión de Objetivos Específicos de Gobierno Digital
 */

import { apiClient, del } from '@/lib/api';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type {
  OEGD,
  CreateOEGDInput,
  UpdateOEGDInput,
  OEGDQueryFilters,
} from '../types';

/**
 * Obtener lista de OEGDs con filtros opcionales
 */
export async function getOEGDs(filters?: OEGDQueryFilters): Promise<OEGD[]> {
  const response = await apiClient.get<OEGD[]>(ENDPOINTS.PLANNING.OEGD, {
    params: filters,
  });
  return response.data;
}

/**
 * Obtener OEGDs por PGD
 */
export async function getOEGDsByPGD(pgdId: number | string): Promise<OEGD[]> {
  return getOEGDs({ pgdId: Number(pgdId) });
}

/**
 * Obtener OEGDs por OGD
 */
export async function getOEGDsByOGD(ogdId: number | string): Promise<OEGD[]> {
  return getOEGDs({ ogdId: Number(ogdId) });
}

/**
 * Obtener un OEGD por ID
 */
export async function getOEGDById(id: number | string): Promise<OEGD> {
  const response = await apiClient.get<OEGD>(ENDPOINTS.PLANNING.OEGD_BY_ID(id));
  return response.data;
}

/**
 * Crear un nuevo OEGD
 */
export async function createOEGD(data: CreateOEGDInput): Promise<OEGD> {
  const response = await apiClient.post<OEGD>(ENDPOINTS.PLANNING.OEGD, data);
  return response.data;
}

/**
 * Actualizar un OEGD existente
 */
export async function updateOEGD(
  id: number | string,
  data: UpdateOEGDInput
): Promise<OEGD> {
  const response = await apiClient.patch<OEGD>(
    ENDPOINTS.PLANNING.OEGD_BY_ID(id),
    data
  );
  return response.data;
}

/**
 * Eliminar un OEGD (soft delete)
 */
export async function deleteOEGD(id: number | string): Promise<void> {
  await del(ENDPOINTS.PLANNING.OEGD_BY_ID(id));
}

/**
 * Activar/Desactivar un OEGD
 */
export async function toggleOEGDActivo(
  id: number | string,
  activo: boolean
): Promise<OEGD> {
  return updateOEGD(id, { activo });
}
