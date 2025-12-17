'use client';

/**
 * CronogramaView Component
 *
 * Vista principal del cronograma que integra todos los componentes
 * Este es un componente cliente que maneja el estado y la interactividad
 */

import { useState, useCallback, useMemo } from 'react';
import { Task } from 'gantt-task-react';
import { Plus, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { GanttChart } from './gantt-chart';
import { GanttToolbar } from './gantt-toolbar';
import { GanttTaskModal } from './gantt-task-modal';
import { DependencySelector } from './dependency-selector';
import { useCronograma } from '../hooks/use-cronograma';
import type {
  ViewMode,
  TareaCronograma,
  FormatoExportacion,
  CreateTareaCronogramaInput,
  UpdateTareaCronogramaInput,
} from '../types';

interface CronogramaViewProps {
  /** ID del proyecto */
  proyectoId: number | string;
  /** Nombre del proyecto (para mostrar) */
  proyectoNombre?: string;
  /** Lista de responsables disponibles */
  responsables?: { id: number; nombre: string }[];
}

/**
 * Vista completa del cronograma con Gantt y modales
 *
 * @example
 * <CronogramaView
 *   proyectoId={123}
 *   proyectoNombre="Sistema de Gestion"
 *   responsables={listaResponsables}
 * />
 */
export function CronogramaView({
  proyectoId,
  proyectoNombre,
  responsables = [],
}: CronogramaViewProps) {
  // Estado del cronograma
  const {
    cronograma,
    tareas,
    dependencias,
    isLoading,
    error,
    exists,
    createCronograma,
    createTarea,
    updateTarea,
    deleteTarea,
    updateTareaFechas,
    updateTareaProgreso,
    addDependencia,
    removeDependencia,
    exportar,
    refresh,
  } = useCronograma({ proyectoId });

  // Estado local de UI
  const [viewMode, setViewMode] = useState<ViewMode>('Week');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TareaCronograma | undefined>();
  const [isDependencyModalOpen, setIsDependencyModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Handlers del Gantt
  const handleDateChange = useCallback(
    async (task: Task, start: Date, end: Date) => {
      setIsSaving(true);
      await updateTareaFechas(task.id, start, end);
      setIsSaving(false);
    },
    [updateTareaFechas]
  );

  const handleProgressChange = useCallback(
    async (task: Task, progress: number) => {
      setIsSaving(true);
      await updateTareaProgreso(task.id, progress);
      setIsSaving(false);
    },
    [updateTareaProgreso]
  );

  const handleTaskClick = useCallback(
    (task: Task) => {
      const tarea = tareas.find((t) => t.id === task.id);
      if (tarea) {
        setSelectedTask(tarea);
      }
    },
    [tareas]
  );

  const handleTaskDoubleClick = useCallback(
    (task: Task) => {
      const tarea = tareas.find((t) => t.id === task.id);
      if (tarea) {
        setSelectedTask(tarea);
        setIsTaskModalOpen(true);
      }
    },
    [tareas]
  );

  const handleTaskDelete = useCallback(
    async (task: Task) => {
      const confirmed = window.confirm(
        `Esta seguro de eliminar la tarea "${task.name}"?`
      );
      if (confirmed) {
        await deleteTarea(task.id);
      }
    },
    [deleteTarea]
  );

  // Handlers de modales
  const handleOpenTaskModal = useCallback((tarea?: TareaCronograma) => {
    setSelectedTask(tarea);
    setIsTaskModalOpen(true);
  }, []);

  const handleCloseTaskModal = useCallback(() => {
    setSelectedTask(undefined);
    setIsTaskModalOpen(false);
  }, []);

  const handleSaveTask = useCallback(
    async (data: CreateTareaCronogramaInput | UpdateTareaCronogramaInput) => {
      setIsSaving(true);
      try {
        if (selectedTask) {
          await updateTarea(selectedTask.id, data as UpdateTareaCronogramaInput);
        } else {
          await createTarea(data as CreateTareaCronogramaInput);
        }
      } finally {
        setIsSaving(false);
      }
    },
    [selectedTask, createTarea, updateTarea]
  );

  const handleOpenDependencyModal = useCallback(() => {
    if (selectedTask) {
      setIsDependencyModalOpen(true);
    }
  }, [selectedTask]);

  const handleCloseDependencyModal = useCallback(() => {
    setIsDependencyModalOpen(false);
  }, []);

  // Handlers de exportacion
  const handleExport = useCallback(
    async (formato: FormatoExportacion) => {
      await exportar(formato);
    },
    [exportar]
  );

  // Crear cronograma si no existe
  const handleCreateCronograma = useCallback(async () => {
    setIsSaving(true);
    await createCronograma({
      nombre: `Cronograma - ${proyectoNombre || 'Proyecto'}`,
      descripcion: 'Cronograma del proyecto',
    });
    setIsSaving(false);
  }, [createCronograma, proyectoNombre]);

  // Preparar tareas padre para selector
  const tareasPadre = useMemo(
    () =>
      tareas
        .filter((t) => t.tipo === 'proyecto')
        .map((t) => ({ id: t.id, nombre: t.nombre })),
    [tareas]
  );

  // Obtener dependencias de la tarea seleccionada
  const dependenciasSeleccionadas = useMemo(
    () =>
      selectedTask
        ? dependencias.filter((d) => d.tareaDestinoId === selectedTask.id)
        : [],
    [selectedTask, dependencias]
  );

  // Estado de carga
  if (isLoading && !cronograma) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#004272]" />
          <p className="text-gray-500">Cargando cronograma...</p>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error && !exists) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          No se pudo cargar el cronograma. Por favor, intente nuevamente.
          <Button variant="link" onClick={refresh} className="ml-2 p-0 h-auto">
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Cronograma no existe
  if (!exists) {
    return (
      <Card className="bg-gray-50">
        <CardContent className="py-12 text-center">
          <div className="mx-auto w-16 h-16 bg-[#004272]/10 rounded-full flex items-center justify-center mb-4">
            <Plus className="h-8 w-8 text-[#004272]" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            No hay cronograma para este proyecto
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Cree un cronograma para visualizar y gestionar las tareas del
            proyecto en un diagrama de Gantt interactivo.
          </p>
          <Button
            onClick={handleCreateCronograma}
            disabled={isSaving}
            className="bg-[#004272] hover:bg-[#003156]"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Crear Cronograma
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <GanttToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAddTask={() => handleOpenTaskModal()}
        onExport={handleExport}
        onRefresh={refresh}
        isLoading={isLoading || isSaving}
      />

      {/* Indicador de guardado */}
      {isSaving && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Guardando cambios...
        </div>
      )}

      {/* Grafico Gantt */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <GanttChart
            tareas={tareas}
            viewMode={viewMode}
            showTaskList={true}
            showDependencies={true}
            onDateChange={handleDateChange}
            onProgressChange={handleProgressChange}
            onTaskClick={handleTaskClick}
            onTaskDoubleClick={handleTaskDoubleClick}
            onTaskDelete={handleTaskDelete}
          />
        </CardContent>
      </Card>

      {/* Panel de tarea seleccionada */}
      {selectedTask && !isTaskModalOpen && !isDependencyModalOpen && (
        <Card className="border-[#004272] border-t-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>
                {selectedTask.codigo && `[${selectedTask.codigo}] `}
                {selectedTask.nombre}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenDependencyModal}
                >
                  Dependencias ({dependenciasSeleccionadas.length})
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleOpenTaskModal(selectedTask)}
                  className="bg-[#004272] hover:bg-[#003156]"
                >
                  Editar
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Tipo</p>
                <p className="font-medium capitalize">{selectedTask.tipo}</p>
              </div>
              <div>
                <p className="text-gray-500">Progreso</p>
                <p className="font-medium">{selectedTask.progreso}%</p>
              </div>
              <div>
                <p className="text-gray-500">Inicio</p>
                <p className="font-medium">
                  {new Date(selectedTask.inicio).toLocaleDateString('es-PE')}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Fin</p>
                <p className="font-medium">
                  {new Date(selectedTask.fin).toLocaleDateString('es-PE')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de tarea */}
      <GanttTaskModal
        open={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        onSave={handleSaveTask}
        tarea={selectedTask}
        responsables={responsables}
        tareasPadre={tareasPadre}
        isLoading={isSaving}
      />

      {/* Modal de dependencias */}
      {selectedTask && (
        <DependencySelector
          open={isDependencyModalOpen}
          onClose={handleCloseDependencyModal}
          tareaActual={selectedTask}
          todasLasTareas={tareas}
          dependenciasExistentes={dependenciasSeleccionadas}
          onAddDependencia={addDependencia}
          onRemoveDependencia={removeDependencia}
          isLoading={isSaving}
        />
      )}
    </div>
  );
}
