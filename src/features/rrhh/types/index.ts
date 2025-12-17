/**
 * RRHH Types
 *
 * Tipos para gestión de recursos humanos
 */

/**
 * Personal / Empleado
 */
export interface Personal {
  id: number;
  codigo: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  email: string;
  telefono?: string;
  divisionId: number;
  division?: Division;
  cargo: string;
  rol: 'ADMIN' | 'PMO' | 'COORDINADOR' | 'SCRUM_MASTER' | 'DESARROLLADOR' | 'IMPLEMENTADOR';
  estado: 'Activo' | 'Inactivo' | 'Licencia';
  fechaIngreso: string;
  avatar?: string;
  habilidades?: Habilidad[];
  disponibilidad?: number; // Porcentaje de disponibilidad actual
  createdAt: string;
  updatedAt: string;
}

/**
 * División / Área organizacional
 */
export interface Division {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  jefe?: Personal;
  jefeId?: number;
  totalPersonal: number;
  estado: 'Activo' | 'Inactivo';
  createdAt: string;
  updatedAt: string;
}

/**
 * Habilidad / Skill
 */
export interface Habilidad {
  id: number;
  nombre: string;
  categoria: 'Tecnica' | 'Metodologia' | 'Herramienta' | 'Soft';
  descripcion?: string;
  nivel?: 'Basico' | 'Intermedio' | 'Avanzado' | 'Experto';
}

/**
 * Asignación a proyecto/actividad
 */
export interface Asignacion {
  id: number;
  personalId: number;
  personal?: Personal;
  entidadTipo: 'Proyecto' | 'Actividad';
  entidadId: number;
  entidadNombre?: string;
  rol: string;
  porcentajeDedicacion: number;
  fechaInicio: string;
  fechaFin?: string;
  estado: 'Activa' | 'Finalizada' | 'Suspendida';
  horasEstimadas?: number;
  horasReales?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Resumen de carga de trabajo
 */
export interface CargaTrabajo {
  personalId: number;
  personal: Personal;
  totalAsignaciones: number;
  asignacionesActivas: number;
  porcentajeOcupacion: number;
  proyectos: {
    id: number;
    nombre: string;
    rol: string;
    dedicacion: number;
  }[];
  actividades: {
    id: number;
    nombre: string;
    rol: string;
    dedicacion: number;
  }[];
  disponibilidadRestante: number;
}

/**
 * Filtros para buscar personal
 */
export interface PersonalFilters {
  divisionId?: number;
  rol?: string;
  estado?: string;
  search?: string;
  habilidadId?: number;
  disponible?: boolean;
}

/**
 * Input para crear personal
 */
export interface CreatePersonalInput {
  codigo: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  divisionId: number;
  cargo: string;
  rol: string;
  fechaIngreso: string;
  habilidades?: number[];
}

/**
 * Input para actualizar personal
 */
export interface UpdatePersonalInput extends Partial<CreatePersonalInput> {
  id: number;
  estado?: 'Activo' | 'Inactivo' | 'Licencia';
}

/**
 * Input para crear asignación
 */
export interface CreateAsignacionInput {
  personalId: number;
  entidadTipo: 'Proyecto' | 'Actividad';
  entidadId: number;
  rol: string;
  porcentajeDedicacion: number;
  fechaInicio: string;
  fechaFin?: string;
  horasEstimadas?: number;
}

/**
 * Input para actualizar asignación
 */
export interface UpdateAsignacionInput extends Partial<CreateAsignacionInput> {
  id: number;
  estado?: 'Activa' | 'Finalizada' | 'Suspendida';
  horasReales?: number;
}

/**
 * Estadísticas de RRHH
 */
export interface RRHHStats {
  totalPersonal: number;
  personalActivo: number;
  personalEnLicencia: number;
  totalDivisiones: number;
  promedioOcupacion: number;
  personalDisponible: number;
  asignacionesPorRol: {
    rol: string;
    cantidad: number;
  }[];
}
