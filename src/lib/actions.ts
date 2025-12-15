'use server';

import { redirect } from 'next/navigation';
import {
  LoginFormSchema,
  type LoginFormState,
  type AuthUser,
  type Role,
  ROLES
} from '@/lib/definitions';
import { paths } from '@/lib/paths';

// Mock CAPTCHA value
const MOCK_CAPTCHA_CODE = 'A4B2C';

// Base de datos mock de usuarios con el nuevo sistema de roles
const users: Array<{
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
  role: Role;
}> = [
  {
    id: '1',
    username: 'admin',
    password: 'password',
    name: 'Carlos Administrador',
    email: 'admin@inei.gob.pe',
    role: ROLES.ADMINISTRADOR
  },
  {
    id: '2',
    username: 'pmo',
    password: 'password',
    name: 'Eduardo Corilla',
    email: 'ecorilla@inei.gob.pe',
    role: ROLES.PMO
  },
  {
    id: '3',
    username: 'rcerron',
    password: 'password',
    name: 'Robinson Cerron',
    email: 'rcerron@inei.gob.pe',
    role: ROLES.SCRUM_MASTER
  },
  {
    id: '4',
    username: 'atrujillo',
    password: 'password',
    name: 'Angella Trujillo',
    email: 'atrujillo@inei.gob.pe',
    role: ROLES.DESARROLLADOR
  },
  {
    id: '5',
    username: 'clazaro',
    password: 'password',
    name: 'Carlos Lázaro',
    email: 'clazaro@inei.gob.pe',
    role: ROLES.IMPLEMENTADOR
  },
  {
    id: '6',
    username: 'coord',
    password: 'password',
    name: 'María Coordinadora',
    email: 'mcoordinadora@inei.gob.pe',
    role: ROLES.COORDINADOR
  },
  {
    id: '7',
    username: 'user',
    password: 'password',
    name: 'Pedro Usuario',
    email: 'pusuario@inei.gob.pe',
    role: ROLES.USUARIO
  },
];

// Tipo extendido para incluir datos del usuario autenticado
export type AuthenticateResult = LoginFormState & {
  user?: AuthUser;
};

export async function authenticate(
  prevState: LoginFormState | undefined,
  formData: FormData,
): Promise<AuthenticateResult> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay

    const validatedFields = LoginFormSchema.safeParse(
      Object.fromEntries(formData.entries()),
    );

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Por favor, corrija los errores en el formulario.',
      };
    }

    const { username, password, captcha } = validatedFields.data;

    if (captcha.toUpperCase() !== MOCK_CAPTCHA_CODE) {
      return {
        errors: { captcha: ['Código captcha incorrecto.'] },
        message: 'Error de validación.',
      };
    }

    const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());

    if (!user || user.password !== password) {
      return {
        message: 'Credenciales inválidas. Por favor, inténtelo de nuevo.',
      };
    }

    // Devolver los datos del usuario para que el cliente los guarde
    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return {
      message: null,
      user: authUser,
    };

  } catch (error) {
    if ((error as Error).message.includes('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Authentication Error:', error);
    return { message: 'Ha ocurrido un error inesperado.' };
  }
}

export async function signOut() {
  // In a real app, you would clear the session cookie here.
  redirect(paths.login);
}

// ============================================
// HELPER: Get Auth Token
// ============================================

/**
 * Obtiene el token de autenticación del usuario actual
 * TODO: Implementar con el sistema de autenticación real
 */
async function getAuthToken(): Promise<string> {
  // Por ahora retorna un token mock
  // En producción, obtener del cookie o session storage
  return 'mock-jwt-token';
}

// ============================================
// PROYECTOS (POI - SCRUM) Actions
// ============================================

import { revalidatePath } from 'next/cache';
import type { Proyecto, CreateProyectoInput, UpdateProyectoInput } from './definitions';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010';

/**
 * Obtiene todos los proyectos
 */
export async function getProyectos(): Promise<Proyecto[]> {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE}/api/v1/proyectos`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // O usar tags para revalidación
    });

    if (!response.ok) {
      throw new Error(`Error fetching proyectos: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || data; // Ajustar según formato backend
  } catch (error) {
    console.error('Error in getProyectos:', error);
    throw error;
  }
}

/**
 * Obtiene un proyecto por ID
 */
export async function getProyecto(id: number): Promise<Proyecto> {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE}/api/v1/proyectos/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
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
 */
export async function createProyecto(input: CreateProyectoInput): Promise<Proyecto> {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE}/api/v1/proyectos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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
 */
export async function updateProyecto(input: UpdateProyectoInput): Promise<Proyecto> {
  try {
    const token = await getAuthToken();
    const { id, ...updateData } = input;

    const response = await fetch(`${API_BASE}/api/v1/proyectos/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
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
 */
export async function deleteProyecto(id: number): Promise<void> {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE}/api/v1/proyectos/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
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
