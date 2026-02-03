"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    MoreHorizontal,
    Plus,
    X,
    ChevronRight,
    ChevronDown,
    Trash2,
    Pencil,
    Upload,
    Download,
    Eye,
    Send,
    Reply,
    FileText,
    Image as ImageIcon,
    File,
    Calendar,
    Clock,
    User,
    AlertTriangle,
    CheckCircle,
    Folder,
} from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Project, ROLES } from '@/lib/definitions';
import { paths } from '@/lib/paths';
import { useAuth } from '@/stores';
import { jsPDF } from 'jspdf';

// ==================== TIPOS ====================
type TaskStatus = 'Por hacer' | 'En progreso' | 'Finalizado';
type Priority = 'Alta' | 'Media' | 'Baja';

type TaskAttachment = {
    id: string;
    name: string;
    size: number;
    type: string;
    url?: string;
};

type TaskComment = {
    id: string;
    user: string;
    content: string;
    timestamp: Date;
    parentId?: string;
};

type TaskHistoryItem = {
    id: string;
    user: string;
    action: string;
    field?: string;
    oldValue?: string;
    newValue?: string;
    timestamp: Date;
};

type Subtask = {
    id: string;
    title: string;
    description?: string;
    state: TaskStatus;
    responsible: string;
    priority: Priority;
    startDate: string;
    endDate: string;
    informer: string;
    parentTaskId: string;
    attachments: TaskAttachment[];
    comments: TaskComment[];
    history: TaskHistoryItem[];
};

type Task = {
    id: string;
    title: string;
    description?: string;
    state: TaskStatus;
    responsibles: string[];
    priority: Priority;
    startDate: string;
    endDate: string;
    informer: string;
    attachments: TaskAttachment[];
    subtasks: Subtask[];
    comments: TaskComment[];
    history: TaskHistoryItem[];
};

// ==================== CONSTANTES ====================
const statusColors: Record<TaskStatus, string> = {
    'Por hacer': 'bg-[#BFDBFE] text-blue-800',
    'En progreso': 'bg-[#FACC15] text-yellow-900',
    'Finalizado': 'bg-[#34D399] text-green-900',
};

const priorityColors: Record<Priority, { bg: string; text: string }> = {
    'Alta': { bg: '#F2B5B5', text: 'text-red-900' },
    'Media': { bg: '#FFD29F', text: 'text-orange-900' },
    'Baja': { bg: '#C5E3B5', text: 'text-green-900' },
};

const availableResponsibles = [
    'Anayeli Monzon',
    'Angella Trujillo',
    'Carlos Mendoza',
    'Ana Torres',
    'Pedro Sánchez',
    'María López',
    'Juan Pérez',
    'Diego Morales',
    'Fernando Rojas',
    'Rosa Martínez',
];

// Datos de ejemplo
const initialTasks: Task[] = [
    {
        id: 'TAR-1',
        title: 'Configurar servidor de desarrollo',
        description: 'Preparar el entorno de desarrollo con todas las dependencias necesarias',
        state: 'En progreso',
        responsibles: ['Anayeli Monzon', 'Carlos Mendoza'],
        priority: 'Alta',
        startDate: '01/12/2025',
        endDate: '05/12/2025',
        informer: 'Scrum Master',
        attachments: [],
        subtasks: [
            {
                id: 'SUB-1',
                title: 'Instalar dependencias del proyecto',
                description: 'Instalar Node.js, npm y todas las dependencias',
                state: 'Finalizado',
                responsible: 'Anayeli Monzon',
                priority: 'Alta',
                startDate: '01/12/2025',
                endDate: '02/12/2025',
                informer: 'Scrum Master',
                parentTaskId: 'TAR-1',
                attachments: [{ id: '1', name: 'instalacion_completa.pdf', size: 1024000, type: 'application/pdf' }],
                comments: [],
                history: [
                    { id: '1', user: 'Anayeli Monzon', action: 'creó la subtarea', timestamp: new Date('2025-12-01T09:00:00') },
                    { id: '2', user: 'Anayeli Monzon', action: 'cambió el estado', field: 'Estado', oldValue: 'Por hacer', newValue: 'Finalizado', timestamp: new Date('2025-12-02T14:00:00') },
                ],
            },
            {
                id: 'SUB-2',
                title: 'Configurar variables de entorno',
                state: 'En progreso',
                responsible: 'Carlos Mendoza',
                priority: 'Media',
                startDate: '02/12/2025',
                endDate: '04/12/2025',
                informer: 'Scrum Master',
                parentTaskId: 'TAR-1',
                attachments: [],
                comments: [],
                history: [],
            },
        ],
        comments: [
            { id: '1', user: 'Anayeli Monzon', content: 'Ya instalé las dependencias principales', timestamp: new Date('2025-12-01T15:30:00') },
        ],
        history: [
            { id: '1', user: 'Scrum Master', action: 'creó la tarea', timestamp: new Date('2025-12-01T08:00:00') },
            { id: '2', user: 'Scrum Master', action: 'cambió el estado', field: 'Estado', oldValue: 'Por hacer', newValue: 'En progreso', timestamp: new Date('2025-12-01T10:00:00') },
        ],
    },
    {
        id: 'TAR-2',
        title: 'Diseñar esquema de base de datos',
        description: 'Crear el modelo entidad-relación para el sistema',
        state: 'Finalizado',
        responsibles: ['Ana Torres'],
        priority: 'Alta',
        startDate: '01/12/2025',
        endDate: '03/12/2025',
        informer: 'Scrum Master',
        attachments: [{ id: '1', name: 'esquema_db.png', size: 512000, type: 'image/png' }],
        subtasks: [],
        comments: [],
        history: [],
    },
    {
        id: 'TAR-3',
        title: 'Implementar API REST de usuarios',
        description: 'Desarrollar endpoints CRUD para gestión de usuarios',
        state: 'Por hacer',
        responsibles: ['Pedro Sánchez', 'María López'],
        priority: 'Media',
        startDate: '05/12/2025',
        endDate: '10/12/2025',
        informer: 'Scrum Master',
        attachments: [],
        subtasks: [],
        comments: [],
        history: [],
    },
];

// ==================== COMPONENTES AUXILIARES ====================

// Modal de confirmación de eliminación
function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    itemType,
    itemId,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemType: 'tarea' | 'subtarea';
    itemId: string;
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
                    <AlertTriangle className="h-16 w-16 text-black mb-4" strokeWidth={1.5} />
                    <p className="font-bold text-lg">¿Estás seguro?</p>
                    <p className="text-muted-foreground">
                        La {itemType} {itemId} será eliminada
                    </p>
                </div>
                <DialogFooter className="px-6 pb-6 flex justify-center gap-4">
                    <Button variant="outline" onClick={onClose} className="border-gray-300">
                        Cancelar
                    </Button>
                    <Button onClick={onConfirm} className="bg-[#EC221F] hover:bg-[#EC221F]/90 text-white">
                        Sí, eliminar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Modal de error genérico
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
            <DialogContent className="sm:max-w-md p-0" showCloseButton={false}>
                <DialogHeader className="p-4 bg-[#EC221F] text-white rounded-t-lg flex flex-row items-center justify-between">
                    <DialogTitle>Error</DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white">
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogClose>
                </DialogHeader>
                <div className="p-6 text-center flex flex-col items-center">
                    <AlertTriangle className="h-16 w-16 text-[#EC221F] mb-4" strokeWidth={1.5} />
                    <p className="text-muted-foreground">{message}</p>
                </div>
                <DialogFooter className="px-6 pb-6 flex justify-center">
                    <Button onClick={onClose} className="bg-[#018CD1] hover:bg-[#018CD1]/90 text-white">
                        Entendido
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Modal de Evidencia Requerida (similar al del módulo Proyecto)
function EvidenceRequiredModal({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    if (!isOpen) return null;
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-6 text-center" showCloseButton={false}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-yellow-600" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-800">Evidencia Requerida</DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-600">No se puede finalizar la subtarea sin evidencia adjunta</p>
                    <DialogFooter className="mt-4 w-full">
                        <Button onClick={onClose} className="w-full bg-[#018CD1] hover:bg-[#018CD1]/90">Entendido</Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Modal de previsualización de documento PDF generado
function TaskDocumentPreviewModal({
    isOpen,
    onClose,
    task,
}: {
    isOpen: boolean;
    onClose: () => void;
    task: Task | null;
}) {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    React.useEffect(() => {
        if (isOpen && task && task.state === 'Finalizado') {
            generatePdfDocument(task);
        }
        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [isOpen, task]);

    // Función auxiliar para cargar imagen como base64
    const loadImageAsBase64 = (url: string): Promise<string | null> => {
        return new Promise((resolve) => {
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                } else {
                    resolve(null);
                }
            };
            img.onerror = () => resolve(null);
            img.src = url;
        });
    };

    const generatePdfDocument = async (taskData: Task) => {
        setIsGenerating(true);
        try {
            const doc = new jsPDF();
            let yPosition = 20;
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            const contentWidth = pageWidth - 2 * margin;
            const maxImageWidth = contentWidth;
            const maxImageHeight = 80; // Altura máxima para imágenes

            // Título del documento
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(`Documento de Evidencias`, pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 12;

            // Información de la tarea
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`Tarea: ${taskData.id} - ${taskData.title}`, margin, yPosition);
            yPosition += 8;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Estado: ${taskData.state}`, margin, yPosition);
            yPosition += 5;
            doc.text(`Fecha de inicio: ${taskData.startDate}`, margin, yPosition);
            yPosition += 5;
            doc.text(`Fecha de fin: ${taskData.endDate}`, margin, yPosition);
            yPosition += 5;
            doc.text(`Responsables: ${taskData.responsibles.join(', ')}`, margin, yPosition);
            yPosition += 15;

            // Línea separadora
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 10;

            // Sección de subtareas con evidencias
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Evidencias de Subtareas', margin, yPosition);
            yPosition += 12;

            for (const subtask of taskData.subtasks) {
                if (subtask.attachments.length > 0) {
                    // Verificar si necesitamos nueva página para el encabezado de subtarea
                    if (yPosition > pageHeight - 60) {
                        doc.addPage();
                        yPosition = 20;
                    }

                    // Encabezado de subtarea
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');
                    doc.text(`${subtask.id}: ${subtask.title}`, margin, yPosition);
                    yPosition += 6;

                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'normal');
                    doc.text(`Responsable: ${subtask.responsible} | Estado: ${subtask.state}`, margin, yPosition);
                    yPosition += 10;

                    // Procesar cada archivo adjunto
                    for (const attachment of subtask.attachments) {
                        const isImage = attachment.type.startsWith('image/');
                        const isPdf = attachment.type === 'application/pdf';

                        // Verificar espacio para el archivo
                        if (yPosition > pageHeight - (isImage ? maxImageHeight + 30 : 40)) {
                            doc.addPage();
                            yPosition = 20;
                        }

                        // Nombre del archivo
                        doc.setFontSize(10);
                        doc.setFont('helvetica', 'bold');
                        const fileLabel = isImage ? 'Imagen:' : 'Archivo:';
                        doc.text(`${fileLabel} ${attachment.name}`, margin, yPosition);
                        yPosition += 5;

                        if (isImage && attachment.url) {
                            // Intentar cargar e insertar la imagen
                            try {
                                const imageData = await loadImageAsBase64(attachment.url);
                                if (imageData) {
                                    // Calcular dimensiones manteniendo proporción
                                    const img = new window.Image();
                                    img.src = imageData;

                                    let imgWidth = maxImageWidth;
                                    let imgHeight = maxImageHeight;

                                    // Ajustar proporcionalmente
                                    const aspectRatio = img.width / img.height;
                                    if (aspectRatio > maxImageWidth / maxImageHeight) {
                                        imgHeight = maxImageWidth / aspectRatio;
                                    } else {
                                        imgWidth = maxImageHeight * aspectRatio;
                                    }

                                    // Verificar si cabe en la página
                                    if (yPosition + imgHeight > pageHeight - 20) {
                                        doc.addPage();
                                        yPosition = 20;
                                    }

                                    doc.addImage(imageData, 'JPEG', margin, yPosition, imgWidth, imgHeight);
                                    yPosition += imgHeight + 10;
                                } else {
                                    // Si no se pudo cargar, mostrar placeholder
                                    doc.setFontSize(9);
                                    doc.setFont('helvetica', 'italic');
                                    doc.text(`[Imagen: ${attachment.name} - ${(attachment.size / 1024).toFixed(1)} KB]`, margin + 5, yPosition);
                                    yPosition += 8;
                                }
                            } catch {
                                // Error al cargar imagen, mostrar placeholder
                                doc.setFontSize(9);
                                doc.setFont('helvetica', 'italic');
                                doc.text(`[Imagen: ${attachment.name} - ${(attachment.size / 1024).toFixed(1)} KB]`, margin + 5, yPosition);
                                yPosition += 8;
                            }
                        } else if (isPdf) {
                            // Para PDFs adjuntos, mostrar información
                            doc.setFontSize(9);
                            doc.setFont('helvetica', 'normal');
                            doc.setFillColor(240, 240, 240);
                            doc.rect(margin, yPosition, contentWidth, 15, 'F');
                            doc.setDrawColor(200, 200, 200);
                            doc.rect(margin, yPosition, contentWidth, 15, 'S');
                            doc.text(`PDF Adjunto: ${attachment.name} (${(attachment.size / 1024).toFixed(1)} KB)`, margin + 5, yPosition + 10);
                            yPosition += 20;
                        } else {
                            // Otros tipos de archivo
                            doc.setFontSize(9);
                            doc.setFont('helvetica', 'normal');
                            doc.text(`Archivo: ${attachment.name} (${(attachment.size / 1024).toFixed(1)} KB)`, margin + 5, yPosition);
                            yPosition += 8;
                        }
                    }
                    yPosition += 10; // Espacio entre subtareas
                }
            }

            // Pie de página en todas las páginas
            const totalPages = doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text(
                    `Generado el: ${new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
                    margin,
                    pageHeight - 10
                );
                doc.text(
                    `Página ${i} de ${totalPages}`,
                    pageWidth - margin,
                    pageHeight - 10,
                    { align: 'right' }
                );
            }

            // Generar blob URL para previsualización
            const pdfBlob = doc.output('blob');
            const url = URL.createObjectURL(pdfBlob);
            setPdfUrl(url);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (task && pdfUrl) {
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = `Evidencias_${task.id}_${task.title.replace(/\s+/g, '_')}.pdf`;
            link.click();
        }
    };

    if (!isOpen || !task) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0" showCloseButton={false}>
                <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between">
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Documento de Evidencias - {task.id}
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDownload}
                            className="text-white hover:bg-white/10 hover:text-white"
                            disabled={!pdfUrl}
                        >
                            <Download className="h-4 w-4 mr-1" />
                            Descargar
                        </Button>
                        <DialogClose asChild>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white">
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogClose>
                    </div>
                </DialogHeader>
                <div className="flex-1 min-h-[500px] bg-gray-100">
                    {isGenerating ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004272] mx-auto mb-4"></div>
                                <p className="text-gray-600">Generando documento...</p>
                            </div>
                        </div>
                    ) : pdfUrl ? (
                        <iframe
                            src={pdfUrl}
                            className="w-full h-[500px]"
                            title="Vista previa del documento"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <FileText className="h-24 w-24 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No se pudo generar el documento</p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Modal de preview de archivos
function FilePreviewModal({
    isOpen,
    onClose,
    file,
    files,
    currentIndex,
    onNavigate,
}: {
    isOpen: boolean;
    onClose: () => void;
    file: TaskAttachment | null;
    files: TaskAttachment[];
    currentIndex: number;
    onNavigate: (direction: 'prev' | 'next') => void;
}) {
    if (!isOpen || !file) return null;

    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0" showCloseButton={false}>
                <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between">
                    <DialogTitle>{file.name}</DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white">
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogClose>
                </DialogHeader>
                <div className="p-4 flex-1 min-h-[400px] flex items-center justify-center bg-gray-100">
                    {isPdf && (
                        <div className="w-full h-[500px] flex items-center justify-center">
                            <div className="text-center">
                                <FileText className="h-24 w-24 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">Vista previa de PDF</p>
                                <p className="text-sm text-gray-400">{file.name}</p>
                            </div>
                        </div>
                    )}
                    {isImage && (
                        <div className="flex items-center justify-center">
                            <ImageIcon className="h-48 w-48 text-gray-400" />
                        </div>
                    )}
                </div>
                <DialogFooter className="p-4 flex justify-between items-center border-t">
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onNavigate('prev')}
                            disabled={currentIndex === 0}
                        >
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => onNavigate('next')}
                            disabled={currentIndex === files.length - 1}
                        >
                            Siguiente
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="gap-2">
                            <Download className="h-4 w-4" />
                            Descargar
                        </Button>
                        <Button onClick={onClose} className="bg-[#018CD1] hover:bg-[#018CD1]/90 text-white">
                            Cerrar
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ==================== MODAL DE TAREA ====================
function TaskModal({
    isOpen,
    onClose,
    task,
    onSave,
    onDelete,
    currentUser,
}: {
    isOpen: boolean;
    onClose: () => void;
    task: Task | null;
    onSave: (task: Task, isEdit: boolean) => void;
    onDelete: (taskId: string) => void;
    currentUser: string;
}) {
    const isEditing = task !== null;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<Omit<Task, 'id' | 'subtasks' | 'comments' | 'history'>>({
        title: '',
        description: '',
        state: 'Por hacer',
        responsibles: [],
        priority: 'Media',
        startDate: '',
        endDate: '',
        informer: currentUser,
        attachments: [],
    });

    const [subtasks, setSubtasks] = useState<Subtask[]>([]);
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [history, setHistory] = useState<TaskHistoryItem[]>([]);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [responsibleSearch, setResponsibleSearch] = useState('');
    const [showResponsibleDropdown, setShowResponsibleDropdown] = useState(false);
    const [activeActivityTab, setActiveActivityTab] = useState<'comentarios' | 'historial'>('comentarios');
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');

    const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
    const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isFinalizadoWarningOpen, setIsFinalizadoWarningOpen] = useState(false);

    const [previewFile, setPreviewFile] = useState<TaskAttachment | null>(null);
    const [previewIndex, setPreviewIndex] = useState(0);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Cargar datos al abrir
    React.useEffect(() => {
        if (task) {
            setFormData({
                title: task.title,
                description: task.description || '',
                state: task.state,
                responsibles: task.responsibles,
                priority: task.priority,
                startDate: task.startDate,
                endDate: task.endDate,
                informer: task.informer,
                attachments: task.attachments,
            });
            setSubtasks(task.subtasks);
            setComments(task.comments);
            setHistory(task.history);
        } else {
            setFormData({
                title: '',
                description: '',
                state: 'Por hacer',
                responsibles: [],
                priority: 'Media',
                startDate: '',
                endDate: '',
                informer: currentUser,
                attachments: [],
            });
            setSubtasks([]);
            setComments([]);
            setHistory([]);
        }
        setErrors({});
        setResponsibleSearch('');
        setNewComment('');
    }, [task, isOpen, currentUser]);

    const filteredResponsibles = availableResponsibles.filter(
        r => r.toLowerCase().includes(responsibleSearch.toLowerCase()) && !formData.responsibles.includes(r)
    );

    const addResponsible = (name: string) => {
        if (formData.responsibles.length < 5) {
            setFormData(prev => ({ ...prev, responsibles: [...prev.responsibles, name] }));
        }
        setResponsibleSearch('');
        setShowResponsibleDropdown(false);
    };

    const removeResponsible = (name: string) => {
        setFormData(prev => ({ ...prev, responsibles: prev.responsibles.filter(r => r !== name) }));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newAttachments: TaskAttachment[] = [];
        for (let i = 0; i < files.length && formData.attachments.length + newAttachments.length < 5; i++) {
            const file = files[i];
            const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
            if (validTypes.includes(file.type) && file.size <= 50 * 1024 * 1024) {
                newAttachments.push({
                    id: `att-${Date.now()}-${i}`,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                });
            }
        }
        setFormData(prev => ({ ...prev, attachments: [...prev.attachments, ...newAttachments] }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachment = (id: string) => {
        setFormData(prev => ({ ...prev, attachments: prev.attachments.filter(a => a.id !== id) }));
    };

    const openPreview = (file: TaskAttachment, index: number) => {
        setPreviewFile(file);
        setPreviewIndex(index);
        setIsPreviewOpen(true);
    };

    const navigatePreview = (direction: 'prev' | 'next') => {
        const newIndex = direction === 'prev' ? previewIndex - 1 : previewIndex + 1;
        if (newIndex >= 0 && newIndex < formData.attachments.length) {
            setPreviewIndex(newIndex);
            setPreviewFile(formData.attachments[newIndex]);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        const newCommentItem: TaskComment = {
            id: `comment-${Date.now()}`,
            user: currentUser,
            content: newComment.trim(),
            timestamp: new Date(),
        };
        setComments(prev => [...prev, newCommentItem]);
        setNewComment('');
    };

    const handleReplyComment = (parentId: string) => {
        if (!replyContent.trim()) return;
        const replyItem: TaskComment = {
            id: `reply-${Date.now()}`,
            user: currentUser,
            content: replyContent.trim(),
            timestamp: new Date(),
            parentId,
        };
        setComments(prev => [...prev, replyItem]);
        setReplyContent('');
        setReplyingTo(null);
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) newErrors.title = 'El título es obligatorio';
        if (formData.responsibles.length === 0) newErrors.responsibles = 'Debe asignar al menos un responsable';
        if (!formData.startDate) newErrors.startDate = 'La fecha de inicio es obligatoria';
        if (!formData.endDate) newErrors.endDate = 'La fecha de fin es obligatoria';

        // Validar que fecha fin no sea menor a fecha inicio
        if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
            newErrors.endDate = 'La fecha de fin no puede ser menor a la fecha de inicio';
        }

        // Validar estado Finalizado
        if (formData.state === 'Finalizado') {
            // Verificar que todas las subtareas estén finalizadas
            const pendingSubtasks = subtasks.filter(s => s.state !== 'Finalizado');
            if (pendingSubtasks.length > 0) {
                newErrors.state = 'No puede finalizar la tarea hasta que todas las subtareas estén finalizadas';
            }
            // Verificar que tenga adjuntos
            if (formData.attachments.length === 0) {
                newErrors.attachments = 'Debe adjuntar evidencia para marcar como finalizado';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validate()) {
            if (errors.state) {
                setErrorMessage(errors.state);
                setIsErrorModalOpen(true);
            } else if (errors.attachments) {
                setErrorMessage(errors.attachments);
                setIsErrorModalOpen(true);
            }
            return;
        }

        const taskData: Task = {
            id: task?.id || `TAR-${Date.now()}`,
            ...formData,
            subtasks,
            comments,
            history: isEditing ? [
                ...history,
                { id: `hist-${Date.now()}`, user: currentUser, action: 'actualizó la tarea', timestamp: new Date() }
            ] : [
                { id: `hist-${Date.now()}`, user: currentUser, action: 'creó la tarea', timestamp: new Date() }
            ],
        };

        onSave(taskData, isEditing);
        onClose();
    };

    const handleSaveSubtask = (subtask: Subtask, isEdit: boolean) => {
        if (isEdit) {
            setSubtasks(prev => prev.map(s => s.id === subtask.id ? subtask : s));
        } else {
            setSubtasks(prev => [...prev, subtask]);
        }
        setIsSubtaskModalOpen(false);
        setEditingSubtask(null);
    };

    const handleDeleteSubtask = (subtaskId: string) => {
        setSubtasks(prev => prev.filter(s => s.id !== subtaskId));
    };

    if (!isOpen) return null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 overflow-hidden" showCloseButton={false}>
                    <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between">
                        <DialogTitle>{isEditing ? 'Editar Tarea' : 'Crear Tarea'}</DialogTitle>
                        <DialogClose asChild>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white">
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogClose>
                    </DialogHeader>

                    <ScrollArea className="max-h-[calc(90vh-140px)]">
                        <div className="p-6">
                            {/* Layout de 2 columnas principales */}
                            <div className="grid grid-cols-2 gap-6">
                                {/* ========== COLUMNA IZQUIERDA ========== */}
                                <div className="space-y-4">
                                    {/* Título */}
                                    <div>
                                        <Label className="text-sm font-medium">Título <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.title}
                                            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value.slice(0, 255) }))}
                                            placeholder="Ingrese el título de la tarea"
                                            className={cn("mt-1 h-8 text-sm", errors.title && "border-red-500")}
                                            maxLength={255}
                                        />
                                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                                    </div>

                                    {/* Descripción */}
                                    <div>
                                        <Label className="text-sm font-medium">Descripción</Label>
                                        <Textarea
                                            value={formData.description}
                                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Ingrese una descripción (opcional)"
                                            className="mt-1 min-h-[60px] text-sm"
                                        />
                                    </div>

                                    {/* Sección de Subtareas */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between border-b pb-2">
                                            <h3 className="font-semibold text-sm text-gray-700">Agregar Subtareas</h3>
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={() => { setEditingSubtask(null); setIsSubtaskModalOpen(true); }}
                                                className="bg-[#018CD1] hover:bg-[#0179b5] h-7 w-7 p-0"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {subtasks.length > 0 ? (
                                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                                {subtasks.map(subtask => (
                                                    <div key={subtask.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border">
                                                        <div className="flex-1 min-w-0">
                                                            <p className={cn("font-medium text-sm truncate", subtask.state === 'Finalizado' && "line-through")}>{subtask.title}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge className={cn(statusColors[subtask.state], 'text-xs')}>{subtask.state}</Badge>
                                                                <span className="text-xs text-gray-500 truncate">{subtask.responsible}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 ml-2">
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-[#018CD1]" onClick={() => { setEditingSubtask(subtask); setIsSubtaskModalOpen(true); }}>
                                                                <Pencil className="h-3 w-3" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-red-600" onClick={() => handleDeleteSubtask(subtask.id)}>
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">No hay subtareas agregadas.</p>
                                        )}
                                    </div>

                                    {/* Sección Actividad - Con tabs */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-4 border-b pb-2">
                                            <button
                                                type="button"
                                                onClick={() => setActiveActivityTab('comentarios')}
                                                className={cn(
                                                    "text-sm font-semibold pb-1 border-b-2 -mb-[9px]",
                                                    activeActivityTab === 'comentarios'
                                                        ? "text-[#018CD1] border-[#018CD1]"
                                                        : "text-gray-500 border-transparent hover:text-gray-700"
                                                )}
                                            >
                                                Comentarios
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActiveActivityTab('historial')}
                                                className={cn(
                                                    "text-sm font-semibold pb-1 border-b-2 -mb-[9px]",
                                                    activeActivityTab === 'historial'
                                                        ? "text-[#018CD1] border-[#018CD1]"
                                                        : "text-gray-500 border-transparent hover:text-gray-700"
                                                )}
                                            >
                                                Historial
                                            </button>
                                        </div>

                                        {/* Tab Comentarios */}
                                        {activeActivityTab === 'comentarios' && (
                                            <div className="space-y-3">
                                                {comments.length > 0 && (
                                                    <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2 bg-gray-50">
                                                        {comments.filter(c => !c.parentId).map(comment => (
                                                            <div key={comment.id} className="space-y-1">
                                                                <div className="flex items-start gap-2 text-sm">
                                                                    <div className="w-6 h-6 rounded-full bg-[#018CD1] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                                                                        {getInitials(comment.user)}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-xs">
                                                                            <span className="font-medium">{comment.user}</span>
                                                                        </p>
                                                                        <p className="text-sm text-gray-700 mt-0.5">{comment.content}</p>
                                                                        <div className="flex items-center gap-2 mt-0.5">
                                                                            <p className="text-xs text-gray-500">{formatDate(comment.timestamp)}</p>
                                                                            <button
                                                                                className="text-xs text-blue-500 flex items-center gap-1"
                                                                                onClick={() => setReplyingTo(comment.id)}
                                                                            >
                                                                                <Reply className="h-3 w-3" /> Responder
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {/* Respuestas */}
                                                                {comments.filter(c => c.parentId === comment.id).map(reply => (
                                                                    <div key={reply.id} className="ml-8 flex items-start gap-2 text-sm">
                                                                        <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                                                                            {getInitials(reply.user)}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-xs"><span className="font-medium">{reply.user}</span></p>
                                                                            <p className="text-sm text-gray-700">{reply.content}</p>
                                                                            <p className="text-xs text-gray-500">{formatDate(reply.timestamp)}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {/* Input respuesta */}
                                                                {replyingTo === comment.id && (
                                                                    <div className="ml-8 flex gap-2">
                                                                        <Input
                                                                            value={replyContent}
                                                                            onChange={e => setReplyContent(e.target.value)}
                                                                            placeholder="Escribe tu respuesta..."
                                                                            className="h-7 text-sm"
                                                                        />
                                                                        <Button size="sm" onClick={() => handleReplyComment(comment.id)} className="bg-[#018CD1] h-7">
                                                                            Enviar
                                                                        </Button>
                                                                        <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)} className="h-7">
                                                                            X
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="flex gap-2">
                                                    <Input
                                                        value={newComment}
                                                        onChange={e => setNewComment(e.target.value)}
                                                        placeholder="Añadir un comentario..."
                                                        className="h-8 text-sm"
                                                        onKeyPress={e => e.key === 'Enter' && handleAddComment()}
                                                    />
                                                    <Button onClick={handleAddComment} size="icon" className="bg-[#018CD1] h-8 w-8">
                                                        <Send className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Tab Historial */}
                                        {activeActivityTab === 'historial' && (
                                            <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2 bg-gray-50">
                                                {history.length > 0 ? (
                                                    history.map(item => (
                                                        <div key={item.id} className="flex items-start gap-2 text-sm">
                                                            <Clock className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs"><span className="font-medium">{item.user}</span> {item.action}
                                                                    {item.field && (
                                                                        <span className="text-gray-500">: {item.oldValue} → {item.newValue}</span>
                                                                    )}
                                                                </p>
                                                                <p className="text-xs text-gray-500">{formatDate(item.timestamp)}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-gray-500 italic text-center py-2">No hay historial de modificaciones.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ========== COLUMNA DERECHA ========== */}
                                <div className="space-y-4">
                                    {/* Responsables */}
                                    <div>
                                        <Label className="text-sm font-medium">Responsable <span className="text-red-500">*</span></Label>
                                        <div className="mt-1 space-y-2">
                                            {formData.responsibles.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {formData.responsibles.map(name => (
                                                        <Badge key={name} variant="secondary" className="flex items-center gap-1 pr-1 text-xs">
                                                            {name}
                                                            <button type="button" onClick={() => removeResponsible(name)} className="ml-1 hover:bg-gray-300 rounded-full p-0.5">
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="relative">
                                                <Input
                                                    placeholder="Buscar responsable..."
                                                    value={responsibleSearch}
                                                    onChange={e => { setResponsibleSearch(e.target.value); setShowResponsibleDropdown(true); }}
                                                    onFocus={() => setShowResponsibleDropdown(true)}
                                                    className={cn("h-8 text-sm", errors.responsibles && "border-red-500")}
                                                    disabled={formData.responsibles.length >= 5}
                                                />
                                                {showResponsibleDropdown && responsibleSearch && filteredResponsibles.length > 0 && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-32 overflow-y-auto">
                                                        {filteredResponsibles.map(name => (
                                                            <button key={name} type="button" onClick={() => addResponsible(name)} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100">
                                                                {name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {errors.responsibles && <p className="text-red-500 text-xs">{errors.responsibles}</p>}
                                            <p className="text-xs text-gray-400">Máximo 5 responsables ({formData.responsibles.length}/5)</p>
                                        </div>
                                    </div>

                                    {/* Estado y Prioridad en una fila */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-sm font-medium">Estado <span className="text-red-500">*</span></Label>
                                            {/* Al crear, el estado es fijo "Por hacer". Al editar solo puede cambiar a "En progreso", NO a "Finalizado" manualmente */}
                                            <Select
                                                value={formData.state}
                                                onValueChange={v => {
                                                    if (v === 'Finalizado') {
                                                        // Verificar si todas las subtareas están finalizadas
                                                        const allSubtasksFinalized = subtasks.length > 0 && subtasks.every(s => s.state === 'Finalizado');
                                                        if (!allSubtasksFinalized) {
                                                            setIsFinalizadoWarningOpen(true);
                                                            return;
                                                        }
                                                    }
                                                    setFormData(prev => ({ ...prev, state: v as TaskStatus }));
                                                }}
                                                disabled={!isEditing || formData.state === 'Finalizado'}
                                            >
                                                <SelectTrigger className={cn("mt-1 h-8 text-sm", errors.state && "border-red-500", (!isEditing || formData.state === 'Finalizado') && "bg-gray-100")}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Por hacer">Por hacer</SelectItem>
                                                    <SelectItem value="En progreso">En progreso</SelectItem>
                                                    <SelectItem value="Finalizado" disabled={subtasks.length === 0 || !subtasks.every(s => s.state === 'Finalizado')}>
                                                        Finalizado
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                                            {!isEditing && <p className="text-xs text-gray-400 mt-1">Estado inicial por defecto</p>}
                                            {isEditing && formData.state !== 'Finalizado' && <p className="text-xs text-gray-400 mt-1">Estado &quot;Finalizado&quot; se activa cuando todas las subtareas están finalizadas</p>}
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium">Prioridad <span className="text-red-500">*</span></Label>
                                            <Select value={formData.priority} onValueChange={v => setFormData(prev => ({ ...prev, priority: v as Priority }))}>
                                                <SelectTrigger className="mt-1 h-8 text-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Alta">Alta</SelectItem>
                                                    <SelectItem value="Media">Media</SelectItem>
                                                    <SelectItem value="Baja">Baja</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Fechas en una fila */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-sm font-medium">Fecha Inicio <span className="text-red-500">*</span></Label>
                                            <Input
                                                type="date"
                                                value={formData.startDate ? formData.startDate.split('/').reverse().join('-') : ''}
                                                onChange={e => {
                                                    const [y, m, d] = e.target.value.split('-');
                                                    setFormData(prev => ({ ...prev, startDate: `${d}/${m}/${y}` }));
                                                }}
                                                className={cn("mt-1 h-8 text-sm", errors.startDate && "border-red-500")}
                                            />
                                            {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium">Fecha Fin <span className="text-red-500">*</span></Label>
                                            <Input
                                                type="date"
                                                value={formData.endDate ? formData.endDate.split('/').reverse().join('-') : ''}
                                                onChange={e => {
                                                    const [y, m, d] = e.target.value.split('-');
                                                    setFormData(prev => ({ ...prev, endDate: `${d}/${m}/${y}` }));
                                                }}
                                                className={cn("mt-1 h-8 text-sm", errors.endDate && "border-red-500")}
                                            />
                                            {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
                                        </div>
                                    </div>

                                    {/* Informador */}
                                    <div>
                                        <Label className="text-sm font-medium">Informador</Label>
                                        <Input value={formData.informer} disabled className="mt-1 h-8 text-sm bg-gray-50" />
                                    </div>

                                    {/* Adjuntar archivos */}
                                    <div>
                                        <Label className="text-sm font-medium">
                                            Adjuntar {formData.state === 'Finalizado' && <span className="text-red-500">*</span>}
                                        </Label>
                                        <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-3">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                multiple
                                                accept=".jpg,.jpeg,.png,.pdf"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                                id="task-file-upload"
                                            />
                                            <label
                                                htmlFor="task-file-upload"
                                                className="flex flex-col items-center cursor-pointer"
                                            >
                                                <Upload className="h-6 w-6 text-gray-400 mb-1" />
                                                <span className="text-xs text-gray-600">Click para subir archivos</span>
                                                <span className="text-xs text-gray-400">JPG, PNG, PDF (máx. 50MB, hasta 5)</span>
                                            </label>
                                        </div>
                                        {errors.attachments && <p className="text-red-500 text-xs mt-1">{errors.attachments}</p>}

                                        {formData.attachments.length > 0 && (
                                            <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                                                {formData.attachments.map((file, idx) => (
                                                    <div key={file.id} className="flex items-center justify-between p-1.5 bg-gray-50 rounded text-sm">
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            {file.type === 'application/pdf' ? (
                                                                <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
                                                            ) : (
                                                                <ImageIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                                            )}
                                                            <span className="text-xs text-blue-600 hover:underline cursor-pointer truncate">{file.name}</span>
                                                            <span className="text-xs text-gray-400 flex-shrink-0">({formatFileSize(file.size)})</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => openPreview(file, idx)}>
                                                                <Eye className="h-3 w-3" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-5 w-5 text-red-500" onClick={() => removeAttachment(file.id)}>
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-4 border-t flex justify-between">
                        <div>
                            {isEditing && (
                                <Button
                                    variant="destructive"
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className="bg-[#EC221F]"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={onClose}>Cancelar</Button>
                            <Button onClick={handleSave} className="bg-[#018CD1] hover:bg-[#018CD1]/90">
                                {isEditing ? 'Guardar cambios' : 'Crear tarea'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Subtarea */}
            <SubtaskModal
                isOpen={isSubtaskModalOpen}
                onClose={() => { setIsSubtaskModalOpen(false); setEditingSubtask(null); }}
                subtask={editingSubtask}
                parentTask={{
                    id: task?.id || 'Nueva Tarea',
                    responsibles: formData.responsibles,
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                }}
                onSave={handleSaveSubtask}
                currentUser={currentUser}
                existingSubtasks={subtasks}
            />

            {/* Modal de confirmación de eliminación */}
            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => {
                    if (task) {
                        onDelete(task.id);
                        setIsDeleteModalOpen(false);
                        onClose();
                    }
                }}
                itemType="tarea"
                itemId={task?.id || ''}
            />

            {/* Modal de error */}
            <ErrorModal
                isOpen={isErrorModalOpen}
                onClose={() => setIsErrorModalOpen(false)}
                message={errorMessage}
            />

            {/* Modal de preview */}
            <FilePreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                file={previewFile}
                files={formData.attachments}
                currentIndex={previewIndex}
                onNavigate={navigatePreview}
            />

            {/* Modal de advertencia para estado Finalizado */}
            <Dialog open={isFinalizadoWarningOpen} onOpenChange={setIsFinalizadoWarningOpen}>
                <DialogContent className="sm:max-w-md p-6 text-center" showCloseButton={false}>
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-yellow-600" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-gray-800">No se puede finalizar</DialogTitle>
                        </DialogHeader>
                        <div className="text-gray-600 space-y-2">
                            <p>La tarea no puede cambiar a estado &quot;Finalizado&quot; hasta que:</p>
                            <ul className="text-left list-disc list-inside text-sm">
                                {subtasks.length === 0 && <li>Tenga al menos una subtarea creada</li>}
                                {subtasks.length > 0 && !subtasks.every(s => s.state === 'Finalizado') && (
                                    <li>Todas las subtareas estén en estado &quot;Finalizado&quot; (con evidencia adjunta)</li>
                                )}
                            </ul>
                        </div>
                        <DialogFooter className="mt-4 w-full">
                            <Button onClick={() => setIsFinalizadoWarningOpen(false)} className="w-full bg-[#018CD1] hover:bg-[#018CD1]/90">
                                Entendido
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

// ==================== MODAL DE SUBTAREA ====================
function SubtaskModal({
    isOpen,
    onClose,
    subtask,
    parentTask,
    onSave,
    currentUser,
    existingSubtasks,
}: {
    isOpen: boolean;
    onClose: () => void;
    subtask: Subtask | null;
    parentTask: { id: string; responsibles: string[]; startDate: string; endDate: string };
    onSave: (subtask: Subtask, isEdit: boolean) => void;
    currentUser: string;
    existingSubtasks: Subtask[];
}) {
    const isEditing = subtask !== null;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<Omit<Subtask, 'id' | 'comments' | 'history'>>({
        title: '',
        description: '',
        state: 'Por hacer',
        responsible: '',
        priority: 'Media',
        startDate: '',
        endDate: '',
        informer: currentUser,
        parentTaskId: parentTask.id,
        attachments: [],
    });

    const [comments, setComments] = useState<TaskComment[]>([]);
    const [history, setHistory] = useState<TaskHistoryItem[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [activeActivityTab, setActiveActivityTab] = useState<'comentarios' | 'historial'>('comentarios');
    const [newComment, setNewComment] = useState('');
    const [showEvidenceRequiredModal, setShowEvidenceRequiredModal] = useState(false);

    // Estados para responder, editar y eliminar comentarios
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingCommentContent, setEditingCommentContent] = useState('');

    React.useEffect(() => {
        if (subtask) {
            setFormData({
                title: subtask.title,
                description: subtask.description || '',
                state: subtask.state,
                responsible: subtask.responsible,
                priority: subtask.priority,
                startDate: subtask.startDate,
                endDate: subtask.endDate,
                informer: subtask.informer,
                parentTaskId: subtask.parentTaskId,
                attachments: subtask.attachments,
            });
            setComments(subtask.comments);
            setHistory(subtask.history);
        } else {
            setFormData({
                title: '',
                description: '',
                state: 'Por hacer',
                responsible: '',
                priority: 'Media',
                startDate: '',
                endDate: '',
                informer: currentUser,
                parentTaskId: parentTask.id,
                attachments: [],
            });
            setComments([]);
            setHistory([]);
        }
        setErrors({});
        setNewComment('');
    }, [subtask, isOpen, currentUser, parentTask.id]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newAttachments: TaskAttachment[] = [];
        for (let i = 0; i < files.length && formData.attachments.length + newAttachments.length < 5; i++) {
            const file = files[i];
            const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
            if (validTypes.includes(file.type) && file.size <= 50 * 1024 * 1024) {
                newAttachments.push({
                    id: `att-${Date.now()}-${i}`,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                });
            }
        }
        // Al adjuntar archivo, cambiar automáticamente a estado "Finalizado"
        if (newAttachments.length > 0) {
            setFormData(prev => ({
                ...prev,
                attachments: [...prev.attachments, ...newAttachments],
                state: 'Finalizado' // Cambio automático al adjuntar
            }));
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachment = (id: string) => {
        // Al eliminar adjunto, si queda sin adjuntos y está en Finalizado, volver a En progreso
        setFormData(prev => {
            const newAttachments = prev.attachments.filter(a => a.id !== id);
            return {
                ...prev,
                attachments: newAttachments,
                state: newAttachments.length === 0 && prev.state === 'Finalizado' ? 'En progreso' : prev.state
            };
        });
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        const newCommentItem: TaskComment = {
            id: `comment-${Date.now()}`,
            user: currentUser,
            content: newComment.trim(),
            timestamp: new Date(),
        };
        setComments(prev => [...prev, newCommentItem]);
        setNewComment('');
    };

    // Función para responder a un comentario
    const handleReplyComment = (parentId: string) => {
        if (!replyContent.trim()) return;
        const replyItem: TaskComment = {
            id: `reply-${Date.now()}`,
            user: currentUser,
            content: replyContent.trim(),
            timestamp: new Date(),
            parentId,
        };
        setComments(prev => [...prev, replyItem]);
        setReplyContent('');
        setReplyingTo(null);
    };

    // Función para editar comentario
    const handleEditComment = (commentId: string) => {
        if (!editingCommentContent.trim()) return;
        setComments(prev => prev.map(c =>
            c.id === commentId ? { ...c, content: editingCommentContent.trim() } : c
        ));
        setEditingCommentId(null);
        setEditingCommentContent('');
    };

    // Función para eliminar comentario (y sus respuestas)
    const handleDeleteComment = (commentId: string) => {
        setComments(prev => prev.filter(c => c.id !== commentId && c.parentId !== commentId));
    };

    // Handler para cambio de estado - valida que no se pueda finalizar sin adjunto
    const handleStateChange = (newState: string) => {
        if (newState === 'Finalizado' && formData.attachments.length === 0) {
            setShowEvidenceRequiredModal(true);
            return;
        }
        setFormData(prev => ({ ...prev, state: newState as TaskStatus }));
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) newErrors.title = 'El nombre es obligatorio';
        if (!formData.responsible) newErrors.responsible = 'Debe seleccionar un responsable';
        if (!formData.startDate) newErrors.startDate = 'La fecha de inicio es obligatoria';
        if (!formData.endDate) newErrors.endDate = 'La fecha de fin es obligatoria';

        // Validar que fecha fin no sea menor a fecha inicio
        if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
            newErrors.endDate = 'La fecha de fin no puede ser menor a la fecha de inicio';
        }

        // Validar estado Finalizado requiere adjuntos
        if (formData.state === 'Finalizado' && formData.attachments.length === 0) {
            newErrors.attachments = 'Para finalizar la subtarea debe adjuntar evidencia';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validate()) {
            // Si el error es por falta de adjuntos, mostrar modal de evidencia requerida
            if (formData.state === 'Finalizado' && formData.attachments.length === 0) {
                setShowEvidenceRequiredModal(true);
            }
            return;
        }

        // Generar ID secuencial para subtareas
        const generateSubtaskId = (): string => {
            const existingIds = existingSubtasks.map(s => {
                const match = s.id.match(/^SUB-(\d+)$/);
                return match ? parseInt(match[1], 10) : 0;
            });
            const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
            return `SUB-${maxId + 1}`;
        };

        const subtaskData: Subtask = {
            id: subtask?.id || generateSubtaskId(),
            ...formData,
            comments,
            history: isEditing ? [
                ...history,
                { id: `hist-${Date.now()}`, user: currentUser, action: 'actualizó la subtarea', timestamp: new Date() }
            ] : [
                { id: `hist-${Date.now()}`, user: currentUser, action: 'creó la subtarea', timestamp: new Date() }
            ],
        };

        onSave(subtaskData, isEditing);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] p-0 overflow-hidden" showCloseButton={false}>
                    <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between">
                        <DialogTitle>{isEditing ? 'Editar Subtarea' : 'Crear Subtarea'}</DialogTitle>
                        <DialogClose asChild>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white">
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogClose>
                    </DialogHeader>

                    <ScrollArea className="max-h-[calc(90vh-140px)]">
                        <div className="p-6">
                            {/* Layout de 2 columnas principales */}
                            <div className="grid grid-cols-2 gap-6">
                                {/* ========== COLUMNA IZQUIERDA ========== */}
                                <div className="space-y-4">
                                    {/* Principal (ID de tarea padre) */}
                                    <div>
                                        <Label className="text-sm font-medium">Principal</Label>
                                        <Input value={parentTask.id} disabled className="mt-1 h-8 text-sm bg-gray-50" />
                                    </div>

                                    {/* Nombre */}
                                    <div>
                                        <Label className="text-sm font-medium">Nombre de la subtarea <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.title}
                                            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                            placeholder="Ingrese el nombre de la subtarea"
                                            className={cn("mt-1 h-8 text-sm", errors.title && "border-red-500")}
                                        />
                                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                                    </div>

                                    {/* Descripción */}
                                    <div>
                                        <Label className="text-sm font-medium">Descripción</Label>
                                        <Textarea
                                            value={formData.description}
                                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Ingrese una descripción (opcional)"
                                            className="mt-1 min-h-[60px] text-sm"
                                        />
                                    </div>

                                    {/* Sección Actividad - Con tabs */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-4 border-b pb-2">
                                            <button
                                                type="button"
                                                onClick={() => setActiveActivityTab('comentarios')}
                                                className={cn(
                                                    "text-sm font-semibold pb-1 border-b-2 -mb-[9px]",
                                                    activeActivityTab === 'comentarios'
                                                        ? "text-[#018CD1] border-[#018CD1]"
                                                        : "text-gray-500 border-transparent hover:text-gray-700"
                                                )}
                                            >
                                                Comentarios
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActiveActivityTab('historial')}
                                                className={cn(
                                                    "text-sm font-semibold pb-1 border-b-2 -mb-[9px]",
                                                    activeActivityTab === 'historial'
                                                        ? "text-[#018CD1] border-[#018CD1]"
                                                        : "text-gray-500 border-transparent hover:text-gray-700"
                                                )}
                                            >
                                                Historial
                                            </button>
                                        </div>

                                        {/* Tab Comentarios */}
                                        {activeActivityTab === 'comentarios' && (
                                            <div className="space-y-3">
                                                {comments.length > 0 && (
                                                    <div className="space-y-3 max-h-40 overflow-y-auto border rounded-md p-3 bg-gray-50">
                                                        {comments.filter(c => !c.parentId).map(comment => (
                                                            <div key={comment.id} className="space-y-2">
                                                                {/* Comentario principal */}
                                                                <div className="flex items-start gap-3">
                                                                    <div className="w-7 h-7 rounded-full bg-[#018CD1] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                                                                        {getInitials(comment.user)}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-medium text-sm">{comment.user}</span>
                                                                            <span className="text-xs text-gray-500">{formatDate(comment.timestamp)}</span>
                                                                        </div>
                                                                        {editingCommentId === comment.id ? (
                                                                            <div className="mt-1 space-y-2">
                                                                                <Textarea
                                                                                    value={editingCommentContent}
                                                                                    onChange={(e) => setEditingCommentContent(e.target.value)}
                                                                                    className="min-h-[50px] text-sm"
                                                                                />
                                                                                <div className="flex gap-2">
                                                                                    <Button size="sm" onClick={() => handleEditComment(comment.id)} className="bg-[#018CD1] hover:bg-[#018CD1]/90 h-6 text-xs">
                                                                                        Guardar
                                                                                    </Button>
                                                                                    <Button size="sm" variant="outline" onClick={() => { setEditingCommentId(null); setEditingCommentContent(''); }} className="h-6 text-xs">
                                                                                        Cancelar
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <>
                                                                                <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                                                                                {comment.user === currentUser && (
                                                                                    <div className="flex items-center gap-3 mt-1">
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => setReplyingTo(comment.id)}
                                                                                            className="text-xs text-[#018CD1] hover:underline flex items-center gap-1"
                                                                                        >
                                                                                            <Reply className="h-3 w-3" /> Responder
                                                                                        </button>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => { setEditingCommentId(comment.id); setEditingCommentContent(comment.content); }}
                                                                                            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                                                                        >
                                                                                            <Pencil className="h-3 w-3" /> Editar
                                                                                        </button>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => handleDeleteComment(comment.id)}
                                                                                            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                                                                                        >
                                                                                            <Trash2 className="h-3 w-3" /> Eliminar
                                                                                        </button>
                                                                                    </div>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Respuestas */}
                                                                {comments.filter(c => c.parentId === comment.id).map(reply => (
                                                                    <div key={reply.id} className="flex items-start gap-2 ml-8 pl-2 border-l-2 border-gray-200">
                                                                        <div className="w-5 h-5 rounded-full bg-[#018CD1]/70 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                                                                            {getInitials(reply.user)}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-medium text-xs">{reply.user}</span>
                                                                                <span className="text-xs text-gray-500">{formatDate(reply.timestamp)}</span>
                                                                            </div>
                                                                            <p className="text-xs text-gray-700 mt-0.5">{reply.content}</p>
                                                                            {reply.user === currentUser && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleDeleteComment(reply.id)}
                                                                                    className="text-xs text-red-500 hover:text-red-700 mt-1"
                                                                                >
                                                                                    Eliminar
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}

                                                                {/* Form de respuesta */}
                                                                {replyingTo === comment.id && (
                                                                    <div className="ml-8 pl-2 border-l-2 border-[#018CD1] space-y-2">
                                                                        <Textarea
                                                                            placeholder="Escribe tu respuesta..."
                                                                            value={replyContent}
                                                                            onChange={(e) => setReplyContent(e.target.value)}
                                                                            className="min-h-[40px] text-sm"
                                                                        />
                                                                        <div className="flex gap-2">
                                                                            <Button
                                                                                size="sm"
                                                                                onClick={() => handleReplyComment(comment.id)}
                                                                                disabled={!replyContent.trim()}
                                                                                className="bg-[#018CD1] hover:bg-[#018CD1]/90 h-6 text-xs"
                                                                            >
                                                                                Responder
                                                                            </Button>
                                                                            <Button size="sm" variant="outline" onClick={() => { setReplyingTo(null); setReplyContent(''); }} className="h-6 text-xs">
                                                                                Cancelar
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="flex gap-2">
                                                    <Input
                                                        value={newComment}
                                                        onChange={e => setNewComment(e.target.value)}
                                                        placeholder="Añadir un comentario..."
                                                        className="h-8 text-sm"
                                                        onKeyPress={e => e.key === 'Enter' && handleAddComment()}
                                                    />
                                                    <Button onClick={handleAddComment} size="icon" className="bg-[#018CD1] h-8 w-8">
                                                        <Send className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Tab Historial */}
                                        {activeActivityTab === 'historial' && (
                                            <div className="space-y-2 max-h-28 overflow-y-auto border rounded-md p-2 bg-gray-50">
                                                {history.length > 0 ? (
                                                    history.map(item => (
                                                        <div key={item.id} className="flex items-start gap-2 text-sm">
                                                            <Clock className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs"><span className="font-medium">{item.user}</span> {item.action}</p>
                                                                <p className="text-xs text-gray-500">{formatDate(item.timestamp)}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-gray-500 italic text-center py-2">No hay historial de modificaciones.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ========== COLUMNA DERECHA ========== */}
                                <div className="space-y-4">
                                    {/* Responsable */}
                                    <div>
                                        <Label className="text-sm font-medium">Responsable <span className="text-red-500">*</span></Label>
                                        <Select value={formData.responsible} onValueChange={v => setFormData(prev => ({ ...prev, responsible: v }))}>
                                            <SelectTrigger className={cn("mt-1 h-8 text-sm", errors.responsible && "border-red-500")}>
                                                <SelectValue placeholder="Seleccionar responsable" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {parentTask.responsibles.map(name => (
                                                    <SelectItem key={name} value={name}>{name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.responsible && <p className="text-red-500 text-xs mt-1">{errors.responsible}</p>}
                                        <p className="text-xs text-gray-400 mt-1">Solo responsables de la tarea principal</p>
                                    </div>

                                    {/* Estado y Prioridad en una fila */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-sm font-medium">Estado <span className="text-red-500">*</span></Label>
                                            {/* Al crear, el estado es fijo "Por hacer". Solo se puede cambiar al editar */}
                                            <Select
                                                value={formData.state}
                                                onValueChange={handleStateChange}
                                                disabled={!isEditing}
                                            >
                                                <SelectTrigger className={cn("mt-1 h-8 text-sm", !isEditing && "bg-gray-100")}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Por hacer">Por hacer</SelectItem>
                                                    <SelectItem value="En progreso">En progreso</SelectItem>
                                                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {!isEditing && <p className="text-xs text-gray-400 mt-1">Estado inicial por defecto</p>}
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium">Prioridad <span className="text-red-500">*</span></Label>
                                            <Select value={formData.priority} onValueChange={v => setFormData(prev => ({ ...prev, priority: v as Priority }))}>
                                                <SelectTrigger className="mt-1 h-8 text-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Alta">Alta</SelectItem>
                                                    <SelectItem value="Media">Media</SelectItem>
                                                    <SelectItem value="Baja">Baja</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Fechas en una fila */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-sm font-medium">Fecha Inicio <span className="text-red-500">*</span></Label>
                                            <Input
                                                type="date"
                                                value={formData.startDate ? formData.startDate.split('/').reverse().join('-') : ''}
                                                onChange={e => {
                                                    const [y, m, d] = e.target.value.split('-');
                                                    setFormData(prev => ({ ...prev, startDate: `${d}/${m}/${y}` }));
                                                }}
                                                className={cn("mt-1 h-8 text-sm", errors.startDate && "border-red-500")}
                                            />
                                            {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium">Fecha Fin <span className="text-red-500">*</span></Label>
                                            <Input
                                                type="date"
                                                value={formData.endDate ? formData.endDate.split('/').reverse().join('-') : ''}
                                                onChange={e => {
                                                    const [y, m, d] = e.target.value.split('-');
                                                    setFormData(prev => ({ ...prev, endDate: `${d}/${m}/${y}` }));
                                                }}
                                                className={cn("mt-1 h-8 text-sm", errors.endDate && "border-red-500")}
                                            />
                                            {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
                                        </div>
                                    </div>

                                    {/* Informador */}
                                    <div>
                                        <Label className="text-sm font-medium">Informador</Label>
                                        <Input value={formData.informer} disabled className="mt-1 h-8 text-sm bg-gray-50" />
                                    </div>

                                    {/* Adjuntar archivos */}
                                    <div>
                                        <Label className="text-sm font-medium">
                                            Adjuntar {formData.state === 'Finalizado' && <span className="text-red-500">*</span>}
                                        </Label>
                                        <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-3">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                multiple
                                                accept=".jpg,.jpeg,.png,.pdf"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                                id="subtask-file-upload"
                                            />
                                            <label
                                                htmlFor="subtask-file-upload"
                                                className="flex flex-col items-center cursor-pointer"
                                            >
                                                <Upload className="h-6 w-6 text-gray-400 mb-1" />
                                                <span className="text-xs text-gray-600">Click para subir archivos</span>
                                                <span className="text-xs text-gray-400">JPG, PNG, PDF (máx. 50MB)</span>
                                            </label>
                                        </div>
                                        {errors.attachments && <p className="text-red-500 text-xs mt-1">{errors.attachments}</p>}

                                        {formData.attachments.length > 0 && (
                                            <div className="mt-2 space-y-1 max-h-20 overflow-y-auto">
                                                {formData.attachments.map(file => (
                                                    <div key={file.id} className="flex items-center justify-between p-1.5 bg-gray-50 rounded text-sm">
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            {file.type === 'application/pdf' ? (
                                                                <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
                                                            ) : (
                                                                <ImageIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                                            )}
                                                            <span className="text-xs text-blue-600 hover:underline cursor-pointer truncate">{file.name}</span>
                                                            <span className="text-xs text-gray-400 flex-shrink-0">({formatFileSize(file.size)})</span>
                                                        </div>
                                                        <Button variant="ghost" size="icon" className="h-5 w-5 text-red-500 flex-shrink-0" onClick={() => removeAttachment(file.id)}>
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-4 border-t">
                        <Button variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button onClick={handleSave} className="bg-[#018CD1] hover:bg-[#018CD1]/90">
                            {isEditing ? 'Guardar cambios' : 'Crear subtarea'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Evidencia Requerida */}
            <EvidenceRequiredModal
                isOpen={showEvidenceRequiredModal}
                onClose={() => setShowEvidenceRequiredModal(false)}
            />
        </>
    );
}

// ==================== COMPONENTE PRINCIPAL ====================
interface ListaContentProps {
    embedded?: boolean; // When true, renders without AppLayout and tabs (used in detalles page)
}

export function ListaContent({ embedded = false }: ListaContentProps) {
    const { user } = useAuth();
    const [project, setProject] = useState<Project | null>(null);
    const [activeTab, setActiveTab] = useState('Lista');
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
    const router = useRouter();

    // Modales
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<{ id: string; type: 'tarea' | 'subtarea' } | null>(null);

    // Subtarea desde menú de acciones
    const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
    const [parentTaskForSubtask, setParentTaskForSubtask] = useState<Task | null>(null);
    const [editingSubtaskFromTable, setEditingSubtaskFromTable] = useState<Subtask | null>(null);

    // Modal de previsualización de documento PDF
    const [isDocumentPreviewOpen, setIsDocumentPreviewOpen] = useState(false);
    const [taskForDocumentPreview, setTaskForDocumentPreview] = useState<Task | null>(null);

    const userRole = user?.role;
    const isScrumMaster = userRole === ROLES.SCRUM_MASTER;
    const isImplementador = userRole === ROLES.IMPLEMENTADOR;
    // IMPLEMENTADOR solo puede gestionar subtareas (crear, editar, eliminar)
    const canManageSubtasks = isScrumMaster || isImplementador;
    // Solo Scrum Master puede gestionar tareas (crear, editar, eliminar)
    const canManageTasks = isScrumMaster;
    const currentUser = user?.name || 'Scrum Master';

    React.useEffect(() => {
        const savedProjectData = localStorage.getItem('selectedProject');
        if (savedProjectData) {
            const projectData = JSON.parse(savedProjectData);
            setProject(projectData);
            if (projectData.type !== 'Actividad') {
                router.push(paths.poi.base);
            }
        } else {
            router.push(paths.poi.base);
        }
    }, [router]);

    const handleTabClick = (tabName: string) => {
        // Navigate directly to detalles with only tab parameter (actividadId is in localStorage)
        if (tabName !== 'Lista') {
            router.push(`${paths.poi.actividad.detalles}?tab=${tabName}`);
        } else {
            setActiveTab(tabName);
        }
    };

    const toggleTaskExpand = (taskId: string) => {
        setExpandedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
            }
            return newSet;
        });
    };

    const handleSaveTask = (task: Task, isEdit: boolean) => {
        if (isEdit) {
            setTasks(prev => prev.map(t => t.id === task.id ? task : t));
        } else {
            // Generar ID secuencial
            const existingIds = tasks.map(t => {
                const match = t.id.match(/^TAR-(\d+)$/);
                return match ? parseInt(match[1], 10) : 0;
            });
            const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
            const newTask = { ...task, id: `TAR-${maxId + 1}` };
            setTasks(prev => [...prev, newTask]);
        }
    };

    const handleDeleteTask = (taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
    };

    const handleSaveSubtaskFromMenu = (subtask: Subtask) => {
        if (parentTaskForSubtask) {
            setTasks(prev => prev.map(t => {
                if (t.id === parentTaskForSubtask.id) {
                    let updatedSubtasks: Subtask[];

                    // Si estamos editando, reemplazar la subtarea
                    if (editingSubtaskFromTable) {
                        updatedSubtasks = t.subtasks.map(s => s.id === subtask.id ? subtask : s);
                    } else {
                        // Si es nueva, agregar
                        updatedSubtasks = [...t.subtasks, subtask];
                    }

                    // Verificar si todas las subtareas están finalizadas
                    const allSubtasksFinalized = updatedSubtasks.length > 0 &&
                        updatedSubtasks.every(s => s.state === 'Finalizado');

                    // Recopilar todos los adjuntos de las subtareas finalizadas
                    const allAttachments: TaskAttachment[] = [];
                    if (allSubtasksFinalized) {
                        updatedSubtasks.forEach(s => {
                            if (s.attachments && s.attachments.length > 0) {
                                allAttachments.push(...s.attachments);
                            }
                        });
                    }

                    return {
                        ...t,
                        subtasks: updatedSubtasks,
                        // Actualizar estado de la tarea a "Finalizado" si todas las subtareas están finalizadas
                        state: allSubtasksFinalized ? 'Finalizado' : t.state,
                        // Agregar los adjuntos de las subtareas al campo attachments de la tarea
                        attachments: allSubtasksFinalized ? allAttachments : t.attachments
                    };
                }
                return t;
            }));
        }
        setIsSubtaskModalOpen(false);
        setParentTaskForSubtask(null);
        setEditingSubtaskFromTable(null);
    };

    const handleDeleteSubtaskFromTable = (taskId: string, subtaskId: string) => {
        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                return { ...t, subtasks: t.subtasks.filter(s => s.id !== subtaskId) };
            }
            return t;
        }));
    };

    // Filtrar tareas por búsqueda
    const filteredTasks = tasks.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!project) {
        return (
            <div className="flex h-screen w-full items-center justify-center">Cargando...</div>
        );
    }

    const projectCode = `ACT Nº${project.id}`;

    const breadcrumbs = [
        { label: 'POI', href: paths.poi.base },
        { label: 'Lista' },
    ];

    const secondaryHeader = (
        <div className="bg-[#D5D5D5] border-b border-t border-[#1A5581]">
            <div className="p-2 flex items-center justify-between w-full">
                <h2 className="font-bold text-black pl-2">
                    {projectCode}: {project.name}
                </h2>
            </div>
        </div>
    );

    // IMPLEMENTADOR no tiene acceso a Detalles
    const allActivityTabs = [{ name: 'Detalles' }, { name: 'Lista' }, { name: 'Tablero' }, { name: 'Dashboard' }, { name: 'Informes' }];
    const activityTabs = isImplementador
        ? allActivityTabs.filter(tab => tab.name !== 'Detalles')
        : allActivityTabs;

    // Content portion (used both standalone and embedded)
    const listaContent = (
        <>
            <div className="flex-1 flex flex-col bg-[#F9F9F9] px-4 pb-4">
                {/* Header con título y búsqueda */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Folder className="w-5 h-5 text-gray-700" />
                        <h3 className="text-lg font-bold">{projectCode}: {project.name}</h3>
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar tareas..."
                            className="pl-10 bg-white"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Tabla de tareas */}
                <div className="flex-1 overflow-y-auto max-h-[calc(100vh-320px)]">
                    <div className="bg-white rounded-lg border">
                        <Table>
                            <TableHeader className="bg-gray-50 sticky top-0">
                                <TableRow>
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead className="w-[80px]">ID</TableHead>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Responsable</TableHead>
                                    <TableHead>Prioridad</TableHead>
                                    <TableHead>Fecha Inicio</TableHead>
                                    <TableHead>Fecha Fin</TableHead>
                                    <TableHead className="text-center w-[100px]">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTasks.length > 0 ? (
                                    filteredTasks.map(task => (
                                        <React.Fragment key={task.id}>
                                            {/* Fila de Tarea */}
                                            <TableRow className="bg-white hover:bg-gray-50">
                                                <TableCell className="w-12">
                                                    {task.subtasks.length > 0 ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => toggleTaskExpand(task.id)}
                                                        >
                                                            {expandedTasks.has(task.id) ? (
                                                                <ChevronDown className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    ) : (
                                                        <div className="w-8" />
                                                    )}
                                                </TableCell>
                                                <TableCell className={cn("font-medium", task.state === 'Finalizado' && "line-through text-gray-500")}>
                                                    {task.id}
                                                </TableCell>
                                                <TableCell className={cn(task.state === 'Finalizado' && "line-through text-gray-500")}>
                                                    {task.title}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={cn(statusColors[task.state], 'font-semibold')}>{task.state}</Badge>
                                                </TableCell>
                                                <TableCell>{task.responsibles.join(', ')}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        style={{ backgroundColor: priorityColors[task.priority].bg }}
                                                        className={cn(priorityColors[task.priority].text, 'w-16 justify-center font-semibold')}
                                                    >
                                                        {task.priority}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{task.startDate}</TableCell>
                                                <TableCell>{task.endDate}</TableCell>
                                                <TableCell className="text-center">
                                                    {(canManageTasks || canManageSubtasks) && (
                                                        <DropdownMenu modal={false}>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <MoreHorizontal className="h-5 w-5 text-gray-400" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                {/* Si la tarea está Finalizada: Ver documento, Editar, Eliminar (sin Crear Subtarea) */}
                                                                {task.state === 'Finalizado' ? (
                                                                    <>
                                                                        {/* Ver documento - disponible para Scrum Master e Implementador */}
                                                                        {canManageSubtasks && (
                                                                            <DropdownMenuItem onClick={() => setTimeout(() => {
                                                                                setTaskForDocumentPreview(task);
                                                                                setIsDocumentPreviewOpen(true);
                                                                            }, 0)}>
                                                                                <Eye className="h-4 w-4 mr-2" />
                                                                                Ver documento
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                        {/* Editar - solo Scrum Master */}
                                                                        {canManageTasks && (
                                                                            <DropdownMenuItem onClick={() => setTimeout(() => {
                                                                                setEditingTask(task);
                                                                                setIsTaskModalOpen(true);
                                                                            }, 0)}>
                                                                                <Pencil className="h-4 w-4 mr-2" />
                                                                                Editar
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                        {/* Eliminar - solo Scrum Master */}
                                                                        {canManageTasks && (
                                                                            <DropdownMenuItem
                                                                                className="text-red-500"
                                                                                onClick={() => setTimeout(() => {
                                                                                    setTaskToDelete({ id: task.id, type: 'tarea' });
                                                                                    setIsDeleteModalOpen(true);
                                                                                }, 0)}
                                                                            >
                                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                                Eliminar
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        {/* Crear Subtarea - disponible para Scrum Master e Implementador (solo si NO está finalizado) */}
                                                                        {canManageSubtasks && (
                                                                            <DropdownMenuItem onClick={() => setTimeout(() => {
                                                                                setParentTaskForSubtask(task);
                                                                                setIsSubtaskModalOpen(true);
                                                                            }, 0)}>
                                                                                <Plus className="h-4 w-4 mr-2" />
                                                                                Crear Subtarea
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                        {/* Editar y Eliminar tarea - solo Scrum Master */}
                                                                        {canManageTasks && (
                                                                            <>
                                                                                <DropdownMenuItem onClick={() => setTimeout(() => {
                                                                                    setEditingTask(task);
                                                                                    setIsTaskModalOpen(true);
                                                                                }, 0)}>
                                                                                    <Pencil className="h-4 w-4 mr-2" />
                                                                                    Editar
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuItem
                                                                                    className="text-red-500"
                                                                                    onClick={() => setTimeout(() => {
                                                                                        setTaskToDelete({ id: task.id, type: 'tarea' });
                                                                                        setIsDeleteModalOpen(true);
                                                                                    }, 0)}
                                                                                >
                                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                                    Eliminar
                                                                                </DropdownMenuItem>
                                                                            </>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </TableCell>
                                            </TableRow>

                                            {/* Filas de Subtareas (expandidas) */}
                                            {expandedTasks.has(task.id) && task.subtasks.map(subtask => (
                                                <TableRow key={subtask.id} className="bg-gray-50 hover:bg-gray-100">
                                                    <TableCell className="w-12 pl-8"></TableCell>
                                                    <TableCell className={cn("font-medium pl-8", subtask.state === 'Finalizado' && "line-through text-gray-500")}>
                                                        {subtask.id}
                                                    </TableCell>
                                                    <TableCell className={cn(subtask.state === 'Finalizado' && "line-through text-gray-500")}>
                                                        {subtask.title}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={cn(statusColors[subtask.state], 'font-semibold')}>{subtask.state}</Badge>
                                                    </TableCell>
                                                    <TableCell>{subtask.responsible}</TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            style={{ backgroundColor: priorityColors[subtask.priority].bg }}
                                                            className={cn(priorityColors[subtask.priority].text, 'w-16 justify-center font-semibold')}
                                                        >
                                                            {subtask.priority}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{subtask.startDate}</TableCell>
                                                    <TableCell>{subtask.endDate}</TableCell>
                                                    <TableCell className="text-center">
                                                        {/* Menú de subtareas - disponible para Scrum Master e Implementador */}
                                                        {canManageSubtasks && (
                                                            <DropdownMenu modal={false}>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                        <MoreHorizontal className="h-5 w-5 text-gray-400" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => setTimeout(() => {
                                                                        // Editar subtarea - abrir modal de subtarea
                                                                        setParentTaskForSubtask(task);
                                                                        setEditingSubtaskFromTable(subtask);
                                                                        setIsSubtaskModalOpen(true);
                                                                    }, 0)}>
                                                                        <Pencil className="h-4 w-4 mr-2" />
                                                                        Editar
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="text-red-500"
                                                                        onClick={() => setTimeout(() => handleDeleteSubtaskFromTable(task.id, subtask.id), 0)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                                        Eliminar
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-48 text-center text-gray-500">
                                            La lista se encuentra vacía
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>

                            {/* Botón Agregar tarea - solo Scrum Master */}
                            {canManageTasks && (
                                <tfoot className="border-t">
                                    <TableRow>
                                        <TableCell colSpan={9}>
                                            <Button
                                                variant="ghost"
                                                className="text-gray-500 hover:text-gray-800"
                                                onClick={() => {
                                                    setEditingTask(null);
                                                    setIsTaskModalOpen(true);
                                                }}
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Agregar tarea
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                </tfoot>
                            )}
                        </Table>
                    </div>
                </div>
            </div>

            {/* Modal de Tarea */}
            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); }}
                task={editingTask}
                onSave={handleSaveTask}
                onDelete={handleDeleteTask}
                currentUser={currentUser}
            />

            {/* Modal de Subtarea desde menú de acciones */}
            {parentTaskForSubtask && (
                <SubtaskModal
                    isOpen={isSubtaskModalOpen}
                    onClose={() => {
                        setIsSubtaskModalOpen(false);
                        setParentTaskForSubtask(null);
                        setEditingSubtaskFromTable(null);
                    }}
                    subtask={editingSubtaskFromTable}
                    parentTask={{
                        id: parentTaskForSubtask.id,
                        responsibles: parentTaskForSubtask.responsibles,
                        startDate: parentTaskForSubtask.startDate,
                        endDate: parentTaskForSubtask.endDate,
                    }}
                    onSave={(subtask) => handleSaveSubtaskFromMenu(subtask)}
                    currentUser={currentUser}
                    existingSubtasks={parentTaskForSubtask.subtasks}
                />
            )}

            {/* Modal de confirmación de eliminación */}
            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setTaskToDelete(null); }}
                onConfirm={() => {
                    if (taskToDelete) {
                        handleDeleteTask(taskToDelete.id);
                        setIsDeleteModalOpen(false);
                        setTaskToDelete(null);
                    }
                }}
                itemType={taskToDelete?.type || 'tarea'}
                itemId={taskToDelete?.id || ''}
            />

            {/* Modal de previsualización de documento PDF */}
            <TaskDocumentPreviewModal
                isOpen={isDocumentPreviewOpen}
                onClose={() => {
                    setIsDocumentPreviewOpen(false);
                    setTaskForDocumentPreview(null);
                }}
                task={taskForDocumentPreview}
            />
        </>
    );

    // When embedded (used in detalles page), return just the content
    if (embedded) {
        return listaContent;
    }

    // Standalone mode: wrap with AppLayout and tabs
    return (
        <AppLayout
            breadcrumbs={breadcrumbs}
            secondaryHeader={secondaryHeader}
        >
            {/* Tabs */}
            <div className="flex items-center gap-2 p-4 bg-[#F9F9F9]">
                {activityTabs.map(tab => (
                    <Button
                        key={tab.name}
                        size="sm"
                        onClick={() => handleTabClick(tab.name)}
                        className={cn(activeTab === tab.name ? 'bg-[#018CD1] text-white' : 'bg-white text-black border-gray-300')}
                        variant={activeTab === tab.name ? 'default' : 'outline'}
                    >
                        {tab.name}
                    </Button>
                ))}
            </div>
            {listaContent}
        </AppLayout>
    );
}

export default function ListaPage() {
    const router = useRouter();

    React.useEffect(() => {
        // Redirect to the unified details page with Lista tab
        router.replace(`${paths.poi.actividad.detalles}?tab=Lista`);
    }, [router]);

    return (
        <div className="flex h-screen w-full items-center justify-center">
            Cargando lista...
        </div>
    );
}
