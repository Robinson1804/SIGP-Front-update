'use client';

/**
 * GanttChart Component
 *
 * Componente principal del diagrama de Gantt usando gantt-task-react
 * Estilos personalizados para INEI (azul #004272)
 */

import { useMemo, useCallback } from 'react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { cn } from '@/lib/utils';
import type { TareaCronograma, GanttConfig, ViewMode as AppViewMode, FaseCronograma } from '../types';
import { COLORES_POR_TIPO, FASES_CRONOGRAMA } from '../types';
import { TaskListTable, TaskListHeader } from './task-list-table';
import type { TareaEstadoCronograma } from '../types';

// Colores institucionales INEI
const INEI_BLUE = '#004272';
const INEI_BLUE_LIGHT = '#0066a4';
const INEI_BLUE_DARK = '#003156';

// Colores para estados especiales
const RUTA_CRITICA_COLOR = '#dc2626'; // Red-600
const RUTA_CRITICA_SELECTED = '#ef4444'; // Red-500
const CONFLICTO_COLOR = '#f59e0b'; // Amber-500
const CONFLICTO_SELECTED = '#fbbf24'; // Amber-400

/**
 * Helper para parsear fecha YYYY-MM-DD sin problemas de timezone
 * Crea la fecha en hora local al mediodía para evitar desfases
 */
function parseDateString(dateStr: string | Date): Date {
  if (dateStr instanceof Date) return dateStr;
  // Parsear componentes directamente para evitar interpretación UTC
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Meses van de 0-11
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day, 12, 0, 0); // Mediodía local
  }
  // Fallback
  return new Date(dateStr);
}

interface GanttChartProps {
  /** Tareas del cronograma */
  tareas: TareaCronograma[];
  /** Modo de vista actual */
  viewMode?: AppViewMode;
  /** Mostrar lista de tareas */
  showTaskList?: boolean;
  /** Mostrar lineas de dependencia */
  showDependencies?: boolean;
  /** Resaltar tareas en ruta crítica */
  mostrarRutaCritica?: boolean;
  /** IDs de tareas en ruta crítica */
  tareasCriticas?: number[];
  /** Callback cuando cambian las fechas de una tarea */
  onDateChange?: (task: Task, start: Date, end: Date) => void;
  /** Callback cuando cambia el progreso de una tarea */
  onProgressChange?: (task: Task, progress: number) => void;
  /** Callback cuando se hace click en una tarea */
  onTaskClick?: (task: Task) => void;
  /** Callback cuando se hace doble click en una tarea */
  onTaskDoubleClick?: (task: Task) => void;
  /** Callback cuando se elimina una tarea */
  onTaskDelete?: (task: Task) => void;
  /** Callback para editar tarea desde la tabla */
  onEditTask?: (task: Task) => void;
  /** Si el usuario puede gestionar (editar/eliminar) */
  canManage?: boolean;
  /** Si el usuario puede editar el estado (incluso con cronograma aprobado) */
  canEditEstado?: boolean;
  /** Callback para actualizar estado de tarea */
  onUpdateEstado?: (tareaId: string, estado: TareaEstadoCronograma) => Promise<void>;
  /** Ancho de la columna de lista */
  listCellWidth?: string;
  /** Ancho de columnas del grafico */
  columnWidth?: number;
  /** Altura de las filas */
  rowHeight?: number;
  /** Altura del header */
  headerHeight?: number;
  /** Clase CSS adicional */
  className?: string;
  /** Configuracion adicional */
  config?: Partial<GanttConfig>;
}

/**
 * Obtiene el color basado en la fase de la tarea
 */
function getColorPorFase(fase?: FaseCronograma): string {
  if (!fase) return INEI_BLUE;
  const faseConfig = FASES_CRONOGRAMA.find((f) => f.value === fase);
  return faseConfig?.color || INEI_BLUE;
}

/**
 * Convierte tareas del cronograma al formato de gantt-task-react
 */
function convertirTareasParaGantt(
  tareas: TareaCronograma[],
  mostrarRutaCritica: boolean = false,
  tareasCriticas: number[] = []
): Task[] {
  return tareas.map((tarea) => {
    // Determinar tipo para la libreria
    let type: 'task' | 'milestone' | 'project' = 'task';
    if (tarea.tipo === 'hito' || tarea.esHito) {
      type = 'milestone';
    } else if (tarea.tipo === 'proyecto') {
      type = 'project';
    }

    // Verificar si está en ruta crítica
    const tareaId = typeof tarea.id === 'string' ? parseInt(tarea.id, 10) : tarea.id;
    const enRutaCritica = mostrarRutaCritica && (
      tarea.enRutaCritica || tareasCriticas.includes(tareaId)
    );
    const tieneConflicto = tarea.tieneConflicto;

    // Determinar color basado en estado especial, fase o default
    let backgroundColor: string;
    let selectedColor: string;
    let progressColor: string;

    if (tieneConflicto) {
      backgroundColor = CONFLICTO_COLOR;
      selectedColor = CONFLICTO_SELECTED;
      progressColor = '#d97706'; // Amber-600
    } else if (enRutaCritica) {
      backgroundColor = RUTA_CRITICA_COLOR;
      selectedColor = RUTA_CRITICA_SELECTED;
      progressColor = '#b91c1c'; // Red-700
    } else if (tarea.color) {
      backgroundColor = tarea.color;
      selectedColor = tarea.color;
      progressColor = INEI_BLUE_DARK;
    } else if (tarea.fase) {
      backgroundColor = getColorPorFase(tarea.fase);
      selectedColor = backgroundColor;
      progressColor = INEI_BLUE_DARK;
    } else {
      backgroundColor = COLORES_POR_TIPO[tarea.tipo] || INEI_BLUE;
      selectedColor = INEI_BLUE_LIGHT;
      progressColor = INEI_BLUE_DARK;
    }

    // Obtener dependencias en formato de la libreria
    const dependencies = tarea.dependencias?.map((d) => d.tareaOrigenId) || [];

    return {
      id: tarea.id,
      name: tarea.nombre,
      start: parseDateString(tarea.inicio),
      end: parseDateString(tarea.fin),
      progress: tarea.progreso || 0,
      type,
      project: tarea.padre,
      dependencies,
      styles: {
        backgroundColor,
        backgroundSelectedColor: selectedColor,
        progressColor,
        progressSelectedColor: progressColor,
      },
      isDisabled: false,
      displayOrder: tarea.orden,
      // Propiedades adicionales para la tabla
      codigo: tarea.codigo,
      fase: tarea.fase,
      estado: tarea.estado,
      asignadoA: tarea.asignadoA,
    } as Task & { codigo: string; fase?: FaseCronograma; estado?: TareaEstadoCronograma; asignadoA?: string };
  });
}

/**
 * Configuracion de estilos por defecto para INEI
 */
const defaultStyles = {
  barCornerRadius: 3,
  handleWidth: 8,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: '12px',
  barProgressColor: INEI_BLUE_DARK,
  barProgressSelectedColor: INEI_BLUE,
  barBackgroundColor: INEI_BLUE,
  barBackgroundSelectedColor: INEI_BLUE_LIGHT,
  projectProgressColor: '#6366f1',
  projectProgressSelectedColor: '#818cf8',
  projectBackgroundColor: '#6366f1',
  projectBackgroundSelectedColor: '#818cf8',
  milestoneBackgroundColor: '#10b981',
  milestoneBackgroundSelectedColor: '#34d399',
  arrowColor: '#94a3b8',
  arrowIndent: 20,
  todayColor: 'rgba(0, 66, 114, 0.1)',
};

/**
 * Componente de visualizacion Gantt
 *
 * @example
 * <GanttChart
 *   tareas={tareas}
 *   viewMode="Week"
 *   onDateChange={handleDateChange}
 *   onProgressChange={handleProgressChange}
 * />
 */
export function GanttChart({
  tareas,
  viewMode = 'Week',
  showTaskList = true,
  showDependencies = true,
  mostrarRutaCritica = false,
  tareasCriticas = [],
  onDateChange,
  onProgressChange,
  onTaskClick,
  onTaskDoubleClick,
  onTaskDelete,
  onEditTask,
  canManage = false,
  canEditEstado = false,
  onUpdateEstado,
  listCellWidth = '200px',
  columnWidth,
  rowHeight = 50,
  headerHeight = 50,
  className,
  config,
}: GanttChartProps) {
  // Convertir tareas al formato de la libreria
  const tasks = useMemo(() => {
    if (!tareas || tareas.length === 0) {
      return [];
    }
    return convertirTareasParaGantt(tareas, mostrarRutaCritica, tareasCriticas);
  }, [tareas, mostrarRutaCritica, tareasCriticas]);

  // Calcular ancho de columna basado en el modo de vista
  const calculatedColumnWidth = useMemo(() => {
    if (columnWidth) return columnWidth;

    switch (viewMode) {
      case 'Hour':
        return 30;
      case 'QuarterDay':
        return 50;
      case 'HalfDay':
        return 60;
      case 'Day':
        return 65;
      case 'Week':
        return 250;
      case 'Month':
        return 300;
      case 'Year':
        return 350;
      default:
        return 250;
    }
  }, [viewMode, columnWidth]);

  // Convertir modo de vista
  const ganttViewMode: ViewMode = useMemo(() => {
    const modeMap: Record<AppViewMode, ViewMode> = {
      Hour: ViewMode.Hour,
      QuarterDay: ViewMode.QuarterDay,
      HalfDay: ViewMode.HalfDay,
      Day: ViewMode.Day,
      Week: ViewMode.Week,
      Month: ViewMode.Month,
      Year: ViewMode.Year,
    };
    return modeMap[viewMode] || ViewMode.Week;
  }, [viewMode]);

  // Handlers
  const handleDateChange = useCallback(
    (task: Task, children: Task[]) => {
      if (onDateChange) {
        onDateChange(task, task.start, task.end);
      }
    },
    [onDateChange]
  );

  const handleProgressChange = useCallback(
    (task: Task, children: Task[]) => {
      if (onProgressChange) {
        onProgressChange(task, task.progress);
      }
    },
    [onProgressChange]
  );

  const handleTaskClick = useCallback(
    (task: Task) => {
      if (onTaskClick) {
        onTaskClick(task);
      }
    },
    [onTaskClick]
  );

  const handleDoubleClick = useCallback(
    (task: Task) => {
      if (onTaskDoubleClick) {
        onTaskDoubleClick(task);
      }
    },
    [onTaskDoubleClick]
  );

  const handleDelete = useCallback(
    (task: Task) => {
      if (onTaskDelete) {
        onTaskDelete(task);
        return true;
      }
      return false;
    },
    [onTaskDelete]
  );

  // Handler para editar desde la tabla
  const handleEditFromTable = useCallback(
    (task: Task) => {
      if (onEditTask) {
        onEditTask(task);
      } else if (onTaskDoubleClick) {
        // Fallback a doble click si no hay handler específico
        onTaskDoubleClick(task);
      }
    },
    [onEditTask, onTaskDoubleClick]
  );

  // Handler para eliminar desde la tabla
  const handleDeleteFromTable = useCallback(
    (task: Task) => {
      if (onTaskDelete) {
        onTaskDelete(task);
      }
    },
    [onTaskDelete]
  );

  // Componente de tabla personalizado con acciones
  const CustomTaskListTable = useCallback(
    (props: { tasks: Task[]; rowHeight: number; rowWidth: string; locale: string; onExpanderClick: (task: Task) => void }) => (
      <TaskListTable
        {...props}
        onEditTask={handleEditFromTable}
        onDeleteTask={handleDeleteFromTable}
        canManage={canManage}
        canEditEstado={canEditEstado}
        onUpdateEstado={onUpdateEstado}
      />
    ),
    [handleEditFromTable, handleDeleteFromTable, canManage, canEditEstado, onUpdateEstado]
  );

  // Componente de header personalizado
  const CustomTaskListHeader = useCallback(
    (props: { headerHeight: number; rowWidth: string }) => (
      <TaskListHeader {...props} canManage={canManage} />
    ),
    [canManage]
  );

  // Si no hay tareas, mostrar estado vacio
  if (tasks.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center h-64 bg-gray-50 border rounded-lg',
          className
        )}
      >
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">No hay tareas en el cronograma</p>
          <p className="text-sm mt-1">
            Agregue tareas para visualizar el diagrama de Gantt
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('gantt-container w-full overflow-x-auto', className)}>
      <style jsx global>{`
        .gantt-container .gantt-horizontal-scroller {
          overflow-x: auto;
        }
        .gantt-container .calendar-header {
          background-color: #f8fafc;
        }
        .gantt-container .task-list-header {
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .gantt-container .task-list-cell {
          border-right: 1px solid #e2e8f0;
        }
        .gantt-container .task-list-row {
          border-bottom: 1px solid #f1f5f9;
        }
        .gantt-container .task-list-row:hover {
          background-color: #f8fafc;
        }
        .gantt-container .bar-wrapper:hover .bar {
          filter: brightness(1.1);
        }
        .gantt-container .today-line {
          stroke: ${INEI_BLUE};
          stroke-width: 2;
          stroke-dasharray: 5, 5;
        }
        /* Estilos especiales para fases/proyectos - texto en negrita */
        .gantt-container [data-task-type="project"] {
          font-weight: 700 !important;
        }
        .gantt-container .project-row {
          background-color: #f1f5f9 !important;
          font-weight: 700;
        }
        .gantt-container .project-row .task-list-cell {
          font-weight: 700;
          color: #1e293b;
        }
      `}</style>
      <Gantt
        tasks={tasks}
        viewMode={ganttViewMode}
        onDateChange={handleDateChange}
        onProgressChange={handleProgressChange}
        onClick={handleTaskClick}
        onDoubleClick={handleDoubleClick}
        onDelete={handleDelete}
        TaskListTable={showTaskList ? CustomTaskListTable : undefined}
        TaskListHeader={showTaskList ? CustomTaskListHeader : undefined}
        listCellWidth={showTaskList ? (canManage ? '550px' : '480px') : ''}
        columnWidth={calculatedColumnWidth}
        rowHeight={rowHeight}
        headerHeight={headerHeight}
        barCornerRadius={config?.barCornerRadius ?? defaultStyles.barCornerRadius}
        handleWidth={config?.handleWidth ?? defaultStyles.handleWidth}
        fontFamily={config?.fontFamily ?? defaultStyles.fontFamily}
        fontSize={config?.fontSize ?? defaultStyles.fontSize}
        barProgressColor={config?.barProgressColor ?? defaultStyles.barProgressColor}
        barProgressSelectedColor={
          config?.barProgressSelectedColor ?? defaultStyles.barProgressSelectedColor
        }
        barBackgroundColor={
          config?.barBackgroundColor ?? defaultStyles.barBackgroundColor
        }
        barBackgroundSelectedColor={
          config?.barBackgroundSelectedColor ?? defaultStyles.barBackgroundSelectedColor
        }
        projectProgressColor={
          config?.projectProgressColor ?? defaultStyles.projectProgressColor
        }
        projectProgressSelectedColor={
          config?.projectProgressSelectedColor ?? defaultStyles.projectProgressSelectedColor
        }
        projectBackgroundColor={
          config?.projectBackgroundColor ?? defaultStyles.projectBackgroundColor
        }
        projectBackgroundSelectedColor={
          config?.projectBackgroundSelectedColor ?? defaultStyles.projectBackgroundSelectedColor
        }
        milestoneBackgroundColor={
          config?.milestoneBackgroundColor ?? defaultStyles.milestoneBackgroundColor
        }
        milestoneBackgroundSelectedColor={
          config?.milestoneBackgroundSelectedColor ??
          defaultStyles.milestoneBackgroundSelectedColor
        }
        arrowColor={defaultStyles.arrowColor}
        arrowIndent={defaultStyles.arrowIndent}
        todayColor={defaultStyles.todayColor}
        locale="es"
      />
    </div>
  );
}
