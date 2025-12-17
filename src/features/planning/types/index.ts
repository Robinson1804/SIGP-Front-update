/**
 * Planning Module Types
 *
 * Types for PGD (Plan de Gobierno Digital) and related entities
 * Updated to match backend API responses
 */

// ============================================
// PGD - Plan de Gobierno Digital (4 years)
// ============================================

export type PGDEstado = 'BORRADOR' | 'VIGENTE' | 'FINALIZADO';

export interface PGD {
  id: number;
  nombre: string;
  descripcion: string | null;
  anioInicio: number;
  anioFin: number;
  estado: PGDEstado;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy?: number;

  // Relations (populated when requested)
  objetivosEstrategicos?: OEI[];
  objetivosGobiernoDigital?: OGD[];

  // Relations counts (populated by backend)
  _count?: {
    objetivosEstrategicosInstitucionales?: number;
    objetivosGobiernoDigital?: number;
    objetivosEspecificosGobiernoDigital?: number;
    accionesEstrategicas?: number;
  };
}

export interface CreatePGDInput {
  nombre?: string;
  descripcion?: string;
  anioInicio: number;
  anioFin: number;
}

export interface UpdatePGDInput extends Partial<CreatePGDInput> {
  activo?: boolean;
  estado?: PGDEstado;
}

// ============================================
// OEI - Objetivo Estrategico Institucional
// ============================================

export interface MetaAnual {
  anio: number;
  meta: number;
  logrado?: number;
  descripcion?: string;
}

export interface OEI {
  id: number;
  pgdId: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  indicador: string | null;
  lineaBase: number | null;
  unidadMedida: string | null;
  metasAnuales: MetaAnual[] | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy?: number;

  // Relations
  pgd?: PGD;
}

export interface CreateOEIInput {
  pgdId: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  indicador?: string;
  lineaBase?: number;
  unidadMedida?: string;
  metasAnuales?: MetaAnual[];
}

export interface UpdateOEIInput extends Partial<Omit<CreateOEIInput, 'pgdId'>> {
  activo?: boolean;
}

// ============================================
// OGD - Objetivo de Gobierno Digital
// ============================================

export interface OGD {
  id: number;
  pgdId: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  indicador: string | null;
  lineaBase: number | null;
  unidadMedida: string | null;
  metasAnuales: MetaAnual[] | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy?: number;

  // Relations
  pgd?: PGD;
  objetivosEspecificos?: OEGD[];
  _count?: {
    objetivosEspecificos?: number;
  };
}

export interface CreateOGDInput {
  pgdId: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  indicador?: string;
  lineaBase?: number;
  unidadMedida?: string;
  metasAnuales?: MetaAnual[];
}

export interface UpdateOGDInput extends Partial<Omit<CreateOGDInput, 'pgdId'>> {
  activo?: boolean;
}

// ============================================
// OEGD - Objetivo Especifico de Gobierno Digital
// ============================================

export interface OEGD {
  id: number;
  pgdId: number;
  ogdId: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy?: number;

  // Relations
  pgd?: PGD;
  ogd?: OGD;
  accionesEstrategicas?: AccionEstrategica[];
  _count?: {
    accionesEstrategicas?: number;
  };
}

export interface CreateOEGDInput {
  ogdId: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  indicador?: string;
}

export interface UpdateOEGDInput extends Partial<Omit<CreateOEGDInput, 'ogdId'>> {
  ogdId?: number;
  activo?: boolean;
}

// ============================================
// AE - Accion Estrategica
// ============================================

export interface AccionEstrategica {
  id: number;
  pgdId: number;
  oegdId: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy?: number;

  // Relations
  pgd?: PGD;
  oegd?: OEGD;
  proyectos?: ProyectoResumen[];
  actividades?: ActividadResumen[];
  _count?: {
    proyectos?: number;
    actividades?: number;
  };
}

export interface CreateAccionEstrategicaInput {
  oegdId: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  indicador?: string;
  responsableArea?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface UpdateAccionEstrategicaInput extends Partial<Omit<CreateAccionEstrategicaInput, 'oegdId'>> {
  oegdId?: number;
  activo?: boolean;
}

// ============================================
// Resumen de Proyectos/Actividades para AE
// ============================================

export interface ProyectoResumen {
  id: number;
  codigo: string;
  nombre: string;
  estado: string;
  tipo: 'Proyecto';
}

export interface ActividadResumen {
  id: number;
  codigo: string;
  nombre: string;
  estado: string;
  tipo: 'Actividad';
}

// ============================================
// Query Filters
// ============================================

export interface PGDQueryFilters {
  activo?: boolean;
  anioInicio?: number;
  anioFin?: number;
  estado?: PGDEstado;
  search?: string;
}

export interface OEIQueryFilters {
  pgdId?: number;
  activo?: boolean;
  search?: string;
}

export interface OGDQueryFilters {
  pgdId?: number;
  activo?: boolean;
  search?: string;
}

export interface OEGDQueryFilters {
  pgdId?: number;
  ogdId?: number;
  activo?: boolean;
  search?: string;
}

export interface AccionEstrategicaQueryFilters {
  pgdId?: number;
  oegdId?: number;
  activo?: boolean;
  search?: string;
}

// ============================================
// API Response Types
// ============================================

export interface PGDStats {
  totalOEI: number;
  totalOGD: number;
  totalOEGD: number;
  totalAE: number;
  totalProyectos: number;
  totalActividades: number;
}

export interface PGDWithStats extends PGD {
  stats?: PGDStats;
}

// ============================================
// Dashboard PGD Types
// ============================================

export interface AvanceOEI {
  oeiId: number;
  codigo: string;
  nombre: string;
  avanceReal: number;
  avancePlanificado: number;
  diferencia: number;
  metasAnuales?: MetaAnual[];
}

export interface AvanceOGD {
  ogdId: number;
  codigo: string;
  nombre: string;
  avanceReal: number;
  avancePlanificado: number;
  diferencia: number;
  totalOEGDs: number;
  oegdsCompletados: number;
}

export interface PGDDashboard {
  pgdId: number;
  nombre: string;
  anioInicio: number;
  anioFin: number;
  estado: PGDEstado;

  // Estadísticas generales
  stats: PGDStats;

  // Progreso general
  progresoGeneral: number;

  // Avance por OEI
  avanceOEIs: AvanceOEI[];

  // Avance por OGD
  avanceOGDs: AvanceOGD[];

  // Proyectos por estado
  proyectosPorEstado: {
    estado: string;
    cantidad: number;
    porcentaje: number;
  }[];

  // Actividades por estado
  actividadesPorEstado: {
    estado: string;
    cantidad: number;
    porcentaje: number;
  }[];

  // Tendencias (últimos meses)
  tendencias?: {
    mes: string;
    proyectosCompletados: number;
    actividadesCompletadas: number;
    avance: number;
  }[];
}
