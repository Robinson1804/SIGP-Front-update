/**
 * Definición centralizada de eventos WebSocket
 *
 * Todos los eventos del sistema están definidos aquí para evitar typos
 * y facilitar el mantenimiento.
 */

export const WS_EVENTS = {
  // ============================================================
  // NOTIFICACIONES
  // ============================================================
  /** Nueva notificación recibida */
  NOTIFICATION_NEW: 'notification:new',
  /** Notificación marcada como leída */
  NOTIFICATION_READ: 'notification:read',
  /** Actualización del contador de notificaciones */
  NOTIFICATION_COUNT: 'notification:count',

  // ============================================================
  // TABLERO KANBAN / SCRUM (Tiempo Real)
  // ============================================================
  /** Cliente se une a una sala de tablero */
  TABLERO_JOIN: 'tablero:join',
  /** Cliente abandona una sala de tablero */
  TABLERO_LEAVE: 'tablero:leave',
  /** Tarea movida a otra columna (drag & drop) */
  TABLERO_TAREA_MOVIDA: 'tablero:tarea-movida',
  /** Nueva tarea creada en el tablero */
  TABLERO_TAREA_CREADA: 'tablero:tarea-creada',
  /** Tarea actualizada (título, descripción, etc.) */
  TABLERO_TAREA_ACTUALIZADA: 'tablero:tarea-actualizada',
  /** Tarea eliminada del tablero */
  TABLERO_TAREA_ELIMINADA: 'tablero:tarea-eliminada',
  /** Asignación de tarea modificada */
  TABLERO_ASIGNACION_CAMBIADA: 'tablero:asignacion-cambiada',

  // ============================================================
  // PROYECTOS
  // ============================================================
  /** Proyecto actualizado (metadatos, fechas, etc.) */
  PROYECTO_ACTUALIZADO: 'proyecto:actualizado',
  /** Cambio de estado del proyecto */
  PROYECTO_ESTADO_CAMBIADO: 'proyecto:estado-cambiado',
  /** Nuevo miembro agregado al proyecto */
  PROYECTO_MIEMBRO_AGREGADO: 'proyecto:miembro-agregado',
  /** Miembro removido del proyecto */
  PROYECTO_MIEMBRO_REMOVIDO: 'proyecto:miembro-removido',

  // ============================================================
  // SPRINTS (SCRUM)
  // ============================================================
  /** Sprint iniciado */
  SPRINT_INICIADO: 'sprint:iniciado',
  /** Sprint cerrado */
  SPRINT_CERRADO: 'sprint:cerrado',
  /** Cambio en el estado del sprint */
  SPRINT_ESTADO_CAMBIADO: 'sprint:estado-cambiado',
  /** Velocidad del sprint actualizada */
  SPRINT_VELOCIDAD_ACTUALIZADA: 'sprint:velocidad-actualizada',

  // ============================================================
  // ACTIVIDADES (KANBAN)
  // ============================================================
  /** Actividad actualizada */
  ACTIVIDAD_ACTUALIZADA: 'actividad:actualizada',
  /** Estado de actividad cambiado */
  ACTIVIDAD_ESTADO_CAMBIADO: 'actividad:estado-cambiado',

  // ============================================================
  // APROBACIONES
  // ============================================================
  /** Nueva aprobación pendiente */
  APROBACION_PENDIENTE: 'aprobacion:pendiente',
  /** Aprobación completada */
  APROBACION_COMPLETADA: 'aprobacion:completada',
  /** Aprobación rechazada */
  APROBACION_RECHAZADA: 'aprobacion:rechazada',
  /** Recordatorio de aprobación pendiente */
  APROBACION_RECORDATORIO: 'aprobacion:recordatorio',

  // ============================================================
  // COMENTARIOS
  // ============================================================
  /** Nuevo comentario en una tarea/historia/documento */
  COMENTARIO_NUEVO: 'comentario:nuevo',
  /** Comentario editado */
  COMENTARIO_EDITADO: 'comentario:editado',
  /** Comentario eliminado */
  COMENTARIO_ELIMINADO: 'comentario:eliminado',
  /** Mención en un comentario (@usuario) */
  COMENTARIO_MENCION: 'comentario:mencion',

  // ============================================================
  // DOCUMENTOS
  // ============================================================
  /** Nuevo documento subido */
  DOCUMENTO_NUEVO: 'documento:nuevo',
  /** Documento actualizado/reemplazado */
  DOCUMENTO_ACTUALIZADO: 'documento:actualizado',
  /** Documento eliminado */
  DOCUMENTO_ELIMINADO: 'documento:eliminado',

  // ============================================================
  // SALAS (ROOMS)
  // ============================================================
  /** Unirse a una sala genérica */
  ROOM_JOIN: 'room:join',
  /** Salir de una sala genérica */
  ROOM_LEAVE: 'room:leave',

  // ============================================================
  // SISTEMA
  // ============================================================
  /** Ping del cliente al servidor */
  PING: 'ping',
  /** Pong del servidor al cliente */
  PONG: 'pong',
} as const;

/**
 * Tipo TypeScript para eventos WebSocket
 * Garantiza que solo se usen eventos definidos
 */
export type WebSocketEvent = typeof WS_EVENTS[keyof typeof WS_EVENTS];

/**
 * Tipos de datos para eventos específicos
 */

export interface NotificationData {
  id: string;
  tipo: 'info' | 'warning' | 'error' | 'success';
  titulo: string;
  mensaje: string;
  url?: string;
  createdAt: string;
  leido: boolean;
}

export interface TareaMovidaData {
  tableroId: string;
  tableroTipo: 'sprint' | 'actividad';
  tareaId: string;
  estadoAnterior: string;
  nuevoEstado: string;
  movidoPor: string;
  timestamp: string;
}

export interface TareaCreadaData {
  tableroId: string;
  tableroTipo: 'sprint' | 'actividad';
  tarea: {
    id: string;
    titulo: string;
    estado: string;
    prioridad?: string;
    asignadoA?: string;
    [key: string]: any;
  };
}

export interface TareaActualizadaData {
  tableroId: string;
  tableroTipo: 'sprint' | 'actividad';
  tarea: {
    id: string;
    [key: string]: any;
  };
  cambios: Record<string, any>;
}

export interface TareaEliminadaData {
  tableroId: string;
  tableroTipo: 'sprint' | 'actividad';
  tareaId: string;
}

export interface ProyectoActualizadoData {
  proyectoId: string;
  cambios: Record<string, any>;
}

export interface SprintEventData {
  sprintId: string;
  proyectoId: string;
  estado?: string;
  [key: string]: any;
}

export interface AprobacionData {
  documentoId: string;
  tipo: string;
  titulo: string;
  solicitante: string;
  aprobador?: string;
  estado?: string;
  comentario?: string;
}

export interface ComentarioData {
  comentarioId: string;
  entidadId: string;
  entidadTipo: 'tarea' | 'historia' | 'documento' | 'sprint';
  autor: {
    id: string;
    nombre: string;
    avatar?: string;
  };
  contenido: string;
  mencionados?: string[];
  timestamp: string;
}

/**
 * Helper para crear nombres de salas (rooms)
 */
export const createRoomName = {
  tablero: (tipo: 'sprint' | 'actividad', id: string) => `tablero:${tipo}:${id}`,
  proyecto: (id: string) => `proyecto:${id}`,
  sprint: (id: string) => `sprint:${id}`,
  actividad: (id: string) => `actividad:${id}`,
} as const;
