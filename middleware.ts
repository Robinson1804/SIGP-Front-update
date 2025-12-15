import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware de autenticación para SIGP
 *
 * Protege rutas en el edge antes de que lleguen al cliente.
 * Maneja redirecciones automáticas para rutas públicas y protegidas.
 */

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = ['/login', '/unauthorized'];

// Rutas protegidas que requieren autenticación
const PROTECTED_ROUTES = [
  '/dashboard',
  '/pgd',
  '/poi',
  '/recursos-humanos',
  '/notificaciones',
  '/perfil'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir assets estáticos y archivos públicos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Root redirect se maneja en page.tsx
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Obtener token de cookies o headers
  // Prioridad: cookie 'auth-token', luego Authorization header
  const token = request.cookies.get('auth-token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '');

  // Si es ruta pública, permitir acceso
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    // Si está autenticado y va a login, redirigir a dashboard
    if (token && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Si es ruta protegida y NO tiene token, redirigir a login
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      // Guardar la ruta original para redirect post-login
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|images).*)',
  ],
};
