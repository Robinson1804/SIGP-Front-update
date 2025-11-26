
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
  MoreHorizontal,
  Plus,
  X,
  ChevronDown,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Project, Task, Subtask } from '@/lib/definitions';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"


const navItems = [
  { label: 'PGD', icon: FileText, href: '/pgd' },
  { label: 'POI', icon: Target, href: '/poi' },
  { label: 'RECURSOS HUMANOS', icon: Users, href: '/recursos-humanos' },
  { label: 'DASHBOARD', icon: BarChart, href: '/dashboard' },
  { label: 'NOTIFICACIONES', icon: Bell, href: '/notificaciones' },
];

const taskStatusColors: { [key in Task['state']]: string } = {
  'Por hacer': 'bg-[#BFDBFE] text-blue-800',
  'En progreso': 'bg-[#FACC15] text-yellow-900',
  'Completado': 'bg-[#34D399] text-green-900',
  'En revisión': 'bg-purple-200 text-purple-800', 
};

const priorityColors: { [key in Task['priority']]: { bg: string, text: string } } = {
    'Alta': { bg: '#F2B5B5', text: 'text-red-900' },
    'Media': { bg: '#FFD29F', text: 'text-orange-900' },
    'Baja': { bg: '#C5E3B5', text: 'text-green-900' }
};

const initialTasks: Task[] = [
    { 
      id: 'TAR-1', 
      title: 'Crear formulario digital con validaciones para encuestas', 
      state: 'Por hacer', 
      responsible: ['Nombre 1'], 
      priority: 'Media', 
      startDate: '01/02/2025', 
      endDate: '05/02/2025',
      subtasks: [
        { id: 'SUB-1', title: 'Diseñar campos del formulario', state: 'Completado', responsible: ['Nombre 1'], priority: 'Alta', startDate: '01/02/2025', endDate: '02/02/2025', parentTaskId: 'TAR-1' },
        { id: 'SUB-2', title: 'Implementar validaciones de frontend', state: 'En progreso', responsible: ['Nombre 1'], priority: 'Media', startDate: '02/02/2025', endDate: '04/02/2025', parentTaskId: 'TAR-1' },
      ]
    },
    { id: 'TAR-2', title: 'Diseño de la base de datos para almacenar respuestas', state: 'Completado', responsible: ['Nombre 2'], priority: 'Alta', startDate: '03/02/2025', endDate: '05/02/2025', subtasks: [] },
    { id: 'TAR-3', title: 'Implementar backend para recepción de datos', state: 'En progreso', responsible: ['Nombre 3'], priority: 'Baja', startDate: '05/02/2025', endDate: '08/02/2025', subtasks: [] },
];

function TaskModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    if (!isOpen) return null;
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Gestionar Tarea</DialogTitle>
                </DialogHeader>
                <p>La funcionalidad para crear/editar tareas está deshabilitada para el rol PMO.</p>
                <DialogFooter>
                    <Button onClick={onClose}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function SubtaskModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    if (!isOpen) return null;
     return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Gestionar Subtarea</DialogTitle>
                </DialogHeader>
                <p>La funcionalidad para crear/editar subtareas está deshabilitada para el rol PMO.</p>
                <DialogFooter>
                    <Button onClick={onClose}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


const TaskRow = ({ task, isSubtask = false }: { task: Task | Subtask, isSubtask?: boolean }) => {
    const isCompleted = task.state === 'Completado';
    const hasSubtasks = 'subtasks' in task && task.subtasks && task.subtasks.length > 0;
    
    const [isTaskModalOpen, setTaskModalOpen] = useState(false);
    const [isSubtaskModalOpen, setSubtaskModalOpen] = useState(false);

    return (
        <>
            <TableRow className={cn(isSubtask ? "bg-gray-50" : "bg-white")}>
                <TableCell className="w-12">
                   {hasSubtasks ? (
                       <CollapsibleTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8">
                               <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-[-90deg]" />
                           </Button>
                       </CollapsibleTrigger>
                   ) : (
                       !isSubtask && <div className="w-8"></div>
                   )}
                </TableCell>
                <TableCell className={cn("font-medium", isCompleted && "line-through")}>{task.id}</TableCell>
                <TableCell className={cn(isCompleted && "line-through")}>{task.title}</TableCell>
                <TableCell><Badge className={cn(taskStatusColors[task.state], 'font-semibold')}>{task.state}</Badge></TableCell>
                <TableCell>{Array.isArray(task.responsible) ? task.responsible.join(', ') : task.responsible}</TableCell>
                <TableCell>
                    <Badge style={{ backgroundColor: priorityColors[task.priority].bg }} className={cn(priorityColors[task.priority].text, 'w-16 justify-center font-semibold')}>{task.priority}</Badge>
                </TableCell>
                <TableCell>{task.startDate}</TableCell>
                <TableCell>{task.endDate}</TableCell>
                <TableCell className="text-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                                <MoreHorizontal className="h-5 w-5 text-gray-400"/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {!isSubtask && <DropdownMenuItem onClick={() => setSubtaskModalOpen(true)}>Crear Subtarea</DropdownMenuItem>}
                            <DropdownMenuItem onClick={() => setTaskModalOpen(true)}>Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500">Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </TableRow>
            {isSubtask ? <SubtaskModal isOpen={isSubtaskModalOpen} onClose={() => setIsSubtaskModalOpen(false)} /> : <TaskModal isOpen={isTaskModalOpen} onClose={() => setTaskModalOpen(false)} />}
        </>
    );
};


function ListaContent() {
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState('Lista');
  const [tasks, setTasks] = useState(initialTasks);
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

  const projectCode = `ACT Nº${project.id}`;

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
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-320px)] custom-scrollbar">
                <div className="bg-white rounded-lg border">
                    <Table>
                        <TableHeader className="bg-gray-50 sticky top-0">
                            <TableRow>
                                <TableHead className="w-12"></TableHead>
                                <TableHead className="w-[80px]">ID</TableHead>
                                <TableHead>Título</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Responsable</TableHead>
                                <TableHead>Prioridad</TableHead>
                                <TableHead>Fecha Inicio</TableHead>
                                <TableHead>Fecha Fin</TableHead>
                                <TableHead className="text-center">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {tasks.length > 0 ? (
                            tasks.map(task => (
                                <Collapsible key={task.id} asChild>
                                    <>
                                        <TaskRow task={task} />
                                        <CollapsibleContent asChild>
                                            <>
                                                {task.subtasks?.map(subtask => <TaskRow key={subtask.id} task={subtask} isSubtask />)}
                                            </>
                                        </CollapsibleContent>
                                    </>
                                </Collapsible>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={9} className="h-48 text-center text-gray-500">
                                    La lista se encuentra vacía
                                </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                         <tfoot className="border-t">
                            <TableRow>
                                <TableCell colSpan={9}>
                                    <Button variant="ghost" className="text-gray-500 hover:text-gray-800" disabled>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Agregar tarea
                                    </Button>
                                </TableCell>
                            </TableRow>
                        </tfoot>
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
