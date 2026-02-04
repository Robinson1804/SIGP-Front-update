'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, useHasHydrated } from '@/stores';
import { paths } from '@/lib/paths';
// AppLayout se maneja en cada página individual para permitir breadcrumbs personalizados
import { WebSocketProvider } from '@/contexts/websocket-context';

/**
 * Layout para rutas protegidas del dashboard
 *
 * Este layout envuelve todas las rutas dentro del route group (dashboard).
 * Valida autenticación y permisos antes de renderizar el contenido.
 * Todas las rutas protegidas comparten el AppLayout (sidebar, header, etc.)
 *
 * IMPORTANTE: WebSocketProvider está dentro porque necesita acceso al token de auth
 * IMPORTANTE: Espera a que Zustand termine de rehidratar antes de verificar auth
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
  const hasHydrated = useHasHydrated(); // Esperar rehidratación de Zustand

  useEffect(() => {
    // CRÍTICO: Esperar a que Zustand termine de rehidratar desde localStorage
    // Sin esto, isAuthenticated será false incluso si hay sesión guardada
    if (!hasHydrated) return;

    // Si no está autenticado, redirigir a login
    if (!isAuthenticated || !user) {
      router.push(`${paths.login}?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Si debe cambiar contraseña, bloquear navegación a cualquier otra ruta
    if (user.mustChangePassword && pathname !== '/cambiar-password') {
      router.push('/cambiar-password');
      return;
    }

    // TODO: Verificar permisos de acceso a la ruta específica
    // Esto se puede implementar con una función canAccessRoute(user.role, pathname)
    // if (!canAccessRoute(user.role, pathname)) {
    //   router.push('/unauthorized');
    //   return;
    // }
  }, [hasHydrated, isAuthenticated, user, pathname, router]);

  // Mostrar loading mientras Zustand rehidrata
  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, no renderizar nada (se redirigirá)
  if (!isAuthenticated || !user) {
    return null;
  }

  // Renderizar con WebSocket para tiempo real
  // AppLayout se maneja en cada página individual para permitir breadcrumbs personalizados
  return (
    <WebSocketProvider>
      {children}
    </WebSocketProvider>
  );
}
