"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { ActividadGroup } from '@/lib/services/notificaciones.service';

interface ActividadBlockListProps {
  groups: ActividadGroup[];
  loading: boolean;
  deleteMode: boolean;
  selectedIds: Set<number>;
  onToggleSelect: (actividadId: number) => void;
  onActividadClick: (actividadId: number, actividadNombre: string, actividadCodigo: string) => void;
}

export function ActividadBlockList({
  groups,
  loading,
  deleteMode,
  selectedIds,
  onToggleSelect,
  onActividadClick,
}: ActividadBlockListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-[#018CD1]" />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        No hay notificaciones de actividades.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const hasUnread = group.noLeidas > 0;
        const isSelected = selectedIds.has(group.actividadId);

        return (
          <div
            key={group.actividadId}
            className={cn(
              "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors duration-200",
              "hover:bg-gray-100",
              isSelected && deleteMode ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200"
            )}
            onClick={() => {
              if (deleteMode) {
                onToggleSelect(group.actividadId);
              } else {
                onActividadClick(group.actividadId, group.actividadNombre, group.actividadCodigo);
              }
            }}
          >
            {deleteMode && (
              <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelect(group.actividadId)}
                />
              </div>
            )}

            <div className="flex-grow min-w-0">
              <p className="font-semibold text-gray-800 truncate">
                {group.actividadCodigo}: {group.actividadNombre}
              </p>
            </div>

            <div className="shrink-0 ml-auto">
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-sm font-medium",
                  hasUnread
                    ? "bg-[#018CD1] text-white"
                    : "bg-gray-200 text-gray-600"
                )}
              >
                {group.total}
                {hasUnread && (
                  <span className="ml-1 h-2 w-2 rounded-full bg-white inline-block" />
                )}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
