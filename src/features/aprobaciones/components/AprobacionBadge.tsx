/**
 * AprobacionBadge Component
 *
 * Badge para mostrar el estado de aprobación
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { EstadoAprobacion } from '../types';
import { ESTADO_APROBACION_LABELS } from '../types';

interface AprobacionBadgeProps {
  estado: EstadoAprobacion;
  className?: string;
  compact?: boolean;
}

/**
 * Obtiene la variante de color para un estado
 */
function getVariant(estado: EstadoAprobacion): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (estado) {
    case 'aprobado':
      return 'default'; // Verde (success se mapea a default con CSS custom)
    case 'rechazado':
      return 'destructive';
    case 'borrador':
      return 'secondary';
    case 'pendiente_coordinador':
    case 'pendiente_pmo':
    case 'pendiente_patrocinador':
      return 'outline';
    default:
      return 'secondary';
  }
}

/**
 * Obtiene clases CSS adicionales según estado
 */
function getStateClasses(estado: EstadoAprobacion): string {
  switch (estado) {
    case 'aprobado':
      return 'bg-green-500 text-white hover:bg-green-600';
    case 'rechazado':
      return ''; // destructive ya tiene rojo
    case 'pendiente_coordinador':
    case 'pendiente_pmo':
    case 'pendiente_patrocinador':
      return 'border-yellow-500 text-yellow-700 bg-yellow-50';
    case 'borrador':
      return '';
    default:
      return '';
  }
}

/**
 * Badge de estado de aprobación
 *
 * @example
 * ```tsx
 * <AprobacionBadge estado="aprobado" />
 * <AprobacionBadge estado="pendiente_coordinador" compact />
 * ```
 */
export function AprobacionBadge({
  estado,
  className,
  compact = false,
}: AprobacionBadgeProps) {
  const label = ESTADO_APROBACION_LABELS[estado];
  const variant = getVariant(estado);
  const stateClasses = getStateClasses(estado);

  return (
    <Badge
      variant={variant}
      className={cn(
        stateClasses,
        compact && 'text-xs px-2 py-0',
        className
      )}
    >
      {label}
    </Badge>
  );
}
