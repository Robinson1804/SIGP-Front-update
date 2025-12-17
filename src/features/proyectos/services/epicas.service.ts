/**
 * Epicas Service
 *
 * Servicios para gestion de epicas en proyectos Scrum
 */

import { apiClient, del, ENDPOINTS } from '@/lib/api';

// ============================================
// TIPOS
// ============================================

/**
 * Estados posibles de una epica
 */
export type EpicaEstado = 'Pendiente' | 'En progreso' | 'Completada';

/**
 * Prioridad MoSCoW
 */
export type PrioridadMoSCoW = 'Must' | 'Should' | 'Could' | 'Wont';

/**
 * Interfaz de Epica basada en el backend schema
 */
export interface Epica {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  proyectoId: number;
  estado: EpicaEstado;
  prioridad: PrioridadMoSCoW | null;
  color: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  orden: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  // Relaciones opcionales
  historiasUsuario?: HistoriaUsuarioResumen[];
}

/**
 * Resumen de historia de usuario (para listados)
 */
export interface HistoriaUsuarioResumen {
  id: number;
  codigo: string;
  titulo: string;
  estado: string;
  puntos: number | null;
}

/**
 * Datos para crear una epica
 */
export interface CreateEpicaData {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  proyectoId: number;
  prioridad?: PrioridadMoSCoW;
  color?: string;
  fechaInicio?: string;
  fechaFin?: string;
  orden?: number;
}

/**
 * Datos para actualizar una epica
 */
export interface UpdateEpicaData extends Partial<Omit<CreateEpicaData, 'proyectoId'>> {
  estado?: EpicaEstado;
}

/**
 * Filtros para consultar epicas
 */
export interface EpicaQueryFilters {
  estado?: EpicaEstado;
  prioridad?: PrioridadMoSCoW;
  page?: number;
  pageSize?: number;
}

/**
 * Estadisticas de una epica
 */
export interface EpicaEstadisticas {
  epica: Epica;
  totalHistorias: number;
  historiasPorEstado: {
    estado: string;
    cantidad: number;
  }[];
  totalPuntos: number;
  puntosCompletados: number;
  porcentajeAvance: number;
  totalTareas: number;
  tareasCompletadas: number;
}

// ============================================
// SERVICIOS
// ============================================

/**
 * Obtener epicas de un proyecto
 */
export async function getEpicasByProyecto(
  proyectoId: number | string,
  filters?: EpicaQueryFilters
): Promise<Epica[]> {
  const response = await apiClient.get<Epica[]>(
    ENDPOINTS.PROYECTOS.EPICAS(proyectoId),
    { params: filters }
  );
  return response.data;
}

/**
 * Obtener una epica por ID
 */
export async function getEpicaById(id: number | string): Promise<Epica> {
  const response = await apiClient.get<Epica>(
    `/epicas/${id}`
  );
  return response.data;
}

/**
 * Crear una nueva epica
 */
export async function createEpica(data: CreateEpicaData): Promise<Epica> {
  const response = await apiClient.post<Epica>(
    '/epicas',
    data
  );
  return response.data;
}

/**
 * Actualizar una epica existente
 */
export async function updateEpica(
  id: number | string,
  data: UpdateEpicaData
): Promise<Epica> {
  const response = await apiClient.patch<Epica>(
    `/epicas/${id}`,
    data
  );
  return response.data;
}

/**
 * Eliminar una epica
 */
export async function deleteEpica(id: number | string): Promise<void> {
  await del(`/epicas/${id}`);
}

/**
 * Obtener estadisticas de una epica
 */
export async function getEpicaEstadisticas(id: number | string): Promise<EpicaEstadisticas> {
  const response = await apiClient.get<EpicaEstadisticas>(
    `/epicas/${id}/estadisticas`
  );
  return response.data;
}

/**
 * Obtener historias de usuario de una epica
 */
export async function getEpicaHistorias(epicaId: number | string) {
  const response = await apiClient.get(
    `/epicas/${epicaId}/historias-usuario`
  );
  return response.data;
}

/**
 * Reordenar epicas en un proyecto
 */
export async function reordenarEpicas(
  proyectoId: number | string,
  ordenIds: number[]
): Promise<Epica[]> {
  const response = await apiClient.patch<Epica[]>(
    `${ENDPOINTS.PROYECTOS.EPICAS(proyectoId)}/reordenar`,
    { ordenIds }
  );
  return response.data;
}
