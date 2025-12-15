// Datos compartidos para Backlog, Tablero y Dashboard

export type UserStoryStatus = 'Por hacer' | 'En progreso' | 'En revisión' | 'Finalizado';
export type Priority = 'Alta' | 'Media' | 'Baja';
export type ItemType = 'Historia' | 'Tarea' | 'Épica';

// Tipo para comentarios de historia de usuario
export type Comment = {
    id: string;
    user: string;
    content: string;
    timestamp: Date;
};

// Tipo para tareas secundarias dentro de una HU
export type SecondaryTask = {
    title: string;
    description: string;
    responsible: string;
    state: UserStoryStatus;
    priority: Priority;
    startDate: string;
    endDate: string;
    points: number;
    informer?: string;
};

export type UserStory = {
    id: string;
    title: string;
    description?: string;
    state: UserStoryStatus;
    epic: string;
    responsible: string;
    responsibles?: string[]; // Lista de responsables múltiples
    priority: Priority;
    startDate: string;
    endDate: string;
    type: ItemType;
    sprint: string;
    comments: number;
    commentsList?: Comment[]; // Lista de comentarios detallados
    points?: number;
    parentId?: string; // ID de la historia de usuario padre (solo para tareas)
    informer?: string; // Quien creó la HU
    acceptanceCriteria?: string[]; // Criterios de aceptación
    attachments?: string[]; // Adjuntos (generados automáticamente)
    isDraft?: boolean; // Si es un borrador
    isAIGenerated?: boolean; // Si fue generada por IA
    tasks?: SecondaryTask[]; // Tareas secundarias de la HU
};

export type ActivityLog = {
    id: string;
    user: string;
    action: 'creado' | 'actualizado' | 'eliminado' | 'cambio_estado';
    itemId: string;
    itemTitle: string;
    itemType: ItemType;
    previousState?: UserStoryStatus;
    newState?: UserStoryStatus;
    priority: Priority;
    epic: string;
    parentId?: string;
    startDate: string;
    endDate: string;
    timestamp: Date;
};

export type SprintStatus = 'Por hacer' | 'En progreso' | 'Finalizado';

export type Sprint = {
    id: string;
    name: string;
    number: number;
    startDate: string;
    endDate: string;
    status: SprintStatus;
};

export type Epic = {
    id: string;
    name: string;
    description?: string;
    responsibles?: string[];
    state: UserStoryStatus;
    priority: Priority;
    startDate: string;
    endDate: string;
    informer?: string;
};

// Sprints disponibles (2 semanas de duración por defecto)
export const sprints: Sprint[] = [
    { id: 'sprint1', name: 'Sprint 1', number: 1, startDate: '11/06/2025', endDate: '25/06/2025', status: 'Por hacer' },
    { id: 'sprint2', name: 'Sprint 2', number: 2, startDate: '26/06/2025', endDate: '10/07/2025', status: 'Por hacer' },
];

// Colores para estados de Sprint
export const sprintStatusColors: { [key: string]: string } = {
    'Por hacer': 'bg-[#BFDBFE] text-blue-800',
    'En progreso': 'bg-[#FACC15] text-yellow-800',
    'Finalizado': 'bg-[#34D399] text-green-800',
};

// Lista de responsables disponibles
export const availableResponsibles: string[] = [
    'Carlos García',
    'María López',
    'Juan Pérez',
    'Ana Torres',
    'Pedro Sánchez',
    'Laura Díaz',
    'Roberto Méndez',
    'Anayeli Monzon Narvaez',
    'Fernando Rojas',
    'Carmen Vega',
    'Diego Morales',
    'Patricia Ruiz',
];

// Épicas del proyecto
export const epics: Epic[] = [
    { id: 'no-epic', name: 'Sin épica', state: 'Por hacer', priority: 'Media', startDate: '', endDate: '' },
    {
        id: 'epic1',
        name: 'Módulo de Reclutamiento',
        description: 'Desarrollo completo del módulo de reclutamiento para el sistema ENDES',
        responsibles: ['Carlos García', 'María López'],
        state: 'En progreso',
        priority: 'Alta',
        startDate: '01/02/2025',
        endDate: '28/02/2025',
        informer: 'Anayeli Monzon Narvaez'
    },
    {
        id: 'epic2',
        name: 'Captura de Datos Censales',
        description: 'Sistema de captura y procesamiento de datos censales en plataformas web y móvil',
        responsibles: ['Roberto Méndez', 'Ana Torres'],
        state: 'Por hacer',
        priority: 'Alta',
        startDate: '14/02/2025',
        endDate: '30/03/2025',
        informer: 'Anayeli Monzon Narvaez'
    },
    {
        id: 'epic3',
        name: 'Reportes y Dashboard',
        description: 'Módulo de generación de reportes y visualización de indicadores',
        responsibles: ['Laura Díaz'],
        state: 'Por hacer',
        priority: 'Media',
        startDate: '01/03/2025',
        endDate: '15/04/2025',
        informer: 'Anayeli Monzon Narvaez'
    },
];

// Historias de usuario y tareas
export const allUserStories: UserStory[] = [
    // Sprint 1 (11/06/2025 - 25/06/2025)
    { id: 'HU-1', title: 'Implementación del módulo de reclutamiento en el sistema ENDES', description: 'Como administrador del sistema, necesito un módulo de reclutamiento que permita gestionar el proceso de selección de personal de campo para el censo. El módulo debe incluir registro de postulantes, evaluación de requisitos, y seguimiento del proceso de contratación.', state: 'En revisión', epic: 'Módulo de Reclutamiento', responsible: 'Carlos García', priority: 'Media', startDate: '11/06/2025', endDate: '16/06/2025', type: 'Historia', sprint: 'sprint1', comments: 2, points: 80 },
    { id: 'HU-2', title: 'Diseño de interfaz de usuario para formularios de registro', description: 'Como usuario del sistema, necesito una interfaz intuitiva y accesible para los formularios de registro que cumpla con los estándares de usabilidad. Debe incluir validaciones visuales, mensajes de ayuda y soporte para dispositivos móviles.', state: 'En progreso', epic: 'Módulo de Reclutamiento', responsible: 'María López', priority: 'Alta', startDate: '12/06/2025', endDate: '17/06/2025', type: 'Historia', sprint: 'sprint1', comments: 5, points: 60 },
    { id: 'HU-3', title: 'Integración con sistema de autenticación LDAP', description: 'Como administrador de TI, necesito que el sistema se integre con el directorio activo LDAP institucional para gestionar la autenticación de usuarios de manera centralizada, permitiendo single sign-on y sincronización de roles.', state: 'En revisión', epic: 'Módulo de Reclutamiento', responsible: 'Juan Pérez', priority: 'Alta', startDate: '14/06/2025', endDate: '19/06/2025', type: 'Historia', sprint: 'sprint1', comments: 3, points: 100 },
    { id: 'HU-4', title: 'Configuración de permisos y roles de usuario', description: 'Como administrador del sistema, necesito configurar diferentes niveles de permisos y roles para controlar el acceso a las funcionalidades del sistema según el perfil del usuario (supervisor, encuestador, analista, etc.).', state: 'Por hacer', epic: 'Sin épica', responsible: 'Ana Torres', priority: 'Baja', startDate: '18/06/2025', endDate: '21/06/2025', type: 'Historia', sprint: 'sprint1', comments: 0, points: 40 },
    { id: 'HU-5', title: 'Validación de datos de entrada en formularios', description: 'Como usuario del sistema, necesito que los formularios validen automáticamente los datos ingresados en tiempo real, mostrando mensajes de error claros y previniendo el envío de información incorrecta o incompleta.', state: 'Finalizado', epic: 'Módulo de Reclutamiento', responsible: 'Pedro Sánchez', priority: 'Media', startDate: '20/06/2025', endDate: '23/06/2025', type: 'Historia', sprint: 'sprint1', comments: 1, points: 50 },
    { id: 'HU-6', title: 'Generación de reportes de reclutamiento', description: 'Como supervisor de reclutamiento, necesito generar reportes detallados del proceso de selección que incluyan métricas de avance, estadísticas de postulantes por región, y estado de las evaluaciones para la toma de decisiones.', state: 'Finalizado', epic: 'Reportes y Dashboard', responsible: 'Laura Díaz', priority: 'Alta', startDate: '22/06/2025', endDate: '25/06/2025', type: 'Historia', sprint: 'sprint1', comments: 4, points: 70 },
    { id: 'TAR-1', title: 'Crear esquema de base de datos para reclutamiento', description: 'Diseñar e implementar el esquema de base de datos PostgreSQL para el módulo de reclutamiento. Incluye tablas para postulantes, evaluaciones, documentos adjuntos, historial de estados y relaciones con otras entidades del sistema.', state: 'Finalizado', epic: 'Módulo de Reclutamiento', responsible: 'Carlos García', priority: 'Alta', startDate: '11/06/2025', endDate: '13/06/2025', type: 'Tarea', sprint: 'sprint1', comments: 0, points: 20, parentId: 'HU-1', attachments: ['esquema_bd_reclutamiento.png'] },
    { id: 'TAR-2', title: 'Configurar ambiente de desarrollo', description: 'Configurar el ambiente de desarrollo local con Docker, incluyendo contenedores para la base de datos, servidor de aplicaciones y herramientas de desarrollo. Documentar el proceso de setup para el equipo.', state: 'Finalizado', epic: 'Módulo de Reclutamiento', responsible: 'Juan Pérez', priority: 'Media', startDate: '11/06/2025', endDate: '12/06/2025', type: 'Tarea', sprint: 'sprint1', comments: 1, points: 10, parentId: 'HU-1', attachments: ['docker_config_evidencia.png'] },
    { id: 'TAR-5', title: 'Implementar validaciones de campos requeridos', description: 'Desarrollar las validaciones del lado del cliente y servidor para todos los campos obligatorios de los formularios de registro. Incluir validaciones de formato para DNI, correo electrónico, teléfono y fechas.', state: 'En progreso', epic: 'Módulo de Reclutamiento', responsible: 'María López', priority: 'Alta', startDate: '12/06/2025', endDate: '15/06/2025', type: 'Tarea', sprint: 'sprint1', comments: 2, points: 15, parentId: 'HU-2' },
    { id: 'TAR-6', title: 'Diseñar mockups de formularios', description: 'Crear los diseños de alta fidelidad en Figma para todos los formularios del módulo de registro. Incluir versiones para escritorio y móvil, estados de validación, y componentes reutilizables según el sistema de diseño.', state: 'Finalizado', epic: 'Módulo de Reclutamiento', responsible: 'María López', priority: 'Media', startDate: '12/06/2025', endDate: '14/06/2025', type: 'Tarea', sprint: 'sprint1', comments: 0, points: 10, parentId: 'HU-2' },
    { id: 'TAR-7', title: 'Configurar conexión LDAP', description: 'Implementar la integración con el servidor LDAP institucional utilizando la librería ldapjs. Configurar los parámetros de conexión, mapeo de atributos de usuario y manejo de errores de autenticación.', state: 'Finalizado', epic: 'Módulo de Reclutamiento', responsible: 'Juan Pérez', priority: 'Alta', startDate: '14/06/2025', endDate: '17/06/2025', type: 'Tarea', sprint: 'sprint1', comments: 1, points: 25, parentId: 'HU-3', attachments: ['evidencia_ldap_config.png'] },

    // Sprint 2 (26/06/2025 - 10/07/2025)
    { id: 'HU-7', title: 'Captura y procesamiento eficiente de datos censales en plataformas web', description: 'Como encuestador de campo, necesito una plataforma web optimizada para capturar datos censales de manera eficiente, con formularios dinámicos que se adapten al tipo de vivienda y características del hogar encuestado.', state: 'Por hacer', epic: 'Captura de Datos Censales', responsible: 'Roberto Méndez', priority: 'Alta', startDate: '26/06/2025', endDate: '30/06/2025', type: 'Historia', sprint: 'sprint2', comments: 0, points: 90 },
    { id: 'HU-8', title: 'Implementación de validaciones en tiempo real', description: 'Como supervisor de calidad, necesito que el sistema valide los datos censales en tiempo real durante la captura, detectando inconsistencias, valores atípicos y datos faltantes para garantizar la calidad de la información.', state: 'Por hacer', epic: 'Captura de Datos Censales', responsible: 'María López', priority: 'Media', startDate: '28/06/2025', endDate: '02/07/2025', type: 'Historia', sprint: 'sprint2', comments: 0, points: 60 },
    { id: 'HU-9', title: 'Sistema de almacenamiento temporal offline', description: 'Como encuestador de campo, necesito que la aplicación funcione sin conexión a internet, almacenando los datos localmente y sincronizándolos automáticamente cuando se recupere la conectividad para no perder información.', state: 'En progreso', epic: 'Captura de Datos Censales', responsible: 'Carlos García', priority: 'Alta', startDate: '01/07/2025', endDate: '06/07/2025', type: 'Historia', sprint: 'sprint2', comments: 2, points: 100 },
    { id: 'HU-10', title: 'Sincronización automática de datos censales', description: 'Como administrador del sistema, necesito que los datos capturados en campo se sincronicen automáticamente con el servidor central, con manejo de conflictos, reintentos automáticos y notificaciones de estado de sincronización.', state: 'Por hacer', epic: 'Captura de Datos Censales', responsible: 'Ana Torres', priority: 'Media', startDate: '05/07/2025', endDate: '10/07/2025', type: 'Historia', sprint: 'sprint2', comments: 0, points: 80 },
    { id: 'TAR-3', title: 'Crear formulario digital con validaciones para encuestas', description: 'Desarrollar el componente de formulario dinámico para encuestas censales con validaciones integradas. Implementar lógica condicional para mostrar/ocultar secciones según las respuestas previas del encuestado.', state: 'En progreso', epic: 'Captura de Datos Censales', responsible: 'Pedro Sánchez', priority: 'Media', startDate: '26/06/2025', endDate: '28/06/2025', type: 'Tarea', sprint: 'sprint2', comments: 3, points: 30, parentId: 'HU-7' },
    { id: 'TAR-4', title: 'Diseñar estructura de datos para almacenamiento offline', description: 'Definir el modelo de datos optimizado para almacenamiento local usando IndexedDB. Incluir esquemas para encuestas, respuestas parciales, cola de sincronización y metadatos de control de versiones.', state: 'Por hacer', epic: 'Captura de Datos Censales', responsible: 'Juan Pérez', priority: 'Baja', startDate: '01/07/2025', endDate: '03/07/2025', type: 'Tarea', sprint: 'sprint2', comments: 0, points: 20, parentId: 'HU-9' },
    { id: 'TAR-8', title: 'Implementar cache local con IndexedDB', description: 'Desarrollar el servicio de almacenamiento local utilizando IndexedDB con Dexie.js. Implementar operaciones CRUD, índices para búsquedas rápidas y mecanismos de limpieza de datos antiguos sincronizados.', state: 'En progreso', epic: 'Captura de Datos Censales', responsible: 'Carlos García', priority: 'Alta', startDate: '02/07/2025', endDate: '05/07/2025', type: 'Tarea', sprint: 'sprint2', comments: 1, points: 35, parentId: 'HU-9' },

    // Backlog (sin sprint asignado)
    { id: 'HU-11', title: 'Implementación de módulo de notificaciones push', description: 'Como usuario del sistema, necesito recibir notificaciones push en tiempo real sobre actualizaciones importantes, recordatorios de tareas pendientes y alertas del sistema para mantenerme informado sin necesidad de revisar constantemente la aplicación.', state: 'Por hacer', epic: 'Módulo de Reclutamiento', responsible: 'Fernando Rojas', priority: 'Media', startDate: '', endDate: '', type: 'Historia', sprint: 'backlog', comments: 0, points: 40, isDraft: false },
    { id: 'HU-12', title: 'Sistema de backup automático de datos censales', description: 'Como administrador de TI, necesito un sistema de respaldo automático que realice copias de seguridad incrementales de los datos censales, con políticas de retención configurables y capacidad de restauración rápida ante incidentes.', state: 'Por hacer', epic: 'Captura de Datos Censales', responsible: 'Carmen Vega', priority: 'Alta', startDate: '', endDate: '', type: 'Historia', sprint: 'backlog', comments: 0, points: 60, isDraft: true, isAIGenerated: true },
    { id: 'HU-13', title: 'Dashboard de métricas de reclutamiento en tiempo real', description: 'Como gerente de operaciones, necesito un dashboard interactivo que muestre métricas clave del proceso de reclutamiento en tiempo real, incluyendo avance por región, tasas de conversión y comparativas con metas establecidas.', state: 'Por hacer', epic: 'Reportes y Dashboard', responsible: 'Diego Morales', priority: 'Media', startDate: '', endDate: '', type: 'Historia', sprint: 'backlog', comments: 0, points: 50, isDraft: false },
    { id: 'HU-14', title: 'Integración con servicio de geolocalización', description: 'Como supervisor de campo, necesito que el sistema capture y valide la ubicación geográfica de las encuestas mediante GPS, permitiendo verificar que los encuestadores están visitando las direcciones asignadas correctamente.', state: 'Por hacer', epic: 'Captura de Datos Censales', responsible: 'Patricia Ruiz', priority: 'Baja', startDate: '', endDate: '', type: 'Historia', sprint: 'backlog', comments: 0, points: 35, isDraft: true, isAIGenerated: true },
];

// Registro de actividades recientes
export const activityLogs: ActivityLog[] = [
    {
        id: 'act-1',
        user: 'Anayeli Monzon Narvaez',
        action: 'cambio_estado',
        itemId: 'TAR-3',
        itemTitle: 'Crear formulario digital con validaciones para encuestas',
        itemType: 'Tarea',
        previousState: 'Por hacer',
        newState: 'En progreso',
        priority: 'Media',
        epic: 'Captura de Datos Censales',
        parentId: 'HU-7',
        startDate: '26/06/2025',
        endDate: '28/06/2025',
        timestamp: new Date('2025-06-26T10:30:00'),
    },
    {
        id: 'act-2',
        user: 'Carlos García',
        action: 'creado',
        itemId: 'HU-9',
        itemTitle: 'Sistema de almacenamiento temporal offline',
        itemType: 'Historia',
        newState: 'Por hacer',
        priority: 'Alta',
        epic: 'Captura de Datos Censales',
        startDate: '01/07/2025',
        endDate: '06/07/2025',
        timestamp: new Date('2025-06-25T09:15:00'),
    },
    {
        id: 'act-3',
        user: 'María López',
        action: 'actualizado',
        itemId: 'HU-2',
        itemTitle: 'Diseño de interfaz de usuario para formularios de registro',
        itemType: 'Historia',
        newState: 'En progreso',
        priority: 'Alta',
        epic: 'Módulo de Reclutamiento',
        startDate: '12/06/2025',
        endDate: '17/06/2025',
        timestamp: new Date('2025-06-13T16:45:00'),
    },
    {
        id: 'act-4',
        user: 'Juan Pérez',
        action: 'cambio_estado',
        itemId: 'HU-3',
        itemTitle: 'Integración con sistema de autenticación LDAP',
        itemType: 'Historia',
        previousState: 'En progreso',
        newState: 'En revisión',
        priority: 'Alta',
        epic: 'Módulo de Reclutamiento',
        startDate: '14/06/2025',
        endDate: '19/06/2025',
        timestamp: new Date('2025-06-18T14:20:00'),
    },
    {
        id: 'act-5',
        user: 'Pedro Sánchez',
        action: 'cambio_estado',
        itemId: 'HU-5',
        itemTitle: 'Validación de datos de entrada en formularios',
        itemType: 'Historia',
        previousState: 'En revisión',
        newState: 'Finalizado',
        priority: 'Media',
        epic: 'Módulo de Reclutamiento',
        startDate: '20/06/2025',
        endDate: '23/06/2025',
        timestamp: new Date('2025-06-23T11:00:00'),
    },
    {
        id: 'act-6',
        user: 'Laura Díaz',
        action: 'cambio_estado',
        itemId: 'HU-6',
        itemTitle: 'Generación de reportes de reclutamiento',
        itemType: 'Historia',
        previousState: 'En revisión',
        newState: 'Finalizado',
        priority: 'Alta',
        epic: 'Reportes y Dashboard',
        startDate: '22/06/2025',
        endDate: '25/06/2025',
        timestamp: new Date('2025-06-25T09:30:00'),
    },
];

// Colores para estados
export const statusColors: { [key: string]: string } = {
    'Por hacer': 'bg-[#BFDBFE] text-blue-800',
    'En progreso': 'bg-[#FDE68A] text-yellow-800',
    'En revisión': 'bg-[#A78BFA] text-purple-800',
    'Finalizado': 'bg-[#A7F3D0] text-green-800',
};

// Colores para prioridades
export const priorityColors: { [key: string]: { bg: string, text: string } } = {
    'Alta': { bg: 'bg-red-200', text: 'text-red-800' },
    'Media': { bg: 'bg-yellow-200', text: 'text-yellow-800' },
    'Baja': { bg: 'bg-green-200', text: 'text-green-800' }
};

// Funciones utilitarias
export function getStoriesBySprint(sprintId: string): UserStory[] {
    return allUserStories.filter(story => story.sprint === sprintId);
}

export function getStoriesByStatus(stories: UserStory[], status: UserStoryStatus): UserStory[] {
    return stories.filter(story => story.state === status);
}

export function countByStatus(stories: UserStory[]): Record<UserStoryStatus, number> {
    return {
        'Por hacer': stories.filter(s => s.state === 'Por hacer').length,
        'En progreso': stories.filter(s => s.state === 'En progreso').length,
        'En revisión': stories.filter(s => s.state === 'En revisión').length,
        'Finalizado': stories.filter(s => s.state === 'Finalizado').length,
    };
}

export function countByPriority(stories: UserStory[]): Record<Priority, number> {
    return {
        'Alta': stories.filter(s => s.priority === 'Alta').length,
        'Media': stories.filter(s => s.priority === 'Media').length,
        'Baja': stories.filter(s => s.priority === 'Baja').length,
    };
}

export function countByType(stories: UserStory[]): Record<ItemType, number> {
    return {
        'Historia': stories.filter(s => s.type === 'Historia').length,
        'Tarea': stories.filter(s => s.type === 'Tarea').length,
        'Épica': epics.filter(e => e.id !== 'no-epic').length,
    };
}

export function getActionText(action: ActivityLog['action']): string {
    switch (action) {
        case 'creado': return 'ha creado';
        case 'actualizado': return 'ha actualizado';
        case 'eliminado': return 'ha eliminado';
        case 'cambio_estado': return 'ha cambiado el estado de';
        default: return action;
    }
}

// Obtener solo historias de usuario (sin tareas) de un sprint
export function getOnlyStoriesBySprint(sprintId: string): UserStory[] {
    return allUserStories.filter(story => story.sprint === sprintId && story.type === 'Historia');
}

// Obtener tareas de una historia de usuario específica
export function getTasksByStoryId(storyId: string): UserStory[] {
    return allUserStories.filter(item => item.type === 'Tarea' && item.parentId === storyId);
}

// Verificar si una historia tiene tareas
export function storyHasTasks(storyId: string): boolean {
    return allUserStories.some(item => item.type === 'Tarea' && item.parentId === storyId);
}

// Obtener historias del backlog (sin sprint asignado)
export function getBacklogStories(): UserStory[] {
    return allUserStories.filter(story => story.sprint === 'backlog' && story.type === 'Historia');
}

// Obtener épica por nombre
export function getEpicByName(name: string): Epic | undefined {
    return epics.find(e => e.name === name);
}

// Obtener sprint por ID
export function getSprintById(id: string): Sprint | undefined {
    return sprints.find(s => s.id === id);
}
