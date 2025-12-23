/**
 * AEI Service
 *
 * Servicios para gestión de Acciones Estratégicas Institucionales
 */

import { apiClient, del } from '@/lib/api';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type {
  AEI,
  CreateAEIInput,
  UpdateAEIInput,
  AEIQueryFilters,
} from '../types';

/**
 * Obtener lista de AEIs con filtros opcionales
 */
export async function getAEIs(filters?: AEIQueryFilters): Promise<AEI[]> {
  const response = await apiClient.get<AEI[]>(ENDPOINTS.PLANNING.AEI, {
    params: filters,
  });
  return response.data;
}

/**
 * Obtener AEIs por OEI
 */
export async function getAEIsByOEI(oeiId: number | string): Promise<AEI[]> {
  const response = await apiClient.get<AEI[]>(ENDPOINTS.PLANNING.AEI_BY_OEI(oeiId));
  return response.data;
}

/**
 * Obtener un AEI por ID
 */
export async function getAEIById(id: number | string): Promise<AEI> {
  const response = await apiClient.get<AEI>(ENDPOINTS.PLANNING.AEI_BY_ID(id));
  return response.data;
}

/**
 * Crear un nuevo AEI
 */
export async function createAEI(data: CreateAEIInput): Promise<AEI> {
  const response = await apiClient.post<AEI>(ENDPOINTS.PLANNING.AEI, data);
  return response.data;
}

/**
 * Actualizar un AEI existente
 */
export async function updateAEI(
  id: number | string,
  data: UpdateAEIInput
): Promise<AEI> {
  const response = await apiClient.patch<AEI>(
    ENDPOINTS.PLANNING.AEI_BY_ID(id),
    data
  );
  return response.data;
}

/**
 * Eliminar un AEI (soft delete)
 */
export async function deleteAEI(id: number | string): Promise<void> {
  await del(ENDPOINTS.PLANNING.AEI_BY_ID(id));
}

/**
 * Activar/Desactivar un AEI
 */
export async function toggleAEIActivo(
  id: number | string,
  activo: boolean
): Promise<AEI> {
  return updateAEI(id, { activo });
}
