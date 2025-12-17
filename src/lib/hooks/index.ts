/**
 * Custom React hooks para la aplicación SIGP
 */

// Hooks existentes
export { usePermissions } from './use-permissions';

// Hooks de WebSocket (tiempo real)
export { useRealtimeNotifications } from './use-realtime-notifications';
export { useRealtimeTablero } from './use-realtime-tablero';
export type { TareaTablero } from './use-realtime-tablero';
export { useRealtimeAprobaciones } from './use-realtime-aprobaciones';
export type { AprobacionPendiente } from './use-realtime-aprobaciones';
export { useRealtimeProyecto } from './use-realtime-proyecto';
