/**
 * Actividades Service
 *
 * Servicios para gestión de Actividades (Kanban)
 * Conecta con el backend NestJS en localhost:3010/api/v1
 */

import { apiClient, ENDPOINTS } from '@/lib/api';
import type { PaginatedResponse } from '@/types';
import type {
  Actividad,
  CreateActividadInput,
  UpdateActividadInput,
  ActividadQueryFilters,
  TableroKanban,
  ActividadMetricas,
} from '../types';

// ============================================
// CRUD Operations
// ============================================

/**
 * Obtener lista de actividades con filtros opcionales
 *
 * @param filters - Filtros de búsqueda opcionales
 * @returns Lista paginada de actividades
 *
 * @example
 * const actividades = await getActividades({ estado: 'En ejecucion', page: 1 });
 */
export async function getActividades(
  filters?: ActividadQueryFilters
): Promise<PaginatedResponse<Actividad>> {
  const response = await apiClient.get<PaginatedResponse<Actividad>>(
    ENDPOINTS.ACTIVIDADES.BASE,
    { params: filters }
  );
  return response.data;
}

/**
 * Obtener todas las actividades sin paginación
 * Útil para selectores y dropdowns
 *
 * @param filters - Filtros de búsqueda opcionales
 * @returns Array de actividades
 */
export async function getAllActividades(
  filters?: Omit<ActividadQueryFilters, 'page' | 'pageSize'>
): Promise<Actividad[]> {
  const response = await apiClient.get<Actividad[]>(
    ENDPOINTS.ACTIVIDADES.BASE,
    {
      params: {
        ...filters,
        all: true, // Indicador para obtener todos los registros
      },
    }
  );
  return response.data;
}

/**
 * Obtener una actividad por su ID
 *
 * @param id - ID de la actividad
 * @returns Datos completos de la actividad
 *
 * @example
 * const actividad = await getActividadById(1);
 */
export async function getActividadById(id: number | string): Promise<Actividad> {
  const response = await apiClient.get<Actividad>(
    ENDPOINTS.ACTIVIDADES.BY_ID(id)
  );
  return response.data;
}

/**
 * Crear una nueva actividad
 *
 * @param data - Datos para crear la actividad
 * @returns Actividad creada
 *
 * @example
 * const nuevaActividad = await createActividad({
 *   codigo: 'ACT001',
 *   nombre: 'Mantenimiento de sistemas',
 *   descripcion: 'Actividad continua de mantenimiento',
 *   coordinadorId: 5,
 * });
 */
/**
 * Obtener el siguiente código de actividad disponible
 *
 * @returns Código de actividad generado (ej: "ACT N°1")
 */
export async function getNextActividadCodigo(): Promise<string> {
  const response = await apiClient.get<string>(
    ENDPOINTS.ACTIVIDADES.NEXT_CODIGO
  );
  return response.data;
}

export async function createActividad(
  data: CreateActividadInput
): Promise<Actividad> {
  const response = await apiClient.post<Actividad>(
    ENDPOINTS.ACTIVIDADES.BASE,
    data
  );
  return response.data;
}

/**
 * Actualizar una actividad existente
 *
 * @param id - ID de la actividad a actualizar
 * @param data - Datos a actualizar
 * @returns Actividad actualizada
 *
 * @example
 * const actividadActualizada = await updateActividad(1, {
 *   estado: 'En ejecucion',
 *   descripcion: 'Nueva descripción',
 * });
 */
export async function updateActividad(
  id: number | string,
  data: UpdateActividadInput
): Promise<Actividad> {
  const response = await apiClient.patch<Actividad>(
    ENDPOINTS.ACTIVIDADES.BY_ID(id),
    data
  );
  return response.data;
}

/**
 * Eliminar una actividad (soft delete)
 *
 * @param id - ID de la actividad a eliminar
 *
 * @example
 * await deleteActividad(1);
 */
export async function deleteActividad(id: number | string): Promise<void> {
  await apiClient.delete(ENDPOINTS.ACTIVIDADES.BY_ID(id));
}

// ============================================
// Tablero Kanban Operations
// ============================================

/**
 * Obtener el tablero Kanban de una actividad
 * Incluye todas las tareas organizadas por estado
 *
 * @param id - ID de la actividad
 * @returns Vista del tablero Kanban con tareas organizadas por columnas
 *
 * @example
 * const tablero = await getTablero(1);
 * // tablero.columnas contiene las tareas organizadas por estado
 */
export async function getTablero(id: number | string): Promise<TableroKanban> {
  const response = await apiClient.get<TableroKanban>(
    `${ENDPOINTS.ACTIVIDADES.BY_ID(id)}/tablero`
  );
  return response.data;
}

// ============================================
// Reportes y Métricas
// ============================================

/**
 * Obtener métricas de una actividad
 * Incluye estadísticas de tareas, tiempos y rendimiento
 *
 * @param id - ID de la actividad
 * @returns Métricas de la actividad
 *
 * @example
 * const metricas = await getActividadMetricas(1);
 * console.log(`Completado: ${metricas.porcentajeCompletado}%`);
 */
export async function getActividadMetricas(
  id: number | string
): Promise<ActividadMetricas> {
  const response = await apiClient.get<ActividadMetricas>(
    ENDPOINTS.ACTIVIDADES.METRICAS(id)
  );
  return response.data;
}

/**
 * Obtener reportes de una actividad
 *
 * @param id - ID de la actividad
 * @returns Reportes asociados a la actividad
 */
export async function getActividadReportes(id: number | string) {
  const response = await apiClient.get(ENDPOINTS.ACTIVIDADES.REPORTES(id));
  return response.data;
}

// ============================================
// Estado Operations
// ============================================

/**
 * Cambiar estado de una actividad
 *
 * @param id - ID de la actividad
 * @param estado - Nuevo estado
 * @returns Actividad actualizada
 *
 * @example
 * const actividad = await cambiarEstadoActividad(1, 'En ejecucion');
 */
export async function cambiarEstadoActividad(
  id: number | string,
  estado: Actividad['estado']
): Promise<Actividad> {
  return updateActividad(id, { estado });
}

/**
 * Suspender una actividad
 *
 * @param id - ID de la actividad
 * @returns Actividad suspendida
 */
export async function suspenderActividad(
  id: number | string
): Promise<Actividad> {
  return cambiarEstadoActividad(id, 'Suspendido');
}

/**
 * Reanudar una actividad suspendida
 *
 * @param id - ID de la actividad
 * @returns Actividad reanudada
 */
export async function reanudarActividad(
  id: number | string
): Promise<Actividad> {
  return cambiarEstadoActividad(id, 'En ejecucion');
}

/**
 * Finalizar una actividad
 *
 * @param id - ID de la actividad
 * @returns Actividad finalizada
 */
export async function finalizarActividad(
  id: number | string
): Promise<Actividad> {
  return cambiarEstadoActividad(id, 'Finalizado');
}

// ============================================
// Utility Functions
// ============================================

/**
 * Verificar si una actividad existe
 *
 * @param id - ID de la actividad
 * @returns true si existe, false si no
 */
export async function actividadExists(id: number | string): Promise<boolean> {
  try {
    await getActividadById(id);
    return true;
  } catch {
    return false;
  }
}

/**
 * Obtener actividades por coordinador
 *
 * @param coordinadorId - ID del coordinador
 * @param filters - Filtros adicionales
 * @returns Lista de actividades del coordinador
 */
export async function getActividadesByCoordinador(
  coordinadorId: number,
  filters?: Omit<ActividadQueryFilters, 'coordinadorId'>
): Promise<PaginatedResponse<Actividad>> {
  return getActividades({
    ...filters,
    coordinadorId,
  });
}

/**
 * Obtener actividades activas (no finalizadas ni suspendidas)
 *
 * @param filters - Filtros adicionales
 * @returns Lista de actividades activas
 */
export async function getActividadesActivas(
  filters?: Omit<ActividadQueryFilters, 'estado'>
): Promise<Actividad[]> {
  const response = await apiClient.get<Actividad[]>(
    ENDPOINTS.ACTIVIDADES.BASE,
    {
      params: {
        ...filters,
        estado: 'En ejecucion',
        activo: true,
      },
    }
  );
  return response.data;
}

/**
 * Obtener actividades vinculadas a un PGD
 * (a través de las Acciones Estratégicas -> OEGD -> OGD -> PGD)
 *
 * @param pgdId - ID del PGD
 * @returns Lista de actividades del PGD
 */
export async function getActividadesByPGD(
  pgdId: number | string
): Promise<Actividad[]> {
  const response = await apiClient.get<Actividad[]>(
    ENDPOINTS.ACTIVIDADES.BASE,
    {
      params: {
        pgdId: Number(pgdId),
        activo: true,
      },
    }
  );
  return response.data;
}
