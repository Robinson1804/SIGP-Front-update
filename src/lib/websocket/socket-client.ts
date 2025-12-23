import { io, Socket } from 'socket.io-client';

type EventCallback = (data: any) => void;

/**
 * Cliente WebSocket singleton para comunicación en tiempo real con el backend
 *
 * Características:
 * - Reconexión automática
 * - Gestión de listeners con cleanup
 * - Autenticación con JWT
 * - Emisión de eventos tipados
 *
 * @example
 * ```tsx
 * import { socketClient } from '@/lib/websocket';
 *
 * // Conectar (normalmente en WebSocketProvider)
 * socketClient.connect(token);
 *
 * // Escuchar eventos
 * const unsubscribe = socketClient.on('notification:new', (data) => {
 *   console.log('Nueva notificación:', data);
 * });
 *
 * // Limpiar listener
 * unsubscribe();
 *
 * // Emitir eventos
 * socketClient.emit('tablero:tarea-movida', { tareaId, nuevoEstado });
 * ```
 */
class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private isConnected: boolean = false;
  private isDevelopment: boolean = process.env.NODE_ENV === 'development';
  private connectionErrorLogged: boolean = false;

  /**
   * Conectar al servidor WebSocket
   * @param token JWT token para autenticación
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3010';

    this.socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 2, // Reduced to minimize noise
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
      timeout: 5000,
    });

    this.setupBaseListeners();
  }

  /**
   * Configurar listeners base de conexión
   */
  private setupBaseListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.connectionErrorLogged = false; // Reset on successful connection
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
    });

    this.socket.on('connect_error', () => {
      // Only log once to avoid console spam
      if (!this.connectionErrorLogged) {
        this.connectionErrorLogged = true;
        console.warn('[WS] WebSocket no disponible - funcionalidad en tiempo real deshabilitada');
      }
    });

    this.socket.on('error', () => {
      // Silently ignore errors - WebSocket is optional
    });

    // Re-emitir todos los eventos a los listeners registrados
    this.socket.onAny((event, data) => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.forEach(cb => {
          try {
            cb(data);
          } catch (error) {
            console.error(`[WS] Error en callback de ${event}:`, error);
          }
        });
      }
    });
  }

  /**
   * Registrar listener para un evento
   * @param event Nombre del evento
   * @param callback Función a ejecutar cuando se recibe el evento
   * @returns Función para desuscribirse
   */
  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Retornar función de cleanup
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  /**
   * Emitir un evento al servidor
   * @param event Nombre del evento
   * @param data Datos a enviar
   */
  emit(event: string, data?: any): void {
    if (!this.socket?.connected) {
      // Silently ignore - WebSocket is optional
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Desconectar del servidor y limpiar todos los listeners
   */
  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.isConnected = false;
    this.connectionErrorLogged = false; // Reset for next connection attempt
    this.listeners.clear();
  }

  /**
   * Obtener estado de conexión
   * @returns true si está conectado
   */
  getConnectionStatus(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Obtener ID del socket (para debugging)
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

/**
 * Instancia singleton del cliente WebSocket
 * Usar esta instancia en toda la aplicación
 */
export const socketClient = new SocketClient();
