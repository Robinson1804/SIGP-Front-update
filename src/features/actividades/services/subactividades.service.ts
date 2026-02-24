import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type {
  Subactividad,
  CreateSubactividadInput,
  UpdateSubactividadInput,
  ActividadMetricas,
  TareaKanban,
} from '../types';

export async function getSubactividadesByActividad(actividadId: number | string): Promise<Subactividad[]> {
  const response = await apiClient.get(ENDPOINTS.SUBACTIVIDADES.BY_ACTIVIDAD(actividadId));
  return response.data.data || response.data;
}

export async function getSubactividadById(id: number | string): Promise<Subactividad> {
  const response = await apiClient.get(ENDPOINTS.SUBACTIVIDADES.BY_ID(id));
  return response.data.data || response.data;
}

export async function createSubactividad(data: CreateSubactividadInput): Promise<Subactividad> {
  const response = await apiClient.post(ENDPOINTS.SUBACTIVIDADES.BASE, data);
  return response.data.data || response.data;
}

export async function updateSubactividad(id: number | string, data: UpdateSubactividadInput): Promise<Subactividad> {
  const response = await apiClient.patch(ENDPOINTS.SUBACTIVIDADES.BY_ID(id), data);
  return response.data.data || response.data;
}

export async function deleteSubactividad(id: number | string): Promise<void> {
  await apiClient.delete(ENDPOINTS.SUBACTIVIDADES.BY_ID(id));
}

export async function getNextSubactividadCodigo(actividadId: number | string): Promise<string> {
  const response = await apiClient.get(ENDPOINTS.SUBACTIVIDADES.NEXT_CODIGO(actividadId));
  return response.data.data || response.data;
}

export async function finalizarSubactividad(id: number | string): Promise<Subactividad> {
  const response = await apiClient.post(ENDPOINTS.SUBACTIVIDADES.FINALIZAR(id));
  return response.data.data || response.data;
}

export async function verificarTareasFinalizadasSubactividad(id: number | string): Promise<{
  todasFinalizadas: boolean;
  totalTareas: number;
  tareasFinalizadas: number;
}> {
  const response = await apiClient.get(ENDPOINTS.SUBACTIVIDADES.VERIFICAR_TAREAS(id));
  return response.data.data || response.data;
}

export async function getSubactividadMetricas(id: number | string): Promise<ActividadMetricas> {
  const response = await apiClient.get(ENDPOINTS.SUBACTIVIDADES.METRICAS(id));
  return response.data.data || response.data;
}

export async function getTareasBySubactividad(id: number | string): Promise<TareaKanban[]> {
  const response = await apiClient.get(ENDPOINTS.SUBACTIVIDADES.TAREAS(id));
  return response.data.data || response.data;
}
