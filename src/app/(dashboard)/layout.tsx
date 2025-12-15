'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { paths } from '@/lib/paths';
import AppLayout from '@/components/layout/app-layout';

/**
 * Layout para rutas protegidas del dashboard
 *
 * Este layout envuelve todas las rutas dentro del route group (dashboard).
 * Valida autenticación y permisos antes de renderizar el contenido.
 * Todas las rutas protegidas comparten el AppLayout (sidebar, header, etc.)
 */

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    // Esperar a que termine de cargar el estado de autenticación
    if (isLoading) return;

    // Si no está autenticado, redirigir a login
    if (!isAuthenticated || !user) {
      router.push(`${paths.login}?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // TODO: Verificar permisos de acceso a la ruta específica
    // Esto se puede implementar con una función canAccessRoute(user.role, pathname)
    // if (!canAccessRoute(user.role, pathname)) {
    //   router.push('/unauthorized');
    //   return;
    // }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  // Mostrar loading mientras se verifica autenticación
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

  // Si no está autenticado, no renderizar nada (se redirigirá)
  if (!isAuthenticated || !user) {
    return null;
  }

  // Renderizar con AppLayout compartido
  return <AppLayout>{children}</AppLayout>;
}
