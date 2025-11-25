

"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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

const huStatusColors: { [key: string]: string } = {
  'Por hacer': 'bg-[#BFDBFE] text-blue-800',
  'En progreso': 'bg-[#FDE68A] text-yellow-800',
  'Revisión': 'bg-[#A78BFA] text-purple-800',
  'Finalizado': 'bg-[#A7F3D0] text-green-800',
};

const priorityColors: { [key: string]: { bg: string, text: string } } = {
    'Alta': { bg: 'bg-red-200', text: 'text-red-800' },
    'Media': { bg: 'bg-yellow-200', text: 'text-yellow-800' },
    'Baja': { bg: 'bg-green-200', text: 'text-green-800' }
};

const sprint1UserStories = [
    { id: 'HU-1', title: 'Implementación del módulo de reclutamiento en el sistema ENDES', state: 'Por hacer', epic: '-', responsible: 'Nombre 1', priority: 'Media', startDate: '01/02/2025', endDate: '05/02/2025' },
    { id: 'HU-2', title: 'Implementación del módulo de reclutamiento en el sistema ENDES', state: 'Por hacer', epic: '-', responsible: 'Nombre 1', priority: 'Media', startDate: '03/02/2025', endDate: '05/02/2025' },
    { id: 'HU-3', title: 'Implementación del módulo de reclutamiento en el sistema ENDES', state: 'Por hacer', epic: '-', responsible: 'Nombre 1', priority: 'Media', startDate: '05/02/2025', endDate: '08/02/2025' },
    { id: 'HU-4', title: 'Implementación del módulo de reclutamiento en el sistema ENDES', state: 'Por hacer', epic: '-', responsible: 'Nombre 1', priority: 'Media', startDate: '08/02/2025', endDate: '09/02/2025' },
    { id: 'HU-5', title: 'Implementación del módulo de reclutamiento en el sistema ENDES', state: 'Por hacer', epic: '-', responsible: 'Nombre 1', priority: 'Media', startDate: '09/02/2025', endDate: '11/02/2025' },
    { id: 'HU-6', title: 'Implementación del módulo de reclutamiento en el sistema ENDES', state: 'Finalizado', epic: '-', responsible: 'Nombre 2', priority: 'Alta', startDate: '11/02/2025', endDate: '14/02/2025' },
];

const sprint2UserStories = [
    { id: 'HU-7', title: 'Captura y procesamiento eficiente de datos censales en plataformas web', state: 'Por hacer', epic: '-', responsible: 'Nombre 2', priority: 'Media', startDate: '14/02/2025', endDate: '17/02/2025' },
    { id: 'TAR-1', title: 'Crear formulario digital con validaciones para encuestas', state: 'Por hacer', epic: '-', responsible: 'Nombre 2', priority: 'Media', startDate: '14/02/2025', endDate: '15/02/2025' },
];

const mockEpics = [
    { id: 'no-epic', label: 'Historias sin épica'},
    { id: 'auth', label: 'Autenticación de Usua...'},
    { id: 'dashboard', label: 'Renovación del Dashb...'},
    { id: 'payments', label: 'Integración de Pagos'},
    { id: 'reports', label: 'Módulo de Reportes'},
];

function InfoModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    if (!isOpen) return null;
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-8 text-center" showCloseButton={false}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-[#018CD1] rounded-full flex items-center justify-center">
                        <Info className="w-12 h-12 text-white" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">FINALIZACIÓN DE HU</DialogTitle>
                    </DialogHeader>
                    <ol className="text-left space-y-3 list-decimal list-inside text-gray-700">
                        <li><span className="font-bold">Agrega Tareas:</span> Toda HU debe tener tareas.</li>
                        <li><span className="font-bold">Finaliza Tareas:</span> Cada tarea requiere evidencia (imagen/PDF).</li>
                        <li><span className="font-bold">Completa HU:</span> La HU finaliza al completar todas sus tareas.</li>
                    </ol>
                    <DialogFooter className="mt-4 w-full">
                        <Button onClick={onClose} className="w-full bg-[#018CD1] hover:bg-[#018CD1]/90">Entendido</Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function BacklogContent() {
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState('Backlog');
  const [showEpicsPanel, setShowEpicsPanel] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
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
    if (tabName === 'Tablero') route = '/poi/proyecto/backlog/tablero';
    else if (tabName === 'Dashboard') route = '/poi/proyecto/backlog/dashboard';
    
    if (route) {
        router.push(route);
    } else {
        setActiveTab(tabName);
        router.push('/poi/proyecto/backlog');
    }
  };
  
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
    { label: <Link href="/poi/proyecto/detalles">Proyecto</Link> },
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
            <Button size="sm" onClick={() => handleTabClick('Backlog')} className={cn(activeTab === 'Backlog' ? 'bg-[#018CD1] text-white' : 'bg-white text-black border-gray-300')} variant={activeTab === 'Backlog' ? 'default' : 'outline'}>Backlog</Button>
            <Button size="sm" onClick={() => handleTabClick('Tablero')} className={cn(activeTab === 'Tablero' ? 'bg-[#018CD1] text-white' : 'bg-white text-black border-gray-300')} variant={'outline'}>Tablero</Button>
            <Button size="sm" onClick={() => handleTabClick('Dashboard')} className={cn(activeTab === 'Dashboard' ? 'bg-[#018CD1] text-white' : 'bg-white text-black border-gray-300')} variant={'outline'}>Dashboard</Button>
        </div>

        <div className="flex-1 flex flex-col bg-[#F9F9F9] px-4 pb-4">
            {activeTab === 'Backlog' && (
                <div className="flex-1 flex flex-col gap-4">
                    {/* Filtros */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input placeholder="Buscar en el backlog" className="pl-10 bg-white" />
                            </div>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button variant="outline" className="bg-white">
                                    Épica
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0 w-60">
                                    <div className='p-2'>
                                        <p className="text-sm font-semibold p-2">Filtrar por épica</p>
                                        <div className="space-y-2 px-2">
                                            {mockEpics.map(epic => (
                                                <div key={epic.id} className="flex items-center space-x-2">
                                                    <Checkbox id={epic.id} />
                                                    <label htmlFor={epic.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                        {epic.label}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="p-2 flex items-center space-x-2">
                                        <Switch id="manage-epics" onCheckedChange={setShowEpicsPanel} checked={showEpicsPanel} />
                                        <label htmlFor="manage-epics">Gestionar Épicas</label>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                         <div className="flex items-center gap-2">
                            <Info className="h-6 w-6 text-red-700 cursor-pointer" strokeWidth={2.5} onClick={() => setIsInfoModalOpen(true)} />
                        </div>
                    </div>
                    
                    <div className="flex-1 flex items-start gap-4">
                        {/* Epics Panel */}
                        {showEpicsPanel && (
                             <div className="w-1/3 lg:w-1/4 sticky top-4">
                                <div className="bg-white rounded-lg border p-4 flex flex-col">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold">Épicas</h3>
                                        <Button variant="ghost" size="icon" onClick={() => setShowEpicsPanel(false)} className="h-6 w-6"><X className="h-4 w-4"/></Button>
                                    </div>
                                    <div className="flex-grow text-center text-gray-500 flex flex-col justify-center items-center py-8">
                                        <p>No hay épicas creadas</p>
                                    </div>
                                    <Button variant="outline" className="mt-4 bg-gray-100" disabled><Plus className="mr-2 h-4 w-4" />Crear Épica</Button>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-320px)] custom-scrollbar">
                            <div className="flex flex-col gap-4">
                                {/* Sprint 1 Board */}
                                <div className="bg-white rounded-lg border">
                                    <Collapsible defaultOpen>
                                        <div className="flex items-center justify-between p-4">
                                            <CollapsibleTrigger asChild>
                                                <div className="flex items-center gap-2 cursor-pointer group">
                                                    <ChevronDown className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                                    <h3 className="font-semibold">Tablero Sprint 1 | 01 feb - 14 feb</h3>
                                                </div>
                                            </CollapsibleTrigger>
                                            <div className="flex items-center gap-2">
                                                <Button size="sm" className="bg-[#018CD1]" onClick={() => handleTabClick('Tablero')}>Iniciar Sprint</Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" disabled><MoreHorizontal /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent><DropdownMenuItem>Editar</DropdownMenuItem><DropdownMenuItem>Eliminar</DropdownMenuItem></DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                        <CollapsibleContent>
                                            <div className="px-4 pb-4">
                                                <Table>
                                                    <TableHeader className="bg-gray-50">
                                                        <TableRow>
                                                            <TableHead className="w-[80px]">ID</TableHead>
                                                            <TableHead>Title</TableHead>
                                                            <TableHead>Estado</TableHead>
                                                            <TableHead>Épica</TableHead>
                                                            <TableHead>Responsable</TableHead>
                                                            <TableHead>Prioridad</TableHead>
                                                            <TableHead>Fecha Inicio</TableHead>
                                                            <TableHead>Fecha Fin</TableHead>
                                                            <TableHead></TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                    {sprint1UserStories.map(hu => (
                                                        <TableRow key={hu.id}>
                                                            <TableCell>{hu.id}</TableCell>
                                                            <TableCell>{hu.title}</TableCell>
                                                            <TableCell><Badge className={cn(huStatusColors[hu.state as keyof typeof huStatusColors], 'font-semibold')}>{hu.state}</Badge></TableCell>
                                                            <TableCell>{hu.epic}</TableCell>
                                                            <TableCell>{hu.responsible}</TableCell>
                                                            <TableCell>
                                                                <Badge className={cn(priorityColors[hu.priority as keyof typeof priorityColors].bg, priorityColors[hu.priority as keyof typeof priorityColors].text, 'w-16 justify-center')}>{hu.priority}</Badge>
                                                            </TableCell>
                                                            <TableCell>{hu.startDate}</TableCell>
                                                            <TableCell>{hu.endDate}</TableCell>
                                                            <TableCell><MoreHorizontal className="h-5 w-5 text-gray-400"/></TableCell>
                                                        </TableRow>
                                                    ))}
                                                    </TableBody>
                                                </Table>
                                                <Input className="w-full bg-gray-100 mt-2" placeholder="+ Crear historia de usuario" disabled />
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                </div>

                                {/* Sprint 2 Board */}
                                <div className="bg-white rounded-lg border">
                                    <Collapsible defaultOpen>
                                        <div className="flex items-center justify-between p-4">
                                            <CollapsibleTrigger asChild>
                                                <div className="flex items-center gap-2 cursor-pointer group">
                                                    <ChevronDown className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                                    <h3 className="font-semibold">Tablero Sprint 2 | 14 feb - 28 feb</h3>
                                                </div>
                                            </CollapsibleTrigger>
                                            <div className="flex items-center gap-2">
                                                <Button size="sm" className="bg-[#018CD1]" onClick={() => handleTabClick('Tablero')}>Iniciar Sprint</Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" disabled><MoreHorizontal /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent><DropdownMenuItem>Editar</DropdownMenuItem><DropdownMenuItem>Eliminar</DropdownMenuItem></DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                        <CollapsibleContent>
                                            <div className="px-4 pb-4">
                                                <Table>
                                                    <TableHeader className="bg-gray-50">
                                                        <TableRow>
                                                            <TableHead className="w-[50px]"><Checkbox disabled/></TableHead>
                                                            <TableHead className="w-[80px]">ID</TableHead>
                                                            <TableHead>Title</TableHead>
                                                            <TableHead>Estado</TableHead>
                                                            <TableHead>Épica</TableHead>
                                                            <TableHead>Responsable</TableHead>
                                                            <TableHead>Prioridad</TableHead>
                                                            <TableHead>Fecha Inicio</TableHead>
                                                            <TableHead>Fecha Fin</TableHead>
                                                            <TableHead></TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                    {sprint2UserStories.map(hu => (
                                                        <TableRow key={hu.id}>
                                                            <TableCell><Checkbox disabled/></TableCell>
                                                            <TableCell>{hu.id}</TableCell>
                                                            <TableCell>{hu.title}</TableCell>
                                                            <TableCell><Badge className={cn(huStatusColors[hu.state as keyof typeof huStatusColors], 'font-semibold')}>{hu.state}</Badge></TableCell>
                                                            <TableCell>{hu.epic}</TableCell>
                                                            <TableCell>{hu.responsible}</TableCell>
                                                            <TableCell>
                                                                <Badge className={cn(priorityColors[hu.priority as keyof typeof priorityColors].bg, priorityColors[hu.priority as keyof typeof priorityColors].text, 'w-16 justify-center')}>{hu.priority}</Badge>
                                                            </TableCell>
                                                            <TableCell>{hu.startDate}</TableCell>
                                                            <TableCell>{hu.endDate}</TableCell>
                                                            <TableCell><MoreHorizontal className="h-5 w-5 text-gray-400"/></TableCell>
                                                        </TableRow>
                                                    ))}
                                                    </TableBody>
                                                </Table>
                                                <Input className="w-full bg-gray-100 mt-2" placeholder="+ Crear historia de usuario" disabled />
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
                                                <Button variant="outline" className="bg-gray-100" disabled>Crear Sprint</Button>
                                            </div>
                                        </div>
                                        <CollapsibleContent>
                                             <div className="px-4 pb-4">
                                                <div className="text-center text-gray-500 py-8">
                                                El backlog está vacío
                                                </div>
                                                <Input className="w-full bg-gray-100" placeholder="+ Crear historia de usuario" disabled />
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
        <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
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
