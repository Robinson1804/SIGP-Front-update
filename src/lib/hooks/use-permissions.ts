'use client';

import { useMemo } from 'react';
import { useAuth } from '@/stores';
import { Module, MODULES, Permission, PERMISSIONS } from '@/lib/definitions';
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  canAccessModule,
  getModulePermissions,
  canEdit,
  isReadOnly,
} from '@/lib/permissions';

/**
 * Hook para verificar permisos del usuario actual en un módulo específico
 *
 * @example
 * // En un componente de POI
 * const { canView, canCreate, canDelete, can } = usePermissions('POI');
 *
 * if (canCreate) {
 *   // Mostrar botón de crear
 * }
 *
 * if (can(PERMISSIONS.MANAGE_BACKLOG)) {
 *   // Mostrar opciones de backlog
 * }
 */
export function usePermissions(module: Module) {
  const { user } = useAuth();
  const role = user?.role;

  return useMemo(() => {
    if (!role) {
      return {
        // Permisos básicos
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canExport: false,

        // Helpers
        canModify: false, // CREATE, EDIT, o DELETE
        isReadOnly: true,
        hasAccess: false,

        // Permisos específicos
        permissions: [] as Permission[],

        // Funciones de verificación
        can: (_permission: Permission) => false,
        canAll: (_permissions: Permission[]) => false,
        canAny: (_permissions: Permission[]) => false,
      };
    }

    const permissions = getModulePermissions(role, module);

    return {
      // Permisos básicos
      canView: hasPermission(role, module, PERMISSIONS.VIEW),
      canCreate: hasPermission(role, module, PERMISSIONS.CREATE),
      canEdit: hasPermission(role, module, PERMISSIONS.EDIT),
      canDelete: hasPermission(role, module, PERMISSIONS.DELETE),
      canExport: hasPermission(role, module, PERMISSIONS.EXPORT),

      // Helpers
      canModify: canEdit(role, module),
      isReadOnly: isReadOnly(role, module),
      hasAccess: canAccessModule(role, module),

      // Permisos específicos
      permissions,

      // Funciones de verificación
      can: (permission: Permission) => hasPermission(role, module, permission),
      canAll: (perms: Permission[]) => hasAllPermissions(role, module, perms),
      canAny: (perms: Permission[]) => hasAnyPermission(role, module, perms),
    };
  }, [role, module]);
}

/**
 * Hook para verificar acceso a módulos
 *
 * @example
 * const { canAccess, accessibleModules } = useModuleAccess();
 *
 * if (canAccess('PGD')) {
 *   // Mostrar enlace a PGD
 * }
 */
export function useModuleAccess() {
  const { user } = useAuth();
  const role = user?.role;

  return useMemo(() => {
    if (!role) {
      return {
        canAccess: (_module: Module) => false,
        accessibleModules: [] as Module[],
      };
    }

    return {
      canAccess: (module: Module) => canAccessModule(role, module),
      accessibleModules: user
        ? (Object.values(MODULES) as Module[]).filter((m) =>
            canAccessModule(role, m)
          )
        : [],
    };
  }, [role, user]);
}

/**
 * Hook específico para el módulo POI con permisos detallados
 */
export function usePOIPermissions() {
  const base = usePermissions('POI');

  return useMemo(
    () => ({
      ...base,
      canManageBacklog: base.can(PERMISSIONS.MANAGE_BACKLOG),
      canManageSprints: base.can(PERMISSIONS.MANAGE_SPRINTS),
      canAssignTasks: base.can(PERMISSIONS.ASSIGN_TASKS),
      canUpdateTaskStatus: base.can(PERMISSIONS.UPDATE_TASK_STATUS),
      canViewReports: base.can(PERMISSIONS.VIEW_REPORTS),
    }),
    [base]
  );
}

/**
 * Hook específico para el módulo PGD con permisos detallados
 */
export function usePGDPermissions() {
  const base = usePermissions('PGD');

  return useMemo(
    () => ({
      ...base,
      canManageObjectives: base.can(PERMISSIONS.MANAGE_OBJECTIVES),
      canApproveProjects: base.can(PERMISSIONS.APPROVE_PROJECTS),
      canViewReports: base.can(PERMISSIONS.VIEW_REPORTS),
    }),
    [base]
  );
}

/**
 * Hook específico para el módulo RRHH con permisos detallados
 */
export function useRRHHPermissions() {
  const base = usePermissions('RECURSOS_HUMANOS');

  return useMemo(
    () => ({
      ...base,
      canManageUsers: base.can(PERMISSIONS.MANAGE_USERS),
      canAssignRoles: base.can(PERMISSIONS.ASSIGN_ROLES),
    }),
    [base]
  );
}
