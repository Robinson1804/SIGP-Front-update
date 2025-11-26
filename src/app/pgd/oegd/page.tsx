
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
import { paths } from '@/lib/paths';

type PGD = {
  id: string;
  startYear: number;
  endYear: number;
};

type OGD = {
    id: string;
    name: string;
    description: string;
};

type OEGD = {
    id: string;
    name: string;
    description: string;
    relatedOgd: OGD | null;
};

const initialPgds: PGD[] = [
  { id: "1", startYear: 2020, endYear: 2024 },
];

const availableOgds: OGD[] = [
    { id: '1', name: 'OGD N°1', description: 'Implementar una infraestructura tecnológica moderna para optimizar la producción y difusión de información estadística nacional.' },
    { id: '2', name: 'OGD N°2', description: 'Mantener e implementar sistemas de información eficientes y eficaces garantizando la calidad y seguridad en el INEI.' },
    { id: '3', name: 'OGD N°3', description: 'Proveer el soporte e infraestructura TIC que viabilice las actividades del INEI y del SEN.' },
    { id: '4', name: 'OGD N°4', description: 'Promover el uso de tecnologías emergentes para la innovación en la producción estadística.' },
];

const initialOegds: OEGD[] = [
    { id: '1.1', name: 'OEGD N°1.1', description: 'Fortalecer el uso de la Plataforma de Interoperabilidad del Estado (PIDE) para el intercambio de información con otras entidades públicas.', relatedOgd: availableOgds[0] },
    { id: '2.1', name: 'OEGD N°2.1', description: 'Implementar un sistema de gestión de la seguridad de la información basado en estándares internacionales.', relatedOgd: availableOgds[1] },
    { id: '3.1', name: 'OEGD N°3.1', description: 'Renovar la infraestructura de servidores y almacenamiento para mejorar el rendimiento y la disponibilidad de los servicios TIC.', relatedOgd: availableOgds[2] },
    { id: '4.1', name: 'OEGD N°4.1', description: 'Desarrollar proyectos piloto utilizando Big Data y Machine Learning para la generación de nuevas estadísticas.', relatedOgd: availableOgds[3] },
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
  const [startYear, setStartYear] = React.useState<number | undefined>(pgd?.startYear);
  const [endYear, setEndYear] = React.useState<number | undefined>(pgd?.endYear);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  React.useEffect(() => {
    if (pgd) {
      setStartYear(pgd.startYear);
      setEndYear(pgd.endYear);
    } else {
      setStartYear(undefined);
      setEndYear(undefined);
    }
  }, [pgd, isOpen]);

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


function OEGDModal({
  isOpen,
  onClose,
  oegd,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  oegd: OEGD | null;
  onSave: (data: OEGD) => void;
}) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [relatedOgd, setRelatedOgd] = React.useState<OGD | null>(null);
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});

  React.useEffect(() => {
    if (oegd) {
      setName(oegd.name);
      setDescription(oegd.description);
      setRelatedOgd(oegd.relatedOgd);
    } else {
      setName("");
      setDescription("");
      setRelatedOgd(null);
    }
    setErrors({});
  }, [oegd, isOpen]);
  
  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = "El nombre es requerido.";
    if (!description.trim()) newErrors.description = "La descripción es requerida.";
    if (!relatedOgd) newErrors.relatedOgd = "Debe seleccionar un OGD relacionado.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    
    onSave({
      id: oegd?.id || `${relatedOgd?.id}.${Math.floor(Math.random() * 10)}`,
      name,
      description,
      relatedOgd,
    });
    onClose();
  };

  const handleSelectOgd = (ogdId: string) => {
    const selected = availableOgds.find(ogd => ogd.id === ogdId);
    setRelatedOgd(selected || null);
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] p-0" showCloseButton={false}>
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
            <label htmlFor="ogd-select" className="block text-sm font-medium text-gray-700 mb-1">Objetivo de Gobierno Digital (OGD) del INEI</label>
            <Select onValueChange={handleSelectOgd} disabled={!!relatedOgd}>
                <SelectTrigger id="ogd-select" className={errors.relatedOgd ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar OGD" />
                </SelectTrigger>
                <SelectContent>
                    {availableOgds.map(ogd => <SelectItem key={ogd.id} value={ogd.id}>{ogd.name}</SelectItem>)}
                </SelectContent>
            </Select>
            {errors.relatedOgd && <p className="text-red-500 text-xs mt-1">{errors.relatedOgd}</p>}

            {relatedOgd && (
                 <Table className="mt-4">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre y/o ID</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell>{relatedOgd.name}</TableCell>
                            <TableCell>{relatedOgd.description}</TableCell>
                            <TableCell>
                                <Button variant="destructive" size="icon" onClick={() => setRelatedOgd(null)} className="h-8 w-8">
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
                    <p className="text-muted-foreground">El Objetivo Específico de Gobierno Digital será eliminado</p>
                </div>
                <DialogFooter className="justify-center px-6 pb-6 flex gap-4">
                    <Button variant="outline" onClick={onClose} style={{borderColor: '#CFD6DD', color: 'black'}}>Cancelar</Button>
                    <Button onClick={onConfirm} style={{backgroundColor: '#018CD1', color: 'white'}}>Sí, eliminar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const OegdCard = ({ oegd, onEdit, onDelete }: { oegd: OEGD, onEdit: () => void; onDelete: () => void; }) => (
    <div className="rounded-lg shadow-md border border-[#9A9A9A] overflow-hidden flex flex-col">
        <div className="bg-[#EAE7E7] p-4 flex-grow text-center">
            <div className="bg-[#1A5581] text-white py-2 px-4 rounded-lg inline-block mb-4">
                <h3 className="text-base font-bold">{oegd.name}</h3>
            </div>
            <p className="text-sm text-gray-700 min-h-[40px]">{oegd.description}</p>
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

export default function OegdDashboardPage() {
  const [pgds, setPgds] = React.useState<PGD[]>(initialPgds);
  const [selectedPgd, setSelectedPgd] = React.useState<string | undefined>(
    pgds.length > 0 ? pgds[0].id : undefined
  );
  const [isPgdModalOpen, setIsPgdModalOpen] = React.useState(false);
  const [editingPgd, setEditingPgd] = React.useState<PGD | null>(null);
  
  const [oegds, setOegds] = React.useState<OEGD[]>(initialOegds);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingOegd, setEditingOegd] = React.useState<OEGD | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [deletingOegd, setDeletingOegd] = React.useState<OEGD | null>(null);

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
      const newPgd = { id: (Date.now()).toString(), ...data };
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

  const handleOpenModal = (oegd: OEGD | null = null) => {
    setEditingOegd(oegd);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOegd(null);
  };

  const handleSaveOegd = (oegd: OEGD) => {
    const exists = oegds.some(o => o.id === oegd.id);
    if (exists) {
        setOegds(oegds.map(o => o.id === oegd.id ? oegd : o));
    } else {
        setOegds([...oegds, oegd]);
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

  const handleDeleteOegd = () => {
    if (deletingOegd) {
        setOegds(oegds.filter(o => o.id !== deletingOegd.id));
        handleCloseDeleteModal();
    }
  };


  return (
    <AppLayout
      isPmo={true}
      breadcrumbs={[
          { label: "PGD", href: paths.pgd.base },
          { label: "OEGD" },
        ]}
    >
      <div className="bg-[#D5D5D5] border-y border-[#1A5581]">
        <div className="p-2 flex items-center justify-between w-full">
          <h2 className="font-bold text-black pl-2">
            OBJETIVO ESPECÍFICO DE GOBIERNO DIGITAL (OEGD)
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
              <Plus className="mr-2 h-4 w-4" /> NUEVO OEGD
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#F9F9F9]">
        <div className="p-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl mx-auto">
            {oegds.map((oegd) => (
              <OegdCard key={oegd.id} oegd={oegd} onEdit={() => handleOpenModal(oegd)} onDelete={() => handleOpenDeleteModal(oegd)} />
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

      <OEGDModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        oegd={editingOegd}
        onSave={handleSaveOegd}
      />
      
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteOegd}
      />

    </AppLayout>
  );
}
