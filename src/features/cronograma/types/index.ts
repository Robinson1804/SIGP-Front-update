/**
 * Cronograma Feature - Types
 *
 * Definiciones de tipos para el modulo de Cronograma/Gantt
 */

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
 * Responsable simplificado para el cronograma
 */
export interface ResponsableCronograma {
  id: number;
  nombre: string;
  email?: string;
}

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
  tipo: TipoTarea;
  responsableId?: number;
  responsable?: ResponsableCronograma;
  color?: string;
  dependencias: DependenciaCronograma[];
  orden: number;
  padre?: string; // ID de tarea padre para anidamiento
  descripcion?: string;
  esHito?: boolean;
}

/**
 * Cronograma completo de un proyecto
 */
export interface Cronograma {
  id: number;
  proyectoId: number;
  nombre: string;
  descripcion?: string;
  tareas: TareaCronograma[];
  dependencias: DependenciaCronograma[];
  fechaBase?: string; // Fecha de linea base
  activo: boolean;
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
  responsableId?: number;
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
  responsableId?: number | null;
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
