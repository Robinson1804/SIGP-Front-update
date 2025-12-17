/**
 * Dashboard Service
 *
 * Servicios para obtener datos de dashboards
 */

import { apiClient, ENDPOINTS } from '@/lib/api';
import type {
  DashboardGeneral,
  DashboardProyecto,
  DashboardActividad,
  DashboardFiltersOptions,
  DashboardProyectoFilters,
  DashboardActividadFilters,
} from '../types';

/**
 * Obtener dashboard general con estadisticas globales
 */
export async function getDashboardGeneral(
  filters?: DashboardFiltersOptions
): Promise<DashboardGeneral> {
  const response = await apiClient.get<DashboardGeneral>(
    ENDPOINTS.DASHBOARD.GENERAL,
    { params: filters }
  );
  return response.data;
}

/**
 * Obtener dashboard base (resumen rapido)
 */
export async function getDashboardBase(): Promise<DashboardGeneral> {
  const response = await apiClient.get<DashboardGeneral>(
    ENDPOINTS.DASHBOARD.BASE
  );
  return response.data;
}

/**
 * Obtener dashboard de un proyecto especifico (Scrum)
 */
export async function getDashboardProyecto(
  proyectoId: number | string,
  filters?: DashboardProyectoFilters
): Promise<DashboardProyecto> {
  const response = await apiClient.get<DashboardProyecto>(
    ENDPOINTS.DASHBOARD.PROYECTO(proyectoId),
    { params: filters }
  );
  return response.data;
}

/**
 * Obtener dashboard de una actividad especifica (Kanban)
 */
export async function getDashboardActividad(
  actividadId: number | string,
  filters?: DashboardActividadFilters
): Promise<DashboardActividad> {
  const response = await apiClient.get<DashboardActividad>(
    ENDPOINTS.DASHBOARD.ACTIVIDAD(actividadId),
    { params: filters }
  );
  return response.data;
}

/**
 * Obtener alertas del dashboard
 */
export async function getDashboardAlertas(): Promise<{
  alertas: {
    id: number;
    tipo: string;
    mensaje: string;
    entidadTipo: string;
    entidadId: number;
    fecha: string;
    prioridad: 'alta' | 'media' | 'baja';
  }[];
  totalAlertas: number;
}> {
  const response = await apiClient.get(ENDPOINTS.DASHBOARD.ALERTAS);
  return response.data;
}

/**
 * Obtener KPIs del dashboard
 */
export async function getDashboardKPI(): Promise<{
  proyectosCompletados: number;
  tareasCompletadasMes: number;
  velocidadPromedio: number;
  horasEstimadas: number;
  horasReales: number;
  eficiencia: number;
}> {
  const response = await apiClient.get(ENDPOINTS.DASHBOARD.KPI);
  return response.data;
}

// ============================================
// EXTENDED DASHBOARD SERVICES
// ============================================

/**
 * Obtener resumen extendido del dashboard
 */
export async function getDashboardResumen(
  filtros?: import('../types').DashboardFiltros
): Promise<import('../types').DashboardResumen> {
  const response = await apiClient.get(
    `${ENDPOINTS.DASHBOARD.GENERAL}/resumen`,
    { params: filtros }
  );
  return response.data;
}

/**
 * Obtener distribución de proyectos por estado
 */
export async function getProyectosPorEstado(): Promise<import('../types').ProyectoPorEstado[]> {
  const response = await apiClient.get(`${ENDPOINTS.DASHBOARD.GENERAL}/proyectos-estado`);
  return response.data;
}

/**
 * Obtener avance por OEI
 */
export async function getAvancePorOEI(): Promise<import('../types').AvanceOEI[]> {
  const response = await apiClient.get(`${ENDPOINTS.DASHBOARD.GENERAL}/avance-oei`);
  return response.data;
}

/**
 * Obtener salud de un proyecto específico
 */
export async function getSaludProyecto(
  proyectoId: number | string
): Promise<import('../types').SaludProyecto> {
  const response = await apiClient.get(
    `${ENDPOINTS.DASHBOARD.PROYECTO(proyectoId)}/salud`
  );
  return response.data;
}

/**
 * Obtener alertas del dashboard (extendido)
 */
export async function getAlertasDashboard(): Promise<import('../types').Alerta[]> {
  const response = await apiClient.get(ENDPOINTS.DASHBOARD.ALERTAS);
  return response.data;
}

/**
 * Obtener tendencias temporales
 */
export async function getTendencias(
  periodo: import('../types').PeriodoFiltro = 'mes'
): Promise<import('../types').TendenciaData[]> {
  const response = await apiClient.get(
    `${ENDPOINTS.DASHBOARD.GENERAL}/tendencias`,
    { params: { periodo } }
  );
  return response.data;
}

/**
 * Exportar dashboard a PDF
 */
export async function exportDashboardPDF(
  filtros?: import('../types').DashboardFiltros
): Promise<Blob> {
  const response = await apiClient.get(
    `${ENDPOINTS.DASHBOARD.GENERAL}/export/pdf`,
    {
      params: filtros,
      responseType: 'blob',
    }
  );
  return response.data;
}

/**
 * Exportar dashboard a Excel
 */
export async function exportDashboardExcel(
  filtros?: import('../types').DashboardFiltros
): Promise<Blob> {
  const response = await apiClient.get(
    `${ENDPOINTS.DASHBOARD.GENERAL}/export/excel`,
    {
      params: filtros,
      responseType: 'blob',
    }
  );
  return response.data;
}

/**
 * Alias para getSummary (usado en páginas de dashboard)
 */
export async function getSummary(): Promise<import('../types').DashboardSummary> {
  const response = await apiClient.get(
    `${ENDPOINTS.DASHBOARD.GENERAL}/summary`
  );
  return response.data;
}

/**
 * Exportar servicio como objeto para uso consistente
 */
export const dashboardService = {
  getDashboardGeneral,
  getDashboardBase,
  getDashboardProyecto,
  getDashboardActividad,
  getDashboardAlertas,
  getDashboardKPI,
  getDashboardResumen,
  getProyectosPorEstado,
  getAvancePorOEI,
  getSaludProyecto,
  getAlertasDashboard,
  getTendencias,
  exportDashboardPDF,
  exportDashboardExcel,
  getSummary,
};
