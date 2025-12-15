"use client";

import React from "react";
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
import { X, Plus, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


const availableYears = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

// Opciones predefinidas
const financialAreaOptions: MultiSelectOption[] = [
    { label: 'OTIN', value: 'OTIN' },
    { label: 'DCNC', value: 'DCNC' },
    { label: 'OTA', value: 'OTA' },
    { label: 'DTI', value: 'DTI' },
];

const responsibleOptions: MultiSelectOption[] = [
    { label: 'Angella Trujillo', value: 'Angella Trujillo' },
    { label: 'Anayeli Monzon', value: 'Anayeli Monzon' },
    { label: 'Ana Garcia', value: 'Ana Garcia' },
    { label: 'Carlos Ruiz', value: 'Carlos Ruiz' },
    { label: 'Mario Casas', value: 'Mario Casas' },
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
                                <SelectItem value="Gestión interna">Gestión interna</SelectItem>
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
 * Modal completo para módulo POI (con todos los campos)
 * Usa una vista de "pantallas" en lugar de modales anidados para evitar problemas
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
    // Vista actual: 'main' o 'subproject'
    const [currentView, setCurrentView] = React.useState<'main' | 'subproject'>('main');
    const [formData, setFormData] = React.useState<Partial<Project>>({});
    const [errors, setErrors] = React.useState<{[key: string]: string}>({});
    const [subProjects, setSubProjects] = React.useState<SubProject[]>([]);
    const [editingSubProject, setEditingSubProject] = React.useState<SubProject | null>(null);
    const [subProjectForm, setSubProjectForm] = React.useState<Partial<SubProject>>({});
    const [subProjectErrors, setSubProjectErrors] = React.useState<{[key: string]: string}>({});

    // Inicializar formulario cuando se abre el modal
    React.useEffect(() => {
        if (isOpen) {
            if (project) {
                const managementMethod = project.managementMethod ||
                    (project.type === 'Proyecto' ? 'Scrum' : project.type === 'Actividad' ? 'Kanban' : '');
                setFormData({ ...project, managementMethod });
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
                });
                setSubProjects([]);
            }
            setErrors({});
            setCurrentView('main');
            setEditingSubProject(null);
            setSubProjectForm({});
            setSubProjectErrors({});
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

    const handleSave = () => {
        if (!validate()) return;

        const projectToSave: Project = {
            ...formData as Project,
            id: formData.id || Date.now().toString(),
            scrumMaster: formData.scrumMaster || '',
            subProjects: subProjects,
        };

        onSave(projectToSave);
        onClose();
    }

    const handleCancel = () => {
        onClose();
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

    const isEditMode = !!project?.id;
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
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCancel(); }}>
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
                                        <label className="text-sm font-medium">Clasificación *</label>
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
                                        <label className="text-sm font-medium">Estado *</label>
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
                                       <Input placeholder="Ingresar coordinador" value={formData.coordinator || ''} onChange={e => setFormData(p => ({...p, coordinator: e.target.value}))} />
                                    </div>
                                    <div>
                                       <label className="text-sm font-medium">Gestor/Scrum Master</label>
                                       <Input placeholder="Ingresar scrum master" value={formData.scrumMaster || ''} onChange={e => setFormData(p => ({...p, scrumMaster: e.target.value}))} />
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
                                                type="month"
                                                value={formData.startDate || ''}
                                                onChange={e => setFormData(p => ({...p, startDate: e.target.value}))}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Fecha fin</label>
                                            <Input
                                                type="month"
                                                value={formData.endDate || ''}
                                                onChange={e => setFormData(p => ({...p, endDate: e.target.value}))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="px-6 pb-6 flex justify-end gap-2">
                             <Button type="button" variant="outline" onClick={handleCancel} style={{borderColor: '#CFD6DD', color: 'black'}}>Cancelar</Button>
                             <Button type="button" onClick={handleSave} style={{backgroundColor: '#018CD1', color: 'white'}}>Guardar</Button>
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
                                <Input
                                    placeholder="Ingresar gestor/scrum master"
                                    value={subProjectForm.scrumMaster || ''}
                                    onChange={(e) => {
                                        setSubProjectForm(p => ({ ...p, scrumMaster: e.target.value }));
                                        if (subProjectErrors.scrumMaster) setSubProjectErrors(prev => ({...prev, scrumMaster: ''}));
                                    }}
                                    className={subProjectErrors.scrumMaster ? 'border-red-500' : ''}
                                />
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
