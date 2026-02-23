/**
 * Historias de Usuario Service
 *
 * Servicios para gestion de historias de usuario en proyectos Scrum
 */

import { apiClient, del, ENDPOINTS } from '@/lib/api';
import type { PaginatedResponse } from '@/types';

// ============================================
// TIPOS
// ============================================

/**
 * Prioridades para historias de usuario
 */
export type Prioridad = 'Alta' | 'Media' | 'Baja';

/**
 * Estados posibles de una historia de usuario
 */
export type HistoriaEstado =
  | 'Por hacer'
  | 'En progreso'
  | 'En revision'
  | 'Finalizado';

/**
 * Interfaz de Historia de Usuario basada en el backend schema REAL
 * Campos del backend: rol, storyPoints, ordenBacklog, estimacion
 */
export interface HistoriaUsuario {
  id: number;
  codigo: string;
  titulo: string;
  // Backend usa 'rol' para "como usuario"
  rol: string | null;
  quiero: string | null;
  para: string | null;
  proyectoId: number;
  epicaId: number | null;
  sprintId: number | null;
  estado: HistoriaEstado;
  prioridad: Prioridad | null;
  // Backend usa 'storyPoints' en lugar de puntos
  storyPoints: number | null;
  estimacion: string | null;
  // asignadoA ahora es un array de IDs de responsables
  // Nota: TypeORM simple-array puede devolver strings, convertir a números al usar
  asignadoA: (number | string)[];
  // Backend usa 'ordenBacklog' en lugar de orden
  ordenBacklog: number | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
  // Relaciones opcionales
  epica?: {
    id: number;
    nombre: string;
    color: string | null;
  } | null;
  sprint?: {
    id: number;
    nombre: string;
    numero?: number;
  } | null;
  // @deprecated - La relación asignado fue removida, usar asignadoA[] con el equipo para obtener nombres
  asignado?: {
    id: number;
    nombres: string;
    apellidos: string;
  } | null;
  creador?: {
    id: number;
    nombres: string;
    apellidoPaterno: string;
  } | null;
  tareas?: TareaResumen[];
  criteriosAceptacion?: CriterioAceptacion[];
  dependencias?: { id: number; codigo: string; titulo: string }[];
  // Requerimiento vinculado (opcional)
  requerimientoId?: number | null;
  requerimiento?: {
    id: number;
    codigo: string;
    nombre: string;
    tipo?: string;
  } | null;
  // Fechas de la historia
  fechaInicio?: string | null;
  fechaFin?: string | null;
  // Imagen adjunta
  imagenUrl?: string | null;
  // Documento de evidencias generado (PDF consolidado)
  documentoEvidenciasUrl?: string | null;

  // Campos de compatibilidad (aliases)
  // Estos se mapean desde los campos reales del backend
  descripcion?: string | null;
  comoUsuario?: string | null;
  puntos?: number | null;
  orden?: number | null;
}

/**
 * Resumen de tarea (para listados)
 */
export interface TareaResumen {
  id: number;
  nombre: string;
  estado: string;
  responsableId: number | null;
}

/**
 * Criterio de aceptacion
 */
export interface CriterioAceptacion {
  id: number;
  descripcion: string;
  completado: boolean;
  orden: number;
}

/**
 * Datos para crear una historia de usuario
 */
export interface CreateHistoriaData {
  codigo?: string;
  titulo: string;
  descripcion?: string;
  comoUsuario?: string;
  quiero?: string;
  para?: string;
  proyectoId: number;
  epicaId?: number;
  sprintId?: number | null;
  estado?: HistoriaEstado;
  prioridad?: Prioridad;
  puntos?: number;
  valorNegocio?: number;
  orden?: number;
  fechaInicio?: string;
  fechaFin?: string;
  requerimientoId?: number;
  imagenUrl?: string;
  criteriosAceptacion?: Omit<CriterioAceptacion, 'id'>[];
  // Array de IDs de responsables
  asignadoA?: number[];
}

/**
 * Datos para actualizar una historia de usuario
 */
export interface UpdateHistoriaData extends Partial<Omit<CreateHistoriaData, 'proyectoId'>> {
  estado?: HistoriaEstado;
  asignadoA?: number[];
}

/**
 * Filtros para consultar historias
 */
export interface HistoriaQueryFilters {
  estado?: HistoriaEstado;
  prioridad?: Prioridad;
  epicaId?: number;
  sprintId?: number;
  sinSprint?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * Metricas del backlog
 */
export interface BacklogMetricas {
  total: number;
  porPrioridad: Record<string, number>;
  porEstado: Record<string, number>;
}

/**
 * Estructura del backlog (respuesta del API)
 */
export interface BacklogData {
  backlog: HistoriaUsuario[];
  metricas: BacklogMetricas;
}

// ============================================
// SERVICIOS
// ============================================

/**
 * Obtener el siguiente código de HU para un proyecto (auto-generado)
 */
export async function getNextCodigo(proyectoId: number | string): Promise<string> {
  const response = await apiClient.get<string>(
    `${ENDPOINTS.HISTORIAS.BASE}/next-codigo/${proyectoId}`
  );
  return response.data;
}

/**
 * Obtener el siguiente código de HU para un subproyecto (secuencia independiente).
 * Calcula el máximo código existente y devuelve el siguiente en formato HU-XXX.
 */
export async function getNextCodigoSubproyecto(subproyectoId: number | string): Promise<string> {
  const response = await apiClient.get<HistoriaUsuario[]>(
    ENDPOINTS.SUBPROYECTOS.HISTORIAS(subproyectoId)
  );
  const historias = Array.isArray(response.data) ? response.data : [];

  let maxNum = 0;
  for (const historia of historias) {
    const match = historia.codigo?.match(/HU-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  const nextNum = String(maxNum + 1).padStart(3, '0');
  return `HU-${nextNum}`;
}

/**
 * Obtener backlog de un proyecto (historias sin sprint asignado)
 */
export async function getBacklog(
  proyectoId: number | string,
  filters?: HistoriaQueryFilters
): Promise<BacklogData> {
  const response = await apiClient.get<BacklogData>(
    `${ENDPOINTS.PROYECTOS.BY_ID(proyectoId)}/historias-usuario/backlog`,
    { params: filters }
  );
  return response.data;
}

/**
 * Obtener backlog de un subproyecto
 * El backend no tiene endpoint /backlog para subproyectos, se usa /historias-usuario y se filtra client-side
 */
export async function getBacklogBySubproyecto(
  subproyectoId: number | string,
  filters?: HistoriaQueryFilters
): Promise<BacklogData> {
  const response = await apiClient.get<HistoriaUsuario[]>(
    ENDPOINTS.SUBPROYECTOS.HISTORIAS(subproyectoId),
    { params: filters }
  );
  const allHistorias = Array.isArray(response.data) ? response.data : [];
  // Backlog = historias sin sprint asignado
  const backlog = allHistorias.filter((h) => !h.sprintId);

  // Calcular métricas client-side
  const porPrioridad: Record<string, number> = {};
  const porEstado: Record<string, number> = {};
  backlog.forEach((h) => {
    if (h.prioridad) porPrioridad[h.prioridad] = (porPrioridad[h.prioridad] || 0) + 1;
    porEstado[h.estado] = (porEstado[h.estado] || 0) + 1;
  });

  return {
    backlog,
    metricas: { total: backlog.length, porPrioridad, porEstado },
  };
}

/**
 * Obtener historias de usuario de un sprint
 */
export async function getHistoriasBySprint(
  sprintId: number | string,
  filters?: HistoriaQueryFilters
): Promise<HistoriaUsuario[]> {
  const response = await apiClient.get<HistoriaUsuario[]>(
    `${ENDPOINTS.SPRINTS.BY_ID(sprintId)}/historias-usuario`,
    { params: filters }
  );
  return response.data;
}

/**
 * Obtener historias de usuario de una epica
 */
export async function getHistoriasByEpica(
  epicaId: number | string,
  filters?: HistoriaQueryFilters
): Promise<HistoriaUsuario[]> {
  const response = await apiClient.get<HistoriaUsuario[]>(
    `/epicas/${epicaId}/historias-usuario`,
    { params: filters }
  );
  return response.data;
}

/**
 * Obtener una historia de usuario por ID
 */
export async function getHistoriaById(id: number | string): Promise<HistoriaUsuario> {
  const response = await apiClient.get<HistoriaUsuario>(
    ENDPOINTS.HISTORIAS.BY_ID(id)
  );
  return response.data;
}

/**
 * Crear una nueva historia de usuario
 */
export async function createHistoria(data: CreateHistoriaData): Promise<HistoriaUsuario> {
  const response = await apiClient.post<HistoriaUsuario>(
    ENDPOINTS.HISTORIAS.BASE,
    data
  );
  return response.data;
}

/**
 * Actualizar una historia de usuario existente
 */
export async function updateHistoria(
  id: number | string,
  data: UpdateHistoriaData
): Promise<HistoriaUsuario> {
  const response = await apiClient.patch<HistoriaUsuario>(
    ENDPOINTS.HISTORIAS.BY_ID(id),
    data
  );
  return response.data;
}

/**
 * Eliminar una historia de usuario
 */
export async function deleteHistoria(id: number | string): Promise<void> {
  await del(ENDPOINTS.HISTORIAS.BY_ID(id));
}

/**
 * Cambiar estado de una historia de usuario
 */
export async function cambiarEstadoHistoria(
  id: number | string,
  estado: HistoriaEstado
): Promise<HistoriaUsuario> {
  const response = await apiClient.patch<HistoriaUsuario>(
    `${ENDPOINTS.HISTORIAS.BY_ID(id)}/estado`,
    { estado }
  );
  return response.data;
}

/**
 * Mover una historia de usuario a un sprint
 */
export async function moverHistoriaASprint(
  id: number | string,
  sprintId: number | null
): Promise<HistoriaUsuario> {
  const response = await apiClient.patch<HistoriaUsuario>(
    ENDPOINTS.HISTORIAS.MOVER_SPRINT(id),
    { sprintId }
  );
  return response.data;
}

/**
 * Reordenar historias en el backlog de un proyecto
 */
export async function reordenarBacklog(
  proyectoId: number | string,
  ordenIds: number[]
): Promise<HistoriaUsuario[]> {
  const response = await apiClient.patch<HistoriaUsuario[]>(
    `${ENDPOINTS.PROYECTOS.BY_ID(proyectoId)}/historias-usuario/backlog/reordenar`,
    { ordenIds }
  );
  return response.data;
}

/**
 * Obtener tareas de una historia de usuario
 */
export async function getHistoriaTareas(historiaId: number | string) {
  const response = await apiClient.get(
    ENDPOINTS.HISTORIAS.TAREAS(historiaId)
  );
  return response.data;
}

/**
 * Obtener criterios de aceptacion de una historia
 */
export async function getHistoriaCriterios(historiaId: number | string): Promise<CriterioAceptacion[]> {
  const response = await apiClient.get<CriterioAceptacion[]>(
    ENDPOINTS.HISTORIAS.CRITERIOS(historiaId)
  );
  return response.data;
}

/**
 * Agregar criterio de aceptacion a una historia
 */
export async function agregarCriterio(
  historiaId: number | string,
  data: Omit<CriterioAceptacion, 'id'>
): Promise<CriterioAceptacion> {
  const response = await apiClient.post<CriterioAceptacion>(
    ENDPOINTS.HISTORIAS.CRITERIOS(historiaId),
    data
  );
  return response.data;
}

/**
 * Actualizar criterio de aceptacion
 */
export async function actualizarCriterio(
  historiaId: number | string,
  criterioId: number | string,
  data: Partial<Omit<CriterioAceptacion, 'id'>>
): Promise<CriterioAceptacion> {
  const response = await apiClient.patch<CriterioAceptacion>(
    `${ENDPOINTS.HISTORIAS.CRITERIOS(historiaId)}/${criterioId}`,
    data
  );
  return response.data;
}

/**
 * Eliminar criterio de aceptacion
 */
export async function eliminarCriterio(
  historiaId: number | string,
  criterioId: number | string
): Promise<void> {
  await del(`${ENDPOINTS.HISTORIAS.CRITERIOS(historiaId)}/${criterioId}`);
}

// ============================================
// VALIDACIÓN DE HISTORIA DE USUARIO
// ============================================

/**
 * Datos para validar una historia de usuario
 */
export interface ValidarHuRequest {
  aprobado: boolean;
  observacion?: string;
}

/**
 * Validar (aprobar o rechazar) una Historia de Usuario en estado "En revision"
 * Solo puede ser ejecutado por SCRUM_MASTER
 *
 * Si aprueba: HU pasa a "Finalizado"
 * Si rechaza: HU y todas sus tareas vuelven a "En progreso"
 */
export async function validarHistoria(
  historiaId: number | string,
  data: ValidarHuRequest
): Promise<HistoriaUsuario> {
  const response = await apiClient.patch<HistoriaUsuario>(
    ENDPOINTS.HISTORIAS.VALIDAR(historiaId),
    data
  );
  return response.data;
}

/**
 * Respuesta al regenerar el PDF de evidencias
 */
export interface RegenerarPdfResponse {
  url: string;
  mensaje: string;
}

/**
 * Regenerar el PDF de evidencias para una HU en estado "En revision"
 * Útil para actualizar el formato del PDF con nuevas imágenes embebidas
 * Solo puede ser ejecutado por roles ADMIN, PMO, o SCRUM_MASTER
 */
export async function regenerarPdfEvidencias(
  historiaId: number | string
): Promise<RegenerarPdfResponse> {
  const response = await apiClient.post<RegenerarPdfResponse>(
    ENDPOINTS.HISTORIAS.REGENERAR_PDF(historiaId)
  );
  return response.data;
}
