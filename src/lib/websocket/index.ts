/**
 * Módulo de WebSocket para comunicación en tiempo real
 *
 * @module websocket
 */

export { socketClient } from './socket-client';
export { WS_EVENTS, createRoomName } from './events';
export type {
  WebSocketEvent,
  NotificationData,
  TareaMovidaData,
  TareaCreadaData,
  TareaActualizadaData,
  TareaEliminadaData,
  ProyectoActualizadoData,
  SprintEventData,
  AprobacionData,
  ComentarioData,
} from './events';
