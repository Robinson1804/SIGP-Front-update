/**
 * Actividades Feature - Services
 *
 * Barrel exports para todos los servicios del módulo de Actividades (Kanban)
 */

// ============================================
// Actividades Service
// ============================================
export {
  // CRUD
  getActividades,
  getAllActividades,
  getActividadById,
  createActividad,
  updateActividad,
  deleteActividad,
  // Tablero Kanban
  getTablero,
  // Métricas y Reportes
  getActividadMetricas,
  getActividadReportes,
  // Estado
  cambiarEstadoActividad,
  suspenderActividad,
  reanudarActividad,
  finalizarActividad,
  // Utility
  actividadExists,
  getActividadesByCoordinador,
  getActividadesActivas,
} from './actividades.service';

// ============================================
// Tareas Kanban Service
// ============================================
export {
  // CRUD
  getTareasByActividad,
  getTareaById,
  createTarea,
  updateTarea,
  deleteTarea,
  // Estado y Movimiento
  cambiarEstado,
  moverTarea,
  // Validación
  validarTarea,
  rechazarValidacion,
  // Asignación
  asignarTarea,
  desasignarTarea,
  // Evidencia
  agregarEvidencia,
  // Comentarios
  getTareaComentarios,
  agregarComentario,
  // Utility
  getTareasByEstado,
  getTareasByUsuario,
  getTareasPendientesValidacion,
  iniciarTarea,
  enviarARevision,
  finalizarTarea,
  devolverTarea,
  registrarHoras,
  tareaExists,
} from './tareas-kanban.service';

// ============================================
// Subtareas Service (Solo Kanban)
// ============================================
export {
  // CRUD
  getSubtareasByTarea,
  getSubtareaById,
  createSubtarea,
  updateSubtarea,
  deleteSubtarea,
  // Estado
  cambiarEstadoSubtarea,
  iniciarSubtarea,
  finalizarSubtarea,
  // Validación
  validarSubtarea,
  rechazarValidacionSubtarea,
  // Estadísticas
  getSubtareaEstadisticas,
  calcularEstadisticasLocal,
  // Asignación
  asignarSubtarea,
  desasignarSubtarea,
  // Evidencia
  agregarEvidenciaSubtarea,
  // Utility
  getSubtareasByEstado,
  getSubtareasByResponsable,
  getSubtareasPendientesValidacion,
  registrarHorasSubtarea,
  devolverSubtarea,
  subtareaExists,
  todasSubtareasCompletadas,
  createMultipleSubtareas,
} from './subtareas.service';
