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
import { paths } from "@/lib/paths";
import { ProtectedRoute } from "@/features/auth";
import { MODULES } from "@/lib/definitions";
import { useToast } from "@/lib/hooks/use-toast";

// Import from planning module
import {
  getPGDs,
  getOGDsByPGD,
  getOEGDsByOGD,
  createOEGD,
  updateOEGD,
  deleteOEGD,
  type PGD,
  type OGD,
  type OEGD,
  type CreateOEGDInput,
  type UpdateOEGDInput,
} from "@/features/planning";

// ============================================
// OEGD Modal Component
// ============================================
function OEGDModal({
  isOpen,
  onClose,
  oegd,
  ogdId,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  oegd: OEGD | null;
  ogdId: number;
  onSave: (data: CreateOEGDInput | UpdateOEGDInput, id?: number) => Promise<void>;
}) {
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (oegd) {
      setCodigo(oegd.codigo);
      setNombre(oegd.nombre);
      setDescripcion(oegd.descripcion || "");
    } else {
      setCodigo("");
      setNombre("");
      setDescripcion("");
    }
    setErrors({});
  }, [oegd, isOpen]);

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
      const data: CreateOEGDInput | UpdateOEGDInput = {
        codigo,
        nombre,
        descripcion: descripcion || undefined,
      };

      if (!oegd) {
        (data as CreateOEGDInput).ogdId = ogdId;
      }

      await onSave(data, oegd?.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0" showCloseButton={false}>
        <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between">
          <DialogTitle>
            {oegd ? "EDITAR OBJETIVO ESPECÍFICO DE GOBIERNO DIGITAL (OEGD)" : "REGISTRAR OBJETIVO ESPECÍFICO DE GOBIERNO DIGITAL (OEGD)"}
          </DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 mb-1">
              Código *
            </label>
            <Input
              id="codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ej: OEGD-001"
              className={errors.codigo ? "border-red-500" : ""}
            />
            {errors.codigo && <p className="text-red-500 text-xs mt-1">{errors.codigo}</p>}
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
        </div>
        <DialogFooter className="px-6 pb-6 flex justify-end gap-2">
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
// OEGD Card Component
// ============================================
const OegdCard = ({
  oegd,
  onEdit,
  onDelete,
}: {
  oegd: OEGD;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <div className="rounded-lg shadow-md border border-[#9A9A9A] overflow-hidden flex flex-col">
    <div className="bg-[#FCF3EA] p-4 flex-grow text-center">
      <div className="bg-[#E65100] text-white py-2 px-4 rounded-lg inline-block mb-4">
        <h3 className="text-base font-bold">{oegd.codigo}</h3>
      </div>
      <h4 className="font-semibold text-sm mb-2">{oegd.nombre}</h4>
      <p className="text-sm text-gray-700 min-h-[40px] line-clamp-3">{oegd.descripcion}</p>
      {oegd._count?.accionesEstrategicas !== undefined && (
        <p className="text-xs text-gray-500 mt-2">
          <span className="font-medium">Acciones Estratégicas:</span> {oegd._count.accionesEstrategicas}
        </p>
      )}
    </div>
    <div className="bg-white p-4 flex justify-center gap-2 border-t border-[#9A9A9A]">
      <Button size="icon" onClick={onEdit} className="bg-[#E65100] hover:bg-[#E65100]/90 h-10 w-10">
        <Pencil className="h-5 w-5 text-white" />
      </Button>
      <Button size="icon" onClick={onDelete} className="bg-[#E65100] hover:bg-[#E65100]/90 h-10 w-10">
        <Trash2 className="h-5 w-5 text-white" />
      </Button>
    </div>
  </div>
);

// ============================================
// Main Page Component
// ============================================
export default function OegdDashboardPage() {
  const [pgds, setPgds] = useState<PGD[]>([]);
  const [ogds, setOgds] = useState<OGD[]>([]);
  const [oegds, setOegds] = useState<OEGD[]>([]);

  const [selectedPgdId, setSelectedPgdId] = useState<string | undefined>(undefined);
  const [selectedOgdId, setSelectedOgdId] = useState<string | undefined>(undefined);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOgds, setIsLoadingOgds] = useState(false);
  const [isLoadingOegds, setIsLoadingOegds] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOegd, setEditingOegd] = useState<OEGD | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingOegd, setDeletingOegd] = useState<OEGD | null>(null);
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
      toast({ title: "Error", description: "No se pudieron cargar los PGDs", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [selectedPgdId, toast]);

  // Load OGDs when PGD changes
  const loadOGDs = useCallback(async () => {
    if (!selectedPgdId) {
      setOgds([]);
      setSelectedOgdId(undefined);
      return;
    }

    setIsLoadingOgds(true);
    try {
      const data = await getOGDsByPGD(selectedPgdId);
      setOgds(data);
      if (data.length > 0) {
        setSelectedOgdId(data[0].id.toString());
      } else {
        setSelectedOgdId(undefined);
      }
    } catch (err: any) {
      console.error("Error loading OGDs:", err);
      toast({ title: "Error", description: "No se pudieron cargar los OGDs", variant: "destructive" });
    } finally {
      setIsLoadingOgds(false);
    }
  }, [selectedPgdId, toast]);

  // Load OEGDs when OGD changes
  const loadOEGDs = useCallback(async () => {
    if (!selectedOgdId) {
      setOegds([]);
      return;
    }

    setIsLoadingOegds(true);
    try {
      const data = await getOEGDsByOGD(selectedOgdId);
      setOegds(data);
    } catch (err: any) {
      console.error("Error loading OEGDs:", err);
      toast({ title: "Error", description: "No se pudieron cargar los OEGDs", variant: "destructive" });
    } finally {
      setIsLoadingOegds(false);
    }
  }, [selectedOgdId, toast]);

  useEffect(() => {
    loadPGDs();
  }, []);

  useEffect(() => {
    if (selectedPgdId) {
      loadOGDs();
    }
  }, [selectedPgdId]);

  useEffect(() => {
    if (selectedOgdId) {
      loadOEGDs();
    }
  }, [selectedOgdId, loadOEGDs]);

  const handleOpenModal = (oegd: OEGD | null = null) => {
    setEditingOegd(oegd);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOegd(null);
  };

  const handleSaveOegd = async (data: CreateOEGDInput | UpdateOEGDInput, id?: number) => {
    try {
      if (id) {
        await updateOEGD(id, data as UpdateOEGDInput);
        toast({ title: "Éxito", description: "OEGD actualizado correctamente" });
      } else {
        await createOEGD(data as CreateOEGDInput);
        toast({ title: "Éxito", description: "OEGD creado correctamente" });
      }
      await loadOEGDs();
    } catch (err: any) {
      console.error("Error saving OEGD:", err);
      toast({ title: "Error", description: err.message || "Error al guardar el OEGD", variant: "destructive" });
      throw err;
    }
  };

  const handleOpenDeleteModal = (oegd: OEGD) => {
    setDeletingOegd(oegd);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingOegd(null);
  };

  const handleDeleteOegd = async () => {
    if (!deletingOegd) return;

    setIsDeleting(true);
    try {
      await deleteOEGD(deletingOegd.id);
      toast({ title: "Éxito", description: "OEGD eliminado correctamente" });
      await loadOEGDs();
      handleCloseDeleteModal();
    } catch (err: any) {
      console.error("Error deleting OEGD:", err);
      toast({ title: "Error", description: err.message || "Error al eliminar el OEGD", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ProtectedRoute module={MODULES.PGD}>
      <AppLayout
        breadcrumbs={[
          { label: "PGD", href: paths.pgd.base },
          { label: "OEGD" },
        ]}
      >
        <div className="bg-[#D5D5D5] border-y border-[#1A5581]">
          <div className="p-2 flex items-center justify-between w-full">
            <h2 className="font-bold text-black pl-2">OBJETIVO ESPECÍFICO DE GOBIERNO DIGITAL (OEGD)</h2>
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
                    <SelectTrigger className="w-[150px] bg-white border-[#484848]">
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
                  <Select
                    value={selectedOgdId}
                    onValueChange={setSelectedOgdId}
                    disabled={isLoadingOgds || ogds.length === 0}
                  >
                    <SelectTrigger className="w-[180px] bg-white border-[#484848]">
                      <SelectValue placeholder={isLoadingOgds ? "Cargando..." : "Seleccionar OGD"} />
                    </SelectTrigger>
                    <SelectContent>
                      {ogds.map((ogd) => (
                        <SelectItem key={ogd.id} value={ogd.id.toString()}>
                          {ogd.codigo} - {ogd.nombre.substring(0, 20)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => handleOpenModal()}
                    disabled={!selectedOgdId}
                    style={{ backgroundColor: "#018CD1", color: "white" }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> NUEVO OEGD
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-[#F9F9F9]">
          <div className="p-6 flex-1">
            {isLoadingOegds ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#004272]" />
              </div>
            ) : !selectedOgdId ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <p className="text-lg">Seleccione un OGD para ver sus objetivos específicos</p>
              </div>
            ) : oegds.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <p className="text-lg">No hay OEGDs registrados para este OGD</p>
                <Button
                  onClick={() => handleOpenModal()}
                  className="mt-4"
                  style={{ backgroundColor: "#018CD1" }}
                >
                  <Plus className="mr-2 h-4 w-4" /> Crear primer OEGD
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl mx-auto">
                {oegds.map((oegd) => (
                  <OegdCard
                    key={oegd.id}
                    oegd={oegd}
                    onEdit={() => handleOpenModal(oegd)}
                    onDelete={() => handleOpenDeleteModal(oegd)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <OEGDModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          oegd={editingOegd}
          ogdId={selectedOgdId ? Number(selectedOgdId) : 0}
          onSave={handleSaveOegd}
        />

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleDeleteOegd}
          title={`El OEGD "${deletingOegd?.codigo}" será eliminado`}
          isLoading={isDeleting}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}
