
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
  MoreHorizontal,
  Plus,
  X,
  Info,
  List
} from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Project } from '@/lib/definitions';
import Link from 'next/link';

const navItems = [
  { label: 'PGD', icon: FileText, href: '/pgd' },
  { label: 'POI', icon: Target, href: '/poi' },
  { label: 'RECURSOS HUMANOS', icon: Users, href: '/recursos-humanos' },
  { label: 'DASHBOARD', icon: BarChart, href: '/dashboard' },
  { label: 'NOTIFICACIONES', icon: Bell, href: '/notificaciones' },
];

const taskStatusColors: { [key: string]: string } = {
  'Por hacer': 'bg-[#BFDBFE] text-blue-800',
  'En progreso': 'bg-[#FDE68A] text-yellow-800',
  'En revisión': 'bg-[#A78BFA] text-purple-800',
  'Finalizado': 'bg-[#A7F3D0] text-green-800',
};

const priorityColors: { [key: string]: { bg: string, text: string } } = {
    'Alta': { bg: 'bg-red-200', text: 'text-red-800' },
    'Media': { bg: 'bg-yellow-200', text: 'text-yellow-800' },
    'Baja': { bg: 'bg-green-200', text: 'text-green-800' }
};

const initialTasks = [
    { id: 'TAR-1', title: 'Crear formulario digital con validaciones para encuestas', state: 'Por hacer', responsible: 'Nombre 1', priority: 'Media', startDate: '01/02/2025', endDate: '05/02/2025' },
    { id: 'TAR-2', title: 'Diseño de la base de datos para almacenar respuestas', state: 'Por hacer', responsible: 'Nombre 1', priority: 'Alta', startDate: '03/02/2025', endDate: '05/02/2025' },
    { id: 'TAR-3', title: 'Implementar backend para recepción de datos', state: 'Finalizado', responsible: 'Nombre 2', priority: 'Media', startDate: '05/02/2025', endDate: '08/02/2025' },
];


function ListaContent() {
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState('Lista');
  const router = useRouter();

  React.useEffect(() => {
    const savedProjectData = localStorage.getItem('selectedProject');
    if (savedProjectData) {
        const projectData = JSON.parse(savedProjectData);
        setProject(projectData);
        if(projectData.type !== 'Actividad') {
            router.push('/poi');
        }
    } else {
        router.push('/poi');
    }
  }, [router]);

  const handleTabClick = (tabName: string) => {
    let route = '';
    if (tabName === 'Detalles') route = '/poi/actividad/detalles';
    else if (tabName === 'Tablero') route = '/poi/actividad/tablero';
    else if (tabName === 'Dashboard') route = '/poi/actividad/dashboard';
    
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
  
  const activityTabs = [ { name: 'Detalles' }, { name: 'Lista' }, { name: 'Tablero' }, { name: 'Dashboard' }];

  return (
    <AppLayout
      navItems={navItems}
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

        <div className="flex-1 flex flex-col bg-[#F9F9F9] px-4 pb-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input placeholder="Buscar tareas" className="pl-10 bg-white" />
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <Button variant="outline" className="bg-white">Crear Tarea</Button>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-320px)] custom-scrollbar">
                <div className="bg-white rounded-lg border">
                    <Table>
                        <TableHeader className="bg-gray-50">
                            <TableRow>
                                <TableHead className="w-[80px]">ID</TableHead>
                                <TableHead>Título</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Responsable</TableHead>
                                <TableHead>Prioridad</TableHead>
                                <TableHead>Fecha Inicio</TableHead>
                                <TableHead>Fecha Fin</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {initialTasks.map(task => (
                            <TableRow key={task.id}>
                                <TableCell>{task.id}</TableCell>
                                <TableCell>{task.title}</TableCell>
                                <TableCell><Badge className={cn(taskStatusColors[task.state as keyof typeof taskStatusColors], 'font-semibold')}>{task.state}</Badge></TableCell>
                                <TableCell>{task.responsible}</TableCell>
                                <TableCell>
                                    <Badge className={cn(priorityColors[task.priority as keyof typeof priorityColors].bg, priorityColors[task.priority as keyof typeof priorityColors].text, 'w-16 justify-center')}>{task.priority}</Badge>
                                </TableCell>
                                <TableCell>{task.startDate}</TableCell>
                                <TableCell>{task.endDate}</TableCell>
                                <TableCell><MoreHorizontal className="h-5 w-5 text-gray-400"/></TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
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

