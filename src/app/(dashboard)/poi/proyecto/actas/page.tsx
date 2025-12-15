"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    FileText,
    Search,
    Download,
    Plus,
    Pencil,
    Trash2,
    X,
    Upload,
    Eye,
    File,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    AlertCircle,
    Calendar,
} from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Project, ROLES, MODULES } from '@/lib/definitions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
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

type ActaStatus = 'Pendiente' | 'Aprobado' | 'No Aprobado';
type ActaType = 'Acta de Reunión' | 'Acta de Constitución';

type FormDataActa = {
    tipoReunion: string;
    fasePerteneciente: string;
    fechaReunion: string;
    horaInicio: string;
    horaFin: string;
    asistentes: { id: string; nombre: string; cargo: string; direccion: string }[];
    ausentes: { id: string; nombre: string; cargo: string; direccion: string }[];
    agenda: { id: string; tema: string }[];
    requerimientosFuncionales: { id: string; descripcion: string }[];
    requerimientosNoFuncionales: { id: string; descripcion: string }[];
    temasPendientes: { id: string; tema: string }[];
    entregables: { id: string; descripcion: string; responsable: string; fecha: string }[];
    observaciones: string;
    reunionesProgramadas: { id: string; tema: string; fecha: string; horaInicio: string }[];
};

type Acta = {
    id: string;
    nombre: string;
    tipo: ActaType;
    fecha: string;
    estado: ActaStatus;
    fileName?: string;
    fileType?: string;
    formData?: FormDataActa;
};

const initialActas: Acta[] = [
    {
        id: 'ACTA-1',
        nombre: 'Reunión inicial - Análisis y Requerimiento',
        tipo: 'Acta de Reunión',
        fecha: '15/01/2025',
        estado: 'Aprobado',
        fileName: 'acta_kickoff.pdf',
        formData: {
            tipoReunion: 'Reunión inicial',
            fasePerteneciente: 'Análisis y Requerimiento',
            fechaReunion: '2025-01-15',
            horaInicio: '09:00',
            horaFin: '11:00',
            asistentes: [
                { id: '1', nombre: 'Juan Pérez', cargo: 'Gerente de Proyecto', direccion: 'OTIN' },
                { id: '2', nombre: 'María García', cargo: 'Scrum Master', direccion: 'OTIN' },
            ],
            ausentes: [],
            agenda: [{ id: '1', tema: 'Definición de alcance del proyecto' }],
            requerimientosFuncionales: [{ id: '1', descripcion: 'El sistema debe permitir el registro de usuarios' }],
            requerimientosNoFuncionales: [{ id: '1', descripcion: 'El sistema debe responder en menos de 2 segundos' }],
            temasPendientes: [],
            entregables: [{ id: '1', descripcion: 'Documento de alcance', responsable: 'Juan Pérez', fecha: '2025-01-20' }],
            observaciones: 'Reunión exitosa',
            reunionesProgramadas: [],
        }
    },
    {
        id: 'ACTA-2',
        nombre: 'Reunión de seguimiento - Desarrollo',
        tipo: 'Acta de Reunión',
        fecha: '22/01/2025',
        estado: 'Aprobado',
        fileName: 'acta_seguimiento.pdf',
        formData: {
            tipoReunion: 'Reunión de seguimiento',
            fasePerteneciente: 'Desarrollo',
            fechaReunion: '2025-01-22',
            horaInicio: '10:00',
            horaFin: '12:00',
            asistentes: [
                { id: '1', nombre: 'María García', cargo: 'Scrum Master', direccion: 'OTIN' },
                { id: '2', nombre: 'Carlos López', cargo: 'Desarrollador', direccion: 'OTIN' },
            ],
            ausentes: [],
            agenda: [{ id: '1', tema: 'Revisión de avances del Sprint 1' }],
            requerimientosFuncionales: [{ id: '1', descripcion: 'Implementar módulo de autenticación' }],
            requerimientosNoFuncionales: [{ id: '1', descripcion: 'Garantizar seguridad en las conexiones' }],
            temasPendientes: [],
            entregables: [{ id: '1', descripcion: 'Módulo de login', responsable: 'Carlos López', fecha: '2025-01-28' }],
            observaciones: 'Sprint en curso',
            reunionesProgramadas: [],
        }
    },
    {
        id: 'ACTA-3',
        nombre: 'Acta de Constitución del Proyecto',
        tipo: 'Acta de Constitución',
        fecha: '10/01/2025',
        estado: 'Pendiente'
    },
    {
        id: 'ACTA-4',
        nombre: 'Reunión de cierre - Desarrollo',
        tipo: 'Acta de Reunión',
        fecha: '29/01/2025',
        estado: 'No Aprobado',
        formData: {
            tipoReunion: 'Reunión de cierre',
            fasePerteneciente: 'Desarrollo',
            fechaReunion: '2025-01-29',
            horaInicio: '14:00',
            horaFin: '16:00',
            asistentes: [
                { id: '1', nombre: 'Juan Pérez', cargo: 'Gerente de Proyecto', direccion: 'OTIN' },
                { id: '2', nombre: 'María García', cargo: 'Scrum Master', direccion: 'OTIN' },
            ],
            ausentes: [{ id: '1', nombre: 'Carlos López', cargo: 'Desarrollador', direccion: 'OTIN' }],
            agenda: [{ id: '1', tema: 'Cierre del Sprint 1' }],
            requerimientosFuncionales: [{ id: '1', descripcion: 'Validar funcionalidades completadas' }],
            requerimientosNoFuncionales: [{ id: '1', descripcion: 'Verificar rendimiento del sistema' }],
            temasPendientes: [{ id: '1', tema: 'Pendiente aprobación de stakeholders' }],
            entregables: [{ id: '1', descripcion: 'Informe de cierre Sprint 1', responsable: 'María García', fecha: '2025-01-30' }],
            observaciones: 'Pendiente revisión por parte del cliente',
            reunionesProgramadas: [{ id: '1', tema: 'Revisión con cliente', fecha: '2025-02-01', horaInicio: '10:00' }],
        }
    },
];

const actaStatusConfig: { [key: string]: { bg: string; text: string } } = {
    'Pendiente': { bg: '#FFF0C8', text: '#A67C00' },
    'Aprobado': { bg: '#B2FBBE', text: '#006B1A' },
    'No Aprobado': { bg: '#FFC8C8', text: '#A90000' },
};

const acceptedFileTypes = '.pdf,.docx,.doc';
const acceptedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
];

// Modal de "En construcción"
function EnConstruccionModal({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-0" showCloseButton={false}>
                <DialogHeader className="p-4 bg-[#004272] text-white flex flex-row items-center justify-between">
                    <DialogTitle>Acta de Constitución</DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white h-8 w-8">
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogClose>
                </DialogHeader>
                <div className="p-8 flex flex-col items-center justify-center text-center">
                    <AlertCircle className="h-16 w-16 text-[#F59E0B] mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">En construcción la vista</h3>
                    <p className="text-gray-500 mb-6">Esta funcionalidad estará disponible próximamente.</p>
                    <Button
                        onClick={onClose}
                        className="bg-[#018CD1] hover:bg-[#018CD1]/90 text-white"
                    >
                        Aceptar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Modal para seleccionar tipo de acta
function SelectActaTypeModal({
    isOpen,
    onClose,
    onSelect,
    onShowEnConstruccion,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (tipo: ActaType) => void;
    onShowEnConstruccion: () => void;
}) {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-0" showCloseButton={false}>
                <DialogHeader className="p-4 bg-[#004272] text-white flex flex-row items-center justify-between">
                    <DialogTitle>Seleccionar tipo</DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white h-8 w-8">
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogClose>
                </DialogHeader>
                <div className="p-6 space-y-3">
                    <Button
                        variant="outline"
                        className="w-full justify-start h-12 text-left"
                        onClick={() => {
                            onSelect('Acta de Reunión');
                            onClose();
                        }}
                    >
                        <FileText className="h-5 w-5 mr-3 text-[#018CD1]" />
                        Acta de Reunión
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full justify-start h-12 text-left"
                        onClick={() => {
                            onClose();
                            onShowEnConstruccion();
                        }}
                    >
                        <FileText className="h-5 w-5 mr-3 text-[#018CD1]" />
                        Acta de Constitución
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Modal de preview de acta
function PreviewActaModal({
    isOpen,
    onClose,
    acta,
    onDownload,
}: {
    isOpen: boolean;
    onClose: () => void;
    acta: Acta | null;
    onDownload: () => void;
}) {
    const [currentPage, setCurrentPage] = useState(1);
    const [zoom, setZoom] = useState(100);
    const totalPages = 5;

    if (!isOpen || !acta) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden" showCloseButton={false}>
                <DialogHeader className="p-4 bg-[#004272] text-white flex flex-row items-center justify-between">
                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Preview: {acta.nombre}
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/10 h-8 w-8"
                            onClick={onDownload}
                            title="Descargar"
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                        <DialogClose asChild>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white h-8 w-8">
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogClose>
                    </div>
                </DialogHeader>

                {/* Barra de herramientas */}
                <div className="flex items-center justify-between p-2 border-b bg-gray-100">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">
                            Página {currentPage} de {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setZoom(z => Math.max(50, z - 10))}
                        >
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-sm w-12 text-center">{zoom}%</span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setZoom(z => Math.min(200, z + 10))}
                        >
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Área de preview */}
                <div className="flex-1 overflow-auto p-4 bg-gray-200 flex items-center justify-center">
                    <div
                        className="bg-white shadow-lg"
                        style={{
                            width: `${(8.5 * zoom) / 100 * 96}px`,
                            minHeight: `${(11 * zoom) / 100 * 96}px`,
                            padding: '40px',
                        }}
                    >
                        <div className="text-center text-gray-400">
                            <FileText className="h-16 w-16 mx-auto mb-4" />
                            <p className="font-semibold">{acta.nombre}</p>
                            <p className="text-sm mt-2">Tipo: {acta.tipo}</p>
                            <p className="text-sm">Fecha: {acta.fecha}</p>
                            <p className="text-sm mt-4">Vista previa del documento</p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Modal para subir acta
function UploadActaModal({
    isOpen,
    onClose,
    acta,
    onUpload,
}: {
    isOpen: boolean;
    onClose: () => void;
    acta: Acta | null;
    onUpload: (file: File) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        if (isOpen) {
            setSelectedFile(null);
            setError(null);
        }
    }, [isOpen]);

    const handleFileSelect = (file: File) => {
        if (!acceptedMimeTypes.includes(file.type)) {
            setError('Solo se aceptan archivos PDF y Word');
            return;
        }
        setSelectedFile(file);
        setError(null);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleSave = () => {
        if (selectedFile) {
            onUpload(selectedFile);
            onClose();
        }
    };

    if (!isOpen || !acta) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-0" showCloseButton={false}>
                <DialogHeader className="p-4 bg-[#004272] text-white flex flex-row items-center justify-between">
                    <DialogTitle>Subir Acta</DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white h-8 w-8">
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogClose>
                </DialogHeader>

                <div className="p-6">
                    <p className="text-sm text-gray-600 mb-4">
                        Subir documento para: <span className="font-semibold">{acta.nombre}</span>
                    </p>

                    {!selectedFile ? (
                        <div
                            className={cn(
                                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                                isDragging ? "border-[#018CD1] bg-blue-50" : "border-gray-300",
                                error && "border-red-500"
                            )}
                            onDrop={handleDrop}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                        >
                            <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                            <p className="text-sm text-gray-600 mb-3">Arrastra tu archivo aquí o</p>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="gap-2"
                            >
                                <Upload className="h-4 w-4" />
                                Seleccionar Acta
                            </Button>
                            <p className="text-xs text-gray-400 mt-3">Archivo .pdf, .docx</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={acceptedFileTypes}
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileSelect(file);
                                }}
                            />
                        </div>
                    ) : (
                        <div className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center gap-3">
                                <File className="h-10 w-10 text-blue-600" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {(selectedFile.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-700"
                                    onClick={() => setSelectedFile(null)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                </div>

                <DialogFooter className="p-4 border-t bg-gray-50 flex gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!selectedFile}
                        className="bg-[#018CD1] hover:bg-[#018CD1]/90 text-white"
                    >
                        Subir
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
    actaName,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    actaName: string;
}) {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-0" showCloseButton={false}>
                <DialogHeader className="p-4 bg-[#004272] text-white flex flex-row items-center justify-between">
                    <DialogTitle>Eliminar Acta</DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white h-8 w-8">
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogClose>
                </DialogHeader>
                <div className="p-6">
                    <p className="text-gray-700">
                        ¿Está seguro de que desea eliminar esta Acta?
                    </p>
                    <p className="text-gray-500 mt-2 text-sm font-medium">
                        "{actaName}"
                    </p>
                </div>
                <DialogFooter className="p-4 border-t bg-gray-50 flex gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        Sí, eliminar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Modal de éxito
function SuccessModal({
    isOpen,
    onClose,
    message,
    title,
}: {
    isOpen: boolean;
    onClose: () => void;
    message: string;
    title: string;
}) {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-sm p-8 text-center" showCloseButton={false}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-600">{message}</p>
                    <DialogFooter className="mt-2 w-full">
                        <Button onClick={onClose} className="w-full bg-[#018CD1] hover:bg-[#018CD1]/90">
                            Aceptar
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Modal de error
function ErrorModal({
    isOpen,
    onClose,
    message,
}: {
    isOpen: boolean;
    onClose: () => void;
    message: string;
}) {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-sm p-8 text-center" showCloseButton={false}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Error</DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-600">{message}</p>
                    <DialogFooter className="mt-2 w-full">
                        <Button onClick={onClose} className="w-full bg-[#018CD1] hover:bg-[#018CD1]/90">
                            Aceptar
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ActasProyectoContent() {
    const { user } = useAuth();
    const [project, setProject] = useState<Project | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState('Actas del proyecto');
    const [actas, setActas] = useState<Acta[]>(initialDocuments);
    const [showSavedSuccess, setShowSavedSuccess] = useState(false);

    // Filtros
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTipo, setFilterTipo] = useState<string>('');
    const [filterEstado, setFilterEstado] = useState<string>('');
    const [filterFechaDesde, setFilterFechaDesde] = useState('');
    const [filterFechaHasta, setFilterFechaHasta] = useState('');

    // Modales
    const [isSelectTypeModalOpen, setIsSelectTypeModalOpen] = useState(false);
    const [isEnConstruccionModalOpen, setIsEnConstruccionModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [selectedActa, setSelectedActa] = useState<Acta | null>(null);
    const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });
    const [errorMessage, setErrorMessage] = useState('');

    // Permisos
    const userRole = user?.role;
    const isScrumMaster = userRole === ROLES.SCRUM_MASTER;

    // Cargar proyecto y actas desde localStorage
    useEffect(() => {
        const savedProjectData = localStorage.getItem('selectedProject');
        if (savedProjectData) {
            setProject(JSON.parse(savedProjectData));
        } else {
            router.push(paths.poi.base);
        }

        // Cargar actas guardadas desde localStorage
        const storedActas = localStorage.getItem('projectActas');
        if (storedActas) {
            try {
                const parsedActas = JSON.parse(storedActas) as Acta[];
                // Combinar actas iniciales con las guardadas, evitando duplicados por ID
                const combined = [...initialActas];
                const existingIds = new Set(combined.map(a => a.id));

                parsedActas.forEach(acta => {
                    if (!existingIds.has(acta.id)) {
                        combined.push(acta);
                        existingIds.add(acta.id);
                    }
                });

                setActas(combined);
            } catch (error) {
                console.error('Error loading stored actas:', error);
            }
        }

        // Mostrar mensaje de éxito si viene de guardar
        if (searchParams.get('saved') === 'true') {
            setShowSavedSuccess(true);
            // Limpiar el parámetro de la URL
            router.replace(paths.poi.proyecto.actas);
        }
    }, [router, searchParams]);

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
        else if (tabName === 'Requerimientos') route = paths.poi.proyecto.requerimientos;
        else if (tabName === 'Cronograma') route = paths.poi.proyecto.cronograma;

        if (route) {
            router.push(route);
        } else {
            setActiveTab(tabName);
        }
    };

    const handleSelectActaType = (tipo: ActaType) => {
        if (tipo === 'Acta de Reunión') {
            router.push(paths.poi.proyecto.actasNueva + '?tipo=reunion');
        } else {
            router.push(paths.poi.proyecto.actasNueva + '?tipo=constitucion');
        }
    };

    const handlePreview = (acta: Acta) => {
        setSelectedActa(acta);
        setIsPreviewModalOpen(true);
    };

    const handleEdit = (acta: Acta) => {
        if (acta.tipo === 'Acta de Reunión') {
            router.push(paths.poi.proyecto.actasNueva + `?tipo=reunion&id=${acta.id}`);
        } else {
            router.push(paths.poi.proyecto.actasNueva + `?tipo=constitucion&id=${acta.id}`);
        }
    };

    const handleDownload = (acta: Acta) => {
        if (acta.fileName) {
            setSuccessMessage({ title: 'Descarga exitosa', message: 'El acta se ha descargado correctamente.' });
            setIsSuccessModalOpen(true);
        } else {
            setErrorMessage('No se encontró el documento. Por favor, suba o registre uno nuevo.');
            setIsErrorModalOpen(true);
        }
    };

    const handleUploadClick = (acta: Acta) => {
        setSelectedActa(acta);
        setIsUploadModalOpen(true);
    };

    const handleUpload = (file: File) => {
        if (selectedActa) {
            setActas(prev => prev.map(a =>
                a.id === selectedActa.id
                    ? { ...a, fileName: file.name, fileType: file.type }
                    : a
            ));
            setSuccessMessage({ title: 'Acta subida', message: 'El acta se ha subido correctamente.' });
            setIsSuccessModalOpen(true);
        }
    };

    const handleDeleteClick = (acta: Acta) => {
        setSelectedActa(acta);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = () => {
        if (selectedActa) {
            // Eliminar del estado local
            setActas(prev => prev.filter(a => a.id !== selectedActa.id));

            // También eliminar del localStorage si existe
            const storedActas = localStorage.getItem('projectActas');
            if (storedActas) {
                try {
                    const parsedActas = JSON.parse(storedActas);
                    const updatedActas = parsedActas.filter((a: Acta) => a.id !== selectedActa.id);
                    localStorage.setItem('projectActas', JSON.stringify(updatedActas));
                } catch (error) {
                    console.error('Error updating localStorage:', error);
                }
            }

            setSelectedActa(null);
        }
    };

    // Limpiar filtros
    const handleClearFilters = () => {
        setSearchQuery('');
        setFilterTipo('');
        setFilterEstado('');
        setFilterFechaDesde('');
        setFilterFechaHasta('');
    };

    // Filtrar actas
    const filteredActas = actas.filter(acta => {
        // Búsqueda por texto
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            if (!acta.nombre.toLowerCase().includes(query) && !acta.id.toLowerCase().includes(query)) {
                return false;
            }
        }

        // Filtro por tipo
        if (filterTipo && filterTipo !== 'Todas') {
            if (acta.tipo !== filterTipo) return false;
        }

        // Filtro por estado
        if (filterEstado && filterEstado !== 'Todas') {
            if (acta.estado !== filterEstado) return false;
        }

        // Filtro por fecha desde
        if (filterFechaDesde) {
            const [day, month, year] = acta.fecha.split('/');
            const actaDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            const fromDate = new Date(filterFechaDesde);
            if (actaDate < fromDate) return false;
        }

        // Filtro por fecha hasta
        if (filterFechaHasta) {
            const [day, month, year] = acta.fecha.split('/');
            const actaDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            const toDate = new Date(filterFechaHasta);
            if (actaDate > toDate) return false;
        }

        return true;
    });

    if (!project) {
        return (
            <div className="flex h-screen w-full items-center justify-center">Cargando...</div>
        );
    }

    const projectCode = `PROY N° ${project.id}`;
    const breadcrumbs = [{ label: "POI", href: paths.poi.base }, { label: 'Actas del proyecto' }];

    const secondaryHeader = (
        <>
            <div className="bg-[#D5D5D5] border-b border-t border-[#1A5581]">
                <div className="p-2 flex items-center justify-between w-full">
                    <h2 className="font-bold text-black pl-2">
                        {`${projectCode}: ${project.name}`}
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
        <AppLayout
            breadcrumbs={breadcrumbs}
            secondaryHeader={secondaryHeader}
        >
            <div className="flex-1 flex flex-col bg-[#F9F9F9]">
                <div className="p-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <FileText className="h-6 w-6 text-black" />
                                <h3 className="text-xl font-bold">ACTAS DEL PROYECTO</h3>
                            </div>
                            {isScrumMaster && (
                                <Button
                                    className="bg-[#018CD1] hover:bg-[#018CD1]/90 text-white"
                                    onClick={() => setIsSelectTypeModalOpen(true)}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nueva Acta
                                </Button>
                            )}
                        </div>

                        {/* Filtros */}
                        <div className="flex flex-wrap items-end gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                            <div className="flex-1 min-w-[200px]">
                                <Label className="text-xs text-gray-500">Buscar</Label>
                                <div className="relative mt-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Buscar por nombre o ID..."
                                        className="pl-10 bg-white"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="w-48">
                                <Label className="text-xs text-gray-500">Tipo de Acta</Label>
                                <Select value={filterTipo} onValueChange={setFilterTipo}>
                                    <SelectTrigger className="mt-1 bg-white">
                                        <SelectValue placeholder="Seleccionar tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Todas">Todas</SelectItem>
                                        <SelectItem value="Acta de Reunión">Acta de Reunión</SelectItem>
                                        <SelectItem value="Acta de Constitución">Acta de Constitución</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-44">
                                <Label className="text-xs text-gray-500">Estado</Label>
                                <Select value={filterEstado} onValueChange={setFilterEstado}>
                                    <SelectTrigger className="mt-1 bg-white">
                                        <SelectValue placeholder="Seleccionar estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Todas">Todas</SelectItem>
                                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                                        <SelectItem value="Aprobado">Aprobado</SelectItem>
                                        <SelectItem value="No Aprobado">No Aprobado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-40">
                                <Label className="text-xs text-gray-500">Fecha Desde</Label>
                                <Input
                                    type="date"
                                    className="mt-1 bg-white"
                                    value={filterFechaDesde}
                                    onChange={(e) => setFilterFechaDesde(e.target.value)}
                                />
                            </div>

                            <div className="w-40">
                                <Label className="text-xs text-gray-500">Fecha Hasta</Label>
                                <Input
                                    type="date"
                                    className="mt-1 bg-white"
                                    value={filterFechaHasta}
                                    onChange={(e) => setFilterFechaHasta(e.target.value)}
                                />
                            </div>

                            <Button
                                variant="outline"
                                className="border-gray-300 hover:bg-gray-100"
                                onClick={handleClearFilters}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Limpiar filtros
                            </Button>
                        </div>

                        {/* Tabla de Actas */}
                        <div className="rounded-lg border overflow-hidden">
                            <Table className="bg-white">
                                <TableHeader className="bg-[#004272]">
                                    <TableRow>
                                        <TableHead className="font-bold text-white">ID</TableHead>
                                        <TableHead className="font-bold text-white">Nombre</TableHead>
                                        <TableHead className="font-bold text-white">Tipo de Acta</TableHead>
                                        <TableHead className="font-bold text-white">Fecha</TableHead>
                                        <TableHead className="font-bold text-white">Estado</TableHead>
                                        <TableHead className="text-center font-bold text-white">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredActas.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-48 text-center">
                                                <div className="flex flex-col items-center justify-center text-gray-500">
                                                    <FileText className="h-12 w-12 mb-3 text-gray-300" />
                                                    <p className="text-lg font-medium">Aún no hay actas registradas</p>
                                                    <p className="text-sm">Haz clic en "+ Nueva Acta" para crear una</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredActas.map((acta, index) => (
                                            <TableRow
                                                key={acta.id}
                                                className={cn(
                                                    "hover:bg-gray-50 transition-colors",
                                                    index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                                                )}
                                            >
                                                <TableCell className="font-medium">{acta.id}</TableCell>
                                                <TableCell>{acta.nombre}</TableCell>
                                                <TableCell>{acta.tipo}</TableCell>
                                                <TableCell>{acta.fecha}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        style={{
                                                            backgroundColor: actaStatusConfig[acta.estado].bg,
                                                            color: actaStatusConfig[acta.estado].text,
                                                        }}
                                                        className="font-semibold"
                                                    >
                                                        {acta.estado}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-gray-500 hover:text-[#018CD1] hover:bg-[#018CD1]/10"
                                                            onClick={() => handlePreview(acta)}
                                                            title="Preview"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-gray-500 hover:text-[#018CD1] hover:bg-[#018CD1]/10"
                                                            onClick={() => handleEdit(acta)}
                                                            title="Editar"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-gray-500 hover:text-green-600 hover:bg-green-50"
                                                            onClick={() => handleDownload(acta)}
                                                            title="Descargar"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-gray-500 hover:text-[#018CD1] hover:bg-[#018CD1]/10"
                                                            onClick={() => handleUploadClick(acta)}
                                                            title="Adjuntar"
                                                        >
                                                            <Upload className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => handleDeleteClick(acta)}
                                                            title="Eliminar"
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

                        {/* Paginación */}
                        {filteredActas.length > 0 && (
                            <Pagination className="mt-4 justify-start">
                                <PaginationContent>
                                    <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
                                    <PaginationItem><PaginationLink href="#" isActive>1</PaginationLink></PaginationItem>
                                    <PaginationItem><PaginationLink href="#">2</PaginationLink></PaginationItem>
                                    <PaginationItem><PaginationLink href="#">3</PaginationLink></PaginationItem>
                                    <PaginationItem>...</PaginationItem>
                                    <PaginationItem><PaginationNext href="#" /></PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        )}
                    </div>
                </div>
            </div>

            {/* Modales */}
            <SelectActaTypeModal
                isOpen={isSelectTypeModalOpen}
                onClose={() => setIsSelectTypeModalOpen(false)}
                onSelect={handleSelectActaType}
                onShowEnConstruccion={() => setIsEnConstruccionModalOpen(true)}
            />

            <EnConstruccionModal
                isOpen={isEnConstruccionModalOpen}
                onClose={() => setIsEnConstruccionModalOpen(false)}
            />

            <PreviewActaModal
                isOpen={isPreviewModalOpen}
                onClose={() => {
                    setIsPreviewModalOpen(false);
                    setSelectedActa(null);
                }}
                acta={selectedActa}
                onDownload={() => {
                    if (selectedActa) handleDownload(selectedActa);
                }}
            />

            <UploadActaModal
                isOpen={isUploadModalOpen}
                onClose={() => {
                    setIsUploadModalOpen(false);
                    setSelectedActa(null);
                }}
                acta={selectedActa}
                onUpload={handleUpload}
            />

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedActa(null);
                }}
                onConfirm={handleDelete}
                actaName={selectedActa?.nombre || ''}
            />

            <SuccessModal
                isOpen={isSuccessModalOpen}
                onClose={() => setIsSuccessModalOpen(false)}
                title={successMessage.title}
                message={successMessage.message}
            />

            <ErrorModal
                isOpen={isErrorModalOpen}
                onClose={() => setIsErrorModalOpen(false)}
                message={errorMessage}
            />

            {/* Modal de éxito al guardar acta */}
            <SuccessModal
                isOpen={showSavedSuccess}
                onClose={() => setShowSavedSuccess(false)}
                title="Acta guardada"
                message="El acta de reunión se ha guardado correctamente."
            />
        </AppLayout>
    );
}

// Fix: usar initialActas en lugar de initialDocuments
const initialDocuments = initialActas;

export default function ActasProyectoPage() {
    return (
        <ProtectedRoute module={MODULES.POI}>
            <React.Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Cargando...</div>}>
                <ActasProyectoContent />
            </React.Suspense>
        </ProtectedRoute>
    );
}
