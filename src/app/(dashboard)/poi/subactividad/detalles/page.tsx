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
  Pencil,
  Loader2,
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
import { getSubactividadById, deleteSubactividad, updateSubactividad } from '@/features/actividades/services/subactividades.service';
import type { Subactividad } from '@/features/actividades/types';
import { getCoordinadores, getScrumMasters, type Usuario, formatUsuarioNombre } from '@/lib/services';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import { useToast } from '@/lib/hooks/use-toast';
import {
  DashboardTabContent,
  InformesTabContent,
  TableroTabContent,
} from '@/features/actividades/components/tabs';
import { ListaContent } from '@/app/(dashboard)/poi/actividad/lista/page';

// Constants for edit modal (mirror poi-modal.tsx)
const AREAS_DISPONIBLES = [
  "Oficina Técnica de Administración (OTA)",
  "Dirección de Censos y Encuestas (DNCE)",
  "Dirección Técnica de Indicadores (DTI)",
  "Oficina de Administración y Finanzas (OAF)",
  "Oficina de Gestión Documental (OGD)",
  "Oficina de Planificación y Presupuesto (OPP)",
  "Oficina de Formación Ciudadana e Identidad",
  "Oficina de Tecnologías de la Información (OTIN)",
  "Oficina de Recursos Humanos",
];

const financialAreaOptions: MultiSelectOption[] = [
  { label: 'OTA - Oficina Técnica de Administración', value: 'Oficina Técnica de Administración (OTA)' },
  { label: 'DNCE - Dirección de Censos y Encuestas', value: 'Dirección de Censos y Encuestas (DNCE)' },
  { label: 'DTI - Dirección Técnica de Indicadores', value: 'Dirección Técnica de Indicadores (DTI)' },
  { label: 'OAF - Oficina de Administración y Finanzas', value: 'Oficina de Administración y Finanzas (OAF)' },
  { label: 'OGD - Oficina de Gestión Documental', value: 'Oficina de Gestión Documental (OGD)' },
  { label: 'OPP - Oficina de Planificación y Presupuesto', value: 'Oficina de Planificación y Presupuesto (OPP)' },
  { label: 'Oficina de Formación Ciudadana e Identidad', value: 'Oficina de Formación Ciudadana e Identidad' },
  { label: 'OTIN - Oficina de Tecnologías de la Información', value: 'Oficina de Tecnologías de la Información (OTIN)' },
  { label: 'ORH - Oficina de Recursos Humanos', value: 'Oficina de Recursos Humanos' },
];

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

    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [isSavingEdit, setIsSavingEdit] = React.useState(false);
    const [gestores, setGestores] = React.useState<Usuario[]>([]); // coordinadores + scrumMasters merged
    const [coordinadoresList, setCoordinadoresList] = React.useState<Usuario[]>([]);
    const [editForm, setEditForm] = React.useState({
        nombre: '',
        descripcion: '',
        coordinacion: '',
        coordinadorId: '',
        gestorId: '',
        financialArea: [] as string[],
        years: [] as string[],
        montoAnual: '',
        fechaInicio: '',
        fechaFin: '',
    });

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
    const canEdit = isAdmin || (!isScrumMaster && !isImplementador && !isDesarrollador);
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

    const handleOpenEdit = async () => {
        if (!subactividadData) return;
        try {
            const [coords, sms] = await Promise.all([getCoordinadores(), getScrumMasters()]);
            const merged = [...coords, ...sms.filter(sm => !coords.some(c => c.id === sm.id))];
            setCoordinadoresList(coords);
            setGestores(merged);
            setEditForm({
                nombre: subactividadData.nombre || '',
                descripcion: subactividadData.descripcion || '',
                coordinacion: subactividadData.coordinacion || '',
                coordinadorId: subactividadData.coordinadorId?.toString() || '',
                gestorId: subactividadData.gestorId?.toString() || '',
                financialArea: subactividadData.areasFinancieras || [],
                years: subactividadData.anios?.map(String) || [],
                montoAnual: subactividadData.montoAnual?.toString() || '',
                fechaInicio: subactividadData.fechaInicio ? subactividadData.fechaInicio.split('T')[0] : '',
                fechaFin: subactividadData.fechaFin ? subactividadData.fechaFin.split('T')[0] : '',
            });
            setIsEditModalOpen(true);
        } catch (error) {
            console.error('Error cargando datos para edición:', error);
            toast({ title: 'Error', description: 'No se pudo cargar los datos para edición', variant: 'destructive' });
        }
    };

    const handleSaveEdit = async () => {
        if (!subactividadData) return;
        setIsSavingEdit(true);
        try {
            const updated = await updateSubactividad(subactividadData.id, {
                nombre: editForm.nombre,
                descripcion: editForm.descripcion || undefined,
                coordinacion: editForm.coordinacion || undefined,
                coordinadorId: editForm.coordinadorId ? parseInt(editForm.coordinadorId) : undefined,
                gestorId: editForm.gestorId ? parseInt(editForm.gestorId) : undefined,
                areasFinancieras: editForm.financialArea.length > 0 ? editForm.financialArea : undefined,
                anios: editForm.years.length > 0 ? editForm.years.map(Number) : undefined,
                montoAnual: editForm.montoAnual ? parseFloat(editForm.montoAnual) : undefined,
                fechaInicio: editForm.fechaInicio || undefined,
                fechaFin: editForm.fechaFin || undefined,
            });
            setSubactividadData(updated);
            // Update gestor display using the gestores list (backend may return stale relation)
            const newGestor = gestores.find(g => g.id.toString() === editForm.gestorId);
            const newCoordinador = gestores.find(g => g.id.toString() === editForm.coordinadorId);
            const gestorName = newGestor ? formatUsuarioNombre(newGestor) : (updated.gestor ? `${updated.gestor.nombre} ${updated.gestor.apellido}`.trim() : '');
            const coordinadorName = newCoordinador ? formatUsuarioNombre(newCoordinador) : (updated.coordinador ? `${updated.coordinador.nombre} ${updated.coordinador.apellido}`.trim() : '');
            setProject(prev => prev ? {
                ...prev,
                name: updated.nombre,
                description: updated.descripcion || '',
                coordinator: coordinadorName,
                coordination: editForm.coordinacion || updated.coordinacion || '',
                gestor: gestorName,
                scrumMaster: gestorName,
                financialArea: editForm.financialArea,
                years: editForm.years,
                annualAmount: updated.montoAnual || 0,
                startDate: updated.fechaInicio ? updated.fechaInicio.split('T')[0] : '',
                endDate: updated.fechaFin ? updated.fechaFin.split('T')[0] : '',
            } : null);
            setIsEditModalOpen(false);
            toast({ title: 'Subactividad actualizada', description: 'Los cambios se guardaron correctamente' });
        } catch (error) {
            console.error('Error actualizando subactividad:', error);
            toast({ title: 'Error', description: 'No se pudo actualizar la subactividad', variant: 'destructive' });
        } finally {
            setIsSavingEdit(false);
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
                                <Button
                                    size="sm"
                                    className={cn(
                                        "bg-[#018CD1] text-white hover:bg-[#0170A8]",
                                        !canEdit && "opacity-50 cursor-not-allowed"
                                    )}
                                    onClick={() => canEdit && handleOpenEdit()}
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

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-lg p-0" showCloseButton={false}>
                    <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between">
                        <DialogTitle>EDITAR SUBACTIVIDAD</DialogTitle>
                        <Button type="button" variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" onClick={() => setIsEditModalOpen(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogHeader>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        {/* Nombre */}
                        <div>
                            <label className="text-sm font-medium">Nombre *</label>
                            <Input
                                placeholder="Ingresar nombre"
                                value={editForm.nombre}
                                onChange={e => setEditForm(p => ({ ...p, nombre: e.target.value }))}
                            />
                        </div>
                        {/* Descripción */}
                        <div>
                            <label className="text-sm font-medium">Descripción</label>
                            <Textarea
                                placeholder="Ingresar descripción"
                                value={editForm.descripcion}
                                onChange={e => setEditForm(p => ({ ...p, descripcion: e.target.value }))}
                                className="min-h-[80px]"
                            />
                        </div>
                        {/* Coordinación */}
                        <div>
                            <label className="text-sm font-medium">Coordinación</label>
                            <Select
                                value={editForm.coordinacion}
                                onValueChange={v => setEditForm(p => ({ ...p, coordinacion: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar coordinación" />
                                </SelectTrigger>
                                <SelectContent>
                                    {AREAS_DISPONIBLES.map(area => (
                                        <SelectItem key={area} value={area}>{area}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Coordinador */}
                        <div>
                            <label className="text-sm font-medium">Coordinador</label>
                            <Select
                                value={editForm.coordinadorId}
                                onValueChange={v => setEditForm(p => ({ ...p, coordinadorId: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar coordinador" />
                                </SelectTrigger>
                                <SelectContent>
                                    {coordinadoresList.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            {formatUsuarioNombre(c)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Gestor */}
                        <div>
                            <label className="text-sm font-medium">Gestor *</label>
                            <Select
                                value={editForm.gestorId}
                                onValueChange={v => setEditForm(p => ({ ...p, gestorId: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar gestor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {gestores.map(u => (
                                        <SelectItem key={u.id} value={u.id.toString()}>
                                            {formatUsuarioNombre(u)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Área Financiera */}
                        <div>
                            <label className="text-sm font-medium">Área Financiera</label>
                            <MultiSelect
                                options={financialAreaOptions}
                                selected={editForm.financialArea}
                                onChange={selected => setEditForm(p => ({ ...p, financialArea: selected }))}
                                placeholder="Seleccionar área(s)"
                            />
                        </div>
                        {/* Año */}
                        <div>
                            <label className="text-sm font-medium">Año *</label>
                            <MultiSelect
                                options={
                                    subactividadData?.actividadPadre?.anios && subactividadData.actividadPadre.anios.length > 0
                                        ? subactividadData.actividadPadre.anios.map(y => ({ label: String(y), value: String(y) }))
                                        : editForm.years.map(y => ({ label: y, value: y }))
                                }
                                selected={editForm.years}
                                onChange={selected => setEditForm(p => ({ ...p, years: selected }))}
                                placeholder="Seleccionar año(s)"
                            />
                        </div>
                        {/* Monto Anual */}
                        <div>
                            <label className="text-sm font-medium">Monto anual *</label>
                            <Input
                                type="number"
                                placeholder="Ingresar monto anual"
                                value={editForm.montoAnual}
                                onChange={e => setEditForm(p => ({ ...p, montoAnual: e.target.value }))}
                            />
                        </div>
                        {/* Fechas */}
                        <div className="space-y-2">
                            <span className="text-sm font-medium">Fechas de la Subactividad</span>
                            {(subactividadData?.actividadPadre?.fechaInicio || subactividadData?.actividadPadre?.fechaFin) && (
                                <p className="text-xs text-blue-600 bg-blue-50 rounded px-2 py-1">
                                    Rango permitido: {subactividadData.actividadPadre?.fechaInicio ? new Date(subactividadData.actividadPadre.fechaInicio).toLocaleDateString('es-PE') : '—'} → {subactividadData.actividadPadre?.fechaFin ? new Date(subactividadData.actividadPadre.fechaFin).toLocaleDateString('es-PE') : '—'}
                                </p>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-muted-foreground">Fecha Inicio</label>
                                    <Input
                                        type="date"
                                        value={editForm.fechaInicio}
                                        onChange={e => setEditForm(p => ({ ...p, fechaInicio: e.target.value }))}
                                        min={subactividadData?.actividadPadre?.fechaInicio?.split('T')[0] || undefined}
                                        max={subactividadData?.actividadPadre?.fechaFin?.split('T')[0] || undefined}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-muted-foreground">Fecha Fin</label>
                                    <Input
                                        type="date"
                                        value={editForm.fechaFin}
                                        onChange={e => setEditForm(p => ({ ...p, fechaFin: e.target.value }))}
                                        min={editForm.fechaInicio || subactividadData?.actividadPadre?.fechaInicio?.split('T')[0] || undefined}
                                        max={subactividadData?.actividadPadre?.fechaFin?.split('T')[0] || undefined}
                                    />
                                </div>
                            </div>
                        </div>
                        {/* Método de Gestión */}
                        <div>
                            <label className="text-sm font-medium">Método de Gestión</label>
                            <Input value="Kanban" readOnly className="bg-gray-100" />
                        </div>
                    </div>
                    <DialogFooter className="px-6 pb-6 flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSavingEdit} style={{ borderColor: '#CFD6DD', color: 'black' }}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveEdit} disabled={isSavingEdit || !editForm.nombre.trim()} style={{ backgroundColor: '#018CD1', color: 'white' }}>
                            {isSavingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
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
