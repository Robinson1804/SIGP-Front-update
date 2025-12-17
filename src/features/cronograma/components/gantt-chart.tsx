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
import type { TareaCronograma, GanttConfig, ViewMode as AppViewMode } from '../types';
import { COLORES_POR_TIPO } from '../types';

// Colores institucionales INEI
const INEI_BLUE = '#004272';
const INEI_BLUE_LIGHT = '#0066a4';
const INEI_BLUE_DARK = '#003156';

interface GanttChartProps {
  /** Tareas del cronograma */
  tareas: TareaCronograma[];
  /** Modo de vista actual */
  viewMode?: AppViewMode;
  /** Mostrar lista de tareas */
  showTaskList?: boolean;
  /** Mostrar lineas de dependencia */
  showDependencies?: boolean;
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
 * Convierte tareas del cronograma al formato de gantt-task-react
 */
function convertirTareasParaGantt(tareas: TareaCronograma[]): Task[] {
  return tareas.map((tarea) => {
    // Determinar tipo para la libreria
    let type: 'task' | 'milestone' | 'project' = 'task';
    if (tarea.tipo === 'hito' || tarea.esHito) {
      type = 'milestone';
    } else if (tarea.tipo === 'proyecto') {
      type = 'project';
    }

    // Determinar color
    const color = tarea.color || COLORES_POR_TIPO[tarea.tipo] || INEI_BLUE;

    // Obtener dependencias en formato de la libreria
    const dependencies = tarea.dependencias?.map((d) => d.tareaOrigenId) || [];

    return {
      id: tarea.id,
      name: tarea.nombre,
      start: new Date(tarea.inicio),
      end: new Date(tarea.fin),
      progress: tarea.progreso || 0,
      type,
      project: tarea.padre,
      dependencies,
      styles: {
        backgroundColor: color,
        backgroundSelectedColor: INEI_BLUE_LIGHT,
        progressColor: INEI_BLUE_DARK,
        progressSelectedColor: INEI_BLUE,
      },
      isDisabled: false,
      displayOrder: tarea.orden,
    };
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
  onDateChange,
  onProgressChange,
  onTaskClick,
  onTaskDoubleClick,
  onTaskDelete,
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
    return convertirTareasParaGantt(tareas);
  }, [tareas]);

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
      `}</style>
      <Gantt
        tasks={tasks}
        viewMode={ganttViewMode}
        onDateChange={handleDateChange}
        onProgressChange={handleProgressChange}
        onClick={handleTaskClick}
        onDoubleClick={handleDoubleClick}
        onDelete={handleDelete}
        listCellWidth={showTaskList ? listCellWidth : ''}
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
