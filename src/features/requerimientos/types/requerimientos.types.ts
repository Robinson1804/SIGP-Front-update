/**
 * Tipos para el módulo de Requerimientos
 *
 * Tipos que coinciden con el backend NestJS
 */

// Enums que coinciden con el backend
export type RequerimientoTipo = 'Funcional' | 'No Funcional' | 'Tecnico' | 'Negocio';
export type RequerimientoPrioridad = 'Baja' | 'Media' | 'Alta' | 'Critica';
export type RequerimientoEstado =
  | 'Pendiente'
  | 'En Analisis'
  | 'Aprobado'
  | 'Rechazado'
  | 'En Desarrollo'
  | 'Completado';

// Criterio de aceptación (almacenado como JSONB en backend)
export interface CriterioAceptacion {
  descripcion: string;
  cumplido?: boolean;
}

// Entidad principal de Requerimiento
export interface Requerimiento {
  id: number;
  proyectoId: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: RequerimientoTipo;
  prioridad: RequerimientoPrioridad;
  estado: RequerimientoEstado;
  criteriosAceptacion?: CriterioAceptacion[];
  dependencias?: number[];
  solicitanteId?: number;
  fechaSolicitud?: string;
  fechaAprobacion?: string;
  aprobadoPor?: number;
  observaciones?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  updatedBy?: number;
  // Relaciones expandidas (cuando se solicitan con relations)
  proyecto?: {
    id: number;
    codigo: string;
    nombre: string;
  };
  solicitante?: {
    id: number;
    nombres: string;
    apellidoPaterno: string;
  };
  aprobador?: {
    id: number;
    nombres: string;
    apellidoPaterno: string;
  };
}

// DTO para crear requerimiento
export interface CreateRequerimientoInput {
  proyectoId: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo?: RequerimientoTipo;
  prioridad?: RequerimientoPrioridad;
  criteriosAceptacion?: CriterioAceptacion[];
  dependencias?: number[];
  solicitanteId?: number;
  fechaSolicitud?: string;
  observaciones?: string;
}

// DTO para actualizar requerimiento
export interface UpdateRequerimientoInput {
  nombre?: string;
  descripcion?: string;
  tipo?: RequerimientoTipo;
  prioridad?: RequerimientoPrioridad;
  criteriosAceptacion?: CriterioAceptacion[];
  dependencias?: number[];
  observaciones?: string;
}

// DTO para aprobar/rechazar requerimiento
export interface AprobarRequerimientoInput {
  estado: RequerimientoEstado;
  observacion?: string;
}

// Filtros para consultas
export interface RequerimientoFilters {
  tipo?: RequerimientoTipo;
  prioridad?: RequerimientoPrioridad;
  estado?: RequerimientoEstado;
  activo?: boolean;
  search?: string;
}

// Opciones para selects en formularios
export const REQUERIMIENTO_TIPOS: { value: RequerimientoTipo; label: string }[] = [
  { value: 'Funcional', label: 'Funcional (RF)' },
  { value: 'No Funcional', label: 'No Funcional (RNF)' },
  { value: 'Tecnico', label: 'Técnico' },
  { value: 'Negocio', label: 'Negocio' },
];

export const REQUERIMIENTO_PRIORIDADES: { value: RequerimientoPrioridad; label: string; color: string }[] = [
  { value: 'Baja', label: 'Baja', color: 'secondary' },
  { value: 'Media', label: 'Media', color: 'default' },
  { value: 'Alta', label: 'Alta', color: 'warning' },
  { value: 'Critica', label: 'Crítica', color: 'destructive' },
];

export const REQUERIMIENTO_ESTADOS: { value: RequerimientoEstado; label: string; color: string }[] = [
  { value: 'Pendiente', label: 'Pendiente', color: 'secondary' },
  { value: 'En Analisis', label: 'En Análisis', color: 'outline' },
  { value: 'Aprobado', label: 'Aprobado', color: 'success' },
  { value: 'Rechazado', label: 'Rechazado', color: 'destructive' },
  { value: 'En Desarrollo', label: 'En Desarrollo', color: 'default' },
  { value: 'Completado', label: 'Completado', color: 'success' },
];

// Helper para obtener el prefijo del código según el tipo
export function getCodigoPrefix(tipo: RequerimientoTipo): string {
  switch (tipo) {
    case 'Funcional':
      return 'RF';
    case 'No Funcional':
      return 'RNF';
    case 'Tecnico':
      return 'RT';
    case 'Negocio':
      return 'RN';
    default:
      return 'REQ';
  }
}

// Helper para generar código automático
export function generateCodigo(tipo: RequerimientoTipo, count: number): string {
  const prefix = getCodigoPrefix(tipo);
  const numero = String(count + 1).padStart(3, '0');
  return `${prefix}-${numero}`;
}
