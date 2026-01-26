"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    FileText,
    Save,
    ChevronLeft,
    ChevronRight,
    Plus,
    Pencil,
    Trash2,
    X,
    Check,
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

// Types
type Asistente = {
    id: string;
    nombre: string;
    cargo: string;
    direccion: string;
};

type AgendaItem = {
    id: string;
    tema: string;
};

type Requerimiento = {
    id: string;
    descripcion: string;
};

type Entregable = {
    id: string;
    descripcion: string;
    responsable: string;
    fecha: string;
};

type ReunionProgramada = {
    id: string;
    tema: string;
    fecha: string;
    horaInicio: string;
};

type FormData = {
    // Paso 1
    tipoReunion: string;
    fasePerteneciente: string;
    fechaReunion: string;
    horaInicio: string;
    horaFin: string;
    asistentes: Asistente[];
    ausentes: Asistente[];
    agenda: AgendaItem[];
    // Paso 2
    requerimientosFuncionales: Requerimiento[];
    requerimientosNoFuncionales: Requerimiento[];
    // Paso 3
    temasPendientes: AgendaItem[];
    entregables: Entregable[];
    observaciones: string;
    reunionesProgramadas: ReunionProgramada[];
};

const tiposReunion = [
    'Reunión inicial',
    'Reunión de seguimiento',
    'Reunión de cierre',
];

const fases = [
    'Análisis y Requerimiento',
    'Diseño',
    'Desarrollo',
    'Pruebas',
    'Implementación',
];

const cargos = [
    'Gerente de Proyecto',
    'Scrum Master',
    'Product Owner',
    'Desarrollador',
    'Analista',
    'QA',
    'Diseñador',
    'Otro',
];

// Componente de barra de progreso
function ProgressBar({ currentStep }: { currentStep: number }) {
    return (
        <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((step, index) => (
                <React.Fragment key={step}>
                    <div className="flex flex-col items-center">
                        <div
                            className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all",
                                step <= currentStep
                                    ? "bg-[#187DE5] text-white"
                                    : "bg-[#C5CDD4] text-black"
                            )}
                        >
                            {step}
                        </div>
                        <span className="text-xs mt-1 text-gray-600">
                            {step === 1 ? 'Datos' : step === 2 ? 'Desarrollo' : 'Cierre'}
                        </span>
                    </div>
                    {index < 2 && (
                        <div
                            className={cn(
                                "w-24 h-1 mx-2 rounded transition-all",
                                step < currentStep ? "bg-[#187DE5]" : "bg-[#C5CDD4]"
                            )}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

// Tabla editable genérica
function EditableTable<T extends { id: string }>({
    title,
    columns,
    data,
    onAdd,
    onEdit,
    onDelete,
    renderRow,
    renderEditRow,
    emptyMessage = "No hay registros",
}: {
    title: string;
    columns: { key: string; label: string; width?: string }[];
    data: T[];
    onAdd: (item: Omit<T, 'id'>) => void;
    onEdit: (id: string, item: Omit<T, 'id'>) => void;
    onDelete: (id: string) => void;
    renderRow: (item: T) => React.ReactNode[];
    renderEditRow: (
        editData: Partial<T>,
        setEditData: React.Dispatch<React.SetStateAction<Partial<T>>>,
        onSave: () => void,
        onCancel: () => void
    ) => React.ReactNode;
    emptyMessage?: string;
}) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<Partial<T>>({});
    const [newData, setNewData] = useState<Partial<T>>({});
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const handleStartAdd = () => {
        setIsAdding(true);
        setNewData({});
    };

    const handleSaveNew = () => {
        onAdd(newData as Omit<T, 'id'>);
        setIsAdding(false);
        setNewData({});
    };

    const handleCancelAdd = () => {
        setIsAdding(false);
        setNewData({});
    };

    const handleStartEdit = (item: T) => {
        setEditingId(item.id);
        setEditData(item);
    };

    const handleSaveEdit = () => {
        if (editingId) {
            onEdit(editingId, editData as Omit<T, 'id'>);
            setEditingId(null);
            setEditData({});
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditData({});
    };

    const handleConfirmDelete = (id: string) => {
        onDelete(id);
        setDeleteConfirmId(null);
    };

    return (
        <div className="border rounded-lg overflow-hidden">
            <div className="bg-[#004272] text-white px-4 py-2 font-semibold text-sm">
                {title}
            </div>
            <div className="max-h-64 overflow-y-auto">
                <Table>
                    <TableHeader className="bg-gray-100 sticky top-0">
                        <TableRow>
                            {columns.map(col => (
                                <TableHead
                                    key={col.key}
                                    className="font-semibold text-gray-700"
                                    style={{ width: col.width }}
                                >
                                    {col.label}
                                </TableHead>
                            ))}
                            <TableHead className="w-24 text-center font-semibold text-gray-700">
                                Acciones
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 && !isAdding && (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + 1}
                                    className="text-center text-gray-500 py-4"
                                >
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        )}
                        {data.map(item => (
                            editingId === item.id ? (
                                <TableRow key={item.id} className="bg-blue-50">
                                    {renderEditRow(
                                        editData,
                                        setEditData as React.Dispatch<React.SetStateAction<Partial<T>>>,
                                        handleSaveEdit,
                                        handleCancelEdit
                                    )}
                                </TableRow>
                            ) : (
                                <TableRow key={item.id} className="hover:bg-gray-50">
                                    {renderRow(item).map((cell, idx) => (
                                        <TableCell key={idx}>{cell}</TableCell>
                                    ))}
                                    <TableCell>
                                        <div className="flex justify-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 hover:text-[#018CD1]"
                                                onClick={() => handleStartEdit(item)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 hover:text-red-600"
                                                onClick={() => setDeleteConfirmId(item.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        ))}
                        {isAdding && (
                            <TableRow className="bg-blue-50">
                                {renderEditRow(
                                    newData,
                                    setNewData as React.Dispatch<React.SetStateAction<Partial<T>>>,
                                    handleSaveNew,
                                    handleCancelAdd
                                )}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="border-t p-2">
                <button
                    type="button"
                    onClick={handleStartAdd}
                    disabled={isAdding}
                    className="text-[#187DE5] text-sm font-medium hover:underline disabled:opacity-50 flex items-center gap-1"
                >
                    <Plus className="h-4 w-4" />
                    Agregar
                </button>
            </div>

            {/* Modal de confirmación de eliminación */}
            <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
                <DialogContent className="sm:max-w-md p-0" showCloseButton={false}>
                    <DialogHeader className="p-4 bg-[#004272] text-white">
                        <DialogTitle>Confirmar eliminación</DialogTitle>
                    </DialogHeader>
                    <div className="p-6">
                        <p>¿Está seguro de que desea eliminar este registro?</p>
                    </div>
                    <DialogFooter className="p-4 border-t bg-gray-50 flex gap-2">
                        <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                            Cancelar
                        </Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => deleteConfirmId && handleConfirmDelete(deleteConfirmId)}
                        >
                            Sí, eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Contenido principal
function NuevaActaContent() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [project, setProject] = useState<Project | null>(null);
    const [activeTab, setActiveTab] = useState('Actas del proyecto');
    const [currentStep, setCurrentStep] = useState(1);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const tipo = searchParams.get('tipo');
    const actaId = searchParams.get('id');
    const isEditing = !!actaId;
    const isActaReunion = tipo === 'reunion';

    // Estado del formulario
    const [formData, setFormData] = useState<FormData>({
        tipoReunion: '',
        fasePerteneciente: '',
        fechaReunion: '',
        horaInicio: '',
        horaFin: '',
        asistentes: [],
        ausentes: [],
        agenda: [],
        requerimientosFuncionales: [],
        requerimientosNoFuncionales: [],
        temasPendientes: [],
        entregables: [],
        observaciones: '',
        reunionesProgramadas: [],
    });

    // Pestañas según rol
    const userRole = user?.role;
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

    // Actas iniciales de ejemplo (mismas que en page.tsx)
    const initialActas = [
        {
            id: 'ACTA-1',
            nombre: 'Reunión inicial - Análisis y Requerimiento',
            tipo: 'Acta de Reunión',
            fecha: '15/01/2025',
            estado: 'Aprobado',
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

    useEffect(() => {
        const savedProjectData = localStorage.getItem('selectedProject');
        if (savedProjectData) {
            setProject(JSON.parse(savedProjectData));
        } else {
            router.push(paths.poi.base);
        }

        // Si estamos editando, cargar los datos del acta
        if (isEditing && actaId) {
            // Buscar primero en localStorage
            const storedActas = localStorage.getItem('projectActas');
            let actaFound = null;

            if (storedActas) {
                try {
                    const parsedActas = JSON.parse(storedActas);
                    actaFound = parsedActas.find((a: { id: string }) => a.id === actaId);
                } catch (error) {
                    console.error('Error loading acta from localStorage:', error);
                }
            }

            // Si no está en localStorage, buscar en las actas iniciales
            if (!actaFound) {
                actaFound = initialActas.find(a => a.id === actaId);
            }

            // Cargar los datos del formulario si se encontró el acta
            if (actaFound && actaFound.formData) {
                setFormData(actaFound.formData as FormData);
            }
        }
    }, [router, isEditing, actaId]);

    const handleTabClick = (tabName: string) => {
        let route = '';
        if (tabName === 'Detalles') route = paths.poi.proyecto.detalles;
        else if (tabName === 'Documentos') route = paths.poi.proyecto.documentos;
        else if (tabName === 'Actas del proyecto') route = paths.poi.proyecto.actas;
        else if (tabName === 'Backlog') route = paths.poi.proyecto.backlog.base;

        if (route) router.push(route);
    };

    // Validación paso 1
    const validateStep1 = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.tipoReunion) newErrors.tipoReunion = 'Tipo de reunión es obligatorio';
        if (!formData.fasePerteneciente) newErrors.fasePerteneciente = 'Fase es obligatoria';
        if (!formData.fechaReunion) newErrors.fechaReunion = 'Fecha de reunión es obligatoria';
        if (!formData.horaInicio) newErrors.horaInicio = 'Hora inicio es obligatoria';
        if (formData.asistentes.length === 0) newErrors.asistentes = 'Debe agregar al menos 1 asistente';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Validación paso 2
    const validateStep2 = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (formData.requerimientosFuncionales.length === 0) {
            newErrors.requerimientosFuncionales = 'Debe agregar al menos 1 requerimiento funcional';
        }
        if (formData.requerimientosNoFuncionales.length === 0) {
            newErrors.requerimientosNoFuncionales = 'Debe agregar al menos 1 requerimiento no funcional';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Validación paso 3
    const validateStep3 = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (formData.entregables.length === 0) {
            newErrors.entregables = 'Debe agregar al menos 1 entregable';
        } else {
            const invalidEntregable = formData.entregables.find(
                e => !e.responsable || !e.fecha
            );
            if (invalidEntregable) {
                newErrors.entregables = 'Todos los entregables deben tener responsable y fecha';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (currentStep === 1 && validateStep1()) {
            setCurrentStep(2);
        } else if (currentStep === 2 && validateStep2()) {
            setCurrentStep(3);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSave = () => {
        if (validateStep3()) {
            // Formatear fecha para mostrar (dd/mm/yyyy)
            const formatDateForDisplay = (dateStr: string) => {
                if (!dateStr) return '';
                const [year, month, day] = dateStr.split('-');
                return `${day}/${month}/${year}`;
            };

            // Obtener actas existentes del localStorage
            const storedActas = localStorage.getItem('projectActas');
            let actasList = storedActas ? JSON.parse(storedActas) : [];

            // Generar ID secuencial (ACTA-1, ACTA-2, etc.)
            const generateSequentialId = (): string => {
                // IDs iniciales van del 1 al 4 (ACTA-1, ACTA-2, ACTA-3, ACTA-4)
                const initialIds = [1, 2, 3, 4];

                // Obtener todos los IDs existentes (tanto de localStorage como iniciales)
                const existingIds = actasList
                    .map((a: { id: string }) => {
                        const match = a.id.match(/^ACTA-(\d+)$/);
                        return match ? parseInt(match[1], 10) : 0;
                    })
                    .filter((n: number) => n > 0);

                // Combinar con IDs iniciales
                const allIds = [...new Set([...initialIds, ...existingIds])];

                // Encontrar el siguiente número disponible
                const maxId = allIds.length > 0 ? Math.max(...allIds) : 0;
                return `ACTA-${maxId + 1}`;
            };

            const newActaId = isEditing && actaId ? actaId : generateSequentialId();

            // Crear objeto del acta para guardar
            const newActa = {
                id: newActaId,
                nombre: `${formData.tipoReunion} - ${formData.fasePerteneciente}`,
                tipo: 'Acta de Reunión' as const,
                fecha: formatDateForDisplay(formData.fechaReunion),
                estado: 'Borrador' as const, // Estado inicial al crear
                formData: formData, // Guardar todos los datos del formulario
            };

            if (isEditing) {
                // Actualizar acta existente
                actasList = actasList.map((a: { id: string }) =>
                    a.id === newActaId ? newActa : a
                );
            } else {
                // Agregar nueva acta
                actasList.push(newActa);
            }

            // Guardar en localStorage
            localStorage.setItem('projectActas', JSON.stringify(actasList));

            // Redirigir a la lista de actas con parámetro de éxito
            router.push(paths.poi.proyecto.actas + '?saved=true');
        }
    };

    // Helpers para las tablas
    const generateId = () => Date.now().toString();

    const addAsistente = (data: Omit<Asistente, 'id'>) => {
        setFormData(prev => ({
            ...prev,
            asistentes: [...prev.asistentes, { ...data, id: generateId() }],
        }));
    };

    const editAsistente = (id: string, data: Omit<Asistente, 'id'>) => {
        setFormData(prev => ({
            ...prev,
            asistentes: prev.asistentes.map(a => a.id === id ? { ...data, id } : a),
        }));
    };

    const deleteAsistente = (id: string) => {
        setFormData(prev => ({
            ...prev,
            asistentes: prev.asistentes.filter(a => a.id !== id),
        }));
    };

    const addAusente = (data: Omit<Asistente, 'id'>) => {
        setFormData(prev => ({
            ...prev,
            ausentes: [...prev.ausentes, { ...data, id: generateId() }],
        }));
    };

    const editAusente = (id: string, data: Omit<Asistente, 'id'>) => {
        setFormData(prev => ({
            ...prev,
            ausentes: prev.ausentes.map(a => a.id === id ? { ...data, id } : a),
        }));
    };

    const deleteAusente = (id: string) => {
        setFormData(prev => ({
            ...prev,
            ausentes: prev.ausentes.filter(a => a.id !== id),
        }));
    };

    const addAgenda = (data: Omit<AgendaItem, 'id'>) => {
        setFormData(prev => ({
            ...prev,
            agenda: [...prev.agenda, { ...data, id: generateId() }],
        }));
    };

    const editAgenda = (id: string, data: Omit<AgendaItem, 'id'>) => {
        setFormData(prev => ({
            ...prev,
            agenda: prev.agenda.map(a => a.id === id ? { ...data, id } : a),
        }));
    };

    const deleteAgenda = (id: string) => {
        setFormData(prev => ({
            ...prev,
            agenda: prev.agenda.filter(a => a.id !== id),
        }));
    };

    const addReqFuncional = (data: Omit<Requerimiento, 'id'>) => {
        setFormData(prev => ({
            ...prev,
            requerimientosFuncionales: [...prev.requerimientosFuncionales, { ...data, id: generateId() }],
        }));
    };

    const editReqFuncional = (id: string, data: Omit<Requerimiento, 'id'>) => {
        setFormData(prev => ({
            ...prev,
            requerimientosFuncionales: prev.requerimientosFuncionales.map(r => r.id === id ? { ...data, id } : r),
        }));
    };

    const deleteReqFuncional = (id: string) => {
        setFormData(prev => ({
            ...prev,
            requerimientosFuncionales: prev.requerimientosFuncionales.filter(r => r.id !== id),
        }));
    };

    const addReqNoFuncional = (data: Omit<Requerimiento, 'id'>) => {
        setFormData(prev => ({
            ...prev,
            requerimientosNoFuncionales: [...prev.requerimientosNoFuncionales, { ...data, id: generateId() }],
        }));
    };

    const editReqNoFuncional = (id: string, data: Omit<Requerimiento, 'id'>) => {
        setFormData(prev => ({
            ...prev,
            requerimientosNoFuncionales: prev.requerimientosNoFuncionales.map(r => r.id === id ? { ...data, id } : r),
        }));
    };

    const deleteReqNoFuncional = (id: string) => {
        setFormData(prev => ({
            ...prev,
            requerimientosNoFuncionales: prev.requerimientosNoFuncionales.filter(r => r.id !== id),
        }));
    };

    const addTemaPendiente = (data: Omit<AgendaItem, 'id'>) => {
        setFormData(prev => ({
            ...prev,
            temasPendientes: [...prev.temasPendientes, { ...data, id: generateId() }],
        }));
    };

    const editTemaPendiente = (id: string, data: Omit<AgendaItem, 'id'>) => {
        setFormData(prev => ({
            ...prev,
            temasPendientes: prev.temasPendientes.map(t => t.id === id ? { ...data, id } : t),
        }));
    };

    const deleteTemaPendiente = (id: string) => {
        setFormData(prev => ({
            ...prev,
            temasPendientes: prev.temasPendientes.filter(t => t.id !== id),
        }));
    };

    const addEntregable = (data: Omit<Entregable, 'id'>) => {
        setFormData(prev => ({
            ...prev,
            entregables: [...prev.entregables, { ...data, id: generateId() }],
        }));
    };

    const editEntregable = (id: string, data: Omit<Entregable, 'id'>) => {
        setFormData(prev => ({
            ...prev,
            entregables: prev.entregables.map(e => e.id === id ? { ...data, id } : e),
        }));
    };

    const deleteEntregable = (id: string) => {
        setFormData(prev => ({
            ...prev,
            entregables: prev.entregables.filter(e => e.id !== id),
        }));
    };

    const addReunionProgramada = (data: Omit<ReunionProgramada, 'id'>) => {
        setFormData(prev => ({
            ...prev,
            reunionesProgramadas: [...prev.reunionesProgramadas, { ...data, id: generateId() }],
        }));
    };

    const editReunionProgramada = (id: string, data: Omit<ReunionProgramada, 'id'>) => {
        setFormData(prev => ({
            ...prev,
            reunionesProgramadas: prev.reunionesProgramadas.map(r => r.id === id ? { ...data, id } : r),
        }));
    };

    const deleteReunionProgramada = (id: string) => {
        setFormData(prev => ({
            ...prev,
            reunionesProgramadas: prev.reunionesProgramadas.filter(r => r.id !== id),
        }));
    };

    if (!project) {
        return (
            <div className="flex h-screen w-full items-center justify-center">Cargando...</div>
        );
    }

    const projectCode = project.code || `PROY N°${project.id}`;
    // Breadcrumb simplificado: POI > Actas
    const breadcrumbs = [
        { label: "POI", href: paths.poi.base },
        { label: 'Actas' },
    ];

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
                        {/* Barra de progreso */}
                        <ProgressBar currentStep={currentStep} />

                        {/* Título */}
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">
                                {isEditing ? 'Editar' : 'Nueva'} Acta de Reunión
                            </h2>
                            <p className="text-gray-600 mt-1">
                                {currentStep === 1 && 'Datos de la Reunión'}
                                {currentStep === 2 && 'Desarrollo de la Reunión'}
                                {currentStep === 3 && 'Seguimiento y Cierre'}
                            </p>
                        </div>

                        {/* Paso 1: Datos de la Reunión */}
                        {currentStep === 1 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Columna izquierda */}
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-sm font-medium">
                                            Tipo de Reunión <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            value={formData.tipoReunion}
                                            onValueChange={(v) => setFormData(prev => ({ ...prev, tipoReunion: v }))}
                                        >
                                            <SelectTrigger className={cn("mt-1", errors.tipoReunion && "border-red-500")}>
                                                <SelectValue placeholder="Seleccionar tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {tiposReunion.map(tipo => (
                                                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.tipoReunion && <p className="text-red-500 text-xs mt-1">{errors.tipoReunion}</p>}
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium">
                                            Fase perteneciente <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            value={formData.fasePerteneciente}
                                            onValueChange={(v) => setFormData(prev => ({ ...prev, fasePerteneciente: v }))}
                                        >
                                            <SelectTrigger className={cn("mt-1", errors.fasePerteneciente && "border-red-500")}>
                                                <SelectValue placeholder="Seleccionar fase" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {fases.map(fase => (
                                                    <SelectItem key={fase} value={fase}>{fase}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.fasePerteneciente && <p className="text-red-500 text-xs mt-1">{errors.fasePerteneciente}</p>}
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium">
                                            Fecha de reunión <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            type="date"
                                            value={formData.fechaReunion}
                                            onChange={(e) => setFormData(prev => ({ ...prev, fechaReunion: e.target.value }))}
                                            className={cn("mt-1", errors.fechaReunion && "border-red-500")}
                                        />
                                        {errors.fechaReunion && <p className="text-red-500 text-xs mt-1">{errors.fechaReunion}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-sm font-medium">
                                                Hora Inicio <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                type="time"
                                                value={formData.horaInicio}
                                                onChange={(e) => setFormData(prev => ({ ...prev, horaInicio: e.target.value }))}
                                                className={cn("mt-1", errors.horaInicio && "border-red-500")}
                                            />
                                            {errors.horaInicio && <p className="text-red-500 text-xs mt-1">{errors.horaInicio}</p>}
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium">Hora Fin</Label>
                                            <Input
                                                type="time"
                                                value={formData.horaFin}
                                                onChange={(e) => setFormData(prev => ({ ...prev, horaFin: e.target.value }))}
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>

                                    {/* Tabla de Asistentes */}
                                    <div>
                                        <EditableTable<Asistente>
                                            title="Asistentes"
                                            columns={[
                                                { key: 'nombre', label: 'Nombre' },
                                                { key: 'cargo', label: 'Cargo' },
                                                { key: 'direccion', label: 'Dirección/Área' },
                                            ]}
                                            data={formData.asistentes}
                                            onAdd={addAsistente}
                                            onEdit={editAsistente}
                                            onDelete={deleteAsistente}
                                            renderRow={(item) => [item.nombre, item.cargo, item.direccion]}
                                            renderEditRow={(editData, setEditData, onSave, onCancel) => (
                                                <>
                                                    <TableCell>
                                                        <Input
                                                            placeholder="Nombre"
                                                            value={(editData as Asistente).nombre || ''}
                                                            onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
                                                            className="h-8"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={(editData as Asistente).cargo || ''}
                                                            onValueChange={(v) => setEditData({ ...editData, cargo: v })}
                                                        >
                                                            <SelectTrigger className="h-8">
                                                                <SelectValue placeholder="Cargo" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {cargos.map(c => (
                                                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            placeholder="Dirección/Área"
                                                            value={(editData as Asistente).direccion || ''}
                                                            onChange={(e) => setEditData({ ...editData, direccion: e.target.value })}
                                                            className="h-8"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex justify-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-green-600"
                                                                onClick={onSave}
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-red-600"
                                                                onClick={onCancel}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </>
                                            )}
                                        />
                                        {errors.asistentes && <p className="text-red-500 text-xs mt-1">{errors.asistentes}</p>}
                                    </div>
                                </div>

                                {/* Columna derecha */}
                                <div className="space-y-4">
                                    {/* Tabla de Ausentes */}
                                    <EditableTable<Asistente>
                                        title="Ausentes (opcional)"
                                        columns={[
                                            { key: 'nombre', label: 'Nombre' },
                                            { key: 'cargo', label: 'Cargo' },
                                            { key: 'direccion', label: 'Dirección/Área' },
                                        ]}
                                        data={formData.ausentes}
                                        onAdd={addAusente}
                                        onEdit={editAusente}
                                        onDelete={deleteAusente}
                                        renderRow={(item) => [item.nombre, item.cargo, item.direccion]}
                                        renderEditRow={(editData, setEditData, onSave, onCancel) => (
                                            <>
                                                <TableCell>
                                                    <Input
                                                        placeholder="Nombre"
                                                        value={(editData as Asistente).nombre || ''}
                                                        onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={(editData as Asistente).cargo || ''}
                                                        onValueChange={(v) => setEditData({ ...editData, cargo: v })}
                                                    >
                                                        <SelectTrigger className="h-8">
                                                            <SelectValue placeholder="Cargo" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {cargos.map(c => (
                                                                <SelectItem key={c} value={c}>{c}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        placeholder="Dirección/Área"
                                                        value={(editData as Asistente).direccion || ''}
                                                        onChange={(e) => setEditData({ ...editData, direccion: e.target.value })}
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-green-600"
                                                            onClick={onSave}
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-red-600"
                                                            onClick={onCancel}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </>
                                        )}
                                    />

                                    {/* Tabla de Agenda */}
                                    <EditableTable<AgendaItem>
                                        title="Agenda (Temas a tratar)"
                                        columns={[
                                            { key: 'tema', label: 'Temas' },
                                        ]}
                                        data={formData.agenda}
                                        onAdd={addAgenda}
                                        onEdit={editAgenda}
                                        onDelete={deleteAgenda}
                                        renderRow={(item) => [item.tema]}
                                        renderEditRow={(editData, setEditData, onSave, onCancel) => (
                                            <>
                                                <TableCell>
                                                    <Input
                                                        placeholder="Tema a tratar"
                                                        value={(editData as AgendaItem).tema || ''}
                                                        onChange={(e) => setEditData({ ...editData, tema: e.target.value })}
                                                        className="h-8"
                                                        onKeyDown={(e) => e.key === 'Enter' && onSave()}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-green-600"
                                                            onClick={onSave}
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-red-600"
                                                            onClick={onCancel}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </>
                                        )}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Paso 2: Desarrollo de la Reunión */}
                        {currentStep === 2 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-center">Requerimientos</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Requerimientos Funcionales */}
                                    <div>
                                        <EditableTable<Requerimiento>
                                            title="Requerimientos Funcionales"
                                            columns={[
                                                { key: 'descripcion', label: 'Requerimiento Funcional' },
                                            ]}
                                            data={formData.requerimientosFuncionales}
                                            onAdd={addReqFuncional}
                                            onEdit={editReqFuncional}
                                            onDelete={deleteReqFuncional}
                                            renderRow={(item) => [item.descripcion]}
                                            renderEditRow={(editData, setEditData, onSave, onCancel) => (
                                                <>
                                                    <TableCell>
                                                        <Textarea
                                                            placeholder="Describir requerimiento funcional..."
                                                            value={(editData as Requerimiento).descripcion || ''}
                                                            onChange={(e) => setEditData({ ...editData, descripcion: e.target.value })}
                                                            className="min-h-[60px]"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex justify-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-green-600"
                                                                onClick={onSave}
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-red-600"
                                                                onClick={onCancel}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </>
                                            )}
                                        />
                                        {errors.requerimientosFuncionales && (
                                            <p className="text-red-500 text-xs mt-1">{errors.requerimientosFuncionales}</p>
                                        )}
                                    </div>

                                    {/* Requerimientos No Funcionales */}
                                    <div>
                                        <EditableTable<Requerimiento>
                                            title="Requerimientos No Funcionales"
                                            columns={[
                                                { key: 'descripcion', label: 'Requerimiento No Funcional' },
                                            ]}
                                            data={formData.requerimientosNoFuncionales}
                                            onAdd={addReqNoFuncional}
                                            onEdit={editReqNoFuncional}
                                            onDelete={deleteReqNoFuncional}
                                            renderRow={(item) => [item.descripcion]}
                                            renderEditRow={(editData, setEditData, onSave, onCancel) => (
                                                <>
                                                    <TableCell>
                                                        <Textarea
                                                            placeholder="Describir requerimiento no funcional..."
                                                            value={(editData as Requerimiento).descripcion || ''}
                                                            onChange={(e) => setEditData({ ...editData, descripcion: e.target.value })}
                                                            className="min-h-[60px]"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex justify-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-green-600"
                                                                onClick={onSave}
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-red-600"
                                                                onClick={onCancel}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </>
                                            )}
                                        />
                                        {errors.requerimientosNoFuncionales && (
                                            <p className="text-red-500 text-xs mt-1">{errors.requerimientosNoFuncionales}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Paso 3: Seguimiento y Cierre */}
                        {currentStep === 3 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Columna izquierda */}
                                <div className="space-y-4">
                                    {/* Temas Pendientes */}
                                    <EditableTable<AgendaItem>
                                        title="Temas pendientes (opcional)"
                                        columns={[
                                            { key: 'tema', label: 'Tema' },
                                        ]}
                                        data={formData.temasPendientes}
                                        onAdd={addTemaPendiente}
                                        onEdit={editTemaPendiente}
                                        onDelete={deleteTemaPendiente}
                                        renderRow={(item) => [item.tema]}
                                        renderEditRow={(editData, setEditData, onSave, onCancel) => (
                                            <>
                                                <TableCell>
                                                    <Input
                                                        placeholder="Tema pendiente"
                                                        value={(editData as AgendaItem).tema || ''}
                                                        onChange={(e) => setEditData({ ...editData, tema: e.target.value })}
                                                        className="h-8"
                                                        onKeyDown={(e) => e.key === 'Enter' && onSave()}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-green-600"
                                                            onClick={onSave}
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-red-600"
                                                            onClick={onCancel}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </>
                                        )}
                                    />

                                    {/* Entregables del Acta */}
                                    <div>
                                        <EditableTable<Entregable>
                                            title="Entregables del acta"
                                            columns={[
                                                { key: 'descripcion', label: 'Entregables' },
                                                { key: 'responsable', label: 'Responsable' },
                                                { key: 'fecha', label: 'Fecha' },
                                            ]}
                                            data={formData.entregables}
                                            onAdd={addEntregable}
                                            onEdit={editEntregable}
                                            onDelete={deleteEntregable}
                                            renderRow={(item) => [item.descripcion, item.responsable, item.fecha]}
                                            renderEditRow={(editData, setEditData, onSave, onCancel) => (
                                                <>
                                                    <TableCell>
                                                        <Input
                                                            placeholder="Descripción del entregable"
                                                            value={(editData as Entregable).descripcion || ''}
                                                            onChange={(e) => setEditData({ ...editData, descripcion: e.target.value })}
                                                            className="h-8"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select
                                                            value={(editData as Entregable).responsable || ''}
                                                            onValueChange={(v) => setEditData({ ...editData, responsable: v })}
                                                        >
                                                            <SelectTrigger className="h-8">
                                                                <SelectValue placeholder="Responsable" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {formData.asistentes.map(a => (
                                                                    <SelectItem key={a.id} value={a.nombre}>{a.nombre}</SelectItem>
                                                                ))}
                                                                <SelectItem value="otro">Otro...</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="date"
                                                            value={(editData as Entregable).fecha || ''}
                                                            onChange={(e) => setEditData({ ...editData, fecha: e.target.value })}
                                                            className="h-8"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex justify-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-green-600"
                                                                onClick={onSave}
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-red-600"
                                                                onClick={onCancel}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </>
                                            )}
                                        />
                                        {errors.entregables && (
                                            <p className="text-red-500 text-xs mt-1">{errors.entregables}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Columna derecha */}
                                <div className="space-y-4">
                                    {/* Observaciones y Sugerencias */}
                                    <div className="border rounded-lg overflow-hidden">
                                        <div className="bg-[#004272] text-white px-4 py-2 font-semibold text-sm">
                                            Observaciones y sugerencias (opcional)
                                        </div>
                                        <div className="p-4">
                                            <Textarea
                                                placeholder="Escribir observaciones o sugerencias..."
                                                value={formData.observaciones}
                                                onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                                                className="min-h-[120px]"
                                            />
                                        </div>
                                    </div>

                                    {/* Reuniones Programadas */}
                                    <EditableTable<ReunionProgramada>
                                        title="Reuniones programadas (opcional)"
                                        columns={[
                                            { key: 'tema', label: 'Tema' },
                                            { key: 'fecha', label: 'Fecha' },
                                            { key: 'horaInicio', label: 'Hora Inicio' },
                                        ]}
                                        data={formData.reunionesProgramadas}
                                        onAdd={addReunionProgramada}
                                        onEdit={editReunionProgramada}
                                        onDelete={deleteReunionProgramada}
                                        renderRow={(item) => [item.tema, item.fecha, item.horaInicio]}
                                        renderEditRow={(editData, setEditData, onSave, onCancel) => (
                                            <>
                                                <TableCell>
                                                    <Input
                                                        placeholder="Tema de reunión"
                                                        value={(editData as ReunionProgramada).tema || ''}
                                                        onChange={(e) => setEditData({ ...editData, tema: e.target.value })}
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="date"
                                                        value={(editData as ReunionProgramada).fecha || ''}
                                                        onChange={(e) => setEditData({ ...editData, fecha: e.target.value })}
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="time"
                                                        value={(editData as ReunionProgramada).horaInicio || ''}
                                                        onChange={(e) => setEditData({ ...editData, horaInicio: e.target.value })}
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-green-600"
                                                            onClick={onSave}
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-red-600"
                                                            onClick={onCancel}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </>
                                        )}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Botones de navegación */}
                        <div className="flex justify-between mt-8 pt-6 border-t">
                            {currentStep === 1 ? (
                                <Button
                                    variant="outline"
                                    onClick={() => router.push(paths.poi.proyecto.actas)}
                                    className="gap-2"
                                >
                                    <X className="h-4 w-4" />
                                    Cancelar
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    onClick={handlePrevious}
                                    className="gap-2"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Anterior
                                </Button>
                            )}

                            {currentStep < 3 ? (
                                <Button
                                    onClick={handleNext}
                                    className="bg-[#018CD1] hover:bg-[#018CD1]/90 text-white gap-2"
                                >
                                    Siguiente
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSave}
                                    className="bg-[#187DE5] hover:bg-[#187DE5]/90 text-white gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    Guardar
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

export default function NuevaActaPage() {
    return (
        <ProtectedRoute module={MODULES.POI}>
            <React.Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Cargando...</div>}>
                <NuevaActaContent />
            </React.Suspense>
        </ProtectedRoute>
    );
}
