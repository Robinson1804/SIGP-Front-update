
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Folder,
  Trash2,
  Pencil,
  AlertTriangle,
  X,
} from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { POIFullModal } from '@/features/proyectos';
import { Project, ROLES } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import { paths } from '@/lib/paths';
import { useAuth } from '@/stores';

const statusColors: { [key: string]: string } = {
  'Pendiente': 'bg-[#FE9F43] text-black',
  'En planificación': 'bg-[#FFD700] text-black',
  'En desarrollo': 'bg-[#559FFE] text-white',
  'Finalizado': 'bg-[#2FD573] text-white',
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

function ActividadDetailsContent() {
    const { user } = useAuth();
    const [project, setProject] = React.useState<Project | null>(null);
    const router = useRouter();

    const [activeTab, setActiveTab] = React.useState('Detalles');

    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

    // Determinar rol del usuario
    const userRole = user?.role;
    const isScrumMaster = userRole === ROLES.SCRUM_MASTER;
    const isImplementador = userRole === ROLES.IMPLEMENTADOR;

    // SCRUM MASTER solo puede ver, no editar ni eliminar
    const canEdit = !isScrumMaster;
    const canDelete = !isScrumMaster;

    React.useEffect(() => {
        // IMPLEMENTADOR no tiene acceso a Detalles, redirigir a Lista
        if (isImplementador) {
            router.push(paths.poi.actividad.lista);
            return;
        }

        const savedProjectData = localStorage.getItem('selectedProject');
        if (savedProjectData) {
            const projectData = JSON.parse(savedProjectData);
            setProject(projectData);
            if(projectData.type !== 'Actividad') {
                router.push(paths.poi.base);
            }
        } else {
            router.push(paths.poi.base);
        }
    }, [router, isImplementador]);

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
        router.push(paths.poi.base);
    };
    
    const handleTabClick = (tabName: string) => {
        let route = '';
        if (tabName === 'Lista') route = paths.poi.actividad.lista;
        else if (tabName === 'Tablero') route = paths.poi.actividad.tablero;
        else if (tabName === 'Dashboard') route = paths.poi.actividad.dashboard;
        
        if (route) {
            router.push(route);
        } else {
            setActiveTab(tabName);
        }
    };

    if (!project) {
        return (
            <div className="flex h-screen w-full items-center justify-center">Cargando...</div>
        )
    }

    const projectCode = `ACT N° ${project.id}`;
    
    const breadcrumbs = [
        { label: "POI", href: paths.poi.base }, 
        { label: 'Detalles' }
    ];
    
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

    return (
        <AppLayout
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
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className={cn(
                                        "bg-[#EC221F] text-white",
                                        !canDelete && "opacity-50 cursor-not-allowed"
                                    )}
                                    onClick={() => canDelete && setIsDeleteModalOpen(true)}
                                    disabled={!canDelete}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                </Button>
                                <Button
                                    size="sm"
                                    className={cn(
                                        "bg-[#018CD1] text-white",
                                        !canEdit && "opacity-50 cursor-not-allowed"
                                    )}
                                    onClick={() => canEdit && setIsEditModalOpen(true)}
                                    disabled={!canEdit}
                                >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                </Button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-6">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-4">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-500 mb-1">Estado</p>
                                            <Badge className={statusColors[project.status]}>{project.status}</Badge>
                                        </div>
                                        <InfoField label="Gestor"><p>{project.gestor || project.scrumMaster}</p></InfoField>
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
                                            <InfoField label="Coordinación"><p>{project.coordination || ''}</p></InfoField>
                                        </div>
                                        <div className="space-y-4">
                                            <InfoField label="Responsable">
                                                {project.responsibles?.map(r => <Badge key={r} variant="secondary">{r}</Badge>)}
                                            </InfoField>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-500 mb-1">Años</p>
                                                <div className="text-sm p-2 bg-gray-50 rounded-md border min-h-[38px] flex items-center flex-wrap gap-1">
                                                    {project.years?.map(y => {
                                                        const isCurrentYear = y === '2025';
                                                        return (
                                                            <Badge
                                                                key={y}
                                                                variant="secondary"
                                                                className={cn(
                                                                    isCurrentYear && "border-2 border-[#018CD1] bg-[#E6F3FF] text-[#018CD1] font-semibold"
                                                                )}
                                                            >
                                                                {y}
                                                            </Badge>
                                                        );
                                                    })}
                                                </div>
                                            </div>
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
                        </div>
                        </>
                    )}
                </div>

            </div>

             {isEditModalOpen && project && (
                <POIFullModal
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
