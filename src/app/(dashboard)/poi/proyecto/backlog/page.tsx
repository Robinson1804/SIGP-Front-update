"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Search,
    ChevronDown,
    ChevronRight,
    MoreHorizontal,
    Plus,
    X,
    Info,
    Paperclip,
    MessageSquare,
    Pencil,
    Trash2,
    Calendar,
    Upload,
    Download,
    AlertTriangle,
    Send,
    Reply,
    Clock,
    User,
    FileImage,
    FileText,
    CheckCircle,
    XCircle,
    Bell,
    Eye,
    ArrowLeft,
    ArrowRight,
    RefreshCw,
} from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Project, ROLES, MODULES } from '@/lib/definitions';
import { paths } from '@/lib/paths';
import { useAuth } from '@/stores';
import { jsPDF } from 'jspdf';
import {
    sprints as initialSprints,
    epics as initialEpics,
    availableResponsibles,
    getTasksByStoryId,
    storyHasTasks,
    statusColors,
    priorityColors,
    sprintStatusColors,
    allUserStories,
    type UserStory,
    type UserStoryStatus,
    type Priority,
    type Sprint,
    type SprintStatus,
    type Epic,
    type Comment,
} from '@/lib/backlog-data';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

// ==================== HELPERS DE FECHAS ====================
// Helper para parsear fechas en varios formatos (DD/MM, DD/MM/YYYY, YYYY-MM-DD)
const parseDateString = (dateStr: string): Date | null => {
    if (!dateStr) return null;

    // Formato ISO: YYYY-MM-DD - usar componentes para evitar problemas de timezone
    if (dateStr.includes('-') && dateStr.length === 10) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) return date;
        }
    }

    // Formato DD/MM o DD/MM/YYYY
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length >= 2) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parts.length === 3 ? parseInt(parts[2], 10) : new Date().getFullYear();
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) return date;
        }
    }

    return null;
};

// Helper para convertir fecha a formato ISO (YYYY-MM-DD) - usando zona horaria local
const toISODateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper para convertir DD/MM/YYYY a YYYY-MM-DD (para inputs de tipo date)
const toInputDateFormat = (dateStr: string): string => {
    if (!dateStr) return '';
    // Si ya está en formato YYYY-MM-DD, retornar tal cual
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
    // Si está en formato DD/MM/YYYY, convertir
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const [day, month, year] = parts;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        if (parts.length === 2) {
            const [day, month] = parts;
            const year = new Date().getFullYear();
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    }
    return dateStr;
};

// Helper para convertir YYYY-MM-DD a DD/MM/YYYY (para mostrar)
const toDisplayDateFormat = (dateStr: string): string => {
    if (!dateStr) return '';
    // Si ya está en formato DD/MM/YYYY, retornar tal cual
    if (dateStr.includes('/')) return dateStr;
    // Si está en formato YYYY-MM-DD, convertir
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }
    return dateStr;
};

// Helper para generar el siguiente ID de tarea secuencial
const getNextTaskId = (stories: UserStory[]): string => {
    const taskIds = stories
        .filter(s => s.type === 'Tarea' && s.id.startsWith('TAR-'))
        .map(s => {
            const numPart = s.id.replace('TAR-', '');
            const num = parseInt(numPart, 10);
            return isNaN(num) ? 0 : num;
        });

    const maxId = taskIds.length > 0 ? Math.max(...taskIds) : 0;
    return `TAR-${maxId + 1}`;
};

// ==================== TIPOS PARA NOTIFICACIONES ====================
type NotificationType = 'atraso' | 'documento' | 'completitud' | 'validacion' | 'info';

type SystemNotification = {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    itemId?: string;
    itemType?: 'tarea' | 'hu' | 'sprint';
    destinatario: 'pmo' | 'scrum_master' | 'desarrollador' | 'todos';
    timestamp: Date;
    read: boolean;
};

// Colores para tipos de notificación
const notificationColors: Record<NotificationType, { bg: string; text: string; icon: string }> = {
    atraso: { bg: 'bg-red-100', text: 'text-red-800', icon: 'text-red-600' },
    documento: { bg: 'bg-blue-100', text: 'text-blue-800', icon: 'text-blue-600' },
    completitud: { bg: 'bg-green-100', text: 'text-green-800', icon: 'text-green-600' },
    validacion: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: 'text-yellow-600' },
    info: { bg: 'bg-gray-100', text: 'text-gray-800', icon: 'text-gray-600' },
};

// ==================== TIPO PARA DOCUMENTO GENERADO ====================
type GeneratedDocument = {
    id: string;
    huId: string;
    huTitle: string;
    tasks: { id: string; title: string; evidences: string[] }[];
    generatedAt: Date;
    status: 'pendiente' | 'aprobado' | 'rechazado';
};

// ==================== MODAL DE INFORMACIÓN ====================
function InfoModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-8 text-center" showCloseButton={false}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-[#018CD1] rounded-full flex items-center justify-center">
                        <Info className="w-12 h-12 text-white" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">FINALIZACIÓN DE HU</DialogTitle>
                    </DialogHeader>
                    <ol className="text-left space-y-3 list-decimal list-inside text-gray-700">
                        <li><span className="font-bold">Agrega Tareas:</span> Toda HU debe tener tareas.</li>
                        <li><span className="font-bold">Finaliza Tareas:</span> Cada tarea requiere evidencia (imagen/PDF).</li>
                        <li><span className="font-bold">Completa HU:</span> La HU finaliza al completar todas sus tareas.</li>
                    </ol>
                    <DialogFooter className="mt-4 w-full">
                        <Button onClick={onClose} className="w-full bg-[#018CD1] hover:bg-[#018CD1]/90">Entendido</Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ==================== MODAL DE SPRINT (CREAR/EDITAR) ====================
type SprintFormData = {
    name: string;
    number: number;
    goal: string;
    startDate: string;
    endDate: string;
    status: SprintStatus;
};

function SprintModal({
    isOpen,
    onClose,
    sprint,
    onSave,
    nextSprintNumber,
    existingSprints,
    lastSprintEndDate,
}: {
    isOpen: boolean;
    onClose: () => void;
    sprint: Sprint | null;
    onSave: (data: Omit<Sprint, 'id'> & { id?: string; goal?: string }) => void;
    nextSprintNumber: number;
    existingSprints: Sprint[];
    lastSprintEndDate?: string;
}) {
    const isEditing = sprint !== null;
    const [formData, setFormData] = useState<SprintFormData>({
        name: '',
        number: nextSprintNumber,
        goal: '',
        startDate: '',
        endDate: '',
        status: 'Por hacer',
    });
    const [errors, setErrors] = useState<{ name?: string; startDate?: string; endDate?: string; duration?: string; overlap?: string; beforeFirst?: string }>({});

    // Calcular fecha sugerida de inicio (día siguiente al último sprint)
    const getSuggestedStartDate = () => {
        if (lastSprintEndDate) {
            const lastEnd = parseDateString(lastSprintEndDate);
            if (lastEnd) {
                lastEnd.setDate(lastEnd.getDate() + 1);
                return toISODateString(lastEnd);
            }
        }
        return toISODateString(new Date());
    };

    // Calcular fecha sugerida de fin (+13 días desde inicio = 14 días totales / 2 semanas)
    // Ejemplo: inicio 11/07 + 13 días = fin 24/07 (duración: 14 días)
    const getSuggestedEndDate = (startDate: string) => {
        if (startDate) {
            const start = parseDateString(startDate);
            if (start) {
                start.setDate(start.getDate() + 13); // 13 días después = 2 semanas exactas
                return toISODateString(start);
            }
        }
        return '';
    };

    // Calcular duración en días
    const calculateDuration = (start: string, end: string): number => {
        if (!start || !end) return 0;
        const startDate = parseDateString(start);
        const endDate = parseDateString(end);
        if (!startDate || !endDate) return 0;
        const diffTime = endDate.getTime() - startDate.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    // Obtener el Sprint 1 (el más antiguo) para validar fechas mínimas
    const getFirstSprint = (): Sprint | null => {
        if (existingSprints.length === 0) return null;
        return existingSprints.reduce((oldest, current) => {
            const oldestStart = parseDateString(oldest.startDate);
            const currentStart = parseDateString(current.startDate);
            if (!oldestStart || !currentStart) return oldest;
            return currentStart < oldestStart ? current : oldest;
        });
    };

    // Verificar que la fecha no sea anterior al Sprint 1
    const checkBeforeFirstSprint = (start: string): string | null => {
        if (!start) return null;
        const firstSprint = getFirstSprint();
        if (!firstSprint) return null; // No hay sprints, permitir cualquier fecha

        // Si estamos editando el primer sprint, no aplicar esta validación
        if (sprint && sprint.id === firstSprint.id) return null;

        const newStart = parseDateString(start);
        const firstSprintStart = parseDateString(firstSprint.startDate);
        if (!newStart || !firstSprintStart) return null;

        if (newStart < firstSprintStart) {
            return `No se puede crear un sprint con fecha anterior al ${firstSprint.name} (${toDisplayDateFormat(firstSprint.startDate)})`;
        }
        return null;
    };

    // Verificar solapamiento con otros sprints
    const checkOverlap = (start: string, end: string): string | null => {
        if (!start || !end) return null;
        const newStart = parseDateString(start);
        const newEnd = parseDateString(end);
        if (!newStart || !newEnd) return null;

        for (const existingSprint of existingSprints) {
            if (sprint && existingSprint.id === sprint.id) continue; // Skip current sprint when editing

            const existingStart = parseDateString(existingSprint.startDate);
            const existingEnd = parseDateString(existingSprint.endDate);
            if (!existingStart || !existingEnd) continue;

            // Verificar solapamiento: nuevo inicio <= existente fin Y nuevo fin >= existente inicio
            if ((newStart <= existingEnd && newEnd >= existingStart)) {
                return `El rango de fechas se solapa con "${existingSprint.name}" (${toDisplayDateFormat(existingSprint.startDate)} - ${toDisplayDateFormat(existingSprint.endDate)})`;
            }
        }
        return null;
    };

    React.useEffect(() => {
        if (sprint) {
            setFormData({
                name: sprint.name,
                number: sprint.number,
                goal: (sprint as Sprint & { goal?: string }).goal || '',
                startDate: sprint.startDate,
                endDate: sprint.endDate,
                status: sprint.status,
            });
        } else {
            // Calcular fecha de inicio: día siguiente al último sprint
            let suggestedStart = toISODateString(new Date());
            if (lastSprintEndDate) {
                const lastEnd = parseDateString(lastSprintEndDate);
                if (lastEnd) {
                    lastEnd.setDate(lastEnd.getDate() + 1);
                    suggestedStart = toISODateString(lastEnd);
                }
            }

            // Calcular fecha de fin: +13 días desde inicio (14 días totales = 2 semanas)
            let suggestedEnd = '';
            const startDate = parseDateString(suggestedStart);
            if (startDate) {
                startDate.setDate(startDate.getDate() + 13);
                suggestedEnd = toISODateString(startDate);
            }

            setFormData({
                name: `Sprint ${nextSprintNumber}`,
                number: nextSprintNumber,
                goal: '',
                startDate: suggestedStart,
                endDate: suggestedEnd,
                status: 'Por hacer',
            });
        }
        setErrors({});
    }, [sprint, isOpen, nextSprintNumber, lastSprintEndDate]);

    // Auto-calcular fecha fin cuando cambia fecha inicio
    const handleStartDateChange = (newStartDate: string) => {
        const formattedStartDate = toDisplayDateFormat(newStartDate);
        setFormData(prev => ({
            ...prev,
            startDate: formattedStartDate,
            endDate: !prev.endDate || !isEditing ? getSuggestedEndDate(newStartDate) : prev.endDate,
        }));
    };

    const validateForm = (): boolean => {
        const newErrors: typeof errors = {};

        // Validar nombre único
        if (!formData.name.trim()) {
            newErrors.name = 'El nombre del sprint es obligatorio';
        } else {
            const nameExists = existingSprints.some(s =>
                s.name.toLowerCase() === formData.name.toLowerCase() && (!sprint || s.id !== sprint.id)
            );
            if (nameExists) {
                newErrors.name = 'Ya existe un sprint con ese nombre';
            }
        }

        // Validar fechas
        if (!formData.startDate) newErrors.startDate = 'La fecha de inicio es obligatoria';
        if (!formData.endDate) newErrors.endDate = 'La fecha de fin es obligatoria';

        if (formData.startDate && formData.endDate) {
            if (formData.endDate < formData.startDate) {
                newErrors.endDate = 'La fecha fin no puede ser anterior a la fecha inicio';
            }

            // Validar que no sea anterior al Sprint 1 (solo para nuevos sprints)
            if (!isEditing) {
                const beforeFirstError = checkBeforeFirstSprint(formData.startDate);
                if (beforeFirstError) {
                    newErrors.beforeFirst = beforeFirstError;
                }
            }

            // Validar duración (3-28 días)
            const duration = calculateDuration(formData.startDate, formData.endDate);
            if (duration < 3) {
                newErrors.duration = 'La duración mínima del sprint es de 3 días';
            } else if (duration > 28) {
                newErrors.duration = 'La duración máxima del sprint es de 4 semanas (28 días)';
            }

            // Validar solapamiento con otros sprints
            const overlapError = checkOverlap(formData.startDate, formData.endDate);
            if (overlapError) {
                newErrors.overlap = overlapError;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validateForm()) {
            onSave({
                id: sprint?.id,
                name: formData.name,
                number: formData.number,
                goal: formData.goal,
                startDate: formData.startDate,
                endDate: formData.endDate,
                status: formData.status,
            });
            onClose();
        }
    };

    const duration = calculateDuration(formData.startDate, formData.endDate);

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg p-0 overflow-hidden" showCloseButton={false}>
                <DialogHeader className="p-4 bg-[#004272] text-white flex flex-row items-center justify-between">
                    <DialogTitle className="text-lg font-bold">
                        {isEditing ? 'Editar Sprint' : 'Crear Sprint'}
                    </DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white h-8 w-8">
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogClose>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh]">
                    <div className="p-6 space-y-5">
                        {/* Sección 1: Información Básica */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">Información Básica</h3>

                            <div>
                                <Label className="text-sm font-medium">
                                    Nombre del Sprint <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className={cn("mt-1", errors.name && "border-red-500")}
                                    placeholder={`Sprint ${nextSprintNumber} - Desarrollo Módulo Principal`}
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                {!isEditing && !errors.name && (
                                    <p className="text-xs text-gray-500 mt-1">Sugerencia: Sprint {nextSprintNumber}</p>
                                )}
                            </div>

                            <div>
                                <Label className="text-sm font-medium">Sprint Goal (Objetivo del Sprint)</Label>
                                <Textarea
                                    value={formData.goal}
                                    onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value.slice(0, 500) }))}
                                    className="mt-1 min-h-[80px]"
                                    placeholder="Implementar las funcionalidades core del módulo de reclutamiento"
                                    maxLength={500}
                                />
                                <p className="text-xs text-gray-400 mt-1 text-right">{formData.goal.length}/500 caracteres</p>
                            </div>
                        </div>

                        {/* Sección 2: Configuración del Sprint */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">Configuración del Sprint</h3>

                            {isEditing && (
                                <div>
                                    <Label className="text-sm font-medium">Estado</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as SprintStatus }))}
                                        disabled={formData.status === 'Finalizado'}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Por hacer">Por hacer</SelectItem>
                                            <SelectItem value="En progreso">En progreso</SelectItem>
                                            <SelectItem value="Finalizado" disabled>Finalizado (automático)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-gray-500 mt-1">El estado "Finalizado" se establece automáticamente cuando todas las HUs están finalizadas</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium">
                                        Fecha Inicio <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="date"
                                        value={toInputDateFormat(formData.startDate)}
                                        onChange={(e) => handleStartDateChange(e.target.value)}
                                        className={cn("mt-1", errors.startDate && "border-red-500")}
                                    />
                                    {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">
                                        Fecha Fin <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="date"
                                        value={toInputDateFormat(formData.endDate)}
                                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: toDisplayDateFormat(e.target.value) }))}
                                        className={cn("mt-1", errors.endDate && "border-red-500")}
                                    />
                                    {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
                                </div>
                            </div>

                            {/* Información de duración */}
                            {formData.startDate && formData.endDate && (
                                <div className={cn(
                                    "p-3 rounded-lg text-sm",
                                    duration < 3 || duration > 28 ? "bg-red-50 border border-red-200" : "bg-blue-50 border border-blue-200"
                                )}>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Duración del Sprint:</span>
                                        <span className={cn(
                                            "font-bold",
                                            duration < 3 || duration > 28 ? "text-red-600" : "text-blue-600"
                                        )}>
                                            {duration} días
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Recomendado: 14 días (2 semanas)</p>
                                </div>
                            )}

                            {errors.duration && (
                                <p className="text-red-500 text-sm">{errors.duration}</p>
                            )}

                            {errors.beforeFirst && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-yellow-700 text-sm font-medium flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        {errors.beforeFirst}
                                    </p>
                                </div>
                            )}

                            {errors.overlap && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-600 text-sm font-medium flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        {errors.overlap}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="p-4 border-t bg-gray-50 flex gap-2">
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} className="bg-[#018CD1] hover:bg-[#018CD1]/90">Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ==================== MODAL DE ÉPICA (CREAR/EDITAR) ====================
function EpicModal({
    isOpen,
    onClose,
    epic,
    onSave,
    currentUser,
}: {
    isOpen: boolean;
    onClose: () => void;
    epic: Epic | null;
    onSave: (data: Omit<Epic, 'id'> & { id?: string }) => void;
    currentUser: string;
}) {
    const isEditing = epic !== null;
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        responsibles: [] as string[],
        state: 'Por hacer' as UserStoryStatus,
        priority: 'Media' as Priority,
        startDate: '',
        endDate: '',
        informer: currentUser,
    });
    const [errors, setErrors] = useState<{ name?: string; responsibles?: string; dates?: string }>({});
    const [responsibleSearch, setResponsibleSearch] = useState('');
    const [showResponsibleDropdown, setShowResponsibleDropdown] = useState(false);

    React.useEffect(() => {
        if (epic) {
            setFormData({
                name: epic.name,
                description: epic.description || '',
                responsibles: epic.responsibles || [],
                state: epic.state,
                priority: epic.priority,
                startDate: epic.startDate,
                endDate: epic.endDate,
                informer: epic.informer || currentUser,
            });
        } else {
            setFormData({
                name: '',
                description: '',
                responsibles: [],
                state: 'Por hacer',
                priority: 'Media',
                startDate: '',
                endDate: '',
                informer: currentUser,
            });
        }
        setErrors({});
    }, [epic, isOpen, currentUser]);

    const filteredResponsibles = availableResponsibles.filter(
        r => r.toLowerCase().includes(responsibleSearch.toLowerCase()) &&
            !formData.responsibles.includes(r)
    );

    const addResponsible = (name: string) => {
        setFormData(prev => ({ ...prev, responsibles: [...prev.responsibles, name] }));
        setResponsibleSearch('');
        setShowResponsibleDropdown(false);
    };

    const removeResponsible = (name: string) => {
        setFormData(prev => ({ ...prev, responsibles: prev.responsibles.filter(r => r !== name) }));
    };

    const validateForm = (): boolean => {
        const newErrors: typeof errors = {};
        if (!formData.name.trim()) newErrors.name = 'El nombre es obligatorio';
        if (formData.responsibles.length === 0) newErrors.responsibles = 'Debe seleccionar al menos un responsable';
        if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
            newErrors.dates = 'La fecha fin no puede ser anterior a la fecha inicio';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validateForm()) {
            onSave({
                id: epic?.id,
                name: formData.name,
                description: formData.description,
                responsibles: formData.responsibles,
                state: formData.state,
                priority: formData.priority,
                startDate: formData.startDate,
                endDate: formData.endDate,
                informer: formData.informer,
            });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg p-0 overflow-hidden" showCloseButton={false}>
                <DialogHeader className="p-4 bg-[#004272] text-white flex flex-row items-center justify-between">
                    <DialogTitle className="text-lg font-bold">
                        {isEditing ? 'Editar Épica' : 'Agregar Épica'}
                    </DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white h-8 w-8">
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogClose>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh]">
                    <div className="p-6 space-y-4">
                        <div>
                            <Label className="text-sm font-medium">
                                Nombre de épica <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className={cn("mt-1", errors.name && "border-red-500")}
                                placeholder="Nombre de la épica"
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <Label className="text-sm font-medium">Descripción</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="mt-1 min-h-[80px]"
                                placeholder="Descripción de la épica"
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium">
                                Responsable <span className="text-red-500">*</span>
                            </Label>
                            <div className="mt-1 space-y-2">
                                {formData.responsibles.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {formData.responsibles.map(name => (
                                            <Badge key={name} variant="secondary" className="flex items-center gap-1 pr-1">
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
                                        onChange={(e) => { setResponsibleSearch(e.target.value); setShowResponsibleDropdown(true); }}
                                        onFocus={() => setShowResponsibleDropdown(true)}
                                        className={cn(errors.responsibles && "border-red-500")}
                                    />
                                    {showResponsibleDropdown && responsibleSearch && filteredResponsibles.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                                            {filteredResponsibles.map(name => (
                                                <button key={name} type="button" onClick={() => addResponsible(name)} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100">
                                                    {name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {errors.responsibles && <p className="text-red-500 text-xs">{errors.responsibles}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-medium">
                                    Estado <span className="text-red-500">*</span>
                                </Label>
                                <Select value={formData.state} onValueChange={(value) => setFormData(prev => ({ ...prev, state: value as UserStoryStatus }))}>
                                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Por hacer">Por hacer</SelectItem>
                                        <SelectItem value="En progreso">En progreso</SelectItem>
                                        <SelectItem value="En revisión" disabled className="text-gray-400">
                                            En revisión (automático)
                                        </SelectItem>
                                        <SelectItem value="Finalizado" disabled className="text-gray-400">
                                            Finalizado (requiere validación)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-500 mt-1">Los estados "En revisión" y "Finalizado" se asignan automáticamente</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">
                                    Prioridad <span className="text-red-500">*</span>
                                </Label>
                                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as Priority }))}>
                                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Alta">Alta</SelectItem>
                                        <SelectItem value="Media">Media</SelectItem>
                                        <SelectItem value="Baja">Baja</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-sm font-medium">
                                    Fecha Inicio <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="date"
                                    value={toInputDateFormat(formData.startDate)}
                                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: toDisplayDateFormat(e.target.value) }))}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label className="text-sm font-medium">
                                    Fecha Fin <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="date"
                                    value={toInputDateFormat(formData.endDate)}
                                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: toDisplayDateFormat(e.target.value) }))}
                                    className="mt-1"
                                />
                                {errors.dates && <p className="text-red-500 text-xs mt-1">{errors.dates}</p>}
                            </div>
                        </div>

                        <div>
                            <Label className="text-sm font-medium">Informador</Label>
                            <Input value={formData.informer} disabled className="mt-1 bg-gray-50" />
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="p-4 border-t bg-gray-50 flex gap-2">
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} className="bg-[#018CD1] hover:bg-[#018CD1]/90">Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ==================== MODAL DE ASIGNAR SPRINT ====================
type ValidationResult = {
    storyId: string;
    storyTitle: string;
    isCompatible: boolean;
    error?: string;
};

function AssignSprintModal({
    isOpen,
    onClose,
    selectedStories,
    sprints,
    onAssign,
}: {
    isOpen: boolean;
    onClose: () => void;
    selectedStories: UserStory[];
    sprints: Sprint[];
    onAssign: (sprintId: string, storyIds: string[]) => void;
}) {
    const [selectedSprint, setSelectedSprint] = useState('');
    const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);

    // Validar fechas de HUs contra el sprint seleccionado
    const validateStoriesForSprint = (sprintId: string) => {
        const sprint = sprints.find(s => s.id === sprintId);
        if (!sprint) return [];

        const sprintStart = parseDateString(sprint.startDate);
        const sprintEnd = parseDateString(sprint.endDate);
        if (!sprintStart || !sprintEnd) return [];

        return selectedStories.map(story => {
            const result: ValidationResult = {
                storyId: story.id,
                storyTitle: story.title,
                isCompatible: true,
            };

            // Si la HU tiene fechas definidas, validar que estén dentro del sprint
            if (story.startDate && story.endDate) {
                const huStart = parseDateString(story.startDate);
                const huEnd = parseDateString(story.endDate);

                if (huStart && huEnd) {
                    if (huStart < sprintStart) {
                        result.isCompatible = false;
                        result.error = `Fecha inicio (${story.startDate}) es anterior al sprint`;
                    } else if (huEnd > sprintEnd) {
                        result.isCompatible = false;
                        result.error = `Fecha fin (${story.endDate}) es posterior al sprint`;
                    }
                }
            }

            return result;
        });
    };

    React.useEffect(() => {
        setSelectedSprint('');
        setValidationResults([]);
    }, [isOpen]);

    React.useEffect(() => {
        if (selectedSprint) {
            setValidationResults(validateStoriesForSprint(selectedSprint));
        } else {
            setValidationResults([]);
        }
    }, [selectedSprint, selectedStories]);

    const compatibleStories = validationResults.filter(r => r.isCompatible);
    const incompatibleStories = validationResults.filter(r => !r.isCompatible);
    const selectedSprintData = sprints.find(s => s.id === selectedSprint);

    const handleAssignCompatible = () => {
        if (compatibleStories.length > 0) {
            onAssign(selectedSprint, compatibleStories.map(s => s.storyId));
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg p-0 overflow-hidden" showCloseButton={false}>
                <DialogHeader className="p-4 bg-[#004272] text-white flex flex-row items-center justify-between">
                    <DialogTitle className="text-lg font-bold">Asignar Historias de Usuario a Sprint</DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white h-8 w-8">
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogClose>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh]">
                    <div className="p-6 space-y-5">
                        {/* Lista de HUs seleccionadas */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">
                                Historias de Usuario Seleccionadas ({selectedStories.length})
                            </h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {selectedStories.map(story => {
                                    const validation = validationResults.find(v => v.storyId === story.id);
                                    return (
                                        <div
                                            key={story.id}
                                            className={cn(
                                                "flex items-start gap-2 p-2 rounded text-sm border",
                                                validation?.isCompatible === false
                                                    ? "bg-red-50 border-red-200"
                                                    : validation?.isCompatible === true
                                                        ? "bg-green-50 border-green-200"
                                                        : "bg-gray-50 border-gray-200"
                                            )}
                                        >
                                            {validation && (
                                                <span className="mt-0.5">
                                                    {validation.isCompatible ? (
                                                        <span className="text-green-600 font-bold">✓</span>
                                                    ) : (
                                                        <span className="text-red-600 font-bold">✗</span>
                                                    )}
                                                </span>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-[#018CD1]">{story.id}</span>
                                                    <span className="truncate text-gray-700">{story.title}</span>
                                                </div>
                                                {story.startDate && story.endDate && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Fechas: {toDisplayDateFormat(story.startDate)} - {toDisplayDateFormat(story.endDate)}
                                                    </p>
                                                )}
                                                {validation?.error && (
                                                    <p className="text-xs text-red-600 mt-1 font-medium">
                                                        {validation.error}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Selección de Sprint */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">Seleccionar Sprint</h3>
                            <div>
                                <Label className="text-sm font-medium">Sprint destino</Label>
                                <Select value={selectedSprint} onValueChange={setSelectedSprint}>
                                    <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar sprint" /></SelectTrigger>
                                    <SelectContent>
                                        {sprints.filter(s => s.status !== 'Finalizado').map(sprint => (
                                            <SelectItem key={sprint.id} value={sprint.id}>
                                                {sprint.name} | {toDisplayDateFormat(sprint.startDate)} - {toDisplayDateFormat(sprint.endDate)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Información del Sprint seleccionado */}
                            {selectedSprintData && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                                    <p className="font-semibold text-blue-800">{selectedSprintData.name}</p>
                                    <p className="text-blue-600 mt-1">
                                        Rango de fechas: {toDisplayDateFormat(selectedSprintData.startDate)} - {toDisplayDateFormat(selectedSprintData.endDate)}
                                    </p>
                                    <Badge className={cn(sprintStatusColors[selectedSprintData.status], 'mt-2')}>
                                        {selectedSprintData.status}
                                    </Badge>
                                </div>
                            )}
                        </div>

                        {/* Resumen de validación */}
                        {selectedSprint && validationResults.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">Resultado de Validación</h3>
                                <div className={cn(
                                    "p-3 rounded-lg text-sm",
                                    incompatibleStories.length > 0 ? "bg-yellow-50 border border-yellow-200" : "bg-green-50 border border-green-200"
                                )}>
                                    <p className="font-medium">
                                        {compatibleStories.length} de {validationResults.length} HUs pueden ser asignadas
                                    </p>
                                    {incompatibleStories.length > 0 && (
                                        <p className="text-yellow-700 mt-1 text-xs">
                                            {incompatibleStories.length} HU(s) tienen conflictos de fechas con el sprint seleccionado
                                        </p>
                                    )}
                                </div>

                                {incompatibleStories.length > 0 && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-red-700 text-sm font-medium mb-2">HUs incompatibles:</p>
                                        <ul className="text-xs text-red-600 space-y-1">
                                            {incompatibleStories.map(story => (
                                                <li key={story.storyId}>
                                                    • <span className="font-medium">{story.storyId}</span>: {story.error}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className="p-4 border-t bg-gray-50 flex gap-2">
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    {incompatibleStories.length > 0 && compatibleStories.length > 0 ? (
                        <Button
                            onClick={handleAssignCompatible}
                            className="bg-[#018CD1] hover:bg-[#018CD1]/90"
                        >
                            Asignar HUs compatibles ({compatibleStories.length})
                        </Button>
                    ) : (
                        <Button
                            onClick={handleAssignCompatible}
                            className="bg-[#018CD1] hover:bg-[#018CD1]/90"
                            disabled={!selectedSprint || compatibleStories.length === 0}
                        >
                            Asignar {compatibleStories.length > 0 ? `(${compatibleStories.length})` : ''}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ==================== MODAL DE REASIGNACIÓN DE SPRINT ====================
function ReassignSprintModal({
    isOpen,
    onClose,
    story,
    sprints,
    onReassign,
}: {
    isOpen: boolean;
    onClose: () => void;
    story: UserStory | null;
    sprints: Sprint[];
    onReassign: (storyId: string, newSprintId: string, deleteTasks?: boolean) => void;
}) {
    const [selectedSprint, setSelectedSprint] = useState('');
    const [showTaskWarning, setShowTaskWarning] = useState(false);

    // Función para parsear fechas en formato DD/MM/YYYY
    const parseDate = (dateStr: string): Date | null => {
        if (!dateStr) return null;
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            // Formato DD/MM/YYYY
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            return new Date(year, month, day);
        }
        return null;
    };

    // Función para verificar si las fechas de la HU están dentro del rango del sprint
    const isDateWithinSprintRange = (storyStartDate: string, storyEndDate: string, sprintStartDate: string, sprintEndDate: string): boolean => {
        const storyStart = parseDate(storyStartDate);
        const storyEnd = parseDate(storyEndDate);
        const sprintStart = parseDate(sprintStartDate);
        const sprintEnd = parseDate(sprintEndDate);

        if (!storyStart || !storyEnd || !sprintStart || !sprintEnd) return true; // Si no hay fechas, permitir

        // La HU debe estar completamente dentro del rango del sprint
        return storyStart >= sprintStart && storyEnd <= sprintEnd;
    };

    // Resetear cuando se abre el modal
    React.useEffect(() => {
        if (isOpen && story) {
            setSelectedSprint(story.sprint || 'backlog');
            setShowTaskWarning(false);
        }
    }, [isOpen, story]);

    const currentSprintData = story ? sprints.find(s => s.id === story.sprint) : null;
    const selectedSprintData = sprints.find(s => s.id === selectedSprint);
    const isBacklog = story?.sprint === 'backlog' || !story?.sprint;
    const isMovingToBacklog = selectedSprint === 'backlog';
    const isFromSprintToBacklog = !isBacklog && isMovingToBacklog;
    const hasTasks = story?.tasks && story.tasks.length > 0;
    const needsTaskWarning = isFromSprintToBacklog && hasTasks;

    // Validar si las fechas de la HU están dentro del rango del sprint destino
    const hasDateConflict = !isMovingToBacklog &&
        selectedSprintData &&
        story?.startDate &&
        story?.endDate &&
        !isDateWithinSprintRange(story.startDate, story.endDate, selectedSprintData.startDate, selectedSprintData.endDate);

    const handleReassign = () => {
        if (story && selectedSprint !== story.sprint && !hasDateConflict) {
            // Si va de Sprint a Backlog y tiene tareas, mostrar advertencia primero
            if (needsTaskWarning && !showTaskWarning) {
                setShowTaskWarning(true);
                return;
            }
            // Si ya confirmó la advertencia o no necesita advertencia
            onReassign(story.id, selectedSprint, needsTaskWarning);
            onClose();
        }
    };

    const handleCancelWarning = () => {
        setShowTaskWarning(false);
    };

    if (!isOpen || !story) return null;

    // Vista de advertencia cuando se mueve de Sprint a Backlog con tareas
    if (showTaskWarning) {
        return (
            <Dialog open={isOpen} onOpenChange={() => { handleCancelWarning(); onClose(); }}>
                <DialogContent className="max-w-md p-0 overflow-hidden" showCloseButton={false}>
                    <DialogHeader className="p-4 bg-[#004272] text-white flex flex-row items-center justify-between">
                        <DialogTitle className="text-lg font-bold">AVISO</DialogTitle>
                        <DialogClose asChild>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white h-8 w-8" onClick={handleCancelWarning}>
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogClose>
                    </DialogHeader>

                    <div className="p-6 text-center flex flex-col items-center">
                        <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" strokeWidth={1.5} />
                        <p className="font-bold text-lg">¿Estás seguro?</p>
                        <p className="text-muted-foreground mt-2">
                            Si reasigna la Historia de Usuario <span className="font-semibold text-[#018CD1]">{story.id}</span> al Tablero Backlog, se eliminarán las <span className="font-semibold text-red-600">{story.tasks?.length} tarea(s)</span> que contiene.
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            Esta acción no se puede deshacer.
                        </p>
                    </div>

                    <DialogFooter className="px-6 pb-6 flex justify-center gap-4">
                        <Button variant="outline" onClick={handleCancelWarning} style={{ borderColor: '#CFD6DD', color: 'black' }}>
                            Cancelar
                        </Button>
                        <Button onClick={handleReassign} style={{ backgroundColor: '#018CD1', color: 'white' }}>
                            Sí, confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md p-0 overflow-hidden" showCloseButton={false}>
                <DialogHeader className="p-4 bg-[#004272] text-white flex flex-row items-center justify-between">
                    <DialogTitle className="text-lg font-bold">Reasignar Historia de Usuario</DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white h-8 w-8">
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogClose>
                </DialogHeader>

                <div className="p-6 space-y-5">
                    {/* Información de la HU */}
                    <div className="space-y-2">
                        <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">Historia de Usuario</h3>
                        <div className="p-3 bg-gray-50 border rounded-lg">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-[#018CD1]">{story.id}</span>
                                <span className="text-gray-700 text-sm truncate">{story.title}</span>
                            </div>
                            {story.startDate && story.endDate && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Fechas: {toDisplayDateFormat(story.startDate)} - {toDisplayDateFormat(story.endDate)}
                                </p>
                            )}
                            {hasTasks && (
                                <p className="text-xs text-orange-600 mt-1 font-medium">
                                    Contiene {story.tasks?.length} tarea(s)
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Ubicación actual */}
                    <div className="space-y-2">
                        <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">Ubicación Actual</h3>
                        <div className={cn(
                            "p-3 rounded-lg text-sm border",
                            isBacklog ? "bg-gray-100 border-gray-300" : "bg-blue-50 border-blue-200"
                        )}>
                            {isBacklog ? (
                                <p className="font-medium text-gray-700">Tablero Backlog</p>
                            ) : currentSprintData ? (
                                <>
                                    <p className="font-semibold text-blue-800">{currentSprintData.name}</p>
                                    <p className="text-blue-600 mt-1">
                                        {toDisplayDateFormat(currentSprintData.startDate)} - {toDisplayDateFormat(currentSprintData.endDate)}
                                    </p>
                                    <Badge className={cn(sprintStatusColors[currentSprintData.status], 'mt-2')}>
                                        {currentSprintData.status}
                                    </Badge>
                                </>
                            ) : (
                                <p className="font-medium text-gray-700">Sprint: {story.sprint}</p>
                            )}
                        </div>
                    </div>

                    {/* Selección de nuevo destino */}
                    <div className="space-y-2">
                        <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">Nuevo Destino</h3>
                        <div>
                            <Label className="text-sm font-medium">Seleccionar destino</Label>
                            <Select value={selectedSprint} onValueChange={setSelectedSprint}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Seleccionar destino" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="backlog">
                                        <span className="font-medium">Tablero Backlog</span>
                                    </SelectItem>
                                    <Separator className="my-1" />
                                    {sprints.filter(s => s.status !== 'Finalizado').map(sprint => (
                                        <SelectItem key={sprint.id} value={sprint.id}>
                                            {sprint.name} | {toDisplayDateFormat(sprint.startDate)} - {toDisplayDateFormat(sprint.endDate)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Preview del destino seleccionado */}
                        {selectedSprint && selectedSprint !== (story.sprint || 'backlog') && (
                            <div className={cn(
                                "p-3 rounded-lg text-sm border mt-3",
                                hasDateConflict ? "bg-red-50 border-red-200" :
                                needsTaskWarning ? "bg-orange-50 border-orange-200" :
                                isMovingToBacklog ? "bg-yellow-50 border-yellow-200" : "bg-green-50 border-green-200"
                            )}>
                                {hasDateConflict ? (
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="font-medium text-red-700">No se puede mover a {selectedSprintData?.name}</p>
                                            <p className="text-red-600 text-xs mt-1">
                                                Las fechas de la HU ({story.startDate} - {story.endDate}) no están dentro del rango del sprint ({selectedSprintData?.startDate} - {selectedSprintData?.endDate}).
                                            </p>
                                            <p className="text-red-600 text-xs mt-1">
                                                Modifique las fechas de la HU para que coincidan con el rango del sprint destino.
                                            </p>
                                        </div>
                                    </div>
                                ) : needsTaskWarning ? (
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="font-medium text-orange-700">Advertencia: Se eliminarán las tareas</p>
                                            <p className="text-orange-600 text-xs mt-1">
                                                Al mover esta HU al Backlog, se eliminarán las {story.tasks?.length} tarea(s) que contiene.
                                            </p>
                                        </div>
                                    </div>
                                ) : isMovingToBacklog ? (
                                    <div className="flex items-center gap-2">
                                        <ArrowLeft className="h-4 w-4 text-yellow-600" />
                                        <p className="font-medium text-yellow-700">Se moverá al Tablero Backlog</p>
                                    </div>
                                ) : selectedSprintData && (
                                    <div className="flex items-center gap-2">
                                        <ArrowRight className="h-4 w-4 text-green-600" />
                                        <div>
                                            <p className="font-medium text-green-700">Se moverá a {selectedSprintData.name}</p>
                                            <p className="text-green-600 text-xs mt-0.5">
                                                {selectedSprintData.startDate} - {selectedSprintData.endDate}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-4 border-t bg-gray-50 flex gap-2">
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button
                        onClick={handleReassign}
                        className="bg-[#018CD1] hover:bg-[#018CD1]/90"
                        disabled={selectedSprint === (story.sprint || 'backlog') || !!hasDateConflict}
                    >
                        Reasignar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ==================== MODAL DE CONFIRMACIÓN DE ELIMINACIÓN ====================
function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    itemName,
    extraMessage,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    itemName: string;
    extraMessage?: string;
}) {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-0" showCloseButton={false}>
                <DialogHeader className="p-4 bg-[#004272] text-white flex flex-row items-center justify-between">
                    <DialogTitle>{title}</DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white h-8 w-8">
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogClose>
                </DialogHeader>
                <div className="p-6">
                    <p className="text-gray-700">
                        ¿Está seguro que desea eliminar "<span className="font-semibold">{itemName}</span>"?
                    </p>
                    {extraMessage && <p className="text-red-600 mt-2 text-sm font-medium">{extraMessage}</p>}
                    <p className="text-gray-500 mt-2 text-sm">Esta acción no se puede deshacer.</p>
                </div>
                <DialogFooter className="p-4 border-t bg-gray-50 flex gap-2">
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={() => { onConfirm(); onClose(); }} className="bg-red-600 hover:bg-red-700 text-white">
                        Sí, eliminar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ==================== MODAL DE ELIMINACIÓN DE SPRINT ====================
function DeleteSprintModal({
    isOpen,
    onClose,
    sprint,
    husCount,
    onMoveToBacklogAndDelete,
    onDeleteAll,
}: {
    isOpen: boolean;
    onClose: () => void;
    sprint: Sprint | null;
    husCount: number;
    onMoveToBacklogAndDelete: () => void;
    onDeleteAll: () => void;
}) {
    const [showConfirmDeleteAll, setShowConfirmDeleteAll] = useState(false);

    React.useEffect(() => {
        setShowConfirmDeleteAll(false);
    }, [isOpen]);

    if (!isOpen || !sprint) return null;

    const hasHUs = husCount > 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-0" showCloseButton={false}>
                <DialogHeader className="p-4 bg-[#004272] text-white flex flex-row items-center justify-between">
                    <DialogTitle>Eliminar Sprint</DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white h-8 w-8">
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogClose>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    {!showConfirmDeleteAll ? (
                        <>
                            {hasHUs ? (
                                <>
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="text-yellow-800 font-medium">
                                            El sprint "{sprint.name}" contiene {husCount} historia(s) de usuario.
                                        </p>
                                        <p className="text-yellow-700 text-sm mt-2">
                                            ¿Desea mover estas HUs al backlog antes de eliminar el sprint?
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <Button
                                            onClick={() => { onMoveToBacklogAndDelete(); onClose(); }}
                                            className="w-full bg-[#018CD1] hover:bg-[#0179b5]"
                                        >
                                            Mover al backlog y eliminar
                                        </Button>

                                        <Button
                                            onClick={() => setShowConfirmDeleteAll(true)}
                                            variant="outline"
                                            className="w-full text-red-600 border-red-300 hover:bg-red-50"
                                        >
                                            Eliminar todo (sprint y HUs)
                                        </Button>

                                        <Button
                                            onClick={onClose}
                                            variant="ghost"
                                            className="w-full"
                                        >
                                            Cancelar
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-gray-700">
                                        ¿Está seguro que desea eliminar el sprint "<span className="font-semibold">{sprint.name}</span>"?
                                    </p>
                                    <p className="text-gray-500 text-sm">Esta acción no se puede deshacer.</p>

                                    <DialogFooter className="flex gap-2 pt-4">
                                        <Button variant="outline" onClick={onClose}>Cancelar</Button>
                                        <Button
                                            onClick={() => { onMoveToBacklogAndDelete(); onClose(); }}
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                        >
                                            Sí, eliminar
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-800 font-bold text-lg mb-2">⚠️ Confirmación Adicional Requerida</p>
                                <p className="text-red-700">
                                    Esta acción eliminará permanentemente el sprint "{sprint.name}" y todas sus {husCount} historia(s) de usuario.
                                </p>
                                <p className="text-red-600 text-sm mt-2 font-medium">
                                    Esta acción NO se puede deshacer.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    onClick={() => { onDeleteAll(); onClose(); }}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                                >
                                    Confirmar: Eliminar sprint y todas las HUs
                                </Button>

                                <Button
                                    onClick={() => setShowConfirmDeleteAll(false)}
                                    variant="outline"
                                    className="w-full"
                                >
                                    Volver atrás
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ==================== TIPOS DE TAREA SECUNDARIA ====================
// Tipo para comentario de tarea
type TaskComment = {
    id: string;
    user: string;
    content: string;
    timestamp: Date;
    parentId?: string; // Para respuestas a comentarios
};

// Tipo para historial de cambios de tarea
type TaskHistoryItem = {
    id: string;
    user: string;
    action: string;
    field?: string;
    oldValue?: string;
    newValue?: string;
    timestamp: Date;
};

// Tipo para archivo adjunto
type TaskAttachment = {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    uploadProgress?: number;
};

type TaskFormData = {
    title: string;
    description: string;
    responsible: string;
    state: UserStoryStatus;
    priority: Priority;
    startDate: string;
    endDate: string;
    points: number;
    informer?: string;
    attachments?: TaskAttachment[];
    comments?: TaskComment[];
    history?: TaskHistoryItem[];
};

// ==================== MODAL DE ALERTA PARA EVIDENCIA ====================
function EvidenceRequiredModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
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
                    <p className="text-gray-600">No se puede finalizar la tarea sin evidencia adjunta</p>
                    <DialogFooter className="mt-4 w-full">
                        <Button onClick={onClose} className="w-full bg-[#018CD1] hover:bg-[#018CD1]/90">Entendido</Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ==================== MODAL DE CONFIRMACIÓN ELIMINAR TAREA ====================
function DeleteTaskConfirmModal({
    isOpen,
    onClose,
    taskName,
    attachmentsCount,
    onConfirm,
}: {
    isOpen: boolean;
    onClose: () => void;
    taskName: string;
    attachmentsCount: number;
    onConfirm: () => void;
}) {
    if (!isOpen) return null;
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-6" showCloseButton={false}>
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-800">Eliminar Tarea Secundaria</DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-600">¿Está seguro de que desea eliminar la tarea &quot;{taskName}&quot;?</p>
                    {attachmentsCount > 0 && (
                        <p className="text-sm text-orange-600">Esta tarea contiene {attachmentsCount} archivo(s) adjunto(s) que también serán eliminados.</p>
                    )}
                    <p className="text-xs text-gray-500">Esta acción no se puede deshacer</p>
                    <DialogFooter className="mt-4 w-full flex gap-3 justify-center">
                        <Button variant="outline" onClick={onClose} className="border-[#CFD6DD] text-[#202020]">Cancelar</Button>
                        <Button onClick={onConfirm} className="bg-[#018CD1] hover:bg-[#018CD1]/90">Sí, eliminar</Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ==================== MODAL DE CAMBIO DE ESTADO ====================
function StateChangeWarningModal({
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
            <DialogContent className="sm:max-w-md p-6 text-center" showCloseButton={false}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-yellow-600" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-800">Cambio de Estado</DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-600">Perderá el estado finalizado y deberá volver a adjuntar evidencias.</p>
                    <DialogFooter className="mt-4 w-full flex gap-3 justify-center">
                        <Button variant="outline" onClick={onClose} className="border-[#CFD6DD] text-[#202020]">Cancelar</Button>
                        <Button onClick={onConfirm} className="bg-[#018CD1] hover:bg-[#018CD1]/90">Continuar</Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ==================== MODAL DE VALIDACIÓN DE HU (SCRUM MASTER) ====================
function ValidateHUModal({
    isOpen,
    onClose,
    hu,
    onValidate,
    onReject,
}: {
    isOpen: boolean;
    onClose: () => void;
    hu: UserStory | null;
    onValidate: () => void;
    onReject: (reason: string) => void;
}) {
    const [rejectMode, setRejectMode] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    React.useEffect(() => {
        if (!isOpen) {
            setRejectMode(false);
            setRejectReason('');
        }
    }, [isOpen]);

    if (!isOpen || !hu) return null;

    const handleReject = () => {
        if (rejectReason.trim()) {
            onReject(rejectReason);
            setRejectMode(false);
            setRejectReason('');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg p-0 overflow-hidden" showCloseButton={false}>
                <DialogHeader className="p-4 bg-[#A78BFA] text-white flex flex-row items-center justify-between">
                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Validar Historia de Usuario
                    </DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white h-8 w-8">
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogClose>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="font-semibold text-purple-800">{hu.id}: {hu.title}</p>
                        <p className="text-sm text-purple-600 mt-1">Estado: En Revisión</p>
                    </div>

                    {!rejectMode ? (
                        <>
                            <p className="text-gray-700">
                                Esta historia de usuario tiene todas sus tareas completadas con evidencias adjuntas.
                                ¿Desea validar y finalizar la HU o rechazarla para correcciones?
                            </p>
                            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <FileText className="h-5 w-5 text-blue-600" />
                                <span className="text-sm text-blue-800">Documento de evidencias generado automáticamente</span>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Motivo del rechazo <span className="text-red-500">*</span></Label>
                            <Textarea
                                placeholder="Describa el motivo del rechazo y las correcciones necesarias..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="min-h-[100px]"
                            />
                            <p className="text-xs text-gray-500">
                                El desarrollador responsable será notificado para realizar las correcciones.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-4 border-t bg-gray-50 flex gap-2">
                    {!rejectMode ? (
                        <>
                            <Button variant="outline" onClick={() => setRejectMode(true)} className="text-red-600 border-red-300 hover:bg-red-50">
                                <XCircle className="h-4 w-4 mr-2" /> Rechazar
                            </Button>
                            <Button onClick={onValidate} className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="h-4 w-4 mr-2" /> Validar y Finalizar
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => setRejectMode(false)}>Cancelar</Button>
                            <Button onClick={handleReject} disabled={!rejectReason.trim()} className="bg-red-600 hover:bg-red-700">
                                Confirmar Rechazo
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ==================== MODAL DE DOCUMENTO GENERADO ====================
function GeneratedDocumentModal({
    isOpen,
    onClose,
    document,
}: {
    isOpen: boolean;
    onClose: () => void;
    document: GeneratedDocument | null;
}) {
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    if (!isOpen || !document) return null;

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // Determinar si es imagen o PDF por extensión
    const isImageFile = (fileName: string) => {
        const ext = fileName.toLowerCase().split('.').pop();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '');
    };

    const isPdfFile = (fileName: string) => {
        return fileName.toLowerCase().endsWith('.pdf');
    };

    // Generar y descargar PDF
    const handleDownloadPdf = async () => {
        setIsGeneratingPdf(true);
        try {
            const doc = new jsPDF();
            let yPosition = 20;
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;

            // Título
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('Documento de Evidencias', pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 15;

            // Info de la HU
            doc.setFontSize(14);
            doc.text(`HU: ${document.huId}`, margin, yPosition);
            yPosition += 8;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`Título: ${document.huTitle}`, margin, yPosition);
            yPosition += 8;
            doc.setFontSize(10);
            doc.text(`Generado: ${formatDate(document.generatedAt)}`, margin, yPosition);
            yPosition += 15;

            // Línea separadora
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 10;

            // Tareas
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Tareas y Evidencias', margin, yPosition);
            yPosition += 10;

            for (const task of document.tasks) {
                if (yPosition > pageHeight - 40) {
                    doc.addPage();
                    yPosition = 20;
                }

                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(`${task.id}: ${task.title}`, margin, yPosition);
                yPosition += 6;

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');

                if (task.evidences.length > 0) {
                    for (const evidence of task.evidences) {
                        doc.text(`• ${evidence}`, margin + 5, yPosition);
                        yPosition += 5;
                    }
                } else {
                    doc.text('Sin evidencias', margin + 5, yPosition);
                    yPosition += 5;
                }
                yPosition += 8;
            }

            // Pie de página
            const totalPages = doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
            }

            doc.save(`Evidencias_${document.huId}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="w-full max-w-4xl p-0 overflow-hidden max-h-[90vh] flex flex-col" showCloseButton={false}>
                    <DialogHeader className="p-4 bg-[#004272] text-white flex flex-row items-center justify-between shrink-0">
                        <DialogTitle className="text-lg font-bold flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Documento de Evidencias - {document.huId}
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDownloadPdf}
                                disabled={isGeneratingPdf}
                                className="text-white hover:bg-white/10 hover:text-white gap-2"
                            >
                                <Download className="h-4 w-4" />
                                {isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}
                            </Button>
                            <DialogClose asChild>
                                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white h-8 w-8">
                                    <X className="h-4 w-4" />
                                </Button>
                            </DialogClose>
                        </div>
                    </DialogHeader>

                    <ScrollArea className="flex-1 overflow-auto">
                        <div className="p-4 md:p-6 space-y-6">
                            {/* Encabezado del documento */}
                            <div className="border-b pb-4">
                                <h2 className="text-lg md:text-xl font-bold text-gray-800">
                                    Evidencia de la Historia de Usuario
                                </h2>
                                <p className="text-gray-600 mt-1 text-sm md:text-base">{document.huTitle}</p>
                                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        {formatDate(document.generatedAt)}
                                    </span>
                                    <span className="flex items-center gap-1 text-green-600">
                                        <CheckCircle className="h-4 w-4" />
                                        HU Finalizada y Aprobada
                                    </span>
                                </div>
                            </div>

                            {/* Resumen */}
                            <div className="bg-blue-50 rounded-lg p-4 flex flex-wrap gap-4 md:gap-8">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">{document.tasks.length}</p>
                                    <p className="text-xs text-gray-600">Tareas</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {document.tasks.reduce((acc, t) => acc + t.evidences.length, 0)}
                                    </p>
                                    <p className="text-xs text-gray-600">Evidencias</p>
                                </div>
                            </div>

                            {/* Lista de tareas con evidencias */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                    <FileImage className="h-5 w-5" />
                                    Tareas y Evidencias
                                </h3>
                                {document.tasks.map((task) => (
                                    <div key={task.id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                                        <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b">
                                            <Badge className="bg-blue-100 text-blue-800">{task.id}</Badge>
                                            <span className="font-medium text-sm md:text-base">{task.title}</span>
                                        </div>
                                        <div className="p-4">
                                            {task.evidences.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                    {task.evidences.map((evidence, eIdx) => (
                                                        <div
                                                            key={eIdx}
                                                            className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                                            onClick={() => {
                                                                if (isImageFile(evidence)) {
                                                                    setPreviewImage(evidence);
                                                                }
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {isImageFile(evidence) ? (
                                                                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                                                        <FileImage className="h-6 w-6 text-blue-500" />
                                                                    </div>
                                                                ) : isPdfFile(evidence) ? (
                                                                    <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center">
                                                                        <FileText className="h-6 w-6 text-red-500" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                                                                        <FileText className="h-6 w-6 text-gray-500" />
                                                                    </div>
                                                                )}
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-700 truncate">
                                                                        {evidence}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {isImageFile(evidence) ? 'Imagen' : isPdfFile(evidence) ? 'PDF' : 'Archivo'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 italic text-center py-4">
                                                    Sin evidencias adjuntas
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-4 border-t bg-gray-50 shrink-0">
                        <Button variant="outline" onClick={onClose}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de previsualización de imagen */}
            {previewImage && (
                <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
                    <DialogContent className="max-w-3xl p-0 overflow-hidden" showCloseButton={false}>
                        <DialogHeader className="p-3 bg-gray-900 text-white flex flex-row items-center justify-between">
                            <DialogTitle className="text-sm font-medium truncate">{previewImage}</DialogTitle>
                            <DialogClose asChild>
                                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8">
                                    <X className="h-4 w-4" />
                                </Button>
                            </DialogClose>
                        </DialogHeader>
                        <div className="bg-gray-800 p-4 flex items-center justify-center min-h-[300px]">
                            <div className="bg-white rounded-lg p-8 text-center">
                                <FileImage className="h-24 w-24 mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-600">Vista previa de imagen</p>
                                <p className="text-sm text-gray-500 mt-1">{previewImage}</p>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}

// ==================== MODAL DE NOTIFICACIONES ====================
function NotificationsModal({
    isOpen,
    onClose,
    notifications,
    onMarkAsRead,
}: {
    isOpen: boolean;
    onClose: () => void;
    notifications: SystemNotification[];
    onMarkAsRead: (id: string) => void;
}) {
    if (!isOpen) return null;

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const getNotificationIcon = (type: NotificationType) => {
        switch (type) {
            case 'atraso': return <AlertTriangle className="h-5 w-5" />;
            case 'documento': return <FileText className="h-5 w-5" />;
            case 'completitud': return <CheckCircle className="h-5 w-5" />;
            case 'validacion': return <Eye className="h-5 w-5" />;
            default: return <Bell className="h-5 w-5" />;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg p-0 overflow-hidden max-h-[70vh]" showCloseButton={false}>
                <DialogHeader className="p-4 bg-[#004272] text-white flex flex-row items-center justify-between">
                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notificaciones
                    </DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white h-8 w-8">
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogClose>
                </DialogHeader>

                <ScrollArea className="max-h-[50vh]">
                    <div className="p-4">
                        {notifications.length > 0 ? (
                            <div className="space-y-3">
                                {notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "p-3 rounded-lg border cursor-pointer transition-colors",
                                            notification.read ? "bg-gray-50" : notificationColors[notification.type].bg,
                                            !notification.read && "border-l-4"
                                        )}
                                        style={{ borderLeftColor: !notification.read ? '#018CD1' : undefined }}
                                        onClick={() => onMarkAsRead(notification.id)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={cn("mt-0.5", notificationColors[notification.type].icon)}>
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn("font-medium text-sm", notificationColors[notification.type].text)}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                                <p className="text-xs text-gray-400 mt-2">{formatDate(notification.timestamp)}</p>
                                            </div>
                                            {!notification.read && (
                                                <div className="w-2 h-2 bg-[#018CD1] rounded-full flex-shrink-0 mt-2" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p>No hay notificaciones</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className="p-4 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ==================== MODAL HU REQUIERE TAREAS ====================
function HURequiresTasksModal({
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
                        <DialogTitle className="text-xl font-bold text-gray-800">Tareas Requeridas</DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-600">
                        La Historia de Usuario debe tener al menos una tarea secundaria para poder pasar a estado &quot;Revisión&quot; o &quot;Finalizado&quot;.
                    </p>
                    <DialogFooter className="mt-4 w-full">
                        <Button onClick={onClose} className="w-full bg-[#018CD1] hover:bg-[#018CD1]/90">Entendido</Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ==================== MODAL DE TAREA SECUNDARIA ====================
function TaskModal({
    isOpen,
    onClose,
    task,
    onSave,
    parentHU,
    currentUser = 'Scrum Master',
}: {
    isOpen: boolean;
    onClose: () => void;
    task: TaskFormData | null;
    onSave: (data: TaskFormData) => void;
    parentHU?: { id: string; title: string; startDate: string; endDate: string; responsibles?: string[] };
    currentUser?: string;
}) {
    const isEditing = task !== null;
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Estados del formulario
    const [formData, setFormData] = useState<TaskFormData>({
        title: '',
        description: '',
        responsible: '',
        state: 'Por hacer',
        priority: 'Media',
        startDate: '',
        endDate: '',
        points: 0,
        informer: currentUser,
        attachments: [],
        comments: [],
        history: [],
    });

    const [errors, setErrors] = useState<{ title?: string; description?: string; responsible?: string; startDate?: string; endDate?: string; dates?: string; state?: string; attachments?: string }>({});
    const [responsibleSearch, setResponsibleSearch] = useState('');
    const [showResponsibleDropdown, setShowResponsibleDropdown] = useState(false);

    // Estados para comentarios y actividad
    const [activeActivityTab, setActiveActivityTab] = useState<'comentarios' | 'historial'>('comentarios');
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingCommentContent, setEditingCommentContent] = useState('');

    // Estados para archivos
    const [uploadingFiles, setUploadingFiles] = useState<{ id: string; name: string; progress: number }[]>([]);

    // Estados para modales de confirmación
    const [showEvidenceRequiredModal, setShowEvidenceRequiredModal] = useState(false);
    const [showStateChangeWarning, setShowStateChangeWarning] = useState(false);
    const [pendingStateChange, setPendingStateChange] = useState<UserStoryStatus | null>(null);

    // Historial de actividad mock para edición
    const [historyItems, setHistoryItems] = useState<TaskHistoryItem[]>([]);

    // Efecto para cargar datos al abrir el modal
    React.useEffect(() => {
        if (task) {
            setFormData({
                ...task,
                attachments: task.attachments || [],
                comments: task.comments || [],
                history: task.history || [],
            });
            // Cargar historial mock si es edición
            setHistoryItems(task.history || [
                { id: '1', user: 'Carlos García', action: 'creó la tarea', timestamp: new Date('2025-02-10T10:00:00') },
                { id: '2', user: 'María López', action: 'cambió el estado', field: 'Estado', oldValue: 'Por hacer', newValue: 'En progreso', timestamp: new Date('2025-02-12T14:30:00') },
            ]);
        } else {
            setFormData({
                title: '',
                description: '',
                responsible: '',
                state: 'Por hacer',
                priority: 'Media',
                startDate: '',
                endDate: '',
                points: 0,
                informer: currentUser,
                attachments: [],
                comments: [],
                history: [],
            });
            setHistoryItems([]);
        }
        setErrors({});
        setResponsibleSearch('');
        setNewComment('');
        setReplyingTo(null);
        setReplyContent('');
        setEditingCommentId(null);
        setEditingCommentContent('');
        setActiveActivityTab('comentarios');
    }, [task, isOpen, currentUser]);

    // Filtrar responsables - solo los de la HU padre si existen
    const availableForTask = parentHU?.responsibles && parentHU.responsibles.length > 0
        ? parentHU.responsibles
        : availableResponsibles;

    const filteredResponsibles = availableForTask.filter(
        r => r.toLowerCase().includes(responsibleSearch.toLowerCase())
    );

    const selectResponsible = (name: string) => {
        setFormData(prev => ({ ...prev, responsible: name }));
        setResponsibleSearch('');
        setShowResponsibleDropdown(false);
    };

    // Formatear fecha para mostrar
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // Formatear tamaño de archivo
    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // Obtener iniciales del usuario
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // ==================== GESTIÓN DE COMENTARIOS ====================
    const handleAddComment = () => {
        if (!newComment.trim()) return;
        const newCommentItem: TaskComment = {
            id: `comment-${Date.now()}`,
            user: currentUser,
            content: newComment.trim(),
            timestamp: new Date(),
        };
        setFormData(prev => ({
            ...prev,
            comments: [...(prev.comments || []), newCommentItem],
        }));
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
        setFormData(prev => ({
            ...prev,
            comments: [...(prev.comments || []), replyItem],
        }));
        setReplyContent('');
        setReplyingTo(null);
    };

    const handleEditComment = (commentId: string) => {
        if (!editingCommentContent.trim()) return;
        setFormData(prev => ({
            ...prev,
            comments: (prev.comments || []).map(c =>
                c.id === commentId ? { ...c, content: editingCommentContent.trim() } : c
            ),
        }));
        setEditingCommentId(null);
        setEditingCommentContent('');
    };

    const handleDeleteComment = (commentId: string) => {
        setFormData(prev => ({
            ...prev,
            comments: (prev.comments || []).filter(c => c.id !== commentId && c.parentId !== commentId),
        }));
    };

    // ==================== GESTIÓN DE ARCHIVOS ====================
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const currentAttachments = formData.attachments || [];
        const maxFiles = 5;
        const maxSize = 10 * 1024 * 1024; // 10MB

        // Verificar límite de archivos
        if (currentAttachments.length + files.length > maxFiles) {
            setErrors(prev => ({ ...prev, attachments: `Solo se permiten máximo ${maxFiles} archivos por tarea` }));
            return;
        }

        const validFiles: File[] = [];
        const errorMessages: string[] = [];

        Array.from(files).forEach(file => {
            // Validar tipo
            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                errorMessages.push(`"${file.name}": Solo se permiten archivos JPG o PNG`);
                return;
            }
            // Validar tamaño
            if (file.size > maxSize) {
                errorMessages.push(`"${file.name}": El archivo excede el tamaño máximo de 10MB`);
                return;
            }
            validFiles.push(file);
        });

        if (errorMessages.length > 0) {
            setErrors(prev => ({ ...prev, attachments: errorMessages.join('. ') }));
        } else {
            setErrors(prev => ({ ...prev, attachments: undefined }));
        }

        // Simular carga de archivos válidos
        validFiles.forEach(file => {
            const uploadId = `upload-${Date.now()}-${Math.random()}`;
            setUploadingFiles(prev => [...prev, { id: uploadId, name: file.name, progress: 0 }]);

            // Simular progreso de carga
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 30;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);

                    // Agregar archivo completado
                    const newAttachment: TaskAttachment = {
                        id: `file-${Date.now()}-${Math.random()}`,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        url: URL.createObjectURL(file),
                    };

                    setFormData(prev => ({
                        ...prev,
                        attachments: [...(prev.attachments || []), newAttachment],
                    }));

                    // Remover de la lista de carga
                    setTimeout(() => {
                        setUploadingFiles(prev => prev.filter(u => u.id !== uploadId));
                    }, 500);
                }
                setUploadingFiles(prev =>
                    prev.map(u => u.id === uploadId ? { ...u, progress: Math.min(progress, 100) } : u)
                );
            }, 200);
        });

        // Limpiar input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveAttachment = (attachmentId: string) => {
        setFormData(prev => ({
            ...prev,
            attachments: (prev.attachments || []).filter(a => a.id !== attachmentId),
        }));
    };

    const handleDownloadAttachment = (attachment: TaskAttachment) => {
        const link = document.createElement('a');
        link.href = attachment.url;
        link.download = attachment.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ==================== GESTIÓN DE ESTADO ====================
    const handleStateChange = (newState: UserStoryStatus) => {
        // Si está pasando de Finalizado a otro estado, mostrar advertencia
        if (formData.state === 'Finalizado' && newState !== 'Finalizado') {
            setPendingStateChange(newState);
            setShowStateChangeWarning(true);
            return;
        }
        // Si quiere pasar a Finalizado, validar que tenga evidencia adjunta
        if (newState === 'Finalizado' && (!formData.attachments || formData.attachments.length === 0)) {
            setShowEvidenceRequiredModal(true);
            return;
        }
        setFormData(prev => ({ ...prev, state: newState }));
    };

    const confirmStateChange = () => {
        if (pendingStateChange) {
            setFormData(prev => ({ ...prev, state: pendingStateChange }));
        }
        setPendingStateChange(null);
        setShowStateChangeWarning(false);
    };

    // ==================== VALIDACIÓN ====================
    const validateForm = (): boolean => {
        const newErrors: typeof errors = {};

        // Validar nombre
        if (!formData.title.trim()) {
            newErrors.title = 'El nombre de la tarea es obligatorio';
        }

        // Validar descripción
        if (!formData.description?.trim()) {
            newErrors.description = 'La descripción de la tarea es obligatoria';
        }

        // Validar responsable
        if (!formData.responsible) {
            newErrors.responsible = 'Debe seleccionar un responsable';
        }

        // Validar fecha inicio (obligatoria)
        if (!formData.startDate) {
            newErrors.startDate = 'La fecha de inicio es obligatoria';
        }

        // Validar fecha fin (obligatoria)
        if (!formData.endDate) {
            newErrors.endDate = 'La fecha de fin es obligatoria';
        }

        // Validar fechas (rango y coherencia)
        if (formData.startDate && formData.endDate) {
            const start = parseDateString(formData.startDate);
            const end = parseDateString(formData.endDate);

            if (start && end && end < start) {
                newErrors.dates = 'La fecha fin no puede ser anterior a la fecha inicio';
            }

            // Validar que esté dentro del rango de la HU padre
            if (parentHU?.startDate && parentHU?.endDate && start && end) {
                const huStart = parseDateString(parentHU.startDate);
                const huEnd = parseDateString(parentHU.endDate);

                if (huStart && huEnd && (start < huStart || end > huEnd)) {
                    // Formatear fechas para mostrar en el mensaje
                    const formatDisplayDate = (dateStr: string) => {
                        const d = parseDateString(dateStr);
                        return d ? d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : dateStr;
                    };
                    newErrors.dates = `Las fechas de la tarea deben estar dentro del rango de la HU padre (${formatDisplayDate(parentHU.startDate)} - ${formatDisplayDate(parentHU.endDate)})`;
                }
            }
        }

        // Validar evidencia para estado Finalizado
        if (formData.state === 'Finalizado' && (!formData.attachments || formData.attachments.length === 0)) {
            setShowEvidenceRequiredModal(true);
            return false;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ==================== GUARDAR ====================
    const handleSave = () => {
        if (validateForm()) {
            // Agregar registro al historial si es edición
            const dataToSave: TaskFormData = {
                ...formData,
                history: isEditing ? [...historyItems, {
                    id: `hist-${Date.now()}`,
                    user: currentUser,
                    action: 'actualizó la tarea',
                    timestamp: new Date(),
                }] : [{
                    id: `hist-${Date.now()}`,
                    user: currentUser,
                    action: 'creó la tarea',
                    timestamp: new Date(),
                }],
            };
            onSave(dataToSave);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden" showCloseButton={false}>
                    <DialogHeader className="p-4 bg-[#004272] text-white flex flex-row items-center justify-between">
                        <DialogTitle className="text-lg font-bold">
                            {isEditing ? 'Editar Tarea' : 'Agregar Tarea'}
                        </DialogTitle>
                        <DialogClose asChild>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white h-8 w-8">
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogClose>
                    </DialogHeader>

                    <ScrollArea className="max-h-[calc(90vh-140px)]">
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-6">
                                {/* ========== COLUMNA IZQUIERDA: Nombre, Descripción, Actividad ========== */}
                                <div className="space-y-4">
                                    {/* Nombre de la tarea */}
                                    <div>
                                        <Label className="text-sm font-medium">
                                            Nombre de la tarea <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            placeholder="ej: Crear formulario digital con..."
                                            value={formData.title}
                                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                            className={cn("mt-1", errors.title && "border-red-500")}
                                        />
                                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                                    </div>

                                    {/* Descripción */}
                                    <div>
                                        <Label className="text-sm font-medium">
                                            Descripción <span className="text-red-500">*</span>
                                        </Label>
                                        <Textarea
                                            placeholder="ej: Implementar validaciones en formulario..."
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            className={cn("mt-1 min-h-[80px]", errors.description && "border-red-500")}
                                        />
                                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                                    </div>

                                    {/* Actividad (Comentarios e Historial) */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-4 border-b pb-2">
                                            <h3 className="font-semibold text-sm text-gray-700">Actividad</h3>
                                            <div className="flex gap-2 ml-auto">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveActivityTab('comentarios')}
                                                    className={cn(
                                                        "text-sm font-medium px-3 py-1 rounded-md transition-colors",
                                                        activeActivityTab === 'comentarios'
                                                            ? "bg-[#018CD1] text-white"
                                                            : "text-gray-500 hover:bg-gray-100"
                                                    )}
                                                >
                                                    Comentarios
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveActivityTab('historial')}
                                                    className={cn(
                                                        "text-sm font-medium px-3 py-1 rounded-md transition-colors",
                                                        activeActivityTab === 'historial'
                                                            ? "bg-[#018CD1] text-white"
                                                            : "text-gray-500 hover:bg-gray-100"
                                                    )}
                                                >
                                                    Historial
                                                </button>
                                            </div>
                                        </div>

                                        {/* Tab Comentarios */}
                                        {activeActivityTab === 'comentarios' && (
                                            <div className="space-y-3">
                                                {/* Lista de comentarios */}
                                                {(formData.comments || []).length > 0 && (
                                                    <div className="space-y-3 max-h-40 overflow-y-auto border rounded-md p-3 bg-gray-50">
                                                        {(formData.comments || []).filter(c => !c.parentId).map(comment => (
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
                                                                {(formData.comments || []).filter(c => c.parentId === comment.id).map(reply => (
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

                                                {/* Formulario para nuevo comentario */}
                                                <div className="space-y-2">
                                                    <Label className="text-sm text-gray-600">Añadir un comentario</Label>
                                                    <Textarea
                                                        placeholder="Escribe un comentario..."
                                                        value={newComment}
                                                        onChange={(e) => setNewComment(e.target.value)}
                                                        className="min-h-[50px] text-sm"
                                                    />
                                                    <div className="flex justify-end">
                                                        <Button
                                                            size="sm"
                                                            disabled={!newComment.trim()}
                                                            onClick={handleAddComment}
                                                            className="bg-[#018CD1] hover:bg-[#018CD1]/90 h-7"
                                                        >
                                                            <Send className="h-3 w-3 mr-1" /> Enviar
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Tab Historial */}
                                        {activeActivityTab === 'historial' && (
                                            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3 bg-gray-50">
                                                {isEditing && historyItems.length > 0 ? (
                                                    historyItems.map(item => (
                                                        <div key={item.id} className="flex items-start gap-2 py-2 border-b border-gray-100 last:border-0">
                                                            <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-medium flex-shrink-0">
                                                                {getInitials(item.user)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm">
                                                                    <span className="font-medium">{item.user}</span>
                                                                    {' '}
                                                                    <span className="text-gray-600">{item.action}</span>
                                                                </p>
                                                                {item.field && (
                                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                        <span className="text-xs text-gray-500">{item.field}:</span>
                                                                        {item.oldValue && (
                                                                            <Badge className={cn(
                                                                                'text-xs',
                                                                                item.field === 'Estado' && statusColors[item.oldValue as UserStoryStatus],
                                                                                item.field === 'Prioridad' && `${priorityColors[item.oldValue as Priority]?.bg} ${priorityColors[item.oldValue as Priority]?.text}`
                                                                            )}>
                                                                                {item.oldValue}
                                                                            </Badge>
                                                                        )}
                                                                        <span className="text-xs text-gray-400">→</span>
                                                                        {item.newValue && (
                                                                            <Badge className={cn(
                                                                                'text-xs',
                                                                                item.field === 'Estado' && statusColors[item.newValue as UserStoryStatus],
                                                                                item.field === 'Prioridad' && `${priorityColors[item.newValue as Priority]?.bg} ${priorityColors[item.newValue as Priority]?.text}`
                                                                            )}>
                                                                                {item.newValue}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" /> {formatDate(item.timestamp)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-gray-500 italic text-center py-4">No hay historial de modificaciones.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ========== COLUMNA DERECHA: Principal hasta Adjuntar ========== */}
                                <div className="space-y-4">
                                    {/* Principal (HU padre) */}
                                    <div>
                                        <Label className="text-sm font-medium">Principal</Label>
                                        <Input
                                            value={parentHU?.id || 'Sin asignar'}
                                            disabled
                                            className="mt-1 bg-gray-100"
                                        />
                                        {parentHU && (
                                            <p className="text-xs text-gray-500 mt-1 truncate">{parentHU.title}</p>
                                        )}
                                    </div>

                                    {/* Responsable */}
                                    <div>
                                        <Label className="text-sm font-medium">
                                            Responsable <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="mt-1 relative">
                                            {formData.responsible ? (
                                                <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
                                                    <div className="w-6 h-6 rounded-full bg-[#018CD1] flex items-center justify-center text-white text-xs font-medium">
                                                        {getInitials(formData.responsible)}
                                                    </div>
                                                    <span className="flex-1 text-sm">{formData.responsible}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, responsible: '' }))}
                                                        className="text-gray-400 hover:text-red-500"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <Input
                                                        placeholder="Buscar responsable..."
                                                        value={responsibleSearch}
                                                        onChange={(e) => { setResponsibleSearch(e.target.value); setShowResponsibleDropdown(true); }}
                                                        onFocus={() => setShowResponsibleDropdown(true)}
                                                        className={cn(errors.responsible && "border-red-500")}
                                                    />
                                                    {showResponsibleDropdown && filteredResponsibles.length > 0 && (
                                                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                                                            {filteredResponsibles.map(name => (
                                                                <button
                                                                    key={name}
                                                                    type="button"
                                                                    onClick={() => selectResponsible(name)}
                                                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                                                                >
                                                                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-medium">
                                                                        {getInitials(name)}
                                                                    </div>
                                                                    {name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            {errors.responsible && <p className="text-red-500 text-xs mt-1">{errors.responsible}</p>}
                                        </div>
                                    </div>

                                    {/* Estado y Prioridad en una fila */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Estado */}
                                        <div>
                                            <Label className="text-sm font-medium">
                                                Estado <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={formData.state}
                                                onValueChange={handleStateChange}
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Seleccionar Estado" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Por hacer">Por hacer</SelectItem>
                                                    <SelectItem value="En progreso">En progreso</SelectItem>
                                                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Prioridad */}
                                        <div>
                                            <Label className="text-sm font-medium">
                                                Prioridad <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={formData.priority}
                                                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as Priority }))}
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Seleccionar Prioridad" />
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
                                        {/* Fecha Inicio */}
                                        <div>
                                            <Label className="text-sm font-medium">
                                                Fecha Inicio <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                type="date"
                                                value={toInputDateFormat(formData.startDate)}
                                                onChange={(e) => setFormData(prev => ({ ...prev, startDate: toDisplayDateFormat(e.target.value) }))}
                                                className={cn("mt-1", errors.startDate && "border-red-500")}
                                            />
                                            {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
                                        </div>

                                        {/* Fecha Fin */}
                                        <div>
                                            <Label className="text-sm font-medium">
                                                Fecha Fin <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                type="date"
                                                value={toInputDateFormat(formData.endDate)}
                                                onChange={(e) => setFormData(prev => ({ ...prev, endDate: toDisplayDateFormat(e.target.value) }))}
                                                className={cn("mt-1", errors.endDate && "border-red-500")}
                                            />
                                            {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
                                        </div>
                                    </div>
                                    {errors.dates && <p className="text-red-500 text-xs">{errors.dates}</p>}

                                    {/* Informador */}
                                    <div>
                                        <Label className="text-sm font-medium">Informador</Label>
                                        <Input
                                            value={formData.informer || currentUser}
                                            onChange={(e) => setFormData(prev => ({ ...prev, informer: e.target.value }))}
                                            className="mt-1"
                                            placeholder="Nombre del informador"
                                        />
                                    </div>

                                    {/* Adjuntar */}
                                    <div>
                                        <Label className="text-sm font-medium">
                                            Adjuntar {formData.state === 'Finalizado' && <span className="text-red-500">*</span>}
                                        </Label>
                                        <p className="text-xs text-gray-500 mt-0.5">Archivos .jpg o .png (máx. 10MB cada uno, máx. 5 archivos)</p>

                                        {/* Input oculto */}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".jpg,.jpeg,.png"
                                            multiple
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />

                                        {/* Botón de subida */}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="mt-2 w-full border-dashed border-2 h-10"
                                            disabled={(formData.attachments?.length || 0) >= 5}
                                        >
                                            <Upload className="h-4 w-4 mr-2" />
                                            Seleccionar archivos
                                        </Button>

                                        {errors.attachments && <p className="text-red-500 text-xs mt-1">{errors.attachments}</p>}

                                        {/* Archivos en proceso de carga */}
                                        {uploadingFiles.length > 0 && (
                                            <div className="mt-2 space-y-2">
                                                {uploadingFiles.map(upload => (
                                                    <div key={upload.id} className="flex items-center gap-2 p-2 border rounded-md bg-blue-50">
                                                        <FileImage className="h-4 w-4 text-blue-500" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs truncate">{upload.name}</p>
                                                            <Progress value={upload.progress} className="h-1 mt-1" />
                                                        </div>
                                                        <span className="text-xs text-blue-600">{Math.round(upload.progress)}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Archivos adjuntos */}
                                        {(formData.attachments || []).length > 0 && (
                                            <div className="mt-2 space-y-2">
                                                {(formData.attachments || []).map(attachment => (
                                                    <div key={attachment.id} className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
                                                        <FileImage className="h-4 w-4 text-gray-500" />
                                                        <div className="flex-1 min-w-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDownloadAttachment(attachment)}
                                                                className="text-sm text-[#018CD1] hover:underline truncate block text-left"
                                                            >
                                                                {attachment.name}
                                                            </button>
                                                            <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveAttachment(attachment.id)}
                                                            className="text-gray-400 hover:text-red-500"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-4 border-t bg-gray-50 flex gap-2">
                        <Button variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button onClick={handleSave} className="bg-[#018CD1] hover:bg-[#018CD1]/90">Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modales de confirmación */}
            <EvidenceRequiredModal
                isOpen={showEvidenceRequiredModal}
                onClose={() => setShowEvidenceRequiredModal(false)}
            />
            <StateChangeWarningModal
                isOpen={showStateChangeWarning}
                onClose={() => { setShowStateChangeWarning(false); setPendingStateChange(null); }}
                onConfirm={confirmStateChange}
            />
        </>
    );
}

// ==================== MODAL DE HU (CREAR/EDITAR) ====================
type HUFormData = {
    title: string;
    description: string;
    epic: string;
    responsibles: string[];
    state: UserStoryStatus;
    priority: Priority;
    startDate: string;
    endDate: string;
    informer: string;
    points: number;
    acceptanceCriteria: string[];
    isAIGenerated?: boolean;
    tasks?: TaskFormData[];
    commentsList?: Comment[];
};

// Tipo para comentarios/actividad
type ActivityItem = {
    id: string;
    user: string;
    action: string;
    timestamp: Date;
    content?: string;
};

function UserStoryModal({
    isOpen,
    onClose,
    story,
    onSave,
    currentUser,
    epics,
    allStories,
    targetSprint,
}: {
    isOpen: boolean;
    onClose: () => void;
    story: UserStory | null;
    onSave: (data: HUFormData, isEdit: boolean, targetSprintId?: string) => void;
    currentUser: string;
    epics: Epic[];
    allStories: UserStory[];
    targetSprint?: Sprint | null;
}) {
    const isEditing = story !== null;
    const isAIGenerated = story?.isAIGenerated || false;

    const [formData, setFormData] = useState<HUFormData>({
        title: '',
        description: '',
        epic: '',
        responsibles: [],
        state: 'Por hacer',
        priority: 'Media',
        startDate: '',
        endDate: '',
        informer: currentUser,
        points: 0,
        acceptanceCriteria: [''],
        isAIGenerated: false,
        tasks: [],
    });
    const [errors, setErrors] = useState<{ title?: string; description?: string; responsibles?: string; dates?: string }>({});
    const [responsibleSearch, setResponsibleSearch] = useState('');
    const [showResponsibleDropdown, setShowResponsibleDropdown] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<TaskFormData | null>(null);
    const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);
    const [newComment, setNewComment] = useState('');
    const [activeCommentTab, setActiveCommentTab] = useState<'comentarios' | 'historial'>('comentarios');

    // Estados para responder, editar y eliminar comentarios
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingCommentContent, setEditingCommentContent] = useState('');

    // Comentarios guardados (con soporte para parentId para respuestas)
    const [comments, setComments] = useState<(Comment & { parentId?: string })[]>(story?.commentsList || []);

    // Actividad/historial (solo lectura)
    const [activities] = useState<ActivityItem[]>(isEditing ? [
        { id: '1', user: 'Carlos García', action: 'creó la historia', timestamp: new Date('2025-02-10T10:00:00') },
        { id: '2', user: 'María López', action: 'cambió el estado a "En progreso"', timestamp: new Date('2025-02-12T14:30:00') },
    ] : []);

    // Función para agregar comentario
    const handleSaveComment = () => {
        if (!newComment.trim()) return;

        const newCommentItem: Comment & { parentId?: string } = {
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
        const replyItem: Comment & { parentId?: string } = {
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

    React.useEffect(() => {
        if (story) {
            // Buscar tareas secundarias por parentId en allStories
            const childTasks = allStories.filter(s => s.parentId === story.id && s.type === 'Tarea');

            // Convertir las tareas secundarias existentes al formato TaskFormData
            const existingTasks: TaskFormData[] = childTasks.map(task => ({
                title: task.title,
                description: task.description || '',
                responsible: task.responsible,
                state: task.state,
                priority: task.priority,
                startDate: task.startDate,
                endDate: task.endDate,
                points: task.points || 0,
                informer: task.informer || currentUser,
                attachments: [],
                comments: [],
                history: [],
            }));

            // También agregar tareas de la propiedad tasks si existen
            const inlineTasks: TaskFormData[] = (story.tasks || []).map(task => ({
                title: task.title,
                description: task.description,
                responsible: task.responsible,
                state: task.state,
                priority: task.priority,
                startDate: task.startDate,
                endDate: task.endDate,
                points: task.points,
                informer: task.informer || currentUser,
                attachments: [],
                comments: [],
                history: [],
            }));

            // Combinar ambas fuentes de tareas (evitando duplicados por título)
            const allTasks = [...existingTasks];
            inlineTasks.forEach(inlineTask => {
                if (!allTasks.some(t => t.title === inlineTask.title)) {
                    allTasks.push(inlineTask);
                }
            });

            setFormData({
                title: story.title,
                description: story.description || '',
                epic: story.epic,
                responsibles: story.responsibles || [story.responsible],
                state: story.state,
                priority: story.priority,
                startDate: story.startDate,
                endDate: story.endDate,
                informer: story.informer || currentUser,
                points: story.points || 0,
                acceptanceCriteria: story.acceptanceCriteria || [''],
                isAIGenerated: story.isAIGenerated || false,
                tasks: allTasks,
            });
        } else {
            // Si hay targetSprint, usar sus fechas como valores por defecto
            setFormData({
                title: '',
                description: '',
                epic: '',
                responsibles: [],
                state: 'Por hacer',
                priority: 'Media',
                startDate: targetSprint?.startDate || '',
                endDate: targetSprint?.endDate || '',
                informer: currentUser,
                points: 0,
                acceptanceCriteria: [''],
                isAIGenerated: false,
                tasks: [],
            });
        }
        setErrors({});
        setComments(story?.commentsList || []);
        setNewComment('');
    }, [story, currentUser, isOpen, allStories, targetSprint]);

    const filteredResponsibles = availableResponsibles.filter(
        r => r.toLowerCase().includes(responsibleSearch.toLowerCase()) && !formData.responsibles.includes(r)
    );

    const addResponsible = (name: string) => {
        setFormData(prev => ({ ...prev, responsibles: [...prev.responsibles, name] }));
        setResponsibleSearch('');
        setShowResponsibleDropdown(false);
    };

    const removeResponsible = (name: string) => {
        setFormData(prev => ({ ...prev, responsibles: prev.responsibles.filter(r => r !== name) }));
    };

    const addCriteria = () => {
        setFormData(prev => ({ ...prev, acceptanceCriteria: [...prev.acceptanceCriteria, ''] }));
    };

    const updateCriteria = (index: number, value: string) => {
        setFormData(prev => ({ ...prev, acceptanceCriteria: prev.acceptanceCriteria.map((c, i) => i === index ? value : c) }));
    };

    const removeCriteria = (index: number) => {
        setFormData(prev => ({ ...prev, acceptanceCriteria: prev.acceptanceCriteria.filter((_, i) => i !== index) }));
    };

    // Handlers de tareas
    const handleAddTask = () => {
        setEditingTask(null);
        setEditingTaskIndex(null);
        setIsTaskModalOpen(true);
    };

    const handleEditTask = (task: TaskFormData, index: number) => {
        setEditingTask(task);
        setEditingTaskIndex(index);
        setIsTaskModalOpen(true);
    };

    const handleSaveTask = (taskData: TaskFormData) => {
        setFormData(prev => {
            const tasks = [...(prev.tasks || [])];
            if (editingTaskIndex !== null) {
                tasks[editingTaskIndex] = taskData;
            } else {
                tasks.push(taskData);
            }
            return { ...prev, tasks };
        });
    };

    const handleDeleteTask = (index: number) => {
        setFormData(prev => ({
            ...prev,
            tasks: prev.tasks?.filter((_, i) => i !== index) || []
        }));
    };

    const validateForm = (): boolean => {
        const newErrors: typeof errors = {};
        if (!formData.title.trim()) newErrors.title = 'El título es obligatorio';
        if (!formData.description.trim()) newErrors.description = 'La descripción es obligatoria';
        if (formData.responsibles.length === 0) newErrors.responsibles = 'Debe seleccionar al menos un responsable';
        if (formData.startDate && formData.endDate) {
            const start = parseDateString(formData.startDate);
            const end = parseDateString(formData.endDate);
            if (start && end && end < start) newErrors.dates = 'La fecha fin no puede ser anterior a la fecha inicio';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validateForm()) {
            // Incluir los comentarios en el formData antes de guardar
            const dataToSave = { ...formData, commentsList: comments };
            // Pasar el targetSprintId si es una HU nueva creada desde un sprint
            onSave(dataToSave, isEditing, !isEditing && targetSprint ? targetSprint.id : undefined);
            onClose();
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (!isOpen) return null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden" showCloseButton={false}>
                    <DialogHeader className="p-4 bg-[#004272] text-white flex flex-row items-center justify-between">
                        <DialogTitle className="text-lg font-bold">
                            {isEditing ? 'Editar Historia de Usuario' : 'Agregar Historia de Usuario'}
                        </DialogTitle>
                        <DialogClose asChild>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white h-8 w-8">
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogClose>
                    </DialogHeader>

                    <ScrollArea className="max-h-[calc(90vh-140px)]">
                        <div className="p-6">
                            {/* Layout de 2 columnas principales */}
                            <div className="grid grid-cols-2 gap-6">
                                {/* ========== COLUMNA IZQUIERDA ========== */}
                                <div className="space-y-5">
                                    {/* Título */}
                                    <div>
                                        <Label className="text-sm font-medium">Título <span className="text-red-500">*</span></Label>
                                        <Input
                                            placeholder="Implementación del módulo de reclutamiento en el sistema ENDES"
                                            value={formData.title}
                                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                            className={cn("mt-1", errors.title && "border-red-500")}
                                        />
                                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                                    </div>

                                    {/* Descripción */}
                                    <div>
                                        <Label className="text-sm font-medium">Descripción <span className="text-red-500">*</span></Label>
                                        <Textarea
                                            placeholder="Como Usuario ENDES, Quiero Desarrollo e implementación del módulo de reclutamiento en el Sistema de Monitoreo del ENDES"
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            className={cn("mt-1 min-h-[80px]", errors.description && "border-red-500")}
                                        />
                                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                                    </div>

                                    {/* Agregar Tareas */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between border-b pb-2">
                                            <h3 className="font-semibold text-sm text-gray-700">Agregar Tareas</h3>
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={handleAddTask}
                                                className="bg-[#018CD1] hover:bg-[#0179b5] h-7 w-7 p-0"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {formData.tasks && formData.tasks.length > 0 ? (
                                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                                {formData.tasks.map((task, index) => (
                                                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm truncate">{task.title}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge className={cn(statusColors[task.state], 'text-xs')}>{task.state}</Badge>
                                                                <span className="text-xs text-gray-500 truncate">{task.responsible}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 ml-2">
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-[#018CD1]" onClick={() => handleEditTask(task, index)}>
                                                                <Pencil className="h-3 w-3" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-red-600" onClick={() => handleDeleteTask(index)}>
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">No hay tareas agregadas.</p>
                                        )}
                                    </div>

                                    {/* Comentarios/Historial - Con tabs */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-4 border-b pb-2">
                                            <button
                                                type="button"
                                                onClick={() => setActiveCommentTab('comentarios')}
                                                className={cn(
                                                    "text-sm font-semibold pb-1 border-b-2 -mb-[9px]",
                                                    activeCommentTab === 'comentarios'
                                                        ? "text-[#018CD1] border-[#018CD1]"
                                                        : "text-gray-500 border-transparent hover:text-gray-700"
                                                )}
                                            >
                                                Comentarios
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActiveCommentTab('historial')}
                                                className={cn(
                                                    "text-sm font-semibold pb-1 border-b-2 -mb-[9px]",
                                                    activeCommentTab === 'historial'
                                                        ? "text-[#018CD1] border-[#018CD1]"
                                                        : "text-gray-500 border-transparent hover:text-gray-700"
                                                )}
                                            >
                                                Historial
                                            </button>
                                        </div>

                                        {/* Tab Comentarios */}
                                        {activeCommentTab === 'comentarios' && (
                                            <div className="space-y-3">
                                                {/* Lista de comentarios guardados */}
                                                {comments.length > 0 && (
                                                    <div className="space-y-3 max-h-40 overflow-y-auto border rounded-md p-3 bg-gray-50">
                                                        {comments.filter(c => !c.parentId).map(comment => (
                                                            <div key={comment.id} className="space-y-2">
                                                                {/* Comentario principal */}
                                                                <div className="flex items-start gap-3">
                                                                    <div className="w-7 h-7 rounded-full bg-[#018CD1] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                                                                        {comment.user.split(' ').map(n => n[0]).join('')}
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
                                                                            {reply.user.split(' ').map(n => n[0]).join('')}
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

                                                {/* Formulario para nuevo comentario */}
                                                <Textarea
                                                    placeholder="Escribe un comentario..."
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                    className="min-h-[60px] text-sm"
                                                />
                                                <div className="flex justify-end">
                                                    <Button
                                                        size="sm"
                                                        disabled={!newComment.trim()}
                                                        onClick={handleSaveComment}
                                                        className="bg-[#018CD1] hover:bg-[#0179b5] h-8"
                                                    >
                                                        <Send className="h-4 w-4 mr-1" /> Enviar
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Tab Historial */}
                                        {activeCommentTab === 'historial' && (
                                            <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2 bg-gray-50">
                                                {isEditing && activities.length > 0 ? (
                                                    activities.map(activity => (
                                                        <div key={activity.id} className="flex items-start gap-2 text-sm">
                                                            <div className="w-6 h-6 rounded-full bg-[#018CD1] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                                                                {activity.user.split(' ').map(n => n[0]).join('')}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs"><span className="font-medium">{activity.user}</span> {activity.action}</p>
                                                                <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-gray-500 italic text-center py-2">No hay historial de modificaciones.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Criterios de Aceptación */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Criterios de Aceptación</Label>
                                        <div className="space-y-2 max-h-32 overflow-y-auto">
                                            {formData.acceptanceCriteria.map((criteria, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <Input
                                                        placeholder={`CRITERIO ${index + 1}: ...`}
                                                        value={criteria}
                                                        onChange={(e) => updateCriteria(index, e.target.value)}
                                                        className="flex-1 h-8 text-sm"
                                                    />
                                                    {formData.acceptanceCriteria.length > 1 && (
                                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeCriteria(index)} className="h-7 w-7 text-red-500 hover:text-red-700">
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={addCriteria} className="h-7 text-xs">
                                            <Plus className="h-3 w-3 mr-1" /> Agregar criterio
                                        </Button>
                                    </div>
                                </div>

                                {/* ========== COLUMNA DERECHA ========== */}
                                <div className="space-y-4">
                                    {/* Épica */}
                                    <div>
                                        <Label className="text-sm font-medium">Épica</Label>
                                        <Select value={formData.epic} onValueChange={(value) => setFormData(prev => ({ ...prev, epic: value }))}>
                                            <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                            <SelectContent>
                                                {epics.map(epic => (
                                                    <SelectItem key={epic.id} value={epic.name}>{epic.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

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
                                                    onChange={(e) => { setResponsibleSearch(e.target.value); setShowResponsibleDropdown(true); }}
                                                    onFocus={() => setShowResponsibleDropdown(true)}
                                                    className={cn("h-8 text-sm", errors.responsibles && "border-red-500")}
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
                                        </div>
                                    </div>

                                    {/* Estado y Prioridad en una fila */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-sm font-medium">Estado</Label>
                                            <Select value={formData.state} onValueChange={(value) => setFormData(prev => ({ ...prev, state: value as UserStoryStatus }))} disabled={!isEditing}>
                                                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Por hacer">Por hacer</SelectItem>
                                                    <SelectItem value="En progreso">En progreso</SelectItem>
                                                    <SelectItem value="En revisión" disabled className="text-gray-400">
                                                        En revisión (automático)
                                                    </SelectItem>
                                                    <SelectItem value="Finalizado" disabled className="text-gray-400">
                                                        Finalizado (validación SM)
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-gray-500 mt-0.5">Estados automáticos según tareas</p>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium">Prioridad</Label>
                                            <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as Priority }))}>
                                                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
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
                                            <Label className="text-sm font-medium">Fecha Inicio</Label>
                                            <Input
                                                type="date"
                                                value={toInputDateFormat(formData.startDate)}
                                                onChange={(e) => setFormData(prev => ({ ...prev, startDate: toDisplayDateFormat(e.target.value) }))}
                                                className="mt-1 h-8 text-sm"
                                                disabled={isAIGenerated}
                                            />
                                            {isAIGenerated && <p className="text-xs text-gray-400 mt-1">No editable (IA)</p>}
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium">Fecha Fin</Label>
                                            <Input type="date" value={toInputDateFormat(formData.endDate)} onChange={(e) => setFormData(prev => ({ ...prev, endDate: toDisplayDateFormat(e.target.value) }))} className="mt-1 h-8 text-sm" />
                                            {errors.dates && <p className="text-red-500 text-xs mt-1">{errors.dates}</p>}
                                        </div>
                                    </div>

                                    {/* Informador */}
                                    <div>
                                        <Label className="text-sm font-medium">Informador</Label>
                                        <Input value={formData.informer} disabled className="mt-1 h-8 text-sm bg-gray-50" />
                                    </div>

                                    {/* Adjuntar */}
                                    <div>
                                        <Label className="text-sm font-medium text-gray-400">Adjuntar</Label>
                                        <div className="mt-1 p-2 border rounded-md bg-gray-100 text-gray-400 text-xs flex items-center gap-2">
                                            <Paperclip className="h-4 w-4" />
                                            <span>Generado automáticamente al finalizar tareas</span>
                                        </div>
                                    </div>

                                    {/* Puntos HU */}
                                    <div>
                                        <Label className="text-sm font-medium">Puntos HU</Label>
                                        <Input type="number" min="0" value={formData.points} onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))} className="mt-1 h-8 text-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-4 border-t bg-gray-50">
                        <Button variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button onClick={handleSave} className="bg-[#018CD1] hover:bg-[#018CD1]/90">Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Tarea Secundaria */}
            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); setEditingTaskIndex(null); }}
                task={editingTask}
                onSave={handleSaveTask}
                parentHU={{ id: story?.id || 'Nueva HU', title: formData.title, startDate: formData.startDate, endDate: formData.endDate, responsibles: formData.responsibles }}
                currentUser={currentUser}
            />
        </>
    );
}

// ==================== COMPONENTE FILA DE HISTORIA ====================
function StoryRow({
    story,
    allStories,
    onEdit,
    onDelete,
    onEditTask,
    onDeleteTask,
    onCreateTask,
    onValidate,
    onViewDocument,
    onReassign,
    hasDocument,
    isSelected,
    onSelectChange,
    showCheckbox = false,
    canManage = true,
    canManageTasks = false,
}: {
    story: UserStory;
    allStories: UserStory[];
    onEdit: (story: UserStory) => void;
    onDelete: (story: UserStory) => void;
    onEditTask?: (task: UserStory, parentStory: UserStory) => void;
    onDeleteTask?: (task: UserStory, parentStory: UserStory) => void;
    onCreateTask?: (parentStory: UserStory) => void;
    onValidate?: (story: UserStory) => void;
    onViewDocument?: (storyId: string) => void;
    onReassign?: (story: UserStory) => void;
    hasDocument?: boolean;
    isSelected?: boolean;
    onSelectChange?: (checked: boolean) => void;
    showCheckbox?: boolean;
    canManage?: boolean; // false para PMO, true para Scrum Master
    canManageTasks?: boolean; // Para DESARROLLADOR: puede crear/editar/eliminar tareas
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    // Calcular tareas dinámicamente desde allStories
    const tasks = allStories.filter(item => item.type === 'Tarea' && item.parentId === story.id);

    // Mostrar menú si puede gestionar HU O si puede gestionar tareas
    const showActionsMenu = canManage || canManageTasks;
    const hasTasks = tasks.length > 0;

    // Indicadores visuales para estados
    const isFinalized = story.state === 'Finalizado';
    const isInReview = story.state === 'En revisión';

    return (
        <>
            <TableRow className={cn("hover:bg-gray-50", isSelected && "bg-blue-50", isFinalized && "bg-green-50/30")}>
                {showCheckbox && (
                    <TableCell className="w-[40px]">
                        <Checkbox checked={isSelected} onCheckedChange={onSelectChange} />
                    </TableCell>
                )}
                <TableCell className="font-medium">
                    <div className="flex items-center gap-1">
                        {hasTasks ? (
                            <button onClick={() => setIsExpanded(!isExpanded)} className="p-0.5 hover:bg-gray-200 rounded transition-colors">
                                {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-600" /> : <ChevronRight className="h-4 w-4 text-gray-600" />}
                            </button>
                        ) : (
                            <span className="w-5" />
                        )}
                        <span className={cn("text-[#018CD1]", isFinalized && "line-through text-gray-500")}>{story.id}</span>
                        {isFinalized && <CheckCircle className="h-4 w-4 text-green-500 ml-1" />}
                        {(hasDocument || isInReview || isFinalized) && (
                            <button
                                onClick={() => onViewDocument?.(story.id)}
                                className="ml-1 text-blue-500 hover:text-blue-700"
                                title="Ver documento de evidencias"
                            >
                                <FileText className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </TableCell>
                <TableCell>
                    <span className={cn(isFinalized && "line-through text-gray-500")}>{story.title}</span>
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-1">
                        <Badge className={cn(statusColors[story.state], 'font-semibold')}>{story.state}</Badge>
                        {isInReview && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="text-purple-500 hover:text-purple-700">
                                        <Info className="h-4 w-4" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-3">
                                    <p className="text-sm text-gray-600">Pendiente de validación del Scrum Master</p>
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>
                </TableCell>
                <TableCell>{story.epic}</TableCell>
                <TableCell>
                    {story.responsibles && story.responsibles.length > 0
                        ? story.responsibles.join(', ')
                        : story.responsible}
                </TableCell>
                <TableCell>
                    <Badge className={cn(priorityColors[story.priority]?.bg, priorityColors[story.priority]?.text, 'w-16 justify-center')}>{story.priority}</Badge>
                </TableCell>
                <TableCell>{story.startDate || '-'}</TableCell>
                <TableCell>{story.endDate || '-'}</TableCell>
                <TableCell>
                    {showActionsMenu ? (
                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <button className="p-1 hover:bg-gray-100 rounded"><MoreHorizontal className="h-5 w-5 text-gray-400" /></button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {/* Validar HU - solo canManage (Scrum Master) */}
                                {canManage && isInReview && onValidate && (
                                    <>
                                        <DropdownMenuItem onClick={() => setTimeout(() => onValidate(story), 0)} className="text-green-600">
                                            <CheckCircle className="h-4 w-4 mr-2" /> Validar HU
                                        </DropdownMenuItem>
                                        <Separator className="my-1" />
                                    </>
                                )}
                                {/* Editar - solo canManage, no cuando está en revisión ni finalizada */}
                                {canManage && !isInReview && !isFinalized && (
                                    <DropdownMenuItem onClick={() => setTimeout(() => onEdit(story), 0)}>
                                        <Pencil className="h-4 w-4 mr-2" /> Editar
                                    </DropdownMenuItem>
                                )}
                                {/* Reasignar - solo canManage, no en revisión ni finalizado */}
                                {canManage && onReassign && !isFinalized && !isInReview && (
                                    <DropdownMenuItem onClick={() => setTimeout(() => onReassign(story), 0)} className="text-orange-600">
                                        <RefreshCw className="h-4 w-4 mr-2" /> Reasignar
                                    </DropdownMenuItem>
                                )}
                                {/* Crear tarea - disponible si canManageTasks (SCRUM MASTER o DESARROLLADOR), no en revisión ni finalizado */}
                                {onCreateTask && !isFinalized && !isInReview && (
                                    <DropdownMenuItem onClick={() => setTimeout(() => onCreateTask(story), 0)} className="text-[#018CD1]">
                                        <Plus className="h-4 w-4 mr-2" /> Crear tarea
                                    </DropdownMenuItem>
                                )}
                                {/* Ver documento - disponible para todos con acceso al menú */}
                                {(hasDocument || isInReview || isFinalized) && onViewDocument && (
                                    <DropdownMenuItem onClick={() => setTimeout(() => onViewDocument(story.id), 0)} className="text-blue-600">
                                        <FileText className="h-4 w-4 mr-2" /> Ver documento
                                    </DropdownMenuItem>
                                )}
                                {/* Eliminar - solo canManage, no cuando está en revisión ni finalizada */}
                                {canManage && !isInReview && !isFinalized && (
                                    <DropdownMenuItem onClick={() => setTimeout(() => onDelete(story), 0)} className="text-red-600 focus:text-red-600">
                                        <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <span className="text-gray-400 text-sm">-</span>
                    )}
                </TableCell>
            </TableRow>
            {isExpanded && tasks.map(task => (
                <TableRow key={task.id} className="bg-blue-50/50 hover:bg-blue-100/50">
                    {showCheckbox && <TableCell />}
                    <TableCell className="font-medium">
                        <div className="flex items-center gap-1 pl-6"><span className="text-blue-700">{task.id}</span></div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2 pl-2">
                            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">Tarea</Badge>
                            <span className="text-gray-700">{task.title}</span>
                        </div>
                    </TableCell>
                    <TableCell><Badge className={cn(statusColors[task.state], 'font-semibold')}>{task.state}</Badge></TableCell>
                    <TableCell className="text-gray-500">-</TableCell>
                    <TableCell>{task.responsible}</TableCell>
                    <TableCell><Badge className={cn(priorityColors[task.priority]?.bg, priorityColors[task.priority]?.text, 'w-16 justify-center')}>{task.priority}</Badge></TableCell>
                    <TableCell>{task.startDate}</TableCell>
                    <TableCell>{task.endDate}</TableCell>
                    <TableCell>
                        {isFinalized ? (
                            // HU Finalizada: mostrar icono de exclamación con tooltip
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="p-1 hover:bg-green-100 rounded" title="HU finalizada">
                                        <AlertTriangle className="h-5 w-5 text-green-600" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-2">
                                    <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4" /> HU finalizada y aprobada
                                    </p>
                                </PopoverContent>
                            </Popover>
                        ) : canManageTasks ? (
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-1 hover:bg-gray-100 rounded"><MoreHorizontal className="h-5 w-5 text-gray-400" /></button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {/* Bloquear Editar/Eliminar tareas cuando la HU padre está en revisión */}
                                    {!isInReview ? (
                                        <>
                                            <DropdownMenuItem onClick={() => setTimeout(() => onEditTask?.(task, story), 0)}>
                                                <Pencil className="h-4 w-4 mr-2" /> Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setTimeout(() => onDeleteTask?.(task, story), 0)} className="text-red-600 focus:text-red-600">
                                                <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                                            </DropdownMenuItem>
                                        </>
                                    ) : (
                                        <DropdownMenuItem disabled className="text-gray-400">
                                            <Info className="h-4 w-4 mr-2" /> HU en revisión
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <span className="text-gray-400 text-sm">-</span>
                        )}
                    </TableCell>
                </TableRow>
            ))}
        </>
    );
}

// ==================== TABLA DE SPRINT ====================
function SprintTable({
    stories,
    allStories,
    onEditStory,
    onDeleteStory,
    onEditTask,
    onDeleteTask,
    onCreateTask,
    onValidate,
    onViewDocument,
    onReassign,
    onAddStory,
    documentsIds,
    canManage = true,
    canManageTasks = false,
}: {
    stories: UserStory[];
    allStories: UserStory[];
    onEditStory: (story: UserStory) => void;
    onDeleteStory: (story: UserStory) => void;
    onEditTask?: (task: UserStory, parentStory: UserStory) => void;
    onDeleteTask?: (task: UserStory, parentStory: UserStory) => void;
    onCreateTask?: (parentStory: UserStory) => void;
    onValidate?: (story: UserStory) => void;
    onViewDocument?: (storyId: string) => void;
    onReassign?: (story: UserStory) => void;
    onAddStory?: () => void;
    documentsIds?: string[];
    canManage?: boolean;
    canManageTasks?: boolean;
}) {
    return (
        <div className="rounded-lg border overflow-hidden">
            <Table className="bg-white">
                <TableHeader className="bg-[#004272]">
                    <TableRow>
                        <TableHead className="w-[100px] font-bold text-white">ID</TableHead>
                        <TableHead className="font-bold text-white">Título</TableHead>
                        <TableHead className="font-bold text-white">Estado</TableHead>
                        <TableHead className="font-bold text-white">Épica</TableHead>
                        <TableHead className="font-bold text-white">Responsable</TableHead>
                        <TableHead className="font-bold text-white">Prioridad</TableHead>
                        <TableHead className="font-bold text-white">Fecha Inicio</TableHead>
                        <TableHead className="font-bold text-white">Fecha Fin</TableHead>
                        <TableHead className="w-[60px] font-bold text-white">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {stories.map(story => (
                        <StoryRow
                            key={story.id}
                            story={story}
                            allStories={allStories}
                            onEdit={onEditStory}
                            onDelete={onDeleteStory}
                            onEditTask={onEditTask}
                            onDeleteTask={onDeleteTask}
                            onCreateTask={onCreateTask}
                            onValidate={onValidate}
                            onViewDocument={onViewDocument}
                            onReassign={onReassign}
                            hasDocument={documentsIds?.includes(story.id)}
                            canManage={canManage}
                            canManageTasks={canManageTasks}
                        />
                    ))}
                    {/* Fila para agregar nueva historia de usuario */}
                    {onAddStory && canManage && (
                        <TableRow
                            className="hover:bg-blue-50 cursor-pointer border-t-2 border-dashed border-gray-300"
                            onClick={onAddStory}
                        >
                            <TableCell colSpan={9} className="py-3">
                                <div className="flex items-center justify-center gap-2 text-[#018CD1] font-medium">
                                    <Plus className="h-4 w-4" />
                                    <span>Agregar historia de usuario</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

// ==================== TABLA DE BACKLOG (CON CHECKBOXES) ====================
function BacklogTable({
    stories,
    allStories,
    onEditStory,
    onDeleteStory,
    onEditTask,
    onDeleteTask,
    onCreateTask,
    onValidate,
    onViewDocument,
    onReassign,
    onAddStory,
    documentsIds,
    selectedIds,
    onSelectionChange,
    canManage = true,
    canManageTasks = false,
}: {
    stories: UserStory[];
    allStories: UserStory[];
    onEditStory: (story: UserStory) => void;
    onDeleteStory: (story: UserStory) => void;
    onEditTask?: (task: UserStory, parentStory: UserStory) => void;
    onDeleteTask?: (task: UserStory, parentStory: UserStory) => void;
    onCreateTask?: (parentStory: UserStory) => void;
    onValidate?: (story: UserStory) => void;
    onViewDocument?: (storyId: string) => void;
    onReassign?: (story: UserStory) => void;
    onAddStory?: () => void;
    documentsIds?: string[];
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    canManage?: boolean;
    canManageTasks?: boolean; // Para DESARROLLADOR: puede crear/editar/eliminar tareas
}) {
    const allSelected = stories.length > 0 && stories.every(s => selectedIds.includes(s.id));

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onSelectionChange(stories.map(s => s.id));
        } else {
            onSelectionChange([]);
        }
    };

    const handleSelectOne = (storyId: string, checked: boolean) => {
        if (checked) {
            onSelectionChange([...selectedIds, storyId]);
        } else {
            onSelectionChange(selectedIds.filter(id => id !== storyId));
        }
    };

    return (
        <div className="rounded-lg border overflow-hidden">
            <Table className="bg-white">
                <TableHeader className="bg-[#004272]">
                    <TableRow>
                        {canManage && (
                            <TableHead className="w-[40px]">
                                <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} className="border-white data-[state=checked]:bg-white data-[state=checked]:text-[#004272]" />
                            </TableHead>
                        )}
                        <TableHead className="w-[100px] font-bold text-white">ID</TableHead>
                        <TableHead className="font-bold text-white">Título</TableHead>
                        <TableHead className="font-bold text-white">Estado</TableHead>
                        <TableHead className="font-bold text-white">Épica</TableHead>
                        <TableHead className="font-bold text-white">Responsable</TableHead>
                        <TableHead className="font-bold text-white">Prioridad</TableHead>
                        <TableHead className="font-bold text-white">Fecha Inicio</TableHead>
                        <TableHead className="font-bold text-white">Fecha Fin</TableHead>
                        <TableHead className="w-[60px] font-bold text-white">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {stories.map(story => (
                        <StoryRow
                            key={story.id}
                            story={story}
                            allStories={allStories}
                            onEdit={onEditStory}
                            onDelete={onDeleteStory}
                            onEditTask={onEditTask}
                            onDeleteTask={onDeleteTask}
                            onCreateTask={onCreateTask}
                            onValidate={onValidate}
                            onViewDocument={onViewDocument}
                            onReassign={onReassign}
                            hasDocument={documentsIds?.includes(story.id)}
                            showCheckbox={canManage}
                            isSelected={selectedIds.includes(story.id)}
                            onSelectChange={(checked) => handleSelectOne(story.id, checked)}
                            canManage={canManage}
                            canManageTasks={canManageTasks}
                        />
                    ))}
                    {/* Fila para agregar nueva historia de usuario */}
                    {onAddStory && canManage && (
                        <TableRow
                            className="hover:bg-blue-50 cursor-pointer border-t-2 border-dashed border-gray-300"
                            onClick={onAddStory}
                        >
                            <TableCell colSpan={10} className="py-3">
                                <div className="flex items-center justify-center gap-2 text-[#018CD1] font-medium">
                                    <Plus className="h-4 w-4" />
                                    <span>Agregar historia de usuario</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

// ==================== COMPONENTE PRINCIPAL DEL BACKLOG ====================
function BacklogContent() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [project, setProject] = useState<Project | null>(null);
    const [activeTab, setActiveTab] = useState('Backlog');

    // Estados de datos
    const [sprintList, setSprintList] = useState<Sprint[]>(initialSprints);
    const [epicList, setEpicList] = useState<Epic[]>(initialEpics);
    const [allStories, setAllStories] = useState<UserStory[]>([...allUserStories]);
    const [selectedBacklogIds, setSelectedBacklogIds] = useState<string[]>([]);

    // Derivar backlogStories del estado unificado
    const backlogStories = allStories.filter(story => story.sprint === 'backlog' && story.type === 'Historia');

    // Función helper para obtener historias de un sprint
    const getStoriesForSprint = (sprintId: string) => {
        return allStories.filter(story => story.sprint === sprintId && story.type === 'Historia');
    };

    // Estados de UI
    const [showEpicsPanel, setShowEpicsPanel] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEpicFilters, setSelectedEpicFilters] = useState<string[]>([]);
    const [expandedEpics, setExpandedEpics] = useState<string[]>([]);

    // Estados de modales
    const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
    const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
    const [isEpicModalOpen, setIsEpicModalOpen] = useState(false);
    const [editingEpic, setEditingEpic] = useState<Epic | null>(null);
    const [isHUModalOpen, setIsHUModalOpen] = useState(false);
    const [editingHU, setEditingHU] = useState<UserStory | null>(null);
    const [targetSprintForNewHU, setTargetSprintForNewHU] = useState<Sprint | null>(null); // Sprint destino al crear HU desde un tablero sprint
    const [isAssignSprintModalOpen, setIsAssignSprintModalOpen] = useState(false);
    const [isReassignSprintModalOpen, setIsReassignSprintModalOpen] = useState(false);
    const [storyToReassign, setStoryToReassign] = useState<UserStory | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'sprint' | 'epic' | 'hu'; item: Sprint | Epic | UserStory } | null>(null);
    const [isDeleteSprintModalOpen, setIsDeleteSprintModalOpen] = useState(false);
    const [sprintToDelete, setSprintToDelete] = useState<Sprint | null>(null);

    // Estados para PROMPT 5: Validaciones y Estados
    const [notifications, setNotifications] = useState<SystemNotification[]>([]);
    const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([]);
    const [isValidateHUModalOpen, setIsValidateHUModalOpen] = useState(false);
    const [huToValidate, setHuToValidate] = useState<UserStory | null>(null);
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<GeneratedDocument | null>(null);
    const [isHURequiresTasksModalOpen, setIsHURequiresTasksModalOpen] = useState(false);

    const currentUser = user?.name || 'Scrum Master';

    // Determinar rol del usuario
    // PMO: solo puede filtrar e iniciar sprint
    // Scrum Master: puede gestionar sprints, HUs y tareas
    // Desarrollador: crear tareas, filtrar épicas, iniciar sprint, filtro de búsqueda
    const userRole = user?.role || 'SCRUM_MASTER';
    const isScrumMaster = userRole === ROLES.SCRUM_MASTER;
    const isPMO = userRole === ROLES.PMO;
    const isDeveloper = userRole === ROLES.DESARROLLADOR;

    // Permisos específicos por rol
    const canManageTasks = isScrumMaster || isDeveloper; // Crear/Editar/Eliminar tareas para HU (en Sprints)
    const canManageTasksInBacklog = isDeveloper; // Solo DESARROLLADOR puede crear tareas en Backlog
    const canManageHU = isScrumMaster; // SCRUM MASTER: Editar/Eliminar HU, Crear HU
    const canReassignHUInBacklog = false; // Reasignar HU deshabilitado en Backlog para SCRUM MASTER
    const canManageSprints = isScrumMaster; // Crear/Editar/Eliminar Sprint, Asignar Sprint
    const canManageEpics = isScrumMaster; // Crear/Editar/Eliminar Épicas
    const canInitiateSprint = isScrumMaster || isDeveloper || isPMO; // Iniciar Sprint (ir al tablero)

    // ==================== FUNCIONES DE VALIDACIÓN Y TRANSICIONES AUTOMÁTICAS ====================

    // Agregar notificación al sistema (local y al módulo de Notificaciones)
    const addNotification = (notification: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>) => {
        const newNotification: SystemNotification = {
            ...notification,
            id: `notif-${Date.now()}`,
            timestamp: new Date(),
            read: false,
        };
        setNotifications(prev => [newNotification, ...prev]);
    };

    // Guardar notificación en localStorage para el módulo de Notificaciones
    const saveNotificationToModule = (notifData: {
        type: 'hu_revision' | 'hu_validated' | 'hu_rejected';
        title: string;
        description: string;
        huId: string;
        status?: string;
    }) => {
        try {
            const projectName = project?.name || 'Proyecto';
            const projectId = project?.id || '1';

            // Obtener notificaciones existentes
            const existing = localStorage.getItem('backlogNotifications');
            const notifications = existing ? JSON.parse(existing) : [];

            // Verificar si ya existe una notificación pendiente para esta HU con el mismo tipo
            const alreadyExists = notifications.some((n: { huId?: string; type: string; read: boolean }) =>
                n.huId === notifData.huId &&
                n.type === notifData.type &&
                !n.read
            );

            // Si ya existe, no crear duplicado
            if (alreadyExists) {
                return;
            }

            const notification = {
                id: `backlog-notif-${Date.now()}-${notifData.huId}`,
                type: notifData.type,
                title: notifData.title,
                description: notifData.description,
                projectName: projectName,
                projectType: 'Proyecto' as const,
                status: notifData.status || 'En revisión',
                timestamp: new Date().toISOString(),
                read: false,
                projectId: projectId,
                huId: notifData.huId,
            };

            // Agregar nueva notificación
            notifications.unshift(notification);

            // Guardar en localStorage
            localStorage.setItem('backlogNotifications', JSON.stringify(notifications));
        } catch (error) {
            console.error('Error saving notification to module:', error);
        }
    };

    // Marcar notificación como leída
    const markNotificationAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    // Generar documento consolidado de evidencias
    const generateConsolidatedDocument = (hu: UserStory, tasks: UserStory[]): GeneratedDocument => {
        const document: GeneratedDocument = {
            id: `doc-${hu.id}-${Date.now()}`,
            huId: hu.id,
            huTitle: hu.title,
            tasks: tasks.map(task => ({
                id: task.id,
                title: task.title,
                evidences: task.attachments || ['evidencia_1.png', 'evidencia_2.jpg'], // Mock de evidencias
            })),
            generatedAt: new Date(),
            status: 'pendiente',
        };
        return document;
    };

    // Verificar si todas las tareas de una HU están finalizadas
    const checkAllTasksFinalized = (huId: string): boolean => {
        const tasks = allStories.filter(s => s.type === 'Tarea' && s.parentId === huId);
        if (tasks.length === 0) return false;
        return tasks.every(task => task.state === 'Finalizado');
    };

    // Verificar si una HU tiene tareas
    const huHasTasks = (huId: string): boolean => {
        return allStories.some(s => s.type === 'Tarea' && s.parentId === huId);
    };

    // Verificar si todas las HUs de un sprint están finalizadas
    const checkAllHUsFinalized = (sprintId: string): boolean => {
        const hus = allStories.filter(s => s.sprint === sprintId && s.type === 'Historia');
        if (hus.length === 0) return false;
        return hus.every(hu => hu.state === 'Finalizado');
    };

    // Transición automática: HU pasa a "Revisión" cuando todas sus tareas están finalizadas
    const handleTaskStateChange = (taskId: string, newState: UserStoryStatus, taskAttachments?: string[]) => {
        // Primero actualizar el estado de la tarea
        setAllStories(prev => {
            const updated = prev.map(s => s.id === taskId ? {
                ...s,
                state: newState,
                attachments: taskAttachments || s.attachments
            } : s);

            // Si la tarea cambió a "Finalizado", verificar si todas las tareas de la HU padre están finalizadas
            if (newState === 'Finalizado') {
                const task = updated.find(s => s.id === taskId);
                if (task?.parentId) {
                    const parentHU = updated.find(s => s.id === task.parentId);
                    const siblingTasks = updated.filter(s => s.type === 'Tarea' && s.parentId === task.parentId);
                    const allTasksFinalized = siblingTasks.every(t => t.state === 'Finalizado');

                    if (allTasksFinalized && parentHU && parentHU.state !== 'En revisión' && parentHU.state !== 'Finalizado') {
                        // Programar las actualizaciones adicionales para después del render
                        setTimeout(() => {
                            // Generar documento consolidado con las evidencias de las tareas
                            const document = generateConsolidatedDocument(parentHU, siblingTasks);
                            setGeneratedDocuments(prevDocs => [...prevDocs, document]);

                            // Notificar al Scrum Master (notificación local)
                            addNotification({
                                type: 'documento',
                                title: 'Documento de evidencias generado',
                                message: `Se ha generado el documento de evidencias para la HU ${parentHU.id}: ${parentHU.title}`,
                                itemId: parentHU.id,
                                itemType: 'hu',
                                destinatario: 'scrum_master',
                            });

                            // Guardar notificación en el módulo de Notificaciones (localStorage)
                            saveNotificationToModule({
                                type: 'hu_revision',
                                title: 'Historia de usuario lista para revisión',
                                description: `${parentHU.id}: ${parentHU.title} - Documento de evidencias generado`,
                                huId: parentHU.id,
                                status: 'En revisión',
                            });
                        }, 0);

                        // Cambiar estado de HU a "En revisión"
                        return updated.map(s => s.id === task.parentId ? { ...s, state: 'En revisión' as UserStoryStatus } : s);
                    }
                }
            }

            return updated;
        });
    };

    // Validar HU (Scrum Master aprueba)
    const handleValidateHU = () => {
        if (!huToValidate) return;

        const huId = huToValidate.id;
        const huTitle = huToValidate.title;
        const sprintId = huToValidate.sprint;

        // Cambiar estado de HU a "Finalizado"
        setAllStories(prev => {
            const updated = prev.map(s => s.id === huId ? { ...s, state: 'Finalizado' as UserStoryStatus } : s);

            // Verificar si todas las HUs del sprint están finalizadas
            const sprintHUs = updated.filter(s => s.sprint === sprintId && s.type === 'Historia');
            const allHUsFinalized = sprintHUs.every(hu => hu.state === 'Finalizado');

            if (allHUsFinalized && sprintId !== 'backlog') {
                // Programar actualización de sprint para después del render
                setTimeout(() => {
                    setSprintList(prevSprints => prevSprints.map(s =>
                        s.id === sprintId ? { ...s, status: 'Finalizado' as SprintStatus } : s
                    ));

                    // Notificar al PMO y Scrum Master
                    addNotification({
                        type: 'completitud',
                        title: 'Sprint completado',
                        message: `El sprint ha sido completado automáticamente`,
                        itemId: sprintId,
                        itemType: 'sprint',
                        destinatario: 'todos',
                    });
                }, 0);
            }

            return updated;
        });

        // Actualizar documento a aprobado
        setGeneratedDocuments(prev => prev.map(d =>
            d.huId === huId ? { ...d, status: 'aprobado' as const } : d
        ));

        // Notificación de validación completada
        addNotification({
            type: 'completitud',
            title: 'HU Validada',
            message: `La HU ${huId}: ${huTitle} ha sido validada y finalizada`,
            itemId: huId,
            itemType: 'hu',
            destinatario: 'desarrollador',
        });

        setHuToValidate(null);
        setIsValidateHUModalOpen(false);
    };

    // Rechazar HU (Scrum Master rechaza)
    const handleRejectHU = (reason: string) => {
        if (!huToValidate) return;

        const huId = huToValidate.id;

        // Cambiar estado de HU y sus tareas secundarias a "En progreso"
        setAllStories(prev => prev.map(s => {
            // Cambiar estado de la HU
            if (s.id === huId) {
                return { ...s, state: 'En progreso' as UserStoryStatus };
            }
            // Cambiar estado de las tareas secundarias de esta HU
            if (s.parentId === huId && s.type === 'Tarea') {
                return { ...s, state: 'En progreso' as UserStoryStatus };
            }
            return s;
        }));

        // Actualizar documento a rechazado
        setGeneratedDocuments(prev => prev.map(d =>
            d.huId === huId ? { ...d, status: 'rechazado' as const } : d
        ));

        // Notificar al desarrollador responsable
        addNotification({
            type: 'validacion',
            title: 'HU Rechazada',
            message: `La HU ${huToValidate.id}: ${huToValidate.title} ha sido rechazada. Motivo: ${reason}`,
            itemId: huId,
            itemType: 'hu',
            destinatario: 'desarrollador',
        });

        setHuToValidate(null);
        setIsValidateHUModalOpen(false);
    };

    // Abrir modal de validación para HU en revisión
    const handleOpenValidateHU = (hu: UserStory) => {
        setHuToValidate(hu);
        setIsValidateHUModalOpen(true);
    };

    // Ver documento generado de una HU
    const handleViewDocument = (huId: string) => {
        let document = generatedDocuments.find(d => d.huId === huId);

        // Si no existe el documento, generarlo on-demand
        if (!document) {
            const hu = allStories.find(s => s.id === huId && s.type === 'Historia');
            if (hu) {
                const tasks = allStories.filter(s => s.type === 'Tarea' && s.parentId === huId);
                document = generateConsolidatedDocument(hu, tasks);
                setGeneratedDocuments(prev => [...prev, document!]);
            }
        }

        if (document) {
            setSelectedDocument(document);
            setIsDocumentModalOpen(true);
        }
    };

    React.useEffect(() => {
        const savedProjectData = localStorage.getItem('selectedProject');
        if (savedProjectData) {
            setProject(JSON.parse(savedProjectData));
        } else {
            router.push(paths.poi.base);
        }

        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
    }, [searchParams, router]);

    const handleTabClick = (tabName: string) => {
        if (tabName === 'Tablero') router.push(paths.poi.proyecto.backlog.tablero);
        else if (tabName === 'Dashboard') router.push(paths.poi.proyecto.backlog.dashboard);
        else {
            setActiveTab(tabName);
            router.push(paths.poi.proyecto.backlog.base);
        }
    };

    // Filtrar historias
    const filterStories = (stories: UserStory[]) => {
        return stories.filter(story => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!story.title.toLowerCase().includes(query) && !story.id.toLowerCase().includes(query) && !story.responsible.toLowerCase().includes(query)) return false;
            }
            if (selectedEpicFilters.length > 0) {
                const storyEpicId = epicList.find(e => e.name === story.epic)?.id;
                if (!storyEpicId || !selectedEpicFilters.includes(storyEpicId)) return false;
            }
            return true;
        });
    };

    // Handlers de Sprint
    const handleSaveSprint = (data: Omit<Sprint, 'id'> & { id?: string }) => {
        if (data.id) {
            setSprintList(prev => prev.map(s => s.id === data.id ? { ...s, ...data } as Sprint : s));
        } else {
            const newSprint: Sprint = { ...data, id: `sprint${Date.now()}` } as Sprint;
            setSprintList(prev => [...prev, newSprint]);
        }
    };

    const handleDeleteSprint = (sprint: Sprint) => {
        setSprintToDelete(sprint);
        setIsDeleteSprintModalOpen(true);
    };

    // Obtener cantidad de HUs en un sprint
    const getSprintHUsCount = (sprintId: string): number => {
        return getStoriesForSprint(sprintId).length;
    };

    // Handler para mover HUs al backlog y eliminar sprint
    const handleMoveToBacklogAndDelete = () => {
        if (!sprintToDelete) return;
        // Mover HUs al backlog (cambiar sprint a 'backlog')
        setAllStories(prev => prev.map(story =>
            story.sprint === sprintToDelete.id ? { ...story, sprint: 'backlog' } : story
        ));
        // Eliminar el sprint
        setSprintList(prev => prev.filter(s => s.id !== sprintToDelete.id));
        setSprintToDelete(null);
        setIsDeleteSprintModalOpen(false);
    };

    // Handler para eliminar sprint y todas sus HUs
    const handleDeleteSprintAndHUs = () => {
        if (!sprintToDelete) return;
        // Eliminar las HUs del sprint
        setAllStories(prev => prev.filter(story => story.sprint !== sprintToDelete.id));
        // Eliminar el sprint
        setSprintList(prev => prev.filter(s => s.id !== sprintToDelete.id));
        setSprintToDelete(null);
        setIsDeleteSprintModalOpen(false);
    };

    // Handlers de Épica
    const handleSaveEpic = (data: Omit<Epic, 'id'> & { id?: string }) => {
        if (data.id) {
            setEpicList(prev => prev.map(e => e.id === data.id ? { ...e, ...data } as Epic : e));
        } else {
            const newEpic: Epic = { ...data, id: `epic${Date.now()}` } as Epic;
            setEpicList(prev => [...prev, newEpic]);
        }
    };

    const handleDeleteEpic = (epic: Epic) => {
        setDeleteTarget({ type: 'epic', item: epic });
        setIsDeleteModalOpen(true);
    };

    // Handlers de HU
    const handleSaveHU = (data: HUFormData, isEdit: boolean, targetSprintId?: string) => {
        // Convertir TaskFormData[] a SecondaryTask[] para guardar en la historia
        const tasksToSave = (data.tasks || []).map(task => ({
            title: task.title,
            description: task.description,
            responsible: task.responsible,
            state: task.state,
            priority: task.priority,
            startDate: task.startDate,
            endDate: task.endDate,
            points: task.points,
            informer: task.informer,
        }));

        if (isEdit && editingHU) {
            // Actualizar historia existente en el estado unificado
            setAllStories(prev => prev.map(story => {
                if (story.id === editingHU.id) {
                    return {
                        ...story,
                        title: data.title,
                        description: data.description,
                        epic: data.epic,
                        responsibles: data.responsibles,
                        responsible: data.responsibles[0] || story.responsible,
                        state: data.state,
                        priority: data.priority,
                        startDate: data.startDate,
                        endDate: data.endDate,
                        informer: data.informer,
                        points: data.points,
                        acceptanceCriteria: data.acceptanceCriteria,
                        commentsList: data.commentsList,
                        comments: data.commentsList?.length || story.comments,
                        tasks: tasksToSave,
                    };
                }
                return story;
            }));
        } else {
            // Generar ID secuencial para la nueva HU
            const generateHUId = (): string => {
                const existingHUIds = allStories
                    .filter(s => s.type === 'Historia' && s.id.startsWith('HU-'))
                    .map(s => {
                        const match = s.id.match(/^HU-(\d+)$/);
                        return match ? parseInt(match[1], 10) : 0;
                    });
                const maxId = existingHUIds.length > 0 ? Math.max(...existingHUIds) : 0;
                return `HU-${maxId + 1}`;
            };

            // Crear nueva historia en el estado unificado
            // Si hay targetSprintId, asignar al sprint; de lo contrario, ir al backlog
            const newStory: UserStory = {
                id: generateHUId(),
                title: data.title,
                description: data.description,
                epic: data.epic || 'Sin épica',
                responsible: data.responsibles[0] || '',
                responsibles: data.responsibles,
                state: data.state,
                priority: data.priority,
                startDate: data.startDate,
                endDate: data.endDate,
                type: 'Historia',
                sprint: targetSprintId || 'backlog',
                comments: data.commentsList?.length || 0,
                commentsList: data.commentsList,
                points: data.points,
                informer: data.informer,
                acceptanceCriteria: data.acceptanceCriteria,
                tasks: tasksToSave,
            };
            setAllStories(prev => [...prev, newStory]);
        }
        setEditingHU(null);
        setTargetSprintForNewHU(null); // Limpiar el sprint objetivo después de guardar
    };

    const handleEditStory = (story: UserStory) => {
        setEditingHU(story);
        setIsHUModalOpen(true);
    };

    const handleDeleteStory = (story: UserStory) => {
        setDeleteTarget({ type: 'hu', item: story });
        setIsDeleteModalOpen(true);
    };

    // Handler para abrir modal de reasignación
    const handleReassignStory = (story: UserStory) => {
        setStoryToReassign(story);
        setIsReassignSprintModalOpen(true);
    };

    // Handler para reasignar la HU a otro sprint o backlog
    const handleReassignToSprint = (storyId: string, newSprintId: string, deleteTasks?: boolean) => {
        setAllStories(prev => prev.map(story => {
            if (story.id === storyId) {
                // Si se está moviendo a backlog y tiene tareas, eliminarlas
                if (deleteTasks && newSprintId === 'backlog') {
                    return { ...story, sprint: newSprintId, tasks: [] };
                }
                return { ...story, sprint: newSprintId };
            }
            // También mover las tareas secundarias asociadas (solo si no se eliminan)
            if (story.parentId === storyId) {
                // Si se eliminan las tareas de Sprint a Backlog, no mover las tareas secundarias
                if (deleteTasks && newSprintId === 'backlog') {
                    return story; // Las tareas secundarias ya no están asociadas
                }
                return { ...story, sprint: newSprintId };
            }
            return story;
        }));
        setStoryToReassign(null);
    };

    // ==================== ESTADOS Y HANDLERS DE TAREAS ====================
    const [isStandaloneTaskModalOpen, setIsStandaloneTaskModalOpen] = useState(false);
    const [editingStandaloneTask, setEditingStandaloneTask] = useState<TaskFormData | null>(null);
    const [parentStoryForTask, setParentStoryForTask] = useState<UserStory | null>(null);
    const [isDeleteTaskModalOpen, setIsDeleteTaskModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<{ task: UserStory; parent: UserStory } | null>(null);

    // Abrir modal para crear tarea desde tabla
    const handleCreateTaskFromTable = (parentStory: UserStory) => {
        setParentStoryForTask(parentStory);
        setEditingStandaloneTask(null);
        setIsStandaloneTaskModalOpen(true);
    };

    // Abrir modal para editar tarea desde tabla
    const handleEditTaskFromTable = (task: UserStory, parentStory: UserStory) => {
        setParentStoryForTask(parentStory);
        // Convertir UserStory a TaskFormData
        const taskData: TaskFormData = {
            title: task.title,
            description: task.description || '',
            responsible: task.responsible,
            state: task.state,
            priority: task.priority,
            startDate: task.startDate,
            endDate: task.endDate,
            points: task.points || 0,
            informer: task.informer,
            attachments: [],
            comments: [],
            history: [],
        };
        setEditingStandaloneTask(taskData);
        setIsStandaloneTaskModalOpen(true);
    };

    // Abrir modal para confirmar eliminación de tarea
    const handleDeleteTaskFromTable = (task: UserStory, parentStory: UserStory) => {
        setTaskToDelete({ task, parent: parentStory });
        setIsDeleteTaskModalOpen(true);
    };

    // Confirmar eliminación de tarea
    const confirmDeleteTask = () => {
        if (taskToDelete) {
            setAllStories(prev => prev.filter(s => s.id !== taskToDelete.task.id));
            setTaskToDelete(null);
            setIsDeleteTaskModalOpen(false);
        }
    };

    // Guardar tarea desde modal standalone
    const handleSaveStandaloneTask = (taskData: TaskFormData) => {
        if (!parentStoryForTask) return;

        if (editingStandaloneTask) {
            // Actualizar tarea existente
            // Buscar la tarea por título (ya que no tenemos el ID en TaskFormData)
            const existingTask = allStories.find(
                s => s.type === 'Tarea' &&
                    s.parentId === parentStoryForTask.id &&
                    s.title === editingStandaloneTask.title
            );

            if (existingTask) {
                // Si el estado cambió a Finalizado, usar handleTaskStateChange
                if (taskData.state === 'Finalizado' && existingTask.state !== 'Finalizado') {
                    handleTaskStateChange(existingTask.id, 'Finalizado', taskData.attachments?.map(a => a.name));
                } else {
                    // Actualizar normalmente
                    setAllStories(prev => prev.map(s =>
                        s.id === existingTask.id ? {
                            ...s,
                            title: taskData.title,
                            description: taskData.description,
                            state: taskData.state,
                            responsible: taskData.responsible,
                            priority: taskData.priority,
                            startDate: taskData.startDate,
                            endDate: taskData.endDate,
                            points: taskData.points,
                            attachments: taskData.attachments?.map(a => a.name),
                        } : s
                    ));
                }
            }
        } else {
            // Crear nueva tarea con ID secuencial
            const newTaskId = getNextTaskId(allStories);
            const newTask: UserStory = {
                id: newTaskId,
                title: taskData.title,
                description: taskData.description,
                state: taskData.state,
                epic: parentStoryForTask.epic,
                responsible: taskData.responsible,
                priority: taskData.priority,
                startDate: taskData.startDate,
                endDate: taskData.endDate,
                type: 'Tarea',
                sprint: parentStoryForTask.sprint,
                comments: 0,
                points: taskData.points,
                parentId: parentStoryForTask.id,
                informer: taskData.informer,
                attachments: taskData.attachments?.map(a => a.name),
            };

            // Si la tarea se crea directamente como Finalizado, verificar que tenga evidencias
            if (taskData.state === 'Finalizado') {
                // Agregar y luego verificar transiciones
                setAllStories(prev => {
                    const updated = [...prev, newTask];

                    // Verificar si todas las tareas están finalizadas
                    const siblingTasks = updated.filter(s => s.type === 'Tarea' && s.parentId === parentStoryForTask.id);
                    const allTasksFinalized = siblingTasks.every(t => t.state === 'Finalizado');

                    if (allTasksFinalized) {
                        const parentHU = updated.find(s => s.id === parentStoryForTask.id);
                        if (parentHU && parentHU.state !== 'En revisión' && parentHU.state !== 'Finalizado') {
                            // Programar las actualizaciones adicionales para después del render
                            setTimeout(() => {
                                // Generar documento y notificar
                                const document = generateConsolidatedDocument(parentHU, siblingTasks);
                                setGeneratedDocuments(prevDocs => [...prevDocs, document]);

                                addNotification({
                                    type: 'documento',
                                    title: 'Documento de evidencias generado',
                                    message: `Se ha generado el documento de evidencias para la HU ${parentHU.id}: ${parentHU.title}`,
                                    itemId: parentHU.id,
                                    itemType: 'hu',
                                    destinatario: 'scrum_master',
                                });

                                saveNotificationToModule({
                                    type: 'hu_revision',
                                    title: 'Historia de usuario lista para revisión',
                                    description: `${parentHU.id}: ${parentHU.title} - Documento de evidencias generado`,
                                    huId: parentHU.id,
                                    status: 'En revisión',
                                });
                            }, 0);

                            return updated.map(s => s.id === parentStoryForTask.id ? { ...s, state: 'En revisión' as UserStoryStatus } : s);
                        }
                    }
                    return updated;
                });
            } else {
                setAllStories(prev => [...prev, newTask]);
            }
        }
        setParentStoryForTask(null);
        setEditingStandaloneTask(null);
        setIsStandaloneTaskModalOpen(false);
    };

    // Handler de asignación a sprint
    const handleAssignToSprint = (sprintId: string, storyIds: string[]) => {
        // Mover las historias del backlog al sprint asignado
        setAllStories(prev => prev.map(story =>
            storyIds.includes(story.id) ? { ...story, sprint: sprintId } : story
        ));
        setSelectedBacklogIds([]);
    };

    // Confirmar eliminación
    const confirmDelete = () => {
        if (!deleteTarget) return;
        if (deleteTarget.type === 'sprint') {
            setSprintList(prev => prev.filter(s => s.id !== (deleteTarget.item as Sprint).id));
        } else if (deleteTarget.type === 'epic') {
            setEpicList(prev => prev.filter(e => e.id !== (deleteTarget.item as Epic).id));
        } else if (deleteTarget.type === 'hu') {
            setAllStories(prev => prev.filter(s => s.id !== (deleteTarget.item as UserStory).id));
        }
        setDeleteTarget(null);
    };

    if (!project) {
        return <div className="flex h-screen w-full items-center justify-center">Cargando...</div>;
    }

    const projectCode = `PROY N°${project.id}`;
    // DESARROLLADOR no puede ir a Detalles, así que los breadcrumbs son diferentes
    const breadcrumbs = isDeveloper
        ? [{ label: 'POI', href: paths.poi.base }, { label: 'Backlog' }]
        : [{ label: 'POI', href: paths.poi.base }, { label: 'Proyecto', href: paths.poi.proyecto.detalles }, { label: 'Backlog' }];
    const filteredBacklog = filterStories(backlogStories);
    const selectedStoriesForAssign = backlogStories.filter(s => selectedBacklogIds.includes(s.id));

    const secondaryHeader = (
        <div className="bg-[#D5D5D5] border-b border-t border-[#1A5581]">
            <div className="p-2 flex items-center justify-between w-full">
                <h2 className="font-bold text-black pl-2">{projectCode}: {project.name}</h2>
            </div>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs} secondaryHeader={secondaryHeader}>
            {/* Tabs de navegación */}
            <div className="flex items-center gap-2 p-4 bg-[#F9F9F9]">
                <Button size="sm" onClick={() => handleTabClick('Backlog')} className={cn(activeTab === 'Backlog' ? 'bg-[#018CD1] text-white hover:bg-[#0179b5]' : 'bg-white text-black border-gray-300 hover:bg-gray-100')} variant={activeTab === 'Backlog' ? 'default' : 'outline'}>Backlog</Button>
                <Button size="sm" onClick={() => handleTabClick('Tablero')} className="bg-white text-black border-gray-300 hover:bg-gray-100" variant="outline">Tablero</Button>
                <Button size="sm" onClick={() => handleTabClick('Dashboard')} className="bg-white text-black border-gray-300 hover:bg-gray-100" variant="outline">Dashboard</Button>
            </div>

            <div className="flex-1 flex flex-col bg-[#F9F9F9] px-4 pb-4">
                {activeTab === 'Backlog' && (
                    <div className="flex-1 flex flex-col gap-4">
                        {/* Barra de herramientas */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Buscar en el backlog"
                                        className="pl-10 bg-white w-72"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="bg-white">
                                            Épica {selectedEpicFilters.length > 0 && `(${selectedEpicFilters.length})`}
                                            <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="p-0 w-60">
                                        <div className="p-2">
                                            <p className="text-sm font-semibold p-2">Filtrar por épica</p>
                                            <div className="space-y-2 px-2">
                                                {epicList.filter(e => e.id !== 'no-epic').map(epic => (
                                                    <div key={epic.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={epic.id}
                                                            checked={selectedEpicFilters.includes(epic.id)}
                                                            onCheckedChange={() => {
                                                                setSelectedEpicFilters(prev =>
                                                                    prev.includes(epic.id) ? prev.filter(id => id !== epic.id) : [...prev, epic.id]
                                                                );
                                                            }}
                                                        />
                                                        <label htmlFor={epic.id} className="text-sm font-medium">{epic.name}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <Separator />
                                        <div className="p-2 flex items-center space-x-2">
                                            <Switch id="manage-epics" onCheckedChange={setShowEpicsPanel} checked={showEpicsPanel} />
                                            <label htmlFor="manage-epics" className="text-sm">Mostrar épicas</label>
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                {(searchQuery || selectedEpicFilters.length > 0) && (
                                    <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setSelectedEpicFilters([]); }} className="text-[#018CD1]">
                                        Limpiar filtros
                                    </Button>
                                )}
                            </div>

                            <Button
                                variant="outline"
                                size="icon"
                                className="bg-[#018CD1] text-white hover:bg-[#0179b5] h-8 w-8"
                                onClick={() => setIsInfoModalOpen(true)}
                            >
                                <Info className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Contenido principal con panel de épicas */}
                        <div className="flex-1 flex items-start gap-4">
                            {/* Panel de Épicas */}
                            {showEpicsPanel && (
                                <div className="w-80 sticky top-4 bg-white rounded-lg border shadow-sm">
                                    <div className="flex justify-between items-center p-4 border-b">
                                        <h3 className="font-bold text-lg">Épicas</h3>
                                        <Button variant="ghost" size="icon" onClick={() => setShowEpicsPanel(false)} className="h-6 w-6">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <ScrollArea className="max-h-[400px]">
                                        <div className="p-4 space-y-2">
                                            {epicList.filter(e => e.id !== 'no-epic').length === 0 ? (
                                                <div className="text-center py-8 text-gray-500">
                                                    <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                                    <p>No hay épicas creadas</p>
                                                </div>
                                            ) : (
                                                epicList.filter(e => e.id !== 'no-epic').map(epic => (
                                                    <Collapsible
                                                        key={epic.id}
                                                        open={expandedEpics.includes(epic.id)}
                                                        onOpenChange={(open) => {
                                                            setExpandedEpics(prev => open ? [...prev, epic.id] : prev.filter(id => id !== epic.id));
                                                        }}
                                                    >
                                                        <div className="border rounded-md">
                                                            <div className="flex items-center justify-between p-3">
                                                                <CollapsibleTrigger asChild>
                                                                    <button className="flex items-center gap-2 flex-1 text-left">
                                                                        {expandedEpics.includes(epic.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                                        <span className="font-medium text-sm">{epic.name}</span>
                                                                    </button>
                                                                </CollapsibleTrigger>
                                                                {canManageEpics && (
                                                                    <DropdownMenu modal={false}>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <button className="p-1 hover:bg-gray-100 rounded">
                                                                                <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                                                            </button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            <DropdownMenuItem onClick={() => setTimeout(() => handleDeleteEpic(epic), 0)} className="text-red-600">
                                                                                Eliminar
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                )}
                                                            </div>
                                                            <CollapsibleContent>
                                                                <div className="px-3 pb-3 pt-0 space-y-2 text-sm text-gray-600">
                                                                    <div className="flex justify-between">
                                                                        <span>Inicio:</span>
                                                                        <span>{epic.startDate || '-'}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span>Fin:</span>
                                                                        <span>{epic.endDate || '-'}</span>
                                                                    </div>
                                                                    {canManageEpics && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="w-full mt-2"
                                                                            onClick={() => { setEditingEpic(epic); setIsEpicModalOpen(true); }}
                                                                        >
                                                                            <Pencil className="h-3 w-3 mr-1" /> Editar
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </CollapsibleContent>
                                                        </div>
                                                    </Collapsible>
                                                ))
                                            )}
                                        </div>
                                    </ScrollArea>
                                    {canManageEpics && (
                                        <div className="p-4 border-t">
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                onClick={() => { setEditingEpic(null); setIsEpicModalOpen(true); }}
                                            >
                                                <Plus className="h-4 w-4 mr-2" /> Crear Épica
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Área principal de sprints y backlog */}
                            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-280px)] space-y-4">
                                {/* Tableros de Sprint */}
                                {sprintList.map((sprint) => {
                                    const sprintStories = filterStories(getStoriesForSprint(sprint.id));
                                    return (
                                        <div key={sprint.id} className="bg-white rounded-lg border">
                                            <Collapsible defaultOpen>
                                                <div className="flex items-center justify-between p-4 border-b">
                                                    <CollapsibleTrigger asChild>
                                                        <div className="flex items-center gap-2 cursor-pointer">
                                                            <ChevronDown className="h-5 w-5" />
                                                            <h3 className="font-semibold">Tablero {sprint.name} | {toDisplayDateFormat(sprint.startDate)} - {toDisplayDateFormat(sprint.endDate)}</h3>
                                                            <Badge className={cn(sprintStatusColors[sprint.status], 'ml-2')}>{sprint.status}</Badge>
                                                            <Badge variant="outline" className="ml-2">{sprintStories.length} elementos</Badge>
                                                        </div>
                                                    </CollapsibleTrigger>
                                                    <div className="flex items-center gap-2">
                                                        {/* Iniciar Sprint - visible para PMO y Scrum Master */}
                                                        <Button size="sm" className="bg-[#018CD1] hover:bg-[#0179b5]" onClick={() => handleTabClick('Tablero')}>
                                                            Iniciar Sprint
                                                        </Button>
                                                        {/* Editar/Eliminar Sprint - solo Scrum Master */}
                                                        {canManageSprints && (
                                                            <DropdownMenu modal={false}>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal /></Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => setTimeout(() => { setEditingSprint(sprint); setIsSprintModalOpen(true); }, 0)}>Editar</DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => setTimeout(() => handleDeleteSprint(sprint), 0)} className="text-red-600">Eliminar</DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}
                                                    </div>
                                                </div>
                                                <CollapsibleContent>
                                                    <div className="p-4">
                                                        {sprintStories.length > 0 ? (
                                                            <SprintTable
                                                                stories={sprintStories}
                                                                allStories={allStories}
                                                                onEditStory={handleEditStory}
                                                                onDeleteStory={handleDeleteStory}
                                                                onEditTask={canManageTasks ? handleEditTaskFromTable : undefined}
                                                                onDeleteTask={canManageTasks ? handleDeleteTaskFromTable : undefined}
                                                                onCreateTask={canManageTasks ? handleCreateTaskFromTable : undefined}
                                                                onValidate={canManageHU ? handleOpenValidateHU : undefined}
                                                                onViewDocument={handleViewDocument}
                                                                onReassign={canManageHU ? handleReassignStory : undefined}
                                                                onAddStory={canManageHU ? () => { setEditingHU(null); setTargetSprintForNewHU(sprint); setIsHUModalOpen(true); } : undefined}
                                                                documentsIds={generatedDocuments.map(d => d.huId)}
                                                                canManage={canManageHU}
                                                                canManageTasks={canManageTasks}
                                                            />
                                                        ) : (
                                                            <div className="text-center text-gray-500 py-8 border rounded-lg bg-gray-50">
                                                                <p>No hay historias de usuario asignadas</p>
                                                                {canManageHU && (
                                                                    <Button
                                                                        variant="link"
                                                                        className="mt-2 text-[#018CD1]"
                                                                        onClick={() => { setEditingHU(null); setTargetSprintForNewHU(sprint); setIsHUModalOpen(true); }}
                                                                    >
                                                                        <Plus className="h-4 w-4 mr-1" /> Agregar historia de usuario
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        </div>
                                    );
                                })}

                                {/* Sección Backlog */}
                                <div className="bg-white rounded-lg border">
                                    <Collapsible defaultOpen>
                                        <div className="flex items-center justify-between p-4 border-b">
                                            <CollapsibleTrigger asChild>
                                                <div className="flex items-center gap-2 cursor-pointer">
                                                    <ChevronDown className="h-5 w-5" />
                                                    <h3 className="font-bold text-lg">Backlog</h3>
                                                    <Badge variant="outline" className="ml-2">{filteredBacklog.length} elementos</Badge>
                                                </div>
                                            </CollapsibleTrigger>
                                            {(canManageSprints || canManageHU) && (
                                                <div className="flex items-center gap-2">
                                                    {canManageSprints && (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => { setEditingSprint(null); setIsSprintModalOpen(true); }}
                                                            >
                                                                Crear Sprint
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={selectedBacklogIds.length === 0}
                                                                onClick={() => setIsAssignSprintModalOpen(true)}
                                                            >
                                                                Asignar Sprint {selectedBacklogIds.length > 0 && `(${selectedBacklogIds.length})`}
                                                            </Button>
                                                        </>
                                                    )}
                                                    {canManageHU && (
                                                        <Button
                                                            size="sm"
                                                            className="bg-[#018CD1] hover:bg-[#0179b5]"
                                                            onClick={() => { setEditingHU(null); setTargetSprintForNewHU(null); setIsHUModalOpen(true); }}
                                                        >
                                                            <Plus className="h-4 w-4 mr-1" /> Agregar historia de usuario
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <CollapsibleContent>
                                            <div className="p-4">
                                                {filteredBacklog.length > 0 ? (
                                                    <BacklogTable
                                                        stories={filteredBacklog}
                                                        allStories={allStories}
                                                        onEditStory={handleEditStory}
                                                        onDeleteStory={handleDeleteStory}
                                                        onEditTask={canManageTasksInBacklog ? handleEditTaskFromTable : undefined}
                                                        onDeleteTask={canManageTasksInBacklog ? handleDeleteTaskFromTable : undefined}
                                                        onCreateTask={canManageTasksInBacklog ? handleCreateTaskFromTable : undefined}
                                                        onValidate={canManageHU ? handleOpenValidateHU : undefined}
                                                        onViewDocument={handleViewDocument}
                                                        onReassign={canReassignHUInBacklog ? handleReassignStory : undefined}
                                                        onAddStory={canManageHU ? () => { setEditingHU(null); setTargetSprintForNewHU(null); setIsHUModalOpen(true); } : undefined}
                                                        documentsIds={generatedDocuments.map(d => d.huId)}
                                                        selectedIds={selectedBacklogIds}
                                                        onSelectionChange={setSelectedBacklogIds}
                                                        canManage={canManageHU}
                                                        canManageTasks={canManageTasksInBacklog}
                                                    />
                                                ) : (
                                                    <div className="text-center text-gray-500 py-12 border rounded-lg bg-gray-50">
                                                        <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                                        <p className="text-lg">El backlog está vacío</p>
                                                        <p className="text-sm mt-2">Agrega historias de usuario para comenzar</p>
                                                        {canManageHU && (
                                                            <Button
                                                                variant="link"
                                                                className="mt-4 text-[#018CD1]"
                                                                onClick={() => { setEditingHU(null); setTargetSprintForNewHU(null); setIsHUModalOpen(true); }}
                                                            >
                                                                <Plus className="h-4 w-4 mr-1" /> Agregar historia de usuario
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modales */}
            <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />

            <SprintModal
                isOpen={isSprintModalOpen}
                onClose={() => { setIsSprintModalOpen(false); setEditingSprint(null); }}
                sprint={editingSprint}
                onSave={handleSaveSprint}
                nextSprintNumber={sprintList.length + 1}
                existingSprints={sprintList}
                lastSprintEndDate={sprintList.length > 0
                    ? sprintList.reduce((latest, sprint) => {
                        if (!latest) return sprint.endDate;
                        const latestDate = parseDateString(latest);
                        const sprintDate = parseDateString(sprint.endDate);
                        if (!latestDate || !sprintDate) return latest;
                        return sprintDate > latestDate ? sprint.endDate : latest;
                    }, sprintList[0].endDate)
                    : undefined}
            />

            <EpicModal
                isOpen={isEpicModalOpen}
                onClose={() => { setIsEpicModalOpen(false); setEditingEpic(null); }}
                epic={editingEpic}
                onSave={handleSaveEpic}
                currentUser={currentUser}
            />

            <UserStoryModal
                isOpen={isHUModalOpen}
                onClose={() => { setIsHUModalOpen(false); setEditingHU(null); setTargetSprintForNewHU(null); }}
                story={editingHU}
                onSave={handleSaveHU}
                currentUser={currentUser}
                epics={epicList}
                allStories={allStories}
                targetSprint={targetSprintForNewHU}
            />

            <AssignSprintModal
                isOpen={isAssignSprintModalOpen}
                onClose={() => setIsAssignSprintModalOpen(false)}
                selectedStories={selectedStoriesForAssign}
                sprints={sprintList}
                onAssign={handleAssignToSprint}
            />

            <ReassignSprintModal
                isOpen={isReassignSprintModalOpen}
                onClose={() => { setIsReassignSprintModalOpen(false); setStoryToReassign(null); }}
                story={storyToReassign}
                sprints={sprintList}
                onReassign={handleReassignToSprint}
            />

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setDeleteTarget(null); }}
                onConfirm={confirmDelete}
                title={
                    deleteTarget?.type === 'epic' ? 'Eliminar Épica' : 'Eliminar Historia de Usuario'
                }
                itemName={
                    deleteTarget?.type === 'epic' ? (deleteTarget.item as Epic).name :
                        (deleteTarget?.item as UserStory)?.title || ''
                }
                extraMessage={
                    deleteTarget?.type === 'hu' && storyHasTasks((deleteTarget.item as UserStory).id)
                        ? `Esta HU contiene tareas secundarias que también serán eliminadas.`
                        : undefined
                }
            />

            <DeleteSprintModal
                isOpen={isDeleteSprintModalOpen}
                onClose={() => { setIsDeleteSprintModalOpen(false); setSprintToDelete(null); }}
                sprint={sprintToDelete}
                husCount={sprintToDelete ? getSprintHUsCount(sprintToDelete.id) : 0}
                onMoveToBacklogAndDelete={handleMoveToBacklogAndDelete}
                onDeleteAll={handleDeleteSprintAndHUs}
            />

            {/* Modal de Tarea Secundaria desde Tabla */}
            <TaskModal
                isOpen={isStandaloneTaskModalOpen}
                onClose={() => { setIsStandaloneTaskModalOpen(false); setEditingStandaloneTask(null); setParentStoryForTask(null); }}
                task={editingStandaloneTask}
                onSave={handleSaveStandaloneTask}
                parentHU={parentStoryForTask ? {
                    id: parentStoryForTask.id,
                    title: parentStoryForTask.title,
                    startDate: parentStoryForTask.startDate,
                    endDate: parentStoryForTask.endDate,
                    responsibles: parentStoryForTask.responsibles || [parentStoryForTask.responsible],
                } : undefined}
                currentUser={currentUser}
            />

            {/* Modal de Confirmación para Eliminar Tarea */}
            <DeleteTaskConfirmModal
                isOpen={isDeleteTaskModalOpen}
                onClose={() => { setIsDeleteTaskModalOpen(false); setTaskToDelete(null); }}
                taskName={taskToDelete?.task?.title || ''}
                attachmentsCount={0}
                onConfirm={confirmDeleteTask}
            />

            {/* Modal de Validación de HU */}
            <ValidateHUModal
                isOpen={isValidateHUModalOpen}
                onClose={() => { setIsValidateHUModalOpen(false); setHuToValidate(null); }}
                hu={huToValidate}
                onValidate={handleValidateHU}
                onReject={handleRejectHU}
            />

            {/* Modal de Documento Generado */}
            <GeneratedDocumentModal
                isOpen={isDocumentModalOpen}
                onClose={() => { setIsDocumentModalOpen(false); setSelectedDocument(null); }}
                document={selectedDocument}
            />

            {/* Modal de HU Requiere Tareas */}
            <HURequiresTasksModal
                isOpen={isHURequiresTasksModalOpen}
                onClose={() => setIsHURequiresTasksModalOpen(false)}
            />
        </AppLayout>
    );
}

export default function BacklogPage() {
    return (
        <React.Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Cargando...</div>}>
            <BacklogContent />
        </React.Suspense>
    );
}
