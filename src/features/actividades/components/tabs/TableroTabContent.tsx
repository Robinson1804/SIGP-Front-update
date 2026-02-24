'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { DropResult } from '@hello-pangea/dnd';
import type { DndTask, TareaEstado as DndTareaEstado, TareaPrioridad } from '@/components/dnd';
import { moverTarea, getTareasByActividad, getTareaById } from '@/features/actividades/services/tareas-kanban.service';
import { getTareasBySubactividad, getSubactividadMetricas } from '@/features/actividades/services/subactividades.service';
import { getActividadMetricas } from '@/features/actividades/services/actividades.service';
import type { TareaKanban, TareaEstado, ActividadMetricas } from '@/features/actividades/types';
import {
  TaskFilters,
  type TaskFiltersState,
  KanbanMetricsBar,
  TaskDetailPanel,
} from '@/features/actividades/components';
import { useToast } from '@/lib/hooks/use-toast';

// Dynamic import with SSR disabled for drag & drop
const KanbanBoard = dynamic(
  () => import('@/components/dnd').then(mod => ({ default: mod.KanbanBoard })),
  { ssr: false }
);

// Kanban columns with WIP limits
const KANBAN_COLUMNS = [
  {
    id: 'Por hacer' as const,
    title: 'Por hacer',
    description: 'Tareas pendientes',
    color: 'bg-slate-100 border-slate-300',
  },
  {
    id: 'En progreso' as const,
    title: 'En progreso',
    description: 'En desarrollo',
    color: 'bg-blue-100 border-blue-300',
    limit: 5, // WIP limit
  },
  {
    id: 'Finalizado' as const,
    title: 'Finalizado',
    description: 'Completadas',
    color: 'bg-green-100 border-green-300',
  },
];

// Map backend priority to MoSCoW
function mapPriority(prioridad?: 'Alta' | 'Media' | 'Baja'): TareaPrioridad {
  const mapping = {
    Alta: 'Must',
    Media: 'Should',
    Baja: 'Could'
  } as const;
  return prioridad ? mapping[prioridad] : 'Could';
}

// Map Kanban task to DndTask format
function mapToKanbanDndTask(tarea: TareaKanban): DndTask {
  return {
    id: tarea.id,
    nombre: tarea.nombre,
    descripcion: tarea.descripcion,
    estado: tarea.estado,
    prioridad: mapPriority(tarea.prioridad),
    fechaInicio: tarea.fechaInicio,
    fechaFin: tarea.fechaFin,
    orden: 0,
    tipo: 'KANBAN',
    horasEstimadas: tarea.horasEstimadas,
    subtareasCount: tarea.subtareasCount || 0,
    responsables: tarea.asignadoAInfo ? [{
      id: tarea.asignadoAInfo.id,
      nombre: `${tarea.asignadoAInfo.nombre} ${tarea.asignadoAInfo.apellido}`,
    }] : [],
  };
}

// Initial filters state
const initialFilters: TaskFiltersState = {
  search: '',
  prioridad: 'todas',
  asignadoA: 'todos',
  conSubtareas: null,
};

interface TableroTabContentProps {
  actividadId?: number;
  subactividadId?: number;
}

export function TableroTabContent({ actividadId, subactividadId }: TableroTabContentProps) {
  const { toast } = useToast();

  // State
  const [tasks, setTasks] = useState<DndTask[]>([]);
  const [allTareas, setAllTareas] = useState<TareaKanban[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [metricsData, setMetricsData] = useState<ActividadMetricas | null>(null);

  // New states for enhanced features
  const [filters, setFilters] = useState<TaskFiltersState>(initialFilters);
  const [selectedTarea, setSelectedTarea] = useState<TareaKanban | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Function to load/reload data
  const loadData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);

      // Fetch tasks (required) - use subactividad endpoint when subactividadId is provided
      const tareasData = subactividadId
        ? await getTareasBySubactividad(subactividadId)
        : actividadId
          ? await getTareasByActividad(actividadId)
          : [];
      setAllTareas(tareasData);
      const mappedTasks = tareasData.map(mapToKanbanDndTask);
      setTasks(mappedTasks);

      // Fetch metrics (optional - may not exist in production backend yet)
      try {
        const metricas = subactividadId
          ? await getSubactividadMetricas(subactividadId)
          : actividadId
            ? await getActividadMetricas(actividadId)
            : null;
        setMetricsData(metricas);
      } catch {
        // Metrics endpoint not available, use null (fallback to local calculation)
        setMetricsData(null);
      }

    } catch (error) {
      console.error('Error loading activity data:', error);
      if (showLoading) {
        toast({
          title: 'Error al cargar datos',
          description: 'No se pudo cargar la información de la actividad',
          variant: 'destructive',
        });
      }
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [actividadId, subactividadId, toast]);

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload data when window regains focus (sync with Lista view changes)
  useEffect(() => {
    const handleFocus = () => {
      loadData(false);
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadData]);

  // Filter tasks based on current filters
  useEffect(() => {
    let filtered = allTareas;

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.nombre.toLowerCase().includes(searchLower) ||
          t.codigo.toLowerCase().includes(searchLower)
      );
    }

    // Priority filter
    if (filters.prioridad !== 'todas') {
      filtered = filtered.filter((t) => t.prioridad === filters.prioridad);
    }

    // Assignee filter
    if (filters.asignadoA !== 'todos') {
      filtered = filtered.filter((t) => t.asignadoA === filters.asignadoA);
    }

    const mappedTasks = filtered.map(mapToKanbanDndTask);
    setTasks(mappedTasks);
  }, [filters, allTareas]);

  // Handle task click to open detail panel
  const handleTaskClick = useCallback(async (taskId: number) => {
    try {
      const tarea = await getTareaById(taskId);
      setSelectedTarea(tarea);
      setIsPanelOpen(true);
    } catch (error) {
      console.error('Error loading task details:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar los detalles de la tarea',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Handle task update from panel
  const handleTaskUpdate = useCallback((updatedTarea: TareaKanban) => {
    setAllTareas((prev) =>
      prev.map((t) => (t.id === updatedTarea.id ? updatedTarea : t))
    );
    setSelectedTarea(updatedTarea);
  }, []);

  // Handle task delete from panel
  const handleTaskDelete = useCallback((tareaId: number) => {
    setAllTareas((prev) => prev.filter((t) => t.id !== tareaId));
    setIsPanelOpen(false);
    setSelectedTarea(null);
  }, []);

  // Calculate metrics
  const metrics = React.useMemo(() => {
    const total = allTareas.length;
    const porEstado = {
      porHacer: allTareas.filter((t) => t.estado === 'Por hacer').length,
      enProgreso: allTareas.filter((t) => t.estado === 'En progreso').length,
      completadas: allTareas.filter((t) => t.estado === 'Finalizado').length,
    };
    return { total, ...porEstado };
  }, [allTareas]);

  // Handle drag and drop
  const handleDragEnd = async (result: DropResult, updatedTasks: DndTask[]) => {
    const { draggableId, destination, source } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const taskId = parseInt(draggableId, 10);
    const newEstado = destination.droppableId as TareaEstado;
    const destColumn = KANBAN_COLUMNS.find(c => c.id === newEstado);
    const tasksInDest = updatedTasks.filter(t => t.estado === (newEstado as DndTareaEstado));

    // Warn if exceeding WIP limit
    if (destColumn?.limit && tasksInDest.length > destColumn.limit) {
      toast({
        title: 'Límite WIP excedido',
        description: `La columna "${destColumn.title}" tiene un límite de ${destColumn.limit} tareas`,
        variant: 'default',
      });
    }

    // Optimistic update - update both states
    setTasks(updatedTasks);
    setAllTareas((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, estado: newEstado } : t
      )
    );

    try {
      await moverTarea(taskId, newEstado, destination.index);

      // Refresh metrics after task move (optional - may not exist in production)
      try {
        const metricas = subactividadId
          ? await getSubactividadMetricas(subactividadId)
          : actividadId
            ? await getActividadMetricas(actividadId)
            : null;
        setMetricsData(metricas);
      } catch {
        // Metrics endpoint not available, ignore
      }

      toast({
        title: 'Tarea actualizada',
        description: `La tarea se movió a "${destColumn?.title}"`,
      });
    } catch (error) {
      console.error('Error moving task:', error);
      toast({
        title: 'Error al mover tarea',
        description: 'No se pudo actualizar el estado de la tarea',
        variant: 'destructive',
      });

      // Re-fetch to restore correct state
      const tareasData = subactividadId
        ? await getTareasBySubactividad(subactividadId)
        : actividadId
          ? await getTareasByActividad(actividadId)
          : [];
      setAllTareas(tareasData);
      const mappedTasks = tareasData.map(mapToKanbanDndTask);
      setTasks(mappedTasks);
    }
  };

  return (
    <>
      {/* Task Filters */}
      <div className="px-4">
        <TaskFilters
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      {/* Metrics Bar - uses API metrics when available, fallback to local calculation */}
      <div className="px-4 mt-3">
        <KanbanMetricsBar
          leadTime={metricsData?.leadTime ?? null}
          cycleTime={metricsData?.cycleTime ?? null}
          throughput={metricsData?.throughput ?? 0}
          totalTareas={metricsData?.totalTareas ?? metrics.total}
          tareasCompletadas={metricsData?.tareasCompletadas ?? metrics.completadas}
          tareasEnProgreso={metricsData?.tareasEnProgreso ?? metrics.enProgreso}
          tareasPorHacer={metricsData?.tareasPorHacer ?? metrics.porHacer}
        />
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex flex-col bg-[#F9F9F9] px-4 pb-4 overflow-hidden mt-3">
        <KanbanBoard
          tasks={tasks}
          columns={KANBAN_COLUMNS}
          onDragEnd={handleDragEnd}
          onTaskClick={(task) => handleTaskClick(task.id)}
          isLoading={isLoading}
          className="flex-1"
        />
      </div>

      {/* Task Detail Panel */}
      <TaskDetailPanel
        tarea={selectedTarea}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onUpdate={handleTaskUpdate}
        onDelete={handleTaskDelete}
      />
    </>
  );
}
