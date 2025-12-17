/**
 * AprobacionActions Component
 *
 * Botones de acción para aprobar/rechazar
 */

'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FlujoAprobacion } from '../types';
import { AprobacionModal } from './AprobacionModal';

interface AprobacionActionsProps {
  flujo: FlujoAprobacion;
  onAprobar: (comentario?: string) => Promise<boolean>;
  onRechazar: (motivo: string) => Promise<boolean>;
  onEnviar?: () => Promise<boolean>;
  isLoading?: boolean;
  className?: string;
}

/**
 * Botones de acción para aprobación
 *
 * Maneja los estados y permisos automáticamente
 *
 * @example
 * ```tsx
 * <AprobacionActions
 *   flujo={flujo}
 *   onAprobar={handleAprobar}
 *   onRechazar={handleRechazar}
 * />
 * ```
 */
export function AprobacionActions({
  flujo,
  onAprobar,
  onRechazar,
  onEnviar,
  isLoading = false,
  className,
}: AprobacionActionsProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'aprobar' | 'rechazar'>('aprobar');

  const handleOpenModal = (action: 'aprobar' | 'rechazar') => {
    setModalAction(action);
    setModalOpen(true);
  };

  const handleConfirm = async (value: string) => {
    const success =
      modalAction === 'aprobar'
        ? await onAprobar(value || undefined)
        : await onRechazar(value);

    if (success) {
      setModalOpen(false);
    }
    return success;
  };

  const handleEnviar = async () => {
    if (onEnviar) {
      await onEnviar();
    }
  };

  const esBorrador = flujo.estadoActual === 'borrador';
  const mostrarEnviar = esBorrador && onEnviar && flujo.puedeEnviar;

  return (
    <>
      <div className={cn('flex items-center gap-2', className)}>
        {/* Botón Enviar a Revisión (solo en borrador) */}
        {mostrarEnviar && (
          <Button
            onClick={handleEnviar}
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Enviar a Revisión
          </Button>
        )}

        {/* Botón Aprobar */}
        {flujo.puedeAprobar && !esBorrador && (
          <Button
            onClick={() => handleOpenModal('aprobar')}
            disabled={isLoading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4" />
            Aprobar
          </Button>
        )}

        {/* Botón Rechazar */}
        {flujo.puedeRechazar && !esBorrador && (
          <Button
            onClick={() => handleOpenModal('rechazar')}
            disabled={isLoading}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            Rechazar
          </Button>
        )}

        {/* Mensaje si no hay acciones disponibles */}
        {!flujo.puedeAprobar && !flujo.puedeRechazar && !mostrarEnviar && (
          <p className="text-sm text-gray-500">
            No tienes permisos para aprobar o rechazar
          </p>
        )}
      </div>

      {/* Modal de confirmación */}
      <AprobacionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        action={modalAction}
        onConfirm={handleConfirm}
      />
    </>
  );
}
