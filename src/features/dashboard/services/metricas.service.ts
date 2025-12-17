/**
 * Metricas Service
 *
 * Servicios para obtener metricas y datos de graficos
 */

import { apiClient, ENDPOINTS } from '@/lib/api';
import type {
  BurndownData,
  VelocityData,
  LeadCycleTimeData,
  ThroughputPeriodo,
  MetricasProyecto,
  ProyectoSalud,
  MetricasActividad,
} from '../types';

// ============================================
// PROYECTO (SCRUM) METRICS
// ============================================

/**
 * Obtener datos de velocidad del proyecto
 */
export async function getProyectoVelocity(
  proyectoId: number | string
): Promise<VelocityData> {
  const response = await apiClient.get<VelocityData>(
    ENDPOINTS.DASHBOARD.PROYECTO_VELOCIDAD(proyectoId)
  );
  return response.data;
}

/**
 * Obtener datos de burndown del proyecto
 * Si no se proporciona sprintId, devuelve el burndown del sprint activo
 */
export async function getProyectoBurndown(
  proyectoId: number | string,
  sprintId?: number | string
): Promise<BurndownData> {
  const url = sprintId
    ? ENDPOINTS.PROYECTOS.BURNDOWN(proyectoId, sprintId)
    : ENDPOINTS.DASHBOARD.PROYECTO_BURNDOWN(proyectoId);

  const response = await apiClient.get<BurndownData>(url);
  return response.data;
}

/**
 * Obtener burndown de un sprint especifico
 */
export async function getSprintBurndown(
  sprintId: number | string
): Promise<BurndownData> {
  const response = await apiClient.get<BurndownData>(
    ENDPOINTS.SPRINTS.BURNDOWN(sprintId)
  );
  return response.data;
}

/**
 * Obtener metricas del sprint
 */
export async function getSprintMetricas(
  sprintId: number | string
): Promise<{
  sprintId: number;
  velocidad: number;
  storyPointsPlaneados: number;
  storyPointsCompletados: number;
  tasaCompletitud: number;
  historiasTerminadas: number;
  historiasEnProgreso: number;
  historiasNoIniciadas: number;
  burnVelocity: number;
}> {
  const response = await apiClient.get(
    `${ENDPOINTS.SPRINTS.BY_ID(sprintId)}/metricas`
  );
  return response.data;
}

// ============================================
// ACTIVIDAD (KANBAN) METRICS
// ============================================

/**
 * Obtener datos de throughput de una actividad
 */
export async function getActividadThroughput(
  actividadId: number | string,
  periodo?: 'semanal' | 'mensual'
): Promise<{
  actividadId: number;
  throughputPromedio: number;
  periodos: ThroughputPeriodo[];
}> {
  const response = await apiClient.get(
    ENDPOINTS.DASHBOARD.ACTIVIDAD_THROUGHPUT(actividadId),
    { params: { periodo } }
  );
  return response.data;
}

/**
 * Obtener datos de lead time de una actividad
 */
export async function getActividadLeadTime(
  actividadId: number | string
): Promise<{
  actividadId: number;
  leadTimePromedio: number;
  leadTimeMinimo: number;
  leadTimeMaximo: number;
  leadTimePorPrioridad: {
    prioridad: string;
    promedio: number;
  }[];
  tendencia: {
    periodo: string;
    valor: number;
  }[];
}> {
  const response = await apiClient.get(
    ENDPOINTS.ACTIVIDADES.METRICAS(actividadId),
    { params: { tipo: 'leadTime' } }
  );
  return response.data;
}

/**
 * Obtener datos de cycle time de una actividad
 */
export async function getActividadCycleTime(
  actividadId: number | string
): Promise<{
  actividadId: number;
  cycleTimePromedio: number;
  cycleTimeMinimo: number;
  cycleTimeMaximo: number;
  cycleTimePorPrioridad: {
    prioridad: string;
    promedio: number;
  }[];
  tendencia: {
    periodo: string;
    valor: number;
  }[];
}> {
  const response = await apiClient.get(
    ENDPOINTS.ACTIVIDADES.METRICAS(actividadId),
    { params: { tipo: 'cycleTime' } }
  );
  return response.data;
}

/**
 * Obtener metricas completas de una actividad
 */
export async function getActividadMetricas(
  actividadId: number | string
): Promise<LeadCycleTimeData> {
  const response = await apiClient.get<LeadCycleTimeData>(
    ENDPOINTS.ACTIVIDADES.METRICAS(actividadId)
  );
  return response.data;
}

/**
 * Obtener tendencias WIP (Work In Progress) de una actividad
 */
export async function getActividadWIPTrend(
  actividadId: number | string,
  dias?: number
): Promise<{
  actividadId: number;
  wipActual: number;
  wipLimite: number;
  tendencia: {
    fecha: string;
    wip: number;
  }[];
}> {
  const response = await apiClient.get(
    ENDPOINTS.ACTIVIDADES.METRICAS(actividadId),
    { params: { tipo: 'wip', dias: dias || 30 } }
  );
  return response.data;
}

// ============================================
// METRICAS CONSOLIDADAS POR ENTIDAD
// ============================================

/**
 * Obtener métricas consolidadas de un proyecto
 */
export async function getMetricasByProyecto(
  proyectoId: number | string
): Promise<MetricasProyecto> {
  const response = await apiClient.get<MetricasProyecto>(
    ENDPOINTS.DASHBOARD.PROYECTO(proyectoId)
  );
  return response.data;
}

/**
 * Obtener salud/health de un proyecto
 * @deprecated Usar getSaludProyecto de dashboard.service.ts
 */
export async function getProyectoSalud(
  proyectoId: number | string
): Promise<ProyectoSalud> {
  const response = await apiClient.get<ProyectoSalud>(
    `${ENDPOINTS.DASHBOARD.PROYECTO(proyectoId)}/salud`
  );
  return response.data;
}

/**
 * Obtener métricas consolidadas de una actividad
 */
export async function getMetricasByActividad(
  actividadId: number | string
): Promise<MetricasActividad> {
  const response = await apiClient.get<MetricasActividad>(
    ENDPOINTS.DASHBOARD.ACTIVIDAD(actividadId)
  );
  return response.data;
}

/**
 * Exportar servicio como objeto para uso consistente
 */
export const metricasService = {
  getProyectoVelocity,
  getProyectoBurndown,
  getSprintBurndown,
  getSprintMetricas,
  getActividadThroughput,
  getActividadLeadTime,
  getActividadCycleTime,
  getActividadMetricas,
  getActividadWIPTrend,
  getMetricasByProyecto,
  getProyectoSalud,
  getMetricasByActividad,
};
