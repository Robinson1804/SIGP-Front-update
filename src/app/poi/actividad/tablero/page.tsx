
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Target,
  Users,
  BarChart,
  Bell,
  MoreHorizontal,
  Plus,
  Calendar,
  Bookmark,
  MessageSquare
} from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Project } from '@/lib/definitions';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


const navItems = [
  { label: 'PGD', icon: FileText, href: '/pgd' },
  { label: 'POI', icon: Target, href: '/poi' },
  { label: 'RECURSOS HUMANOS', icon: Users, href: '/recursos-humanos' },
  { label: 'DASHBOARD', icon: BarChart, href: '/dashboard' },
  { label: 'NOTIFICACIONES', icon: Bell, href: '/notificaciones' },
];

type KanbanItem = {
    id: string;
    title: string;
    category: string; 
    date: string;
    comments: number;
    assigneeInitials: string;
    priority: string;
    status: 'Por hacer' | 'En progreso' | 'Completado';
};

const tasksData: KanbanItem[] = [
    { id: 'TAR-1', title: 'Actualizar datos del usuario', category: 'General', date: '10 FEB', comments: 2, assigneeInitials: 'N1', priority: 'Media', status: 'Por hacer' },
    { id: 'TAR-2', title: 'Crear componente de tabla reutilizable', category: 'UI', date: '11 FEB', comments: 5, assigneeInitials: 'N3', priority: 'Alta', status: 'Completado' },
];

const categoryColors: {[key: string]: string} = {
    'General': 'bg-green-100 text-green-800',
    'Backend': 'bg-blue-100 text-blue-800',
    'UI': 'bg-purple-100 text-purple-800',
}

const KanbanCard = ({ item }: { item: KanbanItem }) => {
    return (
        <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm mb-3 cursor-grab">
            <div className="flex justify-between items-start">
                <p className="font-semibold text-sm mb-2 pr-2">{item.title}</p>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" disabled>
                            <MoreHorizontal className="h-4 w-4 text-gray-400" />
                        </Button>
                    </DropdownMenuTrigger>
                </DropdownMenu>
            </div>
            <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className={cn("text-xs font-bold", categoryColors[item.category] || 'bg-gray-100 text-gray-800')}>{item.category}</Badge>
                <div className="flex items-center text-xs text-gray-500 gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{item.date}</span>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Bookmark className="w-4 h-4 text-green-500"/>
                    <span>{item.id}</span>
                    <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4"/>
                        <span>{item.comments}</span>
                    </div>
                </div>
                <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-gray-300">{item.assigneeInitials}</AvatarFallback>
                </Avatar>
            </div>
        </div>
    );
};


const KanbanColumn = ({ title, items, onAddTask }: { title: string, items: KanbanItem[], onAddTask: () => void }) => {
    return (
        <div className="bg-gray-100 rounded-lg p-3 w-72 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800">{title}</h3>
                <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3 min-h-[100px]">
                {items.map(item => (
                    <KanbanCard key={item.id} item={item} />
                ))}
            </div>
             <Button variant="ghost" className="w-full justify-start mt-2 text-gray-500" disabled>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo
            </Button>
        </div>
    );
};


function TableroContent() {
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState('Tablero');
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
    else if (tabName === 'Lista') route = '/poi/actividad/lista';
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
    { label: 'Tablero' }
  ];
  
  const statusOrder: KanbanItem['status'][] = ['Por hacer', 'En progreso', 'Completado'];

  const data = tasksData.filter(item => item.id.startsWith('TAR-'));
  const columns = statusOrder.map(status => ({
        title: status,
        items: data.filter(item => item.status === status),
  }));
  
  const activityTabs = [ { name: 'Detalles' }, { name: 'Lista' }, { name: 'Tablero' }, { name: 'Dashboard' }];

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
        <div className="flex items-center justify-between p-4 bg-[#F9F9F9]">
            <div className="flex items-center gap-2">
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
            <Button size="icon" variant="ghost" disabled><Plus className="h-5 w-5 text-gray-600" /></Button>
        </div>

        <div className="flex-1 flex flex-col bg-[#F9F9F9] px-4 pb-4">
            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-4">
                    {columns.map(col => (
                        <KanbanColumn key={col.title} title={col.title} items={col.items} onAddTask={() => {}} />
                    ))}
                </div>
            </div>
        </div>
    </AppLayout>
  );
}

export default function TableroActividadPage() {
    return (
        <React.Suspense fallback={<div>Cargando...</div>}>
            <TableroContent />
        </React.Suspense>
    );
}
