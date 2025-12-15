import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Base URL desde variables de entorno
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/api/v1';

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
 * Agrega el Bearer token a todas las peticiones si existe
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Intentar obtener token de localStorage
    if (typeof window !== 'undefined') {
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
    // La API de SIGP envuelve las respuestas en { data, statusCode, message }
    // Extraemos solo la data para simplificar el uso
    return response.data?.data ? { ...response, data: response.data.data } : response;
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
 * Wrapper type-safe para peticiones GET
 */
export async function get<T>(url: string, config?: any): Promise<T> {
  const response = await apiClient.get<T>(url, config);
  return response.data;
}

/**
 * Wrapper type-safe para peticiones POST
 */
export async function post<T>(url: string, data?: any, config?: any): Promise<T> {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
}

/**
 * Wrapper type-safe para peticiones PUT
 */
export async function put<T>(url: string, data?: any, config?: any): Promise<T> {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
}

/**
 * Wrapper type-safe para peticiones PATCH
 */
export async function patch<T>(url: string, data?: any, config?: any): Promise<T> {
  const response = await apiClient.patch<T>(url, data, config);
  return response.data;
}

/**
 * Wrapper type-safe para peticiones DELETE
 */
export async function del<T>(url: string, config?: any): Promise<T> {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
}
