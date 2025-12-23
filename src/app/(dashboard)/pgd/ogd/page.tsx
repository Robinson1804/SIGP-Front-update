"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Loader2,
  RefreshCw,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { paths } from "@/lib/paths";
import { ProtectedRoute } from "@/features/auth";
import { MODULES } from "@/lib/definitions";
import { useToast } from "@/lib/hooks/use-toast";

import { Checkbox } from "@/components/ui/checkbox";

// Import from planning module
import {
  getPGDs,
  getOEIsByPGD,
  getOGDsByPGD,
  createOGD,
  updateOGD,
  deleteOGD,
  type PGD,
  type OEI,
  type OGD,
  type CreateOGDInput,
  type UpdateOGDInput,
  type MetaAnual,
} from "@/features/planning";

const availableYears = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

// ============================================
// OGD Modal Component
// ============================================
function OGDModal({
  isOpen,
  onClose,
  ogd,
  pgdId,
  availableOeis,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  ogd: OGD | null;
  pgdId: number;
  availableOeis: OEI[];
  onSave: (data: CreateOGDInput | UpdateOGDInput, id?: number) => Promise<void>;
}) {
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [indicador, setIndicador] = useState("");
  const [lineaBaseAnio, setLineaBaseAnio] = useState<string>("");
  const [lineaBaseValor, setLineaBaseValor] = useState<string>("");
  const [unidadMedida, setUnidadMedida] = useState("");
  const [metasAnuales, setMetasAnuales] = useState<MetaAnual[]>([]);
  const [selectedOeiIds, setSelectedOeiIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ogd) {
      setCodigo(ogd.codigo);
      setNombre(ogd.nombre);
      setDescripcion(ogd.descripcion || "");
      setIndicador(ogd.indicadorNombre || "");
      setLineaBaseAnio(ogd.lineaBaseAnio !== null ? String(ogd.lineaBaseAnio) : "");
      setLineaBaseValor(ogd.lineaBaseValor !== null ? String(ogd.lineaBaseValor) : "");
      setUnidadMedida(ogd.unidadMedida || "");
      setMetasAnuales(ogd.metasAnuales || []);
      // Cargar los OEIs ya relacionados (desde oeis o desde ogdOeis)
      const oeiIds = ogd.oeis?.map(oei => oei.id)
        || ogd.ogdOeis?.map(item => item.oeiId)
        || [];
      setSelectedOeiIds(oeiIds);
    } else {
      setCodigo("");
      setNombre("");
      setDescripcion("");
      setIndicador("");
      setLineaBaseAnio("");
      setLineaBaseValor("");
      setUnidadMedida("");
      setMetasAnuales([]);
      setSelectedOeiIds([]);
    }
    setErrors({});
  }, [ogd, isOpen]);

  const toggleOeiSelection = (oeiId: number) => {
    setSelectedOeiIds(prev =>
      prev.includes(oeiId)
        ? prev.filter(id => id !== oeiId)
        : [...prev, oeiId]
    );
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!codigo.trim()) newErrors.codigo = "El código es requerido.";
    if (!nombre.trim()) newErrors.nombre = "El nombre es requerido.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const data: CreateOGDInput | UpdateOGDInput = {
        codigo,
        nombre,
        descripcion: descripcion || undefined,
        indicadorNombre: indicador || undefined,
        lineaBaseAnio: lineaBaseAnio ? parseInt(lineaBaseAnio) : undefined,
        lineaBaseValor: lineaBaseValor ? parseFloat(lineaBaseValor) : undefined,
        unidadMedida: unidadMedida || undefined,
        metasAnuales: metasAnuales.length > 0 ? metasAnuales : undefined,
        oeiIds: selectedOeiIds.length > 0 ? selectedOeiIds : undefined,
      };

      if (!ogd) {
        (data as CreateOGDInput).pgdId = pgdId;
      }

      await onSave(data, ogd?.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const addMetaAnual = (anio: number) => {
    if (anio && !metasAnuales.some((m) => m.anio === anio)) {
      setMetasAnuales((prev) => [...prev, { anio, meta: 0 }]);
    }
  };

  const removeMetaAnual = (anio: number) => {
    setMetasAnuales(metasAnuales.filter((m) => m.anio !== anio));
  };

  const updateMetaAnual = (anio: number, meta: number) => {
    setMetasAnuales(metasAnuales.map((m) => (m.anio === anio ? { ...m, meta } : m)));
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] p-0 max-h-[90vh] overflow-y-auto" showCloseButton={false}>
        <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between sticky top-0 z-10">
          <DialogTitle>
            {ogd ? "EDITAR OBJETIVO DE GOBIERNO DIGITAL (OGD)" : "REGISTRAR OBJETIVO DE GOBIERNO DIGITAL (OGD)"}
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
              <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 mb-1">
                Código *
              </label>
              <Input
                id="codigo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ej: OGD-001"
                className={errors.codigo ? "border-red-500" : ""}
              />
              {errors.codigo && <p className="text-red-500 text-xs mt-1">{errors.codigo}</p>}
            </div>
            <div>
              <label htmlFor="unidadMedida" className="block text-sm font-medium text-gray-700 mb-1">
                Unidad de Medida
              </label>
              <Input
                id="unidadMedida"
                value={unidadMedida}
                onChange={(e) => setUnidadMedida(e.target.value)}
                placeholder="Ej: Porcentaje"
              />
            </div>
          </div>
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={errors.nombre ? "border-red-500" : ""}
            />
            {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
          </div>

          {/* Multi-select OEIs */}
          {availableOeis.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OEIs Relacionados
              </label>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2 bg-gray-50">
                {availableOeis.map((oei) => (
                  <div key={oei.id} className="flex items-start gap-2">
                    <Checkbox
                      id={`oei-${oei.id}`}
                      checked={selectedOeiIds.includes(oei.id)}
                      onCheckedChange={() => toggleOeiSelection(oei.id)}
                    />
                    <label
                      htmlFor={`oei-${oei.id}`}
                      className="text-sm cursor-pointer leading-tight"
                    >
                      <span className="font-medium">{oei.codigo}</span>
                      {oei.nombre && <span className="text-gray-600"> - {oei.nombre}</span>}
                    </label>
                  </div>
                ))}
              </div>
              {selectedOeiIds.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {selectedOeiIds.length} OEI(s) seleccionado(s)
                </p>
              )}
            </div>
          )}
          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <Textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>
          <div>
            <label htmlFor="indicador" className="block text-sm font-medium text-gray-700 mb-1">
              Indicador
            </label>
            <Input id="indicador" value={indicador} onChange={(e) => setIndicador(e.target.value)} placeholder="Nombre del indicador" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Línea Base
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="lineaBaseAnio" className="block text-xs text-gray-500 mb-1">
                  Año
                </label>
                <Select onValueChange={(value) => setLineaBaseAnio(value)} value={lineaBaseAnio}>
                  <SelectTrigger id="lineaBaseAnio">
                    <SelectValue placeholder="Ej: 2024" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="lineaBaseValor" className="block text-xs text-gray-500 mb-1">
                  Valor
                </label>
                <Input
                  id="lineaBaseValor"
                  type="number"
                  step="0.01"
                  value={lineaBaseValor}
                  onChange={(e) => setLineaBaseValor(e.target.value)}
                  placeholder="Ej: 75.5"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Metas Anuales</label>
            <div className="flex items-center gap-2 mb-2">
              <Select onValueChange={(value) => addMetaAnual(Number(value))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Agregar año" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears
                    .filter((y) => !metasAnuales.some((m) => m.anio === y))
                    .map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {metasAnuales.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Año</TableHead>
                    <TableHead>Meta</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metasAnuales
                    .sort((a, b) => a.anio - b.anio)
                    .map((meta) => (
                      <TableRow key={meta.anio}>
                        <TableCell>{meta.anio}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={meta.meta}
                            onChange={(e) => updateMetaAnual(meta.anio, parseFloat(e.target.value) || 0)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Button variant="destructive" size="icon" onClick={() => removeMetaAnual(meta.anio)} className="h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
        <DialogFooter className="px-6 pb-6 flex justify-end gap-2 sticky bottom-0 bg-white border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} style={{ backgroundColor: "#018CD1" }}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Delete Confirmation Modal
// ============================================
function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  isLoading?: boolean;
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
          <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" strokeWidth={1.5} />
          <p className="font-bold text-lg">¿Estás seguro?</p>
          <p className="text-muted-foreground">{title}</p>
        </div>
        <DialogFooter className="justify-center px-6 pb-6 flex gap-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isLoading} style={{ backgroundColor: "#018CD1" }}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Sí, eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// OGD Card Component
// ============================================
const OgdCard = ({
  ogd,
  onEdit,
  onDelete,
}: {
  ogd: OGD;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <div className="rounded-lg shadow-md border border-[#9A9A9A] overflow-hidden flex flex-col">
    <div className="bg-[#FFD8D8] p-4 flex-grow text-center">
      <div className="bg-[#C62828] text-white py-2 px-4 rounded-lg inline-block mb-4">
        <h3 className="text-base font-bold">{ogd.codigo}</h3>
      </div>
      <h4 className="font-semibold text-sm mb-2">{ogd.nombre}</h4>
      <p className="text-sm text-gray-700 min-h-[40px] line-clamp-3">{ogd.descripcion}</p>
      {ogd.indicadorNombre && (
        <p className="text-xs text-gray-500 mt-2">
          <span className="font-medium">Indicador:</span> {ogd.indicadorNombre}
        </p>
      )}
      {ogd._count?.objetivosEspecificos !== undefined && (
        <p className="text-xs text-gray-500 mt-1">
          <span className="font-medium">OEGDs:</span> {ogd._count.objetivosEspecificos}
        </p>
      )}
    </div>
    <div className="bg-white p-4 flex justify-center gap-2 border-t border-[#9A9A9A]">
      <Button size="icon" onClick={onEdit} className="bg-[#C62828] hover:bg-[#C62828]/90 h-10 w-10">
        <Pencil className="h-5 w-5 text-white" />
      </Button>
      <Button size="icon" onClick={onDelete} className="bg-[#C62828] hover:bg-[#C62828]/90 h-10 w-10">
        <Trash2 className="h-5 w-5 text-white" />
      </Button>
    </div>
  </div>
);

// ============================================
// Main Page Component
// ============================================
export default function OgdDashboardPage() {
  const [pgds, setPgds] = useState<PGD[]>([]);
  const [selectedPgdId, setSelectedPgdId] = useState<string | undefined>(undefined);
  const [ogds, setOgds] = useState<OGD[]>([]);
  const [oeis, setOeis] = useState<OEI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOgds, setIsLoadingOgds] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOgd, setEditingOgd] = useState<OGD | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingOgd, setDeletingOgd] = useState<OGD | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();

  // Load PGDs
  const loadPGDs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPGDs();
      setPgds(data);
      if (data.length > 0 && !selectedPgdId) {
        setSelectedPgdId(data[0].id.toString());
      }
    } catch (err: any) {
      console.error("Error loading PGDs:", err);
      setError("Error al cargar los planes de gobierno digital");
      toast({
        title: "Error",
        description: "No se pudieron cargar los PGDs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedPgdId, toast]);

  // Load OGDs when PGD changes
  const loadOGDs = useCallback(async () => {
    if (!selectedPgdId) {
      setOgds([]);
      return;
    }

    setIsLoadingOgds(true);
    try {
      const data = await getOGDsByPGD(selectedPgdId);
      setOgds(data);
    } catch (err: any) {
      console.error("Error loading OGDs:", err);
      toast({
        title: "Error",
        description: "No se pudieron cargar los OGDs",
        variant: "destructive",
      });
    } finally {
      setIsLoadingOgds(false);
    }
  }, [selectedPgdId, toast]);

  // Load OEIs when PGD changes (for multi-select)
  const loadOEIs = useCallback(async () => {
    if (!selectedPgdId) {
      setOeis([]);
      return;
    }

    try {
      const data = await getOEIsByPGD(selectedPgdId);
      setOeis(data);
    } catch (err: any) {
      console.error("Error loading OEIs:", err);
    }
  }, [selectedPgdId]);

  useEffect(() => {
    loadPGDs();
  }, []);

  useEffect(() => {
    if (selectedPgdId) {
      loadOGDs();
      loadOEIs();
    }
  }, [selectedPgdId, loadOGDs, loadOEIs]);

  const handleOpenModal = (ogd: OGD | null = null) => {
    setEditingOgd(ogd);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOgd(null);
  };

  const handleSaveOgd = async (data: CreateOGDInput | UpdateOGDInput, id?: number) => {
    try {
      if (id) {
        await updateOGD(id, data as UpdateOGDInput);
        toast({ title: "Éxito", description: "OGD actualizado correctamente" });
      } else {
        await createOGD(data as CreateOGDInput);
        toast({ title: "Éxito", description: "OGD creado correctamente" });
      }
      await loadOGDs();
    } catch (err: any) {
      console.error("Error saving OGD:", err);
      toast({
        title: "Error",
        description: err.message || "Error al guardar el OGD",
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleOpenDeleteModal = (ogd: OGD) => {
    setDeletingOgd(ogd);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingOgd(null);
  };

  const handleDeleteOgd = async () => {
    if (!deletingOgd) return;

    setIsDeleting(true);
    try {
      await deleteOGD(deletingOgd.id);
      toast({ title: "Éxito", description: "OGD eliminado correctamente" });
      await loadOGDs();
      handleCloseDeleteModal();
    } catch (err: any) {
      console.error("Error deleting OGD:", err);
      toast({
        title: "Error",
        description: err.message || "Error al eliminar el OGD",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ProtectedRoute module={MODULES.PGD}>
      <AppLayout
        breadcrumbs={[
          { label: "PGD", href: paths.pgd.base },
          { label: "OGD" },
        ]}
      >
        <div className="bg-[#D5D5D5] border-y border-[#1A5581]">
          <div className="p-2 flex items-center justify-between w-full">
            <h2 className="font-bold text-black pl-2">OBJETIVO DE GOBIERNO DIGITAL (OGD)</h2>
            <div className="flex items-center gap-2">
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando...
                </div>
              ) : error ? (
                <Button variant="outline" size="sm" onClick={loadPGDs}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reintentar
                </Button>
              ) : (
                <>
                  <Select value={selectedPgdId} onValueChange={setSelectedPgdId}>
                    <SelectTrigger className="w-[180px] bg-white border-[#484848]">
                      <SelectValue placeholder="Seleccionar PGD" />
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
                    onClick={() => handleOpenModal()}
                    disabled={!selectedPgdId}
                    style={{ backgroundColor: "#018CD1", color: "white" }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> NUEVO OGD
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-[#F9F9F9]">
          <div className="p-6 flex-1">
            {isLoadingOgds ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#004272]" />
              </div>
            ) : ogds.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <p className="text-lg">No hay OGDs registrados</p>
                {selectedPgdId && (
                  <Button
                    onClick={() => handleOpenModal()}
                    className="mt-4"
                    style={{ backgroundColor: "#018CD1" }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Crear primer OGD
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl mx-auto">
                {ogds.map((ogd) => (
                  <OgdCard
                    key={ogd.id}
                    ogd={ogd}
                    onEdit={() => handleOpenModal(ogd)}
                    onDelete={() => handleOpenDeleteModal(ogd)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <OGDModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          ogd={editingOgd}
          pgdId={selectedPgdId ? Number(selectedPgdId) : 0}
          availableOeis={oeis}
          onSave={handleSaveOgd}
        />

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleDeleteOgd}
          title={`El OGD "${deletingOgd?.codigo}" será eliminado`}
          isLoading={isDeleting}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}
