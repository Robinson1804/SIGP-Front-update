'use client';

import { useEffect } from 'react';
import { useWebSocket } from '@/contexts/websocket-context';
import { WS_EVENTS } from '@/lib/websocket';
import type { NotificationData } from '@/lib/websocket';

/**
 * Hook para recibir notificaciones en tiempo real vía WebSocket
 *
 * Este hook se suscribe automáticamente a eventos de notificaciones
 * y ejecuta callbacks cuando se reciben nuevas notificaciones.
 *
 * @param onNotification Callback ejecutado cuando se recibe una nueva notificación
 * @param onCountUpdate Callback ejecutado cuando se actualiza el contador de notificaciones
 *
 * @example
 * ```tsx
 * function NotificationBell() {
 *   const [count, setCount] = useState(0);
 *
 *   useRealtimeNotifications({
 *     onNotification: (notification) => {
 *       toast({
 *         title: notification.titulo,
 *         description: notification.mensaje,
 *       });
 *     },
 *     onCountUpdate: (newCount) => {
 *       setCount(newCount);
 *     },
 *   });
 *
 *   return <Badge>{count}</Badge>;
 * }
 * ```
 */
export function useRealtimeNotifications({
  onNotification,
  onCountUpdate,
}: {
  onNotification?: (notification: NotificationData) => void;
  onCountUpdate?: (count: number) => void;
} = {}) {
  const { subscribe, isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribers: (() => void)[] = [];

    // Escuchar nuevas notificaciones
    if (onNotification) {
      const unsubNew = subscribe(WS_EVENTS.NOTIFICATION_NEW, (data: NotificationData) => {
        onNotification(data);
      });
      unsubscribers.push(unsubNew);
    }

    // Escuchar actualizaciones del contador
    if (onCountUpdate) {
      const unsubCount = subscribe(WS_EVENTS.NOTIFICATION_COUNT, (data: { count: number }) => {
        onCountUpdate(data.count);
      });
      unsubscribers.push(unsubCount);
    }

    // Cleanup: desuscribirse al desmontar
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [isConnected, subscribe, onNotification, onCountUpdate]);

  return {
    isConnected,
  };
}
