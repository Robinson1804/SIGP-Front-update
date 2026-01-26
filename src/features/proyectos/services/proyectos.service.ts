/**
 * Proyectos Service
 *
 * Servicios para gestión de proyectos
 */

import { apiClient, del, ENDPOINTS } from '@/lib/api';
import type { Proyecto } from '@/lib/definitions';

// The backend returns projects as a simple array, not paginated
export interface ProyectosResponse {
  data: Proyecto[];
}

export interface ProyectoQueryFilters {
  search?: string;
  estado?: string;
  clasificacion?: string;
  tipo?: 'Proyecto' | 'Actividad';
  anno?: number;
  accionEstrategicaId?: number;
  scrumMasterId?: number;
  coordinadorId?: number;
  activo?: boolean;
  pgdId?: number;
  page?: number;
  pageSize?: number;
}

// Interface para costos anuales
export interface CostoAnual {
  anio: number;
  monto: number;
}

export interface CreateProyectoData {
  codigo?: string; // Autogenerado por el backend
  nombre: string;
  descripcion?: string;
  clasificacion?: 'Al ciudadano' | 'Gestion interna';
  accionEstrategicaId?: number;
  coordinadorId?: number;
  scrumMasterId?: number;
  patrocinadorId?: number;
  coordinacion?: string;
  areaResponsable?: string;
  areasFinancieras?: string[];
  montoAnual?: number;
  anios?: number[];
  costosAnuales?: CostoAnual[];
  alcances?: string[];
  problematica?: string;
  beneficiarios?: string;
  beneficios?: string[];
  fechaInicio?: string;
  fechaFin?: string;
}

export interface UpdateProyectoData extends Partial<CreateProyectoData> {
  estado?: string;
}

/**
 * Obtener el siguiente código de proyecto disponible
 */
export async function getNextProyectoCodigo(): Promise<string> {
  const response = await apiClient.get<string>(ENDPOINTS.PROYECTOS.NEXT_CODIGO);
  return response.data;
}

/**
 * Obtener lista de proyectos con filtros opcionales
 * Por defecto solo retorna proyectos activos (no eliminados)
 */
export async function getProyectos(
  filters?: ProyectoQueryFilters
): Promise<ProyectosResponse> {
  // Por defecto filtrar solo proyectos activos, a menos que se especifique explícitamente
  const effectiveFilters = {
    activo: true,
    ...filters,
  };
  const response = await apiClient.get<Proyecto[]>(
    ENDPOINTS.PROYECTOS.BASE,
    { params: effectiveFilters }
  );
  // The API returns { success: true, data: [...] } - apiClient extracts the body
  // response.data is the full API response, we need to handle both cases
  const data = Array.isArray(response.data) ? response.data : (response.data as unknown as ProyectosResponse).data || [];
  return { data };
}

/**
 * Obtener un proyecto por ID
 */
export async function getProyectoById(id: number | string): Promise<Proyecto> {
  const response = await apiClient.get<Proyecto>(
    ENDPOINTS.PROYECTOS.BY_ID(id)
  );
  return response.data;
}

/**
 * Crear un nuevo proyecto
 */
export async function createProyecto(data: CreateProyectoData): Promise<Proyecto> {
  const response = await apiClient.post<Proyecto>(
    ENDPOINTS.PROYECTOS.BASE,
    data
  );
  return response.data;
}

/**
 * Actualizar un proyecto existente
 */
export async function updateProyecto(
  id: number | string,
  data: UpdateProyectoData
): Promise<Proyecto> {
  const response = await apiClient.patch<Proyecto>(
    ENDPOINTS.PROYECTOS.BY_ID(id),
    data
  );
  return response.data;
}

/**
 * Eliminar un proyecto
 */
export async function deleteProyecto(id: number | string): Promise<void> {
  await del(ENDPOINTS.PROYECTOS.BY_ID(id));
}

/**
 * Obtener backlog de un proyecto
 */
export async function getProyectoBacklog(proyectoId: number | string) {
  const response = await apiClient.get(
    ENDPOINTS.PROYECTOS.BACKLOG(proyectoId)
  );
  return response.data;
}

/**
 * Obtener épicas de un proyecto
 */
export async function getProyectoEpicas(proyectoId: number | string) {
  const response = await apiClient.get(
    ENDPOINTS.PROYECTOS.EPICAS(proyectoId)
  );
  return response.data;
}

/**
 * Obtener sprints de un proyecto
 */
export async function getProyectoSprints(proyectoId: number | string) {
  const response = await apiClient.get(
    ENDPOINTS.PROYECTOS.SPRINTS(proyectoId)
  );
  return response.data;
}

/**
 * Obtener historias de usuario de un proyecto
 */
export async function getProyectoHistorias(proyectoId: number | string) {
  const response = await apiClient.get(
    ENDPOINTS.PROYECTOS.HISTORIAS(proyectoId)
  );
  return response.data;
}

/**
 * Obtener tareas de un proyecto
 * Nota: Las tareas están asociadas a historias de usuario y sprints
 */
export async function getProyectoTareas(proyectoId: number | string) {
  // Las tareas se obtienen a través de las historias o sprints
  // Esta es una función de conveniencia que obtiene tareas filtradas por proyecto
  const response = await apiClient.get(
    ENDPOINTS.TAREAS.BASE,
    { params: { proyectoId } }
  );
  return response.data;
}

/**
 * Obtener documentos de un proyecto
 */
export async function getProyectoDocumentos(proyectoId: number | string) {
  const response = await apiClient.get(
    ENDPOINTS.PROYECTOS.DOCUMENTOS(proyectoId)
  );
  return response.data;
}

/**
 * Obtener actas de un proyecto
 */
export async function getProyectoActas(proyectoId: number | string) {
  const response = await apiClient.get(
    ENDPOINTS.PROYECTOS.ACTAS(proyectoId)
  );
  return response.data;
}

/**
 * Obtener equipo de un proyecto (usando asignaciones de RRHH)
 * IMPORTANTE: Retorna { id: usuarioId, nombre: fullName }
 * El id debe ser usuarioId porque historia.asignadoA referencia la tabla usuarios
 */
export async function getProyectoEquipo(proyectoId: number | string): Promise<{ id: number; nombre: string }[]> {
  try {
    // Primero intentar el endpoint de equipo
    const response = await apiClient.get(
      ENDPOINTS.PROYECTOS.EQUIPO(proyectoId)
    );
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      // El endpoint /proyectos/:id/equipo devuelve:
      // { id: asignacionId, personal: { id: personalId, usuarioId: number, ... }, ... }
      // IMPORTANTE: Necesitamos usar usuarioId (no personalId) porque asignadoA referencia usuarios
      const result = response.data
        .map((item: {
          id: number;
          personalId?: number;
          personal?: {
            id: number;
            usuarioId?: number;
            nombres?: string;
            apellidos?: string;
            apellidoPaterno?: string;
            apellidoMaterno?: string;
            usuario?: { id: number; nombre: string };
          };
          rol?: string;
        }) => {
          // Obtener el usuarioId del personal
          const usuarioId = item.personal?.usuarioId || item.personal?.usuario?.id;

          if (!usuarioId) {
            console.warn('Personal sin usuarioId:', item.personal?.id);
            return null; // Filtrar personal sin usuario vinculado
          }

          // Priorizar nombres + apellidos para mostrar nombre completo
          const nombreCompleto = `${item.personal?.nombres || ''} ${item.personal?.apellidos || item.personal?.apellidoPaterno || ''}`.trim();
          const nombre = nombreCompleto
            || item.personal?.usuario?.nombre
            || `Usuario ${usuarioId}`;

          return { id: usuarioId, nombre };
        })
        .filter((item): item is { id: number; nombre: string } => item !== null);

      console.log('=== EQUIPO MAPEADO (usuarioIds) ===', result);
      return result;
    }
  } catch (error) {
    console.error('Error fetching equipo:', error);
  }

  // Fallback: obtener desde asignaciones
  try {
    const asignacionesResponse = await apiClient.get(
      ENDPOINTS.RRHH.ASIGNACIONES_PROYECTO(proyectoId)
    );
    const asignaciones = asignacionesResponse.data || [];

    // Mapear asignaciones - usar usuarioId del personal
    const result = asignaciones
      .map((a: {
        id: number;
        personalId: number;
        personal?: {
          id: number;
          usuarioId?: number;
          nombres: string;
          apellidos: string;
          apellidoPaterno?: string;
          usuario?: { id: number; nombre: string };
        }
      }) => {
        const usuarioId = a.personal?.usuarioId || a.personal?.usuario?.id;

        if (!usuarioId) {
          console.warn('Personal sin usuarioId en asignación:', a.personalId);
          return null;
        }

        // Priorizar nombres + apellidos para mostrar nombre completo
        const nombreCompleto = `${a.personal?.nombres || ''} ${a.personal?.apellidos || a.personal?.apellidoPaterno || ''}`.trim();
        const nombre = nombreCompleto
          || a.personal?.usuario?.nombre
          || `Usuario ${usuarioId}`;

        return { id: usuarioId, nombre };
      })
      .filter((item): item is { id: number; nombre: string } => item !== null);

    console.log('=== EQUIPO FALLBACK (usuarioIds) ===', result);
    return result;
  } catch {
    return [];
  }
}

/**
 * Cambiar estado de un proyecto
 */
export async function cambiarEstadoProyecto(
  id: number | string,
  estado: string
): Promise<Proyecto> {
  const response = await apiClient.post<Proyecto>(
    `${ENDPOINTS.PROYECTOS.BY_ID(id)}/cambiar-estado`,
    { estado }
  );
  return response.data;
}

/**
 * Obtener requerimientos de un proyecto
 */
export async function getProyectoRequerimientos(proyectoId: number | string) {
  const response = await apiClient.get(
    ENDPOINTS.PROYECTOS.REQUERIMIENTOS(proyectoId)
  );
  return response.data;
}

/**
 * Obtener métricas de velocidad del proyecto
 */
export async function getProyectoVelocity(proyectoId: number | string) {
  const response = await apiClient.get(
    ENDPOINTS.PROYECTOS.VELOCITY(proyectoId)
  );
  return response.data;
}

/**
 * Obtener proyectos por Acción Estratégica
 */
export async function getProyectosByAccionEstrategica(
  accionEstrategicaId: number | string
): Promise<Proyecto[]> {
  const response = await getProyectos({ accionEstrategicaId: Number(accionEstrategicaId) });
  return response.data || [];
}

/**
 * Obtener proyectos vinculados a un PGD
 * (a través de las Acciones Estratégicas -> OEGD -> OGD -> PGD)
 */
export async function getProyectosByPGD(
  pgdId: number | string
): Promise<Proyecto[]> {
  const response = await getProyectos({ pgdId: Number(pgdId) });
  return response.data || [];
}

// ============================================
// GESTIÓN AUTOMÁTICA DE ESTADOS DE PROYECTO
// ============================================

/**
 * Estados posibles de un proyecto
 * - Pendiente: Cuando el proyecto se crea en PGD
 * - En planificacion: Cuando se completan todos los campos requeridos en POI
 * - En desarrollo: Cuando cuenta con sprints creados
 * - Finalizado: Cuando todos los sprints están en estado "Finalizado"
 */
export type ProyectoEstadoAutomatico =
  | 'Pendiente'
  | 'En planificacion'
  | 'En desarrollo'
  | 'Finalizado';

/**
 * Campos requeridos para considerar un proyecto como "completo" (En planificación)
 */
export interface CamposProyectoCompletos {
  nombre: boolean;
  descripcion: boolean;
  clasificacion: boolean;
  accionEstrategicaId: boolean;
  coordinadorId: boolean;
  scrumMasterId: boolean;
  coordinacion: boolean;
  areasFinancieras: boolean;
  fechaInicio: boolean;
  fechaFin: boolean;
  anios: boolean;
}

/**
 * Verificar si todos los campos requeridos del proyecto están completos
 */
export function verificarCamposCompletos(proyecto: Proyecto): CamposProyectoCompletos {
  const proyectoAny = proyecto as any;
  return {
    nombre: Boolean(proyecto.nombre && proyecto.nombre.trim()),
    descripcion: Boolean(proyecto.descripcion && proyecto.descripcion.trim()),
    clasificacion: Boolean(proyecto.clasificacion),
    accionEstrategicaId: Boolean(proyecto.accionEstrategicaId),
    coordinadorId: Boolean(proyectoAny.coordinadorId),
    scrumMasterId: Boolean(proyectoAny.scrumMasterId),
    coordinacion: Boolean(proyectoAny.coordinacion || proyectoAny.areaResponsable),
    areasFinancieras: Boolean(proyectoAny.areasFinancieras && proyectoAny.areasFinancieras.length > 0),
    fechaInicio: Boolean(proyectoAny.fechaInicio),
    fechaFin: Boolean(proyectoAny.fechaFin),
    anios: Boolean(proyecto.anios && proyecto.anios.length > 0),
  };
}

/**
 * Verificar si todos los campos requeridos están completos
 */
export function todosLosCamposCompletos(proyecto: Proyecto): boolean {
  const campos = verificarCamposCompletos(proyecto);
  return Object.values(campos).every(Boolean);
}

/**
 * Resultado del cálculo de estado de proyecto
 */
export interface ResultadoCalculoEstado {
  estadoCalculado: ProyectoEstadoAutomatico;
  estadoActual: string;
  requiereCambio: boolean;
  todoSprintsFinalizados: boolean;
  tieneSprints: boolean;
  camposCompletos: boolean;
  detalles: {
    totalSprints: number;
    sprintsFinalizados: number;
    camposFaltantes: string[];
  };
}

/**
 * Calcular qué estado debería tener el proyecto basado en sus datos
 *
 * Reglas:
 * 1. Si el proyecto está "Cancelado" o "Finalizado", no cambiar
 * 2. Si tiene sprints y todos están "Finalizado" → debería mostrar modal de confirmación
 * 3. Si tiene sprints creados → "En desarrollo"
 * 4. Si todos los campos están completos → "En planificacion"
 * 5. Si faltan campos → "Pendiente"
 */
export async function calcularEstadoProyecto(
  proyectoId: number | string,
  proyecto?: Proyecto,
  sprints?: Array<{ estado: string }>
): Promise<ResultadoCalculoEstado> {
  // Obtener proyecto si no se proporciona
  let proyectoData = proyecto;
  if (!proyectoData) {
    proyectoData = await getProyectoById(proyectoId);
  }

  // Obtener sprints si no se proporcionan
  let sprintsData = sprints;
  if (!sprintsData) {
    try {
      const { getSprintsByProyecto } = await import('./sprints.service');
      sprintsData = await getSprintsByProyecto(proyectoId);
    } catch {
      sprintsData = [];
    }
  }

  const estadoActual = (proyectoData as any).estado || 'Pendiente';
  const camposCompletos = todosLosCamposCompletos(proyectoData);
  const camposVerificados = verificarCamposCompletos(proyectoData);

  // Campos faltantes
  const camposFaltantes = Object.entries(camposVerificados)
    .filter(([, completo]) => !completo)
    .map(([campo]) => campo);

  const totalSprints = sprintsData.length;
  const sprintsFinalizados = sprintsData.filter(s => s.estado === 'Finalizado').length;
  const tieneSprints = totalSprints > 0;
  const todoSprintsFinalizados = tieneSprints && sprintsFinalizados === totalSprints;

  // Si está cancelado o finalizado manualmente, no cambiar
  if (estadoActual === 'Cancelado' || estadoActual === 'Finalizado') {
    return {
      estadoCalculado: estadoActual as ProyectoEstadoAutomatico,
      estadoActual,
      requiereCambio: false,
      todoSprintsFinalizados,
      tieneSprints,
      camposCompletos,
      detalles: {
        totalSprints,
        sprintsFinalizados,
        camposFaltantes,
      },
    };
  }

  // Calcular estado esperado
  let estadoCalculado: ProyectoEstadoAutomatico;

  if (tieneSprints) {
    // Si tiene sprints, está "En desarrollo" (independientemente de si están finalizados)
    // El cambio a "Finalizado" requiere confirmación explícita del usuario
    estadoCalculado = 'En desarrollo';
  } else if (camposCompletos) {
    // Si todos los campos están completos pero no tiene sprints
    estadoCalculado = 'En planificacion';
  } else {
    // Faltan campos por completar
    estadoCalculado = 'Pendiente';
  }

  return {
    estadoCalculado,
    estadoActual,
    requiereCambio: estadoCalculado !== estadoActual,
    todoSprintsFinalizados,
    tieneSprints,
    camposCompletos,
    detalles: {
      totalSprints,
      sprintsFinalizados,
      camposFaltantes,
    },
  };
}

/**
 * Verificar y actualizar el estado del proyecto automáticamente
 * No cambia a "Finalizado" automáticamente - eso requiere confirmación del usuario
 */
export async function verificarYActualizarEstadoProyecto(
  proyectoId: number | string,
  proyecto?: Proyecto,
  sprints?: Array<{ estado: string }>
): Promise<{ actualizado: boolean; nuevoEstado?: string; resultado: ResultadoCalculoEstado }> {
  const resultado = await calcularEstadoProyecto(proyectoId, proyecto, sprints);

  // Solo actualizar si es necesario y no es para "Finalizado"
  // "Finalizado" requiere confirmación explícita del usuario
  if (resultado.requiereCambio && resultado.estadoCalculado !== 'Finalizado') {
    try {
      await cambiarEstadoProyecto(proyectoId, resultado.estadoCalculado);
      return {
        actualizado: true,
        nuevoEstado: resultado.estadoCalculado,
        resultado,
      };
    } catch (error) {
      console.error('Error al actualizar estado del proyecto:', error);
      return { actualizado: false, resultado };
    }
  }

  return { actualizado: false, resultado };
}

/**
 * Verificar si un proyecto está finalizado (para bloquear edición)
 */
export function isProyectoFinalizado(proyecto: Proyecto | null | undefined): boolean {
  if (!proyecto) return false;
  const estado = (proyecto as any).estado;
  return estado === 'Finalizado';
}

/**
 * Verificar si un proyecto está cancelado
 */
export function isProyectoCancelado(proyecto: Proyecto | null | undefined): boolean {
  if (!proyecto) return false;
  const estado = (proyecto as any).estado;
  return estado === 'Cancelado';
}

/**
 * Verificar si un proyecto permite edición (no está Finalizado ni Cancelado)
 */
export function proyectoPermiteEdicion(proyecto: Proyecto | null | undefined): boolean {
  return !isProyectoFinalizado(proyecto) && !isProyectoCancelado(proyecto);
}
