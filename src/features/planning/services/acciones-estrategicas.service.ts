/**
 * Acciones Estratégicas Service
 *
 * Servicios para gestión de Acciones Estratégicas
 */

import { apiClient, del } from '@/lib/api';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type {
  AccionEstrategica,
  CreateAccionEstrategicaInput,
  UpdateAccionEstrategicaInput,
  AccionEstrategicaQueryFilters,
  ProyectoResumen,
  ActividadResumen,
} from '../types';

/**
 * Obtener lista de Acciones Estratégicas con filtros opcionales
 */
export async function getAccionesEstrategicas(
  filters?: AccionEstrategicaQueryFilters
): Promise<AccionEstrategica[]> {
  const response = await apiClient.get<AccionEstrategica[]>(
    ENDPOINTS.PLANNING.ACCIONES_ESTRATEGICAS,
    { params: filters }
  );
  return response.data;
}

/**
 * Obtener Acciones Estratégicas por PGD
 */
export async function getAccionesEstrategicasByPGD(
  pgdId: number | string
): Promise<AccionEstrategica[]> {
  return getAccionesEstrategicas({ pgdId: Number(pgdId) });
}

/**
 * Obtener Acciones Estratégicas por OEGD
 */
export async function getAccionesEstrategicasByOEGD(
  oegdId: number | string
): Promise<AccionEstrategica[]> {
  return getAccionesEstrategicas({ oegdId: Number(oegdId) });
}

/**
 * Obtener una Acción Estratégica por ID
 */
export async function getAccionEstrategicaById(
  id: number | string
): Promise<AccionEstrategica> {
  const response = await apiClient.get<AccionEstrategica>(
    ENDPOINTS.PLANNING.ACCION_ESTRATEGICA_BY_ID(id)
  );
  return response.data;
}

/**
 * Crear una nueva Acción Estratégica
 */
export async function createAccionEstrategica(
  data: CreateAccionEstrategicaInput
): Promise<AccionEstrategica> {
  const response = await apiClient.post<AccionEstrategica>(
    ENDPOINTS.PLANNING.ACCIONES_ESTRATEGICAS,
    data
  );
  return response.data;
}

/**
 * Actualizar una Acción Estratégica existente
 */
export async function updateAccionEstrategica(
  id: number | string,
  data: UpdateAccionEstrategicaInput
): Promise<AccionEstrategica> {
  const response = await apiClient.patch<AccionEstrategica>(
    ENDPOINTS.PLANNING.ACCION_ESTRATEGICA_BY_ID(id),
    data
  );
  return response.data;
}

/**
 * Eliminar una Acción Estratégica (soft delete)
 */
export async function deleteAccionEstrategica(
  id: number | string
): Promise<void> {
  await del(ENDPOINTS.PLANNING.ACCION_ESTRATEGICA_BY_ID(id));
}

/**
 * Obtener proyectos vinculados a una Acción Estratégica
 */
export async function getProyectosByAccionEstrategica(
  aeId: number | string
): Promise<ProyectoResumen[]> {
  const response = await apiClient.get<ProyectoResumen[]>(
    ENDPOINTS.PLANNING.ACCION_PROYECTOS(aeId)
  );
  return response.data;
}

/**
 * Obtener actividades vinculadas a una Acción Estratégica
 */
export async function getActividadesByAccionEstrategica(
  aeId: number | string
): Promise<ActividadResumen[]> {
  const response = await apiClient.get<ActividadResumen[]>(
    ENDPOINTS.PLANNING.ACCION_ACTIVIDADES(aeId)
  );
  return response.data;
}

/**
 * Activar/Desactivar una Acción Estratégica
 */
export async function toggleAccionEstrategicaActivo(
  id: number | string,
  activo: boolean
): Promise<AccionEstrategica> {
  return updateAccionEstrategica(id, { activo });
}

/**
 * Obtener Acción Estratégica con proyectos y actividades vinculados
 */
export async function getAccionEstrategicaWithPOI(
  id: number | string
): Promise<AccionEstrategica & { proyectos: ProyectoResumen[]; actividades: ActividadResumen[] }> {
  const [ae, proyectos, actividades] = await Promise.all([
    getAccionEstrategicaById(id),
    getProyectosByAccionEstrategica(id).catch(() => []),
    getActividadesByAccionEstrategica(id).catch(() => []),
  ]);

  return {
    ...ae,
    proyectos,
    actividades,
  };
}
