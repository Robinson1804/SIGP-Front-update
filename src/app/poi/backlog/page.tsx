
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Target,
  Users,
  BarChart,
  Bell,
  Search,
  ChevronDown,
  MoreHorizontal,
  Plus,
  X,
  Info
} from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { cn } from '@/lib/utils';
import { Project } from '@/lib/definitions';


const navItems = [
  { label: 'PGD', icon: FileText, href: '/pmo-dashboard' },
  { label: 'POI', icon: Target, href: '/poi' },
  { label: 'RECURSOS HUMANOS', icon: Users, href: '/recursos-humanos' },
  { label: 'DASHBOARD', icon: BarChart, href: '/dashboard' },
  { label: 'NOTIFICACIONES', icon: Bell, href: '/notificaciones' },
];

const sprintStatusColors: { [key: string]: string } = {
  'Por hacer': 'bg-[#BFDBFE] text-blue-800',
  'En progreso': 'bg-[#FACC15] text-yellow-800',
  'Finalizado': 'bg-[#34D399] text-green-800',
};

const huStatusColors: { [key: string]: string } = {
  'Por hacer': 'bg-[#BFDBFE] text-blue-800',
  'En progreso': 'bg-[#FDE68A] text-yellow-800',
  'Revisión': 'bg-[#A78BFA] text-purple-800',
  'Finalizado': 'bg-[#A7F3D0] text-green-800',
};

const priorityColors: { [key: string]: string } = {
    'Alta': 'bg-red-500',
    'Media': 'bg-yellow-500',
    'Baja': 'bg-green-500'
};

const userStories = [
    { id: 'HU-1', title: 'Implementación del módulo de reclutamiento en el sistema ENDES', state: 'Por hacer', epic: '-', responsible: 'Nombre 1', priority: 'Media', startDate: '01/02/2025', endDate: '05/02/2025' },
    { id: 'HU-2', title: 'Implementación del módulo de reclutamiento en el sistema ENDES', state: 'Por hacer', epic: '-', responsible: 'Nombre 2', priority: 'Media', startDate: '03/02/2025', endDate: '05/02/2025' },
    { id: 'HU-3', title: 'Implementación del módulo de reclutamiento en el sistema ENDES', state: 'Por hacer', epic: '-', responsible: 'Nombre 3', priority: 'Media', startDate: '05/02/2025', endDate: '08/02/2025' },
    { id: 'HU-4', title: 'Implementación del módulo de reclutamiento en el sistema ENDES', state: 'Por hacer', epic: '-', responsible: 'Nombre 4', priority: 'Media', startDate: '08/02/2025', endDate: '09/02/2025' },
    { id: 'HU-5', title: 'Implementación del módulo de reclutamiento en el sistema ENDES', state: 'Por hacer', epic: '-', responsible: 'Nombre 5', priority: 'Media', startDate: '09/02/2025', endDate: '11/02/2025' },
];

function BacklogContent() {
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState('Backlog');
  const [showEpics, setShowEpics] = useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const savedProjectData = localStorage.getItem('selectedProject');
    if (savedProjectData) {
      setProject(JSON.parse(savedProjectData));
    } else {
      router.push('/poi');
    }
  }, [router]);
  
  if (!project) {
    return (
      <AppLayout navItems={navItems} breadcrumbs={[{ label: 'Cargando...' }]}>
        <div className="flex-1 flex items-center justify-center">Cargando...</div>
      </AppLayout>
    );
  }

  const projectCode = `PROY N°${project.id}`;

  const breadcrumbs = [
    { label: 'POI', href: '/poi' },
    { label: 'Proyecto', href: `/poi/detalles` },
    { label: 'Backlog' },
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
            <Button size="sm" onClick={() => setActiveTab('Backlog')} className={cn(activeTab === 'Backlog' ? 'bg-[#018CD1] text-white' : 'bg-white text-black border-gray-300')} variant={activeTab === 'Backlog' ? 'default' : 'outline'}>Backlog</Button>
            <Button size="sm" onClick={() => setActiveTab('Tablero')} className={cn(activeTab === 'Tablero' ? 'bg-[#018CD1] text-white' : 'bg-white text-black border-gray-300')} variant={activeTab === 'Tablero' ? 'default' : 'outline'}>Tablero</Button>
            <Button size="sm" onClick={() => setActiveTab('Dashboard')} className={cn(activeTab === 'Dashboard' ? 'bg-[#018CD1] text-white' : 'bg-white text-black border-gray-300')} variant={activeTab === 'Dashboard' ? 'default' : 'outline'}>Dashboard</Button>
        </div>

        <div className="flex-1 flex bg-[#F9F9F9] px-4 pb-4">
            {activeTab === 'Backlog' && (
                <div className="flex-1 flex gap-4">
                    {/* Epics Panel */}
                    {showEpics && (
                        <div className="w-1/3 bg-white rounded-lg border p-4 flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold">Épicas</h3>
                                <Button variant="ghost" size="icon" onClick={() => setShowEpics(false)} className="h-6 w-6"><X className="h-4 w-4"/></Button>
                            </div>
                             <div className="flex-1 text-center text-gray-500 flex flex-col justify-center items-center">
                                <p>No hay épicas creadas</p>
                                <Button variant="outline" className="mt-4 bg-gray-100" disabled><Plus className="mr-2 h-4 w-4" />Crear Épica</Button>
                            </div>
                        </div>
                    )}
                    <div className="flex-1 flex flex-col gap-4">
                        {/* Filtros */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input placeholder="Buscar en el backlog" className="pl-10 bg-white" />
                                </div>
                                <Select onValueChange={(value) => { if(value === 'show') setShowEpics(true) }}>
                                    <SelectTrigger className="w-[180px] bg-white">
                                        <SelectValue placeholder="Épica" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="show">Mostrar épicas</SelectItem>
                                        {/* Opciones de epicas */}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="flex items-center gap-2 text-red-500">
                                <Info className="h-5 w-5" />
                            </div>
                        </div>

                        {/* Sprint Board */}
                         <div className="bg-white rounded-lg border p-4 space-y-2">
                             <Collapsible defaultOpen>
                                <div className="flex items-center justify-between">
                                    <CollapsibleTrigger asChild>
                                        <div className="flex items-center gap-2 cursor-pointer group">
                                            <ChevronDown className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                            <h3 className="font-semibold">Tablero Sprint 1 | 01 feb - 14 feb</h3>
                                        </div>
                                    </CollapsibleTrigger>
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" className="bg-[#018CD1]" onClick={() => setActiveTab('Tablero')}>Iniciar Sprint</Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" disabled><MoreHorizontal /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent><DropdownMenuItem>Editar</DropdownMenuItem><DropdownMenuItem>Eliminar</DropdownMenuItem></DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                <CollapsibleContent>
                                    <div className="pl-6">
                                        <Table>
                                             <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[80px]">ID</TableHead>
                                                    <TableHead>Title</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell colSpan={2} className="text-center text-gray-500 py-4">
                                                        Crea historias de usuario en el Backlog y luego asigna al Sprint
                                                    </TableCell>
                                                </TableRow>
                                                 <TableRow>
                                                    <TableCell colSpan={2}>
                                                         <Input className="w-full bg-white" placeholder="Agregar historia de usuario" disabled />
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CollapsibleContent>
                             </Collapsible>
                        </div>
                        
                        {/* Backlog Section */}
                        <div className="bg-white rounded-lg border p-4 space-y-4">
                             <Collapsible defaultOpen>
                                <div className="flex items-center justify-between mb-2">
                                    <CollapsibleTrigger asChild>
                                        <div className="flex items-center gap-2 cursor-pointer group">
                                            <ChevronDown className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                            <h3 className="font-bold text-lg">Backlog</h3>
                                        </div>
                                    </CollapsibleTrigger>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" className="bg-[#018CD1] text-white" disabled>Crear Sprint</Button>
                                        <Button className="bg-[#018CD1]" disabled>Asignar Sprint</Button>
                                    </div>
                                </div>
                                <CollapsibleContent>
                                    <div className="rounded-lg border">
                                    <Table>
                                        <TableHeader className="bg-gray-50">
                                            <TableRow>
                                                <TableHead className="w-[50px]"><Checkbox disabled/></TableHead>
                                                <TableHead>ID</TableHead>
                                                <TableHead>Title</TableHead>
                                                <TableHead>Estado</TableHead>
                                                <TableHead>Épica</TableHead>
                                                <TableHead>Responsable</TableHead>
                                                <TableHead>Prioridad</TableHead>
                                                <TableHead>Fecha Inicio</TableHead>
                                                <TableHead>Fecha Fin</TableHead>
                                                <TableHead>Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {userStories.map(hu => (
                                                <TableRow key={hu.id}>
                                                    <TableCell><Checkbox disabled /></TableCell>
                                                    <TableCell>{hu.id}</TableCell>
                                                    <TableCell>{hu.title}</TableCell>
                                                    <TableCell><Badge className={cn(huStatusColors[hu.state as keyof typeof huStatusColors], 'font-semibold')}>{hu.state}</Badge></TableCell>
                                                    <TableCell>{hu.epic}</TableCell>
                                                    <TableCell>{hu.responsible}</TableCell>
                                                    <TableCell>
                                                        <Badge style={{ backgroundColor: priorityColors[hu.priority as keyof typeof priorityColors]}} className="text-white w-12 justify-center">{hu.priority}</Badge>
                                                    </TableCell>
                                                    <TableCell>{hu.startDate}</TableCell>
                                                    <TableCell>{hu.endDate}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8"><Info className="h-4 w-4" /></Button>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" disabled><MoreHorizontal /></Button></DropdownMenuTrigger>
                                                            <DropdownMenuContent><DropdownMenuItem>Editar</DropdownMenuItem><DropdownMenuItem>Eliminar</DropdownMenuItem></DropdownMenuContent>
                                                        </DropdownMenu>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    </div>
                                </CollapsibleContent>
                             </Collapsible>
                        </div>

                    </div>
                    
                </div>
            )}
            {activeTab === 'Tablero' && (
                <div className="flex-1 flex items-center justify-center text-gray-500 bg-white rounded-lg border">
                    <p>Sección de Tablero en construcción.</p>
                </div>
            )}
             {activeTab === 'Dashboard' && (
                <div className="flex-1 flex items-center justify-center text-gray-500 bg-white rounded-lg border">
                    <p>Sección de Dashboard en construcción.</p>
                </div>
            )}
        </div>
    </AppLayout>
  );
}

export default function BacklogPage() {
    return (
        <React.Suspense fallback={<div>Cargando...</div>}>
            <BacklogContent />
        </React.Suspense>
    );
}


    
    

    