'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { DropResult } from '@hello-pangea/dnd';
import { Square, ChevronDown, AlertCircle } from 'lucide-react';

import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { paths } from '@/lib/paths';
import { ROLES, MODULES } from '@/lib/definitions';
import { useAuth } from '@/stores';
import { ProtectedRoute } from '@/features/auth';
import { useToast } from '@/lib/hooks/use-toast';

// DnD components (SSR disabled)
import type { DndTask, TareaEstado } from '@/components/dnd';
const KanbanBoard = dynamic(
  () => import('@/components/dnd').then(mod => ({ default: mod.KanbanBoard })),
  { ssr: false, loading: () => <BoardSkeleton /> }
);

// Services
import {
  getSprintsByProyecto,
  getSprintTablero,
  cerrarSprint,
  type Sprint,
  type SprintTarea,
} from '@/features/proyectos/services/sprints.service';
import { moverTarea } from '@/features/proyectos/services/tareas.service';

// ==================== LOADING SKELETON ====================
function BoardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-3">
            <div className="h-5 bg-gray-200 rounded w-24"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-20 bg-gray-100 rounded"></div>
              <div className="h-20 bg-gray-100 rounded"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ==================== MAPPER FUNCTIONS ====================
/**
 * Maps backend SprintTarea to DndTask format
 */
function mapTareaToDndTask(tarea: SprintTarea): DndTask {
  return {
    id: tarea.id,
    nombre: tarea.nombre,
    descripcion: null,
    estado: tarea.estado as TareaEstado,
    prioridad: tarea.prioridad as any,
    fechaFin: null,
    orden: null,
    tipo: 'SCRUM',
    storyPoints: tarea.puntos || null,
    responsables: tarea.responsable ? [{
      id: tarea.responsable.id,
      nombre: tarea.responsable.nombre,
    }] : [],
  };
}

// ==================== MAIN COMPONENT ====================
function TableroContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Get proyectoId from URL query params
  const proyectoId = searchParams.get('proyectoId');

  // State
  const [project, setProject] = useState<any>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<DndTask[]>([]);
  const [isLoadingBoard, setIsLoadingBoard] = useState(false);
  const [isClosingSprint, setIsClosingSprint] = useState(false);

  // Derived state - ADMIN tiene acceso completo
  const isAdmin = user?.role === ROLES.ADMIN;
  const isScrumMaster = user?.role === ROLES.SCRUM_MASTER;
  const isDeveloper = user?.role === ROLES.DESARROLLADOR;
  const canCloseSprint = isAdmin || isScrumMaster;
  const currentSprint = sprints.find(s => s.id === selectedSprintId);

  // ==================== LOAD PROJECT ====================
  useEffect(() => {
    const savedProjectData = localStorage.getItem('selectedProject');
    if (savedProjectData) {
      setProject(JSON.parse(savedProjectData));
    } else if (!proyectoId) {
      router.push(paths.poi.base);
    }
  }, [router, proyectoId]);

  // ==================== LOAD SPRINTS ====================
  useEffect(() => {
    async function fetchSprints() {
      if (!proyectoId) return;

      try {
        const sprintsData = await getSprintsByProyecto(proyectoId);
        setSprints(sprintsData);

        // Auto-select active sprint or first sprint
        const activeSprint = sprintsData.find(s => s.estado === 'En progreso' || s.estado === 'Activo');
        const defaultSprint = activeSprint || sprintsData[0];
        if (defaultSprint) {
          setSelectedSprintId(defaultSprint.id);
        }
      } catch (error) {
        console.error('Error fetching sprints:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los sprints',
          variant: 'destructive',
        });
      }
    }

    fetchSprints();
  }, [proyectoId, toast]);

  // ==================== LOAD SPRINT BOARD ====================
  useEffect(() => {
    async function fetchSprintBoard() {
      if (!selectedSprintId) return;

      setIsLoadingBoard(true);
      try {
        const boardData = await getSprintTablero(selectedSprintId);

        // Flatten all tasks from all columns
        const allTasks: DndTask[] = [];
        boardData.columnas.forEach(columna => {
          const columnTasks = columna.tareas.map(mapTareaToDndTask);
          allTasks.push(...columnTasks);
        });

        setTasks(allTasks);
      } catch (error) {
        console.error('Error fetching sprint board:', error);
        toast({
          title: 'Error',
          description: 'No se pudo cargar el tablero del sprint',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingBoard(false);
      }
    }

    fetchSprintBoard();
  }, [selectedSprintId, toast]);

  // ==================== DRAG & DROP HANDLER ====================
  const handleDragEnd = async (result: DropResult, updatedTasks: DndTask[]) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newEstado = destination.droppableId as TareaEstado;
    const newOrden = destination.index;

    // Optimistic update
    setTasks(updatedTasks);

    try {
      await moverTarea(draggableId, newEstado, newOrden);

      toast({
        title: 'Tarea actualizada',
        description: `La tarea se movió a "${newEstado}"`,
      });
    } catch (error) {
      console.error('Error moving task:', error);

      // Rollback on error - refetch board data
      toast({
        title: 'Error',
        description: 'No se pudo mover la tarea. Intente nuevamente.',
        variant: 'destructive',
      });

      // Refetch to restore correct state
      if (selectedSprintId) {
        try {
          const boardData = await getSprintTablero(selectedSprintId);
          const allTasks: DndTask[] = [];
          boardData.columnas.forEach(columna => {
            const columnTasks = columna.tareas.map(mapTareaToDndTask);
            allTasks.push(...columnTasks);
          });
          setTasks(allTasks);
        } catch (refetchError) {
          console.error('Error refetching board:', refetchError);
        }
      }
    }
  };

  // ==================== TASK CLICK HANDLER ====================
  const handleTaskClick = (task: DndTask) => {
    // TODO: Navigate to task details or open modal
    console.log('Task clicked:', task);
  };

  // ==================== CLOSE SPRINT ====================
  const handleCloseSprint = async () => {
    if (!selectedSprintId || !currentSprint) return;

    const confirmed = window.confirm(
      `¿Está seguro que desea cerrar "${currentSprint.nombre}"?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    setIsClosingSprint(true);
    try {
      await cerrarSprint(selectedSprintId);

      toast({
        title: 'Sprint cerrado',
        description: `El sprint "${currentSprint.nombre}" ha sido cerrado exitosamente.`,
      });

      // Redirect to backlog
      router.push(paths.poi.proyecto.backlog.base);
    } catch (error) {
      console.error('Error closing sprint:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cerrar el sprint. Intente nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsClosingSprint(false);
    }
  };

  // ==================== NAVIGATION ====================
  const handleTabClick = (tabName: string) => {
    let route = '';
    if (tabName === 'Backlog') route = paths.poi.proyecto.backlog.base;
    else if (tabName === 'Dashboard') route = paths.poi.proyecto.backlog.dashboard;

    if (route) {
      router.push(route);
    }
  };

  // ==================== RENDER ====================
  if (!project && !proyectoId) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        Cargando proyecto...
      </div>
    );
  }

  const projectCode = project ? (project.code || `PROY N°${project.id}`) : 'Proyecto';
  const projectName = project?.name || 'Cargando...';

  // Breadcrumb simplificado: POI > Backlog (mantener Backlog aunque esté en Tablero)
  const breadcrumbs = [{ label: 'POI', href: paths.poi.base }, { label: 'Backlog' }];

  const tabs = ['Backlog', 'Tablero', 'Dashboard'];

  const secondaryHeader = (
    <div className="bg-[#D5D5D5] border-b border-t border-[#1A5581]">
      <div className="p-2 flex items-center justify-between w-full">
        <h2 className="font-bold text-black pl-2">
          {projectCode}: {projectName}
        </h2>
      </div>
    </div>
  );

  return (
    <AppLayout breadcrumbs={breadcrumbs} secondaryHeader={secondaryHeader}>
      {/* Tabs */}
      <div className="flex items-center gap-2 p-4 bg-[#F9F9F9]">
        {tabs.map(tab => (
          <Button
            key={tab}
            size="sm"
            onClick={() => handleTabClick(tab)}
            className={cn(
              tab === 'Tablero'
                ? 'bg-[#018CD1] text-white'
                : 'bg-white text-black border-gray-300'
            )}
            variant={tab === 'Tablero' ? 'default' : 'outline'}
          >
            {tab}
          </Button>
        ))}
      </div>

      {/* Board Content */}
      <div className="flex-1 flex flex-col bg-[#F9F9F9] px-4 pb-4">
        {/* Controls Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            {/* Sprint Selector */}
            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Filtrar por Sprint:
              </Label>
              <Select
                value={selectedSprintId?.toString() || ''}
                onValueChange={(value) => setSelectedSprintId(Number(value))}
                disabled={sprints.length === 0}
              >
                <SelectTrigger className="w-[320px] bg-white">
                  <SelectValue placeholder="Seleccionar sprint" />
                </SelectTrigger>
                <SelectContent>
                  {sprints.map(sprint => (
                    <SelectItem key={sprint.id} value={sprint.id.toString()}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <span className="font-medium">{sprint.nombre}</span>
                        <span className="text-gray-500 text-sm">
                          {sprint.fechaInicio
                            ? new Date(sprint.fechaInicio + 'T00:00:00').toLocaleDateString('es-PE')
                            : ''
                          } - {sprint.fechaFin
                            ? new Date(sprint.fechaFin + 'T00:00:00').toLocaleDateString('es-PE')
                            : ''
                          }
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sprint Status Badge */}
            {currentSprint && (
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={cn('text-xs', {
                    'bg-blue-100 text-blue-800': currentSprint.estado === 'Por hacer' || currentSprint.estado === 'Planificado',
                    'bg-yellow-100 text-yellow-800': currentSprint.estado === 'En progreso' || currentSprint.estado === 'Activo',
                    'bg-green-100 text-green-800': currentSprint.estado === 'Finalizado' || currentSprint.estado === 'Completado',
                  })}
                >
                  {currentSprint.estado}
                </Badge>
                <span className="text-sm text-gray-500">
                  ({tasks.length} tareas)
                </span>
              </div>
            )}

            {/* No sprints warning */}
            {sprints.length === 0 && (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">No hay sprints disponibles</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Close Sprint Button - Only for Admin/Scrum Master and if sprint is active */}
            {canCloseSprint && (currentSprint?.estado === 'En progreso' || currentSprint?.estado === 'Activo') && (
              <Button
                className="gap-2 bg-[#018CD1] hover:bg-[#018CD1]/90"
                onClick={handleCloseSprint}
                disabled={isClosingSprint}
              >
                <Square className="h-4 w-4" />
                {isClosingSprint ? 'Cerrando...' : 'Cerrar Sprint'}
              </Button>
            )}
          </div>
        </div>

        {/* Kanban Board */}
        {selectedSprintId && (
          <div className="flex-1 overflow-hidden">
            <KanbanBoard
              tasks={tasks}
              onDragEnd={handleDragEnd}
              onTaskClick={handleTaskClick}
              isLoading={isLoadingBoard}
              className="h-full"
            />
          </div>
        )}

        {/* Empty State */}
        {!selectedSprintId && sprints.length > 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p>Seleccione un sprint para ver el tablero</p>
            </div>
          </div>
        )}

        {sprints.length === 0 && !isLoadingBoard && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">No hay sprints creados</p>
              <p className="text-sm">
                Vaya a la vista de Backlog para crear un nuevo sprint
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push(paths.poi.proyecto.backlog.base)}
              >
                Ir a Backlog
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// ==================== EXPORTED PAGE COMPONENT ====================
export default function TableroProyectoPage() {
  return (
    <ProtectedRoute module={MODULES.POI}>
      <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Cargando...</div>}>
        <TableroContent />
      </Suspense>
    </ProtectedRoute>
  );
}
