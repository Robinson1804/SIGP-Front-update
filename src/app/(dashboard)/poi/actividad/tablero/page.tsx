'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import type { DropResult } from '@hello-pangea/dnd';
import type { DndTask, TareaEstado, TareaPrioridad } from '@/components/dnd';
import { getTablero, getActividadById } from '@/features/actividades/services/actividades.service';
import { moverTarea, getTareasByActividad } from '@/features/actividades/services/tareas-kanban.service';
import type { TareaKanban, Actividad } from '@/features/actividades/types';
import { useToast } from '@/lib/hooks/use-toast';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ROLES } from '@/lib/definitions';
import { paths } from '@/lib/paths';
import { useAuth } from '@/stores';

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
    limit: 3, // WIP limit
  },
  {
    id: 'En revision' as const,
    title: 'En revisión',
    description: 'Esperando validación',
    color: 'bg-yellow-100 border-yellow-300',
    limit: 2, // WIP limit
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
    titulo: tarea.nombre,
    descripcion: tarea.descripcion,
    estado: tarea.estado,
    prioridad: mapPriority(tarea.prioridad),
    fechaInicio: tarea.fechaInicio,
    fechaFin: tarea.fechaFin,
    orden: 0, // Backend will handle ordering
    tipo: 'KANBAN',
    horasEstimadas: tarea.horasEstimadas,
    subtareasCount: tarea.subtareasCount || 0,
    responsables: tarea.asignadoAInfo ? [{
      id: tarea.asignadoAInfo.id,
      nombre: `${tarea.asignadoAInfo.nombre} ${tarea.asignadoAInfo.apellido}`,
    }] : [],
  };
}

function TableroContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // State
  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [tasks, setTasks] = useState<DndTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Tablero');

  // Get activity ID from URL or localStorage
  const actividadId = searchParams.get('actividadId') || searchParams.get('id');

  // Role checks
  const isImplementador = user?.role === ROLES.IMPLEMENTADOR;

  // Fetch activity data
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);

        // Try to get ID from URL params first, then from localStorage
        let id: number | null = null;

        if (actividadId) {
          id = parseInt(actividadId, 10);
        } else {
          // Fallback to localStorage
          const savedProjectData = localStorage.getItem('selectedProject');
          if (savedProjectData) {
            const projectData = JSON.parse(savedProjectData);
            if (projectData.type !== 'Actividad') {
              router.push(paths.poi.base);
              return;
            }
            id = projectData.id;
          }
        }

        if (!id) {
          toast({
            title: 'Error',
            description: 'No se encontró el ID de la actividad',
            variant: 'destructive',
          });
          router.push(paths.poi.base);
          return;
        }

        // Fetch activity details
        const actividadData = await getActividadById(id);
        setActividad(actividadData);

        // Fetch tasks for the activity
        const tareasData = await getTareasByActividad(id);
        const mappedTasks = tareasData.map(mapToKanbanDndTask);
        setTasks(mappedTasks);

      } catch (error) {
        console.error('Error loading activity data:', error);
        toast({
          title: 'Error al cargar datos',
          description: 'No se pudo cargar la información de la actividad',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [actividadId, router, toast]);

  // Handle drag and drop
  const handleDragEnd = async (result: DropResult, updatedTasks: DndTask[]) => {
    const { draggableId, destination, source } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return; // No change
    }

    const destColumn = KANBAN_COLUMNS.find(c => c.id === destination.droppableId);
    const tasksInDest = updatedTasks.filter(t => t.estado === destination.droppableId);

    // Warn if exceeding WIP limit (but still allow)
    if (destColumn?.limit && tasksInDest.length > destColumn.limit) {
      toast({
        title: 'Límite WIP excedido',
        description: `La columna "${destColumn.title}" tiene un límite de ${destColumn.limit} tareas`,
        variant: 'default',
      });
    }

    // Optimistic update
    setTasks(updatedTasks);

    try {
      // Call backend to move task
      await moverTarea(
        parseInt(draggableId, 10),
        destination.droppableId as TareaEstado,
        destination.index
      );
    } catch (error) {
      console.error('Error moving task:', error);
      toast({
        title: 'Error al mover tarea',
        description: 'No se pudo actualizar el estado de la tarea',
        variant: 'destructive',
      });

      // Re-fetch to restore correct state
      if (actividad) {
        const tareasData = await getTareasByActividad(actividad.id);
        const mappedTasks = tareasData.map(mapToKanbanDndTask);
        setTasks(mappedTasks);
      }
    }
  };

  // Handle tab navigation
  const handleTabClick = (tabName: string) => {
    let route = '';
    if (tabName === 'Detalles') route = paths.poi.actividad.detalles;
    else if (tabName === 'Lista') route = paths.poi.actividad.lista;
    else if (tabName === 'Dashboard') route = paths.poi.actividad.dashboard;

    if (route) {
      // Pass activity ID in query params
      const queryParams = actividad ? `?actividadId=${actividad.id}` : '';
      router.push(`${route}${queryParams}`);
    } else {
      setActiveTab(tabName);
    }
  };

  // Loading state
  if (isLoading || !actividad) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        Cargando tablero...
      </div>
    );
  }

  const activityCode = `ACT N°${actividad.id}`;

  const breadcrumbs = [
    { label: 'POI', href: paths.poi.base },
    { label: 'Tablero' }
  ];

  // IMPLEMENTADOR no tiene acceso a Detalles
  const allActivityTabs = [
    { name: 'Detalles' },
    { name: 'Lista' },
    { name: 'Tablero' },
    { name: 'Dashboard' }
  ];
  const activityTabs = isImplementador
    ? allActivityTabs.filter(tab => tab.name !== 'Detalles')
    : allActivityTabs;

  const secondaryHeader = (
    <div className="bg-[#D5D5D5] border-b border-t border-[#1A5581]">
      <div className="p-2 flex items-center justify-between w-full">
        <h2 className="font-bold text-black pl-2">
          {activityCode}: {actividad.nombre}
        </h2>
      </div>
    </div>
  );

  return (
    <AppLayout
      breadcrumbs={breadcrumbs}
      secondaryHeader={secondaryHeader}
    >
      {/* Tabs */}
      <div className="flex items-center justify-between p-4 bg-[#F9F9F9]">
        <div className="flex items-center gap-2">
          {activityTabs.map(tab => (
            <Button
              key={tab.name}
              size="sm"
              onClick={() => handleTabClick(tab.name)}
              className={cn(
                activeTab === tab.name
                  ? 'bg-[#018CD1] text-white'
                  : 'bg-white text-black border-gray-300'
              )}
              variant={activeTab === tab.name ? 'default' : 'outline'}
            >
              {tab.name}
            </Button>
          ))}
        </div>
        <Button size="icon" variant="ghost" disabled>
          <Plus className="h-5 w-5 text-gray-600" />
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex flex-col bg-[#F9F9F9] px-4 pb-4 overflow-hidden">
        <KanbanBoard
          tasks={tasks}
          columns={KANBAN_COLUMNS}
          onDragEnd={handleDragEnd}
          isLoading={isLoading}
          className="flex-1"
        />
      </div>
    </AppLayout>
  );
}

export default function TableroActividadPage() {
  return (
    <React.Suspense fallback={<div>Cargando...</div>}>
      <TableroContent />
    </React.Suspense>
  );
}
