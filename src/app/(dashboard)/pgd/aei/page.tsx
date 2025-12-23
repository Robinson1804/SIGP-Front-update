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

// Import from planning module
import {
  getPGDs,
  getOEIsByPGD,
  getAEIsByOEI,
  createAEI,
  updateAEI,
  deleteAEI,
  type PGD,
  type OEI,
  type AEI,
  type CreateAEIInput,
  type UpdateAEIInput,
  type MetaAnual,
} from "@/features/planning";

const availableYears = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

// ============================================
// AEI Modal Component
// ============================================
function AEIModal({
  isOpen,
  onClose,
  aei,
  oeiId,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  aei: AEI | null;
  oeiId: number;
  onSave: (data: CreateAEIInput | UpdateAEIInput, id?: number) => Promise<void>;
}) {
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [indicador, setIndicador] = useState("");
  const [unidadMedida, setUnidadMedida] = useState("");
  const [lineaBaseAnio, setLineaBaseAnio] = useState<string>("");
  const [lineaBaseValor, setLineaBaseValor] = useState<string>("");
  const [metasAnuales, setMetasAnuales] = useState<MetaAnual[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (aei) {
      setCodigo(aei.codigo);
      setNombre(aei.nombre);
      setDescripcion(aei.descripcion || "");
      setIndicador(aei.indicadorNombre || "");
      setUnidadMedida(aei.unidadMedida || "");
      setLineaBaseAnio(aei.lineaBaseAnio !== null ? String(aei.lineaBaseAnio) : "");
      setLineaBaseValor(aei.lineaBaseValor !== null ? String(aei.lineaBaseValor) : "");
      setMetasAnuales(aei.metasAnuales || []);
    } else {
      setCodigo("");
      setNombre("");
      setDescripcion("");
      setIndicador("");
      setUnidadMedida("");
      setLineaBaseAnio("");
      setLineaBaseValor("");
      setMetasAnuales([]);
    }
    setErrors({});
  }, [aei, isOpen]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!nombre.trim()) newErrors.nombre = "El nombre es requerido.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const data: CreateAEIInput | UpdateAEIInput = {
        codigo: codigo || undefined,
        nombre,
        descripcion: descripcion || undefined,
        indicadorNombre: indicador || undefined,
        unidadMedida: unidadMedida || undefined,
        lineaBaseAnio: lineaBaseAnio ? parseInt(lineaBaseAnio) : undefined,
        lineaBaseValor: lineaBaseValor ? parseFloat(lineaBaseValor) : undefined,
        metasAnuales: metasAnuales.length > 0 ? metasAnuales : undefined,
      };

      if (!aei) {
        (data as CreateAEIInput).oeiId = oeiId;
      }

      await onSave(data, aei?.id);
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
            {aei ? "EDITAR ACCIÓN ESTRATÉGICA INSTITUCIONAL (AEI)" : "REGISTRAR ACCIÓN ESTRATÉGICA INSTITUCIONAL (AEI)"}
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
                Código
              </label>
              <Input
                id="codigo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Auto-generado si se deja vacío"
              />
              <p className="text-xs text-gray-500 mt-1">Formato: AEI.XX.YY (se genera automáticamente)</p>
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
              placeholder="Nombre de la acción estratégica institucional"
              className={errors.nombre ? "border-red-500" : ""}
            />
            {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
          </div>
          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <Textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>

          {/* Indicador */}
          <div>
            <label htmlFor="indicador" className="block text-sm font-medium text-gray-700 mb-1">
              Indicador
            </label>
            <Input
              id="indicador"
              value={indicador}
              onChange={(e) => setIndicador(e.target.value)}
              placeholder="Nombre del indicador"
            />
          </div>

          {/* Línea Base */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Línea Base</label>
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

          {/* Sección de Metas Anuales */}
          <div className="border-t pt-4">
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
// AEI Card Component
// ============================================
const AeiCard = ({
  aei,
  onEdit,
  onDelete,
}: {
  aei: AEI;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <div className="rounded-lg shadow-md border border-[#9A9A9A] overflow-hidden flex flex-col">
    <div className="bg-[#EAE7E7] p-4 flex-grow text-center">
      <div className="bg-[#2E7D32] text-white py-2 px-4 rounded-lg inline-block mb-4">
        <h3 className="text-base font-bold">{aei.codigo}</h3>
      </div>
      <h4 className="font-semibold text-sm mb-2">{aei.nombre}</h4>
      <p className="text-sm text-gray-700 min-h-[40px] line-clamp-3">{aei.descripcion}</p>
      {aei.indicadorNombre && (
        <p className="text-xs text-gray-500 mt-2">
          <span className="font-medium">Indicador:</span> {aei.indicadorNombre}
        </p>
      )}
      {aei.lineaBaseValor !== null && (
        <p className="text-xs text-gray-500 mt-1">
          <span className="font-medium">Línea Base:</span> {aei.lineaBaseValor} ({aei.lineaBaseAnio})
        </p>
      )}
    </div>
    <div className="bg-white p-4 flex justify-center gap-2 border-t border-[#9A9A9A]">
      <Button size="icon" onClick={onEdit} className="bg-[#2E7D32] hover:bg-[#2E7D32]/90 h-10 w-10">
        <Pencil className="h-5 w-5 text-white" />
      </Button>
      <Button size="icon" onClick={onDelete} className="bg-[#2E7D32] hover:bg-[#2E7D32]/90 h-10 w-10">
        <Trash2 className="h-5 w-5 text-white" />
      </Button>
    </div>
  </div>
);

// ============================================
// Main Page Component
// ============================================
export default function AeiDashboardPage() {
  const [pgds, setPgds] = useState<PGD[]>([]);
  const [oeis, setOeis] = useState<OEI[]>([]);
  const [aeis, setAeis] = useState<AEI[]>([]);
  const [selectedPgdId, setSelectedPgdId] = useState<string | undefined>(undefined);
  const [selectedOeiId, setSelectedOeiId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOeis, setIsLoadingOeis] = useState(false);
  const [isLoadingAeis, setIsLoadingAeis] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAei, setEditingAei] = useState<AEI | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingAei, setDeletingAei] = useState<AEI | null>(null);
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

  // Load OEIs when PGD changes
  const loadOEIs = useCallback(async () => {
    if (!selectedPgdId) {
      setOeis([]);
      setSelectedOeiId(undefined);
      return;
    }

    setIsLoadingOeis(true);
    try {
      const data = await getOEIsByPGD(selectedPgdId);
      setOeis(data);
      if (data.length > 0) {
        setSelectedOeiId(data[0].id.toString());
      } else {
        setSelectedOeiId(undefined);
      }
    } catch (err: any) {
      console.error("Error loading OEIs:", err);
      toast({
        title: "Error",
        description: "No se pudieron cargar los OEIs",
        variant: "destructive",
      });
    } finally {
      setIsLoadingOeis(false);
    }
  }, [selectedPgdId, toast]);

  // Load AEIs when OEI changes
  const loadAEIs = useCallback(async () => {
    if (!selectedOeiId) {
      setAeis([]);
      return;
    }

    setIsLoadingAeis(true);
    try {
      const data = await getAEIsByOEI(selectedOeiId);
      setAeis(data);
    } catch (err: any) {
      console.error("Error loading AEIs:", err);
      toast({
        title: "Error",
        description: "No se pudieron cargar las AEIs",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAeis(false);
    }
  }, [selectedOeiId, toast]);

  useEffect(() => {
    loadPGDs();
  }, []);

  useEffect(() => {
    if (selectedPgdId) {
      loadOEIs();
    }
  }, [selectedPgdId]);

  useEffect(() => {
    if (selectedOeiId) {
      loadAEIs();
    }
  }, [selectedOeiId, loadAEIs]);

  const handleOpenModal = (aei: AEI | null = null) => {
    setEditingAei(aei);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAei(null);
  };

  const handleSaveAei = async (data: CreateAEIInput | UpdateAEIInput, id?: number) => {
    try {
      if (id) {
        await updateAEI(id, data as UpdateAEIInput);
        toast({ title: "Éxito", description: "AEI actualizada correctamente" });
      } else {
        await createAEI(data as CreateAEIInput);
        toast({ title: "Éxito", description: "AEI creada correctamente" });
      }
      await loadAEIs();
    } catch (err: any) {
      console.error("Error saving AEI:", err);
      toast({
        title: "Error",
        description: err.message || "Error al guardar la AEI",
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleOpenDeleteModal = (aei: AEI) => {
    setDeletingAei(aei);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingAei(null);
  };

  const handleDeleteAei = async () => {
    if (!deletingAei) return;

    setIsDeleting(true);
    try {
      await deleteAEI(deletingAei.id);
      toast({ title: "Éxito", description: "AEI eliminada correctamente" });
      await loadAEIs();
      handleCloseDeleteModal();
    } catch (err: any) {
      console.error("Error deleting AEI:", err);
      toast({
        title: "Error",
        description: err.message || "Error al eliminar la AEI",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedOei = oeis.find((o) => o.id.toString() === selectedOeiId);

  return (
    <ProtectedRoute module={MODULES.PGD}>
      <AppLayout
        breadcrumbs={[
          { label: "PGD", href: paths.pgd.base },
          { label: "AEI" },
        ]}
      >
        <div className="bg-[#D5D5D5] border-y border-[#1A5581]">
          <div className="p-2 flex items-center justify-between w-full">
            <h2 className="font-bold text-black pl-2">ACCIÓN ESTRATÉGICA INSTITUCIONAL (AEI)</h2>
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
                  {/* PGD Selector */}
                  <Select value={selectedPgdId} onValueChange={setSelectedPgdId}>
                    <SelectTrigger className="w-[160px] bg-white border-[#484848]">
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

                  {/* OEI Selector */}
                  <Select
                    value={selectedOeiId}
                    onValueChange={setSelectedOeiId}
                    disabled={isLoadingOeis || oeis.length === 0}
                  >
                    <SelectTrigger className="w-[280px] bg-white border-[#484848]">
                      <SelectValue placeholder={isLoadingOeis ? "Cargando OEIs..." : "Seleccionar OEI"} />
                    </SelectTrigger>
                    <SelectContent>
                      {oeis.map((oei) => (
                        <SelectItem key={oei.id} value={oei.id.toString()}>
                          {`${oei.codigo} - ${oei.nombre.substring(0, 40)}${oei.nombre.length > 40 ? '...' : ''}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={() => handleOpenModal()}
                    disabled={!selectedOeiId}
                    style={{ backgroundColor: "#018CD1", color: "white" }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> NUEVA AEI
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-[#F9F9F9]">
          <div className="p-6 flex-1">
            {!selectedPgdId ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <p className="text-lg">Seleccione un PGD</p>
              </div>
            ) : oeis.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <p className="text-lg">No hay OEIs registrados para este PGD</p>
                <p className="text-sm mt-2">Primero debe registrar un OEI</p>
              </div>
            ) : !selectedOeiId ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <p className="text-lg">Seleccione un OEI</p>
              </div>
            ) : isLoadingAeis ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#004272]" />
              </div>
            ) : aeis.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <p className="text-lg">No hay AEIs registradas para este OEI</p>
                <Button
                  onClick={() => handleOpenModal()}
                  className="mt-4"
                  style={{ backgroundColor: "#018CD1" }}
                >
                  <Plus className="mr-2 h-4 w-4" /> Crear primera AEI
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl mx-auto">
                {aeis.map((aei) => (
                  <AeiCard
                    key={aei.id}
                    aei={aei}
                    onEdit={() => handleOpenModal(aei)}
                    onDelete={() => handleOpenDeleteModal(aei)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <AEIModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          aei={editingAei}
          oeiId={selectedOeiId ? Number(selectedOeiId) : 0}
          onSave={handleSaveAei}
        />

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleDeleteAei}
          title={`La AEI "${deletingAei?.codigo}" será eliminada`}
          isLoading={isDeleting}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}
