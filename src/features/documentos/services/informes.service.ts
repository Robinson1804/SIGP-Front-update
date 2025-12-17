/**
 * Informes Service
 *
 * Servicios para generacion y gestion de informes
 */

import { apiClient } from '@/lib/api';
import type {
  Informe,
  InformeSprintData,
  InformeActividadData,
} from '../types';

// Endpoints para informes
const INFORMES_ENDPOINTS = {
  BASE: '/reportes',
  BY_PROYECTO: (proyectoId: number | string) => `/proyectos/${proyectoId}/reportes`,
  BY_ID: (id: number | string) => `/reportes/${id}`,
  SPRINT: (sprintId: number | string) => `/reportes/sprints/${sprintId}`,
  ACTIVIDAD: (actividadId: number | string) => `/reportes/actividades/${actividadId}`,
  EXPORTAR_PDF: (tipo: string, id: number | string) => `/reportes/${tipo}/${id}/pdf`,
  EXPORTAR_EXCEL: (tipo: string, id: number | string) => `/reportes/${tipo}/${id}/excel`,
};

export interface InformeQueryFilters {
  tipo?: 'Sprint' | 'Actividad' | 'Proyecto';
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Obtener informes de un proyecto
 */
export async function getInformesByProyecto(
  proyectoId: number | string,
  filters?: InformeQueryFilters
): Promise<Informe[]> {
  const response = await apiClient.get<Informe[]>(
    INFORMES_ENDPOINTS.BY_PROYECTO(proyectoId),
    { params: filters }
  );
  return response.data;
}

/**
 * Obtener un informe por ID
 */
export async function getInformeById(id: number | string): Promise<Informe> {
  const response = await apiClient.get<Informe>(
    INFORMES_ENDPOINTS.BY_ID(id)
  );
  return response.data;
}

/**
 * Obtener datos para generar informe de sprint
 */
export async function getInformeSprintData(
  sprintId: number | string
): Promise<InformeSprintData> {
  const response = await apiClient.get<InformeSprintData>(
    INFORMES_ENDPOINTS.SPRINT(sprintId)
  );
  return response.data;
}

/**
 * Generar informe de sprint
 * Retorna el ID del informe generado
 */
export async function generarInformeSprint(
  sprintId: number | string
): Promise<{
  informeId: number;
  mensaje: string;
  downloadUrl?: string;
}> {
  const response = await apiClient.post(
    INFORMES_ENDPOINTS.SPRINT(sprintId),
    {}
  );
  return response.data;
}

/**
 * Obtener datos para generar informe de actividad
 */
export async function getInformeActividadData(
  actividadId: number | string
): Promise<InformeActividadData> {
  const response = await apiClient.get<InformeActividadData>(
    INFORMES_ENDPOINTS.ACTIVIDAD(actividadId)
  );
  return response.data;
}

/**
 * Generar informe de actividad
 * Retorna el ID del informe generado
 */
export async function generarInformeActividad(
  actividadId: number | string
): Promise<{
  informeId: number;
  mensaje: string;
  downloadUrl?: string;
}> {
  const response = await apiClient.post(
    INFORMES_ENDPOINTS.ACTIVIDAD(actividadId),
    {}
  );
  return response.data;
}

/**
 * Exportar informe a PDF
 */
export async function exportarInformePDF(
  tipo: 'sprints' | 'actividades',
  id: number | string
): Promise<void> {
  try {
    const response = await apiClient.get<{ downloadUrl: string }>(
      INFORMES_ENDPOINTS.EXPORTAR_PDF(tipo, id)
    );

    if (typeof window !== 'undefined') {
      window.open(response.data.downloadUrl, '_blank');
    }
  } catch (error) {
    console.error('Error al exportar PDF:', error);
    throw error;
  }
}

/**
 * Exportar informe a Excel
 */
export async function exportarInformeExcel(
  tipo: 'sprints' | 'actividades',
  id: number | string
): Promise<void> {
  try {
    const response = await apiClient.get<{ downloadUrl: string }>(
      INFORMES_ENDPOINTS.EXPORTAR_EXCEL(tipo, id)
    );

    if (typeof window !== 'undefined') {
      window.open(response.data.downloadUrl, '_blank');
    }
  } catch (error) {
    console.error('Error al exportar Excel:', error);
    throw error;
  }
}

/**
 * Descargar informe existente
 */
export async function descargarInforme(id: number | string): Promise<void> {
  try {
    const response = await apiClient.get<{ downloadUrl: string }>(
      `${INFORMES_ENDPOINTS.BY_ID(id)}/download`
    );

    if (typeof window !== 'undefined') {
      window.open(response.data.downloadUrl, '_blank');
    }
  } catch (error) {
    console.error('Error al descargar informe:', error);
    throw error;
  }
}
