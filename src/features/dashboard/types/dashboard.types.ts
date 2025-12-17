/**
 * Dashboard Types
 *
 * TypeScript definitions for dashboard-related data structures
 */

// ============================================
// DASHBOARD GENERAL TYPES
// ============================================

/**
 * Respuesta del dashboard general
 */
export interface DashboardGeneral {
  totalProyectos: number;
  proyectosActivos: number;
  proyectosFinalizados: number;
  proyectosPendientes: number;
  totalActividades: number;
  actividadesActivas: number;
  actividadesFinalizadas: number;
  totalSprints: number;
  sprintsActivos: number;
  totalHistoriasUsuario: number;
  historiasTerminadas: number;
  tareasCompletadasMes: number;
  progresoPorcentaje: number;
  proyectosPorEstado: EstadoCount[];
  actividadesPorEstado: EstadoCount[];
  proximasActividades: ProximaActividad[];
  proximosSprints: ProximoSprint[];
  actividadReciente: ActividadReciente[];
}

/**
 * Conteo por estado
 */
export interface EstadoCount {
  estado: string;
  cantidad: number;
  color: string;
}

/**
 * Proxima actividad pendiente
 */
export interface ProximaActividad {
  id: number;
  titulo: string;
  proyecto: string;
  proyectoId: number;
  fechaVencimiento: string;
  asignadoA: string;
  prioridad: string;
}

/**
 * Proximo sprint
 */
export interface ProximoSprint {
  id: number;
  nombre: string;
  proyecto: string;
  proyectoId: number;
  fechaInicio: string;
  fechaFin: string;
}

/**
 * Actividad reciente en el sistema
 */
export interface ActividadReciente {
  id: number;
  usuario: string;
  usuarioId: number;
  accion: 'creado' | 'actualizado' | 'cambio_estado' | 'comentado' | 'asignado' | 'completado';
  entidad: string;
  entidadTipo: 'proyecto' | 'historia' | 'tarea' | 'sprint' | 'actividad';
  entidadId: number;
  descripcion: string;
  timestamp: string;
  estadoNuevo?: string;
  estadoAnterior?: string;
}

// ============================================
// DASHBOARD PROYECTO (SCRUM) TYPES
// ============================================

/**
 * Dashboard de un proyecto especifico
 */
export interface DashboardProyecto {
  proyectoId: number;
  nombre: string;
  codigo: string;
  estado: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  progresoPorcentaje: number;

  // Sprints
  totalSprints: number;
  sprintsCompletados: number;
  sprintActual: SprintResumen | null;

  // Story Points
  storyPointsPlaneados: number;
  storyPointsCompletados: number;
  storyPointsRestantes: number;

  // Historias de Usuario
  historiasUsuario: {
    total: number;
    pendientes: number;
    enAnalisis: number;
    listas: number;
    enDesarrollo: number;
    enPruebas: number;
    enRevision: number;
    terminadas: number;
  };

  // Tareas
  tareas: {
    total: number;
    porHacer: number;
    enProgreso: number;
    enRevision: number;
    finalizadas: number;
  };

  // Metricas
  tasas: {
    completitud: number;
    velocidadPromedio: number;
  };

  // Equipo
  equipo: MiembroEquipo[];

  // Graficos
  velocidadPorSprint: VelocidadSprint[];
  historiaPorPrioridad: PrioridadCount[];
}

/**
 * Resumen de sprint
 */
export interface SprintResumen {
  id: number;
  nombre: string;
  estado: 'Planificado' | 'Activo' | 'Completado';
  fechaInicio: string;
  fechaFin: string;
  diasRestantes: number;
  storyPointsPlaneados: number;
  storyPointsCompletados: number;
  progreso: number;
}

/**
 * Miembro del equipo con carga de trabajo
 */
export interface MiembroEquipo {
  id: number;
  nombre: string;
  rol: string;
  avatar?: string;
  tareasAsignadas: number;
  tareasCompletadas: number;
  storyPointsAsignados: number;
  storyPointsCompletados: number;
}

/**
 * Velocidad por sprint
 */
export interface VelocidadSprint {
  sprintId: number;
  sprint: string;
  comprometidos: number;
  completados: number;
  velocidad: number;
}

/**
 * Conteo por prioridad
 */
export interface PrioridadCount {
  prioridad: string;
  cantidad: number;
  color: string;
}

// ============================================
// BURNDOWN CHART TYPES
// ============================================

/**
 * Datos del grafico burndown
 */
export interface BurndownData {
  sprintId: number;
  sprintNombre: string;
  fechaInicio: string;
  fechaFin: string;
  storyPointsTotales: number;
  dias: BurndownDia[];
}

/**
 * Punto de datos del burndown por dia
 */
export interface BurndownDia {
  fecha: string;
  puntosRestantes: number;
  lineaIdeal: number;
  puntosCompletados: number;
}

/**
 * Props para el componente BurndownChart
 */
export interface BurndownChartProps {
  data: BurndownDia[];
  sprintName?: string;
  loading?: boolean;
  error?: string;
}

// ============================================
// VELOCITY CHART TYPES
// ============================================

/**
 * Datos del grafico de velocidad
 */
export interface VelocityData {
  proyectoId: number;
  velocidadPromedio: number;
  tendencia: 'creciente' | 'decreciente' | 'estable';
  velocidades: VelocidadSprint[];
}

/**
 * Props para el componente VelocityChart
 */
export interface VelocityChartProps {
  data: VelocidadSprint[];
  loading?: boolean;
  error?: string;
}

// ============================================
// DASHBOARD ACTIVIDAD (KANBAN) TYPES
// ============================================

/**
 * Dashboard de una actividad especifica (Kanban)
 */
export interface DashboardActividad {
  actividadId: number;
  nombre: string;
  codigo: string;
  estado: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  progresoPorcentaje: number;

  // Tareas
  tareas: {
    total: number;
    porHacer: number;
    enProgreso: number;
    enRevision: number;
    finalizadas: number;
  };

  // Subtareas
  subtareas: {
    total: number;
    completadas: number;
  };

  // Metricas Kanban
  metricas: {
    leadTimePromedio: number; // dias
    cycleTimePromedio: number; // dias
    throughputSemanal: number; // tareas por semana
    wipActual: number; // trabajo en progreso
    wipLimite: number;
  };

  // Tareas por prioridad
  tareasPorPrioridad: PrioridadCount[];

  // Responsables
  responsables: ResponsableActividad[];

  // Historial de throughput
  throughputHistorico: ThroughputPeriodo[];
}

/**
 * Responsable de actividad
 */
export interface ResponsableActividad {
  id: number;
  nombre: string;
  avatar?: string;
  tareasAsignadas: number;
  tareasCompletadas: number;
}

// ============================================
// THROUGHPUT CHART TYPES
// ============================================

/**
 * Datos de throughput por periodo
 */
export interface ThroughputPeriodo {
  periodo: string; // formato: "2024-W01" o "2024-01"
  periodoLabel: string; // formato legible: "Semana 1" o "Enero"
  tareasCompletadas: number;
  subtareasCompletadas: number;
}

/**
 * Props para el componente ThroughputChart
 */
export interface ThroughputChartProps {
  data: ThroughputPeriodo[];
  loading?: boolean;
  error?: string;
}

// ============================================
// LEAD TIME / CYCLE TIME TYPES
// ============================================

/**
 * Datos de lead time y cycle time
 */
export interface LeadCycleTimeData {
  actividadId: number;
  leadTimePromedio: number;
  cycleTimePromedio: number;
  leadTimePorPrioridad: {
    prioridad: string;
    promedio: number;
    minimo: number;
    maximo: number;
  }[];
  cycleTimePorPrioridad: {
    prioridad: string;
    promedio: number;
    minimo: number;
    maximo: number;
  }[];
  tendenciaLeadTime: TiempoHistorico[];
  tendenciaCycleTime: TiempoHistorico[];
}

/**
 * Punto de datos de tiempo historico
 */
export interface TiempoHistorico {
  periodo: string;
  valor: number;
}

// ============================================
// PIE CHART TYPES
// ============================================

/**
 * Datos para grafico de pie por estado
 */
export interface StatusPieData {
  estado: string;
  cantidad: number;
  color: string;
}

/**
 * Props para el componente StatusPieChart
 */
export interface StatusPieChartProps {
  data: StatusPieData[];
  title?: string;
  loading?: boolean;
  error?: string;
}

// ============================================
// FILTER TYPES
// ============================================

/**
 * Periodo de filtrado
 */
export type PeriodoFiltro = 'semana' | 'mes' | 'trimestre' | 'anno' | 'todo';

/**
 * Filtros del dashboard general (tipo para servicio)
 * @deprecated Usar DashboardFiltros para consistencia
 */
export interface DashboardFiltersOptions {
  periodo?: PeriodoFiltro;
  anno?: number;
  coordinadorId?: number;
  divisionId?: number;
}

/**
 * Filtros del dashboard de proyecto
 */
export interface DashboardProyectoFilters {
  sprintId?: number;
  periodo?: PeriodoFiltro;
}

/**
 * Filtros del dashboard de actividad
 */
export interface DashboardActividadFilters {
  periodo?: PeriodoFiltro;
  responsableId?: number;
}

// ============================================
// EXTENDED DASHBOARD TYPES (Enhanced Dashboard)
// ============================================

/**
 * Resumen extendido del dashboard
 */
export interface DashboardResumen {
  totalProyectos: number;
  proyectosActivos: number;
  proyectosAtrasados: number;
  proyectosCompletados: number;
  proyectosCancelados: number;
  totalActividades: number;
  actividadesActivas: number;
  actividadesCompletadas: number;
}

/**
 * Proyectos distribuidos por estado con porcentaje
 */
export interface ProyectoPorEstado {
  estado: string;
  cantidad: number;
  porcentaje: number;
  color: string;
}

/**
 * Avance de un OEI (Objetivo Estratégico Institucional)
 */
export interface AvanceOEI {
  oeiId: number;
  codigo: string;
  nombre: string;
  avanceReal: number;
  avancePlanificado: number;
  diferencia: number;
}

/**
 * Salud/Health de un proyecto
 */
export interface SaludProyecto {
  proyectoId: number;
  nombre: string;
  score: number; // 0-100
  color: 'verde' | 'amarillo' | 'rojo';
  factores: {
    avanceReal: number;
    avancePlanificado: number;
    sprintsAtrasados: number;
    tareasBloquedas: number;
    huSinAsignar: number;
  };
  recomendaciones: string[];
}

/**
 * Alerta del sistema
 */
export interface Alerta {
  id: number;
  tipo: 'warning' | 'error' | 'info';
  titulo: string;
  descripcion: string;
  proyectoId?: number;
  proyecto?: string;
  fecha: string;
  accionUrl?: string;
}

/**
 * Datos de tendencia temporal
 */
export interface TendenciaData {
  periodo: string;
  proyectosIniciados: number;
  proyectosCompletados: number;
  tareasCompletadas: number;
}

/**
 * Filtros para el dashboard general extendido
 */
export interface DashboardFiltros {
  periodo?: PeriodoFiltro;
  proyectoId?: number;
  oeiId?: number;
}

// ============================================
// DASHBOARD SUMMARY (for export and pages)
// ============================================

/**
 * Resumen del dashboard para exportación
 */
export interface DashboardSummary {
  totalProyectos: number;
  proyectosActivos: number;
  proyectosFinalizados: number;
  proyectosPendientes: number;
  totalActividades: number;
  actividadesActivas: number;
  totalSprints: number;
  sprintsActivos: number;
  progresoPorcentaje: number;
  proyectosPorEstado: EstadoCount[];
  avancePorOEI?: AvanceOEI[];
  alertas?: Alerta[];
  tendencias?: TendenciaData[];
}

// ============================================
// METRICAS POR PROYECTO
// ============================================

/**
 * Métricas específicas de un proyecto
 */
export interface MetricasProyecto {
  proyectoId: number;
  nombre: string;
  sprintsTotal: number;
  sprintsCompletados: number;
  historiasTotal: number;
  historiasCompletadas: number;
  velocidadPromedio: number;
  progresoGeneral: number;
  tendencias?: TendenciaData[];
}

/**
 * Salud de un proyecto para visualización
 */
export interface ProyectoSalud {
  proyectoId: number;
  nombre: string;
  score: number;
  estado: 'saludable' | 'en_riesgo' | 'critico';
  color: 'verde' | 'amarillo' | 'rojo';
  factoresRiesgo?: {
    descripcion: string;
    severidad: 'alta' | 'media' | 'baja';
  }[];
  recomendaciones?: string[];
}

// ============================================
// METRICAS POR ACTIVIDAD (KANBAN)
// ============================================

/**
 * Métricas específicas de una actividad Kanban
 */
export interface MetricasActividad {
  actividadId: number;
  nombre: string;
  leadTimePromedio: number;
  cycleTimePromedio: number;
  throughput: number;
  wipActual: number;
  wipLimit?: number;
  subtareasTotal: number;
  subtareasCompletadas: number;
  tareasPorEstado: {
    estado: string;
    cantidad: number;
    porcentaje: number;
    color?: string;
  }[];
  tendenciasFlujo?: TendenciaData[];
}
