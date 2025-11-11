
"use client";

import React from "react";
import {
  FileText,
  Target,
  Users,
  BarChart,
  Bell,
  Plus,
  X,
  Search,
  Folder,
  CheckCircle,
  Calendar,
  MoreHorizontal,
  AlertTriangle,
  List,
} from "lucide-react";
import Link from 'next/link';
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
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type SubProject, type Project } from '@/lib/definitions';


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
        status: 'Pendiente',
        startDate: '',
        endDate: '',
        scrumMaster: '',
        annualAmount: 75000,
        strategicAction: 'AE N°2',
        missingData: true,
        years: ['2025'],
        subProjects: [],
    },
    {
        id: '3',
        name: 'Actividad de Mantenimiento',
        description: 'Descripción de la actividad',
        type: 'Actividad',
        classification: 'Gestión interna',
        status: 'En desarrollo',
        startDate: '2025-01',
        endDate: '2025-12',
        scrumMaster: 'Juan Torres',
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
    }
];

const statusColors: { [key: string]: string } = {
    'Pendiente': 'bg-[#FE9F43]',
    'En planificación': 'bg-[#FFD700]',
    'En desarrollo': 'bg-[#559FFE]',
    'Finalizado': 'bg-[#2FD573]',
};

const responsibleOptions: MultiSelectOption[] = [
    { value: 'Angella Trujillo', label: 'Angella Trujillo' },
    { value: 'Anayeli Monzon', label: 'Anayeli Monzon' },
    { value: 'Ana Garcia', label: 'Ana Garcia' },
    { value: 'Carlos Ruiz', label: 'Carlos Ruiz' },
    { value: 'Juan Torres', label: 'Juan Torres' },
];

const yearOptions: MultiSelectOption[] = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => ({label: y.toString(), value: y.toString()}));
const financialAreaOptions: MultiSelectOption[] = [
    { value: 'OTIN', label: 'OTIN' },
    { value: 'DCNC', label: 'DCNC' },
    { value: 'OTA', label: 'OTA' },
]


export function SubProjectModal({
    isOpen,
    onClose,
    onSave,
    subProject,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: SubProject) => void;
    subProject: SubProject | null;
}) {
    const [formData, setFormData] = React.useState<Partial<SubProject>>({});

    React.useEffect(() => {
        setFormData(subProject || { managementMethod: 'Scrum', responsible: [], years: [] });
    }, [subProject, isOpen]);

    const handleSave = () => {
        onSave(formData as SubProject);
        onClose();
    };
    
    const handleChange = (field: keyof SubProject, value: any) => {
        setFormData(p => ({...p, [field]: value}));
    };

    if (!isOpen) return null;
    
    return (
         <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg p-0" showCloseButton={false}>
                <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between">
                    <DialogTitle>{subProject ? 'EDITAR' : 'REGISTRAR'} SUBPROYECTO</DialogTitle>
                    <DialogClose asChild><Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></Button></DialogClose>
                </DialogHeader>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label>Nombre</label>
                        <Input placeholder="Ingresar nombre" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} />
                    </div>
                     <div>
                        <label>Descripción</label>
                        <Textarea placeholder="Ingresar descripción" value={formData.description || ''} onChange={e => handleChange('description', e.target.value)} />
                    </div>
                    <div>
                        <label>Responsable</label>
                         <MultiSelect options={responsibleOptions} selected={formData.responsible || []} onChange={selected => handleChange('responsible', selected)} placeholder="Seleccionar" />
                    </div>
                    <div>
                        <label>Gestor/Scrum Master</label>
                        <Input placeholder="Ingresar gestor/scrum master" value={formData.scrumMaster || ''} onChange={e => handleChange('scrumMaster', e.target.value)} />
                    </div>
                    <div>
                        <label>Año</label>
                         <MultiSelect options={yearOptions} selected={formData.years || []} onChange={selected => handleChange('years', selected)} placeholder="Seleccionar" />
                    </div>
                    <div>
                        <label>Monto anual</label>
                        <Input type="number" placeholder="Ingresar monto anual" value={formData.amount || ''} onChange={e => handleChange('amount', Number(e.target.value))} />
                    </div>
                    <div>
                        <label>Método de Gestión del proyecto</label>
                        <Input readOnly value={formData.managementMethod || ''} />
                    </div>
                </div>
                <DialogFooter className="px-6 pb-6 flex justify-end gap-2">
                     <Button variant="outline" onClick={onClose} style={{borderColor: '#CFD6DD', color: 'black'}}>Cancelar</Button>
                     <Button onClick={handleSave} style={{backgroundColor: '#018CD1', color: 'white'}}>Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function POIModal({
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
    const [isSubProjectModalOpen, setIsSubProjectModalOpen] = React.useState(false);
    const [editingSubProject, setEditingSubProject] = React.useState<SubProject | null>(null);
    
    const isMissingDataMode = !!project?.missingData;

    const validate = React.useCallback((data: Partial<Project>) => {
        const newErrors: {[key: string]: string} = {};
        if (!data.type) newErrors.type = "El campo es requerido.";
        if (!data.name) newErrors.name = "El campo es requerido.";
        if (!data.description) newErrors.description = "El campo es requerido.";
        if (!data.strategicAction) newErrors.strategicAction = "El campo es requerido.";
        if (!data.classification) newErrors.classification = "El campo es requerido.";
        if (!data.status) newErrors.status = "El campo es requerido.";
        
        if (isMissingDataMode || data.status !== 'Pendiente') {
            if (!data.coordination) newErrors.coordination = "El campo es requerido.";
            if (!data.coordinator) newErrors.coordinator = "El campo es requerido.";
            if (!data.scrumMaster) newErrors.scrumMaster = "El campo es requerido.";
            if (!data.responsibles || data.responsibles.length === 0) newErrors.responsible = "El campo es requerido.";
            if (!data.years || data.years.length === 0) newErrors.years = "El campo es requerido.";
            if (!data.annualAmount) newErrors.annualAmount = "El campo es requerido.";
            if (!data.financialArea || data.financialArea.length === 0) newErrors.financialArea = "El campo es requerido.";
            if (!data.startDate) newErrors.startDate = "El campo es requerido.";
            if (!data.endDate) newErrors.endDate = "El campo es requerido.";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [isMissingDataMode]);

    React.useEffect(() => {
        const initialData = project ? { ...project } : {
            id: '', name: '', description: '', type: undefined, classification: undefined,
            status: 'Pendiente', scrumMaster: '', annualAmount: 0, strategicAction: '',
            subProjects: [], startDate: '', endDate: '', financialArea: [], responsibles: [], years: [],
        };
        setFormData(initialData);

        if (isOpen) {
             if (isMissingDataMode) {
                setTimeout(() => validate(initialData), 0);
            } else {
                setErrors({});
            }
        }
    }, [project, isOpen, isMissingDataMode, validate]);

    React.useEffect(() => {
      if (formData.type === 'Proyecto') {
        setFormData(p => ({...p, managementMethod: 'Scrum'}));
      } else if (formData.type === 'Actividad') {
        setFormData(p => ({...p, managementMethod: 'Kanban', subProjects: []}));
      }
    }, [formData.type]);
    

    const handleSave = () => {
        if (!validate(formData)) return;
        
        let finalStatus = formData.status;
        if(isMissingDataMode && finalStatus === 'Pendiente') {
            finalStatus = 'En planificación';
        }

        onSave({ ...formData as Project, missingData: false, status: finalStatus });
        onClose();
    }
    
    const handleChange = (field: keyof Project, value: any) => {
        const updatedFormData = {...formData, [field]: value};
        setFormData(updatedFormData);
        validate(updatedFormData);
    };
    
    const isEditMode = !!project?.id;

    const handleSaveSubProject = (subProject: SubProject) => {
        const existingSubs = formData.subProjects || [];
        const exists = existingSubs.some(s => s.id === subProject.id);
        const updatedSubs = exists 
            ? existingSubs.map(s => s.id === subProject.id ? subProject : s)
            : [...existingSubs, {...subProject, id: Date.now().toString()}];

        handleChange('subProjects', updatedSubs);
        setIsSubProjectModalOpen(false);
        setEditingSubProject(null);
    }
    
    const openSubProjectModal = (sub?: SubProject) => {
        setEditingSubProject(sub || null);
        setIsSubProjectModalOpen(true);
    }
    
    return (
        <>
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl p-0" showCloseButton={false}>
                <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between">
                    <DialogTitle>{isEditMode ? 'EDITAR' : 'REGISTRAR'} PLAN OPERATIVO INFORMÁTICO (POI)</DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></Button>
                    </DialogClose>
                </DialogHeader>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        {/* Columna 1 */}
                        <div className="space-y-4">
                            <div>
                                <label>Tipo (Proyecto/Actividad) *</label>
                                <Select value={formData.type} onValueChange={(value) => handleChange('type', value as Project['type'])}>
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
                               <Input placeholder="Ingresar nombre" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} className={errors.name ? 'border-red-500' : ''} />
                               {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>
                             <div>
                               <label>Descripción *</label>
                               <Textarea placeholder="Ingresar descripción" value={formData.description || ''} onChange={e => handleChange('description', e.target.value)} className={errors.description ? 'border-red-500' : ''} />
                               {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                            </div>
                             {formData.type === 'Proyecto' && (
                                <div>
                                    <label>Agregar subproyectos</label>
                                    <div className="flex items-center gap-2">
                                        <Button size="icon" variant="outline" className="h-8 w-8 border-2 border-gray-400" onClick={() => openSubProjectModal()}>
                                            <Plus className="h-5 w-5 font-bold text-gray-600" />
                                        </Button>
                                    </div>
                                    {(formData.subProjects || []).length > 0 && (
                                        <Table className="mt-2">
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Subproyecto</TableHead>
                                                    <TableHead>Monto</TableHead>
                                                    <TableHead>Scrum Master</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {formData.subProjects?.map(sub => (
                                                    <TableRow key={sub.id} onClick={() => openSubProjectModal(sub)} className="cursor-pointer">
                                                        <TableCell>{sub.name}</TableCell>
                                                        <TableCell>{sub.amount}</TableCell>
                                                        <TableCell>{sub.scrumMaster}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </div>
                            )}
                            <div>
                                <label>Acción Estratégica *</label>
                                <Select value={formData.strategicAction} onValueChange={(value) => handleChange('strategicAction', value)}>
                                    <SelectTrigger className={errors.strategicAction ? 'border-red-500' : ''}><SelectValue placeholder="Seleccionar AE" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="AE N°1">AE N°1</SelectItem>
                                        <SelectItem value="AE N°2">AE N°2</SelectItem>
                                        <SelectItem value="AE N°3">AE N°3</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.strategicAction && <p className="text-red-500 text-xs mt-1">{errors.strategicAction}</p>}
                            </div>
                             <div>
                                <label>Clasificación *</label>
                                <Select value={formData.classification} onValueChange={(value) => handleChange('classification', value as Project['classification'])}>
                                    <SelectTrigger className={errors.classification ? 'border-red-500' : ''}><SelectValue placeholder="Seleccionar clasificación" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Al ciudadano">Al ciudadano</SelectItem>
                                        <SelectItem value="Gestión interna">Gestión interna</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.classification && <p className="text-red-500 text-xs mt-1">{errors.classification}</p>}
                            </div>
                            <div>
                                <label>Estado *</label>
                                <Select value={formData.status} onValueChange={(value) => handleChange('status', value as Project['status'])}>
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
                             <div>
                               <label>Coordinación</label>
                               <Input placeholder="Ingresar coordinación" value={formData.coordination || ''} onChange={e => handleChange('coordination', e.target.value)} className={errors.coordination ? 'border-red-500' : ''} />
                               {errors.coordination && <p className="text-red-500 text-xs mt-1">{errors.coordination}</p>}
                            </div>
                        </div>
                        {/* Columna 2 */}
                        <div className="space-y-4">
                             <div>
                               <label>Área Financiera</label>
                               <MultiSelect options={financialAreaOptions} selected={formData.financialArea || []} onChange={selected => handleChange('financialArea', selected)} placeholder="Seleccionar" className={errors.financialArea ? 'border-red-500' : ''} />
                               {errors.financialArea && <p className="text-red-500 text-xs mt-1">{errors.financialArea}</p>}
                            </div>
                             <div>
                               <label>Coordinador</label>
                               <Input placeholder="Ingresar coordinador" value={formData.coordinator || ''} onChange={e => handleChange('coordinator', e.target.value)} className={errors.coordinator ? 'border-red-500' : ''} />
                               {errors.coordinator && <p className="text-red-500 text-xs mt-1">{errors.coordinator}</p>}
                            </div>
                            <div>
                               <label>Gestor/Scrum Master</label>
                               <Input placeholder="Ingresar scrum master" value={formData.scrumMaster || ''} onChange={e => handleChange('scrumMaster', e.target.value)}  className={errors.scrumMaster ? 'border-red-500' : ''}/>
                               {errors.scrumMaster && <p className="text-red-500 text-xs mt-1">{errors.scrumMaster}</p>}
                            </div>
                            <div>
                               <label>Responsable</label>
                               <MultiSelect options={responsibleOptions} selected={formData.responsibles || []} onChange={selected => handleChange('responsibles', selected)} placeholder="Seleccionar" className={errors.responsible ? 'border-red-500' : ''} />
                               {errors.responsible && <p className="text-red-500 text-xs mt-1">{errors.responsible}</p>}
                            </div>
                            <div>
                               <label>Año</label>
                               <MultiSelect options={yearOptions} selected={formData.years || []} onChange={selected => handleChange('years', selected)} placeholder="Seleccionar" className={errors.years ? 'border-red-500' : ''} />
                               {errors.years && <p className="text-red-500 text-xs mt-1">{errors.years}</p>}
                            </div>
                             <div>
                               <label>Monto anual</label>
                               <Input type="number" placeholder="Ingresar monto" value={formData.annualAmount || ''} onChange={e => handleChange('annualAmount', Number(e.target.value))} className={errors.annualAmount ? 'border-red-500' : ''} />
                               {errors.annualAmount && <p className="text-red-500 text-xs mt-1">{errors.annualAmount}</p>}
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label>Fecha inicio</label>
                                    <Input type="month" value={formData.startDate || ''} onChange={e => handleChange('startDate', e.target.value)} className={errors.startDate ? 'border-red-500' : ''} />
                                    {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
                                </div>
                                <div>
                                    <label>Fecha fin</label>
                                    <Input type="month" value={formData.endDate || ''} onChange={e => handleChange('endDate', e.target.value)} className={errors.endDate ? 'border-red-500' : ''} />
                                    {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
                                </div>
                            </div>
                            <div>
                               <label>Método de gestión de proyecto</label>
                               <Input readOnly value={formData.managementMethod || ''} />
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter className="px-6 pb-6 flex justify-end gap-2">
                     <Button variant="outline" onClick={onClose} style={{borderColor: '#CFD6DD', color: 'black'}}>Cancelar</Button>
                     <Button onClick={handleSave} style={{backgroundColor: '#018CD1', color: 'white'}}>Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        <SubProjectModal 
            isOpen={isSubProjectModalOpen}
            onClose={() => setIsSubProjectModalOpen(false)}
            onSave={handleSaveSubProject}
            subProject={editingSubProject}
        />
        </>
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
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></Button>
                    </DialogClose>
                </DialogHeader>
                <div className="p-6 text-center flex flex-col items-center">
                    <AlertTriangle className="h-16 w-16 text-black mb-4" strokeWidth={1.5}/>
                    <p className="font-bold text-lg">¿Estás seguro?</p>
                    <p className="text-muted-foreground">El proyecto/actividad será eliminado</p>
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
    const isMissingData = project.missingData;

    const formatMonthYear = (dateString: string) => {
        if (!dateString) return '';
        const [year, month] = dateString.split('-');
        const date = new Date(Number(year), Number(month) - 1);
        return date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    }

    const displayDate = project.startDate && project.endDate
        ? `${formatMonthYear(project.startDate)} - ${formatMonthYear(project.endDate)}`
        : project.years?.join(', ');

    const handleGoToDetails = () => {
        localStorage.setItem('selectedProject', JSON.stringify(project));
    };

    const cardContent = (
         <Card className={`w-full h-full flex flex-col shadow-md rounded-lg hover:shadow-xl transition-shadow duration-300 ${isMissingData ? 'bg-[#FEE9E7]' : 'bg-white'}`}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-2">
                    <Folder className="w-6 h-6 text-[#008ED2]" />
                    <div className="flex flex-col">
                        <h3 className="font-bold text-black">{project.name}</h3>
                        <p className="text-xs text-[#ADADAD]">{project.type}</p>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild disabled={project.missingData}>
                            <Link href={project.missingData ? '#' : '/poi/detalles'} onClick={handleGoToDetails}>Ir a proyecto / Actividad</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onEdit}>Editar POI</DropdownMenuItem>
                        <DropdownMenuItem onClick={onDelete} className="text-red-600">Eliminar POI</DropdownMenuItem>
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
                    <span>{displayDate}</span>
                </div>
                 <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-[#272E35]" />
                    <span className="font-semibold">Scrum Master:</span>
                    <span>{project.scrumMaster}</span>
                </div>
            </CardContent>
        </Card>
    );

    if (isMissingData) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                       <div className="h-full cursor-pointer" onClick={onEdit}>{cardContent}</div>
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

const navItems = [
  { label: "PGD", icon: FileText, href: "/pmo-dashboard" },
  { label: "POI", icon: Target, href: "/poi" },
  { label: "RECURSOS HUMANOS", icon: Users, href: "/recursos-humanos" },
  { label: "DASHBOARD", icon: BarChart, href: "/dashboard" },
  { label: "NOTIFICACIONES", icon: Bell, href: "/notificaciones" },
];


export default function PoiPage() {
  const [projects, setProjects] = React.useState<Project[]>(initialProjects);
  const [isPoiModalOpen, setIsPoiModalOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<Partial<Project> | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [deletingProject, setDeletingProject] = React.useState<Project | null>(null);
  const [selectedType, setSelectedType] = React.useState<string>("Proyecto");


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
          setProjects(projects.map(p => p.id === projectData.id ? {...p, ...projectData } : p));
      } else {
          setProjects([...projects, { ...projectData, id: Date.now().toString() }]);
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

  const filteredProjects = projects.filter(p => p.type === selectedType);
  const sectionTitle = selectedType === "Proyecto" ? "Proyectos" : "Lista";
  const SectionIcon = selectedType === "Proyecto" ? Folder : List;


  return (
    <AppLayout
      navItems={navItems}
      breadcrumbs={[
        { label: "POI" },
      ]}
    >
      <div className="bg-[#D5D5D5] border-y border-[#1A5581] w-full">
        <div className="p-2 flex items-center justify-between w-full">
          <h2 className="font-bold text-black pl-2">
            PLAN OPERATIVO INFORMÁTICO (POI)
          </h2>
          <div className="flex items-center gap-2">
            <Button onClick={() => handleOpenPoiModal()} style={{ backgroundColor: "#018CD1", color: "white" }}>
              <Plus className="mr-2 h-4 w-4" /> NUEVO POI
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-[#F9F9F9] p-6">
        <div className="flex items-center mb-4 gap-4">
            <Button size="sm" className="bg-[#018CD1] text-white">POI</Button>
            <Button size="sm" variant="outline" className="bg-white text-black border-gray-300">REPORTE POI</Button>
        </div>
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
                <label className="text-sm">Tipo</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {filteredProjects.map(p => (
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
