import type { Metadata } from "next";

/**
 * Layout para rutas públicas de autenticación
 *
 * Este layout envuelve todas las rutas dentro del route group (auth),
 * como /login y /unauthorized
 */

export const metadata: Metadata = {
  title: "INEI - Autenticación",
  description: "Sistema de autenticación INEI",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Para rutas públicas, simplemente renderizamos los children
  // sin ningún wrapper adicional
  return <>{children}</>;
}
