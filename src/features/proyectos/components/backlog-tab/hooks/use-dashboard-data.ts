'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getSprintsByProyecto,
  getSprintBurndown,
  type Sprint,
  type BurndownData,
} from '@/features/proyectos/services/sprints.service';
import {
  getBacklog,
  getHistoriasBySprint,
  type HistoriaUsuario,
} from '@/features/proyectos/services/historias.service';
import {
  getEpicasByProyecto,
  type Epica,
} from '@/features/proyectos/services/epicas.service';
import { getTareasByHistoria, type Tarea } from '@/features/proyectos/services/tareas.service';

// ============================================
// TIPOS
// ============================================

/**
 * Tarjetas de resumen del dashboard
 */
export interface SummaryCards {
  finalizadas: number;
  enProgreso: number;
  creadas: number;
  porVencer: number;
}

/**
 * Estadisticas por estado
 */
export interface EstadoStats {
  estado: string;
  cantidad: number;
  color: string;
}

/**
 * Estadisticas por prioridad
 */
export interface PrioridadStats {
  prioridad: string;
  cantidad: number;
  color: string;
}

/**
 * Datos de progreso
 */
export interface ProgressData {
  epicas: { total: number; completadas: number; porcentaje: number };
  historias: { total: number; completadas: number; porcentaje: number };
  tareas: { total: number; completadas: number; porcentaje: number };
}

/**
 * Datos de velocidad por sprint
 */
export interface VelocityData {
  sprint: string;
  numero: number;
  planificado: number;
  completado: number;
}

/**
 * Actividad reciente
 */
export interface ActivityItem {
  id: number;
  tipo: 'tarea' | 'historia' | 'sprint';
  accion: string;
  objeto: string;
  usuario: string;
  fecha: string;
}

/**
 * Resultado del hook useDashboardData
 */
export interface UseDashboardDataReturn {
  // Data
  summaryCards: SummaryCards;
  estadoStats: EstadoStats[];
  prioridadStats: PrioridadStats[];
  progressData: ProgressData;
  burndownData: BurndownData | null;
  velocityData: VelocityData[];
  activityFeed: ActivityItem[];
  activeSprint: Sprint | null;

  // Loading states
  isLoading: boolean;
  isLoadingBurndown: boolean;

  // Error
  error: string | null;

  // Actions
  refresh: () => Promise<void>;
}

// Colores para estados
const estadoColors: Record<string, string> = {
  // Estados de Historia de Usuario
  'Pendiente': '#9CA3AF',
  'En analisis': '#60A5FA',
  'Lista': '#34D399',
  'En desarrollo': '#FBBF24',
  'En pruebas': '#A78BFA',
  'En revision': '#F59E0B',
  'Terminada': '#10B981',
  // Estados de Tarea
  'Por hacer': '#9CA3AF',
  'En progreso': '#3B82F6',
  'Finalizado': '#10B981',
};

// Colores para prioridades
const prioridadColors: Record<string, string> = {
  Must: '#EF4444',
  Should: '#F97316',
  Could: '#FBBF24',
  Wont: '#9CA3AF',
  Alta: '#EF4444',
  Media: '#F59E0B',
  Baja: '#10B981',
};

// ============================================
// HOOK
// ============================================

export function useDashboardData(proyectoId: number): UseDashboardDataReturn {
  const [summaryCards, setSummaryCards] = useState<SummaryCards>({
    finalizadas: 0,
    enProgreso: 0,
    creadas: 0,
    porVencer: 0,
  });
  const [estadoStats, setEstadoStats] = useState<EstadoStats[]>([]);
  const [prioridadStats, setPrioridadStats] = useState<PrioridadStats[]>([]);
  const [progressData, setProgressData] = useState<ProgressData>({
    epicas: { total: 0, completadas: 0, porcentaje: 0 },
    historias: { total: 0, completadas: 0, porcentaje: 0 },
    tareas: { total: 0, completadas: 0, porcentaje: 0 },
  });
  const [burndownData, setBurndownData] = useState<BurndownData | null>(null);
  const [velocityData, setVelocityData] = useState<VelocityData[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBurndown, setIsLoadingBurndown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calcular metricas del dashboard
   */
  const calculateDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Cargar datos en paralelo
      const [sprintsData, epicas, backlogData] = await Promise.all([
        getSprintsByProyecto(proyectoId),
        getEpicasByProyecto(proyectoId),
        getBacklog(proyectoId),
      ]);

      // Obtener sprint activo
      const sprintActivo = sprintsData.find((s) => s.estado === 'Activo');
      setActiveSprint(sprintActivo || null);

      // Cargar historias de todos los sprints activos/planificados
      const activeSprints = sprintsData.filter(
        (s) => s.estado === 'Activo' || s.estado === 'Planificado'
      );

      const allHistorias: HistoriaUsuario[] = [...backlogData.backlog];
      for (const sprint of activeSprints) {
        try {
          const sprintHistorias = await getHistoriasBySprint(sprint.id);
          allHistorias.push(...sprintHistorias);
        } catch {
          // Ignorar errores de sprints individuales
        }
      }

      // Cargar tareas de todas las historias
      let allTareas: Tarea[] = [];
      for (const historia of allHistorias) {
        try {
          const tareas = await getTareasByHistoria(historia.id);
          allTareas.push(...tareas);
        } catch {
          // Ignorar errores
        }
      }

      // Calcular summary cards
      const ahora = new Date();
      const enUnaSemana = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000);

      const tareasFinalizadas = allTareas.filter((t) => t.estado === 'Finalizado').length;
      const tareasEnProgreso = allTareas.filter(
        (t) => t.estado === 'En progreso' || t.estado === 'En revision'
      ).length;
      const tareasCreadasHoy = allTareas.filter((t) => {
        const created = new Date(t.createdAt);
        return created.toDateString() === ahora.toDateString();
      }).length;
      const tareasPorVencer = allTareas.filter((t) => {
        if (!t.fechaLimite || t.estado === 'Finalizado') return false;
        const limite = new Date(t.fechaLimite);
        return limite <= enUnaSemana && limite >= ahora;
      }).length;

      setSummaryCards({
        finalizadas: tareasFinalizadas,
        enProgreso: tareasEnProgreso,
        creadas: tareasCreadasHoy,
        porVencer: tareasPorVencer,
      });

      // Calcular estadisticas por estado de tareas
      const estadoCounts: Record<string, number> = {};
      allTareas.forEach((t) => {
        estadoCounts[t.estado] = (estadoCounts[t.estado] || 0) + 1;
      });

      setEstadoStats(
        Object.entries(estadoCounts).map(([estado, cantidad]) => ({
          estado,
          cantidad,
          color: estadoColors[estado] || '#9CA3AF',
        }))
      );

      // Calcular estadisticas por prioridad de tareas
      const prioridadCounts: Record<string, number> = {};
      allTareas.forEach((t) => {
        prioridadCounts[t.prioridad] = (prioridadCounts[t.prioridad] || 0) + 1;
      });

      setPrioridadStats(
        Object.entries(prioridadCounts).map(([prioridad, cantidad]) => ({
          prioridad,
          cantidad,
          color: prioridadColors[prioridad] || '#9CA3AF',
        }))
      );

      // Calcular progreso
      const epicasCompletadas = epicas.filter(
        (e) => e.estado === 'Completada'
      ).length;
      const historiasCompletadas = allHistorias.filter(
        (h) => h.estado === 'Terminada'
      ).length;

      setProgressData({
        epicas: {
          total: epicas.length,
          completadas: epicasCompletadas,
          porcentaje: epicas.length > 0
            ? Math.round((epicasCompletadas / epicas.length) * 100)
            : 0,
        },
        historias: {
          total: allHistorias.length,
          completadas: historiasCompletadas,
          porcentaje: allHistorias.length > 0
            ? Math.round((historiasCompletadas / allHistorias.length) * 100)
            : 0,
        },
        tareas: {
          total: allTareas.length,
          completadas: tareasFinalizadas,
          porcentaje: allTareas.length > 0
            ? Math.round((tareasFinalizadas / allTareas.length) * 100)
            : 0,
        },
      });

      // Calcular velocity data (sprints completados)
      const sprintsCompletados = sprintsData
        .filter((s) => s.estado === 'Completado')
        .sort((a, b) => a.numero - b.numero)
        .slice(-5); // Ultimos 5 sprints

      setVelocityData(
        sprintsCompletados.map((s) => ({
          sprint: `Sprint ${s.numero}`,
          numero: s.numero,
          planificado: s.velocidadPlanificada || 0,
          completado: s.velocidadReal || s.puntosCompletados || 0,
        }))
      );

      // Generar activity feed (simulado basado en datos recientes)
      const recentActivities: ActivityItem[] = [];

      // Ordenar tareas por fecha de actualizacion
      const sortedTareas = [...allTareas]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 10);

      sortedTareas.forEach((tarea, index) => {
        recentActivities.push({
          id: tarea.id,
          tipo: 'tarea',
          accion:
            tarea.estado === 'Finalizado'
              ? 'finalizo'
              : tarea.estado === 'En progreso'
              ? 'inicio'
              : 'actualizo',
          objeto: tarea.nombre,
          usuario: tarea.responsable?.nombre || 'Usuario',
          fecha: tarea.updatedAt,
        });
      });

      setActivityFeed(recentActivities.slice(0, 8));

      // Cargar burndown del sprint activo
      if (sprintActivo) {
        setIsLoadingBurndown(true);
        try {
          const burndown = await getSprintBurndown(sprintActivo.id);
          setBurndownData(burndown);
        } catch {
          // Burndown puede no estar disponible
          setBurndownData(null);
        } finally {
          setIsLoadingBurndown(false);
        }
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [proyectoId]);

  /**
   * Refrescar datos
   */
  const refresh = useCallback(async () => {
    await calculateDashboardData();
  }, [calculateDashboardData]);

  // Cargar datos al montar
  useEffect(() => {
    if (proyectoId) {
      calculateDashboardData();
    }
  }, [proyectoId, calculateDashboardData]);

  return {
    summaryCards,
    estadoStats,
    prioridadStats,
    progressData,
    burndownData,
    velocityData,
    activityFeed,
    activeSprint,
    isLoading,
    isLoadingBurndown,
    error,
    refresh,
  };
}
