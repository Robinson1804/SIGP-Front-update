'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { socketClient, WS_EVENTS } from '@/lib/websocket';
import { useAuthStore } from '@/stores';

/**
 * Valor del contexto WebSocket
 */
interface WebSocketContextValue {
  /** Estado de conexión del socket */
  isConnected: boolean;
  /** Suscribirse a un evento */
  subscribe: (event: string, callback: (data: any) => void) => () => void;
  /** Emitir un evento al servidor */
  emit: (event: string, data?: any) => void;
  /** Unirse a una sala (room) */
  joinRoom: (room: string) => void;
  /** Salir de una sala (room) */
  leaveRoom: (room: string) => void;
  /** ID del socket actual (para debugging) */
  socketId: string | undefined;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

/**
 * Provider de WebSocket para toda la aplicación
 *
 * IMPORTANTE: Este provider debe estar DENTRO del AuthProvider
 * porque necesita acceso al token de autenticación.
 *
 * Características:
 * - Conecta automáticamente cuando el usuario está autenticado
 * - Desconecta automáticamente al hacer logout
 * - Maneja reconexiones automáticas
 * - Provee API simple para emitir y escuchar eventos
 *
 * @example
 * ```tsx
 * // En layout.tsx o app.tsx
 * import { WebSocketProvider } from '@/contexts/websocket-context';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <AuthProvider>
 *       <WebSocketProvider>
 *         {children}
 *       </WebSocketProvider>
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export function WebSocketProvider({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | undefined>(undefined);
  const isMountedRef = useRef(true);

  // Conectar/desconectar basado en autenticación
  useEffect(() => {
    isMountedRef.current = true;

    if (isAuthenticated && token) {
      // Conectar al servidor WebSocket
      socketClient.connect(token);

      // Suscribirse a eventos de conexión
      const unsubConnect = socketClient.on('connect', () => {
        if (isMountedRef.current) {
          setIsConnected(true);
          setSocketId(socketClient.getSocketId());
        }
      });

      const unsubDisconnect = socketClient.on('disconnect', () => {
        if (isMountedRef.current) {
          setIsConnected(false);
          setSocketId(undefined);
        }
      });

      // Cleanup: desconectar al desmontar o cuando cambie el token
      return () => {
        isMountedRef.current = false;
        unsubConnect();
        unsubDisconnect();
        // Use a small delay to avoid React Strict Mode double-mount issues
        // This allows the socket to complete handshake before cleanup
        setTimeout(() => {
          if (!isMountedRef.current) {
            socketClient.disconnect(true);
          }
        }, 100);
      };
    } else {
      // Si no está autenticado, asegurarse de desconectar
      socketClient.disconnect(true);
      setIsConnected(false);
      setSocketId(undefined);
    }
  }, [isAuthenticated, token]);

  /**
   * Suscribirse a un evento
   */
  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    return socketClient.on(event, callback);
  }, []);

  /**
   * Emitir un evento al servidor
   */
  const emit = useCallback((event: string, data?: any) => {
    socketClient.emit(event, data);
  }, []);

  /**
   * Unirse a una sala específica
   */
  const joinRoom = useCallback((room: string) => {
    socketClient.emit(WS_EVENTS.ROOM_JOIN, { room });
  }, []);

  /**
   * Salir de una sala específica
   */
  const leaveRoom = useCallback((room: string) => {
    socketClient.emit(WS_EVENTS.ROOM_LEAVE, { room });
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        subscribe,
        emit,
        joinRoom,
        leaveRoom,
        socketId,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

/**
 * Hook para acceder al contexto WebSocket
 *
 * @throws Error si se usa fuera del WebSocketProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isConnected, subscribe, emit } = useWebSocket();
 *
 *   useEffect(() => {
 *     const unsubscribe = subscribe('notification:new', (data) => {
 *       console.log('Nueva notificación:', data);
 *     });
 *
 *     return () => unsubscribe();
 *   }, [subscribe]);
 *
 *   return (
 *     <div>
 *       Estado: {isConnected ? 'Conectado' : 'Desconectado'}
 *     </div>
 *   );
 * }
 * ```
 */
export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket debe usarse dentro de un WebSocketProvider');
  }
  return context;
}
