'use client';

import { useState, useEffect, Fragment } from 'react';
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ListTodo,
  Plus,
  ChevronRight,
  ChevronDown,
  Loader2,
  FileText,
  ClipboardCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type HistoriaUsuario } from '@/features/proyectos/services/historias.service';
import { type Tarea, getTareasByHistoria } from '@/features/proyectos/services/tareas.service';
import { cn, formatDate } from '@/lib/utils';

interface MiembroEquipo {
  id: number;
  nombre: string;
}

interface HistoriaTableProps {
  historias: HistoriaUsuario[];
  equipo?: MiembroEquipo[];
  showCheckbox?: boolean;
  selectedIds?: number[];
  onSelectionChange?: (ids: number[]) => void;
  onView?: (historia: HistoriaUsuario) => void;
  onEdit?: (historia: HistoriaUsuario) => void;
  onDelete?: (historia: HistoriaUsuario) => void;
  onAssignToSprint?: (historia: HistoriaUsuario) => void;
  onCreateTarea?: (historiaId: number) => void;
  onEditTarea?: (tarea: Tarea) => void;
  onDeleteTarea?: (tarea: Tarea) => void;
  showSprintAction?: boolean;
  tareasRefreshKey?: number;  // Para refrescar tareas cuando se crea una nueva
  // Acciones de validacion (solo para SCRUM_MASTER)
  onVerDocumento?: (historia: HistoriaUsuario) => void;
  onValidarHu?: (historia: HistoriaUsuario) => void;
}

// Colores para estados de tareas
const tareaEstadoColors: Record<string, string> = {
  'Por hacer': 'bg-gray-100 text-gray-700',
  'En progreso': 'bg-yellow-100 text-yellow-700',
  'Finalizado': 'bg-green-100 text-green-700',
};

const estadoColors: Record<string, string> = {
  'Por hacer': 'bg-gray-100 text-gray-700',
  'En progreso': 'bg-yellow-100 text-yellow-700',
  'En revision': 'bg-purple-100 text-purple-700',
  'Finalizado': 'bg-green-100 text-green-700',
};

const prioridadColors: Record<string, string> = {
  'Alta': 'bg-red-100 text-red-700',
  'Media': 'bg-orange-100 text-orange-700',
  'Baja': 'bg-blue-100 text-blue-700',
};

export function HistoriaTable({
  historias,
  equipo = [],
  showCheckbox = false,
  selectedIds = [],
  onSelectionChange,
  onView,
  onEdit,
  onDelete,
  onAssignToSprint,
  onCreateTarea,
  onEditTarea,
  onDeleteTarea,
  showSprintAction = false,
  tareasRefreshKey,
  onVerDocumento,
  onValidarHu,
}: HistoriaTableProps) {
  // Estado para filas expandidas
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  // Estado para tareas cargadas por historia
  const [tareasMap, setTareasMap] = useState<Map<number, Tarea[]>>(new Map());
  // Estado para tareas en proceso de carga
  const [loadingTareas, setLoadingTareas] = useState<Set<number>>(new Set());
  // Estado para saber qué historias tienen tareas (para mostrar/ocultar el chevron)
  const [historiasConTareas, setHistoriasConTareas] = useState<Set<number>>(new Set());
  // Estado para indicar si estamos cargando los conteos iniciales
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);

  // Crear mapa de equipo para buscar nombres rápidamente
  const equipoMap = new Map(equipo.map(m => [m.id, m.nombre]));

  // Cargar conteo de tareas para todas las historias al montar
  useEffect(() => {
    const loadTareasCounts = async () => {
      setIsLoadingCounts(true);
      const conTareas = new Set<number>();

      // Cargar tareas para cada historia en paralelo
      const promises = historias.map(async (historia) => {
        try {
          const tareas = await getTareasByHistoria(historia.id);
          if (tareas.length > 0) {
            conTareas.add(historia.id);
            // También guardamos las tareas en el mapa para no tener que cargarlas de nuevo
            setTareasMap(prev => new Map(prev).set(historia.id, tareas));
          }
        } catch (error) {
          console.error(`Error cargando tareas para historia ${historia.id}:`, error);
        }
      });

      await Promise.all(promises);
      setHistoriasConTareas(conTareas);
      setIsLoadingCounts(false);
    };

    if (historias.length > 0) {
      loadTareasCounts();
    } else {
      setIsLoadingCounts(false);
    }
  }, [historias.map(h => h.id).join(',')]); // Re-cargar cuando cambian las historias

  // Función para toggle expandir/colapsar una fila
  const toggleExpand = async (historiaId: number) => {
    const newExpanded = new Set(expandedRows);

    if (newExpanded.has(historiaId)) {
      // Colapsar
      newExpanded.delete(historiaId);
    } else {
      // Expandir y cargar tareas si no están cargadas
      newExpanded.add(historiaId);

      if (!tareasMap.has(historiaId)) {
        setLoadingTareas(prev => new Set(prev).add(historiaId));
        try {
          const tareas = await getTareasByHistoria(historiaId);
          setTareasMap(prev => new Map(prev).set(historiaId, tareas));
        } catch (error) {
          console.error('Error cargando tareas:', error);
          setTareasMap(prev => new Map(prev).set(historiaId, []));
        } finally {
          setLoadingTareas(prev => {
            const newSet = new Set(prev);
            newSet.delete(historiaId);
            return newSet;
          });
        }
      }
    }

    setExpandedRows(newExpanded);
  };

  // Refrescar tareas cuando cambia tareasRefreshKey
  useEffect(() => {
    if (tareasRefreshKey) {
      // Refrescar conteos de tareas
      const refreshCounts = async () => {
        const conTareas = new Set<number>();

        const promises = historias.map(async (historia) => {
          try {
            const tareas = await getTareasByHistoria(historia.id);
            setTareasMap(prev => new Map(prev).set(historia.id, tareas));
            if (tareas.length > 0) {
              conTareas.add(historia.id);
            }
          } catch (error) {
            console.error('Error refrescando tareas:', error);
          }
        });

        await Promise.all(promises);
        setHistoriasConTareas(conTareas);
      };

      refreshCounts();
    }
  }, [tareasRefreshKey]);

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange(historias.map((h) => h.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (historiaId: number, checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange([...selectedIds, historiaId]);
    } else {
      onSelectionChange(selectedIds.filter((id) => id !== historiaId));
    }
  };

  const allSelected =
    historias.length > 0 && historias.every((h) => selectedIds.includes(h.id));
  const someSelected =
    historias.some((h) => selectedIds.includes(h.id)) && !allSelected;

  if (historias.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay historias de usuario
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            {/* Columna para expandir/colapsar */}
            <TableHead className="w-10"></TableHead>
            {showCheckbox && (
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Seleccionar todas"
                  className={someSelected ? 'opacity-50' : ''}
                />
              </TableHead>
            )}
            <TableHead className="w-20">ID</TableHead>
            <TableHead className="min-w-[200px]">Titulo</TableHead>
            <TableHead className="w-28">Estado</TableHead>
            <TableHead className="w-40">Épica</TableHead>
            <TableHead className="w-40">Responsable</TableHead>
            <TableHead className="w-24">Prioridad</TableHead>
            <TableHead className="w-28">Fecha inicio</TableHead>
            <TableHead className="w-28">Fecha fin</TableHead>
            <TableHead className="w-20 text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {historias.map((historia) => {
            const isSelected = selectedIds.includes(historia.id);
            const isExpanded = expandedRows.has(historia.id);
            const isLoadingHUTareas = loadingTareas.has(historia.id);
            const huTareas = tareasMap.get(historia.id) || [];
            const colSpan = showCheckbox ? 11 : 10;
            const tieneTareas = historiasConTareas.has(historia.id);

            return (
              <Fragment key={historia.id}>
                <TableRow
                  className={cn(
                    'hover:bg-gray-50',
                    isSelected && 'bg-blue-50 hover:bg-blue-100',
                    isExpanded && 'bg-blue-50/50'
                  )}
                >
                  {/* Botón expandir/colapsar - Solo visible si tiene tareas */}
                  <TableCell className="p-2">
                    {tieneTareas ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleExpand(historia.id)}
                        title={isExpanded ? 'Colapsar tareas' : 'Ver tareas'}
                      >
                        {isLoadingHUTareas ? (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        ) : isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    ) : (
                      // Espacio vacío para mantener alineación
                      <div className="h-6 w-6" />
                    )}
                  </TableCell>
                  {showCheckbox && (
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleSelectOne(historia.id, checked as boolean)
                        }
                        aria-label={`Seleccionar ${historia.codigo}`}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <button
                      onClick={() => onView?.(historia)}
                      className="text-[#018CD1] hover:underline font-medium"
                    >
                      {historia.codigo}
                    </button>
                  </TableCell>
                <TableCell>
                  <span
                    className="cursor-pointer hover:text-[#018CD1]"
                    onClick={() => onView?.(historia)}
                  >
                    {historia.titulo}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn('text-xs', estadoColors[historia.estado])}
                  >
                    {historia.estado}
                  </Badge>
                </TableCell>
                <TableCell>
                  {historia.epica ? (
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: historia.epica.color || '#888' }}
                      />
                      <span className="text-sm truncate max-w-[120px]">
                        {historia.epica.nombre}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm italic">Sin épica</span>
                  )}
                </TableCell>
                <TableCell>
                  {historia.asignadoA && historia.asignadoA.length > 0 ? (
                    <div className="flex flex-col gap-0.5">
                      {historia.asignadoA.map((id, idx) => {
                        // Convertir a número por si viene como string del backend
                        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                        return (
                          <span key={numId || idx} className="text-sm">
                            {equipoMap.get(numId) || `ID: ${numId}`}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm italic">Sin asignar</span>
                  )}
                </TableCell>
                <TableCell>
                  {historia.prioridad ? (
                    <Badge
                      variant="secondary"
                      className={cn('text-xs', prioridadColors[historia.prioridad])}
                    >
                      {historia.prioridad}
                    </Badge>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {historia.fechaInicio ? (
                    <span className="text-sm">
                      {formatDate(historia.fechaInicio, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {historia.fechaFin ? (
                    <span className="text-sm">
                      {formatDate(historia.fechaFin, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView?.(historia)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver detalles
                      </DropdownMenuItem>
                      {/* Editar solo si HU NO esta en revision ni finalizada y handler disponible */}
                      {onEdit && historia.estado !== 'En revision' && historia.estado !== 'Finalizado' && (
                        <DropdownMenuItem onClick={() => onEdit(historia)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                      )}
                      {/* Crear tarea solo si HU NO esta en revision ni finalizada */}
                      {onCreateTarea && historia.estado !== 'En revision' && historia.estado !== 'Finalizado' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onCreateTarea(historia.id)}>
                            <ListTodo className="h-4 w-4 mr-2" />
                            <Plus className="h-3 w-3 -ml-1 mr-1" />
                            Crear tarea
                          </DropdownMenuItem>
                        </>
                      )}
                      {/* Acciones de validacion cuando HU esta "En revision" */}
                      {historia.estado === 'En revision' && (
                        <>
                          <DropdownMenuSeparator />
                          {historia.documentoEvidenciasUrl && onVerDocumento && (
                            <DropdownMenuItem onClick={() => onVerDocumento(historia)}>
                              <FileText className="h-4 w-4 mr-2" />
                              Ver documento
                            </DropdownMenuItem>
                          )}
                          {onValidarHu && (
                            <DropdownMenuItem onClick={() => onValidarHu(historia)}>
                              <ClipboardCheck className="h-4 w-4 mr-2" />
                              Validar HU
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                      {/* Badge de HU validada cuando esta Finalizado */}
                      {historia.estado === 'Finalizado' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem disabled className="text-green-600">
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            HU Validada
                          </DropdownMenuItem>
                        </>
                      )}
                      {/* Eliminar solo si HU NO esta en revision ni finalizada y handler disponible */}
                      {onDelete && historia.estado !== 'En revision' && historia.estado !== 'Finalizado' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(historia)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>

              {/* Fila expandida con las tareas - Solo si tiene tareas y está expandido */}
              {isExpanded && tieneTareas && (
                <TableRow key={`${historia.id}-tareas`} className="bg-gray-50/50">
                  <TableCell colSpan={colSpan} className="p-0">
                    <div className="pl-10 pr-4 py-3 border-t border-gray-100">
                      {isLoadingHUTareas ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Cargando tareas...
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* Header de tareas */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                              Tareas ({huTareas.length})
                            </span>
                            {/* Nueva tarea solo si HU NO esta en revision ni finalizada */}
                            {onCreateTarea && historia.estado !== 'En revision' && historia.estado !== 'Finalizado' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-[#018CD1] hover:text-[#0179b5] hover:bg-blue-50"
                                onClick={() => onCreateTarea(historia.id)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Nueva tarea
                              </Button>
                            )}
                          </div>
                          {/* Tabla de tareas */}
                          <div className="border rounded-lg overflow-hidden bg-white">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-gray-50">
                                  <TableHead className="w-20 text-xs">ID</TableHead>
                                  <TableHead className="min-w-[150px] text-xs">Título</TableHead>
                                  <TableHead className="w-24 text-xs">Estado</TableHead>
                                  <TableHead className="w-32 text-xs">Responsable</TableHead>
                                  <TableHead className="w-20 text-xs">Prioridad</TableHead>
                                  <TableHead className="w-24 text-xs">F. Inicio</TableHead>
                                  <TableHead className="w-24 text-xs">F. Fin</TableHead>
                                  <TableHead className="w-16 text-xs text-center">Acciones</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {huTareas.map((tarea) => (
                                  <TableRow key={tarea.id} className="hover:bg-gray-50">
                                    <TableCell className="text-xs font-mono text-[#018CD1] font-medium">
                                      {tarea.codigo}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-700">
                                      {tarea.nombre}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="secondary"
                                        className={cn('text-xs', tareaEstadoColors[tarea.estado] || 'bg-gray-100')}
                                      >
                                        {tarea.estado}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-gray-600">
                                      {tarea.asignadoA ? (
                                        equipoMap.get(tarea.asignadoA) ||
                                        (tarea.asignado ? `${tarea.asignado.nombre} ${tarea.asignado.apellido}` : `ID: ${tarea.asignadoA}`)
                                      ) : (
                                        <span className="text-gray-400 italic">Sin asignar</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {tarea.prioridad ? (
                                        <Badge
                                          variant="outline"
                                          className={cn('text-xs', prioridadColors[tarea.prioridad])}
                                        >
                                          {tarea.prioridad}
                                        </Badge>
                                      ) : (
                                        <span className="text-gray-400 text-xs">-</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-xs text-gray-600">
                                      {tarea.fechaInicio ? (
                                        formatDate(tarea.fechaInicio, { day: '2-digit', month: '2-digit', year: 'numeric' })
                                      ) : (
                                        <span className="text-gray-400">-</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-xs text-gray-600">
                                      {tarea.fechaFin ? (
                                        formatDate(tarea.fechaFin, { day: '2-digit', month: '2-digit', year: 'numeric' })
                                      ) : (
                                        <span className="text-gray-400">-</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {/* Si la HU esta en revision, mostrar icono de reloj */}
                                      {historia.estado === 'En revision' ? (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className="flex justify-center">
                                                <Clock className="h-5 w-5 text-purple-500" />
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>HU en revision</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      ) : historia.estado === 'Finalizado' ? (
                                        /* Si la HU esta finalizada, mostrar icono de validada */
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className="flex justify-center">
                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>HU finalizada y validada</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      ) : (onEditTarea || onDeleteTarea) ? (
                                        <DropdownMenu modal={false}>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            {onEditTarea && (
                                              <DropdownMenuItem onClick={() => onEditTarea(tarea)}>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Editar
                                              </DropdownMenuItem>
                                            )}
                                            {onDeleteTarea && (
                                              <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                  onClick={() => onDeleteTarea(tarea)}
                                                  className="text-red-600"
                                                >
                                                  <Trash2 className="h-4 w-4 mr-2" />
                                                  Eliminar
                                                </DropdownMenuItem>
                                              </>
                                            )}
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      ) : null}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
