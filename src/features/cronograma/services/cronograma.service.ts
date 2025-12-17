/**
 * Cronograma Service
 *
 * Servicios para gestion de cronogramas/Gantt de proyectos
 */

import { apiClient, del } from '@/lib/api';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type {
  Cronograma,
  TareaCronograma,
  DependenciaCronograma,
  CreateCronogramaInput,
  UpdateCronogramaInput,
  CreateTareaCronogramaInput,
  UpdateTareaCronogramaInput,
  CreateDependenciaInput,
  FormatoExportacion,
  ExportacionResponse,
} from '../types';

/**
 * Obtener el cronograma de un proyecto
 * Si no existe, devuelve null
 */
export async function getCronogramaByProyecto(
  proyectoId: number | string
): Promise<Cronograma | null> {
  try {
    const response = await apiClient.get<Cronograma>(
      ENDPOINTS.CRONOGRAMAS.BY_PROYECTO(proyectoId)
    );
    return response.data;
  } catch (error: any) {
    // Si es 404, el cronograma no existe aun
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Obtener un cronograma por ID
 */
export async function getCronogramaById(
  cronogramaId: number | string
): Promise<Cronograma> {
  const response = await apiClient.get<Cronograma>(
    ENDPOINTS.CRONOGRAMAS.BY_ID(cronogramaId)
  );
  return response.data;
}

/**
 * Crear un nuevo cronograma para un proyecto
 */
export async function createCronograma(
  proyectoId: number | string,
  data: CreateCronogramaInput
): Promise<Cronograma> {
  const response = await apiClient.post<Cronograma>(
    ENDPOINTS.CRONOGRAMAS.BY_PROYECTO(proyectoId),
    data
  );
  return response.data;
}

/**
 * Actualizar un cronograma existente
 */
export async function updateCronograma(
  cronogramaId: number | string,
  data: UpdateCronogramaInput
): Promise<Cronograma> {
  const response = await apiClient.patch<Cronograma>(
    ENDPOINTS.CRONOGRAMAS.BY_ID(cronogramaId),
    data
  );
  return response.data;
}

/**
 * Eliminar un cronograma
 */
export async function deleteCronograma(cronogramaId: number | string): Promise<void> {
  await del(ENDPOINTS.CRONOGRAMAS.BY_ID(cronogramaId));
}

// ============================================
// TAREAS DEL CRONOGRAMA
// ============================================

/**
 * Obtener todas las tareas de un cronograma
 */
export async function getTareas(
  cronogramaId: number | string
): Promise<TareaCronograma[]> {
  const response = await apiClient.get<TareaCronograma[]>(
    ENDPOINTS.CRONOGRAMAS.TAREAS(cronogramaId)
  );
  return response.data;
}

/**
 * Crear una nueva tarea en el cronograma
 */
export async function createTarea(
  cronogramaId: number | string,
  data: CreateTareaCronogramaInput
): Promise<TareaCronograma> {
  const response = await apiClient.post<TareaCronograma>(
    ENDPOINTS.CRONOGRAMAS.TAREAS(cronogramaId),
    data
  );
  return response.data;
}

/**
 * Actualizar una tarea del cronograma
 */
export async function updateTarea(
  cronogramaId: number | string,
  tareaId: string,
  data: UpdateTareaCronogramaInput
): Promise<TareaCronograma> {
  const response = await apiClient.patch<TareaCronograma>(
    ENDPOINTS.CRONOGRAMAS.TAREA_BY_ID(cronogramaId, tareaId),
    data
  );
  return response.data;
}

/**
 * Eliminar una tarea del cronograma
 */
export async function deleteTarea(
  cronogramaId: number | string,
  tareaId: string
): Promise<void> {
  await del(ENDPOINTS.CRONOGRAMAS.TAREA_BY_ID(cronogramaId, tareaId));
}

/**
 * Actualizar progreso de una tarea
 */
export async function updateTareaProgreso(
  cronogramaId: number | string,
  tareaId: string,
  progreso: number
): Promise<TareaCronograma> {
  return updateTarea(cronogramaId, tareaId, { progreso });
}

/**
 * Actualizar fechas de una tarea (drag & drop)
 */
export async function updateTareaFechas(
  cronogramaId: number | string,
  tareaId: string,
  inicio: string,
  fin: string
): Promise<TareaCronograma> {
  return updateTarea(cronogramaId, tareaId, { inicio, fin });
}

// ============================================
// DEPENDENCIAS
// ============================================

/**
 * Obtener dependencias de un cronograma
 */
export async function getDependencias(
  cronogramaId: number | string
): Promise<DependenciaCronograma[]> {
  const response = await apiClient.get<DependenciaCronograma[]>(
    ENDPOINTS.CRONOGRAMAS.DEPENDENCIAS(cronogramaId)
  );
  return response.data;
}

/**
 * Crear una nueva dependencia entre tareas
 */
export async function createDependencia(
  cronogramaId: number | string,
  data: CreateDependenciaInput
): Promise<DependenciaCronograma> {
  const response = await apiClient.post<DependenciaCronograma>(
    ENDPOINTS.CRONOGRAMAS.DEPENDENCIAS(cronogramaId),
    data
  );
  return response.data;
}

/**
 * Eliminar una dependencia
 */
export async function deleteDependencia(
  cronogramaId: number | string,
  dependenciaId: string
): Promise<void> {
  await del(`${ENDPOINTS.CRONOGRAMAS.DEPENDENCIAS(cronogramaId)}/${dependenciaId}`);
}

// ============================================
// EXPORTACION
// ============================================

/**
 * Exportar cronograma a PDF o Excel
 */
export async function exportCronograma(
  cronogramaId: number | string,
  formato: FormatoExportacion
): Promise<ExportacionResponse> {
  const response = await apiClient.get<ExportacionResponse>(
    ENDPOINTS.CRONOGRAMAS.EXPORTAR(cronogramaId, formato),
    { responseType: 'blob' }
  );

  // Si la respuesta es un blob, crear URL de descarga
  if (response.data instanceof Blob) {
    const url = window.URL.createObjectURL(response.data);
    const filename = `cronograma_${cronogramaId}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;
    return { url, filename };
  }

  return response.data;
}

/**
 * Descargar archivo exportado
 */
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Limpiar URL si es blob
  if (url.startsWith('blob:')) {
    window.URL.revokeObjectURL(url);
  }
}
