
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
  DollarSign,
  Link2,
  Link2Off,
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
import { usePGD } from "@/stores";

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
  nextCodigo,
  pgdAnioInicio,
  pgdAnioFin,
  isLinkedToPgd,
}: {
  isOpen: boolean;
  onClose: () => void;
  project: Proyecto | null;
  onSave: (data: CreateProyectoData, isEdit: boolean, id?: number) => Promise<void>;
  accionesEstrategicas: AccionEstrategica[];
  isLoading: boolean;
  nextCodigo: string;
  pgdAnioInicio: number;
  pgdAnioFin: number;
  isLinkedToPgd: boolean;
}) {
  const [formData, setFormData] = useState<Partial<CreateProyectoData>>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  // Estados para listas dinámicas
  const [newAlcance, setNewAlcance] = useState('');
  const [newBeneficio, setNewBeneficio] = useState('');
  const [newCostoAnio, setNewCostoAnio] = useState<string>('');
  const [newCostoMonto, setNewCostoMonto] = useState<string>('');

  // Generar opciones de años: si está vinculado a PGD usa ese rango, si no, rango libre (2020-2040)
  const yearOptions: MultiSelectOption[] = isLinkedToPgd
    ? Array.from(
        { length: pgdAnioFin - pgdAnioInicio + 1 },
        (_, i) => {
          const year = (pgdAnioInicio + i).toString();
          return { label: year, value: year };
        }
      )
    : Array.from(
        { length: 21 }, // 2020-2040 = 21 años
        (_, i) => {
          const year = (2020 + i).toString();
          return { label: year, value: year };
        }
      );

  useEffect(() => {
    if (project) {
      const proyectoAny = project as any;
      setFormData({
        codigo: project.codigo,
        nombre: project.nombre,
        descripcion: project.descripcion || '',
        clasificacion: project.clasificacion as 'Al ciudadano' | 'Gestion interna',
        accionEstrategicaId: project.accionEstrategicaId || undefined,
        // areaResponsable y coordinacion son el mismo campo - usar cualquiera que tenga valor
        areaResponsable: proyectoAny.areaResponsable || proyectoAny.coordinacion || '',
        areasFinancieras: proyectoAny.areasFinancieras || [],
        costosAnuales: proyectoAny.costosAnuales || [],
        anios: project.anios || [],
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
        anios: [],
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

    // Campos básicos obligatorios
    if (!formData.nombre) newErrors.nombre = "El nombre es requerido.";
    // Acción Estratégica solo es requerida si el proyecto está vinculado a un PGD
    if (isLinkedToPgd && !formData.accionEstrategicaId) {
      newErrors.accionEstrategicaId = "La accion estrategica es requerida.";
    }
    if (!formData.clasificacion) newErrors.clasificacion = "El tipo de proyecto es requerido.";
    if (!formData.areaResponsable) newErrors.areaResponsable = "El area responsable es requerida.";
    if (!formData.anios || formData.anios.length === 0) newErrors.anios = "Debe seleccionar al menos un año.";

    // Campos adicionales obligatorios para PMO
    if (!formData.areasFinancieras || formData.areasFinancieras.length === 0) {
      newErrors.areasFinancieras = "Debe seleccionar al menos un organo que contribuye.";
    }
    if (!formData.alcances || formData.alcances.length === 0) {
      newErrors.alcances = "Debe agregar al menos un alcance.";
    }
    if (!formData.problematica || formData.problematica.trim() === '') {
      newErrors.problematica = "La problematica es requerida.";
    }
    if (!formData.beneficiarios || formData.beneficiarios.trim() === '') {
      newErrors.beneficiarios = "Los beneficiarios son requeridos.";
    }
    if (!formData.beneficios || formData.beneficios.length === 0) {
      newErrors.beneficios = "Debe agregar al menos un beneficio.";
    }
    if (!formData.costosAnuales || formData.costosAnuales.length === 0) {
      newErrors.costosAnuales = "Debe agregar al menos un costo anual.";
    }

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
              <label className="text-sm font-medium">Codigo</label>
              <Input
                placeholder="Autogenerado"
                value={project ? project.codigo : nextCodigo}
                disabled={true}
                className="bg-muted font-medium"
              />
              <p className="text-xs text-muted-foreground mt-1">El codigo se genera automaticamente</p>
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
            {isLinkedToPgd ? (
              <>
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
                {selectedAE && (() => {
                  const ae = selectedAE as any;
                  const oegd = ae.oegd;
                  const ogd = oegd?.ogd;
                  const aei = oegd?.oegdAeis?.[0]?.aei;
                  const oei = aei?.oei;

                  return (
                    <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm space-y-1">
                      <p><strong>OEI:</strong> {oei?.codigo || 'N/A'} - {oei?.nombre || 'Sin OEI vinculado'}</p>
                      <p><strong>AEI:</strong> {aei?.codigo || 'N/A'} - {aei?.nombre || 'Sin AEI vinculada'}</p>
                      <p><strong>OGD:</strong> {ogd?.codigo || 'N/A'} - {ogd?.nombre || 'Sin OGD'}</p>
                      <p><strong>OEGD:</strong> {oegd?.codigo || 'N/A'} - {oegd?.nombre || 'Sin OEGD'}</p>
                    </div>
                  );
                })()}
              </>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Link2Off className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-700">Sin PGD asociado</span>
                </div>
                <p className="text-xs text-amber-600 mt-1">
                  Este proyecto no está vinculado a ningún PGD. Para asociarlo, utilice el botón &quot;Asociar&quot; en la sección &quot;No asociados a PGD&quot;.
                </p>
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
              <label className="text-sm font-medium">Organos que Contribuyen *</label>
              <div className={`mt-2 space-y-2 max-h-32 overflow-y-auto border rounded-md p-3 ${errors.areasFinancieras ? 'border-red-500' : ''}`}>
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
              {errors.areasFinancieras && <p className="text-red-500 text-xs mt-1">{errors.areasFinancieras}</p>}
            </div>
            <div className="mt-3">
              <label className="text-sm font-medium">Años del Proyecto *</label>
              {isLinkedToPgd ? (
                <p className="text-xs text-gray-500 mb-2">Rango del PGD: {pgdAnioInicio} - {pgdAnioFin}</p>
              ) : (
                <p className="text-xs text-amber-600 mb-2">Proyecto no vinculado a PGD - Selección de años libre (2020-2040)</p>
              )}
              <MultiSelect
                options={yearOptions}
                selected={(formData.anios || []).map(a => a.toString())}
                onChange={(selected) => {
                  const nuevosAnios = selected.map(s => parseInt(s, 10));
                  // Limpiar costos anuales de años que ya no están seleccionados
                  const costosActualizados = (formData.costosAnuales || []).filter(
                    c => nuevosAnios.includes(c.anio)
                  );
                  setFormData(p => ({
                    ...p,
                    anios: nuevosAnios,
                    costosAnuales: costosActualizados
                  }));
                  // Limpiar el selector de costo si el año seleccionado ya no está disponible
                  if (newCostoAnio && !nuevosAnios.includes(parseInt(newCostoAnio, 10))) {
                    setNewCostoAnio('');
                  }
                }}
                placeholder="Seleccionar año(s)"
                className={errors.anios ? 'border-red-500' : ''}
              />
              {errors.anios && <p className="text-red-500 text-xs mt-1">{errors.anios}</p>}
            </div>
          </div>

          {/* Sección: Alcance */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-[#004272] mb-3">ALCANCE *</h3>
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
                  className={`flex-1 ${errors.alcances ? 'border-red-500' : ''}`}
                  rows={2}
                />
                <Button variant="outline" onClick={addAlcance} className="self-end">
                  <Plus className="h-4 w-4 mr-1" /> Agregar
                </Button>
              </div>
              {errors.alcances && <p className="text-red-500 text-xs mt-1">{errors.alcances}</p>}
            </div>
          </div>

          {/* Sección: Problemática */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-[#004272] mb-3">PROBLEMATICA IDENTIFICADA *</h3>
            <Textarea
              placeholder="Descripcion de la problematica que el proyecto busca resolver..."
              value={formData.problematica || ''}
              onChange={e => setFormData(p => ({ ...p, problematica: e.target.value }))}
              className={errors.problematica ? 'border-red-500' : ''}
              rows={3}
            />
            {errors.problematica && <p className="text-red-500 text-xs mt-1">{errors.problematica}</p>}
          </div>

          {/* Sección: Beneficiarios */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-[#004272] mb-3">BENEFICIARIOS *</h3>
            <Textarea
              placeholder="Ej: Todas las personas naturales y juridicas del pais"
              value={formData.beneficiarios || ''}
              onChange={e => setFormData(p => ({ ...p, beneficiarios: e.target.value }))}
              className={errors.beneficiarios ? 'border-red-500' : ''}
              rows={2}
            />
            {errors.beneficiarios && <p className="text-red-500 text-xs mt-1">{errors.beneficiarios}</p>}
          </div>

          {/* Sección: Beneficios */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-[#004272] mb-3">BENEFICIOS *</h3>
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
                  className={`flex-1 ${errors.beneficios ? 'border-red-500' : ''}`}
                  rows={2}
                />
                <Button variant="outline" onClick={addBeneficio} className="self-end">
                  <Plus className="h-4 w-4 mr-1" /> Agregar
                </Button>
              </div>
              {errors.beneficios && <p className="text-red-500 text-xs mt-1">{errors.beneficios}</p>}
            </div>
          </div>

          {/* Sección: Costos por Año */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-[#004272] mb-3">COSTO ESTIMADO POR AÑOS *</h3>
            {(!formData.anios || formData.anios.length === 0) ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-700">
                Primero selecciona los años del proyecto en el campo "Años del Proyecto" para poder asignar costos.
              </div>
            ) : (
              <div className="space-y-2">
                {/* Años disponibles para asignar costo */}
                {(() => {
                  const aniosConCosto = (formData.costosAnuales || []).map(c => c.anio);
                  const aniosDisponibles = (formData.anios || []).filter(a => !aniosConCosto.includes(a)).sort((a, b) => a - b);
                  const todosAsignados = aniosDisponibles.length === 0 && (formData.anios || []).length > 0;

                  return (
                    <>
                      {(formData.costosAnuales || []).length > 0 && (
                        <div className={`border rounded-md overflow-hidden ${errors.costosAnuales ? 'border-red-500' : ''}`}>
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-3 py-2 text-left">Año</th>
                                <th className="px-3 py-2 text-right">Monto (S/)</th>
                                <th className="px-3 py-2 w-10"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {(formData.costosAnuales || []).sort((a, b) => a.anio - b.anio).map((costo, index) => (
                                <tr key={costo.anio} className="border-t">
                                  <td className="px-3 py-2">{costo.anio}</td>
                                  <td className="px-3 py-2 text-right">S/ {costo.monto.toLocaleString()}</td>
                                  <td className="px-3 py-2">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeCostoAnual(index)}>
                                      <X className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                              <tr className="border-t bg-blue-50 font-semibold">
                                <td className="px-3 py-2">MONTO TOTAL</td>
                                <td className="px-3 py-2 text-right text-[#004272]">S/ {totalCostos.toLocaleString()}</td>
                                <td></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                      {todosAsignados ? (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Todos los años seleccionados tienen costo asignado.
                        </div>
                      ) : (
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <label className="text-xs text-gray-500">Año (de los seleccionados)</label>
                            <Select value={newCostoAnio} onValueChange={setNewCostoAnio}>
                              <SelectTrigger className={errors.costosAnuales && (!formData.costosAnuales || formData.costosAnuales.length === 0) ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Seleccionar año" />
                              </SelectTrigger>
                              <SelectContent>
                                {aniosDisponibles.map(year => (
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
                              className={errors.costosAnuales && (!formData.costosAnuales || formData.costosAnuales.length === 0) ? 'border-red-500' : ''}
                            />
                          </div>
                          <Button variant="outline" onClick={addCostoAnual} disabled={!newCostoAnio}>
                            <Plus className="h-4 w-4 mr-1" /> Agregar
                          </Button>
                        </div>
                      )}
                    </>
                  );
                })()}
                {errors.costosAnuales && <p className="text-red-500 text-xs mt-1">{errors.costosAnuales}</p>}
              </div>
            )}
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
              <div className="grid grid-cols-3 gap-4 mb-4">
                {proyectoAny.costosAnuales
                  .sort((a: { anio: number }, b: { anio: number }) => a.anio - b.anio)
                  .map((costo: { anio: number; monto: number }, i: number) => (
                  <div key={i} className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-500">Año {costo.anio}</p>
                    <p className="font-semibold">S/ {costo.monto.toLocaleString()}</p>
                  </div>
                ))}
              </div>
              {/* Monto Total */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#004272]">MONTO TOTAL DEL PROYECTO</span>
                  <span className="text-xl font-bold text-[#004272]">
                    S/ {proyectoAny.costosAnuales
                      .reduce((acc: number, c: { monto: number }) => acc + c.monto, 0)
                      .toLocaleString()}
                  </span>
                </div>
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

// Modal para asociar un proyecto a un PGD
function AssociateProjectModal({
  isOpen,
  onClose,
  project,
  pgds,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  project: Proyecto | null;
  pgds: PGD[];
  onSave: (projectId: number, accionEstrategicaId: number) => Promise<void>;
}) {
  const [selectedPgdId, setSelectedPgdId] = useState<string>('');
  const [selectedAeId, setSelectedAeId] = useState<string>('');
  const [accionesDelPgd, setAccionesDelPgd] = useState<AccionEstrategica[]>([]);
  const [loadingAes, setLoadingAes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Validación de años del proyecto vs rango del PGD
  const selectedPgd = pgds.find(p => p.id.toString() === selectedPgdId);

  const yearValidation = React.useMemo(() => {
    if (!selectedPgd || !project?.anios || project.anios.length === 0) {
      return { isValid: true, invalidYears: [] as number[], message: '' };
    }

    const pgdStart = selectedPgd.anioInicio;
    const pgdEnd = selectedPgd.anioFin;
    const invalidYears = project.anios.filter(
      (year) => year < pgdStart || year > pgdEnd
    );

    if (invalidYears.length > 0) {
      return {
        isValid: false,
        invalidYears,
        message: `El proyecto tiene años (${invalidYears.join(', ')}) que están fuera del rango del PGD seleccionado (${pgdStart}-${pgdEnd}).`,
      };
    }

    return { isValid: true, invalidYears: [], message: '' };
  }, [selectedPgd, project?.anios]);

  // Reset cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setSelectedPgdId('');
      setSelectedAeId('');
      setAccionesDelPgd([]);
    }
  }, [isOpen]);

  // Cargar AEs cuando se selecciona un PGD
  useEffect(() => {
    const loadAEs = async () => {
      if (!selectedPgdId) {
        setAccionesDelPgd([]);
        setSelectedAeId('');
        return;
      }

      try {
        setLoadingAes(true);
        const data = await getAccionesEstrategicasByPGD(selectedPgdId);
        setAccionesDelPgd(data);
        setSelectedAeId(''); // Reset AE selection when PGD changes
      } catch (error) {
        console.error('Error loading AEs:', error);
        setAccionesDelPgd([]);
      } finally {
        setLoadingAes(false);
      }
    };
    loadAEs();
  }, [selectedPgdId]);

  const handleSave = async () => {
    if (!project || !selectedAeId) return;

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    setIsSaving(true);
    try {
      await onSave(project.id, parseInt(selectedAeId, 10));
      setTimeout(() => {
        onClose();
      }, 0);
    } catch (error) {
      console.error('Error associating project:', error);
    } finally {
      setIsSaving(false);
    }
  };

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

  const selectedAE = accionesDelPgd.find(ae => ae.id.toString() === selectedAeId);

  if (!isOpen || !project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-lg p-0"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between">
          <DialogTitle>ASOCIAR PROYECTO A PGD</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="p-6 space-y-4">
          {/* Info del proyecto */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Proyecto a asociar:</p>
            <p className="font-semibold">{project.codigo} - {project.nombre}</p>
          </div>

          {/* Aviso */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              Selecciona primero el PGD y luego la Accion Estrategica a la cual deseas vincular este proyecto.
            </p>
          </div>

          {/* Paso 1: Selector de PGD */}
          <div>
            <label className="text-sm font-medium">1. Seleccionar PGD *</label>
            <Select value={selectedPgdId} onValueChange={setSelectedPgdId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleccionar Plan de Gobierno Digital" />
              </SelectTrigger>
              <SelectContent>
                {pgds.map((pgd) => (
                  <SelectItem key={pgd.id} value={pgd.id.toString()}>
                    PGD {pgd.anioInicio} - {pgd.anioFin}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Advertencia: Años del proyecto fuera del rango del PGD */}
          {selectedPgdId && !yearValidation.isValid && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-300 rounded-lg">
              <X className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-semibold">No es posible asociar este proyecto</p>
                <p className="mt-1">{yearValidation.message}</p>
                {project?.anios && project.anios.length > 0 && (
                  <p className="mt-1 text-xs">
                    Años del proyecto: <strong>{project.anios.join(', ')}</strong>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Paso 2: Selector de Acción Estratégica - Solo mostrar si años son válidos */}
          {selectedPgdId && yearValidation.isValid && (
            <div>
              <label className="text-sm font-medium">2. Seleccionar Accion Estrategica *</label>
              {loadingAes ? (
                <div className="mt-1 p-3 border rounded-md flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando acciones estrategicas...
                </div>
              ) : accionesDelPgd.length === 0 ? (
                <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                  No hay Acciones Estrategicas registradas en este PGD. Primero registra las AEs en el modulo de Planning.
                </div>
              ) : (
                <Select value={selectedAeId} onValueChange={setSelectedAeId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccionar Accion Estrategica" />
                  </SelectTrigger>
                  <SelectContent>
                    {accionesDelPgd.map((ae) => (
                      <SelectItem key={ae.id} value={ae.id.toString()}>
                        {ae.codigo} - {ae.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Info de la vinculación seleccionada */}
          {selectedPgd && selectedAE && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm">
              <p className="font-medium text-green-800 flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                El proyecto quedara vinculado a:
              </p>
              <p className="mt-1"><strong>PGD:</strong> {selectedPgd.anioInicio} - {selectedPgd.anioFin}</p>
              <p><strong>AE:</strong> {selectedAE.codigo} - {selectedAE.nombre}</p>
              {(selectedAE as any).oegd?.ogd && (
                <p><strong>OGD:</strong> {(selectedAE as any).oegd.ogd.codigo || 'N/A'} - {(selectedAE as any).oegd.ogd.nombre || ''}</p>
              )}
            </div>
          )}
        </div>
        <DialogFooter className="px-6 pb-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)} style={{ borderColor: '#CFD6DD', color: 'black' }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            style={{ backgroundColor: '#018CD1', color: 'white' }}
            disabled={isSaving || !selectedPgdId || !selectedAeId || !yearValidation.isValid}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
            Asociar al PGD
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
  onAssociate,
  showAssociateButton,
}: {
  project: Proyecto;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
  accionEstrategica?: AccionEstrategica;
  onAssociate?: () => void;
  showAssociateButton?: boolean;
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
        <DropdownMenu modal={false}>
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
          {accionEstrategica ? (
            <span className="truncate">{accionEstrategica.codigo}</span>
          ) : (
            <span className="text-orange-500 flex items-center gap-1">
              <Link2Off className="w-3 h-3" />
              Sin vincular
            </span>
          )}
        </div>
        {/* Botón para asociar proyecto sin PGD */}
        {showAssociateButton && onAssociate && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
            onClick={(e) => {
              e.stopPropagation();
              onAssociate();
            }}
          >
            <Link2 className="w-4 h-4 mr-2" />
            Asociar a PGD
          </Button>
        )}
        {project.clasificacion && (
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-[#272E35]" />
            <span className="font-semibold">Clasificacion:</span>
            <span>{project.clasificacion}</span>
          </div>
        )}
        {/* Monto Total del Proyecto */}
        {(() => {
          const proyectoAny = project as any;
          const montoTotal = (proyectoAny.costosAnuales || []).reduce(
            (acc: number, c: { monto: number }) => acc + c.monto,
            0
          );
          return montoTotal > 0 ? (
            <div className="flex items-center gap-2 text-sm mt-1 pt-2 border-t">
              {/* <DollarSign className="w-4 h-4 text-[#004272]" /> */}
              <span className="font-semibold">Monto Total:</span>
              <span className="text-[#004272] font-bold">S/ {montoTotal.toLocaleString()}</span>
            </div>
          ) : null;
        })()}
      </CardContent>
    </Card>
  );
};

export default function PgdProyectosPage() {
  const { toast } = useToast();

  // Global PGD state from store
  const {
    selectedPGD,
    pgds,
    isLoading: loadingPgds,
    setSelectedPGD,
    initializePGD,
    setLoading: setLoadingPgds,
  } = usePGD();

  // Derived state
  const selectedPgdId = selectedPGD?.id?.toString() || '';

  // Acciones Estrategicas State
  const [accionesEstrategicas, setAccionesEstrategicas] = useState<AccionEstrategica[]>([]);
  const [loadingAEs, setLoadingAEs] = useState(false);

  // Projects State
  const [projects, setProjects] = useState<Proyecto[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [filteredProjects, setFilteredProjects] = useState<Proyecto[]>([]);
  const [allProjectsForCode, setAllProjectsForCode] = useState<Proyecto[]>([]); // Para calcular el próximo código

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
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterVinculacion, setFilterVinculacion] = useState<string>('vinculados'); // 'todos' | 'vinculados' | 'sin_pgd'

  // State para proyectos sin PGD
  const [unlinkedProjects, setUnlinkedProjects] = useState<Proyecto[]>([]);
  const [loadingUnlinked, setLoadingUnlinked] = useState(false);

  // Modal para asociar proyecto a PGD
  const [isAssociateModalOpen, setIsAssociateModalOpen] = useState(false);
  const [projectToAssociate, setProjectToAssociate] = useState<Proyecto | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Handle PGD selection change
  const handleSelectPgd = (pgdId: string) => {
    const pgd = pgds.find(p => p.id.toString() === pgdId);
    if (pgd) {
      setSelectedPGD(pgd);
    }
  };

  // Load PGDs on mount
  useEffect(() => {
    const loadPGDs = async () => {
      try {
        setLoadingPgds(true);
        const data = await getPGDs();
        initializePGD(data);
      } catch (error) {
        console.error('Error loading PGDs:', error);
        toast({ title: 'Error', description: 'Error al cargar los PGDs', variant: 'destructive' });
        setLoadingPgds(false);
      }
    };
    if (pgds.length === 0) {
      loadPGDs();
    }
  }, []);

  // Load all projects for next code calculation
  useEffect(() => {
    const loadAllProjectsForCode = async () => {
      try {
        const response = await getProyectos({ activo: true });
        setAllProjectsForCode(response.data || []);
      } catch (error) {
        console.error('Error loading projects for code:', error);
      }
    };
    loadAllProjectsForCode();
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

  // Load unlinked projects (projects without PGD association)
  useEffect(() => {
    const loadUnlinkedProjects = async () => {
      try {
        setLoadingUnlinked(true);
        const response = await getProyectos({ activo: true });
        const allProjects = response.data || [];
        // Filter projects without accionEstrategicaId (no PGD association)
        const unlinked = allProjects.filter(
          (p: Proyecto) => !p.accionEstrategicaId
        );
        setUnlinkedProjects(unlinked);
      } catch (error) {
        console.error('Error loading unlinked projects:', error);
        setUnlinkedProjects([]);
      } finally {
        setLoadingUnlinked(false);
      }
    };
    loadUnlinkedProjects();
  }, [projects]); // Reload when linked projects change

  // Obtener el PGD seleccionado para filtrar por rango de años
  const selectedPgdForFilter = pgds.find(p => p.id.toString() === selectedPgdId);

  // Apply filters
  useEffect(() => {
    // Determinar la fuente de datos según el filtro de vinculación
    let result: Proyecto[] = [];

    if (filterVinculacion === 'sin_pgd') {
      // Mostrar proyectos sin PGD asociado
      result = [...unlinkedProjects];
    } else if (filterVinculacion === 'todos') {
      // Mostrar todos los proyectos (vinculados + sin vincular)
      result = [...projects, ...unlinkedProjects];
    } else {
      // 'vinculados' - solo proyectos vinculados al PGD seleccionado
      // Mostrar TODOS los proyectos vinculados a las AEs del PGD, sin importar si tienen años o no
      result = [...projects];
    }

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

    // Filtrar por año específico (basado en costosAnuales o anios del proyecto)
    if (filterYear && filterYear !== 'all') {
      const yearNum = parseInt(filterYear, 10);
      result = result.filter(p => {
        // Verificar si el proyecto tiene costos para ese año
        const proyectoAny = p as any;
        if (proyectoAny.costosAnuales && proyectoAny.costosAnuales.length > 0) {
          return proyectoAny.costosAnuales.some((c: { anio: number }) => c.anio === yearNum);
        }
        // O verificar si tiene el año en anios
        if (p.anios && p.anios.length > 0) {
          return p.anios.includes(yearNum);
        }
        return false;
      });
    }

    setFilteredProjects(result);
    setCurrentPage(1);
  }, [projects, unlinkedProjects, searchTerm, filterClasificacion, filterYear, filterVinculacion, selectedPgdForFilter]);

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

  // Handlers para modal de asociación
  const handleOpenAssociateModal = (project: Proyecto) => {
    setProjectToAssociate(project);
    setIsAssociateModalOpen(true);
  };

  const handleCloseAssociateModal = () => {
    setIsAssociateModalOpen(false);
    setProjectToAssociate(null);
  };

  const handleAssociateProject = async (projectId: number, accionEstrategicaId: number) => {
    try {
      await updateProyecto(projectId, { accionEstrategicaId });
      toast({ title: 'Exito', description: 'Proyecto asociado al PGD correctamente' });

      // Reload projects
      const response = await getProyectos({ activo: true });
      const allProjects = response.data || [];
      setAllProjectsForCode(allProjects);

      // Actualizar proyectos vinculados
      const aeIds = accionesEstrategicas.map(ae => ae.id);
      const filtered = allProjects.filter(
        (p: Proyecto) => p.accionEstrategicaId && aeIds.includes(p.accionEstrategicaId)
      );
      setProjects(filtered);

      // Actualizar proyectos sin vincular
      const unlinked = allProjects.filter((p: Proyecto) => !p.accionEstrategicaId);
      setUnlinkedProjects(unlinked);
    } catch (error: unknown) {
      console.error('Error associating project:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al asociar el proyecto';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      throw error;
    }
  };

  const handleSaveProject = async (data: CreateProyectoData, isEdit: boolean, id?: number) => {
    try {
      // Excluir 'codigo' del payload (el backend lo genera automaticamente)
      const { codigo, ...dataWithoutCodigo } = data;

      // Calcular montoAnual como la suma de costosAnuales
      const montoTotal = (dataWithoutCodigo.costosAnuales || []).reduce(
        (acc, c) => acc + c.monto,
        0
      );

      // Agregar montoAnual calculado al payload
      // También mapear areaResponsable a coordinacion (son el mismo dato en POI)
      let dataConMontoTotal: Record<string, unknown> = {
        ...dataWithoutCodigo,
        montoAnual: montoTotal > 0 ? montoTotal : undefined,
        // areaResponsable y coordinacion son el mismo campo - sincronizar
        coordinacion: dataWithoutCodigo.areaResponsable || undefined,
      };

      // Si es edición, verificar si los años cambiaron y si las fechas existentes son válidas
      if (isEdit && id && editingProject) {
        const newAnios = data.anios || [];
        const oldFechaInicio = (editingProject as Record<string, unknown>).fechaInicio as string | undefined;
        const oldFechaFin = (editingProject as Record<string, unknown>).fechaFin as string | undefined;

        if (newAnios.length > 0 && (oldFechaInicio || oldFechaFin)) {
          const minAnio = Math.min(...newAnios);
          const maxAnio = Math.max(...newAnios);

          // Verificar si fechaInicio está fuera del rango de nuevos años
          if (oldFechaInicio) {
            const anioFechaInicio = new Date(oldFechaInicio).getFullYear();
            if (anioFechaInicio < minAnio || anioFechaInicio > maxAnio) {
              // Limpiar fechaInicio porque está fuera del rango
              dataConMontoTotal = { ...dataConMontoTotal, fechaInicio: null };
            }
          }

          // Verificar si fechaFin está fuera del rango de nuevos años
          if (oldFechaFin) {
            const anioFechaFin = new Date(oldFechaFin).getFullYear();
            if (anioFechaFin < minAnio || anioFechaFin > maxAnio) {
              // Limpiar fechaFin porque está fuera del rango
              dataConMontoTotal = { ...dataConMontoTotal, fechaFin: null };
            }
          }
        }
      }

      if (isEdit && id) {
        await updateProyecto(id, dataConMontoTotal as Partial<CreateProyectoData>);
        toast({ title: 'Exito', description: 'Proyecto actualizado correctamente' });
      } else {
        await createProyecto(dataConMontoTotal);
        toast({ title: 'Exito', description: 'Proyecto creado correctamente' });
      }

      // Reload projects (solo activos)
      const response = await getProyectos({ activo: true });
      const allProjects = response.data || [];
      // Actualizar lista completa para cálculo de próximo código
      setAllProjectsForCode(allProjects);
      // Filtrar para la vista actual
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
                value={selectedPgdId || ''}
                onValueChange={handleSelectPgd}
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
            {/* Filtro de Vinculación */}
            <div className="flex items-center gap-2">
              <label className="text-sm">Vinculacion</label>
              <Select value={filterVinculacion} onValueChange={setFilterVinculacion}>
                <SelectTrigger className="w-[180px] bg-white border-[#CFD6DD] text-[#7E8C9A]">
                  <SelectValue placeholder="Vinculados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vinculados">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-green-600" />
                      Vinculados al PGD
                    </div>
                  </SelectItem>
                  <SelectItem value="sin_pgd">
                    <div className="flex items-center gap-2">
                      <Link2Off className="h-4 w-4 text-orange-500" />
                      Sin PGD asociado ({unlinkedProjects.length})
                    </div>
                  </SelectItem>
                  <SelectItem value="todos">Todos los proyectos</SelectItem>
                </SelectContent>
              </Select>
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
            {/* Filtro de Año (dentro del rango del PGD seleccionado) */}
            <div className="flex items-center gap-2">
              <label className="text-sm">
                Año {selectedPgd && <span className="text-xs text-gray-500">({selectedPgd.anioInicio}-{selectedPgd.anioFin})</span>}
              </label>
              <Select value={filterYear} onValueChange={setFilterYear} disabled={!selectedPgd || filterVinculacion === 'sin_pgd'}>
                <SelectTrigger className="w-[120px] bg-white border-[#CFD6DD] text-[#7E8C9A]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {selectedPgd && Array.from(
                    { length: selectedPgd.anioFin - selectedPgd.anioInicio + 1 },
                    (_, i) => selectedPgd.anioInicio + i
                  ).map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
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
                    onAssociate={() => handleOpenAssociateModal(p)}
                    showAssociateButton={!p.accionEstrategicaId}
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
          nextCodigo={(() => {
            // Calcular el próximo código basado en TODOS los proyectos existentes
            const maxNum = allProjectsForCode.reduce((max, p) => {
              const match = p.codigo?.match(/PROY N°(\d+)/);
              if (match) {
                const num = parseInt(match[1], 10);
                return num > max ? num : max;
              }
              return max;
            }, 0);
            return `PROY N°${maxNum + 1}`;
          })()}
          pgdAnioInicio={pgds.find(p => p.id.toString() === selectedPgdId)?.anioInicio || new Date().getFullYear()}
          pgdAnioFin={pgds.find(p => p.id.toString() === selectedPgdId)?.anioFin || new Date().getFullYear() + 4}
          isLinkedToPgd={editingProject ? !!editingProject.accionEstrategicaId : !!selectedPgdId}
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

        <AssociateProjectModal
          isOpen={isAssociateModalOpen}
          onClose={handleCloseAssociateModal}
          project={projectToAssociate}
          pgds={pgds}
          onSave={handleAssociateProject}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}
