/**
 * Example usage of KanbanBoard component
 * This file demonstrates how to properly integrate the DnD components
 * with SSR handling and API integration
 *
 * DO NOT COMMIT THIS FILE - FOR REFERENCE ONLY
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { KanbanBoard, DndTask } from './index';
import type { DropResult } from '@hello-pangea/dnd';
import { useToast } from '@/lib/hooks/use-toast';

// ============================================
// METHOD 1: Dynamic Import (Recommended for SSR safety)
// ============================================

const DynamicKanbanBoard = dynamic(
  () => import('./kanban-board').then(mod => ({ default: mod.KanbanBoard })),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-lg" />
        ))}
      </div>
    ),
  }
);

export function ExampleKanbanWithDynamicImport() {
  const [tasks, setTasks] = useState<DndTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // Fetch tasks from API
  useEffect(() => {
    async function fetchTasks() {
      try {
        const response = await fetch('/api/v1/tareas?tipo=KANBAN');
        const data = await response.json();
        setTasks(data.data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las tareas',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchTasks();
  }, [toast]);

  // Handle drag end - update backend
  const handleDragEnd = async (result: DropResult, updatedTasks: DndTask[]) => {
    const { draggableId, destination } = result;

    if (!destination) return;

    // Optimistic update
    setTasks(updatedTasks);

    try {
      // Call backend API to update task status
      const response = await fetch(`/api/v1/tareas/${draggableId}/mover`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          estado: destination.droppableId,
          orden: destination.index,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      toast({
        title: 'Tarea actualizada',
        description: 'La tarea se movió correctamente',
      });
    } catch (error) {
      // Revert on error
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la tarea',
        variant: 'destructive',
      });
      // Refetch to get correct state
      window.location.reload();
    }
  };

  const handleTaskClick = (task: DndTask) => {
    router.push(`/poi/actividad/detalles?id=${task.id}`);
  };

  return (
    <DynamicKanbanBoard
      tasks={tasks}
      onDragEnd={handleDragEnd}
      onTaskClick={handleTaskClick}
      isLoading={isLoading}
    />
  );
}

// ============================================
// METHOD 2: Client-only with useState (Alternative)
// ============================================

export function ExampleKanbanWithClientCheck() {
  const [isMounted, setIsMounted] = useState(false);
  const [tasks, setTasks] = useState<DndTask[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div>Cargando tablero...</div>;
  }

  return (
    <KanbanBoard
      tasks={tasks}
      onDragEnd={async (result, updatedTasks) => {
        setTasks(updatedTasks);
        // Update backend...
      }}
    />
  );
}

// ============================================
// METHOD 3: Custom Columns Configuration
// ============================================

export function ExampleKanbanWithCustomColumns() {
  const [tasks, setTasks] = useState<DndTask[]>([]);

  // Custom columns for Scrum sprint board
  const scrumColumns = [
    {
      id: 'Por hacer' as const,
      title: 'Backlog Sprint',
      description: 'Historias del sprint actual',
      color: 'bg-gray-100 border-gray-300',
    },
    {
      id: 'En progreso' as const,
      title: 'En Desarrollo',
      description: 'En proceso',
      color: 'bg-blue-100 border-blue-300',
      limit: 3, // WIP limit
    },
    {
      id: 'En revision' as const,
      title: 'Code Review',
      description: 'Esperando revisión',
      color: 'bg-purple-100 border-purple-300',
      limit: 2,
    },
    {
      id: 'Finalizado' as const,
      title: 'Done',
      description: 'Completado en el sprint',
      color: 'bg-green-100 border-green-300',
    },
  ];

  return (
    <KanbanBoard
      tasks={tasks}
      columns={scrumColumns}
      onDragEnd={async (result, updatedTasks) => {
        setTasks(updatedTasks);
      }}
    />
  );
}

// ============================================
// COMPLETE INTEGRATION EXAMPLE
// ============================================

/**
 * Full example with all features:
 * - SSR-safe dynamic import
 * - Backend integration
 * - Error handling
 * - Loading states
 * - Optimistic updates
 * - Role-based permissions
 */
export function CompleteKanbanExample() {
  const [tasks, setTasks] = useState<DndTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    async function loadTasks() {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/api/v1'}/tareas`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch');

        const result = await response.json();
        setTasks(result.data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las tareas',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadTasks();
  }, [isMounted, toast]);

  const handleDragEnd = async (result: DropResult, updatedTasks: DndTask[]) => {
    const { draggableId, destination } = result;
    if (!destination) return;

    // Optimistic update
    const previousTasks = tasks;
    setTasks(updatedTasks);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/api/v1'}/tareas/${draggableId}/mover`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            estado: destination.droppableId,
            orden: destination.index,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to update');

      toast({
        title: 'Tarea actualizada',
        description: 'El estado de la tarea se actualizó correctamente',
      });
    } catch (error) {
      // Rollback on error
      setTasks(previousTasks);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la tarea',
        variant: 'destructive',
      });
    }
  };

  const handleTaskClick = (task: DndTask) => {
    if (task.tipo === 'SCRUM') {
      router.push(`/poi/proyecto/backlog/tablero?taskId=${task.id}`);
    } else {
      router.push(`/poi/actividad/tablero?taskId=${task.id}`);
    }
  };

  if (!isMounted) {
    return <div className="animate-pulse">Cargando tablero...</div>;
  }

  return (
    <KanbanBoard
      tasks={tasks}
      onDragEnd={handleDragEnd}
      onTaskClick={handleTaskClick}
      isLoading={isLoading}
      className="mt-6"
    />
  );
}
