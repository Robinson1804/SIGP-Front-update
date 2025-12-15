/**
 * Tipos comunes y utilitarios
 */

/**
 * Respuesta paginada genérica
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Respuesta de error de la API
 */
export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  errors?: Record<string, string[]>;
}

/**
 * Parámetros de paginación
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Parámetros de filtrado
 */
export interface FilterParams {
  search?: string;
  [key: string]: any;
}

/**
 * Breadcrumb para navegación
 */
export interface Breadcrumb {
  label: string;
  href?: string;
}

/**
 * Opción de select
 */
export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}
