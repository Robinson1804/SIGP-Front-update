"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BellRing, Folder, Loader2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

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
  marcarNotificacionLeida,
  marcarTodasLeidas,
  type Notificacion,
} from '@/lib/services/notificaciones.service';

type NotificationStatus = 'Pendiente' | 'En planificación' | 'En desarrollo' | 'Finalizado' | 'En revisión';
type NotificationType = 'project' | 'sprint' | 'delay' | 'hu_revision' | 'hu_validated' | 'hu_rejected' | 'sistema';

// Local notification type that maps from backend
type LocalNotification = {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  projectName: string;
  projectType: 'Proyecto' | 'Actividad';
  status?: NotificationStatus;
  timestamp: Date;
  read: boolean;
  projectId: string;
  huId?: string;
};

const statusStyles: { [key: string]: { bg: string, text: string } } = {
  'Pendiente': { bg: 'bg-[#FE9F43]/20', text: 'text-yellow-800' },
  'En planificación': { bg: 'bg-[#FFD700]/20', text: 'text-amber-800' },
  'En desarrollo': { bg: 'bg-[#559FFE]/20', text: 'text-blue-800' },
  'Finalizado': { bg: 'bg-[#2FD573]/20', text: 'text-green-800' },
  'En revisión': { bg: 'bg-[#9B59B6]/20', text: 'text-purple-800' },
};

// Map backend notification to local format
function mapBackendNotification(n: Notificacion): LocalNotification {
  let type: NotificationType = 'sistema';
  if (n.tipo === 'proyecto' || n.tipo === 'tarea') type = 'project';
  else if (n.tipo === 'sprint') type = 'sprint';
  else if (n.tipo === 'retraso') type = 'delay';
  else if (n.tipo === 'hu_revision') type = 'hu_revision';
  else if (n.tipo === 'hu_validated') type = 'hu_validated';
  else if (n.tipo === 'hu_rejected') type = 'hu_rejected';

  return {
    id: n.id.toString(),
    type,
    title: n.titulo,
    description: n.mensaje,
    projectName: n.entidadNombre || 'Sin proyecto',
    projectType: n.entidadTipo === 'actividad' ? 'Actividad' : 'Proyecto',
    status: n.metadata?.estado as NotificationStatus,
    timestamp: new Date(n.createdAt),
    read: n.leida,
    projectId: n.entidadId?.toString() || '',
    huId: n.metadata?.huId?.toString(),
  };
}

const TimeAgo = ({ date }: { date: Date }) => {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const update = () => {
      const formatted = formatDistanceToNow(date, { addSuffix: true, locale: es });
      setTimeAgo(formatted);
    };

    update();
    const intervalId = setInterval(update, 60000);

    return () => clearInterval(intervalId);
  }, [date]);

  return <span className="text-sm text-gray-500 whitespace-nowrap">{timeAgo}</span>;
};

const NotificationCard = ({
  notification,
  onClick
}: {
  notification: LocalNotification,
  onClick: (notification: LocalNotification) => void
}) => {
  const isUnread = !notification.read;

  return (
    <div
      className={cn(
        "relative flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-colors duration-300 hover:bg-gray-200/50 border",
        notification.read ? 'bg-gray-100 border-gray-200' : 'bg-white border-transparent shadow-sm'
      )}
      onClick={() => onClick(notification)}
    >
      {isUnread && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#018CD1] rounded-l-lg"></div>}

      <div className="relative shrink-0">
        <div className={cn("flex items-center justify-center h-10 w-10 rounded-full", isUnread ? "bg-blue-100" : "bg-gray-200")}>
          <Folder className={cn("h-5 w-5", isUnread ? "text-[#018CD1]" : "text-gray-500")} />
        </div>
        {isUnread && <div className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-[#018CD1] border-2 border-white"></div>}
      </div>

      <div className="flex-grow flex flex-col gap-1">
        <p className="font-semibold text-gray-800">{notification.title}</p>
        {notification.description && (
          <p className="text-sm text-gray-600">{notification.description}</p>
        )}
        {notification.status && (
          <Badge className={cn(statusStyles[notification.status]?.bg, statusStyles[notification.status]?.text, "font-semibold text-xs w-fit")}>
            {notification.status}
          </Badge>
        )}
        {notification.projectName && notification.projectName !== 'Sin proyecto' && (
          <Badge variant="outline" className="bg-[#E9F4FF] border-transparent text-black text-xs w-fit">
            {notification.projectType}: {notification.projectName}
          </Badge>
        )}
      </div>

      <div className="shrink-0 ml-auto self-start">
        <TimeAgo date={notification.timestamp} />
      </div>
    </div>
  );
};

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('Todos');
  const [notifications, setNotifications] = useState<LocalNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  // Load notifications from backend
  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getNotificaciones();
      const mapped = response.notificaciones.map(mapBackendNotification);
      setNotifications(mapped.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    } catch (err: any) {
      console.error('Error loading notifications:', err);
      setError('Error al cargar las notificaciones');
      // Show empty state instead of mock data
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleNotificationClick = async (clickedNotification: LocalNotification) => {
    if (!clickedNotification) return;

    // Mark as read in state
    setNotifications(
      notifications.map(n => n.id === clickedNotification.id ? { ...n, read: true } : n)
    );

    // Mark as read in backend
    try {
      await marcarNotificacionLeida(clickedNotification.id);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }

    // Navigate based on notification type
    if (clickedNotification.type === 'hu_revision' || clickedNotification.type === 'hu_validated' || clickedNotification.type === 'hu_rejected') {
      const backlogRoute = clickedNotification.projectType === 'Proyecto'
        ? paths.poi.proyecto.backlog.base
        : paths.poi.actividad.lista;
      router.push(backlogRoute);
    } else if (clickedNotification.type === 'sprint' || clickedNotification.type === 'delay') {
      const backlogRoute = clickedNotification.projectType === 'Proyecto'
        ? paths.poi.proyecto.backlog.base
        : paths.poi.actividad.lista;
      router.push(`${backlogRoute}?tab=Backlog`);
    } else if (clickedNotification.projectId) {
      const route = clickedNotification.projectType === 'Proyecto'
        ? paths.poi.proyectos.detalles(clickedNotification.projectId)
        : paths.poi.actividad.byId(clickedNotification.projectId);
      router.push(route);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await marcarTodasLeidas();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      toast({ title: 'Listo', description: 'Todas las notificaciones marcadas como leídas' });
    } catch (err) {
      console.error('Error marking all as read:', err);
      toast({ title: 'Error', description: 'No se pudieron marcar las notificaciones', variant: 'destructive' });
    }
  };

  const ALL_TABS: { name: string, type: NotificationType | NotificationType[] | 'all' }[] = [
    { name: 'Todos', type: 'all' },
    { name: 'Proyectos', type: 'project' },
    { name: 'Sprints', type: 'sprint' },
    { name: 'Validaciones', type: ['hu_revision', 'hu_validated', 'hu_rejected'] },
    { name: 'Retrasos', type: 'delay' },
  ];

  // Filter tabs based on role
  const TABS = user?.role === ROLES.PMO
    ? ALL_TABS.filter(tab => tab.name !== 'Validaciones')
    : ALL_TABS;

  const currentTabType = TABS.find(t => t.name === activeTab)?.type;
  const filteredNotifications = notifications.filter(n => {
    if (!currentTabType || currentTabType === 'all') return true;
    if (Array.isArray(currentTabType)) {
      return currentTabType.includes(n.type);
    }
    return n.type === currentTabType;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <ProtectedRoute module={MODULES.NOTIFICACIONES}>
      <AppLayout breadcrumbs={[{ label: 'NOTIFICACIONES' }]}>
        <div className="bg-[#D5D5D5] border-y border-[#1A5581]">
          <div className="p-2 flex items-center justify-between w-full">
            <h2 className="font-bold text-black pl-2">NOTIFICACIONES</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadNotifications}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
                Actualizar
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllRead}
                >
                  Marcar todas como leídas
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col bg-[#F9F9F9] p-6">
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

          <div className="flex items-center gap-3 mb-4">
            <BellRing className="h-6 w-6 text-gray-700" />
            <h3 className="text-xl font-bold text-gray-800">Mis Notificaciones</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} sin leer</Badge>
            )}
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-[#018CD1]" />
              </div>
            ) : error ? (
              <div className="text-center py-10">
                <p className="text-red-500 mb-4">{error}</p>
                <Button variant="outline" onClick={loadNotifications}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reintentar
                </Button>
              </div>
            ) : filteredNotifications.length > 0 ? (
              filteredNotifications.map(notification => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onClick={handleNotificationClick}
                />
              ))
            ) : (
              <div className="text-center py-10 text-gray-500">
                No hay notificaciones en esta categoría.
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
