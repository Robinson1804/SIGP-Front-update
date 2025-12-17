'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/contexts/websocket-context';
import { WS_EVENTS } from '@/lib/websocket';
import type { AprobacionData } from '@/lib/websocket';

/**
 * Estado de una aprobación pendiente
 */
export interface AprobacionPendiente {
  documentoId: string;
  tipo: string;
  titulo: string;
  solicitante: string;
  fechaSolicitud?: string;
}

/**
 * Opciones del hook useRealtimeAprobaciones
 */
interface UseRealtimeAprobacionesOptions {
  /** Callback cuando llega una nueva aprobación pendiente */
  onNuevaAprobacion?: (aprobacion: AprobacionData) => void;
  /** Callback cuando se completa una aprobación */
  onAprobacionCompletada?: (aprobacion: AprobacionData) => void;
  /** Callback cuando se rechaza una aprobación */
  onAprobacionRechazada?: (aprobacion: AprobacionData) => void;
  /** Callback cuando llega un recordatorio */
  onRecordatorio?: (aprobacion: AprobacionData) => void;
}

/**
 * Hook para gestionar aprobaciones de documentos en tiempo real
 *
 * Características:
 * - Escucha eventos de aprobaciones pendientes
 * - Mantiene contador de pendientes
 * - Notifica cuando hay cambios de estado
 * - Recordatorios automáticos
 *
 * @example
 * ```tsx
 * function AprobacionesPendientes() {
 *   const { pendientes, count, isConnected } = useRealtimeAprobaciones({
 *     onNuevaAprobacion: (aprobacion) => {
 *       toast.info(`Nueva aprobación pendiente: ${aprobacion.titulo}`);
 *     },
 *     onAprobacionCompletada: (aprobacion) => {
 *       toast.success('Aprobación completada');
 *     },
 *   });
 *
 *   return (
 *     <div>
 *       <Badge>{count}</Badge>
 *       <List items={pendientes} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useRealtimeAprobaciones({
  onNuevaAprobacion,
  onAprobacionCompletada,
  onAprobacionRechazada,
  onRecordatorio,
}: UseRealtimeAprobacionesOptions = {}) {
  const { subscribe, isConnected } = useWebSocket();
  const [pendientes, setPendientes] = useState<AprobacionPendiente[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribers: (() => void)[] = [];

    // NUEVA APROBACIÓN PENDIENTE
    const unsubPendiente = subscribe(
      WS_EVENTS.APROBACION_PENDIENTE,
      (data: AprobacionData) => {
        // Agregar a la lista de pendientes
        setPendientes(prev => [
          ...prev,
          {
            documentoId: data.documentoId,
            tipo: data.tipo,
            titulo: data.titulo,
            solicitante: data.solicitante,
          },
        ]);
        setCount(prev => prev + 1);

        onNuevaAprobacion?.(data);
      }
    );
    unsubscribers.push(unsubPendiente);

    // APROBACIÓN COMPLETADA
    const unsubCompletada = subscribe(
      WS_EVENTS.APROBACION_COMPLETADA,
      (data: AprobacionData) => {
        // Remover de pendientes
        setPendientes(prev => prev.filter(p => p.documentoId !== data.documentoId));
        setCount(prev => Math.max(0, prev - 1));

        onAprobacionCompletada?.(data);
      }
    );
    unsubscribers.push(unsubCompletada);

    // APROBACIÓN RECHAZADA
    const unsubRechazada = subscribe(
      WS_EVENTS.APROBACION_RECHAZADA,
      (data: AprobacionData) => {
        // Remover de pendientes
        setPendientes(prev => prev.filter(p => p.documentoId !== data.documentoId));
        setCount(prev => Math.max(0, prev - 1));

        onAprobacionRechazada?.(data);
      }
    );
    unsubscribers.push(unsubRechazada);

    // RECORDATORIO
    const unsubRecordatorio = subscribe(
      WS_EVENTS.APROBACION_RECORDATORIO,
      (data: AprobacionData) => {
        onRecordatorio?.(data);
      }
    );
    unsubscribers.push(unsubRecordatorio);

    // Cleanup
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [
    isConnected,
    subscribe,
    onNuevaAprobacion,
    onAprobacionCompletada,
    onAprobacionRechazada,
    onRecordatorio,
  ]);

  return {
    /** Lista de aprobaciones pendientes */
    pendientes,
    /** Contador de aprobaciones pendientes */
    count,
    /** Estado de conexión WebSocket */
    isConnected,
  };
}
