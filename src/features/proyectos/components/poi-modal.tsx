"use client";

import React, { useEffect, useState, useCallback } from "react";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import { type Project, type SubProject } from "@/lib/definitions";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/lib/hooks/use-toast";

// Services
import {
  createProyecto,
  updateProyecto,
  type CreateProyectoData,
  type UpdateProyectoData
} from "../services/proyectos.service";
import {
  getAccionesEstrategicas,
  type AccionEstrategica
} from "@/features/planning";
import {
  getCoordinadores,
  getScrumMasters,
  getResponsables,
  type Usuario,
  formatUsuarioNombre,
} from "@/lib/services";

const availableYears = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

// Opciones predefinidas para áreas financieras
const financialAreaOptions: MultiSelectOption[] = [
    { label: 'OTIN', value: 'OTIN' },
    { label: 'DCNC', value: 'DCNC' },
    { label: 'OTA', value: 'OTA' },
    { label: 'DTI', value: 'DTI' },
];

const yearOptions: MultiSelectOption[] = availableYears.map(y => ({ label: y.toString(), value: y.toString() }));

/**
 * Modal simple para PGD/Proyectos (campos básicos)
 */
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

    React.useEffect(() => {
        if (isOpen) {
            if (project) {
                const managementMethod = project.managementMethod ||
                    (project.type === 'Proyecto' ? 'Scrum' : project.type === 'Actividad' ? 'Kanban' : '');
                setFormData({ ...project, managementMethod });
            } else {
                setFormData({
                    id: '',
                    name: '',
                    description: '',
                    type: undefined,
                    classification: undefined,
                    status: 'Pendiente',
                    scrumMaster: '',
                    annualAmount: 0,
                    strategicAction: '',
                    years: [],
                    managementMethod: '',
                });
            }
            setErrors({});
        }
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
        if (!formData.years || formData.years.length === 0) newErrors.years = "El año es requerido.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const handleSave = () => {
        if (!validate()) return;
        onSave({ ...formData as Project, scrumMaster: formData.scrumMaster || '' });
        onClose();
    }

    const handleCancel = () => {
        onClose();
    };

    const isEditMode = !!project?.id;

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCancel(); }}>
            <DialogContent className="sm:max-w-lg p-0" showCloseButton={false}>
                <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between">
                    <DialogTitle>{isEditMode ? 'EDITAR' : 'REGISTRAR'} PLAN OPERATIVO INFORMÁTICO (POI)</DialogTitle>
                    <Button type="button" variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" onClick={handleCancel}>
                        <X className="h-4 w-4" />
                    </Button>
                </DialogHeader>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label>Tipo (Proyecto/Actividad) *</label>
                        <Select value={formData.type} onValueChange={(value) => {
                            const type = value as Project['type'];
                            const managementMethod = type === 'Proyecto' ? 'Scrum' : 'Kanban';
                            setFormData(p => ({...p, type, managementMethod}));
                        }}>
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
                                <SelectItem value="AE N°3">AE N°3</SelectItem>
                                <SelectItem value="AE N°4">AE N°4</SelectItem>
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
                                <SelectItem value="Gestion interna">Gestión interna</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.classification && <p className="text-red-500 text-xs mt-1"> {errors.classification}</p>}
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
                     <div>
                        <label>Año *</label>
                        <MultiSelect
                            options={yearOptions}
                            selected={formData.years || []}
                            onChange={(selected) => setFormData(p => ({...p, years: selected}))}
                            className={errors.years ? 'border-red-500' : ''}
                            placeholder="Seleccionar año(s)"
                        />
                         {errors.years && <p className="text-red-500 text-xs mt-1">{errors.years}</p>}
                    </div>
                </div>
                <DialogFooter className="px-6 pb-6 flex justify-end gap-2">
                     <Button type="button" variant="outline" onClick={handleCancel} style={{borderColor: '#CFD6DD', color: 'black'}}>Cancelar</Button>
                     <Button type="button" onClick={handleSave} style={{backgroundColor: '#018CD1', color: 'white'}}>Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Genera un código de proyecto único
 */
function generateProyectoCodigo(tipo: 'Proyecto' | 'Actividad'): string {
    const prefix = tipo === 'Proyecto' ? 'PROY' : 'ACT';
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
}

/**
 * Modal completo para módulo POI (con todos los campos)
 * Conectado con la API real
 */
export function POIFullModal({
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
    const { toast } = useToast();

    // Vista actual: 'main' o 'subproject'
    const [currentView, setCurrentView] = useState<'main' | 'subproject'>('main');
    const [formData, setFormData] = useState<Partial<Project> & { accionEstrategicaId?: number; coordinadorId?: number; scrumMasterId?: number }>({});
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [subProjects, setSubProjects] = useState<SubProject[]>([]);
    const [editingSubProject, setEditingSubProject] = useState<SubProject | null>(null);
    const [subProjectForm, setSubProjectForm] = useState<Partial<SubProject>>({});
    const [subProjectErrors, setSubProjectErrors] = useState<{[key: string]: string}>({});
    const [isSaving, setIsSaving] = useState(false);

    // Datos cargados desde la API
    const [accionesEstrategicas, setAccionesEstrategicas] = useState<AccionEstrategica[]>([]);
    const [coordinadores, setCoordinadores] = useState<Usuario[]>([]);
    const [scrumMasters, setScrumMasters] = useState<Usuario[]>([]);
    const [responsables, setResponsables] = useState<Usuario[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    // Cargar datos cuando se abre el modal
    const loadData = useCallback(async () => {
        setLoadingData(true);
        try {
            const [aes, coords, sms, resps] = await Promise.all([
                getAccionesEstrategicas().catch(() => []),
                getCoordinadores().catch(() => []),
                getScrumMasters().catch(() => []),
                getResponsables().catch(() => []),
            ]);
            setAccionesEstrategicas(aes);
            setCoordinadores(coords);
            setScrumMasters(sms);
            setResponsables(resps);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoadingData(false);
        }
    }, []);

    // Inicializar formulario cuando se abre el modal
    useEffect(() => {
        if (!isOpen) return;

        const initialize = async () => {
            // Primero cargar datos maestros (usuarios, acciones estratégicas)
            await loadData();

            // Luego setear el formulario con los datos del proyecto
            if (project) {
                const managementMethod = project.managementMethod ||
                    (project.type === 'Proyecto' ? 'Scrum' : project.type === 'Actividad' ? 'Kanban' : '');

                // Extraer IDs correctamente desde el proyecto
                const projectWithIds = project as Partial<Project> & {
                    accionEstrategicaId?: number;
                    coordinadorId?: number;
                    scrumMasterId?: number;
                    patrocinadorId?: number;
                };

                setFormData({
                    ...project,
                    managementMethod,
                    accionEstrategicaId: projectWithIds.accionEstrategicaId,
                    coordinadorId: projectWithIds.coordinadorId,
                    scrumMasterId: projectWithIds.scrumMasterId,
                });
                setSubProjects(project.subProjects || []);
            } else {
                setFormData({
                    id: '',
                    name: '',
                    description: '',
                    type: undefined,
                    classification: undefined,
                    status: 'Pendiente',
                    scrumMaster: '',
                    annualAmount: 0,
                    strategicAction: '',
                    years: [],
                    managementMethod: '',
                    financialArea: [],
                    responsibles: [],
                    coordination: '',
                    coordinator: '',
                    startDate: '',
                    endDate: '',
                    accionEstrategicaId: undefined,
                    coordinadorId: undefined,
                    scrumMasterId: undefined,
                });
                setSubProjects([]);
            }
            setErrors({});
            setCurrentView('main');
            setEditingSubProject(null);
            setSubProjectForm({});
            setSubProjectErrors({});
        };

        initialize();
    }, [project, isOpen, loadData]);

    // Convertir opciones de usuarios a MultiSelectOption
    const responsibleOptions: MultiSelectOption[] = responsables.map(u => ({
        label: formatUsuarioNombre(u),
        value: u.id.toString(),
    }));

    const validate = () => {
        const newErrors: {[key: string]: string} = {};
        if (!formData.type) newErrors.type = "El tipo es requerido.";
        if (!formData.name) newErrors.name = "El nombre es requerido.";
        if (!formData.description) newErrors.description = "La descripción es requerida.";
        if (!formData.accionEstrategicaId) newErrors.strategicAction = "La acción estratégica es requerida.";
        if (!formData.classification) newErrors.classification = "La clasificación es requerida.";
        if (!formData.annualAmount) newErrors.annualAmount = "El monto es requerido.";
        if (!formData.years || formData.years.length === 0) newErrors.years = "El año es requerido.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const validateSubProject = () => {
        const newErrors: {[key: string]: string} = {};
        if (!subProjectForm.name) newErrors.name = "El nombre es requerido.";
        if (!subProjectForm.description) newErrors.description = "La descripción es requerida.";
        if (!subProjectForm.scrumMaster) newErrors.scrumMaster = "El scrum master es requerido.";
        if (!subProjectForm.amount) newErrors.amount = "El monto es requerido.";
        if (!subProjectForm.years || subProjectForm.years.length === 0) newErrors.years = "El año es requerido.";

        setSubProjectErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        setIsSaving(true);

        try {
            const isEditMode = !!project?.id && project.id !== '';

            // Preparar datos base para la API
            // El frontend usa "Gestión interna" con tilde, el backend usa "Gestion interna" sin tilde
            const clasificacionValue = formData.classification === 'Al ciudadano'
                ? 'Al ciudadano' as const
                : formData.classification === 'Gestión interna'
                    ? 'Gestion interna' as const
                    : undefined;

            const baseData: UpdateProyectoData = {
                nombre: formData.name!,
                descripcion: formData.description,
                clasificacion: clasificacionValue,
                accionEstrategicaId: formData.accionEstrategicaId,
                coordinadorId: formData.coordinadorId,
                scrumMasterId: formData.scrumMasterId,
                coordinacion: formData.coordination,
                areasFinancieras: formData.financialArea,
                montoAnual: formData.annualAmount ? Number(formData.annualAmount) : undefined,
                anios: formData.years?.map(y => typeof y === 'string' ? parseInt(y, 10) : y),
                fechaInicio: formData.startDate || undefined,
                fechaFin: formData.endDate || undefined,
            };

            if (isEditMode) {
                // Para update, NO enviar codigo (el backend lo rechaza)
                await updateProyecto(project!.id!, baseData);
                toast({ title: 'Éxito', description: 'POI actualizado correctamente' });
            } else {
                // Para create, incluir codigo y nombre obligatorio
                const createData: CreateProyectoData = {
                    codigo: formData.code || generateProyectoCodigo(formData.type as 'Proyecto' | 'Actividad'),
                    nombre: formData.name!,
                    descripcion: baseData.descripcion,
                    clasificacion: baseData.clasificacion,
                    accionEstrategicaId: baseData.accionEstrategicaId,
                    coordinadorId: baseData.coordinadorId,
                    scrumMasterId: baseData.scrumMasterId,
                    coordinacion: baseData.coordinacion,
                    areasFinancieras: baseData.areasFinancieras,
                    montoAnual: baseData.montoAnual,
                    anios: baseData.anios,
                    fechaInicio: baseData.fechaInicio,
                    fechaFin: baseData.fechaFin,
                };
                await createProyecto(createData);
                toast({ title: 'Éxito', description: 'POI creado correctamente' });
            }

            // Crear objeto Project para callback
            const savedProject: Project = {
                ...formData as Project,
                id: formData.id || Date.now().toString(),
                scrumMaster: formData.scrumMaster || '',
                subProjects: subProjects,
            };

            onSave(savedProject);

            // Blur active element before closing
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
            onClose();
        } catch (error: unknown) {
            console.error('Error saving POI:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al guardar el POI';
            toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    }

    const handleCancel = () => {
        // Blur active element before closing
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        onClose();
    };

    // Handle dialog close with proper focus management
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
            onClose();
        }
    };

    // Subproyecto handlers
    const openSubProjectForm = (subProject?: SubProject) => {
        if (subProject) {
            setEditingSubProject(subProject);
            setSubProjectForm({ ...subProject });
        } else {
            setEditingSubProject(null);
            setSubProjectForm({
                id: '',
                name: '',
                description: '',
                responsible: [],
                scrumMaster: '',
                years: [],
                amount: 0,
                managementMethod: 'Scrum',
                financialArea: [],
            });
        }
        setSubProjectErrors({});
        setCurrentView('subproject');
    };

    const saveSubProject = () => {
        if (!validateSubProject()) return;

        if (editingSubProject) {
            setSubProjects(prev => prev.map(sp =>
                sp.id === editingSubProject.id ? { ...subProjectForm as SubProject, id: sp.id } : sp
            ));
        } else {
            setSubProjects(prev => [...prev, { ...subProjectForm as SubProject, id: `sp-${Date.now()}` }]);
        }
        setCurrentView('main');
        setEditingSubProject(null);
        setSubProjectForm({});
    };

    const cancelSubProject = () => {
        setCurrentView('main');
        setEditingSubProject(null);
        setSubProjectForm({});
        setSubProjectErrors({});
    };

    const deleteSubProject = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSubProjects(prev => prev.filter(sp => sp.id !== id));
    };

    const isEditMode = !!project?.id && project.id !== '';
    const isProyecto = formData.type === 'Proyecto';

    // Opciones de responsables y años para subproyecto
    const subResponsibleOptions: MultiSelectOption[] = (formData.responsibles && formData.responsibles.length > 0)
        ? formData.responsibles.map(r => ({ label: r, value: r }))
        : responsibleOptions;

    const subYearOptions: MultiSelectOption[] = (formData.years && formData.years.length > 0)
        ? formData.years.map(y => ({ label: y, value: y }))
        : yearOptions;

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-4xl p-0" showCloseButton={false}>
                {currentView === 'main' ? (
                    <>
                        <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between">
                            <DialogTitle>{isEditMode ? 'EDITAR' : 'REGISTRAR'} PLAN OPERATIVO INFORMÁTICO (POI)</DialogTitle>
                            <Button type="button" variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" onClick={handleCancel}>
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogHeader>
                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            {loadingData ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-[#018CD1]" />
                                    <span className="ml-2">Cargando datos...</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                    {/* Primera columna */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium">Tipo (Proyecto/Actividad) *</label>
                                            <Select value={formData.type} onValueChange={(value) => {
                                                const type = value as Project['type'];
                                                const managementMethod = type === 'Proyecto' ? 'Scrum' : 'Kanban';
                                                setFormData(p => ({...p, type, managementMethod}));
                                                if (type === 'Actividad') {
                                                    setSubProjects([]);
                                                }
                                            }}>
                                                <SelectTrigger className={errors.type ? 'border-red-500' : ''}><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Proyecto">Proyecto</SelectItem>
                                                    <SelectItem value="Actividad">Actividad</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
                                        </div>
                                        <div>
                                           <label className="text-sm font-medium">Nombre *</label>
                                           <Input placeholder="Ingresar nombre" value={formData.name || ''} onChange={e => {
                                               setFormData(p => ({...p, name: e.target.value}));
                                               if (errors.name) setErrors(prev => ({...prev, name: ''}));
                                           }} className={errors.name ? 'border-red-500' : ''} />
                                           {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                        </div>
                                         <div>
                                           <label className="text-sm font-medium">Descripción *</label>
                                           <Textarea
                                               placeholder="Ingresar descripción"
                                               value={formData.description || ''}
                                               onChange={e => {
                                                   setFormData(p => ({...p, description: e.target.value}));
                                                   if (errors.description) setErrors(prev => ({...prev, description: ''}));
                                               }}
                                               className={`min-h-[80px] ${errors.description ? 'border-red-500' : ''}`}
                                           />
                                           {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                                        </div>

                                        {/* Sección de subproyectos - solo para tipo Proyecto */}
                                        {isProyecto && (
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-sm font-medium">Agregar subproyectos</label>
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        className="h-8 w-8 bg-[#3B4466] hover:bg-[#2a3352]"
                                                        onClick={() => openSubProjectForm()}
                                                    >
                                                        <Plus className="h-4 w-4 font-bold" />
                                                    </Button>
                                                </div>
                                                {subProjects.length > 0 && (
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Subproyecto</TableHead>
                                                                <TableHead>Monto</TableHead>
                                                                <TableHead>Scrum Master</TableHead>
                                                                <TableHead className="w-10"></TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {subProjects.map((sp) => (
                                                                <TableRow
                                                                    key={sp.id}
                                                                    className="cursor-pointer hover:bg-gray-100"
                                                                    onClick={() => openSubProjectForm(sp)}
                                                                >
                                                                    <TableCell>{sp.name}</TableCell>
                                                                    <TableCell>S/ {sp.amount?.toLocaleString('es-PE')}</TableCell>
                                                                    <TableCell>{sp.scrumMaster}</TableCell>
                                                                    <TableCell>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                            onClick={(e) => deleteSubProject(sp.id, e)}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                )}
                                            </div>
                                        )}

                                        <div>
                                            <label className="text-sm font-medium">Acción Estratégica *</label>
                                            <Select
                                                value={formData.accionEstrategicaId?.toString() || ''}
                                                onValueChange={(value) => {
                                                    const ae = accionesEstrategicas.find(a => a.id.toString() === value);
                                                    setFormData(p => ({
                                                        ...p,
                                                        accionEstrategicaId: parseInt(value, 10),
                                                        strategicAction: ae ? `${ae.codigo} - ${ae.nombre}` : '',
                                                    }));
                                                    if (errors.strategicAction) setErrors(prev => ({...prev, strategicAction: ''}));
                                                }}
                                            >
                                                <SelectTrigger className={errors.strategicAction ? 'border-red-500' : ''}>
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
                                            {errors.strategicAction && <p className="text-red-500 text-xs mt-1">{errors.strategicAction}</p>}
                                        </div>
                                         <div>
                                            <label className="text-sm font-medium">Clasificación *</label>
                                            <Select value={formData.classification} onValueChange={(value) => setFormData(p => ({...p, classification: value as Project['classification']}))}>
                                                <SelectTrigger className={errors.classification ? 'border-red-500' : ''}><SelectValue placeholder="Seleccionar clasificación" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Al ciudadano">Al ciudadano</SelectItem>
                                                    <SelectItem value="Gestion interna">Gestión interna</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.classification && <p className="text-red-500 text-xs mt-1">{errors.classification}</p>}
                                        </div>
                                        <div>
                                           <label className="text-sm font-medium">Coordinación</label>
                                           <Input placeholder="Ingresar coordinación" value={formData.coordination || ''} onChange={e => setFormData(p => ({...p, coordination: e.target.value}))} />
                                        </div>
                                    </div>

                                    {/* Segunda columna */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium">Área Financiera</label>
                                            <MultiSelect
                                                options={financialAreaOptions}
                                                selected={formData.financialArea || []}
                                                onChange={(selected) => setFormData(p => ({...p, financialArea: selected}))}
                                                placeholder="Seleccionar área(s)"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Coordinador</label>
                                            <Select
                                                value={formData.coordinadorId?.toString() || ''}
                                                onValueChange={(value) => {
                                                    const coord = coordinadores.find(c => c.id.toString() === value);
                                                    setFormData(p => ({
                                                        ...p,
                                                        coordinadorId: parseInt(value, 10),
                                                        coordinator: coord ? formatUsuarioNombre(coord) : '',
                                                    }));
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar coordinador" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {coordinadores.map((coord) => (
                                                        <SelectItem key={coord.id} value={coord.id.toString()}>
                                                            {formatUsuarioNombre(coord)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Gestor/Scrum Master</label>
                                            <Select
                                                value={formData.scrumMasterId?.toString() || ''}
                                                onValueChange={(value) => {
                                                    const sm = scrumMasters.find(s => s.id.toString() === value);
                                                    setFormData(p => ({
                                                        ...p,
                                                        scrumMasterId: parseInt(value, 10),
                                                        scrumMaster: sm ? formatUsuarioNombre(sm) : '',
                                                    }));
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar scrum master" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {scrumMasters.map((sm) => (
                                                        <SelectItem key={sm.id} value={sm.id.toString()}>
                                                            {formatUsuarioNombre(sm)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Responsable</label>
                                            <MultiSelect
                                                options={responsibleOptions}
                                                selected={formData.responsibles || []}
                                                onChange={(selected) => setFormData(p => ({...p, responsibles: selected}))}
                                                placeholder="Seleccionar responsable(s)"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Año *</label>
                                            <MultiSelect
                                                options={yearOptions}
                                                selected={formData.years || []}
                                                onChange={(selected) => {
                                                    setFormData(p => ({...p, years: selected}));
                                                    if (errors.years) setErrors(prev => ({...prev, years: ''}));
                                                }}
                                                className={errors.years ? 'border-red-500' : ''}
                                                placeholder="Seleccionar año(s)"
                                            />
                                             {errors.years && <p className="text-red-500 text-xs mt-1">{errors.years}</p>}
                                        </div>
                                        <div>
                                           <label className="text-sm font-medium">Monto anual *</label>
                                           <Input
                                               type="number"
                                               placeholder="Ingresar monto"
                                               value={formData.annualAmount || ''}
                                               onChange={e => {
                                                   setFormData(p => ({...p, annualAmount: Number(e.target.value)}));
                                                   if (errors.annualAmount) setErrors(prev => ({...prev, annualAmount: ''}));
                                               }}
                                               className={errors.annualAmount ? 'border-red-500' : ''}
                                           />
                                            {errors.annualAmount && <p className="text-red-500 text-xs mt-1">{errors.annualAmount}</p>}
                                        </div>
                                        <div>
                                           <label className="text-sm font-medium">Método de gestión de proyecto</label>
                                           <Input
                                               value={formData.managementMethod || ''}
                                               readOnly
                                               className="bg-gray-100"
                                               placeholder="Se asigna automáticamente según el tipo"
                                           />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium">Fecha inicio</label>
                                                <Input
                                                    type="date"
                                                    value={formData.startDate || ''}
                                                    onChange={e => setFormData(p => ({...p, startDate: e.target.value}))}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium">Fecha fin</label>
                                                <Input
                                                    type="date"
                                                    value={formData.endDate || ''}
                                                    onChange={e => setFormData(p => ({...p, endDate: e.target.value}))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter className="px-6 pb-6 flex justify-end gap-2">
                             <Button type="button" variant="outline" onClick={handleCancel} style={{borderColor: '#CFD6DD', color: 'black'}} disabled={isSaving}>Cancelar</Button>
                             <Button type="button" onClick={handleSave} style={{backgroundColor: '#018CD1', color: 'white'}} disabled={isSaving || loadingData}>
                                 {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                 Guardar
                             </Button>
                        </DialogFooter>
                    </>
                ) : (
                    /* Vista de Subproyecto */
                    <>
                        <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between">
                            <DialogTitle>{editingSubProject ? 'EDITAR' : 'REGISTRAR'} SUBPROYECTO</DialogTitle>
                            <Button type="button" variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" onClick={cancelSubProject}>
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogHeader>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div>
                                <label className="text-sm font-medium">Nombre *</label>
                                <Input
                                    placeholder="Ingresar nombre"
                                    value={subProjectForm.name || ''}
                                    onChange={(e) => {
                                        setSubProjectForm(p => ({ ...p, name: e.target.value }));
                                        if (subProjectErrors.name) setSubProjectErrors(prev => ({...prev, name: ''}));
                                    }}
                                    className={subProjectErrors.name ? 'border-red-500' : ''}
                                />
                                {subProjectErrors.name && <p className="text-red-500 text-xs mt-1">{subProjectErrors.name}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium">Descripción *</label>
                                <Textarea
                                    placeholder="Ingresar descripción"
                                    value={subProjectForm.description || ''}
                                    onChange={(e) => {
                                        setSubProjectForm(p => ({ ...p, description: e.target.value }));
                                        if (subProjectErrors.description) setSubProjectErrors(prev => ({...prev, description: ''}));
                                    }}
                                    className={`min-h-[80px] ${subProjectErrors.description ? 'border-red-500' : ''}`}
                                />
                                {subProjectErrors.description && <p className="text-red-500 text-xs mt-1">{subProjectErrors.description}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium">Área Financiera</label>
                                <MultiSelect
                                    options={financialAreaOptions}
                                    selected={subProjectForm.financialArea || []}
                                    onChange={(selected) => setSubProjectForm(p => ({ ...p, financialArea: selected }))}
                                    placeholder="Seleccionar área(s)"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Responsable</label>
                                <MultiSelect
                                    options={subResponsibleOptions}
                                    selected={subProjectForm.responsible || []}
                                    onChange={(selected) => setSubProjectForm(p => ({ ...p, responsible: selected }))}
                                    placeholder="Seleccionar responsable(s)"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Gestor/Scrum Master *</label>
                                <Select
                                    value={subProjectForm.scrumMaster || ''}
                                    onValueChange={(value) => {
                                        setSubProjectForm(p => ({ ...p, scrumMaster: value }));
                                        if (subProjectErrors.scrumMaster) setSubProjectErrors(prev => ({...prev, scrumMaster: ''}));
                                    }}
                                >
                                    <SelectTrigger className={subProjectErrors.scrumMaster ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Seleccionar scrum master" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {scrumMasters.map((sm) => (
                                            <SelectItem key={sm.id} value={formatUsuarioNombre(sm)}>
                                                {formatUsuarioNombre(sm)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {subProjectErrors.scrumMaster && <p className="text-red-500 text-xs mt-1">{subProjectErrors.scrumMaster}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium">Año *</label>
                                <MultiSelect
                                    options={subYearOptions}
                                    selected={subProjectForm.years || []}
                                    onChange={(selected) => {
                                        setSubProjectForm(p => ({ ...p, years: selected }));
                                        if (subProjectErrors.years) setSubProjectErrors(prev => ({...prev, years: ''}));
                                    }}
                                    className={subProjectErrors.years ? 'border-red-500' : ''}
                                    placeholder="Seleccionar año(s)"
                                />
                                {subProjectErrors.years && <p className="text-red-500 text-xs mt-1">{subProjectErrors.years}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium">Monto anual *</label>
                                <Input
                                    type="number"
                                    placeholder="Ingresar monto anual"
                                    value={subProjectForm.amount || ''}
                                    onChange={(e) => {
                                        setSubProjectForm(p => ({ ...p, amount: Number(e.target.value) }));
                                        if (subProjectErrors.amount) setSubProjectErrors(prev => ({...prev, amount: ''}));
                                    }}
                                    className={subProjectErrors.amount ? 'border-red-500' : ''}
                                />
                                {subProjectErrors.amount && <p className="text-red-500 text-xs mt-1">{subProjectErrors.amount}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium">Método de Gestión del proyecto</label>
                                <Input
                                    value="Scrum"
                                    readOnly
                                    className="bg-gray-100"
                                />
                            </div>
                        </div>
                        <DialogFooter className="px-6 pb-6 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={cancelSubProject} style={{borderColor: '#CFD6DD', color: 'black'}}>Cancelar</Button>
                            <Button type="button" onClick={saveSubProject} style={{backgroundColor: '#018CD1', color: 'white'}}>Guardar</Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

/**
 * Modal de Subproyecto (exportado para uso externo)
 */
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
    if (isOpen) {
      if (subProject) {
        setFormData(subProject);
      } else {
        setFormData({
          id: '',
          name: '',
          description: '',
          responsible: [],
          scrumMaster: '',
          years: [],
          amount: 0,
          managementMethod: '',
        });
      }
    }
  }, [subProject, isOpen]);

  const handleSave = () => {
    onSave(formData as SubProject);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCancel(); }}>
      <DialogContent className="sm:max-w-lg p-0" showCloseButton={false}>
        <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between">
          <DialogTitle>{subProject ? 'Editar' : 'Agregar'} Subproyecto</DialogTitle>
          <Button type="button" variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label>Nombre *</label>
            <Input
              value={formData.name || ''}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div>
            <label>Descripción *</label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
            />
          </div>
          <div>
            <label>Scrum Master *</label>
            <Input
              value={formData.scrumMaster || ''}
              onChange={(e) => setFormData(p => ({ ...p, scrumMaster: e.target.value }))}
            />
          </div>
          <div>
            <label>Monto *</label>
            <Input
              type="number"
              value={formData.amount || ''}
              onChange={(e) => setFormData(p => ({ ...p, amount: Number(e.target.value) }))}
            />
          </div>
           <div>
            <label>Año *</label>
            <MultiSelect
                options={yearOptions}
                selected={formData.years || []}
                onChange={(selected) => setFormData(p => ({...p, years: selected}))}
                placeholder="Seleccionar año(s)"
            />
           </div>
        </div>
        <DialogFooter className="px-6 pb-6">
          <Button type="button" variant="outline" onClick={handleCancel}>Cancelar</Button>
          <Button type="button" onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
