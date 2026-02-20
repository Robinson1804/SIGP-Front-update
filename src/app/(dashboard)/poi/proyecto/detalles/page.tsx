"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Folder,
  Trash2,
  Pencil,
  Briefcase,
  DollarSign,
  Users as UsersIcon,
  CheckCircle,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { POIFullModal, SubProjectModal, AreaUsuariaDisplay } from '@/features/proyectos';
import { SubProject, Project, MODULES, ROLES, PERMISSIONS, type Proyecto } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { paths } from '@/lib/paths';
import { ProtectedRoute } from "@/features/auth";
import { useAuth, usePGD } from '@/stores';
import { hasPermission } from "@/lib/permissions";
import {
  getProyectoById,
  getProyectoEquipo,
  deleteProyecto,
} from '@/features/proyectos/services';
import {
  getSprintsByProyecto,
  type Sprint,
} from '@/features/proyectos/services';
import {
  getEpicasByProyecto,
  type Epica,
} from '@/features/proyectos/services';
import {
  getSubproyectosByProyecto,
  deleteSubproyecto,
  createSubproyecto,
  updateSubproyecto,
  type Subproyecto,
} from '@/features/proyectos/services/subproyectos.service';
import {
  getScrumMasters,
  getCoordinadores,
  type Usuario,
} from '@/lib/services/usuarios.service';
import {
  getAsignacionesBySubproyecto,
  syncAsignacionesSubproyecto,
  getPersonalDisponible,
  formatPersonalNombre,
  type Personal,
} from '@/lib/services/asignaciones.service';
import { useToast } from '@/lib/hooks/use-toast';
import {
    DocumentoPhaseAccordion,
    useDocumentos,
} from '@/features/documentos';
import { RequerimientoList } from '@/features/requerimientos';
import { BacklogTabContent } from '@/features/proyectos/components/backlog-tab';
import { CronogramaView } from '@/features/cronograma';
import { ActasTabContent } from '@/features/actas';
import { FolderOpen, FileText, Calendar, LayoutList } from 'lucide-react';

// Interfaz para miembro de equipo
interface TeamMember {
  id: number;
  nombre: string;
  cargo?: string;
  rol?: string;
}

// Interfaz para sprint con progreso calculado
interface SprintWithProgress {
  id: number;
  name: string;
  status: string;
  progress: number;
}

/**
 * Mapea estado de sprint del API al frontend
 */
function mapSprintStatus(estado: string): string {
  const statusMap: Record<string, string> = {
    // Nuevos valores
    'Por hacer': 'Por hacer',
    'En progreso': 'En progreso',
    'Finalizado': 'Finalizado',
    // Valores antiguos (compatibilidad)
    'Planificado': 'Por hacer',
    'Activo': 'En progreso',
    'Completado': 'Finalizado',
  };
  return statusMap[estado] || 'Por hacer';
}

/**
 * Calcula el progreso de un sprint basado en su estado
 * - Por hacer: 0%
 * - En progreso: 50%
 * - Finalizado/Completado: 100%
 */
function calculateSprintProgress(sprint: Sprint): number {
  const estado = sprint.estado;
  if (estado === 'Finalizado' || estado === 'Completado') return 100;
  if (estado === 'En progreso') return 50;
  return 0; // Por hacer o cualquier otro estado
}

// Tipo extendido de Project con IDs para el modal
type ProjectWithIds = Project & {
  accionEstrategicaId?: number;
  coordinadorId?: number;
  scrumMasterId?: number;
  areaUsuariaId?: number;
};

/**
 * Obtiene el nombre completo de un usuario relacionado
 */
function getUsuarioNombre(usuario: any): string {
  if (!usuario) return 'Sin asignar';

  // Si tiene personal con nombre completo
  if (usuario.personal) {
    const { nombre, apellidoPaterno, apellidoMaterno } = usuario.personal;
    const partes = [nombre, apellidoPaterno, apellidoMaterno].filter(Boolean);
    if (partes.length > 0) return partes.join(' ');
  }

  // Fallback a campos directos del usuario
  if (usuario.nombre && usuario.apellido) {
    return `${usuario.nombre} ${usuario.apellido}`;
  }

  if (usuario.nombre) return usuario.nombre;
  if (usuario.username) return usuario.username;
  if (usuario.email) return usuario.email.split('@')[0];

  return `Usuario #${usuario.id}`;
}

/**
 * Obtiene el texto de la acción estratégica (código + nombre)
 */
function getAccionEstrategicaTexto(ae: any): string {
  if (!ae) return 'Sin AE';
  if (ae.codigo && ae.nombre) return `${ae.codigo} - ${ae.nombre}`;
  if (ae.codigo) return ae.codigo;
  if (ae.nombre) return ae.nombre;
  return `AE #${ae.id}`;
}

/**
 * Mapea un subproyecto del API al formato del frontend (SubProject)
 * Nota: Los responsables se cargan dinámicamente via asignaciones cuando se edita el subproyecto
 */
function mapSubproyectoToSubProject(subproyecto: Subproyecto): SubProject {
  // El monto puede venir como string desde la BD (tipo decimal)
  const monto = typeof subproyecto.monto === 'string'
    ? parseFloat(subproyecto.monto)
    : (subproyecto.monto || 0);

  // Convertir años de número a string
  const years = subproyecto.anios
    ? subproyecto.anios.map(a => a.toString())
    : [];

  // Nombre del coordinador
  const coordinadorNombre = subproyecto.coordinador
    ? getUsuarioNombre(subproyecto.coordinador)
    : '';

  // Formatear fechas a YYYY-MM-DD
  const toDateStr = (d: string | undefined) => {
    if (!d) return '';
    return d.substring(0, 10);
  };

  // Responsables se cargan dinámicamente via getAsignacionesBySubproyecto cuando se edita
  return {
    id: subproyecto.id.toString(),
    name: subproyecto.nombre,
    description: subproyecto.descripcion || '',
    responsible: [], // Se carga via asignaciones al editar
    scrumMaster: subproyecto.scrumMaster
      ? getUsuarioNombre(subproyecto.scrumMaster)
      : 'Sin asignar',
    years: years,
    amount: monto,
    managementMethod: 'Scrum',
    financialArea: subproyecto.areasFinancieras || [],
    progress: 0, // TODO: Calcular progreso basado en sprints del subproyecto
    status: subproyecto.estado || 'Pendiente',
    coordinador: coordinadorNombre,
    coordinacion: subproyecto.coordinacion || '',
    fechaInicio: toDateStr(subproyecto.fechaInicio),
    fechaFin: toDateStr(subproyecto.fechaFin),
  };
}

/**
 * Mapea un proyecto del API (Proyecto) al formato del frontend (Project)
 * Incluye los IDs para que el modal de edición pueda usarlos
 */
function mapProyectoToProject(proyecto: Proyecto, equipo: TeamMember[] = [], subproyectos: SubProject[] = []): ProjectWithIds {
  // Mapear estado
  const mapEstado = (estado: string): Project['status'] => {
    const estadoMap: Record<string, Project['status']> = {
      'Pendiente': 'Pendiente',
      'En planificacion': 'En planificación',
      'En desarrollo': 'En desarrollo',
      'Finalizado': 'Finalizado',
      'Cancelado': 'Finalizado',
    };
    return estadoMap[estado] || 'Pendiente';
  };

  // Mapear clasificación: usar "Gestion interna" sin tilde (coincide con backend y SelectItem)
  const mapClasificacion = (clasificacion: string | null): Project['classification'] => {
    if (!clasificacion) return 'Gestion interna';
    if (clasificacion.toLowerCase().includes('ciudadano')) return 'Al ciudadano';
    return 'Gestion interna';
  };

  // Convertir años
  const aniosToYears = (anios: number[] | null): string[] => {
    if (!anios || anios.length === 0) return [new Date().getFullYear().toString()];
    return anios.map(a => a.toString());
  };

  // Formatear fecha - mantener formato original YYYY-MM-DD para compatibilidad con inputs
  const formatDateForInput = (dateStr: string | null): string | undefined => {
    if (!dateStr) return undefined;
    try {
      // Si ya está en formato YYYY-MM-DD, devolverlo tal cual
      if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        return dateStr.substring(0, 10); // Tomar solo YYYY-MM-DD
      }
      // Si es otro formato, convertir
      const date = new Date(dateStr);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    } catch {
      return undefined;
    }
  };

  // Obtener nombres de equipo como responsables
  const responsables = equipo.map(m => m.nombre);

  // Obtener nombres reales de usuarios relacionados
  const scrumMasterNombre = proyecto.scrumMaster
    ? getUsuarioNombre(proyecto.scrumMaster)
    : proyecto.scrumMasterId
      ? `Scrum Master #${proyecto.scrumMasterId}`
      : 'Sin asignar';

  const coordinadorNombre = proyecto.coordinador
    ? getUsuarioNombre(proyecto.coordinador)
    : proyecto.coordinadorId
      ? `Coordinador #${proyecto.coordinadorId}`
      : undefined;

  // Obtener acción estratégica con código + nombre
  const accionEstrategicaTexto = proyecto.accionEstrategica
    ? getAccionEstrategicaTexto(proyecto.accionEstrategica)
    : proyecto.accionEstrategicaId
      ? `AE #${proyecto.accionEstrategicaId}`
      : 'Sin AE';

  return {
    id: proyecto.id.toString(),
    code: proyecto.codigo,
    name: proyecto.nombre,
    description: proyecto.descripcion || '',
    type: proyecto.tipo === 'Proyecto' ? 'Proyecto' : 'Actividad',
    classification: mapClasificacion(proyecto.clasificacion),
    status: mapEstado(proyecto.estado),
    scrumMaster: scrumMasterNombre,
    annualAmount: proyecto.montoAnual || 0,
    strategicAction: accionEstrategicaTexto,
    missingData: !proyecto.descripcion || !proyecto.scrumMasterId,
    years: aniosToYears(proyecto.anios),
    responsibles: responsables.length > 0 ? responsables : [],
    financialArea: proyecto.areasFinancieras || [],
    coordination: proyecto.coordinacion || undefined,
    coordinator: coordinadorNombre,
    managementMethod: proyecto.metodoGestion || 'Scrum',
    subProjects: subproyectos,
    startDate: formatDateForInput(proyecto.fechaInicio),
    endDate: formatDateForInput(proyecto.fechaFin),
    // IDs para el modal de edición
    accionEstrategicaId: proyecto.accionEstrategicaId || undefined,
    coordinadorId: proyecto.coordinadorId || undefined,
    scrumMasterId: proyecto.scrumMasterId || undefined,
    areaUsuaria: (proyecto as any).areaUsuaria?.id || (proyecto as any).areaUsuariaId || undefined,
    areaUsuariaId: (proyecto as any).areaUsuaria?.id || (proyecto as any).areaUsuariaId || undefined,
  };
}

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
    'Finalizado': { badge: 'bg-[#2FD573] text-white', progress: 'bg-[#2FD573]', label: 'Finalizado' },
    // Fallback para valores antiguos
    'Completado': { badge: 'bg-[#2FD573] text-white', progress: 'bg-[#2FD573]', label: 'Finalizado' },
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
    const router = useRouter();
    const formatAmount = (amount: number) => {
        if (amount >= 1000000) {
            return `S/ ${(amount / 1000000).toFixed(1)}M`;
        }
        if (amount >= 1000) {
            return `S/ ${(amount / 1000).toFixed(0)}k`;
        }
        return `S/ ${amount.toLocaleString('es-PE')}`;
    }

    // Obtener el estado del subproyecto (con fallback)
    const status = subProject.status || 'Pendiente';
    const statusColor = subProjectStatusColors[status] || subProjectStatusColors['Pendiente'];

    return (
    <Card
        className="bg-white hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => router.push(`/poi/subproyecto/detalles?id=${parseInt(subProject.id)}`)}
    >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <Briefcase className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <CardTitle className="text-base font-bold truncate">
                    {subProject.name}
                </CardTitle>
            </div>
        </CardHeader>
        <CardContent>
            <Progress value={subProject.progress || 0} indicatorClassName="bg-[#559FFE]" />
            <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                <span>{subProject.progress || 0}%</span>
            </div>
            <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-500" />
                    <span>Estado:</span>
                    <Badge className={statusColor}>{status}</Badge>
                </div>
                <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span>Monto:</span>
                    <span className="font-medium">{formatAmount(subProject.amount)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="flex-shrink-0">Scrum Master:</span>
                    <span className="font-medium">{subProject.scrumMaster || 'Sin asignar'}</span>
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

// ============================================
// COMPONENTES DE CONTENIDO PARA CADA TAB
// ============================================

/**
 * Contenido del Tab Documentos
 * Usa los componentes de documentos existentes
 */
function DocumentosTabContent({ proyectoId }: { proyectoId: number }) {
    const { user } = useAuth();
    const {
        documentos,
        isLoading,
        fetchDocumentos,
        aprobarExistingDocumento,
    } = useDocumentos({
        proyectoId,
        autoFetch: true,
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <FolderOpen className="h-6 w-6 text-gray-700" />
                    Documentos del Proyecto
                </h3>
            </div>

            <DocumentoPhaseAccordion
                proyectoId={proyectoId}
                documentos={documentos}
                isLoading={isLoading}
                onRefresh={fetchDocumentos}
                onApprove={aprobarExistingDocumento}
            />
        </div>
    );
}

/**
 * Contenido del Tab Requerimientos
 * Usa el componente RequerimientoList de features/requerimientos
 */
function RequerimientosTabContent({ proyectoId }: { proyectoId: number }) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <FileText className="h-6 w-6 text-gray-700" />
                    Requerimientos del Proyecto
                </h3>
            </div>

            <RequerimientoList proyectoId={proyectoId} />
        </div>
    );
}

// BacklogTabContent importado desde @/features/proyectos/components/backlog-tab
// ActasTabContent importado desde @/features/actas

/**
 * Contenido del Tab Cronograma
 * Usa el componente CronogramaView con Gantt interactivo
 */
function CronogramaTabContent({ proyectoId, proyectoNombre, equipo, proyectoFechaInicio, proyectoFechaFin, isReadOnly = false }: {
    proyectoId: number;
    proyectoNombre?: string;
    equipo?: { id: number; nombre: string }[];
    proyectoFechaInicio?: string | null;
    proyectoFechaFin?: string | null;
    isReadOnly?: boolean;
}) {
    // Preparar responsables del equipo para el selector
    const responsables = equipo?.map(m => ({
        id: m.id,
        nombre: m.nombre,
    })) || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-gray-700" />
                    Cronograma del Proyecto
                </h3>
            </div>

            <CronogramaView
                proyectoId={proyectoId}
                proyectoNombre={proyectoNombre}
                responsables={responsables}
                proyectoFechaInicio={proyectoFechaInicio}
                proyectoFechaFin={proyectoFechaFin}
                isReadOnly={isReadOnly}
            />
        </div>
    );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function ProjectDetailsContent() {
    const { user } = useAuth();
    const { selectedPGD } = usePGD();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const router = useRouter();

    // Estado del proyecto (con IDs para edición)
    const [project, setProject] = useState<ProjectWithIds | null>(null);
    const [proyectoId, setProyectoId] = useState<string | null>(null);

    // Estados de carga
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingSprints, setIsLoadingSprints] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Datos adicionales del API
    const [sprints, setSprints] = useState<SprintWithProgress[]>([]);
    const [epicas, setEpicas] = useState<Epica[]>([]);
    const [equipo, setEquipo] = useState<TeamMember[]>([]);

    const [activeTab, setActiveTab] = useState('Detalles');

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isSubProjectModalOpen, setIsSubProjectModalOpen] = useState(false);
    const [editingSubProject, setEditingSubProject] = useState<SubProject | null>(null);
    const [isSubProjectDeleteModalOpen, setIsSubProjectDeleteModalOpen] = useState(false);
    const [deletingSubProject, setDeletingSubProject] = useState<SubProject | null>(null);

    // Datos para modal de subproyectos
    const [scrumMasters, setScrumMasters] = useState<Usuario[]>([]);
    const [coordinadoresData, setCoordinadoresData] = useState<Usuario[]>([]);
    const [personalDisponible, setPersonalDisponible] = useState<Personal[]>([]);

    const [progressAnimated, setProgressAnimated] = useState(false);

    // Permisos basados en el rol del usuario - ADMIN tiene acceso total
    const userRole = user?.role;
    const isAdmin = userRole === ROLES.ADMIN;
    const isScrumMaster = userRole === ROLES.SCRUM_MASTER;
    // Scrum Master ve los botones pero deshabilitados (ADMIN puede todo)
    const showEditDeleteButtons = userRole ? hasPermission(userRole, MODULES.POI, PERMISSIONS.EDIT) || isScrumMaster : false;
    const canEdit = isAdmin || (userRole ? hasPermission(userRole, MODULES.POI, PERMISSIONS.EDIT) && !isScrumMaster : false);
    const canDelete = isAdmin || (userRole ? hasPermission(userRole, MODULES.POI, PERMISSIONS.DELETE) && !isScrumMaster : false);

    // Obtener el ID del proyecto de los query params o localStorage
    useEffect(() => {
        const idFromParams = searchParams.get('id');
        const tabParam = searchParams.get('tab');

        if (tabParam) {
            setActiveTab(tabParam);
        }

        if (idFromParams) {
            setProyectoId(idFromParams);
        } else {
            // Fallback: intentar obtener del localStorage
            const savedProjectData = localStorage.getItem('selectedProject');
            if (savedProjectData) {
                try {
                    const projectData = JSON.parse(savedProjectData);
                    if (projectData.id) {
                        setProyectoId(projectData.id.toString());
                    }
                } catch {
                    // Si no se puede parsear, redirigir
                    router.push(paths.poi.base);
                }
            } else {
                router.push(paths.poi.base);
            }
        }
    }, [searchParams, router]);

    // Cargar scrum masters, coordinadores y personal disponible al montar
    useEffect(() => {
        const loadUsersData = async () => {
            try {
                const [scrumMastersData, personalData, coordinadoresLoaded] = await Promise.all([
                    getScrumMasters().catch(() => []),
                    getPersonalDisponible().catch(() => []),
                    getCoordinadores().catch(() => []),
                ]);
                setScrumMasters(scrumMastersData);
                setPersonalDisponible(personalData);
                setCoordinadoresData(Array.isArray(coordinadoresLoaded) ? coordinadoresLoaded : []);
            } catch (error) {
                console.error('Error loading users data:', error);
            }
        };
        loadUsersData();
    }, []);

    /**
     * Función para cargar datos del proyecto desde la API
     * @param forceRefresh - Si es true, agrega un timestamp para evitar cache
     */
    const fetchProjectData = useCallback(async (forceRefresh: boolean = false) => {
        if (!proyectoId) return;

        setIsLoading(true);
        setError(null);

        try {
            // Log para debug
            console.log('=== fetchProjectData iniciado ===');
            console.log('proyectoId:', proyectoId, 'forceRefresh:', forceRefresh);

            // Cargar proyecto, sprints, equipo y subproyectos en paralelo
            const [proyectoData, sprintsData, equipoData, subproyectosData] = await Promise.all([
                getProyectoById(proyectoId),
                getSprintsByProyecto(proyectoId).catch(() => []),
                getProyectoEquipo(proyectoId).catch(() => []),
                getSubproyectosByProyecto(proyectoId).catch(() => []),
            ]);

            // Verificar que es un proyecto (no actividad)
            if (proyectoData.tipo !== 'Proyecto') {
                router.push(paths.poi.base);
                return;
            }

            // Mapear equipo
            const equipoMapped: TeamMember[] = Array.isArray(equipoData)
                ? equipoData.map((m: any) => ({
                    id: m.id || m.personalId,
                    nombre: m.nombre || m.personal?.nombre || `Usuario #${m.id}`,
                    cargo: m.cargo,
                    rol: m.rol,
                }))
                : [];

            setEquipo(equipoMapped);

            // Mapear sprints con progreso
            const sprintsMapped: SprintWithProgress[] = Array.isArray(sprintsData)
                ? sprintsData.map((s: Sprint) => ({
                    id: s.id,
                    name: s.nombre,
                    status: mapSprintStatus(s.estado),
                    progress: calculateSprintProgress(s),
                }))
                : [];

            setSprints(sprintsMapped);

            // Mapear subproyectos y cargar sus asignaciones
            let subproyectosMapped: SubProject[] = [];
            if (Array.isArray(subproyectosData) && subproyectosData.length > 0) {
                // Cargar asignaciones de todos los subproyectos en paralelo
                const asignacionesPromises = subproyectosData.map(sp =>
                    getAsignacionesBySubproyecto(sp.id).catch(() => [])
                );
                const asignacionesPorSubproyecto = await Promise.all(asignacionesPromises);

                // Mapear subproyectos con sus responsables desde asignaciones
                subproyectosMapped = subproyectosData.map((sp, index) => {
                    const asignaciones = asignacionesPorSubproyecto[index];
                    const responsablesIds = asignaciones.map(a => a.personalId.toString());
                    // Obtener nombres de responsables desde el equipo del proyecto
                    const responsablesNombres = asignaciones.map(a => {
                        if (a.personal) {
                            return `${a.personal.nombres} ${a.personal.apellidos}`.trim();
                        }
                        return `Personal #${a.personalId}`;
                    });
                    const mapped = mapSubproyectoToSubProject(sp);
                    return {
                        ...mapped,
                        responsible: responsablesIds,
                        responsibleNames: responsablesNombres, // Agregar nombres para mostrar
                    };
                });
            }

            console.log('=== Subproyectos cargados con asignaciones ===');
            console.log('subproyectosData:', subproyectosData);
            console.log('subproyectosMapped:', subproyectosMapped);

            // Mapear proyecto al formato del frontend
            const mappedProject = mapProyectoToProject(proyectoData, equipoMapped, subproyectosMapped);

            // DEBUG: Mostrar datos del API y mapeados en consola
            console.log('=== DETALLES - Datos del proyecto ===');
            console.log('Datos API (proyectoData):', JSON.stringify(proyectoData, null, 2));
            console.log('Datos mapeados (mappedProject):', JSON.stringify(mappedProject, null, 2));
            console.log('Campos clave del API:', {
                nombre: proyectoData.nombre,
                descripcion: proyectoData.descripcion,
                clasificacion: proyectoData.clasificacion,
                montoAnual: proyectoData.montoAnual,
                anios: proyectoData.anios,
            });

            setProject(mappedProject);
            console.log('setProject llamado con nuevos datos');

            // Guardar en localStorage para navegación entre pestañas
            localStorage.setItem('selectedProject', JSON.stringify(mappedProject));

            // Animar las barras de progreso
            setTimeout(() => setProgressAnimated(true), 100);

        } catch (err) {
            console.error('Error fetching project data:', err);
            setError('No se pudieron cargar los datos del proyecto');
            toast({
                title: 'Error',
                description: 'No se pudieron cargar los datos del proyecto. Intente nuevamente.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [proyectoId, router, toast]);

    // Cargar datos cuando cambie el ID del proyecto
    useEffect(() => {
        if (proyectoId) {
            fetchProjectData();
        }
    }, [proyectoId, fetchProjectData]);

    const formatMonthYear = (dateString: string) => {
        if (!dateString) return '';
        // Manejar formato YYYY-MM-DD o YYYY-MM
        const parts = dateString.split('-');
        const year = Number(parts[0]);
        const month = Number(parts[1]) - 1;
        const day = parts[2] ? Number(parts[2]) : 1;
        const date = new Date(year, month, day);
        return date.toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    const handleSaveProject = useCallback(async (updatedProject: Project) => {
        // DEBUG: Log para verificar que se llama después de guardar
        console.log('=== DETALLES - handleSaveProject llamado ===');
        console.log('updatedProject recibido:', JSON.stringify(updatedProject, null, 2));

        // Cerrar modal
        setIsEditModalOpen(false);

        // Mostrar estado de carga mientras recargamos
        setIsLoading(true);

        // Pequeña espera para asegurar que el backend procesó los cambios
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            // Recargar datos del proyecto desde la API con force refresh
            console.log('Recargando datos desde API...');

            // Cargar directamente sin limpiar el estado primero
            const [proyectoData, sprintsData, equipoData, subproyectosData] = await Promise.all([
                getProyectoById(proyectoId!),
                getSprintsByProyecto(proyectoId!).catch(() => []),
                getProyectoEquipo(proyectoId!).catch(() => []),
                getSubproyectosByProyecto(proyectoId!).catch(() => []),
            ]);

            console.log('=== Datos frescos del API ===');
            console.log('proyectoData:', JSON.stringify(proyectoData, null, 2));

            // Mapear equipo
            const equipoMapped: TeamMember[] = Array.isArray(equipoData)
                ? equipoData.map((m: any) => ({
                    id: m.id || m.personalId,
                    nombre: m.nombre || m.personal?.nombre || `Usuario #${m.id}`,
                    cargo: m.cargo,
                    rol: m.rol,
                }))
                : [];

            setEquipo(equipoMapped);

            // Mapear sprints con progreso
            const sprintsMapped: SprintWithProgress[] = Array.isArray(sprintsData)
                ? sprintsData.map((s: Sprint) => ({
                    id: s.id,
                    name: s.nombre,
                    status: mapSprintStatus(s.estado),
                    progress: calculateSprintProgress(s),
                }))
                : [];

            setSprints(sprintsMapped);

            // Mapear subproyectos y cargar sus asignaciones
            let subproyectosMapped: SubProject[] = [];
            if (Array.isArray(subproyectosData) && subproyectosData.length > 0) {
                // Cargar asignaciones de todos los subproyectos en paralelo
                const asignacionesPromises = subproyectosData.map(sp =>
                    getAsignacionesBySubproyecto(sp.id).catch(() => [])
                );
                const asignacionesPorSubproyecto = await Promise.all(asignacionesPromises);

                // Mapear subproyectos con sus responsables desde asignaciones
                subproyectosMapped = subproyectosData.map((sp, index) => {
                    const asignaciones = asignacionesPorSubproyecto[index];
                    const responsablesIds = asignaciones.map(a => a.personalId.toString());
                    const responsablesNombres = asignaciones.map(a => {
                        if (a.personal) {
                            return `${a.personal.nombres} ${a.personal.apellidos}`.trim();
                        }
                        return `Personal #${a.personalId}`;
                    });
                    const mapped = mapSubproyectoToSubProject(sp);
                    return {
                        ...mapped,
                        responsible: responsablesIds,
                        responsibleNames: responsablesNombres,
                    };
                });
            }

            // Mapear proyecto al formato del frontend
            const mappedProject = mapProyectoToProject(proyectoData, equipoMapped, subproyectosMapped);

            console.log('=== Proyecto mapeado ===');
            console.log('Subproyectos cargados:', subproyectosMapped.length);
            console.log('mappedProject:', JSON.stringify(mappedProject, null, 2));
            console.log('=== Fechas específicas ===');
            console.log('Backend fechaInicio:', proyectoData.fechaInicio);
            console.log('Backend fechaFin:', proyectoData.fechaFin);
            console.log('Mapeado startDate:', mappedProject.startDate);
            console.log('Mapeado endDate:', mappedProject.endDate);

            // Actualizar estado con los nuevos datos
            setProject(mappedProject);

            // Actualizar localStorage
            localStorage.setItem('selectedProject', JSON.stringify(mappedProject));

            // Animar las barras de progreso
            setProgressAnimated(false);
            setTimeout(() => setProgressAnimated(true), 100);

            console.log('Datos recargados correctamente');

            toast({
                title: 'Proyecto actualizado',
                description: 'El proyecto se ha actualizado correctamente.',
            });
        } catch (error) {
            console.error('Error recargando datos:', error);
            toast({
                title: 'Error',
                description: 'Error al recargar los datos del proyecto.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [proyectoId, toast]);

    const handleDeleteProject = async () => {
        if (!proyectoId) return;

        setIsDeleting(true);
        try {
            await deleteProyecto(proyectoId);
            localStorage.removeItem('selectedProject');
            toast({
                title: 'Proyecto eliminado',
                description: 'El proyecto se ha eliminado correctamente.',
            });
            setIsDeleteModalOpen(false);
            router.push(paths.poi.base);
        } catch (err) {
            console.error('Error deleting project:', err);
            toast({
                title: 'Error',
                description: 'No se pudo eliminar el proyecto. Intente nuevamente.',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const openSubProjectModal = async (sub?: SubProject) => {
        if (sub) {
            // Si es un subproyecto existente (ID numérico), cargar asignaciones
            const isExistingSubproject = sub.id && !sub.id.startsWith('sp-');
            let responsiblesFromAsignaciones: string[] = sub.responsible || [];

            if (isExistingSubproject) {
                try {
                    const asignaciones = await getAsignacionesBySubproyecto(sub.id);
                    responsiblesFromAsignaciones = asignaciones.map(a => a.personalId.toString());
                    console.log('Asignaciones de subproyecto cargadas:', asignaciones);
                } catch (error) {
                    console.warn('Error al cargar asignaciones del subproyecto:', error);
                }
            }

            setEditingSubProject({ ...sub, responsible: responsiblesFromAsignaciones });
        } else {
            setEditingSubProject(null);
        }
        setIsSubProjectModalOpen(true);
    };

    const handleSaveSubProject = async (subProject: SubProject) => {
        if (!project || !proyectoId) return;

        try {
            const isEditing = editingSubProject && editingSubProject.id && !editingSubProject.id.startsWith('sp-');

            // Buscar el ID del scrum master por nombre
            const scrumMaster = scrumMasters.find(sm => {
                const nombre = sm.personal
                    ? [sm.personal.nombre, sm.personal.apellidoPaterno, sm.personal.apellidoMaterno].filter(Boolean).join(' ')
                    : `${sm.nombre || ''} ${sm.apellido || ''}`.trim();
                return nombre === subProject.scrumMaster;
            });

            // Buscar el ID del coordinador por nombre
            const coordinador = coordinadoresData.find(c => {
                const nombre = c.personal
                    ? [c.personal.nombre, c.personal.apellidoPaterno, c.personal.apellidoMaterno].filter(Boolean).join(' ')
                    : `${c.nombre || ''} ${c.apellido || ''}`.trim();
                return nombre === subProject.coordinador;
            });

            // Convertir años de string a number
            const aniosNumeros = subProject.years?.map(y => parseInt(y, 10)).filter(n => !isNaN(n)) || [];
            // Convertir responsables de string a number para asignaciones
            const responsablesIds = subProject.responsible?.map(r => parseInt(r, 10)).filter(n => !isNaN(n)) || [];

            if (isEditing) {
                // Actualizar subproyecto existente
                const subproyectoId = parseInt(editingSubProject.id, 10);
                await updateSubproyecto(editingSubProject.id, {
                    nombre: subProject.name,
                    descripcion: subProject.description,
                    monto: subProject.amount,
                    anios: aniosNumeros,
                    areasFinancieras: subProject.financialArea || [],
                    scrumMasterId: scrumMaster?.id,
                    coordinadorId: coordinador?.id,
                    coordinacion: subProject.coordinacion || undefined,
                    fechaInicio: subProject.fechaInicio || undefined,
                    fechaFin: subProject.fechaFin || undefined,
                });

                // Sincronizar asignaciones para subproyecto existente
                try {
                    await syncAsignacionesSubproyecto(subproyectoId, responsablesIds);
                    console.log('Asignaciones de subproyecto actualizadas:', subproyectoId);
                } catch (error) {
                    console.warn('Error al sincronizar asignaciones del subproyecto:', error);
                }
            } else {
                // Crear nuevo subproyecto
                const projectCode = project.code || `PROY-${proyectoId}`;
                const existingCount = project.subProjects?.length || 0;

                const newSubproyecto = await createSubproyecto({
                    proyectoPadreId: parseInt(proyectoId, 10),
                    codigo: `${projectCode}-SP${String(existingCount + 1).padStart(2, '0')}`,
                    nombre: subProject.name,
                    descripcion: subProject.description,
                    monto: subProject.amount,
                    anios: aniosNumeros,
                    areasFinancieras: subProject.financialArea || [],
                    scrumMasterId: scrumMaster?.id,
                    coordinadorId: coordinador?.id,
                    coordinacion: subProject.coordinacion || undefined,
                    fechaInicio: subProject.fechaInicio || undefined,
                    fechaFin: subProject.fechaFin || undefined,
                });

                // Sincronizar asignaciones para el nuevo subproyecto
                if (newSubproyecto?.id && responsablesIds.length > 0) {
                    try {
                        await syncAsignacionesSubproyecto(newSubproyecto.id, responsablesIds);
                        console.log('Asignaciones de subproyecto sincronizadas:', newSubproyecto.id);
                    } catch (error) {
                        console.warn('Error al sincronizar asignaciones del subproyecto:', error);
                    }
                }
            }

            // Recargar subproyectos desde el backend con sus asignaciones
            const subproyectosData = await getSubproyectosByProyecto(proyectoId);
            let subproyectosMapped: SubProject[] = [];
            if (Array.isArray(subproyectosData) && subproyectosData.length > 0) {
                // Cargar asignaciones de todos los subproyectos en paralelo
                const asignacionesPromises = subproyectosData.map(sp =>
                    getAsignacionesBySubproyecto(sp.id).catch(() => [])
                );
                const asignacionesPorSubproyecto = await Promise.all(asignacionesPromises);

                // Mapear subproyectos con sus responsables desde asignaciones
                subproyectosMapped = subproyectosData.map((sp, index) => {
                    const asignaciones = asignacionesPorSubproyecto[index];
                    const responsablesIds = asignaciones.map(a => a.personalId.toString());
                    const responsablesNombres = asignaciones.map(a => {
                        if (a.personal) {
                            return `${a.personal.nombres} ${a.personal.apellidos}`.trim();
                        }
                        return `Personal #${a.personalId}`;
                    });
                    const mapped = mapSubproyectoToSubProject(sp);
                    return {
                        ...mapped,
                        responsible: responsablesIds,
                        responsibleNames: responsablesNombres,
                    };
                });
            }

            // Actualizar estado local
            const updatedProject = { ...project, subProjects: subproyectosMapped };
            setProject(updatedProject);
            localStorage.setItem('selectedProject', JSON.stringify(updatedProject));

            toast({
                title: isEditing ? 'Subproyecto actualizado' : 'Subproyecto creado',
                description: `El subproyecto "${subProject.name}" se ha ${isEditing ? 'actualizado' : 'creado'} correctamente.`,
            });
        } catch (error) {
            console.error('Error saving subproject:', error);
            toast({
                title: 'Error',
                description: 'No se pudo guardar el subproyecto. Intente nuevamente.',
                variant: 'destructive',
            });
        } finally {
            setIsSubProjectModalOpen(false);
            setEditingSubProject(null);
        }
    };

    const openDeleteSubProjectModal = (sub: SubProject) => {
        setDeletingSubProject(sub);
        setIsSubProjectDeleteModalOpen(true);
    };

    const handleDeleteSubProject = async () => {
        if (!deletingSubProject || !project) {
            setIsSubProjectDeleteModalOpen(false);
            setDeletingSubProject(null);
            return;
        }

        try {
            // Eliminar del backend
            await deleteSubproyecto(deletingSubProject.id);

            // Actualizar estado local
            const updatedProject = {
                ...project,
                subProjects: project.subProjects?.filter(s => s.id !== deletingSubProject.id) || []
            };
            setProject(updatedProject);
            localStorage.setItem('selectedProject', JSON.stringify(updatedProject));

            toast({
                title: 'Subproyecto eliminado',
                description: 'El subproyecto se ha eliminado correctamente.',
            });
        } catch (error) {
            console.error('Error eliminando subproyecto:', error);
            toast({
                title: 'Error',
                description: 'No se pudo eliminar el subproyecto. Intente nuevamente.',
                variant: 'destructive',
            });
        } finally {
            setIsSubProjectDeleteModalOpen(false);
            setDeletingSubProject(null);
        }
    };

    const handleTabClick = (tabName: string) => {
        // Cambiar tab sin navegar a otra página
        setActiveTab(tabName);
        // Actualizar URL sin recargar
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('tab', tabName);
        window.history.pushState({}, '', newUrl.href);
    };

    // Obtener el año actual para resaltarlo
    const currentYear = new Date().getFullYear().toString();

    // Estado de carga inicial
    if (isLoading) {
        return (
            <AppLayout breadcrumbs={[{ label: "POI", href: paths.poi.base }, { label: 'Cargando...' }]}>
                <div className="flex flex-col items-center justify-center h-[60vh]">
                    <Loader2 className="h-12 w-12 animate-spin text-[#018CD1] mb-4" />
                    <p className="text-gray-500">Cargando datos del proyecto...</p>
                </div>
            </AppLayout>
        );
    }

    // Estado de error
    if (error && !project) {
        return (
            <AppLayout breadcrumbs={[{ label: "POI", href: paths.poi.base }, { label: 'Error' }]}>
                <div className="flex flex-col items-center justify-center h-[60vh] text-red-500">
                    <AlertTriangle className="h-12 w-12 mb-4" />
                    <p className="text-lg font-medium">Error al cargar el proyecto</p>
                    <p className="text-sm mb-4">{error}</p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => router.push(paths.poi.base)}
                        >
                            Volver al listado
                        </Button>
                        <Button
                            onClick={() => fetchProjectData()}
                            className="bg-[#018CD1] text-white"
                        >
                            Reintentar
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (!project) {
        return (
            <div className="flex h-screen w-full items-center justify-center">Cargando...</div>
        );
    }

    const isProject = project.type === 'Proyecto';
    const projectCode = project.code || `${isProject ? 'PROY' : 'ACT'} N°${project.id}`;

    // Breadcrumb dinámico según el tab activo
    const breadcrumbs = [
        { label: "POI", href: paths.poi.base },
        { label: activeTab }
    ];

    // Pestañas según el rol del usuario - Actas disponible para todos
    const getProjectTabs = () => {
        // Todos los roles ven: Detalles, Documentos, Actas, Requerimientos, Cronograma, Backlog
        return [
            { name: 'Detalles' },
            { name: 'Documentos' },
            { name: 'Actas' },
            { name: 'Requerimientos' },
            { name: 'Cronograma' },
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
                                            <InfoField label="Product Owner">
                                                {project.areaUsuariaId ? (
                                                    <AreaUsuariaDisplay userIds={[project.areaUsuariaId]} />
                                                ) : (
                                                    <p className="text-gray-400">-</p>
                                                )}
                                            </InfoField>
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
                                        {sprints.length === 0 ? (
                                            <div className="text-center py-4 text-gray-500">
                                                <p className="text-sm">No hay sprints registrados</p>
                                                <p className="text-xs mt-1">Cree sprints desde el Backlog</p>
                                            </div>
                                        ) : (
                                            sprints.map((sprint, i) => (
                                                <ProgressBarWithTooltip
                                                    key={sprint.id || i}
                                                    value={progressAnimated ? sprint.progress : 0}
                                                    label={sprint.name}
                                                    statusBadge={
                                                        <Badge className={sprintStatusConfig[sprint.status]?.badge || 'bg-gray-400'}>
                                                            {sprint.status}
                                                        </Badge>
                                                    }
                                                    indicatorClassName={`${sprintStatusConfig[sprint.status]?.progress || 'bg-gray-400'} transition-all duration-1000 ease-out`}
                                                />
                                            ))
                                        )}
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

                    {/* Tab Documentos */}
                    {activeTab === 'Documentos' && proyectoId && (
                        <DocumentosTabContent proyectoId={parseInt(proyectoId)} />
                    )}

                    {/* Tab Requerimientos */}
                    {activeTab === 'Requerimientos' && proyectoId && (
                        <RequerimientosTabContent proyectoId={parseInt(proyectoId)} />
                    )}

                    {/* Tab Backlog */}
                    {activeTab === 'Backlog' && proyectoId && (
                        <BacklogTabContent
                            proyectoId={parseInt(proyectoId)}
                            proyectoFechaInicio={project?.startDate}
                            proyectoFechaFin={project?.endDate}
                            proyectoEstado={project?.status}
                            onProjectStateChange={() => fetchProjectData(true)}
                        />
                    )}

                    {/* Tab Actas */}
                    {activeTab === 'Actas' && proyectoId && (
                        <ActasTabContent proyectoId={parseInt(proyectoId)} />
                    )}

                    {/* Tab Cronograma */}
                    {activeTab === 'Cronograma' && proyectoId && (
                        <CronogramaTabContent
                            proyectoId={parseInt(proyectoId)}
                            proyectoNombre={project?.name}
                            equipo={equipo}
                            proyectoFechaInicio={project?.startDate}
                            proyectoFechaFin={project?.endDate}
                            isReadOnly={project?.status === 'Finalizado'}
                        />
                    )}
                </div>

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
                message="El Plan Operativo Informático será eliminado"
            />

            {isSubProjectModalOpen && project && (
                 <SubProjectModal
                    isOpen={isSubProjectModalOpen}
                    onClose={() => setIsSubProjectModalOpen(false)}
                    onSave={handleSaveSubProject}
                    subProject={editingSubProject}
                    scrumMasters={scrumMasters}
                    coordinadores={coordinadoresData}
                    responsibleOptions={personalDisponible.map(p => ({
                        label: formatPersonalNombre(p),
                        value: p.id.toString(),
                    }))}
                    yearOptions={project.years?.map(y => ({ label: y, value: y })) || []}
                    projectAmount={project.annualAmount || 0}
                    existingSubProjects={project.subProjects || []}
                    projectFechaInicio={project.startDate || undefined}
                    projectFechaFin={project.endDate || undefined}
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
