/**
 * Asignaciones Service
 *
 * Servicios para gestión de asignaciones de personal a proyectos/actividades
 */

import { apiClient, ENDPOINTS } from '@/lib/api';

/**
 * Interface para personal de RRHH
 */
export interface Personal {
  id: number;
  /**
   * ID del usuario vinculado en la tabla auth.usuarios.
   * Este es el ID que debe usarse para asignar tareas.
   */
  usuarioId?: number;
  codigoEmpleado?: string;
  nombres: string;
  apellidos: string;
  email?: string;
  telefono?: string;
  cargo?: string;
  divisionId?: number;
  division?: {
    id: number;
    nombre: string;
  };
  disponible: boolean;
  activo: boolean;
  horasSemanales?: number;
}

export interface Asignacion {
  id: number;
  personalId: number;
  tipoAsignacion: 'Proyecto' | 'Actividad' | 'Subproyecto';
  proyectoId?: number;
  actividadId?: number;
  subproyectoId?: number;
  rolEquipo?: string;
  porcentajeDedicacion: number;
  fechaInicio: string;
  fechaFin?: string;
  activo: boolean;
  personal?: {
    id: number;
    nombres: string;
    apellidos: string;
    codigoEmpleado?: string;
  };
}

export interface CreateAsignacionData {
  personalId: number;
  tipoAsignacion: 'Proyecto' | 'Actividad' | 'Subproyecto';
  proyectoId?: number;
  actividadId?: number;
  subproyectoId?: number;
  rolEquipo?: string;
  porcentajeDedicacion: number;
  fechaInicio: string;
  fechaFin?: string;
}

/**
 * Obtener lista de personal de RRHH
 */
export async function getPersonalDisponible(): Promise<Personal[]> {
  const response = await apiClient.get<Personal[]>(ENDPOINTS.RRHH.PERSONAL, {
    params: { activo: true }
  });
  return response.data || [];
}

/**
 * Formatear nombre completo de personal
 */
export function formatPersonalNombre(personal: Personal): string {
  return `${personal.nombres} ${personal.apellidos}`.trim();
}

/**
 * Obtener asignaciones de un proyecto
 */
export async function getAsignacionesByProyecto(proyectoId: number | string): Promise<Asignacion[]> {
  const response = await apiClient.get<Asignacion[]>(
    ENDPOINTS.RRHH.ASIGNACIONES_PROYECTO(proyectoId)
  );
  return response.data || [];
}

/**
 * Crear una nueva asignación
 */
export async function createAsignacion(data: CreateAsignacionData): Promise<Asignacion> {
  const response = await apiClient.post<Asignacion>(
    ENDPOINTS.RRHH.ASIGNACIONES,
    data
  );
  return response.data;
}

/**
 * Eliminar (desactivar) una asignación
 */
export async function deleteAsignacion(id: number | string): Promise<void> {
  await apiClient.delete(ENDPOINTS.RRHH.ASIGNACION_BY_ID(id));
}

/**
 * Información de error de asignación con detalles del personal
 */
export interface AsignacionError {
  personalId: number;
  mensaje: string;
  dedicacionActual?: number;
}

/**
 * Sincronizar asignaciones de un proyecto con una lista de IDs de personal
 * @param proyectoId ID del proyecto
 * @param personalIds Lista de IDs de personal que deben estar asignados
 * @param porcentajeDedicacion Porcentaje de dedicación por defecto (default 25% - permite 4 proyectos)
 */
export async function syncAsignacionesProyecto(
  proyectoId: number,
  personalIds: number[],
  porcentajeDedicacion: number = 25
): Promise<{ created: number; removed: number; errors: AsignacionError[] }> {
  // Obtener asignaciones actuales
  const asignacionesActuales = await getAsignacionesByProyecto(proyectoId);
  const idsActuales = asignacionesActuales.map(a => a.personalId);

  // Determinar qué agregar y qué eliminar
  const idsAAgregar = personalIds.filter(id => !idsActuales.includes(id));
  const asignacionesAEliminar = asignacionesActuales.filter(a => !personalIds.includes(a.personalId));

  let created = 0;
  let removed = 0;
  const errors: AsignacionError[] = [];

  // Crear nuevas asignaciones
  for (const personalId of idsAAgregar) {
    try {
      await createAsignacion({
        personalId,
        tipoAsignacion: 'Proyecto',
        proyectoId,
        rolEquipo: 'Desarrollador',
        porcentajeDedicacion,
        fechaInicio: new Date().toISOString().split('T')[0],
      });
      created++;
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string } } };

      if (axiosError.response?.status === 409) {
        // Extraer el porcentaje actual del mensaje del backend si está disponible
        const backendMsg = axiosError.response?.data?.message || '';
        const match = backendMsg.match(/tiene (\d+)%/);
        const dedicacionActual = match ? parseInt(match[1], 10) : undefined;

        errors.push({
          personalId,
          mensaje: backendMsg || 'Dedicación excedería 100%',
          dedicacionActual,
        });
      } else {
        errors.push({
          personalId,
          mensaje: 'Error al asignar',
        });
      }
    }
  }

  // Eliminar asignaciones removidas
  for (const asignacion of asignacionesAEliminar) {
    try {
      await deleteAsignacion(asignacion.id);
      removed++;
    } catch (error) {
      console.warn(`No se pudo eliminar asignación ${asignacion.id}:`, error);
    }
  }

  return { created, removed, errors };
}

/**
 * Obtener asignaciones de un subproyecto
 */
export async function getAsignacionesBySubproyecto(subproyectoId: number | string): Promise<Asignacion[]> {
  const response = await apiClient.get<Asignacion[]>(
    ENDPOINTS.RRHH.ASIGNACIONES_SUBPROYECTO(subproyectoId)
  );
  return response.data || [];
}

/**
 * Sincronizar asignaciones de un subproyecto con una lista de IDs de personal
 * @param subproyectoId ID del subproyecto
 * @param personalIds Lista de IDs de personal que deben estar asignados
 * @param porcentajeDedicacion Porcentaje de dedicación por defecto (default 25% - permite 4 asignaciones)
 */
export async function syncAsignacionesSubproyecto(
  subproyectoId: number,
  personalIds: number[],
  porcentajeDedicacion: number = 25
): Promise<{ created: number; removed: number }> {
  // Obtener asignaciones actuales
  const asignacionesActuales = await getAsignacionesBySubproyecto(subproyectoId);
  const idsActuales = asignacionesActuales.map(a => a.personalId);

  // Determinar qué agregar y qué eliminar
  const idsAAgregar = personalIds.filter(id => !idsActuales.includes(id));
  const asignacionesAEliminar = asignacionesActuales.filter(a => !personalIds.includes(a.personalId));

  let created = 0;
  let removed = 0;

  // Crear nuevas asignaciones
  for (const personalId of idsAAgregar) {
    try {
      await createAsignacion({
        personalId,
        tipoAsignacion: 'Subproyecto',
        subproyectoId,
        rolEquipo: 'Desarrollador',
        porcentajeDedicacion,
        fechaInicio: new Date().toISOString().split('T')[0],
      });
      created++;
    } catch (error) {
      console.warn(`No se pudo asignar personal ${personalId} al subproyecto:`, error);
    }
  }

  // Eliminar asignaciones removidas
  for (const asignacion of asignacionesAEliminar) {
    try {
      await deleteAsignacion(asignacion.id);
      removed++;
    } catch (error) {
      console.warn(`No se pudo eliminar asignación ${asignacion.id}:`, error);
    }
  }

  return { created, removed };
}

/**
 * Obtener asignaciones de una actividad
 */
export async function getAsignacionesByActividad(actividadId: number | string): Promise<Asignacion[]> {
  const response = await apiClient.get<Asignacion[]>(
    ENDPOINTS.RRHH.ASIGNACIONES_ACTIVIDAD(actividadId)
  );
  return response.data || [];
}

/**
 * Sincronizar asignaciones de una actividad con una lista de IDs de personal
 * @param actividadId ID de la actividad
 * @param personalIds Lista de IDs de personal que deben estar asignados
 * @param porcentajeDedicacion Porcentaje de dedicación por defecto (default 25% - permite 4 asignaciones)
 */
export async function syncAsignacionesActividad(
  actividadId: number,
  personalIds: number[],
  porcentajeDedicacion: number = 25
): Promise<{ created: number; removed: number; errors: AsignacionError[] }> {
  // Obtener asignaciones actuales
  const asignacionesActuales = await getAsignacionesByActividad(actividadId);
  const idsActuales = asignacionesActuales.map(a => a.personalId);

  // Determinar qué agregar y qué eliminar
  const idsAAgregar = personalIds.filter(id => !idsActuales.includes(id));
  const asignacionesAEliminar = asignacionesActuales.filter(a => !personalIds.includes(a.personalId));

  let created = 0;
  let removed = 0;
  const errors: AsignacionError[] = [];

  // Crear nuevas asignaciones
  for (const personalId of idsAAgregar) {
    try {
      await createAsignacion({
        personalId,
        tipoAsignacion: 'Actividad',
        actividadId,
        rolEquipo: 'Implementador',
        porcentajeDedicacion,
        fechaInicio: new Date().toISOString().split('T')[0],
      });
      created++;
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string } } };

      if (axiosError.response?.status === 409) {
        // Extraer el porcentaje actual del mensaje del backend si está disponible
        const backendMsg = axiosError.response?.data?.message || '';
        const match = backendMsg.match(/tiene (\d+)%/);
        const dedicacionActual = match ? parseInt(match[1], 10) : undefined;

        errors.push({
          personalId,
          mensaje: backendMsg || 'Dedicación excedería 100%',
          dedicacionActual,
        });
      } else {
        errors.push({
          personalId,
          mensaje: 'Error al asignar',
        });
      }
    }
  }

  // Eliminar asignaciones removidas
  for (const asignacion of asignacionesAEliminar) {
    try {
      await deleteAsignacion(asignacion.id);
      removed++;
    } catch (error) {
      console.warn(`No se pudo eliminar asignación ${asignacion.id}:`, error);
    }
  }

  return { created, removed, errors };
}

/**
 * Obtener personal con rol Desarrollador (para responsables de Proyectos)
 */
export async function getPersonalDesarrolladores(): Promise<Personal[]> {
  const response = await apiClient.get<Personal[]>(ENDPOINTS.RRHH.PERSONAL_DESARROLLADORES);
  return response.data || [];
}

/**
 * Obtener personal con rol Implementador (para responsables de Actividades)
 */
export async function getPersonalImplementadores(): Promise<Personal[]> {
  const response = await apiClient.get<Personal[]>(ENDPOINTS.RRHH.PERSONAL_IMPLEMENTADORES);
  return response.data || [];
}

/**
 * Obtener personal con rol Patrocinador (para Área Usuaria de Proyectos)
 */
export async function getPersonalPatrocinadores(): Promise<Personal[]> {
  const response = await apiClient.get<Personal[]>(ENDPOINTS.RRHH.PERSONAL_PATROCINADORES);
  return response.data || [];
}
