/**
 * Página de documentos deprecada
 *
 * Esta ruta ha sido migrada a /poi/proyectos/[id]/documentos
 * donde los documentos se gestionan por proyecto específico.
 *
 * Redirige a la lista de proyectos para que el usuario
 * seleccione un proyecto y acceda a sus documentos.
 */
import { redirect } from 'next/navigation';
import { paths } from '@/lib/paths';

export default function DeprecatedDocumentosPage() {
  // Redirigir a la lista de proyectos POI
  redirect(paths.poi.proyectos.base);
}
