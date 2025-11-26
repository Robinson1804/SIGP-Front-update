
"use client";

import React from 'react';
import { useRouter } from "next/navigation";
import {
  HardHat,
  Search,
  Folder,
  CheckCircle,
  Calendar,
  MoreHorizontal,
  AlertTriangle,
  Users as UsersIcon,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { type Project } from '@/lib/definitions';


const initialProjects: Project[] = [
    {
        id: '1',
        name: 'Administración de Portafolio de Proyectos',
        description: 'Descripción del proyecto',
        type: 'Proyecto',
        classification: 'Gestión interna',
        status: 'En planificación',
        startDate: '2025-04',
        endDate: '2025-09',
        scrumMaster: 'Ana Pérez',
        annualAmount: 50000,
        strategicAction: 'AE N°1',
        missingData: false,
        years: ['2025'],
        responsibles: ['Ana Garcia'],
        financialArea: ['OTIN'],
        coordination: 'Coordinación 1',
        coordinator: 'Jefe de Proyecto',
        managementMethod: 'Scrum',
        subProjects: [],
    },
    {
        id: '2',
        name: 'UNETE INEI',
        description: 'Descripción del proyecto 2',
        type: 'Proyecto',
        classification: 'Al ciudadano',
        status: 'En planificación',
        startDate: '2025-04',
        endDate: '2025-09',
        scrumMaster: 'Mario Casas',
        annualAmount: 75000,
        strategicAction: 'AE N°2',
        missingData: false,
        years: ['2025'],
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
        scrumMaster: 'Marco Polo',
        annualAmount: 25000,
        strategicAction: 'AE N°3',
        missingData: false,
        years: ['2025'],
        responsibles: ['Carlos Ruiz'],
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
        scrumMaster: 'Marco Polo',
        annualAmount: 30000,
        strategicAction: 'AE N°4',
        missingData: false,
        years: ['2025'],
        responsibles: ['Equipo SIRA'],
        financialArea: ['OTIN'],
        coordination: 'Coordinación 3',
        coordinator: 'Líder Técnico',
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

const ProjectCard = ({ project }: { project: Project }) => {
    const isMissingData = project.missingData;
    const router = useRouter();

    const formatMonthYear = (dateString: string) => {
        if (!dateString) return '';
        const [year, month] = dateString.split('-');
        const date = new Date(Number(year), Number(month) - 1);
        const monthName = date.toLocaleString('es-ES', { month: 'short' });
        return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
    }

    const displayDate = project.startDate && project.endDate
        ? `${formatMonthYear(project.startDate)} - ${formatMonthYear(project.endDate)}`
        : project.years?.join(', ');

    const handleGoToDetails = () => {
        localStorage.setItem('selectedProject', JSON.stringify(project));
        const detailsUrl = project.type === 'Proyecto' ? '/poi/proyecto/detalles' : '/poi/actividad/detalles';
        router.push(detailsUrl);
    };

    const cardContent = (
         <Card onClick={handleGoToDetails} className={`w-full h-full flex flex-col shadow-md rounded-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer ${isMissingData ? 'bg-red-100/50' : 'bg-white'}`}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-2">
                    <Folder className="w-6 h-6 text-[#008ED2]" />
                    <div className="flex flex-col">
                        <h3 className="font-bold text-black text-base">{project.name}</h3>
                        <p className="text-xs text-[#ADADAD] font-bold">{project.type}</p>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-[#4A545E]" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={handleGoToDetails}>
                            Ir a {project.type}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 flex-grow justify-end pt-2 text-sm">
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#272E35] shrink-0" />
                    <span className="font-semibold shrink-0 text-xs">Estado:</span>
                    <Badge className={`${statusColors[project.status]} text-black text-xs`}>{project.status}</Badge>
                </div>
                <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-[#272E35] shrink-0 mt-0.5" />
                    <span className="font-semibold shrink-0 text-xs">Fechas:</span>
                    <span className="break-words capitalize text-xs">{displayDate}</span>
                </div>
                 <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4 text-[#272E35] shrink-0" />
                    <span className="font-semibold shrink-0 text-xs">Scrum Master:</span>
                    <span className="truncate text-xs">{project.scrumMaster}</span>
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

function PmoPoiView() {
  return (
    <>
      <div className="bg-[#D5D5D5] border-y border-[#1A5581]">
        <div className="p-2 flex items-center justify-between w-full">
          <h2 className="font-bold text-black pl-2">PLAN OPERATIVO INFORMÁTICO (POI)</h2>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F9F9F9] p-6 text-gray-500">
        <HardHat className="h-24 w-24 mb-4" />
        <h3 className="text-2xl font-bold">Módulo en Construcción para PMO</h3>
        <p>Esta sección para el rol PMO estará disponible próximamente.</p>
      </div>
    </>
  );
}

function ScrumMasterPoiView() {
    const [projects] = React.useState<Project[]>(initialProjects);
    const [selectedType, setSelectedType] = React.useState<string>("Proyecto");

    const filteredProjects = projects.filter(p => p.type === selectedType);
    const sectionTitle = selectedType === "Proyecto" ? "Mis Proyectos" : "Mis Actividades";
    const SectionIcon = Folder;

    return (
        <>
            <div className="bg-[#D5D5D5] border-y border-[#1A5581] w-full">
                <div className="p-2 flex items-center justify-between w-full">
                    <h2 className="font-bold text-black pl-2">
                        PLAN OPERATIVO INFORMÁTICO (POI)
                    </h2>
                </div>
            </div>
            <div className="flex-1 flex flex-col bg-[#F9F9F9] p-6">
                <div className="flex items-center gap-2 text-[#004272] mb-4">
                    <SectionIcon />
                    <h3 className="font-bold text-lg">{sectionTitle}</h3>
                </div>
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7E8C9A]" />
                        <Input placeholder="Buscar" className="pl-9 bg-white border-[#CFD6DD]" />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-black">Tipo</label>
                        <Select value={selectedType} onValueChange={setSelectedType}>
                            <SelectTrigger className="w-[150px] bg-white border-[#CFD6DD] text-black">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Proyecto">Proyecto</SelectItem>
                                <SelectItem value="Actividad">Actividad</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="flex items-center gap-2">
                        <label className="text-sm text-black">Proyecto</label>
                        <Select>
                            <SelectTrigger className="w-[180px] bg-white border-[#CFD6DD] text-black">
                                <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                                {/* Project options */}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-black">Cualificación</label>
                        <Select>
                            <SelectTrigger className="w-[180px] bg-white border-[#CFD6DD] text-black">
                                <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Al ciudadano">Al ciudadano</SelectItem>
                                <SelectItem value="Gestión interna">Gestión interna</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-black">Seleccionar</label>
                        <Select>
                            <SelectTrigger className="w-[180px] bg-white border-[#CFD6DD] text-black]">
                                <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                                {/* More options */}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-black">Mes</label>
                         <Input type="month" defaultValue={new Date().toISOString().substring(0, 7)} className="bg-white border-[#CFD6DD] text-black" />
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {filteredProjects.map(p => (
                        <ProjectCard key={p.id} project={p} />
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
        </>
    )
}

function PoiPageContent() {
    const [role, setRole] = React.useState<string | null>(null);

    React.useEffect(() => {
        // This runs on the client-side
        const storedRole = localStorage.getItem('userRole');
        setRole(storedRole);
    }, []);

    if (role === null) {
      return <div>Cargando...</div>; // Or a loading spinner
    }
    
    const isPmo = role === 'pmo';
    
    return (
        <AppLayout isPmo={isPmo} breadcrumbs={[{ label: "POI" }]}>
            {isPmo ? <PmoPoiView /> : <ScrumMasterPoiView />}
        </AppLayout>
    )
}

export default function PoiPage() {
  return (
    <React.Suspense fallback={<div>Cargando...</div>}>
      <PoiPageContent />
    </React.Suspense>
  )
}
