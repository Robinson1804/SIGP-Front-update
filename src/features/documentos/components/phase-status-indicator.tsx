'use client';

/**
 * Indicador de Estado de Fase
 *
 * Muestra un indicador visual del estado de una fase basado en los documentos:
 * - Verde: Todos los documentos obligatorios están aprobados
 * - Amarillo: Hay documentos pendientes de revisión
 * - Rojo: Hay documentos rechazados
 */

import { cn } from '@/lib/utils';
import type { Documento } from '../types';

export type PhaseStatusType = 'green' | 'yellow' | 'red' | 'gray';

interface PhaseStatusIndicatorProps {
  documentos: Documento[];
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * Calcula el estado de una fase basándose en sus documentos
 */
export function getPhaseStatus(documentos: Documento[]): PhaseStatusType {
  if (documentos.length === 0) return 'gray';

  const rechazados = documentos.filter(d => d.estado === 'No Aprobado');
  if (rechazados.length > 0) return 'red';

  const obligatorios = documentos.filter(d => d.esObligatorio);
  if (obligatorios.length === 0) {
    // Sin obligatorios: verde si todos aprobados, amarillo si hay pendientes
    const pendientes = documentos.filter(d => d.estado === 'Pendiente');
    return pendientes.length > 0 ? 'yellow' : 'green';
  }

  const obligatoriosAprobados = obligatorios.filter(d => d.estado === 'Aprobado');
  if (obligatoriosAprobados.length === obligatorios.length) return 'green';

  return 'yellow';
}

/**
 * Obtiene las estadísticas de documentos de una fase
 */
export function getPhaseStats(documentos: Documento[]) {
  const total = documentos.length;
  const obligatorios = documentos.filter(d => d.esObligatorio).length;
  const aprobados = documentos.filter(d => d.estado === 'Aprobado').length;
  const pendientes = documentos.filter(d => d.estado === 'Pendiente').length;
  const rechazados = documentos.filter(d => d.estado === 'No Aprobado').length;
  const obligatoriosAprobados = documentos.filter(d => d.esObligatorio && d.estado === 'Aprobado').length;

  return {
    total,
    obligatorios,
    aprobados,
    pendientes,
    rechazados,
    obligatoriosAprobados,
    porcentajeAprobados: total > 0 ? Math.round((aprobados / total) * 100) : 0,
  };
}

const statusConfig = {
  green: {
    bg: 'bg-green-500',
    ring: 'ring-green-500/30',
    label: 'Completado',
    labelColor: 'text-green-700',
  },
  yellow: {
    bg: 'bg-yellow-500',
    ring: 'ring-yellow-500/30',
    label: 'Pendiente',
    labelColor: 'text-yellow-700',
  },
  red: {
    bg: 'bg-red-500',
    ring: 'ring-red-500/30',
    label: 'Rechazado',
    labelColor: 'text-red-700',
  },
  gray: {
    bg: 'bg-gray-300',
    ring: 'ring-gray-300/30',
    label: 'Sin documentos',
    labelColor: 'text-gray-500',
  },
};

const sizeConfig = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
};

export function PhaseStatusIndicator({
  documentos,
  size = 'md',
  showLabel = false,
  className,
}: PhaseStatusIndicatorProps) {
  const status = getPhaseStatus(documentos);
  const config = statusConfig[status];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn(
          'rounded-full ring-2',
          config.bg,
          config.ring,
          sizeConfig[size]
        )}
        title={config.label}
      />
      {showLabel && (
        <span className={cn('text-xs font-medium', config.labelColor)}>
          {config.label}
        </span>
      )}
    </div>
  );
}
