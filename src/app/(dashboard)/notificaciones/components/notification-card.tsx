"use client";

import React from 'react';
import { Folder, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { TimeAgo } from './time-ago';

export type NotificationStatus = 'Pendiente' | 'En planificación' | 'En desarrollo' | 'Finalizado' | 'En revisión';
export type NotificationType = 'project' | 'sprint' | 'delay' | 'hu_revision' | 'hu_validated' | 'hu_rejected' | 'validacion' | 'aprobacion' | 'sistema';

export type LocalNotification = {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  projectName: string;
  projectCode?: string;
  projectType: 'Proyecto' | 'Actividad' | 'Cronograma';
  status?: NotificationStatus;
  timestamp: Date;
  read: boolean;
  projectId: string;
  huId?: string;
  urlAccion?: string;
  observacion?: string;
};

const statusStyles: { [key: string]: { bg: string; text: string } } = {
  'Pendiente': { bg: 'bg-[#FE9F43]/20', text: 'text-yellow-800' },
  'En planificación': { bg: 'bg-[#FFD700]/20', text: 'text-amber-800' },
  'En desarrollo': { bg: 'bg-[#559FFE]/20', text: 'text-blue-800' },
  'Finalizado': { bg: 'bg-[#2FD573]/20', text: 'text-green-800' },
  'En revisión': { bg: 'bg-[#9B59B6]/20', text: 'text-purple-800' },
};

// Map backend notification to local format
export function mapBackendNotification(n: any): LocalNotification {
  let type: NotificationType = 'sistema';
  const tipoLower = n.tipo?.toLowerCase() || '';

  if (tipoLower === 'proyectos' || tipoLower === 'proyecto' || tipoLower === 'tareas' || tipoLower === 'tarea') {
    type = 'project';
  } else if (tipoLower === 'sprints' || tipoLower === 'sprint') {
    type = 'sprint';
  } else if (tipoLower === 'retrasos' || tipoLower === 'retraso') {
    type = 'delay';
  } else if (tipoLower === 'validaciones' || tipoLower === 'validacion') {
    type = 'validacion';
  } else if (tipoLower === 'aprobaciones' || tipoLower === 'aprobacion') {
    type = 'aprobacion';
  } else if (n.tipo === 'hu_revision') {
    type = 'hu_revision';
  } else if (n.tipo === 'hu_validated') {
    type = 'hu_validated';
  } else if (n.tipo === 'hu_rejected') {
    type = 'hu_rejected';
  }

  let projectType: 'Proyecto' | 'Actividad' | 'Cronograma' = 'Proyecto';
  if (n.entidadTipo === 'actividad' || n.entidadTipo === 'Actividad') {
    projectType = 'Actividad';
  } else if (n.entidadTipo === 'Cronograma' || n.entidadTipo === 'cronograma') {
    projectType = 'Cronograma';
  }

  let title = n.titulo;
  const projectCode = n.proyectoCodigo;
  const projectName = n.proyectoNombre || n.entidadNombre;

  if (projectCode && projectName) {
    if (n.titulo?.includes('Nuevo proyecto asignado') || n.titulo?.includes('Asignado como')) {
      if (n.titulo.includes('Scrum Master')) {
        title = `Asignado como Scrum Master: ${projectCode}`;
      } else if (n.titulo.includes('Coordinador')) {
        title = `Asignado como Coordinador: ${projectCode}`;
      } else {
        title = `Nuevo proyecto asignado: ${projectCode}`;
      }
    } else if (n.titulo?.includes('Cronograma aprobado')) {
      title = `Cronograma aprobado: ${projectName}`;
    } else if (n.titulo?.includes('Cronograma rechazado')) {
      title = `Cronograma rechazado: ${projectName}`;
    } else if (n.titulo?.includes('Cronograma pendiente')) {
      title = `Cronograma pendiente de aprobación: ${projectName}`;
    }
  }

  return {
    id: n.id.toString(),
    type,
    title,
    description: n.descripcion || n.mensaje,
    projectName: projectName || 'Sin proyecto',
    projectCode,
    projectType,
    status: n.metadata?.estado as NotificationStatus,
    timestamp: new Date(n.createdAt),
    read: n.leida,
    projectId: n.proyectoId?.toString() || n.entidadId?.toString() || '',
    huId: n.metadata?.huId?.toString(),
    urlAccion: n.urlAccion,
    observacion: n.observacion,
  };
}

interface NotificationCardProps {
  notification: LocalNotification;
  onClick: (notification: LocalNotification) => void;
  onViewObservacion?: (notification: LocalNotification) => void;
  checkbox?: boolean;
  checked?: boolean;
  onCheckChange?: (checked: boolean) => void;
}

export function NotificationCard({
  notification,
  onClick,
  onViewObservacion,
  checkbox = false,
  checked = false,
  onCheckChange,
}: NotificationCardProps) {
  const isUnread = !notification.read;

  const handleViewObservacion = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewObservacion) {
      onViewObservacion(notification);
    }
  };

  const handleCheckChange = (value: boolean) => {
    if (onCheckChange) {
      onCheckChange(value);
    }
  };

  return (
    <div
      className={cn(
        "relative flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-colors duration-300 hover:bg-gray-200/50 border",
        notification.read ? 'bg-gray-100 border-gray-200' : 'bg-white border-transparent shadow-sm'
      )}
      onClick={() => !checkbox && onClick(notification)}
    >
      {isUnread && !checkbox && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#018CD1] rounded-l-lg"></div>}

      {checkbox && (
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={checked}
            onCheckedChange={handleCheckChange}
          />
        </div>
      )}

      <div className="relative shrink-0">
        <div className={cn("flex items-center justify-center h-10 w-10 rounded-full", isUnread ? "bg-blue-100" : "bg-gray-200")}>
          <Folder className={cn("h-5 w-5", isUnread ? "text-[#018CD1]" : "text-gray-500")} />
        </div>
        {isUnread && !checkbox && <div className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-[#018CD1] border-2 border-white"></div>}
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
        {notification.observacion && (
          <Button
            variant="outline"
            size="sm"
            className="w-fit mt-1 text-xs"
            onClick={handleViewObservacion}
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Ver Observaciones
          </Button>
        )}
      </div>

      <div className="shrink-0 ml-auto self-start">
        <TimeAgo date={notification.timestamp} />
      </div>
    </div>
  );
}
