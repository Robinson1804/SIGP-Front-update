import { redirect } from 'next/navigation';

/**
 * Redirect de sistema antiguo /poi/proyecto a nuevo /poi/proyectos
 *
 * El sistema antiguo usaba la ruta /poi/proyecto/* con datos mock.
 * El nuevo sistema usa /poi/proyectos/[id] con datos reales de la API.
 */
export default function ProyectoOldRedirect() {
  redirect('/poi/proyectos');
}
