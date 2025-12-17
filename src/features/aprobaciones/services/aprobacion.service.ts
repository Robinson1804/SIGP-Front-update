/**
 * Aprobaciones Service
 *
 * Servicios para gestión de flujos de aprobación
 */

import { get, post } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type {
  FlujoAprobacion,
  HistorialAprobacion,
  PendienteAprobacion,
  AprobacionResponse,
  AprobarInput,
  RechazarInput,
  TipoEntidadAprobacion,
} from '../types';

/**
 * Obtiene el historial de aprobación de una entidad
 */
export async function getHistorialAprobacion(
  tipo: TipoEntidadAprobacion,
  entidadId: number
): Promise<HistorialAprobacion[]> {
  return get<HistorialAprobacion[]>(
    ENDPOINTS.APROBACIONES.HISTORIAL(tipo, entidadId)
  );
}

/**
 * Obtiene el flujo de aprobación actual de una entidad
 */
export async function getFlujoAprobacion(
  tipo: TipoEntidadAprobacion,
  entidadId: number
): Promise<FlujoAprobacion> {
  return get<FlujoAprobacion>(
    `${ENDPOINTS.APROBACIONES.HISTORIAL(tipo, entidadId)}/flujo`
  );
}

/**
 * Aprueba una entidad en el flujo
 */
export async function aprobar(
  tipo: TipoEntidadAprobacion,
  entidadId: number,
  data: AprobarInput
): Promise<AprobacionResponse> {
  return post<AprobacionResponse>(
    ENDPOINTS.APROBACIONES.APROBAR(tipo, entidadId),
    data
  );
}

/**
 * Rechaza una entidad en el flujo
 */
export async function rechazar(
  tipo: TipoEntidadAprobacion,
  entidadId: number,
  data: RechazarInput
): Promise<AprobacionResponse> {
  return post<AprobacionResponse>(
    ENDPOINTS.APROBACIONES.RECHAZAR(tipo, entidadId),
    data
  );
}

/**
 * Envía una entidad a revisión (inicia el flujo)
 */
export async function enviarARevision(
  tipo: TipoEntidadAprobacion,
  entidadId: number
): Promise<AprobacionResponse> {
  return post<AprobacionResponse>(
    `${ENDPOINTS.APROBACIONES.APROBAR(tipo, entidadId)}/enviar`
  );
}

/**
 * Obtiene todas las entidades pendientes de aprobación del usuario actual
 */
export async function getMisPendientes(): Promise<PendienteAprobacion[]> {
  return get<PendienteAprobacion[]>(ENDPOINTS.APROBACIONES.MIS_PENDIENTES);
}

/**
 * Obtiene todas las entidades pendientes de aprobación (solo PMO)
 */
export async function getPendientesAprobacion(): Promise<PendienteAprobacion[]> {
  return get<PendienteAprobacion[]>(ENDPOINTS.APROBACIONES.PENDIENTES);
}

/**
 * Obtiene contador de pendientes del usuario actual
 */
export async function getContadorPendientes(): Promise<number> {
  const pendientes = await getMisPendientes();
  return pendientes.length;
}
