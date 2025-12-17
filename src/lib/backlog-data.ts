/**
 * Backlog Data Types and Utilities
 *
 * Este archivo contiene solo tipos y utilidades para el backlog.
 * Los datos reales vienen del backend via los servicios en features/proyectos/services
 */

// ============================================
// TIPOS
// ============================================

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

// ============================================
// COLORES DE ESTILO
// ============================================

// Colores para estados de Sprint
export const sprintStatusColors: { [key: string]: string } = {
  'Por hacer': 'bg-[#BFDBFE] text-blue-800',
  'En progreso': 'bg-[#FACC15] text-yellow-800',
  'Finalizado': 'bg-[#34D399] text-green-800',
  'Planificado': 'bg-[#BFDBFE] text-blue-800',
  'Activo': 'bg-[#FACC15] text-yellow-800',
  'Completado': 'bg-[#34D399] text-green-800',
};

// Colores para estados de historias/tareas
export const statusColors: { [key: string]: string } = {
  'Por hacer': 'bg-[#BFDBFE] text-blue-800',
  'En progreso': 'bg-[#FDE68A] text-yellow-800',
  'En revisión': 'bg-[#A78BFA] text-purple-800',
  'Finalizado': 'bg-[#A7F3D0] text-green-800',
  // Estados adicionales del backend
  'Pendiente': 'bg-[#BFDBFE] text-blue-800',
  'En analisis': 'bg-[#E0E7FF] text-indigo-800',
  'Lista': 'bg-[#D1FAE5] text-green-800',
  'En desarrollo': 'bg-[#FDE68A] text-yellow-800',
  'En pruebas': 'bg-[#FED7AA] text-orange-800',
  'Terminada': 'bg-[#A7F3D0] text-green-800',
};

// Colores para prioridades
export const priorityColors: { [key: string]: { bg: string; text: string } } = {
  Alta: { bg: 'bg-red-200', text: 'text-red-800' },
  Media: { bg: 'bg-yellow-200', text: 'text-yellow-800' },
  Baja: { bg: 'bg-green-200', text: 'text-green-800' },
  // MoSCoW priorities from backend
  Must: { bg: 'bg-red-200', text: 'text-red-800' },
  Should: { bg: 'bg-orange-200', text: 'text-orange-800' },
  Could: { bg: 'bg-yellow-200', text: 'text-yellow-800' },
  Wont: { bg: 'bg-gray-200', text: 'text-gray-800' },
};

// ============================================
// FUNCIONES UTILITARIAS
// ============================================

/**
 * Contar historias/tareas por estado
 */
export function countByStatus(stories: UserStory[]): Record<UserStoryStatus, number> {
  return {
    'Por hacer': stories.filter((s) => s.state === 'Por hacer').length,
    'En progreso': stories.filter((s) => s.state === 'En progreso').length,
    'En revisión': stories.filter((s) => s.state === 'En revisión').length,
    Finalizado: stories.filter((s) => s.state === 'Finalizado').length,
  };
}

/**
 * Contar historias/tareas por prioridad
 */
export function countByPriority(stories: UserStory[]): Record<Priority, number> {
  return {
    Alta: stories.filter((s) => s.priority === 'Alta').length,
    Media: stories.filter((s) => s.priority === 'Media').length,
    Baja: stories.filter((s) => s.priority === 'Baja').length,
  };
}

/**
 * Contar items por tipo
 */
export function countByType(
  stories: UserStory[],
  epicsCount: number = 0
): Record<ItemType, number> {
  return {
    Historia: stories.filter((s) => s.type === 'Historia').length,
    Tarea: stories.filter((s) => s.type === 'Tarea').length,
    Épica: epicsCount,
  };
}

/**
 * Obtener texto de acción para log de actividad
 */
export function getActionText(action: ActivityLog['action']): string {
  switch (action) {
    case 'creado':
      return 'ha creado';
    case 'actualizado':
      return 'ha actualizado';
    case 'eliminado':
      return 'ha eliminado';
    case 'cambio_estado':
      return 'ha cambiado el estado de';
    default:
      return action;
  }
}

/**
 * Filtrar historias por sprint
 */
export function getStoriesBySprint(stories: UserStory[], sprintId: string): UserStory[] {
  return stories.filter((story) => story.sprint === sprintId);
}

/**
 * Filtrar historias por estado
 */
export function getStoriesByStatus(stories: UserStory[], status: UserStoryStatus): UserStory[] {
  return stories.filter((story) => story.state === status);
}

/**
 * Filtrar solo historias de usuario (sin tareas) de un sprint
 */
export function getOnlyStoriesBySprint(stories: UserStory[], sprintId: string): UserStory[] {
  return stories.filter((story) => story.sprint === sprintId && story.type === 'Historia');
}

/**
 * Obtener tareas de una historia de usuario específica
 */
export function getTasksByStoryId(stories: UserStory[], storyId: string): UserStory[] {
  return stories.filter((item) => item.type === 'Tarea' && item.parentId === storyId);
}

/**
 * Verificar si una historia tiene tareas
 */
export function storyHasTasks(stories: UserStory[], storyId: string): boolean {
  return stories.some((item) => item.type === 'Tarea' && item.parentId === storyId);
}

/**
 * Obtener historias del backlog (sin sprint asignado)
 */
export function getBacklogStories(stories: UserStory[]): UserStory[] {
  return stories.filter((story) => story.sprint === 'backlog' && story.type === 'Historia');
}

/**
 * Obtener épica por nombre
 */
export function getEpicByName(epics: Epic[], name: string): Epic | undefined {
  return epics.find((e) => e.name === name);
}

/**
 * Obtener sprint por ID
 */
export function getSprintById(sprints: Sprint[], id: string): Sprint | undefined {
  return sprints.find((s) => s.id === id);
}
