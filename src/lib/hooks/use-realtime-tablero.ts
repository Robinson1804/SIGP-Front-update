'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '@/contexts/websocket-context';
import { WS_EVENTS, createRoomName } from '@/lib/websocket';
import type {
  TareaMovidaData,
  TareaCreadaData,
  TareaActualizadaData,
  TareaEliminadaData,
} from '@/lib/websocket';

/**
 * Estructura de una tarea en el tablero
 */
export interface TareaTablero {
  id: string;
  estado: string;
  titulo?: string;
  descripcion?: string;
  prioridad?: string;
  asignadoA?: string;
  [key: string]: any;
}

/**
 * Opciones del hook useRealtimeTablero
 */
interface UseRealtimeTableroOptions {
  /** ID del tablero (sprint_id o actividad_id) */
  tableroId: string;
  /** Tipo de tablero */
  tableroTipo: 'sprint' | 'actividad';
  /** Tareas iniciales (del servidor) */
  initialTareas?: TareaTablero[];
  /** Callback cuando una tarea es movida */
  onTareaMovida?: (data: TareaMovidaData) => void;
  /** Callback cuando una tarea es creada */
  onTareaCreada?: (data: TareaCreadaData) => void;
  /** Callback cuando una tarea es actualizada */
  onTareaActualizada?: (data: TareaActualizadaData) => void;
  /** Callback cuando una tarea es eliminada */
  onTareaEliminadaData?: (data: TareaEliminadaData) => void;
}

/**
 * Hook para sincronización en tiempo real de tableros Kanban/Scrum
 *
 * Características:
 * - Auto-join/leave de salas al montar/desmontar
 * - Actualización optimista del estado local
 * - Callbacks personalizables para eventos
 * - Sincronización automática con otros usuarios
 *
 * @example
 * ```tsx
 * function TableroKanban({ sprintId }) {
 *   const { tareas, moverTarea, isConnected } = useRealtimeTablero({
 *     tableroId: sprintId,
 *     tableroTipo: 'sprint',
 *     initialTareas: tareasDelServidor,
 *     onTareaMovida: (data) => {
 *       toast.success(`Tarea movida a ${data.nuevoEstado}`);
 *     },
 *   });
 *
 *   const handleDragEnd = (tareaId: string, nuevoEstado: string) => {
 *     moverTarea(tareaId, nuevoEstado);
 *   };
 *
 *   return (
 *     <div>
 *       <StatusIndicator connected={isConnected} />
 *       <Board tareas={tareas} onDragEnd={handleDragEnd} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useRealtimeTablero({
  tableroId,
  tableroTipo,
  initialTareas = [],
  onTareaMovida,
  onTareaCreada,
  onTareaActualizada,
  onTareaEliminadaData,
}: UseRealtimeTableroOptions) {
  const { subscribe, emit, joinRoom, leaveRoom, isConnected } = useWebSocket();
  const [tareas, setTareas] = useState<TareaTablero[]>(initialTareas);

  // Actualizar tareas cuando cambien las iniciales (por ejemplo, después de un fetch)
  useEffect(() => {
    setTareas(initialTareas);
  }, [initialTareas]);

  // Join/leave de la sala del tablero
  useEffect(() => {
    if (!isConnected || !tableroId) return;

    const room = createRoomName.tablero(tableroTipo, tableroId);
    joinRoom(room);

    return () => {
      leaveRoom(room);
    };
  }, [isConnected, tableroId, tableroTipo, joinRoom, leaveRoom]);

  // Suscribirse a eventos del tablero
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribers: (() => void)[] = [];

    // TAREA MOVIDA (drag & drop)
    const unsubMovida = subscribe(WS_EVENTS.TABLERO_TAREA_MOVIDA, (data: TareaMovidaData) => {
      // Ignorar eventos de otros tableros
      if (data.tableroId !== tableroId) return;

      // Actualizar estado local
      setTareas(prev =>
        prev.map(t =>
          t.id === data.tareaId ? { ...t, estado: data.nuevoEstado } : t
        )
      );

      // Ejecutar callback personalizado
      onTareaMovida?.(data);
    });
    unsubscribers.push(unsubMovida);

    // TAREA CREADA
    const unsubCreada = subscribe(WS_EVENTS.TABLERO_TAREA_CREADA, (data: TareaCreadaData) => {
      if (data.tableroId !== tableroId) return;

      // Agregar nueva tarea al estado
      setTareas(prev => [...prev, data.tarea as TareaTablero]);

      onTareaCreada?.(data);
    });
    unsubscribers.push(unsubCreada);

    // TAREA ACTUALIZADA
    const unsubActualizada = subscribe(
      WS_EVENTS.TABLERO_TAREA_ACTUALIZADA,
      (data: TareaActualizadaData) => {
        if (data.tableroId !== tableroId) return;

        // Actualizar tarea en el estado
        setTareas(prev =>
          prev.map(t => (t.id === data.tarea.id ? { ...t, ...data.tarea } : t))
        );

        onTareaActualizada?.(data);
      }
    );
    unsubscribers.push(unsubActualizada);

    // TAREA ELIMINADA
    const unsubEliminada = subscribe(
      WS_EVENTS.TABLERO_TAREA_ELIMINADA,
      (data: TareaEliminadaData) => {
        if (data.tableroId !== tableroId) return;

        // Remover tarea del estado
        setTareas(prev => prev.filter(t => t.id !== data.tareaId));

        onTareaEliminadaData?.(data);
      }
    );
    unsubscribers.push(unsubEliminada);

    // Cleanup
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [
    isConnected,
    tableroId,
    subscribe,
    onTareaMovida,
    onTareaCreada,
    onTareaActualizada,
    onTareaEliminadaData,
  ]);

  /**
   * Mover una tarea a otro estado (emite evento al servidor)
   */
  const moverTarea = useCallback(
    (tareaId: string, nuevoEstado: string) => {
      // Actualización optimista
      const tareaActual = tareas.find(t => t.id === tareaId);
      if (!tareaActual) return;

      const estadoAnterior = tareaActual.estado;

      setTareas(prev =>
        prev.map(t => (t.id === tareaId ? { ...t, estado: nuevoEstado } : t))
      );

      // Emitir evento al servidor
      emit(WS_EVENTS.TABLERO_TAREA_MOVIDA, {
        tableroId,
        tableroTipo,
        tareaId,
        estadoAnterior,
        nuevoEstado,
      });
    },
    [emit, tableroId, tableroTipo, tareas]
  );

  /**
   * Refrescar tareas desde el servidor (útil después de actualizaciones)
   */
  const setTareasManual = useCallback((nuevasTareas: TareaTablero[]) => {
    setTareas(nuevasTareas);
  }, []);

  return {
    /** Tareas actuales del tablero */
    tareas,
    /** Establecer tareas manualmente */
    setTareas: setTareasManual,
    /** Mover una tarea a otro estado */
    moverTarea,
    /** Estado de conexión WebSocket */
    isConnected,
  };
}
