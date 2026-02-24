'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getSprintsByProyecto,
  getSprintsBySubproyecto,
  getSprintBurndown,
  type Sprint,
  type BurndownData,
} from '@/features/proyectos/services/sprints.service';
import {
  getBacklog,
  getBacklogBySubproyecto,
  getHistoriasBySprint,
  type HistoriaUsuario,
} from '@/features/proyectos/services/historias.service';
import {
  getEpicasByProyecto,
  getEpicasBySubproyecto,
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
  codigo: string;
  estado: string;
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
  'En revisión': '#F59E0B',
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

export function useDashboardData(proyectoId: number, subproyectoId?: number): UseDashboardDataReturn {
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
        subproyectoId ? getSprintsBySubproyecto(subproyectoId) : getSprintsByProyecto(proyectoId),
        subproyectoId ? getEpicasBySubproyecto(subproyectoId) : getEpicasByProyecto(proyectoId),
        subproyectoId ? getBacklogBySubproyecto(subproyectoId) : getBacklog(proyectoId),
      ]);

      // Helper para verificar estados (soporta ambos formatos)
      const isEnProgreso = (estado: string) => estado === 'En progreso' || estado === 'Activo';
      const isPorHacer = (estado: string) => estado === 'Por hacer' || estado === 'Planificado';

      // Obtener sprint activo
      const sprintActivo = sprintsData.find((s) => isEnProgreso(s.estado));
      setActiveSprint(sprintActivo || null);

      // Cargar historias de TODOS los sprints (incluyendo finalizados)
      const allHistorias: HistoriaUsuario[] = [...backlogData.backlog];
      for (const sprint of sprintsData) {
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
      const husFinalizadas = allHistorias.filter((h) => h.estado === 'Finalizado').length;
      const husEnProgreso = allHistorias.filter(
        (h) => h.estado === 'En progreso' || h.estado === 'En revisión'
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
        finalizadas: husFinalizadas,
        enProgreso: husEnProgreso,
        creadas: tareasCreadasHoy,
        porVencer: tareasPorVencer,
      });

      // Calcular estadisticas por estado de HUs (Historias de Usuario)
      const estadoCounts: Record<string, number> = {};
      allHistorias.forEach((h) => {
        estadoCounts[h.estado] = (estadoCounts[h.estado] || 0) + 1;
      });

      setEstadoStats(
        Object.entries(estadoCounts).map(([estado, cantidad]) => ({
          estado,
          cantidad,
          color: estadoColors[estado] || '#9CA3AF',
        }))
      );

      // Calcular estadisticas por prioridad de HUs (Historias de Usuario)
      const prioridadCounts: Record<string, number> = {};
      allHistorias.forEach((h) => {
        if (h.prioridad) {
          prioridadCounts[h.prioridad] = (prioridadCounts[h.prioridad] || 0) + 1;
        }
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
        (e) => e.estado === 'Finalizado'
      ).length;
      const historiasCompletadas = allHistorias.filter(
        (h) => h.estado === 'Finalizado'
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
      const isFinalizado = (estado: string) => estado === 'Finalizado' || estado === 'Completado';
      const sprintsCompletados = sprintsData
        .filter((s) => isFinalizado(s.estado))
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

      // Generar activity feed basado en HUs y Tareas recientes
      const recentActivities: ActivityItem[] = [];

      // Agregar HUs recientes
      const sortedHistorias = [...allHistorias]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 10);

      sortedHistorias.forEach((historia) => {
        const accion =
          historia.estado === 'Finalizado' ? 'ha finalizado' :
          historia.estado === 'En progreso' ? 'ha iniciado' :
          historia.estado === 'En revisión' ? 'ha enviado a revisión' :
          new Date(historia.createdAt).getTime() === new Date(historia.updatedAt).getTime() ? 'ha creado' : 'ha actualizado';

        recentActivities.push({
          id: historia.id,
          tipo: 'historia',
          accion,
          objeto: historia.titulo,
          codigo: historia.codigo || `HU-${historia.id}`,
          estado: historia.estado,
          usuario: historia.asignadoANombre || 'Usuario',
          fecha: historia.updatedAt,
        });
      });

      // Agregar Tareas recientes
      const sortedTareas = [...allTareas]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 10);

      sortedTareas.forEach((tarea) => {
        const accion =
          tarea.estado === 'Finalizado' ? 'ha finalizado' :
          tarea.estado === 'En progreso' ? 'ha iniciado' :
          tarea.estado === 'En revisión' ? 'ha enviado a revisión' :
          new Date(tarea.createdAt).getTime() === new Date(tarea.updatedAt).getTime() ? 'ha creado' : 'ha actualizado';

        recentActivities.push({
          id: tarea.id,
          tipo: 'tarea',
          accion,
          objeto: tarea.nombre,
          codigo: tarea.codigo || `T-${tarea.id}`,
          estado: tarea.estado,
          usuario: tarea.responsable?.nombre || 'Usuario',
          fecha: tarea.updatedAt,
        });
      });

      // Ordenar todas las actividades por fecha y tomar las 8 más recientes
      recentActivities.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
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
  }, [proyectoId, subproyectoId]);

  /**
   * Refrescar datos
   */
  const refresh = useCallback(async () => {
    await calculateDashboardData();
  }, [calculateDashboardData]);

  // Cargar datos al montar
  useEffect(() => {
    if (proyectoId || subproyectoId) {
      calculateDashboardData();
    }
  }, [proyectoId, subproyectoId, calculateDashboardData]);

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
