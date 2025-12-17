/**
 * Custom hook for dashboard data management
 *
 * Centraliza la lógica de carga y gestión del estado del dashboard
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getDashboardGeneral,
  getDashboardResumen,
  getProyectosPorEstado,
  getAvancePorOEI,
  getAlertasDashboard,
  getTendencias,
} from '../services/dashboard.service';
import type {
  DashboardGeneral,
  DashboardResumen,
  ProyectoPorEstado,
  AvanceOEI,
  Alerta,
  TendenciaData,
  DashboardFiltros,
} from '../types';

interface UseDashboardOptions {
  filtros?: DashboardFiltros;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

interface UseDashboardReturn {
  // Data
  dashboardGeneral: DashboardGeneral | null;
  dashboardResumen: DashboardResumen | null;
  proyectosPorEstado: ProyectoPorEstado[];
  avancePorOEI: AvanceOEI[];
  alertas: Alerta[];
  tendencias: TendenciaData[];

  // Loading states
  loading: boolean;
  loadingGeneral: boolean;
  loadingResumen: boolean;
  loadingProyectos: boolean;
  loadingOEI: boolean;
  loadingAlertas: boolean;
  loadingTendencias: boolean;

  // Errors
  error: string | null;
  errors: {
    general?: string;
    resumen?: string;
    proyectos?: string;
    oei?: string;
    alertas?: string;
    tendencias?: string;
  };

  // Actions
  refresh: () => Promise<void>;
  refreshGeneral: () => Promise<void>;
  refreshResumen: () => Promise<void>;
  refreshProyectos: () => Promise<void>;
  refreshOEI: () => Promise<void>;
  refreshAlertas: () => Promise<void>;
  refreshTendencias: () => Promise<void>;
}

/**
 * Hook personalizado para gestión del dashboard
 *
 * @param options - Opciones de configuración
 * @returns Estado y funciones del dashboard
 */
export function useDashboard(options: UseDashboardOptions = {}): UseDashboardReturn {
  const { filtros, autoRefresh = false, refreshInterval = 300000 } = options; // 5 min default

  // State
  const [dashboardGeneral, setDashboardGeneral] = useState<DashboardGeneral | null>(null);
  const [dashboardResumen, setDashboardResumen] = useState<DashboardResumen | null>(null);
  const [proyectosPorEstado, setProyectosPorEstado] = useState<ProyectoPorEstado[]>([]);
  const [avancePorOEI, setAvancePorOEI] = useState<AvanceOEI[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [tendencias, setTendencias] = useState<TendenciaData[]>([]);

  // Loading states
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  const [loadingResumen, setLoadingResumen] = useState(false);
  const [loadingProyectos, setLoadingProyectos] = useState(false);
  const [loadingOEI, setLoadingOEI] = useState(false);
  const [loadingAlertas, setLoadingAlertas] = useState(false);
  const [loadingTendencias, setLoadingTendencias] = useState(false);

  // Error states
  const [errors, setErrors] = useState<{
    general?: string;
    resumen?: string;
    proyectos?: string;
    oei?: string;
    alertas?: string;
    tendencias?: string;
  }>({});

  // Computed loading state
  const loading =
    loadingGeneral ||
    loadingResumen ||
    loadingProyectos ||
    loadingOEI ||
    loadingAlertas ||
    loadingTendencias;

  // Computed error state
  const error = Object.values(errors).find((e) => e) || null;

  // Fetch functions
  const refreshGeneral = useCallback(async () => {
    setLoadingGeneral(true);
    setErrors((prev) => ({ ...prev, general: undefined }));

    try {
      const data = await getDashboardGeneral(filtros);
      setDashboardGeneral(data);
    } catch (err: any) {
      console.error('Error loading dashboard general:', err);
      setErrors((prev) => ({ ...prev, general: err.message }));
    } finally {
      setLoadingGeneral(false);
    }
  }, [filtros]);

  const refreshResumen = useCallback(async () => {
    setLoadingResumen(true);
    setErrors((prev) => ({ ...prev, resumen: undefined }));

    try {
      const data = await getDashboardResumen(filtros);
      setDashboardResumen(data);
    } catch (err: any) {
      console.error('Error loading dashboard resumen:', err);
      setErrors((prev) => ({ ...prev, resumen: err.message }));
    } finally {
      setLoadingResumen(false);
    }
  }, [filtros]);

  const refreshProyectos = useCallback(async () => {
    setLoadingProyectos(true);
    setErrors((prev) => ({ ...prev, proyectos: undefined }));

    try {
      const data = await getProyectosPorEstado();
      setProyectosPorEstado(data);
    } catch (err: any) {
      console.error('Error loading proyectos por estado:', err);
      setErrors((prev) => ({ ...prev, proyectos: err.message }));
    } finally {
      setLoadingProyectos(false);
    }
  }, []);

  const refreshOEI = useCallback(async () => {
    setLoadingOEI(true);
    setErrors((prev) => ({ ...prev, oei: undefined }));

    try {
      const data = await getAvancePorOEI();
      setAvancePorOEI(data);
    } catch (err: any) {
      console.error('Error loading avance por OEI:', err);
      setErrors((prev) => ({ ...prev, oei: err.message }));
    } finally {
      setLoadingOEI(false);
    }
  }, []);

  const refreshAlertas = useCallback(async () => {
    setLoadingAlertas(true);
    setErrors((prev) => ({ ...prev, alertas: undefined }));

    try {
      const data = await getAlertasDashboard();
      setAlertas(data);
    } catch (err: any) {
      console.error('Error loading alertas:', err);
      setErrors((prev) => ({ ...prev, alertas: err.message }));
    } finally {
      setLoadingAlertas(false);
    }
  }, []);

  const refreshTendencias = useCallback(async () => {
    setLoadingTendencias(true);
    setErrors((prev) => ({ ...prev, tendencias: undefined }));

    try {
      const data = await getTendencias(filtros?.periodo || 'mes');
      setTendencias(data);
    } catch (err: any) {
      console.error('Error loading tendencias:', err);
      setErrors((prev) => ({ ...prev, tendencias: err.message }));
    } finally {
      setLoadingTendencias(false);
    }
  }, [filtros?.periodo]);

  // Refresh all
  const refresh = useCallback(async () => {
    await Promise.all([
      refreshGeneral(),
      refreshResumen(),
      refreshProyectos(),
      refreshOEI(),
      refreshAlertas(),
      refreshTendencias(),
    ]);
  }, [
    refreshGeneral,
    refreshResumen,
    refreshProyectos,
    refreshOEI,
    refreshAlertas,
    refreshTendencias,
  ]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh]);

  return {
    // Data
    dashboardGeneral,
    dashboardResumen,
    proyectosPorEstado,
    avancePorOEI,
    alertas,
    tendencias,

    // Loading states
    loading,
    loadingGeneral,
    loadingResumen,
    loadingProyectos,
    loadingOEI,
    loadingAlertas,
    loadingTendencias,

    // Errors
    error,
    errors,

    // Actions
    refresh,
    refreshGeneral,
    refreshResumen,
    refreshProyectos,
    refreshOEI,
    refreshAlertas,
    refreshTendencias,
  };
}
