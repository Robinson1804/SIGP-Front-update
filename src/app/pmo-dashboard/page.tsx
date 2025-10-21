
"use client";

import { useState } from "react";
import {
  FileText,
  Target,
  Users,
  BarChart,
  Bell,
  Landmark,
  Briefcase,
  ListTodo,
  FolderKanban,
  Plus,
  Pencil,
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
} from "@/components/ui/dialog";
import { X } from "lucide-react";

type PGD = {
  id: string;
  startYear: number;
  endYear: number;
};

const initialPgds: PGD[] = [
  { id: "1", startYear: 2020, endYear: 2024 },
];

const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

function PGDModal({
  isOpen,
  onClose,
  pgd,
  onSave,
  onDelete,
}: {
  isOpen: boolean;
  onClose: () => void;
  pgd: PGD | null;
  onSave: (data: { startYear: number; endYear: number }) => void;
  onDelete?: (id: string) => void;
}) {
  const [startYear, setStartYear] = useState<number | undefined>(pgd?.startYear);
  const [endYear, setEndYear] = useState<number | undefined>(pgd?.endYear);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    if (startYear && endYear) {
      if (endYear - startYear !== 4) {
        alert("El rango debe ser de 4 años.");
        return;
      }
       if (endYear < startYear) {
        alert("El año final no puede ser menor al año de inicio.");
        return;
      }
      onSave({ startYear, endYear });
      onClose();
    }
  };
  
  const handleDelete = () => {
      if (pgd?.id) {
          onDelete?.(pgd.id);
          setShowDeleteConfirm(false);
          onClose();
      }
  }

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] p-0">
          <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg">
            <DialogTitle className="flex justify-between items-center">
              {pgd ? "EDITAR PLAN DE GOBIERNO DIGITAL (PGD)" : "REGISTRAR PLAN DE GOBIERNO DIGITAL (PGD)"}
              <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="startYear" className="block text-sm font-medium text-gray-700 mb-1">Año Inicio:</label>
                    <Select onValueChange={(value) => setStartYear(Number(value))} defaultValue={startYear?.toString()}>
                        <SelectTrigger id="startYear">
                            <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div>
                    <label htmlFor="endYear" className="block text-sm font-medium text-gray-700 mb-1">Año Final:</label>
                    <Select onValueChange={(value) => setEndYear(Number(value))} defaultValue={endYear?.toString()}>
                        <SelectTrigger id="endYear">
                            <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </div>
          <DialogFooter className="px-6 pb-6 flex justify-between">
            {pgd ? (
              <>
                <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>Eliminar</Button>
                <Button onClick={handleSave}>Guardar</Button>
              </>
            ) : (
                <div className="w-full flex justify-end gap-2">
                 <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                 <Button onClick={handleSave}>Guardar</Button>
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
                <p>¿Está seguro de que desea eliminar el plan {pgd?.startYear} - {pgd?.endYear}? Esta acción no se puede deshacer.</p>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
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
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  bgColor: string;
}) => (
  <Card className="flex flex-col overflow-hidden w-full max-w-sm">
    <div className={`flex items-center justify-center p-8 ${bgColor}`}>
      <Icon className="h-16 w-16 text-gray-700" strokeWidth={1} />
    </div>
    <CardContent className="p-6 bg-white flex flex-col flex-grow items-center text-center justify-center">
      <h3 className="text-xl font-bold text-center">{title}</h3>
      <p className="text-muted-foreground text-sm mt-1 mb-4 text-center">{subtitle}</p>
      <div className="mt-auto w-full pt-4">
        <Button className="w-full">INGRESAR</Button>
      </div>
    </CardContent>
  </Card>
);

const navItems = [
  { label: "PGD", icon: FileText, href: "/pmo-dashboard" },
  { label: "POI", icon: Target, href: "#" },
  { label: "RECURSOS HUMANOS", icon: Users, href: "#" },
  { label: "DASHBOARD", icon: BarChart, href: "#" },
  { label: "NOTIFICACIONES", icon: Bell, href: "#" },
];

export default function PmoDashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPgd, setEditingPgd] = useState<PGD | null>(null);
  const [pgds, setPgds] = useState<PGD[]>(initialPgds);
  const [selectedPgd, setSelectedPgd] = useState<string | undefined>(
    pgds.length > 0 ? pgds[0].id : undefined
  );

  const handleOpenModal = (pgd: PGD | null = null) => {
    setEditingPgd(pgd);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPgd(null);
  };

  const handleSavePgd = (data: { startYear: number; endYear: number }) => {
    if (editingPgd) {
      const updatedPgds = pgds.map((p) =>
        p.id === editingPgd.id ? { ...p, ...data } : p
      );
      setPgds(updatedPgds);
    } else {
      const newPgd = { id: (pgds.length + 1).toString(), ...data };
      const updatedPgds = [...pgds, newPgd];
      setPgds(updatedPgds);
      setSelectedPgd(newPgd.id);
    }
  };

  const handleDeletePgd = (id: string) => {
    const updatedPgds = pgds.filter((p) => p.id !== id);
    setPgds(updatedPgds);
    if (selectedPgd === id) {
      const newSelectedId = updatedPgds.length > 0 ? updatedPgds[0].id : undefined;
      setSelectedPgd(newSelectedId);
    }
  };
  
  const cardsData = [
    { icon: Landmark, title: "OEI", subtitle: "(Objetivo Estratégico Institucional)", bgColor: "bg-[#EFF4FF]" },
    { icon: Target, title: "OGD", subtitle: "(Objetivo de Gobierno Digital)", bgColor: "bg-[#FFD8D8]" },
    { icon: Briefcase, title: "OEGD", subtitle: "(Objetivo Específico de Gobierno Digital)", bgColor: "bg-[#FCF3EA]" },
    { icon: ListTodo, title: "AE", subtitle: "(Acción Estratégica)", bgColor: "bg-[#EAEAEA]" },
    { icon: FolderKanban, title: "Proyectos PGD", subtitle: "(Plan Operativo Informático)", bgColor: "bg-[#E7F5DF]" },
  ];

  return (
    <AppLayout
      navItems={navItems}
      breadcrumbs={[{ label: "PGD" }]}
    >
      <div className="bg-[#D5D5D5] border-y border-[#1A5581]">
        <div className="p-2 flex items-center justify-between w-full">
          <h2 className="font-bold text-black pl-2">
            PLAN DE GOBIERNO DIGITAL (PGD)
          </h2>
          <div className="flex items-center gap-2">
            <Select value={selectedPgd} onValueChange={setSelectedPgd}>
              <SelectTrigger className="w-[180px] bg-white border-[#484848]">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {pgds.map((pgd) => (
                  <SelectItem
                    key={pgd.id}
                    value={pgd.id}
                  >{`${pgd.startYear} - ${pgd.endYear}`}</SelectItem>
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
              onClick={() =>
                handleOpenModal(pgds.find((p) => p.id === selectedPgd) || null)
              }
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-[#F9F9F9] p-6 flex-1 flex items-center justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full max-w-7xl justify-center">
            {cardsData.map((card, index) => (
              <CardItem key={index} {...card} />
            ))}
          </div>
        </div>
      </div>

      <PGDModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        pgd={editingPgd}
        onSave={handleSavePgd}
        onDelete={handleDeletePgd}
      />
    </AppLayout>
  );
}
