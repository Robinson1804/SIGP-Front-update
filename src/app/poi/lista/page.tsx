
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Target,
  Users,
  BarChart,
  Bell,
  Search,
  ChevronDown,
  MoreHorizontal,
  ChevronRight,
} from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from '@/lib/utils';
import { Project } from '@/lib/definitions';


const navItems = [
  { label: 'PGD', icon: FileText, href: '/pmo-dashboard' },
  { label: 'POI', icon: Target, href: '/poi' },
  { label: 'RECURSOS HUMANOS', icon: Users, href: '/recursos-humanos' },
  { label: 'DASHBOARD', icon: BarChart, href: '/dashboard' },
  { label: 'NOTIFICACIONES', icon: Bell, href: '/notificaciones' },
];

const taskStatusColors: { [key: string]: string } = {
  'Por hacer': 'bg-[#BFDBFE] text-blue-800',
  'En progreso': 'bg-[#FDE68A] text-yellow-800',
  'Completado': 'bg-[#A7F3D0] text-green-800',
};

const priorityColors: { [key: string]: { bg: string, text: string } } = {
    'Alta': { bg: '#F2B5B5', text: 'text-red-800' },
    'Media': { bg: '#FFD29F', text: 'text-yellow-800' },
    'Baja': { bg: '#C5E3B5', text: 'text-green-800' }
};

type SubTask = {
  id: string;
  title: string;
  status: 'Por hacer' | 'En progreso' | 'Completado';
  responsible: string;
  priority: 'Alta' | 'Media' | 'Baja';
  startDate: string;
  endDate: string;
}

type Task = {
  id: string;
  title: string;
  status: 'Por hacer' | 'En progreso' | 'Completado';
  responsible: string;
  priority: 'Alta' | 'Media' | 'Baja';
  startDate: string;
  endDate: string;
  subtasks: SubTask[];
}

const initialTasks: Task[] = [
  {
    id: 'TAR-1',
    title: 'Actualizar datos del usuario',
    status: 'Por hacer',
    responsible: 'Nombre 1',
    priority: 'Media',
    startDate: '10/02/2025',
    endDate: '17/02/2025',
    subtasks: [
      { id: 'SUB-1', title: 'El campo residencia que muestre distintas opciones de selección', status: 'Por hacer', responsible: 'Nombre 2', priority: 'Media', startDate: '10/02/2025', endDate: '12/02/2025' }
    ]
  },
   {
    id: 'TAR-2',
    title: 'Otra tarea de ejemplo',
    status: 'Completado',
    responsible: 'Nombre 3',
    priority: 'Alta',
    startDate: '11/02/2025',
    endDate: '15/02/2025',
    subtasks: []
  }
];


function ListaContent() {
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState('Lista');
  const router = useRouter();

  React.useEffect(() => {
    const savedProjectData = localStorage.getItem('selectedProject');
    if (savedProjectData) {
      setProject(JSON.parse(savedProjectData));
    } else {
      router.push('/poi');
    }
  }, [router]);

  const handleTabClick = (tabName: string) => {
    if (tabName === 'Tablero') {
        router.push('/poi/tablero');
    } else if (tabName === 'Dashboard') {
        router.push('/poi/dashboard');
    } else if (tabName === 'Detalles') {
        router.push('/poi/detalles');
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
    { label: 'Actividad', href: `/poi/detalles` },
    { label: 'Lista' },
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

  return (
    <AppLayout
      navItems={navItems}
      breadcrumbs={breadcrumbs}
      secondaryHeader={secondaryHeader}
    >
        <div className="flex items-center gap-2 p-4 bg-[#F9F9F9]">
            <Button size="sm" onClick={() => handleTabClick('Detalles')} className={cn(activeTab === 'Detalles' ? 'bg-[#018CD1] text-white' : 'bg-white text-black border-gray-300')} variant='outline'>Detalles</Button>
            <Button size="sm" onClick={() => setActiveTab('Lista')} className={cn(activeTab === 'Lista' ? 'bg-[#018CD1] text-white' : 'bg-white text-black border-gray-300')} variant='default'>Lista</Button>
            <Button size="sm" onClick={() => handleTabClick('Tablero')} className={cn(activeTab === 'Tablero' ? 'bg-[#018CD1] text-white' : 'bg-white text-black border-gray-300')} variant='outline'>Tablero</Button>
            <Button size="sm" onClick={() => handleTabClick('Dashboard')} className={cn(activeTab === 'Dashboard' ? 'bg-[#018CD1] text-white' : 'bg-white text-black border-gray-300')} variant='outline'>Dashboard</Button>
        </div>

        <div className="flex-1 flex flex-col bg-[#F9F9F9] px-4 pb-4">
            {activeTab === 'Lista' && (
                <div className="flex-1 flex flex-col gap-4">
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input placeholder="Buscar en la lista" className="pl-10 bg-white" disabled/>
                    </div>
                    <div className="rounded-lg border overflow-hidden bg-white">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Responsable</TableHead>
                                    <TableHead>Prioridad</TableHead>
                                    <TableHead>Fecha Inicio</TableHead>
                                    <TableHead>Fecha Fin</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {initialTasks.map(task => (
                                    <Collapsible asChild key={task.id}>
                                        <>
                                            <TableRow>
                                                <TableCell>
                                                    {task.subtasks.length > 0 && (
                                                        <CollapsibleTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <ChevronRight className="h-4 w-4 transition-transform data-[state=open]:rotate-90" />
                                                            </Button>
                                                        </CollapsibleTrigger>
                                                    )}
                                                </TableCell>
                                                <TableCell className={cn(task.status === 'Completado' && 'line-through')}>{task.id}</TableCell>
                                                <TableCell className={cn(task.status === 'Completado' && 'line-through')}>{task.title}</TableCell>
                                                <TableCell><Badge className={cn(taskStatusColors[task.status as keyof typeof taskStatusColors], 'font-semibold')}>{task.status}</Badge></TableCell>
                                                <TableCell>{task.responsible}</TableCell>
                                                <TableCell><Badge style={{ backgroundColor: priorityColors[task.priority as keyof typeof priorityColors].bg}} className={cn(priorityColors[task.priority as keyof typeof priorityColors].text, 'font-semibold')}>{task.priority}</Badge></TableCell>
                                                <TableCell>{task.startDate}</TableCell>
                                                <TableCell>{task.endDate}</TableCell>
                                                <TableCell><MoreHorizontal className="h-5 w-5 text-gray-400 cursor-pointer"/></TableCell>
                                            </TableRow>
                                            <CollapsibleContent asChild>
                                                <>
                                                {task.subtasks.map(subtask => (
                                                     <TableRow key={subtask.id} className="bg-gray-50/50">
                                                        <TableCell></TableCell>
                                                        <TableCell className={cn("pl-12", subtask.status === 'Completado' && 'line-through')}>{subtask.id}</TableCell>
                                                        <TableCell className={cn(subtask.status === 'Completado' && 'line-through')}>{subtask.title}</TableCell>
                                                        <TableCell><Badge className={cn(taskStatusColors[subtask.status as keyof typeof taskStatusColors], 'font-semibold')}>{subtask.status}</Badge></TableCell>
                                                        <TableCell>{subtask.responsible}</TableCell>
                                                        <TableCell><Badge style={{ backgroundColor: priorityColors[subtask.priority as keyof typeof priorityColors].bg}} className={cn(priorityColors[subtask.priority as keyof typeof priorityColors].text, 'font-semibold')}>{subtask.priority}</Badge></TableCell>
                                                        <TableCell>{subtask.startDate}</TableCell>
                                                        <TableCell>{subtask.endDate}</TableCell>
                                                        <TableCell><MoreHorizontal className="h-5 w-5 text-gray-400 cursor-pointer"/></TableCell>
                                                    </TableRow>
                                                ))}
                                                </>
                                            </CollapsibleContent>
                                        </>
                                    </Collapsible>
                                ))}
                                <TableRow>
                                    <TableCell colSpan={9} className="py-2">
                                        <Input className="w-full bg-gray-100 mt-1 border-dashed" placeholder="+ Agregar tarea" disabled />
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    </AppLayout>
  );
}

export default function ListaPage() {
    return (
        <React.Suspense fallback={<div>Cargando...</div>}>
            <ListaContent />
        </React.Suspense>
    );
}
