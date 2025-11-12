
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileText,
  Target,
  Users,
  BarChart,
  Bell,
  BellRing,
  Folder,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { type Project } from '@/lib/definitions';

type NotificationStatus = 'Pendiente' | 'En planificación' | 'En desarrollo' | 'Finalizado';
type NotificationType = 'project' | 'sprint' | 'delay';

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  projectName: string;
  status?: NotificationStatus;
  timestamp: Date;
  read: boolean;
  projectId: string;
};

const initialNotifications: Notification[] = [
  { id: '1', type: 'project', title: 'El proyecto está pendiente', projectName: 'Implementación y desarrollo de un chatbot', status: 'Pendiente', timestamp: new Date(Date.now() - 5 * 60 * 1000), read: false, projectId: '1' },
  { id: '2', type: 'project', title: 'El proyecto está en planificación', projectName: 'Administración del portafolio de proyectos', status: 'En planificación', timestamp: new Date(Date.now() - 5 * 60 * 1000), read: false, projectId: '2' },
  { id: '3', type: 'project', title: 'El proyecto está en desarrollo', projectName: 'CPV', status: 'En desarrollo', timestamp: new Date(Date.now() - 45 * 60 * 1000), read: false, projectId: '3' },
  { id: '4', type: 'project', title: 'El proyecto ha finalizado', projectName: 'App móvil para el monitoreo de tablets', status: 'Finalizado', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), read: false, projectId: '4' },
  { id: '5', type: 'sprint', title: 'Sprint 2 finalizado', description: 'El sprint 2 del proyecto ha finalizado', projectName: 'Administración de portafolio de proyectos', timestamp: new Date(Date.now() - 15 * 60 * 1000), read: false, projectId: '2' },
  { id: '6', type: 'sprint', title: 'Sprint 1 finalizado', description: 'El sprint 1 del proyecto ha finalizado', projectName: 'CPV', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), read: true, projectId: '3' },
  { id: '7', type: 'delay', title: 'Historia de usuario atrasada', description: 'HU - 1: Captura de datos para el procesamiento del personal', projectName: 'CPV', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), read: false, projectId: '3' },
  { id: '8', type: 'delay', title: 'Historia de usuario atrasada', description: 'HU - 5: Visualización de reportes', projectName: 'Administración de Proyectos', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), read: true, projectId: '1' },
];

const statusColors: { [key: string]: string } = {
  'Pendiente': '#FE9F43',
  'En planificación': '#FFD700',
  'En desarrollo': '#559FFE',
  'Finalizado': '#2FD573',
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

  return <span className="text-sm text-gray-500">{timeAgo}</span>;
};


const NotificationCard = ({ notification, onClick }: { notification: Notification, onClick: (notification: Notification) => void }) => {
  const isUnread = !notification.read;

  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-colors duration-300 hover:bg-gray-200/50 border",
        notification.read ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-200'
      )}
      onClick={() => onClick(notification)}
    >
      <div className={cn("w-1 self-stretch rounded-full", isUnread ? "bg-[#018CD1]" : "bg-transparent")}></div>
      <div className={cn("flex items-center justify-center h-10 w-10 rounded-full shrink-0", isUnread ? "bg-blue-100" : "bg-gray-200")}>
        <Folder className={cn("h-5 w-5", isUnread ? "text-[#018CD1]" : "text-gray-500")} />
      </div>
      <div className="flex-grow space-y-2">
        <p className="font-bold">{notification.title}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {notification.description && !notification.status && (
            <p className="text-sm text-gray-600">{notification.description}</p>
          )}
          {notification.status && (
            <Badge style={{ backgroundColor: statusColors[notification.status], color: 'black' }} className="font-semibold">
              {notification.status}
            </Badge>
          )}
          <Badge variant="outline" className="bg-[#E9F4FF] border-transparent text-black">
            Proyecto: {notification.projectName}
          </Badge>
        </div>
      </div>
      <div className="shrink-0 ml-auto">
        <TimeAgo date={notification.timestamp} />
      </div>
    </div>
  );
};


const navItems = [
  { label: "PGD", icon: FileText, href: "/pmo-dashboard" },
  { label: "POI", icon: Target, href: "/poi" },
  { label: "RECURSOS HUMANOS", icon: Users, href: "/recursos-humanos" },
  { label: "DASHBOARD", icon: BarChart, href: "/dashboard" },
  { label: "NOTIFICACIONES", icon: Bell, href: "/notificaciones" },
];

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('Proyectos');
  const [notifications, setNotifications] = useState(initialNotifications);
  const router = useRouter();

  const handleNotificationClick = (clickedNotification: Notification) => {
    if (!clickedNotification) return;

    setNotifications(
      notifications.map(n => n.id === clickedNotification.id ? { ...n, read: true } : n)
    );
    
    const mockProject: Project = {
        id: clickedNotification.projectId,
        name: clickedNotification.projectName,
        description: 'Descripción del proyecto de ejemplo. Esta data es un mock para la demostración de la navegación.',
        type: 'Proyecto',
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

    let route = '/poi/detalles';
    if (clickedNotification.type === 'sprint' || clickedNotification.type === 'delay') {
        route += '?tab=Backlog';
    }
    router.push(route);
  };
  
  const TABS: {name: string, type: NotificationType | 'all'}[] = [
    { name: 'Proyectos', type: 'project' },
    { name: 'Sprints', type: 'sprint' },
    { name: 'Retrasos', type: 'delay' },
  ];

  const currentTabType = TABS.find(t => t.name === activeTab)?.type;
  const filteredNotifications = notifications.filter(n => currentTabType ? n.type === currentTabType : true);


  return (
    <AppLayout
      navItems={navItems}
      breadcrumbs={[{ label: 'NOTIFICACIONES' }]}
    >
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
  );
}
