'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, useCurrentUser } from '@/stores';
import { Module, Permission } from '@/lib/definitions';
import { canAccessModule, hasPermission } from '@/lib/permissions';
import { paths } from '@/lib/paths';

interface ProtectedRouteProps {
  children: React.ReactNode;
  module?: Module;
  requiredPermission?: Permission;
  fallbackUrl?: string;
}

/**
 * Componente que protege rutas basándose en el rol del usuario
 *
 * @example
 * // Proteger una página que requiere acceso al módulo POI
 * <ProtectedRoute module="POI">
 *   <POIPage />
 * </ProtectedRoute>
 *
 * @example
 * // Proteger una página que requiere un permiso específico
 * <ProtectedRoute module="POI" requiredPermission="MANAGE_BACKLOG">
 *   <BacklogManager />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  module,
  requiredPermission,
  fallbackUrl = paths.login,
}: ProtectedRouteProps) {
  const user = useCurrentUser();
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // Si no está autenticado, redirigir a login
    if (!isAuthenticated || !user) {
      router.push(`${fallbackUrl}?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Si se especifica un módulo, verificar acceso
    if (module && !canAccessModule(user.role, module)) {
      router.push('/unauthorized');
      return;
    }

    // Si se especifica un permiso, verificar que lo tenga
    if (module && requiredPermission && !hasPermission(user.role, module, requiredPermission)) {
      router.push('/unauthorized');
      return;
    }
  }, [isLoading, isAuthenticated, user, module, requiredPermission, router, pathname, fallbackUrl]);

  // Mostrar loading mientras se verifica
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado o no tiene acceso, no renderizar nada (se redirigirá)
  if (!isAuthenticated || !user) {
    return null;
  }

  if (module && !canAccessModule(user.role, module)) {
    return null;
  }

  if (module && requiredPermission && !hasPermission(user.role, module, requiredPermission)) {
    return null;
  }

  return <>{children}</>;
}
