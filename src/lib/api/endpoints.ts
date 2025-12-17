/**
 * Definición centralizada de todos los endpoints de la API de SIGP
 *
 * Organizado por módulos funcionales
 * Usa funciones para endpoints dinámicos (con IDs)
 */

export const ENDPOINTS = {
  // ============================================
  // AUTH - Autenticación y Autorización
  // ============================================
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // ============================================
  // PROYECTOS - Gestión de Proyectos Scrum
  // ============================================
  PROYECTOS: {
    BASE: '/proyectos',
    BY_ID: (id: number | string) => `/proyectos/${id}`,

    // Backlog
    BACKLOG: (proyectoId: number | string) => `/proyectos/${proyectoId}/backlog`,

    // Sprints
    SPRINTS: (proyectoId: number | string) => `/proyectos/${proyectoId}/sprints`,
    SPRINT_BY_ID: (proyectoId: number | string, sprintId: number | string) =>
      `/proyectos/${proyectoId}/sprints/${sprintId}`,
    SPRINT_START: (proyectoId: number | string, sprintId: number | string) =>
      `/proyectos/${proyectoId}/sprints/${sprintId}/start`,
    SPRINT_COMPLETE: (proyectoId: number | string, sprintId: number | string) =>
      `/proyectos/${proyectoId}/sprints/${sprintId}/complete`,

    // Épicas
    EPICAS: (proyectoId: number | string) => `/proyectos/${proyectoId}/epicas`,
    EPICA_BY_ID: (proyectoId: number | string, epicaId: number | string) =>
      `/proyectos/${proyectoId}/epicas/${epicaId}`,

    // Historias de Usuario
    HISTORIAS: (proyectoId: number | string) => `/proyectos/${proyectoId}/historias`,
    HISTORIA_BY_ID: (proyectoId: number | string, historiaId: number | string) =>
      `/proyectos/${proyectoId}/historias/${historiaId}`,

    // Equipo
    EQUIPO: (proyectoId: number | string) => `/proyectos/${proyectoId}/equipo`,
    EQUIPO_ASIGNAR: (proyectoId: number | string) => `/proyectos/${proyectoId}/equipo/asignar`,

    // Documentos
    DOCUMENTOS: (proyectoId: number | string) => `/proyectos/${proyectoId}/documentos`,
    DOCUMENTO_BY_ID: (proyectoId: number | string, documentoId: number | string) =>
      `/proyectos/${proyectoId}/documentos/${documentoId}`,

    // Actas
    ACTAS: (proyectoId: number | string) => `/proyectos/${proyectoId}/actas`,
    ACTA_BY_ID: (proyectoId: number | string, actaId: number | string) =>
      `/proyectos/${proyectoId}/actas/${actaId}`,

    // Requerimientos
    REQUERIMIENTOS: (proyectoId: number | string) => `/proyectos/${proyectoId}/requerimientos`,
    REQUERIMIENTO_BY_ID: (proyectoId: number | string, requerimientoId: number | string) =>
      `/proyectos/${proyectoId}/requerimientos/${requerimientoId}`,

    // Reportes
    REPORTES: (proyectoId: number | string) => `/proyectos/${proyectoId}/reportes`,
    BURNDOWN: (proyectoId: number | string, sprintId: number | string) =>
      `/proyectos/${proyectoId}/sprints/${sprintId}/burndown`,
    VELOCITY: (proyectoId: number | string) => `/proyectos/${proyectoId}/velocity`,
  },

  // ============================================
  // ACTIVIDADES - Gestión de Actividades Kanban
  // ============================================
  ACTIVIDADES: {
    BASE: '/actividades',
    BY_ID: (id: number | string) => `/actividades/${id}`,

    // Tareas
    TAREAS: (actividadId: number | string) => `/actividades/${actividadId}/tareas`,
    TAREA_BY_ID: (actividadId: number | string, tareaId: number | string) =>
      `/actividades/${actividadId}/tareas/${tareaId}`,

    // Subtareas (solo Kanban)
    SUBTAREAS: (actividadId: number | string, tareaId: number | string) =>
      `/actividades/${actividadId}/tareas/${tareaId}/subtareas`,

    // Reportes
    REPORTES: (actividadId: number | string) => `/actividades/${actividadId}/reportes`,
    METRICAS: (actividadId: number | string) => `/actividades/${actividadId}/metricas`,
  },

  // ============================================
  // SPRINTS - Gestión de Sprints
  // ============================================
  SPRINTS: {
    BASE: '/sprints',
    BY_ID: (id: number | string) => `/sprints/${id}`,
    HISTORIAS: (sprintId: number | string) => `/sprints/${sprintId}/historias`,
    TAREAS: (sprintId: number | string) => `/sprints/${sprintId}/tareas`,
    START: (sprintId: number | string) => `/sprints/${sprintId}/start`,
    COMPLETE: (sprintId: number | string) => `/sprints/${sprintId}/complete`,
    DAILY_MEETINGS: (sprintId: number | string) => `/sprints/${sprintId}/daily-meetings`,
    TABLERO: (sprintId: number | string) => `/sprints/${sprintId}/tablero`,
    BURNDOWN: (sprintId: number | string) => `/sprints/${sprintId}/burndown`,
  },

  // ============================================
  // HISTORIAS DE USUARIO
  // ============================================
  HISTORIAS: {
    BASE: '/historias-usuario',
    BY_ID: (id: number | string) => `/historias-usuario/${id}`,
    TAREAS: (historiaId: number | string) => `/historias-usuario/${historiaId}/tareas`,
    CRITERIOS: (historiaId: number | string) => `/historias-usuario/${historiaId}/criterios-aceptacion`,
    MOVER_SPRINT: (historiaId: number | string) => `/historias-usuario/${historiaId}/mover-sprint`,
  },

  // ============================================
  // TAREAS
  // ============================================
  TAREAS: {
    BASE: '/tareas',
    BY_ID: (id: number | string) => `/tareas/${id}`,
    ASIGNAR: (tareaId: number | string) => `/tareas/${tareaId}/asignar`,
    CAMBIAR_ESTADO: (tareaId: number | string) => `/tareas/${tareaId}/estado`,
    MOVER: (tareaId: number | string) => `/tareas/${tareaId}/mover`,
    COMENTARIOS: (tareaId: number | string) => `/tareas/${tareaId}/comentarios`,
  },

  // ============================================
  // PLANNING - Planificación Estratégica (PGD)
  // ============================================
  PLANNING: {
    // PGD
    PGD: '/pgd',
    PGD_BY_ID: (id: number | string) => `/pgd/${id}`,
    PGD_VIGENTE: '/pgd/vigente',
    PGD_STATS: (id: number | string) => `/pgd/${id}/stats`,
    PGD_DASHBOARD: (id: number | string) => `/pgd/${id}/dashboard`,
    PGD_EXPORT: (id: number | string, format: 'pdf' | 'excel') => `/pgd/${id}/export/${format}`,

    // OEI - Objetivos Estratégicos Institucionales
    OEI: '/oei',
    OEI_BY_ID: (id: number | string) => `/oei/${id}`,
    OEI_AVANCE: (id: number | string) => `/oei/${id}/avance`,

    // OGD - Objetivos de Gobierno Digital
    OGD: '/ogd',
    OGD_BY_ID: (id: number | string) => `/ogd/${id}`,

    // OEGD - Objetivos Específicos de Gobierno Digital
    OEGD: '/oegd',
    OEGD_BY_ID: (id: number | string) => `/oegd/${id}`,

    // Acciones Estratégicas
    ACCIONES_ESTRATEGICAS: '/acciones-estrategicas',
    ACCION_ESTRATEGICA_BY_ID: (id: number | string) => `/acciones-estrategicas/${id}`,
    ACCION_PROYECTOS: (accionId: number | string) => `/acciones-estrategicas/${accionId}/proyectos`,
    ACCION_ACTIVIDADES: (accionId: number | string) => `/acciones-estrategicas/${accionId}/actividades`,
  },

  // ============================================
  // ACTAS - Actas y Documentos de Aprobación
  // ============================================
  ACTAS: {
    BASE: '/actas',
    BY_ID: (id: number | string) => `/actas/${id}`,
    APROBAR: (id: number | string) => `/actas/${id}/aprobar`,
    RECHAZAR: (id: number | string) => `/actas/${id}/rechazar`,
    PENDIENTES: '/actas/pendientes',
  },

  // ============================================
  // DOCUMENTOS
  // ============================================
  DOCUMENTOS: {
    BASE: '/documentos',
    BY_ID: (id: number | string) => `/documentos/${id}`,
    DOWNLOAD: (id: number | string) => `/documentos/${id}/download`,
  },

  // ============================================
  // UPLOAD - Subida de Archivos
  // ============================================
  UPLOAD: {
    REQUEST_URL: '/upload/request-url',
    CONFIRM: '/upload/confirm',
    DIRECT: '/upload/direct',
    VERSION: (archivoId: string) => `/upload/${archivoId}/version`,
  },

  // ============================================
  // RRHH - Recursos Humanos
  // ============================================
  RRHH: {
    // Personal
    PERSONAL: '/personal',
    PERSONAL_BY_ID: (id: number | string) => `/personal/${id}`,
    PERSONAL_DISPONIBLE: '/personal/disponible',

    // Divisiones
    DIVISIONES: '/divisiones',
    DIVISION_BY_ID: (id: number | string) => `/divisiones/${id}`,

    // Habilidades
    HABILIDADES: '/habilidades',
    HABILIDAD_BY_ID: (id: number | string) => `/habilidades/${id}`,

    // Asignaciones
    ASIGNACIONES: '/asignaciones',
    ASIGNACION_BY_ID: (id: number | string) => `/asignaciones/${id}`,
    ASIGNACIONES_PERSONA: (personaId: number | string) => `/personal/${personaId}/asignaciones`,
    CARGA_TRABAJO: (personaId: number | string) => `/personal/${personaId}/carga-trabajo`,
  },

  // ============================================
  // DASHBOARD - Dashboards y KPIs
  // ============================================
  DASHBOARD: {
    GENERAL: '/dashboard/general',
    BASE: '/dashboard',
    PROYECTO: (id: number | string) => `/dashboard/proyecto/${id}`,
    PROYECTO_BURNDOWN: (id: number | string) => `/dashboard/proyecto/${id}/burndown`,
    PROYECTO_VELOCIDAD: (id: number | string) => `/dashboard/proyecto/${id}/velocidad`,
    ACTIVIDAD: (id: number | string) => `/dashboard/actividad/${id}`,
    ACTIVIDAD_THROUGHPUT: (id: number | string) => `/dashboard/actividad/${id}/throughput`,
    OEI: (id: number | string) => `/dashboard/oei/${id}`,
    ALERTAS: '/dashboard/alertas',
    KPI: '/dashboard/kpi',
  },

  // ============================================
  // REPORTES
  // ============================================
  REPORTES: {
    SPRINTS: '/reportes/sprints',
    SPRINT: (id: number | string) => `/reportes/sprints/${id}`,
    ACTIVIDADES: '/reportes/actividades',
    ACTIVIDAD: (id: number | string) => `/reportes/actividades/${id}`,
    EXPORTAR_PDF: (tipo: string, id: number | string) => `/reportes/${tipo}/${id}/pdf`,
    EXPORTAR_EXCEL: (tipo: string, id: number | string) => `/reportes/${tipo}/${id}/excel`,
  },

  // ============================================
  // NOTIFICACIONES
  // ============================================
  NOTIFICACIONES: {
    BASE: '/notificaciones',
    BY_ID: (id: number | string) => `/notificaciones/${id}`,
    MARCAR_LEIDA: (id: number | string) => `/notificaciones/${id}/leer`,
    MARCAR_TODAS_LEIDAS: '/notificaciones/leer-todas',
    NO_LEIDAS: '/notificaciones/no-leidas',
    COUNT: '/notificaciones/count',
  },

  // ============================================
  // USUARIOS
  // ============================================
  USUARIOS: {
    BASE: '/usuarios',
    BY_ID: (id: number | string) => `/usuarios/${id}`,
    PERFIL: '/usuarios/perfil',
    ACTUALIZAR_PERFIL: '/usuarios/perfil',
    CAMBIAR_PASSWORD: '/usuarios/cambiar-password',
    ROLES: '/usuarios/roles',
    BY_ROL: (rol: string) => `/usuarios/by-rol/${rol}`,
    COORDINADORES: '/usuarios/coordinadores',
    SCRUM_MASTERS: '/usuarios/scrum-masters',
    PATROCINADORES: '/usuarios/patrocinadores',
    DESARROLLADORES: '/usuarios/desarrolladores',
    IMPLEMENTADORES: '/usuarios/implementadores',
    RESPONSABLES: '/usuarios/responsables',
  },

  // ============================================
  // CRONOGRAMAS - Diagramas de Gantt
  // ============================================
  CRONOGRAMAS: {
    BASE: '/cronogramas',
    BY_ID: (id: number | string) => `/cronogramas/${id}`,
    BY_PROYECTO: (proyectoId: number | string) => `/proyectos/${proyectoId}/cronograma`,
    TAREAS: (cronogramaId: number | string) => `/cronogramas/${cronogramaId}/tareas`,
    TAREA_BY_ID: (cronogramaId: number | string, tareaId: number | string) =>
      `/cronogramas/${cronogramaId}/tareas/${tareaId}`,
    DEPENDENCIAS: (cronogramaId: number | string) => `/cronogramas/${cronogramaId}/dependencias`,
    EXPORTAR: (cronogramaId: number | string, formato: 'pdf' | 'excel') =>
      `/cronogramas/${cronogramaId}/export/${formato}`,
  },

  // ============================================
  // DAILY MEETINGS - Reuniones Diarias
  // ============================================
  DAILY_MEETINGS: {
    BASE: (sprintId: number | string) => `/sprints/${sprintId}/daily-meetings`,
    BY_ID: (sprintId: number | string, meetingId: number | string) =>
      `/sprints/${sprintId}/daily-meetings/${meetingId}`,
    PARTICIPANTES: (sprintId: number | string, meetingId: number | string) =>
      `/sprints/${sprintId}/daily-meetings/${meetingId}/participantes`,
    HISTORIAL: (proyectoId: number | string) => `/proyectos/${proyectoId}/daily-meetings`,
  },

  // ============================================
  // INFORMES - Informes de Sprint y Actividad
  // ============================================
  INFORMES: {
    // Informes de Sprint
    SPRINT: {
      BASE: '/informes-sprint',
      BY_ID: (id: number | string) => `/informes-sprint/${id}`,
      BY_SPRINT: (sprintId: number | string) => `/sprints/${sprintId}/informe`,
      GENERAR: (sprintId: number | string) => `/sprints/${sprintId}/generar-informe`,
      APROBAR: (id: number | string) => `/informes-sprint/${id}/aprobar`,
      RECHAZAR: (id: number | string) => `/informes-sprint/${id}/rechazar`,
      HISTORIAL: (id: number | string) => `/informes-sprint/${id}/historial`,
    },
    // Informes de Actividad
    ACTIVIDAD: {
      BASE: '/informes-actividad',
      BY_ID: (id: number | string) => `/informes-actividad/${id}`,
      BY_ACTIVIDAD: (actividadId: number | string) => `/actividades/${actividadId}/informes`,
      APROBAR: (id: number | string) => `/informes-actividad/${id}/aprobar`,
      RECHAZAR: (id: number | string) => `/informes-actividad/${id}/rechazar`,
      HISTORIAL: (id: number | string) => `/informes-actividad/${id}/historial`,
    },
  },

  // ============================================
  // APROBACIONES - Flujos de Aprobación
  // ============================================
  APROBACIONES: {
    PENDIENTES: '/aprobaciones/pendientes',
    HISTORIAL: (tipo: string, id: number | string) => `/aprobaciones/${tipo}/${id}/historial`,
    APROBAR: (tipo: string, id: number | string) => `/aprobaciones/${tipo}/${id}/aprobar`,
    RECHAZAR: (tipo: string, id: number | string) => `/aprobaciones/${tipo}/${id}/rechazar`,
    MIS_PENDIENTES: '/aprobaciones/mis-pendientes',
  },
} as const;
