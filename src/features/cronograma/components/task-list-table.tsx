'use client';

/**
 * TaskListTable Component
 *
 * Componente personalizado para la lista de tareas del Gantt
 * Muestra tareas agrupadas por fase con columnas:
 * Código, Nombre, Duración, Fecha Inicio, Fecha Fin, Estado
 */

import { useMemo, useState } from 'react';
import { Task } from 'gantt-task-react';
import { Pencil, Trash2, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FASES_CRONOGRAMA, ESTADOS_TAREA_CRONOGRAMA, type FaseCronograma, type TareaEstadoCronograma, type AsignadoA } from '../types';

interface TaskListTableProps {
  /** Lista de tareas */
  tasks: Task[];
  /** Altura de cada fila */
  rowHeight: number;
  /** Ancho de la columna */
  rowWidth: string;
  /** Idioma */
  locale: string;
  /** Callback cuando se hace click en una tarea */
  onExpanderClick: (task: Task) => void;
  /** Callback para editar tarea */
  onEditTask?: (task: Task) => void;
  /** Callback para eliminar tarea */
  onDeleteTask?: (task: Task) => void;
  /** Si el usuario puede gestionar (editar/eliminar) */
  canManage?: boolean;
  /** Si el usuario puede editar el estado (incluso con cronograma aprobado) */
  canEditEstado?: boolean;
  /** Callback para actualizar estado de tarea */
  onUpdateEstado?: (tareaId: string, estado: TareaEstadoCronograma) => Promise<void>;
}

/**
 * Calcula la duración en días entre dos fechas
 */
function calcularDuracion(inicio: Date, fin: Date): number {
  const dias = differenceInDays(fin, inicio) + 1; // +1 para incluir ambos días
  return dias > 0 ? dias : 1;
}

/**
 * Obtiene el color de la fase
 */
function getFaseColor(fase: string | undefined): string {
  const faseInfo = FASES_CRONOGRAMA.find(f => f.value === fase);
  return faseInfo?.color || '#6b7280';
}

/**
 * Obtiene el label de la fase
 */
function getFaseLabel(fase: string | undefined): string {
  if (!fase) return 'Sin fase';
  const faseInfo = FASES_CRONOGRAMA.find(f => f.value === fase);
  return faseInfo?.label || fase;
}

/**
 * Obtiene el estado basado en el progreso
 */
function getEstadoFromProgreso(progreso: number): { label: TareaEstadoCronograma; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  if (progreso === 100) {
    return { label: 'Completado', variant: 'default' };
  } else if (progreso > 0) {
    return { label: 'En progreso', variant: 'secondary' };
  }
  return { label: 'Por hacer', variant: 'outline' };
}

// Extended task type with fase, parent, estado, and asignadoA
interface TaskWithFase extends Task {
  fase?: FaseCronograma;
  padre?: string;
  codigo?: string;
  estado?: TareaEstadoCronograma;
  asignadoA?: AsignadoA;
}

/**
 * Nodo del árbol de tareas para representar jerarquía
 */
interface TaskTreeNode {
  task: TaskWithFase;
  children: TaskTreeNode[];
  level: number;
}

/**
 * Construye una estructura de árbol a partir de tareas planas
 */
function buildTaskTree(tasks: TaskWithFase[]): TaskTreeNode[] {
  const taskMap = new Map<string, TaskTreeNode>();
  const rootNodes: TaskTreeNode[] = [];

  // Crear nodos para todas las tareas
  tasks.forEach(task => {
    taskMap.set(task.id, { task, children: [], level: 0 });
  });

  // Construir relaciones padre-hijo
  tasks.forEach(task => {
    const node = taskMap.get(task.id)!;
    if (task.padre && taskMap.has(task.padre)) {
      const parentNode = taskMap.get(task.padre)!;
      node.level = parentNode.level + 1;
      parentNode.children.push(node);
    } else {
      rootNodes.push(node);
    }
  });

  return rootNodes;
}

/**
 * Aplana el árbol de tareas en orden DFS (depth-first)
 * para mostrar hijos inmediatamente después de sus padres
 */
function flattenTree(nodes: TaskTreeNode[]): { task: TaskWithFase; level: number }[] {
  const result: { task: TaskWithFase; level: number }[] = [];

  function traverse(node: TaskTreeNode) {
    result.push({ task: node.task, level: node.level });
    node.children.forEach(traverse);
  }

  nodes.forEach(traverse);
  return result;
}

/**
 * Verifica si una tarea tiene hijos
 */
function hasChildren(taskId: string, tasks: TaskWithFase[]): boolean {
  return tasks.some(t => t.padre === taskId);
}

/**
 * Tabla personalizada de tareas para el Gantt
 * Muestra tareas agrupadas por fase con información detallada
 */
export function TaskListTable({
  tasks,
  rowHeight,
  rowWidth,
  locale,
  onExpanderClick,
  onEditTask,
  onDeleteTask,
  canManage = false,
  canEditEstado = false,
  onUpdateEstado,
}: TaskListTableProps) {
  // Estado para fases colapsadas
  const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(new Set());
  // Estado para tracking de actualización de estado
  const [updatingEstadoId, setUpdatingEstadoId] = useState<string | null>(null);

  // Handler para cambiar estado
  const handleEstadoChange = async (tareaId: string, newEstado: TareaEstadoCronograma) => {
    if (!onUpdateEstado) return;
    setUpdatingEstadoId(tareaId);
    try {
      await onUpdateEstado(tareaId, newEstado);
    } finally {
      setUpdatingEstadoId(null);
    }
  };

  // Agrupar tareas por fase con jerarquía padre-hijo
  const tasksByPhase = useMemo(() => {
    const grouped: Record<string, { task: TaskWithFase; level: number }[]> = {
      'Sin fase': [],
    };

    // Inicializar todas las fases
    FASES_CRONOGRAMA.forEach(fase => {
      grouped[fase.value] = [];
    });

    // Primero agrupar tareas planas por fase
    const flatGrouped: Record<string, TaskWithFase[]> = {};
    FASES_CRONOGRAMA.forEach(fase => {
      flatGrouped[fase.value] = [];
    });
    flatGrouped['Sin fase'] = [];

    tasks.forEach(task => {
      const taskWithFase = task as TaskWithFase;
      const fase = taskWithFase.fase || 'Sin fase';
      if (!flatGrouped[fase]) {
        flatGrouped[fase] = [];
      }
      flatGrouped[fase].push(taskWithFase);
    });

    // Para cada fase, construir árbol jerárquico y aplanar
    Object.keys(flatGrouped).forEach(fase => {
      const faseTasks = flatGrouped[fase];
      if (faseTasks.length > 0) {
        // Construir árbol y aplanar manteniendo el orden jerárquico
        const tree = buildTaskTree(faseTasks);
        grouped[fase] = flattenTree(tree);
      }
    });

    return grouped;
  }, [tasks]);

  // Orden de fases (filtrar solo las que tienen tareas)
  const orderedPhases = useMemo(() => {
    const order = FASES_CRONOGRAMA.map(f => f.value);
    return [...order, 'Sin fase'].filter(fase =>
      tasksByPhase[fase] && tasksByPhase[fase].length > 0
    );
  }, [tasksByPhase]);

  // Lista plana de todas las tareas para verificar hijos
  const allTasks = useMemo(() => tasks as TaskWithFase[], [tasks]);

  const togglePhase = (fase: string) => {
    setCollapsedPhases(prev => {
      const next = new Set(prev);
      if (next.has(fase)) {
        next.delete(fase);
      } else {
        next.add(fase);
      }
      return next;
    });
  };

  return (
    <div className="task-list-table" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {orderedPhases.map(fase => {
        const faseTasks = tasksByPhase[fase] || [];
        const isCollapsed = collapsedPhases.has(fase);
        const faseColor = getFaseColor(fase === 'Sin fase' ? undefined : fase);
        const faseLabel = getFaseLabel(fase === 'Sin fase' ? undefined : fase);

        return (
          <div key={fase}>
            {/* Cabecera de fase */}
            <div
              className="flex items-center px-3 py-2 bg-slate-100 border-b border-gray-200 cursor-pointer hover:bg-slate-200 transition-colors"
              onClick={() => togglePhase(fase)}
              style={{ minHeight: rowHeight }}
            >
              <div className="flex items-center gap-2 flex-1">
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: faseColor }}
                />
                <span className="font-semibold text-sm text-gray-700">
                  {faseLabel}
                </span>
                <Badge variant="secondary" className="ml-2 text-xs">
                  {faseTasks.length} {faseTasks.length === 1 ? 'tarea' : 'tareas'}
                </Badge>
              </div>
            </div>

            {/* Tareas de la fase con jerarquía */}
            {!isCollapsed && faseTasks.map(({ task, level }) => {
              const isProject = task.type === 'project';
              const isMilestone = task.type === 'milestone';
              const duracion = calcularDuracion(task.start, task.end);
              // Usar estado real del backend si está disponible, sino calcular del progreso
              const estadoReal = task.estado || getEstadoFromProgreso(task.progress).label;
              const estadoDisplay = getEstadoFromProgreso(task.progress); // Para el variant del badge
              const isChild = level > 0;
              const hasChildTasks = hasChildren(task.id, allTasks);

              return (
                <div
                  key={task.id}
                  className={`task-list-row flex items-center border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    isProject ? 'bg-slate-50 font-semibold' : ''
                  } ${isChild ? 'bg-blue-50/30' : ''}`}
                  style={{ height: rowHeight }}
                >
                  {/* Código con indentación jerárquica */}
                  <div
                    className="px-3 text-xs font-mono text-gray-500 flex items-center"
                    style={{ width: '70px', minWidth: '70px' }}
                  >
                    {/* Indentación visual para tareas hijas */}
                    {level > 0 && (
                      <span
                        className="inline-block border-l-2 border-b-2 border-gray-300 rounded-bl"
                        style={{
                          width: `${level * 8}px`,
                          height: '12px',
                          marginRight: '4px',
                        }}
                      />
                    )}
                    {task.codigo || '-'}
                  </div>

                  {/* Nombre de la tarea con indicadores */}
                  <div
                    className="task-list-cell flex-1 px-2 truncate cursor-pointer flex items-center gap-1"
                    style={{
                      minWidth: '120px',
                      paddingLeft: level > 0 ? `${8 + level * 12}px` : undefined,
                    }}
                    onClick={() => onExpanderClick(task)}
                    title={task.name}
                  >
                    {/* Indicador de tarea padre (tiene hijos) */}
                    {hasChildTasks && (
                      <span className="text-gray-400 text-xs mr-1">▼</span>
                    )}
                    {/* Indicador de tarea hija */}
                    {isChild && !hasChildTasks && (
                      <span className="text-gray-400 text-xs mr-1">└</span>
                    )}
                    <span className={`text-sm ${isProject ? 'text-slate-700 font-medium' : isChild ? 'text-gray-600' : 'text-gray-700'}`}>
                      {isMilestone && '◆ '}
                      {task.name}
                    </span>
                  </div>

                  {/* Duración */}
                  <div
                    className="px-2 text-xs text-center text-gray-600"
                    style={{ width: '60px', minWidth: '60px' }}
                  >
                    {duracion} {duracion === 1 ? 'día' : 'días'}
                  </div>

                  {/* Fecha Inicio */}
                  <div
                    className="px-2 text-xs text-gray-600"
                    style={{ width: '80px', minWidth: '80px' }}
                  >
                    {format(task.start, 'dd/MM/yy', { locale: es })}
                  </div>

                  {/* Fecha Fin */}
                  <div
                    className="px-2 text-xs text-gray-600"
                    style={{ width: '80px', minWidth: '80px' }}
                  >
                    {format(task.end, 'dd/MM/yy', { locale: es })}
                  </div>

                  {/* Asignado A */}
                  <div
                    className="px-2 text-xs text-gray-600 truncate"
                    style={{ width: '100px', minWidth: '100px' }}
                    title={task.asignadoA || 'Sin asignar'}
                  >
                    {task.asignadoA || (
                      <span className="text-gray-400">Sin asignar</span>
                    )}
                  </div>

                  {/* Estado */}
                  <div
                    className="px-2"
                    style={{ width: '110px', minWidth: '110px' }}
                  >
                    {canEditEstado && onUpdateEstado ? (
                      <div className="relative">
                        {updatingEstadoId === task.id ? (
                          <div className="flex items-center justify-center h-7">
                            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                          </div>
                        ) : (
                          <Select
                            value={estadoReal}
                            onValueChange={(value) => handleEstadoChange(task.id, value as TareaEstadoCronograma)}
                          >
                            <SelectTrigger className="h-7 text-xs w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ESTADOS_TAREA_CRONOGRAMA.map((e) => (
                                <SelectItem key={e.value} value={e.value} className="text-xs">
                                  {e.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ) : (
                      <Badge variant={estadoDisplay.variant} className="text-xs">
                        {estadoReal}
                      </Badge>
                    )}
                  </div>

                  {/* Botones de acción */}
                  {canManage && (
                    <div
                      className="task-list-actions flex items-center gap-1 px-2"
                      style={{ width: '70px', minWidth: '70px' }}
                    >
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-500 hover:text-[#004272] hover:bg-[#004272]/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTask?.(task);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>Editar tarea</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-500 hover:text-red-600 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTask?.(task);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>Eliminar tarea</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Si no hay tareas */}
      {tasks.length === 0 && (
        <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
          No hay tareas en el cronograma
        </div>
      )}
    </div>
  );
}

/**
 * Header de la tabla de tareas
 */
interface TaskListHeaderProps {
  /** Altura del header */
  headerHeight: number;
  /** Ancho de la columna */
  rowWidth: string;
  /** Si el usuario puede gestionar */
  canManage?: boolean;
}

export function TaskListHeader({
  headerHeight,
  rowWidth,
  canManage = false,
}: TaskListHeaderProps) {
  return (
    <div
      className="task-list-header flex items-center bg-slate-50 border-b border-gray-200"
      style={{ height: headerHeight }}
    >
      <div
        className="px-3 font-medium text-xs text-gray-700"
        style={{ width: '70px', minWidth: '70px' }}
      >
        Código
      </div>
      <div
        className="px-2 font-medium text-xs text-gray-700 flex-1"
        style={{ minWidth: '120px' }}
      >
        Nombre
      </div>
      <div
        className="px-2 font-medium text-xs text-gray-700 text-center"
        style={{ width: '60px', minWidth: '60px' }}
      >
        Duración
      </div>
      <div
        className="px-2 font-medium text-xs text-gray-700"
        style={{ width: '80px', minWidth: '80px' }}
      >
        Inicio
      </div>
      <div
        className="px-2 font-medium text-xs text-gray-700"
        style={{ width: '80px', minWidth: '80px' }}
      >
        Fin
      </div>
      <div
        className="px-2 font-medium text-xs text-gray-700"
        style={{ width: '100px', minWidth: '100px' }}
      >
        Asignado
      </div>
      <div
        className="px-2 font-medium text-xs text-gray-700"
        style={{ width: '110px', minWidth: '110px' }}
      >
        Estado
      </div>
      {canManage && (
        <div
          className="px-2 font-medium text-xs text-gray-700 text-center"
          style={{ width: '70px', minWidth: '70px' }}
        >
          Acciones
        </div>
      )}
    </div>
  );
}
