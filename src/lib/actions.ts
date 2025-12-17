'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  type LoginFormState,
  type AuthUser,
} from '@/lib/definitions';
import { paths } from '@/lib/paths';
import type { Proyecto, CreateProyectoInput, UpdateProyectoInput } from './definitions';

// Base URL del API
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3010';

// ============================================
// AUTH ACTIONS
// ============================================

/**
 * Cerrar sesión - Server Action
 * Limpia la cookie de autenticación y redirige al login
 */
export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
  redirect(paths.login);
}

/**
 * Obtener el token de autenticación desde las cookies del servidor
 * Para uso en Server Actions
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    return token || null;
  } catch {
    return null;
  }
}

// ============================================
// PROYECTOS (POI - SCRUM) Server Actions
// ============================================

/**
 * Obtiene todos los proyectos
 * @deprecated Usar el servicio del cliente en features/proyectos/services
 */
export async function getProyectos(): Promise<Proyecto[]> {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE}/api/v1/proyectos`, {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Error fetching proyectos: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Error in getProyectos:', error);
    throw error;
  }
}

/**
 * Obtiene un proyecto por ID
 * @deprecated Usar el servicio del cliente en features/proyectos/services
 */
export async function getProyecto(id: number): Promise<Proyecto> {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE}/api/v1/proyectos/${id}`, {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Proyecto no encontrado');
      }
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error(`Error in getProyecto ${id}:`, error);
    throw error;
  }
}

/**
 * Crea un nuevo proyecto
 * @deprecated Usar el servicio del cliente en features/proyectos/services
 */
export async function createProyecto(input: CreateProyectoInput): Promise<Proyecto> {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE}/api/v1/proyectos`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear proyecto');
    }

    const data = await response.json();

    // Revalidar cache
    revalidatePath('/poi/proyectos');

    return data.data || data;
  } catch (error) {
    console.error('Error in createProyecto:', error);
    throw error;
  }
}

/**
 * Actualiza un proyecto
 * @deprecated Usar el servicio del cliente en features/proyectos/services
 */
export async function updateProyecto(input: UpdateProyectoInput): Promise<Proyecto> {
  try {
    const token = await getAuthToken();
    const { id, ...updateData } = input;

    const response = await fetch(`${API_BASE}/api/v1/proyectos/${id}`, {
      method: 'PATCH',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al actualizar proyecto');
    }

    const data = await response.json();

    // Revalidar cache
    revalidatePath('/poi/proyectos');
    revalidatePath(`/poi/proyectos/${id}`);

    return data.data || data;
  } catch (error) {
    console.error(`Error in updateProyecto ${input.id}:`, error);
    throw error;
  }
}

/**
 * Elimina (soft delete) un proyecto
 * @deprecated Usar el servicio del cliente en features/proyectos/services
 */
export async function deleteProyecto(id: number): Promise<void> {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE}/api/v1/proyectos/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al eliminar proyecto');
    }

    // Revalidar cache
    revalidatePath('/poi/proyectos');
  } catch (error) {
    console.error(`Error in deleteProyecto ${id}:`, error);
    throw error;
  }
}
