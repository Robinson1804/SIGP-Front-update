"use client";

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Folder,
  Trash2,
  AlertTriangle,
  X,
  ArrowLeft,
  ExternalLink,
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
import { Project, ROLES } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import { paths } from '@/lib/paths';
import { useAuth } from '@/stores';
import { getSubactividadById, deleteSubactividad } from '@/features/actividades/services/subactividades.service';
import type { Subactividad } from '@/features/actividades/types';
import { useToast } from '@/lib/hooks/use-toast';
import {
  DashboardTabContent,
  InformesTabContent,
  TableroTabContent,
} from '@/features/actividades/components/tabs';
import { ListaContent } from '@/app/(dashboard)/poi/actividad/lista/page';

// Types
type SubactividadTab = 'Detalles' | 'Lista' | 'Tablero' | 'Dashboard' | 'Informes';

const statusColors: { [key: string]: string } = {
  'Pendiente': 'bg-[#FE9F43] text-black',
  'En ejecucion': 'bg-[#559FFE] text-white',
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
                    <p className="font-bold text-lg">¿Estas seguro?</p>
                    <p className="text-muted-foreground">{message}</p>
                </div>
                <DialogFooter className="px-6 pb-6 flex justify-center gap-4">
                    <Button variant="outline" onClick={onClose} style={{borderColor: '#CFD6DD', color: 'black'}}>Cancelar</Button>
                    <Button onClick={onConfirm} style={{backgroundColor: '#018CD1', color: 'white'}}>Si, eliminar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function SubactividadDetailsContent() {
    const { user } = useAuth();
    const [project, setProject] = React.useState<Project | null>(null);
    const [subactividadData, setSubactividadData] = React.useState<Subactividad | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    // Get initial tab from URL or default to 'Detalles'
    const initialTab = (searchParams.get('tab') as SubactividadTab) || 'Detalles';
    const [activeTab, setActiveTab] = React.useState<SubactividadTab>(initialTab);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);

    // Determinar rol del usuario
    const userRole = user?.role;
    const isAdmin = userRole === ROLES.ADMIN;
    const isScrumMaster = userRole === ROLES.SCRUM_MASTER;
    const isImplementador = userRole === ROLES.IMPLEMENTADOR;
    const isDesarrollador = userRole === ROLES.DESARROLLADOR;

    // DESARROLLADOR no tiene acceso a Actividades (solo a Proyectos/Scrum)
    React.useEffect(() => {
        if (isDesarrollador) {
            router.push(paths.poi.base);
        }
    }, [isDesarrollador, router]);

    // ADMIN puede todo; SCRUM MASTER e IMPLEMENTADOR solo pueden ver, no editar ni eliminar
    const canDelete = isAdmin || (!isScrumMaster && !isImplementador && !isDesarrollador);

    React.useEffect(() => {
        const idFromParams = searchParams.get('id');
        const tabParam = searchParams.get('tab');

        if (tabParam) {
            setActiveTab(tabParam as SubactividadTab);
        }

        if (idFromParams) {
            // Cargar subactividad desde la API usando el ID del query param
            getSubactividadById(idFromParams).then(sub => {
                setSubactividadData(sub);

                const mapped: Project = {
                    id: sub.id.toString(),
                    code: sub.codigo,
                    name: sub.nombre,
                    type: 'Actividad', // Use 'Actividad' for Project type compatibility
                    description: sub.descripcion || '',
                    status: (sub.estado as Project['status']) || 'Pendiente',
                    classification: sub.clasificacion || 'Gestion interna',
                    scrumMaster: sub.gestor ? `${sub.gestor.nombre} ${sub.gestor.apellido}`.trim() : '',
                    gestor: sub.gestor ? `${sub.gestor.nombre} ${sub.gestor.apellido}`.trim() : '',
                    coordinator: sub.coordinador ? `${sub.coordinador.nombre} ${sub.coordinador.apellido}`.trim() : '',
                    coordination: sub.coordinacion || '',
                    annualAmount: sub.montoAnual || 0,
                    strategicAction: '',
                    years: sub.anios?.map(String) || [],
                    responsibles: [],
                    financialArea: sub.areasFinancieras || [],
                    managementMethod: 'Kanban',
                    subProjects: [],
                    startDate: sub.fechaInicio ? sub.fechaInicio.split('T')[0] : '',
                    endDate: sub.fechaFin ? sub.fechaFin.split('T')[0] : '',
                };
                setProject(mapped);
                // Sincronizar localStorage para que tabs internos funcionen
                localStorage.setItem('selectedSubactividad', JSON.stringify(mapped));
            }).catch(() => {
                router.push(paths.poi.base);
            });
        } else {
            // Fallback: intentar obtener del localStorage
            const savedData = localStorage.getItem('selectedSubactividad');
            if (savedData) {
                const projectData = JSON.parse(savedData);
                setProject(projectData);
            } else {
                router.push(paths.poi.base);
            }
        }
    }, [searchParams, router]);

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        try {
            const datePart = dateString.split('T')[0];
            const parts = datePart.split('-');

            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parts.length >= 3 ? parseInt(parts[2], 10) : 1;

            const date = new Date(year, month, day);
            return date.toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch {
            return dateString;
        }
    };

    const handleDeleteProject = async () => {
        if (!project?.id) return;

        setIsDeleting(true);
        try {
            await deleteSubactividad(project.id);
            localStorage.removeItem('selectedSubactividad');
            toast({
                title: 'Subactividad eliminada',
                description: 'La subactividad ha sido eliminada correctamente',
            });
            setIsDeleteModalOpen(false);

            // Navigate back to parent actividad if we have the parent ID
            if (subactividadData?.actividadPadreId) {
                router.push(`${paths.poi.actividad.detalles}?id=${subactividadData.actividadPadreId}`);
            } else {
                router.push(paths.poi.base);
            }
        } catch (error) {
            console.error('Error al eliminar subactividad:', error);
            toast({
                title: 'Error',
                description: 'No se pudo eliminar la subactividad',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBackToActividad = () => {
        if (subactividadData?.actividadPadreId) {
            router.push(`${paths.poi.actividad.detalles}?id=${subactividadData.actividadPadreId}`);
        } else {
            router.push(paths.poi.base);
        }
    };

    // State-driven tab navigation
    const handleTabClick = (tabName: SubactividadTab) => {
        const newUrl = new URL(window.location.origin + window.location.pathname);
        if (project?.id) {
            newUrl.searchParams.set('id', project.id.toString());
        }
        newUrl.searchParams.set('tab', tabName);
        window.history.pushState({}, '', newUrl.href);

        setActiveTab(tabName);
    };

    if (!project) {
        return (
            <div className="flex h-screen w-full items-center justify-center">Cargando...</div>
        );
    }

    const projectCode = project.code || `SUBACT N${project.id}`;

    // Dynamic breadcrumb based on active tab
    const breadcrumbs = [
        { label: "POI", href: paths.poi.base },
        { label: "Subactividad" },
        { label: activeTab }
    ];

    const allTabs: { name: SubactividadTab }[] = [
        { name: 'Detalles' },
        { name: 'Lista' },
        { name: 'Tablero' },
        { name: 'Dashboard' },
        { name: 'Informes' }
    ];

    const secondaryHeader = (
      <>
        <div className="bg-[#D5D5D5] border-b border-t border-[#1A5581]">
            <div className="p-2 flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBackToActividad}
                        className="text-black hover:bg-black/10 px-2"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Volver a la Actividad
                    </Button>
                    <span className="text-gray-400">|</span>
                    <h2 className="font-bold text-black pl-2">
                        {`${projectCode}: ${project.name}`}
                    </h2>
                </div>
            </div>
        </div>
        <div className="sticky top-[104px] z-10 bg-[#F9F9F9] px-6 pt-4">
          <div className="flex items-center gap-2">
            {allTabs.map(tab => (
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
                {/* Detalles Tab */}
                {activeTab === 'Detalles' && (
                    <div className="p-6">
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
                                            <InfoField label="Clasificación"><p>{project.classification}</p></InfoField>
                                            <InfoField label="Área Financiera">
                                                {project.financialArea && project.financialArea.length > 0
                                                    ? project.financialArea.map(area => <Badge key={area} variant="secondary">{area}</Badge>)
                                                    : <span className="text-gray-400">Sin asignar</span>
                                                }
                                            </InfoField>
                                            <InfoField label="Coordinador"><p>{project.coordinator || ''}</p></InfoField>
                                            <InfoField label="Coordinación"><p>{project.coordination || ''}</p></InfoField>
                                            {/* Actividad Padre */}
                                            <div>
                                                <p className="text-sm font-semibold text-gray-500 mb-1">Actividad Padre</p>
                                                <div className="text-sm p-2 bg-gray-50 rounded-md border min-h-[38px] flex items-center flex-wrap gap-1">
                                                    {subactividadData?.actividadPadre ? (
                                                        <button
                                                            onClick={() => router.push(`${paths.poi.actividad.detalles}?id=${subactividadData.actividadPadreId}`)}
                                                            className="text-[#018CD1] hover:underline flex items-center gap-1"
                                                        >
                                                            <span>{subactividadData.actividadPadre.codigo}: {subactividadData.actividadPadre.nombre}</span>
                                                            <ExternalLink className="h-3 w-3" />
                                                        </button>
                                                    ) : subactividadData?.actividadPadreId ? (
                                                        <button
                                                            onClick={() => router.push(`${paths.poi.actividad.detalles}?id=${subactividadData.actividadPadreId}`)}
                                                            className="text-[#018CD1] hover:underline flex items-center gap-1"
                                                        >
                                                            <span>Actividad #{subactividadData.actividadPadreId}</span>
                                                            <ExternalLink className="h-3 w-3" />
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-400">No disponible</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-500 mb-1">Años</p>
                                                <div className="text-sm p-2 bg-gray-50 rounded-md border min-h-[38px] flex items-center flex-wrap gap-1">
                                                    {project.years?.map(y => {
                                                        const isCurrentYear = y === new Date().getFullYear().toString();
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
                                                        <p>{formatDate(project.startDate || '')}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-500 mb-1">Fecha fin</p>
                                                    <div className="text-sm p-2 bg-gray-50 rounded-md border min-h-[38px] flex items-center">
                                                        <p>{formatDate(project.endDate || '')}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <InfoField label="Método de Gestión"><p>Kanban</p></InfoField>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Lista Tab */}
                {activeTab === 'Lista' && (
                    <ListaContent embedded subactividadId={Number(project.id)} />
                )}

                {/* Tablero Tab */}
                {activeTab === 'Tablero' && project?.id && (
                    <TableroTabContent subactividadId={Number(project.id)} />
                )}

                {/* Dashboard Tab */}
                {activeTab === 'Dashboard' && project?.id && (
                    <DashboardTabContent actividadId={Number(project.id)} />
                )}

                {/* Informes Tab */}
                {activeTab === 'Informes' && project?.id && (
                    <InformesTabContent actividadId={Number(project.id)} />
                )}
            </div>

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteProject}
                title="AVISO"
                message="La Subactividad sera eliminada"
            />
        </AppLayout>
    );
}

export default function SubactividadDetailsPage() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <SubactividadDetailsContent />
        </React.Suspense>
    );
}
