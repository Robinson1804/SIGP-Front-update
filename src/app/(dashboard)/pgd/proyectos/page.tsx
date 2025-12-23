
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
  Trash2,
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
import { Checkbox } from "@/components/ui/checkbox";
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
  type CostoAnual,
} from "@/features/proyectos/services/proyectos.service";
import type { Proyecto } from "@/lib/definitions";

const availableYears = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

// Areas disponibles para selección
const AREAS_DISPONIBLES = [
  "Oficina de Tecnologías de la Información (OTIN)",
  "Oficina de Administración y Finanzas",
  "Oficina de Planificación y Presupuesto",
  "Oficina de Gestión Documental (OGD)",
  "Oficina de Formación Ciudadana e Identidad",
  "Oficina de Recursos Humanos",
];

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

  // Estados para listas dinámicas
  const [newAlcance, setNewAlcance] = useState('');
  const [newBeneficio, setNewBeneficio] = useState('');
  const [newCostoAnio, setNewCostoAnio] = useState<string>('');
  const [newCostoMonto, setNewCostoMonto] = useState<string>('');

  useEffect(() => {
    if (project) {
      const proyectoAny = project as any;
      setFormData({
        codigo: project.codigo,
        nombre: project.nombre,
        descripcion: project.descripcion || '',
        clasificacion: project.clasificacion as 'Al ciudadano' | 'Gestion interna',
        accionEstrategicaId: project.accionEstrategicaId || undefined,
        areaResponsable: proyectoAny.areaResponsable || '',
        areasFinancieras: proyectoAny.areasFinancieras || [],
        costosAnuales: proyectoAny.costosAnuales || [],
        alcances: proyectoAny.alcances || [],
        problematica: proyectoAny.problematica || '',
        beneficiarios: proyectoAny.beneficiarios || '',
        beneficios: proyectoAny.beneficios || [],
      });
    } else {
      setFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
        clasificacion: undefined,
        accionEstrategicaId: undefined,
        areaResponsable: '',
        areasFinancieras: [],
        costosAnuales: [],
        alcances: [],
        problematica: '',
        beneficiarios: '',
        beneficios: [],
      });
    }
    setErrors({});
    setNewAlcance('');
    setNewBeneficio('');
    setNewCostoAnio('');
    setNewCostoMonto('');
  }, [project, isOpen]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.codigo) newErrors.codigo = "El codigo es requerido.";
    if (!formData.nombre) newErrors.nombre = "El nombre es requerido.";
    if (!formData.accionEstrategicaId) newErrors.accionEstrategicaId = "La accion estrategica es requerida.";
    if (!formData.clasificacion) newErrors.clasificacion = "El tipo de proyecto es requerido.";
    if (!formData.areaResponsable) newErrors.areaResponsable = "El area responsable es requerida.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    // Blur ANTES de la operación asíncrona para evitar aria-hidden issues
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    setIsSaving(true);
    try {
      await onSave(formData as CreateProyectoData, !!project, project?.id);
      setTimeout(() => {
        onClose();
      }, 0);
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Funciones para manejar alcances
  const addAlcance = () => {
    if (newAlcance.trim()) {
      setFormData(p => ({
        ...p,
        alcances: [...(p.alcances || []), newAlcance.trim()]
      }));
      setNewAlcance('');
    }
  };

  const removeAlcance = (index: number) => {
    setFormData(p => ({
      ...p,
      alcances: (p.alcances || []).filter((_, i) => i !== index)
    }));
  };

  // Funciones para manejar beneficios
  const addBeneficio = () => {
    if (newBeneficio.trim()) {
      setFormData(p => ({
        ...p,
        beneficios: [...(p.beneficios || []), newBeneficio.trim()]
      }));
      setNewBeneficio('');
    }
  };

  const removeBeneficio = (index: number) => {
    setFormData(p => ({
      ...p,
      beneficios: (p.beneficios || []).filter((_, i) => i !== index)
    }));
  };

  // Funciones para manejar costos anuales
  const addCostoAnual = () => {
    if (newCostoAnio && newCostoMonto) {
      const anio = parseInt(newCostoAnio);
      const monto = parseFloat(newCostoMonto);
      if (!isNaN(anio) && !isNaN(monto)) {
        setFormData(p => ({
          ...p,
          costosAnuales: [...(p.costosAnuales || []), { anio, monto }]
        }));
        setNewCostoAnio('');
        setNewCostoMonto('');
      }
    }
  };

  const removeCostoAnual = (index: number) => {
    setFormData(p => ({
      ...p,
      costosAnuales: (p.costosAnuales || []).filter((_, i) => i !== index)
    }));
  };

  // Calcular total de costos
  const totalCostos = (formData.costosAnuales || []).reduce((acc, c) => acc + c.monto, 0);

  // Manejar órganos que contribuyen (checkboxes)
  const toggleAreaFinanciera = (area: string) => {
    const current = formData.areasFinancieras || [];
    if (current.includes(area)) {
      setFormData(p => ({
        ...p,
        areasFinancieras: current.filter(a => a !== area)
      }));
    } else {
      setFormData(p => ({
        ...p,
        areasFinancieras: [...current, area]
      }));
    }
  };

  // Obtener info del AE seleccionado para mostrar OEI/OGD
  const selectedAE = accionesEstrategicas.find(ae => ae.id === formData.accionEstrategicaId);

  const isEditMode = !!project;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Blur inmediatamente y usar setTimeout para evitar el error de aria-hidden
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      // Pequeño delay para permitir que el blur se procese
      setTimeout(() => {
        onClose();
      }, 0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-2xl p-0"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between">
          <DialogTitle>{isEditMode ? 'EDITAR' : 'REGISTRAR'} PROYECTO</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Código y Nombre */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Codigo *</label>
              <Input
                placeholder="Ej: PRY-001"
                value={formData.codigo || ''}
                onChange={e => setFormData(p => ({ ...p, codigo: e.target.value }))}
                className={errors.codigo ? 'border-red-500' : ''}
              />
              {errors.codigo && <p className="text-red-500 text-xs mt-1">{errors.codigo}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Nombre *</label>
              <Input
                placeholder="Nombre del proyecto"
                value={formData.nombre || ''}
                onChange={e => setFormData(p => ({ ...p, nombre: e.target.value }))}
                className={errors.nombre ? 'border-red-500' : ''}
              />
              {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
            </div>
          </div>

          {/* Sección: Alineamiento Estratégico */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-[#004272] mb-3">ALINEAMIENTO ESTRATEGICO</h3>
            <div>
              <label className="text-sm font-medium">Accion Estrategica *</label>
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
            {selectedAE && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
                <p><strong>OEI:</strong> {(selectedAE as any).oegd?.ogd?.oeis?.[0]?.codigo || 'N/A'} - {(selectedAE as any).oegd?.ogd?.oeis?.[0]?.nombre || 'Vinculado al PGD'}</p>
                <p><strong>OGD:</strong> {(selectedAE as any).oegd?.ogd?.codigo || 'N/A'} - {(selectedAE as any).oegd?.ogd?.nombre || 'Vinculado al PGD'}</p>
              </div>
            )}
          </div>

          {/* Sección: Responsables */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-[#004272] mb-3">RESPONSABLES</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Area Responsable *</label>
                <Select
                  value={formData.areaResponsable || ''}
                  onValueChange={(value) => setFormData(p => ({ ...p, areaResponsable: value }))}
                >
                  <SelectTrigger className={errors.areaResponsable ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar area" />
                  </SelectTrigger>
                  <SelectContent>
                    {AREAS_DISPONIBLES.map((area) => (
                      <SelectItem key={area} value={area}>{area}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.areaResponsable && <p className="text-red-500 text-xs mt-1">{errors.areaResponsable}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Tipo de Proyecto *</label>
                <Select
                  value={formData.clasificacion || ''}
                  onValueChange={(value) => setFormData(p => ({ ...p, clasificacion: value as 'Al ciudadano' | 'Gestion interna' }))}
                >
                  <SelectTrigger className={errors.clasificacion ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Al ciudadano">Al ciudadano</SelectItem>
                    <SelectItem value="Gestion interna">Gestion interna (Para Entidad)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.clasificacion && <p className="text-red-500 text-xs mt-1">{errors.clasificacion}</p>}
              </div>
            </div>
            <div className="mt-3">
              <label className="text-sm font-medium">Organos que Contribuyen</label>
              <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                {AREAS_DISPONIBLES.map((area) => (
                  <div key={area} className="flex items-center space-x-2">
                    <Checkbox
                      id={area}
                      checked={(formData.areasFinancieras || []).includes(area)}
                      onCheckedChange={() => toggleAreaFinanciera(area)}
                    />
                    <label htmlFor={area} className="text-sm cursor-pointer">{area}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sección: Alcance */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-[#004272] mb-3">ALCANCE</h3>
            <div className="space-y-2">
              {(formData.alcances || []).map((alcance, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                  <span className="text-sm flex-1">• {alcance}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAlcance(index)}>
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Descripcion del alcance..."
                  value={newAlcance}
                  onChange={e => setNewAlcance(e.target.value)}
                  className="flex-1"
                  rows={2}
                />
                <Button variant="outline" onClick={addAlcance} className="self-end">
                  <Plus className="h-4 w-4 mr-1" /> Agregar
                </Button>
              </div>
            </div>
          </div>

          {/* Sección: Problemática */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-[#004272] mb-3">PROBLEMATICA IDENTIFICADA</h3>
            <Textarea
              placeholder="Descripcion de la problematica que el proyecto busca resolver..."
              value={formData.problematica || ''}
              onChange={e => setFormData(p => ({ ...p, problematica: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Sección: Beneficiarios */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-[#004272] mb-3">BENEFICIARIOS</h3>
            <Textarea
              placeholder="Ej: Todas las personas naturales y juridicas del pais"
              value={formData.beneficiarios || ''}
              onChange={e => setFormData(p => ({ ...p, beneficiarios: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Sección: Beneficios */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-[#004272] mb-3">BENEFICIOS</h3>
            <div className="space-y-2">
              {(formData.beneficios || []).map((beneficio, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                  <span className="text-sm flex-1">• {beneficio}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeBeneficio(index)}>
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Descripcion del beneficio..."
                  value={newBeneficio}
                  onChange={e => setNewBeneficio(e.target.value)}
                  className="flex-1"
                  rows={2}
                />
                <Button variant="outline" onClick={addBeneficio} className="self-end">
                  <Plus className="h-4 w-4 mr-1" /> Agregar
                </Button>
              </div>
            </div>
          </div>

          {/* Sección: Costos por Año */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-[#004272] mb-3">COSTO ESTIMADO POR AÑOS</h3>
            <div className="space-y-2">
              {(formData.costosAnuales || []).length > 0 && (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left">Año</th>
                        <th className="px-3 py-2 text-right">Monto (S/)</th>
                        <th className="px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formData.costosAnuales || []).map((costo, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2">{costo.anio}</td>
                          <td className="px-3 py-2 text-right">{costo.monto.toLocaleString()}</td>
                          <td className="px-3 py-2">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeCostoAnual(index)}>
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t bg-gray-50 font-semibold">
                        <td className="px-3 py-2">TOTAL</td>
                        <td className="px-3 py-2 text-right">S/ {totalCostos.toLocaleString()}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Año</label>
                  <Select value={newCostoAnio} onValueChange={setNewCostoAnio}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar año" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Monto (S/)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newCostoMonto}
                    onChange={e => setNewCostoMonto(e.target.value)}
                  />
                </div>
                <Button variant="outline" onClick={addCostoAnual}>
                  <Plus className="h-4 w-4 mr-1" /> Agregar
                </Button>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="px-6 pb-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)} style={{ borderColor: '#CFD6DD', color: 'black' }}>
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
      // Pequeño delay para permitir que el blur se procese
      setTimeout(() => {
        onClose();
      }, 0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md p-0"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
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

function ViewProjectModal({
  isOpen,
  onClose,
  project,
  accionEstrategica,
  onEdit,
}: {
  isOpen: boolean;
  onClose: () => void;
  project: Proyecto | null;
  accionEstrategica?: AccionEstrategica;
  onEdit: () => void;
}) {
  if (!isOpen || !project) return null;

  const proyectoAny = project as any;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      setTimeout(() => {
        onClose();
      }, 0);
    }
  };

  const handleEditClick = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setTimeout(() => {
      onClose();
      onEdit();
    }, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-2xl p-0 max-h-[90vh] overflow-hidden flex flex-col"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between shrink-0">
          <DialogTitle>DETALLE DEL PROYECTO</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Informacion General */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Codigo</label>
                <p className="text-lg font-semibold">{project.codigo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Estado</label>
                <Badge className={`${statusColors[project.estado || 'Pendiente']} text-black ml-2`}>
                  {project.estado || 'Pendiente'}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Nombre</label>
              <p className="text-lg">{project.nombre}</p>
            </div>
            {project.descripcion && (
              <div>
                <label className="text-sm font-medium text-gray-500">Descripcion</label>
                <p className="text-gray-700">{project.descripcion}</p>
              </div>
            )}
          </div>

          {/* Alineamiento Estrategico */}
          <div className="border-t pt-4">
            <h3 className="font-bold text-[#004272] mb-3">ALINEAMIENTO ESTRATEGICO</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Accion Estrategica</label>
                <p>{accionEstrategica ? `${accionEstrategica.codigo} - ${accionEstrategica.nombre}` : '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Clasificacion</label>
                <p>{project.clasificacion || '-'}</p>
              </div>
            </div>
          </div>

          {/* Responsables */}
          <div className="border-t pt-4">
            <h3 className="font-bold text-[#004272] mb-3">RESPONSABLES</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Area Responsable</label>
                <p>{proyectoAny.areaResponsable || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Coordinacion</label>
                <p>{proyectoAny.coordinacion || '-'}</p>
              </div>
            </div>
            {proyectoAny.areasFinancieras && proyectoAny.areasFinancieras.length > 0 && (
              <div className="mt-3">
                <label className="text-sm font-medium text-gray-500">Organos que Contribuyen</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {proyectoAny.areasFinancieras.map((area: string, i: number) => (
                    <Badge key={i} variant="secondary">{area}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Alcances */}
          {proyectoAny.alcances && proyectoAny.alcances.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-bold text-[#004272] mb-3">ALCANCE</h3>
              <ul className="list-disc list-inside space-y-1">
                {proyectoAny.alcances.map((alcance: string, i: number) => (
                  <li key={i} className="text-gray-700">{alcance}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Problematica */}
          {proyectoAny.problematica && (
            <div className="border-t pt-4">
              <h3 className="font-bold text-[#004272] mb-3">PROBLEMATICA IDENTIFICADA</h3>
              <p className="text-gray-700">{proyectoAny.problematica}</p>
            </div>
          )}

          {/* Beneficiarios */}
          {proyectoAny.beneficiarios && (
            <div className="border-t pt-4">
              <h3 className="font-bold text-[#004272] mb-3">BENEFICIARIOS</h3>
              <p className="text-gray-700">{proyectoAny.beneficiarios}</p>
            </div>
          )}

          {/* Beneficios */}
          {proyectoAny.beneficios && proyectoAny.beneficios.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-bold text-[#004272] mb-3">BENEFICIOS</h3>
              <ul className="list-disc list-inside space-y-1">
                {proyectoAny.beneficios.map((beneficio: string, i: number) => (
                  <li key={i} className="text-gray-700">{beneficio}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Costos */}
          {proyectoAny.costosAnuales && proyectoAny.costosAnuales.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-bold text-[#004272] mb-3">COSTO ESTIMADO POR AÑOS</h3>
              <div className="grid grid-cols-3 gap-4">
                {proyectoAny.costosAnuales.map((costo: { anio: number; monto: number }, i: number) => (
                  <div key={i} className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-500">Año {costo.anio}</p>
                    <p className="font-semibold">S/ {costo.monto.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)} style={{ borderColor: '#CFD6DD', color: 'black' }}>
            Cerrar
          </Button>
          <Button onClick={handleEditClick} style={{ backgroundColor: '#018CD1', color: 'white' }}>
            Editar
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
  onView,
  accionEstrategica,
}: {
  project: Proyecto;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
  accionEstrategica?: AccionEstrategica;
}) => {
  const displayYears = project.anios?.join(', ') || '';

  const handleCardClick = (e: React.MouseEvent) => {
    // Evitar que el click se propague si se hizo click en el menu
    const target = e.target as HTMLElement;
    if (target.closest('[data-radix-dropdown-menu-trigger]') || target.closest('[role="menu"]')) {
      return;
    }
    onView();
  };

  return (
    <Card
      className="w-full h-full flex flex-col shadow-md rounded-lg bg-white hover:shadow-xl transition-shadow duration-300 cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex items-center gap-2">
          <Folder className="w-6 h-6 text-[#008ED2]" />
          <div className="flex flex-col">
            <h3 className="font-bold text-black">{project.nombre}</h3>
            <p className="text-sm text-[#ADADAD]">{project.codigo}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild data-radix-dropdown-menu-trigger>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => {
              // Delay más largo para permitir que el dropdown se cierre completamente
              setTimeout(() => onEdit(), 100);
            }}>Editar</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => {
              setTimeout(() => onDelete(), 100);
            }} className="text-red-600">Eliminar</DropdownMenuItem>
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
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingProject, setViewingProject] = useState<Proyecto | null>(null);

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

  const handleOpenViewModal = (project: Proyecto) => {
    setViewingProject(project);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewingProject(null);
  };

  const handleSaveProject = async (data: CreateProyectoData, isEdit: boolean, id?: number) => {
    try {
      if (isEdit && id) {
        // Excluir 'codigo' del payload para update (el backend no lo acepta)
        const { codigo, ...updateData } = data;
        await updateProyecto(id, updateData);
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
                    onView={() => handleOpenViewModal(p)}
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

        <ViewProjectModal
          isOpen={isViewModalOpen}
          onClose={handleCloseViewModal}
          project={viewingProject}
          accionEstrategica={viewingProject ? getAeForProject(viewingProject) : undefined}
          onEdit={() => {
            if (viewingProject) {
              handleOpenPoiModal(viewingProject);
            }
          }}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}
