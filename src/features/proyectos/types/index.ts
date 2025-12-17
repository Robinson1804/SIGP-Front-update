/**
 * Proyectos Feature - Types
 *
 * Re-exporta los tipos definidos en los servicios para facilitar el acceso
 */

// Re-export tipos de sprints.service
export type {
  Sprint,
  SprintEstado,
  CreateSprintData,
  UpdateSprintData,
  SprintQueryFilters,
  BurndownData,
  SprintTableroData,
  SprintTarea,
} from '../services/sprints.service';

// Re-export tipos de epicas.service
export type {
  Epica,
  EpicaEstado,
  PrioridadMoSCoW,
  CreateEpicaData,
  UpdateEpicaData,
  EpicaQueryFilters,
  EpicaEstadisticas,
  HistoriaUsuarioResumen,
} from '../services/epicas.service';

// Re-export tipos de historias.service
// Nota: PrioridadMoSCoW ya exportado desde epicas.service
export type {
  HistoriaUsuario,
  HistoriaEstado,
  CreateHistoriaData,
  UpdateHistoriaData,
  HistoriaQueryFilters,
  BacklogData,
  CriterioAceptacion,
  TareaResumen,
} from '../services/historias.service';

// Re-export tipos de tareas.service
export type {
  Tarea,
  TareaEstado,
  TareaPrioridad,
  TareaTipo,
  CreateTareaData,
  UpdateTareaData,
  TareaQueryFilters,
  MoverTareaData,
  TareaComentario,
} from '../services/tareas.service';

// Re-export tipos de proyectos.service
export type {
  ProyectoQueryFilters,
  CreateProyectoData,
  UpdateProyectoData,
} from '../services/proyectos.service';
