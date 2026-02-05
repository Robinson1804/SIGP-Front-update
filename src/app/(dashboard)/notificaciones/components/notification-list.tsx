"use client";

import React from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationCard, type LocalNotification } from './notification-card';
import { PaginationControls } from './pagination-controls';

interface NotificationListProps {
  notifications: LocalNotification[];
  loading: boolean;
  proyectoNombre: string;
  proyectoCodigo?: string;
  sprintNombre?: string;
  deleteMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onNotificationClick: (notification: LocalNotification) => void;
  onViewObservacion: (notification: LocalNotification) => void;
  onMarkAllRead: () => void;
  onBack: () => void;
  hasUnread: boolean;
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function NotificationList({
  notifications,
  loading,
  proyectoNombre,
  proyectoCodigo,
  sprintNombre,
  deleteMode,
  selectedIds,
  onToggleSelect,
  onNotificationClick,
  onViewObservacion,
  onMarkAllRead,
  onBack,
  hasUnread,
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: NotificationListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <nav className="text-sm text-gray-500">
            <span className="text-gray-400">Proyectos</span>
            <span className="mx-1 text-gray-400">&gt;</span>
            <span className="font-medium text-gray-700">{proyectoCodigo || proyectoNombre}</span>
            {sprintNombre && (
              <>
                <span className="mx-1 text-gray-400">&gt;</span>
                <span className="font-medium text-gray-700">{sprintNombre}</span>
              </>
            )}
          </nav>
        </div>

        {hasUnread && !deleteMode && (
          <Button variant="outline" size="sm" onClick={onMarkAllRead}>
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {loading ? (
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
                onClick={onNotificationClick}
                onViewObservacion={onViewObservacion}
                checkbox={deleteMode}
                checked={selectedIds.has(notification.id)}
                onCheckChange={() => onToggleSelect(notification.id)}
              />
            ))}
          </div>
          <PaginationControls
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={onPageChange}
          />
        </>
      )}
    </div>
  );
}
