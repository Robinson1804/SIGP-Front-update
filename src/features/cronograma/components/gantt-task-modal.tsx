'use client';

/**
 * GanttTaskModal Component
 *
 * Modal para crear y editar tareas del cronograma
 * Usa React Hook Form + Zod para validacion
 */

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import type {
  TareaCronograma,
  CreateTareaCronogramaInput,
  UpdateTareaCronogramaInput,
  AsignadoA,
} from '../types';
import { COLORES_POR_TIPO, FASES_CRONOGRAMA, ASIGNADO_A_OPTIONS } from '../types';

// Helper para formatear fecha a YYYY-MM-DD (usando fecha local, no UTC)
function formatDateToInput(date: Date | string): string {
  if (typeof date === 'string') {
    // Si ya es un string, extraer solo la parte de fecha sin conversión
    // Puede venir como "2023-07-05" o "2023-07-05T12:00:00.000Z"
    const dateOnly = date.split('T')[0];
    // Verificar que tiene formato válido YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
      return dateOnly;
    }
  }
  // Si es un Date object, usar métodos locales
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper para convertir fecha local YYYY-MM-DD a ISO string con hora al mediodía
// Esto evita problemas de zona horaria al cruzar el límite de día
function localDateToISO(dateStr: string): string {
  // Agregar hora al mediodía para evitar desfase por timezone
  return `${dateStr}T12:00:00.000Z`;
}

// Helper para mostrar fecha YYYY-MM-DD como DD/MM/YYYY sin problemas de timezone
function formatDateDisplay(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  // Parsear directamente los componentes de la fecha para evitar problemas de timezone
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

// Schema base de validacion
const tareaFormSchemaBase = z.object({
  codigo: z.string().max(20, 'Maximo 20 caracteres').optional(),
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(200, 'Maximo 200 caracteres'),
  descripcion: z.string().max(1000, 'Maximo 1000 caracteres').optional(),
  inicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fin: z.string().min(1, 'La fecha de fin es requerida'),
  fase: z.enum(['Analisis', 'Diseno', 'Desarrollo', 'Pruebas', 'Implementacion', 'Mantenimiento'] as const).optional().nullable(),
  padre: z.string().optional().nullable(),
  asignadoA: z.enum(['Scrum Master', 'Desarrolladores', 'Todo el equipo'] as const).optional().nullable(),
  color: z.string().optional(),
  progreso: z.number().min(0).max(100).default(0),
});

/**
 * Crea el schema de validación con las fechas del proyecto
 */
function createTareaFormSchema(proyectoFechaInicio?: string | null, proyectoFechaFin?: string | null) {
  return tareaFormSchemaBase
    .refine((data) => {
      return new Date(data.fin) >= new Date(data.inicio);
    }, {
      message: 'La fecha de fin debe ser posterior a la fecha de inicio',
      path: ['fin'],
    })
    .refine((data) => {
      // Si no hay fechas del proyecto, no validar
      if (!proyectoFechaInicio) return true;
      const tareaInicio = new Date(data.inicio);
      const proyInicio = new Date(proyectoFechaInicio);
      return tareaInicio >= proyInicio;
    }, {
      message: proyectoFechaInicio
        ? `La fecha de inicio no puede ser anterior a la fecha de inicio del proyecto (${formatDateDisplay(proyectoFechaInicio)})`
        : 'Fecha inválida',
      path: ['inicio'],
    })
    .refine((data) => {
      // Si no hay fechas del proyecto, no validar
      if (!proyectoFechaFin) return true;
      const tareaFin = new Date(data.fin);
      const proyFin = new Date(proyectoFechaFin);
      return tareaFin <= proyFin;
    }, {
      message: proyectoFechaFin
        ? `La fecha de fin no puede ser posterior a la fecha de fin del proyecto (${formatDateDisplay(proyectoFechaFin)})`
        : 'Fecha inválida',
      path: ['fin'],
    });
}

type TareaFormValues = z.infer<typeof tareaFormSchemaBase>;

interface GanttTaskModalProps {
  /** Controla si el modal esta abierto */
  open: boolean;
  /** Callback cuando se cierra el modal */
  onClose: () => void;
  /** Callback cuando se guarda la tarea */
  onSave: (data: CreateTareaCronogramaInput | UpdateTareaCronogramaInput) => Promise<void>;
  /** Tarea a editar (undefined para crear nueva) */
  tarea?: TareaCronograma;
  /** Lista de tareas padre disponibles (para anidamiento) */
  tareasPadre?: { id: string; nombre: string }[];
  /** Indica si esta guardando */
  isLoading?: boolean;
  /** Modo de operacion */
  mode?: 'create' | 'edit';
  /** Códigos de tareas existentes (para generar codigo único) */
  codigosExistentes?: string[];
  /** Fecha de inicio del proyecto (para validación de rango) */
  proyectoFechaInicio?: string | null;
  /** Fecha de fin del proyecto (para validación de rango) */
  proyectoFechaFin?: string | null;
}

const COLORES_PRESETS = [
  { value: '#004272', label: 'Azul INEI' },
  { value: '#10b981', label: 'Verde' },
  { value: '#f59e0b', label: 'Naranja' },
  { value: '#ef4444', label: 'Rojo' },
  { value: '#8b5cf6', label: 'Morado' },
  { value: '#6366f1', label: 'Indigo' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#64748b', label: 'Gris' },
];

/**
 * Modal para crear/editar tareas del cronograma
 *
 * @example
 * <GanttTaskModal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSave={handleSave}
 *   responsables={listaResponsables}
 * />
 */
export function GanttTaskModal({
  open,
  onClose,
  onSave,
  tarea,
  tareasPadre = [],
  isLoading = false,
  mode = tarea ? 'edit' : 'create',
  codigosExistentes = [],
  proyectoFechaInicio,
  proyectoFechaFin,
}: GanttTaskModalProps) {
  // Generar codigo automaticamente basado en el código más alto existente
  const generatedCodigo = useMemo(() => {
    if (tarea?.codigo) return tarea.codigo;

    // Buscar el número más alto de los códigos existentes con formato T-XXX
    let maxNumber = 0;
    codigosExistentes.forEach(codigo => {
      const match = codigo?.match(/^T-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    });

    const nextNumber = maxNumber + 1;
    return `T-${String(nextNumber).padStart(3, '0')}`;
  }, [tarea?.codigo, codigosExistentes]);

  // Valores por defecto
  const defaultValues = useMemo((): Partial<TareaFormValues> => {
    if (tarea) {
      return {
        codigo: tarea.codigo || generatedCodigo,
        nombre: tarea.nombre,
        descripcion: tarea.descripcion || '',
        inicio: formatDateToInput(tarea.inicio),
        fin: formatDateToInput(tarea.fin),
        fase: tarea.fase || null,
        padre: tarea.padre || null,
        asignadoA: tarea.asignadoA || null,
        color: tarea.color || COLORES_POR_TIPO.tarea,
        progreso: Math.round(Number(tarea.progreso) || 0),
      };
    }
    return {
      codigo: generatedCodigo,
      nombre: '',
      descripcion: '',
      inicio: '',
      fin: '',
      fase: null,
      padre: null,
      asignadoA: null,
      color: COLORES_POR_TIPO.tarea,
      progreso: 0,
    };
  }, [tarea, generatedCodigo, proyectoFechaInicio, proyectoFechaFin]);

  // Schema dinámico con validación de fechas del proyecto
  const tareaFormSchema = useMemo(
    () => createTareaFormSchema(proyectoFechaInicio, proyectoFechaFin),
    [proyectoFechaInicio, proyectoFechaFin]
  );

  // Formulario
  const form = useForm<TareaFormValues>({
    resolver: zodResolver(tareaFormSchema),
    defaultValues,
  });

  // Reset form cuando cambia la tarea
  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, defaultValues, form]);

  const isEditing = mode === 'edit';

  // Submit handler
  const handleSubmit = async (values: TareaFormValues) => {
    // Datos comunes para crear y editar
    // Usar localDateToISO para evitar desfase de timezone
    const baseData = {
      nombre: values.nombre,
      descripcion: values.descripcion || undefined,
      inicio: localDateToISO(values.inicio),
      fin: localDateToISO(values.fin),
      fase: values.fase || undefined,
      // padre puede ser null (para quitar la asociación), no usar || undefined
      padre: values.padre,
      asignadoA: values.asignadoA || undefined,
      color: values.color || undefined,
      progreso: values.progreso,
    };

    // Solo incluir codigo y tipo al crear (no permitidos en update DTO)
    const data = isEditing
      ? baseData
      : {
          ...baseData,
          codigo: generatedCodigo,
          tipo: 'tarea' as const,
        };

    await onSave(data);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Tarea' : 'Nueva Tarea del Cronograma'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifique los datos de la tarea'
              : 'Complete los datos para agregar una nueva tarea al cronograma'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Nombre */}
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Diseno de base de datos"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Codigo */}
            <FormField
              control={form.control}
              name="codigo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={generatedCodigo}
                      readOnly
                      disabled
                      className="bg-gray-100 cursor-not-allowed w-32"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Generado automáticamente
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fase y Padre */}
            <div className="grid grid-cols-2 gap-4">
                {/* Fase */}
                <FormField
                  control={form.control}
                  name="fase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fase del Proyecto</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === '__none__' ? null : value)
                        }
                        value={field.value || '__none__'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar fase" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">Sin fase</SelectItem>
                          {FASES_CRONOGRAMA.map((fase) => (
                            <SelectItem key={fase.value} value={fase.value}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: fase.color }}
                                />
                                {fase.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Padre (fase/proyecto padre) */}
                {tareasPadre.length > 0 && (
                  <FormField
                    control={form.control}
                    name="padre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pertenece a Fase</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(value === '__none__' ? null : value)
                          }
                          value={field.value || '__none__'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar fase padre" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">Ninguna (raiz)</SelectItem>
                            {tareasPadre.map((padre) => (
                              <SelectItem key={padre.id} value={padre.id}>
                                {padre.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Inicio *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ''}
                        min={proyectoFechaInicio || undefined}
                        max={proyectoFechaFin || undefined}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Fin *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ''}
                        min={proyectoFechaInicio || undefined}
                        max={proyectoFechaFin || undefined}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Mensaje informativo sobre rango de fechas del proyecto */}
            {(proyectoFechaInicio || proyectoFechaFin) && (
              <p className="text-xs text-muted-foreground">
                Rango del proyecto:{' '}
                {proyectoFechaInicio ? formatDateDisplay(proyectoFechaInicio) : 'Sin inicio'}{' '}
                -{' '}
                {proyectoFechaFin ? formatDateDisplay(proyectoFechaFin) : 'Sin fin'}
              </p>
            )}

            {/* Asignado A */}
            <FormField
              control={form.control}
              name="asignadoA"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asignado a</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === '__none__' ? null : value)
                    }
                    value={field.value || '__none__'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar asignación" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">Sin asignar</SelectItem>
                      {ASIGNADO_A_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span>{option.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {option.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {COLORES_PRESETS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => field.onChange(color.value)}
                        className={cn(
                          'w-8 h-8 rounded-full border-2 transition-all',
                          field.value === color.value
                            ? 'border-gray-900 scale-110'
                            : 'border-gray-300 hover:scale-105'
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                      />
                    ))}
                    <Input
                      type="color"
                      value={field.value || '#004272'}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-8 h-8 p-0 border-2 cursor-pointer"
                      title="Color personalizado"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Progreso */}
            <FormField
              control={form.control}
              name="progreso"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Progreso: {field.value}%
                  </FormLabel>
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      onValueChange={([value]) => field.onChange(value)}
                      max={100}
                      step={5}
                      className="py-2"
                    />
                  </FormControl>
                  <FormDescription>
                    Porcentaje de avance de la tarea
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descripcion */}
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripcion</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripcion opcional de la tarea..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#004272] hover:bg-[#003156]"
              >
                {isLoading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Tarea'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
