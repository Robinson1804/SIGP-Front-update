"use client";

import React from 'react';
import { ArrowLeft, Loader2, FolderKanban, RefreshCw, CheckCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SeccionCounts } from '@/lib/services/notificaciones.service';

export type SeccionName = 'asignaciones' | 'sprints' | 'aprobaciones' | 'validaciones';

interface SeccionBlockListProps {
  proyectoId: number;
  proyectoNombre: string;
  proyectoCodigo: string;
  counts: SeccionCounts;
  loading: boolean;
  onSeccionClick: (seccion: SeccionName) => void;
  onBack: () => void;
}

const SECCION_CONFIG: {
  key: SeccionName;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    key: 'asignaciones',
    label: 'Asignaciones',
    icon: FolderKanban,
    description: 'Proyectos asignados',
  },
  {
    key: 'sprints',
    label: 'Sprints',
    icon: RefreshCw,
    description: 'Estados de sprints',
  },
  {
    key: 'aprobaciones',
    label: 'Aprobaciones',
    icon: CheckCircle,
    description: 'Aprobaciones de documentos',
  },
  {
    key: 'validaciones',
    label: 'Validaciones',
    icon: Search,
    description: 'Pendientes de validar',
  },
];

export function SeccionBlockList({
  proyectoNombre,
  proyectoCodigo,
  counts,
  loading,
  onSeccionClick,
  onBack,
}: SeccionBlockListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-[#018CD1]" />
      </div>
    );
  }

  const totalNotificaciones = Object.values(counts).reduce(
    (sum, c) => sum + c.total,
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
            <span className="text-gray-400">Proyectos</span>
            <span className="mx-1 text-gray-400">&gt;</span>
            <span className="font-medium text-gray-700">{proyectoCodigo}</span>
          </nav>
        </div>
        <div className="text-center py-10 text-gray-500">
          No hay notificaciones para este proyecto.
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
          <span className="text-gray-400">Proyectos</span>
          <span className="mx-1 text-gray-400">&gt;</span>
          <span className="font-medium text-gray-700">{proyectoCodigo}</span>
        </nav>
      </div>

      {/* Project title */}
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {proyectoCodigo}: {proyectoNombre}
      </h3>

      {/* Section grid 2x2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SECCION_CONFIG.map(({ key, label, icon: Icon, description }) => {
          const seccionData = counts[key];
          const hasUnread = seccionData.noLeidas > 0;
          const total = seccionData.total;

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
