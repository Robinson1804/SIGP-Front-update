'use client';

/**
 * Dashboard de Proyecto Individual
 *
 * Vista detallada de métricas y KPIs de un proyecto específico
 */

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { paths } from '@/lib/paths';
import {
  DashboardLayout,
  DashboardSection,
  KPICards,
  SaludProyectoCard,
  TendenciasChart,
  ExportDashboardButton,
} from '@/features/dashboard/components';
import { dashboardService, metricasService } from '@/features/dashboard/services';
import type {
  DashboardSummary,
  MetricasProyecto,
  SaludProyecto,
} from '@/features/dashboard/types';

export default function DashboardProyectoPage() {
  const params = useParams();
  const proyectoId = params.id as string;

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [metricas, setMetricas] = useState<MetricasProyecto | null>(null);
  const [salud, setSalud] = useState<SaludProyecto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [summaryData, metricasData, saludData] = await Promise.all([
        dashboardService.getSummary(),
        metricasService.getMetricasByProyecto(proyectoId),
        dashboardService.getSaludProyecto(proyectoId),
      ]);

      setSummary(summaryData);
      setMetricas(metricasData);
      setSalud(saludData);
    } catch (err) {
      setError('Error al cargar el dashboard del proyecto');
      console.error('Error loading project dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [proyectoId]);

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
          <Link href={paths.poi.proyecto.detalles}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Proyecto
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard del Proyecto</h1>
            <p className="text-sm text-muted-foreground">
              Métricas y KPIs detallados del proyecto
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

      {/* KPIs del Proyecto */}
      {metricas && (
        <DashboardSection title="Indicadores Clave">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Sprints Completados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metricas.sprintsCompletados} / {metricas.sprintsTotal}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Velocidad Promedio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metricas.velocidadPromedio?.toFixed(1) || 0} pts
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Historias Completadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metricas.historiasCompletadas} / {metricas.historiasTotal}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Progreso General
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metricas.progresoGeneral}%</div>
              </CardContent>
            </Card>
          </div>
        </DashboardSection>
      )}

      {/* Salud del Proyecto */}
      {salud && (
        <DashboardSection title="Estado de Salud">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SaludProyectoCard data={salud} />
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recomendaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {salud.recomendaciones?.map((recomendacion, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      <span className="text-sm">{recomendacion}</span>
                    </li>
                  ))}
                  {(!salud.recomendaciones || salud.recomendaciones.length === 0) && (
                    <li className="text-sm text-muted-foreground">
                      No hay recomendaciones
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </DashboardSection>
      )}

      {/* Tendencias */}
      {metricas?.tendencias && (
        <DashboardSection title="Tendencias">
          <TendenciasChart data={metricas.tendencias} />
        </DashboardSection>
      )}
    </DashboardLayout>
  );
}
