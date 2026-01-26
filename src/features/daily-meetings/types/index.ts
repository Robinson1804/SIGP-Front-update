/**
 * Daily Meetings Types
 *
 * Tipos para el módulo de reuniones diarias (Scrum)
 */

/**
 * Estado de un participante en la daily
 */
export interface ParticipanteDaily {
  id: number;
  personalId: number;
  nombre: string;
  avatar?: string;
  rol: string;
  asistio: boolean;
  /** Lo que hizo ayer */
  ayer: string;
  /** Lo que hará hoy */
  hoy: string;
  /** Impedimentos o bloqueos */
  impedimentos: string;
  /** Notas adicionales */
  notas?: string;
}

/**
 * Daily Meeting / Reunión diaria
 */
export interface DailyMeeting {
  id: number;
  sprintId: number;
  sprintNombre?: string;
  proyectoId: number;
  proyectoNombre?: string;
  fecha: string;
  horaInicio: string;
  horaFin?: string;
  duracionMinutos?: number;
  participantes: ParticipanteDaily[];
  totalParticipantes: number;
  asistentes: number;
  notas?: string;
  impedimentosGlobales?: string[];
  creadoPor: number;
  creadoPorNombre?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tipo de Daily Meeting
 * Debe coincidir con el enum del backend: 'Proyecto' | 'Actividad'
 */
export type DailyMeetingTipo = 'Proyecto' | 'Actividad';

/**
 * Datos de participante para crear daily
 */
export interface CreateParticipanteDto {
  usuarioId: number;
  asistio?: boolean;
  queHiceAyer?: string;
  queHareHoy?: string;
  impedimentos?: string;
}

/**
 * Datos para crear una daily meeting
 */
export interface CreateDailyMeetingDto {
  tipo: DailyMeetingTipo;
  proyectoId?: number;
  actividadId?: number;
  sprintId?: number;
  nombre: string;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  facilitadorId?: number;
  notas?: string;
  linkReunion?: string;
  participantes?: CreateParticipanteDto[];
}

/**
 * Datos para actualizar una daily meeting
 */
export interface UpdateDailyMeetingDto {
  horaFin?: string;
  duracionMinutos?: number;
  notas?: string;
  impedimentosGlobales?: string[];
}

/**
 * Datos para registrar participación
 */
export interface RegistrarParticipacionDto {
  personalId: number;
  asistio: boolean;
  ayer: string;
  hoy: string;
  impedimentos: string;
  notas?: string;
}

/**
 * Resumen de dailies del sprint
 */
export interface DailyMeetingSummary {
  sprintId: number;
  totalDailies: number;
  dailiesCompletadas: number;
  promedioAsistencia: number;
  impedimentosAbiertos: number;
  ultimaDaily?: {
    id: number;
    fecha: string;
    asistentes: number;
  };
}

/**
 * Filtros para buscar dailies
 */
export interface DailyMeetingFilters {
  sprintId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  limit?: number;
  offset?: number;
}
