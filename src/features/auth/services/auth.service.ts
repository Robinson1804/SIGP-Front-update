/**
 * Auth Service
 *
 * Servicios de autenticación que interactúan con el backend
 */

import { apiClient, ENDPOINTS } from '@/lib/api';
import type { LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse } from '@/types';
import type { AuthUser } from '@/lib/definitions';

/**
 * Realizar login de usuario
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(
    ENDPOINTS.AUTH.LOGIN,
    credentials
  );
  return response.data;
}

/**
 * Realizar logout de usuario
 */
export async function logout(): Promise<void> {
  await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
}

/**
 * Refrescar el access token
 */
export async function refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
  const response = await apiClient.post<RefreshTokenResponse>(
    ENDPOINTS.AUTH.REFRESH,
    data
  );
  return response.data;
}

/**
 * Obtener datos del usuario actual
 */
export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get<AuthUser>(ENDPOINTS.AUTH.ME);
  return response.data;
}

/**
 * Verificar si hay una sesión activa
 */
export async function checkSession(): Promise<boolean> {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}
