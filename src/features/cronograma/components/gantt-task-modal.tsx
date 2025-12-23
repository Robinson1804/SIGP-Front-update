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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Slider } from '@/components/ui/slider';
import type {
  TareaCronograma,
  TipoTarea,
  FaseCronograma,
  CreateTareaCronogramaInput,
  UpdateTareaCronogramaInput,
} from '../types';
import { COLORES_POR_TIPO, FASES_CRONOGRAMA } from '../types';

// Schema de validacion
const tareaFormSchema = z.object({
  codigo: z.string().max(20, 'Maximo 20 caracteres').optional(),
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(200, 'Maximo 200 caracteres'),
  descripcion: z.string().max(1000, 'Maximo 1000 caracteres').optional(),
  inicio: z.date({
    required_error: 'La fecha de inicio es requerida',
  }),
  fin: z.date({
    required_error: 'La fecha de fin es requerida',
  }),
  tipo: z.enum(['tarea', 'hito', 'proyecto'] as const, {
    required_error: 'Seleccione un tipo',
  }),
  fase: z.enum(['Analisis', 'Diseno', 'Desarrollo', 'Pruebas', 'Implementacion', 'Mantenimiento'] as const).optional().nullable(),
  padre: z.string().optional().nullable(),
  responsableId: z.number().optional().nullable(),
  color: z.string().optional(),
  progreso: z.number().min(0).max(100).default(0),
}).refine((data) => {
  // Los hitos pueden tener la misma fecha de inicio y fin
  if (data.tipo === 'hito') return true;
  return data.fin >= data.inicio;
}, {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  path: ['fin'],
});

type TareaFormValues = z.infer<typeof tareaFormSchema>;

interface GanttTaskModalProps {
  /** Controla si el modal esta abierto */
  open: boolean;
  /** Callback cuando se cierra el modal */
  onClose: () => void;
  /** Callback cuando se guarda la tarea */
  onSave: (data: CreateTareaCronogramaInput | UpdateTareaCronogramaInput) => Promise<void>;
  /** Tarea a editar (undefined para crear nueva) */
  tarea?: TareaCronograma;
  /** Lista de responsables disponibles */
  responsables?: { id: number; nombre: string }[];
  /** Lista de tareas padre disponibles (para anidamiento) */
  tareasPadre?: { id: string; nombre: string }[];
  /** Indica si esta guardando */
  isLoading?: boolean;
  /** Modo de operacion */
  mode?: 'create' | 'edit';
}

const TIPO_OPTIONS: { value: TipoTarea; label: string; descripcion: string }[] = [
  {
    value: 'tarea',
    label: 'Tarea',
    descripcion: 'Actividad con duracion y progreso',
  },
  {
    value: 'hito',
    label: 'Hito',
    descripcion: 'Punto de control sin duracion',
  },
  {
    value: 'proyecto',
    label: 'Fase/Proyecto',
    descripcion: 'Agrupador de tareas hijo',
  },
];

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
  responsables = [],
  tareasPadre = [],
  isLoading = false,
  mode = tarea ? 'edit' : 'create',
}: GanttTaskModalProps) {
  // Valores por defecto
  const defaultValues = useMemo((): Partial<TareaFormValues> => {
    if (tarea) {
      return {
        codigo: tarea.codigo || '',
        nombre: tarea.nombre,
        descripcion: tarea.descripcion || '',
        inicio: new Date(tarea.inicio),
        fin: new Date(tarea.fin),
        tipo: tarea.tipo,
        fase: tarea.fase || null,
        padre: tarea.padre || null,
        responsableId: tarea.responsableId || null,
        color: tarea.color || COLORES_POR_TIPO[tarea.tipo],
        progreso: tarea.progreso || 0,
      };
    }
    return {
      codigo: '',
      nombre: '',
      descripcion: '',
      inicio: new Date(),
      fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 dias
      tipo: 'tarea',
      fase: null,
      padre: null,
      responsableId: null,
      color: COLORES_POR_TIPO.tarea,
      progreso: 0,
    };
  }, [tarea]);

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

  // Observar cambios en el tipo para actualizar color
  const tipoActual = form.watch('tipo');
  useEffect(() => {
    const currentColor = form.getValues('color');
    // Solo actualizar si no tiene color personalizado
    if (!currentColor || Object.values(COLORES_POR_TIPO).includes(currentColor)) {
      form.setValue('color', COLORES_POR_TIPO[tipoActual]);
    }
  }, [tipoActual, form]);

  // Submit handler
  const handleSubmit = async (values: TareaFormValues) => {
    const data = {
      ...(mode === 'edit' ? {} : {}),
      codigo: values.codigo || undefined,
      nombre: values.nombre,
      descripcion: values.descripcion || undefined,
      inicio: values.inicio.toISOString(),
      fin: values.fin.toISOString(),
      tipo: values.tipo,
      fase: values.fase || undefined,
      padre: values.padre || undefined,
      responsableId: values.responsableId || undefined,
      color: values.color || undefined,
      progreso: values.progreso,
    };

    await onSave(data);
    onClose();
  };

  const isEditing = mode === 'edit';

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

            {/* Codigo y Tipo en fila */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Codigo</FormLabel>
                    <FormControl>
                      <Input placeholder="T-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPO_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <span className="font-medium">{option.label}</span>
                              <span className="text-xs text-gray-500 ml-2">
                                {option.descripcion}
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
            </div>

            {/* Fase y Padre - Solo mostrar si no es tipo proyecto */}
            {tipoActual !== 'proyecto' && (
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
            )}

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="inicio"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Inicio *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy', { locale: es })
                            ) : (
                              <span>Seleccionar</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date('2020-01-01')}
                          locale={es}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fin"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Fin *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy', { locale: es })
                            ) : (
                              <span>Seleccionar</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            const inicio = form.getValues('inicio');
                            return (
                              date < new Date('2020-01-01') ||
                              (inicio && date < inicio && tipoActual !== 'hito')
                            );
                          }}
                          locale={es}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Responsable */}
            {responsables.length > 0 && (
              <FormField
                control={form.control}
                name="responsableId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsable</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === '__none__' ? null : parseInt(value, 10))
                      }
                      value={field.value?.toString() || '__none__'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar responsable" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Sin asignar</SelectItem>
                        {responsables.map((resp) => (
                          <SelectItem key={resp.id} value={resp.id.toString()}>
                            {resp.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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

            {/* Progreso (solo si no es hito) */}
            {tipoActual !== 'hito' && (
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
            )}

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
