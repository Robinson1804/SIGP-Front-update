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

  /**
   * Conectar al servidor WebSocket
   * @param token JWT token para autenticación
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      if (this.isDevelopment) {
        console.log('[WS] Ya está conectado');
      }
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3010';

    this.socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupBaseListeners();
  }

  /**
   * Configurar listeners base de conexión
   */
  private setupBaseListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      if (this.isDevelopment) {
        console.log('[WS] Conectado al servidor');
      }
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      if (this.isDevelopment) {
        console.log('[WS] Desconectado:', reason);
      }
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      if (this.isDevelopment) {
        console.error('[WS] Error de conexión:', error.message);
      }
    });

    this.socket.on('error', (error) => {
      console.error('[WS] Error del servidor:', error);
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

    if (this.isDevelopment) {
      console.log(`[WS] Listener registrado para: ${event}`);
    }

    // Retornar función de cleanup
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(event);
        }
      }
      if (this.isDevelopment) {
        console.log(`[WS] Listener removido de: ${event}`);
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
      console.warn('[WS] No conectado, no se puede emitir:', event);
      return;
    }

    if (this.isDevelopment) {
      console.log('[WS] Emitiendo:', event, data);
    }

    this.socket.emit(event, data);
  }

  /**
   * Desconectar del servidor y limpiar todos los listeners
   */
  disconnect(): void {
    if (this.isDevelopment) {
      console.log('[WS] Desconectando...');
    }

    this.socket?.disconnect();
    this.socket = null;
    this.isConnected = false;
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
