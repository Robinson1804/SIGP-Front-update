'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, X, AlertTriangle, ListTodo } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  type HistoriaUsuario,
  type HistoriaEstado,
  createHistoria,
  updateHistoria,
  getNextCodigo,
  getNextCodigoSubproyecto,
  getHistoriaById,
} from '@/features/proyectos/services/historias.service';
import { getEpicasByProyecto, getEpicasBySubproyecto, type Epica } from '@/features/proyectos/services/epicas.service';
import { getSprintsByProyecto, getSprintsBySubproyecto, type Sprint } from '@/features/proyectos/services/sprints.service';
import { getRequerimientosFuncionalesByProyecto, getRequerimientosFuncionalesBySubproyecto, type Requerimiento } from '@/features/requerimientos';
import { apiClient, ENDPOINTS } from '@/lib/api';
import { useCurrentUser } from '@/stores/auth.store';
import { formatDate } from '@/lib/utils';
import { TareaFormModal } from './tarea-form-modal';
import { getTareasByHistoria, type Tarea } from '@/features/proyectos/services/tareas.service';

// Tipos
interface MiembroEquipo {
  id: number;
  nombre: string;
}

interface CriterioAceptacionLocal {
  id: string;
  descripcion: string;
  completado: boolean;
}

// Schema del formulario
const historiaSchema = z.object({
  codigo: z.string().min(1, 'El codigo es requerido'),
  titulo: z.string().min(1, 'El titulo es requerido').max(200, 'Maximo 200 caracteres'),
  rol: z.string().optional(),
  quiero: z.string().optional(),
  para: z.string().optional(),
  epicaId: z.string().optional(),
  requerimientoId: z.string().optional(),
  asignadoA: z.array(z.number()).min(1, 'Seleccione al menos un responsable'),
  estado: z.enum(['Por hacer', 'En progreso', 'Finalizado']).optional(),
  prioridad: z.enum(['Alta', 'Media', 'Baja']).optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
  sprintId: z.string().optional(),
  storyPoints: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().min(1).max(100).optional()
  ),
});

type HistoriaFormValues = z.infer<typeof historiaSchema>;

// Función helper para validar fechas de HU dentro del rango del sprint
function validateHistoriaFechasContraSprint(
  fechaInicio: string | undefined,
  fechaFin: string | undefined,
  sprintFechaInicio: string | undefined,
  sprintFechaFin: string | undefined
): { valid: boolean; errors: { field: 'fechaInicio' | 'fechaFin'; message: string }[] } {
  const errors: { field: 'fechaInicio' | 'fechaFin'; message: string }[] = [];

  if (!sprintFechaInicio || !sprintFechaFin) {
    return { valid: true, errors };
  }

  const sprintInicio = new Date(sprintFechaInicio + 'T00:00:00');
  const sprintFin = new Date(sprintFechaFin + 'T00:00:00');

  if (fechaInicio) {
    const huInicio = new Date(fechaInicio + 'T00:00:00');
    if (huInicio < sprintInicio) {
      errors.push({
        field: 'fechaInicio',
        message: `La fecha de inicio debe ser posterior o igual al inicio del sprint (${sprintFechaInicio})`,
      });
    }
    if (huInicio > sprintFin) {
      errors.push({
        field: 'fechaInicio',
        message: `La fecha de inicio debe ser anterior o igual al fin del sprint (${sprintFechaFin})`,
      });
    }
  }

  if (fechaFin) {
    const huFin = new Date(fechaFin + 'T00:00:00');
    if (huFin < sprintInicio) {
      errors.push({
        field: 'fechaFin',
        message: `La fecha de fin debe ser posterior o igual al inicio del sprint (${sprintFechaInicio})`,
      });
    }
    if (huFin > sprintFin) {
      errors.push({
        field: 'fechaFin',
        message: `La fecha de fin debe ser anterior o igual al fin del sprint (${sprintFechaFin})`,
      });
    }
  }

  // Validar que fecha fin sea posterior a fecha inicio
  if (fechaInicio && fechaFin) {
    const huInicio = new Date(fechaInicio + 'T00:00:00');
    const huFin = new Date(fechaFin + 'T00:00:00');
    if (huFin < huInicio) {
      errors.push({
        field: 'fechaFin',
        message: 'La fecha de fin debe ser posterior a la fecha de inicio',
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

interface HistoriaFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proyectoId: number;
  subproyectoId?: number;
  historia?: HistoriaUsuario | null;
  sprintId?: number;
  onSuccess: () => void;
  proyectoFechaInicio?: string | null;
  proyectoFechaFin?: string | null;
}

const estadoOptions = [
  { value: 'Por hacer', label: 'Por hacer' },
  { value: 'En progreso', label: 'En progreso' },
  { value: 'Finalizado', label: 'Finalizado' },
];

const prioridadOptions = [
  { value: 'Baja', label: 'Baja' },
  { value: 'Media', label: 'Media' },
  { value: 'Alta', label: 'Alta' },
];

export function HistoriaFormModal({
  open,
  onOpenChange,
  proyectoId,
  subproyectoId,
  historia,
  sprintId: initialSprintId,
  onSuccess,
  proyectoFechaInicio,
  proyectoFechaFin,
}: HistoriaFormModalProps) {
  const currentUser = useCurrentUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCodigo, setIsLoadingCodigo] = useState(false);
  const [epicas, setEpicas] = useState<Epica[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [requerimientos, setRequerimientos] = useState<Requerimiento[]>([]);
  const [equipo, setEquipo] = useState<MiembroEquipo[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Criterios de aceptacion
  const [criterios, setCriterios] = useState<CriterioAceptacionLocal[]>([]);
  const [nuevoCriterio, setNuevoCriterio] = useState('');

  // Tareas de la historia
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [isLoadingTareas, setIsLoadingTareas] = useState(false);
  const [isTareaModalOpen, setIsTareaModalOpen] = useState(false);

  // Error modal state
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isEditing = !!historia;

  const form = useForm<HistoriaFormValues>({
    resolver: zodResolver(historiaSchema),
    mode: 'onSubmit', // Solo validar al enviar para evitar errores prematuros
    defaultValues: {
      codigo: '',
      titulo: '',
      rol: '',
      quiero: '',
      para: '',
      epicaId: '__none__',
      requerimientoId: '__none__',
      asignadoA: [],
      estado: 'Por hacer',
      prioridad: undefined,
      fechaInicio: '',
      fechaFin: '',
      sprintId: '__backlog__',
      storyPoints: undefined,
    },
  });

  // Reset form when modal opens for new historia
  useEffect(() => {
    if (open && !historia) {
      // Forzar reset de campos al abrir para nueva historia
      form.setValue('prioridad', undefined);
      form.setValue('storyPoints', undefined);
    }
  }, [open, historia, form]);

  // Obtener rango de fechas dinámico basado en sprint seleccionado
  const selectedSprintId = form.watch('sprintId');

  // Usar useMemo para calcular el sprint seleccionado y el rango de fechas
  // Considerar también initialSprintId cuando los sprints aún están cargando
  const { selectedSprint, fechaRangoInicio, fechaRangoFin, rangoLabel, esperandoSprintData } = useMemo(() => {
    // Buscar el sprint por el ID del formulario o el ID inicial
    const sprintIdToUse = selectedSprintId && selectedSprintId !== '__backlog__'
      ? selectedSprintId
      : (initialSprintId?.toString() || null);

    const sprint = sprintIdToUse
      ? sprints.find(s => s.id.toString() === sprintIdToUse)
      : null;

    // Determinar si estamos esperando datos del sprint (hay un ID pero no encontramos el sprint porque aún no cargó)
    const esperandoSprint = !!sprintIdToUse && !sprint && sprints.length === 0;

    // Si hay sprint seleccionado (del form o inicial), usar sus fechas
    // Solo mostrar fechas del proyecto si explícitamente está en backlog (no hay sprintId)
    const usarFechasSprint = sprint && sprint.fechaInicio && sprint.fechaFin;
    const enBacklog = !sprintIdToUse;

    return {
      selectedSprint: sprint,
      esperandoSprintData: esperandoSprint,
      // Si esperamos datos del sprint, no mostrar ningún rango aún
      fechaRangoInicio: esperandoSprint
        ? undefined
        : usarFechasSprint
          ? sprint.fechaInicio!.substring(0, 10)
          : (enBacklog && proyectoFechaInicio ? proyectoFechaInicio.substring(0, 10) : undefined),
      fechaRangoFin: esperandoSprint
        ? undefined
        : usarFechasSprint
          ? sprint.fechaFin!.substring(0, 10)
          : (enBacklog && proyectoFechaFin ? proyectoFechaFin.substring(0, 10) : undefined),
      rangoLabel: esperandoSprint ? 'Cargando...' : (usarFechasSprint ? 'Sprint' : (enBacklog ? 'Proyecto' : '')),
    };
  }, [selectedSprintId, initialSprintId, sprints, proyectoFechaInicio, proyectoFechaFin]);

  // Filtrar sprints cerrados/finalizados para el selector (no permitir asignar HU a sprints cerrados)
  const availableSprints = sprints.filter(
    (s) => s.estado !== 'Finalizado' && s.estado !== 'Completado' && s.estado !== 'Cerrado'
  );

  useEffect(() => {
    const initializeForm = async () => {
      if (!open) return;

      await loadData();

      const formatDate = (d: string | null | undefined) => d ? d.substring(0, 10) : '';

      if (historia) {
        try {
          const historiaCompleta = await getHistoriaById(historia.id);

          // asignadoA ahora es un array de IDs de responsables
          // Convertir a números por si vienen como strings del backend (simple-array)
          const finalAsignadoA = Array.isArray(historiaCompleta.asignadoA)
            ? historiaCompleta.asignadoA.map((id: string | number) =>
                typeof id === 'string' ? parseInt(id, 10) : id
              ).filter((id: number) => !isNaN(id))
            : [];

          form.reset({
            codigo: historiaCompleta.codigo,
            titulo: historiaCompleta.titulo,
            rol: historiaCompleta.rol || '',
            quiero: historiaCompleta.quiero || '',
            para: historiaCompleta.para || '',
            epicaId: historiaCompleta.epicaId?.toString() || '__none__',
            requerimientoId: historiaCompleta.requerimientoId?.toString() || '__none__',
            asignadoA: finalAsignadoA,
            estado: historiaCompleta.estado || 'Por hacer',
            prioridad: (historiaCompleta.prioridad as 'Alta' | 'Media' | 'Baja') || undefined,
            fechaInicio: formatDate(historiaCompleta.fechaInicio),
            fechaFin: formatDate(historiaCompleta.fechaFin),
            sprintId: historiaCompleta.sprintId?.toString() || '__backlog__',
            storyPoints: historiaCompleta.storyPoints || undefined,
          });
          // Limpiar errores de validación después del reset
          form.clearErrors();

          if (historiaCompleta.criteriosAceptacion && historiaCompleta.criteriosAceptacion.length > 0) {
            setCriterios(historiaCompleta.criteriosAceptacion.map(c => ({
              id: c.id.toString(),
              descripcion: c.descripcion,
              completado: c.completado,
            })));
          } else {
            setCriterios([]);
          }
        } catch (error) {
          console.error('Error fetching historia completa:', error);
          // Fallback: usar asignadoA del objeto historia (convertir a números)
          const fallbackAsignadoA = Array.isArray(historia.asignadoA)
            ? historia.asignadoA.map((id: string | number) =>
                typeof id === 'string' ? parseInt(id, 10) : id
              ).filter((id: number) => !isNaN(id))
            : [];
          form.reset({
            codigo: historia.codigo,
            titulo: historia.titulo,
            rol: historia.rol || '',
            quiero: historia.quiero || '',
            para: historia.para || '',
            epicaId: historia.epicaId?.toString() || '__none__',
            requerimientoId: historia.requerimientoId?.toString() || '__none__',
            asignadoA: fallbackAsignadoA,
            estado: historia.estado || 'Por hacer',
            prioridad: (historia.prioridad as 'Alta' | 'Media' | 'Baja') || undefined,
            fechaInicio: formatDate(historia.fechaInicio),
            fechaFin: formatDate(historia.fechaFin),
            sprintId: historia.sprintId?.toString() || '__backlog__',
            storyPoints: historia.storyPoints || undefined,
          });
          form.clearErrors();
          setCriterios([]);
        }
      } else {
        fetchNextCodigo();
        form.reset({
          codigo: '',
          titulo: '',
          rol: '',
          quiero: '',
          para: '',
          epicaId: '__none__',
          requerimientoId: '__none__',
          asignadoA: [],
          estado: 'Por hacer',
          prioridad: undefined,
          fechaInicio: '',
          fechaFin: '',
          sprintId: initialSprintId?.toString() || '__backlog__',
          storyPoints: undefined,
        });
        form.clearErrors();
        setCriterios([]);
      }
    };

    initializeForm();
  }, [open, historia, initialSprintId]);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const asignacionesEndpoint = subproyectoId
        ? ENDPOINTS.RRHH.ASIGNACIONES_SUBPROYECTO(subproyectoId)
        : ENDPOINTS.RRHH.ASIGNACIONES_PROYECTO(proyectoId);
      const [epicasData, sprintsData, requerimientosData, asignacionesResponse] = await Promise.all([
        subproyectoId ? getEpicasBySubproyecto(subproyectoId) : getEpicasByProyecto(proyectoId),
        subproyectoId ? getSprintsBySubproyecto(subproyectoId) : getSprintsByProyecto(proyectoId),
        (subproyectoId
          ? getRequerimientosFuncionalesBySubproyecto(subproyectoId)
          : getRequerimientosFuncionalesByProyecto(proyectoId)).catch(() => []),
        apiClient.get(asignacionesEndpoint).catch(() => ({ data: [] })),
      ]);

      // Mapear asignaciones a miembros del equipo
      // asignadoA en historia_usuario guarda el personalId de la asignación
      const asignaciones = asignacionesResponse.data || [];
      console.log('=== ASIGNACIONES LOADED ===');
      console.log('Total asignaciones:', asignaciones.length);

      const equipoMapeado: MiembroEquipo[] = asignaciones
        .map((asignacion: {
          id: number;
          personalId: number;
          personal?: {
            id: number;
            nombres?: string;
            apellidos?: string;
          };
        }) => {
          // Usar personalId como ID (es lo que se guarda en asignadoA)
          const id = asignacion.personalId || asignacion.personal?.id;

          if (!id) {
            console.warn('Asignación sin personalId:', asignacion.id);
            return null;
          }

          // Mostrar nombres + apellidos del personal
          const nombres = asignacion.personal?.nombres || '';
          const apellidos = asignacion.personal?.apellidos || '';
          const nombreCompleto = `${nombres} ${apellidos}`.trim() || `Personal ${id}`;

          console.log(`Mapeando: personalId=${id}, nombre=${nombreCompleto}`);

          return { id, nombre: nombreCompleto };
        })
        .filter((item: MiembroEquipo | null): item is MiembroEquipo => item !== null);

      console.log('=== EQUIPO MAPEADO (usuarioIds) ===');
      console.log('Equipo:', equipoMapeado);

      setEpicas(epicasData);
      setSprints(sprintsData);
      setRequerimientos(requerimientosData);
      setEquipo(equipoMapeado);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchNextCodigo = async () => {
    try {
      setIsLoadingCodigo(true);
      const nextCodigo = subproyectoId
        ? await getNextCodigoSubproyecto(subproyectoId)
        : await getNextCodigo(proyectoId);
      form.setValue('codigo', nextCodigo);
    } catch (err) {
      console.error('Error fetching next codigo:', err);
      form.setValue('codigo', subproyectoId ? 'HU-001' : `HU-${Date.now().toString().slice(-4)}`);
    } finally {
      setIsLoadingCodigo(false);
    }
  };

  // Cargar tareas de la historia (solo en modo edición)
  const loadTareas = async () => {
    if (!historia?.id) return;
    try {
      setIsLoadingTareas(true);
      const tareasData = await getTareasByHistoria(historia.id);
      setTareas(tareasData);
    } catch (err) {
      console.error('Error loading tareas:', err);
    } finally {
      setIsLoadingTareas(false);
    }
  };

  // Cargar tareas cuando se abre el modal en modo edición
  useEffect(() => {
    if (open && isEditing && historia?.id) {
      loadTareas();
    } else {
      setTareas([]);
    }
  }, [open, isEditing, historia?.id]);

  const handleTareaSuccess = () => {
    setIsTareaModalOpen(false);
    loadTareas(); // Recargar tareas después de crear/editar
  };

  const handleAddCriterio = () => {
    if (!nuevoCriterio.trim()) return;
    setCriterios(prev => [...prev, {
      id: `temp-${Date.now()}`,
      descripcion: nuevoCriterio.trim(),
      completado: false,
    }]);
    setNuevoCriterio('');
  };

  const handleRemoveCriterio = (id: string) => {
    setCriterios(prev => prev.filter(c => c.id !== id));
  };

  const onSubmit = async (values: HistoriaFormValues) => {
    try {
      setIsSubmitting(true);

      // Validar fechas contra el rango del sprint si hay sprint seleccionado
      if (values.sprintId && values.sprintId !== '__backlog__') {
        const sprint = sprints.find(s => s.id.toString() === values.sprintId);
        if (sprint && sprint.fechaInicio && sprint.fechaFin) {
          const sprintInicio = sprint.fechaInicio.substring(0, 10);
          const sprintFin = sprint.fechaFin.substring(0, 10);
          const validation = validateHistoriaFechasContraSprint(
            values.fechaInicio,
            values.fechaFin,
            sprintInicio,
            sprintFin
          );

          if (!validation.valid) {
            // Mostrar errores de validación
            validation.errors.forEach(err => {
              form.setError(err.field, { type: 'manual', message: err.message });
            });
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Al crear, el requerimiento es obligatorio
      if (!isEditing && (!values.requerimientoId || values.requerimientoId === '__none__')) {
        form.setError('requerimientoId', { message: 'Debe seleccionar un requerimiento' });
        setIsSubmitting(false);
        return;
      }

      if (isEditing) {
        const updateData = {
          titulo: values.titulo,
          rol: values.rol || null,
          quiero: values.quiero || null,
          para: values.para || null,
          epicaId: values.epicaId && values.epicaId !== '__none__' ? parseInt(values.epicaId) : null,
          requerimientoId: values.requerimientoId && values.requerimientoId !== '__none__' ? parseInt(values.requerimientoId) : null,
          asignadoA: values.asignadoA,
          estado: values.estado as HistoriaEstado,
          prioridad: values.prioridad || null,
          fechaInicio: values.fechaInicio || null,
          fechaFin: values.fechaFin || null,
          sprintId: values.sprintId && values.sprintId !== '__backlog__' ? parseInt(values.sprintId) : null,
          storyPoints: values.storyPoints !== undefined ? values.storyPoints : null,
          criteriosAceptacion: criterios.map(c => ({
            descripcion: c.descripcion,
            completado: c.completado,
            orden: 0,
          })),
        };
        await updateHistoria(historia.id, updateData);
      } else {
        const createData = {
          codigo: values.codigo,
          titulo: values.titulo,
          rol: values.rol || undefined,
          quiero: values.quiero || undefined,
          para: values.para || undefined,
          epicaId: values.epicaId && values.epicaId !== '__none__' ? parseInt(values.epicaId) : undefined,
          requerimientoId: values.requerimientoId && values.requerimientoId !== '__none__' ? parseInt(values.requerimientoId) : undefined,
          asignadoA: values.asignadoA,
          estado: values.estado as HistoriaEstado,
          prioridad: values.prioridad,
          fechaInicio: values.fechaInicio || undefined,
          fechaFin: values.fechaFin || undefined,
          sprintId: values.sprintId && values.sprintId !== '__backlog__' ? parseInt(values.sprintId) : null,
          storyPoints: values.storyPoints !== undefined ? values.storyPoints : undefined,
          ...(subproyectoId ? { subproyectoId } : { proyectoId }),
          criteriosAceptacion: criterios.map(c => ({
            descripcion: c.descripcion,
            completado: c.completado,
            orden: 0,
          })),
        };
        await createHistoria(createData);
      }

      onSuccess();
      onOpenChange(false); // Cerrar el modal después de guardar exitosamente
    } catch (error: any) {
      console.error('Error al guardar historia:', error);
      console.log('error.response.data:', error?.response?.data);
      console.log('error.response.data.error:', error?.response?.data?.error);

      // Extract error message - structure is { success: false, error: { message: "..." }, timestamp }
      let errorMsg = 'Error al guardar la historia';
      const data = error?.response?.data;

      // Get message from data.error.message
      let backendMsg = '';
      if (data?.error?.message) {
        backendMsg = String(data.error.message);
      } else if (typeof data?.error === 'string') {
        backendMsg = data.error;
      } else if (data?.message) {
        backendMsg = typeof data.message === 'string' ? data.message : String(data.message?.message || '');
      }

      console.log('backendMsg:', backendMsg);

      // Check if error is about Finalizado state
      if (backendMsg && backendMsg.includes('Finalizado') && backendMsg.includes('no se puede seleccionar')) {
        errorMsg = 'El estado "Finalizado" no se puede seleccionar manualmente. La Historia de Usuario pasará a "Finalizado" automáticamente cuando el documento de evidencias sea validado.';
      } else if (backendMsg) {
        errorMsg = backendMsg;
      }

      console.log('Final errorMsg:', errorMsg);
      setErrorMessage(errorMsg);
      setIsErrorModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-lg">
            {isEditing ? 'Editar Historia de Usuario' : 'Nueva Historia de Usuario'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="space-y-4 overflow-y-auto flex-1 py-4 pr-2">
              {/* Fila 1: Codigo y Titulo */}
              <div className="grid grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Codigo *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled
                          className="bg-gray-100"
                          placeholder={isLoadingCodigo ? 'Generando...' : 'HU-001'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="col-span-3">
                  <FormField
                    control={form.control}
                    name="titulo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titulo *</FormLabel>
                        <FormControl>
                          <Input placeholder="Titulo de la historia" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Como, Quiero, Para */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-3">
                <p className="text-sm font-medium text-blue-800">Historia de Usuario</p>
                <div className="grid grid-cols-1 gap-3">
                  <FormField
                    control={form.control}
                    name="rol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-blue-700">Como...</FormLabel>
                        <FormControl>
                          <Input placeholder="usuario del sistema" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quiero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-blue-700">Quiero...</FormLabel>
                        <FormControl>
                          <Input placeholder="poder realizar una accion" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="para"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-blue-700">Para...</FormLabel>
                        <FormControl>
                          <Input placeholder="obtener un beneficio" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Sección de Tareas */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ListTodo className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Tareas</span>
                    {tareas.length > 0 && (
                      <Badge variant="secondary" className="text-xs">{tareas.length}</Badge>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsTareaModalOpen(true)}
                    disabled={!isEditing}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Tarea
                  </Button>
                </div>

                {!isEditing ? (
                  <p className="text-xs text-gray-500">
                    Guarde la historia primero para poder agregar tareas
                  </p>
                ) : isLoadingTareas ? (
                  <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Cargando tareas...
                  </div>
                ) : tareas.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    No hay tareas asignadas a esta historia
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                    {tareas.map((tarea) => (
                      <div
                        key={tarea.id}
                        className="flex items-center justify-between p-2 bg-white rounded border text-sm"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs font-mono text-gray-500">{tarea.codigo}</span>
                          <span className="truncate text-gray-700">{tarea.nombre}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] shrink-0 ${
                            tarea.estado === 'Finalizado'
                              ? 'border-green-500 text-green-600'
                              : tarea.estado === 'En progreso'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-gray-400 text-gray-500'
                          }`}
                        >
                          {tarea.estado}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Requerimiento */}
              {!isEditing && !isLoadingData && requerimientos.length === 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                  <span>
                    No hay requerimientos disponibles para este subproyecto. Debe crear al menos un requerimiento antes de agregar historias de usuario.
                  </span>
                </div>
              )}
              <FormField
                control={form.control}
                name="requerimientoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Requerimiento{!isEditing && <span className="text-destructive ml-1">*</span>}
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoadingData || (!isEditing && requerimientos.length === 0)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            requerimientos.length === 0 && !isLoadingData
                              ? 'Sin requerimientos disponibles'
                              : 'Seleccionar requerimiento'
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isEditing && (
                          <SelectItem value="__none__">Sin requerimiento</SelectItem>
                        )}
                        {requerimientos.map((req) => (
                          <SelectItem key={req.id} value={req.id.toString()}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs px-1.5 py-0">
                                {req.codigo}
                              </Badge>
                              <span className="truncate max-w-[250px]">{req.nombre}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Criterios de Aceptacion */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-100 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-green-800">Criterios de Aceptacion</p>
                  <Badge variant="secondary" className="text-xs">{criterios.length}</Badge>
                </div>

                {criterios.length > 0 && (
                  <div className="space-y-2">
                    {criterios.map((criterio, index) => (
                      <div key={criterio.id} className="flex items-center gap-2 p-2 bg-white rounded border text-sm">
                        <span className="text-gray-500 text-xs w-6">{index + 1}.</span>
                        <span className="flex-1 text-gray-700">{criterio.descripcion}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-400 hover:text-red-500"
                          onClick={() => handleRemoveCriterio(criterio.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    placeholder="Nuevo criterio de aceptacion"
                    value={nuevoCriterio}
                    onChange={(e) => setNuevoCriterio(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCriterio();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddCriterio}
                    disabled={!nuevoCriterio.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Campos en dos columnas */}
              <div className="grid grid-cols-2 gap-4">
                {/* Columna izquierda */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="epicaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Epica</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange} disabled={isLoadingData}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar epica" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">Sin epica</SelectItem>
                            {epicas.map((epica) => (
                              <SelectItem key={epica.id} value={epica.id.toString()}>
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: epica.color || '#888' }}
                                  />
                                  {epica.nombre}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="asignadoA"
                    render={({ field }) => {
                      // Convertir opciones del equipo al formato de MultiSelect
                      const options = equipo.map((miembro) => ({
                        value: miembro.id.toString(),
                        label: miembro.nombre,
                      }));

                      // Convertir IDs numéricos a strings para el componente
                      // Asegurar que siempre trabajamos con arrays válidos
                      const fieldValues = Array.isArray(field.value) ? field.value : [];
                      const selectedStrings = fieldValues
                        .filter((id): id is number => typeof id === 'number' && !isNaN(id))
                        .map((id) => id.toString());

                      // Handler para convertir strings de vuelta a números
                      // Filtrar NaN para evitar errores de validación
                      const handleChange = (selected: string[]) => {
                        const numbers = selected
                          .map((s) => parseInt(s, 10))
                          .filter((n) => !isNaN(n));
                        field.onChange(numbers);
                      };

                      return (
                        <FormItem>
                          <FormLabel>Responsables *</FormLabel>
                          <FormControl>
                            <MultiSelect
                              options={options}
                              selected={selectedStrings}
                              onChange={handleChange}
                              placeholder={equipo.length === 0 ? "Cargando equipo..." : "Seleccionar responsables"}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {estadoOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="prioridad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridad</FormLabel>
                        <Select
                          value={field.value || ''}
                          onValueChange={(value) => field.onChange(value || undefined)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar prioridad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {prioridadOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Columna derecha */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Fecha Inicio</label>
                    {esperandoSprintData ? (
                      <p className="text-xs text-gray-400 mb-1 italic">
                        Cargando rango del sprint...
                      </p>
                    ) : fechaRangoInicio && fechaRangoFin ? (
                      <p className="text-xs text-gray-500 mb-1">
                        Rango {rangoLabel}: {formatDate(fechaRangoInicio, { day: '2-digit', month: '2-digit', year: 'numeric' })} a {formatDate(fechaRangoFin, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </p>
                    ) : null}
                    <input
                      type="date"
                      value={form.watch('fechaInicio') || ''}
                      onChange={(e) => {
                        form.setValue('fechaInicio', e.target.value);
                        form.clearErrors('fechaInicio');
                        const fechaFin = form.getValues('fechaFin');
                        if (fechaFin && fechaFin < e.target.value) {
                          form.setValue('fechaFin', '');
                        }
                      }}
                      min={fechaRangoInicio || undefined}
                      max={fechaRangoFin || undefined}
                      disabled={esperandoSprintData}
                      className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        form.formState.errors.fechaInicio ? 'border-red-500' : 'border-gray-300'
                      } ${esperandoSprintData ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                    {form.formState.errors.fechaInicio && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.fechaInicio.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Fecha Fin</label>
                    <input
                      type="date"
                      value={form.watch('fechaFin') || ''}
                      onChange={(e) => {
                        form.setValue('fechaFin', e.target.value);
                        form.clearErrors('fechaFin');
                      }}
                      min={form.watch('fechaInicio') || fechaRangoInicio || undefined}
                      max={fechaRangoFin || undefined}
                      disabled={esperandoSprintData}
                      className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        form.formState.errors.fechaFin ? 'border-red-500' : 'border-gray-300'
                      } ${esperandoSprintData ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                    {form.formState.errors.fechaFin && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.fechaFin.message}
                      </p>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="sprintId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sprint</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange} disabled={isLoadingData}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar sprint" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__backlog__">Backlog (Sin sprint)</SelectItem>
                            {availableSprints.map((sprint) => (
                              <SelectItem key={sprint.id} value={sprint.id.toString()}>
                                {sprint.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  {/* Informador - Campo de solo lectura que muestra quien crea la historia */}
                  <div>
                    <label className="text-sm font-medium">Informador</label>
                    <Input
                      value={
                        isEditing && historia?.creador
                          ? `${historia.creador.nombres} ${historia.creador.apellidoPaterno}`
                          : currentUser?.name || ''
                      }
                      disabled
                      className="bg-gray-100 mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* Story Points */}
              <FormField
                control={form.control}
                name="storyPoints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Points</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        placeholder="Ej: 5"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === '' ? undefined : Number(val));
                        }}
                        className="w-32"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="border-t pt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#018CD1] hover:bg-[#0179b5]">
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? 'Guardar Cambios' : 'Crear Historia'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>

      {/* Modal para crear tarea */}
      {isEditing && historia && (
        <TareaFormModal
          open={isTareaModalOpen}
          onOpenChange={setIsTareaModalOpen}
          historiaUsuarioId={historia.id}
          onSuccess={handleTareaSuccess}
        />
      )}
    </Dialog>

    {/* Modal de error - fuera del Dialog principal */}
    <AlertDialog open={isErrorModalOpen} onOpenChange={setIsErrorModalOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            No se puede realizar la acción
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-700">
            {errorMessage}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={() => setIsErrorModalOpen(false)}
            className="bg-[#018CD1] hover:bg-[#0179b5]"
          >
            Entendido
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
