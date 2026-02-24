/**
 * Cronograma Feature - Types
 *
 * Definiciones de tipos para el modulo de Cronograma/Gantt
 */

/**
 * Fases del ciclo de vida del proyecto
 */
export type FaseCronograma =
  | 'Analisis'
  | 'Diseno'
  | 'Desarrollo'
  | 'Pruebas'
  | 'Implementacion'
  | 'Mantenimiento';

/**
 * Opciones de fases para selectores
 */
export const FASES_CRONOGRAMA: { value: FaseCronograma; label: string; color: string }[] = [
  { value: 'Analisis', label: 'Análisis', color: '#3b82f6' }, // Blue
  { value: 'Diseno', label: 'Diseño', color: '#8b5cf6' }, // Violet
  { value: 'Desarrollo', label: 'Desarrollo', color: '#10b981' }, // Emerald
  { value: 'Pruebas', label: 'Pruebas', color: '#f59e0b' }, // Amber
  { value: 'Implementacion', label: 'Implementación', color: '#ef4444' }, // Red
  { value: 'Mantenimiento', label: 'Mantenimiento', color: '#6b7280' }, // Gray
];

/**
 * Tipos de dependencia entre tareas (relaciones PDM)
 * - FS: Finish-to-Start (la mas comun)
 * - FF: Finish-to-Finish
 * - SS: Start-to-Start
 * - SF: Start-to-Finish
 */
export type TipoDependencia = 'FS' | 'FF' | 'SS' | 'SF';

/**
 * Tipo de elemento en el cronograma
 * - tarea: Tarea normal con duracion
 * - hito: Punto de control sin duracion
 * - proyecto: Elemento padre agrupador
 */
export type TipoTarea = 'tarea' | 'hito' | 'proyecto';

/**
 * Estados de una tarea del cronograma
 */
export type TareaEstadoCronograma =
  | 'Por hacer'
  | 'En progreso'
  | 'Completado';

/**
 * Opciones de estados para selectores
 */
export const ESTADOS_TAREA_CRONOGRAMA: { value: TareaEstadoCronograma; label: string; color: string }[] = [
  { value: 'Por hacer', label: 'Por hacer', color: '#6b7280' },
  { value: 'En progreso', label: 'En progreso', color: '#3b82f6' },
  { value: 'Completado', label: 'Completado', color: '#10b981' },
];

/**
 * Opciones de asignación para tareas del cronograma
 * - Scrum Master: Solo el Scrum Master del proyecto
 * - Desarrolladores: Todos los desarrolladores del proyecto
 * - Todo el equipo: Scrum Master + Todos los desarrolladores
 */
export type AsignadoA = 'Scrum Master' | 'Desarrolladores' | 'Todo el equipo';

/**
 * Opciones de asignación para selectores
 */
export const ASIGNADO_A_OPTIONS: { value: AsignadoA; label: string; description: string }[] = [
  { value: 'Scrum Master', label: 'Scrum Master', description: 'Solo el Scrum Master del proyecto' },
  { value: 'Desarrolladores', label: 'Desarrolladores', description: 'Todos los desarrolladores del proyecto' },
  { value: 'Todo el equipo', label: 'Todo el equipo', description: 'Scrum Master y todos los desarrolladores' },
];

/**
 * Dependencia entre tareas del cronograma
 */
export interface DependenciaCronograma {
  id: string;
  tareaOrigenId: string;
  tareaDestinoId: string;
  tipo: TipoDependencia;
  lag?: number; // Dias de desfase (positivo o negativo)
}

/**
 * Tarea del cronograma (Gantt)
 */
export interface TareaCronograma {
  id: string;
  codigo: string;
  nombre: string;
  inicio: Date;
  fin: Date;
  progreso: number; // 0-100
  estado?: TareaEstadoCronograma; // Estado de la tarea del cronograma
  tipo: TipoTarea;
  asignadoA?: AsignadoA; // Asignación de la tarea
  color?: string;
  dependencias: DependenciaCronograma[];
  orden: number;
  padre?: string; // ID de tarea padre para anidamiento
  descripcion?: string;
  esHito?: boolean;
  fase?: FaseCronograma;
  enRutaCritica?: boolean;
  tieneConflicto?: boolean;
  conflictoDescripcion?: string;
  responsable?: { id: number; nombre: string };
}

/**
 * Estados del cronograma
 */
export type CronogramaEstado = 'Borrador' | 'En revisión' | 'Aprobado' | 'Rechazado';

/**
 * Cronograma completo de un proyecto
 */
export interface Cronograma {
  id: number;
  proyectoId: number;
  nombre: string;
  descripcion?: string;
  estado: CronogramaEstado;
  tareas: TareaCronograma[];
  dependencias: DependenciaCronograma[];
  fechaBase?: string; // Fecha de linea base
  activo: boolean;
  // Campos de aprobación dual (PMO + PATROCINADOR)
  aprobadoPorPmo?: boolean;
  aprobadoPorPatrocinador?: boolean;
  fechaAprobacionPmo?: string | null;
  fechaAprobacionPatrocinador?: string | null;
  comentarioRechazo?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input para crear una tarea del cronograma
 */
export interface CreateTareaCronogramaInput {
  codigo?: string;
  nombre: string;
  inicio: string; // ISO date string
  fin: string;
  tipo: TipoTarea;
  fase?: FaseCronograma;
  asignadoA?: AsignadoA;
  color?: string;
  orden?: number;
  padre?: string;
  descripcion?: string;
  progreso?: number;
}

/**
 * Input para actualizar una tarea del cronograma
 */
export interface UpdateTareaCronogramaInput {
  codigo?: string;
  nombre?: string;
  inicio?: string;
  fin?: string;
  tipo?: TipoTarea;
  fase?: FaseCronograma | null;
  asignadoA?: AsignadoA | null;
  color?: string;
  orden?: number;
  padre?: string | null;
  descripcion?: string;
  progreso?: number;
}

/**
 * Input para crear una dependencia
 */
export interface CreateDependenciaInput {
  tareaOrigenId: string;
  tareaDestinoId: string;
  tipo: TipoDependencia;
  lag?: number;
}

/**
 * Input para crear un cronograma
 */
export interface CreateCronogramaInput {
  nombre: string;
  descripcion?: string;
}

/**
 * Input para actualizar un cronograma
 */
export interface UpdateCronogramaInput {
  nombre?: string;
  descripcion?: string;
  fechaBase?: string;
}

/**
 * Formato de exportacion disponible
 */
export type FormatoExportacion = 'pdf' | 'excel';

/**
 * Respuesta de exportacion
 */
export interface ExportacionResponse {
  url: string;
  filename: string;
}

/**
 * Modos de vista del Gantt
 */
export type ViewMode = 'Hour' | 'QuarterDay' | 'HalfDay' | 'Day' | 'Week' | 'Month' | 'Year';

/**
 * Configuracion de visualizacion del Gantt
 */
export interface GanttConfig {
  viewMode: ViewMode;
  showTaskList: boolean;
  showDependencies: boolean;
  locale: string;
  columnWidth?: number;
  listCellWidth?: string;
  rowHeight?: number;
  headerHeight?: number;
  barCornerRadius?: number;
  handleWidth?: number;
  fontFamily?: string;
  fontSize?: string;
  barProgressColor?: string;
  barProgressSelectedColor?: string;
  barBackgroundColor?: string;
  barBackgroundSelectedColor?: string;
  projectProgressColor?: string;
  projectProgressSelectedColor?: string;
  projectBackgroundColor?: string;
  projectBackgroundSelectedColor?: string;
  milestoneBackgroundColor?: string;
  milestoneBackgroundSelectedColor?: string;
}

/**
 * Descripcion de tipos de dependencia para UI
 */
export const DEPENDENCIA_DESCRIPTIONS: Record<TipoDependencia, { nombre: string; descripcion: string }> = {
  FS: {
    nombre: 'Fin a Inicio (FS)',
    descripcion: 'La tarea sucesora comienza cuando termina la predecesora',
  },
  FF: {
    nombre: 'Fin a Fin (FF)',
    descripcion: 'La tarea sucesora termina cuando termina la predecesora',
  },
  SS: {
    nombre: 'Inicio a Inicio (SS)',
    descripcion: 'La tarea sucesora comienza cuando comienza la predecesora',
  },
  SF: {
    nombre: 'Inicio a Fin (SF)',
    descripcion: 'La tarea sucesora termina cuando comienza la predecesora',
  },
};

/**
 * Colores por defecto para tipos de tarea
 */
export const COLORES_POR_TIPO: Record<TipoTarea, string> = {
  tarea: '#004272', // Azul INEI
  hito: '#10b981', // Verde
  proyecto: '#6366f1', // Indigo
};

/**
 * Opciones de modo de vista con etiquetas
 */
export const VIEW_MODE_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'Day', label: 'Dia' },
  { value: 'Week', label: 'Semana' },
  { value: 'Month', label: 'Mes' },
  { value: 'Year', label: 'Ano' },
];

/**
 * Resultado del calculo de ruta critica
 */
export interface ResultadoRutaCritica {
  tareasCriticas: number[];
  tareasConConflicto: number[];
  duracionTotal: number;
  fechaFinProyecto: string;
  detalle: TareaConCPM[];
}

/**
 * Tarea con informacion de CPM (Critical Path Method)
 */
export interface TareaConCPM {
  id: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  duracion: number;
  earlyStart: number;
  earlyFinish: number;
  lateStart: number;
  lateFinish: number;
  holgura: number;
  enRutaCritica: boolean;
  tieneConflicto: boolean;
  conflictoDescripcion?: string;
}

/**
 * Datos de exportacion del cronograma
 */
export interface DatosExportacion {
  cronograma: {
    nombre: string;
    codigo: string;
    fechaInicio: string;
    fechaFin: string;
    estado: string;
    version: number;
  };
  tareas: TareaExportacion[];
  resumen: {
    totalTareas: number;
    tareasCompletadas: number;
    porcentajeGeneral: number;
    porFase: Record<string, { total: number; completadas: number }>;
  };
}

/**
 * Tarea formateada para exportacion
 */
export interface TareaExportacion {
  codigo: string;
  nombre: string;
  fase: string;
  fechaInicio: string;
  fechaFin: string;
  duracion: number;
  porcentajeAvance: number;
  estado: string;
  prioridad: string;
  asignadoA: string;
  dependencias: string;
  esHito: boolean;
}

/**
 * Filtros del cronograma
 */
export interface FiltrosCronograma {
  fases: FaseCronograma[];
  asignadoA?: AsignadoA[];
  mostrarRutaCritica: boolean;
  mostrarConflictos: boolean;
  fechaDesde?: Date;
  fechaHasta?: Date;
}
