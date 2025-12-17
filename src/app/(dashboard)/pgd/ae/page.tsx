"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Loader2,
  AlertCircle,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { paths } from "@/lib/paths";
import { ProtectedRoute } from "@/features/auth";
import { MODULES } from "@/lib/definitions";
import { useToast } from "@/lib/hooks/use-toast";

// Import from planning module
import {
  getPGDs,
  getOEGDsByPGD,
  getAccionesEstrategicasByOEGD,
  createAccionEstrategica,
  updateAccionEstrategica,
  deleteAccionEstrategica,
  type PGD,
  type OEGD,
  type AccionEstrategica,
  type CreateAccionEstrategicaInput,
  type UpdateAccionEstrategicaInput,
} from "@/features/planning";

function AEModal({
  isOpen,
  onClose,
  ae,
  availableOegds,
  onSave,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  ae: AccionEstrategica | null;
  availableOegds: OEGD[];
  onSave: (
    data: CreateAccionEstrategicaInput | UpdateAccionEstrategicaInput,
    isEdit: boolean
  ) => Promise<void>;
  isLoading?: boolean;
}) {
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [selectedOegdId, setSelectedOegdId] = useState<number | undefined>(undefined);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ae) {
      setCodigo(ae.codigo);
      setNombre(ae.nombre);
      setDescripcion(ae.descripcion || "");
      setSelectedOegdId(ae.oegdId);
    } else {
      setCodigo("");
      setNombre("");
      setDescripcion("");
      setSelectedOegdId(undefined);
    }
    setErrors({});
  }, [ae, isOpen]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!codigo.trim()) newErrors.codigo = "El código es requerido.";
    if (!nombre.trim()) newErrors.nombre = "El nombre es requerido.";
    if (!selectedOegdId) newErrors.oegdId = "Debe seleccionar un OEGD.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      if (ae) {
        // Update
        await onSave(
          {
            codigo,
            nombre,
            descripcion: descripcion || undefined,
            oegdId: selectedOegdId,
          } as UpdateAccionEstrategicaInput,
          true
        );
      } else {
        // Create
        await onSave(
          {
            oegdId: selectedOegdId!,
            codigo,
            nombre,
            descripcion: descripcion || undefined,
          } as CreateAccionEstrategicaInput,
          false
        );
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const selectedOegd = availableOegds.find((o) => o.id === selectedOegdId);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] p-0" showCloseButton={false}>
        <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between">
          <DialogTitle>
            {ae
              ? "EDITAR ACCIÓN ESTRATÉGICA (AE)"
              : "REGISTRAR ACCIÓN ESTRATÉGICA (AE)"}
          </DialogTitle>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="codigo"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Código *
              </label>
              <Input
                id="codigo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ej: AE-001"
                className={errors.codigo ? "border-red-500" : ""}
              />
              {errors.codigo && (
                <p className="text-red-500 text-xs mt-1">{errors.codigo}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="nombre"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nombre *
              </label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre de la acción estratégica"
                className={errors.nombre ? "border-red-500" : ""}
              />
              {errors.nombre && (
                <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>
              )}
            </div>
          </div>
          <div>
            <label
              htmlFor="descripcion"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Descripción
            </label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción de la acción estratégica"
              rows={3}
            />
          </div>
          <div>
            <label
              htmlFor="oegd-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              OBJETIVO ESPECÍFICO DE GOBIERNO DIGITAL (OEGD) *
            </label>
            <Select
              onValueChange={(value) => setSelectedOegdId(Number(value))}
              value={selectedOegdId?.toString()}
            >
              <SelectTrigger
                id="oegd-select"
                className={errors.oegdId ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Seleccionar OEGD" />
              </SelectTrigger>
              <SelectContent>
                {availableOegds.map((oegd) => (
                  <SelectItem key={oegd.id} value={oegd.id.toString()}>
                    {oegd.codigo} - {oegd.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.oegdId && (
              <p className="text-red-500 text-xs mt-1">{errors.oegdId}</p>
            )}

            {selectedOegd && (
              <Table className="mt-4">
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>{selectedOegd.codigo}</TableCell>
                    <TableCell>{selectedOegd.nombre}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setSelectedOegdId(undefined)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </div>
        </div>
        <DialogFooter className="px-6 pb-6 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            style={{ borderColor: "#CFD6DD", color: "black" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            style={{ backgroundColor: "#018CD1", color: "white" }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
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
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0" showCloseButton={false}>
        <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between">
          <DialogTitle>AVISO</DialogTitle>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="p-6 text-center flex flex-col items-center">
          <AlertTriangle
            className="h-16 w-16 text-black mb-4"
            strokeWidth={1.5}
          />
          <p className="font-bold text-lg">¿Estás seguro?</p>
          <p className="text-muted-foreground">
            La Acción Estratégica será eliminada
          </p>
        </div>
        <DialogFooter className="px-6 pb-6 flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            style={{ borderColor: "#CFD6DD", color: "black" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            style={{ backgroundColor: "#018CD1", color: "white" }}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Sí, eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const AeCard = ({
  ae,
  onEdit,
  onDelete,
}: {
  ae: AccionEstrategica;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <div className="rounded-lg shadow-md border border-[#9A9A9A] overflow-hidden flex flex-col">
    <div className="bg-[#EAE7E7] p-4 flex-grow text-center">
      <div className="bg-[#1A5581] text-white py-2 px-4 rounded-lg inline-block mb-4">
        <h3 className="text-base font-bold">{ae.codigo}</h3>
      </div>
      <h4 className="text-sm font-semibold text-gray-800 mb-2">{ae.nombre}</h4>
      <p className="text-sm text-gray-700 min-h-[40px]">
        {ae.descripcion || "Sin descripción"}
      </p>
    </div>
    <div className="bg-white p-4 flex justify-center gap-2 border-t border-[#9A9A9A]">
      <Button
        size="icon"
        onClick={onEdit}
        className="bg-[#1A5581] hover:bg-[#1A5581]/90 h-10 w-10"
      >
        <Pencil className="h-5 w-5 text-white" />
      </Button>
      <Button
        size="icon"
        onClick={onDelete}
        className="bg-[#1A5581] hover:bg-[#1A5581]/90 h-10 w-10"
      >
        <Trash2 className="h-5 w-5 text-white" />
      </Button>
    </div>
  </div>
);

function AeDashboardPageContent() {
  // State for PGDs
  const [pgds, setPgds] = useState<PGD[]>([]);
  const [selectedPgdId, setSelectedPgdId] = useState<string | undefined>(undefined);
  const [isLoadingPgds, setIsLoadingPgds] = useState(true);

  // State for OEGDs
  const [oegds, setOegds] = useState<OEGD[]>([]);
  const [selectedOegdId, setSelectedOegdId] = useState<string | undefined>(undefined);
  const [isLoadingOegds, setIsLoadingOegds] = useState(false);

  // State for AEs
  const [aes, setAes] = useState<AccionEstrategica[]>([]);
  const [isLoadingAes, setIsLoadingAes] = useState(false);

  // State for modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAe, setEditingAe] = useState<AccionEstrategica | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingAe, setDeletingAe] = useState<AccionEstrategica | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  // Load PGDs
  const loadPGDs = useCallback(async () => {
    setIsLoadingPgds(true);
    setError(null);
    try {
      const data = await getPGDs();
      setPgds(data);
      if (data.length > 0 && !selectedPgdId) {
        setSelectedPgdId(data[0].id.toString());
      }
    } catch (err: any) {
      console.error("Error loading PGDs:", err);
      setError(err.message || "Error al cargar los planes de gobierno digital");
      toast({
        title: "Error",
        description: "No se pudieron cargar los planes de gobierno digital",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPgds(false);
    }
  }, [selectedPgdId, toast]);

  // Load OEGDs when PGD changes
  const loadOEGDs = useCallback(async (pgdId: number) => {
    setIsLoadingOegds(true);
    try {
      const data = await getOEGDsByPGD(pgdId);
      setOegds(data);
      // Reset OEGD selection
      if (data.length > 0) {
        setSelectedOegdId(data[0].id.toString());
      } else {
        setSelectedOegdId(undefined);
        setAes([]);
      }
    } catch (err: any) {
      console.error("Error loading OEGDs:", err);
      toast({
        title: "Error",
        description: "No se pudieron cargar los OEGD",
        variant: "destructive",
      });
    } finally {
      setIsLoadingOegds(false);
    }
  }, [toast]);

  // Load AEs when OEGD changes
  const loadAEs = useCallback(async (oegdId: number) => {
    setIsLoadingAes(true);
    try {
      const data = await getAccionesEstrategicasByOEGD(oegdId);
      setAes(data);
    } catch (err: any) {
      console.error("Error loading AEs:", err);
      toast({
        title: "Error",
        description: "No se pudieron cargar las acciones estratégicas",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAes(false);
    }
  }, [toast]);

  // Initial load
  useEffect(() => {
    loadPGDs();
  }, []);

  // Load OEGDs when PGD changes
  useEffect(() => {
    if (selectedPgdId) {
      loadOEGDs(Number(selectedPgdId));
    }
  }, [selectedPgdId, loadOEGDs]);

  // Load AEs when OEGD changes
  useEffect(() => {
    if (selectedOegdId) {
      loadAEs(Number(selectedOegdId));
    }
  }, [selectedOegdId, loadAEs]);

  const handleOpenModal = (ae: AccionEstrategica | null = null) => {
    setEditingAe(ae);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAe(null);
  };

  const handleSaveAe = async (
    data: CreateAccionEstrategicaInput | UpdateAccionEstrategicaInput,
    isEdit: boolean
  ) => {
    try {
      if (isEdit && editingAe) {
        await updateAccionEstrategica(editingAe.id, data as UpdateAccionEstrategicaInput);
        toast({
          title: "Éxito",
          description: "Acción estratégica actualizada correctamente",
        });
      } else {
        await createAccionEstrategica(data as CreateAccionEstrategicaInput);
        toast({
          title: "Éxito",
          description: "Acción estratégica creada correctamente",
        });
      }
      // Reload AEs
      if (selectedOegdId) {
        await loadAEs(Number(selectedOegdId));
      }
    } catch (err: any) {
      console.error("Error saving AE:", err);
      toast({
        title: "Error",
        description: err.message || "Error al guardar la acción estratégica",
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleOpenDeleteModal = (ae: AccionEstrategica) => {
    setDeletingAe(ae);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingAe(null);
  };

  const handleDeleteAe = async () => {
    if (!deletingAe) return;

    setIsDeleting(true);
    try {
      await deleteAccionEstrategica(deletingAe.id);
      toast({
        title: "Éxito",
        description: "Acción estratégica eliminada correctamente",
      });
      handleCloseDeleteModal();
      // Reload AEs
      if (selectedOegdId) {
        await loadAEs(Number(selectedOegdId));
      }
    } catch (err: any) {
      console.error("Error deleting AE:", err);
      toast({
        title: "Error",
        description: err.message || "Error al eliminar la acción estratégica",
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
          { label: "AE" },
        ]}
      >
        <div className="bg-[#D5D5D5] border-y border-[#1A5581]">
          <div className="p-2 flex items-center justify-between w-full">
            <h2 className="font-bold text-black pl-2">
              ACCIÓN ESTRATÉGICA (AE)
            </h2>
            <div className="flex items-center gap-2">
              {isLoadingPgds ? (
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

                  {/* OEGD Selector */}
                  {isLoadingOegds ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Select
                      value={selectedOegdId}
                      onValueChange={setSelectedOegdId}
                      disabled={oegds.length === 0}
                    >
                      <SelectTrigger className="w-[200px] bg-white border-[#484848]">
                        <SelectValue placeholder="Seleccionar OEGD" />
                      </SelectTrigger>
                      <SelectContent>
                        {oegds.map((oegd) => (
                          <SelectItem key={oegd.id} value={oegd.id.toString()}>
                            {oegd.codigo} - {oegd.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Button
                    onClick={() => handleOpenModal()}
                    disabled={!selectedPgdId || oegds.length === 0}
                    style={{ backgroundColor: "#018CD1", color: "white" }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> NUEVO AE
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-[#F9F9F9]">
          {error ? (
            <div className="p-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          ) : isLoadingAes ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#004272]" />
            </div>
          ) : aes.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <AlertCircle className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">
                No hay acciones estratégicas registradas
              </p>
              <p className="text-sm">
                {oegds.length === 0
                  ? "Primero debe registrar un OEGD"
                  : "Haga clic en 'NUEVO AE' para crear una"}
              </p>
            </div>
          ) : (
            <div className="p-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl mx-auto">
                {aes.map((ae) => (
                  <AeCard
                    key={ae.id}
                    ae={ae}
                    onEdit={() => handleOpenModal(ae)}
                    onDelete={() => handleOpenDeleteModal(ae)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <AEModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          ae={editingAe}
          availableOegds={oegds}
          onSave={handleSaveAe}
        />

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleDeleteAe}
          isLoading={isDeleting}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}

export default function AeDashboardPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#004272]" />
        </div>
      }
    >
      <AeDashboardPageContent />
    </React.Suspense>
  );
}
