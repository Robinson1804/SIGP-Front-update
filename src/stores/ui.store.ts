import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Tema de la aplicación
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Estado de la UI
 */
interface UIState {
  // Estado
  sidebarOpen: boolean;
  theme: Theme;
  compactMode: boolean;

  // Acciones
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
  toggleCompactMode: () => void;
}

/**
 * Store de UI con Zustand
 *
 * Maneja el estado de la interfaz de usuario:
 * - Sidebar (abierto/cerrado)
 * - Tema (light/dark/system)
 * - Modo compacto
 */
export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Estado inicial
      sidebarOpen: true,
      theme: 'light',
      compactMode: false,

      // Toggle sidebar (abrir/cerrar)
      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      // Establecer estado del sidebar
      setSidebarOpen: (open: boolean) => {
        set({ sidebarOpen: open });
      },

      // Cambiar tema
      setTheme: (theme: Theme) => {
        // Aplicar clase al documento
        if (typeof window !== 'undefined') {
          const root = window.document.documentElement;
          root.classList.remove('light', 'dark');

          if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light';
            root.classList.add(systemTheme);
          } else {
            root.classList.add(theme);
          }
        }

        set({ theme });
      },

      // Toggle modo compacto
      toggleCompactMode: () => {
        set((state) => ({ compactMode: !state.compactMode }));
      },
    }),
    {
      name: 'ui-storage', // Key en localStorage
    }
  )
);
