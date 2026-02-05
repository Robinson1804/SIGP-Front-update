"use client";

import React from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { SprintGroup } from '@/lib/services/notificaciones.service';

interface SprintBlockListProps {
  groups: SprintGroup[];
  loading: boolean;
  proyectoNombre: string;
  proyectoCodigo?: string;
  deleteMode: boolean;
  selectedIds: Set<number>;
  onToggleSelect: (sprintId: number) => void;
  onSprintClick: (sprintId: number, sprintNombre: string) => void;
  onBack: () => void;
}

export function SprintBlockList({
  groups,
  loading,
  proyectoNombre,
  proyectoCodigo,
  deleteMode,
  selectedIds,
  onToggleSelect,
  onSprintClick,
  onBack,
}: SprintBlockListProps) {
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
          <span className="font-medium text-gray-700">{proyectoCodigo || proyectoNombre}</span>
          <span className="mx-1 text-gray-400">&gt;</span>
          <span className="font-medium text-gray-700">Sprints</span>
        </nav>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-[#018CD1]" />
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No hay sprints con notificaciones en este proyecto.
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const hasUnread = group.noLeidas > 0;
            const isSelected = selectedIds.has(group.sprintId);

            return (
              <div
                key={group.sprintId}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors duration-200",
                  "hover:bg-gray-100",
                  isSelected && deleteMode ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200"
                )}
                onClick={() => {
                  if (deleteMode) {
                    onToggleSelect(group.sprintId);
                  } else {
                    onSprintClick(group.sprintId, group.sprintNombre);
                  }
                }}
              >
                {deleteMode && (
                  <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleSelect(group.sprintId)}
                    />
                  </div>
                )}

                <div className="flex-grow min-w-0">
                  <p className="font-semibold text-gray-800 truncate">
                    {group.sprintNombre}
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
      )}
    </div>
  );
}
