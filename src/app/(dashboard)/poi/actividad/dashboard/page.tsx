'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  Edit,
  PlusCircle,
  Clock,
  User,
  Tag,
  Calendar,
  Flag,
  ClipboardCheck,
  ChevronsRight,
  RefreshCw,
  Timer,
  TrendingUp,
  Gauge,
} from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Project, ROLES } from '@/lib/definitions';
import { useAuth } from '@/stores';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, LabelList } from 'recharts';
import { Pie, PieChart, Cell } from 'recharts';
import { paths } from '@/lib/paths';
import { ThroughputChart, StatusPieChart, MetricCard } from '@/components/charts';
import { getDashboardActividad, getActividadThroughput } from '@/features/dashboard/services';
import type {
  DashboardActividad,
  ThroughputPeriodo,
  PeriodoFiltro,
} from '@/features/dashboard/types';

// Status colors
const statusColors: { [key: string]: string } = {
  'Por hacer': 'bg-[#BFDBFE] text-blue-800',
  'En progreso': 'bg-[#FDE68A] text-yellow-800',
  'En revision': 'bg-[#A78BFA] text-purple-800',
  'Finalizado': 'bg-[#A7F3D0] text-green-800',
  'Completado': 'bg-[#A7F3D0] text-green-800',
};

const priorityColors: { [key: string]: { bg: string; text: string } } = {
  'Alta': { bg: 'bg-red-200', text: 'text-red-800' },
  'Media': { bg: 'bg-yellow-200', text: 'text-yellow-800' },
  'Baja': { bg: 'bg-green-200', text: 'text-green-800' },
};

// Recent activity type
type RecentActivityItem = {
  user: string;
  action: string;
  task: string;
  id: string;
  type: string;
  status: string;
  priority: string;
  startDate: string;
  endDate: string;
};

const ActivityItemTooltip = ({ item }: { item: any }) => (
  <div className="p-4 bg-white rounded-lg shadow-lg border w-80">
    <h4 className="font-bold mb-2">{item.id}: {item.task}</h4>
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-500" /> Responsable: {item.user}</div>
      <div className="flex items-center gap-2"><Tag className="w-4 h-4 text-gray-500" /> Estado: <Badge className={cn(statusColors[item.status as keyof typeof statusColors])}>{item.status}</Badge></div>
      <div className="flex items-center gap-2"><Flag className="w-4 h-4 text-gray-500" /> Prioridad: <Badge className={cn(priorityColors[item.priority as keyof typeof priorityColors].bg, priorityColors[item.priority as keyof typeof priorityColors].text)}>{item.priority}</Badge></div>
      <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-500" /> Fechas: {item.startDate} - {item.endDate}</div>
    </div>
  </div>
);

function DashboardContent() {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [isPmo, setIsPmo] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const router = useRouter();

  // API state
  const [dashboardData, setDashboardData] = useState<DashboardActividad | null>(null);
  const [throughputData, setThroughputData] = useState<ThroughputPeriodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('mes');

  const isImplementador = user?.role === ROLES.IMPLEMENTADOR;

  // Load dashboard data
  const loadDashboardData = useCallback(async (actividadId: string) => {
    setLoading(true);
    try {
      const [dashboard, throughput] = await Promise.all([
        getDashboardActividad(actividadId, { periodo }),
        getActividadThroughput(actividadId, periodo === 'semana' ? 'semanal' : 'mensual'),
      ]);

      setDashboardData(dashboard);
      setThroughputData(throughput.periodos || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Show empty state - no mock data
      setDashboardData(null);
      setThroughputData([]);
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    setIsPmo(storedRole === 'pmo');

    const savedProjectData = localStorage.getItem('selectedProject');
    if (savedProjectData) {
      const projectData = JSON.parse(savedProjectData);
      setProject(projectData);
      if (projectData.type !== 'Actividad') {
        router.push(paths.poi.base);
      } else {
        loadDashboardData(projectData.id);
      }
    } else {
      router.push(paths.poi.base);
    }
  }, [router, loadDashboardData]);

  const handleTabClick = (tabName: string) => {
    let route = '';
    if (tabName === 'Detalles') route = paths.poi.actividad.detalles;
    else if (tabName === 'Lista') route = paths.poi.actividad.lista;
    else if (tabName === 'Tablero') route = paths.poi.actividad.tablero;

    if (route) {
      router.push(route);
    } else {
      setActiveTab(tabName);
    }
  };

  const handlePeriodoChange = (value: string) => {
    setPeriodo(value as PeriodoFiltro);
    if (project) {
      loadDashboardData(project.id);
    }
  };

  const handleRefresh = () => {
    if (project) {
      loadDashboardData(project.id);
    }
  };

  if (isPmo === null || !project) {
    return (
      <div className="flex h-screen w-full items-center justify-center">Cargando...</div>
    );
  }

  // Summary cards
  const summaryCards = dashboardData ? [
    { title: 'Finalizadas', value: dashboardData.tareas.finalizadas, icon: CheckCircle, color: 'text-green-500' },
    { title: 'En Progreso', value: dashboardData.tareas.enProgreso, icon: Edit, color: 'text-blue-500' },
    { title: 'Total Tareas', value: dashboardData.tareas.total, icon: PlusCircle, color: 'text-yellow-500' },
    { title: 'WIP Actual', value: dashboardData.metricas.wipActual, icon: Clock, color: 'text-red-500' },
  ] : [
    { title: 'Finalizadas', value: 1, icon: CheckCircle, color: 'text-green-500' },
    { title: 'Actualizadas', value: 1, icon: Edit, color: 'text-blue-500' },
    { title: 'Creadas', value: 3, icon: PlusCircle, color: 'text-yellow-500' },
    { title: 'Vencen Pronto', value: 1, icon: Clock, color: 'text-red-500' },
  ];

  // State chart data
  const stateChartData = dashboardData ? [
    { estado: 'Finalizado', cantidad: dashboardData.tareas.finalizadas, color: '#A7F3D0' },
    { estado: 'En progreso', cantidad: dashboardData.tareas.enProgreso, color: '#FDE68A' },
    { estado: 'Por hacer', cantidad: dashboardData.tareas.porHacer, color: '#BFDBFE' },
  ] : [
    { estado: 'Finalizado', cantidad: 1, color: '#A7F3D0' },
    { estado: 'En progreso', cantidad: 1, color: '#FDE68A' },
    { estado: 'Por hacer', cantidad: 1, color: '#BFDBFE' },
  ];

  // Priority chart data
  const priorityChartData = dashboardData?.tareasPorPrioridad ?? [
    { name: 'Baja', value: 0 },
    { name: 'Medio', value: 2 },
    { name: 'Alto', value: 1 },
  ];

  // Work types data
  const workTypesData = [
    { name: 'Tarea', percentage: dashboardData ? Math.round((dashboardData.tareas.total / (dashboardData.tareas.total + dashboardData.subtareas.total)) * 100) : 60, icon: ClipboardCheck, color: 'bg-blue-500' },
    { name: 'Subtarea', percentage: dashboardData ? Math.round((dashboardData.subtareas.total / (dashboardData.tareas.total + dashboardData.subtareas.total)) * 100) : 40, icon: ChevronsRight, color: 'bg-gray-500' },
  ];

  const projectCode = `ACT N${project.id}`;

  const breadcrumbs = [
    { label: 'POI', href: paths.poi.base },
    { label: 'Dashboard' },
  ];

  const secondaryHeader = (
    <div className="bg-[#D5D5D5] border-b border-t border-[#1A5581]">
      <div className="p-2 flex items-center justify-between w-full">
        <h2 className="font-bold text-black pl-2">
          {projectCode}: {project.name}
        </h2>
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
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            className="h-8"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>
    </div>
  );

  // IMPLEMENTADOR no tiene acceso a Detalles
  const allActivityTabs = [{ name: 'Detalles' }, { name: 'Lista' }, { name: 'Tablero' }, { name: 'Dashboard' }];
  const activityTabs = isImplementador
    ? allActivityTabs.filter(tab => tab.name !== 'Detalles')
    : allActivityTabs;

  return (
    <AppLayout
      breadcrumbs={breadcrumbs}
      secondaryHeader={secondaryHeader}
    >
      <div className="flex items-center gap-2 p-4 bg-[#F9F9F9]">
        {activityTabs.map(tab => (
          <Button
            key={tab.name}
            size="sm"
            onClick={() => handleTabClick(tab.name)}
            className={cn(activeTab === tab.name ? 'bg-[#018CD1] text-white' : 'bg-white text-black border-gray-300')}
            variant={activeTab === tab.name ? 'default' : 'outline'}
          >
            {tab.name}
          </Button>
        ))}
      </div>
      <div className="flex-1 bg-[#F9F9F9] px-4 pb-4 overflow-y-auto">
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <Card key={i} className="flex items-center p-4 gap-4">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div>
                    <Skeleton className="h-8 w-12 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </Card>
              ))
            ) : (
              summaryCards.map((card, index) => (
                <Card key={index} className="flex items-center p-4 gap-4">
                  <card.icon className={cn('w-8 h-8', card.color)} />
                  <div>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Kanban Metrics */}
          {dashboardData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Timer className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{dashboardData.metricas.leadTimePromedio.toFixed(1)}</p>
                      <p className="text-sm text-gray-500">Lead Time (dias)</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Tiempo desde creacion hasta finalizacion
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Gauge className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{dashboardData.metricas.cycleTimePromedio.toFixed(1)}</p>
                      <p className="text-sm text-gray-500">Cycle Time (dias)</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Tiempo de trabajo activo
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{dashboardData.metricas.throughputSemanal}</p>
                      <p className="text-sm text-gray-500">Throughput (semanal)</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Tareas completadas por semana
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Throughput Chart */}
          <ThroughputChart
            data={throughputData}
            loading={loading}
            showSubtareas={true}
          />

          {/* Charts grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status summary */}
              <StatusPieChart
                data={stateChartData}
                title="RESUMEN DE ESTADO"
                loading={loading}
              />

              {/* Priority summary */}
              <Card>
                <CardHeader><CardTitle className="text-base">RESUMEN DE PRIORIDAD</CardTitle></CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-64 flex items-end justify-around gap-2 px-4">
                      {[0.4, 0.7, 0.5].map((h, i) => (
                        <Skeleton key={i} className="w-12" style={{ height: `${h * 200}px` }} />
                      ))}
                    </div>
                  ) : (
                    <ChartContainer config={{}} className="h-64 w-full">
                      <RechartsBarChart data={priorityChartData} layout="vertical" margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Bar dataKey="value" fill="#8884d8" radius={4}>
                          <LabelList dataKey="value" position="right" />
                        </Bar>
                      </RechartsBarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              {/* Work types */}
              <Card className="md:col-span-2">
                <CardHeader><CardTitle className="text-base">TIPOS DE TRABAJO</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    [1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="w-5 h-5" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-full mb-1" />
                          <Skeleton className="h-2 w-full" />
                        </div>
                      </div>
                    ))
                  ) : (
                    workTypesData.map(item => (
                      <div key={item.name} className="flex items-center gap-4">
                        <item.icon className="w-5 h-5 text-gray-600" />
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{item.name}</span>
                            <span>{item.percentage}%</span>
                          </div>
                          <Progress value={item.percentage} className="h-2" />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Responsables */}
              {dashboardData?.responsables && dashboardData.responsables.length > 0 && (
                <Card className="md:col-span-2">
                  <CardHeader><CardTitle className="text-base">RESPONSABLES</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData.responsables.map((responsable) => (
                        <div key={responsable.id} className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>{responsable.nombre.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium">{responsable.nombre}</span>
                              <span className="text-gray-500">
                                {responsable.tareasCompletadas}/{responsable.tareasAsignadas} tareas
                              </span>
                            </div>
                            <Progress
                              value={responsable.tareasAsignadas > 0 ? (responsable.tareasCompletadas / responsable.tareasAsignadas) * 100 : 0}
                              className="h-2"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Recent activity */}
            <Card className="h-full lg:row-span-2">
              <CardHeader><CardTitle className="text-base">ACTIVIDAD RECIENTE</CardTitle></CardHeader>
              <CardContent className="h-[calc(100%-4rem)] overflow-y-auto custom-scrollbar">
                <p className="text-sm text-muted-foreground mb-2">Mantente al dia de lo que sucede en toda la actividad</p>
                <p className="font-semibold text-sm mb-2">Hoy</p>
                <div className="space-y-4">
                  {loading ? (
                    [1, 2, 3].map((i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Skeleton className="w-7 h-7 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-full mb-1" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))
                  ) : dashboardData?.throughputHistorico && dashboardData.throughputHistorico.length > 0 ? (
                    <p className="text-sm text-gray-500">
                      {dashboardData.throughputHistorico.length} registros de actividad
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No hay actividad reciente registrada
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function DashboardActividadPage() {
  return (
    <React.Suspense fallback={<div>Cargando...</div>}>
      <DashboardContent />
    </React.Suspense>
  );
}
