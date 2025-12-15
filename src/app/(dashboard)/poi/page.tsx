
"use client";

import React from 'react';
import { useRouter } from "next/navigation";
import {
  Search,
  Folder,
  CheckCircle,
  Calendar,
  AlertTriangle,
  User,
  Plus,
  X,
} from 'lucide-react';

import AppLayout from '@/components/layout/app-layout';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type Project, MODULES, PERMISSIONS, ROLES } from '@/lib/definitions';
import { paths } from '@/lib/paths';
import { ProtectedRoute } from "@/features/auth";
import { useAuth } from '@/stores';
import { useSidebar } from "@/contexts/sidebar-context";
import { POIFullModal } from "@/features/proyectos";
import { hasPermission } from "@/lib/permissions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";


const initialProjects: Project[] = [
    {
        id: '1',
        name: 'Administración de Portafolio de Proyectos',
        description: 'Descripción del proyecto',
        type: 'Proyecto',
        classification: 'Gestión interna',
        status: 'En planificación',
        startDate: '2025-01',
        endDate: '2025-12',
        scrumMaster: 'Robinson Cerron',
        annualAmount: 50000,
        strategicAction: 'AE N°1',
        missingData: false,
        years: ['2025'],
        responsibles: ['Angella Trujillo', 'Ana Garcia'],
        financialArea: ['OTIN'],
        coordination: 'Coordinación 1',
        coordinator: 'Jefe de Proyecto',
        managementMethod: 'Scrum',
        subProjects: [],
    },
    {
        id: '2',
        name: 'UNETE INEI',
        description: 'Plataforma de atención ciudadana',
        type: 'Proyecto',
        classification: 'Al ciudadano',
        status: 'En planificación',
        startDate: '2025-06',
        endDate: '2025-12',
        scrumMaster: 'Robinson Cerron',
        annualAmount: 75000,
        strategicAction: 'AE N°2',
        missingData: false,
        years: ['2025'],
        responsibles: ['Mario Casas'],
        subProjects: [],
    },
    {
        id: '5',
        name: 'Sistema de Gestión Documental',
        description: 'Modernización de gestión de documentos',
        type: 'Proyecto',
        classification: 'Gestión interna',
        status: 'En desarrollo',
        startDate: '2024-10',
        endDate: '2025-06',
        scrumMaster: 'Carlos Ruiz',
        annualAmount: 120000,
        strategicAction: 'AE N°1',
        missingData: false,
        years: ['2024', '2025'],
        responsibles: ['Angella Trujillo', 'Ana Garcia'],
        financialArea: ['DCNC'],
        coordination: 'Coordinación TI',
        coordinator: 'Director TI',
        managementMethod: 'Scrum',
        subProjects: [],
    },
    {
        id: '6',
        name: 'Portal de Datos Abiertos',
        description: 'Plataforma de transparencia y datos públicos',
        type: 'Proyecto',
        classification: 'Al ciudadano',
        status: 'Pendiente',
        startDate: '2025-03',
        endDate: '2025-08',
        scrumMaster: 'Robinson Cerron',
        annualAmount: 85000,
        strategicAction: 'AE N°3',
        missingData: false,
        years: ['2025'],
        responsibles: ['Angella Trujillo'],
        financialArea: ['OTA'],
        coordination: 'Coordinación Datos',
        coordinator: 'Jefe de Datos',
        managementMethod: 'Scrum',
        subProjects: [],
    },
    {
        id: '3',
        name: 'Transformación Digital con Blockchain en Sectores Estratégicos',
        description: 'Descripción de la actividad',
        type: 'Actividad',
        classification: 'Gestión interna',
        status: 'En planificación',
        startDate: '2025-04',
        endDate: '2025-09',
        scrumMaster: 'Robinson Cerron',
        annualAmount: 25000,
        strategicAction: 'AE N°3',
        missingData: false,
        years: ['2025'],
        responsibles: ['Carlos Lázaro', 'Carlos Ruiz'],
        financialArea: ['OTA'],
        coordination: 'Coordinación 2',
        coordinator: 'Jefe de Área',
        managementMethod: 'Kanban',
        subProjects: [],
    },
     {
        id: '4',
        name: 'SIRA',
        description: 'Descripción de la actividad SIRA',
        type: 'Actividad',
        classification: 'Gestión interna',
        status: 'En planificación',
        startDate: '2025-04',
        endDate: '2025-09',
        scrumMaster: 'Robinson Cerron',
        annualAmount: 30000,
        strategicAction: 'AE N°4',
        missingData: false,
        years: ['2025'],
        responsibles: ['Carlos Lázaro'],
        financialArea: ['OTIN'],
        coordination: 'Coordinación 3',
        coordinator: 'Líder Técnico',
        managementMethod: 'Kanban',
        subProjects: [],
    },
    {
        id: '7',
        name: 'Modernización de Infraestructura de Servidores',
        description: 'Implementación de nuevos servidores y migración de sistemas legacy a infraestructura moderna con alta disponibilidad',
        type: 'Actividad',
        classification: 'Gestión interna',
        status: 'En desarrollo',
        startDate: '2025-10',
        endDate: '2025-12',
        scrumMaster: 'Roberto Méndez',
        annualAmount: 45600,
        strategicAction: 'AE N°1',
        missingData: false,
        years: ['2022', '2023', '2024', '2025'],
        responsibles: ['Carlos Lázaro', 'Anayeli Monzon'],
        financialArea: ['OTIN'],
        coordination: 'División de Infraestructura',
        coordinator: 'Coordinador 1',
        gestor: 'Robinson Cerron',
        managementMethod: 'Kanban',
        subProjects: [],
    },
    {
        id: '8',
        name: 'Implementación de Sistema de Monitoreo de Red',
        description: 'Despliegue de herramientas de monitoreo para supervisión en tiempo real de la infraestructura de red institucional',
        type: 'Actividad',
        classification: 'Gestión interna',
        status: 'En desarrollo',
        startDate: '2025-11',
        endDate: '2025-12',
        scrumMaster: 'Patricia Ruiz',
        annualAmount: 32000,
        strategicAction: 'AE N°2',
        missingData: false,
        years: ['2025'],
        responsibles: ['Diego Morales', 'Fernando Rojas'],
        financialArea: ['OTIN'],
        coordination: 'División de Redes',
        coordinator: 'Coordinador 2',
        gestor: 'Ana Torres',
        managementMethod: 'Kanban',
        subProjects: [],
    },
    {
        id: '9',
        name: 'Capacitación en Ciberseguridad para Personal Técnico',
        description: 'Programa de formación intensivo en seguridad informática y buenas prácticas de protección de datos',
        type: 'Actividad',
        classification: 'Gestión interna',
        status: 'En planificación',
        startDate: '2025-12',
        endDate: '2025-12',
        scrumMaster: 'Carmen Vega',
        annualAmount: 18500,
        strategicAction: 'AE N°3',
        missingData: false,
        years: ['2025'],
        responsibles: ['María López', 'Juan Pérez'],
        financialArea: ['OTIN'],
        coordination: 'División de Seguridad',
        coordinator: 'Coordinador 3',
        gestor: 'Pedro Sánchez',
        managementMethod: 'Kanban',
        subProjects: [],
    },
    {
        id: '10',
        name: 'Actualización de Licencias de Software Institucional',
        description: 'Renovación y gestión de licenciamiento de software crítico para operaciones del INEI',
        type: 'Actividad',
        classification: 'Gestión interna',
        status: 'Pendiente',
        startDate: '2025-12',
        endDate: '2025-12',
        scrumMaster: 'Luis García',
        annualAmount: 75000,
        strategicAction: 'AE N°1',
        missingData: false,
        years: ['2024', '2025'],
        responsibles: ['Carlos García', 'Ana Pérez'],
        financialArea: ['OTIN'],
        coordination: 'División de Sistemas',
        coordinator: 'Coordinador 4',
        gestor: 'Rosa Martínez',
        managementMethod: 'Kanban',
        subProjects: [],
    }
];

const statusColors: { [key: string]: string } = {
    'Pendiente': 'bg-[#FE9F43]',
    'En planificación': 'bg-[#FFD700]',
    'En desarrollo': 'bg-[#559FFE]',
    'Finalizado': 'bg-[#2FD573]',
};

const ProjectCard = ({
    project,
    userRole,
}: {
    project: Project;
    userRole?: string;
}) => {
    const isMissingData = project.missingData;
    const router = useRouter();
    const isDeveloper = userRole === ROLES.DESARROLLADOR;
    const isImplementador = userRole === ROLES.IMPLEMENTADOR;

    const formatDateRange = (startDate: string, endDate: string) => {
        if (!startDate || !endDate) return '';
        const formatDate = (dateStr: string) => {
            const [year, month] = dateStr.split('-');
            return `${month}-${year}`;
        };
        return `Inicio: ${formatDate(startDate)} - Fin: ${formatDate(endDate)}`;
    };

    const displayDate = project.startDate && project.endDate
        ? formatDateRange(project.startDate, project.endDate)
        : project.years?.join(', ');

    const handleGoToDetails = () => {
        localStorage.setItem('selectedProject', JSON.stringify(project));

        // DESARROLLADOR solo puede ir a Backlog (Proyecto), no a Detalles ni Documentos
        if (isDeveloper) {
            router.push(paths.poi.proyecto.backlog.base);
            return;
        }

        // IMPLEMENTADOR solo puede ir a Lista (Actividad), no a Detalles ni Documentos
        if (isImplementador) {
            router.push(paths.poi.actividad.lista);
            return;
        }

        // Otros roles van a Detalles
        const detailsUrl = project.type === 'Proyecto' ? paths.poi.proyecto.detalles : paths.poi.actividad.detalles;
        router.push(detailsUrl);
    };

    const cardContent = (
         <Card onClick={handleGoToDetails} className={`w-full h-full flex flex-col shadow-md rounded-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer ${isMissingData ? 'bg-red-100/50' : 'bg-white'}`}>
            <CardHeader className="flex flex-row items-start pb-2 space-y-0">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                    <Folder className="w-5 h-5 text-[#008ED2] shrink-0 mt-0.5" style={{ minWidth: '20px' }} />
                    <h3 className="font-bold text-[#272E35] text-base leading-tight line-clamp-2" style={{ fontSize: '16px' }}>
                        {project.name}
                    </h3>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 flex-grow pt-0" style={{ fontFamily: 'Inter', fontSize: '12px' }}>
                {/* Badge de Tipo */}
                <p className="text-xs text-[#ADADAD] font-bold">{project.type}</p>

                {/* Estado */}
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#272E35] shrink-0" />
                    <Badge className={`${statusColors[project.status]} text-black text-xs font-normal`}>
                        {project.status}
                    </Badge>
                </div>

                {/* Fechas */}
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#272E35] shrink-0" />
                    <span className="text-xs text-[#272E35]">{displayDate}</span>
                </div>

                {/* Scrum Master */}
                <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#272E35] shrink-0" />
                    <span className="truncate text-xs text-[#272E35]">{project.scrumMaster}</span>
                </div>
            </CardContent>
        </Card>
    );

    if (isMissingData) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                       <div className="h-full cursor-pointer">{cardContent}</div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-red-50 border-red-200">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <p className="text-red-600">Faltan datos</p>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return cardContent;
};

// Modal de confirmación de eliminación
function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    projectName,
    projectType,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    projectName: string;
    projectType: string;
}) {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-0" showCloseButton={false}>
                <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between">
                    <DialogTitle>AVISO</DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white">
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogClose>
                </DialogHeader>
                <div className="p-6 text-center flex flex-col items-center">
                    <AlertTriangle className="h-16 w-16 text-black mb-4" strokeWidth={1.5}/>
                    <p className="font-bold text-lg">¿Estás seguro?</p>
                    <p className="text-muted-foreground">El {projectType.toLowerCase()} será eliminado</p>
                </div>
                <DialogFooter className="px-6 pb-6 flex justify-center gap-4">
                    <Button variant="outline" onClick={onClose} style={{borderColor: '#CFD6DD', color: 'black'}}>Cancelar</Button>
                    <Button onClick={onConfirm} style={{backgroundColor: '#018CD1', color: 'white'}}>Sí, eliminar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function PmoPoiView() {
    const { sidebarOpen } = useSidebar();
    const { user } = useAuth();
    const [projects, setProjects] = React.useState<Project[]>(initialProjects);
    const [selectedType, setSelectedType] = React.useState<string>("Proyecto");
    const [searchQuery, setSearchQuery] = React.useState<string>("");
    const [selectedClassification, setSelectedClassification] = React.useState<string>("all");
    const [selectedMonth, setSelectedMonth] = React.useState<string>(new Date().toISOString().substring(0, 7));

    // Estados para modales
    const [isNewModalOpen, setIsNewModalOpen] = React.useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);

    // Verificar permisos del usuario
    const userRole = user?.role;
    const userName = user?.name;
    const canCreate = userRole ? hasPermission(userRole, MODULES.POI, PERMISSIONS.CREATE) : false;
    const isDeveloper = userRole === ROLES.DESARROLLADOR;
    const isImplementador = userRole === ROLES.IMPLEMENTADOR;
    const isScrumMaster = userRole === ROLES.SCRUM_MASTER;
    const isPmo = userRole === ROLES.PMO;

    // Tipo efectivo para filtrado
    // DESARROLLADOR solo puede ver "Proyecto"
    // IMPLEMENTADOR solo puede ver "Actividad"
    const effectiveType = isDeveloper ? "Proyecto" : isImplementador ? "Actividad" : selectedType;

    // Filtrar proyectos
    const filteredProjects = projects.filter(p => {
        // Filtro por tipo
        if (p.type !== effectiveType) return false;

        // Filtro por asignación según el rol del usuario
        // PMO ve todos los proyectos/actividades
        if (!isPmo && userName) {
            // DESARROLLADOR e IMPLEMENTADOR: ven donde están como responsables
            if (isDeveloper || isImplementador) {
                const isResponsible = p.responsibles?.some(r => r === userName);
                if (!isResponsible) return false;
            }
            // SCRUM_MASTER: ve donde está como scrumMaster o gestor
            else if (isScrumMaster) {
                const isScrumMasterAssigned = p.scrumMaster === userName;
                const isGestorAssigned = p.gestor === userName;
                if (!isScrumMasterAssigned && !isGestorAssigned) return false;
            }
        }

        // Filtro por búsqueda (nombre o descripción)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesName = p.name?.toLowerCase().includes(query);
            const matchesDescription = p.description?.toLowerCase().includes(query);
            const matchesScrumMaster = p.scrumMaster?.toLowerCase().includes(query);
            if (!matchesName && !matchesDescription && !matchesScrumMaster) return false;
        }

        // Filtro por clasificación (cualificación)
        if (selectedClassification !== "all" && p.classification !== selectedClassification) {
            return false;
        }

        // Filtro por mes/año (verifica si el proyecto tiene fechas que incluyan el mes seleccionado)
        if (selectedMonth) {
            const [filterYear] = selectedMonth.split('-');

            // Si tiene startDate y endDate, verificar si el mes está en el rango
            if (p.startDate && p.endDate) {
                const startDate = new Date(p.startDate + '-01');
                const endDate = new Date(p.endDate + '-01');
                const filterDate = new Date(selectedMonth + '-01');

                if (filterDate < startDate || filterDate > endDate) return false;
            }
            // Si tiene años definidos, verificar si el año coincide
            else if (p.years && p.years.length > 0) {
                if (!p.years.includes(filterYear)) return false;
            }
        }

        return true;
    });

    // Contar filtros activos
    const activeFiltersCount = [
        searchQuery,
        selectedClassification !== "all",
    ].filter(Boolean).length;

    const sectionTitle = effectiveType === "Proyecto" ? "Mis Proyectos" : "Mis Actividades";
    const SectionIcon = Folder;

    // Handlers CRUD
    const handleCreateProject = (newProject: Project) => {
        setProjects(prev => [...prev, { ...newProject, id: Date.now().toString() }]);
        setIsNewModalOpen(false);
    };

    const handleEditProject = (updatedProject: Project) => {
        setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
        setIsEditModalOpen(false);
        setSelectedProject(null);
    };

    const handleDeleteProject = () => {
        if (selectedProject) {
            setProjects(prev => prev.filter(p => p.id !== selectedProject.id));
        }
        setIsDeleteModalOpen(false);
        setSelectedProject(null);
    };

    // Función para limpiar todos los filtros
    const clearAllFilters = () => {
        setSearchQuery("");
        setSelectedClassification("all");
        setSelectedMonth(new Date().toISOString().substring(0, 7));
    };

    return (
        <>
            <div className="bg-[#D5D5D5] border-y border-[#1A5581] w-full">
                <div className="p-2 flex items-center justify-between w-full">
                    <h2 className="font-bold text-black pl-2">
                        PLAN OPERATIVO INFORMÁTICO (POI)
                    </h2>
                    <Button
                        onClick={() => setIsNewModalOpen(true)}
                        style={{backgroundColor: canCreate ? '#018CD1' : '#9CA3AF', color: 'white'}}
                        className="flex items-center gap-2"
                        disabled={!canCreate}
                    >
                        <Plus className="h-4 w-4" />
                        NUEVO POI
                    </Button>
                </div>
            </div>
            <div className="flex-1 flex flex-col bg-[#F9F9F9] p-6">
                {/* Header de sección con ícono */}
                <div className="flex items-center gap-2 text-[#004272] mb-4">
                    <SectionIcon className="h-5 w-5" />
                    <h3 className="font-bold text-lg">{sectionTitle}</h3>
                    {activeFiltersCount > 0 && (
                        <Badge className="bg-[#018CD1] text-white text-xs ml-2">
                            {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} activo{activeFiltersCount > 1 ? 's' : ''}
                        </Badge>
                    )}
                </div>

                {/* Sección de filtros */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    {/* Buscar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7E8C9A]" />
                        <Input
                            placeholder="Buscar..."
                            className="pl-9 bg-white border-[#CFD6DD] w-[200px]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Tipo - DESARROLLADOR solo "Proyecto", IMPLEMENTADOR solo "Actividad" */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-black">Tipo</label>
                        <Select
                            value={effectiveType}
                            onValueChange={setSelectedType}
                            disabled={isDeveloper || isImplementador}
                        >
                            <SelectTrigger className={`w-[140px] bg-white border-[#CFD6DD] text-black ${(isDeveloper || isImplementador) ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {!isImplementador && (
                                    <SelectItem value="Proyecto">Proyecto</SelectItem>
                                )}
                                {!isDeveloper && (
                                    <SelectItem value="Actividad">Actividad</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Cualificación (Clasificación) */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-black">Clasificación</label>
                        <Select value={selectedClassification} onValueChange={setSelectedClassification}>
                            <SelectTrigger className="w-[160px] bg-white border-[#CFD6DD] text-black">
                                <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="Al ciudadano">Al ciudadano</SelectItem>
                                <SelectItem value="Gestión interna">Gestión interna</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Mes */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-black">Mes</label>
                        <Input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-white border-[#CFD6DD] text-black w-[150px]"
                        />
                    </div>

                    {/* Botón limpiar filtros */}
                    {activeFiltersCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAllFilters}
                            className="text-[#018CD1] hover:text-[#016ba1]"
                        >
                            Limpiar filtros
                        </Button>
                    )}
                </div>

                {/* Mensaje cuando no hay resultados */}
                {filteredProjects.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <Search className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No se encontraron {effectiveType === "Proyecto" ? "proyectos" : "actividades"}</p>
                        <p className="text-sm mb-4">Intenta ajustar los filtros de búsqueda</p>
                        {activeFiltersCount > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={clearAllFilters}
                                className="text-[#018CD1] border-[#018CD1] hover:bg-[#018CD1]/10"
                            >
                                Limpiar filtros
                            </Button>
                        )}
                    </div>
                )}

                <div className={`grid gap-6 mb-6 ${
                    sidebarOpen
                        ? "grid-cols-1 min-[800px]:grid-cols-2 lg:grid-cols-3 min-[1360px]:grid-cols-4"
                        : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                }`}>
                    {filteredProjects.map(p => (
                        <ProjectCard
                            key={p.id}
                            project={p}
                            userRole={userRole}
                        />
                    ))}
                </div>

                <div className="flex justify-end mt-auto">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious href="#" />
                            </PaginationItem>
                            <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
                            <PaginationItem><PaginationLink href="#" isActive>2</PaginationLink></PaginationItem>
                            <PaginationItem><PaginationLink href="#">3</PaginationLink></PaginationItem>
                            <PaginationItem><PaginationEllipsis/></PaginationItem>
                            <PaginationItem>
                                <PaginationNext href="#" />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            </div>

            {/* Modal para crear nuevo POI */}
            <POIFullModal
                isOpen={isNewModalOpen}
                onClose={() => setIsNewModalOpen(false)}
                project={null}
                onSave={handleCreateProject}
            />

            {/* Modal para editar POI */}
            <POIFullModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedProject(null);
                }}
                project={selectedProject}
                onSave={handleEditProject}
            />

            {/* Modal de confirmación de eliminación */}
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedProject(null);
                }}
                onConfirm={handleDeleteProject}
                projectName={selectedProject?.name || ''}
                projectType={selectedProject?.type || 'Proyecto'}
            />
        </>
    )
}

function PoiPageContent() {
    return (
        <ProtectedRoute module={MODULES.POI}>
            <AppLayout breadcrumbs={[{ label: "POI" }]}>
                <PmoPoiView />
            </AppLayout>
        </ProtectedRoute>
    )
}

export default function PoiPage() {
  return (
    <React.Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Cargando...</div>}>
      <PoiPageContent />
    </React.Suspense>
  )
}
