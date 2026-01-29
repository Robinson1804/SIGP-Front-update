/**
 * RRHH Types - Sincronizados con Backend
 *
 * Tipos para gestión de recursos humanos
 * Actualizado: Dic 2024
 */

// ============================================================================
// ENUMS (sincronizados con backend)
// ============================================================================

/**
 * Modalidad de contratación del personal
 */
export enum Modalidad {
  NOMBRADO = 'Nombrado',
  CAS = 'CAS',
  ORDEN_DE_SERVICIO = 'Orden de Servicio',
  PRACTICANTE = 'Practicante',
}

/**
 * Categoría de habilidad técnica
 */
export enum HabilidadCategoria {
  LENGUAJE = 'Lenguaje',
  FRAMEWORK = 'Framework',
  BASE_DATOS = 'Base de datos',
  CLOUD = 'Cloud',
  DEVOPS = 'DevOps',
  METODOLOGIA = 'Metodologia',
  SOFT_SKILL = 'Soft skill',
  OTRO = 'Otro',
}

/**
 * Nivel de dominio de una habilidad
 */
export enum NivelHabilidad {
  BASICO = 'Basico',
  INTERMEDIO = 'Intermedio',
  AVANZADO = 'Avanzado',
  EXPERTO = 'Experto',
}

/**
 * Tipo de entidad a la que se asigna el personal
 */
export enum TipoAsignacion {
  PROYECTO = 'Proyecto',
  ACTIVIDAD = 'Actividad',
  SUBPROYECTO = 'Subproyecto',
}

// ============================================================================
// INTERFACES PRINCIPALES
// ============================================================================

/**
 * Personal / Empleado
 */
export interface Personal {
  id: number;
  usuarioId?: number;
  divisionId: number;
  codigoEmpleado: string;
  dni?: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  cargo?: string;
  fechaIngreso: string;
  modalidad: Modalidad;
  horasSemanales: number;
  disponible: boolean;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  // Relaciones
  division?: Division;
  usuario?: { id: number; username: string; email: string; rol?: Role };
  habilidades?: PersonalHabilidad[];
  // Credenciales del usuario creado (solo en respuesta de creación con rol)
  credenciales?: {
    username: string;
    passwordTemporal: string;
    email: string;
    rol: string;
  };
}

/**
 * División / Área organizacional
 */
export interface Division {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  divisionPadreId?: number;
  jefeId?: number;
  coordinadorId?: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  // Relaciones
  jefe?: Personal;
  divisionPadre?: Division;
  hijos?: Division[];
  coordinador?: Personal;
  scrumMasters?: Personal[];
  totalPersonal?: number;
}

/**
 * Habilidad / Skill
 */
export interface Habilidad {
  id: number;
  nombre: string;
  categoria: HabilidadCategoria;
  descripcion?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Relación Personal-Habilidad con nivel
 */
export interface PersonalHabilidad {
  id: number;
  personalId: number;
  habilidadId: number;
  nivel: NivelHabilidad;
  aniosExperiencia?: number;
  certificado: boolean;
  createdAt: string;
  // Relaciones
  habilidad?: Habilidad;
  personal?: Personal;
}

/**
 * Asignación a proyecto/actividad/subproyecto
 */
export interface Asignacion {
  id: number;
  personalId: number;
  tipoAsignacion: TipoAsignacion;
  proyectoId?: number;
  actividadId?: number;
  subproyectoId?: number;
  rolEquipo?: string;
  porcentajeDedicacion: number;
  fechaInicio: string;
  fechaFin?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  // Relaciones
  personal?: Personal;
  proyecto?: { id: number; codigo: string; nombre: string };
  actividad?: { id: number; codigo: string; nombre: string };
  subproyecto?: { id: number; codigo: string; nombre: string };
}

/**
 * Roles de usuario del sistema
 */
export enum Role {
  ADMIN = 'ADMIN',
  PMO = 'PMO',
  COORDINADOR = 'COORDINADOR',
  SCRUM_MASTER = 'SCRUM_MASTER',
  PATROCINADOR = 'PATROCINADOR',
  DESARROLLADOR = 'DESARROLLADOR',
  IMPLEMENTADOR = 'IMPLEMENTADOR',
}

/**
 * Usuario del sistema
 */
export interface Usuario {
  id: number;
  email: string;
  username: string;
  nombre: string;
  apellido: string;
  rol: Role;
  rolesAdicionales: Role[];
  avatarUrl?: string;
  telefono?: string;
  activo: boolean;
  ultimoAcceso?: string;
  createdAt: string;
  updatedAt: string;
  // Relaciones
  personal?: Personal;
}

/**
 * Filtros para buscar usuarios
 */
export interface UsuarioFilters {
  rol?: Role;
  activo?: boolean;
  busqueda?: string;
}

// ============================================================================
// DTOs DE RESPUESTA
// ============================================================================

/**
 * Respuesta de disponibilidad de un personal
 */
export interface DisponibilidadResponse {
  personalId: number;
  nombre: string;
  horasSemanales: number;
  porcentajeAsignado: number;
  horasAsignadas: number;
  horasDisponibles: number;
  disponible: boolean;
  asignacionesActuales: Asignacion[];
}

/**
 * Alerta de sobrecarga de trabajo
 */
export interface AlertaSobrecarga {
  personalId: number;
  nombres: string;
  apellidos: string;
  codigoEmpleado: string;
  porcentajeTotal: number;
  horasSemanales: number;
  exceso: number;
  asignaciones: Asignacion[];
}

/**
 * Estadísticas generales de RRHH
 */
export interface RRHHStats {
  totalPersonal: number;
  personalActivo: number;
  personalDisponible: number;
  totalDivisiones: number;
  totalAsignaciones: number;
  promedioDisponibilidad: number;
  alertasSobrecarga: number;
  distribucionPorModalidad?: {
    modalidad: Modalidad;
    cantidad: number;
  }[];
  distribucionPorDivision?: {
    divisionId: number;
    divisionNombre: string;
    cantidad: number;
  }[];
}

// ============================================================================
// FILTROS
// ============================================================================

/**
 * Filtros para buscar personal
 */
export interface PersonalFilters {
  divisionId?: number;
  modalidad?: Modalidad;
  disponible?: boolean;
  activo?: boolean;
  busqueda?: string;
  habilidadId?: number;
}

/**
 * Filtros para buscar divisiones
 */
export interface DivisionFilters {
  activo?: boolean;
  busqueda?: string;
}

/**
 * Filtros para buscar habilidades
 */
export interface HabilidadFilters {
  categoria?: HabilidadCategoria;
  activo?: boolean;
  busqueda?: string;
}

/**
 * Filtros para buscar asignaciones
 */
export interface AsignacionFilters {
  personalId?: number;
  tipoAsignacion?: TipoAsignacion;
  proyectoId?: number;
  actividadId?: number;
  subproyectoId?: number;
  activo?: boolean;
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Helper para obtener nombre completo del personal
 */
export function getNombreCompleto(personal: Personal): string {
  return `${personal.nombres} ${personal.apellidos}`;
}

/**
 * Helper para obtener el label de una modalidad
 */
export function getModalidadLabel(modalidad: Modalidad): string {
  const labels: Record<Modalidad, string> = {
    [Modalidad.NOMBRADO]: 'Nombrado',
    [Modalidad.CAS]: 'CAS',
    [Modalidad.ORDEN_DE_SERVICIO]: 'Orden de Servicio',
    [Modalidad.PRACTICANTE]: 'Practicante',
  };
  return labels[modalidad] || modalidad;
}

/**
 * Helper para obtener el label de una categoría de habilidad
 */
export function getCategoriaLabel(categoria: HabilidadCategoria): string {
  const labels: Record<HabilidadCategoria, string> = {
    [HabilidadCategoria.LENGUAJE]: 'Lenguaje',
    [HabilidadCategoria.FRAMEWORK]: 'Framework',
    [HabilidadCategoria.BASE_DATOS]: 'Base de Datos',
    [HabilidadCategoria.CLOUD]: 'Cloud',
    [HabilidadCategoria.DEVOPS]: 'DevOps',
    [HabilidadCategoria.METODOLOGIA]: 'Metodología',
    [HabilidadCategoria.SOFT_SKILL]: 'Soft Skill',
    [HabilidadCategoria.OTRO]: 'Otro',
  };
  return labels[categoria] || categoria;
}

/**
 * Helper para obtener el label de un nivel de habilidad
 */
export function getNivelLabel(nivel: NivelHabilidad): string {
  const labels: Record<NivelHabilidad, string> = {
    [NivelHabilidad.BASICO]: 'Básico',
    [NivelHabilidad.INTERMEDIO]: 'Intermedio',
    [NivelHabilidad.AVANZADO]: 'Avanzado',
    [NivelHabilidad.EXPERTO]: 'Experto',
  };
  return labels[nivel] || nivel;
}

/**
 * Helper para obtener el label de un tipo de asignación
 */
export function getTipoAsignacionLabel(tipo: TipoAsignacion): string {
  const labels: Record<TipoAsignacion, string> = {
    [TipoAsignacion.PROYECTO]: 'Proyecto',
    [TipoAsignacion.ACTIVIDAD]: 'Actividad',
    [TipoAsignacion.SUBPROYECTO]: 'Subproyecto',
  };
  return labels[tipo] || tipo;
}

/**
 * Helper para obtener color de categoría de habilidad
 */
export function getCategoriaColor(categoria: HabilidadCategoria): string {
  const colors: Record<HabilidadCategoria, string> = {
    [HabilidadCategoria.LENGUAJE]: 'blue',
    [HabilidadCategoria.FRAMEWORK]: 'purple',
    [HabilidadCategoria.BASE_DATOS]: 'green',
    [HabilidadCategoria.CLOUD]: 'cyan',
    [HabilidadCategoria.DEVOPS]: 'orange',
    [HabilidadCategoria.METODOLOGIA]: 'pink',
    [HabilidadCategoria.SOFT_SKILL]: 'yellow',
    [HabilidadCategoria.OTRO]: 'gray',
  };
  return colors[categoria] || 'gray';
}

/**
 * Helper para obtener color de nivel de habilidad
 */
export function getNivelColor(nivel: NivelHabilidad): string {
  const colors: Record<NivelHabilidad, string> = {
    [NivelHabilidad.BASICO]: 'gray',
    [NivelHabilidad.INTERMEDIO]: 'blue',
    [NivelHabilidad.AVANZADO]: 'green',
    [NivelHabilidad.EXPERTO]: 'purple',
  };
  return colors[nivel] || 'gray';
}

/**
 * Helper para verificar si un personal está sobrecargado
 */
export function isPersonalSobrecargado(porcentajeAsignado: number): boolean {
  return porcentajeAsignado > 100;
}

/**
 * Helper para obtener el color según porcentaje de carga
 * Retorna clases de Tailwind CSS para usar en Badge
 */
export function getCargaColor(porcentaje: number): string {
  if (porcentaje <= 80) return 'bg-green-100 text-green-800 hover:bg-green-100';
  if (porcentaje <= 100) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
  return 'bg-red-100 text-red-800 hover:bg-red-100';
}

/**
 * Helper para obtener el label de un rol
 */
export function getRolLabel(rol: Role): string {
  const labels: Record<Role, string> = {
    [Role.ADMIN]: 'Administrador',
    [Role.PMO]: 'PMO',
    [Role.COORDINADOR]: 'Coordinador',
    [Role.SCRUM_MASTER]: 'Scrum Master',
    [Role.PATROCINADOR]: 'Patrocinador',
    [Role.DESARROLLADOR]: 'Desarrollador',
    [Role.IMPLEMENTADOR]: 'Implementador',
  };
  return labels[rol] || rol;
}

/**
 * Helper para obtener el color de un rol
 */
export function getRolColor(rol: Role): string {
  const colors: Record<Role, string> = {
    [Role.ADMIN]: 'red',
    [Role.PMO]: 'purple',
    [Role.COORDINADOR]: 'blue',
    [Role.SCRUM_MASTER]: 'cyan',
    [Role.PATROCINADOR]: 'orange',
    [Role.DESARROLLADOR]: 'green',
    [Role.IMPLEMENTADOR]: 'teal',
  };
  return colors[rol] || 'gray';
}

/**
 * Helper para normalizar rolesAdicionales (puede llegar como string, null, o array)
 */
export function normalizeRolesAdicionales(rolesAdicionales: Role[] | string | null | undefined): Role[] {
  if (!rolesAdicionales) return [];
  if (Array.isArray(rolesAdicionales)) return rolesAdicionales;
  if (typeof rolesAdicionales === 'string') {
    try {
      const parsed = JSON.parse(rolesAdicionales);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Helper para verificar si un usuario tiene un rol específico
 */
export function tieneRol(usuario: Usuario, rol: Role): boolean {
  const roles = normalizeRolesAdicionales(usuario.rolesAdicionales);
  return usuario.rol === rol || roles.includes(rol);
}

/**
 * Helper para obtener todos los roles de un usuario
 */
export function getTodosLosRoles(usuario: Usuario): Role[] {
  const roles = normalizeRolesAdicionales(usuario.rolesAdicionales);
  return [usuario.rol, ...roles];
}
