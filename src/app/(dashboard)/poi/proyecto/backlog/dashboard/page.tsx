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
  Paperclip,
  Calendar,
  Layers,
  Flag,
  BookOpen,
  ClipboardCheck,
  RefreshCw,
  Target,
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
import { BurndownChart, VelocityChart, StatusPieChart, MetricCard } from '@/components/charts';
import { getDashboardProyecto } from '@/features/dashboard/services';
import { getProyectoVelocity, getProyectoBurndown } from '@/features/dashboard/services';
import type {
  DashboardProyecto,
  BurndownData,
  VelocityData,
  SprintResumen,
} from '@/features/dashboard/types';
import {
  countByStatus,
  countByPriority,
  countByType,
  getActionText,
  statusColors,
  priorityColors,
  type ActivityLog,
  type UserStory,
} from '@/lib/backlog-data';

function DashboardContent() {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [isPmo, setIsPmo] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const router = useRouter();

  // API state
  const [dashboardData, setDashboardData] = useState<DashboardProyecto | null>(null);
  const [burndownData, setBurndownData] = useState<BurndownData | null>(null);
  const [velocityData, setVelocityData] = useState<VelocityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [sprints, setSprints] = useState<SprintResumen[]>([]);

  // Verificar rol del usuario - ADMIN tiene acceso completo
  const isAdmin = user?.role === ROLES.ADMIN;
  const isDeveloper = user?.role === ROLES.DESARROLLADOR;

  // Load dashboard data from API
  const loadDashboardData = useCallback(async (proyectoId: string) => {
    setLoading(true);
    try {
      const [dashboard, velocity] = await Promise.all([
        getDashboardProyecto(proyectoId),
        getProyectoVelocity(proyectoId),
      ]);

      setDashboardData(dashboard);
      setVelocityData(velocity);

      // Set sprints for selector
      if (dashboard.sprintActual) {
        setSprints([dashboard.sprintActual]);
        setSelectedSprintId(dashboard.sprintActual.id.toString());

        // Load burndown for current sprint
        const burndown = await getProyectoBurndown(proyectoId, dashboard.sprintActual.id);
        setBurndownData(burndown);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set null to show empty state
      setDashboardData(null);
      setVelocityData(null);
      setBurndownData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load burndown when sprint changes
  const loadBurndownForSprint = useCallback(async (proyectoId: string, sprintId: string) => {
    try {
      const burndown = await getProyectoBurndown(proyectoId, sprintId);
      setBurndownData(burndown);
    } catch (error) {
      console.error('Error loading burndown:', error);
      setBurndownData(null);
    }
  }, []);

  useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    setIsPmo(storedRole === 'pmo');

    const savedProjectData = localStorage.getItem('selectedProject');
    if (savedProjectData) {
      const projectData = JSON.parse(savedProjectData);
      setProject(projectData);
      if (projectData.type !== 'Proyecto') {
        router.push(paths.poi.base);
      } else {
        loadDashboardData(projectData.id);
      }
    } else {
      router.push(paths.poi.base);
    }
  }, [router, loadDashboardData]);

  // Handle sprint change
  const handleSprintChange = (sprintId: string) => {
    setSelectedSprintId(sprintId);
    if (project) {
      loadBurndownForSprint(project.id, sprintId);
    }
  };

  const handleTabClick = (tabName: string) => {
    let route = '';
    if (tabName === 'Backlog') route = paths.poi.proyecto.backlog.base;
    else if (tabName === 'Tablero') route = paths.poi.proyecto.backlog.tablero;

    if (route) {
      router.push(route);
    } else {
      setActiveTab(tabName);
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

  // Summary cards from API data only
  const finalizadas = dashboardData?.tareas.finalizadas ?? 0;
  const historiasCount = dashboardData?.historiasUsuario.total ?? 0;
  const tareasCount = dashboardData?.tareas.total ?? 0;
  const creadas = historiasCount + tareasCount;
  // Calculate "vencen pronto" from sprint data if available
  const vencenPronto = dashboardData?.sprintActual?.diasRestantes !== undefined && dashboardData.sprintActual.diasRestantes <= 3
    ? dashboardData.tareas.total - dashboardData.tareas.finalizadas
    : 0;

  const summaryCards = [
    { title: 'Finalizadas', value: finalizadas, icon: CheckCircle, color: 'text-green-500' },
    { title: 'Historias', value: historiasCount, icon: Edit, color: 'text-blue-500' },
    { title: 'Tareas', value: tareasCount, icon: PlusCircle, color: 'text-yellow-500' },
    { title: 'Vencen Pronto', value: vencenPronto, icon: Clock, color: 'text-red-500' },
  ];

  // State chart data from API
  const stateChartData = dashboardData ? [
    { name: 'Terminadas', value: dashboardData.historiasUsuario.terminadas, fill: '#A7F3D0' },
    { name: 'En desarrollo', value: dashboardData.historiasUsuario.enDesarrollo, fill: '#FDE68A' },
    { name: 'Pendientes', value: dashboardData.historiasUsuario.pendientes, fill: '#BFDBFE' },
    { name: 'En revision', value: dashboardData.historiasUsuario.enRevision, fill: '#A78BFA' },
  ] : [
    { name: 'Terminadas', value: 0, fill: '#A7F3D0' },
    { name: 'En desarrollo', value: 0, fill: '#FDE68A' },
    { name: 'Pendientes', value: 0, fill: '#BFDBFE' },
    { name: 'En revision', value: 0, fill: '#A78BFA' },
  ];

  // Priority chart data from API
  const priorityChartData = dashboardData?.historiaPorPrioridad ?? [
    { name: 'Baja', value: 0 },
    { name: 'Media', value: 0 },
    { name: 'Alta', value: 0 },
  ];

  // Work types data from API
  const epicaCount = 0; // TODO: Add epicas count to dashboard API
  const totalItems = historiasCount + tareasCount + epicaCount;
  const workTypesData = [
    { name: 'Epica', count: epicaCount, percentage: totalItems > 0 ? Math.round((epicaCount / totalItems) * 100) : 0, icon: Layers, color: 'bg-purple-500' },
    { name: 'Historia de Usuario', count: historiasCount, percentage: totalItems > 0 ? Math.round((historiasCount / totalItems) * 100) : 0, icon: BookOpen, color: 'bg-blue-500' },
    { name: 'Tarea', count: tareasCount, percentage: totalItems > 0 ? Math.round((tareasCount / totalItems) * 100) : 0, icon: ClipboardCheck, color: 'bg-green-500' },
  ];

  const projectCode = project.code || `PROY N°${project.id}`;

  // Breadcrumb simplificado: POI > Backlog (mantener Backlog aunque esté en Dashboard)
  const breadcrumbs = [{ label: 'POI', href: paths.poi.base }, { label: 'Backlog' }];

  const secondaryHeader = (
    <div className="bg-[#D5D5D5] border-b border-t border-[#1A5581]">
      <div className="p-2 flex items-center justify-between w-full">
        <h2 className="font-bold text-black pl-2">
          {projectCode}: {project.name}
        </h2>
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
  );

  const projectTabs = ['Backlog', 'Tablero', 'Dashboard'];

  // Activity tooltip component
  const ActivityItemTooltip = ({ item }: { item: ActivityLog }) => (
    <div className="p-4 bg-white rounded-lg shadow-lg border w-80">
      <h4 className="font-bold mb-2">{item.itemId}: {item.itemTitle}</h4>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-500" /> Responsable: {item.user}</div>
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-gray-500" /> Estado:
          <Badge className={cn(statusColors[item.newState as keyof typeof statusColors])}>{item.newState}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-gray-500" /> Prioridad:
          <Badge className={cn(priorityColors[item.priority as keyof typeof priorityColors]?.bg, priorityColors[item.priority as keyof typeof priorityColors]?.text)}>{item.priority}</Badge>
        </div>
        <div className="flex items-center gap-2"><Layers className="w-4 h-4 text-gray-500" /> Epica: {item.epic}</div>
        {item.parentId && <div className="flex items-center gap-2"><Paperclip className="w-4 h-4 text-gray-500" /> Principal: {item.parentId}</div>}
        <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-500" /> Fechas: {item.startDate} - {item.endDate}</div>
      </div>
    </div>
  );

  // Group activities by date
  const groupActivitiesByDate = (logs: ActivityLog[]) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { label: string; items: ActivityLog[] }[] = [];

    const todayItems = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate.toDateString() === today.toDateString();
    });

    const yesterdayItems = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate.toDateString() === yesterday.toDateString();
    });

    const olderItems = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate < yesterday && logDate.toDateString() !== yesterday.toDateString();
    });

    if (todayItems.length > 0) groups.push({ label: 'Hoy', items: todayItems });
    if (yesterdayItems.length > 0) groups.push({ label: 'Ayer', items: yesterdayItems });
    if (olderItems.length > 0) groups.push({ label: 'Anteriores', items: olderItems });

    return groups;
  };

  // Activity logs will come from API - for now show empty
  const activityGroups = groupActivitiesByDate([]);

  return (
    <AppLayout
      breadcrumbs={breadcrumbs}
      secondaryHeader={secondaryHeader}
    >
      <div className="flex items-center gap-2 p-4 bg-[#F9F9F9]">
        {projectTabs.map(tab => (
          <Button
            key={tab}
            size="sm"
            onClick={() => handleTabClick(tab)}
            className={cn(activeTab === tab ? 'bg-[#018CD1] text-white' : 'bg-white text-black border-gray-300')}
            variant={activeTab === tab ? 'default' : 'outline'}
          >
            {tab}
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

          {/* Sprint info & metrics */}
          {dashboardData?.sprintActual && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">SPRINT ACTUAL</CardTitle>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {dashboardData.sprintActual.estado}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Sprint</p>
                    <p className="font-semibold">{dashboardData.sprintActual.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Dias restantes</p>
                    <p className="font-semibold">{dashboardData.sprintActual.diasRestantes}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Story Points</p>
                    <p className="font-semibold">
                      {dashboardData.sprintActual.storyPointsCompletados} / {dashboardData.sprintActual.storyPointsPlaneados}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Progreso</p>
                    <div className="flex items-center gap-2">
                      <Progress value={dashboardData.sprintActual.progreso} className="h-2 flex-1" />
                      <span className="text-sm font-semibold">{dashboardData.sprintActual.progreso}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Charts row - Burndown & Velocity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Burndown Chart */}
            <div>
              {sprints.length > 1 && (
                <div className="mb-2">
                  <Select value={selectedSprintId ?? ''} onValueChange={handleSprintChange}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Seleccionar Sprint" />
                    </SelectTrigger>
                    <SelectContent>
                      {sprints.map((sprint) => (
                        <SelectItem key={sprint.id} value={sprint.id.toString()}>
                          {sprint.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <BurndownChart
                data={burndownData?.dias ?? []}
                sprintName={burndownData?.sprintNombre}
                loading={loading}
              />
            </div>

            {/* Velocity Chart */}
            <VelocityChart
              data={velocityData?.velocidades.map(v => ({
                sprint: v.sprint,
                comprometidos: v.comprometidos,
                completados: v.completados,
              })) ?? []}
              velocidadPromedio={velocityData?.velocidadPromedio}
              tendencia={velocityData?.tendencia}
              loading={loading}
            />
          </div>

          {/* Original charts and content */}
          <div className="flex flex-col lg:flex-row gap-4 lg:items-start">
            {/* Left column */}
            <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-min">
              {/* Status summary */}
              <Card>
                <CardHeader><CardTitle className="text-base">RESUMEN DE ESTADO</CardTitle></CardHeader>
                <CardContent className="flex flex-col items-center justify-center">
                  {loading ? (
                    <Skeleton className="w-32 h-32 rounded-full" />
                  ) : (
                    <>
                      <ChartContainer config={{}} className="w-full h-40">
                        <PieChart>
                          <ChartTooltip cursor={true} content={<ChartTooltipContent />} />
                          <Pie data={stateChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={60} paddingAngle={2}>
                            {stateChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ChartContainer>
                      <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
                        {stateChartData.map(entry => (
                          <div key={entry.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.fill }}></div>
                            <span>{entry.name} ({entry.value})</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

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
                      <RechartsBarChart data={priorityChartData} layout="vertical" margin={{ top: 0, right: 30, left: -20, bottom: 0 }}>
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
                    [1, 2, 3].map((i) => (
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
                            <span>{item.name} ({item.count})</span>
                            <span>{item.percentage}%</span>
                          </div>
                          <Progress value={item.percentage} className="h-2" />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Team workload */}
              {dashboardData?.equipo && dashboardData.equipo.length > 0 && (
                <Card className="md:col-span-2">
                  <CardHeader><CardTitle className="text-base">CARGA DEL EQUIPO</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData.equipo.map((miembro) => (
                        <div key={miembro.id} className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>{miembro.nombre.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium">{miembro.nombre}</span>
                              <span className="text-gray-500">
                                {miembro.tareasCompletadas}/{miembro.tareasAsignadas} tareas
                              </span>
                            </div>
                            <Progress
                              value={miembro.tareasAsignadas > 0 ? (miembro.tareasCompletadas / miembro.tareasAsignadas) * 100 : 0}
                              className="h-2"
                            />
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {miembro.storyPointsCompletados} pts
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Recent activity - Right column */}
            <div className="lg:w-1/3">
              <Card className="flex flex-col h-[580px] overflow-hidden">
                <CardHeader className="flex-shrink-0"><CardTitle className="text-base">ACTIVIDAD RECIENTE</CardTitle></CardHeader>
                <CardContent className="flex-1 overflow-y-auto custom-scrollbar min-h-0 pb-4">
                  <p className="text-sm text-muted-foreground mb-4">Mantente al dia de lo que sucede en todo el proyecto</p>

                  {activityGroups.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">No hay actividad reciente</p>
                  ) : (
                    activityGroups.map((group, groupIndex) => (
                      <div key={groupIndex} className="mb-4">
                        <p className="font-semibold text-sm mb-2">{group.label}</p>
                        <div className="space-y-4">
                          {group.items.map((item) => (
                            <TooltipProvider key={item.id} delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-start gap-3 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded-md">
                                    <Avatar className="w-7 h-7 text-xs flex-shrink-0">
                                      <AvatarFallback>
                                        {item.user.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <p className="break-words">
                                        <span className="font-semibold">{item.user}</span>{' '}
                                        {getActionText(item.action)}{' '}
                                        <span className="font-semibold">{item.itemTitle}</span>
                                      </p>
                                      <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <Badge variant="outline">{item.itemId}</Badge>
                                        <Badge className={cn(statusColors[item.newState as keyof typeof statusColors])}>
                                          {item.newState}
                                        </Badge>
                                        {item.action === 'cambio_estado' && item.previousState && (
                                          <span className="text-xs text-gray-400">
                                            (antes: {item.previousState})
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="left" align="start" className="p-0 border-none bg-transparent shadow-none">
                                  <ActivityItemTooltip item={item} />
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function DashboardProyectoPage() {
  return (
    <React.Suspense fallback={<div>Cargando...</div>}>
      <DashboardContent />
    </React.Suspense>
  );
}
