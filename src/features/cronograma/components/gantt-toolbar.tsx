'use client';

/**
 * GanttToolbar Component
 *
 * Barra de herramientas para el diagrama de Gantt
 * Incluye selector de vista, botones de accion y filtros
 */

import { Plus, Download, RefreshCw, Calendar, CheckCircle, Send } from 'lucide-react';
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
  /** Callback para validar cronograma */
  onValidate?: () => void;
  /** Callback para enviar a revisión */
  onSendToReview?: () => void;
  /** Indica si esta cargando */
  isLoading?: boolean;
  /** Mostrar boton de agregar */
  showAddButton?: boolean;
  /** Mostrar boton de exportar */
  showExportButton?: boolean;
  /** Mostrar boton de refrescar */
  showRefreshButton?: boolean;
  /** Mostrar boton de validar */
  showValidateButton?: boolean;
  /** Mostrar boton de enviar a revisión */
  showSendToReviewButton?: boolean;
  /** Puede agregar tareas (basado en rol) */
  canAddTask?: boolean;
  /** Puede validar (basado en rol) */
  canValidate?: boolean;
  /** Puede enviar a revisión (basado en rol) */
  canSendToReview?: boolean;
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
  onValidate,
  onSendToReview,
  isLoading = false,
  showAddButton = true,
  showExportButton = true,
  showRefreshButton = true,
  showValidateButton = false,
  showSendToReviewButton = false,
  canAddTask = true,
  canValidate = false,
  canSendToReview = false,
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
        {/* Boton Agregar Tarea - Solo SCRUM_MASTER */}
        {showAddButton && canAddTask && (
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
        )}

        {/* Boton Exportar - Todos pueden exportar */}
        {showExportButton && onExport && (
          <DropdownMenu modal={false}>
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
        )}

        {/* Boton Enviar a Revisión - Solo SCRUM_MASTER cuando estado es Borrador */}
        {showSendToReviewButton && canSendToReview && onSendToReview && (
          <Button
            variant="default"
            size="sm"
            onClick={onSendToReview}
            disabled={disabled || isLoading}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Send className="h-4 w-4 mr-1" />
            Enviar a Revisión
          </Button>
        )}

        {/* Boton Validar - Solo PMO y PATROCINADOR cuando estado es En revisión */}
        {showValidateButton && canValidate && onValidate && (
          <Button
            variant="default"
            size="sm"
            onClick={onValidate}
            disabled={disabled || isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Validar
          </Button>
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
  canAddTask = true,
}: Pick<
  GanttToolbarProps,
  'viewMode' | 'onViewModeChange' | 'onAddTask' | 'disabled' | 'isLoading' | 'canAddTask'
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

      {onAddTask && canAddTask && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAddTask}
          disabled={disabled || isLoading}
          className="h-8"
        >
          <Plus className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
