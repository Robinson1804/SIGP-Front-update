"use client";

import React from 'react';
import { ArrowLeft, Loader2, FolderKanban, ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ActividadSeccionCounts } from '@/lib/services/notificaciones.service';

export type ActividadSeccionName = 'asignaciones' | 'tareas';

interface ActividadSeccionBlockListProps {
  actividadId: number;
  actividadNombre: string;
  actividadCodigo: string;
  counts: ActividadSeccionCounts;
  loading: boolean;
  onSeccionClick: (seccion: ActividadSeccionName) => void;
  onBack: () => void;
}

const ACTIVIDAD_SECCION_CONFIG: {
  key: ActividadSeccionName;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    key: 'asignaciones',
    label: 'Asignaciones',
    icon: FolderKanban,
    description: 'Actividades asignadas',
  },
  {
    key: 'tareas',
    label: 'Tareas',
    icon: ListTodo,
    description: 'Tareas creadas y estados',
  },
];

export function ActividadSeccionBlockList({
  actividadNombre,
  actividadCodigo,
  counts,
  loading,
  onSeccionClick,
  onBack,
}: ActividadSeccionBlockListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-[#018CD1]" />
      </div>
    );
  }

  const totalNotificaciones = Object.values(counts).reduce(
    (sum, c) => sum + c.noLeidas,
    0
  );

  if (totalNotificaciones === 0) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <nav className="text-sm text-gray-500">
            <span className="text-gray-400">Actividades</span>
            <span className="mx-1 text-gray-400">&gt;</span>
            <span className="font-medium text-gray-700">{actividadCodigo}</span>
          </nav>
        </div>
        <div className="text-center py-10 text-gray-500">
          No hay notificaciones para esta actividad.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with back and breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <nav className="text-sm text-gray-500">
          <span className="text-gray-400">Actividades</span>
          <span className="mx-1 text-gray-400">&gt;</span>
          <span className="font-medium text-gray-700">{actividadCodigo}</span>
        </nav>
      </div>

      {/* Activity title */}
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {actividadCodigo}: {actividadNombre}
      </h3>

      {/* Section grid 1x2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ACTIVIDAD_SECCION_CONFIG.map(({ key, label, icon: Icon, description }) => {
          const seccionData = counts[key];
          const hasUnread = seccionData.noLeidas > 0;
          const total = seccionData.noLeidas;

          // Don't render if no notifications in this section
          if (total === 0) {
            return (
              <div
                key={key}
                className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
              >
                <div className="shrink-0 h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="font-semibold text-gray-500">{label}</p>
                  <p className="text-xs text-gray-400">{description}</p>
                </div>
                <span className="shrink-0 inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-sm font-medium bg-gray-200 text-gray-400">
                  0
                </span>
              </div>
            );
          }

          return (
            <div
              key={key}
              className={cn(
                "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors duration-200",
                "hover:bg-gray-100 bg-white border-gray-200"
              )}
              onClick={() => onSeccionClick(key)}
            >
              <div
                className={cn(
                  "shrink-0 h-10 w-10 rounded-lg flex items-center justify-center",
                  hasUnread ? "bg-[#018CD1]/10" : "bg-gray-100"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    hasUnread ? "text-[#018CD1]" : "text-gray-500"
                  )}
                />
              </div>

              <div className="flex-grow min-w-0">
                <p className="font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-500">{description}</p>
              </div>

              <span
                className={cn(
                  "shrink-0 inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-sm font-medium",
                  hasUnread
                    ? "bg-[#018CD1] text-white"
                    : "bg-gray-200 text-gray-600"
                )}
              >
                {total}
                {hasUnread && (
                  <span className="ml-1 h-2 w-2 rounded-full bg-white inline-block" />
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
