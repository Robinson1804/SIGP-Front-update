
"use client";

import React from 'react';
import {
  FileText,
  Target,
  Users,
  BarChart,
  Bell,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


type PGD = {
  id: string;
  startYear: number;
  endYear: number;
};

type OEI = {
    id: string;
    name: string;
    description: string;
    indicator: string;
    annualGoals: { year: number, reports: number }[];
};

const initialPgds: PGD[] = [
  { id: "1", startYear: 2020, endYear: 2024 },
];

const initialOeis: OEI[] = [
    { id: '1', name: 'OEI N°1', description: 'Mantener actualizada la infraestructura estadística del país.', indicator: 'Indicador 1', annualGoals: [{year: 2023, reports: 10}] },
    { id: '2', name: 'OEI N°2', description: 'Producir información estadística oficial para los usuarios en general.', indicator: 'Indicador 2', annualGoals: [] },
    { id: '3', name: 'OEI N°3', description: 'Fortalecer el liderazgo y posicionamiento del Sistema Nacional de Estadística (SNE).', indicator: 'Indicador 3', annualGoals: [] },
    { id: '4', name: 'OEI N°4', description: 'Promover la cultura estadística y el uso de la información.', indicator: 'Indicador 4', annualGoals: [] },
];

const availableYears = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);
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
  const [startYear, setStartYear] = React.useState<number | undefined>(pgd?.startYear);
  const [endYear, setEndYear] = React.useState<number | undefined>(pgd?.endYear);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

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


function OEIModal({
  isOpen,
  onClose,
  oei,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  oei: OEI | null;
  onSave: (data: OEI) => void;
}) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [indicator, setIndicator] = React.useState("");
  const [annualGoals, setAnnualGoals] = React.useState<{ year: number, reports: number }[]>([]);
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});

  React.useEffect(() => {
    if (oei) {
      setName(oei.name);
      setDescription(oei.description);
      setIndicator(oei.indicator);
      setAnnualGoals(oei.annualGoals);
    } else {
      setName("");
      setDescription("");
      setIndicator("");
      setAnnualGoals([]);
    }
    setErrors({});
  }, [oei, isOpen]);
  
  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = "El nombre es requerido.";
    if (!description.trim()) newErrors.description = "La descripción es requerida.";
    if (!indicator.trim()) newErrors.indicator = "El indicador es requerido.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    
    onSave({
      id: oei?.id || (Date.now()).toString(),
      name,
      description,
      indicator,
      annualGoals,
    });
    onClose();
  };

  const addAnnualGoal = (year: number) => {
    if (year && !annualGoals.some(g => g.year === year)) {
      setAnnualGoals(prevGoals => [...prevGoals, { year: year, reports: 0 }]);
    }
  };
  
  const removeAnnualGoal = (year: number) => {
    setAnnualGoals(annualGoals.filter(g => g.year !== year));
  };
  
  const updateAnnualGoalReports = (year: number, reports: number) => {
      const parsedReports = isNaN(reports) ? 0 : reports;
      setAnnualGoals(annualGoals.map(g => g.year === year ? {...g, reports: parsedReports } : g));
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] p-0" showCloseButton={false}>
        <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between">
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
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre y/o ID</label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} className={errors.name ? 'border-red-500' : ''} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className={errors.description ? 'border-red-500' : ''} />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>
          <div>
            <label htmlFor="indicator" className="block text-sm font-medium text-gray-700 mb-1">Indicador</label>
            <Input id="indicator" value={indicator} onChange={e => setIndicator(e.target.value)} className={errors.indicator ? 'border-red-500' : ''} />
            {errors.indicator && <p className="text-red-500 text-xs mt-1">{errors.indicator}</p>}
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Metas anuales</label>
            <div className="flex items-center gap-2 mb-2">
                <label className="text-sm">Años</label>
                 <Select onValueChange={(value) => addAnnualGoal(Number(value))}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Seleccionar año" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableYears.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Año</TableHead>
                        <TableHead>N° de informes</TableHead>
                        <TableHead></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {annualGoals.map(goal => (
                        <TableRow key={goal.year}>
                            <TableCell>{goal.year}</TableCell>
                            <TableCell>
                                <Input type="number" value={goal.reports} onChange={e => updateAnnualGoalReports(goal.year, parseInt(e.target.value, 10))} />
                            </TableCell>
                            <TableCell>
                                <Button variant="destructive" size="icon" onClick={() => removeAnnualGoal(goal.year)} className="h-8 w-8">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
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

function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
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
                    <AlertTriangle className="h-16 w-16 text-black mb-4" strokeWidth={1.5}/>
                    <p className="font-bold text-lg">¿Estás seguro?</p>
                    <p className="text-muted-foreground">El Objetivo Estratégico Institucional será eliminado</p>
                </div>
                <DialogFooter className="justify-center px-6 pb-6 flex gap-4">
                    <Button variant="outline" onClick={onClose} style={{borderColor: '#CFD6DD', color: 'black'}}>Cancelar</Button>
                    <Button onClick={onConfirm} style={{backgroundColor: '#018CD1', color: 'white'}}>Sí, eliminar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const OeiCard = ({ oei, onEdit, onDelete }: { oei: OEI, onEdit: () => void; onDelete: () => void; }) => (
    <div className="rounded-lg shadow-md border border-[#9A9A9A] overflow-hidden flex flex-col">
        <div className="bg-[#EAE7E7] p-4 flex-grow text-center">
            <div className="bg-[#1A5581] text-white py-2 px-4 rounded-lg inline-block mb-4">
                <h3 className="text-base font-bold">{oei.name}</h3>
            </div>
            <p className="text-sm text-gray-700 min-h-[40px]">{oei.description}</p>
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

const navItems = [
  { label: "PGD", icon: FileText, href: "/pmo-dashboard" },
  { label: "POI", icon: Target, href: "#" },
  { label: "RECURSOS HUMANOS", icon: Users, href: "#" },
  { label: "DASHBOARD", icon: BarChart, href: "#" },
  { label: "NOTIFICACIONES", icon: Bell, href: "#" },
];

export default function OeiDashboardPage() {
  const [pgds, setPgds] = React.useState<PGD[]>(initialPgds);
  const [selectedPgd, setSelectedPgd] = React.useState<string | undefined>(
    pgds.length > 0 ? pgds[0].id : undefined
  );
  const [isPgdModalOpen, setIsPgdModalOpen] = React.useState(false);
  const [editingPgd, setEditingPgd] = React.useState<PGD | null>(null);

  const [oeis, setOeis] = React.useState<OEI[]>(initialOeis);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingOei, setEditingOei] = React.useState<OEI | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [deletingOei, setDeletingOei] = React.useState<OEI | null>(null);

  const handleOpenPgdModal = (pgd: PGD | null = null) => {
    setEditingPgd(pgd);
    setIsPgdModalOpen(true);
  };

  const handleClosePgdModal = () => {
    setIsPgdModalOpen(false);
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

  const handleOpenModal = (oei: OEI | null = null) => {
    setEditingOei(oei);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOei(null);
  };

  const handleSaveOei = (oei: OEI) => {
    const exists = oeis.some(o => o.id === oei.id);
    if (exists) {
        setOeis(oeis.map(o => o.id === oei.id ? oei : o));
    } else {
        setOeis([...oeis, oei]);
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

  const handleDeleteOei = () => {
    if (deletingOei) {
        setOeis(oeis.filter(o => o.id !== deletingOei.id));
        handleCloseDeleteModal();
    }
  };


  return (
    <AppLayout
      navItems={navItems}
      breadcrumbs={[
          { label: "PGD", href: "/pmo-dashboard" },
          { label: "OEI" },
        ]}
    >
      <div className="bg-[#D5D5D5] border-y border-[#1A5581]">
        <div className="p-2 flex items-center justify-between w-full">
          <h2 className="font-bold text-black pl-2">
            OBJETIVO ESTRATÉGICO INSTITUCIONAL (OEI)
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
              onClick={() => handleOpenPgdModal()}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              style={{ backgroundColor: "#3B4466", color: "white" }}
              className="border border-[#979797]"
              disabled={!selectedPgd}
              onClick={() =>
                handleOpenPgdModal(pgds.find((p) => p.id === selectedPgd) || null)
              }
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button onClick={() => handleOpenModal()} style={{backgroundColor: '#018CD1', color: 'white'}}>
              <Plus className="mr-2 h-4 w-4" /> NUEVO OEI
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#F9F9F9]">
        <div className="p-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl mx-auto">
            {oeis.map((oei) => (
              <OeiCard key={oei.id} oei={oei} onEdit={() => handleOpenModal(oei)} onDelete={() => handleOpenDeleteModal(oei)} />
            ))}
          </div>
        </div>
      </div>

      <PGDModal
        isOpen={isPgdModalOpen}
        onClose={handleClosePgdModal}
        pgd={editingPgd}
        onSave={handleSavePgd}
        onDelete={handleDeletePgd}
      />

      <OEIModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        oei={editingOei}
        onSave={handleSaveOei}
      />
      
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteOei}
      />

    </AppLayout>
  );
}
