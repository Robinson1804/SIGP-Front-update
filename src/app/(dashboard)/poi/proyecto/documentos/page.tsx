"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    FileText,
    Search,
    Download,
    CheckSquare,
    Plus,
    Pencil,
    Trash2,
    X,
    Upload,
    Eye,
    File,
    FileSpreadsheet,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Project, ROLES, MODULES, PERMISSIONS } from '@/lib/definitions';
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
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
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
import { hasPermission } from '@/lib/permissions';
import { ProtectedRoute } from '@/features/auth';

type DocumentStatus = 'Pendiente' | 'Aprobado' | 'No aprobado';
type DocumentPhase = 'Análisis y Planificación' | 'Diseño' | 'Desarrollo' | 'Pruebas' | 'Implementación' | 'Mantenimiento';

type Document = {
    id: string;
    phase: DocumentPhase;
    description: string;
    link: string;
    status: DocumentStatus;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    fileData?: string; // Base64 data URL para almacenar el archivo
};

const phases: DocumentPhase[] = [
    'Análisis y Planificación',
    'Diseño',
    'Desarrollo',
    'Pruebas',
    'Implementación',
    'Mantenimiento',
];

const initialDocuments: Document[] = [
    { id: '1', phase: 'Análisis y Planificación', description: 'Presentación Kick Off', link: '', status: 'Aprobado', fileName: 'kickoff.pdf', fileType: 'application/pdf' },
    { id: '2', phase: 'Análisis y Planificación', description: 'Acta de constitución del proyecto', link: 'https://drive.google.com/file/d/1S0v08cemryRXG3', status: 'Aprobado' },
    { id: '3', phase: 'Análisis y Planificación', description: 'Cronograma de lanzamiento', link: '', status: 'Aprobado' },
    { id: '4', phase: 'Diseño', description: 'Prototipo', link: 'https://drive.google.com/file/d/1S0v08cemryRXG3', status: 'Pendiente' },
    { id: '5', phase: 'Diseño', description: 'Casos de pruebas unitarias', link: '', status: 'Pendiente' },
    { id: '6', phase: 'Desarrollo', description: 'Código fuentes del software', link: '', status: 'No aprobado' },
];

const documentStatusConfig: { [key: string]: { bg: string; text: string } } = {
    'Pendiente': { bg: '#FFF0C8', text: '#A67C00' },
    'Aprobado': { bg: '#B2FBBE', text: '#006B1A' },
    'No aprobado': { bg: '#FFC8C8', text: '#A90000' },
};

const acceptedFileTypes = '.pdf,.docx,.xlsx,.doc,.xls';
const acceptedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.ms-excel',
];

// Modal para agregar/editar documento
function DocumentModal({
    isOpen,
    onClose,
    document,
    onSave,
    isPmo,
}: {
    isOpen: boolean;
    onClose: () => void;
    document: Document | null;
    onSave: (doc: Omit<Document, 'id'> & { id?: string }) => void;
    isPmo: boolean;
}) {
    const isEditing = document !== null;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<{
        phase: DocumentPhase | '';
        description: string;
        link: string;
        status: DocumentStatus;
        fileName?: string;
        fileType?: string;
        fileSize?: number;
        fileData?: string;
        file?: File;
    }>({
        phase: '',
        description: '',
        link: '',
        status: 'Pendiente',
        fileName: undefined,
        fileType: undefined,
        fileSize: undefined,
        fileData: undefined,
        file: undefined,
    });

    const [errors, setErrors] = useState<{ phase?: string; description?: string; file?: string; linkOrFile?: string }>({});
    const [isDragging, setIsDragging] = useState(false);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);

    React.useEffect(() => {
        if (document) {
            setFormData({
                phase: document.phase,
                description: document.description,
                link: document.link,
                status: document.status,
                fileName: document.fileName,
                fileType: document.fileType,
                fileSize: document.fileSize,
                fileData: document.fileData,
                file: undefined,
            });
        } else {
            setFormData({
                phase: '',
                description: '',
                link: '',
                status: 'Pendiente',
                fileName: undefined,
                fileType: undefined,
                fileSize: undefined,
                fileData: undefined,
                file: undefined,
            });
        }
        setErrors({});
    }, [document, isOpen]);

    const validateForm = (): boolean => {
        const newErrors: typeof errors = {};

        if (!formData.phase) {
            newErrors.phase = 'La fase es obligatoria';
        }
        if (!formData.description.trim()) {
            newErrors.description = 'La descripción es obligatoria';
        }
        // Validar que tenga link O documento adjunto (obligatorio)
        if (!formData.link.trim() && !formData.fileData) {
            newErrors.linkOrFile = 'Debe ingresar un link o adjuntar un documento';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validateForm()) {
            onSave({
                id: document?.id,
                phase: formData.phase as DocumentPhase,
                description: formData.description,
                link: formData.link,
                status: formData.status,
                fileName: formData.fileName,
                fileType: formData.fileType,
                fileSize: formData.fileSize,
                fileData: formData.fileData,
            });
            onClose();
        }
    };

    const handleFileSelect = (file: File) => {
        if (!acceptedMimeTypes.includes(file.type)) {
            setErrors(prev => ({ ...prev, file: 'Solo se aceptan archivos PDF, Word y Excel' }));
            return;
        }

        // Leer el archivo y convertirlo a base64
        const reader = new FileReader();
        reader.onload = (e) => {
            const fileData = e.target?.result as string;
            setFormData(prev => ({
                ...prev,
                file,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                fileData: fileData,
                // Si está editando y el estado era "No aprobado", cambiar a "Pendiente"
                status: (isEditing && prev.status === 'No aprobado') ? 'Pendiente' : prev.status,
            }));
        };
        reader.readAsDataURL(file);
        setErrors(prev => ({ ...prev, file: undefined }));
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const removeFile = () => {
        setFormData(prev => ({
            ...prev,
            file: undefined,
            fileName: undefined,
            fileType: undefined,
            fileSize: undefined,
            fileData: undefined,
        }));
    };

    const getFileIcon = (fileType?: string) => {
        if (fileType?.includes('spreadsheet') || fileType?.includes('excel')) {
            return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
        }
        return <File className="h-5 w-5 text-blue-600" />;
    };

    const isExcelFile = formData.fileType?.includes('spreadsheet') || formData.fileType?.includes('excel');

    if (!isOpen) return null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-lg p-0 overflow-hidden" showCloseButton={false}>
                    <DialogHeader className="p-4 bg-[#004272] text-white flex flex-row items-center justify-between">
                        <DialogTitle className="text-lg font-bold">
                            {isEditing ? 'Editar Documento' : 'Agregar Documento'}
                        </DialogTitle>
                        <DialogClose asChild>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white h-8 w-8">
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogClose>
                    </DialogHeader>

                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        {/* Fase */}
                        <div>
                            <Label className="text-sm font-medium">
                                Fase <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.phase}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, phase: value as DocumentPhase }))}
                            >
                                <SelectTrigger className={cn("mt-1", errors.phase && "border-red-500")}>
                                    <SelectValue placeholder="Seleccionar fase" />
                                </SelectTrigger>
                                <SelectContent>
                                    {phases.map(phase => (
                                        <SelectItem key={phase} value={phase}>{phase}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.phase && <p className="text-red-500 text-xs mt-1">{errors.phase}</p>}
                        </div>

                        {/* Descripción */}
                        <div>
                            <Label className="text-sm font-medium">
                                Descripción <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                placeholder="Descripción del documento"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className={cn("mt-1", errors.description && "border-red-500")}
                            />
                            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                        </div>

                        {/* Estado */}
                        <div>
                            <Label className="text-sm font-medium">Estado</Label>
                            {isPmo ? (
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as DocumentStatus }))}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                                        <SelectItem value="Aprobado">Aprobado</SelectItem>
                                        <SelectItem value="No aprobado">No aprobado</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="mt-1 p-2 bg-gray-100 rounded-md border text-sm">
                                    <Badge style={{ backgroundColor: documentStatusConfig[formData.status].bg, color: documentStatusConfig[formData.status].text }}>
                                        {formData.status}
                                    </Badge>
                                    <span className="ml-2 text-gray-500 text-xs">(Solo lectura)</span>
                                </div>
                            )}
                        </div>

                        {/* Mensaje de validación */}
                        {errors.linkOrFile && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-600 text-sm">
                                {errors.linkOrFile}
                            </div>
                        )}

                        {/* Link */}
                        <div>
                            <Label className="text-sm font-medium">
                                Link (Archivo o carpeta) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                placeholder="https://..."
                                value={formData.link}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    link: e.target.value,
                                    // Si está editando y el estado era "No aprobado", cambiar a "Pendiente" al modificar link
                                    status: (isEditing && prev.status === 'No aprobado' && e.target.value !== document?.link) ? 'Pendiente' : prev.status,
                                }))}
                                className={cn("mt-1", errors.linkOrFile && !formData.link && !formData.fileData && "border-red-300")}
                            />
                            <p className="text-xs text-gray-400 mt-1">Ingrese un link o adjunte un documento</p>
                        </div>

                        {/* Sección Adjuntar */}
                        <div>
                            <Label className="text-sm font-medium">
                                Adjuntar <span className="text-red-500">*</span>
                            </Label>
                            <p className="text-xs text-gray-500 mb-2">O sube 1 archivo (si no ingresó link)</p>

                            {!formData.fileName ? (
                                // Estado vacío - área de drop
                                <div
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                                        isDragging ? "border-[#018CD1] bg-blue-50" : "border-gray-300",
                                        (errors.file || (errors.linkOrFile && !formData.link)) && "border-red-300"
                                    )}
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                >
                                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-600 mb-2">Arrastra tu archivo aquí o</p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="gap-2"
                                    >
                                        <Upload className="h-4 w-4" />
                                        Seleccionar Documento
                                    </Button>
                                    <p className="text-xs text-gray-400 mt-2">Archivo .pdf, .docx, .xlsx</p>
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
                                // Estado con archivo - preview
                                <div className="border rounded-lg p-3 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {getFileIcon(formData.fileType)}
                                            <span
                                                className="text-sm text-blue-600 underline cursor-pointer truncate"
                                                onClick={() => {
                                                    // Simular descarga
                                                    console.log('Descargando:', formData.fileName);
                                                }}
                                            >
                                                {formData.fileName}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {isExcelFile ? (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    title="Descargar"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => setPreviewModalOpen(true)}
                                                    title="Vista previa"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-700"
                                                onClick={removeFile}
                                                title="Eliminar"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {errors.file && <p className="text-red-500 text-xs mt-1">{errors.file}</p>}
                        </div>
                    </div>

                    <DialogFooter className="p-4 border-t bg-gray-50 flex gap-2">
                        <Button variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} className="bg-[#018CD1] hover:bg-[#018CD1]/90 text-white">
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Preview */}
            <PreviewModal
                isOpen={previewModalOpen}
                onClose={() => setPreviewModalOpen(false)}
                fileName={formData.fileName}
                fileType={formData.fileType}
                fileData={formData.fileData}
                onDownload={() => {
                    if (formData.fileData && formData.fileName && typeof window !== 'undefined') {
                        const link = window.document.createElement('a');
                        link.href = formData.fileData;
                        link.download = formData.fileName;
                        window.document.body.appendChild(link);
                        link.click();
                        window.document.body.removeChild(link);
                    }
                }}
            />
        </>
    );
}

// Modal de preview de documento
function PreviewModal({
    isOpen,
    onClose,
    fileName,
    fileType,
    fileData,
    onDownload,
}: {
    isOpen: boolean;
    onClose: () => void;
    fileName?: string;
    fileType?: string;
    fileData?: string;
    onDownload?: () => void;
}) {
    const isPdf = fileType === 'application/pdf';
    const isWord = fileType?.includes('word') || fileType?.includes('document');
    const isExcel = fileType?.includes('spreadsheet') || fileType?.includes('excel');

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[85vh] p-0 overflow-hidden flex flex-col" showCloseButton={false}>
                <DialogHeader className="p-4 bg-[#004272] text-white flex flex-row items-center justify-between shrink-0">
                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Vista Previa
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                        {onDownload && fileData && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onDownload}
                                className="text-white hover:bg-white/10 hover:text-white gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Descargar
                            </Button>
                        )}
                        <DialogClose asChild>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white h-8 w-8">
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogClose>
                    </div>
                </DialogHeader>

                {/* Área de preview */}
                <div className="flex-1 overflow-auto bg-gray-100 min-h-[400px]">
                    {fileData && isPdf ? (
                        // Preview de PDF usando iframe
                        <iframe
                            src={fileData}
                            className="w-full h-full min-h-[500px]"
                            title="Vista previa PDF"
                        />
                    ) : fileData && (isWord || isExcel) ? (
                        // Word/Excel no se pueden previsualizar directamente
                        <div className="flex items-center justify-center h-full min-h-[400px] p-8">
                            <div className="bg-white shadow-md rounded-lg p-8 text-center max-w-md">
                                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                    {isExcel ? (
                                        <FileSpreadsheet className="h-8 w-8 text-green-600" />
                                    ) : (
                                        <FileText className="h-8 w-8 text-blue-600" />
                                    )}
                                </div>
                                <p className="text-lg font-semibold text-gray-800 mb-2">{fileName}</p>
                                <p className="text-gray-500 text-sm mb-4">
                                    Los archivos {isWord ? 'Word' : 'Excel'} no se pueden previsualizar en el navegador.
                                </p>
                                {onDownload && (
                                    <Button onClick={onDownload} className="bg-[#018CD1] hover:bg-[#018CD1]/90 text-white gap-2">
                                        <Download className="h-4 w-4" />
                                        Descargar archivo
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : !fileData ? (
                        // No hay archivo
                        <div className="flex items-center justify-center h-full min-h-[400px] p-8">
                            <div className="bg-white shadow-md rounded-lg p-8 text-center max-w-md">
                                <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <FileText className="h-8 w-8 text-yellow-600" />
                                </div>
                                <p className="text-lg font-semibold text-gray-800 mb-2">Sin archivo adjunto</p>
                                <p className="text-gray-500 text-sm">
                                    Este documento no tiene un archivo adjunto para previsualizar.
                                </p>
                            </div>
                        </div>
                    ) : (
                        // Placeholder genérico
                        <div className="flex items-center justify-center h-full min-h-[400px] p-8">
                            <div className="bg-white shadow-md rounded-lg p-8 text-center max-w-md">
                                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                    <FileText className="h-8 w-8 text-gray-400" />
                                </div>
                                <p className="text-lg font-semibold text-gray-800 mb-2">{fileName}</p>
                                <p className="text-gray-500 text-sm">Vista previa no disponible</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <DialogFooter className="p-4 border-t bg-gray-50 shrink-0">
                    <Button variant="outline" onClick={onClose}>
                        Cerrar
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
    documentName,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    documentName: string;
}) {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-0" showCloseButton={false}>
                <DialogHeader className="p-4 bg-[#004272] text-white flex flex-row items-center justify-between">
                    <DialogTitle>Eliminar Documento</DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white h-8 w-8">
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogClose>
                </DialogHeader>
                <div className="p-6">
                    <p className="text-gray-700">
                        ¿Está seguro que desea eliminar el documento "<span className="font-semibold">{documentName}</span>"?
                    </p>
                    <p className="text-gray-500 mt-2 text-sm">
                        Esta acción no se puede deshacer.
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

// Modal de descarga exitosa
function DownloadSuccessModal({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
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
                        <DialogTitle className="text-xl font-bold">Descarga exitosa</DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-600">El documento se ha descargado correctamente.</p>
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

function ProjectDocumentsContent() {
    const { user } = useAuth();
    const [project, setProject] = React.useState<Project | null>(null);
    const router = useRouter();
    const [activeTab, setActiveTab] = React.useState('Documentos');
    const [documents, setDocuments] = React.useState<Document[]>(initialDocuments);
    const [searchQuery, setSearchQuery] = useState('');

    // Modales
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [editingDocument, setEditingDocument] = useState<Document | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingDocument, setDeletingDocument] = useState<Document | null>(null);
    const [isDownloadSuccessOpen, setIsDownloadSuccessOpen] = useState(false);
    const [isNoFileModalOpen, setIsNoFileModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewingDocument, setPreviewingDocument] = useState<Document | null>(null);

    // Permisos basados en rol
    const userRole = user?.role;
    const isPmo = userRole === ROLES.PMO;
    const isScrumMaster = userRole === ROLES.SCRUM_MASTER;

    React.useEffect(() => {
        const savedProjectData = localStorage.getItem('selectedProject');
        if (savedProjectData) {
            setProject(JSON.parse(savedProjectData));
        } else {
            router.push(paths.poi.base);
        }
    }, [router]);

    // Obtener pestañas según el rol
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
        else if (tabName === 'Backlog') route = paths.poi.proyecto.backlog.base;
        else if (tabName === 'Actas del proyecto') route = paths.poi.proyecto.actas;
        else if (tabName === 'Requerimientos') route = paths.poi.proyecto.requerimientos;
        else if (tabName === 'Cronograma') route = paths.poi.proyecto.cronograma;

        if (route) {
            router.push(route);
        } else {
            setActiveTab(tabName);
        }
    };

    const handleDocumentStatusChange = (docId: string, newStatus: DocumentStatus) => {
        setDocuments(documents.map(doc => doc.id === docId ? { ...doc, status: newStatus } : doc));
    };

    const handleSaveDocument = (docData: Omit<Document, 'id'> & { id?: string }) => {
        if (docData.id) {
            // Editar existente
            setDocuments(docs => docs.map(d => d.id === docData.id ? { ...d, ...docData } as Document : d));
        } else {
            // Agregar nuevo
            const newDoc: Document = {
                ...docData,
                id: Date.now().toString(),
            } as Document;
            setDocuments(docs => [...docs, newDoc]);
        }
    };

    const handleDeleteDocument = () => {
        if (deletingDocument) {
            setDocuments(docs => docs.filter(d => d.id !== deletingDocument.id));
            setDeletingDocument(null);
        }
    };

    const handleDownload = (doc: Document) => {
        // Si tiene fileData (archivo subido), descargarlo
        if (doc.fileData && doc.fileName) {
            const link = document.createElement('a');
            link.href = doc.fileData;
            link.download = doc.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setIsDownloadSuccessOpen(true);
        }
        // Si tiene link externo, abrir en nueva pestaña
        else if (doc.link) {
            window.open(doc.link, '_blank');
            setIsDownloadSuccessOpen(true);
        }
        // No hay archivo para descargar - mostrar modal
        else {
            setIsNoFileModalOpen(true);
        }
    };

    const openEditModal = (doc: Document) => {
        setEditingDocument(doc);
        setIsDocumentModalOpen(true);
    };

    const openNewModal = () => {
        setEditingDocument(null);
        setIsDocumentModalOpen(true);
    };

    const openDeleteModal = (doc: Document) => {
        setDeletingDocument(doc);
        setIsDeleteModalOpen(true);
    };

    const openPreviewModal = (doc: Document) => {
        setPreviewingDocument(doc);
        setIsPreviewModalOpen(true);
    };

    const handlePreviewDownload = () => {
        if (previewingDocument) {
            handleDownload(previewingDocument);
            setIsPreviewModalOpen(false);
            setPreviewingDocument(null);
        }
    };

    // Filtrar documentos por búsqueda
    const filteredDocuments = documents.filter(doc => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return doc.description.toLowerCase().includes(query) || doc.phase.toLowerCase().includes(query);
    });

    if (!project) {
        return (
            <div className="flex h-screen w-full items-center justify-center">Cargando...</div>
        );
    }

    const projectCode = `PROY N° ${project.id}`;
    const breadcrumbs = [{ label: "POI", href: paths.poi.base }, { label: 'Documentos' }];

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
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <FileText className="h-6 w-6 text-black" />
                                <h3 className="text-xl font-bold">DOCUMENTOS</h3>
                            </div>
                            {/* Botón +Nuevo solo para Scrum Master */}
                            {isScrumMaster && (
                                <Button
                                    className="bg-[#018CD1] hover:bg-[#018CD1]/90 text-white"
                                    onClick={openNewModal}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nuevo
                                </Button>
                            )}
                        </div>

                        {/* Barra de búsqueda */}
                        <div className="flex justify-between items-center mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Buscar por nombre/descripción"
                                    className="pl-10 bg-white w-80"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Tabla de documentos */}
                        <div className="rounded-lg border overflow-hidden">
                            <Table className="bg-white">
                                <TableHeader className="bg-[#004272]/10">
                                    <TableRow>
                                        <TableHead className="font-bold text-[#004272]">Fase</TableHead>
                                        <TableHead className="font-bold text-[#004272]">Descripción</TableHead>
                                        <TableHead className="font-bold text-[#004272]">Link (Archivo o carpeta)</TableHead>
                                        <TableHead className="font-bold text-[#004272]">Estado</TableHead>
                                        <TableHead className="text-center font-bold text-[#004272]">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDocuments.map((doc, index) => (
                                        <TableRow
                                            key={doc.id}
                                            className={cn(
                                                "hover:bg-gray-50 transition-colors",
                                                index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                                            )}
                                        >
                                            <TableCell>{doc.phase}</TableCell>
                                            <TableCell>{doc.description}</TableCell>
                                            <TableCell>
                                                {doc.link ? (
                                                    <a
                                                        href={doc.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 underline hover:text-blue-800"
                                                    >
                                                        {doc.link.length > 40 ? doc.link.substring(0, 40) + '...' : doc.link}
                                                    </a>
                                                ) : doc.fileName ? (
                                                    <span className="text-blue-600">{doc.fileName}</span>
                                                ) : (
                                                    <span className="text-gray-400 underline cursor-pointer">Subir</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    style={{
                                                        backgroundColor: documentStatusConfig[doc.status].bg,
                                                        color: documentStatusConfig[doc.status].text,
                                                    }}
                                                    className="font-semibold"
                                                >
                                                    {doc.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-center gap-1">
                                                    {/* PMO: Preview y Validar estado */}
                                                    {isPmo && (
                                                        <>
                                                            {/* Botón Preview */}
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-gray-500 hover:text-[#018CD1] hover:bg-[#018CD1]/10"
                                                                onClick={() => openPreviewModal(doc)}
                                                                title="Vista previa"
                                                            >
                                                                <Eye className="h-5 w-5" />
                                                            </Button>
                                                            {/* Botón Validar - PMO puede cambiar estado en cualquier momento */}
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-gray-500 hover:text-[#018CD1] hover:bg-[#018CD1]/10"
                                                                        title="Validar documento"
                                                                    >
                                                                        <CheckSquare className="h-5 w-5" />
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-auto p-2">
                                                                    <div className="text-sm font-semibold p-1">Validar documento</div>
                                                                    <div className="text-xs text-gray-500 mb-2 px-1">
                                                                        Estado actual: <span className="font-medium">{doc.status}</span>
                                                                    </div>
                                                                    <div className="flex flex-col gap-1">
                                                                        <Badge
                                                                            onClick={() => handleDocumentStatusChange(doc.id, 'Aprobado')}
                                                                            style={{
                                                                                backgroundColor: documentStatusConfig['Aprobado'].bg,
                                                                                color: documentStatusConfig['Aprobado'].text,
                                                                            }}
                                                                            className={cn(
                                                                                "cursor-pointer justify-center py-1 hover:opacity-80",
                                                                                doc.status === 'Aprobado' && "ring-2 ring-offset-1 ring-green-600"
                                                                            )}
                                                                        >
                                                                            Aprobado
                                                                        </Badge>
                                                                        <Badge
                                                                            onClick={() => handleDocumentStatusChange(doc.id, 'No aprobado')}
                                                                            style={{
                                                                                backgroundColor: documentStatusConfig['No aprobado'].bg,
                                                                                color: documentStatusConfig['No aprobado'].text,
                                                                            }}
                                                                            className={cn(
                                                                                "cursor-pointer justify-center py-1 hover:opacity-80",
                                                                                doc.status === 'No aprobado' && "ring-2 ring-offset-1 ring-red-600"
                                                                            )}
                                                                        >
                                                                            No Aprobado
                                                                        </Badge>
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                        </>
                                                    )}

                                                    {/* Scrum Master: Editar, Descargar, Eliminar */}
                                                    {/* Editar solo disponible si NO está Aprobado */}
                                                    {isScrumMaster && (
                                                        <>
                                                            {doc.status !== 'Aprobado' ? (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-gray-500 hover:text-[#018CD1] hover:bg-[#018CD1]/10"
                                                                    onClick={() => openEditModal(doc)}
                                                                    title="Editar"
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                            ) : (
                                                                <Popover>
                                                                    <PopoverTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-gray-300 cursor-not-allowed"
                                                                            title="Documento aprobado - No editable"
                                                                        >
                                                                            <Pencil className="h-4 w-4" />
                                                                        </Button>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="w-auto p-3">
                                                                        <div className="flex items-center gap-2 text-sm">
                                                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                                                            <span>Documento aprobado por PMO</span>
                                                                        </div>
                                                                        <p className="text-xs text-gray-500 mt-1">No se puede editar un documento aprobado</p>
                                                                    </PopoverContent>
                                                                </Popover>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-gray-500 hover:text-green-600 hover:bg-green-50"
                                                                onClick={() => handleDownload(doc)}
                                                                title="Descargar"
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </Button>
                                                            {doc.status !== 'Aprobado' ? (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                                                                    onClick={() => openDeleteModal(doc)}
                                                                    title="Eliminar"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            ) : (
                                                                <Popover>
                                                                    <PopoverTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-gray-300 cursor-not-allowed"
                                                                            title="Documento aprobado - No eliminable"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="w-auto p-3">
                                                                        <div className="flex items-center gap-2 text-sm">
                                                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                                                            <span>Documento aprobado por PMO</span>
                                                                        </div>
                                                                        <p className="text-xs text-gray-500 mt-1">No se puede eliminar un documento aprobado</p>
                                                                    </PopoverContent>
                                                                </Popover>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* Otros roles: Solo descargar */}
                                                    {!isPmo && !isScrumMaster && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-gray-500 hover:text-green-600 hover:bg-green-50"
                                                            onClick={() => handleDownload(doc)}
                                                            title="Descargar"
                                                        >
                                                            <Download className="h-5 w-5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Paginación */}
                        <Pagination className="mt-4 justify-start">
                            <PaginationContent>
                                <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
                                <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
                                <PaginationItem><PaginationLink href="#" isActive>2</PaginationLink></PaginationItem>
                                <PaginationItem><PaginationLink href="#">3</PaginationLink></PaginationItem>
                                <PaginationItem>...</PaginationItem>
                                <PaginationItem><PaginationNext href="#" /></PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </div>
            </div>

            {/* Modal de Documento (Agregar/Editar) */}
            <DocumentModal
                isOpen={isDocumentModalOpen}
                onClose={() => {
                    setIsDocumentModalOpen(false);
                    setEditingDocument(null);
                }}
                document={editingDocument}
                onSave={handleSaveDocument}
                isPmo={isPmo}
            />

            {/* Modal de confirmación de eliminación */}
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setDeletingDocument(null);
                }}
                onConfirm={handleDeleteDocument}
                documentName={deletingDocument?.description || ''}
            />

            {/* Modal de sin archivo */}
            <Dialog open={isNoFileModalOpen} onOpenChange={setIsNoFileModalOpen}>
                <DialogContent className="sm:max-w-sm p-8 text-center" showCloseButton={false}>
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                            <FileText className="w-10 h-10 text-yellow-600" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">Sin archivo adjunto</DialogTitle>
                        </DialogHeader>
                        <p className="text-gray-600">Este documento no tiene archivo adjunto para descargar.</p>
                        <DialogFooter className="mt-2 w-full">
                            <Button onClick={() => setIsNoFileModalOpen(false)} className="w-full bg-[#018CD1] hover:bg-[#018CD1]/90">
                                Aceptar
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal de descarga exitosa */}
            <DownloadSuccessModal
                isOpen={isDownloadSuccessOpen}
                onClose={() => setIsDownloadSuccessOpen(false)}
            />

            {/* Modal de Preview para PMO */}
            <PreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => {
                    setIsPreviewModalOpen(false);
                    setPreviewingDocument(null);
                }}
                fileName={previewingDocument?.fileName || previewingDocument?.description}
                fileType={previewingDocument?.fileType}
                fileData={previewingDocument?.fileData}
                onDownload={handlePreviewDownload}
            />
        </AppLayout>
    );
}

export default function DocumentsPage() {
    return (
        <ProtectedRoute module={MODULES.POI}>
            <React.Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Cargando...</div>}>
                <ProjectDocumentsContent />
            </React.Suspense>
        </ProtectedRoute>
    );
}
