import { apiClient } from '@/lib/api/client';

export interface Subproyecto {
  id: number;
  proyectoPadreId: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  monto?: number | string; // Puede venir como string desde BD (tipo decimal)
  anios?: number[];
  areasFinancieras?: string[];
  // responsables se manejan via tabla rrhh.asignaciones (tipoAsignacion='Subproyecto')
  estado: string;
  scrumMasterId?: number;
  scrumMaster?: {
    id: number;
    nombre: string;
    apellido: string;
    personal?: {
      nombre: string;
      apellidoPaterno?: string;
      apellidoMaterno?: string;
    };
  } | null;
  fechaInicio?: string;
  fechaFin?: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSubproyectoData {
  proyectoPadreId: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  monto?: number;
  anios?: number[];
  areasFinancieras?: string[];
  // responsables se manejan via syncAsignacionesSubproyecto()
  scrumMasterId?: number;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface UpdateSubproyectoData {
  nombre?: string;
  descripcion?: string;
  monto?: number;
  anios?: number[];
  areasFinancieras?: string[];
  // responsables se manejan via syncAsignacionesSubproyecto()
  scrumMasterId?: number;
  fechaInicio?: string;
  fechaFin?: string;
  estado?: string;
}

/**
 * Crea un nuevo subproyecto
 */
export async function createSubproyecto(data: CreateSubproyectoData): Promise<Subproyecto> {
  const response = await apiClient.post('/subproyectos', data);
  return response.data.data || response.data;
}

/**
 * Obtiene todos los subproyectos de un proyecto
 */
export async function getSubproyectosByProyecto(proyectoId: number | string): Promise<Subproyecto[]> {
  const response = await apiClient.get(`/proyectos/${proyectoId}/subproyectos`);
  return response.data.data || response.data;
}

/**
 * Obtiene un subproyecto por ID
 */
export async function getSubproyecto(id: number | string): Promise<Subproyecto> {
  const response = await apiClient.get(`/subproyectos/${id}`);
  return response.data.data || response.data;
}

/**
 * Actualiza un subproyecto
 */
export async function updateSubproyecto(id: number | string, data: UpdateSubproyectoData): Promise<Subproyecto> {
  const response = await apiClient.patch(`/subproyectos/${id}`, data);
  return response.data.data || response.data;
}

/**
 * Elimina un subproyecto (soft delete)
 */
export async function deleteSubproyecto(id: number | string): Promise<void> {
  await apiClient.delete(`/subproyectos/${id}`);
}

/**
 * Genera un código único para el subproyecto
 * @deprecated Use getNextSubproyectoCodigo instead
 */
export function generateSubproyectoCodigo(proyectoCodigo: string, index: number): string {
  return `${proyectoCodigo}-SP${String(index + 1).padStart(2, '0')}`;
}

/**
 * Obtiene el siguiente código de subproyecto disponible desde el backend
 * Formato: SUB-001, SUB-002, etc. (secuencial por proyecto)
 */
export async function getNextSubproyectoCodigo(proyectoId: number | string): Promise<string> {
  const response = await apiClient.get(`/proyectos/${proyectoId}/subproyectos/next-codigo`);
  return response.data.data || response.data;
}
