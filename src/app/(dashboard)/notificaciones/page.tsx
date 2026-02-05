"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BellRing, Loader2, RefreshCw, Trash2 } from 'lucide-react';

import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MODULES, ROLES } from '@/lib/definitions';
import { paths } from '@/lib/paths';
import { ProtectedRoute } from "@/features/auth";
import { useAuth } from '@/stores';
import { useToast } from '@/lib/hooks/use-toast';
import {
  getNotificaciones,
  getNotificacionesAgrupadasPorProyecto,
  getNotificacionesAgrupadasPorSprint,
  marcarNotificacionLeida,
  marcarTodasLeidas,
  marcarTodasLeidasPorProyecto,
  bulkDeleteNotificaciones,
  bulkDeleteByProyectos,
  type ProyectoGroup,
  type SprintGroup,
} from '@/lib/services/notificaciones.service';
import {
  NotificationCard,
  mapBackendNotification,
  type LocalNotification,
  type NotificationType,
} from './components/notification-card';
import { ProyectoBlockList } from './components/proyecto-block-list';
import { SprintBlockList } from './components/sprint-block-list';
import { NotificationList } from './components/notification-list';
import { DeleteToolbar } from './components/delete-toolbar';
import { ObservacionDialog } from './components/observacion-dialog';
import { PaginationControls } from './components/pagination-controls';

const PAGE_SIZE = 5;

// Navigation state types
type NavLevel =
  | { level: 'proyectos' }
  | { level: 'sprints'; proyectoId: number; proyectoNombre: string; proyectoCodigo: string }
  | { level: 'notificaciones'; proyectoId: number; proyectoNombre: string; proyectoCodigo: string; sprintId?: number; sprintNombre?: string };

// Tab types for different sections
type TabName = 'Proyectos' | 'Sprints' | 'Aprobaciones' | 'Validaciones';

interface TabDefinition {
  name: TabName;
  types?: NotificationType[];
  drillDown: 'project-only' | 'project-sprint' | 'flat';
}

const TAB_DEFINITIONS: TabDefinition[] = [
  { name: 'Proyectos', drillDown: 'project-only' },
  { name: 'Sprints', drillDown: 'project-sprint' },
  { name: 'Aprobaciones', types: ['aprobacion'], drillDown: 'flat' },
  { name: 'Validaciones', types: ['validacion', 'hu_revision', 'hu_validated', 'hu_rejected'], drillDown: 'flat' },
];

function getTabsForRole(role?: string): TabDefinition[] {
  if (role === ROLES.SCRUM_MASTER || role === ROLES.COORDINADOR || role === ROLES.PMO) {
    return TAB_DEFINITIONS;
  }
  if (role === ROLES.PATROCINADOR) {
    return TAB_DEFINITIONS.filter(tab => tab.name !== 'Sprints');
  }
  return TAB_DEFINITIONS.filter(tab => tab.name === 'Proyectos');
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  // Tab state
  const TABS = getTabsForRole(user?.role);
  const [activeTab, setActiveTab] = useState<TabName>(TABS[0]?.name || 'Proyectos');

  // Navigation drill-down state
  const [navStack, setNavStack] = useState<NavLevel>({ level: 'proyectos' });

  // Data state
  const [proyectoGroups, setProyectoGroups] = useState<ProyectoGroup[]>([]);
  const [sprintGroups, setSprintGroups] = useState<SprintGroup[]>([]);
  const [notifications, setNotifications] = useState<LocalNotification[]>([]);
  const [flatNotifications, setFlatNotifications] = useState<LocalNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [flatPage, setFlatPage] = useState(1);
  const [flatTotalItems, setFlatTotalItems] = useState(0);

  // Delete mode state
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedProyectoIds, setSelectedProyectoIds] = useState<Set<number>>(new Set());
  const [selectedNotificationIds, setSelectedNotificationIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Observacion dialog
  const [viewingObservacion, setViewingObservacion] = useState<LocalNotification | null>(null);

  const currentTab = TABS.find(t => t.name === activeTab) || TABS[0];

  // Reset nav, selection and page when tab changes
  useEffect(() => {
    setNavStack({ level: 'proyectos' });
    setDeleteMode(false);
    setSelectedProyectoIds(new Set());
    setSelectedNotificationIds(new Set());
    setPage(1);
    setFlatPage(1);
  }, [activeTab]);

  // Load data based on current tab and nav level
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (currentTab?.drillDown === 'flat') {
        // For flat tabs we filter client-side by type, so fetch more from backend
        // and paginate client-side
        const response = await getNotificaciones({ limit: 200 });
        const mapped = response.notificaciones
          .map(mapBackendNotification)
          .filter(n => currentTab.types?.includes(n.type))
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setFlatTotalItems(mapped.length);
        // Client-side pagination for flat tabs
        const start = (flatPage - 1) * PAGE_SIZE;
        setFlatNotifications(mapped.slice(start, start + PAGE_SIZE));
      } else if (navStack.level === 'proyectos') {
        const groups = await getNotificacionesAgrupadasPorProyecto();
        setProyectoGroups(groups);
      } else if (navStack.level === 'sprints') {
        const groups = await getNotificacionesAgrupadasPorSprint(navStack.proyectoId);
        setSprintGroups(groups);
      } else if (navStack.level === 'notificaciones') {
        const filters: Record<string, any> = {
          proyectoId: navStack.proyectoId,
          limit: PAGE_SIZE,
          page,
        };
        if (navStack.sprintId) {
          filters.entidadId = navStack.sprintId;
          filters.tipo = 'Sprints';
        }
        const response = await getNotificaciones(filters);
        const mapped = response.notificaciones
          .map(mapBackendNotification)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setNotifications(mapped);
        setTotalItems(response.total);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      toast({ title: 'Error', description: 'Error al cargar las notificaciones', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentTab, navStack, page, flatPage, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Navigation handlers
  const handleProyectoClick = (proyectoId: number, proyectoNombre: string, proyectoCodigo: string) => {
    if (currentTab?.drillDown === 'project-sprint') {
      setNavStack({ level: 'sprints', proyectoId, proyectoNombre, proyectoCodigo });
    } else {
      setNavStack({ level: 'notificaciones', proyectoId, proyectoNombre, proyectoCodigo });
    }
    setPage(1);
    setDeleteMode(false);
    setSelectedProyectoIds(new Set());
    setSelectedNotificationIds(new Set());
  };

  const handleSprintClick = (sprintId: number, sprintNombre: string) => {
    if (navStack.level === 'sprints') {
      setNavStack({
        level: 'notificaciones',
        proyectoId: navStack.proyectoId,
        proyectoNombre: navStack.proyectoNombre,
        proyectoCodigo: navStack.proyectoCodigo,
        sprintId,
        sprintNombre,
      });
      setPage(1);
      setDeleteMode(false);
      setSelectedNotificationIds(new Set());
    }
  };

  const handleBack = () => {
    if (navStack.level === 'notificaciones' && navStack.sprintId) {
      setNavStack({
        level: 'sprints',
        proyectoId: navStack.proyectoId,
        proyectoNombre: navStack.proyectoNombre,
        proyectoCodigo: navStack.proyectoCodigo,
      });
    } else {
      setNavStack({ level: 'proyectos' });
    }
    setPage(1);
    setDeleteMode(false);
    setSelectedProyectoIds(new Set());
    setSelectedNotificationIds(new Set());
  };

  // Page change handlers
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedNotificationIds(new Set());
  };

  const handleFlatPageChange = (newPage: number) => {
    setFlatPage(newPage);
    setSelectedNotificationIds(new Set());
  };

  // Notification click handler
  const handleNotificationClick = async (clickedNotification: LocalNotification) => {
    if (deleteMode) return;

    setNotifications(prev =>
      prev.map(n => n.id === clickedNotification.id ? { ...n, read: true } : n)
    );
    setFlatNotifications(prev =>
      prev.map(n => n.id === clickedNotification.id ? { ...n, read: true } : n)
    );

    try {
      await marcarNotificacionLeida(clickedNotification.id);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }

    if ((clickedNotification.type === 'validacion' || clickedNotification.type === 'aprobacion') && clickedNotification.urlAccion) {
      let targetUrl = clickedNotification.urlAccion;
      const oldUrlMatch = targetUrl.match(/^\/poi\/proyectos\/(\d+)\/cronograma$/);
      if (oldUrlMatch) {
        targetUrl = `/poi/proyecto/detalles?id=${oldUrlMatch[1]}&tab=Cronograma`;
      }
      router.push(targetUrl);
    } else if (clickedNotification.type === 'hu_revision' || clickedNotification.type === 'hu_validated' || clickedNotification.type === 'hu_rejected') {
      const backlogRoute = clickedNotification.projectType === 'Proyecto'
        ? paths.poi.proyecto.backlog.base
        : paths.poi.actividad.lista;
      router.push(backlogRoute);
    } else if (clickedNotification.type === 'sprint' || clickedNotification.type === 'delay') {
      const backlogRoute = clickedNotification.projectType === 'Proyecto'
        ? paths.poi.proyecto.backlog.base
        : paths.poi.actividad.lista;
      router.push(`${backlogRoute}?tab=Backlog`);
    } else if (clickedNotification.type === 'project' && clickedNotification.urlAccion) {
      router.push(clickedNotification.urlAccion);
    } else if (clickedNotification.projectId) {
      const route = clickedNotification.projectType === 'Proyecto'
        ? `/poi/proyecto/detalles?id=${clickedNotification.projectId}`
        : `/poi/actividad/detalles?id=${clickedNotification.projectId}`;
      router.push(route);
    }
  };

  // Mark all read handlers
  const handleMarkAllRead = async () => {
    try {
      await marcarTodasLeidas();
      setFlatNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast({ title: 'Listo', description: 'Todas las notificaciones marcadas como leídas' });
    } catch (err) {
      console.error('Error marking all as read:', err);
      toast({ title: 'Error', description: 'No se pudieron marcar las notificaciones', variant: 'destructive' });
    }
  };

  const handleMarkAllReadByProject = async () => {
    if (navStack.level !== 'notificaciones') return;
    try {
      await marcarTodasLeidasPorProyecto(navStack.proyectoId);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast({ title: 'Listo', description: 'Notificaciones marcadas como leídas' });
    } catch (err) {
      console.error('Error marking project notifications as read:', err);
      toast({ title: 'Error', description: 'No se pudieron marcar las notificaciones', variant: 'destructive' });
    }
  };

  // Delete mode handlers
  const toggleDeleteMode = () => {
    if (deleteMode) {
      setDeleteMode(false);
      setSelectedProyectoIds(new Set());
      setSelectedNotificationIds(new Set());
    } else {
      setDeleteMode(true);
    }
  };

  const toggleProyectoSelect = (id: number) => {
    setSelectedProyectoIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleNotificationSelect = (id: string) => {
    setSelectedNotificationIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    setIsDeleting(true);
    try {
      if (navStack.level === 'proyectos' && selectedProyectoIds.size > 0) {
        await bulkDeleteByProyectos(Array.from(selectedProyectoIds));
        setProyectoGroups(prev => prev.filter(g => !selectedProyectoIds.has(g.proyectoId)));
        toast({ title: 'Listo', description: `${selectedProyectoIds.size} proyecto(s) eliminados` });
      } else if (navStack.level === 'notificaciones' && selectedNotificationIds.size > 0) {
        const ids = Array.from(selectedNotificationIds).map(Number);
        await bulkDeleteNotificaciones(ids);
        toast({ title: 'Listo', description: `${selectedNotificationIds.size} notificación(es) eliminadas` });
        loadData();
      } else if (currentTab?.drillDown === 'flat' && selectedNotificationIds.size > 0) {
        const ids = Array.from(selectedNotificationIds).map(Number);
        await bulkDeleteNotificaciones(ids);
        toast({ title: 'Listo', description: `${selectedNotificationIds.size} notificación(es) eliminadas` });
        loadData();
      }
    } catch (err) {
      console.error('Error deleting:', err);
      toast({ title: 'Error', description: 'No se pudieron eliminar las notificaciones', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setDeleteMode(false);
      setSelectedProyectoIds(new Set());
      setSelectedNotificationIds(new Set());
    }
  };

  // Count selected items for toolbar
  const selectedCount = navStack.level === 'proyectos'
    ? selectedProyectoIds.size
    : selectedNotificationIds.size;

  // Calculate unread counts for current view
  const currentUnreadCount = (() => {
    if (currentTab?.drillDown === 'flat') {
      return flatNotifications.filter(n => !n.read).length;
    }
    if (navStack.level === 'proyectos') {
      return proyectoGroups.reduce((sum, g) => sum + g.noLeidas, 0);
    }
    if (navStack.level === 'notificaciones') {
      return notifications.filter(n => !n.read).length;
    }
    return 0;
  })();

  // Pagination calculations
  const drillTotalPages = Math.ceil(totalItems / PAGE_SIZE);
  const flatTotalPages = Math.ceil(flatTotalItems / PAGE_SIZE);

  // Render content
  const renderContent = () => {
    // Flat tab (aprobaciones/validaciones)
    if (currentTab?.drillDown === 'flat') {
      if (isLoading) {
        return (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-[#018CD1]" />
          </div>
        );
      }
      if (flatNotifications.length === 0 && flatTotalItems === 0) {
        return (
          <div className="text-center py-10 text-gray-500">
            No hay notificaciones en esta categoría.
          </div>
        );
      }
      return (
        <>
          <div className="space-y-3">
            {flatNotifications.map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onClick={handleNotificationClick}
                onViewObservacion={setViewingObservacion}
                checkbox={deleteMode}
                checked={selectedNotificationIds.has(notification.id)}
                onCheckChange={() => toggleNotificationSelect(notification.id)}
              />
            ))}
          </div>
          <PaginationControls
            page={flatPage}
            totalPages={flatTotalPages}
            total={flatTotalItems}
            limit={PAGE_SIZE}
            onPageChange={handleFlatPageChange}
          />
        </>
      );
    }

    // Drill-down tabs
    if (navStack.level === 'proyectos') {
      return (
        <ProyectoBlockList
          groups={proyectoGroups}
          loading={isLoading}
          deleteMode={deleteMode}
          selectedIds={selectedProyectoIds}
          onToggleSelect={toggleProyectoSelect}
          onProyectoClick={handleProyectoClick}
        />
      );
    }

    if (navStack.level === 'sprints') {
      return (
        <SprintBlockList
          groups={sprintGroups}
          loading={isLoading}
          proyectoNombre={navStack.proyectoNombre}
          proyectoCodigo={navStack.proyectoCodigo}
          deleteMode={deleteMode}
          selectedIds={new Set()}
          onToggleSelect={() => {}}
          onSprintClick={handleSprintClick}
          onBack={handleBack}
        />
      );
    }

    if (navStack.level === 'notificaciones') {
      return (
        <NotificationList
          notifications={notifications}
          loading={isLoading}
          proyectoNombre={navStack.proyectoNombre}
          proyectoCodigo={navStack.proyectoCodigo}
          sprintNombre={navStack.sprintNombre}
          deleteMode={deleteMode}
          selectedIds={selectedNotificationIds}
          onToggleSelect={toggleNotificationSelect}
          onNotificationClick={handleNotificationClick}
          onViewObservacion={setViewingObservacion}
          onMarkAllRead={handleMarkAllReadByProject}
          onBack={handleBack}
          hasUnread={notifications.some(n => !n.read)}
          page={page}
          totalPages={drillTotalPages}
          total={totalItems}
          limit={PAGE_SIZE}
          onPageChange={handlePageChange}
        />
      );
    }

    return null;
  };

  return (
    <ProtectedRoute module={MODULES.NOTIFICACIONES}>
      <AppLayout breadcrumbs={[{ label: 'NOTIFICACIONES' }]}>
        <div className="bg-[#D5D5D5] border-y border-[#1A5581]">
          <div className="p-2 flex items-center justify-between w-full">
            <h2 className="font-bold text-black pl-2">NOTIFICACIONES</h2>
            <div className="flex items-center gap-2">
              {!deleteMode && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleDeleteMode}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadData}
                    disabled={isLoading}
                  >
                    <RefreshCw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
                    Actualizar
                  </Button>
                  {currentTab?.drillDown === 'flat' && currentUnreadCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkAllRead}
                    >
                      Marcar todas como leídas
                    </Button>
                  )}
                </>
              )}
              {deleteMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleDeleteMode}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-[#F9F9F9] p-6">
          {/* Tabs */}
          <div className="flex items-center mb-6 gap-2">
            {TABS.map(tab => (
              <Button
                key={tab.name}
                size="sm"
                onClick={() => setActiveTab(tab.name)}
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

          {/* Header with count */}
          {(navStack.level === 'proyectos' || currentTab?.drillDown === 'flat') && (
            <div className="flex items-center gap-3 mb-4">
              <BellRing className="h-6 w-6 text-gray-700" />
              <h3 className="text-xl font-bold text-gray-800">Mis Notificaciones</h3>
              {currentUnreadCount > 0 && (
                <Badge variant="secondary">{currentUnreadCount} sin leer</Badge>
              )}
            </div>
          )}

          {/* Content */}
          {renderContent()}
        </div>
      </AppLayout>

      {/* Delete toolbar */}
      {deleteMode && selectedCount > 0 && (
        <DeleteToolbar
          selectedCount={selectedCount}
          onDelete={handleDeleteSelected}
          onCancel={toggleDeleteMode}
          deleting={isDeleting}
        />
      )}

      {/* Observacion dialog */}
      <ObservacionDialog
        open={!!viewingObservacion}
        onOpenChange={(open) => !open && setViewingObservacion(null)}
        title={viewingObservacion?.title}
        observacion={viewingObservacion?.observacion}
      />
    </ProtectedRoute>
  );
}
