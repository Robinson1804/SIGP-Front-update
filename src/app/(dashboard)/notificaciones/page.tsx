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
import { useAuth, usePGD } from '@/stores';
import { useToast } from '@/lib/hooks/use-toast';
import { getPGDs } from '@/features/planning';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  getNotificaciones,
  getNotificacionesAgrupadasPorProyecto,
  getNotificacionesAgrupadasPorSprint,
  getSeccionCountsByProyecto,
  getNotificacionesAgrupadasPorActividad,
  getSeccionCountsByActividad,
  marcarNotificacionLeida,
  marcarTodasLeidas,
  marcarTodasLeidasPorProyecto,
  marcarTodasLeidasPorActividad,
  bulkDeleteNotificaciones,
  bulkDeleteByProyectos,
  bulkDeleteByActividades,
  type ProyectoGroup,
  type SprintGroup,
  type SeccionCounts,
  type ActividadGroup,
  type ActividadSeccionCounts,
} from '@/lib/services/notificaciones.service';
import {
  NotificationCard,
  mapBackendNotification,
  type LocalNotification,
  type NotificationType,
} from './components/notification-card';
import { ProyectoBlockList } from './components/proyecto-block-list';
import { SprintBlockList } from './components/sprint-block-list';
import { SeccionBlockList, type SeccionName } from './components/seccion-block-list';
import { ActividadBlockList } from './components/actividad-block-list';
import { ActividadSeccionBlockList, type ActividadSeccionName } from './components/actividad-seccion-block-list';
import { NotificationList } from './components/notification-list';
import { DeleteToolbar } from './components/delete-toolbar';
import { ObservacionDialog } from './components/observacion-dialog';
import { PaginationControls } from './components/pagination-controls';

const PAGE_SIZE = 5;

// Mapeo seccion → tipo backend (for projects)
const SECCION_TO_TIPO: Record<SeccionName, string> = {
  asignaciones: 'Proyectos',
  sprints: 'Sprints',
  aprobaciones: 'Aprobaciones',
  validaciones: 'Validaciones',
};

// Mapeo seccion → tipo backend (for activities)
const ACTIVIDAD_SECCION_TO_TIPO: Record<ActividadSeccionName, string> = {
  asignaciones: 'Proyectos', // Activity assignments use same type
  tareas: 'Tareas',
};

// Tab types - PMO has Proyectos/Actividades, others have different tabs
type PmoTabName = 'Proyectos' | 'Actividades';
type OtherTabName = 'Proyectos' | 'Sprints' | 'Aprobaciones' | 'Validaciones';
type TabName = PmoTabName | OtherTabName;

// Navigation state types for PMO (Proyectos tab)
type PmoNavLevel =
  | { level: 'proyectos' }
  | { level: 'secciones'; proyectoId: number; proyectoNombre: string; proyectoCodigo: string }
  | { level: 'notificaciones'; proyectoId: number; proyectoNombre: string; proyectoCodigo: string; seccion: SeccionName };

// Navigation state types for PMO (Actividades tab)
type PmoActividadNavLevel =
  | { level: 'actividades' }
  | { level: 'secciones'; actividadId: number; actividadNombre: string; actividadCodigo: string }
  | { level: 'notificaciones'; actividadId: number; actividadNombre: string; actividadCodigo: string; seccion: ActividadSeccionName };

// Navigation state types for other roles
type OtherNavLevel =
  | { level: 'proyectos' }
  | { level: 'sprints'; proyectoId: number; proyectoNombre: string; proyectoCodigo: string }
  | { level: 'notificaciones'; proyectoId: number; proyectoNombre: string; proyectoCodigo: string; sprintId?: number; sprintNombre?: string };

// Tab definitions for non-PMO roles
interface TabDefinition {
  name: OtherTabName;
  types?: NotificationType[];
  drillDown: 'project-only' | 'project-sprint' | 'flat';
}

const TAB_DEFINITIONS: TabDefinition[] = [
  { name: 'Proyectos', drillDown: 'project-only' },
  { name: 'Sprints', drillDown: 'project-sprint' },
  { name: 'Aprobaciones', types: ['aprobacion'], drillDown: 'flat' },
  { name: 'Validaciones', types: ['validacion', 'hu_revision', 'hu_validated', 'hu_rejected'], drillDown: 'flat' },
];

function getTabsForNonPmo(role?: string): TabDefinition[] {
  if (role === ROLES.SCRUM_MASTER || role === ROLES.COORDINADOR) {
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

  const isPmo = user?.role === ROLES.PMO;

  // PGD filter state (PMO only)
  const { initializePGD, pgds, selectedPGD, setSelectedPGD } = usePGD();
  const [pgdFilterId, setPgdFilterId] = useState<number | undefined>(undefined);

  // Load PGDs for filter
  useEffect(() => {
    if (isPmo) {
      getPGDs({ activo: true }).then((list) => {
        initializePGD(list);
      });
    }
  }, [isPmo, initializePGD]);

  // Sync pgdFilterId with selectedPGD from store
  useEffect(() => {
    if (isPmo && selectedPGD) {
      setPgdFilterId(selectedPGD.id);
    }
  }, [isPmo, selectedPGD]);

  // Tab state
  const PMO_TABS: PmoTabName[] = ['Proyectos', 'Actividades'];
  const NON_PMO_TABS = getTabsForNonPmo(user?.role);

  const [activeTab, setActiveTab] = useState<TabName>(isPmo ? 'Proyectos' : (NON_PMO_TABS[0]?.name || 'Proyectos'));

  // Navigation state - different for PMO vs other roles
  const [pmoNavStack, setPmoNavStack] = useState<PmoNavLevel>({ level: 'proyectos' });
  const [pmoActividadNavStack, setPmoActividadNavStack] = useState<PmoActividadNavLevel>({ level: 'actividades' });
  const [otherNavStack, setOtherNavStack] = useState<OtherNavLevel>({ level: 'proyectos' });

  // Data state
  const [proyectoGroups, setProyectoGroups] = useState<ProyectoGroup[]>([]);
  const [sprintGroups, setSprintGroups] = useState<SprintGroup[]>([]);
  const [seccionCounts, setSeccionCounts] = useState<SeccionCounts>({
    asignaciones: { total: 0, noLeidas: 0 },
    sprints: { total: 0, noLeidas: 0 },
    aprobaciones: { total: 0, noLeidas: 0 },
    validaciones: { total: 0, noLeidas: 0 },
  });
  // Activity data state (PMO Actividades tab)
  const [actividadGroups, setActividadGroups] = useState<ActividadGroup[]>([]);
  const [actividadSeccionCounts, setActividadSeccionCounts] = useState<ActividadSeccionCounts>({
    asignaciones: { total: 0, noLeidas: 0 },
    tareas: { total: 0, noLeidas: 0 },
  });
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
  const [selectedActividadIds, setSelectedActividadIds] = useState<Set<number>>(new Set());
  const [selectedNotificationIds, setSelectedNotificationIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Observacion dialog
  const [viewingObservacion, setViewingObservacion] = useState<LocalNotification | null>(null);

  // Get current tab definition for non-PMO
  const currentNonPmoTab = NON_PMO_TABS.find(t => t.name === activeTab) || NON_PMO_TABS[0];

  // Reset nav, selection and page when tab changes
  useEffect(() => {
    if (isPmo) {
      setPmoNavStack({ level: 'proyectos' });
      setPmoActividadNavStack({ level: 'actividades' });
    } else {
      setOtherNavStack({ level: 'proyectos' });
    }
    setDeleteMode(false);
    setSelectedProyectoIds(new Set());
    setSelectedActividadIds(new Set());
    setSelectedNotificationIds(new Set());
    setPage(1);
    setFlatPage(1);
  }, [activeTab, isPmo]);

  // Load data based on current tab and nav level
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isPmo) {
        // PMO Navigation Flow
        if (activeTab === 'Actividades') {
          // Tab Actividades for PMO
          if (pmoActividadNavStack.level === 'actividades') {
            const groups = await getNotificacionesAgrupadasPorActividad(pgdFilterId);
            setActividadGroups(groups);
          } else if (pmoActividadNavStack.level === 'secciones') {
            const counts = await getSeccionCountsByActividad(pmoActividadNavStack.actividadId);
            setActividadSeccionCounts(counts);
          } else if (pmoActividadNavStack.level === 'notificaciones') {
            const tipo = ACTIVIDAD_SECCION_TO_TIPO[pmoActividadNavStack.seccion];
            const response = await getNotificaciones({
              actividadId: pmoActividadNavStack.actividadId,
              tipo,
              page,
              limit: PAGE_SIZE,
            });
            const mapped = response.notificaciones
              .map(mapBackendNotification)
              .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            setNotifications(mapped);
            setTotalItems(response.total);
          }
        } else {
          // Tab Proyectos for PMO
          if (pmoNavStack.level === 'proyectos') {
            const groups = await getNotificacionesAgrupadasPorProyecto(pgdFilterId);
            setProyectoGroups(groups);
          } else if (pmoNavStack.level === 'secciones') {
            const counts = await getSeccionCountsByProyecto(pmoNavStack.proyectoId);
            setSeccionCounts(counts);
          } else if (pmoNavStack.level === 'notificaciones') {
            const tipo = SECCION_TO_TIPO[pmoNavStack.seccion];
            const response = await getNotificaciones({
              proyectoId: pmoNavStack.proyectoId,
              tipo,
              page,
              limit: PAGE_SIZE,
            });
            const mapped = response.notificaciones
              .map(mapBackendNotification)
              .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            setNotifications(mapped);
            setTotalItems(response.total);
          }
        }
      } else {
        // Non-PMO Navigation Flow (existing logic)
        if (currentNonPmoTab?.drillDown === 'flat') {
          // For flat tabs we filter client-side by type
          const response = await getNotificaciones({ limit: 200 });
          const mapped = response.notificaciones
            .map(mapBackendNotification)
            .filter(n => currentNonPmoTab.types?.includes(n.type))
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          setFlatTotalItems(mapped.length);
          // Client-side pagination for flat tabs
          const start = (flatPage - 1) * PAGE_SIZE;
          setFlatNotifications(mapped.slice(start, start + PAGE_SIZE));
        } else if (otherNavStack.level === 'proyectos') {
          const groups = await getNotificacionesAgrupadasPorProyecto();
          setProyectoGroups(groups);
        } else if (otherNavStack.level === 'sprints') {
          const groups = await getNotificacionesAgrupadasPorSprint(otherNavStack.proyectoId);
          setSprintGroups(groups);
        } else if (otherNavStack.level === 'notificaciones') {
          const filters: Record<string, any> = {
            proyectoId: otherNavStack.proyectoId,
            limit: PAGE_SIZE,
            page,
          };
          if (otherNavStack.sprintId) {
            filters.entidadId = otherNavStack.sprintId;
            filters.tipo = 'Sprints';
          }
          const response = await getNotificaciones(filters);
          const mapped = response.notificaciones
            .map(mapBackendNotification)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          setNotifications(mapped);
          setTotalItems(response.total);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
      toast({ title: 'Error', description: 'Error al cargar las notificaciones', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [isPmo, activeTab, pmoNavStack, pmoActividadNavStack, otherNavStack, currentNonPmoTab, page, flatPage, toast, pgdFilterId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // PMO Navigation handlers
  const handlePmoProyectoClick = (proyectoId: number, proyectoNombre: string, proyectoCodigo: string) => {
    setPmoNavStack({ level: 'secciones', proyectoId, proyectoNombre, proyectoCodigo });
    setPage(1);
    setDeleteMode(false);
    setSelectedProyectoIds(new Set());
    setSelectedNotificationIds(new Set());
  };

  const handleSeccionClick = (seccion: SeccionName) => {
    if (pmoNavStack.level === 'secciones') {
      setPmoNavStack({
        level: 'notificaciones',
        proyectoId: pmoNavStack.proyectoId,
        proyectoNombre: pmoNavStack.proyectoNombre,
        proyectoCodigo: pmoNavStack.proyectoCodigo,
        seccion,
      });
      setPage(1);
      setDeleteMode(false);
      setSelectedNotificationIds(new Set());
    }
  };

  const handleDeleteSeccion = async (seccion: SeccionName) => {
    if (pmoNavStack.level !== 'secciones') return;
    try {
      const tipo = SECCION_TO_TIPO[seccion];
      const response = await getNotificaciones({
        proyectoId: pmoNavStack.proyectoId,
        tipo,
        limit: 1000,
      });
      const ids = response.notificaciones.map((n: any) => n.id).filter(Boolean);
      if (ids.length === 0) {
        toast({ title: 'Info', description: 'No hay notificaciones para eliminar en esta sección' });
        return;
      }
      await bulkDeleteNotificaciones(ids);
      toast({ title: 'Listo', description: `Notificaciones de ${seccion} eliminadas (${ids.length})` });
      loadData();
    } catch (err) {
      console.error('Error deleting section notifications:', err);
      toast({ title: 'Error', description: 'No se pudieron eliminar las notificaciones', variant: 'destructive' });
    }
  };

  const handlePmoBack = () => {
    if (pmoNavStack.level === 'notificaciones') {
      setPmoNavStack({
        level: 'secciones',
        proyectoId: pmoNavStack.proyectoId,
        proyectoNombre: pmoNavStack.proyectoNombre,
        proyectoCodigo: pmoNavStack.proyectoCodigo,
      });
    } else if (pmoNavStack.level === 'secciones') {
      setPmoNavStack({ level: 'proyectos' });
    }
    setPage(1);
    setDeleteMode(false);
    setSelectedProyectoIds(new Set());
    setSelectedNotificationIds(new Set());
  };

  // PMO Activity Navigation handlers
  const handlePmoActividadClick = (actividadId: number, actividadNombre: string, actividadCodigo: string) => {
    setPmoActividadNavStack({ level: 'secciones', actividadId, actividadNombre, actividadCodigo });
    setPage(1);
    setDeleteMode(false);
    setSelectedActividadIds(new Set());
    setSelectedNotificationIds(new Set());
  };

  const handleActividadSeccionClick = (seccion: ActividadSeccionName) => {
    if (pmoActividadNavStack.level === 'secciones') {
      setPmoActividadNavStack({
        level: 'notificaciones',
        actividadId: pmoActividadNavStack.actividadId,
        actividadNombre: pmoActividadNavStack.actividadNombre,
        actividadCodigo: pmoActividadNavStack.actividadCodigo,
        seccion,
      });
      setPage(1);
      setDeleteMode(false);
      setSelectedNotificationIds(new Set());
    }
  };

  const handlePmoActividadBack = () => {
    if (pmoActividadNavStack.level === 'notificaciones') {
      setPmoActividadNavStack({
        level: 'secciones',
        actividadId: pmoActividadNavStack.actividadId,
        actividadNombre: pmoActividadNavStack.actividadNombre,
        actividadCodigo: pmoActividadNavStack.actividadCodigo,
      });
    } else if (pmoActividadNavStack.level === 'secciones') {
      setPmoActividadNavStack({ level: 'actividades' });
    }
    setPage(1);
    setDeleteMode(false);
    setSelectedActividadIds(new Set());
    setSelectedNotificationIds(new Set());
  };

  // Non-PMO Navigation handlers
  const handleOtherProyectoClick = (proyectoId: number, proyectoNombre: string, proyectoCodigo: string) => {
    if (currentNonPmoTab?.drillDown === 'project-sprint') {
      setOtherNavStack({ level: 'sprints', proyectoId, proyectoNombre, proyectoCodigo });
    } else {
      setOtherNavStack({ level: 'notificaciones', proyectoId, proyectoNombre, proyectoCodigo });
    }
    setPage(1);
    setDeleteMode(false);
    setSelectedProyectoIds(new Set());
    setSelectedNotificationIds(new Set());
  };

  const handleSprintClick = (sprintId: number, sprintNombre: string) => {
    if (otherNavStack.level === 'sprints') {
      setOtherNavStack({
        level: 'notificaciones',
        proyectoId: otherNavStack.proyectoId,
        proyectoNombre: otherNavStack.proyectoNombre,
        proyectoCodigo: otherNavStack.proyectoCodigo,
        sprintId,
        sprintNombre,
      });
      setPage(1);
      setDeleteMode(false);
      setSelectedNotificationIds(new Set());
    }
  };

  const handleOtherBack = () => {
    if (otherNavStack.level === 'notificaciones' && otherNavStack.sprintId) {
      setOtherNavStack({
        level: 'sprints',
        proyectoId: otherNavStack.proyectoId,
        proyectoNombre: otherNavStack.proyectoNombre,
        proyectoCodigo: otherNavStack.proyectoCodigo,
      });
    } else {
      setOtherNavStack({ level: 'proyectos' });
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
  const handleNotificationClick = (clickedNotification: LocalNotification) => {
    if (deleteMode) return;

    // Actualizar estado local inmediatamente
    setNotifications(prev =>
      prev.map(n => n.id === clickedNotification.id ? { ...n, read: true } : n)
    );
    setFlatNotifications(prev =>
      prev.map(n => n.id === clickedNotification.id ? { ...n, read: true } : n)
    );

    // Marcar como leída en background (no bloquea navegación)
    marcarNotificacionLeida(clickedNotification.id).catch(err => {
      console.error('Error marking notification as read:', err);
    });

    // Determinar ruta de navegación
    const projectId = clickedNotification.projectId;
    const isProyecto = clickedNotification.projectType === 'Proyecto';

    if ((clickedNotification.type === 'validacion' || clickedNotification.type === 'aprobacion') && clickedNotification.urlAccion) {
      let targetUrl = clickedNotification.urlAccion;
      const oldUrlMatch = targetUrl.match(/^\/poi\/proyectos\/(\d+)\/cronograma$/);
      if (oldUrlMatch) {
        targetUrl = `/poi/proyecto/detalles?id=${oldUrlMatch[1]}&tab=Cronograma`;
      }
      router.push(targetUrl);
    } else if (clickedNotification.type === 'hu_revision' || clickedNotification.type === 'hu_validated' || clickedNotification.type === 'hu_rejected') {
      // Historias de usuario - ir al Backlog del proyecto
      if (isProyecto && projectId) {
        router.push(`/poi/proyecto/detalles?id=${projectId}&tab=Backlog`);
      } else if (projectId) {
        router.push(`/poi/actividad/detalles?id=${projectId}`);
      } else {
        router.push(paths.poi.actividad.lista);
      }
    } else if (clickedNotification.type === 'sprint' || clickedNotification.type === 'delay') {
      // Sprints - ir al Backlog del proyecto
      if (isProyecto && projectId) {
        router.push(`/poi/proyecto/detalles?id=${projectId}&tab=Backlog`);
      } else if (projectId) {
        router.push(`/poi/actividad/detalles?id=${projectId}`);
      } else {
        router.push(paths.poi.actividad.lista);
      }
    } else if (clickedNotification.type === 'project') {
      // Asignación de proyecto - ir a detalles
      if (clickedNotification.urlAccion) {
        router.push(clickedNotification.urlAccion);
      } else if (isProyecto && projectId) {
        router.push(`/poi/proyecto/detalles?id=${projectId}`);
      } else if (projectId) {
        router.push(`/poi/actividad/detalles?id=${projectId}`);
      }
    } else if (projectId) {
      // Fallback - ir a detalles del proyecto/actividad
      const route = isProyecto
        ? `/poi/proyecto/detalles?id=${projectId}`
        : `/poi/actividad/detalles?id=${projectId}`;
      router.push(route);
    }
  };

  // Mark all read handlers
  const handleMarkAllRead = async () => {
    try {
      await marcarTodasLeidas();
      setFlatNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast({ title: 'Listo', description: 'Todas las notificaciones marcadas como leidas' });
    } catch (err) {
      console.error('Error marking all as read:', err);
      toast({ title: 'Error', description: 'No se pudieron marcar las notificaciones', variant: 'destructive' });
    }
  };

  const handleMarkAllReadByProject = async () => {
    const proyectoId = isPmo
      ? (pmoNavStack.level === 'notificaciones' ? pmoNavStack.proyectoId : null)
      : (otherNavStack.level === 'notificaciones' ? otherNavStack.proyectoId : null);

    if (!proyectoId) return;

    try {
      await marcarTodasLeidasPorProyecto(proyectoId);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast({ title: 'Listo', description: 'Notificaciones marcadas como leidas' });
    } catch (err) {
      console.error('Error marking project notifications as read:', err);
      toast({ title: 'Error', description: 'No se pudieron marcar las notificaciones', variant: 'destructive' });
    }
  };

  const handleMarkAllReadByActivity = async () => {
    if (pmoActividadNavStack.level !== 'notificaciones') return;

    try {
      await marcarTodasLeidasPorActividad(pmoActividadNavStack.actividadId);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast({ title: 'Listo', description: 'Notificaciones marcadas como leidas' });
    } catch (err) {
      console.error('Error marking activity notifications as read:', err);
      toast({ title: 'Error', description: 'No se pudieron marcar las notificaciones', variant: 'destructive' });
    }
  };

  // Delete mode handlers
  const toggleDeleteMode = () => {
    if (deleteMode) {
      setDeleteMode(false);
      setSelectedProyectoIds(new Set());
      setSelectedActividadIds(new Set());
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

  const toggleActividadSelect = (id: number) => {
    setSelectedActividadIds(prev => {
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
      // Determine current level based on active tab
      const currentLevel = isPmo
        ? (activeTab === 'Actividades' ? pmoActividadNavStack.level : pmoNavStack.level)
        : otherNavStack.level;

      if (isPmo && activeTab === 'Actividades') {
        // Handle Actividades tab deletion
        if (currentLevel === 'actividades' && selectedActividadIds.size > 0) {
          await bulkDeleteByActividades(Array.from(selectedActividadIds));
          setActividadGroups(prev => prev.filter(g => !selectedActividadIds.has(g.actividadId)));
          toast({ title: 'Listo', description: `${selectedActividadIds.size} actividad(es) eliminadas` });
        } else if (currentLevel === 'notificaciones' && selectedNotificationIds.size > 0) {
          const ids = Array.from(selectedNotificationIds).map(Number);
          await bulkDeleteNotificaciones(ids);
          toast({ title: 'Listo', description: `${selectedNotificationIds.size} notificacion(es) eliminadas` });
          loadData();
        }
      } else if (currentLevel === 'proyectos' && selectedProyectoIds.size > 0) {
        await bulkDeleteByProyectos(Array.from(selectedProyectoIds));
        setProyectoGroups(prev => prev.filter(g => !selectedProyectoIds.has(g.proyectoId)));
        toast({ title: 'Listo', description: `${selectedProyectoIds.size} proyecto(s) eliminados` });
      } else if ((currentLevel === 'notificaciones' || (!isPmo && currentNonPmoTab?.drillDown === 'flat')) && selectedNotificationIds.size > 0) {
        const ids = Array.from(selectedNotificationIds).map(Number);
        await bulkDeleteNotificaciones(ids);
        toast({ title: 'Listo', description: `${selectedNotificationIds.size} notificacion(es) eliminadas` });
        loadData();
      }
    } catch (err) {
      console.error('Error deleting:', err);
      toast({ title: 'Error', description: 'No se pudieron eliminar las notificaciones', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setDeleteMode(false);
      setSelectedProyectoIds(new Set());
      setSelectedActividadIds(new Set());
      setSelectedNotificationIds(new Set());
    }
  };

  // Count selected items for toolbar
  const currentLevel = isPmo
    ? (activeTab === 'Actividades' ? pmoActividadNavStack.level : pmoNavStack.level)
    : otherNavStack.level;
  const selectedCount = (() => {
    if (isPmo && activeTab === 'Actividades') {
      return currentLevel === 'actividades' ? selectedActividadIds.size : selectedNotificationIds.size;
    }
    return currentLevel === 'proyectos' ? selectedProyectoIds.size : selectedNotificationIds.size;
  })();

  // Calculate unread counts for current view
  const currentUnreadCount = (() => {
    if (!isPmo && currentNonPmoTab?.drillDown === 'flat') {
      return flatNotifications.filter(n => !n.read).length;
    }
    if (isPmo) {
      if (activeTab === 'Actividades') {
        if (pmoActividadNavStack.level === 'actividades') {
          return actividadGroups.reduce((sum, g) => sum + g.noLeidas, 0);
        }
        if (pmoActividadNavStack.level === 'notificaciones') {
          return notifications.filter(n => !n.read).length;
        }
      } else {
        if (pmoNavStack.level === 'proyectos') {
          return proyectoGroups.reduce((sum, g) => sum + g.noLeidas, 0);
        }
        if (pmoNavStack.level === 'notificaciones') {
          return notifications.filter(n => !n.read).length;
        }
      }
    } else {
      if (otherNavStack.level === 'proyectos') {
        return proyectoGroups.reduce((sum, g) => sum + g.noLeidas, 0);
      }
      if (otherNavStack.level === 'notificaciones') {
        return notifications.filter(n => !n.read).length;
      }
    }
    return 0;
  })();

  // Pagination calculations
  const drillTotalPages = Math.ceil(totalItems / PAGE_SIZE);
  const flatTotalPages = Math.ceil(flatTotalItems / PAGE_SIZE);

  // Get seccion label for breadcrumb
  const getSeccionLabel = (seccion: SeccionName) => {
    const labels: Record<SeccionName, string> = {
      asignaciones: 'Asignaciones',
      sprints: 'Sprints',
      aprobaciones: 'Aprobaciones',
      validaciones: 'Validaciones',
    };
    return labels[seccion];
  };

  // Render content
  const renderContent = () => {
    // PMO View
    if (isPmo) {
      // Actividades tab
      if (activeTab === 'Actividades') {
        if (pmoActividadNavStack.level === 'actividades') {
          return (
            <ActividadBlockList
              groups={actividadGroups}
              loading={isLoading}
              deleteMode={deleteMode}
              selectedIds={selectedActividadIds}
              onToggleSelect={toggleActividadSelect}
              onActividadClick={handlePmoActividadClick}
            />
          );
        }

        if (pmoActividadNavStack.level === 'secciones') {
          return (
            <ActividadSeccionBlockList
              actividadId={pmoActividadNavStack.actividadId}
              actividadNombre={pmoActividadNavStack.actividadNombre}
              actividadCodigo={pmoActividadNavStack.actividadCodigo}
              counts={actividadSeccionCounts}
              loading={isLoading}
              onSeccionClick={handleActividadSeccionClick}
              onBack={handlePmoActividadBack}
            />
          );
        }

        if (pmoActividadNavStack.level === 'notificaciones') {
          const getActividadSeccionLabel = (seccion: ActividadSeccionName) => {
            const labels: Record<ActividadSeccionName, string> = {
              asignaciones: 'Asignaciones',
              tareas: 'Tareas',
            };
            return labels[seccion];
          };

          return (
            <div>
              {/* Custom header for PMO activity notification list */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handlePmoActividadBack} className="gap-1">
                    <span className="mr-1">&larr;</span>
                    Volver
                  </Button>
                  <nav className="text-sm text-gray-500">
                    <span className="text-gray-400">Actividades</span>
                    <span className="mx-1 text-gray-400">&gt;</span>
                    <span className="text-gray-400">{pmoActividadNavStack.actividadCodigo}</span>
                    <span className="mx-1 text-gray-400">&gt;</span>
                    <span className="font-medium text-gray-700">{getActividadSeccionLabel(pmoActividadNavStack.seccion)}</span>
                  </nav>
                </div>

                {notifications.some(n => !n.read) && !deleteMode && (
                  <Button variant="outline" size="sm" onClick={handleMarkAllReadByActivity}>
                    Marcar todas como leidas
                  </Button>
                )}
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-[#018CD1]" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  No hay notificaciones.
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {notifications.map((notification) => (
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
                    page={page}
                    totalPages={drillTotalPages}
                    total={totalItems}
                    limit={PAGE_SIZE}
                    onPageChange={handlePageChange}
                  />
                </>
              )}
            </div>
          );
        }

        return null;
      }

      // Proyectos tab
      if (pmoNavStack.level === 'proyectos') {
        return (
          <ProyectoBlockList
            groups={proyectoGroups}
            loading={isLoading}
            deleteMode={deleteMode}
            selectedIds={selectedProyectoIds}
            onToggleSelect={toggleProyectoSelect}
            onProyectoClick={handlePmoProyectoClick}
          />
        );
      }

      if (pmoNavStack.level === 'secciones') {
        return (
          <SeccionBlockList
            proyectoId={pmoNavStack.proyectoId}
            proyectoNombre={pmoNavStack.proyectoNombre}
            proyectoCodigo={pmoNavStack.proyectoCodigo}
            counts={seccionCounts}
            loading={isLoading}
            onSeccionClick={handleSeccionClick}
            onBack={handlePmoBack}
            onDeleteSeccion={handleDeleteSeccion}
          />
        );
      }

      if (pmoNavStack.level === 'notificaciones') {
        return (
          <div>
            {/* Custom header for PMO notification list */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handlePmoBack} className="gap-1">
                  <span className="mr-1">&larr;</span>
                  Volver
                </Button>
                <nav className="text-sm text-gray-500">
                  <span className="text-gray-400">Proyectos</span>
                  <span className="mx-1 text-gray-400">&gt;</span>
                  <span className="text-gray-400">{pmoNavStack.proyectoCodigo}</span>
                  <span className="mx-1 text-gray-400">&gt;</span>
                  <span className="font-medium text-gray-700">{getSeccionLabel(pmoNavStack.seccion)}</span>
                </nav>
              </div>

              {notifications.some(n => !n.read) && !deleteMode && (
                <Button variant="outline" size="sm" onClick={handleMarkAllReadByProject}>
                  Marcar todas como leidas
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-[#018CD1]" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No hay notificaciones.
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {notifications.map((notification) => (
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
                  page={page}
                  totalPages={drillTotalPages}
                  total={totalItems}
                  limit={PAGE_SIZE}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </div>
        );
      }
    }

    // Non-PMO View (existing logic)
    // Flat tab (aprobaciones/validaciones)
    if (currentNonPmoTab?.drillDown === 'flat') {
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
            No hay notificaciones en esta categoria.
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
    if (otherNavStack.level === 'proyectos') {
      return (
        <ProyectoBlockList
          groups={proyectoGroups}
          loading={isLoading}
          deleteMode={deleteMode}
          selectedIds={selectedProyectoIds}
          onToggleSelect={toggleProyectoSelect}
          onProyectoClick={handleOtherProyectoClick}
        />
      );
    }

    if (otherNavStack.level === 'sprints') {
      return (
        <SprintBlockList
          groups={sprintGroups}
          loading={isLoading}
          proyectoNombre={otherNavStack.proyectoNombre}
          proyectoCodigo={otherNavStack.proyectoCodigo}
          deleteMode={deleteMode}
          selectedIds={new Set()}
          onToggleSelect={() => {}}
          onSprintClick={handleSprintClick}
          onBack={handleOtherBack}
        />
      );
    }

    if (otherNavStack.level === 'notificaciones') {
      return (
        <NotificationList
          notifications={notifications}
          loading={isLoading}
          proyectoNombre={otherNavStack.proyectoNombre}
          proyectoCodigo={otherNavStack.proyectoCodigo}
          sprintNombre={otherNavStack.sprintNombre}
          deleteMode={deleteMode}
          selectedIds={selectedNotificationIds}
          onToggleSelect={toggleNotificationSelect}
          onNotificationClick={handleNotificationClick}
          onViewObservacion={setViewingObservacion}
          onMarkAllRead={handleMarkAllReadByProject}
          onBack={handleOtherBack}
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

  // Determine which tabs to show
  const showFlatTabUnreadCount = !isPmo && currentNonPmoTab?.drillDown === 'flat' && currentUnreadCount > 0;
  const showHeaderUnreadBadge = isPmo
    ? (pmoNavStack.level === 'proyectos' || (activeTab === 'Actividades' && pmoActividadNavStack.level === 'actividades'))
    : (otherNavStack.level === 'proyectos' || currentNonPmoTab?.drillDown === 'flat');

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
                  {showFlatTabUnreadCount && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkAllRead}
                    >
                      Marcar todas como leidas
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
            {isPmo ? (
              // PMO Tabs + PGD Filter
              <>
                {PMO_TABS.map(tabName => (
                  <Button
                    key={tabName}
                    size="sm"
                    onClick={() => setActiveTab(tabName)}
                    className={cn(
                      activeTab === tabName
                        ? 'bg-[#018CD1] text-white'
                        : 'bg-white text-black border-gray-300'
                    )}
                    variant={activeTab === tabName ? 'default' : 'outline'}
                  >
                    {tabName}
                  </Button>
                ))}
                {pgds.length > 0 && (
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">PGD:</span>
                    <Select
                      value={pgdFilterId?.toString() || 'all'}
                      onValueChange={(val) => {
                        const newPgdId = val === 'all' ? undefined : parseInt(val, 10);
                        setPgdFilterId(newPgdId);
                        const pgd = pgds.find(p => p.id === newPgdId) || null;
                        setSelectedPGD(pgd);
                        // Reset navigation to project/activity list level
                        setPmoNavStack({ level: 'proyectos' });
                        setPmoActividadNavStack({ level: 'actividades' });
                        setDeleteMode(false);
                        setSelectedProyectoIds(new Set());
                        setSelectedActividadIds(new Set());
                        setSelectedNotificationIds(new Set());
                      }}
                    >
                      <SelectTrigger className="w-[280px] h-8 bg-white text-sm">
                        <SelectValue placeholder="Todos los PGD" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los PGD</SelectItem>
                        {pgds.map((pgd) => (
                          <SelectItem key={pgd.id} value={pgd.id.toString()}>
                            {pgd.nombre} ({pgd.anioInicio}-{pgd.anioFin})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            ) : (
              // Non-PMO Tabs
              NON_PMO_TABS.map(tab => (
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
              ))
            )}
          </div>

          {/* Header with count */}
          {showHeaderUnreadBadge && (
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
