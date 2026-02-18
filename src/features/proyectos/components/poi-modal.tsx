"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import { type Project, type SubProject } from "@/lib/definitions";
import { X, Plus, Trash2, Loader2, AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/lib/hooks/use-toast";

// Services
import {
  createProyecto,
  updateProyecto,
  type CreateProyectoData,
  type UpdateProyectoData
} from "../services/proyectos.service";
import {
  createActividad,
  updateActividad,
  getNextActividadCodigo,
} from "@/features/actividades/services/actividades.service";
import type { CreateActividadInput, UpdateActividadInput } from "@/features/actividades/types";
import {
  createSubproyecto,
  getSubproyectosByProyecto,
  updateSubproyecto,
  deleteSubproyecto,
  getNextSubproyectoCodigo,
  type Subproyecto,
} from "../services/subproyectos.service";
import {
  getAccionesEstrategicas,
  getAccionesEstrategicasByPGD,
  getPGDs,
  type AccionEstrategica,
  type PGD
} from "@/features/planning";
import {
  getCoordinadores,
  getScrumMasters,
  getScrumMastersElegibles,
  getAsignacionesByProyecto,
  syncAsignacionesProyecto,
  getAsignacionesBySubproyecto,
  syncAsignacionesSubproyecto,
  getAsignacionesByActividad,
  syncAsignacionesActividad,
  getPersonalDisponible,
  getPersonalDesarrolladores,
  getPersonalImplementadores,
  getPersonalPatrocinadores,
  formatPersonalNombre,
  type Usuario,
  type Personal,
  type AsignacionError,
  formatUsuarioNombre,
} from "@/lib/services";
import { verificarSobrecarga, type PersonalSobrecargado } from "@/features/rrhh/services/asignaciones.service";
import { paths } from "@/lib/paths";

// Opciones predefinidas para áreas financieras
// Mapa para normalizar valores antiguos de áreas financieras al formato actual
const FINANCIAL_AREA_NORMALIZE: Record<string, string> = {
    'Oficina de Administración y Finanzas': 'Oficina de Administración y Finanzas (OAF)',
    'Oficina de Planificación y Presupuesto': 'Oficina de Planificación y Presupuesto (OPP)',
    'OTA': 'Oficina Técnica de Administración (OTA)',
    'DCNC': 'Dirección de Censos y Encuestas (DNCE)',
    'DTI': 'Dirección Técnica de Indicadores (DTI)',
};

function normalizeFinancialAreas(areas: string[]): string[] {
    const seen = new Set<string>();
    return areas.reduce<string[]>((acc, area) => {
        const normalized = FINANCIAL_AREA_NORMALIZE[area] || area;
        if (!seen.has(normalized)) {
            seen.add(normalized);
            acc.push(normalized);
        }
        return acc;
    }, []);
}

// Los valores deben coincidir exactamente con lo que se guarda en la BD
const financialAreaOptions: MultiSelectOption[] = [
    { label: 'OTA - Oficina Técnica de Administración', value: 'Oficina Técnica de Administración (OTA)' },
    { label: 'DNCE - Dirección de Censos y Encuestas', value: 'Dirección de Censos y Encuestas (DNCE)' },
    { label: 'DTI - Dirección Técnica de Indicadores', value: 'Dirección Técnica de Indicadores (DTI)' },
    { label: 'OAF - Oficina de Administración y Finanzas', value: 'Oficina de Administración y Finanzas (OAF)' },
    { label: 'OGD - Oficina de Gestión Documental', value: 'Oficina de Gestión Documental (OGD)' },
    { label: 'OPP - Oficina de Planificación y Presupuesto', value: 'Oficina de Planificación y Presupuesto (OPP)' },
    { label: 'Oficina de Formación Ciudadana e Identidad', value: 'Oficina de Formación Ciudadana e Identidad' },
    { label: 'OTIN - Oficina de Tecnologías de la Información', value: 'Oficina de Tecnologías de la Información (OTIN)' },
    { label: 'ORH - Oficina de Recursos Humanos', value: 'Oficina de Recursos Humanos' },
];

// Areas disponibles para Coordinación (sincronizado con Area Responsable de PGD)
const AREAS_DISPONIBLES = [
  "Oficina Técnica de Administración (OTA)",
  "Dirección de Censos y Encuestas (DNCE)",
  "Dirección Técnica de Indicadores (DTI)",
  "Oficina de Administración y Finanzas (OAF)",
  "Oficina de Gestión Documental (OGD)",
  "Oficina de Planificación y Presupuesto (OPP)",
  "Oficina de Formación Ciudadana e Identidad",
  "Oficina de Tecnologías de la Información (OTIN)",
  "Oficina de Recursos Humanos",
];

/**
 * Genera opciones de años basadas en el rango del PGD
 */
function generateYearOptions(anioInicio: number, anioFin: number): MultiSelectOption[] {
    return Array.from(
        { length: anioFin - anioInicio + 1 },
        (_, i) => {
            const year = (anioInicio + i).toString();
            return { label: year, value: year };
        }
    );
}

// Años por defecto si no hay PGD (fallback)
const DEFAULT_YEAR_START = new Date().getFullYear() - 2;
const DEFAULT_YEAR_END = new Date().getFullYear() + 4;

/**
 * Modal simple para PGD/Proyectos (campos básicos)
 */
export function POIModal({
    isOpen,
    onClose,
    project,
    onSave,
    pgdAnioInicio,
    pgdAnioFin,
}: {
    isOpen: boolean;
    onClose: () => void;
    project: Partial<Project> | null;
    onSave: (data: Project) => void;
    pgdAnioInicio?: number;
    pgdAnioFin?: number;
}) {
    const router = useRouter();
    const [formData, setFormData] = React.useState<Partial<Project>>({});
    const [errors, setErrors] = React.useState<{[key: string]: string}>({});

    // Generar opciones de años basadas en el PGD o usar fallback
    const yearOptions = generateYearOptions(
        pgdAnioInicio ?? DEFAULT_YEAR_START,
        pgdAnioFin ?? DEFAULT_YEAR_END
    );

    React.useEffect(() => {
        if (isOpen) {
            if (project) {
                const managementMethod = project.managementMethod ||
                    (project.type === 'Proyecto' ? 'Scrum' : project.type === 'Actividad' ? 'Kanban' : '');
                // Mapear fechas del backend (fechaInicio/fechaFin) a campos del form (startDate/endDate)
                // También mapear areaResponsable a coordination (son el mismo campo en PGD vs POI)
                const projectAny = project as any;
                const projectWithMappedDates = {
                    ...project,
                    managementMethod,
                    startDate: project.startDate || (project as unknown as { fechaInicio?: string }).fechaInicio || '',
                    endDate: project.endDate || (project as unknown as { fechaFin?: string }).fechaFin || '',
                    // coordination y areaResponsable son el mismo dato - usar cualquiera que tenga valor
                    coordination: project.coordination || projectAny.coordinacion || projectAny.areaResponsable || '',
                };
                setFormData(projectWithMappedDates);
            } else {
                setFormData({
                    id: '',
                    name: '',
                    description: '',
                    type: undefined,
                    classification: undefined,
                    status: 'Pendiente',
                    scrumMaster: '',
                    annualAmount: 0,
                    strategicAction: '',
                    years: [],
                    managementMethod: '',
                });
            }
            setErrors({});
        }
    }, [project, isOpen]);

    const validate = () => {
        const newErrors: {[key: string]: string} = {};
        if (!formData.type) newErrors.type = "El tipo es requerido.";
        if (!formData.name) newErrors.name = "El nombre es requerido.";
        if (!formData.description) newErrors.description = "La descripción es requerida.";
        if (!formData.strategicAction) newErrors.strategicAction = "La acción estratégica es requerida.";
        if (!formData.classification) newErrors.classification = "La clasificación es requerida.";
        if (!formData.annualAmount) newErrors.annualAmount = "El monto es requerido.";
        if (!formData.status) newErrors.status = "El estado es requerido.";
        if (!formData.years || formData.years.length === 0) newErrors.years = "El año es requerido.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const handleSave = () => {
        if (!validate()) return;
        onSave({ ...formData as Project, scrumMaster: formData.scrumMaster || '' });
        onClose();
    }

    const handleCancel = () => {
        onClose();
    };

    const isEditMode = !!project?.id;

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCancel(); }}>
            <DialogContent className="sm:max-w-lg p-0" showCloseButton={false}>
                <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between">
                    <DialogTitle>{isEditMode ? 'EDITAR' : 'REGISTRAR'} PLAN OPERATIVO INFORMÁTICO (POI)</DialogTitle>
                    <Button type="button" variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" onClick={handleCancel}>
                        <X className="h-4 w-4" />
                    </Button>
                </DialogHeader>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label>Tipo (Proyecto/Actividad) *</label>
                        <Select value={formData.type} onValueChange={(value) => {
                            const type = value as Project['type'];
                            const managementMethod = type === 'Proyecto' ? 'Scrum' : 'Kanban';
                            setFormData(p => ({...p, type, managementMethod}));
                        }}>
                            <SelectTrigger className={errors.type ? 'border-red-500' : ''}><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Proyecto">Proyecto</SelectItem>
                                <SelectItem value="Actividad">Actividad</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
                    </div>
                    <div>
                       <label>Nombre *</label>
                       <Input placeholder="Ingresar nombre" value={formData.name || ''} onChange={e => setFormData(p => ({...p, name: e.target.value}))} className={errors.name ? 'border-red-500' : ''} />
                       {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                     <div>
                       <label>Descripción *</label>
                       <Textarea placeholder="Ingresar descripción" value={formData.description || ''} onChange={e => setFormData(p => ({...p, description: e.target.value}))} className={errors.description ? 'border-red-500' : ''} />
                       {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                    </div>
                    <div>
                        <label>Acción Estratégica *</label>
                        <Select value={formData.strategicAction} onValueChange={(value) => setFormData(p => ({...p, strategicAction: value}))}>
                            <SelectTrigger className={errors.strategicAction ? 'border-red-500' : ''}><SelectValue placeholder="Seleccionar AE" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="AE N°1">AE N°1</SelectItem>
                                <SelectItem value="AE N°2">AE N°2</SelectItem>
                                <SelectItem value="AE N°3">AE N°3</SelectItem>
                                <SelectItem value="AE N°4">AE N°4</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.strategicAction && <p className="text-red-500 text-xs mt-1">{errors.strategicAction}</p>}
                    </div>
                     <div>
                        <label>Clasificación *</label>
                        <Select value={formData.classification} onValueChange={(value) => setFormData(p => ({...p, classification: value as Project['classification']}))}>
                            <SelectTrigger className={errors.classification ? 'border-red-500' : ''}><SelectValue placeholder="Seleccionar clasificación" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Al ciudadano">Al ciudadano</SelectItem>
                                <SelectItem value="Gestion interna">Gestión interna</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.classification && <p className="text-red-500 text-xs mt-1"> {errors.classification}</p>}
                    </div>
                    <div>
                       <label>Monto total *</label>
                       <Input type="number" placeholder="Ingresar monto" value={formData.annualAmount || ''} onChange={e => setFormData(p => ({...p, annualAmount: Number(e.target.value)}))} className={errors.annualAmount ? 'border-red-500' : ''} />
                        {errors.annualAmount && <p className="text-red-500 text-xs mt-1">{errors.annualAmount}</p>}
                    </div>
                    <div>
                        <label>Estado *</label>
                        <Select value={formData.status} onValueChange={(value) => setFormData(p => ({...p, status: value as Project['status']}))}>
                            <SelectTrigger className={errors.status ? 'border-red-500' : ''}><SelectValue placeholder="Seleccionar estado" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Pendiente">Pendiente</SelectItem>
                                <SelectItem value="En planificación">En planificación</SelectItem>
                                <SelectItem value="En desarrollo">En desarrollo</SelectItem>
                                <SelectItem value="Finalizado">Finalizado</SelectItem>
                            </SelectContent>
                        </Select>
                         {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
                    </div>
                     <div>
                        <label>Año *</label>
                        <MultiSelect
                            options={yearOptions}
                            selected={formData.years || []}
                            onChange={(selected) => setFormData(p => ({...p, years: selected}))}
                            className={errors.years ? 'border-red-500' : ''}
                            placeholder="Seleccionar año(s)"
                        />
                         {errors.years && <p className="text-red-500 text-xs mt-1">{errors.years}</p>}
                    </div>
                </div>
                <DialogFooter className="px-6 pb-6 flex justify-end gap-2">
                     <Button type="button" variant="outline" onClick={handleCancel} style={{borderColor: '#CFD6DD', color: 'black'}}>Cancelar</Button>
                     <Button type="button" onClick={handleSave} style={{backgroundColor: '#018CD1', color: 'white'}}>Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Genera un código de proyecto único
 */
function generateProyectoCodigo(tipo: 'Proyecto' | 'Actividad'): string {
    const prefix = tipo === 'Proyecto' ? 'PROY' : 'ACT';
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
}

/**
 * Modal completo para módulo POI (con todos los campos)
 * Conectado con la API real
 */
export function POIFullModal({
    isOpen,
    onClose,
    project,
    onSave,
    pgdId,
    pgdAnioInicio,
    pgdAnioFin,
}: {
    isOpen: boolean;
    onClose: () => void;
    project: Partial<Project> | null;
    onSave: (data: Project) => void;
    pgdId?: number;
    pgdAnioInicio?: number;
    pgdAnioFin?: number;
}) {
    const { toast } = useToast();

    // Vista actual: 'main' o 'subproject'
    const [currentView, setCurrentView] = useState<'main' | 'subproject'>('main');
    const [formData, setFormData] = useState<Partial<Project> & { accionEstrategicaId?: number; coordinadorId?: number; scrumMasterId?: number; areaUsuaria?: number[] }>({});
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [subProjects, setSubProjects] = useState<SubProject[]>([]);
    const [editingSubProject, setEditingSubProject] = useState<SubProject | null>(null);
    const [subProjectForm, setSubProjectForm] = useState<Partial<SubProject>>({});
    const [subProjectErrors, setSubProjectErrors] = useState<{[key: string]: string}>({});
    const [isSaving, setIsSaving] = useState(false);

    // Estado para el modal de error/advertencia
    const [errorModal, setErrorModal] = useState<{ isOpen: boolean; title: string; message: string }>({
        isOpen: false,
        title: '',
        message: '',
    });
    // Estado para guardar el proyecto cuando hay advertencias de asignación pendientes
    const [pendingSaveProject, setPendingSaveProject] = useState<Project | null>(null);

    // Estado para modal de advertencia de sobrecarga
    const [sobrecargaModal, setSobrecargaModal] = useState<{
        isOpen: boolean;
        personalSobrecargado: Array<{
            id: number;
            nombre: string;
            porcentajeActual: number;
            porcentajeNuevo: number;
            porcentajeTotal: number;
        }>;
    }>({
        isOpen: false,
        personalSobrecargado: [],
    });

    // Datos cargados desde la API
    const [accionesEstrategicas, setAccionesEstrategicas] = useState<AccionEstrategica[]>([]);
    const [coordinadores, setCoordinadores] = useState<Usuario[]>([]);
    const [scrumMasters, setScrumMasters] = useState<Usuario[]>([]);
    const [personalDisponible, setPersonalDisponible] = useState<Personal[]>([]);
    const [desarrolladores, setDesarrolladores] = useState<Personal[]>([]);
    const [implementadores, setImplementadores] = useState<Personal[]>([]);
    const [patrocinadores, setPatrocinadores] = useState<Personal[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    // Estado del PGD para generar años válidos
    const [pgdData, setPgdData] = useState<{ anioInicio: number; anioFin: number }>({
        anioInicio: pgdAnioInicio ?? DEFAULT_YEAR_START,
        anioFin: pgdAnioFin ?? DEFAULT_YEAR_END,
    });

    // Sincronizar pgdData cuando los props cambien
    useEffect(() => {
        if (pgdAnioInicio && pgdAnioFin) {
            setPgdData({
                anioInicio: pgdAnioInicio,
                anioFin: pgdAnioFin,
            });
        }
    }, [pgdAnioInicio, pgdAnioFin]);

    // Generar opciones de años basadas en el PGD
    const yearOptions = generateYearOptions(pgdData.anioInicio, pgdData.anioFin);

    // Cargar datos cuando se abre el modal
    const loadData = useCallback(async () => {
        setLoadingData(true);
        try {
            // Cargar PGD si no se pasaron props de años
            let pgdPromise: Promise<PGD[]> | null = null;
            if (!pgdAnioInicio || !pgdAnioFin) {
                pgdPromise = getPGDs({ activo: true }).catch(() => []);
            }

            // Si tenemos pgdId, filtrar acciones estratégicas por PGD
            // Esto asegura que solo se muestren las AE del PGD seleccionado
            const aesPromise = pgdId
                ? getAccionesEstrategicasByPGD(pgdId).catch(() => [])
                : getAccionesEstrategicas().catch(() => []);

            const [aes, coords, sms, personal, devs, impls, pats, pgds] = await Promise.all([
                aesPromise,
                getCoordinadores().catch(() => []),
                getScrumMasters().catch(() => []), // Solo usuarios con rol SCRUM_MASTER
                getPersonalDisponible().catch(() => []),
                getPersonalDesarrolladores().catch(() => []), // Personal con rol Desarrollador
                getPersonalImplementadores().catch(() => []), // Personal con rol Implementador
                getPersonalPatrocinadores().catch(() => []), // Personal con rol Patrocinador
                pgdPromise,
            ]);
            setAccionesEstrategicas(aes);
            setCoordinadores(coords);
            setScrumMasters(sms);
            setPersonalDisponible(personal);
            setDesarrolladores(devs);
            setImplementadores(impls);
            setPatrocinadores(pats);

            // Si cargamos PGD, actualizar los años
            if (pgds && pgds.length > 0) {
                // Buscar el PGD vigente o el más reciente
                const vigentePGD = pgds.find(p => p.estado === 'VIGENTE') || pgds[0];
                if (vigentePGD) {
                    setPgdData({
                        anioInicio: vigentePGD.anioInicio,
                        anioFin: vigentePGD.anioFin,
                    });
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoadingData(false);
        }
    }, [pgdId, pgdAnioInicio, pgdAnioFin]);

    // Inicializar formulario cuando se abre el modal
    useEffect(() => {
        if (!isOpen) return;

        const initialize = async () => {
            // Primero cargar datos maestros (usuarios, acciones estratégicas)
            await loadData();

            // Luego setear el formulario con los datos del proyecto
            if (project) {
                const managementMethod = project.managementMethod ||
                    (project.type === 'Proyecto' ? 'Scrum' : project.type === 'Actividad' ? 'Kanban' : '');

                // Extraer IDs y campos del backend correctamente desde el proyecto/actividad
                const projectWithIds = project as Partial<Project> & {
                    accionEstrategicaId?: number;
                    coordinadorId?: number;
                    scrumMasterId?: number; // Para Proyectos
                    gestorId?: number; // Para Actividades
                    patrocinadorId?: number;
                    clasificacion?: string; // Campo del backend en español
                };

                // Asegurar que los arrays sean válidos (copia profunda)
                const financialAreaValue = Array.isArray(project.financialArea)
                    ? normalizeFinancialAreas(project.financialArea)
                    : [];
                const yearsValue = Array.isArray(project.years)
                    ? [...project.years]
                    : [];

                // Mapear clasificacion del backend a classification del formulario
                // Backend y frontend usan "Gestion interna" sin tilde y "Al ciudadano"
                const rawClassification = project.classification || projectWithIds.clasificacion;
                let classificationValue: Project['classification'] | undefined = undefined;
                if (rawClassification) {
                    // Normalizar cualquier variante a los valores esperados
                    if (rawClassification.toLowerCase().includes('ciudadano')) {
                        classificationValue = 'Al ciudadano';
                    } else if (rawClassification.toLowerCase().includes('gestion') || rawClassification.toLowerCase().includes('interna')) {
                        classificationValue = 'Gestion interna';
                    }
                }

                // Cargar asignaciones actuales del proyecto/actividad para obtener los responsables
                let responsiblesIds: string[] = [];
                if (project.id) {
                    try {
                        // Usar el endpoint correcto según el tipo
                        const asignaciones = project.type === 'Actividad'
                            ? await getAsignacionesByActividad(project.id)
                            : await getAsignacionesByProyecto(project.id);
                        responsiblesIds = asignaciones.map(a => a.personalId.toString());
                        console.log('Asignaciones cargadas:', asignaciones);
                        console.log('IDs de responsables:', responsiblesIds);
                    } catch (error) {
                        console.warn('Error al cargar asignaciones:', error);
                    }
                }

                // Validar que las fechas estén dentro del rango de años seleccionados
                // Si no lo están, limpiarlas para evitar problemas con el input de fecha
                const getYearFromDate = (dateStr: string | undefined): number | null => {
                    if (!dateStr) return null;
                    const parts = dateStr.split('-');
                    return parts.length >= 1 ? parseInt(parts[0], 10) : null;
                };

                const numericYears = yearsValue.map(y => typeof y === 'string' ? parseInt(y, 10) : y);
                const hasYears = numericYears.length > 0;
                const minYear = hasYears ? Math.min(...numericYears) : 0;
                const maxYear = hasYears ? Math.max(...numericYears) : 0;

                let validStartDate = project.startDate || '';
                let validEndDate = project.endDate || '';

                if (hasYears && validStartDate) {
                    const startYear = getYearFromDate(validStartDate);
                    if (startYear !== null && (startYear < minYear || startYear > maxYear)) {
                        validStartDate = ''; // Limpiar fecha fuera de rango
                    }
                }

                if (hasYears && validEndDate) {
                    const endYear = getYearFromDate(validEndDate);
                    if (endYear !== null && (endYear < minYear || endYear > maxYear)) {
                        validEndDate = ''; // Limpiar fecha fuera de rango
                    }
                }

                // Para Actividades, gestorId se mapea a scrumMasterId en el formulario
                // Para Proyectos, se usa scrumMasterId directamente
                const scrumMasterIdValue = project.type === 'Actividad'
                    ? projectWithIds.gestorId
                    : projectWithIds.scrumMasterId;

                setFormData({
                    ...project,
                    managementMethod,
                    financialArea: financialAreaValue,
                    years: yearsValue,
                    responsibles: responsiblesIds,
                    classification: classificationValue as Project['classification'],
                    accionEstrategicaId: projectWithIds.accionEstrategicaId,
                    coordinadorId: projectWithIds.coordinadorId,
                    scrumMasterId: scrumMasterIdValue,
                    startDate: validStartDate,
                    endDate: validEndDate,
                    areaUsuaria: (project as any).areaUsuaria || [],
                });
                setSubProjects(project.subProjects || []);
            } else {
                setFormData({
                    id: '',
                    name: '',
                    description: '',
                    type: undefined,
                    classification: undefined,
                    status: 'Pendiente',
                    scrumMaster: '',
                    annualAmount: 0,
                    strategicAction: '',
                    years: [],
                    managementMethod: '',
                    financialArea: [],
                    responsibles: [],
                    coordination: '',
                    coordinator: '',
                    startDate: '',
                    endDate: '',
                    accionEstrategicaId: undefined,
                    coordinadorId: undefined,
                    scrumMasterId: undefined,
                    areaUsuaria: [],
                });
                setSubProjects([]);
            }
            setErrors({});
            setCurrentView('main');
            setEditingSubProject(null);
            setSubProjectForm({});
            setSubProjectErrors({});
        };

        initialize();
    }, [project, isOpen, loadData]);

    // Convertir opciones de personal de RRHH a MultiSelectOption
    // Para Proyecto: solo Desarrolladores, para Actividad: solo Implementadores
    const personalParaResponsables = formData.type === 'Proyecto'
        ? desarrolladores
        : formData.type === 'Actividad'
            ? implementadores
            : personalDisponible;

    // Crear opciones base con los desarrolladores/implementadores según el tipo
    const baseResponsibleOptions: MultiSelectOption[] = personalParaResponsables.map(p => ({
        label: formatPersonalNombre(p),
        value: p.id.toString(),
    }));

    // Agregar los responsables ya seleccionados que no estén en la lista base
    // (puede ocurrir si fueron asignados cuando tenían otro rol o si cambiaron de rol)
    const responsibleOptions: MultiSelectOption[] = React.useMemo(() => {
        const baseValues = new Set(baseResponsibleOptions.map(o => o.value));
        const extraOptions: MultiSelectOption[] = [];

        if (formData.responsibles && formData.responsibles.length > 0) {
            for (const respId of formData.responsibles) {
                if (!baseValues.has(respId)) {
                    // Buscar en la lista completa de personal disponible
                    const personal = personalDisponible.find(p => p.id.toString() === respId);
                    if (personal) {
                        extraOptions.push({
                            label: formatPersonalNombre(personal),
                            value: respId,
                        });
                    }
                }
            }
        }

        return [...baseResponsibleOptions, ...extraOptions];
    }, [baseResponsibleOptions, formData.responsibles, personalDisponible]);

    // Opciones de patrocinadores para Área Usuaria (solo para Proyectos)
    const patrocinadorOptions: MultiSelectOption[] = React.useMemo(() => {
        return patrocinadores
            .filter(p => p.usuarioId)
            .map(p => ({
                label: formatPersonalNombre(p),
                value: p.usuarioId!.toString(),
            }));
    }, [patrocinadores]);

    const validate = () => {
        const newErrors: {[key: string]: string} = {};
        if (!formData.type) newErrors.type = "El tipo es requerido.";
        if (!formData.name) newErrors.name = "El nombre es requerido.";
        if (!formData.description) newErrors.description = "La descripción es requerida.";
        if (!formData.accionEstrategicaId) newErrors.strategicAction = "La acción estratégica es requerida.";
        if (!formData.classification) newErrors.classification = "La clasificación es requerida.";
        if (!formData.coordination) newErrors.coordination = "La coordinación es requerida.";
        if (!formData.financialArea || formData.financialArea.length === 0) newErrors.financialArea = "El área financiera es requerida.";
        if (!formData.coordinadorId) newErrors.coordinador = "El coordinador es requerido.";
        if (!formData.scrumMasterId) newErrors.scrumMaster = "El Gestor/Scrum Master es requerido.";
        if (!formData.responsibles || formData.responsibles.length === 0) newErrors.responsibles = "Al menos un responsable es requerido.";
        if (!formData.years || formData.years.length === 0) newErrors.years = "El año es requerido.";
        if (!formData.annualAmount) newErrors.annualAmount = "El monto es requerido.";
        // Función helper para obtener el año de una fecha string (YYYY-MM-DD) sin problemas de timezone
        const getYearFromDateString = (dateStr: string): number => {
            // Parsear directamente del string para evitar problemas de timezone
            const parts = dateStr.split('-');
            return parseInt(parts[0], 10);
        };

        if (!formData.startDate) {
            newErrors.startDate = "La fecha de inicio es requerida.";
        } else if (formData.years && formData.years.length > 0) {
            // Validar que la fecha de inicio esté dentro del rango de años seleccionados
            const selectedYears = formData.years.map(y => typeof y === 'string' ? parseInt(y, 10) : y);
            const minYear = Math.min(...selectedYears);
            const maxYear = Math.max(...selectedYears);
            const fechaInicioYear = getYearFromDateString(formData.startDate);
            if (fechaInicioYear < minYear || fechaInicioYear > maxYear) {
                newErrors.startDate = `La fecha de inicio debe estar dentro del rango de años seleccionados (${minYear} - ${maxYear}).`;
            }
        }
        if (!formData.endDate) {
            newErrors.endDate = "La fecha de fin es requerida.";
        } else if (formData.years && formData.years.length > 0) {
            // Validar que la fecha de fin esté dentro del rango de años seleccionados
            const selectedYears = formData.years.map(y => typeof y === 'string' ? parseInt(y, 10) : y);
            const minYear = Math.min(...selectedYears);
            const maxYear = Math.max(...selectedYears);
            const fechaFinYear = getYearFromDateString(formData.endDate);
            if (fechaFinYear < minYear || fechaFinYear > maxYear) {
                newErrors.endDate = `La fecha de fin debe estar dentro del rango de años seleccionados (${minYear} - ${maxYear}).`;
            }
        }
        // Validar que fecha fin sea mayor o igual a fecha inicio
        if (formData.startDate && formData.endDate) {
            if (formData.endDate < formData.startDate) {
                newErrors.endDate = "La fecha de fin debe ser mayor o igual a la fecha de inicio.";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const validateSubProject = () => {
        const newErrors: {[key: string]: string} = {};
        if (!subProjectForm.name) newErrors.name = "El nombre es requerido.";
        if (!subProjectForm.description) newErrors.description = "La descripción es requerida.";
        if (!subProjectForm.scrumMaster) newErrors.scrumMaster = "El scrum master es requerido.";
        if (!subProjectForm.amount) {
            newErrors.amount = "El monto es requerido.";
        } else {
            // Validar que el monto no exceda el monto del proyecto principal
            const montoProyecto = formData.annualAmount || 0;
            const montoSubproyecto = subProjectForm.amount || 0;

            // Calcular la suma de montos de otros subproyectos (excluyendo el que se está editando)
            const sumOtrosSubproyectos = subProjects
                .filter(sp => sp.id !== editingSubProject?.id)
                .reduce((sum, sp) => sum + (sp.amount || 0), 0);

            const montoTotalConNuevo = sumOtrosSubproyectos + montoSubproyecto;

            if (montoSubproyecto > montoProyecto) {
                newErrors.amount = `El monto no puede exceder el monto del proyecto (S/ ${montoProyecto.toLocaleString('es-PE')}).`;
            } else if (montoTotalConNuevo > montoProyecto) {
                const montoDisponible = montoProyecto - sumOtrosSubproyectos;
                newErrors.amount = `El monto excede el disponible. Monto disponible: S/ ${montoDisponible.toLocaleString('es-PE')}.`;
            }
        }
        if (!subProjectForm.years || subProjectForm.years.length === 0) newErrors.years = "El año es requerido.";

        setSubProjectErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * Verifica si hay personal sobrecargado ANTES de guardar
     * Devuelve true si hay sobrecarga, false si todo está ok
     */
    const verificarSobrecargaAntesDeGuardar = async (): Promise<boolean> => {
        if (!formData.responsibles || formData.responsibles.length === 0) {
            return false; // No hay responsables, continuar normalmente
        }

        const personalSobrecargado: Array<{
            id: number;
            nombre: string;
            porcentajeActual: number;
            porcentajeNuevo: number;
            porcentajeTotal: number;
        }> = [];

        // Verificar cada responsable seleccionado
        for (const responsibleId of formData.responsibles) {
            const personalId = parseInt(responsibleId, 10);
            if (isNaN(personalId)) continue;

            try {
                const resultado = await verificarSobrecarga(personalId);

                // Porcentaje que se asignará (50% por defecto según el backend)
                const porcentajeNuevo = 50;

                // Si asignar 50% excede el 100%, agregar a la lista
                if (resultado.porcentajeDisponible < porcentajeNuevo) {
                    const personal = personalDisponible.find(p => p.id === personalId);
                    const nombrePersonal = personal ? formatPersonalNombre(personal) : `Personal ID ${personalId}`;

                    personalSobrecargado.push({
                        id: personalId,
                        nombre: nombrePersonal,
                        porcentajeActual: resultado.porcentajeActual,
                        porcentajeNuevo: porcentajeNuevo,
                        porcentajeTotal: resultado.porcentajeActual + porcentajeNuevo,
                    });
                }
            } catch (error) {
                console.error(`Error verificando sobrecarga para personal ${personalId}:`, error);
            }
        }

        if (personalSobrecargado.length > 0) {
            // Mostrar modal de advertencia
            setSobrecargaModal({
                isOpen: true,
                personalSobrecargado,
            });
            return true; // Hay sobrecarga, detener el guardado
        }

        return false; // No hay sobrecarga, continuar
    };

    const handleSave = async () => {
        if (!validate()) {
            return;
        }

        // PRIMERO: Verificar sobrecarga ANTES de intentar guardar
        const haySobrecarga = await verificarSobrecargaAntesDeGuardar();
        if (haySobrecarga) {
            return; // Detener el guardado, el modal ya se mostró
        }

        setIsSaving(true);

        try {
            const isEditMode = !!project?.id && project.id !== '';

            // Preparar datos base para la API
            // Tanto frontend como backend usan "Gestion interna" sin tilde
            const clasificacionValue = formData.classification === 'Al ciudadano'
                ? 'Al ciudadano' as const
                : formData.classification === 'Gestion interna'
                    ? 'Gestion interna' as const
                    : undefined;

            const baseData: UpdateProyectoData = {
                nombre: formData.name!,
                descripcion: formData.description,
                clasificacion: clasificacionValue,
                accionEstrategicaId: formData.accionEstrategicaId,
                coordinadorId: formData.coordinadorId,
                scrumMasterId: formData.scrumMasterId,
                coordinacion: formData.coordination,
                // areaResponsable y coordinacion son el mismo campo - sincronizar
                areaResponsable: formData.coordination,
                areasFinancieras: formData.financialArea,
                montoAnual: formData.annualAmount ? Number(formData.annualAmount) : undefined,
                anios: formData.years?.map(y => typeof y === 'string' ? parseInt(y, 10) : y),
                fechaInicio: formData.startDate || undefined,
                fechaFin: formData.endDate || undefined,
                areaUsuaria: formData.areaUsuaria && formData.areaUsuaria.length > 0 ? formData.areaUsuaria : undefined,
            };

            let savedResult: any;
            let syncErrorMessages: string[] = [];

            if (isEditMode) {
                // Para update, verificar el tipo para usar el servicio correcto
                if (formData.type === 'Actividad') {
                    // Actualizar Actividad usando el servicio de actividades
                    const updateActividadData: UpdateActividadInput = {
                        nombre: formData.name!,
                        descripcion: baseData.descripcion,
                        clasificacion: baseData.clasificacion,
                        accionEstrategicaId: baseData.accionEstrategicaId,
                        coordinadorId: baseData.coordinadorId,
                        gestorId: baseData.scrumMasterId, // Mapear scrumMasterId a gestorId para Actividades
                        coordinacion: baseData.coordinacion,
                        areasFinancieras: baseData.areasFinancieras,
                        montoAnual: baseData.montoAnual,
                        anios: baseData.anios,
                        fechaInicio: baseData.fechaInicio,
                        fechaFin: baseData.fechaFin,
                    };
                    savedResult = await updateActividad(project!.id!, updateActividadData);

                    // Sincronizar asignaciones (responsables) para Actividades
                    if (formData.responsibles && formData.responsibles.length >= 0) {
                        try {
                            const personalIds = formData.responsibles.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
                            const syncResult = await syncAsignacionesActividad(
                                parseInt(project!.id!, 10),
                                personalIds
                            );

                            // Convertir errores a mensajes con nombres de personal
                            if (syncResult.errors && syncResult.errors.length > 0) {
                                syncErrorMessages = syncResult.errors.map((err: AsignacionError) => {
                                    const personal = personalDisponible.find(p => p.id === err.personalId);
                                    const nombrePersonal = personal ? formatPersonalNombre(personal) : `Personal ID ${err.personalId}`;

                                    if (err.dedicacionActual !== undefined) {
                                        return `${nombrePersonal}: tiene ${err.dedicacionActual}% de dedicación asignada. Agregar 50% excedería el 100%.`;
                                    }
                                    return `${nombrePersonal}: ${err.mensaje}`;
                                });
                            }
                        } catch (error) {
                            console.error('Error al sincronizar asignaciones de actividad:', error);
                        }
                    }
                } else {
                    // Actualizar Proyecto usando el servicio de proyectos
                    savedResult = await updateProyecto(project!.id!, baseData);

                    // Sincronizar asignaciones (responsables) si cambiaron - solo para Proyectos
                    if (formData.responsibles && formData.responsibles.length >= 0) {
                        try {
                            const personalIds = formData.responsibles.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
                            const syncResult = await syncAsignacionesProyecto(
                                parseInt(project!.id!, 10),
                                personalIds
                            );

                            // Convertir errores a mensajes con nombres de personal
                            if (syncResult.errors && syncResult.errors.length > 0) {
                                syncErrorMessages = syncResult.errors.map((err: AsignacionError) => {
                                    // Buscar el nombre del personal
                                    const personal = personalDisponible.find(p => p.id === err.personalId);
                                    const nombrePersonal = personal ? formatPersonalNombre(personal) : `Personal ID ${err.personalId}`;

                                    if (err.dedicacionActual !== undefined) {
                                        return `${nombrePersonal}: tiene ${err.dedicacionActual}% de dedicación asignada. Agregar 50% excedería el 100%.`;
                                    }
                                    return `${nombrePersonal}: ${err.mensaje}`;
                                });
                            }
                        } catch (error) {
                            console.error('Error al sincronizar asignaciones:', error);
                            // No bloquear el guardado principal
                        }
                    }
                }
            } else {
                // Para create, usar el servicio correcto según el tipo
                if (formData.type === 'Actividad') {
                    // Crear Actividad usando el servicio de actividades
                    // El backend genera el código automáticamente si no se proporciona
                    // Para Actividades: scrumMasterId del formulario se mapea a gestorId
                    const createActividadData: CreateActividadInput = {
                        nombre: formData.name!,
                        descripcion: baseData.descripcion,
                        clasificacion: baseData.clasificacion,
                        accionEstrategicaId: baseData.accionEstrategicaId,
                        coordinadorId: baseData.coordinadorId,
                        gestorId: baseData.scrumMasterId, // Mapear scrumMasterId a gestorId para Actividades
                        coordinacion: baseData.coordinacion,
                        areasFinancieras: baseData.areasFinancieras,
                        montoAnual: baseData.montoAnual,
                        anios: baseData.anios,
                        fechaInicio: baseData.fechaInicio,
                        fechaFin: baseData.fechaFin,
                    };
                    savedResult = await createActividad(createActividadData);

                    // Sincronizar asignaciones para nueva actividad
                    if (savedResult?.id && formData.responsibles && formData.responsibles.length > 0) {
                        try {
                            const personalIds = formData.responsibles.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
                            const syncResult = await syncAsignacionesActividad(savedResult.id, personalIds);

                            // Convertir errores a mensajes con nombres de personal
                            if (syncResult.errors && syncResult.errors.length > 0) {
                                syncErrorMessages = syncResult.errors.map((err: AsignacionError) => {
                                    const personal = personalDisponible.find(p => p.id === err.personalId);
                                    const nombrePersonal = personal ? formatPersonalNombre(personal) : `Personal ID ${err.personalId}`;

                                    if (err.dedicacionActual !== undefined) {
                                        return `${nombrePersonal}: tiene ${err.dedicacionActual}% de dedicación asignada. Agregar 50% excedería el 100%.`;
                                    }
                                    return `${nombrePersonal}: ${err.mensaje}`;
                                });
                            }
                        } catch (error) {
                            console.warn('Error al asignar responsables a actividad:', error);
                        }
                    }
                } else {
                    // Crear Proyecto usando el servicio de proyectos
                    const generatedCode = formData.code || generateProyectoCodigo(formData.type as 'Proyecto' | 'Actividad');
                    const createData: CreateProyectoData = {
                        codigo: generatedCode,
                        nombre: formData.name!,
                        descripcion: baseData.descripcion,
                        clasificacion: baseData.clasificacion,
                        accionEstrategicaId: baseData.accionEstrategicaId,
                        coordinadorId: baseData.coordinadorId,
                        scrumMasterId: baseData.scrumMasterId,
                        coordinacion: baseData.coordinacion,
                        areasFinancieras: baseData.areasFinancieras,
                        montoAnual: baseData.montoAnual,
                        anios: baseData.anios,
                        fechaInicio: baseData.fechaInicio,
                        fechaFin: baseData.fechaFin,
                        areaUsuaria: baseData.areaUsuaria,
                    };
                    savedResult = await createProyecto(createData);

                    // Sincronizar asignaciones para nuevo proyecto (solo para Proyectos)
                    if (savedResult?.id && formData.responsibles && formData.responsibles.length > 0) {
                        try {
                            const personalIds = formData.responsibles.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
                            await syncAsignacionesProyecto(savedResult.id, personalIds);
                        } catch (error) {
                            console.warn('Error al asignar responsables:', error);
                        }
                    }
                }
            }

            // Guardar subproyectos si es tipo Proyecto
            const proyectoId = savedResult?.id || (project?.id ? parseInt(project.id, 10) : null);
            if (formData.type === 'Proyecto' && proyectoId && subProjects.length > 0) {
                try {
                    // Obtener subproyectos existentes del backend
                    const existingSubproyectos = isEditMode
                        ? await getSubproyectosByProyecto(proyectoId)
                        : [];

                    // Identificar subproyectos a crear, actualizar y eliminar
                    const existingIds = existingSubproyectos.map(sp => sp.id);
                    const currentIds = subProjects
                        .filter(sp => sp.id && !sp.id.startsWith('sp-')) // Solo IDs numéricos reales
                        .map(sp => parseInt(sp.id, 10));

                    // Eliminar subproyectos que ya no están
                    for (const existingSp of existingSubproyectos) {
                        if (!currentIds.includes(existingSp.id)) {
                            await deleteSubproyecto(existingSp.id);
                        }
                    }

                    // Crear o actualizar subproyectos
                    const proyectoCodigo = savedResult?.codigo || formData.code || `PROY-${proyectoId}`;
                    let subIndex = existingSubproyectos.length;

                    for (const sp of subProjects) {
                        const isNewSubproject = sp.id.startsWith('sp-'); // IDs temporales empiezan con 'sp-'

                        // Obtener el scrumMasterId del nombre del scrumMaster
                        const smUser = scrumMasters.find(sm => formatUsuarioNombre(sm) === sp.scrumMaster);
                        const scrumMasterId = smUser?.id;

                        // Obtener IDs de responsables para asignaciones
                        const responsablesIds = sp.responsible?.map(r => parseInt(r, 10)).filter(n => !isNaN(n)) || [];

                        if (isNewSubproject) {
                            // Crear nuevo subproyecto
                            const aniosNumeros = sp.years?.map(y => parseInt(y, 10)).filter(n => !isNaN(n)) || [];
                            // Obtener el siguiente código disponible (formato SUB-001, SUB-002, etc.)
                            const nextCodigo = await getNextSubproyectoCodigo(proyectoId);
                            const newSubproyecto = await createSubproyecto({
                                proyectoPadreId: proyectoId,
                                codigo: nextCodigo,
                                nombre: sp.name,
                                descripcion: sp.description,
                                monto: sp.amount,
                                anios: aniosNumeros,
                                areasFinancieras: sp.financialArea || [],
                                scrumMasterId: scrumMasterId,
                            });
                            subIndex++;

                            // Sincronizar asignaciones para el nuevo subproyecto
                            if (newSubproyecto?.id && responsablesIds.length > 0) {
                                try {
                                    await syncAsignacionesSubproyecto(newSubproyecto.id, responsablesIds);
                                    console.log('Asignaciones de subproyecto sincronizadas:', newSubproyecto.id);
                                } catch (error) {
                                    console.warn('Error al sincronizar asignaciones del subproyecto:', error);
                                }
                            }
                        } else {
                            // Actualizar subproyecto existente
                            const aniosNumeros = sp.years?.map(y => parseInt(y, 10)).filter(n => !isNaN(n)) || [];
                            const subproyectoId = parseInt(sp.id, 10);
                            await updateSubproyecto(subproyectoId, {
                                nombre: sp.name,
                                descripcion: sp.description,
                                monto: sp.amount,
                                anios: aniosNumeros,
                                areasFinancieras: sp.financialArea || [],
                                scrumMasterId: scrumMasterId,
                            });

                            // Sincronizar asignaciones para subproyecto existente
                            try {
                                await syncAsignacionesSubproyecto(subproyectoId, responsablesIds);
                                console.log('Asignaciones de subproyecto actualizadas:', subproyectoId);
                            } catch (error) {
                                console.warn('Error al sincronizar asignaciones del subproyecto:', error);
                            }
                        }
                    }
                } catch (error) {
                    console.warn('Error al guardar subproyectos:', error);
                    // No bloquear el guardado principal
                }
            }

            // Crear objeto Project para callback con los datos actualizados del backend
            const savedProject: Project = {
                ...formData as Project,
                id: savedResult?.id?.toString() || formData.id || Date.now().toString(),
                name: savedResult?.nombre || formData.name || '',
                description: savedResult?.descripcion || formData.description || '',
                scrumMaster: formData.scrumMaster || '',
                subProjects: subProjects,
            };

            // Blur active element before closing
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }

            // Si hubo errores de asignación, mostrar modal de advertencia
            // El usuario deberá cerrar el modal de advertencia antes de continuar
            if (syncErrorMessages.length > 0) {
                setPendingSaveProject(savedProject);
                setErrorModal({
                    isOpen: true,
                    title: 'Advertencia de Asignación',
                    message: `El proyecto se guardó correctamente, pero los siguientes responsables no pudieron ser asignados:\n\n• ${syncErrorMessages.join('\n• ')}\n\nEstos usuarios no serán asignados al proyecto.`,
                });
                setIsSaving(false);
                return; // El cierre se manejará cuando el usuario cierre el AlertDialog
            }

            // Primero cerrar el modal, luego notificar al padre
            // Esto evita problemas de estado
            onClose();

            // Notificar al padre después de cerrar - el padre recargará desde API
            // Usamos setTimeout para asegurar que el modal se cerró completamente
            setTimeout(() => {
                onSave(savedProject);
            }, 50);

        } catch (error: unknown) {
            // Extraer mensaje de error del backend
            let errorMessage = 'Error al guardar el POI';
            let errorTitle = 'Error';

            if (error && typeof error === 'object') {
                const axiosError = error as { response?: { data?: { message?: string; error?: { message?: string } } } };

                // Intentar obtener el mensaje del backend
                if (axiosError.response?.data?.message) {
                    errorMessage = axiosError.response.data.message;
                } else if (axiosError.response?.data?.error?.message) {
                    errorMessage = axiosError.response.data.error.message;
                } else if (error instanceof Error) {
                    errorMessage = error.message;
                }

                // Detectar errores de validación específicos para mostrar advertencia más clara
                if (errorMessage.includes('fecha') || errorMessage.includes('rango')) {
                    errorTitle = 'Error de Validación de Fechas';
                } else if (errorMessage.includes('requerido') || errorMessage.includes('obligatorio')) {
                    errorTitle = 'Campos Requeridos';
                }
            }

            // Mostrar modal de advertencia en lugar de solo toast
            setErrorModal({
                isOpen: true,
                title: errorTitle,
                message: errorMessage,
            });

            setIsSaving(false);
        }
    }

    const handleCancel = () => {
        // Blur active element before closing
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        onClose();
    };

    // Handle dialog close with proper focus management
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
            onClose();
        }
    };

    // Subproyecto handlers
    const openSubProjectForm = async (subProject?: SubProject) => {
        if (subProject) {
            setEditingSubProject(subProject);
            // Si es un subproyecto existente (ID numérico), cargar asignaciones
            const isExistingSubproject = subProject.id && !subProject.id.startsWith('sp-');
            let responsiblesFromAsignaciones: string[] = subProject.responsible || [];

            if (isExistingSubproject) {
                try {
                    const asignaciones = await getAsignacionesBySubproyecto(subProject.id);
                    responsiblesFromAsignaciones = asignaciones.map(a => a.personalId.toString());
                    console.log('Asignaciones de subproyecto cargadas:', asignaciones);
                } catch (error) {
                    console.warn('Error al cargar asignaciones del subproyecto:', error);
                }
            }

            setSubProjectForm({ ...subProject, responsible: responsiblesFromAsignaciones });
        } else {
            setEditingSubProject(null);
            setSubProjectForm({
                id: '',
                name: '',
                description: '',
                responsible: [],
                scrumMaster: '',
                years: [],
                amount: 0,
                managementMethod: 'Scrum',
                financialArea: [],
                coordinador: '',
                coordinacion: '',
                fechaInicio: '',
                fechaFin: '',
            });
        }
        setSubProjectErrors({});
        setCurrentView('subproject');
    };

    const saveSubProject = () => {
        if (!validateSubProject()) return;

        if (editingSubProject) {
            setSubProjects(prev => prev.map(sp =>
                sp.id === editingSubProject.id ? { ...subProjectForm as SubProject, id: sp.id } : sp
            ));
        } else {
            setSubProjects(prev => [...prev, { ...subProjectForm as SubProject, id: `sp-${Date.now()}` }]);
        }
        setCurrentView('main');
        setEditingSubProject(null);
        setSubProjectForm({});
    };

    const cancelSubProject = () => {
        setCurrentView('main');
        setEditingSubProject(null);
        setSubProjectForm({});
        setSubProjectErrors({});
    };

    const deleteSubProject = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSubProjects(prev => prev.filter(sp => sp.id !== id));
    };

    const isEditMode = !!project?.id && project.id !== '';
    const isProyecto = formData.type === 'Proyecto';

    // Opciones de responsables y años para subproyecto
    // Filtrar solo DESARROLLADORES asignados al proyecto padre para subproyectos
    const subResponsibleOptions: MultiSelectOption[] = (formData.responsibles && formData.responsibles.length > 0)
        ? formData.responsibles
            .filter(id => {
                // Solo incluir si este personal es un Desarrollador
                return desarrolladores.some(dev => dev.id.toString() === id);
            })
            .map(id => {
                const personal = personalDisponible.find(p => p.id.toString() === id);
                return {
                    label: personal ? formatPersonalNombre(personal) : id,
                    value: id,
                };
            })
        : []; // Sin fallback - si el proyecto padre no tiene responsables desarrolladores, el subproyecto no puede tener ninguno

    const subYearOptions: MultiSelectOption[] = (formData.years && formData.years.length > 0)
        ? formData.years.map(y => ({ label: y, value: y }))
        : yearOptions;

    if (!isOpen) return null;

    return (
        <>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-4xl p-0" showCloseButton={false}>
                {currentView === 'main' ? (
                    <>
                        <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between">
                            <DialogTitle>{isEditMode ? 'EDITAR' : 'REGISTRAR'} PLAN OPERATIVO INFORMÁTICO (POI)</DialogTitle>
                            <Button type="button" variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" onClick={handleCancel}>
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogHeader>
                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            {loadingData ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-[#018CD1]" />
                                    <span className="ml-2">Cargando datos...</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                    {/* Primera columna */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium">Tipo (Proyecto/Actividad) *</label>
                                            <Select value={formData.type} onValueChange={(value) => {
                                                const type = value as Project['type'];
                                                const managementMethod = type === 'Proyecto' ? 'Scrum' : 'Kanban';
                                                setFormData(p => ({...p, type, managementMethod}));
                                                if (type === 'Actividad') {
                                                    setSubProjects([]);
                                                }
                                            }}>
                                                <SelectTrigger className={errors.type ? 'border-red-500' : ''}><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Proyecto">Proyecto</SelectItem>
                                                    <SelectItem value="Actividad">Actividad</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
                                        </div>
                                        <div>
                                           <label className="text-sm font-medium">Nombre *</label>
                                           <Input placeholder="Ingresar nombre" value={formData.name || ''} onChange={e => {
                                               setFormData(p => ({...p, name: e.target.value}));
                                               if (errors.name) setErrors(prev => ({...prev, name: ''}));
                                           }} className={errors.name ? 'border-red-500' : ''} />
                                           {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                        </div>
                                         <div>
                                           <label className="text-sm font-medium">Descripción *</label>
                                           <Textarea
                                               placeholder="Ingresar descripción"
                                               value={formData.description || ''}
                                               onChange={e => {
                                                   setFormData(p => ({...p, description: e.target.value}));
                                                   if (errors.description) setErrors(prev => ({...prev, description: ''}));
                                               }}
                                               className={`min-h-[80px] ${errors.description ? 'border-red-500' : ''}`}
                                           />
                                           {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                                        </div>

                                        {/* Sección de subproyectos - solo para tipo Proyecto */}
                                        {isProyecto && (
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-sm font-medium">Agregar subproyectos</label>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="h-8 px-3 bg-[#018CD1] hover:bg-[#0177b3] text-white"
                                                        onClick={() => openSubProjectForm()}
                                                    >
                                                        <Plus className="h-4 w-4 mr-1" />
                                                        Agregar
                                                    </Button>
                                                </div>
                                                {subProjects.length > 0 && (
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Subproyecto</TableHead>
                                                                <TableHead>Monto</TableHead>
                                                                <TableHead>Scrum Master</TableHead>
                                                                <TableHead className="w-10"></TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {subProjects.map((sp) => {
                                                                // Verificar si es un subproyecto existente (ID numérico) o temporal (sp-X)
                                                                const isExisting = !sp.id.toString().startsWith('sp-');
                                                                const handleRowClick = () => {
                                                                    // Abrir formulario de edición para todos los subproyectos
                                                                    openSubProjectForm(sp);
                                                                };

                                                                return (<TableRow
                                                                    key={sp.id}
                                                                    className="cursor-pointer hover:bg-gray-100"
                                                                    onClick={handleRowClick}
                                                                >
                                                                    <TableCell>{sp.name}</TableCell>
                                                                    <TableCell>S/ {sp.amount?.toLocaleString('es-PE')}</TableCell>
                                                                    <TableCell>{sp.scrumMaster}</TableCell>
                                                                    <TableCell>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                            onClick={(e) => deleteSubProject(sp.id, e)}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </TableCell>
                                                                </TableRow>);
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                )}
                                            </div>
                                        )}

                                        <div>
                                            <label className="text-sm font-medium">Acción Estratégica *</label>
                                            <Select
                                                value={formData.accionEstrategicaId?.toString() || ''}
                                                onValueChange={(value) => {
                                                    const ae = accionesEstrategicas.find(a => a.id.toString() === value);
                                                    setFormData(p => ({
                                                        ...p,
                                                        accionEstrategicaId: parseInt(value, 10),
                                                        strategicAction: ae ? `${ae.codigo} - ${ae.nombre}` : '',
                                                    }));
                                                    if (errors.strategicAction) setErrors(prev => ({...prev, strategicAction: ''}));
                                                }}
                                            >
                                                <SelectTrigger className={errors.strategicAction ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Seleccionar AE" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {accionesEstrategicas.map((ae) => (
                                                        <SelectItem key={ae.id} value={ae.id.toString()}>
                                                            {ae.codigo} - {ae.nombre}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.strategicAction && <p className="text-red-500 text-xs mt-1">{errors.strategicAction}</p>}
                                            {/* Mostrar OEI vinculado si la AE tiene relación con AEIs que pertenecen a OEIs */}
                                            {formData.accionEstrategicaId && (() => {
                                                const ae = accionesEstrategicas.find(a => a.id === formData.accionEstrategicaId);
                                                const oeis = ae?.oegd?.oegdAeis?.map(oa => oa.aei?.oei).filter(Boolean);
                                                const uniqueOeis = oeis?.filter((oei, index, self) =>
                                                    oei && index === self.findIndex(o => o?.id === oei.id)
                                                );
                                                if (uniqueOeis && uniqueOeis.length > 0) {
                                                    return (
                                                        <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
                                                            <span className="font-medium">OEI vinculado:</span>{' '}
                                                            {uniqueOeis.map((oei, idx) => (
                                                                <span key={oei?.id}>
                                                                    {idx > 0 && ', '}
                                                                    <span className="font-semibold">{oei?.codigo}</span> - {oei?.nombre}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                         <div>
                                            <label className="text-sm font-medium">Clasificación *</label>
                                            <Select value={formData.classification} onValueChange={(value) => setFormData(p => ({...p, classification: value as Project['classification']}))}>
                                                <SelectTrigger className={errors.classification ? 'border-red-500' : ''}><SelectValue placeholder="Seleccionar clasificación" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Al ciudadano">Al ciudadano</SelectItem>
                                                    <SelectItem value="Gestion interna">Gestión interna</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.classification && <p className="text-red-500 text-xs mt-1">{errors.classification}</p>}
                                        </div>
                                        <div>
                                           <label className="text-sm font-medium">Coordinación *</label>
                                           <Select
                                               value={formData.coordination || ''}
                                               onValueChange={(value) => {
                                                   setFormData(p => ({...p, coordination: value}));
                                                   if (errors.coordination) setErrors(prev => ({...prev, coordination: ''}));
                                               }}
                                           >
                                               <SelectTrigger className={errors.coordination ? 'border-red-500' : ''}>
                                                   <SelectValue placeholder="Seleccionar coordinación" />
                                               </SelectTrigger>
                                               <SelectContent>
                                                   {AREAS_DISPONIBLES.map((area) => (
                                                       <SelectItem key={area} value={area}>{area}</SelectItem>
                                                   ))}
                                               </SelectContent>
                                           </Select>
                                           {errors.coordination && <p className="text-red-500 text-xs mt-1">{errors.coordination}</p>}
                                        </div>
                                    </div>

                                    {/* Segunda columna */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium">Área Financiera *</label>
                                            <MultiSelect
                                                options={(() => {
                                                    // Combinar opciones predefinidas con valores existentes que no estén en las opciones
                                                    const existingValues = formData.financialArea || [];
                                                    const predefinedValues = financialAreaOptions.map(o => o.value);
                                                    const extraOptions = existingValues
                                                        .filter(v => !predefinedValues.includes(v))
                                                        .map(v => ({ label: v, value: v }));
                                                    return [...financialAreaOptions, ...extraOptions];
                                                })()}
                                                selected={formData.financialArea || []}
                                                onChange={(selected) => {
                                                    setFormData(p => ({...p, financialArea: selected}));
                                                    if (errors.financialArea) setErrors(prev => ({...prev, financialArea: ''}));
                                                }}
                                                placeholder="Seleccionar área(s)"
                                                className={errors.financialArea ? 'border-red-500' : ''}
                                            />
                                            {errors.financialArea && <p className="text-red-500 text-xs mt-1">{errors.financialArea}</p>}
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Coordinador *</label>
                                            <Select
                                                value={formData.coordinadorId?.toString() || ''}
                                                onValueChange={(value) => {
                                                    const coord = coordinadores.find(c => c.id.toString() === value);
                                                    setFormData(p => ({
                                                        ...p,
                                                        coordinadorId: parseInt(value, 10),
                                                        coordinator: coord ? formatUsuarioNombre(coord) : '',
                                                    }));
                                                    if (errors.coordinador) setErrors(prev => ({...prev, coordinador: ''}));
                                                }}
                                            >
                                                <SelectTrigger className={errors.coordinador ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Seleccionar coordinador" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {coordinadores.map((coord) => (
                                                        <SelectItem key={coord.id} value={coord.id.toString()}>
                                                            {formatUsuarioNombre(coord)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.coordinador && <p className="text-red-500 text-xs mt-1">{errors.coordinador}</p>}
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">
                                                {formData.type === 'Actividad' ? 'Gestor *' : 'Scrum Master *'}
                                            </label>
                                            <Select
                                                value={formData.scrumMasterId?.toString() || ''}
                                                onValueChange={(value) => {
                                                    // Para Actividad usar coordinadores + scrumMasters (gestor puede ser cualquiera de esos roles), para Proyecto usar scrumMasters
                                                    const gestorList = [...coordinadores, ...scrumMasters.filter(sm => !coordinadores.some(c => c.id === sm.id))];
                                                    const listaUsuarios = formData.type === 'Actividad' ? gestorList : scrumMasters;
                                                    const usuario = listaUsuarios.find(u => u.id.toString() === value);
                                                    setFormData(p => ({
                                                        ...p,
                                                        scrumMasterId: parseInt(value, 10),
                                                        scrumMaster: usuario ? formatUsuarioNombre(usuario) : '',
                                                    }));
                                                    if (errors.scrumMaster) setErrors(prev => ({...prev, scrumMaster: ''}));
                                                }}
                                            >
                                                <SelectTrigger className={errors.scrumMaster ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder={formData.type === 'Actividad' ? 'Seleccionar gestor' : 'Seleccionar scrum master'} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {/* Para Actividad mostrar Coordinadores + Scrum Masters, para Proyecto mostrar SM + Coordinadores */}
                                                    {(formData.type === 'Actividad' ? [...coordinadores, ...scrumMasters.filter(sm => !coordinadores.some(c => c.id === sm.id))] : scrumMasters).map((usuario) => (
                                                        <SelectItem key={usuario.id} value={usuario.id.toString()}>
                                                            {formatUsuarioNombre(usuario)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.scrumMaster && <p className="text-red-500 text-xs mt-1">{errors.scrumMaster}</p>}
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Responsable *</label>
                                            <MultiSelect
                                                options={responsibleOptions}
                                                selected={formData.responsibles || []}
                                                onChange={(selected) => {
                                                    setFormData(p => ({...p, responsibles: selected}));
                                                    if (errors.responsibles) setErrors(prev => ({...prev, responsibles: ''}));
                                                }}
                                                placeholder="Seleccionar responsable(s)"
                                                className={errors.responsibles ? 'border-red-500' : ''}
                                            />
                                            {errors.responsibles && <p className="text-red-500 text-xs mt-1">{errors.responsibles}</p>}
                                        </div>
                                        {formData.type === 'Proyecto' && (
                                        <div>
                                            <label className="text-sm font-medium">Área Usuaria</label>
                                            <MultiSelect
                                                options={patrocinadorOptions}
                                                selected={(formData.areaUsuaria || []).map(String)}
                                                onChange={(selected) => {
                                                    setFormData(p => ({...p, areaUsuaria: selected.map(Number)}));
                                                }}
                                                placeholder="Seleccionar patrocinador(es)"
                                            />
                                        </div>
                                        )}
                                        <div>
                                            <label className="text-sm font-medium">Año *</label>
                                            <MultiSelect
                                                options={yearOptions}
                                                selected={formData.years || []}
                                                onChange={(selected) => {
                                                    // Calcular nuevo rango de años
                                                    const newYears = selected.map(y => typeof y === 'string' ? parseInt(y, 10) : y);
                                                    const hasNewYears = newYears.length > 0;
                                                    const newMinYear = hasNewYears ? Math.min(...newYears) : 0;
                                                    const newMaxYear = hasNewYears ? Math.max(...newYears) : 0;

                                                    setFormData(p => {
                                                        let newStartDate = p.startDate;
                                                        let newEndDate = p.endDate;

                                                        // Verificar si las fechas existentes están fuera del nuevo rango
                                                        // Helper para obtener año sin problemas de timezone
                                                        const getYear = (dateStr: string) => parseInt(dateStr.split('-')[0], 10);

                                                        if (hasNewYears && newStartDate) {
                                                            const startYear = getYear(newStartDate);
                                                            if (startYear < newMinYear || startYear > newMaxYear) {
                                                                newStartDate = ''; // Limpiar fecha fuera de rango
                                                            }
                                                        }
                                                        if (hasNewYears && newEndDate) {
                                                            const endYear = getYear(newEndDate);
                                                            if (endYear < newMinYear || endYear > newMaxYear) {
                                                                newEndDate = ''; // Limpiar fecha fuera de rango
                                                            }
                                                        }

                                                        return {
                                                            ...p,
                                                            years: selected,
                                                            startDate: newStartDate,
                                                            endDate: newEndDate,
                                                        };
                                                    });
                                                    if (errors.years) setErrors(prev => ({...prev, years: ''}));
                                                }}
                                                className={errors.years ? 'border-red-500' : ''}
                                                placeholder="Seleccionar año(s)"
                                            />
                                             {errors.years && <p className="text-red-500 text-xs mt-1">{errors.years}</p>}
                                        </div>
                                        <div>
                                           <label className="text-sm font-medium">Monto total *</label>
                                           <Input
                                               type="number"
                                               placeholder="Ingresar monto"
                                               value={formData.annualAmount || ''}
                                               onChange={e => {
                                                   setFormData(p => ({...p, annualAmount: Number(e.target.value)}));
                                                   if (errors.annualAmount) setErrors(prev => ({...prev, annualAmount: ''}));
                                               }}
                                               className={errors.annualAmount ? 'border-red-500' : ''}
                                           />
                                            {errors.annualAmount && <p className="text-red-500 text-xs mt-1">{errors.annualAmount}</p>}
                                        </div>
                                        <div>
                                           <label className="text-sm font-medium">Método de gestión de proyecto</label>
                                           <Input
                                               value={formData.managementMethod || ''}
                                               readOnly
                                               className="bg-gray-100"
                                               placeholder="Se asigna automáticamente según el tipo"
                                           />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            {(() => {
                                                // Calcular fechas mínima y máxima basadas en años seleccionados
                                                const selectedYears = formData.years?.map(y => typeof y === 'string' ? parseInt(y, 10) : y) || [];
                                                const hasYears = selectedYears.length > 0;
                                                const minYear = hasYears ? Math.min(...selectedYears) : undefined;
                                                const maxYear = hasYears ? Math.max(...selectedYears) : undefined;
                                                const minDate = minYear ? `${minYear}-01-01` : undefined;
                                                const maxDate = maxYear ? `${maxYear}-12-31` : undefined;

                                                return (
                                                    <>
                                                        <div>
                                                            <label className="text-sm font-medium">Fecha inicio *</label>
                                                            {hasYears && (
                                                                <p className="text-xs text-gray-500 mb-1">Rango permitido: {minYear} - {maxYear}</p>
                                                            )}
                                                            <Input
                                                                type="date"
                                                                value={formData.startDate || ''}
                                                                min={minDate}
                                                                max={maxDate}
                                                                onChange={e => {
                                                                    setFormData(p => ({...p, startDate: e.target.value}));
                                                                    if (errors.startDate) setErrors(prev => ({...prev, startDate: ''}));
                                                                }}
                                                                className={errors.startDate ? 'border-red-500' : ''}
                                                                disabled={!hasYears}
                                                            />
                                                            {!hasYears && <p className="text-xs text-amber-600 mt-1">Seleccione primero los años del proyecto</p>}
                                                            {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-medium">Fecha fin *</label>
                                                            {hasYears && (
                                                                <p className="text-xs text-gray-500 mb-1">Rango permitido: {minYear} - {maxYear}</p>
                                                            )}
                                                            <Input
                                                                type="date"
                                                                value={formData.endDate || ''}
                                                                min={minDate}
                                                                max={maxDate}
                                                                onChange={e => {
                                                                    setFormData(p => ({...p, endDate: e.target.value}));
                                                                    if (errors.endDate) setErrors(prev => ({...prev, endDate: ''}));
                                                                }}
                                                                className={errors.endDate ? 'border-red-500' : ''}
                                                                disabled={!hasYears}
                                                            />
                                                            {!hasYears && <p className="text-xs text-amber-600 mt-1">Seleccione primero los años del proyecto</p>}
                                                            {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter className="px-6 pb-6 flex justify-end gap-2">
                             <Button type="button" variant="outline" onClick={handleCancel} style={{borderColor: '#CFD6DD', color: 'black'}} disabled={isSaving}>Cancelar</Button>
                             <Button type="button" onClick={handleSave} style={{backgroundColor: '#018CD1', color: 'white'}} disabled={isSaving || loadingData}>
                                 {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                 Guardar
                             </Button>
                        </DialogFooter>
                    </>
                ) : (
                    /* Vista de Subproyecto */
                    <>
                        <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between">
                            <DialogTitle>{editingSubProject ? 'EDITAR' : 'REGISTRAR'} SUBPROYECTO</DialogTitle>
                            <Button type="button" variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" onClick={cancelSubProject}>
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogHeader>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div>
                                <label className="text-sm font-medium">Nombre *</label>
                                <Input
                                    placeholder="Ingresar nombre"
                                    value={subProjectForm.name || ''}
                                    onChange={(e) => {
                                        setSubProjectForm(p => ({ ...p, name: e.target.value }));
                                        if (subProjectErrors.name) setSubProjectErrors(prev => ({...prev, name: ''}));
                                    }}
                                    className={subProjectErrors.name ? 'border-red-500' : ''}
                                />
                                {subProjectErrors.name && <p className="text-red-500 text-xs mt-1">{subProjectErrors.name}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium">Descripción *</label>
                                <Textarea
                                    placeholder="Ingresar descripción"
                                    value={subProjectForm.description || ''}
                                    onChange={(e) => {
                                        setSubProjectForm(p => ({ ...p, description: e.target.value }));
                                        if (subProjectErrors.description) setSubProjectErrors(prev => ({...prev, description: ''}));
                                    }}
                                    className={`min-h-[80px] ${subProjectErrors.description ? 'border-red-500' : ''}`}
                                />
                                {subProjectErrors.description && <p className="text-red-500 text-xs mt-1">{subProjectErrors.description}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium">Área Financiera</label>
                                <MultiSelect
                                    options={(() => {
                                        const existingValues = subProjectForm.financialArea || [];
                                        const predefinedValues = financialAreaOptions.map(o => o.value);
                                        const extraOptions = existingValues
                                            .filter(v => !predefinedValues.includes(v))
                                            .map(v => ({ label: v, value: v }));
                                        return [...financialAreaOptions, ...extraOptions];
                                    })()}
                                    selected={subProjectForm.financialArea || []}
                                    onChange={(selected) => setSubProjectForm(p => ({ ...p, financialArea: selected }))}
                                    placeholder="Seleccionar área(s)"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Responsable</label>
                                <MultiSelect
                                    options={subResponsibleOptions}
                                    selected={subProjectForm.responsible || []}
                                    onChange={(selected) => setSubProjectForm(p => ({ ...p, responsible: selected }))}
                                    placeholder="Seleccionar responsable(s)"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Gestor/Scrum Master *</label>
                                <Select
                                    value={subProjectForm.scrumMaster || ''}
                                    onValueChange={(value) => {
                                        setSubProjectForm(p => ({ ...p, scrumMaster: value }));
                                        if (subProjectErrors.scrumMaster) setSubProjectErrors(prev => ({...prev, scrumMaster: ''}));
                                    }}
                                >
                                    <SelectTrigger className={subProjectErrors.scrumMaster ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Seleccionar scrum master" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {scrumMasters.map((sm) => (
                                            <SelectItem key={sm.id} value={formatUsuarioNombre(sm)}>
                                                {formatUsuarioNombre(sm)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {subProjectErrors.scrumMaster && <p className="text-red-500 text-xs mt-1">{subProjectErrors.scrumMaster}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium">Año *</label>
                                <MultiSelect
                                    options={subYearOptions}
                                    selected={subProjectForm.years || []}
                                    onChange={(selected) => {
                                        setSubProjectForm(p => ({ ...p, years: selected }));
                                        if (subProjectErrors.years) setSubProjectErrors(prev => ({...prev, years: ''}));
                                    }}
                                    className={subProjectErrors.years ? 'border-red-500' : ''}
                                    placeholder="Seleccionar año(s)"
                                />
                                {subProjectErrors.years && <p className="text-red-500 text-xs mt-1">{subProjectErrors.years}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium">Monto anual *</label>
                                {/* Mostrar información del monto disponible */}
                                {formData.annualAmount && (
                                    <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200 mb-2">
                                        <div className="flex justify-between">
                                            <span>Monto del proyecto:</span>
                                            <span className="font-semibold">S/ {(formData.annualAmount || 0).toLocaleString('es-PE')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Asignado a subproyectos:</span>
                                            <span className="font-semibold">S/ {subProjects
                                                .filter(sp => sp.id !== editingSubProject?.id)
                                                .reduce((sum, sp) => sum + (sp.amount || 0), 0)
                                                .toLocaleString('es-PE')}</span>
                                        </div>
                                        <div className="flex justify-between text-green-700 font-medium border-t border-blue-300 pt-1 mt-1">
                                            <span>Disponible:</span>
                                            <span>S/ {((formData.annualAmount || 0) - subProjects
                                                .filter(sp => sp.id !== editingSubProject?.id)
                                                .reduce((sum, sp) => sum + (sp.amount || 0), 0))
                                                .toLocaleString('es-PE')}</span>
                                        </div>
                                    </div>
                                )}
                                <Input
                                    type="number"
                                    placeholder="Ingresar monto anual"
                                    value={subProjectForm.amount || ''}
                                    onChange={(e) => {
                                        setSubProjectForm(p => ({ ...p, amount: Number(e.target.value) }));
                                        if (subProjectErrors.amount) setSubProjectErrors(prev => ({...prev, amount: ''}));
                                    }}
                                    className={subProjectErrors.amount ? 'border-red-500' : ''}
                                />
                                {subProjectErrors.amount && <p className="text-red-500 text-xs mt-1">{subProjectErrors.amount}</p>}
                            </div>
                            {/* Coordinador */}
                            <div>
                                <label className="text-sm font-medium">Coordinador</label>
                                <Select
                                    value={subProjectForm.coordinador || ''}
                                    onValueChange={(value) => setSubProjectForm(p => ({ ...p, coordinador: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar coordinador" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {coordinadores.map((c) => (
                                            <SelectItem key={c.id} value={formatUsuarioNombre(c)}>
                                                {formatUsuarioNombre(c)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* Coordinación */}
                            <div>
                                <label className="text-sm font-medium">Coordinación</label>
                                <Input
                                    placeholder="Ingresar coordinación"
                                    value={subProjectForm.coordinacion || ''}
                                    onChange={(e) => setSubProjectForm(p => ({ ...p, coordinacion: e.target.value }))}
                                />
                            </div>
                            {/* Fechas */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Fecha Inicio</label>
                                    <Input
                                        type="date"
                                        value={subProjectForm.fechaInicio || ''}
                                        onChange={(e) => setSubProjectForm(p => ({ ...p, fechaInicio: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Fecha Fin</label>
                                    <Input
                                        type="date"
                                        value={subProjectForm.fechaFin || ''}
                                        onChange={(e) => setSubProjectForm(p => ({ ...p, fechaFin: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Método de Gestión del proyecto</label>
                                <Input
                                    value="Scrum"
                                    readOnly
                                    className="bg-gray-100"
                                />
                            </div>
                        </div>
                        <DialogFooter className="px-6 pb-6 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={cancelSubProject} style={{borderColor: '#CFD6DD', color: 'black'}}>Cancelar</Button>
                            <Button type="button" onClick={saveSubProject} style={{backgroundColor: '#018CD1', color: 'white'}}>Guardar</Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>

        {/* Modal de Advertencia/Error */}
        <AlertDialog open={errorModal.isOpen} onOpenChange={(open) => {
            if (!open) {
                setErrorModal(prev => ({ ...prev, isOpen: false }));
                // Si hay un proyecto pendiente de guardar, completar el flujo
                if (pendingSaveProject) {
                    const projectToSave = pendingSaveProject;
                    setPendingSaveProject(null);
                    onClose();
                    setTimeout(() => {
                        onSave(projectToSave);
                    }, 50);
                }
            }
        }}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                        </div>
                        <AlertDialogTitle className="text-lg font-semibold">
                            {errorModal.title}
                        </AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="mt-3 text-sm text-gray-600 whitespace-pre-line">
                        {errorModal.message}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction
                        onClick={() => {
                            setErrorModal({ isOpen: false, title: '', message: '' });
                            // Si hay un proyecto pendiente de guardar, completar el flujo
                            if (pendingSaveProject) {
                                const projectToSave = pendingSaveProject;
                                setPendingSaveProject(null);
                                onClose();
                                setTimeout(() => {
                                    onSave(projectToSave);
                                }, 50);
                            }
                        }}
                        className="bg-[#018CD1] hover:bg-[#0177b3] text-white"
                    >
                        Entendido
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {/* Modal de Advertencia de Personal Sobrecargado */}
        <AlertDialog open={sobrecargaModal.isOpen} onOpenChange={(open) => {
            if (!open) {
                setSobrecargaModal({ isOpen: false, personalSobrecargado: [] });
                setIsSaving(false);
            }
        }}>
            <AlertDialogContent className="max-w-2xl">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <AlertDialogTitle className="text-xl font-semibold text-red-900">
                                Personal con Sobrecarga de Asignaciones
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-sm text-red-700 mt-1">
                                No se puede guardar el {formData.type === 'Actividad' ? 'actividad' : 'proyecto'}
                            </AlertDialogDescription>
                        </div>
                    </div>
                </AlertDialogHeader>

                <div className="space-y-4 py-4">
                    {/* Mensaje explicativo */}
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                            <strong>⚠️ Advertencia:</strong> El siguiente personal ya tiene el 100% de su capacidad asignada o la excedería con esta nueva asignación (50% por defecto).
                        </p>
                    </div>

                    {/* Lista de personal sobrecargado */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-700">
                            Personal que excede el límite:
                        </h4>
                        {sobrecargaModal.personalSobrecargado.map((personal, idx) => (
                            <div
                                key={personal.id}
                                className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{personal.nombre}</p>
                                        <div className="mt-2 space-y-1 text-sm">
                                            <p className="text-gray-600">
                                                Asignación actual: <span className="font-semibold text-amber-600">{personal.porcentajeActual.toFixed(0)}%</span>
                                            </p>
                                            <p className="text-gray-600">
                                                Nueva asignación: <span className="font-semibold text-blue-600">+{personal.porcentajeNuevo.toFixed(0)}%</span>
                                            </p>
                                            <p className="text-gray-900 font-semibold border-t border-gray-300 pt-1">
                                                Total proyectado: <span className="text-red-600 text-lg">{personal.porcentajeTotal.toFixed(0)}%</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="ml-4 text-right">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            Excede {(personal.porcentajeTotal - 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Recomendación */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>💡 Recomendación:</strong> Por favor, deselecciona al personal mencionado y elige otros miembros con disponibilidad suficiente. Al cerrar este modal, podrás modificar la selección de responsables.
                        </p>
                    </div>
                </div>

                <AlertDialogFooter>
                    <AlertDialogAction
                        onClick={() => {
                            setSobrecargaModal({ isOpen: false, personalSobrecargado: [] });
                            setIsSaving(false);
                        }}
                        className="bg-[#018CD1] hover:bg-[#0177b3] text-white"
                    >
                        Entendido, Volver al Formulario
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
    );
}

/**
 * Interfaz para opciones de select
 */
interface SelectOption {
  label: string;
  value: string;
}

/**
 * Interfaz para usuario (Scrum Master, Responsable)
 */
interface UsuarioOption {
  id: number;
  username?: string;
  email?: string;
  nombre?: string;
  apellido?: string;
  personal?: {
    nombre: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
  };
}

/**
 * Modal de Subproyecto (exportado para uso externo)
 * Misma estructura que el modal interno de POIFullModal
 */
export function SubProjectModal({
  isOpen,
  onClose,
  onSave,
  subProject,
  scrumMasters = [],
  coordinadores = [],
  responsibleOptions = [],
  financialAreaOptions: externalFinancialAreaOptions,
  yearOptions: externalYearOptions,
  projectAmount = 0,
  existingSubProjects = [],
  pgdAnioInicio,
  pgdAnioFin,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SubProject) => void;
  subProject: SubProject | null;
  scrumMasters?: UsuarioOption[];
  coordinadores?: UsuarioOption[];
  responsibleOptions?: SelectOption[];
  financialAreaOptions?: SelectOption[];
  yearOptions?: SelectOption[];
  projectAmount?: number;
  existingSubProjects?: SubProject[];
  pgdAnioInicio?: number;
  pgdAnioFin?: number;
}) {
  const [formData, setFormData] = React.useState<Partial<SubProject>>({});
  const [errors, setErrors] = React.useState<{[key: string]: string}>({});

  // Opciones de área financiera (usar externas o default)
  const financialAreaOpts = externalFinancialAreaOptions || financialAreaOptions;

  // Generar opciones de años basadas en el PGD o usar externas
  const yearOpts = externalYearOptions || generateYearOptions(
    pgdAnioInicio ?? DEFAULT_YEAR_START,
    pgdAnioFin ?? DEFAULT_YEAR_END
  );

  // Formatear nombre de usuario
  const formatUsuarioNombreLocal = (usuario: UsuarioOption): string => {
    if (usuario.personal) {
      const { nombre, apellidoPaterno, apellidoMaterno } = usuario.personal;
      const partes = [nombre, apellidoPaterno, apellidoMaterno].filter(Boolean);
      if (partes.length > 0) return partes.join(' ');
    }
    if (usuario.nombre && usuario.apellido) {
      return `${usuario.nombre} ${usuario.apellido}`;
    }
    if (usuario.nombre) return usuario.nombre;
    if (usuario.username) return usuario.username;
    if (usuario.email) return usuario.email.split('@')[0];
    return `Usuario #${usuario.id}`;
  };

  React.useEffect(() => {
    if (isOpen) {
      if (subProject) {
        setFormData(subProject);
      } else {
        setFormData({
          id: '',
          name: '',
          description: '',
          responsible: [],
          scrumMaster: '',
          years: [],
          amount: 0,
          managementMethod: 'Scrum',
          financialArea: [],
          coordinador: '',
          coordinacion: '',
          fechaInicio: '',
          fechaFin: '',
        });
      }
      setErrors({});
    }
  }, [subProject, isOpen]);

  const validate = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    if (!formData.description?.trim()) {
      newErrors.description = 'La descripción es requerida';
    }
    if (!formData.scrumMaster) {
      newErrors.scrumMaster = 'El Gestor/Scrum Master es requerido';
    }
    if (!formData.years || formData.years.length === 0) {
      newErrors.years = 'Debe seleccionar al menos un año';
    }
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    }

    // Validar que el monto no exceda el disponible
    if (formData.amount && projectAmount > 0) {
      const otherSubProjectsTotal = existingSubProjects
        .filter(sp => sp.id !== subProject?.id)
        .reduce((sum, sp) => sum + (sp.amount || 0), 0);
      const availableAmount = projectAmount - otherSubProjectsTotal;

      if (formData.amount > availableAmount) {
        newErrors.amount = `El monto no puede exceder el disponible (S/ ${availableAmount.toLocaleString('es-PE')})`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(formData as SubProject);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  // Calcular monto disponible
  const otherSubProjectsTotal = existingSubProjects
    .filter(sp => sp.id !== subProject?.id)
    .reduce((sum, sp) => sum + (sp.amount || 0), 0);
  const availableAmount = projectAmount - otherSubProjectsTotal;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCancel(); }}>
      <DialogContent className="sm:max-w-lg p-0" showCloseButton={false}>
        <DialogHeader className="p-4 bg-[#004272] text-white rounded-t-lg flex flex-row items-center justify-between">
          <DialogTitle>{subProject ? 'EDITAR' : 'REGISTRAR'} SUBPROYECTO</DialogTitle>
          <Button type="button" variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Nombre */}
          <div>
            <label className="text-sm font-medium">Nombre *</label>
            <Input
              placeholder="Ingresar nombre"
              value={formData.name || ''}
              onChange={(e) => {
                setFormData(p => ({ ...p, name: e.target.value }));
                if (errors.name) setErrors(prev => ({...prev, name: ''}));
              }}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Descripción */}
          <div>
            <label className="text-sm font-medium">Descripción *</label>
            <Textarea
              placeholder="Ingresar descripción"
              value={formData.description || ''}
              onChange={(e) => {
                setFormData(p => ({ ...p, description: e.target.value }));
                if (errors.description) setErrors(prev => ({...prev, description: ''}));
              }}
              className={`min-h-[80px] ${errors.description ? 'border-red-500' : ''}`}
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>

          {/* Área Financiera */}
          <div>
            <label className="text-sm font-medium">Área Financiera</label>
            <MultiSelect
              options={(() => {
                const existingValues = formData.financialArea || [];
                const predefinedValues = financialAreaOpts.map(o => o.value);
                const extraOptions = existingValues
                  .filter(v => !predefinedValues.includes(v))
                  .map(v => ({ label: v, value: v }));
                return [...financialAreaOpts, ...extraOptions];
              })()}
              selected={formData.financialArea || []}
              onChange={(selected) => setFormData(p => ({ ...p, financialArea: selected }))}
              placeholder="Seleccionar área(s)"
            />
          </div>

          {/* Responsable */}
          <div>
            <label className="text-sm font-medium">Responsable</label>
            <MultiSelect
              options={responsibleOptions}
              selected={formData.responsible || []}
              onChange={(selected) => setFormData(p => ({ ...p, responsible: selected }))}
              placeholder="Seleccionar responsable(s)"
            />
          </div>

          {/* Gestor/Scrum Master */}
          <div>
            <label className="text-sm font-medium">Gestor/Scrum Master *</label>
            <Select
              value={formData.scrumMaster || ''}
              onValueChange={(value) => {
                setFormData(p => ({ ...p, scrumMaster: value }));
                if (errors.scrumMaster) setErrors(prev => ({...prev, scrumMaster: ''}));
              }}
            >
              <SelectTrigger className={errors.scrumMaster ? 'border-red-500' : ''}>
                <SelectValue placeholder="Seleccionar scrum master" />
              </SelectTrigger>
              <SelectContent>
                {scrumMasters.map((sm) => (
                  <SelectItem key={sm.id} value={formatUsuarioNombreLocal(sm)}>
                    {formatUsuarioNombreLocal(sm)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.scrumMaster && <p className="text-red-500 text-xs mt-1">{errors.scrumMaster}</p>}
          </div>

          {/* Año */}
          <div>
            <label className="text-sm font-medium">Año *</label>
            <MultiSelect
              options={yearOpts}
              selected={formData.years || []}
              onChange={(selected) => {
                setFormData(p => ({ ...p, years: selected }));
                if (errors.years) setErrors(prev => ({...prev, years: ''}));
              }}
              className={errors.years ? 'border-red-500' : ''}
              placeholder="Seleccionar año(s)"
            />
            {errors.years && <p className="text-red-500 text-xs mt-1">{errors.years}</p>}
          </div>

          {/* Monto anual */}
          <div>
            <label className="text-sm font-medium">Monto anual *</label>
            {/* Mostrar información del monto disponible */}
            {projectAmount > 0 && (
              <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200 mb-2">
                <div className="flex justify-between">
                  <span>Monto del proyecto:</span>
                  <span className="font-semibold">S/ {projectAmount.toLocaleString('es-PE')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Asignado a subproyectos:</span>
                  <span className="font-semibold">S/ {otherSubProjectsTotal.toLocaleString('es-PE')}</span>
                </div>
                <div className="flex justify-between text-green-700 font-medium border-t border-blue-300 pt-1 mt-1">
                  <span>Disponible:</span>
                  <span>S/ {availableAmount.toLocaleString('es-PE')}</span>
                </div>
              </div>
            )}
            <Input
              type="number"
              placeholder="Ingresar monto anual"
              value={formData.amount || ''}
              onChange={(e) => {
                setFormData(p => ({ ...p, amount: Number(e.target.value) }));
                if (errors.amount) setErrors(prev => ({...prev, amount: ''}));
              }}
              className={errors.amount ? 'border-red-500' : ''}
            />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>

          {/* Coordinador */}
          <div>
            <label className="text-sm font-medium">Coordinador</label>
            <Select
              value={formData.coordinador || ''}
              onValueChange={(value) => setFormData(p => ({ ...p, coordinador: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar coordinador" />
              </SelectTrigger>
              <SelectContent>
                {coordinadores.map((c) => (
                  <SelectItem key={c.id} value={formatUsuarioNombreLocal(c)}>
                    {formatUsuarioNombreLocal(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Coordinación */}
          <div>
            <label className="text-sm font-medium">Coordinación</label>
            <Input
              placeholder="Ingresar coordinación"
              value={formData.coordinacion || ''}
              onChange={(e) => setFormData(p => ({ ...p, coordinacion: e.target.value }))}
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Fecha Inicio</label>
              <Input
                type="date"
                value={formData.fechaInicio || ''}
                onChange={(e) => setFormData(p => ({ ...p, fechaInicio: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Fecha Fin</label>
              <Input
                type="date"
                value={formData.fechaFin || ''}
                onChange={(e) => setFormData(p => ({ ...p, fechaFin: e.target.value }))}
              />
            </div>
          </div>

          {/* Método de Gestión */}
          <div>
            <label className="text-sm font-medium">Método de Gestión del proyecto</label>
            <Input
              value="Scrum"
              readOnly
              className="bg-gray-100"
            />
          </div>
        </div>
        <DialogFooter className="px-6 pb-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleCancel} style={{borderColor: '#CFD6DD', color: 'black'}}>Cancelar</Button>
          <Button type="button" onClick={handleSave} style={{backgroundColor: '#018CD1', color: 'white'}}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
