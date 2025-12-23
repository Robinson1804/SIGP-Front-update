'use client';

/**
 * Dashboard de Actividad Individual
 *
 * Vista detallada de métricas Kanban para una actividad específica
 */

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { paths } from '@/lib/paths';
import {
  DashboardLayout,
  DashboardSection,
  TendenciasChart,
  ExportDashboardButton,
} from '@/features/dashboard/components';
import { CfdChart, MetricTrendChart } from '@/components/charts';
import { metricasService, dashboardService } from '@/features/dashboard/services';
import type {
  MetricasActividad,
  CfdDataPoint,
  TendenciaMetrica,
} from '@/features/dashboard/types';

export default function DashboardActividadPage() {
  const params = useParams();
  const actividadId = params.id as string;

  const [metricas, setMetricas] = useState<MetricasActividad | null>(null);
  const [cfdData, setCfdData] = useState<CfdDataPoint[]>([]);
  const [tendenciasData, setTendenciasData] = useState<{
    data: TendenciaMetrica[];
    promedios: { leadTime: number; cycleTime: number; throughput: number };
    tendencias: {
      leadTime: 'mejorando' | 'empeorando' | 'estable';
      cycleTime: 'mejorando' | 'empeorando' | 'estable';
      throughput: 'mejorando' | 'empeorando' | 'estable';
    };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [metricasData, cfdResponse, tendenciasResponse] = await Promise.all([
        metricasService.getMetricasByActividad(actividadId).catch(() => null),
        dashboardService.getCfdData(actividadId, 30).catch(() => ({ data: [] })),
        dashboardService.getTendenciasMetricasActividad(actividadId, 8).catch(() => null),
      ]);

      setMetricas(metricasData);
      setCfdData(cfdResponse.data);
      setTendenciasData(tendenciasResponse);
    } catch (err) {
      setError('Error al cargar el dashboard de la actividad');
      console.error('Error loading activity dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [actividadId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive font-medium">{error}</p>
          <Button variant="outline" className="mt-4" onClick={loadDashboard}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={paths.poi.actividad.tablero}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Actividad
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard de Actividad</h1>
            <p className="text-sm text-muted-foreground">
              Métricas Kanban y flujo de trabajo
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadDashboard}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <ExportDashboardButton />
        </div>
      </div>

      {/* Métricas Kanban */}
      {metricas && (
        <>
          <DashboardSection title="Métricas de Flujo">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Lead Time Promedio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metricas.leadTimePromedio?.toFixed(1) || 0} días
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Desde solicitud hasta entrega
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Cycle Time Promedio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metricas.cycleTimePromedio?.toFixed(1) || 0} días
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Desde inicio hasta finalización
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Throughput
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metricas.throughput || 0} tareas/semana
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tareas completadas por semana
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    WIP Actual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metricas.wipActual || 0}
                    {metricas.wipLimit && (
                      <span className="text-sm font-normal text-muted-foreground">
                        {' '}
                        / {metricas.wipLimit}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Trabajo en progreso
                  </p>
                </CardContent>
              </Card>
            </div>
          </DashboardSection>

          {/* Estado de Tareas */}
          <DashboardSection title="Distribución de Tareas">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Por Estado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metricas.tareasPorEstado?.map((item) => (
                      <div key={item.estado} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: item.color || '#6b7280' }}
                          />
                          <span className="text-sm">{item.estado}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.cantidad}</span>
                          <span className="text-xs text-muted-foreground">
                            ({item.porcentaje}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Subtareas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Subtareas</span>
                      <span className="font-medium">{metricas.subtareasTotal || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Completadas</span>
                      <span className="font-medium text-green-600">
                        {metricas.subtareasCompletadas || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pendientes</span>
                      <span className="font-medium text-yellow-600">
                        {(metricas.subtareasTotal || 0) - (metricas.subtareasCompletadas || 0)}
                      </span>
                    </div>
                    {metricas.subtareasTotal > 0 && (
                      <div className="pt-2">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all duration-300"
                            style={{
                              width: `${((metricas.subtareasCompletadas || 0) / metricas.subtareasTotal) * 100}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-right">
                          {(((metricas.subtareasCompletadas || 0) / metricas.subtareasTotal) * 100).toFixed(0)}% completado
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </DashboardSection>

          {/* Tendencias de Flujo */}
          {metricas.tendenciasFlujo && (
            <DashboardSection title="Tendencias de Flujo">
              <TendenciasChart data={metricas.tendenciasFlujo} />
            </DashboardSection>
          )}

        </>
      )}

      {/* CFD y Tendencias de Metricas - siempre visible */}
      <DashboardSection title="Analisis de Flujo">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CfdChart
            data={cfdData}
            loading={isLoading}
          />
          <MetricTrendChart
            data={tendenciasData?.data || []}
            promedios={tendenciasData?.promedios}
            tendencias={tendenciasData?.tendencias}
            loading={isLoading}
          />
        </div>
      </DashboardSection>
    </DashboardLayout>
  );
}
