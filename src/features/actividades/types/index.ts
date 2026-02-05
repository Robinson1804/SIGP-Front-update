/**
 * Actividades Feature - Types
 *
 * Tipos para el módulo de Actividades (Kanban)
 */

// ============================================
// ACTIVIDAD - Entity Types
// ============================================

/**
 * Estados posibles de una Actividad
 */
export type ActividadEstado =
  | 'Pendiente'
  | 'En ejecucion'
  | 'Finalizado'
  | 'Suspendido';

/**
 * Clasificación de la actividad
 */
export type ActividadClasificacion = 'Al ciudadano' | 'Gestion interna';

/**
 * Periodicidad de informes
 */
export type PeriodicidadInforme =
  | 'MENSUAL'
  | 'BIMESTRAL'
  | 'TRIMESTRAL'
  | 'SEMESTRAL'
  | 'ANUAL';

/**
 * Interfaz completa de Actividad basada en backend schema
 */
export interface Actividad {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  tipo: 'Actividad';
  clasificacion: ActividadClasificacion | null;
  estado: ActividadEstado;

  // Vinculación estratégica
  accionEstrategicaId: number | null;

  // Responsables
  coordinadorId: number | null;
  gestorId: number | null;

  // Financiero
  coordinacion: string | null;
  areasFinancieras: string[] | null;
  montoAnual: number | null;
  anios: number[] | null;

  // Fechas
  fechaInicio: string | null;
  fechaFin: string | null;

  // Metodología (siempre Kanban para actividades)
  metodoGestion: 'Kanban';

  // Periodicidad de informes
  periodicidadInforme: PeriodicidadInforme;

  // Auditoría
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: number;

  // Relaciones (opcionales, dependiendo del endpoint)
  coordinador?: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
  };
  gestor?: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
  };
  accionEstrategica?: {
    id: number;
    codigo: string;
    nombre: string;
  };
  tareasCount?: number;
  tareasCompletadas?: number;
}

/**
 * Input para crear una Actividad
 */
export interface CreateActividadInput {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  clasificacion?: ActividadClasificacion;
  accionEstrategicaId?: number;
  coordinadorId?: number;
  gestorId?: number;
  coordinacion?: string;
  areasFinancieras?: string[];
  montoAnual?: number;
  anios?: number[];
  fechaInicio?: string;
  fechaFin?: string;
  periodicidadInforme?: PeriodicidadInforme;
}

/**
 * Input para actualizar una Actividad
 */
export interface UpdateActividadInput extends Partial<CreateActividadInput> {
  estado?: ActividadEstado;
}

/**
 * Filtros de consulta para Actividades
 */
export interface ActividadQueryFilters {
  search?: string;
  estado?: ActividadEstado;
  coordinadorId?: number;
  responsableUsuarioId?: number;
  accionEstrategicaId?: number;
  pgdId?: number;
  anno?: number;
  activo?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// TAREA KANBAN - Entity Types
// ============================================

/**
 * Estados posibles de una Tarea
 */
export type TareaEstado =
  | 'Por hacer'
  | 'En progreso'
  | 'Finalizado';

/**
 * Prioridades de una Tarea
 */
export type TareaPrioridad = 'Alta' | 'Media' | 'Baja';

/**
 * Interfaz completa de Tarea Kanban basada en backend schema
 */
export interface TareaKanban {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  tipo: 'KANBAN';

  // Relación
  actividadId: number;

  // Estado y prioridad
  estado: TareaEstado;
  prioridad: TareaPrioridad;

  // Asignación
  asignadoA: number | null;

  // Tiempo
  horasEstimadas: number | null;
  horasReales: number | null;

  // Fechas
  fechaInicio: string | null;
  fechaFin: string | null;
  fechaCompletado: string | null;
  entregadoATiempo: boolean | null;

  // Evidencia
  evidenciaUrl: string | null;

  // Validación
  validada: boolean;
  validadaPor: number | null;
  validadaEn: string | null;
  observacionValidacion: string | null;

  // Auditoría
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: number;

  // Relaciones (opcionales)
  asignadoAInfo?: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
  };
  /**
   * Usuario que creó la tarea (informador)
   */
  creator?: {
    id: number;
    nombre: string;
    apellido: string;
    email?: string;
  };
  actividad?: {
    id: number;
    codigo: string;
    nombre: string;
  };
  /**
   * Lista de usuarios asignados a la tarea (múltiples responsables)
   */
  asignados?: Array<{
    id: number;
    usuarioId: number;
    rol: string;
    usuario?: {
      id: number;
      nombre: string;
      apellido: string;
      email?: string;
    };
  }>;
  subtareasCount?: number;
  subtareasCompletadas?: number;
}

/**
 * Input para crear una Tarea Kanban
 */
export interface CreateTareaKanbanInput {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  actividadId: number;
  prioridad?: TareaPrioridad;
  asignadoA?: number;
  /**
   * Array de IDs de usuarios a asignar a la tarea.
   * Máximo 5 responsables.
   */
  asignadosIds?: number[];
  informador?: number;
  horasEstimadas?: number;
  fechaInicio?: string;
  fechaFin?: string;
}

/**
 * Input para actualizar una Tarea Kanban
 */
export interface UpdateTareaKanbanInput extends Partial<Omit<CreateTareaKanbanInput, 'actividadId'>> {
  estado?: TareaEstado;
  horasReales?: number;
  evidenciaUrl?: string;
}

/**
 * Input para cambiar estado de una tarea
 */
export interface CambiarEstadoTareaInput {
  estado: TareaEstado;
}

/**
 * Input para mover una tarea en el tablero
 */
export interface MoverTareaInput {
  estado: TareaEstado;
  orden?: number;
}

/**
 * Filtros de consulta para Tareas Kanban
 */
export interface TareaKanbanQueryFilters {
  actividadId?: number;
  estado?: TareaEstado;
  prioridad?: TareaPrioridad;
  asignadoA?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ============================================
// SUBTAREA - Entity Types (Solo Kanban)
// ============================================

/**
 * Estados posibles de una Subtarea
 */
export type SubtareaEstado =
  | 'Por hacer'
  | 'En progreso'
  | 'Finalizado';

/**
 * Prioridades de una Subtarea
 */
export type SubtareaPrioridad = 'Alta' | 'Media' | 'Baja';

/**
 * Interfaz completa de Subtarea basada en backend schema
 */
export interface Subtarea {
  id: number;
  tareaId: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;

  // Estado y prioridad
  estado: SubtareaEstado;
  prioridad: SubtareaPrioridad;

  // Asignación
  responsableId: number | null;
  responsable?: {
    id: number;
    nombre: string;
    apellido: string;
    email?: string;
  } | null;

  // Tiempo
  horasEstimadas: number | null;
  horasReales: number | null;

  // Fechas
  fechaInicio: string | null;
  fechaFin: string | null;
  fechaCompletado: string | null;
  entregadoATiempo: boolean | null;

  // Evidencia
  evidenciaUrl: string | null;

  // Validación
  validada: boolean;
  validadoPor: number | null;
  fechaValidacion: string | null;
  observacionValidacion: string | null;

  // Auditoría
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: number;

  // Relaciones (opcionales)
  responsableInfo?: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
  };
  /**
   * Usuario que creó la subtarea (informador)
   */
  creator?: {
    id: number;
    nombre: string;
    apellido: string;
    email?: string;
  };
  tarea?: {
    id: number;
    codigo: string;
    nombre: string;
  };
}

/**
 * Input para crear una Subtarea
 */
export interface CreateSubtareaInput {
  tareaId: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  prioridad?: SubtareaPrioridad;
  responsableId?: number;
  horasEstimadas?: number;
  fechaInicio?: string;
  fechaFin?: string;
}

/**
 * Input para actualizar una Subtarea
 */
export interface UpdateSubtareaInput extends Partial<Omit<CreateSubtareaInput, 'tareaId' | 'codigo'>> {
  codigo?: string;
  estado?: SubtareaEstado;
  horasReales?: number;
  evidenciaUrl?: string;
}

/**
 * Filtros de consulta para Subtareas
 */
export interface SubtareaQueryFilters {
  tareaId?: number;
  estado?: SubtareaEstado;
  prioridad?: SubtareaPrioridad;
  responsable?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Estadísticas de subtareas de una tarea
 */
export interface SubtareaEstadisticas {
  total: number;
  porHacer: number;
  enProgreso: number;
  finalizadas: number;
  validadas: number;
  porcentajeCompletado: number;
  horasEstimadas: number;
  horasReales: number;
}

// ============================================
// TABLERO KANBAN - View Types
// ============================================

/**
 * Columna del tablero Kanban
 */
export interface KanbanColumna {
  id: TareaEstado;
  titulo: string;
  tareas: TareaKanban[];
  limite?: number;
}

/**
 * Vista del tablero Kanban
 */
export interface TableroKanban {
  actividadId: number;
  actividad: Actividad;
  columnas: KanbanColumna[];
  metricas: {
    totalTareas: number;
    tareasCompletadas: number;
    tareasEnProgreso: number;
    tareasPorHacer: number;
    leadTimePromedio: number | null;
    cycleTimePromedio: number | null;
  };
}

// ============================================
// MÉTRICAS - Analytics Types
// ============================================

/**
 * Métricas Kanban de una Actividad
 * Calculadas desde el backend a partir de las tareas KANBAN de la actividad
 */
export interface ActividadMetricas {
  /** Tiempo promedio desde creación hasta completado (días) */
  leadTime: number | null;
  /** Tiempo promedio desde inicio de progreso hasta completado (días) */
  cycleTime: number | null;
  /** Tareas completadas en la última semana */
  throughput: number;
  /** Tareas actualmente en progreso (Work In Progress) */
  wipActual: number;
  /** Total de tareas KANBAN de la actividad */
  totalTareas: number;
  /** Tareas en estado "Por hacer" */
  tareasPorHacer: number;
  /** Tareas en estado "En progreso" */
  tareasEnProgreso: number;
  /** Tareas en estado "Finalizado" */
  tareasCompletadas: number;
  /** Porcentaje de tareas completadas sobre el total */
  porcentajeCompletado: number;
}
