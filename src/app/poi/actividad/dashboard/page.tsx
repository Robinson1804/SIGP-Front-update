

"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileText,
  Target,
  Users,
  BarChart,
  Bell,
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
} from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Project } from '@/lib/definitions';
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


const navItems = [
  { label: 'PGD', icon: FileText, href: '/pgd' },
  { label: 'POI', icon: Target, href: '/poi' },
  { label: 'RECURSOS HUMANOS', icon: Users, href: '/recursos-humanos' },
  { label: 'DASHBOARD', icon: BarChart, href: '/dashboard' },
  { label: 'NOTIFICACIONES', icon: Bell, href: '/notificaciones' },
];

const summaryCards = [
    { title: 'Finalizadas', value: 4, icon: CheckCircle, color: 'text-green-500' },
    { title: 'Actualizadas', value: 2, icon: Edit, color: 'text-blue-500' },
    { title: 'Creadas', value: 8, icon: PlusCircle, color: 'text-yellow-500' },
    { title: 'Vencen Pronto', value: 1, icon: Clock, color: 'text-red-500' },
];

const stateChartData = [
  { name: 'Finalizado', value: 4, fill: '#A7F3D0' },
  { name: 'En progreso', value: 2, fill: '#FDE68A' },
  { name: 'Por hacer', value: 2, fill: '#BFDBFE' },
  { name: 'Revisión', value: 1, fill: '#A78BFA'}
];

const priorityChartData = [
    { name: 'Baja', value: 2 },
    { name: 'Medio', value: 4 },
    { name: 'Alto', value: 2 },
];

const workTypesData = [
    { name: 'Épica', percentage: 38, icon: Layers, color: 'bg-purple-500' },
    { name: 'Tarea', percentage: 38, icon: ClipboardCheck, color: 'bg-blue-500' },
    { name: 'Subtarea', percentage: 20, icon: ChevronsRight, color: 'bg-gray-500' },
];


const recentActivity = [
    {
        user: 'Anayeli Monzon Narvaez',
        action: 'ha actualizado el estado en',
        task: 'Crear formulario digital con validaciones para encuestas',
        id: 'TAR - 1',
        type: 'Tarea',
        status: 'En Progreso',
        priority: 'Media',
        epic: 'Epica 1',
        main: 'HU - 1',
        startDate: '01/02/25',
        endDate: '05/02/25',
    },
    {
        user: 'Anayeli Monzon Narvaez',
        action: 'ha creado la tarea',
        task: 'Crear formulario digital con validaciones para encuestas',
        id: 'TAR - 1',
        type: 'Tarea',
        status: 'Por hacer',
        priority: 'Media',
        epic: 'Epica 1',
        main: 'HU - 1',
        startDate: '01/02/25',
        endDate: '05/02/25',
    },
];

const statusColors: { [key: string]: string } = {
  'Por hacer': 'bg-[#BFDBFE] text-blue-800',
  'En Progreso': 'bg-[#FDE68A] text-yellow-800',
  'Revisión': 'bg-[#A78BFA] text-purple-800',
  'Finalizado': 'bg-[#A7F3D0] text-green-800',
};

const priorityColors: { [key: string]: { bg: string, text: string } } = {
    'Alta': { bg: 'bg-red-200', text: 'text-red-800' },
    'Media': { bg: 'bg-yellow-200', text: 'text-yellow-800' },
    'Baja': { bg: 'bg-green-200', text: 'text-green-800' }
};

const ActivityItemTooltip = ({ item }: { item: any }) => (
    <div className="p-4 bg-white rounded-lg shadow-lg border w-80">
        <h4 className="font-bold mb-2">{item.id}: {item.task}</h4>
        <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-500"/> Responsable: {item.user}</div>
            <div className="flex items-center gap-2"><Tag className="w-4 h-4 text-gray-500"/> Estado: <Badge className={cn(statusColors[item.status as keyof typeof statusColors])}>{item.status}</Badge></div>
            <div className="flex items-center gap-2"><Flag className="w-4 h-4 text-gray-500"/> Prioridad: <Badge className={cn(priorityColors[item.priority as keyof typeof priorityColors].bg, priorityColors[item.priority as keyof typeof priorityColors].text)}>{item.priority}</Badge></div>
            <div className="flex items-center gap-2"><Layers className="w-4 h-4 text-gray-500"/> Épica: {item.epic}</div>
            {item.type === 'Tarea' && <div className="flex items-center gap-2"><Paperclip className="w-4 h-4 text-gray-500"/> Principal: {item.main}</div>}
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-500"/> Fechas: {item.startDate} - {item.endDate}</div>
        </div>
    </div>
);


function DashboardContent() {
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const router = useRouter();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const savedProjectData = localStorage.getItem('selectedProject');
    if (savedProjectData) {
      setProject(JSON.parse(savedProjectData));
    } else {
      router.push('/poi');
    }
     const tab = searchParams.get('tab');
    if (tab) {
        setActiveTab(tab);
    }
  }, [router, searchParams]);

  const handleTabClick = (tabName: string) => {
    let route = '';
    if (tabName === 'Detalles') route = '/poi/actividad/detalles';
    else if (tabName === 'Lista') route = '/poi/actividad/lista';
    else if (tabName === 'Tablero') route = '/poi/actividad/tablero';
    
    if (route) {
        router.push(route);
    } else {
        setActiveTab(tabName);
    }
  };
  
  if (!project) {
    return (
      <AppLayout navItems={navItems} breadcrumbs={[{ label: 'Cargando...' }]}>
        <div className="flex-1 flex items-center justify-center">Cargando...</div>
      </AppLayout>
    );
  }

  const projectCode = `ACT N°${project.id}`;
  
  const breadcrumbs = [
    { label: 'POI', href: '/poi' }, 
    { label: 'Dashboard' }
];

  const secondaryHeader = (
    <div className="bg-[#D5D5D5] border-b border-t border-[#1A5581]">
      <div className="p-2 flex items-center justify-between w-full">
        <h2 className="font-bold text-black pl-2">
          {projectCode}: {project.name}
        </h2>
      </div>
    </div>
  );

  const activityTabs = ['Detalles', 'Lista', 'Tablero', 'Dashboard'];
  
  return (
    <AppLayout
      navItems={navItems}
      breadcrumbs={breadcrumbs}
      secondaryHeader={secondaryHeader}
    >
      <div className="flex items-center gap-2 p-4 bg-[#F9F9F9]">
         {activityTabs.map(tab => (
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
      <div className="flex-1 bg-[#F9F9F9] px-4 pb-4">
        {activeTab === 'Dashboard' && (
          <div className="space-y-4">
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

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                      <span>{entry.name}</span>
                                  </div>
                              ))}
                          </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle className="text-base">RESUMEN DE PRIORIDAD</CardTitle></CardHeader>
                      <CardContent>
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
                      </CardContent>
                    </Card>
                    <Card className="md:col-span-2">
                      <CardHeader><CardTitle className="text-base">TIPOS DE TRABAJO</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                          {workTypesData.map(item => (
                              <div key={item.name} className="flex items-center gap-4">
                                  <item.icon className="w-5 h-5 text-gray-600" />
                                  <div className="flex-1">
                                      <div className="flex justify-between text-sm mb-1">
                                          <span>{item.name}</span>
                                          <span>{item.percentage}%</span>
                                      </div>
                                      <Progress value={item.percentage} indicatorClassName={item.color} className="h-2" />
                                  </div>
                              </div>
                          ))}
                      </CardContent>
                    </Card>
                </div>
                
                <Card className="h-full lg:row-span-2">
                  <CardHeader><CardTitle className="text-base">ACTIVIDAD RECIENTE</CardTitle></CardHeader>
                  <CardContent className="h-[calc(100%-4rem)] overflow-y-auto custom-scrollbar">
                      <p className="text-sm text-muted-foreground mb-2">Mantente al día de lo que sucede en todo el proyecto</p>
                      <p className="font-semibold text-sm mb-2">Hoy</p>
                      <div className="space-y-4">
                          {recentActivity.map((item, index) => (
                               <TooltipProvider key={index} delayDuration={100}>
                                  <Tooltip>
                                      <TooltipTrigger asChild>
                                          <div className="flex items-start gap-3 text-sm">
                                              <Avatar className="w-7 h-7 text-xs"><AvatarFallback>AM</AvatarFallback></Avatar>
                                              <div>
                                                  <p><span className="font-semibold">{item.user}</span> {item.action} <span className="font-semibold">{item.task}</span></p>
                                                  <Badge variant="outline" className="mr-2">{item.id}</Badge>
                                                  <Badge className={cn(statusColors[item.status as keyof typeof statusColors])}>{item.status}</Badge>
                                              </div>
                                          </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="bottom" align="start" className="p-0 border-none bg-transparent shadow-none">
                                          <ActivityItemTooltip item={item} />
                                      </TooltipContent>
                                  </Tooltip>
                              </TooltipProvider>
                          ))}
                      </div>
                  </CardContent>
                </Card>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function DashboardPage() {
    return (
        <React.Suspense fallback={<div>Cargando...</div>}>
            <DashboardContent />
        </React.Suspense>
    );
}
