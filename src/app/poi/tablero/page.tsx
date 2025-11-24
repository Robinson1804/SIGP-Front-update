
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


const navItems = [
  { label: 'PGD', icon: FileText, href: '/pmo-dashboard' },
  { label: 'POI', icon: Target, href: '/poi' },
  { label: 'RECURSOS HUMANOS', icon: Users, href: '/recursos-humanos' },
  { label: 'DASHBOARD', icon: BarChart, href: '/dashboard' },
  { label: 'NOTIFICACIONES', icon: Bell, href: '/notificaciones' },
];

type UserStory = {
    id: string;
    title: string;
    epic: string;
    date: string;
    points: number;
    comments: number;
    assignee: string;
    status: 'Por hacer' | 'En progreso' | 'En revisión' | 'Finalizado';
};

const userStoriesData: UserStory[] = [
    { id: 'HU-1', title: 'Implementación del módulo de reclutamiento en el sistema ENDES', epic: 'NOMBRE EPICA 1', date: '01 FEB', points: 80, comments: 0, assignee: 'U', status: 'Por hacer' },
    { id: 'HU-3', title: 'Desarrollo e Implementación del módulo de reclutamiento', epic: 'NOMBRE EPICA 1', date: '06 FEB', points: 80, comments: 0, assignee: 'U', status: 'En progreso' },
];

const KanbanCard = ({ story }: { story: UserStory }) => {
    return (
        <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm mb-3 cursor-grab">
            <div className="flex justify-between items-start">
                <p className="font-semibold text-sm mb-2 pr-2">{story.title}</p>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" disabled>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                </DropdownMenu>
            </div>
            <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs font-bold">{story.epic}</Badge>
                <div className="flex items-center text-xs text-gray-500 gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{story.date}</span>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Bookmark className="w-4 h-4 text-green-500"/>
                    <span>{story.id}</span>
                    <span className="font-bold text-blue-600">{story.points}</span>
                    <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4"/>
                        <span>{story.comments}</span>
                    </div>
                </div>
                <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-gray-300">{story.assignee}</AvatarFallback>
                </Avatar>
            </div>
        </div>
    );
};


const KanbanColumn = ({ title, stories }: { title: string, stories: UserStory[] }) => {
    return (
        <div className="bg-gray-100 rounded-lg p-3 w-72 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800">{title}</h3>
                <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
                {stories.map(story => (
                    <KanbanCard key={story.id} story={story} />
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
      setProject(JSON.parse(savedProjectData));
    } else {
      router.push('/poi');
    }
  }, [router]);

  const handleTabClick = (tabName: string) => {
    if (tabName === 'Backlog') {
        router.push('/poi/backlog');
    } else if (tabName === 'Dashboard') {
        router.push('/poi/dashboard');
    } else {
        setActiveTab(tabName);
    }
  };

  const handleCloseSprint = () => {
    router.push('/poi/backlog');
  }
  
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
    { label: 'Tablero' },
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
  
  const columns: { title: UserStory['status'], stories: UserStory[] }[] = [
    { title: 'Por hacer', stories: userStoriesData.filter(s => s.status === 'Por hacer') },
    { title: 'En progreso', stories: userStoriesData.filter(s => s.status === 'En progreso') },
    { title: 'En revisión', stories: userStoriesData.filter(s => s.status === 'En revisión') },
    { title: 'Finalizado', stories: userStoriesData.filter(s => s.status === 'Finalizado') },
  ];


  return (
    <AppLayout
      navItems={navItems}
      breadcrumbs={breadcrumbs}
      secondaryHeader={secondaryHeader}
    >
        <div className="flex items-center gap-2 p-4 bg-[#F9F9F9]">
            <Button size="sm" onClick={() => handleTabClick('Backlog')} className={cn(activeTab === 'Backlog' ? 'bg-[#018CD1] text-white' : 'bg-white text-black border-gray-300')} variant='outline'>Backlog</Button>
            <Button size="sm" onClick={() => setActiveTab('Tablero')} className={cn(activeTab === 'Tablero' ? 'bg-[#018CD1] text-white' : 'bg-white text-black border-gray-300')} variant='default'>Tablero</Button>
            <Button size="sm" onClick={() => handleTabClick('Dashboard')} className={cn(activeTab === 'Dashboard' ? 'bg-[#018CD1] text-white' : 'bg-white text-black border-gray-300')} variant='outline'>Dashboard</Button>
        </div>

        <div className="flex-1 flex flex-col bg-[#F9F9F9] px-4 pb-4">
            {activeTab === 'Tablero' && (
                <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-4">
                            <Select defaultValue="sprint1">
                                <SelectTrigger className="w-[180px] bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sprint1">Sprint 1</SelectItem>
                                    <SelectItem value="sprint2">Sprint 2</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                             <Button className="bg-[#018CD1]" onClick={handleCloseSprint}>Cerrar Sprint</Button>
                             <Button variant="outline" className="h-9 w-9 p-0" disabled><Plus className="h-5 w-5" /></Button>
                        </div>
                    </div>
                     <div className="flex-1 overflow-x-auto pb-4">
                        <div className="flex gap-4">
                            {columns.map(col => (
                                <KanbanColumn key={col.title} title={col.title} stories={col.stories} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    </AppLayout>
  );
}

export default function TableroPage() {
    return (
        <React.Suspense fallback={<div>Cargando...</div>}>
            <TableroContent />
        </React.Suspense>
    );
}
