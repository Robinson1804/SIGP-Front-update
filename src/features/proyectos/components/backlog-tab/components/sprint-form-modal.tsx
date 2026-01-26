'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createSprint, updateSprint, type Sprint, type SprintEstado } from '@/features/proyectos/services/sprints.service';
import { formatDate, extractDateString } from '@/lib/utils';

const SPRINT_ESTADOS: { value: SprintEstado; label: string }[] = [
  { value: 'Por hacer', label: 'Por hacer' },
  { value: 'En progreso', label: 'En progreso' },
  { value: 'Finalizado', label: 'Finalizado' },
];

// Constantes para validación de duración del sprint
const MIN_SPRINT_DAYS = 7;  // 1 semana
const MAX_SPRINT_DAYS = 28; // 4 semanas

// Schema base con validación de rango de fechas
const createSprintSchema = (proyectoFechaInicio?: string, proyectoFechaFin?: string) => {
  return z.object({
    nombre: z.string().min(1, 'El nombre es requerido').max(100, 'Maximo 100 caracteres'),
    objetivo: z.string().max(500, 'Maximo 500 caracteres').optional(),
    estado: z.enum(['Por hacer', 'En progreso', 'Finalizado']).default('Por hacer'),
    fechaInicio: z.string().min(1, 'La fecha de inicio es requerida'),
    fechaFin: z.string().min(1, 'La fecha de fin es requerida'),
    velocidadPlanificada: z.coerce.number().min(0).optional(),
  }).refine((data) => {
    if (data.fechaInicio && data.fechaFin) {
      return new Date(data.fechaInicio + 'T00:00:00') <= new Date(data.fechaFin + 'T00:00:00');
    }
    return true;
  }, {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['fechaFin'],
  }).refine((data) => {
    // Validar duración mínima del sprint (1 semana)
    if (data.fechaInicio && data.fechaFin) {
      const inicio = new Date(data.fechaInicio + 'T00:00:00');
      const fin = new Date(data.fechaFin + 'T00:00:00');
      const diffTime = fin.getTime() - inicio.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= MIN_SPRINT_DAYS;
    }
    return true;
  }, {
    message: 'La duración mínima del sprint es de 1 semana (7 días)',
    path: ['fechaFin'],
  }).refine((data) => {
    // Validar duración máxima del sprint (4 semanas)
    if (data.fechaInicio && data.fechaFin) {
      const inicio = new Date(data.fechaInicio + 'T00:00:00');
      const fin = new Date(data.fechaFin + 'T00:00:00');
      const diffTime = fin.getTime() - inicio.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= MAX_SPRINT_DAYS;
    }
    return true;
  }, {
    message: 'La duración máxima del sprint es de 4 semanas (28 días)',
    path: ['fechaFin'],
  }).refine((data) => {
    if (data.fechaInicio && proyectoFechaInicio) {
      return new Date(data.fechaInicio + 'T00:00:00') >= new Date(proyectoFechaInicio + 'T00:00:00');
    }
    return true;
  }, {
    message: `La fecha de inicio debe ser posterior o igual a ${proyectoFechaInicio}`,
    path: ['fechaInicio'],
  }).refine((data) => {
    if (data.fechaFin && proyectoFechaFin) {
      return new Date(data.fechaFin + 'T00:00:00') <= new Date(proyectoFechaFin + 'T00:00:00');
    }
    return true;
  }, {
    message: `La fecha de fin debe ser anterior o igual a ${proyectoFechaFin}`,
    path: ['fechaFin'],
  });
};

type SprintFormValues = z.infer<ReturnType<typeof createSprintSchema>>;

interface SprintFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proyectoId: number;
  onSuccess: () => void;
  proyectoFechaInicio?: string | null;
  proyectoFechaFin?: string | null;
  isFirstSprint?: boolean;
  /** Sprint a editar (null para crear nuevo) */
  sprint?: Sprint | null;
  /** Lista de sprints existentes (para validar solapamiento) */
  existingSprints?: Sprint[];
}

// Función helper para agregar días a una fecha
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return date.toISOString().substring(0, 10);
}

// Función para obtener la fecha de inicio sugerida (día después del último sprint)
function getNextSprintStartDate(
  sprints: Sprint[],
  proyectoFechaInicio: string | undefined,
  currentSprintId?: number
): string {
  // Filtrar el sprint actual si estamos editando
  const otherSprints = sprints.filter(s => s.id !== currentSprintId);

  if (otherSprints.length === 0) {
    // Si no hay otros sprints, usar la fecha de inicio del proyecto
    return proyectoFechaInicio || '';
  }

  // Encontrar el sprint con la fecha de fin más tardía
  let latestEndDate: Date | null = null;
  otherSprints.forEach(sprint => {
    if (sprint.fechaFin) {
      const endDate = new Date(sprint.fechaFin.substring(0, 10) + 'T00:00:00');
      if (!latestEndDate || endDate > latestEndDate) {
        latestEndDate = endDate;
      }
    }
  });

  if (latestEndDate) {
    // Retornar el día siguiente a la fecha fin del último sprint
    const nextDay = new Date(latestEndDate);
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay.toISOString().substring(0, 10);
  }

  return proyectoFechaInicio || '';
}

// Función para verificar si hay solapamiento con otros sprints
function checkSprintOverlap(
  fechaInicio: string,
  fechaFin: string,
  sprints: Sprint[],
  currentSprintId?: number
): { hasOverlap: boolean; conflictingSprint?: Sprint } {
  const newStart = new Date(fechaInicio + 'T00:00:00');
  const newEnd = new Date(fechaFin + 'T00:00:00');

  for (const sprint of sprints) {
    // Excluir el sprint actual si estamos editando
    if (sprint.id === currentSprintId) continue;

    if (!sprint.fechaInicio || !sprint.fechaFin) continue;

    const existingStart = new Date(sprint.fechaInicio.substring(0, 10) + 'T00:00:00');
    const existingEnd = new Date(sprint.fechaFin.substring(0, 10) + 'T00:00:00');

    // Verificar solapamiento: dos rangos se solapan si uno empieza antes de que termine el otro
    // y termina después de que empiece el otro
    if (newStart <= existingEnd && newEnd >= existingStart) {
      return { hasOverlap: true, conflictingSprint: sprint };
    }
  }

  return { hasOverlap: false };
}

export function SprintFormModal({
  open,
  onOpenChange,
  proyectoId,
  onSuccess,
  proyectoFechaInicio,
  proyectoFechaFin,
  isFirstSprint = false,
  sprint = null,
  existingSprints = [],
}: SprintFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overlapError, setOverlapError] = useState<string | null>(null);
  const isEditing = !!sprint;

  // Formatear fechas del proyecto para mostrar y validar
  const formatDateForInput = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    // Asegurar formato YYYY-MM-DD
    return extractDateString(dateStr);
  };

  const proyectoInicio = formatDateForInput(proyectoFechaInicio);
  const proyectoFin = formatDateForInput(proyectoFechaFin);

  // Calcular fecha de inicio sugerida basada en el último sprint
  const suggestedStartDate = getNextSprintStartDate(
    existingSprints,
    proyectoInicio,
    sprint?.id
  );

  // Fecha por defecto: día siguiente al fin del último sprint, o fecha inicio del proyecto
  const defaultFechaInicio = suggestedStartDate || '';

  const form = useForm<SprintFormValues>({
    resolver: zodResolver(createSprintSchema(proyectoInicio, proyectoFin)),
    defaultValues: {
      nombre: '',
      objetivo: '',
      estado: 'Por hacer',
      fechaInicio: defaultFechaInicio,
      fechaFin: '',
      velocidadPlanificada: undefined,
    },
  });

  // Cargar datos del sprint cuando se abre en modo edicion
  useEffect(() => {
    if (open) {
      setOverlapError(null); // Limpiar error de solapamiento
      if (sprint) {
        // Usar nombres del backend: sprintGoal y capacidadEquipo
        const objetivo = sprint.sprintGoal || '';
        const velocidad = sprint.capacidadEquipo ?? undefined;

        form.setValue('nombre', sprint.nombre || '');
        form.setValue('objetivo', objetivo);
        form.setValue('estado', sprint.estado || 'Por hacer');
        form.setValue('fechaInicio', formatDateForInput(sprint.fechaInicio));
        form.setValue('fechaFin', formatDateForInput(sprint.fechaFin));
        form.setValue('velocidadPlanificada', velocidad);
      } else {
        // Reset para modo creacion - usar fecha sugerida (día después del último sprint)
        form.setValue('nombre', '');
        form.setValue('objetivo', '');
        form.setValue('estado', 'Por hacer');
        form.setValue('fechaInicio', suggestedStartDate);
        form.setValue('fechaFin', '');
        form.setValue('velocidadPlanificada', undefined);
      }
    }
  }, [open, sprint, form, suggestedStartDate]);

  const onSubmit = async (values: SprintFormValues) => {
    try {
      setIsSubmitting(true);
      setOverlapError(null);

      // Validar solapamiento con otros sprints
      if (values.fechaInicio && values.fechaFin) {
        const overlapCheck = checkSprintOverlap(
          values.fechaInicio,
          values.fechaFin,
          existingSprints,
          sprint?.id
        );

        if (overlapCheck.hasOverlap && overlapCheck.conflictingSprint) {
          const conflicting = overlapCheck.conflictingSprint;
          const conflictStart = formatDate(conflicting.fechaInicio?.substring(0, 10) || '', { day: '2-digit', month: '2-digit', year: 'numeric' });
          const conflictEnd = formatDate(conflicting.fechaFin?.substring(0, 10) || '', { day: '2-digit', month: '2-digit', year: 'numeric' });
          setOverlapError(
            `Las fechas se solapan con "${conflicting.nombre}" (${conflictStart} - ${conflictEnd}). Los sprints no pueden tener fechas superpuestas.`
          );
          setIsSubmitting(false);
          return;
        }
      }

      if (isEditing && sprint) {
        await updateSprint(sprint.id, {
          nombre: values.nombre,
          sprintGoal: values.objetivo || undefined,
          estado: values.estado,
          fechaInicio: values.fechaInicio || undefined,
          fechaFin: values.fechaFin || undefined,
          capacidadEquipo: values.velocidadPlanificada || undefined,
        });
      } else {
        await createSprint({
          nombre: values.nombre,
          sprintGoal: values.objetivo || undefined,
          estado: values.estado,
          fechaInicio: values.fechaInicio || undefined,
          fechaFin: values.fechaFin || undefined,
          capacidadEquipo: values.velocidadPlanificada || undefined,
          proyectoId,
        });
      }

      form.reset();
      onSuccess();
    } catch (error) {
      console.error(`Error al ${isEditing ? 'actualizar' : 'crear'} sprint:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setOverlapError(null);
    }
    onOpenChange(newOpen);
  };

  // Calcular la fecha mínima permitida para el inicio (día después del último sprint existente)
  const minStartDate = suggestedStartDate || proyectoInicio;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Sprint' : 'Nuevo Sprint'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifica los datos del sprint' : 'Crea un nuevo sprint para el proyecto'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Sprint</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Sprint de autenticacion" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="objetivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objetivo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Que se espera lograr en este sprint?"
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SPRINT_ESTADOS.map((estado) => (
                        <SelectItem key={estado.value} value={estado.value}>
                          {estado.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mostrar error de solapamiento */}
            {overlapError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-red-700">{overlapError}</span>
              </div>
            )}

            {/* Mostrar rango del proyecto y fecha sugerida */}
            <div className="space-y-2">
              {proyectoInicio && proyectoFin && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-700">
                    Rango del proyecto: {formatDate(proyectoInicio, { day: '2-digit', month: '2-digit', year: 'numeric' })} - {formatDate(proyectoFin, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                </div>
              )}

              {/* Mostrar fecha sugerida para nuevo sprint (cuando hay sprints existentes) */}
              {!isEditing && existingSprints.length > 0 && suggestedStartDate && (
                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">
                    Fecha sugerida de inicio: {formatDate(suggestedStartDate, { day: '2-digit', month: '2-digit', year: 'numeric' })} (día siguiente al último sprint)
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fechaInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Inicio *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setOverlapError(null); // Limpiar error al cambiar fecha
                        }}
                        min={!isEditing && minStartDate ? minStartDate : (proyectoInicio || undefined)}
                        max={proyectoFin || undefined}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fechaFin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Fin *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setOverlapError(null); // Limpiar error al cambiar fecha
                        }}
                        min={form.watch('fechaInicio') || proyectoInicio || undefined}
                        max={proyectoFin || undefined}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="velocidadPlanificada"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Velocidad Planificada</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Story points esperados"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? undefined : Number(value));
                      }}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Cantidad de story points que se espera completar
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#018CD1] hover:bg-[#0179b5]">
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? 'Guardar Cambios' : 'Crear Sprint'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
