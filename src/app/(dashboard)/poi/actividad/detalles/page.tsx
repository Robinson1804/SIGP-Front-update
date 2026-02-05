"use client";

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { useAuth, usePGD } from '@/stores';
import { getAsignacionesActividad } from '@/features/rrhh/services/rrhh.service';
import { deleteActividad, getActividadById } from '@/features/actividades/services/actividades.service';
import { useToast } from '@/lib/hooks/use-toast';
import {
  DashboardTabContent,
  InformesTabContent,
  TableroTabContent,
} from '@/features/actividades/components/tabs';
import { ListaContent } from '@/app/(dashboard)/poi/actividad/lista/page';

// Types
type ActivityTab = 'Detalles' | 'Lista' | 'Tablero' | 'Dashboard' | 'Informes';

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
    const { selectedPGD } = usePGD();
    const [project, setProject] = React.useState<Project | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    // Get initial tab from URL or default to 'Detalles'
    const initialTab = (searchParams.get('tab') as ActivityTab) || 'Detalles';
    const [activeTab, setActiveTab] = React.useState<ActivityTab>(initialTab);

    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);

    // Estado para los nombres resueltos de responsables
    const [responsablesNombres, setResponsablesNombres] = React.useState<string[]>([]);

    // Determinar rol del usuario - ADMIN tiene acceso total
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

    // ADMIN puede todo; SCRUM MASTER e IMPLEMENTADOR solo pueden ver, no editar ni eliminar la actividad
    const canEdit = isAdmin || (!isScrumMaster && !isImplementador && !isDesarrollador);
    const canDelete = isAdmin || (!isScrumMaster && !isImplementador && !isDesarrollador);

    React.useEffect(() => {
        const idFromParams = searchParams.get('id');
        const tabParam = searchParams.get('tab');

        if (tabParam) {
            setActiveTab(tabParam as ActivityTab);
        }

        if (idFromParams) {
            // Cargar actividad desde la API usando el ID del query param
            getActividadById(idFromParams).then(actividad => {
                if (actividad.tipo !== 'Actividad') {
                    router.push(paths.poi.base);
                    return;
                }
                const mapped: Project = {
                    id: actividad.id.toString(),
                    code: actividad.codigo,
                    name: actividad.nombre,
                    type: 'Actividad',
                    description: actividad.descripcion || '',
                    status: actividad.estado || 'Pendiente',
                    classification: actividad.clasificacion || 'Gestion interna',
                    scrumMaster: '',
                    gestor: actividad.gestor ? `${actividad.gestor.nombre} ${actividad.gestor.apellido}`.trim() : '',
                    coordinator: actividad.coordinador ? `${actividad.coordinador.nombre} ${actividad.coordinador.apellido}`.trim() : '',
                    coordination: actividad.coordinacion || '',
                    annualAmount: actividad.montoAnual || 0,
                    strategicAction: actividad.accionEstrategica?.nombre || '',
                    years: actividad.anios?.map((a: number) => a.toString()) || [],
                    responsibles: [],
                    financialArea: actividad.areasFinancieras || [],
                    managementMethod: 'Kanban',
                    subProjects: [],
                    startDate: actividad.fechaInicio,
                    endDate: actividad.fechaFin,
                };
                setProject(mapped);
                // Sincronizar localStorage para que tabs internos funcionen
                localStorage.setItem('selectedProject', JSON.stringify(mapped));
            }).catch(() => {
                router.push(paths.poi.base);
            });
        } else {
            // Fallback: intentar obtener del localStorage
            const savedProjectData = localStorage.getItem('selectedProject');
            if (savedProjectData) {
                const projectData = JSON.parse(savedProjectData);
                if (projectData.type !== 'Actividad') {
                    router.push(paths.poi.base);
                } else {
                    setProject(projectData);
                }
            } else {
                router.push(paths.poi.base);
            }
        }
    }, [searchParams, router]);

    // Efecto para cargar los responsables desde las asignaciones de la actividad
    React.useEffect(() => {
        const cargarResponsables = async () => {
            if (!project?.id) {
                setResponsablesNombres([]);
                return;
            }

            try {
                const asignaciones = await getAsignacionesActividad(project.id);

                const nombres = asignaciones
                    .filter(a => a.activo && a.personal)
                    .map(a => {
                        const p = a.personal!;
                        const nombre = p.nombres || (p as any).nombre || '';
                        const apellido = p.apellidos || (p as any).apellido || '';
                        return `${nombre} ${apellido}`.trim() || `Personal #${a.personalId}`;
                    });

                setResponsablesNombres(nombres);
            } catch (error) {
                console.error('Error al cargar responsables de la actividad:', error);
                if (project.responsibles && project.responsibles.length > 0) {
                    const sonIds = project.responsibles.every(r => !isNaN(Number(r)));
                    if (!sonIds) {
                        setResponsablesNombres(project.responsibles);
                    } else {
                        setResponsablesNombres(project.responsibles.map(id => `Personal #${id}`));
                    }
                } else {
                    setResponsablesNombres([]);
                }
            }
        };

        cargarResponsables();
    }, [project?.id]);

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
    }

    const handleSaveProject = (updatedProject: Project) => {
        setProject(updatedProject);
        localStorage.setItem('selectedProject', JSON.stringify(updatedProject));
        setIsEditModalOpen(false);
    };

    const handleDeleteProject = async () => {
        if (!project?.id) return;

        setIsDeleting(true);
        try {
            await deleteActividad(project.id);
            localStorage.removeItem('selectedProject');
            toast({
                title: 'Actividad eliminada',
                description: 'La actividad ha sido eliminada correctamente',
            });
            setIsDeleteModalOpen(false);
            router.push(paths.poi.base);
        } catch (error) {
            console.error('Error al eliminar actividad:', error);
            toast({
                title: 'Error',
                description: 'No se pudo eliminar la actividad',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    // State-driven tab navigation (like Projects)
    const handleTabClick = (tabName: ActivityTab) => {
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
        )
    }

    const projectCode = project.code || `ACT N°${project.id}`;

    // Dynamic breadcrumb based on active tab
    const breadcrumbs = [
        { label: "POI", href: paths.poi.base },
        { label: activeTab }
    ];

    // Filter tabs based on role
    const allActivityTabs: { name: ActivityTab }[] = [
        { name: 'Detalles' },
        { name: 'Lista' },
        { name: 'Tablero' },
        { name: 'Dashboard' },
        { name: 'Informes' }
    ];

    // Todos los roles ven todas las pestañas (IMPLEMENTADOR en modo visualización excepto Lista)
    const activityTabs = allActivityTabs;

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
                                                {responsablesNombres.length > 0
                                                    ? responsablesNombres.map(nombre => <Badge key={nombre} variant="secondary">{nombre}</Badge>)
                                                    : <span className="text-gray-400">Sin asignar</span>
                                                }
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
                                            <InfoField label="Método de Gestión de Proyecto"><p>{project.managementMethod || ''}</p></InfoField>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Lista Tab */}
                {activeTab === 'Lista' && (
                    <ListaContent embedded />
                )}

                {/* Tablero Tab */}
                {activeTab === 'Tablero' && project?.id && (
                    <TableroTabContent actividadId={Number(project.id)} />
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

             {isEditModalOpen && project && (
                <POIFullModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    project={project}
                    onSave={handleSaveProject}
                    pgdId={selectedPGD?.id}
                    pgdAnioInicio={selectedPGD?.anioInicio}
                    pgdAnioFin={selectedPGD?.anioFin}
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
