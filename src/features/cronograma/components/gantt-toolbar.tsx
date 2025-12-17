'use client';

/**
 * GanttToolbar Component
 *
 * Barra de herramientas para el diagrama de Gantt
 * Incluye selector de vista, botones de accion y filtros
 */

import { Plus, Download, RefreshCw, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { PermissionGate } from '@/features/auth/components/permission-gate';
import { MODULES, PERMISSIONS } from '@/lib/definitions';
import type { ViewMode, FormatoExportacion } from '../types';
import { VIEW_MODE_OPTIONS } from '../types';

interface GanttToolbarProps {
  /** Modo de vista actual */
  viewMode: ViewMode;
  /** Callback cuando cambia el modo de vista */
  onViewModeChange: (mode: ViewMode) => void;
  /** Callback para agregar tarea */
  onAddTask?: () => void;
  /** Callback para exportar */
  onExport?: (formato: FormatoExportacion) => void;
  /** Callback para refrescar */
  onRefresh?: () => void;
  /** Indica si esta cargando */
  isLoading?: boolean;
  /** Mostrar boton de agregar */
  showAddButton?: boolean;
  /** Mostrar boton de exportar */
  showExportButton?: boolean;
  /** Mostrar boton de refrescar */
  showRefreshButton?: boolean;
  /** Deshabilitar todas las acciones */
  disabled?: boolean;
  /** Clase CSS adicional */
  className?: string;
}

/**
 * Barra de herramientas del Gantt
 *
 * @example
 * <GanttToolbar
 *   viewMode="Week"
 *   onViewModeChange={setViewMode}
 *   onAddTask={openAddModal}
 *   onExport={handleExport}
 * />
 */
export function GanttToolbar({
  viewMode,
  onViewModeChange,
  onAddTask,
  onExport,
  onRefresh,
  isLoading = false,
  showAddButton = true,
  showExportButton = true,
  showRefreshButton = true,
  disabled = false,
  className,
}: GanttToolbarProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-4 p-4 bg-white border-b ${className}`}
    >
      {/* Selector de vista */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-500" />
        <Select
          value={viewMode}
          onValueChange={(value) => onViewModeChange(value as ViewMode)}
          disabled={disabled || isLoading}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Seleccionar vista" />
          </SelectTrigger>
          <SelectContent>
            {VIEW_MODE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Acciones principales */}
      <div className="flex items-center gap-2">
        {/* Boton Agregar Tarea */}
        {showAddButton && (
          <PermissionGate module={MODULES.POI} permission={PERMISSIONS.CREATE}>
            <Button
              variant="default"
              size="sm"
              onClick={onAddTask}
              disabled={disabled || isLoading || !onAddTask}
              className="bg-[#004272] hover:bg-[#003156]"
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar Tarea
            </Button>
          </PermissionGate>
        )}

        {/* Boton Exportar */}
        {showExportButton && onExport && (
          <PermissionGate module={MODULES.POI} permission={PERMISSIONS.EXPORT}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={disabled || isLoading}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onExport('pdf')}>
                  <span className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-red-600"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                    </svg>
                    Exportar a PDF
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport('excel')}>
                  <span className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-600"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                    </svg>
                    Exportar a Excel
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </PermissionGate>
        )}

        {/* Boton Refrescar */}
        {showRefreshButton && onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={disabled || isLoading}
            title="Refrescar cronograma"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
          </Button>
        )}
      </div>

      {/* Espaciador */}
      <div className="flex-1" />

      {/* Info adicional o filtros futuros */}
      <div className="text-sm text-gray-500">
        Vista: <span className="font-medium">{VIEW_MODE_OPTIONS.find(o => o.value === viewMode)?.label || viewMode}</span>
      </div>
    </div>
  );
}

/**
 * Variante compacta de la toolbar
 */
export function GanttToolbarCompact({
  viewMode,
  onViewModeChange,
  onAddTask,
  disabled = false,
  isLoading = false,
}: Pick<
  GanttToolbarProps,
  'viewMode' | 'onViewModeChange' | 'onAddTask' | 'disabled' | 'isLoading'
>) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={viewMode}
        onValueChange={(value) => onViewModeChange(value as ViewMode)}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="w-[100px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {VIEW_MODE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {onAddTask && (
        <PermissionGate module={MODULES.POI} permission={PERMISSIONS.CREATE}>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddTask}
            disabled={disabled || isLoading}
            className="h-8"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </PermissionGate>
      )}
    </div>
  );
}
