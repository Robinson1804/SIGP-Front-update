
"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Home,
  LogOut,
  Menu,
  Pencil,
  Plus,
  Settings,
  Target,
  BarChart,
  Bell,
  Users,
  Building,
  Briefcase,
  User,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

const ineiLogo = PlaceHolderImages.find((img) => img.id === "inei-logo");

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
          <DialogFooter className="px-6 pb-6 flex justify-end gap-2">
            {pgd ? (
              <>
                <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>Eliminar</Button>
                <Button onClick={handleSave}>Guardar</Button>
              </>
            ) : (
                <>
                 <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                 <Button onClick={handleSave}>Guardar</Button>
                </>
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
  <Card className="flex flex-col text-center overflow-hidden h-full">
    <div
      className={`flex-grow flex items-center justify-center p-6 ${bgColor}`}
    >
      <Icon className="h-20 w-20 text-gray-700" strokeWidth={1} />
    </div>
    <CardContent className="p-6 bg-white flex flex-col flex-grow">
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground text-sm mt-1 mb-4">{subtitle}</p>
      <div className="mt-auto">
        <Button className="w-full">INGRESAR</Button>
      </div>
    </CardContent>
  </Card>
);

const UserProfile = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button className="flex items-center gap-3 text-white">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200/50">
          <User className="h-6 w-6 text-white" />
        </div>
        <div className="text-left hidden md:block">
          <p className="font-bold">EDUARDO CORILLA</p>
          <p className="text-xs">PMO</p>
        </div>
        <ChevronDown className="h-4 w-4" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-56" align="end">
      <DropdownMenuItem>
        <User className="mr-2 h-4 w-4" />
        <span>Ir a perfil</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem>
        <LogOut className="mr-2 h-4 w-4" />
        <span>Cerrar sesión</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const navItems = [
  { label: "PGD", icon: FileText, href: "#" },
  { label: "POI", icon: Target, href: "#" },
  { label: "RECURSOS HUMANOS", icon: Users, href: "#" },
  { label: "DASHBOARD", icon: BarChart, href: "#" },
  { label: "NOTIFICACIONES", icon: Bell, href: "#" },
];

export default function PmoDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPgd, setEditingPgd] = useState<PGD | null>(null);
  const [pgds, setPgds] = useState<PGD[]>(initialPgds);
  const [selectedPgd, setSelectedPgd] = useState<string | undefined>(pgds[0]?.id);

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
      // Edit
      const updatedPgds = pgds.map((p) =>
        p.id === editingPgd.id ? { ...p, ...data } : p
      );
      setPgds(updatedPgds);
    } else {
      // Create
      const newPgd = { id: (pgds.length + 1).toString(), ...data };
      const updatedPgds = [...pgds, newPgd];
      setPgds(updatedPgds);
      setSelectedPgd(newPgd.id);
    }
  };

  const handleDeletePgd = (id: string) => {
    const updatedPgds = pgds.filter(p => p.id !== id);
    setPgds(updatedPgds);
    if(selectedPgd === id){
        setSelectedPgd(undefined);
    }
  };

  const cardsData = [
    { icon: Building, title: "OEI", subtitle: "(Objetivo Estratégico Institucional)", bgColor: "bg-[#EFF4FF]" },
    { icon: Target, title: "OGD", subtitle: "(Objetivo de Gobierno Digital)", bgColor: "bg-[#FFD8D8]" },
    { icon: Briefcase, title: "OEGD", subtitle: "(Objetivo Específico de Gobierno Digital)", bgColor: "bg-[#FCF3EA]" },
    { icon: BarChart, title: "AE", subtitle: "(Acción Estratégica)", bgColor: "bg-[#EAEAEA]" },
    { icon: Settings, title: "Proyectos PGD", subtitle: "(Plan Operativo Informático)", bgColor: "bg-[#E7F5DF]" },
  ];

  return (
    <div className="flex h-screen w-full bg-[#F9F9F9] font-body">
      {/* Sidebar */}
      <aside
        className={`bg-[#EEEEEE] text-black transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0"
        } overflow-hidden fixed h-full z-20 flex flex-col`}
      >
        <div className="p-4 flex justify-end">
            <button onClick={() => setSidebarOpen(false)} className="md:hidden">
              <Menu className="h-6 w-6" />
            </button>
        </div>
        <nav className="flex-grow px-4 space-y-[25px]">
          {navItems.map((item, index) => (
            <a
              key={item.label}
              href={item.href}
              className={`flex items-center p-2 rounded-md border border-gray-300 ${
                index === 0 ? "bg-[#005999] text-white" : ""
              }`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        {ineiLogo && (
          <div className="p-4 mt-auto flex justify-center">
            <Image
              src={ineiLogo.imageUrl}
              alt={ineiLogo.description}
              width={100}
              height={50}
              data-ai-hint={ineiLogo.imageHint}
            />
          </div>
        )}
      </aside>

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "md:ml-64" : "ml-0"
        }`}
      >
        {/* Header */}
        <header className="bg-[#004272] text-white p-2 flex items-center justify-between fixed top-0 w-full z-10 h-16">
           <div className="flex-1 text-center">
             <h1 className="text-xl font-bold">
               SISTEMA DE ADMINISTRACIÓN DE PROYECTO - OTIN
             </h1>
           </div>
           <div className="absolute right-4">
             <UserProfile />
           </div>
        </header>

        <main className="flex-1 flex flex-col pt-16">
          {/* Bar 1 */}
          <div className="bg-[#D5D5D5] p-2 flex items-center gap-2 w-full">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded hover:bg-gray-400/50"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Home className="h-5 w-5" />
            <ChevronRight className="h-4 w-4 text-gray-600" />
            <span className="font-semibold">PGD</span>
          </div>

          {/* Content */}
          <div className="p-4 flex-1">
            {/* Toolbar */}
            <div className="bg-[#D5D5D5] p-2 flex items-center justify-between w-full border border-[#1A5581]">
              <h2 className="font-bold">PLAN DE GOBIERNO DIGITAL (PGD)</h2>
              <div className="flex items-center gap-2">
                <Select value={selectedPgd} onValueChange={setSelectedPgd}>
                  <SelectTrigger className="w-[180px] bg-white">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {pgds.map(pgd => (
                       <SelectItem key={pgd.id} value={pgd.id}>{`${pgd.startYear} - ${pgd.endYear}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="icon" variant="outline" className="bg-white" onClick={() => handleOpenModal()}>
                  <Plus className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" className="bg-white" disabled={!selectedPgd} onClick={() => handleOpenModal(pgds.find(p => p.id === selectedPgd) || null)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Grid */}
            <div className="bg-[#F9F9F9] p-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 h-full">
                  {cardsData.map((card, index) => (
                    <CardItem key={index} {...card} />
                  ))}
              </div>
            </div>
          </div>
        </main>
      </div>

       <PGDModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        pgd={editingPgd}
        onSave={handleSavePgd}
        onDelete={handleDeletePgd}
      />
    </div>
  );
}
