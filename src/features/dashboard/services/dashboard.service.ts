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
 * Transforma la respuesta del backend al formato esperado por el frontend
 */
function mapBackendToFrontend(backendData: any): DashboardActividad {
  const tareasPorEstado = backendData.tareasPorEstado || {};
  const porHacer = tareasPorEstado['Por hacer'] || 0;
  const enProgreso = tareasPorEstado['En progreso'] || 0;
  const enRevision = tareasPorEstado['En revisión'] || 0;
  const finalizadas = tareasPorEstado['Finalizado'] || 0;
  const total = porHacer + enProgreso + enRevision + finalizadas;

  const metricasKanban = backendData.metricasKanban || {};
  const tiposTrabajo = backendData.tiposTrabajo || {};
  const resumenPrioridad = backendData.resumenPrioridad || {};

  // Mapear prioridades al formato esperado
  const tareasPorPrioridad = [
    { prioridad: 'Alta', cantidad: resumenPrioridad.alta || 0, color: '#EF4444' },
    { prioridad: 'Media', cantidad: resumenPrioridad.media || 0, color: '#F59E0B' },
    { prioridad: 'Baja', cantidad: resumenPrioridad.baja || 0, color: '#10B981' },
  ];

  // Mapear actividad reciente
  const actividadReciente = (backendData.actividadReciente || []).map((item: any) => ({
    id: item.id,
    tipo: item.tipo,
    descripcion: item.descripcion,
    fecha: item.fecha,
    usuarioNombre: item.usuarioNombre,
    entidadId: item.entidadId,
    entidadTipo: item.entidadTipo,
    entidadNombre: item.entidadNombre,
    detalles: item.detalles,
  }));

  return {
    actividadId: backendData.actividad?.id || 0,
    nombre: backendData.actividad?.nombre || '',
    codigo: backendData.actividad?.codigo || '',
    estado: backendData.actividad?.estado || '',
    fechaInicio: null,
    fechaFin: null,
    progresoPorcentaje: backendData.actividad?.progreso || 0,
    tareas: {
      total,
      porHacer,
      enProgreso,
      enRevision,
      finalizadas,
    },
    subtareas: {
      total: tiposTrabajo.totalSubtareas || 0,
      completadas: 0,
    },
    metricas: {
      leadTimePromedio: metricasKanban.leadTime || 0,
      cycleTimePromedio: metricasKanban.cycleTime || 0,
      throughputSemanal: metricasKanban.throughput || 0,
      wipActual: enProgreso + enRevision,
      wipLimite: 5, // Default WIP limit
    },
    tareasPorPrioridad,
    responsables: (backendData.equipo || []).map((m: any) => ({
      id: m.personalId || m.id,
      nombre: m.nombre,
      tareasAsignadas: m.tareasAsignadas || 0,
      tareasCompletadas: m.tareasCompletadas || 0,
    })),
    throughputHistorico: (backendData.throughputSemanal || []).map((t: any) => ({
      periodo: t.semana,
      periodoLabel: t.semana,
      tareasCompletadas: t.completadas || 0,
      subtareasCompletadas: 0,
    })),
    actividadReciente,
  };
}

/**
 * Obtener dashboard de una actividad especifica (Kanban)
 */
export async function getDashboardActividad(
  actividadId: number | string,
  filters?: DashboardActividadFilters
): Promise<DashboardActividad> {
  const response = await apiClient.get<any>(
    ENDPOINTS.DASHBOARD.ACTIVIDAD(actividadId),
    { params: filters }
  );
  // Mapear la respuesta del backend al formato esperado
  return mapBackendToFrontend(response.data);
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

// ============================================
// DASHBOARD GERENCIAL SERVICES
// ============================================

/**
 * Obtener KPIs gerenciales con variacion
 */
export async function getKpisGerenciales(): Promise<import('../types').KpisGerenciales> {
  const response = await apiClient.get(
    `${ENDPOINTS.DASHBOARD.BASE}/kpis`
  );
  return response.data;
}

/**
 * Obtener lista de proyectos activos con metricas
 */
export async function getProyectosActivos(
  params?: { page?: number; limit?: number }
): Promise<import('../types').ProyectosActivosResponse> {
  const response = await apiClient.get(
    `${ENDPOINTS.DASHBOARD.BASE}/proyectos-activos`,
    { params }
  );
  return response.data;
}

/**
 * Obtener lista de actividades activas con metricas Kanban
 */
export async function getActividadesActivas(
  params?: { page?: number; limit?: number }
): Promise<import('../types').ActividadesActivasResponse> {
  const response = await apiClient.get(
    `${ENDPOINTS.DASHBOARD.BASE}/actividades-activas`,
    { params }
  );
  return response.data;
}

/**
 * Obtener timeline de sprints para visualizacion Gantt
 */
export async function getSprintsTimeline(
  meses: number = 3
): Promise<import('../types').SprintsTimelineResponse> {
  const response = await apiClient.get(
    `${ENDPOINTS.DASHBOARD.BASE}/timeline-sprints`,
    { params: { meses } }
  );
  return response.data;
}

/**
 * Obtener salud detallada de proyectos
 */
export async function getSaludProyectosDetallada(): Promise<import('../types').SaludProyectosDetallada> {
  const response = await apiClient.get(
    `${ENDPOINTS.DASHBOARD.BASE}/salud-proyectos`
  );
  return response.data;
}

/**
 * Obtener actividad reciente de un proyecto (feed de eventos)
 */
export async function getActividadReciente(
  proyectoId: number | string,
  limit: number = 20
): Promise<{ data: import('../types').EventoActividad[]; total: number }> {
  const response = await apiClient.get(
    `${ENDPOINTS.DASHBOARD.BASE}/proyecto/${proyectoId}/actividad-reciente`,
    { params: { limit } }
  );
  return response.data;
}

/**
 * Obtener carga de trabajo del equipo de un proyecto
 */
export async function getCargaEquipo(
  proyectoId: number | string
): Promise<{
  data: import('../types').CargaDesarrollador[];
  promedioTareasCompletadas: number;
  totalStoryPoints: number;
}> {
  const response = await apiClient.get(
    `${ENDPOINTS.DASHBOARD.BASE}/proyecto/${proyectoId}/carga-equipo`
  );
  return response.data;
}

/**
 * Exportar servicio como objeto para uso consistente
 */
/**
 * Obtener datos para CFD (Cumulative Flow Diagram) de una actividad
 */
export async function getCfdData(
  actividadId: number | string,
  dias: number = 30
): Promise<import('../types').CfdResponse> {
  const response = await apiClient.get(
    `${ENDPOINTS.DASHBOARD.BASE}/actividad/${actividadId}/cfd`,
    { params: { dias } }
  );
  return response.data;
}

/**
 * Obtener tendencias de metricas Kanban de una actividad
 */
export async function getTendenciasMetricasActividad(
  actividadId: number | string,
  semanas: number = 8
): Promise<import('../types').TendenciasMetricasResponse> {
  const response = await apiClient.get(
    `${ENDPOINTS.DASHBOARD.BASE}/actividad/${actividadId}/tendencias-metricas`,
    { params: { semanas } }
  );
  return response.data;
}

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
  // Gerencial
  getKpisGerenciales,
  getProyectosActivos,
  getActividadesActivas,
  getSprintsTimeline,
  getSaludProyectosDetallada,
  // Dashboard Proyecto
  getActividadReciente,
  getCargaEquipo,
  // Dashboard Actividad (Kanban)
  getCfdData,
  getTendenciasMetricasActividad,
};
