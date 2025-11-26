
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
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import { type Project, type SubProject } from "@/lib/definitions";
import { X } from "lucide-react";


const availableYears = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

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
        if (project) {
            setFormData(project);
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
        if (!formData.years || formData.years.length === 0) newErrors.years = "El año es requerido.";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const handleSave = () => {
        if (!validate()) return;
        
        onSave({ ...formData as Project, scrumMaster: formData.scrumMaster || '' });
        onClose();
    }
    
    const yearOptions: MultiSelectOption[] = availableYears.map(y => ({ label: y.toString(), value: y.toString() }));

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
                     <Button variant="outline" onClick={onClose} style={{borderColor: '#CFD6DD', color: 'black'}}>Cancelar</Button>
                     <Button onClick={handleSave} style={{backgroundColor: '#018CD1', color: 'white'}}>Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

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
  }, [subProject, isOpen]);

  const handleSave = () => {
    onSave(formData as SubProject);
  };
  
   const yearOptions: MultiSelectOption[] = availableYears.map(y => ({ label: y.toString(), value: y.toString() }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0">
        <DialogHeader className="p-4 bg-[#004272] text-white">
          <DialogTitle>{subProject ? 'Editar' : 'Agregar'} Subproyecto</DialogTitle>
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
             <Select value={formData.scrumMaster} onValueChange={(value) => setFormData(p => ({...p, scrumMaster: value}))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar Scrum Master" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="Ana Pérez">Ana Pérez</SelectItem>
                    <SelectItem value="Mario Casas">Mario Casas</SelectItem>
                    <SelectItem value="Marco Polo">Marco Polo</SelectItem>
                </SelectContent>
            </Select>
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
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
