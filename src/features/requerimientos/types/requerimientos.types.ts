/**
 * Tipos para el módulo de Requerimientos
 *
 * Tipos que coinciden con el backend NestJS
 * Nota: Los requerimientos no tienen flujo de validación/aprobación.
 * Solo son creados, editados y eliminados por ADMIN y SCRUM_MASTER.
 */

// Enums que coinciden con el backend
export type RequerimientoTipo = 'Funcional' | 'No Funcional' | 'Tecnico' | 'Negocio';
export type RequerimientoPrioridad = 'Baja' | 'Media' | 'Alta' | 'Critica';

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
  criteriosAceptacion?: CriterioAceptacion[];
  dependencias?: number[];
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

// Filtros para consultas
export interface RequerimientoFilters {
  tipo?: RequerimientoTipo;
  prioridad?: RequerimientoPrioridad;
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

// Helper para generar código automático secuencial
// El código es único para todos los tipos: REQ-001, REQ-002, etc.
export function generateCodigo(count: number): string {
  const numero = String(count + 1).padStart(3, '0');
  return `REQ-${numero}`;
}
