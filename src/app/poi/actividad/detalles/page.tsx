
"use client";

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileText,
  Target,
  Users,
  BarChart,
  Bell,
  Folder,
  Trash2,
  Pencil,
  Briefcase,
  DollarSign,
  Users as UsersIcon,
  CheckCircle,
  MoreHorizontal,
  AlertTriangle,
  X,
} from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { POIModal } from '@/app/poi/page';
import { Project } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const sprints = [
  { name: 'Sprint 1', status: 'Finalizado', progress: 100 },
  { name: 'Sprint 2', status: 'En progreso', progress: 50 },
  { name: 'Sprint 3', status: 'En progreso', progress: 25 },
  { name: 'Sprint 4', status: 'Por hacer', progress: 0 },
];

const statusColors: { [key: string]: string } = {
  'Pendiente': 'bg-[#FE9F43] text-black',
  'En planificación': 'bg-[#FFD700] text-black',
  'En desarrollo': 'bg-[#559FFE] text-white',
  'Finalizado': 'bg-[#2FD573] text-white',
};

const sprintStatusConfig: { [key: string]: { badge: string; progress: string } } = {
    'Por hacer': { badge: 'bg-[#FFD29F] text-black', progress: 'bg-[#FFD29F]' },
    'En progreso': { badge: 'bg-[#BFDBFE] text-black', progress: 'bg-[#BFDBFE]' },
    'Finalizado': { badge: 'bg-[#34D399] text-black', progress: 'bg-[#34D399]' },
};


const InfoField = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div>
        <p className="text-sm font-semibold text-gray-500 mb-1">{label}</p>
        <div className="text-sm p-2 bg-gray-50 rounded-md border min-h-[38px] flex items-center flex-wrap gap-1">
            {children}
        </div>
    </div>
);

function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}) {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-0" showCloseButton={false}>
                 <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between">
                    <DialogTitle>{title}</DialogTitle>
                     <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white">
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogClose>
                </DialogHeader>
                <div className="p-6 text-center flex flex-col items-center">
                    <AlertTriangle className="h-16 w-16 text-black mb-4" strokeWidth={1.5}/>
                    <p className="font-bold text-lg">¿Estás seguro?</p>
                    <p className="text-muted-foreground">{message}</p>
                </div>
                <DialogFooter className="px-6 pb-6 flex justify-center gap-4">
                    <Button variant="outline" onClick={onClose} style={{borderColor: '#CFD6DD', color: 'black'}}>Cancelar</Button>
                    <Button onClick={onConfirm} style={{backgroundColor: '#018CD1', color: 'white'}}>Sí, eliminar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const navItems = [
  { label: "PGD", icon: FileText, href: "/pgd" },
  { label: "POI", icon: Target, href: "/poi" },
  { label: "RECURSOS HUMANOS", icon: Users, href: "/recursos-humanos" },
  { label: "DASHBOARD", icon: BarChart, href: "/dashboard" },
  { label: "NOTIFICACIONES", icon: Bell, href: "/notificaciones" },
];

function ActividadDetailsContent() {
    const [project, setProject] = React.useState<Project | null>(null);
    const router = useRouter();
    
    const [activeTab, setActiveTab] = React.useState('Detalles');
    
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    

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

    const formatMonthYear = (dateString: string) => {
        if (!dateString) return '';
        const [year, month] = dateString.split('-');
        const date = new Date(Number(year), Number(month) - 1);
        return date.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
    }

    const handleSaveProject = (updatedProject: Project) => {
        setProject(updatedProject);
        localStorage.setItem('selectedProject', JSON.stringify(updatedProject));
        setIsEditModalOpen(false);
    };

    const handleDeleteProject = () => {
        localStorage.removeItem('selectedProject');
        setIsDeleteModalOpen(false);
        router.push('/poi');
    };
    
    const handleTabClick = (tabName: string) => {
        let route = '';
        if (tabName === 'Lista') route = '/poi/actividad/lista';
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
             <AppLayout navItems={navItems} breadcrumbs={[{ label: 'POI', href: '/poi' }, { label: 'Cargando...' }]}>
                <div className="flex-1 flex items-center justify-center">Cargando...</div>
             </AppLayout>
        )
    }

    const projectCode = `ACT N° ${project.id}`;
    
    const breadcrumbs = [{ label: "POI", href: "/poi" }, { label: 'Detalles' }];
    
    const activityTabs = [ { name: 'Detalles' }, { name: 'Lista' }, { name: 'Tablero' }, { name: 'Dashboard' }];

    const secondaryHeader = (
      <>
        <div className="bg-[#D5D5D5] border-b border-t border-[#1A5581]">
            <div className="p-2 flex items-center justify-between w-full">
                <h2 className="font-bold text-black pl-2">
                    {`${projectCode}: ${project.name}`}
                </h2>
            </div>
        </div>
        <div className="sticky top-[104px] z-10 bg-[#F9F9F9] px-6 pt-4">
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
        </div>
      </>
    );
    
    const totalProgress = sprints.reduce((acc, sprint) => acc + sprint.progress, 0);
    const generalProgress = sprints.length > 0 ? Math.round(totalProgress / sprints.length) : 0;

    return (
        <AppLayout
            navItems={navItems}
            breadcrumbs={breadcrumbs}
            secondaryHeader={secondaryHeader}
        >
            <div className="flex-1 flex flex-col bg-[#F9F9F9]">
                <div className="p-6">
                    {activeTab === 'Detalles' && (
                        <>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Folder className="w-6 h-6 text-gray-700" />
                                <h3 className="text-xl font-bold">{`${projectCode}: ${project.name}`}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="destructive" size="sm" className="bg-[#EC221F] text-white" onClick={() => setIsDeleteModalOpen(true)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                </Button>
                                <Button size="sm" className="bg-[#018CD1] text-white" onClick={() => setIsEditModalOpen(true)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                </Button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2">
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-4">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-500 mb-1">Estado</p>
                                            <Badge className={statusColors[project.status]}>{project.status}</Badge>
                                        </div>
                                        <InfoField label="Gestor/Scrum Master"><p>{project.scrumMaster}</p></InfoField>
                                    </div>
                                    <div className="md:col-span-2 mb-4">
                                        <InfoField label="Descripción"><p>{project.description}</p></InfoField>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                        <div className="space-y-4">
                                            <InfoField label="Acción estratégica"><p>{project.strategicAction}</p></InfoField>
                                            <InfoField label="Clasificación"><p>{project.classification}</p></InfoField>
                                            <InfoField label="Área Financiera">
                                                {project.financialArea?.map(area => <Badge key={area} variant="secondary">{area}</Badge>)}
                                            </InfoField>
                                            <InfoField label="Coordinador"><p>{project.coordinator || ''}</p></InfoField>
                                        </div>
                                        <div className="space-y-4">
                                            <InfoField label="Coordinación"><p>{project.coordination || ''}</p></InfoField>
                                            <InfoField label="Responsable">
                                                {project.responsibles?.map(r => <Badge key={r} variant="secondary">{r}</Badge>)}
                                            </InfoField>
                                            <InfoField label="Año">
                                                {project.years?.map(y => <Badge key={y} variant="secondary">{y}</Badge>)}
                                            </InfoField>
                                            <InfoField label="Monto Anual"><p>S/ {project.annualAmount.toLocaleString('es-PE')}</p></InfoField>
                                            <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                    <p className="text-sm font-semibold text-gray-500 mb-1">Fecha inicio</p>
                                                    <div className="text-sm p-2 bg-gray-50 rounded-md border min-h-[38px] flex items-center">
                                                        <p>{formatMonthYear(project.startDate || '')}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-500 mb-1">Fecha fin</p>
                                                    <div className="text-sm p-2 bg-gray-50 rounded-md border min-h-[38px] flex items-center">
                                                        <p>{formatMonthYear(project.endDate || '')}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <InfoField label="Método de Gestión de Proyecto"><p>{project.managementMethod || ''}</p></InfoField>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <div className="flex flex-col gap-6">
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-base font-semibold">Progreso General</CardTitle>
                                        <span className="font-bold text-base">{generalProgress}%</span>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Progress value={generalProgress} indicatorClassName="bg-blue-500" />
                                </CardContent>
                            </Card>
                            <Card className="flex-grow flex flex-col">
                                <CardHeader><CardTitle className="text-base font-semibold">Progreso por Sprints</CardTitle></CardHeader>
                                <CardContent className="space-y-6 flex-grow flex flex-col justify-center">
                                    {sprints.map((sprint, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-medium">{sprint.name}</span>
                                                <Badge className={sprintStatusConfig[sprint.status].badge}>{sprint.status}</Badge>
                                            </div>
                                            <Progress value={sprint.progress} indicatorClassName={sprintStatusConfig[sprint.status].progress} />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                        </div>
                        </>
                    )}
                </div>

            </div>

             {isEditModalOpen && project && (
                <POIModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    project={project}
                    onSave={handleSaveProject}
                />
             )}

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteProject}
                title="AVISO"
                message="La Actividad será eliminada"
            />
        </AppLayout>
    );
}


export default function DetailsPage() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <ActividadDetailsContent />
        </React.Suspense>
    )
}
