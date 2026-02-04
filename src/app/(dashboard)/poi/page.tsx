
"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
  Loader2,
  LayoutGrid,
  List,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { type Project, type Proyecto, MODULES, PERMISSIONS, ROLES } from '@/lib/definitions';
import { paths } from '@/lib/paths';
import { ProtectedRoute } from "@/features/auth";
import { useAuth, usePGD } from '@/stores';
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
import { getProyectos, type ProyectoQueryFilters } from '@/features/proyectos/services';
import { getAllActividades } from '@/features/actividades/services/actividades.service';
import { getPGDs, type PGD } from '@/features/planning';
import { useToast } from '@/lib/hooks/use-toast';
import type { PaginatedResponse } from '@/types';

// Tipo extendido de Project con IDs para el modal de edición
type ProjectWithIds = Project & {
  accionEstrategicaId?: number;
  coordinadorId?: number;
  scrumMasterId?: number;
  patrocinadorId?: number;
};

/**
 * Mapea un proyecto del API (Proyecto) al formato del frontend (Project)
 * Incluye los IDs para que el modal de edición pueda usarlos
 */
/**
 * Mapea una actividad del API al formato del frontend (Project)
 */
function mapActividadToProject(actividad: {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  tipo?: string;
  clasificacion?: string | null;
  estado: string;
  coordinadorId?: number | null;
  coordinador?: {
    id?: number;
    nombre?: string;
    apellido?: string;
  } | null;
  gestorId?: number | null;
  gestor?: {
    id?: number;
    nombre?: string;
    apellido?: string;
  } | null;
  accionEstrategicaId?: number | null;
  accionEstrategica?: {
    id?: number;
    nombre?: string;
  } | null;
  coordinacion?: string | null;
  areasFinancieras?: string[] | null;
  montoAnual?: number | null;
  anios?: number[] | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  metodoGestion?: string;
  createdAt?: string;
  updatedAt?: string;
}): ProjectWithIds {
  // Formatear fecha de ISO a YYYY-MM-DD (parseando string directo para evitar problemas de timezone)
  const formatDateToFullDate = (dateStr: string | null | undefined): string | undefined => {
    if (!dateStr) return undefined;
    try {
      // Parsear directamente del string ISO: "YYYY-MM-DDTHH:mm:ss" o "YYYY-MM-DD"
      const datePart = dateStr.split('T')[0]; // "YYYY-MM-DD"
      if (datePart && datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return datePart;
      }
      return undefined;
    } catch {
      return undefined;
    }
  };

  // Convertir años de number[] a string[]
  const aniosToYears = (anios: number[] | null | undefined): string[] => {
    if (!anios || anios.length === 0) return [new Date().getFullYear().toString()];
    return anios.map(a => a.toString());
  };

  // Mapear clasificación: usar "Gestion interna" sin tilde (coincide con backend y SelectItem)
  const mapClasificacion = (clasificacion: string | null | undefined): Project['classification'] => {
    if (!clasificacion) return 'Gestion interna';
    if (clasificacion.toLowerCase().includes('ciudadano')) return 'Al ciudadano';
    return 'Gestion interna';
  };

  // Mapear estado
  const mapEstado = (estado: string): Project['status'] => {
    const estadoMap: Record<string, Project['status']> = {
      'Pendiente': 'Pendiente',
      'En planificacion': 'En planificación',
      'En ejecucion': 'En desarrollo',
      'En desarrollo': 'En desarrollo',
      'Finalizado': 'Finalizado',
      'Suspendido': 'Pendiente',
      'Cancelado': 'Finalizado',
    };
    return estadoMap[estado] || 'Pendiente';
  };

  // Obtener nombre del gestor si está disponible (equivalente a Scrum Master para Kanban)
  const gestorNombre = actividad.gestor
    ? `${actividad.gestor.nombre || ''} ${actividad.gestor.apellido || ''}`.trim() || 'Sin nombre'
    : actividad.gestorId
      ? `Gestor #${actividad.gestorId}`
      : 'Sin asignar';

  // Obtener nombre del coordinador si está disponible
  const coordinadorNombre = actividad.coordinador
    ? `${actividad.coordinador.nombre || ''} ${actividad.coordinador.apellido || ''}`.trim() || 'Sin nombre'
    : actividad.coordinadorId
      ? `Coordinador #${actividad.coordinadorId}`
      : undefined;

  return {
    id: actividad.id.toString(),
    code: actividad.codigo,
    name: actividad.nombre,
    description: actividad.descripcion || '',
    type: 'Actividad',
    classification: mapClasificacion(actividad.clasificacion),
    status: mapEstado(actividad.estado),
    scrumMaster: gestorNombre, // Para Actividades, mostrar el gestor (equivalente a Scrum Master)
    annualAmount: actividad.montoAnual || 0,
    strategicAction: actividad.accionEstrategica?.nombre || 'Sin AE',
    missingData: !actividad.descripcion,
    years: aniosToYears(actividad.anios),
    responsibles: [],
    financialArea: actividad.areasFinancieras || [],
    coordination: actividad.coordinacion || undefined,
    coordinator: coordinadorNombre,
    managementMethod: actividad.metodoGestion || 'Kanban',
    subProjects: [],
    startDate: formatDateToFullDate(actividad.fechaInicio),
    endDate: formatDateToFullDate(actividad.fechaFin),
    coordinadorId: actividad.coordinadorId || undefined,
    scrumMasterId: actividad.gestorId || undefined, // Para Actividades, gestorId es equivalente a scrumMasterId
    accionEstrategicaId: actividad.accionEstrategicaId || undefined,
  };
}

function mapProyectoToProject(proyecto: Proyecto): ProjectWithIds {
  // Mapear estado: API usa "En planificacion" (sin tilde), frontend usa "En planificación"
  const mapEstado = (estado: string): Project['status'] => {
    const estadoMap: Record<string, Project['status']> = {
      'Pendiente': 'Pendiente',
      'En planificacion': 'En planificación',
      'En desarrollo': 'En desarrollo',
      'Finalizado': 'Finalizado',
      'Cancelado': 'Finalizado', // Mapear cancelado a finalizado para UI
    };
    return estadoMap[estado] || 'Pendiente';
  };

  // Mapear clasificación: API usa "Gestion interna" (sin tilde), SelectItem también
  const mapClasificacion = (clasificacion: string | null): Project['classification'] => {
    if (!clasificacion) return 'Gestion interna';
    if (clasificacion.toLowerCase().includes('ciudadano')) return 'Al ciudadano';
    return 'Gestion interna';
  };

  // Convertir años de number[] a string[]
  const aniosToYears = (anios: number[] | null): string[] => {
    if (!anios || anios.length === 0) return [new Date().getFullYear().toString()];
    return anios.map(a => a.toString());
  };

  // Formatear fecha de ISO a YYYY-MM (parseando string directo para evitar problemas de timezone)
  const formatDateToMonthYear = (dateStr: string | null): string | undefined => {
    if (!dateStr) return undefined;
    try {
      // Parsear directamente del string ISO: "YYYY-MM-DDTHH:mm:ss" o "YYYY-MM-DD"
      const datePart = dateStr.split('T')[0]; // "YYYY-MM-DD"
      const [year, month] = datePart.split('-');
      if (year && month) {
        return `${year}-${month}`;
      }
      return undefined;
    } catch {
      return undefined;
    }
  };

  return {
    id: proyecto.id.toString(),
    code: proyecto.codigo,
    name: proyecto.nombre,
    description: proyecto.descripcion || '',
    type: proyecto.tipo === 'Proyecto' ? 'Proyecto' : 'Actividad',
    classification: mapClasificacion(proyecto.clasificacion),
    status: mapEstado(proyecto.estado),
    scrumMaster: proyecto.scrumMaster
      ? `${proyecto.scrumMaster.nombre || ''} ${proyecto.scrumMaster.apellido || ''}`.trim() || 'Sin nombre'
      : proyecto.scrumMasterId
        ? `Scrum Master #${proyecto.scrumMasterId}`
        : 'Sin asignar',
    annualAmount: proyecto.montoAnual || 0,
    strategicAction: proyecto.accionEstrategicaId ? `AE N${proyecto.accionEstrategicaId}` : 'Sin AE',
    missingData: !proyecto.descripcion || !proyecto.scrumMasterId,
    years: aniosToYears(proyecto.anios),
    responsibles: [], // Se cargará con equipo si es necesario
    financialArea: proyecto.areasFinancieras || [],
    coordination: proyecto.coordinacion || undefined,
    coordinator: proyecto.coordinador
      ? `${proyecto.coordinador.nombre || ''} ${proyecto.coordinador.apellido || ''}`.trim() || undefined
      : undefined,
    managementMethod: proyecto.metodoGestion || 'Scrum',
    subProjects: [],
    startDate: formatDateToMonthYear(proyecto.fechaInicio),
    endDate: formatDateToMonthYear(proyecto.fechaFin),
    // IDs para el modal de edición
    accionEstrategicaId: proyecto.accionEstrategicaId || undefined,
    coordinadorId: proyecto.coordinadorId || undefined,
    scrumMasterId: proyecto.scrumMasterId || undefined,
    patrocinadorId: proyecto.patrocinadorId || undefined,
  };
}

const statusColors: { [key: string]: string } = {
    'Pendiente': 'bg-[#FE9F43]',
    'En planificación': 'bg-[#FFD700]',
    'En desarrollo': 'bg-[#559FFE]',
    'Finalizado': 'bg-[#2FD573]',
};

// Componente para fila de la tabla en vista lista
const ProjectListRow = ({
    project,
    userRole,
}: {
    project: Project;
    userRole?: string;
}) => {
    const router = useRouter();
    const isMissingData = project.missingData;
    const isDeveloper = userRole === ROLES.DESARROLLADOR;
    const isImplementador = userRole === ROLES.IMPLEMENTADOR;

    // Formatear rango de fechas
    const formatDateRange = (startDate?: string, endDate?: string) => {
        if (!startDate || !endDate) return project.years?.join(', ') || '-';
        const formatDate = (dateStr: string) => {
            const [year, month] = dateStr.split('-');
            return `${month}/${year}`;
        };
        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    };

    const handleRowClick = () => {
        localStorage.setItem('selectedProject', JSON.stringify(project));
        const detailsUrl = project.type === 'Proyecto' ? paths.poi.proyecto.detalles : paths.poi.actividad.detalles;
        router.push(detailsUrl);
    };

    return (
        <TableRow
            onClick={handleRowClick}
            className={`cursor-pointer hover:bg-blue-50 transition-colors ${isMissingData ? 'bg-red-50' : ''}`}
        >
            <TableCell className="font-medium text-[#004272]">{project.code}</TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-[#008ED2] shrink-0" />
                    <span className="font-medium text-[#272E35] line-clamp-1">{project.name}</span>
                    {isMissingData && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                </TooltipTrigger>
                                <TooltipContent className="bg-red-50 border-red-200">
                                    <p className="text-red-600">Faltan datos</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </TableCell>
            <TableCell>
                <span className="text-xs text-[#ADADAD] font-bold">{project.type}</span>
            </TableCell>
            <TableCell>
                <Badge
                    variant="outline"
                    className={`text-xs font-normal ${
                        project.classification === 'Al ciudadano'
                            ? 'border-green-500 text-green-700 bg-green-50'
                            : 'border-blue-500 text-blue-700 bg-blue-50'
                    }`}
                >
                    {project.classification}
                </Badge>
            </TableCell>
            <TableCell>
                <Badge className={`${statusColors[project.status]} text-black text-xs font-normal`}>
                    {project.status}
                </Badge>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#272E35] shrink-0" />
                    <span className="text-sm text-[#272E35] truncate">{project.scrumMaster}</span>
                </div>
            </TableCell>
            <TableCell>
                <span className="text-sm text-[#272E35]">
                    {formatDateRange(project.startDate, project.endDate)}
                </span>
            </TableCell>
        </TableRow>
    );
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
            return `${month}/${year}`;
        };
        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    };

    // Mostrar rango de fechas si existen, sino solo los años
    const displayDate = project.startDate && project.endDate
        ? formatDateRange(project.startDate, project.endDate)
        : project.years?.join(', ');

    const handleGoToDetails = () => {
        localStorage.setItem('selectedProject', JSON.stringify(project));
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
                {/* Tipo y Clasificación */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-[#ADADAD] font-bold">{project.type}</span>
                    <Badge
                        variant="outline"
                        className={`text-xs font-normal ${
                            project.classification === 'Al ciudadano'
                                ? 'border-green-500 text-green-700 bg-green-50'
                                : 'border-blue-500 text-blue-700 bg-blue-50'
                        }`}
                    >
                        {project.classification}
                    </Badge>
                </div>

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
    const { toast } = useToast();

    // Estado para proyectos cargados desde API (con IDs para edición)
    const [projects, setProjects] = useState<ProjectWithIds[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estado de paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const pageSize = 12;

    // Usar el store global de PGD para mantener la selección entre páginas
    const {
        selectedPGD: currentPGD,
        pgds,
        isLoading: loadingPGD,
        setSelectedPGD: setCurrentPGD,
        initializePGD,
        setLoading: setLoadingPGD,
        availableYears: pgdAvailableYears,
    } = usePGD();

    // Filtros
    const [selectedType, setSelectedType] = useState<string>("Proyecto");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedClassification, setSelectedClassification] = useState<string>("all");
    const [selectedYear, setSelectedYear] = useState<string>("all");

    // Generar lista de años disponibles basado en el PGD seleccionado (del store global)
    const availableYears = pgdAvailableYears.map(y => y.toString());

    // Estado para modo de vista (cards o lista)
    const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

    // Paginación para vista de lista (10 items por página)
    const [listCurrentPage, setListCurrentPage] = useState(1);
    const listPageSize = 10;

    // Estados para modales
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<ProjectWithIds | null>(null);

    // Verificar permisos del usuario - ADMIN tiene acceso total
    const userRole = user?.role;
    const userName = user?.name;
    const isAdmin = userRole === ROLES.ADMIN;
    const canCreate = userRole ? hasPermission(userRole, MODULES.POI, PERMISSIONS.CREATE) : false;
    const isDeveloper = userRole === ROLES.DESARROLLADOR;
    const isImplementador = userRole === ROLES.IMPLEMENTADOR;
    const isScrumMaster = userRole === ROLES.SCRUM_MASTER;
    const isPmo = userRole === ROLES.PMO;

    // Tipo efectivo para filtrado
    // DESARROLLADOR solo puede ver "Proyecto"
    // IMPLEMENTADOR solo puede ver "Actividad"
    const effectiveType = isDeveloper ? "Proyecto" : isImplementador ? "Actividad" : selectedType;

    // Cargar lista de PGDs disponibles al montar el componente (usa el store global)
    useEffect(() => {
        const loadPGDs = async () => {
            try {
                setLoadingPGD(true);
                const pgdsList = await getPGDs({ activo: true });
                // initializePGD guarda los PGDs y selecciona el vigente si no hay uno seleccionado
                initializePGD(pgdsList);
            } catch (error) {
                console.error('Error loading PGDs:', error);
                setLoadingPGD(false);
            }
        };
        loadPGDs();
    }, [initializePGD, setLoadingPGD]);

    /**
     * Función para cargar proyectos o actividades desde la API
     */
    const fetchProyectos = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            let mappedProjects: ProjectWithIds[] = [];

            if (effectiveType === 'Actividad') {
                // Cargar Actividades desde el endpoint /actividades
                // IMPORTANTE: Filtrar por PGD actual y solo mostrar actividades activas (no eliminadas)
                const actividadFilters: Parameters<typeof getAllActividades>[0] = {
                    search: searchQuery.trim() || undefined,
                    pgdId: currentPGD?.id,
                    activo: true, // Solo mostrar actividades no eliminadas
                };

                // IMPLEMENTADOR: solo ve actividades donde es responsable (server-side filter)
                if (isImplementador && user?.id) {
                    const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
                    actividadFilters.responsableUsuarioId = userId;
                }

                const actividadesData = await getAllActividades(actividadFilters);

                // Filtrar por año (siempre dentro del rango del PGD)
                let filteredActividades = actividadesData;
                if (selectedYear && selectedYear !== 'all') {
                    filteredActividades = actividadesData.filter(a =>
                        a.anios?.includes(parseInt(selectedYear, 10)) ||
                        !a.anios ||
                        a.anios.length === 0
                    );
                }

                // Filtrar por coordinador si es necesario
                if (userRole === ROLES.COORDINADOR && user?.id) {
                    const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
                    filteredActividades = filteredActividades.filter(a => a.coordinadorId === userId);
                }

                // IMPLEMENTADOR: solo ve actividades donde es responsable (asignado en rrhh.asignaciones)
                // Este filtro NO se puede hacer local porque la info de asignaciones no viene en el response
                // Se debe pasar como query param para que el backend filtre

                mappedProjects = filteredActividades.map(mapActividadToProject);
                setTotalPages(1);
                setTotalItems(filteredActividades.length);
            } else {
                // Cargar Proyectos desde el endpoint /proyectos
                const filters: ProyectoQueryFilters = {
                    tipo: 'Proyecto',
                    page: currentPage,
                    pageSize: pageSize,
                };

                // IMPORTANTE: Filtrar por PGD actual para mostrar solo proyectos de este PGD
                if (currentPGD?.id) {
                    filters.pgdId = currentPGD.id;
                }

                // Agregar búsqueda si existe
                if (searchQuery.trim()) {
                    filters.search = searchQuery.trim();
                }

                // Agregar filtro de año (siempre dentro del rango del PGD)
                if (selectedYear && selectedYear !== 'all') {
                    filters.anno = parseInt(selectedYear, 10);
                }

                // Filtrar por rol del usuario
                // ADMIN y PMO ven todos los proyectos (sin filtro adicional)
                // SCRUM_MASTER: solo ve proyectos donde está asignado como Scrum Master
                if (!isAdmin && !isPmo && isScrumMaster && user?.id) {
                    filters.scrumMasterId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
                }
                // COORDINADOR: solo ve proyectos donde está asignado como Coordinador
                else if (!isAdmin && !isPmo && userRole === ROLES.COORDINADOR && user?.id) {
                    filters.coordinadorId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
                }
                // DESARROLLADOR: solo ve proyectos donde es responsable (asignado en rrhh.asignaciones)
                else if (isDeveloper && user?.id) {
                    const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
                    filters.responsableUsuarioId = userId;
                }

                const response = await getProyectos(filters);

                // La respuesta puede ser PaginatedResponse o un array directo
                let proyectosData: Proyecto[];

                if (Array.isArray(response)) {
                    // Si es un array directo
                    proyectosData = response as unknown as Proyecto[];
                    setTotalPages(1);
                    setTotalItems(proyectosData.length);
                } else if (response && typeof response === 'object') {
                    // Si es PaginatedResponse
                    const paginatedResponse = response as PaginatedResponse<Proyecto>;
                    proyectosData = paginatedResponse.data || [];
                    setTotalPages(paginatedResponse.totalPages || 1);
                    setTotalItems(paginatedResponse.total || proyectosData.length);
                } else {
                    proyectosData = [];
                    setTotalPages(1);
                    setTotalItems(0);
                }

                // Mapear proyectos del API al formato del frontend
                mappedProjects = proyectosData.map(mapProyectoToProject);
            }

            setProjects(mappedProjects);

        } catch (err) {
            console.error('Error fetching proyectos:', err);
            setError('No se pudieron cargar los proyectos');
            toast({
                title: 'Error',
                description: 'No se pudieron cargar los proyectos. Intente nuevamente.',
                variant: 'destructive',
            });
            setProjects([]);
        } finally {
            setIsLoading(false);
        }
    }, [effectiveType, currentPage, searchQuery, selectedYear, toast, isScrumMaster, userRole, user, currentPGD]);

    // Cargar proyectos cuando cambien los filtros o el PGD seleccionado
    useEffect(() => {
        if (!loadingPGD && currentPGD) {
            fetchProyectos();
        }
    }, [fetchProyectos, loadingPGD, currentPGD]);

    // Resetear página cuando cambian los filtros
    useEffect(() => {
        setCurrentPage(1);
        setListCurrentPage(1);
    }, [effectiveType, searchQuery, selectedClassification, selectedYear]);

    // Filtrar proyectos localmente (filtros adicionales que no están en la API)
    const filteredProjects = projects.filter(p => {
        // Filtro por clasificación (cualificación) - filtro local
        if (selectedClassification !== "all" && p.classification !== selectedClassification) {
            return false;
        }

        // Filtro por asignación según el rol del usuario (filtro local)
        // ADMIN y PMO ven todos los proyectos/actividades
        // NOTA: La API ya debería filtrar por scrumMasterId para SCRUM_MASTER,
        // así que este filtro local es solo una validación adicional
        if (!isAdmin && !isPmo && user) {
            // DESARROLLADOR e IMPLEMENTADOR: filtro server-side via responsableUsuarioId
            // No necesitan filtro local — el backend ya filtra por asignaciones
            // SCRUM_MASTER: ve donde está como scrumMaster (comparar por ID, no por nombre)
            if (isScrumMaster) {
                // Comparar por scrumMasterId (que guardamos al mapear el proyecto)
                const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
                const isScrumMasterAssigned = p.scrumMasterId === userId;
                // No aplicamos filtro local estricto ya que la API ya filtra
                // Solo dejamos pasar si no hay scrumMasterId o coincide
                // if (!isScrumMasterAssigned) return false;
            }
        }

        // Filtro por año local (validación adicional - solo si no es "all")
        if (selectedYear && selectedYear !== 'all') {
            // Si tiene años definidos, verificar si el año coincide
            if (p.years && p.years.length > 0) {
                if (!p.years.includes(selectedYear)) return false;
            }
        }

        return true;
    });

    // Paginación para vista de lista
    const listTotalPages = Math.ceil(filteredProjects.length / listPageSize);
    const paginatedListProjects = filteredProjects.slice(
        (listCurrentPage - 1) * listPageSize,
        listCurrentPage * listPageSize
    );

    // Handler para cambio de página en vista lista
    const handleListPageChange = (page: number) => {
        if (page >= 1 && page <= listTotalPages) {
            setListCurrentPage(page);
        }
    };

    // Generar array de páginas para paginación de lista
    const getListPageNumbers = () => {
        const pages: (number | 'ellipsis')[] = [];
        if (listTotalPages <= 5) {
            for (let i = 1; i <= listTotalPages; i++) {
                pages.push(i);
            }
        } else {
            if (listCurrentPage <= 3) {
                pages.push(1, 2, 3, 'ellipsis', listTotalPages);
            } else if (listCurrentPage >= listTotalPages - 2) {
                pages.push(1, 'ellipsis', listTotalPages - 2, listTotalPages - 1, listTotalPages);
            } else {
                pages.push(1, 'ellipsis', listCurrentPage - 1, listCurrentPage, listCurrentPage + 1, 'ellipsis', listTotalPages);
            }
        }
        return pages;
    };

    // Contar filtros activos (el año ya no cuenta como filtro ya que siempre debe estar dentro del PGD)
    const activeFiltersCount = [
        searchQuery,
        selectedClassification !== "all",
    ].filter(Boolean).length;

    const sectionTitle = effectiveType === "Proyecto" ? "Mis Proyectos" : "Mis Actividades";
    const SectionIcon = Folder;

    // Handlers CRUD
    const handleCreateProject = (newProject: Project) => {
        // Después de crear, recargar la lista desde la API
        setIsNewModalOpen(false);
        toast({
            title: 'Proyecto creado',
            description: 'El proyecto se ha creado correctamente.',
        });
        // Recargar proyectos
        fetchProyectos();
    };

    const handleEditProject = (updatedProject: Project) => {
        // Después de editar, recargar la lista desde la API
        setIsEditModalOpen(false);
        setSelectedProject(null);
        toast({
            title: 'Proyecto actualizado',
            description: 'El proyecto se ha actualizado correctamente.',
        });
        // Recargar proyectos
        fetchProyectos();
    };

    const handleDeleteProject = () => {
        if (selectedProject) {
            // Después de eliminar, recargar la lista desde la API
            toast({
                title: 'Proyecto eliminado',
                description: 'El proyecto se ha eliminado correctamente.',
            });
            // Recargar proyectos
            fetchProyectos();
        }
        setIsDeleteModalOpen(false);
        setSelectedProject(null);
    };

    // Handler para cambio de página
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // Generar array de páginas para paginación
    const getPageNumbers = () => {
        const pages: (number | 'ellipsis')[] = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 'ellipsis', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, 'ellipsis', totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
            }
        }
        return pages;
    };

    // Función para limpiar todos los filtros (el año se resetea a "Todos")
    const clearAllFilters = () => {
        setSearchQuery("");
        setSelectedClassification("all");
        setSelectedYear("all");
    };

    return (
        <>
            <div className="bg-[#D5D5D5] border-y border-[#1A5581] w-full">
                <div className="p-2 flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <h2 className="font-bold text-black pl-2">
                            PLAN OPERATIVO INFORMÁTICO (POI)
                        </h2>
                        {/* Selector de PGD */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">PGD:</span>
                            <Select
                                value={currentPGD?.id?.toString() || ''}
                                onValueChange={(value) => {
                                    const selectedPgd = pgds.find(p => p.id.toString() === value);
                                    if (selectedPgd) {
                                        setCurrentPGD(selectedPgd);
                                        setSelectedYear('all'); // Resetear filtro de año al cambiar PGD
                                    }
                                }}
                                disabled={loadingPGD || pgds.length === 0}
                            >
                                <SelectTrigger className="w-[160px] h-8 bg-white border-[#1A5581] text-black text-sm">
                                    <SelectValue placeholder={loadingPGD ? "Cargando..." : "Seleccionar PGD"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {pgds.map(pgd => (
                                        <SelectItem key={pgd.id} value={pgd.id.toString()}>
                                            {pgd.anioInicio} - {pgd.anioFin}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
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
                {/* Header de sección con ícono y toggle de vista */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-[#004272]">
                        <SectionIcon className="h-5 w-5" />
                        <h3 className="font-bold text-lg">{sectionTitle}</h3>
                        {activeFiltersCount > 0 && (
                            <Badge className="bg-[#018CD1] text-white text-xs ml-2">
                                {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} activo{activeFiltersCount > 1 ? 's' : ''}
                            </Badge>
                        )}
                    </div>
                    {/* Botones de toggle para vista cards/lista */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        <Button
                            variant={viewMode === 'cards' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('cards')}
                            className={`h-8 px-3 ${viewMode === 'cards' ? 'bg-[#018CD1] text-white hover:bg-[#016ba1]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
                            title="Vista en tarjetas"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className={`h-8 px-3 ${viewMode === 'list' ? 'bg-[#018CD1] text-white hover:bg-[#016ba1]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
                            title="Vista en lista"
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
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
                                <SelectItem value="Gestion interna">Gestión interna</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Año (filtrado por PGD seleccionado) */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-black">Año</label>
                        <Select
                            value={selectedYear}
                            onValueChange={setSelectedYear}
                            disabled={loadingPGD || availableYears.length === 0}
                        >
                            <SelectTrigger className="w-[120px] bg-white border-[#CFD6DD] text-black">
                                <SelectValue placeholder={loadingPGD ? "Cargando..." : "Seleccionar"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {availableYears.map(year => (
                                    <SelectItem key={year} value={year}>{year}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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

                {/* Estado de carga */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-12 w-12 animate-spin text-[#018CD1] mb-4" />
                        <p className="text-gray-500">Cargando {effectiveType === "Proyecto" ? "proyectos" : "actividades"}...</p>
                    </div>
                )}

                {/* Estado de error */}
                {!isLoading && error && (
                    <div className="flex flex-col items-center justify-center py-12 text-red-500">
                        <AlertTriangle className="h-12 w-12 mb-4" />
                        <p className="text-lg font-medium">Error al cargar los datos</p>
                        <p className="text-sm mb-4">{error}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchProyectos}
                            className="text-[#018CD1] border-[#018CD1] hover:bg-[#018CD1]/10"
                        >
                            Reintentar
                        </Button>
                    </div>
                )}

                {/* Mensaje cuando no hay resultados */}
                {!isLoading && !error && filteredProjects.length === 0 && (
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

                {/* Grid de proyectos (vista cards) */}
                {!isLoading && !error && filteredProjects.length > 0 && viewMode === 'cards' && (
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
                )}

                {/* Vista lista/tabla */}
                {!isLoading && !error && filteredProjects.length > 0 && viewMode === 'list' && (
                    <>
                        <div className="mb-4 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                                        <TableHead className="w-[120px] font-bold text-[#004272]">Código</TableHead>
                                        <TableHead className="font-bold text-[#004272]">Nombre</TableHead>
                                        <TableHead className="w-[100px] font-bold text-[#004272]">Tipo</TableHead>
                                        <TableHead className="w-[140px] font-bold text-[#004272]">Clasificación</TableHead>
                                        <TableHead className="w-[130px] font-bold text-[#004272]">Estado</TableHead>
                                        <TableHead className="w-[180px] font-bold text-[#004272]">
                                            {effectiveType === 'Proyecto' ? 'Scrum Master' : 'Gestor'}
                                        </TableHead>
                                        <TableHead className="w-[140px] font-bold text-[#004272]">Fechas</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedListProjects.map(p => (
                                        <ProjectListRow
                                            key={p.id}
                                            project={p}
                                            userRole={userRole}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {/* Paginación para vista lista */}
                        {listTotalPages > 1 && (
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-sm text-gray-500">
                                    Mostrando {((listCurrentPage - 1) * listPageSize) + 1} - {Math.min(listCurrentPage * listPageSize, filteredProjects.length)} de {filteredProjects.length} {effectiveType === "Proyecto" ? "proyectos" : "actividades"}
                                </p>
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleListPageChange(listCurrentPage - 1);
                                                }}
                                                className={listCurrentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                            />
                                        </PaginationItem>
                                        {getListPageNumbers().map((page, index) => (
                                            <PaginationItem key={index}>
                                                {page === 'ellipsis' ? (
                                                    <PaginationEllipsis />
                                                ) : (
                                                    <PaginationLink
                                                        href="#"
                                                        isActive={listCurrentPage === page}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleListPageChange(page);
                                                        }}
                                                        className="cursor-pointer"
                                                    >
                                                        {page}
                                                    </PaginationLink>
                                                )}
                                            </PaginationItem>
                                        ))}
                                        <PaginationItem>
                                            <PaginationNext
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleListPageChange(listCurrentPage + 1);
                                                }}
                                                className={listCurrentPage === listTotalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </>
                )}

                {/* Paginación para vista cards (paginación del servidor) */}
                {!isLoading && !error && totalPages > 1 && viewMode === 'cards' && (
                    <div className="flex items-center justify-between mt-auto">
                        <p className="text-sm text-gray-500">
                            Mostrando {filteredProjects.length} de {totalItems} {effectiveType === "Proyecto" ? "proyectos" : "actividades"}
                        </p>
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handlePageChange(currentPage - 1);
                                        }}
                                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                    />
                                </PaginationItem>
                                {getPageNumbers().map((page, index) => (
                                    <PaginationItem key={index}>
                                        {page === 'ellipsis' ? (
                                            <PaginationEllipsis />
                                        ) : (
                                            <PaginationLink
                                                href="#"
                                                isActive={currentPage === page}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handlePageChange(page);
                                                }}
                                                className="cursor-pointer"
                                            >
                                                {page}
                                            </PaginationLink>
                                        )}
                                    </PaginationItem>
                                ))}
                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handlePageChange(currentPage + 1);
                                        }}
                                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </div>

            {/* Modal para crear nuevo POI */}
            <POIFullModal
                isOpen={isNewModalOpen}
                onClose={() => setIsNewModalOpen(false)}
                project={null}
                onSave={handleCreateProject}
                pgdId={currentPGD?.id}
                pgdAnioInicio={currentPGD?.anioInicio}
                pgdAnioFin={currentPGD?.anioFin}
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
                pgdId={currentPGD?.id}
                pgdAnioInicio={currentPGD?.anioInicio}
                pgdAnioFin={currentPGD?.anioFin}
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
