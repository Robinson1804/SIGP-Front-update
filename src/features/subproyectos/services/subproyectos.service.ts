/**
 * Subproyectos Service
 *
 * Servicios para gestión de subproyectos
 */

import { apiClient, del } from '@/lib/api';

// Types
export interface Subproyecto {
  id: number;
  proyectoPadreId: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  clasificacion?: 'Al ciudadano' | 'Gestion interna';

  // Stakeholders
  coordinadorId?: number;
  scrumMasterId?: number;
  patrocinadorId?: number;
  areaUsuaria?: number[];

  // Administrativo
  coordinacion?: string;
  areaResponsable?: string;

  // Financiero
  monto?: number;
  costosAnuales?: CostoAnual[];
  anios?: number[];
  areasFinancieras?: string[];

  // Alcance
  alcances?: string[];
  problematica?: string;
  beneficiarios?: string;
  beneficios?: string[];

  // Estado y fechas
  estado: string;
  fechaInicio?: string | Date;
  fechaFin?: string | Date;

  // Audit
  activo?: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  proyectoPadre?: any;
  coordinador?: { id: number; nombre: string; apellido: string };
  scrumMaster?: { id: number; nombre: string; apellido: string };
  patrocinador?: { id: number; nombre: string; apellido: string };
}

export interface SubproyectosResponse {
  data: Subproyecto[];
}

export interface SubproyectoQueryFilters {
  proyectoPadreId?: number;
  coordinadorId?: number;
  scrumMasterId?: number;
  estado?: string;
  activo?: boolean;
}

export interface CostoAnual {
  anio: number;
  monto: number;
}

export interface CreateSubproyectoData {
  proyectoPadreId: number;
  codigo?: string; // Autogenerado por el backend
  nombre: string;
  descripcion?: string;
  clasificacion?: 'Al ciudadano' | 'Gestion interna';

  coordinadorId?: number;
  scrumMasterId?: number;
  patrocinadorId?: number;
  areaUsuaria?: number[];

  coordinacion?: string;
  areaResponsable?: string;
  areasFinancieras?: string[];

  monto?: number;
  anios?: number[];
  costosAnuales?: CostoAnual[];

  alcances?: string[];
  problematica?: string;
  beneficiarios?: string;
  beneficios?: string[];

  fechaInicio?: string;
  fechaFin?: string;
}

export interface UpdateSubproyectoData extends Partial<Omit<CreateSubproyectoData, 'proyectoPadreId'>> {
  estado?: string;
  activo?: boolean;
}

export interface CambiarEstadoData {
  nuevoEstado: string;
}

/**
 * Obtener el siguiente código de subproyecto disponible para un proyecto
 */
export async function getNextSubproyectoCodigo(proyectoPadreId: number): Promise<string> {
  const response = await apiClient.get<string>(
    `/proyectos/${proyectoPadreId}/subproyectos/next-codigo`
  );
  return response.data;
}

/**
 * Obtener lista de subproyectos con filtros opcionales
 */
export async function getSubproyectos(
  filters?: SubproyectoQueryFilters
): Promise<SubproyectosResponse> {
  const params = new URLSearchParams();

  if (filters?.proyectoPadreId !== undefined) {
    params.append('proyectoPadreId', filters.proyectoPadreId.toString());
  }
  if (filters?.coordinadorId !== undefined) {
    params.append('coordinadorId', filters.coordinadorId.toString());
  }
  if (filters?.scrumMasterId !== undefined) {
    params.append('scrumMasterId', filters.scrumMasterId.toString());
  }
  if (filters?.estado) {
    params.append('estado', filters.estado);
  }
  if (filters?.activo !== undefined) {
    params.append('activo', filters.activo.toString());
  }

  const queryString = params.toString();
  const url = `/subproyectos${queryString ? `?${queryString}` : ''}`;

  const response = await apiClient.get<Subproyecto[]>(url);
  return { data: response.data };
}

/**
 * Obtener subproyectos de un proyecto específico
 */
export async function getSubproyectosByProyecto(proyectoPadreId: number): Promise<Subproyecto[]> {
  const response = await apiClient.get<Subproyecto[]>(
    `/proyectos/${proyectoPadreId}/subproyectos`
  );
  return response.data;
}

/**
 * Obtener un subproyecto por ID
 */
export async function getSubproyecto(id: number): Promise<Subproyecto> {
  const response = await apiClient.get<Subproyecto>(`/subproyectos/${id}`);
  return response.data;
}

/**
 * Crear un nuevo subproyecto
 */
export async function createSubproyecto(data: CreateSubproyectoData): Promise<Subproyecto> {
  const response = await apiClient.post<Subproyecto>('/subproyectos', data);
  return response.data;
}

/**
 * Actualizar un subproyecto
 */
export async function updateSubproyecto(
  id: number,
  data: UpdateSubproyectoData
): Promise<Subproyecto> {
  const response = await apiClient.patch<Subproyecto>(`/subproyectos/${id}`, data);
  return response.data;
}

/**
 * Cambiar estado de un subproyecto
 */
export async function cambiarEstadoSubproyecto(
  id: number,
  data: CambiarEstadoData
): Promise<Subproyecto> {
  const response = await apiClient.post<Subproyecto>(
    `/subproyectos/${id}/cambiar-estado`,
    data
  );
  return response.data;
}

/**
 * Eliminar (soft delete) un subproyecto
 */
export async function deleteSubproyecto(id: number): Promise<void> {
  await del(`/subproyectos/${id}`);
}

// Export service object
export const subproyectosService = {
  getNextSubproyectoCodigo,
  getSubproyectos,
  getSubproyectosByProyecto,
  getSubproyecto,
  createSubproyecto,
  updateSubproyecto,
  cambiarEstadoSubproyecto,
  deleteSubproyecto,
};
