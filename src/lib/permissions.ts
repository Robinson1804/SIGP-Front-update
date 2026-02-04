import {
  Role,
  Module,
  Permission,
  RolePermissionConfig,
  ROLES,
  MODULES,
  PERMISSIONS,
} from './definitions';

/**
 * CONFIGURACIÓN CENTRALIZADA DE PERMISOS POR ROL
 *
 * Define qué módulos puede acceder cada rol y qué acciones puede realizar.
 * Esta es la ÚNICA fuente de verdad para los permisos del sistema.
 */
export const ROLE_PERMISSIONS: RolePermissionConfig = {
  // ============================================
  // ADMIN (Administrador)
  // Acceso completo a TODOS los módulos del sistema
  // ÚNICO ROL con acceso al módulo RRHH (Recursos Humanos)
  // ============================================
  [ROLES.ADMIN]: {
    modules: [
      MODULES.PGD,
      MODULES.POI,
      MODULES.RECURSOS_HUMANOS,
      MODULES.DASHBOARD,
      MODULES.NOTIFICACIONES,
    ],
    permissions: {
      [MODULES.PGD]: [
        PERMISSIONS.VIEW,
        PERMISSIONS.CREATE,
        PERMISSIONS.EDIT,
        PERMISSIONS.DELETE,
        PERMISSIONS.EXPORT,
        PERMISSIONS.MANAGE_OBJECTIVES,
        PERMISSIONS.APPROVE_PROJECTS,
        PERMISSIONS.VIEW_REPORTS,
      ],
      [MODULES.POI]: [
        PERMISSIONS.VIEW,
        PERMISSIONS.CREATE,
        PERMISSIONS.EDIT,
        PERMISSIONS.DELETE,
        PERMISSIONS.EXPORT,
        PERMISSIONS.MANAGE_BACKLOG,
        PERMISSIONS.MANAGE_SPRINTS,
        PERMISSIONS.ASSIGN_TASKS,
        PERMISSIONS.UPDATE_TASK_STATUS,
        PERMISSIONS.VIEW_REPORTS,
      ],
      [MODULES.RECURSOS_HUMANOS]: [
        PERMISSIONS.VIEW,
        PERMISSIONS.CREATE,
        PERMISSIONS.EDIT,
        PERMISSIONS.DELETE,
        PERMISSIONS.EXPORT,
        PERMISSIONS.MANAGE_USERS,
        PERMISSIONS.ASSIGN_ROLES,
      ],
      [MODULES.DASHBOARD]: [
        PERMISSIONS.VIEW,
        PERMISSIONS.EXPORT,
        PERMISSIONS.VIEW_REPORTS,
      ],
      [MODULES.NOTIFICACIONES]: [
        PERMISSIONS.VIEW,
        PERMISSIONS.CREATE,
        PERMISSIONS.DELETE,
      ],
    },
  },

  // ============================================
  // PMO (Project Management Office)
  // Acceso a PGD, POI, Dashboard, Notificaciones (sin RRHH)
  // ============================================
  [ROLES.PMO]: {
    modules: [
      MODULES.PGD,
      MODULES.POI,
      MODULES.DASHBOARD,
      MODULES.NOTIFICACIONES,
    ],
    permissions: {
      [MODULES.PGD]: [
        PERMISSIONS.VIEW,
        PERMISSIONS.CREATE,
        PERMISSIONS.EDIT,
        PERMISSIONS.DELETE,
        PERMISSIONS.EXPORT,
        PERMISSIONS.MANAGE_OBJECTIVES,
        PERMISSIONS.APPROVE_PROJECTS,
        PERMISSIONS.VIEW_REPORTS,
      ],
      [MODULES.POI]: [
        PERMISSIONS.VIEW,
        PERMISSIONS.CREATE,
        PERMISSIONS.EDIT,
        PERMISSIONS.DELETE,
        PERMISSIONS.EXPORT,
        PERMISSIONS.MANAGE_BACKLOG,
        PERMISSIONS.MANAGE_SPRINTS,
        PERMISSIONS.ASSIGN_TASKS,
        PERMISSIONS.UPDATE_TASK_STATUS,
        PERMISSIONS.VIEW_REPORTS,
      ],
      [MODULES.DASHBOARD]: [
        PERMISSIONS.VIEW,
        PERMISSIONS.EXPORT,
        PERMISSIONS.VIEW_REPORTS,
      ],
      [MODULES.NOTIFICACIONES]: [
        PERMISSIONS.VIEW,
        PERMISSIONS.CREATE,
        PERMISSIONS.DELETE,
      ],
    },
  },

  // ============================================
  // SCRUM MASTER
  // POI (sin crear), Notificaciones
  // NO tiene acceso a RRHH
  // ============================================
  [ROLES.SCRUM_MASTER]: {
    modules: [
      MODULES.POI,
      MODULES.NOTIFICACIONES,
    ],
    permissions: {
      [MODULES.POI]: [
        PERMISSIONS.VIEW,
        // No tiene CREATE - solo visualización de POI
        PERMISSIONS.EDIT,
        PERMISSIONS.MANAGE_BACKLOG,
        PERMISSIONS.MANAGE_SPRINTS,
        PERMISSIONS.ASSIGN_TASKS,
        PERMISSIONS.UPDATE_TASK_STATUS,
        PERMISSIONS.VIEW_REPORTS,
      ],
      [MODULES.NOTIFICACIONES]: [
        PERMISSIONS.VIEW,
      ],
    },
  },

  // ============================================
  // DESARROLLADOR
  // Solo POI con permisos limitados (tipo Proyecto)
  // ============================================
  [ROLES.DESARROLLADOR]: {
    modules: [MODULES.POI, MODULES.NOTIFICACIONES],
    permissions: {
      [MODULES.POI]: [
        PERMISSIONS.VIEW,
        PERMISSIONS.UPDATE_TASK_STATUS,
        PERMISSIONS.MANAGE_BACKLOG,
      ],
      [MODULES.NOTIFICACIONES]: [PERMISSIONS.VIEW],
    },
  },

  // ============================================
  // IMPLEMENTADOR
  // Solo POI con permisos limitados (tipo Actividad)
  // ============================================
  [ROLES.IMPLEMENTADOR]: {
    modules: [MODULES.POI, MODULES.NOTIFICACIONES],
    permissions: {
      [MODULES.POI]: [
        PERMISSIONS.VIEW,
        PERMISSIONS.UPDATE_TASK_STATUS,
        PERMISSIONS.MANAGE_BACKLOG,
      ],
      [MODULES.NOTIFICACIONES]: [PERMISSIONS.VIEW],
    },
  },

  // ============================================
  // USUARIO
  // POI (solo ver) y Notificaciones
  // ============================================
  [ROLES.USUARIO]: {
    modules: [
      MODULES.POI,
      MODULES.NOTIFICACIONES,
    ],
    permissions: {
      [MODULES.POI]: [
        PERMISSIONS.VIEW,
      ],
      [MODULES.NOTIFICACIONES]: [
        PERMISSIONS.VIEW,
      ],
    },
  },

  // ============================================
  // COORDINADOR
  // POI, Notificaciones
  // NO tiene acceso a RRHH
  // ============================================
  [ROLES.COORDINADOR]: {
    modules: [
      MODULES.POI,
      MODULES.NOTIFICACIONES,
    ],
    permissions: {
      [MODULES.POI]: [
        PERMISSIONS.VIEW,
        PERMISSIONS.CREATE,
        PERMISSIONS.EDIT,
        PERMISSIONS.ASSIGN_TASKS,
        PERMISSIONS.UPDATE_TASK_STATUS,
        PERMISSIONS.VIEW_REPORTS,
      ],
      [MODULES.NOTIFICACIONES]: [
        PERMISSIONS.VIEW,
      ],
    },
  },

  // ============================================
  // PATROCINADOR
  // POI (solo ver y validar), Notificaciones
  // ============================================
  [ROLES.PATROCINADOR]: {
    modules: [
      MODULES.POI,
      MODULES.NOTIFICACIONES,
    ],
    permissions: {
      [MODULES.POI]: [
        PERMISSIONS.VIEW,
        PERMISSIONS.EXPORT,
        PERMISSIONS.VIEW_REPORTS,
      ],
      [MODULES.NOTIFICACIONES]: [
        PERMISSIONS.VIEW,
      ],
    },
  },
};

// ============================================
// FUNCIONES HELPER PARA VERIFICAR PERMISOS
// ============================================

/**
 * Verifica si un rol tiene acceso a un módulo
 */
export function canAccessModule(role: Role, module: Module): boolean {
  const roleConfig = ROLE_PERMISSIONS[role];
  return roleConfig?.modules.includes(module) ?? false;
}

/**
 * Verifica si un rol tiene un permiso específico en un módulo
 */
export function hasPermission(
  role: Role,
  module: Module,
  permission: Permission
): boolean {
  const roleConfig = ROLE_PERMISSIONS[role];
  if (!roleConfig) return false;

  const modulePermissions = roleConfig.permissions[module];
  return modulePermissions?.includes(permission) ?? false;
}

/**
 * Verifica si un rol tiene TODOS los permisos especificados
 */
export function hasAllPermissions(
  role: Role,
  module: Module,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) =>
    hasPermission(role, module, permission)
  );
}

/**
 * Verifica si un rol tiene AL MENOS UNO de los permisos especificados
 */
export function hasAnyPermission(
  role: Role,
  module: Module,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) =>
    hasPermission(role, module, permission)
  );
}

/**
 * Obtiene todos los permisos de un rol para un módulo
 */
export function getModulePermissions(
  role: Role,
  module: Module
): Permission[] {
  const roleConfig = ROLE_PERMISSIONS[role];
  return roleConfig?.permissions[module] ?? [];
}

/**
 * Obtiene todos los módulos accesibles para un rol
 */
export function getAccessibleModules(role: Role): Module[] {
  const roleConfig = ROLE_PERMISSIONS[role];
  return roleConfig?.modules ?? [];
}

/**
 * Verifica si el rol puede editar (CREATE, EDIT, o DELETE)
 */
export function canEdit(role: Role, module: Module): boolean {
  return hasAnyPermission(role, module, [
    PERMISSIONS.CREATE,
    PERMISSIONS.EDIT,
    PERMISSIONS.DELETE,
  ]);
}

/**
 * Verifica si el rol es solo lectura en un módulo
 */
export function isReadOnly(role: Role, module: Module): boolean {
  const permissions = getModulePermissions(role, module);
  return permissions.length === 1 && permissions[0] === PERMISSIONS.VIEW;
}

// ============================================
// MAPEO DE RUTAS A MÓDULOS
// ============================================

/**
 * Mapea rutas del sistema a módulos para verificación de acceso
 */
export const ROUTE_TO_MODULE: Record<string, Module> = {
  '/pgd': MODULES.PGD,
  '/poi': MODULES.POI,
  '/recursos-humanos': MODULES.RECURSOS_HUMANOS,
  '/dashboard': MODULES.DASHBOARD,
  '/notificaciones': MODULES.NOTIFICACIONES,
};

/**
 * Obtiene el módulo correspondiente a una ruta
 */
export function getModuleFromRoute(pathname: string): Module | null {
  // Buscar coincidencia exacta o por prefijo
  for (const [route, module] of Object.entries(ROUTE_TO_MODULE)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return module;
    }
  }
  return null;
}

/**
 * Verifica si un rol puede acceder a una ruta
 */
export function canAccessRoute(role: Role, pathname: string): boolean {
  const module = getModuleFromRoute(pathname);
  if (!module) return true; // Rutas no mapeadas son accesibles (login, perfil, etc.)
  return canAccessModule(role, module);
}

// ============================================
// CONFIGURACIÓN DE NAVEGACIÓN POR ROL
// ============================================

export type NavItem = {
  title: string;
  href: string;
  icon?: string;
  module: Module;
};

/**
 * Items de navegación del sistema
 */
export const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', module: MODULES.DASHBOARD },
  { title: 'PGD', href: '/pgd', icon: 'Target', module: MODULES.PGD },
  { title: 'POI', href: '/poi', icon: 'ClipboardList', module: MODULES.POI },
  { title: 'Recursos Humanos', href: '/recursos-humanos', icon: 'Users', module: MODULES.RECURSOS_HUMANOS },
  { title: 'Notificaciones', href: '/notificaciones', icon: 'Bell', module: MODULES.NOTIFICACIONES },
];

/**
 * Obtiene los items de navegación filtrados por rol
 */
export function getNavItemsForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => canAccessModule(role, item.module));
}

// ============================================
// RUTA POR DEFECTO SEGÚN ROL
// ============================================

/**
 * Obtiene la ruta de inicio por defecto para un rol
 */
export function getDefaultRouteForRole(role: Role): string {
  switch (role) {
    case ROLES.ADMIN:
      return '/dashboard'; // Admin tiene acceso a todo, inicia en Dashboard
    case ROLES.PMO:
      return '/pgd';
    case ROLES.SCRUM_MASTER:
    case ROLES.COORDINADOR:
    case ROLES.DESARROLLADOR:
    case ROLES.IMPLEMENTADOR:
    case ROLES.USUARIO:
    case ROLES.PATROCINADOR:
      return '/poi';
    default:
      return '/login';
  }
}
