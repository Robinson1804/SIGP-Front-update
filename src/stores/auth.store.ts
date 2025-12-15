import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, Role } from '@/lib/definitions';
import { canAccessRoute, getAccessibleModules } from '@/lib/permissions';
import { ROLES } from '@/lib/definitions';

// Re-export AuthUser as User for convenience
export type User = AuthUser;

/**
 * Estado de autenticación
 */
interface AuthState {
  // Estado
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Acciones
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

/**
 * Store de autenticación con Zustand
 *
 * Persiste en localStorage usando el middleware persist
 * Sincroniza automáticamente entre tabs
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Estado inicial
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Establecer autenticación completa (login)
      setAuth: (user: User, token: string) => {
        // También guardar en localStorage para el interceptor de axios
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth-token', token);
          localStorage.setItem('auth-user', JSON.stringify(user));
        }

        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      // Actualizar solo el usuario (sin cambiar token)
      setUser: (user: User) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth-user', JSON.stringify(user));
        }

        set({ user });
      },

      // Cerrar sesión
      logout: () => {
        // Limpiar localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-token');
          localStorage.removeItem('auth-user');
        }

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      // Establecer estado de carga
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage', // Key en localStorage
      // Solo persistir user, token e isAuthenticated
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * Hook para obtener el usuario actual
 */
export const useCurrentUser = () => useAuthStore((state) => state.user);

/**
 * Hook para obtener el rol del usuario actual
 */
export const useCurrentRole = () => useAuthStore((state) => state.user?.role);

/**
 * Hook para verificar si está autenticado
 */
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);

/**
 * Hook compatible con API de Context
 * Permite migración sin cambiar código de componentes
 *
 * @example
 * ```tsx
 * const { user, isLoading, isAuthenticated, logout, checkAccess } = useAuth();
 * ```
 */
export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return {
    user,
    isLoading,
    isAuthenticated,
    logout,
    checkAccess: (pathname: string) => {
      if (!user) return false;
      return canAccessRoute(user.role, pathname);
    },
  };
};

/**
 * Hook para roles y permisos
 * Proporciona verificaciones rápidas de rol y módulos accesibles
 *
 * @example
 * ```tsx
 * const { role, isAdmin, isPmo, accessibleModules } = useRole();
 * ```
 */
export const useRole = () => {
  const user = useAuthStore((state) => state.user);

  return {
    role: user?.role ?? null,
    isAdmin: user?.role === ROLES.ADMINISTRADOR,
    isPmo: user?.role === ROLES.PMO,
    isScrumMaster: user?.role === ROLES.SCRUM_MASTER,
    isDesarrollador: user?.role === ROLES.DESARROLLADOR,
    isCoordinador: user?.role === ROLES.COORDINADOR,
    isUsuario: user?.role === ROLES.USUARIO,
    accessibleModules: user ? getAccessibleModules(user.role) : [],
  };
};
