'use client';

/**
 * CronogramaView Component
 *
 * Vista principal del cronograma que integra todos los componentes
 * Este es un componente cliente que maneja el estado y la interactividad
 */

import { useState, useCallback, useMemo } from 'react';
import { Task } from 'gantt-task-react';
import { Plus, AlertCircle, Loader2, CheckCircle, XCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { GanttChart } from './gantt-chart';
import { GanttToolbar } from './gantt-toolbar';
import { GanttTaskModal } from './gantt-task-modal';
import { DependencySelector } from './dependency-selector';
import { useCronograma } from '../hooks/use-cronograma';
import { aprobarCronograma, enviarARevision, updateTareaEstado } from '../services/cronograma.service';
import type { TareaEstadoCronograma } from '../types';
import { useAuth } from '@/stores';
import { ROLES } from '@/lib/definitions';
import { toast } from '@/lib/hooks/use-toast';
import type {
  ViewMode,
  TareaCronograma,
  FormatoExportacion,
  CreateTareaCronogramaInput,
  UpdateTareaCronogramaInput,
} from '../types';

/**
 * Helper para mostrar fecha YYYY-MM-DD como DD/MM/YYYY sin problemas de timezone
 */
function formatDateDisplay(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  // Si es un string ISO con T, extraer solo la parte de fecha
  const dateOnly = dateStr.split('T')[0];
  const parts = dateOnly.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

interface CronogramaViewProps {
  /** ID del proyecto */
  proyectoId: number | string;
  /** Nombre del proyecto (para mostrar) */
  proyectoNombre?: string;
  /** Lista de responsables disponibles */
  responsables?: { id: number; nombre: string }[];
  /** Fecha de inicio del proyecto (para validación de tareas) */
  proyectoFechaInicio?: string | null;
  /** Fecha de fin del proyecto (para validación de tareas) */
  proyectoFechaFin?: string | null;
  /** Modo solo lectura - cuando el proyecto está finalizado */
  isReadOnly?: boolean;
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
  proyectoFechaInicio,
  proyectoFechaFin,
  isReadOnly = false,
}: CronogramaViewProps) {
  // Obtener usuario y permisos por rol
  const { user } = useAuth();

  // Permisos por rol (alineados con el backend)
  // ADMIN: acceso completo a todo
  // PMO: crear, editar, eliminar, ver, exportar, validar
  // COORDINADOR: crear, editar, eliminar, ver, exportar
  // SCRUM_MASTER: crear, editar, eliminar, ver, exportar (gestión completa)
  // PATROCINADOR: solo ver, exportar, validar (aprobar/rechazar)
  const isAdmin = user?.role === ROLES.ADMIN;
  const isPmo = user?.role === ROLES.PMO;
  const isCoordinador = user?.role === ROLES.COORDINADOR;
  const isScrumMaster = user?.role === ROLES.SCRUM_MASTER;
  const isPatrocinador = user?.role === ROLES.PATROCINADOR;

  // Roles que pueden crear, editar y eliminar tareas del cronograma
  // (debe coincidir con @Roles en backend: ADMIN, PMO, COORDINADOR, SCRUM_MASTER)
  const canManageByRole = isAdmin || isPmo || isCoordinador || isScrumMaster;
  const canValidate = isAdmin || isPmo || isPatrocinador; // aprobar/rechazar

  // Estado del cronograma
  const {
    cronograma,
    tareas,
    dependencias,
    isLoading,
    error,
    exists,
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

  // Estados en los que se permite editar el cronograma
  const ESTADOS_EDITABLES = ['Borrador', 'Rechazado'];
  const isEditable = cronograma ? ESTADOS_EDITABLES.includes(cronograma.estado) : true;

  // Solo puede gestionar si tiene el rol Y el cronograma está en estado editable Y el proyecto no está finalizado
  const canManage = canManageByRole && isEditable && !isReadOnly;

  // Permiso para editar SOLO el estado de las tareas cuando el cronograma está Aprobado
  // Solo ADMIN, SCRUM_MASTER y COORDINADOR pueden editar el estado
  // No aplica si el proyecto está finalizado (isReadOnly)
  const canEditEstadoByRole = isAdmin || isScrumMaster || isCoordinador;
  const canEditEstado = canEditEstadoByRole && cronograma?.estado === 'Aprobado' && !isReadOnly;

  // Estado local de UI
  const [viewMode, setViewMode] = useState<ViewMode>('Week');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TareaCronograma | undefined>();
  const [isDependencyModalOpen, setIsDependencyModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Ya no se crea automáticamente desde el frontend
  // El cronograma se crea automáticamente en el backend cuando se crea el proyecto

  // Estado para validación
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [validationComment, setValidationComment] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  // Estado para confirmación de envío a revisión
  const [isSendToReviewModalOpen, setIsSendToReviewModalOpen] = useState(false);

  // Handlers del Gantt
  const handleDateChange = useCallback(
    async (task: Task, start: Date, end: Date) => {
      if (!canManage) return; // Solo SCRUM_MASTER puede modificar fechas
      setIsSaving(true);
      await updateTareaFechas(task.id, start, end);
      setIsSaving(false);
    },
    [updateTareaFechas, canManage]
  );

  const handleProgressChange = useCallback(
    async (task: Task, progress: number) => {
      if (!canManage) return; // Solo SCRUM_MASTER puede modificar progreso
      setIsSaving(true);
      await updateTareaProgreso(task.id, progress);
      setIsSaving(false);
    },
    [updateTareaProgreso, canManage]
  );

  // Handler para actualizar SOLO el estado de una tarea (funciona cuando cronograma está Aprobado)
  const handleUpdateEstado = useCallback(
    async (tareaId: string, estado: TareaEstadoCronograma) => {
      if (!canEditEstado) return;
      setIsSaving(true);
      try {
        await updateTareaEstado(tareaId, estado);
        toast({
          title: 'Estado actualizado',
          description: `El estado de la tarea se actualizó a "${estado}"`,
        });
        refresh();
      } catch (error) {
        console.error('Error updating task estado:', error);
        toast({
          title: 'Error',
          description: 'No se pudo actualizar el estado de la tarea',
          variant: 'destructive',
        });
      } finally {
        setIsSaving(false);
      }
    },
    [canEditEstado, refresh]
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
      if (!canManage) return; // Solo SCRUM_MASTER puede editar
      const tarea = tareas.find((t) => t.id === task.id);
      if (tarea) {
        setSelectedTask(tarea);
        setIsTaskModalOpen(true);
      }
    },
    [tareas, canManage]
  );

  const handleTaskDelete = useCallback(
    async (task: Task) => {
      if (!canManage) return; // Solo SCRUM_MASTER puede eliminar
      const confirmed = window.confirm(
        `Esta seguro de eliminar la tarea "${task.name}"?`
      );
      if (confirmed) {
        await deleteTarea(task.id);
      }
    },
    [deleteTarea, canManage]
  );

  // Handler de validación
  const handleValidate = useCallback(() => {
    setIsValidationModalOpen(true);
  }, []);

  // Handler para abrir modal de confirmación de envío a revisión
  const handleSendToReviewClick = useCallback(() => {
    setIsSendToReviewModalOpen(true);
  }, []);

  // Handler de enviar a revisión (confirmado)
  const handleSendToReviewConfirm = useCallback(async () => {
    if (!cronograma?.id) return;

    setIsSaving(true);
    try {
      await enviarARevision(cronograma.id);
      toast({
        title: 'Enviado a revisión',
        description: 'El cronograma ha sido enviado para revisión. Se ha notificado al PMO y Patrocinador para su aprobación.',
      });
      setIsSendToReviewModalOpen(false);
      refresh();
    } catch (error) {
      console.error('Error sending cronograma to review:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar el cronograma a revisión',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [cronograma?.id, refresh]);

  const handleValidationSubmit = useCallback(
    async (aprobado: boolean) => {
      if (!cronograma?.id) return;

      setIsValidating(true);
      try {
        await aprobarCronograma(cronograma.id, {
          aprobado,
          comentario: validationComment.trim() || undefined,
        });
        toast({
          title: aprobado ? 'Cronograma aprobado' : 'Cronograma rechazado',
          description: aprobado
            ? 'El cronograma ha sido aprobado correctamente'
            : 'El cronograma ha sido rechazado',
          variant: aprobado ? 'default' : 'destructive',
        });
        setIsValidationModalOpen(false);
        setValidationComment('');
        refresh();
      } catch (error) {
        console.error('Error validating cronograma:', error);
        toast({
          title: 'Error',
          description: 'No se pudo procesar la validación del cronograma',
          variant: 'destructive',
        });
      } finally {
        setIsValidating(false);
      }
    },
    [cronograma?.id, validationComment, refresh]
  );

  // Handlers de modales
  const handleOpenTaskModal = useCallback((tarea?: TareaCronograma) => {
    if (!canManage) return; // Solo SCRUM_MASTER puede abrir modal de edición
    setSelectedTask(tarea);
    setIsTaskModalOpen(true);
  }, [canManage]);

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

  // Preparar tareas padre para selector (todas las tareas excepto la seleccionada)
  const tareasPadre = useMemo(
    () =>
      tareas
        // Excluir la tarea actual (si está editando) para evitar referencias circulares
        .filter((t) => !selectedTask || t.id !== selectedTask.id)
        .map((t) => ({
          id: t.id,
          nombre: t.codigo ? `${t.codigo} - ${t.nombre}` : t.nombre,
        })),
    [tareas, selectedTask]
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

  // Cronograma no existe (el cronograma se crea automáticamente con el proyecto)
  if (!exists && !isLoading) {
    return (
      <Card className="bg-gray-50">
        <CardContent className="py-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Cronograma no disponible
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            El cronograma de este proyecto aún no está disponible.
            Si el proyecto fue creado recientemente, intente recargar.
          </p>
          <Button variant="outline" onClick={refresh}>
            Recargar
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
        onValidate={handleValidate}
        onSendToReview={handleSendToReviewClick}
        isLoading={isLoading || isSaving}
        canAddTask={canManage}
        canValidate={canValidate}
        canSendToReview={canManageByRole}
        // Mostrar botón validar solo cuando:
        // - Estado es 'En revisión'
        // - El usuario tiene rol de validador (PMO o PATROCINADOR o ADMIN)
        // - Aún hay algo pendiente de aprobar para ese rol
        showValidateButton={
          cronograma?.estado === 'En revisión' && (
            // PMO puede validar si aún no aprobó
            (isPmo && !cronograma?.aprobadoPorPmo) ||
            // PATROCINADOR puede validar si aún no aprobó
            (isPatrocinador && !cronograma?.aprobadoPorPatrocinador) ||
            // ADMIN puede validar si falta alguna aprobación
            (isAdmin && (!cronograma?.aprobadoPorPmo || !cronograma?.aprobadoPorPatrocinador))
          )
        }
        // Mostrar botón enviar a revisión solo cuando estado es 'Borrador' Y hay tareas
        showSendToReviewButton={canManageByRole && cronograma?.estado === 'Borrador' && tareas.length > 0}
        // PMO y PATROCINADOR pueden exportar
        showExportButton={true}
      />

      {/* Indicador de guardado */}
      {isSaving && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Guardando cambios...
        </div>
      )}

      {/* Estado de aprobación (mostrar cuando está en revisión) */}
      {cronograma?.estado === 'En revisión' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h4 className="font-medium text-amber-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Cronograma en Revisión
                </h4>
                <p className="text-sm text-amber-700 mt-1">
                  Pendiente de aprobación por PMO y Patrocinador.
                  <strong className="block mt-1">Las ediciones están bloqueadas hasta que sea aprobado o rechazado.</strong>
                </p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  {cronograma.aprobadoPorPmo ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-amber-400" />
                  )}
                  <span className={`text-sm font-medium ${cronograma.aprobadoPorPmo ? 'text-green-700' : 'text-amber-700'}`}>
                    PMO
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {cronograma.aprobadoPorPatrocinador ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-amber-400" />
                  )}
                  <span className={`text-sm font-medium ${cronograma.aprobadoPorPatrocinador ? 'text-green-700' : 'text-amber-700'}`}>
                    Patrocinador
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensaje de rechazo (si fue rechazado y volvió a borrador) */}
      {cronograma?.estado === 'Borrador' && cronograma.comentarioRechazo && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Cronograma Rechazado</AlertTitle>
          <AlertDescription>
            <p className="mb-2">{cronograma.comentarioRechazo}</p>
            <p className="text-xs">Corrija las observaciones y vuelva a enviar a revisión.</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Cronograma aprobado */}
      {cronograma?.estado === 'Aprobado' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <div>
                <span className="font-medium">Cronograma Aprobado</span>
                <span className="text-sm text-green-600 ml-2">
                  - Aprobado por PMO y Patrocinador
                </span>
                <p className="text-sm text-green-700 mt-1">
                  El cronograma está en ejecución. Solo el <strong>estado</strong> de las tareas puede editarse.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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
            onEditTask={handleTaskDoubleClick}
            canManage={canManage}
            canEditEstado={canEditEstado}
            onUpdateEstado={handleUpdateEstado}
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
                {canManage && (
                  <>
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
                  </>
                )}
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
                  {formatDateDisplay(selectedTask.inicio)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Fin</p>
                <p className="font-medium">
                  {formatDateDisplay(selectedTask.fin)}
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
        codigosExistentes={tareas.map(t => t.codigo)}
        proyectoFechaInicio={proyectoFechaInicio}
        proyectoFechaFin={proyectoFechaFin}
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

      {/* Modal de validación */}
      <Dialog open={isValidationModalOpen} onOpenChange={setIsValidationModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Validar Cronograma
            </DialogTitle>
            <DialogDescription>
              Revise el cronograma y decida si aprobarlo o rechazarlo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="validation-comment">
                Comentario (opcional para aprobar, requerido para rechazar)
              </Label>
              <Textarea
                id="validation-comment"
                placeholder="Ingrese un comentario o motivo de rechazo..."
                value={validationComment}
                onChange={(e) => setValidationComment(e.target.value)}
                disabled={isValidating}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsValidationModalOpen(false);
                setValidationComment('');
              }}
              disabled={isValidating}
              className="sm:order-1"
            >
              Cancelar
            </Button>
            <div className="flex gap-2 w-full sm:w-auto sm:order-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (!validationComment.trim()) {
                    toast({
                      title: 'Error',
                      description: 'Debe ingresar un comentario para rechazar',
                      variant: 'destructive',
                    });
                    return;
                  }
                  handleValidationSubmit(false);
                }}
                disabled={isValidating}
                className="flex-1 sm:flex-none"
              >
                {isValidating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Rechazar
              </Button>
              <Button
                type="button"
                onClick={() => handleValidationSubmit(true)}
                disabled={isValidating}
                className="flex-1 sm:flex-none"
              >
                {isValidating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Aprobar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación de envío a revisión */}
      <Dialog open={isSendToReviewModalOpen} onOpenChange={setIsSendToReviewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-[#004272]" />
              Enviar Cronograma a Revisión
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro de enviar el cronograma a revisión?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Proceso de Aprobación</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Se notificará al <strong>PMO</strong> y <strong>Patrocinador</strong></li>
                <li>• <strong>Ambos</strong> deben aprobar el cronograma</li>
                <li>• Si es rechazado, volverá a estado <strong>Borrador</strong> para correcciones</li>
                <li>• Cuando ambos aprueben, el estado será <strong>Aprobado</strong></li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSendToReviewModalOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSendToReviewConfirm}
              disabled={isSaving}
              className="bg-[#004272] hover:bg-[#003156]"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar a Revisión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
