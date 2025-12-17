/**
 * Aprobaciones Feature - Types
 *
 * Tipos para el sistema de flujos de aprobación
 */

/**
 * Estados de aprobación en el flujo
 */
export type EstadoAprobacion =
  | 'borrador'
  | 'pendiente_coordinador'
  | 'pendiente_pmo'
  | 'pendiente_patrocinador'
  | 'aprobado'
  | 'rechazado';

/**
 * Tipos de entidades que pueden tener flujo de aprobación
 */
export type TipoEntidadAprobacion =
  | 'acta_constitucion'
  | 'acta_reunion'
  | 'informe_sprint'
  | 'informe_actividad';

/**
 * Niveles de aprobación según rol
 */
export type NivelAprobador = 'SCRUM_MASTER' | 'COORDINADOR' | 'PMO' | 'PATROCINADOR';

/**
 * Aprobador en el historial
 */
export interface Aprobador {
  id: number;
  nombre: string;
  rol: string;
}

/**
 * Registro del historial de aprobación
 */
export interface HistorialAprobacion {
  id: number;
  entidadTipo: TipoEntidadAprobacion;
  entidadId: number;
  estado: EstadoAprobacion;
  aprobadorId: number;
  aprobador: Aprobador;
  comentario?: string;
  fecha: string;
  accion: 'aprobar' | 'rechazar' | 'enviar';
}

/**
 * Paso individual en el flujo de aprobación
 */
export interface FlujoPasoAprobacion {
  orden: number;
  rol: NivelAprobador;
  estado: EstadoAprobacion;
  completado: boolean;
  fecha?: string;
  aprobador?: {
    id: number;
    nombre: string;
  };
}

/**
 * Flujo completo de aprobación para una entidad
 */
export interface FlujoAprobacion {
  tipo: TipoEntidadAprobacion;
  estadoActual: EstadoAprobacion;
  pasos: FlujoPasoAprobacion[];
  puedeAprobar: boolean;
  puedeRechazar: boolean;
  puedeEnviar?: boolean;
}

/**
 * Entidad pendiente de aprobación
 */
export interface PendienteAprobacion {
  id: number;
  tipo: TipoEntidadAprobacion;
  titulo: string;
  descripcion?: string;
  solicitante: {
    id: number;
    nombre: string;
  };
  fechaSolicitud: string;
  estadoActual: EstadoAprobacion;
  proyectoId?: number;
  proyectoNombre?: string;
  actividadId?: number;
  actividadNombre?: string;
}

/**
 * Input para aprobar una entidad
 */
export interface AprobarInput {
  comentario?: string;
}

/**
 * Input para rechazar una entidad
 */
export interface RechazarInput {
  motivo: string;
}

/**
 * Respuesta de acción de aprobación
 */
export interface AprobacionResponse {
  success: boolean;
  message: string;
  nuevoEstado: EstadoAprobacion;
}

/**
 * Mapa de tipos de entidad a labels
 */
export const TIPO_ENTIDAD_LABELS: Record<TipoEntidadAprobacion, string> = {
  acta_constitucion: 'Acta de Constitución',
  acta_reunion: 'Acta de Reunión',
  informe_sprint: 'Informe de Sprint',
  informe_actividad: 'Informe de Actividad',
};

/**
 * Mapa de estados a labels
 */
export const ESTADO_APROBACION_LABELS: Record<EstadoAprobacion, string> = {
  borrador: 'Borrador',
  pendiente_coordinador: 'Pendiente Coordinador',
  pendiente_pmo: 'Pendiente PMO',
  pendiente_patrocinador: 'Pendiente Patrocinador',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
};

/**
 * Variantes de color para estados
 */
export const ESTADO_APROBACION_VARIANT = {
  borrador: 'secondary',
  pendiente_coordinador: 'warning',
  pendiente_pmo: 'warning',
  pendiente_patrocinador: 'warning',
  aprobado: 'success',
  rechazado: 'destructive',
} as const;
