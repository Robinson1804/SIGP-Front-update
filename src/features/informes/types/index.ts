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
  codigo?: string;
  periodo: string; // Formato: "YYYY-MM", "YYYY-Qn", o tipo de periodo

  // Métricas
  tareasCompletadas: number;
  tareasPendientes: number;
  porcentajeAvance: number;
  leadTime: number; // Días promedio
  cycleTime: number; // Días promedio
  throughput: number; // Tareas por periodo

  // Contenido del informe
  resumen?: string;
  actividadesRealizadas?: string[];
  dificultades?: string[];
  recomendaciones?: string[];
  logros?: string[];
  problemas?: Array<{ descripcion: string; accion?: string; resuelto: boolean }>;
  proximasAcciones?: string[];
  observaciones?: string;

  // Estado (del backend)
  estado: 'Borrador' | 'Enviado' | 'En revision' | 'Aprobado' | 'Rechazado';

  // Aprobación (legacy, mantener por compatibilidad)
  estadoAprobacion?: EstadoAprobacion;

  // Auditoría
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
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
  codigo: string;
  periodo: 'Semanal' | 'Quincenal' | 'Mensual' | 'Bimestral' | 'Trimestral';
  numeroPeriodo: number;
  anio: number;
  fechaInicio: string;
  fechaFin: string;
  tareasPendientes?: Array<{
    id: string;
    titulo: string;
    responsable?: string;
    fechaLimite?: string;
  }>;
  tareasEnProgreso?: Array<{
    id: string;
    titulo: string;
    responsable?: string;
    porcentajeAvance?: number;
  }>;
  tareasCompletadas?: Array<{
    id: string;
    titulo: string;
    responsable?: string;
    fechaCompletado?: string;
  }>;
  totalTareasPendientes?: number;
  totalTareasEnProgreso?: number;
  totalTareasCompletadas?: number;
  logros?: string[];
  problemas?: Array<{
    descripcion: string;
    accion?: string;
    resuelto: boolean;
  }>;
  proximasAcciones?: string[];
  observaciones?: string;
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
