/**
 * Usuarios Service
 *
 * Servicios para gestión de usuarios y obtención por rol
 */

import { apiClient, ENDPOINTS } from '@/lib/api';

/**
 * Interfaz para usuario
 */
export interface Usuario {
  id: number;
  email: string;
  username: string;
  nombre: string;
  apellido: string;
  rol: string;
  avatarUrl?: string;
  telefono?: string;
  activo: boolean;
}

/**
 * Filtros para consulta de usuarios
 */
export interface UsuarioQueryFilters {
  rol?: string;
  activo?: boolean;
  busqueda?: string;
}

/**
 * Obtener lista de usuarios con filtros opcionales
 */
export async function getUsuarios(filters?: UsuarioQueryFilters): Promise<Usuario[]> {
  const response = await apiClient.get<Usuario[]>(ENDPOINTS.USUARIOS.BASE, {
    params: filters,
  });
  return response.data || [];
}

/**
 * Obtener un usuario por ID
 */
export async function getUsuarioById(id: number | string): Promise<Usuario> {
  const response = await apiClient.get<Usuario>(ENDPOINTS.USUARIOS.BY_ID(id));
  return response.data;
}

/**
 * Obtener usuarios por rol
 */
export async function getUsuariosByRol(rol: string): Promise<Usuario[]> {
  const response = await apiClient.get<Usuario[]>(ENDPOINTS.USUARIOS.BY_ROL(rol));
  return response.data || [];
}

/**
 * Obtener lista de roles disponibles
 */
export async function getRoles(): Promise<string[]> {
  const response = await apiClient.get<string[]>(ENDPOINTS.USUARIOS.ROLES);
  return response.data || [];
}

/**
 * Obtener coordinadores
 */
export async function getCoordinadores(): Promise<Usuario[]> {
  const response = await apiClient.get<Usuario[]>(ENDPOINTS.USUARIOS.COORDINADORES);
  return response.data || [];
}

/**
 * Obtener scrum masters
 */
export async function getScrumMasters(): Promise<Usuario[]> {
  const response = await apiClient.get<Usuario[]>(ENDPOINTS.USUARIOS.SCRUM_MASTERS);
  return response.data || [];
}

/**
 * Obtener patrocinadores
 */
export async function getPatrocinadores(): Promise<Usuario[]> {
  const response = await apiClient.get<Usuario[]>(ENDPOINTS.USUARIOS.PATROCINADORES);
  return response.data || [];
}

/**
 * Obtener desarrolladores
 */
export async function getDesarrolladores(): Promise<Usuario[]> {
  const response = await apiClient.get<Usuario[]>(ENDPOINTS.USUARIOS.DESARROLLADORES);
  return response.data || [];
}

/**
 * Obtener implementadores
 */
export async function getImplementadores(): Promise<Usuario[]> {
  const response = await apiClient.get<Usuario[]>(ENDPOINTS.USUARIOS.IMPLEMENTADORES);
  return response.data || [];
}

/**
 * Obtener todos los usuarios que pueden ser responsables
 * (Scrum Masters, Desarrolladores, Implementadores)
 */
export async function getResponsables(): Promise<Usuario[]> {
  const response = await apiClient.get<Usuario[]>(ENDPOINTS.USUARIOS.RESPONSABLES);
  return response.data || [];
}

/**
 * Formatea el nombre completo de un usuario
 */
export function formatUsuarioNombre(usuario: Usuario): string {
  return `${usuario.nombre} ${usuario.apellido}`;
}
