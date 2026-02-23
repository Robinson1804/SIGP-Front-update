/**
 * Actas Service
 *
 * Servicios para gestion de actas del proyecto (reuniones, constitucion)
 */

import { apiClient, del } from '@/lib/api';
import type {
  Acta,
  ActasByProyectoResponse,
  CreateActaReunionInput,
  CreateActaConstitucionInput,
  CreateActaDailyInput,
  UpdateActaReunionInput,
  UpdateActaConstitucionInput,
  UpdateActaDailyInput,
  ActaApprovalInput,
  ActaTipo,
  ActaQueryFilters,
} from '../types';

// Endpoints para actas
const ACTAS_ENDPOINTS = {
  BASE: '/actas',
  BY_ID: (id: number | string) => `/actas/${id}`,
  BY_PROYECTO: (proyectoId: number | string) => `/proyectos/${proyectoId}/actas`,
  BY_SUBPROYECTO: (subproyectoId: number | string) => `/subproyectos/${subproyectoId}/actas`,
  REUNION: '/actas/reunion',
  CONSTITUCION: '/actas/constitucion',
  DAILY: '/actas/daily',
  UPDATE_REUNION: (id: number | string) => `/actas/${id}/reunion`,
  UPDATE_CONSTITUCION: (id: number | string) => `/actas/${id}/constitucion`,
  UPDATE_DAILY: (id: number | string) => `/actas/${id}/daily`,
  PDF: (id: number | string) => `/actas/${id}/pdf`,
  DOCUMENTO_FIRMADO: (id: number | string) => `/actas/${id}/documento-firmado`,
  APROBAR: (id: number | string) => `/actas/${id}/aprobar`,
  ENVIAR_REVISION: (id: number | string) => `/actas/${id}/enviar-revision`,
};

/**
 * Obtener actas de un proyecto (separadas por tipo)
 */
export async function getActasByProyecto(
  proyectoId: number | string
): Promise<ActasByProyectoResponse> {
  const response = await apiClient.get<ActasByProyectoResponse>(
    ACTAS_ENDPOINTS.BY_PROYECTO(proyectoId)
  );
  return response.data;
}

/**
 * Obtener actas de un subproyecto (separadas por tipo)
 */
export async function getActasBySubproyecto(
  subproyectoId: number | string
): Promise<ActasByProyectoResponse> {
  const response = await apiClient.get<ActasByProyectoResponse>(
    ACTAS_ENDPOINTS.BY_SUBPROYECTO(subproyectoId)
  );
  return response.data;
}

/**
 * Obtener todas las actas con filtros opcionales
 */
export async function getActas(filters?: ActaQueryFilters): Promise<Acta[]> {
  const response = await apiClient.get<Acta[]>(ACTAS_ENDPOINTS.BASE, {
    params: filters,
  });
  return response.data;
}

/**
 * Obtener un acta por ID
 */
export async function getActaById(id: number | string): Promise<Acta> {
  const response = await apiClient.get<Acta>(ACTAS_ENDPOINTS.BY_ID(id));
  return response.data;
}

/**
 * Crear una nueva Acta de Reunion
 */
export async function createActaReunion(
  data: CreateActaReunionInput
): Promise<Acta> {
  const response = await apiClient.post<Acta>(ACTAS_ENDPOINTS.REUNION, data);
  return response.data;
}

/**
 * Crear una nueva Acta de Constitucion
 */
export async function createActaConstitucion(
  data: CreateActaConstitucionInput
): Promise<Acta> {
  const response = await apiClient.post<Acta>(
    ACTAS_ENDPOINTS.CONSTITUCION,
    data
  );
  return response.data;
}

/**
 * Actualizar un Acta de Reunion
 */
export async function updateActaReunion(
  id: number | string,
  data: UpdateActaReunionInput
): Promise<Acta> {
  const response = await apiClient.put<Acta>(
    ACTAS_ENDPOINTS.UPDATE_REUNION(id),
    data
  );
  return response.data;
}

/**
 * Actualizar un Acta de Constitucion
 */
export async function updateActaConstitucion(
  id: number | string,
  data: UpdateActaConstitucionInput
): Promise<Acta> {
  const response = await apiClient.put<Acta>(
    ACTAS_ENDPOINTS.UPDATE_CONSTITUCION(id),
    data
  );
  return response.data;
}

/**
 * Crear una nueva Acta de Daily Meeting
 */
export async function createActaDaily(
  data: CreateActaDailyInput
): Promise<Acta> {
  const response = await apiClient.post<Acta>(ACTAS_ENDPOINTS.DAILY, data);
  return response.data;
}

/**
 * Actualizar un Acta de Daily Meeting
 */
export async function updateActaDaily(
  id: number | string,
  data: UpdateActaDailyInput
): Promise<Acta> {
  const response = await apiClient.put<Acta>(
    ACTAS_ENDPOINTS.UPDATE_DAILY(id),
    data
  );
  return response.data;
}

/**
 * Eliminar un acta (soft delete)
 */
export async function deleteActa(id: number | string): Promise<void> {
  await del(ACTAS_ENDPOINTS.BY_ID(id));
}

/**
 * Descargar PDF del acta
 */
export async function downloadActaPdf(id: number | string): Promise<Blob> {
  const response = await apiClient.get(ACTAS_ENDPOINTS.PDF(id), {
    responseType: 'blob',
  });
  return response.data;
}

/**
 * Abrir PDF del acta en nueva pestaña
 */
export async function openActaPdf(id: number | string): Promise<void> {
  try {
    const blob = await downloadActaPdf(id);
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Limpiar URL después de un tiempo
    setTimeout(() => window.URL.revokeObjectURL(url), 10000);
  } catch (error) {
    console.error('Error al abrir PDF:', error);
    throw error;
  }
}

/**
 * Descargar PDF del acta con nombre de archivo
 */
export async function saveActaPdf(
  id: number | string,
  filename?: string
): Promise<void> {
  try {
    const blob = await downloadActaPdf(id);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `acta_${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error al descargar PDF:', error);
    throw error;
  }
}

/**
 * Subir documento firmado
 */
export async function subirDocumentoFirmado(
  id: number | string,
  documentoFirmadoUrl: string
): Promise<Acta> {
  const response = await apiClient.post<Acta>(
    ACTAS_ENDPOINTS.DOCUMENTO_FIRMADO(id),
    { documentoFirmadoUrl }
  );
  return response.data;
}

/**
 * Aprobar o rechazar un acta
 */
export async function aprobarActa(
  id: number | string,
  data: ActaApprovalInput
): Promise<Acta> {
  const response = await apiClient.post<Acta>(ACTAS_ENDPOINTS.APROBAR(id), data);
  return response.data;
}

/**
 * Enviar Acta de Constitución a revisión
 * Cambia el estado de Borrador a En revisión y notifica a PMO y PATROCINADOR
 */
export async function enviarActaARevision(id: number | string): Promise<Acta> {
  const response = await apiClient.post<Acta>(ACTAS_ENDPOINTS.ENVIAR_REVISION(id));
  return response.data;
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
      descripcion:
        'El acta de constitucion requiere aprobacion final del patrocinador',
    };
  }

  if (tipo === 'Acta de Daily Meeting') {
    return {
      niveles: ['Scrum Master'],
      descripcion:
        'El acta de daily meeting solo requiere validacion del Scrum Master',
    };
  }

  // Acta de Reunion
  return {
    niveles: ['Scrum Master', 'Coordinador', 'PMO'],
    descripcion: 'El acta de reunion requiere aprobacion del PMO',
  };
}

/**
 * Obtener etiqueta de estado con colores
 */
export function getEstadoLabel(estado: string): {
  label: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
} {
  switch (estado) {
    case 'Borrador':
      return { label: 'Borrador', variant: 'secondary' };
    case 'Pendiente':
      return { label: 'Pendiente Aprobación', variant: 'outline' };
    case 'Aprobado':
      return { label: 'Aprobado', variant: 'default' };
    case 'Rechazado':
      return { label: 'Rechazado', variant: 'destructive' };
    default:
      return { label: estado, variant: 'secondary' };
  }
}
