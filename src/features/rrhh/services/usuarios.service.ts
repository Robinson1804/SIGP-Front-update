/**
 * Usuarios Service
 *
 * Servicios para gestión de usuarios del sistema
 * Sincronizado con Backend - Dic 2024
 */

import { apiClient, ENDPOINTS } from '@/lib/api';
import type { Usuario, UsuarioFilters, Role } from '../types';

// ============================================================================
// USUARIOS
// ============================================================================

/**
 * Obtener todos los usuarios con filtros opcionales
 */
export async function getUsuarios(filters?: UsuarioFilters): Promise<Usuario[]> {
  const response = await apiClient.get<Usuario[]>(ENDPOINTS.USUARIOS.BASE, {
    params: filters,
  });
  return response.data;
}

/**
 * Obtener usuario por ID
 */
export async function getUsuarioById(id: number | string): Promise<Usuario> {
  const response = await apiClient.get<Usuario>(ENDPOINTS.USUARIOS.BY_ID(id));
  return response.data;
}

/**
 * Obtener usuarios por rol
 */
export async function getUsuariosByRol(rol: Role): Promise<Usuario[]> {
  const response = await apiClient.get<Usuario[]>(ENDPOINTS.USUARIOS.BY_ROL(rol));
  return response.data;
}

/**
 * Crear usuario para un personal existente
 */
export async function crearUsuarioParaPersonal(
  personalId: number,
  rol: Role
): Promise<Usuario> {
  const response = await apiClient.post<Usuario>(
    ENDPOINTS.USUARIOS.CREAR_PARA_PERSONAL(personalId),
    { rol }
  );
  return response.data;
}

/**
 * Actualizar usuario
 */
export async function updateUsuario(
  id: number | string,
  data: Partial<Usuario>
): Promise<Usuario> {
  const response = await apiClient.patch<Usuario>(
    ENDPOINTS.USUARIOS.BY_ID(id),
    data
  );
  return response.data;
}

/**
 * Agregar rol a un usuario
 */
export async function agregarRol(usuarioId: number | string, rol: Role): Promise<Usuario> {
  const response = await apiClient.post<Usuario>(
    ENDPOINTS.USUARIOS.AGREGAR_ROL(usuarioId),
    { rol }
  );
  return response.data;
}

/**
 * Remover rol de un usuario
 */
export async function removerRol(usuarioId: number | string, rol: Role): Promise<Usuario> {
  const response = await apiClient.post<Usuario>(
    ENDPOINTS.USUARIOS.REMOVER_ROL(usuarioId),
    { rol }
  );
  return response.data;
}

/**
 * Resetear contraseña de un usuario
 */
export async function resetearPassword(
  usuarioId: number | string
): Promise<{ passwordTemporal: string }> {
  const response = await apiClient.post<{ passwordTemporal: string }>(
    ENDPOINTS.USUARIOS.RESETEAR_PASSWORD(usuarioId)
  );
  return response.data;
}

/**
 * Activar/Desactivar usuario
 */
export async function toggleUsuarioActivo(
  id: number | string,
  activo: boolean
): Promise<Usuario> {
  const response = await apiClient.patch<Usuario>(
    ENDPOINTS.USUARIOS.BY_ID(id),
    { activo }
  );
  return response.data;
}

/**
 * Obtener coordinadores
 */
export async function getCoordinadores(): Promise<Usuario[]> {
  const response = await apiClient.get<Usuario[]>(ENDPOINTS.USUARIOS.COORDINADORES);
  return response.data;
}

/**
 * Obtener scrum masters
 */
export async function getScrumMastersUsuarios(): Promise<Usuario[]> {
  const response = await apiClient.get<Usuario[]>(ENDPOINTS.USUARIOS.SCRUM_MASTERS);
  return response.data;
}

// ============================================================================
// EXPORTAR SERVICIO COMO OBJETO
// ============================================================================

export const usuariosService = {
  getUsuarios,
  getUsuarioById,
  getUsuariosByRol,
  crearUsuarioParaPersonal,
  updateUsuario,
  agregarRol,
  removerRol,
  resetearPassword,
  toggleUsuarioActivo,
  getCoordinadores,
  getScrumMastersUsuarios,
};
