/**
 * Impedimento Service
 *
 * Servicio para gestionar impedimentos del proyecto/sprint
 *
 * NOTA: El interceptor de apiClient ya extrae response.data.data,
 * por lo que response.data contiene directamente los datos, no un wrapper.
 */

import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';

export type ImpedimentoPrioridad = 'Alta' | 'Media' | 'Baja';
export type ImpedimentoEstado = 'Abierto' | 'En proceso' | 'Resuelto';

export interface Impedimento {
  id: number;
  descripcion: string;
  proyectoId: number;
  sprintId?: number;
  actividadId?: number;
  dailyMeetingId?: number;
  reportadoPor: {
    id: number;
    nombre: string;
    apellido?: string;
  };
  responsable?: {
    id: number;
    nombre: string;
    apellido?: string;
  };
  prioridad: ImpedimentoPrioridad;
  estado: ImpedimentoEstado;
  fechaReporte: string;
  fechaLimite?: string;
  resolucion?: string;
  fechaResolucion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateImpedimentoDto {
  descripcion: string;
  proyectoId: number;
  sprintId?: number;
  actividadId?: number;
  dailyMeetingId?: number;
  reportadoPorId: number;
  responsableId?: number;
  prioridad?: ImpedimentoPrioridad;
  fechaReporte?: string;
  fechaLimite?: string;
}

export interface UpdateImpedimentoDto {
  descripcion?: string;
  responsableId?: number;
  prioridad?: ImpedimentoPrioridad;
  estado?: ImpedimentoEstado;
  fechaLimite?: string;
  resolucion?: string;
}

/**
 * Crear un nuevo impedimento
 */
export async function createImpedimento(data: CreateImpedimentoDto): Promise<Impedimento> {
  const response = await apiClient.post<Impedimento>(
    ENDPOINTS.IMPEDIMENTOS.BASE,
    data
  );
  return response.data;
}

/**
 * Obtener todos los impedimentos con filtros
 */
export async function getImpedimentos(filters?: {
  proyectoId?: number;
  sprintId?: number;
  estado?: ImpedimentoEstado;
}): Promise<Impedimento[]> {
  const params = new URLSearchParams();
  if (filters?.proyectoId) params.append('proyectoId', filters.proyectoId.toString());
  if (filters?.sprintId) params.append('sprintId', filters.sprintId.toString());
  if (filters?.estado) params.append('estado', filters.estado);

  const url = `${ENDPOINTS.IMPEDIMENTOS.BASE}${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await apiClient.get<Impedimento[]>(url);
  return response.data || [];
}

/**
 * Obtener impedimentos por sprint
 */
export async function getImpedimentosBySprint(sprintId: number): Promise<Impedimento[]> {
  const response = await apiClient.get<Impedimento[]>(
    ENDPOINTS.IMPEDIMENTOS.BY_SPRINT(sprintId)
  );
  return response.data || [];
}

/**
 * Obtener impedimentos por actividad
 */
export async function getImpedimentosByActividad(actividadId: number): Promise<Impedimento[]> {
  const response = await apiClient.get<Impedimento[]>(
    ENDPOINTS.IMPEDIMENTOS.BY_ACTIVIDAD(actividadId)
  );
  return response.data || [];
}

/**
 * Obtener impedimentos por proyecto
 */
export async function getImpedimentosByProyecto(proyectoId: number): Promise<Impedimento[]> {
  const response = await apiClient.get<Impedimento[]>(
    ENDPOINTS.IMPEDIMENTOS.BY_PROYECTO(proyectoId)
  );
  return response.data || [];
}

/**
 * Obtener un impedimento por ID
 */
export async function getImpedimento(id: number): Promise<Impedimento> {
  const response = await apiClient.get<Impedimento>(
    ENDPOINTS.IMPEDIMENTOS.BY_ID(id)
  );
  return response.data;
}

/**
 * Actualizar un impedimento
 */
export async function updateImpedimento(
  id: number,
  data: UpdateImpedimentoDto
): Promise<Impedimento> {
  const response = await apiClient.patch<Impedimento>(
    ENDPOINTS.IMPEDIMENTOS.BY_ID(id),
    data
  );
  return response.data;
}

/**
 * Resolver un impedimento
 */
export async function resolveImpedimento(
  id: number,
  resolucion: string
): Promise<Impedimento> {
  const response = await apiClient.patch<Impedimento>(
    ENDPOINTS.IMPEDIMENTOS.RESOLVER(id),
    { resolucion }
  );
  return response.data;
}

/**
 * Eliminar un impedimento
 */
export async function deleteImpedimento(id: number): Promise<void> {
  await apiClient.delete(ENDPOINTS.IMPEDIMENTOS.BY_ID(id));
}

/**
 * Obtener estadísticas de impedimentos
 */
export async function getImpedimentosEstadisticas(filters?: {
  proyectoId?: number;
  sprintId?: number;
}): Promise<{
  total: number;
  abiertos: number;
  enProceso: number;
  resueltos: number;
}> {
  const params = new URLSearchParams();
  if (filters?.proyectoId) params.append('proyectoId', filters.proyectoId.toString());
  if (filters?.sprintId) params.append('sprintId', filters.sprintId.toString());

  const url = `${ENDPOINTS.IMPEDIMENTOS.ESTADISTICAS}${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await apiClient.get<{
    total: number;
    abiertos: number;
    enProceso: number;
    resueltos: number;
  }>(url);
  return response.data;
}
