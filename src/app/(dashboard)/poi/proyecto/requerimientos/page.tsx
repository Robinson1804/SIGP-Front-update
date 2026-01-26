"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    FileText,
    Search,
    Plus,
    Pencil,
    Trash2,
    X,
    AlertTriangle,
} from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Project, ROLES, MODULES } from '@/lib/definitions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { paths } from '@/lib/paths';
import { useAuth } from '@/stores';
import { ProtectedRoute } from '@/features/auth';

type TipoRequerimiento = 'Requerimiento funcional' | 'Requerimiento no funcional';

type Requerimiento = {
    id: string;
    tipo: TipoRequerimiento;
    descripcion: string;
    origen?: string; // 'acta' o 'manual'
};

// Datos iniciales - simulando requerimientos importados de actas
const initialRequerimientos: Requerimiento[] = [
    // Requerimientos funcionales
    { id: 'RF-1', tipo: 'Requerimiento funcional', descripcion: 'El sistema debe permitir el registro de usuarios con validación de correo electrónico', origen: 'acta' },
    { id: 'RF-2', tipo: 'Requerimiento funcional', descripcion: 'El sistema debe generar reportes en formato PDF y Excel', origen: 'acta' },
    { id: 'RF-3', tipo: 'Requerimiento funcional', descripcion: 'El sistema debe permitir la gestión de roles y permisos de usuario', origen: 'acta' },
    { id: 'RF-4', tipo: 'Requerimiento funcional', descripcion: 'El sistema debe notificar por correo electrónico los cambios de estado de los proyectos', origen: 'manual' },
    { id: 'RF-5', tipo: 'Requerimiento funcional', descripcion: 'El sistema debe permitir la carga masiva de datos mediante archivos CSV', origen: 'manual' },
    // Requerimientos no funcionales
    { id: 'RNF-1', tipo: 'Requerimiento no funcional', descripcion: 'El sistema debe responder en menos de 3 segundos para cualquier operación', origen: 'acta' },
    { id: 'RNF-2', tipo: 'Requerimiento no funcional', descripcion: 'El sistema debe estar disponible 99.9% del tiempo', origen: 'acta' },
    { id: 'RNF-3', tipo: 'Requerimiento no funcional', descripcion: 'El sistema debe soportar al menos 500 usuarios concurrentes', origen: 'manual' },
    { id: 'RNF-4', tipo: 'Requerimiento no funcional', descripcion: 'El sistema debe cumplir con los estándares de seguridad OWASP', origen: 'manual' },
];

// Modal para crear/editar requerimiento
function RequerimientoModal({
    isOpen,
    onClose,
    onSave,
    requerimiento,
    mode,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { tipo: TipoRequerimiento; descripcion: string }) => void;
    requerimiento: Requerimiento | null;
    mode: 'create' | 'edit';
}) {
    const [tipo, setTipo] = useState<TipoRequerimiento>(requerimiento?.tipo || 'Requerimiento funcional');
    const [descripcion, setDescripcion] = useState(requerimiento?.descripcion || '');
    const [errors, setErrors] = useState<{ tipo?: string; descripcion?: string }>({});

    useEffect(() => {
        if (requerimiento) {
            setTipo(requerimiento.tipo);
            setDescripcion(requerimiento.descripcion);
        } else {
            setTipo('Requerimiento funcional');
            setDescripcion('');
        }
        setErrors({});
    }, [requerimiento, isOpen]);

    const validateForm = () => {
        const newErrors: { tipo?: string; descripcion?: string } = {};
        if (!tipo) newErrors.tipo = 'El tipo es obligatorio';
        if (!descripcion.trim()) newErrors.descripcion = 'La descripción es obligatoria';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validateForm()) {
            onSave({ tipo, descripcion: descripcion.trim() });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg p-0" showCloseButton={false}>
                <DialogHeader className="p-4 bg-[#004272] text-white flex flex-row items-center justify-between">
                    <DialogTitle>
                        {mode === 'create' ? 'Crear requerimiento' : 'Editar requerimiento'}
                    </DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white h-8 w-8">
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogClose>
                </DialogHeader>
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="tipo" className="text-sm font-medium">
                            Tipo de requerimiento <span className="text-red-500">*</span>
                        </Label>
                        <Select value={tipo} onValueChange={(value) => setTipo(value as TipoRequerimiento)}>
                            <SelectTrigger className={cn(errors.tipo && "border-red-500")}>
                                <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Requerimiento funcional">Requerimiento funcional</SelectItem>
                                <SelectItem value="Requerimiento no funcional">Requerimiento no funcional</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.tipo && <p className="text-red-500 text-xs">{errors.tipo}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="descripcion" className="text-sm font-medium">
                            Requerimiento <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="descripcion"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            placeholder="Descripción del requerimiento..."
                            className={cn("min-h-[120px]", errors.descripcion && "border-red-500")}
                        />
                        {errors.descripcion && <p className="text-red-500 text-xs">{errors.descripcion}</p>}
                    </div>
                </div>
                <DialogFooter className="p-4 border-t flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-[#018CD1] hover:bg-[#018CD1]/90 text-white"
                    >
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Modal de confirmación de eliminación
function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    requerimientoId,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    requerimientoId: string;
}) {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-0" showCloseButton={false}>
                <DialogHeader className="p-4 bg-[#004272] text-white flex flex-row items-center justify-between">
                    <DialogTitle>Confirmar eliminación</DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white h-8 w-8">
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogClose>
                </DialogHeader>
                <div className="p-6 text-center">
                    <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">¿Estás seguro?</h3>
                    <p className="text-gray-600">
                        El requerimiento <span className="font-semibold">{requerimientoId}</span> será eliminado
                    </p>
                </div>
                <DialogFooter className="p-4 border-t flex justify-center gap-3">
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        Sí, eliminar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function RequerimientosContent() {
    const { user } = useAuth();
    const [project, setProject] = useState<Project | null>(null);
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('Requerimientos');
    const [requerimientos, setRequerimientos] = useState<Requerimiento[]>(initialRequerimientos);

    // Filtros - Por defecto mostrar "Requerimiento funcional"
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTipo, setFilterTipo] = useState<string>('Requerimiento funcional');

    // Modales
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedRequerimiento, setSelectedRequerimiento] = useState<Requerimiento | null>(null);

    // Permisos
    const userRole = user?.role;

    useEffect(() => {
        const savedProjectData = localStorage.getItem('selectedProject');
        if (savedProjectData) {
            setProject(JSON.parse(savedProjectData));
        } else {
            router.push(paths.poi.base);
        }
    }, [router]);

    // Pestañas según rol
    const getProjectTabs = () => {
        if (userRole === ROLES.PMO) {
            return [
                { name: 'Detalles' },
                { name: 'Documentos' },
                { name: 'Backlog' },
            ];
        } else if (userRole === ROLES.SCRUM_MASTER) {
            return [
                { name: 'Detalles' },
                { name: 'Documentos' },
                { name: 'Actas del proyecto' },
                { name: 'Requerimientos' },
                { name: 'Cronograma' },
                { name: 'Backlog' },
            ];
        }
        return [
            { name: 'Detalles' },
            { name: 'Documentos' },
            { name: 'Backlog' },
        ];
    };

    const projectTabs = getProjectTabs();

    const handleTabClick = (tabName: string) => {
        let route = '';
        if (tabName === 'Detalles') route = paths.poi.proyecto.detalles;
        else if (tabName === 'Documentos') route = paths.poi.proyecto.documentos;
        else if (tabName === 'Backlog') route = paths.poi.proyecto.backlog.base;
        else if (tabName === 'Actas del proyecto') route = paths.poi.proyecto.actas;
        else if (tabName === 'Cronograma') route = paths.poi.proyecto.cronograma;

        if (route) {
            router.push(route);
        } else {
            setActiveTab(tabName);
        }
    };

    // Filtrar requerimientos
    const filteredRequerimientos = requerimientos.filter((req) => {
        const matchesSearch = searchQuery === '' ||
            req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.descripcion.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTipo = filterTipo === '' || req.tipo === filterTipo;
        return matchesSearch && matchesTipo;
    });

    // Generar nuevo ID
    const generateNewId = (tipo: TipoRequerimiento): string => {
        const prefix = tipo === 'Requerimiento funcional' ? 'RF' : 'RNF';
        const existingIds = requerimientos
            .filter(r => r.tipo === tipo)
            .map(r => parseInt(r.id.split('-')[1]))
            .filter(n => !isNaN(n));
        const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
        return `${prefix}-${maxId + 1}`;
    };

    // Handlers
    const handleCreate = (data: { tipo: TipoRequerimiento; descripcion: string }) => {
        const newRequerimiento: Requerimiento = {
            id: generateNewId(data.tipo),
            tipo: data.tipo,
            descripcion: data.descripcion,
            origen: 'manual',
        };
        setRequerimientos([...requerimientos, newRequerimiento]);
    };

    const handleEdit = (data: { tipo: TipoRequerimiento; descripcion: string }) => {
        if (!selectedRequerimiento) return;

        // Si cambió el tipo, generar nuevo ID
        let newId = selectedRequerimiento.id;
        if (selectedRequerimiento.tipo !== data.tipo) {
            newId = generateNewId(data.tipo);
        }

        setRequerimientos(requerimientos.map(req =>
            req.id === selectedRequerimiento.id
                ? { ...req, id: newId, tipo: data.tipo, descripcion: data.descripcion }
                : req
        ));
        setSelectedRequerimiento(null);
    };

    const handleDelete = () => {
        if (!selectedRequerimiento) return;
        setRequerimientos(requerimientos.filter(req => req.id !== selectedRequerimiento.id));
        setSelectedRequerimiento(null);
        setIsDeleteModalOpen(false);
    };

    const openEditModal = (req: Requerimiento) => {
        setSelectedRequerimiento(req);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (req: Requerimiento) => {
        setSelectedRequerimiento(req);
        setIsDeleteModalOpen(true);
    };

    // Obtener subtítulo según el filtro
    const getSubtitulo = () => {
        if (filterTipo === 'Requerimiento funcional') return 'Requerimientos funcionales';
        if (filterTipo === 'Requerimiento no funcional') return 'Requerimientos no funcionales';
        return 'Requerimientos';
    };

    // Código del proyecto - usar code si está disponible, sino fallback a ID
    const isProject = project?.type === 'Proyecto';
    const projectCode = project ? (project.code || `${isProject ? 'PROY' : 'ACT'} N°${project.id}`) : '';

    // Breadcrumbs para la navegación
    const breadcrumbs = [
        { label: 'POI', href: paths.poi.base },
        { label: 'Requerimientos' },
    ];

    // Secondary header con el mismo diseño que Detalles
    const secondaryHeader = (
        <>
            <div className="bg-[#D5D5D5] border-b border-t border-[#1A5581]">
                <div className="p-2 flex items-center justify-between w-full">
                    <h2 className="font-bold text-black pl-2">
                        {project ? `${projectCode}: ${project.name}` : 'Cargando...'}
                    </h2>
                </div>
            </div>
            <div className="sticky top-[104px] z-10 bg-[#F9F9F9] px-6 pt-4">
                <div className="flex items-center gap-2 flex-wrap">
                    {projectTabs.map(tab => (
                        <Button
                            key={tab.name}
                            size="sm"
                            onClick={() => handleTabClick(tab.name)}
                            className={cn(
                                activeTab === tab.name
                                    ? 'bg-[#018CD1] text-white hover:bg-[#0179b5]'
                                    : 'bg-white text-black border-gray-300 hover:bg-gray-100'
                            )}
                            variant={activeTab === tab.name ? 'default' : 'outline'}
                        >
                            {tab.name}
                        </Button>
                    ))}
                </div>
            </div>
        </>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs} secondaryHeader={secondaryHeader}>
            <div className="flex-1 flex flex-col bg-[#F9F9F9]">
                {/* Contenido principal */}
                <div className="p-6">
                    {/* Subtítulo dinámico */}
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                        {getSubtitulo()}
                    </h2>

                    {/* Filtros y botón nuevo */}
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                        <div className="flex flex-wrap items-end gap-4">
                            {/* Buscador */}
                            <div className="flex-1 min-w-[200px]">
                                <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Buscar
                                </Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="search"
                                        type="text"
                                        placeholder="Buscar por código o descripción..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            {/* Filtro por tipo */}
                            <div className="w-[250px]">
                                <Label htmlFor="tipo" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Tipo
                                </Label>
                                <Select value={filterTipo} onValueChange={setFilterTipo}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todos los tipos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Requerimiento funcional">Requerimientos funcionales</SelectItem>
                                        <SelectItem value="Requerimiento no funcional">Requerimientos no funcionales</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Botón Nuevo Requerimiento */}
                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="bg-[#018CD1] hover:bg-[#018CD1]/90 text-white gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Nuevo Requerimiento
                            </Button>
                        </div>
                    </div>

                    {/* Tabla de requerimientos */}
                    <div className="rounded-lg border overflow-hidden">
                        <Table className="bg-white">
                            <TableHeader className="bg-[#004272]">
                                <TableRow>
                                    <TableHead className="w-[120px] font-bold text-white">ID</TableHead>
                                    <TableHead className="font-bold text-white">Descripción</TableHead>
                                    <TableHead className="w-[120px] text-center font-bold text-white">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRequerimientos.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                                            <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                            No se encontraron requerimientos
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRequerimientos.map((req) => (
                                        <TableRow key={req.id} className="hover:bg-gray-50">
                                            <TableCell className="font-medium text-[#018CD1]">
                                                {req.id}
                                            </TableCell>
                                            <TableCell className="text-gray-700">
                                                {req.descripcion}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openEditModal(req)}
                                                        className="h-8 w-8 text-gray-500 hover:text-[#018CD1] hover:bg-[#018CD1]/10"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openDeleteModal(req)}
                                                        className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Modales */}
            <RequerimientoModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleCreate}
                requerimiento={null}
                mode="create"
            />

            <RequerimientoModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedRequerimiento(null);
                }}
                onSave={handleEdit}
                requerimiento={selectedRequerimiento}
                mode="edit"
            />

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedRequerimiento(null);
                }}
                onConfirm={handleDelete}
                requerimientoId={selectedRequerimiento?.id || ''}
            />
        </AppLayout>
    );
}

export default function RequerimientosPage() {
    return (
        <ProtectedRoute module={MODULES.POI}>
            <RequerimientosContent />
        </ProtectedRoute>
    );
}
