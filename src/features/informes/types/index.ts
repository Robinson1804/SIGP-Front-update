/**
 * Informes Feature - Types
 *
 * Tipos para informes de sprint y actividad
 */

import type { EstadoAprobacion } from '@/features/aprobaciones';

/**
 * Informe de Sprint
 */
export interface InformeSprint {
  id: number;
  sprintId: number;
  proyectoId: number;
  proyectoNombre?: string;
  sprintNumero?: number;
  sprintNombre?: string;

  // Datos del sprint
  fechaInicio: string;
  fechaFin: string;
  objetivo: string;

  // Métricas
  historiasCompletadas: number;
  historiasPlaneadas: number;
  puntosCompletados: number;
  puntosPlaneados: number;
  velocidad: number;

  // Contenido del informe
  resumen: string;
  logrosAlcanzados: string[];
  desafiosEnfrentados: string[];
  leccionesAprendidas: string[];
  proximosPasos: string[];

  // Aprobación
  estadoAprobacion: EstadoAprobacion;

  // Auditoría
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  creadoPor?: {
    id: number;
    nombre: string;
  };
}

/**
 * Input para crear informe de sprint
 */
export interface CreateInformeSprintInput {
  sprintId: number;
  resumen: string;
  logrosAlcanzados: string[];
  desafiosEnfrentados: string[];
  leccionesAprendidas: string[];
  proximosPasos: string[];
}

/**
 * Input para actualizar informe de sprint
 */
export interface UpdateInformeSprintInput extends Partial<CreateInformeSprintInput> {
  id: number;
}

/**
 * Informe de Actividad
 */
export interface InformeActividad {
  id: number;
  actividadId: number;
  actividadNombre?: string;
  periodo: string; // Formato: "YYYY-MM" o "YYYY-Qn"

  // Métricas
  tareasCompletadas: number;
  tareasPendientes: number;
  porcentajeAvance: number;
  leadTime: number; // Días promedio
  cycleTime: number; // Días promedio
  throughput: number; // Tareas por periodo

  // Contenido del informe
  resumen: string;
  actividadesRealizadas: string[];
  dificultades: string[];
  recomendaciones: string[];

  // Aprobación
  estadoAprobacion: EstadoAprobacion;

  // Auditoría
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  creadoPor?: {
    id: number;
    nombre: string;
  };
}

/**
 * Input para crear informe de actividad
 */
export interface CreateInformeActividadInput {
  actividadId: number;
  periodo: string;
  resumen: string;
  actividadesRealizadas: string[];
  dificultades: string[];
  recomendaciones: string[];
}

/**
 * Input para actualizar informe de actividad
 */
export interface UpdateInformeActividadInput extends Partial<CreateInformeActividadInput> {
  id: number;
}

/**
 * Datos para generar informe de sprint automáticamente
 */
export interface GenerarInformeSprintData {
  sprintId: number;
}

/**
 * Respuesta de generación de informe
 */
export interface GenerarInformeResponse {
  informe: InformeSprint;
  mensaje: string;
}
