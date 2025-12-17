/**
 * Actas Service
 *
 * Servicios para gestion de actas del proyecto (reuniones, constitucion)
 */

import { apiClient, del } from '@/lib/api';
import type {
  Acta,
  CreateActaInput,
  UpdateActaInput,
  ActaApprovalInput,
  ActaTipo,
  ActaHistorialAprobacion,
  ActaQueryFilters,
} from '../types';

// Endpoints para actas
const ACTAS_ENDPOINTS = {
  BASE: '/actas',
  BY_ID: (id: number | string) => `/actas/${id}`,
  BY_PROYECTO: (proyectoId: number | string) => `/proyectos/${proyectoId}/actas`,
  APROBAR: (id: number | string) => `/actas/${id}/aprobar`,
  RECHAZAR: (id: number | string) => `/actas/${id}/rechazar`,
  HISTORIAL: (id: number | string) => `/actas/${id}/historial`,
  PENDIENTES: '/actas/pendientes-aprobacion',
};

/**
 * Obtener actas de un proyecto
 */
export async function getActasByProyecto(
  proyectoId: number | string,
  filters?: ActaQueryFilters
): Promise<Acta[]> {
  const response = await apiClient.get<Acta[]>(
    ACTAS_ENDPOINTS.BY_PROYECTO(proyectoId),
    { params: filters }
  );
  return response.data;
}

/**
 * Obtener un acta por ID
 */
export async function getActaById(id: number | string): Promise<Acta> {
  const response = await apiClient.get<Acta>(
    ACTAS_ENDPOINTS.BY_ID(id)
  );
  return response.data;
}

/**
 * Crear una nueva acta
 */
export async function createActa(data: CreateActaInput): Promise<Acta> {
  const response = await apiClient.post<Acta>(
    ACTAS_ENDPOINTS.BY_PROYECTO(data.proyectoId),
    data
  );
  return response.data;
}

/**
 * Actualizar un acta
 */
export async function updateActa(
  id: number | string,
  data: Partial<UpdateActaInput>
): Promise<Acta> {
  const response = await apiClient.patch<Acta>(
    ACTAS_ENDPOINTS.BY_ID(id),
    data
  );
  return response.data;
}

/**
 * Eliminar un acta
 */
export async function deleteActa(id: number | string): Promise<void> {
  await del(ACTAS_ENDPOINTS.BY_ID(id));
}

/**
 * Aprobar un acta
 * Avanza al siguiente nivel de aprobacion segun el workflow
 */
export async function aprobarActa(
  id: number | string,
  data?: ActaApprovalInput
): Promise<{
  acta: Acta;
  mensaje: string;
  nivelSiguiente?: string;
}> {
  const response = await apiClient.post(
    ACTAS_ENDPOINTS.APROBAR(id),
    data || {}
  );
  return response.data;
}

/**
 * Rechazar un acta
 * Requiere motivo obligatorio
 */
export async function rechazarActa(
  id: number | string,
  motivo: string
): Promise<{
  acta: Acta;
  mensaje: string;
}> {
  const response = await apiClient.post(
    ACTAS_ENDPOINTS.RECHAZAR(id),
    { motivo }
  );
  return response.data;
}

/**
 * Obtener historial de aprobaciones de un acta
 */
export async function getActaHistorial(
  id: number | string
): Promise<ActaHistorialAprobacion[]> {
  const response = await apiClient.get<ActaHistorialAprobacion[]>(
    ACTAS_ENDPOINTS.HISTORIAL(id)
  );
  return response.data;
}

/**
 * Obtener actas pendientes de aprobacion para el usuario actual
 */
export async function getActasPendientesAprobacion(): Promise<Acta[]> {
  const response = await apiClient.get<Acta[]>(
    ACTAS_ENDPOINTS.PENDIENTES
  );
  return response.data;
}

/**
 * Subir archivo de acta
 */
export async function subirArchivoActa(
  id: number | string,
  file: File
): Promise<{
  archivoId: string;
  nombreArchivo: string;
}> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post(
    `${ACTAS_ENDPOINTS.BY_ID(id)}/archivo`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

/**
 * Descargar archivo de acta
 */
export async function descargarArchivoActa(id: number | string): Promise<void> {
  try {
    const response = await apiClient.get<{ downloadUrl: string }>(
      `${ACTAS_ENDPOINTS.BY_ID(id)}/download`
    );

    if (typeof window !== 'undefined') {
      window.open(response.data.downloadUrl, '_blank');
    }
  } catch (error) {
    console.error('Error al descargar acta:', error);
    throw error;
  }
}

/**
 * Obtener workflow de aprobacion para un tipo de acta
 */
export function getWorkflowAprobacion(tipo: ActaTipo): {
  niveles: string[];
  descripcion: string;
} {
  if (tipo === 'Acta de Constitucion') {
    return {
      niveles: ['Scrum Master', 'Coordinador', 'Patrocinador'],
      descripcion: 'El acta de constitucion requiere aprobacion final del patrocinador',
    };
  }

  // Acta de Reunion
  return {
    niveles: ['Scrum Master', 'Coordinador', 'PMO'],
    descripcion: 'El acta de reunion requiere aprobacion del PMO',
  };
}
