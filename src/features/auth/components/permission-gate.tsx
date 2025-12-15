'use client';

import { ReactNode } from 'react';
import { useCurrentUser } from '@/stores';
import { Module, Permission, Role } from '@/lib/definitions';
import { hasPermission, hasAnyPermission, canAccessModule } from '@/lib/permissions';

interface PermissionGateProps {
  children: ReactNode;
  /** Contenido a mostrar si no tiene permiso (opcional) */
  fallback?: ReactNode;
  /** Módulo donde verificar el permiso */
  module?: Module;
  /** Permiso requerido */
  permission?: Permission;
  /** Lista de permisos (requiere al menos uno) */
  anyPermission?: Permission[];
  /** Lista de permisos (requiere todos) */
  allPermissions?: Permission[];
  /** Roles permitidos directamente */
  allowedRoles?: Role[];
  /** Invertir la lógica (mostrar si NO tiene permiso) */
  invert?: boolean;
}

/**
 * Componente para mostrar/ocultar contenido basado en permisos
 *
 * @example
 * // Mostrar botón solo si puede crear
 * <PermissionGate module="POI" permission="CREATE">
 *   <Button>Nuevo Proyecto</Button>
 * </PermissionGate>
 *
 * @example
 * // Mostrar si tiene cualquiera de los permisos
 * <PermissionGate module="POI" anyPermission={['CREATE', 'EDIT']}>
 *   <EditForm />
 * </PermissionGate>
 *
 * @example
 * // Mostrar contenido alternativo si no tiene permiso
 * <PermissionGate
 *   module="POI"
 *   permission="DELETE"
 *   fallback={<span className="text-gray-400">Sin permisos</span>}
 * >
 *   <DeleteButton />
 * </PermissionGate>
 *
 * @example
 * // Mostrar solo para roles específicos
 * <PermissionGate allowedRoles={['PMO', 'SCRUM_MASTER']}>
 *   <AdminPanel />
 * </PermissionGate>
 */
export function PermissionGate({
  children,
  fallback = null,
  module,
  permission,
  anyPermission,
  allPermissions,
  allowedRoles,
  invert = false,
}: PermissionGateProps) {
  const user = useCurrentUser();

  // Si no hay usuario, no mostrar nada
  if (!user) {
    return invert ? <>{children}</> : <>{fallback}</>;
  }

  let hasAccess = true;

  // Verificar roles permitidos
  if (allowedRoles && allowedRoles.length > 0) {
    hasAccess = allowedRoles.includes(user.role);
  }

  // Verificar acceso al módulo
  if (hasAccess && module) {
    hasAccess = canAccessModule(user.role, module);
  }

  // Verificar permiso específico
  if (hasAccess && module && permission) {
    hasAccess = hasPermission(user.role, module, permission);
  }

  // Verificar cualquiera de los permisos
  if (hasAccess && module && anyPermission && anyPermission.length > 0) {
    hasAccess = hasAnyPermission(user.role, module, anyPermission);
  }

  // Verificar todos los permisos
  if (hasAccess && module && allPermissions && allPermissions.length > 0) {
    hasAccess = allPermissions.every((p) =>
      hasPermission(user.role, module, p)
    );
  }

  // Aplicar inversión si es necesario
  const shouldRender = invert ? !hasAccess : hasAccess;

  return shouldRender ? <>{children}</> : <>{fallback}</>;
}

/**
 * Componente específico para ocultar contenido de solo lectura
 * (usuarios que solo pueden ver pero no editar)
 */
export function EditableOnly({
  children,
  module,
  fallback = null,
}: {
  children: ReactNode;
  module: Module;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate
      module={module}
      anyPermission={['CREATE', 'EDIT', 'DELETE']}
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  );
}

/**
 * Componente para mostrar contenido solo si el usuario es PMO
 */
export function PMOOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate allowedRoles={['PMO']} fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

/**
 * Componente para mostrar contenido solo si el usuario puede gestionar
 */
export function ManagerOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate
      allowedRoles={['PMO', 'SCRUM_MASTER', 'COORDINADOR']}
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  );
}
