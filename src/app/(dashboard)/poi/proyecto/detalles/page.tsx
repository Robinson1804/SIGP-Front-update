"use client";

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { POIFullModal, SubProjectModal } from '@/features/proyectos';
import { SubProject, Project, MODULES, ROLES, PERMISSIONS } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { paths } from '@/lib/paths';
import { ProtectedRoute } from "@/features/auth";
import { useAuth } from '@/stores';
import { hasPermission } from "@/lib/permissions";


const sprints = [
  { name: 'Sprint 1', status: 'Completado', progress: 100 },
  { name: 'Sprint 2', status: 'En progreso', progress: 65 },
  { name: 'Sprint 3', status: 'En progreso', progress: 30 },
  { name: 'Sprint 4', status: 'Por hacer', progress: 0 },
];

const statusColors: { [key: string]: string } = {
  'Pendiente': 'bg-[#FE9F43] text-black',
  'En planificación': 'bg-[#FFD700] text-black',
  'En desarrollo': 'bg-[#559FFE] text-white',
  'Finalizado': 'bg-[#2FD573] text-white',
};

const subProjectStatusColors: { [key: string]: string } = {
    'Pendiente': 'bg-[#FF9F43] text-black',
    'En planificación': 'bg-[#FFD700] text-black',
    'En desarrollo': 'bg-[#54A0FF] text-white',
    'Finalizado': 'bg-[#2ED573] text-white',
};


const sprintStatusConfig: { [key: string]: { badge: string; progress: string; label: string } } = {
    'Por hacer': { badge: 'bg-[#ADADAD] text-white', progress: 'bg-[#ADADAD]', label: 'Por hacer' },
    'En progreso': { badge: 'bg-[#559FFE] text-white', progress: 'bg-[#559FFE]', label: 'En progreso' },
    'Completado': { badge: 'bg-[#2FD573] text-white', progress: 'bg-[#2FD573]', label: 'Completado' },
};


const InfoField = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div>
        <p className="text-sm font-semibold text-gray-500 mb-1">{label}</p>
        <div className="text-sm p-2 bg-gray-50 rounded-md border min-h-[38px] flex items-center flex-wrap gap-1">
            {children}
        </div>
    </div>
);

const SubProjectCard = ({ subProject, onEdit, onDelete, canEdit }: { subProject: SubProject, onEdit: () => void, onDelete: () => void, canEdit: boolean }) => {
    const formatAmount = (amount: number) => {
        if (amount >= 1000) {
            return `S/ ${amount / 1000}k`;
        }
        return `S/ ${amount}`;
    }

    return (
    <Card className="bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-gray-500" />
                <CardTitle className="text-base font-bold">{subProject.name}</CardTitle>
            </div>
            {canEdit && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={onDelete} className="text-red-600">Eliminar</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </CardHeader>
        <CardContent>
            <Progress value={subProject.progress} indicatorClassName="bg-[#559FFE]" />
            <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                <span>{subProject.progress}%</span>
            </div>
            <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-500" />
                    <span>Estado:</span>
                    <Badge className={`${subProjectStatusColors['En desarrollo']}`}>En desarrollo</Badge>
                </div>
                <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span>Monto:</span>
                    <span>{formatAmount(subProject.amount)}</span>
                </div>
                 <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4 text-gray-500" />
                    <span>Responsable:</span>
                    <span>{subProject.responsible.length}</span>
                </div>
            </div>
        </CardContent>
    </Card>
)};

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

// Componente de barra de progreso con tooltip
const ProgressBarWithTooltip = ({
    value,
    label,
    statusBadge,
    indicatorClassName
}: {
    value: number;
    label: string;
    statusBadge: React.ReactNode;
    indicatorClassName: string;
}) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="cursor-default">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{label}</span>
                        {statusBadge}
                    </div>
                    <Progress
                        value={value}
                        indicatorClassName={indicatorClassName}
                        className="transition-all duration-500 ease-out"
                    />
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>{value}% completado</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
);

function ProjectDetailsContent() {
    const { user } = useAuth();
    const [project, setProject] = React.useState<Project | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();

    const [activeTab, setActiveTab] = React.useState('Detalles');

    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

    const [isSubProjectModalOpen, setIsSubProjectModalOpen] = React.useState(false);
    const [editingSubProject, setEditingSubProject] = React.useState<SubProject | null>(null);
    const [isSubProjectDeleteModalOpen, setIsSubProjectDeleteModalOpen] = React.useState(false);
    const [deletingSubProject, setDeletingSubProject] = React.useState<SubProject | null>(null);

    const [progressAnimated, setProgressAnimated] = React.useState(false);

    // Permisos basados en el rol del usuario
    const userRole = user?.role;
    const isScrumMaster = userRole === ROLES.SCRUM_MASTER;
    // Scrum Master ve los botones pero deshabilitados
    const showEditDeleteButtons = userRole ? hasPermission(userRole, MODULES.POI, PERMISSIONS.EDIT) || isScrumMaster : false;
    const canEdit = userRole ? hasPermission(userRole, MODULES.POI, PERMISSIONS.EDIT) && !isScrumMaster : false;
    const canDelete = userRole ? hasPermission(userRole, MODULES.POI, PERMISSIONS.DELETE) && !isScrumMaster : false;

    React.useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam) {
            setActiveTab(tabParam);
        }
    }, [searchParams]);

    React.useEffect(() => {
        const savedProjectData = localStorage.getItem('selectedProject');
        if (savedProjectData) {
            const projectData = JSON.parse(savedProjectData);
            setProject(projectData);
            if(projectData.type !== 'Proyecto') {
                router.push(paths.poi.base);
            }
        } else {
             // Fallback for direct navigation
            router.push(paths.poi.base);
        }

        // Animar las barras de progreso después de montar
        const timer = setTimeout(() => setProgressAnimated(true), 100);
        return () => clearTimeout(timer);
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
        router.push(paths.poi.base);
    };

    const openSubProjectModal = (sub?: SubProject) => {
        setEditingSubProject(sub || null);
        setIsSubProjectModalOpen(true);
    };

    const handleSaveSubProject = (subProject: SubProject) => {
        if (!project) return;
        const updatedSubProjects = project.subProjects ? [...project.subProjects] : [];
        const index = updatedSubProjects.findIndex(s => s.id === subProject.id);

        if (index > -1) {
            updatedSubProjects[index] = subProject;
        } else {
            updatedSubProjects.push({ ...subProject, id: Date.now().toString() });
        }

        const updatedProject = { ...project, subProjects: updatedSubProjects };
        setProject(updatedProject);
        localStorage.setItem('selectedProject', JSON.stringify(updatedProject));

        setIsSubProjectModalOpen(false);
        setEditingSubProject(null);
    };

    const openDeleteSubProjectModal = (sub: SubProject) => {
        setDeletingSubProject(sub);
        setIsSubProjectDeleteModalOpen(true);
    };

    const handleDeleteSubProject = () => {
        if (deletingSubProject && project && project.subProjects) {
            const updatedProject = {
                ...project,
                subProjects: project.subProjects?.filter(s => s.id !== deletingSubProject.id)
            };
            setProject(updatedProject);
            localStorage.setItem('selectedProject', JSON.stringify(updatedProject));
        }
        setIsSubProjectDeleteModalOpen(false);
        setDeletingSubProject(null);
    };

    const handleTabClick = (tabName: string) => {
        let route = '';
        // Navegación para todas las pestañas del proyecto
        if (tabName === 'Backlog') route = paths.poi.proyecto.backlog.base;
        else if (tabName === 'Documentos') route = paths.poi.proyecto.documentos;
        else if (tabName === 'Actas del proyecto') route = paths.poi.proyecto.actas;
        else if (tabName === 'Requerimientos') route = paths.poi.proyecto.requerimientos;
        else if (tabName === 'Cronograma') route = paths.poi.proyecto.cronograma;

        if (route) {
            router.push(route);
        } else {
            setActiveTab(tabName);
             const newUrl = new URL(window.location.href);
            newUrl.pathname = paths.poi.proyecto.detalles;
            newUrl.searchParams.set('tab', tabName);
            window.history.pushState({ ...window.history.state, as: newUrl.href, url: newUrl.href }, '', newUrl.href);
        }
    };

    // Obtener el año actual para resaltarlo
    const currentYear = new Date().getFullYear().toString();

    if (!project) {
        return (
            <div className="flex h-screen w-full items-center justify-center">Cargando...</div>
        )
    }

    const isProject = project.type === 'Proyecto';
    const projectCode = `${isProject ? 'PROY' : 'ACT'} N°${project.id}`;

    const breadcrumbs = [
        { label: "POI", href: paths.poi.base },
        { label: 'Detalles' }
    ];

    // Pestañas según el rol del usuario
    const getProjectTabs = () => {
        if (userRole === ROLES.PMO) {
            // PMO: Detalles, Documentos, Backlog
            return [
                { name: 'Detalles' },
                { name: 'Documentos' },
                { name: 'Backlog' },
            ];
        } else if (userRole === ROLES.SCRUM_MASTER) {
            // Scrum Master: Detalles, Documentos, Actas del proyecto, Requerimientos, Cronograma, Backlog
            return [
                { name: 'Detalles' },
                { name: 'Documentos' },
                { name: 'Actas del proyecto' },
                { name: 'Requerimientos' },
                { name: 'Cronograma' },
                { name: 'Backlog' },
            ];
        }
        // Por defecto (otros roles): Detalles, Documentos, Backlog
        return [
            { name: 'Detalles' },
            { name: 'Documentos' },
            { name: 'Backlog' },
        ];
    };

    const projectTabs = getProjectTabs();


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
          <div className="flex items-center gap-2 flex-wrap">
            {projectTabs.map(tab => (
                 <Button
                    key={tab.name}
                    size="sm"
                    onClick={() => handleTabClick(tab.name)}
                    className={cn(
                        activeTab === tab.name
                            ? 'bg-[#018CD1] text-white hover:bg-[#0179b5]'
                            : 'bg-white text-black border-gray-300 hover:bg-gray-100'
                    )}
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
            breadcrumbs={breadcrumbs}
            secondaryHeader={secondaryHeader}
        >
            <div className="flex-1 flex flex-col bg-[#F9F9F9]">
                <div className="p-6">
                    {activeTab === 'Detalles' && (
                        <>
                        {/* Header con título y botones de acción (solo para roles con permisos) */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Folder className="w-6 h-6 text-gray-700" />
                                <h3 className="text-xl font-bold">{`${projectCode}: ${project.name}`}</h3>
                            </div>
                            {/* Mostrar botones de edición/eliminación (deshabilitados para Scrum Master) */}
                            {showEditDeleteButtons && (
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
                            )}
                        </div>

                        {/* Layout con campos a la izquierda y progreso a la derecha */}
                        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-stretch">
                            {/* Columna Izquierda (70%) - Información Principal */}
                            <Card className="lg:col-span-7 h-full">
                                <CardContent className="p-6 h-full">
                                    {/* Estado y Scrum Master */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-4">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-500 mb-1">Estado</p>
                                            <Badge className={statusColors[project.status]}>{project.status}</Badge>
                                        </div>
                                        <InfoField label="Scrum Master"><p>{project.scrumMaster}</p></InfoField>
                                    </div>

                                    {/* Descripción */}
                                    <div className="mb-4">
                                        <InfoField label="Descripción"><p>{project.description}</p></InfoField>
                                    </div>

                                    {/* Información adicional en dos columnas */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                        <div className="space-y-4">
                                            <InfoField label="Acción Estratégica"><p>{project.strategicAction}</p></InfoField>
                                            <InfoField label="Clasificación"><p>{project.classification}</p></InfoField>
                                            <InfoField label="Coordinación"><p>{project.coordination || 'Son las divisiones'}</p></InfoField>
                                            <InfoField label="Coordinador"><p>{project.coordinator || ''}</p></InfoField>
                                            <InfoField label="Área Financiera">
                                                {project.financialArea?.length ? (
                                                    project.financialArea.map(area => <Badge key={area} variant="secondary">{area}</Badge>)
                                                ) : (
                                                    <p className="text-gray-400">-</p>
                                                )}
                                            </InfoField>
                                        </div>
                                        <div className="space-y-4">
                                            <InfoField label="Responsables">
                                                {project.responsibles?.length ? (
                                                    project.responsibles.map(r => <Badge key={r} variant="secondary" className="mr-1">{r}</Badge>)
                                                ) : (
                                                    <p className="text-gray-400">Sin asignar</p>
                                                )}
                                            </InfoField>
                                            {/* Años con resaltado del año actual */}
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
                                            <InfoField label="Monto Anual">
                                                <p className="font-semibold">S/ {project.annualAmount?.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
                                            </InfoField>
                                            <InfoField label="Metodología">
                                                <p>{project.managementMethod || 'Scrum'}</p>
                                            </InfoField>
                                            <div className="grid grid-cols-2 gap-4">
                                                <InfoField label="Fecha Inicio">
                                                    <p>{project.startDate ? formatMonthYear(project.startDate) : '-'}</p>
                                                </InfoField>
                                                <InfoField label="Fecha Fin">
                                                    <p>{project.endDate ? formatMonthYear(project.endDate) : '-'}</p>
                                                </InfoField>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Columna Derecha (30%) - Progreso General y por Sprints */}
                            <div className="lg:col-span-3 flex flex-col gap-6 h-full">
                                {/* Progreso General */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-base font-semibold">Progreso General</CardTitle>
                                            <span className="font-bold text-base">{progressAnimated ? generalProgress : 0}%</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="cursor-default">
                                                        <Progress
                                                            value={progressAnimated ? generalProgress : 0}
                                                            indicatorClassName="bg-blue-500 transition-all duration-1000 ease-out"
                                                        />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{generalProgress}% completado</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </CardContent>
                                </Card>

                                {/* Progreso por Sprints */}
                                <Card className="flex-1">
                                    <CardHeader>
                                        <CardTitle className="text-base font-semibold">Progreso por Sprints</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {sprints.map((sprint, i) => (
                                            <ProgressBarWithTooltip
                                                key={i}
                                                value={progressAnimated ? sprint.progress : 0}
                                                label={sprint.name}
                                                statusBadge={
                                                    <Badge className={sprintStatusConfig[sprint.status]?.badge || 'bg-gray-400'}>
                                                        {sprint.status}
                                                    </Badge>
                                                }
                                                indicatorClassName={`${sprintStatusConfig[sprint.status]?.progress || 'bg-gray-400'} transition-all duration-1000 ease-out`}
                                            />
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Subproyectos (solo si existen y el usuario tiene permisos de edición) */}
                        {project.subProjects && project.subProjects.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-4">SUBPROYECTOS</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {project.subProjects.map(sub => (
                                        <SubProjectCard
                                            key={sub.id}
                                            subProject={sub}
                                            onEdit={() => openSubProjectModal(sub)}
                                            onDelete={() => openDeleteSubProjectModal(sub)}
                                            canEdit={canEdit}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        </>
                    )}

                    {/* Placeholder para otras pestañas */}
                    {activeTab !== 'Detalles' && (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            <div className="text-center">
                                <Folder className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium">Sección: {activeTab}</p>
                                <p className="text-sm">Esta sección está en desarrollo</p>
                            </div>
                        </div>
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
                message="El Plan Operativo Informático será eliminado"
            />

            {isSubProjectModalOpen && (
                 <SubProjectModal
                    isOpen={isSubProjectModalOpen}
                    onClose={() => setIsSubProjectModalOpen(false)}
                    onSave={handleSaveSubProject}
                    subProject={editingSubProject}
                />
            )}

           {deletingSubProject && (
             <DeleteConfirmationModal
                isOpen={isSubProjectDeleteModalOpen}
                onClose={() => setIsSubProjectDeleteModalOpen(false)}
                onConfirm={handleDeleteSubProject}
                title="AVISO"
                message="El subproyecto será eliminado"
            />
           )}
        </AppLayout>
    );
}


export default function DetailsPage() {
    return (
        <ProtectedRoute module={MODULES.POI}>
            <React.Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Cargando...</div>}>
                <ProjectDetailsContent />
            </React.Suspense>
        </ProtectedRoute>
    )
}
