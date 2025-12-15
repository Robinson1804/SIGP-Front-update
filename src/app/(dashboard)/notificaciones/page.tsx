"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BellRing, Folder } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { type Project, MODULES, ROLES } from '@/lib/definitions';
import { paths } from '@/lib/paths';
import { ProtectedRoute } from "@/features/auth";
import { useAuth } from '@/stores';

type NotificationStatus = 'Pendiente' | 'En planificación' | 'En desarrollo' | 'Finalizado' | 'En revisión';
type NotificationType = 'project' | 'sprint' | 'delay' | 'hu_revision' | 'hu_validated' | 'hu_rejected';

type Notification = {
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
  huId?: string; // ID de la HU relacionada (para notificaciones de HU)
};

const initialNotifications: Notification[] = [
  { id: '1', type: 'project', title: 'El proyecto está pendiente', projectName: 'Implementación y desarrollo de un chatbot', projectType: 'Proyecto', status: 'Pendiente', timestamp: new Date(Date.now() - 5 * 60 * 1000), read: false, projectId: '1' },
  { id: '2', type: 'project', title: 'El proyecto está en planificación', projectName: 'Administración del portafolio de proyectos', projectType: 'Proyecto', status: 'En planificación', timestamp: new Date(Date.now() - 5 * 60 * 1000), read: false, projectId: '2' },
  { id: '3', type: 'project', title: 'El proyecto está en desarrollo', projectName: 'CPV', projectType: 'Proyecto', status: 'En desarrollo', timestamp: new Date(Date.now() - 45 * 60 * 1000), read: false, projectId: '3' },
  { id: '4', type: 'project', title: 'El proyecto ha finalizado', projectName: 'App móvil para el monitoreo de tablets', projectType: 'Actividad', status: 'Finalizado', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), read: true, projectId: '4' },
  { id: '5', type: 'sprint', title: 'Sprint 2 finalizado', description: 'El sprint 2 del proyecto ha finalizado', projectName: 'Administración de portafolio de proyectos', projectType: 'Proyecto', timestamp: new Date(Date.now() - 15 * 60 * 1000), read: false, projectId: '2' },
  { id: '6', type: 'sprint', title: 'Sprint 1 finalizado', description: 'El sprint 1 del proyecto ha finalizado', projectName: 'CPV', projectType: 'Proyecto', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), read: true, projectId: '3' },
  { id: '7', type: 'delay', title: 'Historia de usuario atrasada', description: 'HU - 1: Captura de datos para el procesamiento del personal', projectName: 'CPV', projectType: 'Proyecto', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), read: false, projectId: '3' },
  { id: '8', type: 'delay', title: 'Historia de usuario atrasada', description: 'HU - 5: Visualización de reportes', projectName: 'Administración de Proyectos', projectType: 'Proyecto', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), read: true, projectId: '1' },
];

const statusStyles: { [key: string]: { bg: string, text: string } } = {
  'Pendiente': { bg: 'bg-[#FE9F43]/20', text: 'text-yellow-800' },
  'En planificación': { bg: 'bg-[#FFD700]/20', text: 'text-amber-800' },
  'En desarrollo': { bg: 'bg-[#559FFE]/20', text: 'text-blue-800' },
  'Finalizado': { bg: 'bg-[#2FD573]/20', text: 'text-green-800' },
  'En revisión': { bg: 'bg-[#9B59B6]/20', text: 'text-purple-800' },
};


const TimeAgo = ({ date }: { date: Date }) => {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const update = () => {
      const formatted = formatDistanceToNow(date, { addSuffix: true, locale: es });
      setTimeAgo(formatted);
    };
    
    update();
    const intervalId = setInterval(update, 60000); // Update every minute

    return () => clearInterval(intervalId);
  }, [date]);

  return <span className="text-sm text-gray-500 whitespace-nowrap">{timeAgo}</span>;
};


const NotificationCard = ({ notification, onClick }: { notification: Notification, onClick: (notification: Notification) => void }) => {
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
            <Badge className={cn(statusStyles[notification.status].bg, statusStyles[notification.status].text, "font-semibold text-xs w-fit")}>
              {notification.status}
            </Badge>
          )}
        <Badge variant="outline" className="bg-[#E9F4FF] border-transparent text-black text-xs w-fit">
            Proyecto: {notification.projectName}
        </Badge>
      </div>
      
      <div className="shrink-0 ml-auto self-start">
        <TimeAgo date={notification.timestamp} />
      </div>
    </div>
  );
};


export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('Proyectos');
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const router = useRouter();
  const { user } = useAuth();

  // Cargar notificaciones adicionales desde localStorage (generadas por el Backlog)
  useEffect(() => {
    const loadStoredNotifications = () => {
      try {
        const storedNotifications = localStorage.getItem('backlogNotifications');
        if (storedNotifications) {
          const parsed = JSON.parse(storedNotifications) as Notification[];

          // Limpiar duplicados en localStorage (por huId + type)
          const cleanedStorage: Notification[] = [];
          const seenHuKeysInStorage = new Set<string>();

          parsed.forEach(n => {
            const huKey = n.huId ? `${n.huId}-${n.type}` : null;
            if (!huKey || !seenHuKeysInStorage.has(huKey)) {
              cleanedStorage.push(n);
              if (huKey) {
                seenHuKeysInStorage.add(huKey);
              }
            }
          });

          // Si se limpiaron duplicados, actualizar localStorage
          if (cleanedStorage.length !== parsed.length) {
            localStorage.setItem('backlogNotifications', JSON.stringify(cleanedStorage));
          }

          // Convertir timestamps de string a Date
          const withDates = cleanedStorage.map(n => ({
            ...n,
            timestamp: new Date(n.timestamp)
          }));

          // Combinar con las notificaciones iniciales, evitando duplicados por ID y por huId+type
          setNotifications(() => {
            const combined = [...initialNotifications];
            const seenIds = new Set(combined.map(n => n.id));
            const seenHuKeys = new Set<string>();

            // Marcar las HU keys de las notificaciones iniciales
            combined.forEach(n => {
              if (n.huId && n.type) {
                seenHuKeys.add(`${n.huId}-${n.type}`);
              }
            });

            // Agregar notificaciones del localStorage sin duplicados
            withDates.forEach(n => {
              const huKey = n.huId ? `${n.huId}-${n.type}` : null;

              // Evitar duplicados por ID o por combinación huId+type
              if (!seenIds.has(n.id) && (!huKey || !seenHuKeys.has(huKey))) {
                combined.push(n);
                seenIds.add(n.id);
                if (huKey) {
                  seenHuKeys.add(huKey);
                }
              }
            });

            return combined.sort((a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
          });
        }
      } catch (error) {
        console.error('Error loading stored notifications:', error);
      }
    };

    loadStoredNotifications();

    // Escuchar cambios en localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'backlogNotifications') {
        loadStoredNotifications();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleNotificationClick = (clickedNotification: Notification) => {
    if (!clickedNotification) return;

    // Marcar como leída en el estado local
    setNotifications(
      notifications.map(n => n.id === clickedNotification.id ? { ...n, read: true } : n)
    );

    // También marcar como leída en localStorage si es una notificación del backlog
    if (clickedNotification.id.startsWith('backlog-notif-')) {
      try {
        const stored = localStorage.getItem('backlogNotifications');
        if (stored) {
          const storedNotifs = JSON.parse(stored);
          const updated = storedNotifs.map((n: Notification) =>
            n.id === clickedNotification.id ? { ...n, read: true } : n
          );
          localStorage.setItem('backlogNotifications', JSON.stringify(updated));
        }
      } catch (error) {
        console.error('Error updating notification in localStorage:', error);
      }
    }

    const mockProject: Project = {
        id: clickedNotification.projectId,
        name: clickedNotification.projectName,
        description: 'Descripción del proyecto de ejemplo. Esta data es un mock para la demostración de la navegación.',
        type: clickedNotification.projectType,
        classification: 'Gestión interna',
        status: 'En planificación',
        startDate: '2025-04',
        endDate: '2025-09',
        scrumMaster: 'Ana Pérez',
        annualAmount: 50000,
        strategicAction: 'AE N°1',
        missingData: false,
        years: ['2025'],
        responsibles: ['Ana Garcia'],
        financialArea: ['OTIN'],
        coordination: 'Coordinación 1',
        coordinator: 'Jefe de Proyecto',
        managementMethod: 'Scrum',
        subProjects: [],
    };
    localStorage.setItem('selectedProject', JSON.stringify(mockProject));

    // Redirigir según el tipo de notificación
    if (clickedNotification.type === 'hu_revision' || clickedNotification.type === 'hu_validated' || clickedNotification.type === 'hu_rejected') {
        // Notificaciones de HU: redirigir al Backlog del proyecto
        const backlogRoute = clickedNotification.projectType === 'Proyecto' ? paths.poi.proyecto.backlog.base : paths.poi.actividad.lista;
        router.push(backlogRoute);
    } else if (clickedNotification.type === 'sprint' || clickedNotification.type === 'delay') {
        const backlogRoute = clickedNotification.projectType === 'Proyecto' ? paths.poi.proyecto.backlog.base : paths.poi.actividad.lista;
        router.push(`${backlogRoute}?tab=Backlog`);
    } else {
        const route = clickedNotification.projectType === 'Proyecto' ? paths.poi.proyecto.detalles : paths.poi.actividad.detalles;
        router.push(route);
    }
  };
  
  const ALL_TABS: {name: string, type: NotificationType | NotificationType[] | 'all'}[] = [
    { name: 'Proyectos', type: 'project' },
    { name: 'Sprints', type: 'sprint' },
    { name: 'Validaciones', type: ['hu_revision', 'hu_validated', 'hu_rejected'] },
    { name: 'Retrasos', type: 'delay' },
  ];

  // Filtrar tabs según el rol: PMO no debe ver "Validaciones"
  const TABS = user?.role === ROLES.PMO
    ? ALL_TABS.filter(tab => tab.name !== 'Validaciones')
    : ALL_TABS;

  const currentTabType = TABS.find(t => t.name === activeTab)?.type;
  const filteredNotifications = notifications.filter(n => {
    if (!currentTabType) return true;
    if (Array.isArray(currentTabType)) {
      return currentTabType.includes(n.type);
    }
    return n.type === currentTabType;
  });

  return (
    <ProtectedRoute module={MODULES.NOTIFICACIONES}>
      <AppLayout breadcrumbs={[{ label: 'NOTIFICACIONES' }]}>
      <div className="bg-[#D5D5D5] border-y border-[#1A5581]">
        <div className="p-2 flex items-center justify-between w-full">
          <h2 className="font-bold text-black pl-2">NOTIFICACIONES</h2>
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
        </div>
        
        <div className="space-y-3">
            {filteredNotifications.length > 0 ? (
                filteredNotifications.map(notification => (
                    <NotificationCard key={notification.id} notification={notification} onClick={handleNotificationClick} />
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
