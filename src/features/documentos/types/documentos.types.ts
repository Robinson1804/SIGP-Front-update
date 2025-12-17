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
export type ActaTipo = 'Acta de Reunion' | 'Acta de Constitucion';

/**
 * Estados de aprobacion de acta
 */
export type ActaEstado = 'Pendiente' | 'Aprobado' | 'Rechazado';

/**
 * Niveles de aprobacion
 */
export type ActaNivelAprobacion =
  | 'Scrum Master'
  | 'Coordinador'
  | 'PMO'
  | 'Patrocinador';

/**
 * Participante de reunion
 */
export interface ActaParticipante {
  id: number;
  nombre: string;
  cargo: string;
  direccion: string;
  asistio: boolean;
}

/**
 * Item de agenda
 */
export interface ActaAgendaItem {
  id: string;
  tema: string;
  descripcion?: string;
}

/**
 * Entregable comprometido
 */
export interface ActaEntregable {
  id: string;
  descripcion: string;
  responsable: string;
  fechaCompromiso: string;
}

/**
 * Reunion programada
 */
export interface ActaReunionProgramada {
  id: string;
  tema: string;
  fecha: string;
  horaInicio: string;
}

/**
 * Acta completa
 */
export interface Acta {
  id: number;
  proyectoId: number;
  tipo: ActaTipo;
  nombre: string;
  estado: ActaEstado;

  // Datos de reunion
  tipoReunion?: string;
  fasePerteneciente?: string;
  fechaReunion?: string;
  horaInicio?: string;
  horaFin?: string;

  // Participantes
  asistentes: ActaParticipante[];
  ausentes: ActaParticipante[];

  // Contenido
  agenda: ActaAgendaItem[];
  requerimientosFuncionales?: { id: string; descripcion: string }[];
  requerimientosNoFuncionales?: { id: string; descripcion: string }[];
  temasPendientes?: { id: string; tema: string }[];
  entregables: ActaEntregable[];
  observaciones?: string;
  reunionesProgramadas: ActaReunionProgramada[];

  // Archivo
  archivoId?: string | null;
  nombreArchivo?: string | null;

  // Workflow de aprobacion
  nivelActual: ActaNivelAprobacion;
  historialAprobaciones: ActaHistorialAprobacion[];

  // Auditoria
  createdBy: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;
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
 * Input para crear acta
 */
export interface CreateActaInput {
  proyectoId: number;
  tipo: ActaTipo;
  nombre: string;
  tipoReunion?: string;
  fasePerteneciente?: string;
  fechaReunion?: string;
  horaInicio?: string;
  horaFin?: string;
  asistentes?: ActaParticipante[];
  ausentes?: ActaParticipante[];
  agenda?: ActaAgendaItem[];
  requerimientosFuncionales?: { id: string; descripcion: string }[];
  requerimientosNoFuncionales?: { id: string; descripcion: string }[];
  temasPendientes?: { id: string; tema: string }[];
  entregables?: ActaEntregable[];
  observaciones?: string;
  reunionesProgramadas?: ActaReunionProgramada[];
}

/**
 * Input para actualizar acta
 */
export interface UpdateActaInput extends Partial<CreateActaInput> {
  id: number;
}

/**
 * Input para aprobar/rechazar acta
 */
export interface ActaApprovalInput {
  motivo?: string;
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
