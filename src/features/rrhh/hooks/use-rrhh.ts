'use client';

/**
 * useRRHH Hook
 *
 * Hook para gestión de recursos humanos
 * Sincronizado con Backend - Dic 2024
 */

import { useState, useCallback } from 'react';
import { rrhhService, usuariosService } from '../services';
import type {
  Personal,
  Division,
  Habilidad,
  PersonalHabilidad,
  Asignacion,
  AlertaSobrecarga,
  RRHHStats,
  PersonalFilters,
  DivisionFilters,
  HabilidadFilters,
  AsignacionFilters,
  Usuario,
  UsuarioFilters,
  Role,
} from '../types';
import type {
  CreatePersonalDto,
  UpdatePersonalDto,
  CreateDivisionDto,
  UpdateDivisionDto,
  CreateHabilidadDto,
  UpdateHabilidadDto,
  AsignarHabilidadDto,
  CreateAsignacionDto,
  UpdateAsignacionDto,
} from '../types/dto';

// ============================================================================
// TIPOS DEL HOOK
// ============================================================================

interface UseRRHHState {
  // Personal
  personal: Personal[];
  selectedPersonal: Personal | null;
  personalHabilidades: PersonalHabilidad[];

  // Divisiones
  divisiones: Division[];
  divisionesArbol: Division[];
  selectedDivision: Division | null;

  // Habilidades
  habilidades: Habilidad[];
  selectedHabilidad: Habilidad | null;

  // Asignaciones
  asignaciones: Asignacion[];
  alertasSobrecarga: AlertaSobrecarga[];
  selectedAsignacion: Asignacion | null;

  // Usuarios
  usuarios: Usuario[];
  selectedUsuario: Usuario | null;

  // Stats
  stats: RRHHStats | null;

  // Loading/Error
  isLoading: boolean;
  error: string | null;
}

interface UseRRHHActions {
  // Personal
  loadPersonal: (filters?: PersonalFilters) => Promise<void>;
  loadPersonalById: (id: number) => Promise<Personal | null>;
  createPersonal: (data: CreatePersonalDto) => Promise<Personal>;
  updatePersonal: (id: number, data: UpdatePersonalDto) => Promise<Personal>;
  deletePersonal: (id: number) => Promise<void>;
  selectPersonal: (personal: Personal | null) => void;

  // Personal Habilidades
  loadPersonalHabilidades: (personalId: number) => Promise<void>;
  asignarHabilidad: (personalId: number, data: AsignarHabilidadDto) => Promise<void>;
  removeHabilidadPersonal: (personalId: number, habilidadId: number) => Promise<void>;

  // Divisiones
  loadDivisiones: (filters?: DivisionFilters) => Promise<void>;
  loadDivisionesArbol: () => Promise<void>;
  loadDivisionById: (id: number) => Promise<Division | null>;
  createDivision: (data: CreateDivisionDto) => Promise<Division>;
  updateDivision: (id: number, data: UpdateDivisionDto) => Promise<Division>;
  deleteDivision: (id: number) => Promise<void>;
  selectDivision: (division: Division | null) => void;

  // Habilidades
  loadHabilidades: (filters?: HabilidadFilters) => Promise<void>;
  createHabilidad: (data: CreateHabilidadDto) => Promise<Habilidad>;
  updateHabilidad: (id: number, data: UpdateHabilidadDto) => Promise<Habilidad>;
  deleteHabilidad: (id: number) => Promise<void>;
  selectHabilidad: (habilidad: Habilidad | null) => void;

  // Asignaciones
  loadAsignaciones: (filters?: AsignacionFilters) => Promise<void>;
  loadAsignacionesProyecto: (proyectoId: number) => Promise<void>;
  loadAsignacionesActividad: (actividadId: number) => Promise<void>;
  loadAlertasSobrecarga: () => Promise<void>;
  createAsignacion: (data: CreateAsignacionDto) => Promise<Asignacion>;
  updateAsignacion: (id: number, data: UpdateAsignacionDto) => Promise<Asignacion>;
  finalizarAsignacion: (id: number, fechaFin?: string) => Promise<void>;
  deleteAsignacion: (id: number) => Promise<void>;
  selectAsignacion: (asignacion: Asignacion | null) => void;

  // Coordinadores y Scrum Masters
  asignarCoordinador: (divisionId: number, personalId: number) => Promise<void>;
  removerCoordinador: (divisionId: number) => Promise<void>;
  asignarScrumMaster: (divisionId: number, personalId: number) => Promise<void>;
  removerScrumMaster: (divisionId: number, personalId: number) => Promise<void>;

  // Usuarios
  loadUsuarios: (filters?: UsuarioFilters) => Promise<void>;
  agregarRol: (usuarioId: number, rol: Role) => Promise<void>;
  removerRol: (usuarioId: number, rol: Role) => Promise<void>;
  resetearPassword: (usuarioId: number) => Promise<{ passwordTemporal: string }>;
  toggleUsuarioActivo: (usuarioId: number, activo: boolean) => Promise<void>;
  selectUsuario: (usuario: Usuario | null) => void;

  // Stats
  loadStats: () => Promise<void>;

  // Utils
  clearError: () => void;
  resetState: () => void;
}

export type UseRRHHReturn = UseRRHHState & UseRRHHActions;

// ============================================================================
// ESTADO INICIAL
// ============================================================================

const initialState: UseRRHHState = {
  personal: [],
  selectedPersonal: null,
  personalHabilidades: [],
  divisiones: [],
  divisionesArbol: [],
  selectedDivision: null,
  habilidades: [],
  selectedHabilidad: null,
  asignaciones: [],
  alertasSobrecarga: [],
  selectedAsignacion: null,
  usuarios: [],
  selectedUsuario: null,
  stats: null,
  isLoading: false,
  error: null,
};

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useRRHH(): UseRRHHReturn {
  const [state, setState] = useState<UseRRHHState>(initialState);

  // Helpers
  const setLoading = (isLoading: boolean) =>
    setState((prev) => ({ ...prev, isLoading }));

  const setError = (error: string | null) =>
    setState((prev) => ({ ...prev, error, isLoading: false }));

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const resetState = useCallback(() => {
    setState(initialState);
  }, []);

  // =========================================================================
  // PERSONAL
  // =========================================================================

  const loadPersonal = useCallback(async (filters?: PersonalFilters) => {
    setLoading(true);
    try {
      const data = await rrhhService.getPersonal(filters);
      setState((prev) => ({
        ...prev,
        personal: data,
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      setError('Error al cargar el personal');
      console.error('Error loading personal:', err);
    }
  }, []);

  const loadPersonalById = useCallback(async (id: number): Promise<Personal | null> => {
    setLoading(true);
    try {
      const data = await rrhhService.getPersonalById(id);
      setState((prev) => ({
        ...prev,
        selectedPersonal: data,
        isLoading: false,
        error: null,
      }));
      return data;
    } catch (err) {
      setError('Error al cargar el personal');
      console.error('Error loading personal by id:', err);
      return null;
    }
  }, []);

  const createPersonal = useCallback(async (data: CreatePersonalDto): Promise<Personal> => {
    setLoading(true);
    try {
      const newPersonal = await rrhhService.createPersonal(data);
      setState((prev) => ({
        ...prev,
        personal: [newPersonal, ...prev.personal],
        isLoading: false,
        error: null,
      }));
      return newPersonal;
    } catch (err) {
      setError('Error al crear el personal');
      console.error('Error creating personal:', err);
      throw err;
    }
  }, []);

  const updatePersonal = useCallback(
    async (id: number, data: UpdatePersonalDto): Promise<Personal> => {
      setLoading(true);
      try {
        const updated = await rrhhService.updatePersonal(id, data);
        setState((prev) => ({
          ...prev,
          personal: prev.personal.map((p) => (p.id === id ? updated : p)),
          selectedPersonal: prev.selectedPersonal?.id === id ? updated : prev.selectedPersonal,
          isLoading: false,
          error: null,
        }));
        return updated;
      } catch (err) {
        setError('Error al actualizar el personal');
        console.error('Error updating personal:', err);
        throw err;
      }
    },
    []
  );

  const deletePersonal = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await rrhhService.deletePersonal(id);
      setState((prev) => ({
        ...prev,
        personal: prev.personal.filter((p) => p.id !== id),
        selectedPersonal: prev.selectedPersonal?.id === id ? null : prev.selectedPersonal,
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      setError('Error al eliminar el personal');
      console.error('Error deleting personal:', err);
      throw err;
    }
  }, []);

  const selectPersonal = useCallback((personal: Personal | null) => {
    setState((prev) => ({ ...prev, selectedPersonal: personal }));
  }, []);

  // =========================================================================
  // PERSONAL - HABILIDADES
  // =========================================================================

  const loadPersonalHabilidades = useCallback(async (personalId: number) => {
    try {
      const data = await rrhhService.getPersonalHabilidades(personalId);
      setState((prev) => ({ ...prev, personalHabilidades: data }));
    } catch (err) {
      console.error('Error loading personal habilidades:', err);
    }
  }, []);

  const asignarHabilidad = useCallback(
    async (personalId: number, data: AsignarHabilidadDto) => {
      setLoading(true);
      try {
        const newHabilidad = await rrhhService.asignarHabilidadPersonal(personalId, data);
        setState((prev) => ({
          ...prev,
          personalHabilidades: [...prev.personalHabilidades, newHabilidad],
          isLoading: false,
          error: null,
        }));
      } catch (err) {
        setError('Error al asignar habilidad');
        console.error('Error assigning habilidad:', err);
        throw err;
      }
    },
    []
  );

  const removeHabilidadPersonal = useCallback(
    async (personalId: number, habilidadId: number) => {
      setLoading(true);
      try {
        await rrhhService.removePersonalHabilidad(personalId, habilidadId);
        setState((prev) => ({
          ...prev,
          personalHabilidades: prev.personalHabilidades.filter(
            (ph) => ph.habilidadId !== habilidadId
          ),
          isLoading: false,
          error: null,
        }));
      } catch (err) {
        setError('Error al quitar habilidad');
        console.error('Error removing habilidad:', err);
        throw err;
      }
    },
    []
  );

  // =========================================================================
  // DIVISIONES
  // =========================================================================

  const loadDivisiones = useCallback(async (filters?: DivisionFilters) => {
    try {
      const data = await rrhhService.getDivisiones(filters);
      setState((prev) => ({ ...prev, divisiones: data }));
    } catch (err) {
      console.error('Error loading divisiones:', err);
    }
  }, []);

  const loadDivisionesArbol = useCallback(async () => {
    try {
      const data = await rrhhService.getDivisionesArbol();
      setState((prev) => ({ ...prev, divisionesArbol: data }));
    } catch (err) {
      console.error('Error loading divisiones arbol:', err);
    }
  }, []);

  const loadDivisionById = useCallback(async (id: number): Promise<Division | null> => {
    try {
      const data = await rrhhService.getDivisionById(id);
      setState((prev) => ({ ...prev, selectedDivision: data }));
      return data;
    } catch (err) {
      console.error('Error loading division by id:', err);
      return null;
    }
  }, []);

  const createDivision = useCallback(async (data: CreateDivisionDto): Promise<Division> => {
    setLoading(true);
    try {
      const newDivision = await rrhhService.createDivision(data);
      setState((prev) => ({
        ...prev,
        divisiones: [newDivision, ...prev.divisiones],
        isLoading: false,
        error: null,
      }));
      return newDivision;
    } catch (err) {
      setError('Error al crear la división');
      console.error('Error creating division:', err);
      throw err;
    }
  }, []);

  const updateDivision = useCallback(
    async (id: number, data: UpdateDivisionDto): Promise<Division> => {
      setLoading(true);
      try {
        const updated = await rrhhService.updateDivision(id, data);
        setState((prev) => ({
          ...prev,
          divisiones: prev.divisiones.map((d) => (d.id === id ? updated : d)),
          selectedDivision: prev.selectedDivision?.id === id ? updated : prev.selectedDivision,
          isLoading: false,
          error: null,
        }));
        return updated;
      } catch (err) {
        setError('Error al actualizar la división');
        console.error('Error updating division:', err);
        throw err;
      }
    },
    []
  );

  const deleteDivision = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await rrhhService.deleteDivision(id);
      // Backend hace soft delete (activo: false), así que actualizamos en lugar de remover
      setState((prev) => ({
        ...prev,
        divisiones: prev.divisiones.map((d) =>
          d.id === id ? { ...d, activo: false } : d
        ),
        selectedDivision: prev.selectedDivision?.id === id ? null : prev.selectedDivision,
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      setError('Error al desactivar la división');
      console.error('Error deleting division:', err);
      throw err;
    }
  }, []);

  const selectDivision = useCallback((division: Division | null) => {
    setState((prev) => ({ ...prev, selectedDivision: division }));
  }, []);

  // =========================================================================
  // HABILIDADES
  // =========================================================================

  const loadHabilidades = useCallback(async (filters?: HabilidadFilters) => {
    try {
      const data = await rrhhService.getHabilidades(filters);
      setState((prev) => ({ ...prev, habilidades: data }));
    } catch (err) {
      console.error('Error loading habilidades:', err);
    }
  }, []);

  const createHabilidad = useCallback(async (data: CreateHabilidadDto): Promise<Habilidad> => {
    setLoading(true);
    try {
      const newHabilidad = await rrhhService.createHabilidad(data);
      setState((prev) => ({
        ...prev,
        habilidades: [newHabilidad, ...prev.habilidades],
        isLoading: false,
        error: null,
      }));
      return newHabilidad;
    } catch (err) {
      setError('Error al crear la habilidad');
      console.error('Error creating habilidad:', err);
      throw err;
    }
  }, []);

  const updateHabilidad = useCallback(
    async (id: number, data: UpdateHabilidadDto): Promise<Habilidad> => {
      setLoading(true);
      try {
        const updated = await rrhhService.updateHabilidad(id, data);
        setState((prev) => ({
          ...prev,
          habilidades: prev.habilidades.map((h) => (h.id === id ? updated : h)),
          selectedHabilidad: prev.selectedHabilidad?.id === id ? updated : prev.selectedHabilidad,
          isLoading: false,
          error: null,
        }));
        return updated;
      } catch (err) {
        setError('Error al actualizar la habilidad');
        console.error('Error updating habilidad:', err);
        throw err;
      }
    },
    []
  );

  const deleteHabilidad = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await rrhhService.deleteHabilidad(id);
      setState((prev) => ({
        ...prev,
        habilidades: prev.habilidades.filter((h) => h.id !== id),
        selectedHabilidad: prev.selectedHabilidad?.id === id ? null : prev.selectedHabilidad,
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      setError('Error al eliminar la habilidad');
      console.error('Error deleting habilidad:', err);
      throw err;
    }
  }, []);

  const selectHabilidad = useCallback((habilidad: Habilidad | null) => {
    setState((prev) => ({ ...prev, selectedHabilidad: habilidad }));
  }, []);

  // =========================================================================
  // ASIGNACIONES
  // =========================================================================

  const loadAsignaciones = useCallback(async (filters?: AsignacionFilters) => {
    try {
      const data = await rrhhService.getAsignaciones(filters);
      setState((prev) => ({ ...prev, asignaciones: data }));
    } catch (err) {
      console.error('Error loading asignaciones:', err);
    }
  }, []);

  const loadAsignacionesProyecto = useCallback(async (proyectoId: number) => {
    try {
      const data = await rrhhService.getAsignacionesProyecto(proyectoId);
      setState((prev) => ({ ...prev, asignaciones: data }));
    } catch (err) {
      console.error('Error loading asignaciones proyecto:', err);
    }
  }, []);

  const loadAsignacionesActividad = useCallback(async (actividadId: number) => {
    try {
      const data = await rrhhService.getAsignacionesActividad(actividadId);
      setState((prev) => ({ ...prev, asignaciones: data }));
    } catch (err) {
      console.error('Error loading asignaciones actividad:', err);
    }
  }, []);

  const loadAlertasSobrecarga = useCallback(async () => {
    try {
      const data = await rrhhService.getAlertasSobrecarga();
      setState((prev) => ({ ...prev, alertasSobrecarga: data }));
    } catch (err) {
      console.error('Error loading alertas sobrecarga:', err);
    }
  }, []);

  const createAsignacion = useCallback(
    async (data: CreateAsignacionDto): Promise<Asignacion> => {
      setLoading(true);
      try {
        const newAsignacion = await rrhhService.createAsignacion(data);
        setState((prev) => ({
          ...prev,
          asignaciones: [newAsignacion, ...prev.asignaciones],
          isLoading: false,
          error: null,
        }));
        return newAsignacion;
      } catch (err) {
        setError('Error al crear la asignación');
        console.error('Error creating asignacion:', err);
        throw err;
      }
    },
    []
  );

  const updateAsignacion = useCallback(
    async (id: number, data: UpdateAsignacionDto): Promise<Asignacion> => {
      setLoading(true);
      try {
        const updated = await rrhhService.updateAsignacion(id, data);
        setState((prev) => ({
          ...prev,
          asignaciones: prev.asignaciones.map((a) => (a.id === id ? updated : a)),
          selectedAsignacion:
            prev.selectedAsignacion?.id === id ? updated : prev.selectedAsignacion,
          isLoading: false,
          error: null,
        }));
        return updated;
      } catch (err) {
        setError('Error al actualizar la asignación');
        console.error('Error updating asignacion:', err);
        throw err;
      }
    },
    []
  );

  const finalizarAsignacion = useCallback(async (id: number, fechaFin?: string) => {
    setLoading(true);
    try {
      await rrhhService.finalizarAsignacion(id, fechaFin ? { fechaFin } : undefined);
      setState((prev) => ({
        ...prev,
        asignaciones: prev.asignaciones.map((a) =>
          a.id === id ? { ...a, activo: false, fechaFin: fechaFin || new Date().toISOString() } : a
        ),
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      setError('Error al finalizar la asignación');
      console.error('Error finishing asignacion:', err);
      throw err;
    }
  }, []);

  const deleteAsignacion = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await rrhhService.deleteAsignacion(id);
      setState((prev) => ({
        ...prev,
        asignaciones: prev.asignaciones.filter((a) => a.id !== id),
        selectedAsignacion: prev.selectedAsignacion?.id === id ? null : prev.selectedAsignacion,
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      setError('Error al eliminar la asignación');
      console.error('Error deleting asignacion:', err);
      throw err;
    }
  }, []);

  const selectAsignacion = useCallback((asignacion: Asignacion | null) => {
    setState((prev) => ({ ...prev, selectedAsignacion: asignacion }));
  }, []);

  // =========================================================================
  // STATS
  // =========================================================================

  const loadStats = useCallback(async () => {
    try {
      const data = await rrhhService.getRRHHStats();
      setState((prev) => ({ ...prev, stats: data }));
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, []);

  // =========================================================================
  // COORDINADORES Y SCRUM MASTERS
  // =========================================================================

  const asignarCoordinador = useCallback(
    async (divisionId: number, personalId: number) => {
      setLoading(true);
      try {
        const updated = await rrhhService.asignarCoordinador(divisionId, personalId);
        setState((prev) => ({
          ...prev,
          divisiones: prev.divisiones.map((d) => (d.id === divisionId ? updated : d)),
          isLoading: false,
          error: null,
        }));
      } catch (err) {
        setError('Error al asignar coordinador');
        console.error('Error assigning coordinator:', err);
        throw err;
      }
    },
    []
  );

  const removerCoordinador = useCallback(async (divisionId: number) => {
    setLoading(true);
    try {
      const updated = await rrhhService.removerCoordinador(divisionId);
      setState((prev) => ({
        ...prev,
        divisiones: prev.divisiones.map((d) => (d.id === divisionId ? updated : d)),
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      setError('Error al remover coordinador');
      console.error('Error removing coordinator:', err);
      throw err;
    }
  }, []);

  const asignarScrumMaster = useCallback(
    async (divisionId: number, personalId: number) => {
      setLoading(true);
      try {
        const updated = await rrhhService.asignarScrumMaster(divisionId, personalId);
        setState((prev) => ({
          ...prev,
          divisiones: prev.divisiones.map((d) => (d.id === divisionId ? updated : d)),
          isLoading: false,
          error: null,
        }));
      } catch (err) {
        setError('Error al asignar scrum master');
        console.error('Error assigning scrum master:', err);
        throw err;
      }
    },
    []
  );

  const removerScrumMaster = useCallback(
    async (divisionId: number, personalId: number) => {
      setLoading(true);
      try {
        const updated = await rrhhService.removerScrumMaster(divisionId, personalId);
        setState((prev) => ({
          ...prev,
          divisiones: prev.divisiones.map((d) => (d.id === divisionId ? updated : d)),
          isLoading: false,
          error: null,
        }));
      } catch (err) {
        setError('Error al remover scrum master');
        console.error('Error removing scrum master:', err);
        throw err;
      }
    },
    []
  );

  // =========================================================================
  // USUARIOS
  // =========================================================================

  const loadUsuarios = useCallback(async (filters?: UsuarioFilters) => {
    try {
      const data = await usuariosService.getUsuarios(filters);
      setState((prev) => ({ ...prev, usuarios: data }));
    } catch (err) {
      console.error('Error loading usuarios:', err);
    }
  }, []);

  const agregarRol = useCallback(async (usuarioId: number, rol: Role) => {
    setLoading(true);
    try {
      const updated = await usuariosService.agregarRol(usuarioId, rol);
      setState((prev) => ({
        ...prev,
        usuarios: prev.usuarios.map((u) => (u.id === usuarioId ? updated : u)),
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      setError('Error al agregar rol');
      console.error('Error adding role:', err);
      throw err;
    }
  }, []);

  const removerRol = useCallback(async (usuarioId: number, rol: Role) => {
    setLoading(true);
    try {
      const updated = await usuariosService.removerRol(usuarioId, rol);
      setState((prev) => ({
        ...prev,
        usuarios: prev.usuarios.map((u) => (u.id === usuarioId ? updated : u)),
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      setError('Error al remover rol');
      console.error('Error removing role:', err);
      throw err;
    }
  }, []);

  const resetearPassword = useCallback(
    async (usuarioId: number): Promise<{ passwordTemporal: string }> => {
      setLoading(true);
      try {
        const result = await usuariosService.resetearPassword(usuarioId);
        setState((prev) => ({ ...prev, isLoading: false }));
        return result;
      } catch (err) {
        setError('Error al resetear contraseña');
        console.error('Error resetting password:', err);
        throw err;
      }
    },
    []
  );

  const toggleUsuarioActivo = useCallback(
    async (usuarioId: number, activo: boolean) => {
      setLoading(true);
      try {
        const updated = await usuariosService.toggleUsuarioActivo(usuarioId, activo);
        setState((prev) => ({
          ...prev,
          usuarios: prev.usuarios.map((u) => (u.id === usuarioId ? updated : u)),
          isLoading: false,
          error: null,
        }));
      } catch (err) {
        setError('Error al cambiar estado del usuario');
        console.error('Error toggling user status:', err);
        throw err;
      }
    },
    []
  );

  const selectUsuario = useCallback((usuario: Usuario | null) => {
    setState((prev) => ({ ...prev, selectedUsuario: usuario }));
  }, []);

  // =========================================================================
  // RETURN
  // =========================================================================

  return {
    ...state,
    // Personal
    loadPersonal,
    loadPersonalById,
    createPersonal,
    updatePersonal,
    deletePersonal,
    selectPersonal,
    // Personal Habilidades
    loadPersonalHabilidades,
    asignarHabilidad,
    removeHabilidadPersonal,
    // Divisiones
    loadDivisiones,
    loadDivisionesArbol,
    loadDivisionById,
    createDivision,
    updateDivision,
    deleteDivision,
    selectDivision,
    // Habilidades
    loadHabilidades,
    createHabilidad,
    updateHabilidad,
    deleteHabilidad,
    selectHabilidad,
    // Asignaciones
    loadAsignaciones,
    loadAsignacionesProyecto,
    loadAsignacionesActividad,
    loadAlertasSobrecarga,
    createAsignacion,
    updateAsignacion,
    finalizarAsignacion,
    deleteAsignacion,
    selectAsignacion,
    // Coordinadores y Scrum Masters
    asignarCoordinador,
    removerCoordinador,
    asignarScrumMaster,
    removerScrumMaster,
    // Usuarios
    loadUsuarios,
    agregarRol,
    removerRol,
    resetearPassword,
    toggleUsuarioActivo,
    selectUsuario,
    // Stats
    loadStats,
    // Utils
    clearError,
    resetState,
  };
}
