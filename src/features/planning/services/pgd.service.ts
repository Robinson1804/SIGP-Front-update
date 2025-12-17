/**
 * PGD Service
 *
 * Servicios para gestión del Plan de Gobierno Digital
 */

import { apiClient, del } from '@/lib/api';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type {
  PGD,
  CreatePGDInput,
  UpdatePGDInput,
  PGDQueryFilters,
  PGDWithStats,
  PGDStats,
} from '../types';

/**
 * Respuesta paginada del backend
 */
interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

/**
 * Obtener lista de todos los PGDs
 */
export async function getPGDs(filters?: PGDQueryFilters): Promise<PGD[]> {
  const response = await apiClient.get<PaginatedResponse<PGD>>(ENDPOINTS.PLANNING.PGD, {
    params: filters,
  });
  // El backend retorna { data: [], total: N }, extraemos solo el array
  return response.data?.data || response.data as unknown as PGD[] || [];
}

/**
 * Obtener el PGD vigente (activo)
 */
export async function getPGDVigente(): Promise<PGD | null> {
  try {
    const response = await apiClient.get<PGD>(ENDPOINTS.PLANNING.PGD_VIGENTE);
    return response.data;
  } catch (error: any) {
    // Si no hay PGD vigente, retornar null
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

// Alias para compatibilidad
export const getPGDActivo = getPGDVigente;

/**
 * Obtener un PGD por ID
 */
export async function getPGDById(id: number | string): Promise<PGD> {
  const response = await apiClient.get<PGD>(ENDPOINTS.PLANNING.PGD_BY_ID(id));
  return response.data;
}

/**
 * Obtener PGD con estadisticas
 */
export async function getPGDWithStats(id: number | string): Promise<PGDWithStats> {
  const [pgd, stats] = await Promise.all([
    getPGDById(id),
    getPGDStats(id).catch(() => null),
  ]);

  return {
    ...pgd,
    stats: stats || undefined,
  };
}

/**
 * Obtener estadisticas de un PGD
 */
export async function getPGDStats(id: number | string): Promise<PGDStats> {
  const response = await apiClient.get<PGDStats>(`${ENDPOINTS.PLANNING.PGD_BY_ID(id)}/stats`);
  return response.data;
}

/**
 * Crear un nuevo PGD
 */
export async function createPGD(data: CreatePGDInput): Promise<PGD> {
  // Auto-generar nombre si no se proporciona
  const payload = {
    ...data,
    nombre: data.nombre || `PGD ${data.anioInicio} - ${data.anioFin}`,
  };

  const response = await apiClient.post<PGD>(ENDPOINTS.PLANNING.PGD, payload);
  return response.data;
}

/**
 * Actualizar un PGD existente
 */
export async function updatePGD(
  id: number | string,
  data: UpdatePGDInput
): Promise<PGD> {
  const response = await apiClient.patch<PGD>(
    ENDPOINTS.PLANNING.PGD_BY_ID(id),
    data
  );
  return response.data;
}

/**
 * Eliminar un PGD (soft delete)
 */
export async function deletePGD(id: number | string): Promise<void> {
  await del(ENDPOINTS.PLANNING.PGD_BY_ID(id));
}

/**
 * Activar/Desactivar un PGD
 */
export async function togglePGDActivo(
  id: number | string,
  activo: boolean
): Promise<PGD> {
  return updatePGD(id, { activo });
}

/**
 * Obtener dashboard completo de un PGD
 */
export async function getPGDDashboard(id: number | string): Promise<import('../types').PGDDashboard> {
  const response = await apiClient.get<import('../types').PGDDashboard>(
    ENDPOINTS.PLANNING.PGD_DASHBOARD(id)
  );
  return response.data;
}

/**
 * Exportar estructura de PGD a PDF
 */
export async function exportPGDToPDF(id: number | string): Promise<Blob> {
  const response = await apiClient.get(
    ENDPOINTS.PLANNING.PGD_EXPORT(id, 'pdf'),
    { responseType: 'blob' }
  );
  return response.data;
}

/**
 * Exportar estructura de PGD a Excel
 */
export async function exportPGDToExcel(id: number | string): Promise<Blob> {
  const response = await apiClient.get(
    ENDPOINTS.PLANNING.PGD_EXPORT(id, 'excel'),
    { responseType: 'blob' }
  );
  return response.data;
}

/**
 * Descargar exportación de PGD
 */
export async function downloadPGDExport(
  id: number | string,
  format: 'pdf' | 'excel' = 'pdf'
): Promise<void> {
  try {
    const blob = format === 'pdf'
      ? await exportPGDToPDF(id)
      : await exportPGDToExcel(id);

    // Crear URL y descargar
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PGD-${id}-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error(`Error exporting PGD to ${format}:`, error);
    throw error;
  }
}
