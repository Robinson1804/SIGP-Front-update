import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PGD } from '@/features/planning';

/**
 * Estado del PGD seleccionado
 * Persiste en localStorage para mantener la selección entre páginas y sesiones
 */
interface PGDState {
  // Estado
  selectedPGD: PGD | null;
  pgds: PGD[];
  isLoading: boolean;
  _hasHydrated: boolean;

  // Acciones
  setSelectedPGD: (pgd: PGD | null) => void;
  setPGDs: (pgds: PGD[]) => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (hasHydrated: boolean) => void;

  // Inicializar: cargar PGDs y seleccionar el vigente si no hay uno seleccionado
  initializePGD: (pgds: PGD[]) => void;
}

/**
 * Store del PGD seleccionado con Zustand
 *
 * Persiste en localStorage para mantener la selección del PGD
 * al navegar entre páginas (POI, PGD/OEI, PGD/OGD, etc.)
 */
export const usePGDStore = create<PGDState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      selectedPGD: null,
      pgds: [],
      isLoading: false,
      _hasHydrated: false,

      // Establecer el PGD seleccionado
      setSelectedPGD: (pgd: PGD | null) => {
        set({ selectedPGD: pgd });
      },

      // Establecer la lista de PGDs disponibles
      setPGDs: (pgds: PGD[]) => {
        set({ pgds });
      },

      // Establecer estado de carga
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // Marcar que la rehidratación terminó
      setHasHydrated: (hasHydrated: boolean) => {
        set({ _hasHydrated: hasHydrated });
      },

      // Inicializar: cargar PGDs y seleccionar el vigente si no hay uno seleccionado
      initializePGD: (pgds: PGD[]) => {
        const currentState = get();
        set({ pgds, isLoading: false });

        // Si ya hay un PGD seleccionado y todavía existe en la lista, mantenerlo
        if (currentState.selectedPGD) {
          const stillExists = pgds.find(p => p.id === currentState.selectedPGD?.id);
          if (stillExists) {
            // Actualizar con los datos más recientes del PGD
            set({ selectedPGD: stillExists });
            return;
          }
        }

        // Si no hay PGD seleccionado o ya no existe, seleccionar el vigente o el primero
        if (pgds.length > 0) {
          const vigentePGD = pgds.find(p => p.estado === 'VIGENTE') || pgds[0];
          set({ selectedPGD: vigentePGD });
        }
      },
    }),
    {
      name: 'pgd-storage', // Key en localStorage
      // Solo persistir selectedPGD (no pgds ni isLoading)
      partialize: (state) => ({
        selectedPGD: state.selectedPGD,
      }),
      // Callback cuando la rehidratación termina
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);

/**
 * Hook para verificar si Zustand ha terminado de rehidratar el PGD
 */
export const usePGDHasHydrated = () => usePGDStore((state) => state._hasHydrated);

/**
 * Hook para obtener el PGD seleccionado
 */
export const useSelectedPGD = () => usePGDStore((state) => state.selectedPGD);

/**
 * Hook para obtener la lista de PGDs
 */
export const usePGDList = () => usePGDStore((state) => state.pgds);

/**
 * Hook completo para trabajar con PGDs
 *
 * @example
 * ```tsx
 * const { selectedPGD, pgds, setSelectedPGD, initializePGD, isLoading } = usePGD();
 * ```
 */
export const usePGD = () => {
  const selectedPGD = usePGDStore((state) => state.selectedPGD);
  const pgds = usePGDStore((state) => state.pgds);
  const isLoading = usePGDStore((state) => state.isLoading);
  const setSelectedPGD = usePGDStore((state) => state.setSelectedPGD);
  const setPGDs = usePGDStore((state) => state.setPGDs);
  const setLoading = usePGDStore((state) => state.setLoading);
  const initializePGD = usePGDStore((state) => state.initializePGD);
  const _hasHydrated = usePGDStore((state) => state._hasHydrated);

  // Años disponibles basados en el PGD seleccionado
  const availableYears = selectedPGD
    ? Array.from(
        { length: selectedPGD.anioFin - selectedPGD.anioInicio + 1 },
        (_, i) => selectedPGD.anioInicio + i
      )
    : [];

  return {
    selectedPGD,
    pgds,
    isLoading,
    setSelectedPGD,
    setPGDs,
    setLoading,
    initializePGD,
    availableYears,
    hasHydrated: _hasHydrated,
  };
};
