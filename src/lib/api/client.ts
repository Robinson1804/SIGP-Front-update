import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Base URL desde variables de entorno
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/api/v1';

// ============================================================================
// CACHE LAYER - Evita llamadas duplicadas durante navegación
// ============================================================================

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

// Cache en memoria para requests GET
const requestCache = new Map<string, CacheEntry>();

// Tiempo de cache por defecto: 30 segundos (suficiente para navegación)
const DEFAULT_CACHE_TTL = 30 * 1000;

// Requests en vuelo para evitar duplicados simultáneos
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Genera una clave única para el cache basada en URL y params
 */
function getCacheKey(url: string, params?: any): string {
  const paramStr = params ? JSON.stringify(params) : '';
  return `${url}|${paramStr}`;
}

/**
 * Verifica si una entrada de cache es válida
 */
function isCacheValid(entry: CacheEntry | undefined): boolean {
  if (!entry) return false;
  return Date.now() < entry.expiresAt;
}

/**
 * Limpia entradas expiradas del cache (se ejecuta periódicamente)
 */
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, entry] of requestCache.entries()) {
    if (now >= entry.expiresAt) {
      requestCache.delete(key);
    }
  }
}

// Limpiar cache expirado cada 60 segundos
if (typeof window !== 'undefined') {
  setInterval(cleanExpiredCache, 60 * 1000);
}

/**
 * Invalida el cache para una URL específica o todo el cache
 */
export function invalidateCache(urlPattern?: string) {
  if (!urlPattern) {
    requestCache.clear();
    return;
  }
  for (const key of requestCache.keys()) {
    if (key.includes(urlPattern)) {
      requestCache.delete(key);
    }
  }
}

/**
 * Cliente Axios configurado para la API de SIGP
 *
 * Features:
 * - Interceptor de request para agregar Bearer token
 * - Interceptor de response para manejo de errores 401
 * - Timeout configurado
 * - Headers por defecto
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Agrega el Bearer token a todas las peticiones excepto autenticación
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // No agregar token para rutas de autenticación
    const authRoutes = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password'];
    const isAuthRoute = authRoutes.some(route => config.url?.includes(route));

    // Intentar obtener token de localStorage solo si NO es ruta de auth
    if (typeof window !== 'undefined' && !isAuthRoute) {
      const token = localStorage.getItem('auth-token');

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Maneja errores 401 (no autorizado) y extrae data de la respuesta
 */
apiClient.interceptors.response.use(
  (response) => {
    // La API de SIGP envuelve las respuestas en { success, data, meta, timestamp }
    // Extraemos data pero preservamos meta para paginación
    if (response.data?.data) {
      return {
        ...response,
        data: response.data.data,
        meta: response.data.meta // Preserve pagination metadata
      };
    }
    return response;
  },
  (error: AxiosError) => {
    // Si es error 401, limpiar sesión y redirigir a login
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-user');

        // Solo redirigir si no estamos ya en login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Wrapper type-safe para peticiones GET con cache
 *
 * @param url - URL del endpoint
 * @param config - Configuración de axios + opciones de cache
 * @param config.cache - Opciones de cache: { ttl?: number, skip?: boolean }
 */
export async function get<T>(
  url: string,
  config?: any & { cache?: { ttl?: number; skip?: boolean } }
): Promise<T> {
  const { cache: cacheOptions, ...axiosConfig } = config || {};

  // Si se solicita saltar cache o es una petición con params dinámicos complejos
  if (cacheOptions?.skip) {
    const response = await apiClient.get<T>(url, axiosConfig);
    return response.data;
  }

  const cacheKey = getCacheKey(url, axiosConfig?.params);

  // 1. Verificar cache válido
  const cachedEntry = requestCache.get(cacheKey);
  if (isCacheValid(cachedEntry)) {
    return cachedEntry!.data as T;
  }

  // 2. Verificar si ya hay una petición en vuelo para esta URL
  const pendingRequest = pendingRequests.get(cacheKey);
  if (pendingRequest) {
    return pendingRequest as Promise<T>;
  }

  // 3. Hacer la petición y cachear
  const requestPromise = apiClient.get<T>(url, axiosConfig)
    .then(response => {
      const data = response.data;

      // Guardar en cache
      const ttl = cacheOptions?.ttl || DEFAULT_CACHE_TTL;
      requestCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      });

      // Limpiar de pending
      pendingRequests.delete(cacheKey);

      return data;
    })
    .catch(error => {
      pendingRequests.delete(cacheKey);
      throw error;
    });

  // Guardar como pending para evitar duplicados
  pendingRequests.set(cacheKey, requestPromise);

  return requestPromise;
}

/**
 * Wrapper type-safe para peticiones POST
 * Invalida cache relacionado automáticamente
 */
export async function post<T>(url: string, data?: any, config?: any): Promise<T> {
  const response = await apiClient.post<T>(url, data, config);
  // Invalidar cache del recurso base (ej: /proyectos/1/historias -> invalida /proyectos)
  const baseUrl = url.split('/').slice(0, 2).join('/');
  invalidateCache(baseUrl);
  return response.data;
}

/**
 * Wrapper type-safe para peticiones PUT
 * Invalida cache relacionado automáticamente
 */
export async function put<T>(url: string, data?: any, config?: any): Promise<T> {
  const response = await apiClient.put<T>(url, data, config);
  const baseUrl = url.split('/').slice(0, 2).join('/');
  invalidateCache(baseUrl);
  return response.data;
}

/**
 * Wrapper type-safe para peticiones PATCH
 * Invalida cache relacionado automáticamente
 */
export async function patch<T>(url: string, data?: any, config?: any): Promise<T> {
  const response = await apiClient.patch<T>(url, data, config);
  const baseUrl = url.split('/').slice(0, 2).join('/');
  invalidateCache(baseUrl);
  return response.data;
}

/**
 * Wrapper type-safe para peticiones DELETE
 * Invalida cache relacionado automáticamente
 */
export async function del<T>(url: string, config?: any): Promise<T> {
  const response = await apiClient.delete<T>(url, config);
  const baseUrl = url.split('/').slice(0, 2).join('/');
  invalidateCache(baseUrl);
  return response.data;
}
