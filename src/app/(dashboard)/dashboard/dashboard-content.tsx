'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Layers,
  TrendingUp,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPieChart } from '@/components/charts';
import { KpiCardEnhanced } from '@/components/charts/kpi-card-enhanced';
import { GanttTimeline } from '@/components/charts/gantt-timeline';
import {
  ProyectosActivosTable,
  ActividadesActivasTable,
  SaludProyectosDonut,
} from '@/features/dashboard/components';
import {
  getKpisGerenciales,
  getProyectosActivos,
  getActividadesActivas,
  getSprintsTimeline,
  getSaludProyectosDetallada,
} from '@/features/dashboard/services';
import type {
  KpisGerenciales,
  ProyectoActivo,
  ActividadActiva,
  SprintTimeline,
  SaludProyectosDetallada,
  PeriodoFiltro,
} from '@/features/dashboard/types';
import { cn } from '@/lib/utils';
import { paths } from '@/lib/paths';
import AppLayout from '@/components/layout/app-layout';

/**
 * Dashboard Gerencial - Vision Ejecutiva
 *
 * Muestra KPIs, salud de proyectos, tablas de proyectos/actividades activas,
 * y timeline de sprints para la toma de decisiones.
 */
export function DashboardContent() {
  const router = useRouter();

  // State
  const [kpis, setKpis] = useState<KpisGerenciales | null>(null);
  const [proyectos, setProyectos] = useState<ProyectoActivo[]>([]);
  const [actividades, setActividades] = useState<ActividadActiva[]>([]);
  const [sprints, setSprints] = useState<SprintTimeline[]>([]);
  const [saludProyectos, setSaludProyectos] = useState<SaludProyectosDetallada | null>(null);
  const [sprintsRango, setSprintsRango] = useState<{ inicio: string; fin: string } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('mes');

  // Cargar datos del dashboard
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [kpisData, proyectosData, actividadesData, sprintsData, saludData] =
        await Promise.all([
          getKpisGerenciales().catch(() => null),
          getProyectosActivos({ limit: 10 }).catch(() => ({ data: [], total: 0, page: 1, limit: 10 })),
          getActividadesActivas({ limit: 10 }).catch(() => ({ data: [], total: 0, page: 1, limit: 10 })),
          getSprintsTimeline(3).catch(() => ({ data: [], rangoInicio: '', rangoFin: '' })),
          getSaludProyectosDetallada().catch(() => null),
        ]);

      setKpis(kpisData);
      setProyectos(proyectosData.data);
      setActividades(actividadesData.data);
      setSprints(sprintsData.data);
      setSprintsRango(
        sprintsData.rangoInicio
          ? { inicio: sprintsData.rangoInicio, fin: sprintsData.rangoFin }
          : null
      );
      setSaludProyectos(saludData);
    } catch (err: any) {
      console.error('Error cargando dashboard:', err);
      setError(err.message || 'Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Handler para cambio de periodo
  const handlePeriodoChange = (value: string) => {
    setPeriodo(value as PeriodoFiltro);
    // Note: In a full implementation, this would refetch data with the new period
  };

  // Navigation handlers
  const handleViewAllProyectos = () => {
    router.push(`${paths.poi.base}?tipo=Proyecto`);
  };

  const handleViewAllActividades = () => {
    router.push(`${paths.poi.base}?tipo=Actividad`);
  };

  const handleSprintClick = (sprint: SprintTimeline) => {
    router.push(paths.poi.proyectos.detalles(sprint.proyectoId));
  };

  // Default KPIs for loading/error state
  const defaultKpi = {
    valor: 0,
    variacion: 0,
    tendencia: 'stable' as const,
    detalles: {},
  };

  return (
    <AppLayout breadcrumbs={[{ label: 'DASHBOARD' }]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-[#D5D5D5] border-y border-[#1A5581]">
          <div className="p-2 flex items-center justify-between w-full">
            <h2 className="font-bold text-black pl-2">DASHBOARD GERENCIAL</h2>
            <div className="flex items-center gap-2 pr-2">
              <Select value={periodo} onValueChange={handlePeriodoChange}>
                <SelectTrigger className="w-[140px] h-8 bg-white">
                  <SelectValue placeholder="Periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semana">Esta semana</SelectItem>
                  <SelectItem value="mes">Este mes</SelectItem>
                  <SelectItem value="trimestre">Trimestre</SelectItem>
                  <SelectItem value="anno">Este anio</SelectItem>
                  <SelectItem value="todo">Todo</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                onClick={loadDashboard}
                disabled={loading}
                className="h-8"
              >
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              </Button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="font-medium text-red-800">Error al cargar datos</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={loadDashboard}
              className="ml-auto"
            >
              Reintentar
            </Button>
          </div>
        )}

        <div className="flex-1 bg-[#F9F9F9] px-4 pb-4">
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCardEnhanced
                title="Proyectos"
                kpi={kpis?.proyectos || defaultKpi}
                icon={Briefcase}
                iconColor="text-blue-600"
                loading={loading}
                onClick={() => router.push(`${paths.poi.base}?tipo=Proyecto`)}
              />
              <KpiCardEnhanced
                title="Actividades"
                kpi={kpis?.actividades || defaultKpi}
                icon={Layers}
                iconColor="text-green-600"
                loading={loading}
                onClick={() => router.push(`${paths.poi.base}?tipo=Actividad`)}
              />
              <KpiCardEnhanced
                title="Sprints Activos"
                kpi={kpis?.sprintsActivos || defaultKpi}
                icon={TrendingUp}
                iconColor="text-purple-600"
                loading={loading}
              />
              <KpiCardEnhanced
                title="Tareas del Dia"
                kpi={kpis?.tareasDelDia || defaultKpi}
                icon={CheckCircle2}
                iconColor="text-emerald-600"
                loading={loading}
              />
            </div>

            {/* Salud de Proyectos y Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Salud de Proyectos */}
              <SaludProyectosDonut
                data={saludProyectos}
                loading={loading}
                className="lg:col-span-1"
                onSegmentClick={(salud, proyectos) => {
                  console.log('Proyectos', salud, proyectos);
                  // Could show a modal with project list
                }}
              />

              {/* Timeline de Sprints */}
              <GanttTimeline
                data={sprints}
                rangoInicio={sprintsRango?.inicio}
                rangoFin={sprintsRango?.fin}
                loading={loading}
                className="lg:col-span-2"
                onSprintClick={handleSprintClick}
              />
            </div>

            {/* Proyectos Activos */}
            <ProyectosActivosTable
              data={proyectos}
              loading={loading}
              maxItems={5}
              onViewAll={handleViewAllProyectos}
            />

            {/* Actividades Activas */}
            <ActividadesActivasTable
              data={actividades}
              loading={loading}
              maxItems={5}
              onViewAll={handleViewAllActividades}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
