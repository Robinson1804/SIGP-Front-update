'use client';

import { useEffect, useCallback } from 'react';
import { useWebSocket } from '@/contexts/websocket-context';
import { WS_EVENTS, createRoomName } from '@/lib/websocket';
import type { ProyectoActualizadoData, SprintEventData } from '@/lib/websocket';

/**
 * Opciones del hook useRealtimeProyecto
 */
interface UseRealtimeProyectoOptions {
  /** ID del proyecto */
  proyectoId: string;
  /** Callback cuando el proyecto es actualizado */
  onProyectoActualizado?: (data: ProyectoActualizadoData) => void;
  /** Callback cuando cambia el estado del proyecto */
  onEstadoCambiado?: (data: { proyectoId: string; nuevoEstado: string }) => void;
  /** Callback cuando un sprint se inicia */
  onSprintIniciado?: (data: SprintEventData) => void;
  /** Callback cuando un sprint se cierra */
  onSprintCerrado?: (data: SprintEventData) => void;
  /** Callback cuando se agrega un miembro */
  onMiembroAgregado?: (data: any) => void;
  /** Callback cuando se remueve un miembro */
  onMiembroRemovido?: (data: any) => void;
}

/**
 * Hook para eventos en tiempo real de un proyecto específico
 *
 * Características:
 * - Auto-join/leave de sala del proyecto
 * - Escucha cambios de estado
 * - Eventos de sprints
 * - Gestión de miembros del equipo
 *
 * @example
 * ```tsx
 * function ProyectoDetail({ proyectoId }) {
 *   const [proyecto, setProyecto] = useState<Proyecto>();
 *
 *   useRealtimeProyecto({
 *     proyectoId,
 *     onProyectoActualizado: (data) => {
 *       setProyecto(prev => ({ ...prev, ...data.cambios }));
 *     },
 *     onSprintIniciado: (data) => {
 *       toast.success(`Sprint ${data.sprintId} iniciado`);
 *       refreshSprints();
 *     },
 *   });
 *
 *   return <div>{proyecto?.nombre}</div>;
 * }
 * ```
 */
export function useRealtimeProyecto({
  proyectoId,
  onProyectoActualizado,
  onEstadoCambiado,
  onSprintIniciado,
  onSprintCerrado,
  onMiembroAgregado,
  onMiembroRemovido,
}: UseRealtimeProyectoOptions) {
  const { subscribe, joinRoom, leaveRoom, isConnected } = useWebSocket();

  // Join/leave de la sala del proyecto
  useEffect(() => {
    if (!isConnected || !proyectoId) return;

    const room = createRoomName.proyecto(proyectoId);
    joinRoom(room);

    return () => {
      leaveRoom(room);
    };
  }, [isConnected, proyectoId, joinRoom, leaveRoom]);

  // Suscribirse a eventos del proyecto
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribers: (() => void)[] = [];

    // PROYECTO ACTUALIZADO
    if (onProyectoActualizado) {
      const unsub = subscribe(
        WS_EVENTS.PROYECTO_ACTUALIZADO,
        (data: ProyectoActualizadoData) => {
          if (data.proyectoId !== proyectoId) return;
          onProyectoActualizado(data);
        }
      );
      unsubscribers.push(unsub);
    }

    // ESTADO CAMBIADO
    if (onEstadoCambiado) {
      const unsub = subscribe(
        WS_EVENTS.PROYECTO_ESTADO_CAMBIADO,
        (data: { proyectoId: string; nuevoEstado: string }) => {
          if (data.proyectoId !== proyectoId) return;
          onEstadoCambiado(data);
        }
      );
      unsubscribers.push(unsub);
    }

    // SPRINT INICIADO
    if (onSprintIniciado) {
      const unsub = subscribe(WS_EVENTS.SPRINT_INICIADO, (data: SprintEventData) => {
        if (data.proyectoId !== proyectoId) return;
        onSprintIniciado(data);
      });
      unsubscribers.push(unsub);
    }

    // SPRINT CERRADO
    if (onSprintCerrado) {
      const unsub = subscribe(WS_EVENTS.SPRINT_CERRADO, (data: SprintEventData) => {
        if (data.proyectoId !== proyectoId) return;
        onSprintCerrado(data);
      });
      unsubscribers.push(unsub);
    }

    // MIEMBRO AGREGADO
    if (onMiembroAgregado) {
      const unsub = subscribe(WS_EVENTS.PROYECTO_MIEMBRO_AGREGADO, (data: any) => {
        if (data.proyectoId !== proyectoId) return;
        onMiembroAgregado(data);
      });
      unsubscribers.push(unsub);
    }

    // MIEMBRO REMOVIDO
    if (onMiembroRemovido) {
      const unsub = subscribe(WS_EVENTS.PROYECTO_MIEMBRO_REMOVIDO, (data: any) => {
        if (data.proyectoId !== proyectoId) return;
        onMiembroRemovido(data);
      });
      unsubscribers.push(unsub);
    }

    // Cleanup
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [
    isConnected,
    proyectoId,
    subscribe,
    onProyectoActualizado,
    onEstadoCambiado,
    onSprintIniciado,
    onSprintCerrado,
    onMiembroAgregado,
    onMiembroRemovido,
  ]);

  return {
    isConnected,
  };
}
