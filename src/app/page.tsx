import { redirect } from 'next/navigation';
import { paths } from '@/lib/paths';

/**
 * Root page - Redirige automáticamente a login
 *
 * El middleware ya maneja la redirección basada en autenticación,
 * pero esta página asegura que siempre haya un redirect por defecto.
 */
export default function RootPage() {
  redirect(paths.login);
}
