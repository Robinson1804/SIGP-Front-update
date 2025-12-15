

"use client";

import React, { useState } from 'react';
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
  ChevronsRight,
  ClipboardCheck,
  BookOpen,
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
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, LabelList } from "recharts"
import { Pie, PieChart, Cell } from "recharts";
import { paths } from '@/lib/paths';
import {
    allUserStories,
    activityLogs,
    epics,
    countByStatus,
    countByPriority,
    countByType,
    getActionText,
    statusColors,
    priorityColors,
    type ActivityLog,
} from '@/lib/backlog-data';


function DashboardContent() {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [isPmo, setIsPmo] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const router = useRouter();

  // Verificar rol del usuario
  const isDeveloper = user?.role === ROLES.DESARROLLADOR;

  React.useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    setIsPmo(storedRole === 'pmo');

    const savedProjectData = localStorage.getItem('selectedProject');
    if (savedProjectData) {
      const projectData = JSON.parse(savedProjectData);
      setProject(projectData);
       if(projectData.type !== 'Proyecto') {
          router.push(paths.poi.base);
      }
    } else {
      router.push(paths.poi.base);
    }
  }, [router]);

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

  if (isPmo === null || !project) {
    return (
      <div className="flex h-screen w-full items-center justify-center">Cargando...</div>
    );
  }

  // Calcular estadísticas dinámicas
  const statusCounts = countByStatus(allUserStories);
  const priorityCounts = countByPriority(allUserStories);
  const typeCounts = countByType(allUserStories);

  // Datos para las tarjetas de resumen
  const finalizadas = statusCounts['Finalizado'];
  const actualizadas = activityLogs.filter(log => log.action === 'actualizado' || log.action === 'cambio_estado').length;
  // Contar solo historias de usuario + tareas secundarias
  const historiasCount = allUserStories.filter(item => item.type === 'Historia').length;
  const tareasCount = allUserStories.filter(item => item.type === 'Tarea').length;
  const creadas = historiasCount + tareasCount;
  const vencenPronto = allUserStories.filter(story => {
    const endDate = new Date(story.endDate.split('/').reverse().join('-'));
    const today = new Date();
    const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0 && story.state !== 'Finalizado';
  }).length;

  const summaryCards = [
    { title: 'Finalizadas', value: finalizadas, icon: CheckCircle, color: 'text-green-500' },
    { title: 'Actualizadas', value: actualizadas, icon: Edit, color: 'text-blue-500' },
    { title: 'Creadas', value: creadas, icon: PlusCircle, color: 'text-yellow-500' },
    { title: 'Vencen Pronto', value: vencenPronto, icon: Clock, color: 'text-red-500' },
  ];

  // Datos para gráfico de estados
  const stateChartData = [
    { name: 'Finalizado', value: statusCounts['Finalizado'], fill: '#A7F3D0' },
    { name: 'En progreso', value: statusCounts['En progreso'], fill: '#FDE68A' },
    { name: 'Por hacer', value: statusCounts['Por hacer'], fill: '#BFDBFE' },
    { name: 'Revisión', value: statusCounts['En revisión'], fill: '#A78BFA' }
  ];

  // Datos para gráfico de prioridades
  const priorityChartData = [
    { name: 'Baja', value: priorityCounts['Baja'] },
    { name: 'Media', value: priorityCounts['Media'] },
    { name: 'Alta', value: priorityCounts['Alta'] },
  ];

  // Datos para tipos de trabajo
  const totalItems = typeCounts['Historia'] + typeCounts['Tarea'] + typeCounts['Épica'];
  const workTypesData = [
    { name: 'Épica', count: typeCounts['Épica'], percentage: totalItems > 0 ? Math.round((typeCounts['Épica'] / totalItems) * 100) : 0, icon: Layers, color: 'bg-purple-500' },
    { name: 'Historia de Usuario', count: typeCounts['Historia'], percentage: totalItems > 0 ? Math.round((typeCounts['Historia'] / totalItems) * 100) : 0, icon: BookOpen, color: 'bg-blue-500' },
    { name: 'Tarea', count: typeCounts['Tarea'], percentage: totalItems > 0 ? Math.round((typeCounts['Tarea'] / totalItems) * 100) : 0, icon: ClipboardCheck, color: 'bg-green-500' },
  ];

  const projectCode = `PROY N°${project.id}`;

  // DESARROLLADOR no puede ir a Detalles
  const breadcrumbs = isDeveloper
    ? [{ label: 'POI', href: paths.poi.base }, { label: 'Dashboard' }]
    : [{ label: 'POI', href: paths.poi.base }, { label: 'Proyecto', href: paths.poi.proyecto.detalles }, { label: 'Dashboard' }];

  const secondaryHeader = (
    <div className="bg-[#D5D5D5] border-b border-t border-[#1A5581]">
      <div className="p-2 flex items-center justify-between w-full">
        <h2 className="font-bold text-black pl-2">
          {projectCode}: {project.name}
        </h2>
      </div>
    </div>
  );

  const projectTabs = ['Backlog', 'Tablero', 'Dashboard'];

  // Componente para tooltip de actividad
  const ActivityItemTooltip = ({ item }: { item: ActivityLog }) => (
    <div className="p-4 bg-white rounded-lg shadow-lg border w-80">
        <h4 className="font-bold mb-2">{item.itemId}: {item.itemTitle}</h4>
        <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-500"/> Responsable: {item.user}</div>
            <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-500"/> Estado:
                <Badge className={cn(statusColors[item.newState as keyof typeof statusColors])}>{item.newState}</Badge>
            </div>
            <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-gray-500"/> Prioridad:
                <Badge className={cn(priorityColors[item.priority as keyof typeof priorityColors]?.bg, priorityColors[item.priority as keyof typeof priorityColors]?.text)}>{item.priority}</Badge>
            </div>
            <div className="flex items-center gap-2"><Layers className="w-4 h-4 text-gray-500"/> Épica: {item.epic}</div>
            {item.parentId && <div className="flex items-center gap-2"><Paperclip className="w-4 h-4 text-gray-500"/> Principal: {item.parentId}</div>}
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-500"/> Fechas: {item.startDate} - {item.endDate}</div>
        </div>
    </div>
  );

  // Agrupar actividades por fecha
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

  const activityGroups = groupActivitiesByDate(activityLogs);

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
            {/* Tarjetas de resumen */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {summaryCards.map((card, index) => (
                <Card key={index} className="flex items-center p-4 gap-4">
                  <card.icon className={cn("w-8 h-8", card.color)} />
                  <div>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                  </div>
                </Card>
              ))}
            </div>

             <div className="flex flex-col lg:flex-row gap-4 lg:items-start">
                {/* Columna izquierda */}
                <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-min" id="left-column">
                    {/* Resumen de Estado */}
                    <Card>
                      <CardHeader><CardTitle className="text-base">RESUMEN DE ESTADO</CardTitle></CardHeader>
                      <CardContent className="flex flex-col items-center justify-center">
                          <ChartContainer config={{}} className="w-full h-40">
                              <PieChart>
                                <ChartTooltip
                                      cursor={true}
                                      content={<ChartTooltipContent />}
                                  />
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
                      </CardContent>
                    </Card>

                    {/* Resumen de Prioridad */}
                    <Card>
                      <CardHeader><CardTitle className="text-base">RESUMEN DE PRIORIDAD</CardTitle></CardHeader>
                      <CardContent>
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
                      </CardContent>
                    </Card>

                    {/* Tipos de Trabajo */}
                    <Card className="md:col-span-2">
                      <CardHeader><CardTitle className="text-base">TIPOS DE TRABAJO</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                          {workTypesData.map(item => (
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
                          ))}
                      </CardContent>
                    </Card>
                </div>

                {/* Actividad Reciente - Columna derecha */}
                <div className="lg:w-1/3">
                  <Card className="flex flex-col h-[580px] overflow-hidden">
                    <CardHeader className="flex-shrink-0"><CardTitle className="text-base">ACTIVIDAD RECIENTE</CardTitle></CardHeader>
                    <CardContent className="flex-1 overflow-y-auto custom-scrollbar min-h-0 pb-4">
                      <p className="text-sm text-muted-foreground mb-4">Mantente al día de lo que sucede en todo el proyecto</p>

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
