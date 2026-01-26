/**
 * Criterios de Aceptacion Service
 *
 * Servicios para gestion de criterios de aceptacion en historias de usuario
 */

import { apiClient, del } from '@/lib/api';

// ============================================
// TIPOS
// ============================================

/**
 * Interfaz de Criterio de Aceptacion basada en el backend schema
 */
export interface CriterioAceptacion {
  id: number;
  historiaUsuarioId: number;
  descripcion: string;
  completado: boolean;
  orden: number | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Datos para crear un criterio de aceptacion
 */
export interface CreateCriterioData {
  historiaUsuarioId: number;
  descripcion: string;
  completado?: boolean;
  orden?: number;
}

/**
 * Datos para actualizar un criterio de aceptacion
 */
export interface UpdateCriterioData {
  descripcion?: string;
  completado?: boolean;
  orden?: number;
}

// ============================================
// SERVICIOS
// ============================================

/**
 * Obtener criterios de aceptacion de una historia de usuario
 */
export async function getCriteriosByHistoria(
  historiaId: number | string
): Promise<CriterioAceptacion[]> {
  const response = await apiClient.get<CriterioAceptacion[]>(
    `/historias-usuario/${historiaId}/criterios-aceptacion`
  );
  return response.data;
}

/**
 * Obtener un criterio de aceptacion por ID
 */
export async function getCriterioById(id: number | string): Promise<CriterioAceptacion> {
  const response = await apiClient.get<CriterioAceptacion>(
    `/criterios-aceptacion/${id}`
  );
  return response.data;
}

/**
 * Crear un nuevo criterio de aceptacion
 */
export async function createCriterio(data: CreateCriterioData): Promise<CriterioAceptacion> {
  const response = await apiClient.post<CriterioAceptacion>(
    '/criterios-aceptacion',
    data
  );
  return response.data;
}

/**
 * Crear un nuevo criterio para una historia especifica
 */
export async function createCriterioForHistoria(
  historiaId: number | string,
  data: Omit<CreateCriterioData, 'historiaUsuarioId'>
): Promise<CriterioAceptacion> {
  const response = await apiClient.post<CriterioAceptacion>(
    `/historias-usuario/${historiaId}/criterios-aceptacion`,
    data
  );
  return response.data;
}

/**
 * Actualizar un criterio de aceptacion
 */
export async function updateCriterio(
  id: number | string,
  data: UpdateCriterioData
): Promise<CriterioAceptacion> {
  const response = await apiClient.patch<CriterioAceptacion>(
    `/criterios-aceptacion/${id}`,
    data
  );
  return response.data;
}

/**
 * Marcar un criterio como completado o no completado
 */
export async function toggleCriterioCompletado(
  id: number | string,
  completado: boolean
): Promise<CriterioAceptacion> {
  return updateCriterio(id, { completado });
}

/**
 * Eliminar un criterio de aceptacion
 */
export async function deleteCriterio(id: number | string): Promise<void> {
  await del(`/criterios-aceptacion/${id}`);
}

/**
 * Reordenar criterios de una historia
 */
export async function reordenarCriterios(
  historiaId: number | string,
  ordenIds: number[]
): Promise<CriterioAceptacion[]> {
  const response = await apiClient.patch<CriterioAceptacion[]>(
    `/historias-usuario/${historiaId}/criterios-aceptacion/reordenar`,
    { ordenIds }
  );
  return response.data;
}
