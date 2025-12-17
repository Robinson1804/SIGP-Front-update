"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Landmark,
  Briefcase,
  ListTodo,
  FolderKanban,
  Plus,
  Pencil,
  Target,
  X,
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { paths } from "@/lib/paths";
import { ProtectedRoute } from "@/features/auth";
import { MODULES } from "@/lib/definitions";
import { useToast } from "@/lib/hooks/use-toast";

// Import from planning module
import {
  getPGDs,
  createPGD,
  updatePGD,
  deletePGD,
  type PGD,
  type CreatePGDInput,
  type UpdatePGDInput,
} from "@/features/planning";

const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

function PGDModal({
  isOpen,
  onClose,
  pgd,
  onSave,
  onDelete,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  pgd: PGD | null;
  onSave: (data: CreatePGDInput | UpdatePGDInput) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  isLoading?: boolean;
}) {
  const [startYear, setStartYear] = useState<number | undefined>(pgd?.anioInicio);
  const [endYear, setEndYear] = useState<number | undefined>(pgd?.anioFin);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (pgd) {
      setStartYear(pgd.anioInicio);
      setEndYear(pgd.anioFin);
    } else {
      setStartYear(undefined);
      setEndYear(undefined);
    }
  }, [pgd, isOpen]);

  const handleSave = async () => {
    if (startYear && endYear) {
      if (endYear - startYear !== 4) {
        alert("El rango debe ser de 4 años.");
        return;
      }
      if (endYear < startYear) {
        alert("El año final no puede ser menor al año de inicio.");
        return;
      }
      setSaving(true);
      try {
        await onSave({ anioInicio: startYear, anioFin: endYear });
        onClose();
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDelete = async () => {
    if (pgd?.id && onDelete) {
      setSaving(true);
      try {
        await onDelete(pgd.id);
        setShowDeleteConfirm(false);
        onClose();
      } finally {
        setSaving(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] p-0" showCloseButton={false}>
          <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between">
            <DialogTitle>
              {pgd ? "EDITAR PLAN DE GOBIERNO DIGITAL (PGD)" : "REGISTRAR PLAN DE GOBIERNO DIGITAL (PGD)"}
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
                <label htmlFor="startYear" className="block text-sm font-medium text-gray-700 mb-1">
                  Año Inicio:
                </label>
                <Select
                  onValueChange={(value) => setStartYear(Number(value))}
                  value={startYear?.toString()}
                >
                  <SelectTrigger id="startYear">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="endYear" className="block text-sm font-medium text-gray-700 mb-1">
                  Año Final:
                </label>
                <Select
                  onValueChange={(value) => setEndYear(Number(value))}
                  value={endYear?.toString()}
                >
                  <SelectTrigger id="endYear">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="px-6 pb-6 flex justify-between">
            {pgd ? (
              <>
                <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={saving}>
                  Eliminar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Guardar
                </Button>
              </>
            ) : (
              <div className="w-full flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose} disabled={saving}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Guardar
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showDeleteConfirm && (
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
            </DialogHeader>
            <p>
              ¿Está seguro de que desea eliminar el plan {pgd?.anioInicio} - {pgd?.anioFin}? Esta acción
              no se puede deshacer.
            </p>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

const CardItem = ({
  icon: Icon,
  title,
  subtitle,
  bgColor,
  href,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  bgColor: string;
  href: string;
}) => (
  <Card className="flex flex-col overflow-hidden w-full max-w-sm">
    <div className={`flex items-center justify-center p-12 ${bgColor}`}>
      <Icon className="h-24 w-24 text-gray-700" strokeWidth={1} />
    </div>
    <CardContent className="p-6 bg-white flex flex-col flex-grow items-center text-center justify-center">
      <h3 className="text-xl font-bold text-center">{title}</h3>
      <p className="text-muted-foreground text-sm mt-1 mb-4 text-center">{subtitle}</p>
      <div className="mt-auto w-full pt-4">
        <Button asChild size="sm" className="w-3/4 mx-auto text-xs">
          <Link href={href}>INGRESAR</Link>
        </Button>
      </div>
    </CardContent>
  </Card>
);

function PgdDashboardPageContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPgd, setEditingPgd] = useState<PGD | null>(null);
  const [pgds, setPgds] = useState<PGD[]>([]);
  const [selectedPgdId, setSelectedPgdId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Cargar PGDs desde el backend
  const loadPGDs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPGDs();
      setPgds(data);
      // Si hay PGDs y no hay uno seleccionado, seleccionar el primero
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
      setIsLoading(false);
    }
  }, [selectedPgdId, toast]);

  useEffect(() => {
    loadPGDs();
  }, []);

  const handleOpenModal = (pgd: PGD | null = null) => {
    setEditingPgd(pgd);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPgd(null);
  };

  const handleSavePgd = async (data: CreatePGDInput | UpdatePGDInput) => {
    try {
      if (editingPgd) {
        // Actualizar PGD existente
        await updatePGD(editingPgd.id, data as UpdatePGDInput);
        toast({
          title: "Éxito",
          description: "Plan de gobierno digital actualizado correctamente",
        });
      } else {
        // Crear nuevo PGD
        const newPgd = await createPGD(data as CreatePGDInput);
        setSelectedPgdId(newPgd.id.toString());
        toast({
          title: "Éxito",
          description: "Plan de gobierno digital creado correctamente",
        });
      }
      // Recargar lista
      await loadPGDs();
    } catch (err: any) {
      console.error("Error saving PGD:", err);
      toast({
        title: "Error",
        description: err.message || "Error al guardar el plan de gobierno digital",
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleDeletePgd = async (id: number) => {
    try {
      await deletePGD(id);
      toast({
        title: "Éxito",
        description: "Plan de gobierno digital eliminado correctamente",
      });
      // Recargar lista y seleccionar otro PGD si es necesario
      if (selectedPgdId === id.toString()) {
        setSelectedPgdId(undefined);
      }
      await loadPGDs();
    } catch (err: any) {
      console.error("Error deleting PGD:", err);
      toast({
        title: "Error",
        description: err.message || "Error al eliminar el plan de gobierno digital",
        variant: "destructive",
      });
      throw err;
    }
  };

  const selectedPgd = pgds.find((p) => p.id.toString() === selectedPgdId);

  const cardsData = [
    {
      icon: Landmark,
      title: "OEI",
      subtitle: "(Objetivo Estratégico Institucional)",
      bgColor: "bg-[#EFF4FF]",
      href: paths.pgd.oei,
    },
    {
      icon: Target,
      title: "OGD",
      subtitle: "(Objetivo de Gobierno Digital)",
      bgColor: "bg-[#FFD8D8]",
      href: paths.pgd.ogd,
    },
    {
      icon: Briefcase,
      title: "OEGD",
      subtitle: "(Objetivo Específico de Gobierno Digital)",
      bgColor: "bg-[#FCF3EA]",
      href: paths.pgd.oegd,
    },
    {
      icon: ListTodo,
      title: "AE",
      subtitle: "(Acción Estratégica)",
      bgColor: "bg-[#EAEAEA]",
      href: paths.pgd.ae,
    },
    {
      icon: FolderKanban,
      title: "Proyectos PGD",
      subtitle: "(Plan Operativo Informático)",
      bgColor: "bg-[#E7F5DF]",
      href: paths.pgd.proyectos,
    },
  ];

  return (
    <ProtectedRoute module={MODULES.PGD}>
      <AppLayout breadcrumbs={[{ label: "PGD" }]}>
        <div className="bg-[#D5D5D5] border-y border-[#1A5581]">
          <div className="p-2 flex items-center justify-between w-full">
            <h2 className="font-bold text-black pl-2">PLAN DE GOBIERNO DIGITAL (PGD)</h2>
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
                    size="icon"
                    style={{ backgroundColor: "#3B4466", color: "white" }}
                    className="border border-[#979797]"
                    onClick={() => handleOpenModal()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    style={{ backgroundColor: "#3B4466", color: "white" }}
                    className="border border-[#979797]"
                    disabled={!selectedPgd}
                    onClick={() => handleOpenModal(selectedPgd || null)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {error ? (
            <div className="p-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="bg-[#F9F9F9] p-6 flex-1 flex items-center justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-[0.8rem] w-full max-w-7xl justify-center">
                {cardsData.map((card, index) => (
                  <CardItem key={index} {...card} />
                ))}
              </div>
            </div>
          )}
        </div>

        <PGDModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          pgd={editingPgd}
          onSave={handleSavePgd}
          onDelete={handleDeletePgd}
          isLoading={isLoading}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}

export default function PgdPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#004272]" />
        </div>
      }
    >
      <PgdDashboardPageContent />
    </React.Suspense>
  );
}
