"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Folder,
  Trash2,
  Pencil,
  DollarSign,
  Users as UsersIcon,
  Loader2,
  AlertTriangle,
  FolderOpen,
  FileText,
  Calendar,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MODULES, ROLES } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { paths } from '@/lib/paths';
import { ProtectedRoute } from "@/features/auth";
import { useAuth } from '@/stores';
import { hasPermission } from "@/lib/permissions";
import { PERMISSIONS } from '@/lib/definitions';
import {
  getSubproyecto,
  deleteSubproyecto,
  updateSubproyecto,
  type Subproyecto,
} from '@/features/subproyectos/services/subproyectos.service';
import {
  getSprintsBySubproyecto,
  type Sprint,
} from '@/features/proyectos/services/sprints.service';
import { useToast } from '@/lib/hooks/use-toast';
import { BacklogTabContent } from '@/features/proyectos/components/backlog-tab';
import { ActasTabContent } from '@/features/actas';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { X } from 'lucide-react';
import { SubProjectModal } from '@/features/proyectos/components';
import { type SubProject } from '@/lib/definitions';
import {
  getScrumMasters,
  getCoordinadores,
  getPatrocinadores,
  syncAsignacionesSubproyecto,
  getPersonalDesarrolladores,
  formatPersonalNombre,
  getAsignacionesBySubproyecto,
  type Usuario,
  type Personal,
  type Asignacion,
} from '@/lib/services';
import {
  DocumentoPhaseAccordion,
  useDocumentos,
} from '@/features/documentos';
import { getDocumentosBySubproyecto, aprobarDocumento } from '@/features/documentos/services/documentos.service';
import type { AprobarDocumentoInput, Documento } from '@/features/documentos/types';
import { RequerimientoList } from '@/features/requerimientos';
import { CronogramaView } from '@/features/cronograma';

// ============================================
// TIPOS Y HELPERS
// ============================================

interface SprintWithProgress {
  id: number;
  name: string;
  status: string;
  progress: number;
}

function mapSprintStatus(estado: string): string {
  const statusMap: Record<string, string> = {
    'Por hacer': 'Por hacer',
    'En progreso': 'En progreso',
    'Finalizado': 'Finalizado',
    'Planificado': 'Por hacer',
    'Activo': 'En progreso',
    'Completado': 'Finalizado',
  };
  return statusMap[estado] || 'Por hacer';
}

function calculateSprintProgress(sprint: Sprint): number {
  const estado = sprint.estado;
  if (estado === 'Finalizado' || estado === 'Completado') return 100;
  if (estado === 'En progreso') return 50;
  return 0;
}

function getUsuarioNombre(usuario: any): string {
  if (!usuario) return 'Sin asignar';
  if (usuario.personal) {
    const { nombre, apellidoPaterno, apellidoMaterno } = usuario.personal;
    const partes = [nombre, apellidoPaterno, apellidoMaterno].filter(Boolean);
    if (partes.length > 0) return partes.join(' ');
  }
  if (usuario.nombre && usuario.apellido) {
    return `${usuario.nombre} ${usuario.apellido}`;
  }
  if (usuario.nombre) return usuario.nombre;
  if (usuario.username) return usuario.username;
  if (usuario.email) return usuario.email.split('@')[0];
  return `Usuario #${usuario.id}`;
}

const statusColors: { [key: string]: string } = {
  'Pendiente': 'bg-[#FE9F43] text-black',
  'En planificacion': 'bg-[#FFD700] text-black',
  'En desarrollo': 'bg-[#559FFE] text-white',
  'Finalizado': 'bg-[#2FD573] text-white',
};

const sprintStatusConfig: { [key: string]: { badge: string; progress: string; label: string } } = {
  'Por hacer': { badge: 'bg-[#ADADAD] text-white', progress: 'bg-[#ADADAD]', label: 'Por hacer' },
  'En progreso': { badge: 'bg-[#559FFE] text-white', progress: 'bg-[#559FFE]', label: 'En progreso' },
  'Finalizado': { badge: 'bg-[#2FD573] text-white', progress: 'bg-[#2FD573]', label: 'Finalizado' },
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
          <p className="font-bold text-lg">Estas seguro?</p>
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

// ============================================
// COMPONENTE DE DOCUMENTOS
// ============================================

/**
 * Contenido del Tab Documentos para Subproyectos
 */
function DocumentosTabContent({ subproyectoId }: { subproyectoId: number }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documentos, setDocumentos] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchDocumentos = React.useCallback(async () => {
    if (!subproyectoId) return;

    setIsLoading(true);
    try {
      const data = await getDocumentosBySubproyecto(subproyectoId);
      setDocumentos(data);
    } catch (error) {
      console.error('Error fetching documentos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los documentos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [subproyectoId, toast]);

  React.useEffect(() => {
    fetchDocumentos();
  }, [fetchDocumentos]);

  // Función para aprobar/rechazar documentos del subproyecto
  const aprobarExistingDocumento = async (id: number | string, data: AprobarDocumentoInput): Promise<Documento | null> => {
    try {
      const updatedDoc = await aprobarDocumento(id, data);
      setDocumentos(prev => prev.map((d: any) => d.id === updatedDoc.id ? updatedDoc : d));
      toast({
        title: data.estado === 'Aprobado' ? 'Documento aprobado' : 'Documento rechazado',
        description: data.estado === 'Aprobado'
          ? 'El documento ha sido aprobado correctamente.'
          : 'El documento ha sido rechazado.',
      });
      return updatedDoc;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al procesar la aprobación';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <FolderOpen className="h-6 w-6 text-gray-700" />
          Documentos del Subproyecto
        </h3>
      </div>

      <DocumentoPhaseAccordion
        proyectoId={subproyectoId}
        subproyectoId={subproyectoId}
        tipoContenedor="SUBPROYECTO"
        documentos={documentos}
        isLoading={isLoading}
        onRefresh={fetchDocumentos}
        onApprove={aprobarExistingDocumento}
      />
    </div>
  );
}

// ============================================
// COMPONENTE DE REQUERIMIENTOS
// ============================================

/**
 * Contenido del Tab Requerimientos para Subproyectos
 */
function RequerimientosTabContent({ subproyectoId }: { subproyectoId: number }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-gray-700" />
          Requerimientos del Subproyecto
        </h3>
      </div>

      <RequerimientoList
        proyectoId={subproyectoId}
        subproyectoId={subproyectoId}
        tipoContenedor="SUBPROYECTO"
      />
    </div>
  );
}

// ============================================
// COMPONENTE DE CRONOGRAMA
// ============================================

/**
 * Contenido del Tab Cronograma para Subproyectos
 */
function CronogramaTabContent({
  subproyectoId,
  nombre,
  asignaciones,
  fechaInicio,
  fechaFin
}: {
  subproyectoId: number;
  nombre: string;
  asignaciones: Asignacion[];
  fechaInicio: string | null;
  fechaFin: string | null;
}) {
  // Construir lista de responsables con formato esperado por CronogramaView
  const responsables = React.useMemo(() => {
    return asignaciones
      .filter(a => a.activo && a.personalId && a.personal)
      .map(a => ({
        id: a.personalId!,
        nombre: `${a.personal!.nombres} ${a.personal!.apellidos}`.trim()
      }));
  }, [asignaciones]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-gray-700" />
          Cronograma del Subproyecto
        </h3>
      </div>

      <CronogramaView
        proyectoId={subproyectoId}
        tipoContenedor="SUBPROYECTO"
        proyectoNombre={nombre}
        responsables={responsables}
        proyectoFechaInicio={fechaInicio}
        proyectoFechaFin={fechaFin}
      />
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function SubprojectDetailsContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Estado del subproyecto
  const [subproyecto, setSubproyecto] = useState<Subproyecto | null>(null);
  const [subproyectoId, setSubproyectoId] = useState<number | null>(null);

  // Estados de carga
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Datos adicionales
  const [sprints, setSprints] = useState<SprintWithProgress[]>([]);

  const [activeTab, setActiveTab] = useState('Detalles');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [scrumMasters, setScrumMasters] = useState<Usuario[]>([]);
  const [coordinadoresData, setCoordinadoresData] = useState<Usuario[]>([]);
  const [patrocinadores, setPatrocinadores] = useState<Usuario[]>([]);
  const [desarrolladores, setDesarrolladores] = useState<Personal[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);

  const [progressAnimated, setProgressAnimated] = useState(false);

  // Permisos basados en el rol del usuario
  const userRole = user?.role;
  const isAdmin = userRole === ROLES.ADMIN;
  const isScrumMaster = userRole === ROLES.SCRUM_MASTER;
  const showEditDeleteButtons = userRole ? hasPermission(userRole, MODULES.POI, PERMISSIONS.EDIT) || isScrumMaster : false;
  const canEdit = isAdmin || (userRole ? hasPermission(userRole, MODULES.POI, PERMISSIONS.EDIT) && !isScrumMaster : false);
  const canDelete = isAdmin || (userRole ? hasPermission(userRole, MODULES.POI, PERMISSIONS.DELETE) && !isScrumMaster : false);

  // Obtener el ID del subproyecto de los query params
  useEffect(() => {
    const idFromParams = searchParams.get('id');
    const tabParam = searchParams.get('tab');

    if (tabParam) {
      setActiveTab(tabParam);
    }

    if (idFromParams) {
      setSubproyectoId(parseInt(idFromParams, 10));
    } else {
      router.push(paths.poi.base);
    }
  }, [searchParams, router]);

  /**
   * Cargar datos del subproyecto desde la API
   */
  const fetchSubprojectData = useCallback(async () => {
    if (!subproyectoId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Cargar subproyecto, sprints y asignaciones en paralelo
      const [subproyectoData, sprintsData, asignacionesData] = await Promise.all([
        getSubproyecto(subproyectoId),
        getSprintsBySubproyecto(subproyectoId).catch(() => []),
        getAsignacionesBySubproyecto(subproyectoId).catch(() => []),
      ]);

      setSubproyecto(subproyectoData);
      setAsignaciones(asignacionesData);

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

      // Animar barras de progreso
      setTimeout(() => setProgressAnimated(true), 100);
    } catch (err) {
      console.error('Error fetching subproject data:', err);
      setError('No se pudieron cargar los datos del subproyecto');
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos del subproyecto. Intente nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [subproyectoId, toast]);

  // Cargar datos cuando cambie el ID
  useEffect(() => {
    if (subproyectoId) {
      fetchSubprojectData();
    }
  }, [subproyectoId, fetchSubprojectData]);

  // Cargar scrum masters, coordinadores, patrocinadores y desarrolladores
  useEffect(() => {
    const loadUsersData = async () => {
      try {
        const [smData, coordData, patData, devData] = await Promise.all([
          getScrumMasters(),
          getCoordinadores(),
          getPatrocinadores(),
          getPersonalDesarrolladores(),
        ]);
        setScrumMasters(Array.isArray(smData) ? smData : []);
        setCoordinadoresData(Array.isArray(coordData) ? coordData : []);
        setPatrocinadores(Array.isArray(patData) ? patData : []);
        setDesarrolladores(Array.isArray(devData) ? devData : []);
      } catch (err) {
        console.error('Error loading users data:', err);
      }
    };
    loadUsersData();
  }, []);

  const formatMonthYear = (dateString: string | Date | undefined) => {
    if (!dateString) return '-';
    const dateStr = typeof dateString === 'string' ? dateString : dateString.toISOString();
    const parts = dateStr.split('-');
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = parts[2] ? Number(parts[2].substring(0, 2)) : 1;
    const date = new Date(year, month, day);
    return date.toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleDeleteSubproject = async () => {
    if (!subproyectoId) return;

    try {
      await deleteSubproyecto(subproyectoId);
      toast({
        title: 'Subproyecto eliminado',
        description: 'El subproyecto se ha eliminado correctamente.',
      });
      setIsDeleteModalOpen(false);
      // Navegar al proyecto padre
      if (subproyecto?.proyectoPadreId) {
        router.push(`/poi/proyecto/detalles?id=${subproyecto.proyectoPadreId}`);
      } else {
        router.push(paths.poi.base);
      }
    } catch (err) {
      console.error('Error deleting subproject:', err);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el subproyecto. Intente nuevamente.',
        variant: 'destructive',
      });
    }
  };

  // Mapear Subproyecto del backend al tipo SubProject para el modal
  const mapToSubProject = (sp: Subproyecto): SubProject => {
    const scrumMasterNombreModal = sp.scrumMaster
      ? `${sp.scrumMaster.nombre || ''} ${sp.scrumMaster.apellido || ''}`.trim()
      : '';
    const coordinadorNombreModal = sp.coordinador
      ? `${sp.coordinador.nombre || ''} ${sp.coordinador.apellido || ''}`.trim()
      : '';
    // Format dates to YYYY-MM-DD
    const toDateStr = (d: string | Date | undefined) => {
      if (!d) return '';
      const str = typeof d === 'string' ? d : d.toISOString();
      return str.substring(0, 10);
    };
    // Obtener IDs de responsables desde asignaciones activas
    const responsablesIds = asignaciones
      .filter(a => a.activo && a.personalId)
      .map(a => a.personalId.toString());

    return {
      id: sp.id.toString(),
      name: sp.nombre,
      description: sp.descripcion || '',
      responsible: responsablesIds,
      scrumMaster: scrumMasterNombreModal,
      areaUsuaria: (sp as any).areaUsuaria?.id?.toString() || (sp as any).areaUsuariaId?.toString() || undefined,
      years: sp.anios?.map(String) || [],
      amount: sp.monto || 0,
      managementMethod: 'Scrum',
      financialArea: sp.areasFinancieras || [],
      status: sp.estado,
      coordinador: coordinadorNombreModal,
      coordinacion: sp.coordinacion || '',
      fechaInicio: toDateStr(sp.fechaInicio),
      fechaFin: toDateStr(sp.fechaFin),
    };
  };

  const handleSaveEdit = async (subProject: SubProject) => {
    if (!subproyectoId) return;
    try {
      // Buscar el ID del scrum master por nombre
      const scrumMasterFound = scrumMasters.find(sm => {
        const nombre = sm.personal
          ? [sm.personal.nombre, sm.personal.apellidoPaterno, sm.personal.apellidoMaterno].filter(Boolean).join(' ')
          : `${sm.nombre || ''} ${sm.apellido || ''}`.trim();
        return nombre === subProject.scrumMaster;
      });

      // Buscar el ID del coordinador por nombre
      const coordinadorFound = coordinadoresData.find(c => {
        const nombre = c.personal
          ? [c.personal.nombre, c.personal.apellidoPaterno, c.personal.apellidoMaterno].filter(Boolean).join(' ')
          : `${c.nombre || ''} ${c.apellido || ''}`.trim();
        return nombre === subProject.coordinador;
      });

      const aniosNumeros = subProject.years?.map(y => parseInt(y, 10)).filter(n => !isNaN(n)) || [];
      const responsablesIds = subProject.responsible?.map(r => parseInt(r, 10)).filter(n => !isNaN(n)) || [];

      // Convert areaUsuaria to number
      const areaUsuariaId = subProject.areaUsuaria ? parseInt(subProject.areaUsuaria, 10) : undefined;

      await updateSubproyecto(subproyectoId, {
        nombre: subProject.name,
        descripcion: subProject.description,
        monto: subProject.amount,
        anios: aniosNumeros,
        areasFinancieras: subProject.financialArea || [],
        scrumMasterId: scrumMasterFound?.id,
        coordinadorId: coordinadorFound?.id,
        areaUsuariaId: areaUsuariaId,
        coordinacion: subProject.coordinacion || undefined,
        fechaInicio: subProject.fechaInicio || undefined,
        fechaFin: subProject.fechaFin || undefined,
      });

      // Sincronizar asignaciones
      if (responsablesIds.length > 0) {
        try {
          await syncAsignacionesSubproyecto(subproyectoId, responsablesIds);
        } catch (err) {
          console.warn('Error al sincronizar asignaciones:', err);
        }
      }

      setIsEditModalOpen(false);
      toast({
        title: 'Subproyecto actualizado',
        description: `El subproyecto se ha actualizado correctamente.`,
      });
      // Recargar datos
      await fetchSubprojectData();
    } catch (error) {
      console.error('Error saving subproject:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el subproyecto. Intente nuevamente.',
        variant: 'destructive',
      });
    }
  };

  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tab', tabName);
    window.history.pushState({}, '', newUrl.href);
  };

  // Convert desarrolladores to MultiSelectOption format
  const responsibleOptions = desarrolladores.map(dev => ({
    label: formatPersonalNombre(dev),
    value: dev.id.toString(),
  }));

  // Format patrocinadores for select
  const patrocinadorOptions = patrocinadores.map(pat => ({
    id: pat.id.toString(),
    label: getUsuarioNombre(pat),
  }));

  // Estado de carga inicial
  if (isLoading) {
    return (
      <AppLayout breadcrumbs={[{ label: "POI", href: paths.poi.base }, { label: 'Cargando...' }]}>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-[#018CD1] mb-4" />
          <p className="text-gray-500">Cargando datos del subproyecto...</p>
        </div>
      </AppLayout>
    );
  }

  // Estado de error
  if (error && !subproyecto) {
    return (
      <AppLayout breadcrumbs={[{ label: "POI", href: paths.poi.base }, { label: 'Error' }]}>
        <div className="flex flex-col items-center justify-center h-[60vh] text-red-500">
          <AlertTriangle className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">Error al cargar el subproyecto</p>
          <p className="text-sm mb-4">{error}</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(paths.poi.base)}
            >
              Volver al listado
            </Button>
            <Button
              onClick={() => fetchSubprojectData()}
              className="bg-[#018CD1] text-white"
            >
              Reintentar
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!subproyecto) {
    return (
      <div className="flex h-screen w-full items-center justify-center">Cargando...</div>
    );
  }

  // Datos del subproyecto
  const subproyectoCode = subproyecto.codigo || `SP-${subproyecto.id}`;
  const scrumMasterNombre = subproyecto.scrumMaster
    ? getUsuarioNombre(subproyecto.scrumMaster)
    : 'Sin asignar';
  const coordinadorNombre = subproyecto.coordinador
    ? getUsuarioNombre(subproyecto.coordinador)
    : 'Sin asignar';
  const areaUsuariaNombre = subproyecto.areaUsuaria
    ? getUsuarioNombre(subproyecto.areaUsuaria)
    : 'Sin asignar';

  // Obtener nombres de responsables desde asignaciones
  const responsablesNombres = asignaciones
    .filter(a => a.activo && a.personal)
    .map(a => `${a.personal!.nombres} ${a.personal!.apellidos}`.trim());

  // Estado mapeado
  const estado = subproyecto.estado || 'Pendiente';

  // Tabs del subproyecto (mismo orden que proyecto)
  const projectTabs = [
    { name: 'Detalles' },
    { name: 'Documentos' },
    { name: 'Actas' },
    { name: 'Requerimientos' },
    { name: 'Cronograma' },
    { name: 'Backlog' },
  ];

  // Breadcrumbs
  const breadcrumbs = [
    { label: "POI", href: paths.poi.base },
    { label: activeTab }
  ];

  const secondaryHeader = (
    <>
      <div className="bg-[#D5D5D5] border-b border-t border-[#1A5581]">
        <div className="p-2 flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            {subproyecto.proyectoPadreId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/poi/proyecto/detalles?id=${subproyecto.proyectoPadreId}`)}
                className="text-[#018CD1] hover:text-[#0177b3] hover:bg-blue-50"
                title="Volver al proyecto principal"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Proyecto Principal
              </Button>
            )}
            <h2 className="font-bold text-black">
              {`${subproyectoCode}: ${subproyecto.nombre}`}
            </h2>
          </div>
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

  // Formatear fechas del subproyecto
  const fechaInicio = subproyecto.fechaInicio
    ? (typeof subproyecto.fechaInicio === 'string' ? subproyecto.fechaInicio.substring(0, 10) : new Date(subproyecto.fechaInicio).toISOString().substring(0, 10))
    : null;
  const fechaFin = subproyecto.fechaFin
    ? (typeof subproyecto.fechaFin === 'string' ? subproyecto.fechaFin.substring(0, 10) : new Date(subproyecto.fechaFin).toISOString().substring(0, 10))
    : null;

  // Fechas del proyecto padre (para validar rango en el modal de edición)
  const toDateStr = (d: string | Date | undefined | null): string | undefined => {
    if (!d) return undefined;
    const str = typeof d === 'string' ? d : (d as Date).toISOString();
    return str.substring(0, 10);
  };
  const proyectoPadreFechaInicio = toDateStr((subproyecto.proyectoPadre as any)?.fechaInicio);
  const proyectoPadreFechaFin = toDateStr((subproyecto.proyectoPadre as any)?.fechaFin);
  const proyectoPadreAnios: number[] | null = (subproyecto.proyectoPadre as any)?.anios ?? null;
  const yearOptionsForModal = (proyectoPadreAnios && proyectoPadreAnios.length > 0)
    ? proyectoPadreAnios.map(y => ({ label: String(y), value: String(y) }))
    : (subproyecto.anios && subproyecto.anios.length > 0)
      ? subproyecto.anios.map(y => ({ label: String(y), value: String(y) }))
      : [{ label: String(new Date().getFullYear()), value: String(new Date().getFullYear()) }];

  return (
    <AppLayout
      breadcrumbs={breadcrumbs}
      secondaryHeader={secondaryHeader}
    >
      <div className="flex-1 flex flex-col bg-[#F9F9F9]">
        <div className="p-6">
          {/* Tab Detalles */}
          {activeTab === 'Detalles' && (
            <>
              {/* Header con titulo y botones de accion */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Folder className="w-6 h-6 text-gray-700" />
                  <h3 className="text-xl font-bold">{`${subproyectoCode}: ${subproyecto.nombre}`}</h3>
                </div>
                {showEditDeleteButtons && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "border-[#018CD1] text-[#018CD1] hover:bg-[#018CD1] hover:text-white",
                        !canEdit && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => canEdit && setIsEditModalOpen(true)}
                      disabled={!canEdit}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
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
                )}
              </div>

              {/* Layout con campos a la izquierda y progreso a la derecha */}
              <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-stretch">
                {/* Columna Izquierda (70%) - Informacion Principal */}
                <Card className="lg:col-span-7 h-full">
                  <CardContent className="p-6 h-full">
                    {/* Estado y Scrum Master */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-500 mb-1">Estado</p>
                        <Badge className={statusColors[estado] || 'bg-gray-400'}>{estado}</Badge>
                      </div>
                      <InfoField label="Scrum Master"><p>{scrumMasterNombre}</p></InfoField>
                    </div>

                    {/* Descripcion */}
                    <div className="mb-4">
                      <InfoField label="Descripcion"><p>{subproyecto.descripcion || 'Sin descripcion'}</p></InfoField>
                    </div>

                    {/* Informacion adicional en dos columnas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <div className="space-y-4">
                        {/* Proyecto Padre */}
                        <div>
                          <p className="text-sm font-semibold text-gray-500 mb-1">Proyecto Padre</p>
                          <div className="text-sm p-2 bg-gray-50 rounded-md border min-h-[38px] flex items-center gap-2">
                            <Link
                              href={`/poi/proyecto/detalles?id=${subproyecto.proyectoPadreId}`}
                              className="text-[#018CD1] hover:underline flex items-center gap-1"
                            >
                              {subproyecto.proyectoPadre?.codigo || `Proyecto #${subproyecto.proyectoPadreId}`}
                              {subproyecto.proyectoPadre?.nombre && ` - ${subproyecto.proyectoPadre.nombre}`}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                        <InfoField label="Clasificacion"><p>{subproyecto.clasificacion || 'Sin clasificacion'}</p></InfoField>
                        <InfoField label="Coordinacion"><p>{subproyecto.coordinacion || 'Sin coordinacion'}</p></InfoField>
                        <InfoField label="Coordinador"><p>{coordinadorNombre}</p></InfoField>
                        <InfoField label="Área Usuaria (Patrocinador)"><p>{areaUsuariaNombre}</p></InfoField>
                        <InfoField label="Responsables">
                          {responsablesNombres.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {responsablesNombres.map((nombre, idx) => (
                                <Badge key={idx} variant="secondary">{nombre}</Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">Sin responsables asignados</p>
                          )}
                        </InfoField>
                        {subproyecto.areasFinancieras && subproyecto.areasFinancieras.length > 0 && (
                          <InfoField label="Area Financiera">
                            {subproyecto.areasFinancieras.map(area => (
                              <Badge key={area} variant="secondary">{area}</Badge>
                            ))}
                          </InfoField>
                        )}
                      </div>
                      <div className="space-y-4">
                        {/* Anos */}
                        {subproyecto.anios && subproyecto.anios.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-gray-500 mb-1">Años</p>
                            <div className="text-sm p-2 bg-gray-50 rounded-md border min-h-[38px] flex items-center flex-wrap gap-1">
                              {subproyecto.anios.map(y => {
                                const isCurrentYear = y.toString() === '2025';
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
                        )}
                        <InfoField label="Monto">
                          <p className="font-semibold">
                            {subproyecto.monto
                              ? `S/ ${Number(subproyecto.monto).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
                              : '-'}
                          </p>
                        </InfoField>
                        <InfoField label="Metodologia">
                          <p>Scrum</p>
                        </InfoField>
                        <div className="grid grid-cols-2 gap-4">
                          <InfoField label="Fecha Inicio">
                            <p>{subproyecto.fechaInicio ? formatMonthYear(subproyecto.fechaInicio) : '-'}</p>
                          </InfoField>
                          <InfoField label="Fecha Fin">
                            <p>{subproyecto.fechaFin ? formatMonthYear(subproyecto.fechaFin) : '-'}</p>
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
            </>
          )}

          {/* Tab Backlog */}
          {activeTab === 'Backlog' && subproyectoId && (
            <BacklogTabContent
              proyectoId={subproyecto.proyectoPadreId}
              subproyectoId={subproyectoId}
              proyectoFechaInicio={fechaInicio}
              proyectoFechaFin={fechaFin}
              proyectoEstado={estado as any}
              onProjectStateChange={() => fetchSubprojectData()}
            />
          )}

          {/* Tab Documentos */}
          {activeTab === 'Documentos' && subproyectoId && (
            <DocumentosTabContent subproyectoId={subproyectoId} />
          )}

          {/* Tab Actas */}
          {activeTab === 'Actas' && subproyectoId && (
            <ActasTabContent subproyectoId={subproyectoId} />
          )}

          {/* Tab Requerimientos */}
          {activeTab === 'Requerimientos' && subproyectoId && (
            <RequerimientosTabContent subproyectoId={subproyectoId} />
          )}

          {/* Tab Cronograma */}
          {activeTab === 'Cronograma' && subproyectoId && subproyecto && (
            <CronogramaTabContent
              subproyectoId={subproyectoId}
              nombre={subproyecto.nombre}
              asignaciones={asignaciones}
              fechaInicio={subproyecto.fechaInicio}
              fechaFin={subproyecto.fechaFin}
            />
          )}
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteSubproject}
        title="AVISO"
        message="El subproyecto sera eliminado"
      />

      {isEditModalOpen && subproyecto && (
        <SubProjectModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveEdit}
          subProject={mapToSubProject(subproyecto)}
          scrumMasters={scrumMasters}
          coordinadores={coordinadoresData}
          patrocinadores={patrocinadorOptions}
          responsibleOptions={responsibleOptions}
          yearOptions={yearOptionsForModal}
          existingSubProjects={[]}
          projectFechaInicio={proyectoPadreFechaInicio}
          projectFechaFin={proyectoPadreFechaFin}
        />
      )}
    </AppLayout>
  );
}

export default function SubprojectDetailsPage() {
  return (
    <ProtectedRoute module={MODULES.POI}>
      <React.Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Cargando...</div>}>
        <SubprojectDetailsContent />
      </React.Suspense>
    </ProtectedRoute>
  );
}
