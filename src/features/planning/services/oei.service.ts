/**
 * OEI Service
 *
 * Servicios para gestión de Objetivos Estratégicos Institucionales
 */

import { apiClient, del } from '@/lib/api';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type {
  OEI,
  CreateOEIInput,
  UpdateOEIInput,
  OEIQueryFilters,
} from '../types';

/**
 * Obtener lista de OEIs con filtros opcionales
 */
export async function getOEIs(filters?: OEIQueryFilters): Promise<OEI[]> {
  const response = await apiClient.get<OEI[]>(ENDPOINTS.PLANNING.OEI, {
    params: filters,
  });
  return response.data;
}

/**
 * Obtener OEIs por PGD
 */
export async function getOEIsByPGD(pgdId: number | string): Promise<OEI[]> {
  return getOEIs({ pgdId: Number(pgdId) });
}

/**
 * Obtener un OEI por ID
 */
export async function getOEIById(id: number | string): Promise<OEI> {
  const response = await apiClient.get<OEI>(ENDPOINTS.PLANNING.OEI_BY_ID(id));
  return response.data;
}

/**
 * Crear un nuevo OEI
 */
export async function createOEI(data: CreateOEIInput): Promise<OEI> {
  const response = await apiClient.post<OEI>(ENDPOINTS.PLANNING.OEI, data);
  return response.data;
}

/**
 * Actualizar un OEI existente
 */
export async function updateOEI(
  id: number | string,
  data: UpdateOEIInput
): Promise<OEI> {
  const response = await apiClient.patch<OEI>(
    ENDPOINTS.PLANNING.OEI_BY_ID(id),
    data
  );
  return response.data;
}

/**
 * Eliminar un OEI (soft delete)
 */
export async function deleteOEI(id: number | string): Promise<void> {
  await del(ENDPOINTS.PLANNING.OEI_BY_ID(id));
}

/**
 * Activar/Desactivar un OEI
 */
export async function toggleOEIActivo(
  id: number | string,
  activo: boolean
): Promise<OEI> {
  return updateOEI(id, { activo });
}
