/**
 * Documentos Types
 *
 * Definiciones de tipos para documentos, actas e informes
 */

// ===========================================
// DOCUMENTOS
// ===========================================

/**
 * Estados de un documento
 */
export type DocumentoEstado = 'Pendiente' | 'Aprobado' | 'No Aprobado';

/**
 * Fases del proyecto para documentos
 */
export type DocumentoFase =
  | 'Analisis y Planificacion'
  | 'Diseno'
  | 'Desarrollo'
  | 'Pruebas'
  | 'Implementacion'
  | 'Mantenimiento';

/**
 * Categorias de archivo permitidas
 */
export type DocumentoCategoria =
  | 'documento'
  | 'evidencia'
  | 'acta'
  | 'informe'
  | 'cronograma'
  | 'adjunto'
  | 'backup';

/**
 * Tipo de contenedor del documento
 */
export type DocumentoTipoContenedor = 'PROYECTO' | 'SUBPROYECTO';

/**
 * Documento del proyecto
 */
export interface Documento {
  id: number;
  tipoContenedor?: DocumentoTipoContenedor;
  proyectoId: number;
  subproyectoId?: number | null;
  fase: DocumentoFase;
  nombre: string;
  descripcion?: string | null;
  link?: string | null;
  estado: DocumentoEstado;

  // Archivo asociado (MinIO)
  archivoId?: string | null;
  archivoUrl?: string | null;
  archivoNombre?: string | null;
  archivoTamano?: number | null;
  tipoArchivo?: string | null;

  // Indicador de documento obligatorio
  esObligatorio: boolean;

  // Aprobación
  aprobadoPor?: number | null;
  fechaAprobacion?: string | null;
  observacionAprobacion?: string | null;

  // Metadata
  categoria?: DocumentoCategoria;
  version?: number;
  activo: boolean;

  // Auditoria
  createdBy: number;
  updatedBy?: number | null;
  createdAt: string;
  updatedAt: string;

  // Relaciones expandidas (opcional, según endpoint)
  creador?: {
    id: number;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno?: string;
  };
  aprobador?: {
    id: number;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno?: string;
  };
}

/**
 * Input para crear documento
 */
export interface CreateDocumentoInput {
  tipoContenedor?: DocumentoTipoContenedor;
  proyectoId: number;
  subproyectoId?: number;
  fase: DocumentoFase;
  nombre: string;
  descripcion?: string;
  link?: string;
  archivoUrl?: string;
  archivoNombre?: string;
  archivoTamano?: number;
  archivoId?: string;
  esObligatorio?: boolean;
  categoria?: DocumentoCategoria;
}

/**
 * Input para actualizar documento
 */
export interface UpdateDocumentoInput {
  nombre?: string;
  fase?: DocumentoFase;
  descripcion?: string;
  link?: string;
  archivoId?: string;
  esObligatorio?: boolean;
}

/**
 * Input para aprobar/rechazar documento
 */
export interface AprobarDocumentoInput {
  estado: 'Aprobado' | 'No Aprobado';
  observacion?: string;
}

/**
 * Respuesta de subida de documento
 */
export interface UploadDocumentoResponse {
  uploadUrl: string;
  archivoId: string;
  objectKey: string;
  bucket: string;
  expiresIn: number;
  requiredHeaders: Record<string, string>;
}

/**
 * Filtros para consultar documentos
 */
export interface DocumentoQueryFilters {
  fase?: DocumentoFase;
  estado?: DocumentoEstado;
  categoria?: DocumentoCategoria;
  page?: number;
  pageSize?: number;
}

// ===========================================
// ACTAS
// ===========================================

/**
 * Tipos de acta
 */
export type ActaTipo = 'Reunion' | 'Constitucion' | 'DailyMeeting';

/**
 * Estados de aprobacion de acta
 */
export type ActaEstado = 'Borrador' | 'Pendiente' | 'Aprobado' | 'Rechazado';

/**
 * Tipos de reunion
 */
export type TipoReunion =
  | 'Planificacion'
  | 'Seguimiento'
  | 'Revision'
  | 'Retrospectiva'
  | 'Tecnica'
  | 'Otro';

/**
 * Modalidad de reunion
 */
export type Modalidad = 'Presencial' | 'Virtual' | 'Hibrida';

/**
 * Niveles de aprobacion
 */
export type ActaNivelAprobacion =
  | 'Scrum Master'
  | 'Coordinador'
  | 'PMO'
  | 'Patrocinador';

/**
 * Participante de reunion (asistente/ausente)
 */
export interface ActaParticipante {
  id?: number;
  personalId?: number;
  nombre: string;
  cargo?: string;
  direccion?: string;
  organizacion?: string;
  esExterno?: boolean;
  motivo?: string; // Para ausentes
}

/**
 * Participante de Daily Meeting con las 3 preguntas Scrum
 */
export interface ActaDailyParticipante {
  id?: string;
  personalId?: number;
  nombre: string;
  cargo?: string;
  // Las 3 preguntas clásicas de Scrum
  ayer: string; // ¿Qué hiciste ayer?
  hoy: string; // ¿Qué harás hoy?
  impedimentos: string; // ¿Tienes algún impedimento?
}

/**
 * Item de agenda
 */
export interface ActaAgendaItem {
  id?: string;
  orden?: number;
  tema: string;
  descripcion?: string;
}

/**
 * Tema desarrollado en reunion
 */
export interface ActaTemaDesarrollado {
  id?: string;
  agendaItemId?: string;
  tema: string;
  notas?: string;
  conclusiones?: string;
}

/**
 * Acuerdo/Compromiso de reunion
 */
export interface ActaAcuerdo {
  id?: string;
  descripcion: string;
  responsables?: number[];
  responsablesNombres?: string[];
  fechaCompromiso?: string;
  prioridad?: 'Alta' | 'Media' | 'Baja';
}

/**
 * Proximo paso de reunion
 */
export interface ActaProximoPaso {
  id?: string;
  descripcion: string;
  responsableId?: number;
  responsableNombre?: string;
  fechaLimite?: string;
}

/**
 * Entregable del proyecto (Acta Constitucion)
 */
export interface ActaEntregable {
  id?: string;
  nombre: string;
  descripcion?: string;
  fechaEstimada?: string;
}

/**
 * Riesgo identificado (Acta Constitucion)
 */
export interface ActaRiesgo {
  id?: string;
  descripcion: string;
  probabilidad?: 'Alta' | 'Media' | 'Baja';
  impacto?: 'Alto' | 'Medio' | 'Bajo';
  mitigacion?: string;
}

/**
 * Hito del cronograma (Acta Constitucion)
 */
export interface ActaHito {
  id?: string;
  nombre: string;
  fechaEstimada?: string;
  descripcion?: string;
}

/**
 * Miembro del equipo (Acta Constitucion)
 */
export interface ActaMiembroEquipo {
  id?: string;
  personalId?: number;
  nombre: string;
  rol: string;
  responsabilidad?: string;
}

/**
 * Anexo referenciado
 */
export interface ActaAnexo {
  id?: string;
  nombre: string;
  url?: string;
  descripcion?: string;
}

/**
 * Acta completa
 */
export interface Acta {
  id: number;
  proyectoId: number;
  codigo: string;
  nombre: string;
  tipo: ActaTipo;
  fecha: string;
  estado: ActaEstado;
  archivoUrl?: string | null;

  // Campos comunes
  observaciones?: string | null;

  // Campos de Acta de Reunion
  tipoReunion?: TipoReunion | null;
  fasePerteneciente?: string | null;
  horaInicio?: string | null;
  horaFin?: string | null;
  modalidad?: Modalidad | null;
  lugarLink?: string | null;
  moderadorId?: number | null;
  moderador?: { id: number; nombres: string; apellidoPaterno: string } | null;
  asistentes?: ActaParticipante[] | null;
  ausentes?: ActaParticipante[] | null;
  agenda?: ActaAgendaItem[] | null;
  temasDesarrollados?: ActaTemaDesarrollado[] | null;
  acuerdos?: ActaAcuerdo[] | null;
  proximosPasos?: ActaProximoPaso[] | null;
  proximaReunionFecha?: string | null;
  anexosReferenciados?: ActaAnexo[] | null;

  // Campos de Acta de Daily Meeting
  sprintId?: number | null;
  sprintNombre?: string | null;
  duracionMinutos?: number | null;
  participantesDaily?: ActaDailyParticipante[] | null;
  impedimentosGenerales?: string[] | null;
  notasAdicionales?: string | null;

  // Campos de Acta de Constitucion
  objetivoSmart?: string | null;
  justificacion?: string | null;
  alcance?: string[] | null;
  fueraDeAlcance?: string[] | null;
  entregables?: ActaEntregable[] | null;
  supuestos?: string[] | null;
  restricciones?: string[] | null;
  riesgos?: ActaRiesgo[] | null;
  presupuestoEstimado?: number | null;
  cronogramaHitos?: ActaHito[] | null;
  equipoProyecto?: ActaMiembroEquipo[] | null;

  // Documento firmado
  documentoFirmadoUrl?: string | null;
  documentoFirmadoFecha?: string | null;
  comentarioRechazo?: string | null;

  // Aprobacion
  aprobadoPor?: number | null;
  aprobador?: { id: number; nombres: string; apellidoPaterno: string } | null;
  fechaAprobacion?: string | null;

  // Auditoria
  activo: boolean;
  createdBy?: number | null;
  updatedBy?: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Respuesta de actas por proyecto (separadas por tipo)
 */
export interface ActasByProyectoResponse {
  constitucion: Acta | null;
  reuniones: Acta[];
  dailies: Acta[];
}

/**
 * Historial de aprobacion
 */
export interface ActaHistorialAprobacion {
  id: number;
  actaId: number;
  nivel: ActaNivelAprobacion;
  aprobadorId: number;
  aprobadorNombre: string;
  accion: 'Aprobado' | 'Rechazado';
  motivo?: string;
  fecha: string;
}

/**
 * Input para crear Acta de Reunion
 */
export interface CreateActaReunionInput {
  proyectoId: number;
  nombre: string;
  fecha: string;
  tipoReunion: TipoReunion;
  fasePerteneciente?: string;
  horaInicio?: string;
  horaFin?: string;
  modalidad?: Modalidad;
  lugarLink?: string;
  moderadorId?: number;
  asistentes?: ActaParticipante[];
  ausentes?: ActaParticipante[];
  agenda?: ActaAgendaItem[];
  temasDesarrollados?: ActaTemaDesarrollado[];
  acuerdos?: ActaAcuerdo[];
  proximosPasos?: ActaProximoPaso[];
  observaciones?: string;
  proximaReunionFecha?: string;
  anexosReferenciados?: ActaAnexo[];
}

/**
 * Input para crear Acta de Constitucion
 */
export interface CreateActaConstitucionInput {
  proyectoId: number;
  nombre: string;
  fecha: string;
  objetivoSmart?: string;
  justificacion?: string;
  alcance?: string[];
  fueraDeAlcance?: string[];
  entregables?: ActaEntregable[];
  supuestos?: string[];
  restricciones?: string[];
  riesgos?: ActaRiesgo[];
  presupuestoEstimado?: number;
  cronogramaHitos?: ActaHito[];
  equipoProyecto?: ActaMiembroEquipo[];
  observaciones?: string;
}

/**
 * Input para crear Acta de Daily Meeting
 */
export interface CreateActaDailyInput {
  proyectoId: number;
  nombre: string;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  sprintId?: number;
  duracionMinutos?: number;
  participantesDaily: ActaDailyParticipante[];
  impedimentosGenerales?: string[];
  notasAdicionales?: string;
  observaciones?: string;
}

/**
 * Input generico para crear acta (union de todos los tipos)
 */
export type CreateActaInput = CreateActaReunionInput | CreateActaConstitucionInput | CreateActaDailyInput;

/**
 * Input para actualizar acta de reunion
 */
export type UpdateActaReunionInput = Partial<Omit<CreateActaReunionInput, 'proyectoId'>>;

/**
 * Input para actualizar acta de constitucion
 */
export type UpdateActaConstitucionInput = Partial<Omit<CreateActaConstitucionInput, 'proyectoId'>>;

/**
 * Input para actualizar acta de daily meeting
 */
export type UpdateActaDailyInput = Partial<Omit<CreateActaDailyInput, 'proyectoId'>>;

/**
 * Input para actualizar acta
 */
export type UpdateActaInput = UpdateActaReunionInput | UpdateActaConstitucionInput | UpdateActaDailyInput;

/**
 * Input para aprobar/rechazar acta
 */
export interface ActaApprovalInput {
  aprobado: boolean;
  comentario?: string;
}

/**
 * Input para subir documento firmado
 */
export interface SubirDocumentoFirmadoInput {
  documentoFirmadoUrl: string;
}

/**
 * Filtros para consultar actas
 */
export interface ActaQueryFilters {
  tipo?: ActaTipo;
  estado?: ActaEstado;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  pageSize?: number;
}

// ===========================================
// INFORMES
// ===========================================

/**
 * Tipos de informe
 */
export type InformeTipo = 'Sprint' | 'Actividad' | 'Proyecto';

/**
 * Informe base
 */
export interface Informe {
  id: number;
  proyectoId: number;
  tipo: InformeTipo;
  titulo: string;
  fechaGeneracion: string;
  archivoId?: string | null;
  nombreArchivo?: string | null;
  createdBy: number;
  createdAt: string;
}

/**
 * Datos para informe de sprint
 */
export interface InformeSprintData {
  sprintId: number;
  sprintNombre: string;
  proyectoNombre: string;

  // Fechas
  fechaInicio: string;
  fechaFin: string;

  // Objetivos
  sprintGoal: string;
  objetivoCumplido: boolean;

  // Metricas
  storyPointsPlaneados: number;
  storyPointsCompletados: number;
  velocidad: number;
  tasaCompletitud: number;

  // Historias
  historiasCompletadas: {
    codigo: string;
    titulo: string;
    storyPoints: number;
  }[];
  historiasIncompletas: {
    codigo: string;
    titulo: string;
    storyPoints: number;
    motivo?: string;
  }[];

  // Bloqueos y riesgos
  bloqueos: {
    descripcion: string;
    resuelto: boolean;
  }[];

  // Retrospectiva
  queSalioMal?: string;
  queSalioBien?: string;
  accionesMejora?: string;

  // Equipo
  equipo: {
    nombre: string;
    rol: string;
  }[];
}

/**
 * Datos para informe de actividad
 */
export interface InformeActividadData {
  actividadId: number;
  actividadNombre: string;
  proyectoNombre: string;

  // Periodo
  fechaInicio: string;
  fechaFin: string;

  // Metricas Kanban
  throughput: number;
  leadTime: number;
  cycleTime: number;
  wipPromedio: number;

  // Tareas
  tareasCompletadas: {
    titulo: string;
    leadTime: number;
    cycleTime: number;
  }[];
  tareasEnProgreso: {
    titulo: string;
    diasEnProgreso: number;
  }[];

  // Cuellos de botella
  cuellosDeBottella: {
    etapa: string;
    promedioTiempo: number;
    tareasAtascadas: number;
  }[];

  // Equipo
  equipo: {
    nombre: string;
    tareasCompletadas: number;
  }[];
}

// ===========================================
// ACTA DE CONSTITUCION (Project Charter)
// ===========================================

/**
 * Datos para acta de constitucion del proyecto
 */
export interface ActaConstitucionData {
  proyectoId: number;
  proyectoNombre: string;
  proyectoCodigo: string;

  // Informacion general
  fechaCreacion: string;
  version: string;

  // Roles
  patrocinador: {
    nombre: string;
    cargo: string;
    firma?: string;
  };
  scrumMaster: {
    nombre: string;
    cargo: string;
    firma?: string;
  };
  coordinador?: {
    nombre: string;
    cargo: string;
    firma?: string;
  };

  // Descripcion
  justificacion: string;
  objetivoGeneral: string;
  objetivosEspecificos: string[];

  // Alcance
  alcanceIncluido: string[];
  alcanceExcluido: string[];

  // Criterios
  criteriosExito: string[];
  supuestos: string[];
  restricciones: string[];

  // Riesgos iniciales
  riesgosIdentificados: {
    descripcion: string;
    probabilidad: 'Alta' | 'Media' | 'Baja';
    impacto: 'Alto' | 'Medio' | 'Bajo';
  }[];

  // Equipo
  equipoInicial: {
    nombre: string;
    rol: string;
    dedicacion: string;
  }[];

  // Cronograma
  fechaInicioEstimada: string;
  fechaFinEstimada: string;
  hitos: {
    nombre: string;
    fechaEstimada: string;
  }[];

  // Presupuesto
  presupuestoEstimado?: number;
}

/**
 * Datos para acta de reunion
 */
export interface ActaReunionData {
  actaId: number;
  proyectoNombre: string;
  proyectoCodigo: string;

  // Datos de reunion
  tipoReunion: string;
  fasePerteneciente: string;
  fechaReunion: string;
  horaInicio: string;
  horaFin: string;

  // Participantes
  asistentes: ActaParticipante[];
  ausentes: ActaParticipante[];

  // Contenido
  agenda: ActaAgendaItem[];
  requerimientosFuncionales: { descripcion: string }[];
  requerimientosNoFuncionales: { descripcion: string }[];
  temasPendientes: { tema: string }[];
  entregables: ActaEntregable[];
  observaciones: string;
  reunionesProgramadas: ActaReunionProgramada[];
}
