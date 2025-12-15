"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    MoreHorizontal,
    Plus,
    Calendar,
    Bookmark,
    MessageSquare,
    X,
    Pencil,
    Trash2,
    Upload,
    Download,
    AlertTriangle,
    Send,
    Reply,
    Clock,
    User,
    FileImage,
    GripVertical,
    Play,
    Square,
    ChevronDown,
} from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Project, ROLES, MODULES } from '@/lib/definitions';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { paths } from '@/lib/paths';
import { useAuth } from '@/stores';
import { ProtectedRoute } from '@/features/auth';
import {
    sprints as initialSprints,
    epics as initialEpics,
    availableResponsibles,
    allUserStories,
    statusColors,
    priorityColors,
    type UserStory,
    type UserStoryStatus,
    type Priority,
    type Sprint,
    type SprintStatus,
    type Epic,
} from '@/lib/backlog-data';

// ==================== TIPOS ====================
type KanbanColumn = {
    id: string;
    title: string;
    status: UserStoryStatus;
    isCustom?: boolean;
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

type TaskAttachment = {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
};

type HUFormData = {
    id?: string;
    title: string;
    description: string;
    epic: string;
    responsible: string;
    responsibles?: string[];
    state: UserStoryStatus;
    priority: Priority;
    startDate: string;
    endDate: string;
    points: number;
    informer?: string;
    acceptanceCriteria?: string[];
    attachments?: TaskAttachment[];
    comments?: TaskComment[];
};

// ==================== HELPERS ====================
const parseDateString = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    if (dateStr.includes('-') && dateStr.length === 10) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) return date;
    }
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

const toInputDateFormat = (dateStr: string): string => {
    if (!dateStr) return '';
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
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

const toDisplayDateFormat = (dateStr: string): string => {
    if (!dateStr) return '';
    if (dateStr.includes('/')) return dateStr;
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }
    return dateStr;
};

const getNextHUId = (stories: UserStory[]): string => {
    const huIds = stories
        .filter(s => s.type === 'Historia' && s.id.startsWith('HU-'))
        .map(s => {
            const numPart = s.id.replace('HU-', '');
            const num = parseInt(numPart, 10);
            return isNaN(num) ? 0 : num;
        });
    const maxId = huIds.length > 0 ? Math.max(...huIds) : 0;
    return `HU-${maxId + 1}`;
};

// ==================== MODAL DE CONFIRMACIÓN DE ELIMINACIÓN ====================
function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
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
                        <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-600">{message}</p>
                    <DialogFooter className="flex gap-3 w-full mt-4">
                        <Button variant="outline" onClick={onClose} className="flex-1">
                            Cancelar
                        </Button>
                        <Button onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                            Sí, eliminar
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ==================== MODAL DE AGREGAR COLUMNA ====================
function AddColumnModal({
    isOpen,
    onClose,
    onSave,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
}) {
    const [columnName, setColumnName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setColumnName('');
            setError('');
        }
    }, [isOpen]);

    const handleSave = () => {
        if (!columnName.trim()) {
            setError('El nombre de la columna es obligatorio');
            return;
        }
        onSave(columnName.trim());
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md" showCloseButton={false}>
                <DialogHeader className="bg-[#004272] text-white p-4 -m-6 mb-4 rounded-t-lg">
                    <DialogTitle>Agregar Columna</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    <div>
                        <Label className="text-sm font-medium">
                            Nombre de la columna <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            placeholder="ej: En pruebas"
                            value={columnName}
                            onChange={(e) => setColumnName(e.target.value)}
                            className={cn("mt-1", error && "border-red-500")}
                        />
                        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                    </div>
                </div>
                <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} className="bg-[#018CD1] hover:bg-[#018CD1]/90">
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ==================== MODAL DE CERRAR SPRINT ====================
function CloseSprintModal({
    isOpen,
    onClose,
    onConfirm,
    sprintName,
    pendingHUs,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    sprintName: string;
    pendingHUs: number;
}) {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-6" showCloseButton={false}>
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-yellow-600" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Cerrar {sprintName}</DialogTitle>
                    </DialogHeader>
                    {pendingHUs > 0 ? (
                        <p className="text-gray-600">
                            Hay <span className="font-bold text-red-600">{pendingHUs} historias de usuario</span> sin finalizar.
                            Estas serán movidas al backlog. ¿Desea continuar?
                        </p>
                    ) : (
                        <p className="text-gray-600">
                            ¿Está seguro que desea cerrar este sprint? Esta acción no se puede deshacer.
                        </p>
                    )}
                    <DialogFooter className="flex gap-3 w-full mt-4">
                        <Button variant="outline" onClick={onClose} className="flex-1">
                            Cancelar
                        </Button>
                        <Button onClick={onConfirm} className="flex-1 bg-[#018CD1] hover:bg-[#018CD1]/90 text-white">
                            Cerrar Sprint
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ==================== MODAL DE HU (CREAR/EDITAR) ====================
function HUModal({
    isOpen,
    onClose,
    hu,
    onSave,
    defaultState,
    sprints,
    selectedSprintId,
    epics,
}: {
    isOpen: boolean;
    onClose: () => void;
    hu: UserStory | null;
    onSave: (data: HUFormData) => void;
    defaultState: UserStoryStatus;
    sprints: Sprint[];
    selectedSprintId: string;
    epics: Epic[];
}) {
    const isEditing = hu !== null;
    const [formData, setFormData] = useState<HUFormData>({
        title: '',
        description: '',
        epic: 'Sin épica',
        responsible: '',
        state: defaultState,
        priority: 'Media',
        startDate: '',
        endDate: '',
        points: 0,
        acceptanceCriteria: [''],
    });
    const [errors, setErrors] = useState<{ title?: string; description?: string; responsible?: string; startDate?: string; endDate?: string; dates?: string }>({});
    const [responsibleSearch, setResponsibleSearch] = useState('');
    const [showResponsibleDropdown, setShowResponsibleDropdown] = useState(false);

    useEffect(() => {
        if (hu) {
            setFormData({
                id: hu.id,
                title: hu.title,
                description: hu.description || '',
                epic: hu.epic,
                responsible: hu.responsible,
                responsibles: hu.responsibles,
                state: hu.state,
                priority: hu.priority,
                startDate: toInputDateFormat(hu.startDate),
                endDate: toInputDateFormat(hu.endDate),
                points: hu.points || 0,
                acceptanceCriteria: hu.acceptanceCriteria || [''],
            });
        } else {
            setFormData({
                title: '',
                description: '',
                epic: 'Sin épica',
                responsible: '',
                state: defaultState,
                priority: 'Media',
                startDate: '',
                endDate: '',
                points: 0,
                acceptanceCriteria: [''],
            });
        }
        setErrors({});
        setResponsibleSearch('');
    }, [hu, isOpen, defaultState]);

    const filteredResponsibles = availableResponsibles.filter(
        r => r.toLowerCase().includes(responsibleSearch.toLowerCase())
    );

    const selectResponsible = (name: string) => {
        setFormData(prev => ({ ...prev, responsible: name }));
        setResponsibleSearch('');
        setShowResponsibleDropdown(false);
    };

    const validateForm = (): boolean => {
        const newErrors: typeof errors = {};
        if (!formData.title.trim()) {
            newErrors.title = 'El título es obligatorio';
        }
        if (!formData.description?.trim()) {
            newErrors.description = 'La descripción es obligatoria';
        }
        if (!formData.responsible) {
            newErrors.responsible = 'Debe seleccionar un responsable';
        }
        if (!formData.startDate) {
            newErrors.startDate = 'La fecha de inicio es obligatoria';
        }
        if (!formData.endDate) {
            newErrors.endDate = 'La fecha de fin es obligatoria';
        }
        if (formData.startDate && formData.endDate) {
            const start = parseDateString(formData.startDate);
            const end = parseDateString(formData.endDate);
            if (start && end && end < start) {
                newErrors.dates = 'La fecha fin no puede ser anterior a la fecha inicio';
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validateForm()) {
            onSave(formData);
            onClose();
        }
    };

    const addCriterion = () => {
        setFormData(prev => ({
            ...prev,
            acceptanceCriteria: [...(prev.acceptanceCriteria || []), ''],
        }));
    };

    const updateCriterion = (index: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            acceptanceCriteria: prev.acceptanceCriteria?.map((c, i) => i === index ? value : c),
        }));
    };

    const removeCriterion = (index: number) => {
        setFormData(prev => ({
            ...prev,
            acceptanceCriteria: prev.acceptanceCriteria?.filter((_, i) => i !== index),
        }));
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden" showCloseButton={false}>
                <DialogHeader className="p-4 bg-[#004272] text-white flex flex-row items-center justify-between">
                    <DialogTitle className="text-lg font-bold">
                        {isEditing ? 'Editar Historia de Usuario' : 'Nueva Historia de Usuario'}
                    </DialogTitle>
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white h-8 w-8">
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogClose>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-140px)]">
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Título */}
                            <div className="col-span-2">
                                <Label className="text-sm font-medium">
                                    Título <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    placeholder="ej: Implementación del módulo..."
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className={cn("mt-1", errors.title && "border-red-500")}
                                />
                                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                            </div>

                            {/* Descripción */}
                            <div className="col-span-2">
                                <Label className="text-sm font-medium">
                                    Descripción <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    placeholder="Como [rol], necesito [funcionalidad] para [beneficio]..."
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className={cn("mt-1 min-h-[80px]", errors.description && "border-red-500")}
                                />
                                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                            </div>

                            {/* Épica */}
                            <div>
                                <Label className="text-sm font-medium">Épica</Label>
                                <Select
                                    value={formData.epic}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, epic: value }))}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {epics.map(epic => (
                                            <SelectItem key={epic.id} value={epic.name}>
                                                {epic.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Responsable */}
                            <div className="relative">
                                <Label className="text-sm font-medium">
                                    Responsable <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative mt-1">
                                    <Input
                                        placeholder="Buscar responsable..."
                                        value={formData.responsible || responsibleSearch}
                                        onChange={(e) => {
                                            setResponsibleSearch(e.target.value);
                                            setFormData(prev => ({ ...prev, responsible: '' }));
                                            setShowResponsibleDropdown(true);
                                        }}
                                        onFocus={() => setShowResponsibleDropdown(true)}
                                        className={cn(errors.responsible && "border-red-500")}
                                    />
                                    {showResponsibleDropdown && filteredResponsibles.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                                            {filteredResponsibles.map(r => (
                                                <div
                                                    key={r}
                                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                    onClick={() => selectResponsible(r)}
                                                >
                                                    {r}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {errors.responsible && <p className="text-red-500 text-xs mt-1">{errors.responsible}</p>}
                            </div>

                            {/* Estado */}
                            <div>
                                <Label className="text-sm font-medium">Estado</Label>
                                <Select
                                    value={formData.state}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, state: value as UserStoryStatus }))}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Por hacer">Por hacer</SelectItem>
                                        <SelectItem value="En progreso">En progreso</SelectItem>
                                        <SelectItem value="En revisión">En revisión</SelectItem>
                                        <SelectItem value="Finalizado">Finalizado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Prioridad */}
                            <div>
                                <Label className="text-sm font-medium">Prioridad</Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as Priority }))}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Alta">Alta</SelectItem>
                                        <SelectItem value="Media">Media</SelectItem>
                                        <SelectItem value="Baja">Baja</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Fecha inicio */}
                            <div>
                                <Label className="text-sm font-medium">
                                    Fecha inicio <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                    className={cn("mt-1", errors.startDate && "border-red-500")}
                                />
                                {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
                            </div>

                            {/* Fecha fin */}
                            <div>
                                <Label className="text-sm font-medium">
                                    Fecha fin <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                    className={cn("mt-1", errors.endDate && "border-red-500")}
                                />
                                {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
                            </div>

                            {errors.dates && (
                                <p className="text-red-500 text-xs col-span-2">{errors.dates}</p>
                            )}

                            {/* Puntos */}
                            <div>
                                <Label className="text-sm font-medium">Puntos de historia</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={formData.points}
                                    onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                                    className="mt-1"
                                />
                            </div>

                            {/* Criterios de aceptación */}
                            <div className="col-span-2">
                                <Label className="text-sm font-medium">Criterios de Aceptación</Label>
                                <div className="space-y-2 mt-2">
                                    {(formData.acceptanceCriteria || []).map((criterion, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Input
                                                placeholder={`Criterio ${index + 1}`}
                                                value={criterion}
                                                onChange={(e) => updateCriterion(index, e.target.value)}
                                            />
                                            {(formData.acceptanceCriteria?.length || 0) > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeCriterion(index)}
                                                    className="h-8 w-8 text-red-500 hover:text-red-700"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addCriterion}
                                        className="mt-2"
                                    >
                                        <Plus className="h-4 w-4 mr-1" /> Agregar criterio
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="p-4 bg-gray-50 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} className="bg-[#018CD1] hover:bg-[#018CD1]/90">
                        {isEditing ? 'Guardar cambios' : 'Crear Historia'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ==================== CARD DE KANBAN ====================
const KanbanCard = ({
    item,
    onEdit,
    onDelete,
    onDragStart,
    onDragEnd,
    isScrumMaster,
}: {
    item: UserStory;
    onEdit: (item: UserStory) => void;
    onDelete: (item: UserStory) => void;
    onDragStart: (e: React.DragEvent, item: UserStory) => void;
    onDragEnd: (e: React.DragEvent) => void;
    isScrumMaster: boolean;
}) => {
    const formatDate = (dateStr: string) => {
        const parts = dateStr.split('/');
        if (parts.length >= 2) {
            const day = parts[0];
            const month = parseInt(parts[1]);
            const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
            return `${day} ${months[month - 1]}`;
        }
        // Si está en formato YYYY-MM-DD
        if (dateStr.includes('-')) {
            const date = new Date(dateStr);
            const day = date.getDate();
            const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
            return `${day} ${months[date.getMonth()]}`;
        }
        return dateStr;
    };

    return (
        <div
            className={cn(
                "bg-white p-3 rounded-md border border-gray-200 shadow-sm mb-3 hover:shadow-md transition-shadow",
                isScrumMaster && "cursor-grab active:cursor-grabbing"
            )}
            draggable={isScrumMaster}
            onDragStart={isScrumMaster ? (e) => onDragStart(e, item) : undefined}
            onDragEnd={isScrumMaster ? onDragEnd : undefined}
        >
            <div className="flex justify-between items-start">
                <div className="flex items-start gap-2 flex-1">
                    {isScrumMaster && <GripVertical className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />}
                    <p className={cn("font-semibold text-sm pr-2 line-clamp-2", !isScrumMaster && "ml-0")}>{item.title}</p>
                </div>
                {/* Menú de opciones solo visible para Scrum Master */}
                {isScrumMaster ? (
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setTimeout(() => onEdit(item), 0)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTimeout(() => onDelete(item), 0)} className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <MoreHorizontal className="h-4 w-4 text-gray-300 flex-shrink-0" />
                )}
            </div>
            <div className={cn("flex items-center gap-2 mb-2 mt-2", isScrumMaster ? "ml-6" : "ml-0")}>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs font-bold">
                    {item.epic}
                </Badge>
                {item.startDate && (
                    <div className="flex items-center text-xs text-gray-500 gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(item.startDate)}</span>
                    </div>
                )}
            </div>
            <div className={cn("flex items-center justify-between", isScrumMaster ? "ml-6" : "ml-0")}>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Bookmark className="w-4 h-4 text-green-500" />
                    <span>{item.id}</span>
                    {item.points && <span className="font-bold text-blue-600">{item.points}</span>}
                    <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{item.comments}</span>
                    </div>
                </div>
                <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-gray-300">
                        {item.responsible.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                </Avatar>
            </div>
        </div>
    );
};

// ==================== COLUMNA DE KANBAN ====================
const KanbanColumnComponent = ({
    column,
    items,
    onAddNew,
    onEditItem,
    onDeleteItem,
    onDeleteColumn,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
    isDragOver,
    isScrumMaster,
}: {
    column: KanbanColumn;
    items: UserStory[];
    onAddNew: (status: UserStoryStatus) => void;
    onEditItem: (item: UserStory) => void;
    onDeleteItem: (item: UserStory) => void;
    onDeleteColumn?: () => void;
    onDragStart: (e: React.DragEvent, item: UserStory) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, targetStatus: UserStoryStatus) => void;
    isDragOver: boolean;
    isScrumMaster: boolean;
}) => {
    return (
        <div
            className={cn(
                "bg-gray-100 rounded-lg p-3 w-72 flex-shrink-0 transition-colors",
                isDragOver && "bg-blue-100 border-2 border-blue-400 border-dashed"
            )}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, column.status)}
        >
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800">{column.title} ({items.length})</h3>
                {column.isCustom && isScrumMaster ? (
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreHorizontal className="w-5 h-5 text-gray-400" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setTimeout(() => onDeleteColumn?.(), 0)} className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar columna
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                )}
            </div>
            <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar pr-1">
                {items.map(item => (
                    <KanbanCard
                        key={item.id}
                        item={item}
                        onEdit={onEditItem}
                        onDelete={onDeleteItem}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        isScrumMaster={isScrumMaster}
                    />
                ))}
                {items.length === 0 && (
                    <div className="text-center text-gray-400 py-8 text-sm border-2 border-dashed border-gray-300 rounded-lg">
                        {isScrumMaster ? 'Arrastra HUs aquí' : 'Sin elementos'}
                    </div>
                )}
            </div>
            {/* Botón Nuevo - Solo visible y funcional para Scrum Master */}
            {isScrumMaster && (
                <Button
                    variant="ghost"
                    className="w-full justify-start mt-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                    onClick={() => onAddNew(column.status)}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo
                </Button>
            )}
        </div>
    );
};

// ==================== COMPONENTE PRINCIPAL ====================
function TableroContent() {
    const { user } = useAuth();
    const router = useRouter();
    const [project, setProject] = useState<Project | null>(null);
    const [activeTab, setActiveTab] = useState('Tablero');
    const [selectedSprint, setSelectedSprint] = useState('sprint1');

    // Verificar rol del usuario
    const isScrumMaster = user?.role === ROLES.SCRUM_MASTER;
    const isDeveloper = user?.role === ROLES.DESARROLLADOR;

    // Datos
    const [sprints, setSprints] = useState<Sprint[]>(initialSprints);
    const [stories, setStories] = useState<UserStory[]>(allUserStories.filter(s => s.type === 'Historia'));
    const [epics] = useState<Epic[]>(initialEpics);

    // Columnas del Kanban
    const [columns, setColumns] = useState<KanbanColumn[]>([
        { id: 'col-1', title: 'Por hacer', status: 'Por hacer' },
        { id: 'col-2', title: 'En progreso', status: 'En progreso' },
        { id: 'col-3', title: 'En revisión', status: 'En revisión' },
        { id: 'col-4', title: 'Finalizado', status: 'Finalizado' },
    ]);

    // Estado del Drag & Drop
    const [draggedItem, setDraggedItem] = useState<UserStory | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    // Modales
    const [isHUModalOpen, setIsHUModalOpen] = useState(false);
    const [editingHU, setEditingHU] = useState<UserStory | null>(null);
    const [defaultHUState, setDefaultHUState] = useState<UserStoryStatus>('Por hacer');

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingHU, setDeletingHU] = useState<UserStory | null>(null);

    const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
    const [isDeletingColumn, setIsDeletingColumn] = useState<KanbanColumn | null>(null);

    const [isCloseSprintModalOpen, setIsCloseSprintModalOpen] = useState(false);

    // Cargar proyecto
    useEffect(() => {
        const savedProjectData = localStorage.getItem('selectedProject');
        if (savedProjectData) {
            setProject(JSON.parse(savedProjectData));
        } else {
            router.push(paths.poi.base);
        }
    }, [router]);

    // Obtener HUs del sprint seleccionado
    const sprintStories = stories.filter(s => s.sprint === selectedSprint);
    const currentSprint = sprints.find(s => s.id === selectedSprint);
    const pendingHUs = sprintStories.filter(s => s.state !== 'Finalizado').length;

    // ==================== DRAG & DROP ====================
    const handleDragStart = (e: React.DragEvent, item: UserStory) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.id);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDragOverColumn(null);
    };

    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverColumn(columnId);
    };

    const handleDrop = (e: React.DragEvent, targetStatus: UserStoryStatus) => {
        e.preventDefault();
        if (!draggedItem) return;

        // Actualizar estado de la HU
        setStories(prev =>
            prev.map(s =>
                s.id === draggedItem.id
                    ? { ...s, state: targetStatus }
                    : s
            )
        );

        setDraggedItem(null);
        setDragOverColumn(null);
    };

    // ==================== GESTIÓN DE HU ====================
    const handleAddNewHU = (status: UserStoryStatus) => {
        setEditingHU(null);
        setDefaultHUState(status);
        setIsHUModalOpen(true);
    };

    const handleEditHU = (hu: UserStory) => {
        setEditingHU(hu);
        setDefaultHUState(hu.state);
        setIsHUModalOpen(true);
    };

    const handleDeleteHU = (hu: UserStory) => {
        setDeletingHU(hu);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteHU = () => {
        if (deletingHU) {
            setStories(prev => prev.filter(s => s.id !== deletingHU.id));
        }
        setDeletingHU(null);
        setIsDeleteModalOpen(false);
    };

    const handleSaveHU = (data: HUFormData) => {
        if (data.id) {
            // Editar HU existente
            setStories(prev =>
                prev.map(s =>
                    s.id === data.id
                        ? {
                            ...s,
                            title: data.title,
                            description: data.description,
                            epic: data.epic,
                            responsible: data.responsible,
                            responsibles: data.responsibles,
                            state: data.state,
                            priority: data.priority,
                            startDate: toDisplayDateFormat(data.startDate),
                            endDate: toDisplayDateFormat(data.endDate),
                            points: data.points,
                            acceptanceCriteria: data.acceptanceCriteria?.filter(c => c.trim()),
                        }
                        : s
                )
            );
        } else {
            // Crear nueva HU
            const newHU: UserStory = {
                id: getNextHUId(stories),
                title: data.title,
                description: data.description,
                epic: data.epic,
                responsible: data.responsible,
                responsibles: data.responsibles,
                state: data.state,
                priority: data.priority,
                startDate: toDisplayDateFormat(data.startDate),
                endDate: toDisplayDateFormat(data.endDate),
                type: 'Historia',
                sprint: selectedSprint,
                comments: 0,
                points: data.points,
                acceptanceCriteria: data.acceptanceCriteria?.filter(c => c.trim()),
                informer: user?.name || 'Scrum Master',
            };
            setStories(prev => [...prev, newHU]);
        }
    };

    // ==================== GESTIÓN DE COLUMNAS ====================
    const handleAddColumn = (name: string) => {
        const newColumn: KanbanColumn = {
            id: `col-custom-${Date.now()}`,
            title: name,
            status: 'Por hacer', // Las columnas custom usan "Por hacer" como status base
            isCustom: true,
        };
        setColumns(prev => [...prev, newColumn]);
    };

    const handleDeleteColumn = (column: KanbanColumn) => {
        setIsDeletingColumn(column);
    };

    const confirmDeleteColumn = () => {
        if (isDeletingColumn) {
            setColumns(prev => prev.filter(c => c.id !== isDeletingColumn.id));
        }
        setIsDeletingColumn(null);
    };

    // ==================== GESTIÓN DE SPRINT ====================
    const handleCloseSprint = () => {
        // Redirigir directamente a la vista de Backlog
        router.push(paths.poi.proyecto.backlog.base);
    };

    const confirmCloseSprint = () => {
        // Mover HUs no finalizadas al backlog
        setStories(prev =>
            prev.map(s => {
                if (s.sprint === selectedSprint && s.state !== 'Finalizado') {
                    return { ...s, sprint: 'backlog' };
                }
                return s;
            })
        );

        // Marcar sprint como finalizado
        setSprints(prev =>
            prev.map(s =>
                s.id === selectedSprint
                    ? { ...s, status: 'Finalizado' as SprintStatus }
                    : s
            )
        );

        setIsCloseSprintModalOpen(false);

        // Redirigir al backlog
        router.push(paths.poi.proyecto.backlog.base);
    };

    // ==================== NAVEGACIÓN ====================
    const handleTabClick = (tabName: string) => {
        let route = '';
        if (tabName === 'Backlog') route = paths.poi.proyecto.backlog.base;
        else if (tabName === 'Dashboard') route = paths.poi.proyecto.backlog.dashboard;

        if (route) {
            router.push(route);
        } else {
            setActiveTab(tabName);
        }
    };

    if (!project) {
        return (
            <div className="flex h-screen w-full items-center justify-center">Cargando...</div>
        );
    }

    const projectCode = `PROY N°${project.id}`;

    // DESARROLLADOR no puede ir a Detalles
    const breadcrumbs = isDeveloper
        ? [{ label: 'POI', href: paths.poi.base }, { label: 'Tablero' }]
        : [{ label: 'POI', href: paths.poi.base }, { label: 'Proyecto', href: paths.poi.proyecto.detalles }, { label: 'Tablero' }
    ];

    const tabs = ['Backlog', 'Tablero', 'Dashboard'];

    const secondaryHeader = (
        <div className="bg-[#D5D5D5] border-b border-t border-[#1A5581]">
            <div className="p-2 flex items-center justify-between w-full">
                <h2 className="font-bold text-black pl-2">
                    {projectCode}: {project.name}
                </h2>
            </div>
        </div>
    );

    return (
        <AppLayout
            breadcrumbs={breadcrumbs}
            secondaryHeader={secondaryHeader}
        >
            {/* Tabs de navegación */}
            <div className="flex items-center gap-2 p-4 bg-[#F9F9F9]">
                {tabs.map(tab => (
                    <Button
                        key={tab}
                        size="sm"
                        onClick={() => handleTabClick(tab)}
                        className={cn(activeTab === tab ? 'bg-[#018CD1] text-white' : 'bg-white text-black border-gray-300')}
                        variant={activeTab === tab ? 'default' : 'outline'}
                    >
                        {tab}
                    </Button>
                ))}
            </div>

            {/* Contenido del tablero */}
            <div className="flex-1 flex flex-col bg-[#F9F9F9] px-4 pb-4">
                {activeTab === 'Tablero' && (
                    <div className="flex-1 flex flex-col">
                        {/* Barra de controles */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-6">
                                {/* Filtro de Sprint con diseño mejorado */}
                                <div className="flex items-center gap-3">
                                    <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filtrar por Sprint:</Label>
                                    <Select value={selectedSprint} onValueChange={setSelectedSprint}>
                                        <SelectTrigger className="w-[320px] bg-white">
                                            <SelectValue placeholder="Seleccionar sprint" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sprints.map(sprint => (
                                                <SelectItem key={sprint.id} value={sprint.id}>
                                                    <div className="flex items-center justify-between w-full gap-4">
                                                        <span className="font-medium">{sprint.name}</span>
                                                        <span className="text-gray-500 text-sm">{sprint.startDate} - {sprint.endDate}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {currentSprint && (
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant="secondary"
                                            className={cn("text-xs", {
                                                'bg-blue-100 text-blue-800': currentSprint.status === 'Por hacer',
                                                'bg-yellow-100 text-yellow-800': currentSprint.status === 'En progreso',
                                                'bg-green-100 text-green-800': currentSprint.status === 'Finalizado',
                                            })}
                                        >
                                            {currentSprint.status}
                                        </Badge>
                                        <span className="text-sm text-gray-500">
                                            ({sprintStories.length} historias)
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Botón Agregar columna - Solo visible para Scrum Master */}
                                {isScrumMaster && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsAddColumnModalOpen(true)}
                                        className="gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Agregar columna
                                    </Button>
                                )}
                                {/* Botón Cerrar Sprint - Visible para ambos roles */}
                                <Button
                                    className="gap-2 bg-[#018CD1] hover:bg-[#018CD1]/90"
                                    onClick={handleCloseSprint}
                                >
                                    <Square className="h-4 w-4" />
                                    Cerrar Sprint
                                </Button>
                            </div>
                        </div>

                        {/* Tablero Kanban */}
                        <div className="flex-1 overflow-x-auto pb-4">
                            <div className="flex gap-4">
                                {columns.map(col => (
                                    <KanbanColumnComponent
                                        key={col.id}
                                        column={col}
                                        items={sprintStories.filter(item => item.state === col.status)}
                                        onAddNew={handleAddNewHU}
                                        onEditItem={handleEditHU}
                                        onDeleteItem={handleDeleteHU}
                                        onDeleteColumn={col.isCustom ? () => handleDeleteColumn(col) : undefined}
                                        onDragStart={handleDragStart}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={(e) => handleDragOver(e, col.id)}
                                        onDrop={handleDrop}
                                        isDragOver={dragOverColumn === col.id}
                                        isScrumMaster={isScrumMaster}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modales */}
            <HUModal
                isOpen={isHUModalOpen}
                onClose={() => setIsHUModalOpen(false)}
                hu={editingHU}
                onSave={handleSaveHU}
                defaultState={defaultHUState}
                sprints={sprints}
                selectedSprintId={selectedSprint}
                epics={epics}
            />

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setDeletingHU(null);
                }}
                onConfirm={confirmDeleteHU}
                title="Eliminar Historia de Usuario"
                message={`¿Está seguro que desea eliminar la historia "${deletingHU?.title}"? Esta acción no se puede deshacer.`}
            />

            <DeleteConfirmationModal
                isOpen={isDeletingColumn !== null}
                onClose={() => setIsDeletingColumn(null)}
                onConfirm={confirmDeleteColumn}
                title="Eliminar Columna"
                message={`¿Está seguro que desea eliminar la columna "${isDeletingColumn?.title}"? Las historias en esta columna permanecerán en su estado actual.`}
            />

            <AddColumnModal
                isOpen={isAddColumnModalOpen}
                onClose={() => setIsAddColumnModalOpen(false)}
                onSave={handleAddColumn}
            />

            <CloseSprintModal
                isOpen={isCloseSprintModalOpen}
                onClose={() => setIsCloseSprintModalOpen(false)}
                onConfirm={confirmCloseSprint}
                sprintName={currentSprint?.name || ''}
                pendingHUs={pendingHUs}
            />
        </AppLayout>
    );
}

export default function TableroProyectoPage() {
    return (
        <ProtectedRoute module={MODULES.POI}>
            <React.Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Cargando...</div>}>
                <TableroContent />
            </React.Suspense>
        </ProtectedRoute>
    );
}
