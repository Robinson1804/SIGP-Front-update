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
  createOEI,
  updateOEI,
  deleteOEI,
  type PGD,
  type OEI,
  type CreateOEIInput,
  type UpdateOEIInput,
  type MetaAnual,
} from "@/features/planning";

const availableYears = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

// ============================================
// OEI Modal Component
// ============================================
function OEIModal({
  isOpen,
  onClose,
  oei,
  pgdId,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  oei: OEI | null;
  pgdId: number;
  onSave: (data: CreateOEIInput | UpdateOEIInput, id?: number) => Promise<void>;
}) {
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [indicador, setIndicador] = useState("");
  const [lineaBase, setLineaBase] = useState<string>("");
  const [unidadMedida, setUnidadMedida] = useState("");
  const [metasAnuales, setMetasAnuales] = useState<MetaAnual[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (oei) {
      setCodigo(oei.codigo);
      setNombre(oei.nombre);
      setDescripcion(oei.descripcion || "");
      setIndicador(oei.indicador || "");
      setLineaBase(oei.lineaBase !== null ? String(oei.lineaBase) : "");
      setUnidadMedida(oei.unidadMedida || "");
      setMetasAnuales(oei.metasAnuales || []);
    } else {
      setCodigo("");
      setNombre("");
      setDescripcion("");
      setIndicador("");
      setLineaBase("");
      setUnidadMedida("");
      setMetasAnuales([]);
    }
    setErrors({});
  }, [oei, isOpen]);

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
      const data: CreateOEIInput | UpdateOEIInput = {
        codigo,
        nombre,
        descripcion: descripcion || undefined,
        indicador: indicador || undefined,
        lineaBase: lineaBase ? parseFloat(lineaBase) : undefined,
        unidadMedida: unidadMedida || undefined,
        metasAnuales: metasAnuales.length > 0 ? metasAnuales : undefined,
      };

      if (!oei) {
        (data as CreateOEIInput).pgdId = pgdId;
      }

      await onSave(data, oei?.id);
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
            {oei ? "EDITAR OBJETIVO ESTRATÉGICO INSTITUCIONAL (OEI)" : "REGISTRAR OBJETIVO ESTRATÉGICO INSTITUCIONAL (OEI)"}
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
                placeholder="Ej: OEI-001"
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
            <Input id="indicador" value={indicador} onChange={(e) => setIndicador(e.target.value)} />
          </div>
          <div>
            <label htmlFor="lineaBase" className="block text-sm font-medium text-gray-700 mb-1">
              Línea Base
            </label>
            <Input id="lineaBase" value={lineaBase} onChange={(e) => setLineaBase(e.target.value)} />
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
// OEI Card Component
// ============================================
const OeiCard = ({
  oei,
  onEdit,
  onDelete,
}: {
  oei: OEI;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <div className="rounded-lg shadow-md border border-[#9A9A9A] overflow-hidden flex flex-col">
    <div className="bg-[#EAE7E7] p-4 flex-grow text-center">
      <div className="bg-[#1A5581] text-white py-2 px-4 rounded-lg inline-block mb-4">
        <h3 className="text-base font-bold">{oei.codigo}</h3>
      </div>
      <h4 className="font-semibold text-sm mb-2">{oei.nombre}</h4>
      <p className="text-sm text-gray-700 min-h-[40px] line-clamp-3">{oei.descripcion}</p>
      {oei.indicador && (
        <p className="text-xs text-gray-500 mt-2">
          <span className="font-medium">Indicador:</span> {oei.indicador}
        </p>
      )}
    </div>
    <div className="bg-white p-4 flex justify-center gap-2 border-t border-[#9A9A9A]">
      <Button size="icon" onClick={onEdit} className="bg-[#1A5581] hover:bg-[#1A5581]/90 h-10 w-10">
        <Pencil className="h-5 w-5 text-white" />
      </Button>
      <Button size="icon" onClick={onDelete} className="bg-[#1A5581] hover:bg-[#1A5581]/90 h-10 w-10">
        <Trash2 className="h-5 w-5 text-white" />
      </Button>
    </div>
  </div>
);

// ============================================
// Main Page Component
// ============================================
export default function OeiDashboardPage() {
  const [pgds, setPgds] = useState<PGD[]>([]);
  const [selectedPgdId, setSelectedPgdId] = useState<string | undefined>(undefined);
  const [oeis, setOeis] = useState<OEI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOeis, setIsLoadingOeis] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOei, setEditingOei] = useState<OEI | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingOei, setDeletingOei] = useState<OEI | null>(null);
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
      return;
    }

    setIsLoadingOeis(true);
    try {
      const data = await getOEIsByPGD(selectedPgdId);
      setOeis(data);
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

  useEffect(() => {
    loadPGDs();
  }, []);

  useEffect(() => {
    if (selectedPgdId) {
      loadOEIs();
    }
  }, [selectedPgdId, loadOEIs]);

  const handleOpenModal = (oei: OEI | null = null) => {
    setEditingOei(oei);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOei(null);
  };

  const handleSaveOei = async (data: CreateOEIInput | UpdateOEIInput, id?: number) => {
    try {
      if (id) {
        await updateOEI(id, data as UpdateOEIInput);
        toast({ title: "Éxito", description: "OEI actualizado correctamente" });
      } else {
        await createOEI(data as CreateOEIInput);
        toast({ title: "Éxito", description: "OEI creado correctamente" });
      }
      await loadOEIs();
    } catch (err: any) {
      console.error("Error saving OEI:", err);
      toast({
        title: "Error",
        description: err.message || "Error al guardar el OEI",
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleOpenDeleteModal = (oei: OEI) => {
    setDeletingOei(oei);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingOei(null);
  };

  const handleDeleteOei = async () => {
    if (!deletingOei) return;

    setIsDeleting(true);
    try {
      await deleteOEI(deletingOei.id);
      toast({ title: "Éxito", description: "OEI eliminado correctamente" });
      await loadOEIs();
      handleCloseDeleteModal();
    } catch (err: any) {
      console.error("Error deleting OEI:", err);
      toast({
        title: "Error",
        description: err.message || "Error al eliminar el OEI",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedPgd = pgds.find((p) => p.id.toString() === selectedPgdId);

  return (
    <ProtectedRoute module={MODULES.PGD}>
      <AppLayout
        breadcrumbs={[
          { label: "PGD", href: paths.pgd.base },
          { label: "OEI" },
        ]}
      >
        <div className="bg-[#D5D5D5] border-y border-[#1A5581]">
          <div className="p-2 flex items-center justify-between w-full">
            <h2 className="font-bold text-black pl-2">OBJETIVO ESTRATÉGICO INSTITUCIONAL (OEI)</h2>
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
                    <Plus className="mr-2 h-4 w-4" /> NUEVO OEI
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-[#F9F9F9]">
          <div className="p-6 flex-1">
            {isLoadingOeis ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#004272]" />
              </div>
            ) : oeis.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <p className="text-lg">No hay OEIs registrados</p>
                {selectedPgdId && (
                  <Button
                    onClick={() => handleOpenModal()}
                    className="mt-4"
                    style={{ backgroundColor: "#018CD1" }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Crear primer OEI
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl mx-auto">
                {oeis.map((oei) => (
                  <OeiCard
                    key={oei.id}
                    oei={oei}
                    onEdit={() => handleOpenModal(oei)}
                    onDelete={() => handleOpenDeleteModal(oei)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <OEIModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          oei={editingOei}
          pgdId={selectedPgdId ? Number(selectedPgdId) : 0}
          onSave={handleSaveOei}
        />

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleDeleteOei}
          title={`El OEI "${deletingOei?.codigo}" será eliminado`}
          isLoading={isDeleting}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}
