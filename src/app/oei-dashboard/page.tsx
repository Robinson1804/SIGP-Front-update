
"use client";

import { useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
    { id: '1', name: 'OEI N°1', description: 'Mantener actualizada la infraestructura estadística del país.', indicator: '', annualGoals: [] },
    { id: '2', name: 'OEI N°2', description: 'Producir información estadística oficial para los usuarios en general.', indicator: '', annualGoals: [] },
    { id: '3', name: 'OEI N°3', description: 'Fortalecer el liderazgo y posicionamiento del Sistema Nacional de Estadística (SNE).', indicator: '', annualGoals: [] },
];

const availableYears = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);


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
  const [name, setName] = useState(oei?.name || "");
  const [description, setDescription] = useState(oei?.description || "");
  const [indicator, setIndicator] = useState(oei?.indicator || "");
  const [annualGoals, setAnnualGoals] = useState(oei?.annualGoals || []);
  const [selectedYear, setSelectedYear] = useState<number | undefined>();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name) newErrors.name = "El nombre es requerido.";
    if (!description) newErrors.description = "La descripción es requerida.";
    if (!indicator) newErrors.indicator = "El indicador es requerido.";
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

  const addAnnualGoal = () => {
    if (selectedYear && !annualGoals.some(g => g.year === selectedYear)) {
      setAnnualGoals([...annualGoals, { year: selectedYear, reports: 0 }]);
    }
  };
  
  const removeAnnualGoal = (year: number) => {
    setAnnualGoals(annualGoals.filter(g => g.year !== year));
  };
  
  const updateAnnualGoal = (year: number, reports: number) => {
      setAnnualGoals(annualGoals.map(g => g.year === year ? {...g, reports: isNaN(reports) ? 0 : reports } : g));
  }
  
  React.useEffect(() => {
    if (selectedYear) {
      addAnnualGoal();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] p-0">
        <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg">
          <DialogTitle className="flex justify-between items-center">
            {oei ? "EDITAR OBJETIVO ESTRATÉGICO INSTITUCIONAL (OEI)" : "REGISTRAR OBJETIVO ESTRATÉGICO INSTITUCIONAL (OEI)"}
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
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
                 <Select onValueChange={(value) => setSelectedYear(Number(value))}>
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
                                <Input type="number" value={goal.reports} onChange={e => updateAnnualGoal(goal.year, parseInt(e.target.value))} />
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
    oei,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    oei: OEI | null;
}) {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-0">
                 <DialogHeader className="p-4 flex flex-row justify-between items-center">
                    <DialogTitle>AVISO</DialogTitle>
                    <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-200">
                        <X className="h-4 w-4" />
                    </Button>
                </DialogHeader>
                <div className="p-6 text-center flex flex-col items-center">
                    <AlertTriangle className="h-16 w-16 text-black mb-4" strokeWidth={1}/>
                    <p className="font-bold text-lg">¿Estás seguro?</p>
                    <p className="text-muted-foreground">El Objetivo Estratégico Institucional será eliminado</p>
                </div>
                <DialogFooter className="px-6 pb-6 flex justify-center gap-4">
                    <Button variant="outline" onClick={onClose} style={{borderColor: '#CFD6DD', color: 'black'}}>Cancelar</Button>
                    <Button onClick={onConfirm} style={{backgroundColor: '#018CD1', color: 'white'}}>Sí, eliminar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const OeiCard = ({ oei, onEdit, onDelete }: { oei: OEI, onEdit: () => void; onDelete: () => void; }) => (
    <Card className="flex flex-col overflow-hidden border-[#9A9A9A] shadow-md">
        <div className="bg-[#EAE7E7] p-4">
            <div className="bg-[#1A5581] text-white py-1 px-3 rounded-md inline-block">
                <h3 className="text-sm font-bold">{oei.name}</h3>
            </div>
        </div>
        <CardContent className="p-4 bg-white flex-grow flex flex-col">
            <p className="text-sm text-gray-600 flex-grow mb-4">{oei.description}</p>
            <div className="flex justify-end gap-2">
                <Button size="icon" onClick={onEdit} className="bg-[#1A5581] hover:bg-[#1A5581]/90 h-8 w-8">
                    <Pencil className="h-4 w-4 text-white" />
                </Button>
                <Button size="icon" onClick={onDelete} className="bg-[#1A5581] hover:bg-[#1A5581]/90 h-8 w-8">
                    <Trash2 className="h-4 w-4 text-white" />
                </Button>
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

export default function OeiDashboardPage() {
  const [pgds] = useState<PGD[]>(initialPgds);
  const [selectedPgd, setSelectedPgd] = useState<string | undefined>(
    pgds.length > 0 ? pgds[0].id : undefined
  );
  
  const [oeis, setOeis] = useState<OEI[]>(initialOeis);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOei, setEditingOei] = useState<OEI | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingOei, setDeletingOei] = useState<OEI | null>(null);

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
              onClick={() => {}}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              style={{ backgroundColor: "#3B4466", color: "white" }}
              className="border border-[#979797]"
              disabled={!selectedPgd}
              onClick={() => {}}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl mx-auto">
            {oeis.map((oei) => (
              <OeiCard key={oei.id} oei={oei} onEdit={() => handleOpenModal(oei)} onDelete={() => handleOpenDeleteModal(oei)} />
            ))}
          </div>
        </div>
      </div>

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
        oei={deletingOei}
      />

    </AppLayout>
  );
}
