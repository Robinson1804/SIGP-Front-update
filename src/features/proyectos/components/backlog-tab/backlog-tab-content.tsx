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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { HistoriaDetailModal } from './components/historia-detail-modal';
import { EpicaForm } from './components/epicas/epica-form';
import { SprintPlanningView } from './components/sprints/sprint-planning-view';
import { CerrarSprintModal } from './components/sprints/cerrar-sprint-modal';
import {
  type HistoriaUsuario,
  deleteHistoria,
} from '@/features/proyectos/services/historias.service';
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
}

const subTabs: { id: SubTab; label: string; icon: React.ElementType }[] = [
  { id: 'backlog', label: 'Backlog', icon: LayoutList },
  { id: 'epicas', label: 'Epicas', icon: Layers },
  { id: 'sprints', label: 'Sprints', icon: Calendar },
  { id: 'tablero', label: 'Tablero', icon: Kanban },
  { id: 'daily', label: 'Daily', icon: Users },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
];

export function BacklogTabContent({ proyectoId }: BacklogTabContentProps) {
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

  const handleAssignToSprint = (historiaIds: number[]) => {
    setHistoriasToAssign(historiaIds);
    setIsAssignModalOpen(true);
  };

  const handleCreateSprint = () => {
    setIsSprintModalOpen(true);
  };

  const handleIniciarSprint = async (sprintId: number) => {
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
  };

  // Get available sprints for assignment (non-completed)
  const availableSprints = sprints.filter((s) => s.estado !== 'Completado');

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
      {/* Header with sub-tabs */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <LayoutList className="h-6 w-6 text-gray-700" />
          Product Backlog
        </h3>
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
          onSprintPlanning={goToSprintPlanning}
          onRefresh={refresh}
        />
      )}

      {currentSubTab === 'tablero' && (
        <TableroView
          proyectoId={proyectoId}
          onCreateHistoria={handleCreateHistoria}
          onEditHistoria={handleEditHistoria}
          onViewHistoria={handleViewHistoria}
        />
      )}

      {currentSubTab === 'daily' && (
        <DailyView proyectoId={proyectoId} sprints={sprints} />
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
      />

      <SprintFormModal
        open={isSprintModalOpen}
        onOpenChange={setIsSprintModalOpen}
        proyectoId={proyectoId}
        onSuccess={handleSprintSuccess}
      />

      <SprintAssignModal
        open={isAssignModalOpen}
        onOpenChange={setIsAssignModalOpen}
        historiaIds={historiasToAssign}
        sprints={availableSprints}
        onSuccess={handleAssignSuccess}
      />

      {viewingHistoria && (
        <HistoriaDetailModal
          open={isDetailModalOpen}
          onOpenChange={setIsDetailModalOpen}
          historia={viewingHistoria}
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
        />
      )}

      {/* Delete confirmation */}
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
    </div>
  );
}
