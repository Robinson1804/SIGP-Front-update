'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Briefcase,
  ClipboardList,
  CheckCircle,
  Clock,
  Calendar,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPieChart, MetricCard, VelocityChart } from '@/components/charts';
import { getDashboardGeneral } from '@/features/dashboard/services';
import type {
  DashboardGeneral,
  PeriodoFiltro,
  VelocidadSprint,
} from '@/features/dashboard/types';
import { cn } from '@/lib/utils';
import { paths } from '@/lib/paths';
import Link from 'next/link';
import AppLayout from '@/components/layout/app-layout';

// Colores para estados de proyectos
const PROYECTO_STATUS_COLORS: Record<string, string> = {
  'Pendiente': '#E5E7EB',
  'En planificacion': '#BFDBFE',
  'En desarrollo': '#FDE68A',
  'Finalizado': '#A7F3D0',
  'Cancelado': '#FCA5A5',
};

// Colores para estados de actividades
const ACTIVIDAD_STATUS_COLORS: Record<string, string> = {
  'Pendiente': '#E5E7EB',
  'En desarrollo': '#FDE68A',
  'Finalizado': '#A7F3D0',
  'Cancelado': '#FCA5A5',
};

/**
 * Componente principal del Dashboard General
 */
export function DashboardContent() {
  const [data, setData] = useState<DashboardGeneral | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('mes');

  // Cargar datos del dashboard
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const dashboardData = await getDashboardGeneral({ periodo });
      setData(dashboardData);
    } catch (err: any) {
      console.error('Error cargando dashboard:', err);
      setError(err.message || 'Error al cargar el dashboard');
      // No usar datos mock - mostrar error al usuario
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Handler para cambio de periodo
  const handlePeriodoChange = (value: string) => {
    setPeriodo(value as PeriodoFiltro);
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
    });
  };

  return (
    <AppLayout breadcrumbs={[{ label: "DASHBOARD" }]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-[#D5D5D5] border-y border-[#1A5581]">
        <div className="p-2 flex items-center justify-between w-full">
          <h2 className="font-bold text-black pl-2">DASHBOARD</h2>
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
      {error && !data && (
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
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="flex items-center p-4 gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-8 w-16 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </Card>
                ))}
              </>
            ) : data ? (
              <>
                <MetricCard
                  title="Proyectos Activos"
                  value={data.proyectosActivos}
                  icon={Briefcase}
                  iconColor="text-blue-500"
                  description={`${data.totalProyectos} total`}
                />
                <MetricCard
                  title="Actividades Activas"
                  value={data.actividadesActivas}
                  icon={ClipboardList}
                  iconColor="text-green-500"
                  description={`${data.totalActividades} total`}
                />
                <MetricCard
                  title="Tareas Completadas"
                  value={data.tareasCompletadasMes}
                  icon={CheckCircle}
                  iconColor="text-emerald-500"
                  suffix="este mes"
                />
                <MetricCard
                  title="Sprints Activos"
                  value={data.sprintsActivos}
                  icon={TrendingUp}
                  iconColor="text-purple-500"
                  description={`${data.totalSprints} total`}
                />
              </>
            ) : null}
          </div>

          {/* Graficos principales */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Proyectos por estado */}
            <StatusPieChart
              data={
                data?.proyectosPorEstado.map((item) => ({
                  estado: item.estado,
                  cantidad: item.cantidad,
                  color: item.color || PROYECTO_STATUS_COLORS[item.estado] || '#9CA3AF',
                })) ?? []
              }
              title="PROYECTOS POR ESTADO"
              loading={loading}
            />

            {/* Actividades por estado */}
            <StatusPieChart
              data={
                data?.actividadesPorEstado.map((item) => ({
                  estado: item.estado,
                  cantidad: item.cantidad,
                  color: item.color || ACTIVIDAD_STATUS_COLORS[item.estado] || '#9CA3AF',
                })) ?? []
              }
              title="ACTIVIDADES POR ESTADO"
              loading={loading}
            />

            {/* Progreso general */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">PROGRESO GENERAL</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-[180px]">
                    <Skeleton className="w-32 h-32 rounded-full" />
                  </div>
                ) : data ? (
                  <div className="flex flex-col items-center justify-center h-[180px]">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="#E5E7EB"
                          strokeWidth="12"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="#004272"
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={`${(data.progresoPorcentaje / 100) * 352} 352`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold">
                          {data.progresoPorcentaje.toFixed(0)}%
                        </span>
                        <span className="text-xs text-gray-500">Completado</span>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-600 text-center">
                      <p>
                        {data.historiasTerminadas} de {data.totalHistoriasUsuario} historias
                      </p>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          {/* Proximas actividades y sprints */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Proximas actividades */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">PROXIMAS ACTIVIDADES</CardTitle>
                <Link href={paths.poi.base}>
                  <Button variant="link" size="sm" className="text-xs">
                    Ver todas
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-3/4 mb-1" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : data?.proximasActividades.length ? (
                  <div className="space-y-3">
                    {data.proximasActividades.slice(0, 5).map((actividad) => (
                      <div
                        key={actividad.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {actividad.titulo}
                          </p>
                          <p className="text-xs text-gray-500">
                            {actividad.proyecto} - {actividad.asignadoA}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              actividad.prioridad === 'Alta' && 'border-red-300 text-red-700',
                              actividad.prioridad === 'Media' && 'border-yellow-300 text-yellow-700',
                              actividad.prioridad === 'Baja' && 'border-green-300 text-green-700'
                            )}
                          >
                            {actividad.prioridad}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {formatDate(actividad.fechaVencimiento)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[150px] text-gray-500">
                    <p>No hay actividades proximas</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Proximos sprints */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">PROXIMOS SPRINTS</CardTitle>
                <Link href={paths.poi.base}>
                  <Button variant="link" size="sm" className="text-xs">
                    Ver todos
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-3/4 mb-1" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : data?.proximosSprints.length ? (
                  <div className="space-y-3">
                    {data.proximosSprints.slice(0, 5).map((sprint) => (
                      <div
                        key={sprint.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {sprint.nombre}
                          </p>
                          <p className="text-xs text-gray-500">
                            {sprint.proyecto}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-xs text-gray-600">
                            {formatDate(sprint.fechaInicio)} - {formatDate(sprint.fechaFin)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[150px] text-gray-500">
                    <p>No hay sprints proximos</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actividad reciente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ACTIVIDAD RECIENTE</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : data?.actividadReciente.length ? (
                <div className="space-y-3">
                  {data.actividadReciente.slice(0, 10).map((actividad) => (
                    <div
                      key={actividad.id}
                      className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0"
                    >
                      <div
                        className={cn(
                          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium',
                          actividad.accion === 'creado' && 'bg-green-500',
                          actividad.accion === 'actualizado' && 'bg-blue-500',
                          actividad.accion === 'cambio_estado' && 'bg-yellow-500',
                          actividad.accion === 'completado' && 'bg-emerald-500',
                          actividad.accion === 'asignado' && 'bg-purple-500',
                          actividad.accion === 'comentado' && 'bg-gray-500'
                        )}
                      >
                        {actividad.usuario.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{actividad.usuario}</span>{' '}
                          {getActionText(actividad.accion)}{' '}
                          <span className="font-medium">{actividad.entidad}</span>
                        </p>
                        {actividad.estadoNuevo && (
                          <div className="flex items-center gap-2 mt-1">
                            {actividad.estadoAnterior && (
                              <>
                                <Badge variant="outline" className="text-xs">
                                  {actividad.estadoAnterior}
                                </Badge>
                                <span className="text-gray-400">→</span>
                              </>
                            )}
                            <Badge className="text-xs bg-blue-100 text-blue-800">
                              {actividad.estadoNuevo}
                            </Badge>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimestamp(actividad.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[150px] text-gray-500">
                  <p>No hay actividad reciente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </AppLayout>
  );
}

// Helper para texto de accion
function getActionText(accion: string): string {
  const textos: Record<string, string> = {
    creado: 'ha creado',
    actualizado: 'ha actualizado',
    cambio_estado: 'ha cambiado el estado de',
    completado: 'ha completado',
    asignado: 'ha sido asignado a',
    comentado: 'ha comentado en',
  };
  return textos[accion] || accion;
}

// Helper para formatear timestamp
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} minutos`;
  if (diffHours < 24) return `Hace ${diffHours} horas`;
  if (diffDays < 7) return `Hace ${diffDays} dias`;

  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

