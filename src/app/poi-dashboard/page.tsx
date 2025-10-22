
"use client";

import React from "react";
import {
  FileText,
  Target,
  Users,
  BarChart,
  Bell,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  Folder,
  CheckCircle,
  Calendar,
  MoreVertical,
  AlertTriangle,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


type PGD = {
  id: string;
  startYear: number;
  endYear: number;
};

const initialPgds: PGD[] = [
  { id: "1", startYear: 2020, endYear: 2024 },
];

const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

type Project = {
    id: string;
    name: string;
    description: string;
    type: 'Proyecto' | 'Actividad';
    classification: 'Al ciudadano' | 'Gestión interna';
    status: 'Pendiente' | 'En planificación' | 'En desarrollo' | 'Finalizado';
    startDate: string;
    endDate: string;
    scrumMaster: string;
    annualAmount: number;
    strategicAction: string;
    missingData?: boolean;
};

const initialProjects: Project[] = [
    {
        id: '1',
        name: 'Administración de Portafolio de Proyectos',
        description: 'Descripción del proyecto',
        type: 'Proyecto',
        classification: 'Gestión interna',
        status: 'En planificación',
        startDate: 'Abril 2025',
        endDate: 'Sep 2025',
        scrumMaster: 'Ana Pérez',
        annualAmount: 50000,
        strategicAction: 'AE N°1',
        missingData: false,
    },
    {
        id: '2',
        name: 'Sistema de Trámite Documentario',
        description: 'Descripción del proyecto 2',
        type: 'Proyecto',
        classification: 'Al ciudadano',
        status: 'En desarrollo',
        startDate: 'Mayo 2025',
        endDate: 'Dic 2025',
        scrumMaster: 'Juan Garcia',
        annualAmount: 75000,
        strategicAction: 'AE N°2',
        missingData: true,
    }
];

const statusColors: { [key: string]: string } = {
    'Pendiente': 'bg-[#FE9F43]',
    'En planificación': 'bg-[#FFD700]',
    'En desarrollo': 'bg-[#559FFE]',
    'Finalizado': 'bg-[#2FD573]',
};

function PGDModal({
  isOpen,
  onClose,
  pgd,
  onSave,
  onDelete,
}: {
  isOpen: boolean;
  onClose: () => void;
  pgd: PGD | null;
  onSave: (data: { startYear: number; endYear: number }) => void;
  onDelete?: (id: string) => void;
}) {
  const [startYear, setStartYear] = React.useState<number | undefined>(pgd?.startYear);
  const [endYear, setEndYear] = React.useState<number | undefined>(pgd?.endYear);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  React.useEffect(() => {
    if (pgd) {
      setStartYear(pgd.startYear);
      setEndYear(pgd.endYear);
    } else {
      setStartYear(undefined);
      setEndYear(undefined);
    }
  }, [pgd, isOpen]);
  
  const handleSave = () => {
    if (startYear && endYear) {
      if (endYear - startYear !== 4) {
        alert("El rango debe ser de 4 años.");
        return;
      }
       if (endYear < startYear) {
        alert("El año final no puede ser menor al año de inicio.");
        return;
      }
      onSave({ startYear, endYear });
      onClose();
    }
  };
  
  const handleDelete = () => {
      if (pgd?.id) {
          onDelete?.(pgd.id);
          setShowDeleteConfirm(false);
          onClose();
      }
  }

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] p-0" showCloseButton={false}>
          <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between">
            <DialogTitle>
              {pgd ? "EDITAR PLAN DE GOBIERNO DIGITAL (PGD)" : "REGISTRAR PLAN DE GOBIERNO DIGITAL (PGD)"}
            </DialogTitle>
            <DialogClose asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white">
                    <X className="h-4 w-4" />
                </Button>
            </DialogClose>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="startYear" className="block text-sm font-medium text-gray-700 mb-1">Año Inicio:</label>
                    <Select onValueChange={(value) => setStartYear(Number(value))} defaultValue={startYear?.toString()}>
                        <SelectTrigger id="startYear">
                            <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div>
                    <label htmlFor="endYear" className="block text-sm font-medium text-gray-700 mb-1">Año Final:</label>
                    <Select onValueChange={(value) => setEndYear(Number(value))} defaultValue={endYear?.toString()}>
                        <SelectTrigger id="endYear">
                            <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </div>
          <DialogFooter className="px-6 pb-6 flex justify-between">
            {pgd ? (
              <>
                <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>Eliminar</Button>
                <Button onClick={handleSave}>Guardar</Button>
              </>
            ) : (
                <div className="w-full flex justify-end gap-2">
                 <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                 <Button onClick={handleSave}>Guardar</Button>
                </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {showDeleteConfirm && (
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirmar Eliminación</DialogTitle>
                </DialogHeader>
                <p>¿Está seguro de que desea eliminar el plan {pgd?.startYear} - {pgd?.endYear}? Esta acción no se puede deshacer.</p>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function POIModal({
    isOpen,
    onClose,
    project,
    onSave,
}: {
    isOpen: boolean;
    onClose: () => void;
    project: Partial<Project> | null;
    onSave: (data: Project) => void;
}) {
    const [formData, setFormData] = React.useState<Partial<Project>>({});
    const [errors, setErrors] = React.useState<{[key: string]: string}>({});
    
    React.useEffect(() => {
        if (project) {
            setFormData(project);
        } else {
            setFormData({
                id: '',
                name: '',
                description: '',
                type: undefined,
                classification: undefined,
                status: undefined,
                startDate: '',
                endDate: '',
                scrumMaster: '',
                annualAmount: 0,
                strategicAction: '',
            });
        }
        setErrors({});
    }, [project, isOpen]);
    
    const validate = () => {
        const newErrors: {[key: string]: string} = {};
        if (!formData.type) newErrors.type = "El tipo es requerido.";
        if (!formData.name) newErrors.name = "El nombre es requerido.";
        if (!formData.description) newErrors.description = "La descripción es requerida.";
        if (!formData.strategicAction) newErrors.strategicAction = "La acción estratégica es requerida.";
        if (!formData.classification) newErrors.classification = "La clasificación es requerida.";
        if (!formData.annualAmount) newErrors.annualAmount = "El monto es requerido.";
        if (!formData.status) newErrors.status = "El estado es requerido.";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const handleSave = () => {
        if (!validate()) return;
        
        const isNewProject = !project?.id;
        const missingData = isNewProject && formData.type === 'Proyecto';

        onSave({ ...formData as Project, missingData });
        onClose();
    }
    
    const isEditMode = !!project?.id;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg p-0" showCloseButton={false}>
                <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between">
                    <DialogTitle>{isEditMode ? 'EDITAR' : 'REGISTRAR'} PLAN OPERATIVO INFORMÁTICO (POI)</DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></Button>
                    </DialogClose>
                </DialogHeader>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label>Tipo (Proyecto/Actividad) *</label>
                        <Select value={formData.type} onValueChange={(value) => setFormData(p => ({...p, type: value as Project['type']}))}>
                            <SelectTrigger className={errors.type ? 'border-red-500' : ''}><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Proyecto">Proyecto</SelectItem>
                                <SelectItem value="Actividad">Actividad</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
                    </div>
                    <div>
                       <label>Nombre *</label>
                       <Input placeholder="Ingresar nombre" value={formData.name || ''} onChange={e => setFormData(p => ({...p, name: e.target.value}))} className={errors.name ? 'border-red-500' : ''} />
                       {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                     <div>
                       <label>Descripción *</label>
                       <Textarea placeholder="Ingresar descripción" value={formData.description || ''} onChange={e => setFormData(p => ({...p, description: e.target.value}))} className={errors.description ? 'border-red-500' : ''} />
                       {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                    </div>
                    <div>
                        <label>Acción Estratégica *</label>
                        <Select value={formData.strategicAction} onValueChange={(value) => setFormData(p => ({...p, strategicAction: value}))}>
                            <SelectTrigger className={errors.strategicAction ? 'border-red-500' : ''}><SelectValue placeholder="Seleccionar AE" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="AE N°1">AE N°1</SelectItem>
                                <SelectItem value="AE N°2">AE N°2</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.strategicAction && <p className="text-red-500 text-xs mt-1">{errors.strategicAction}</p>}
                    </div>
                     <div>
                        <label>Clasificación *</label>
                        <Select value={formData.classification} onValueChange={(value) => setFormData(p => ({...p, classification: value as Project['classification']}))}>
                            <SelectTrigger className={errors.classification ? 'border-red-500' : ''}><SelectValue placeholder="Seleccionar clasificación" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Al ciudadano">Al ciudadano</SelectItem>
                                <SelectItem value="Gestión interna">Gestión interna</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.classification && <p className="text-red-500 text-xs mt-1">{errors.classification}</p>}
                    </div>
                    <div>
                       <label>Monto anual *</label>
                       <Input type="number" placeholder="Ingresar monto" value={formData.annualAmount || ''} onChange={e => setFormData(p => ({...p, annualAmount: Number(e.target.value)}))} className={errors.annualAmount ? 'border-red-500' : ''} />
                        {errors.annualAmount && <p className="text-red-500 text-xs mt-1">{errors.annualAmount}</p>}
                    </div>
                    <div>
                        <label>Estado *</label>
                        <Select value={formData.status} onValueChange={(value) => setFormData(p => ({...p, status: value as Project['status']}))}>
                            <SelectTrigger className={errors.status ? 'border-red-500' : ''}><SelectValue placeholder="Seleccionar estado" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Pendiente">Pendiente</SelectItem>
                                <SelectItem value="En planificación">En planificación</SelectItem>
                                <SelectItem value="En desarrollo">En desarrollo</SelectItem>
                                <SelectItem value="Finalizado">Finalizado</SelectItem>
                            </SelectContent>
                        </Select>
                         {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
                    </div>
                </div>
                <DialogFooter className="px-6 pb-6 flex justify-end gap-2">
                     <Button variant="outline" onClick={onClose} style={{borderColor: '#CFD6DD', color: 'black'}}>Cancelar</Button>
                     <Button onClick={handleSave} style={{backgroundColor: '#018CD1', color: 'white'}}>Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
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
                    <p className="text-muted-foreground">El Plan Operativo Informático será eliminado</p>
                </div>
                <DialogFooter className="px-6 pb-6 flex justify-center gap-4">
                    <Button variant="outline" onClick={onClose} style={{borderColor: '#CFD6DD', color: 'black'}}>Cancelar</Button>
                    <Button onClick={onConfirm} style={{backgroundColor: '#018CD1', color: 'white'}}>Sí, eliminar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const ProjectCard = ({ project, onEdit, onDelete }: { project: Project, onEdit: () => void, onDelete: () => void }) => {
    return (
         <Card className="w-full h-full flex flex-col shadow-md rounded-lg bg-white">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-2">
                    <Folder className="w-6 h-6 text-[#008ED2]" />
                    <div className="flex flex-col">
                        <h3 className="font-bold text-black">{project.name}</h3>
                        <Badge variant="secondary" className="text-[#ADADAD] w-fit bg-transparent">{project.type}</Badge>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreVertical className="h-4 w-4" />
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
                    <Badge className={`${statusColors[project.status]} text-black`}>{project.status}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-[#272E35]" />
                    <span className="font-semibold">Fechas:</span>
                    <Badge variant="outline" className="border-gray-300 bg-transparent">{project.startDate} - {project.endDate}</Badge>
                </div>
                 <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-[#272E35]" />
                    <span className="font-semibold">Scrum Master:</span>
                    <span>{project.scrumMaster}</span>
                </div>
            </CardContent>
        </Card>
    );
};

const navItems = [
  { label: "PGD", icon: FileText, href: "/pmo-dashboard" },
  { label: "POI", icon: Target, href: "/poi" },
  { label: "RECURSOS HUMANOS", icon: Users, href: "#" },
  { label: "DASHBOARD", icon: BarChart, href: "#" },
  { label: "NOTIFICACIONES", icon: Bell, href: "#" },
];


export default function PoiDashboardPage() {
  const [pgds, setPgds] = React.useState<PGD[]>(initialPgds);
  const [selectedPgd, setSelectedPgd] = React.useState<string | undefined>(
    pgds.length > 0 ? pgds[0].id : undefined
  );
  const [isPgdModalOpen, setIsPgdModalOpen] = React.useState(false);
  const [editingPgd, setEditingPgd] = React.useState<PGD | null>(null);

  const [projects, setProjects] = React.useState<Project[]>(initialProjects);
  const [isPoiModalOpen, setIsPoiModalOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<Partial<Project> | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [deletingProject, setDeletingProject] = React.useState<Project | null>(null);


  const handleOpenPgdModal = (pgd: PGD | null = null) => {
    setEditingPgd(pgd);
    setIsPgdModalOpen(true);
  };

  const handleClosePgdModal = () => {
    setIsPgdModalOpen(false);
    setEditingPgd(null);
  };

  const handleSavePgd = (data: { startYear: number; endYear: number }) => {
    if (editingPgd) {
      setPgds(pgds.map((p) => (p.id === editingPgd.id ? { ...p, ...data } : p)));
    } else {
      const newPgd = { id: Date.now().toString(), ...data };
      setPgds([...pgds, newPgd]);
      setSelectedPgd(newPgd.id);
    }
  };

   const handleDeletePgd = (id: string) => {
    setPgds(pgds.filter((p) => p.id !== id));
    if (selectedPgd === id) {
      setSelectedPgd(pgds.length > 1 ? pgds.filter(p => p.id !== id)[0].id : undefined);
    }
  };

  const handleOpenPoiModal = (project: Partial<Project> | null = null) => {
      setEditingProject(project);
      setIsPoiModalOpen(true);
  }

  const handleClosePoiModal = () => {
      setIsPoiModalOpen(false);
      setEditingProject(null);
  }
  
  const handleSaveProject = (projectData: Project) => {
      const exists = projects.some(p => p.id === projectData.id);
      if (exists) {
          setProjects(projects.map(p => p.id === projectData.id ? {...p, ...projectData, missingData: false} : p));
      } else {
          setProjects([...projects, { ...projectData, id: Date.now().toString(), missingData: projectData.type === 'Proyecto' }]);
      }
  }
  
  const handleOpenDeleteModal = (project: Project) => {
    setDeletingProject(project);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingProject(null);
  };
  
  const handleDeleteProject = () => {
      if (deletingProject) {
        setProjects(projects.filter(p => p.id !== deletingProject.id));
        handleCloseDeleteModal();
      }
  }


  return (
    <AppLayout
      navItems={navItems}
      breadcrumbs={[
        { label: "PGD", href: "/pmo-dashboard" },
        { label: "POI" },
      ]}
    >
      <div className="bg-[#D5D5D5] border-y border-[#1A5581] w-full">
        <div className="p-2 flex items-center justify-between w-full">
          <h2 className="font-bold text-black pl-2">
            PLAN OPERATIVO INFORMÁTICO (POI)
          </h2>
          <div className="flex items-center gap-2">
            <Select value={selectedPgd} onValueChange={setSelectedPgd}>
              <SelectTrigger className="w-[180px] bg-white border-[#484848]">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {pgds.map((pgd) => (
                  <SelectItem key={pgd.id} value={pgd.id}>
                    {`${pgd.startYear} - ${pgd.endYear}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon"
              style={{ backgroundColor: "#3B4466", color: "white" }}
              className="border border-[#979797]"
              onClick={() => handleOpenPgdModal()}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              style={{ backgroundColor: "#3B4466", color: "white" }}
              className="border border-[#979797]"
              disabled={!selectedPgd}
              onClick={() =>
                handleOpenPgdModal(pgds.find((p) => p.id === selectedPgd) || null)
              }
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button onClick={() => handleOpenPoiModal()} style={{ backgroundColor: "#018CD1", color: "white" }}>
              <Plus className="mr-2 h-4 w-4" /> NUEVO POI
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-[#F9F9F9] p-6">
        <div className="flex items-center mb-4 gap-4">
            <Button className="bg-[#018CD1] text-white">POI</Button>
            <Button variant="outline" className="bg-white text-black border-gray-300">REPORTE POI</Button>
        </div>
        <div className="flex items-center gap-2 text-[#004272] mb-4">
            <Folder />
            <h3 className="font-bold text-lg">Proyectos</h3>
        </div>
        <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7E8C9A]" />
                <Input placeholder="Buscar" className="pl-9 bg-white border-[#CFD6DD]" />
            </div>
            <div className="flex items-center gap-2">
                <label className="text-sm">Tipo</label>
                <Select defaultValue="Proyecto">
                    <SelectTrigger className="w-[150px] bg-white border-[#CFD6DD] text-[#7E8C9A]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Proyecto">Proyecto</SelectItem>
                        <SelectItem value="Actividad">Actividad</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center gap-2">
                <label className="text-sm">Clasificación</label>
                <Select>
                    <SelectTrigger className="w-[180px] bg-white border-[#CFD6DD] text-[#7E8C9A]">
                        <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Al ciudadano">Al ciudadano</SelectItem>
                        <SelectItem value="Gestión interna">Gestión interna</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center gap-2">
                <label className="text-sm">Mes</label>
                 <Input type="month" defaultValue={new Date().toISOString().substring(0, 7)} className="bg-white border-[#CFD6DD] text-[#7E8C9A]" />
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mb-6">
            {projects.map(p => (
                <ProjectCard key={p.id} project={p} onEdit={() => handleOpenPoiModal(p)} onDelete={() => handleOpenDeleteModal(p)} />
            ))}
        </div>
        
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
                <PaginationItem><PaginationLink href="#" isActive>2</PaginationLink></PaginationItem>
                <PaginationItem><PaginationLink href="#">3</PaginationLink></PaginationItem>
                <PaginationItem>
                    <PaginationNext href="#" />
                </PaginationItem>
            </PaginationContent>
        </Pagination>

      </div>

      <PGDModal
        isOpen={isPgdModalOpen}
        onClose={handleClosePgdModal}
        pgd={editingPgd}
        onSave={handleSavePgd}
        onDelete={handleDeletePgd}
      />
      
      <POIModal
        isOpen={isPoiModalOpen}
        onClose={handleClosePoiModal}
        project={editingProject}
        onSave={handleSaveProject}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteProject}
      />
      
    </AppLayout>
  );
}
