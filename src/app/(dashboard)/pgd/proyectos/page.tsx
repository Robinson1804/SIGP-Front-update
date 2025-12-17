
"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  X,
  Search,
  Folder,
  CheckCircle,
  Calendar,
  MoreHorizontal,
  AlertTriangle,
  Users,
  Loader2,
} from "lucide-react";
import AppLayout from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/pagination";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import { paths } from "@/lib/paths";
import { ProtectedRoute } from "@/features/auth";
import { MODULES } from "@/lib/definitions";
import { useToast } from "@/lib/hooks/use-toast";

// Services
import { getPGDs } from "@/features/planning/services/pgd.service";
import { getAccionesEstrategicasByPGD, type PGD, type AccionEstrategica } from "@/features/planning";
import {
  getProyectos,
  createProyecto,
  updateProyecto,
  deleteProyecto,
  type CreateProyectoData,
} from "@/features/proyectos/services/proyectos.service";
import type { Proyecto } from "@/lib/definitions";

const availableYears = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

const statusColors: { [key: string]: string } = {
  'Pendiente': 'bg-[#FE9F43]',
  'En planificacion': 'bg-[#FFD700]',
  'En desarrollo': 'bg-[#559FFE]',
  'Finalizado': 'bg-[#2FD573]',
  'Cancelado': 'bg-[#DC3545]',
};

function POIModal({
  isOpen,
  onClose,
  project,
  onSave,
  accionesEstrategicas,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  project: Proyecto | null;
  onSave: (data: CreateProyectoData, isEdit: boolean, id?: number) => Promise<void>;
  accionesEstrategicas: AccionEstrategica[];
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<Partial<CreateProyectoData>>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        codigo: project.codigo,
        nombre: project.nombre,
        descripcion: project.descripcion || '',
        clasificacion: project.clasificacion as 'Al ciudadano' | 'Gestion interna',
        accionEstrategicaId: project.accionEstrategicaId || undefined,
        montoAnual: project.montoAnual || 0,
        anios: project.anios || [],
        fechaInicio: project.fechaInicio || undefined,
        fechaFin: project.fechaFin || undefined,
      });
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
        clasificacion: undefined,
        accionEstrategicaId: undefined,
        montoAnual: 0,
        anios: [],
      });
    }
    setErrors({});
  }, [project, isOpen]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.codigo) newErrors.codigo = "El codigo es requerido.";
    if (!formData.nombre) newErrors.nombre = "El nombre es requerido.";
    if (!formData.descripcion) newErrors.descripcion = "La descripcion es requerida.";
    if (!formData.accionEstrategicaId) newErrors.accionEstrategicaId = "La accion estrategica es requerida.";
    if (!formData.clasificacion) newErrors.clasificacion = "La clasificacion es requerida.";
    if (!formData.anios || formData.anios.length === 0) newErrors.anios = "El anio es requerido.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      await onSave(formData as CreateProyectoData, !!project, project?.id);
      // Blur active element before closing to prevent aria-hidden focus issues
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const yearOptions: MultiSelectOption[] = availableYears.map(y => ({
    label: y.toString(),
    value: y.toString()
  }));

  const isEditMode = !!project;

  // Handle dialog close with proper focus management
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Blur active element before closing to prevent aria-hidden focus issues
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg p-0" showCloseButton={false}>
        <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between">
          <DialogTitle>{isEditMode ? 'EDITAR' : 'REGISTRAR'} PROYECTO</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label>Codigo *</label>
            <Input
              placeholder="Ej: PRY-001"
              value={formData.codigo || ''}
              onChange={e => setFormData(p => ({ ...p, codigo: e.target.value }))}
              className={errors.codigo ? 'border-red-500' : ''}
            />
            {errors.codigo && <p className="text-red-500 text-xs mt-1">{errors.codigo}</p>}
          </div>
          <div>
            <label>Nombre *</label>
            <Input
              placeholder="Ingresar nombre"
              value={formData.nombre || ''}
              onChange={e => setFormData(p => ({ ...p, nombre: e.target.value }))}
              className={errors.nombre ? 'border-red-500' : ''}
            />
            {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
          </div>
          <div>
            <label>Descripcion *</label>
            <Textarea
              placeholder="Ingresar descripcion"
              value={formData.descripcion || ''}
              onChange={e => setFormData(p => ({ ...p, descripcion: e.target.value }))}
              className={errors.descripcion ? 'border-red-500' : ''}
            />
            {errors.descripcion && <p className="text-red-500 text-xs mt-1">{errors.descripcion}</p>}
          </div>
          <div>
            <label>Accion Estrategica *</label>
            <Select
              value={formData.accionEstrategicaId?.toString() || ''}
              onValueChange={(value) => setFormData(p => ({ ...p, accionEstrategicaId: Number(value) }))}
            >
              <SelectTrigger className={errors.accionEstrategicaId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Seleccionar AE" />
              </SelectTrigger>
              <SelectContent>
                {accionesEstrategicas.map((ae) => (
                  <SelectItem key={ae.id} value={ae.id.toString()}>
                    {ae.codigo} - {ae.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.accionEstrategicaId && <p className="text-red-500 text-xs mt-1">{errors.accionEstrategicaId}</p>}
          </div>
          <div>
            <label>Clasificacion *</label>
            <Select
              value={formData.clasificacion || ''}
              onValueChange={(value) => setFormData(p => ({ ...p, clasificacion: value as 'Al ciudadano' | 'Gestion interna' }))}
            >
              <SelectTrigger className={errors.clasificacion ? 'border-red-500' : ''}>
                <SelectValue placeholder="Seleccionar clasificacion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Al ciudadano">Al ciudadano</SelectItem>
                <SelectItem value="Gestion interna">Gestion interna</SelectItem>
              </SelectContent>
            </Select>
            {errors.clasificacion && <p className="text-red-500 text-xs mt-1">{errors.clasificacion}</p>}
          </div>
          <div>
            <label>Monto anual</label>
            <Input
              type="number"
              placeholder="Ingresar monto"
              value={formData.montoAnual || ''}
              onChange={e => setFormData(p => ({ ...p, montoAnual: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label>Anio(s) *</label>
            <MultiSelect
              options={yearOptions}
              selected={(formData.anios || []).map(String)}
              onChange={(selected) => setFormData(p => ({ ...p, anios: selected.map(Number) }))}
              className={errors.anios ? 'border-red-500' : ''}
              placeholder="Seleccionar anio(s)"
            />
            {errors.anios && <p className="text-red-500 text-xs mt-1">{errors.anios}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Fecha Inicio</label>
              <Input
                type="date"
                value={formData.fechaInicio || ''}
                onChange={e => setFormData(p => ({ ...p, fechaInicio: e.target.value }))}
              />
            </div>
            <div>
              <label>Fecha Fin</label>
              <Input
                type="date"
                value={formData.fechaFin || ''}
                onChange={e => setFormData(p => ({ ...p, fechaFin: e.target.value }))}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="px-6 pb-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} style={{ borderColor: '#CFD6DD', color: 'black' }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            style={{ backgroundColor: '#018CD1', color: 'white' }}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  if (!isOpen) return null;

  // Handle dialog close with proper focus management
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Blur active element before closing to prevent aria-hidden focus issues
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
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
          <AlertTriangle className="h-16 w-16 text-black mb-4" strokeWidth={1.5} />
          <p className="font-bold text-lg">Estas seguro?</p>
          <p className="text-muted-foreground">El proyecto sera eliminado</p>
        </div>
        <DialogFooter className="px-6 pb-6 flex justify-center gap-4">
          <Button variant="outline" onClick={() => handleOpenChange(false)} style={{ borderColor: '#CFD6DD', color: 'black' }}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              // Blur active element before action to prevent aria-hidden focus issues
              if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
              }
              onConfirm();
            }}
            style={{ backgroundColor: '#018CD1', color: 'white' }}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Si, eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const ProjectCard = ({
  project,
  onEdit,
  onDelete,
  accionEstrategica,
}: {
  project: Proyecto;
  onEdit: () => void;
  onDelete: () => void;
  accionEstrategica?: AccionEstrategica;
}) => {
  const displayYears = project.anios?.join(', ') || '';

  return (
    <Card className="w-full h-full flex flex-col shadow-md rounded-lg bg-white hover:shadow-xl transition-shadow duration-300 cursor-pointer">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex items-center gap-2">
          <Folder className="w-6 h-6 text-[#008ED2]" />
          <div className="flex flex-col">
            <h3 className="font-bold text-black">{project.nombre}</h3>
            <p className="text-sm text-[#ADADAD]">{project.codigo}</p>
          </div>
        </div>
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
      </CardHeader>
      <CardContent className="flex flex-col gap-2 flex-grow justify-end">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4 text-[#272E35]" />
          <span className="font-semibold">Estado:</span>
          <Badge className={`${statusColors[project.estado || 'Pendiente']} text-black`}>
            {project.estado || 'Pendiente'}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-[#272E35]" />
          <span className="font-semibold">Anios:</span>
          <span>{displayYears}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Folder className="w-4 h-4 text-[#272E35]" />
          <span className="font-semibold">AE:</span>
          <span className="truncate">{accionEstrategica?.codigo || '-'}</span>
        </div>
        {project.clasificacion && (
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-[#272E35]" />
            <span className="font-semibold">Clasificacion:</span>
            <span>{project.clasificacion}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function PgdProyectosPage() {
  const { toast } = useToast();

  // PGD State
  const [pgds, setPgds] = useState<PGD[]>([]);
  const [selectedPgdId, setSelectedPgdId] = useState<string>('');
  const [loadingPgds, setLoadingPgds] = useState(true);

  // Acciones Estrategicas State
  const [accionesEstrategicas, setAccionesEstrategicas] = useState<AccionEstrategica[]>([]);
  const [loadingAEs, setLoadingAEs] = useState(false);

  // Projects State
  const [projects, setProjects] = useState<Proyecto[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [filteredProjects, setFilteredProjects] = useState<Proyecto[]>([]);

  // Modal State
  const [isPoiModalOpen, setIsPoiModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Proyecto | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Proyecto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClasificacion, setFilterClasificacion] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Load PGDs on mount
  useEffect(() => {
    const loadPGDs = async () => {
      try {
        setLoadingPgds(true);
        const data = await getPGDs();
        setPgds(data);
        // Select the first PGD by default
        if (data.length > 0) {
          setSelectedPgdId(data[0].id.toString());
        }
      } catch (error) {
        console.error('Error loading PGDs:', error);
        toast({ title: 'Error', description: 'Error al cargar los PGDs', variant: 'destructive' });
      } finally {
        setLoadingPgds(false);
      }
    };
    loadPGDs();
  }, []);

  // Load Acciones Estrategicas when PGD changes
  useEffect(() => {
    const loadAEs = async () => {
      if (!selectedPgdId) {
        setAccionesEstrategicas([]);
        return;
      }

      try {
        setLoadingAEs(true);
        const data = await getAccionesEstrategicasByPGD(selectedPgdId);
        setAccionesEstrategicas(data);
      } catch (error) {
        console.error('Error loading Acciones Estrategicas:', error);
        setAccionesEstrategicas([]);
      } finally {
        setLoadingAEs(false);
      }
    };
    loadAEs();
  }, [selectedPgdId]);

  // Load Projects when Acciones Estrategicas change
  useEffect(() => {
    const loadProjects = async () => {
      if (accionesEstrategicas.length === 0) {
        setProjects([]);
        return;
      }

      try {
        setLoadingProjects(true);
        // Filtrar solo proyectos activos (no eliminados)
        const response = await getProyectos({ activo: true });
        const allProjects = response.data || [];

        // Filter projects by the AE IDs
        const aeIds = accionesEstrategicas.map(ae => ae.id);
        const filtered = allProjects.filter(
          (p: Proyecto) => p.accionEstrategicaId && aeIds.includes(p.accionEstrategicaId)
        );
        setProjects(filtered);
      } catch (error) {
        console.error('Error loading projects:', error);
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };
    loadProjects();
  }, [accionesEstrategicas]);

  // Apply filters
  useEffect(() => {
    let result = [...projects];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.nombre.toLowerCase().includes(term) ||
        p.codigo.toLowerCase().includes(term)
      );
    }

    if (filterClasificacion && filterClasificacion !== 'all') {
      result = result.filter(p => p.clasificacion === filterClasificacion);
    }

    setFilteredProjects(result);
    setCurrentPage(1);
  }, [projects, searchTerm, filterClasificacion]);

  // Paginated projects
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const totalPages = Math.ceil(filteredProjects.length / pageSize);

  const handleOpenPoiModal = (project: Proyecto | null = null) => {
    setEditingProject(project);
    setIsPoiModalOpen(true);
  };

  const handleClosePoiModal = () => {
    setIsPoiModalOpen(false);
    setEditingProject(null);
  };

  const handleSaveProject = async (data: CreateProyectoData, isEdit: boolean, id?: number) => {
    try {
      if (isEdit && id) {
        await updateProyecto(id, data);
        toast({ title: 'Exito', description: 'Proyecto actualizado correctamente' });
      } else {
        await createProyecto(data);
        toast({ title: 'Exito', description: 'Proyecto creado correctamente' });
      }

      // Reload projects (solo activos)
      const response = await getProyectos({ activo: true });
      const allProjects = response.data || [];
      const aeIds = accionesEstrategicas.map(ae => ae.id);
      const filtered = allProjects.filter(
        (p: Proyecto) => p.accionEstrategicaId && aeIds.includes(p.accionEstrategicaId)
      );
      setProjects(filtered);
    } catch (error: unknown) {
      console.error('Error saving project:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar el proyecto';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      throw error;
    }
  };

  const handleOpenDeleteModal = (project: Proyecto) => {
    setDeletingProject(project);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingProject(null);
  };

  const handleDeleteProject = async () => {
    if (!deletingProject) return;

    setIsDeleting(true);
    try {
      await deleteProyecto(deletingProject.id);
      toast({ title: 'Exito', description: 'Proyecto eliminado correctamente' });
      setProjects(projects.filter(p => p.id !== deletingProject.id));
      handleCloseDeleteModal();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({ title: 'Error', description: 'Error al eliminar el proyecto', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const getAeForProject = useCallback((project: Proyecto) => {
    return accionesEstrategicas.find(ae => ae.id === project.accionEstrategicaId);
  }, [accionesEstrategicas]);

  const selectedPgd = pgds.find(p => p.id.toString() === selectedPgdId);

  return (
    <ProtectedRoute module={MODULES.PGD}>
      <AppLayout
        breadcrumbs={[
          { label: "PGD", href: paths.pgd.base },
          { label: "Proyectos PGD" },
        ]}
      >
        <div className="bg-[#D5D5D5] border-y border-[#1A5581] w-full">
          <div className="p-2 flex items-center justify-between w-full">
            <h2 className="font-bold text-black pl-2">
              PROYECTOS DEL PGD
            </h2>
            <div className="flex items-center gap-2">
              <Select
                value={selectedPgdId}
                onValueChange={setSelectedPgdId}
                disabled={loadingPgds}
              >
                <SelectTrigger className="w-[180px] bg-white border-[#484848]">
                  <SelectValue placeholder={loadingPgds ? "Cargando..." : "Seleccionar PGD"} />
                </SelectTrigger>
                <SelectContent>
                  {pgds.map((pgd) => (
                    <SelectItem key={pgd.id} value={pgd.id.toString()}>
                      {`${pgd.anioInicio} - ${pgd.anioFin}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => handleOpenPoiModal()}
                style={{ backgroundColor: "#018CD1", color: "white" }}
                disabled={accionesEstrategicas.length === 0}
              >
                <Plus className="mr-2 h-4 w-4" /> NUEVO PROYECTO
              </Button>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col bg-[#F9F9F9] p-6">
          {selectedPgd && (
            <div className="mb-4 text-sm text-gray-600">
              <strong>PGD:</strong> {selectedPgd.nombre} ({selectedPgd.anioInicio} - {selectedPgd.anioFin})
              {' | '}
              <strong>Acciones Estrategicas:</strong> {accionesEstrategicas.length}
              {' | '}
              <strong>Proyectos:</strong> {projects.length}
            </div>
          )}

          <div className="flex items-center gap-2 text-[#004272] mb-4">
            <Folder />
            <h3 className="font-bold text-lg">Proyectos</h3>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7E8C9A]" />
              <Input
                placeholder="Buscar"
                className="pl-9 bg-white border-[#CFD6DD]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm">Clasificacion</label>
              <Select value={filterClasificacion} onValueChange={setFilterClasificacion}>
                <SelectTrigger className="w-[180px] bg-white border-[#CFD6DD] text-[#7E8C9A]">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Al ciudadano">Al ciudadano</SelectItem>
                  <SelectItem value="Gestion interna">Gestion interna</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loadingProjects || loadingAEs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#018CD1]" />
              <span className="ml-2">Cargando proyectos...</span>
            </div>
          ) : paginatedProjects.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {accionesEstrategicas.length === 0 ? (
                <p>No hay Acciones Estrategicas registradas para este PGD. Registra primero las AEs en el modulo de Planning.</p>
              ) : (
                <p>No hay proyectos registrados para este PGD. Haz clic en "NUEVO PROYECTO" para agregar uno.</p>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mb-6">
                {paginatedProjects.map(p => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    onEdit={() => handleOpenPoiModal(p)}
                    onDelete={() => handleOpenDeleteModal(p)}
                    accionEstrategica={getAeForProject(p)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) setCurrentPage(currentPage - 1);
                        }}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === page}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(page);
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </div>

        <POIModal
          isOpen={isPoiModalOpen}
          onClose={handleClosePoiModal}
          project={editingProject}
          onSave={handleSaveProject}
          accionesEstrategicas={accionesEstrategicas}
          isLoading={loadingAEs}
        />

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleDeleteProject}
          isDeleting={isDeleting}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}
