/**
 * Tipos relacionados con roles, permisos y módulos
 *
 * NOTA: Preferir usar las definiciones de '@/lib/definitions.ts'
 */

/**
 * Roles disponibles en el sistema
 */
export const ROLES = {
  ADMIN: 'ADMIN',
  PMO: 'PMO',
  SCRUM_MASTER: 'SCRUM_MASTER',
  COORDINADOR: 'COORDINADOR',
  DESARROLLADOR: 'DESARROLLADOR',
  IMPLEMENTADOR: 'IMPLEMENTADOR',
  USUARIO: 'USUARIO',
  PATROCINADOR: 'PATROCINADOR',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Módulos del sistema
 */
export const MODULES = {
  PGD: 'PGD',
  POI: 'POI',
  RECURSOS_HUMANOS: 'RECURSOS_HUMANOS',
  DASHBOARD: 'DASHBOARD',
  NOTIFICACIONES: 'NOTIFICACIONES',
} as const;

export type Module = (typeof MODULES)[keyof typeof MODULES];

/**
 * Permisos disponibles
 */
export const PERMISSIONS = {
  // Permisos generales
  VIEW: 'VIEW',
  CREATE: 'CREATE',
  EDIT: 'EDIT',
  DELETE: 'DELETE',
  EXPORT: 'EXPORT',

  // Permisos específicos de POI
  MANAGE_BACKLOG: 'MANAGE_BACKLOG',
  MANAGE_SPRINTS: 'MANAGE_SPRINTS',
  ASSIGN_TASKS: 'ASSIGN_TASKS',
  UPDATE_TASK_STATUS: 'UPDATE_TASK_STATUS',
  VIEW_REPORTS: 'VIEW_REPORTS',

  // Permisos específicos de PGD
  MANAGE_OBJECTIVES: 'MANAGE_OBJECTIVES',
  APPROVE_PROJECTS: 'APPROVE_PROJECTS',

  // Permisos específicos de RRHH
  MANAGE_USERS: 'MANAGE_USERS',
  ASSIGN_ROLES: 'ASSIGN_ROLES',
  VIEW_ALL_PERSONNEL: 'VIEW_ALL_PERSONNEL',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Mapeo de permisos por módulo
 */
export type ModulePermissions = {
  [key in Module]?: Permission[];
};

/**
 * Configuración de permisos por rol
 */
export type RolePermissionConfig = {
  [key in Role]: {
    modules: Module[];
    permissions: ModulePermissions;
  };
};
