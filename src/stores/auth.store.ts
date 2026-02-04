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
  _hasHydrated: boolean; // Flag para saber si Zustand terminó de rehidratar

  // Acciones
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  clearMustChangePassword: () => void;
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
      _hasHydrated: false, // Inicia como false, se pone true cuando termina rehidratación

      // Establecer autenticación completa (login)
      setAuth: (user: User, token: string) => {
        // También guardar en localStorage para el interceptor de axios
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth-token', token);
          localStorage.setItem('auth-user', JSON.stringify(user));

          // Guardar en cookie para el middleware (edge runtime)
          document.cookie = `auth-token=${token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
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
        // Limpiar localStorage y cookie
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-token');
          localStorage.removeItem('auth-user');

          // Eliminar cookie
          document.cookie = 'auth-token=; path=/; max-age=0; SameSite=Lax';
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

      // Marcar que la rehidratación terminó
      setHasHydrated: (hasHydrated: boolean) => {
        set({ _hasHydrated: hasHydrated });
      },

      // Limpiar flag de cambio obligatorio de contraseña
      clearMustChangePassword: () => {
        set((state) => ({
          user: state.user ? { ...state.user, mustChangePassword: false } : null,
        }));
        // Sincronizar con localStorage
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('auth-user');
          if (stored) {
            const user = JSON.parse(stored);
            user.mustChangePassword = false;
            localStorage.setItem('auth-user', JSON.stringify(user));
          }
        }
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
      // Callback cuando la rehidratación termina
      onRehydrateStorage: () => (state) => {
        // Cuando termina la rehidratación, marcar _hasHydrated como true
        if (state) {
          state.setHasHydrated(true);

          // Si hay token en el estado rehidratado, sincronizar con localStorage y cookie
          if (state.token && state.user && typeof window !== 'undefined') {
            localStorage.setItem('auth-token', state.token);
            localStorage.setItem('auth-user', JSON.stringify(state.user));
            document.cookie = `auth-token=${state.token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
          }
        }
      },
    }
  )
);

/**
 * Hook para verificar si Zustand ha terminado de rehidratar
 * IMPORTANTE: Usar esto para esperar antes de verificar autenticación
 */
export const useHasHydrated = () => useAuthStore((state) => state._hasHydrated);

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
    isAdmin: user?.role === ROLES.ADMIN,
    isPmo: user?.role === ROLES.PMO,
    isScrumMaster: user?.role === ROLES.SCRUM_MASTER,
    isDesarrollador: user?.role === ROLES.DESARROLLADOR,
    isCoordinador: user?.role === ROLES.COORDINADOR,
    isUsuario: user?.role === ROLES.USUARIO,
    isPatrocinador: user?.role === ROLES.PATROCINADOR,
    accessibleModules: user ? getAccessibleModules(user.role) : [],
  };
};
