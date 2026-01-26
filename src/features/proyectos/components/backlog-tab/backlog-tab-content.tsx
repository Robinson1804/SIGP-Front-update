'use client';

import { useState } from 'react';
import {
  LayoutList,
  Kanban,
  BarChart3,
  Layers,
  Calendar,
  Users,
  ArrowLeft,
  Info,
  CheckCircle2,
  ListChecks,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useBacklogData } from './hooks/use-backlog-data';
import { BacklogView } from './sub-tabs/backlog-view';
import { TableroView } from './sub-tabs/tablero-view';
import { DashboardView } from './sub-tabs/dashboard-view';
import { EpicasView } from './sub-tabs/epicas-view';
import { SprintsView } from './sub-tabs/sprints-view';
import { DailyView } from './sub-tabs/daily-view';
import { HistoriaFormModal } from './components/historia-form-modal';
import { SprintFormModal } from './components/sprint-form-modal';
import { SprintAssignModal } from './components/sprint-assign-modal';
import { SprintDeleteModal } from './components/sprint-delete-modal';
import { HistoriaDetailModal } from './components/historia-detail-modal';
import { TareaFormModal } from './components/tarea-form-modal';
import { ValidarHuModal } from './components/validar-hu-modal';
import { EpicaForm } from './components/epicas/epica-form';
import { SprintPlanningView } from './components/sprints/sprint-planning-view';
import { CerrarSprintModal } from './components/sprints/cerrar-sprint-modal';
import { FinalizarProyectoModal } from './components/sprints/finalizar-proyecto-modal';
import {
  type HistoriaUsuario,
  deleteHistoria,
} from '@/features/proyectos/services/historias.service';
import {
  type Tarea,
  deleteTarea,
} from '@/features/proyectos/services/tareas.service';
import { iniciarSprint } from '@/features/proyectos/services/sprints.service';
import type { Epica, Sprint } from '@/features/proyectos/types';
import { cn } from '@/lib/utils';

// State-driven Navigation Types
type SubTab = 'backlog' | 'epicas' | 'sprints' | 'tablero' | 'daily' | 'dashboard';

type BacklogView =
  // Main subtabs (list views)
  | { type: 'list'; subTab: SubTab }
  // Epica views
  | { type: 'nueva-epica' }
  | { type: 'editar-epica'; epica: Epica }
  // Sprint views
  | { type: 'nuevo-sprint' }
  | { type: 'editar-sprint'; sprint: Sprint }
  | { type: 'sprint-planning'; sprint: Sprint }
  | { type: 'cerrar-sprint'; sprint: Sprint };

interface BacklogTabContentProps {
  proyectoId: number;
  /** Fecha inicio del proyecto (para validación de historias) */
  proyectoFechaInicio?: string | null;
  /** Fecha fin del proyecto (para validación de historias) */
  proyectoFechaFin?: string | null;
  /** Estado del proyecto - cuando es 'Finalizado' se deshabilita la edición */
  proyectoEstado?: 'Pendiente' | 'En planificación' | 'En desarrollo' | 'Finalizado';
}

const subTabs: { id: SubTab; label: string; icon: React.ElementType }[] = [
  { id: 'backlog', label: 'Backlog', icon: LayoutList },
  { id: 'epicas', label: 'Epicas', icon: Layers },
  { id: 'sprints', label: 'Sprints', icon: Calendar },
  { id: 'tablero', label: 'Tablero', icon: Kanban },
  { id: 'daily', label: 'Daily', icon: Users },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
];

export function BacklogTabContent({ proyectoId, proyectoFechaInicio, proyectoFechaFin, proyectoEstado }: BacklogTabContentProps) {
  // Check if project is finalized (editing disabled)
  const isProyectoFinalizado = proyectoEstado === 'Finalizado';

  // State-driven navigation
  const [currentView, setCurrentView] = useState<BacklogView>({
    type: 'list',
    subTab: 'backlog',
  });

  // Data hook
  const {
    sprints,
    backlogHistorias,
    epicas,
    equipo,
    isLoading,
    error,
    refresh,
    refreshBacklog,
  } = useBacklogData(proyectoId);

  // Modal states (for modals that overlay the current view)
  const [isHistoriaModalOpen, setIsHistoriaModalOpen] = useState(false);
  const [editingHistoria, setEditingHistoria] = useState<HistoriaUsuario | null>(null);
  const [targetSprintId, setTargetSprintId] = useState<number | undefined>(undefined);

  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [historiasToAssign, setHistoriasToAssign] = useState<number[]>([]);

  const [viewingHistoria, setViewingHistoria] = useState<HistoriaUsuario | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [deletingHistoria, setDeletingHistoria] = useState<HistoriaUsuario | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isCerrarSprintModalOpen, setIsCerrarSprintModalOpen] = useState(false);
  const [sprintToCerrar, setSprintToCerrar] = useState<Sprint | null>(null);
  const [isFinalizarProyectoModalOpen, setIsFinalizarProyectoModalOpen] = useState(false);

  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [isDeleteSprintModalOpen, setIsDeleteSprintModalOpen] = useState(false);
  const [sprintToDelete, setSprintToDelete] = useState<Sprint | null>(null);

  // Tarea modal state
  const [isTareaModalOpen, setIsTareaModalOpen] = useState(false);
  const [selectedHistoriaForTarea, setSelectedHistoriaForTarea] = useState<number | null>(null);
  const [editingTarea, setEditingTarea] = useState<Tarea | null>(null);
  const [deletingTarea, setDeletingTarea] = useState<Tarea | null>(null);
  const [isDeletingTarea, setIsDeletingTarea] = useState(false);
  const [tareasRefreshKey, setTareasRefreshKey] = useState(0);

  // Validar HU modal state
  const [isValidarHuModalOpen, setIsValidarHuModalOpen] = useState(false);
  const [historiaParaValidar, setHistoriaParaValidar] = useState<HistoriaUsuario | null>(null);

  // Info modal state
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Error modal state for active sprint
  const [isActiveSprintErrorModalOpen, setIsActiveSprintErrorModalOpen] = useState(false);
  const [activeSprintName, setActiveSprintName] = useState<string>('');

  // Navigation helpers
  const goToList = (subTab: SubTab) => {
    setCurrentView({ type: 'list', subTab });
  };

  const goToNuevaEpica = () => {
    setCurrentView({ type: 'nueva-epica' });
  };

  const goToEditarEpica = (epica: Epica) => {
    setCurrentView({ type: 'editar-epica', epica });
  };

  const goToSprintPlanning = (sprint: Sprint) => {
    setCurrentView({ type: 'sprint-planning', sprint });
  };

  const goToCerrarSprint = (sprint: Sprint) => {
    setSprintToCerrar(sprint);
    setIsCerrarSprintModalOpen(true);
  };

  // Handlers
  const handleCreateHistoria = (sprintId?: number) => {
    setEditingHistoria(null);
    setTargetSprintId(sprintId);
    setIsHistoriaModalOpen(true);
  };

  const handleEditHistoria = (historia: HistoriaUsuario) => {
    setEditingHistoria(historia);
    setTargetSprintId(historia.sprintId || undefined);
    setIsHistoriaModalOpen(true);
  };

  const handleViewHistoria = (historia: HistoriaUsuario) => {
    setViewingHistoria(historia);
    setIsDetailModalOpen(true);
  };

  const handleDeleteHistoria = (historia: HistoriaUsuario) => {
    setDeletingHistoria(historia);
  };

  const confirmDeleteHistoria = async () => {
    if (!deletingHistoria) return;

    try {
      setIsDeleting(true);
      await deleteHistoria(deletingHistoria.id);
      setDeletingHistoria(null);
      refresh();
    } catch (err) {
      console.error('Error deleting historia:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Tarea handlers
  const handleCreateTarea = (historiaId: number) => {
    setEditingTarea(null);
    setSelectedHistoriaForTarea(historiaId);
    setIsTareaModalOpen(true);
  };

  const handleEditTarea = (tarea: Tarea) => {
    setEditingTarea(tarea);
    setSelectedHistoriaForTarea(tarea.historiaUsuarioId);
    setIsTareaModalOpen(true);
  };

  const handleDeleteTarea = (tarea: Tarea) => {
    setDeletingTarea(tarea);
  };

  const confirmDeleteTarea = async () => {
    if (!deletingTarea) return;

    try {
      setIsDeletingTarea(true);
      await deleteTarea(deletingTarea.id);
      setDeletingTarea(null);
      setTareasRefreshKey((prev) => prev + 1);
      refresh();
    } catch (err) {
      console.error('Error deleting tarea:', err);
    } finally {
      setIsDeletingTarea(false);
    }
  };

  const handleTareaSuccess = () => {
    setIsTareaModalOpen(false);
    setSelectedHistoriaForTarea(null);
    setEditingTarea(null);
    setTareasRefreshKey((prev) => prev + 1);  // Refresh expanded tareas in historia table
    refresh();
  };

  // Validar HU handlers
  const handleVerDocumento = (historia: HistoriaUsuario) => {
    if (historia.documentoEvidenciasUrl) {
      window.open(historia.documentoEvidenciasUrl, '_blank');
    }
  };

  const handleValidarHu = (historia: HistoriaUsuario) => {
    setHistoriaParaValidar(historia);
    setIsValidarHuModalOpen(true);
  };

  const handleValidarHuSuccess = () => {
    setIsValidarHuModalOpen(false);
    setHistoriaParaValidar(null);
    refresh();
  };

  const handleAssignToSprint = (historiaIds: number[]) => {
    setHistoriasToAssign(historiaIds);
    setIsAssignModalOpen(true);
  };

  const handleCreateSprint = () => {
    setEditingSprint(null);
    setIsSprintModalOpen(true);
  };

  const handleEditSprint = (sprint: Sprint) => {
    setEditingSprint(sprint);
    setIsSprintModalOpen(true);
  };

  const handleDeleteSprint = (sprint: Sprint) => {
    setSprintToDelete(sprint);
    setIsDeleteSprintModalOpen(true);
  };

  const handleIniciarSprint = async (sprintId: number) => {
    // Check if there's already an active sprint
    const activeSprint = sprints.find((s) => s.estado === 'En progreso');
    if (activeSprint) {
      setActiveSprintName(activeSprint.nombre);
      setIsActiveSprintErrorModalOpen(true);
      return;
    }

    try {
      await iniciarSprint(sprintId);
      refresh();
    } catch (err) {
      console.error('Error starting sprint:', err);
    }
  };

  const handleHistoriaSuccess = () => {
    setIsHistoriaModalOpen(false);
    setEditingHistoria(null);
    setTargetSprintId(undefined);
    refresh();
  };

  const handleSprintSuccess = () => {
    setIsSprintModalOpen(false);
    setEditingSprint(null);
    refresh();
  };

  const handleDeleteSprintSuccess = () => {
    setIsDeleteSprintModalOpen(false);
    setSprintToDelete(null);
    refresh();
  };

  const handleAssignSuccess = () => {
    setIsAssignModalOpen(false);
    setHistoriasToAssign([]);
    refresh();
  };

  const handleEpicaSuccess = () => {
    goToList('epicas');
    refresh();
  };

  const handleCerrarSprintSuccess = () => {
    setIsCerrarSprintModalOpen(false);
    setSprintToCerrar(null);
    refresh();
    // El modal de finalizar proyecto se muestra via onAllSprintsFinalized callback
    // solo cuando todos los sprints estan finalizados
  };

  const handleFinalizarProyectoComplete = (finalized: boolean) => {
    setIsFinalizarProyectoModalOpen(false);
    refresh();
    // Si se finalizo el proyecto, podriamos redirigir o mostrar mensaje
    if (finalized) {
      // El proyecto fue finalizado - refresh cargara el nuevo estado
    }
  };

  // Get available sprints for assignment (non-completed)
  const availableSprints = sprints.filter((s) => s.estado !== 'Finalizado' && s.estado !== 'Completado');

  // Get current subtab from view state
  const currentSubTab = currentView.type === 'list' ? currentView.subTab : 'backlog';

  // Render back button for internal views
  const renderBackButton = (label: string, targetSubTab: SubTab) => (
    <Button variant="ghost" size="sm" onClick={() => goToList(targetSubTab)} className="gap-2">
      <ArrowLeft className="h-4 w-4" />
      Volver a {label}
    </Button>
  );

  // Render internal views (non-list views)
  if (currentView.type === 'nueva-epica') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          {renderBackButton('Epicas', 'epicas')}
          <h3 className="text-xl font-bold">Nueva Epica</h3>
        </div>
        <EpicaForm
          proyectoId={proyectoId}
          onSuccess={handleEpicaSuccess}
          onCancel={() => goToList('epicas')}
          proyectoFechaInicio={proyectoFechaInicio}
          proyectoFechaFin={proyectoFechaFin}
        />
      </div>
    );
  }

  if (currentView.type === 'editar-epica') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          {renderBackButton('Epicas', 'epicas')}
          <h3 className="text-xl font-bold">Editar Epica: {currentView.epica.nombre}</h3>
        </div>
        <EpicaForm
          proyectoId={proyectoId}
          epica={currentView.epica}
          onSuccess={handleEpicaSuccess}
          onCancel={() => goToList('epicas')}
          proyectoFechaInicio={proyectoFechaInicio}
          proyectoFechaFin={proyectoFechaFin}
        />
      </div>
    );
  }

  if (currentView.type === 'sprint-planning') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          {renderBackButton('Sprints', 'sprints')}
          <h3 className="text-xl font-bold">Sprint Planning: {currentView.sprint.nombre}</h3>
        </div>
        <SprintPlanningView
          proyectoId={proyectoId}
          sprint={currentView.sprint}
          backlogHistorias={backlogHistorias}
          onSuccess={() => {
            goToList('sprints');
            refresh();
          }}
        />
      </div>
    );
  }

  // Main list view
  return (
    <div className="space-y-6">
      {/* Warning banner when project is finalized */}
      {isProyectoFinalizado && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-800">Proyecto Finalizado</p>
            <p className="text-sm text-amber-700">
              Este proyecto ha sido finalizado. El backlog esta en modo de solo lectura.
            </p>
          </div>
        </div>
      )}

      {/* Header with sub-tabs */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <LayoutList className="h-6 w-6 text-gray-700" />
          Product Backlog
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsInfoModalOpen(true)}
          className="gap-2 text-[#018CD1] border-[#018CD1] hover:bg-[#018CD1]/10"
        >
          <Info className="h-4 w-4" />
          Flujo de trabajo
        </Button>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-2 border-b">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentSubTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => goToList(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                isActive
                  ? 'border-[#018CD1] text-[#018CD1]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Sub-tab content */}
      {currentSubTab === 'backlog' && (
        <BacklogView
          sprints={sprints}
          backlogHistorias={backlogHistorias}
          epicas={epicas}
          equipo={equipo}
          isLoading={isLoading}
          error={error}
          onRefresh={refresh}
          onCreateHistoria={handleCreateHistoria}
          onEditHistoria={handleEditHistoria}
          onViewHistoria={handleViewHistoria}
          onDeleteHistoria={handleDeleteHistoria}
          onAssignToSprint={handleAssignToSprint}
          onCreateSprint={handleCreateSprint}
          onIniciarSprint={handleIniciarSprint}
          onEditSprint={handleEditSprint}
          onDeleteSprint={handleDeleteSprint}
          onCreateTarea={handleCreateTarea}
          onEditTarea={handleEditTarea}
          onDeleteTarea={handleDeleteTarea}
          tareasRefreshKey={tareasRefreshKey}
          onVerDocumento={handleVerDocumento}
          onValidarHu={handleValidarHu}
          isReadOnly={isProyectoFinalizado}
        />
      )}

      {currentSubTab === 'epicas' && (
        <EpicasView
          proyectoId={proyectoId}
          epicas={epicas}
          isLoading={isLoading}
          onCreateEpica={goToNuevaEpica}
          onEditEpica={goToEditarEpica}
          onRefresh={refresh}
          isReadOnly={isProyectoFinalizado}
        />
      )}

      {currentSubTab === 'sprints' && (
        <SprintsView
          proyectoId={proyectoId}
          sprints={sprints}
          isLoading={isLoading}
          onCreateSprint={handleCreateSprint}
          onIniciarSprint={handleIniciarSprint}
          onCerrarSprint={goToCerrarSprint}
          isReadOnly={isProyectoFinalizado}
          onSprintPlanning={goToSprintPlanning}
          onEditSprint={handleEditSprint}
          onDeleteSprint={handleDeleteSprint}
          onRefresh={refresh}
        />
      )}

      {currentSubTab === 'tablero' && (
        <TableroView
          proyectoId={proyectoId}
          onCreateHistoria={handleCreateHistoria}
          onEditHistoria={handleEditHistoria}
          onViewHistoria={handleViewHistoria}
          onDeleteHistoria={handleDeleteHistoria}
          proyectoFechaInicio={proyectoFechaInicio}
          proyectoFechaFin={proyectoFechaFin}
          isReadOnly={isProyectoFinalizado}
        />
      )}

      {currentSubTab === 'daily' && (
        <DailyView proyectoId={proyectoId} sprints={sprints} equipo={equipo} />
      )}

      {currentSubTab === 'dashboard' && <DashboardView proyectoId={proyectoId} />}

      {/* Modals */}
      <HistoriaFormModal
        open={isHistoriaModalOpen}
        onOpenChange={setIsHistoriaModalOpen}
        proyectoId={proyectoId}
        historia={editingHistoria}
        sprintId={targetSprintId}
        onSuccess={handleHistoriaSuccess}
        proyectoFechaInicio={proyectoFechaInicio}
        proyectoFechaFin={proyectoFechaFin}
      />

      <SprintFormModal
        open={isSprintModalOpen}
        onOpenChange={setIsSprintModalOpen}
        proyectoId={proyectoId}
        onSuccess={handleSprintSuccess}
        proyectoFechaInicio={proyectoFechaInicio}
        proyectoFechaFin={proyectoFechaFin}
        isFirstSprint={sprints.length === 0}
        sprint={editingSprint}
        existingSprints={sprints}
      />

      <SprintAssignModal
        open={isAssignModalOpen}
        onOpenChange={setIsAssignModalOpen}
        historiaIds={historiasToAssign}
        sprints={availableSprints}
        onSuccess={handleAssignSuccess}
        historias={backlogHistorias}
      />

      {viewingHistoria && (
        <HistoriaDetailModal
          open={isDetailModalOpen}
          onOpenChange={setIsDetailModalOpen}
          historia={viewingHistoria}
          equipo={equipo}
          onEdit={() => {
            setIsDetailModalOpen(false);
            handleEditHistoria(viewingHistoria);
          }}
        />
      )}

      {sprintToCerrar && (
        <CerrarSprintModal
          open={isCerrarSprintModalOpen}
          onOpenChange={setIsCerrarSprintModalOpen}
          sprint={sprintToCerrar}
          onSuccess={handleCerrarSprintSuccess}
          allSprints={sprints}
          onAllSprintsFinalized={() => setIsFinalizarProyectoModalOpen(true)}
        />
      )}

      {/* Modal para preguntar si finalizar el proyecto despues de cerrar sprint */}
      <FinalizarProyectoModal
        open={isFinalizarProyectoModalOpen}
        onOpenChange={setIsFinalizarProyectoModalOpen}
        proyectoId={proyectoId}
        onSuccess={handleFinalizarProyectoComplete}
      />

      <SprintDeleteModal
        open={isDeleteSprintModalOpen}
        onOpenChange={setIsDeleteSprintModalOpen}
        sprint={sprintToDelete}
        onSuccess={handleDeleteSprintSuccess}
      />

      {/* Tarea Form Modal */}
      {selectedHistoriaForTarea && (
        <TareaFormModal
          open={isTareaModalOpen}
          onOpenChange={(open) => {
            setIsTareaModalOpen(open);
            if (!open) {
              setSelectedHistoriaForTarea(null);
              setEditingTarea(null);
            }
          }}
          historiaUsuarioId={selectedHistoriaForTarea}
          tarea={editingTarea}
          onSuccess={handleTareaSuccess}
        />
      )}

      {/* Validar HU Modal */}
      {historiaParaValidar && (
        <ValidarHuModal
          open={isValidarHuModalOpen}
          onOpenChange={(open) => {
            setIsValidarHuModalOpen(open);
            if (!open) {
              setHistoriaParaValidar(null);
            }
          }}
          historia={historiaParaValidar}
          onSuccess={handleValidarHuSuccess}
        />
      )}

      {/* Delete confirmation for Historia */}
      <AlertDialog open={!!deletingHistoria} onOpenChange={() => setDeletingHistoria(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Historia de Usuario</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion eliminara la historia &quot;{deletingHistoria?.titulo}&quot; y todas
              sus tareas asociadas. Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteHistoria}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation for Tarea */}
      <AlertDialog open={!!deletingTarea} onOpenChange={() => setDeletingTarea(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Tarea</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion eliminara la tarea &quot;{deletingTarea?.nombre}&quot; permanentemente.
              Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingTarea}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTarea}
              disabled={isDeletingTarea}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingTarea ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal informativo de flujo de trabajo HU */}
      <Dialog open={isInfoModalOpen} onOpenChange={setIsInfoModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#0a4a6e] flex items-center gap-2">
              <Info className="h-5 w-5" />
              Flujo de Historias de Usuario
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Paso 1 */}
            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#018CD1] flex items-center justify-center text-white font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-[#018CD1]" />
                  Agrega Tareas
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Toda Historia de Usuario debe tener al menos una tarea asignada.
                </p>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-amber-600" />
                  Finaliza Tareas
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Cada tarea requiere evidencia (Imagen) para ser finalizada.
                </p>
              </div>
            </div>

            {/* Paso 3 */}
            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Completa HU
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  La Historia de Usuario se finaliza automáticamente al completar todas sus tareas con evidencias.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsInfoModalOpen(false)}
              className="w-full bg-[#018CD1] hover:bg-[#0179b5]"
            >
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de error: Ya existe un sprint activo */}
      <AlertDialog open={isActiveSprintErrorModalOpen} onOpenChange={setIsActiveSprintErrorModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              No se puede iniciar el sprint
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700">
              Ya existe un sprint activo <strong>&quot;{activeSprintName}&quot;</strong> para este proyecto.
              <br /><br />
              Debe cerrar el sprint activo antes de iniciar uno nuevo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setIsActiveSprintErrorModalOpen(false)}
              className="bg-[#018CD1] hover:bg-[#0179b5]"
            >
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
