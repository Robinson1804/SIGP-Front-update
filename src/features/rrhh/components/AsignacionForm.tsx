'use client';

/**
 * AsignacionForm Component
 *
 * Formulario para crear y editar asignaciones
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Loader2 } from 'lucide-react';
import type { Asignacion, Personal } from '../types';
import { TipoAsignacion, getTipoAsignacionLabel, getNombreCompleto } from '../types';
import type { CreateAsignacionDto, UpdateAsignacionDto } from '../types/dto';
import { VALIDATION_RULES } from '../types/dto';

// Tipos para proyectos/actividades/subproyectos
interface ProyectoBasico {
  id: number;
  codigo: string;
  nombre: string;
}

// Schema de validación
const asignacionSchema = z.object({
  personalId: z.number({ required_error: 'Selecciona un personal' }),
  tipoAsignacion: z.nativeEnum(TipoAsignacion, {
    errorMap: () => ({ message: 'Selecciona un tipo' }),
  }),
  proyectoId: z.number().optional().nullable(),
  actividadId: z.number().optional().nullable(),
  subproyectoId: z.number().optional().nullable(),
  rolEquipo: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  porcentajeDedicacion: z
    .number()
    .min(VALIDATION_RULES.porcentajeDedicacion.min, 'Mínimo 1%')
    .max(VALIDATION_RULES.porcentajeDedicacion.max, 'Máximo 100%'),
  fechaInicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fechaFin: z.string().optional().or(z.literal('')),
});

type AsignacionFormData = z.infer<typeof asignacionSchema>;

interface AsignacionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAsignacionDto | UpdateAsignacionDto) => Promise<void>;
  asignacion?: Asignacion | null;
  personal: Personal[];
  proyectos?: ProyectoBasico[];
  actividades?: ProyectoBasico[];
  subproyectos?: ProyectoBasico[];
  isLoading?: boolean;
  preselectedPersonalId?: number;
}

export function AsignacionForm({
  open,
  onClose,
  onSubmit,
  asignacion,
  personal,
  proyectos = [],
  actividades = [],
  subproyectos = [],
  isLoading = false,
  preselectedPersonalId,
}: AsignacionFormProps) {
  const isEditing = !!asignacion;

  const form = useForm<AsignacionFormData>({
    resolver: zodResolver(asignacionSchema),
    defaultValues: {
      personalId: asignacion?.personalId || preselectedPersonalId || undefined,
      tipoAsignacion: asignacion?.tipoAsignacion || TipoAsignacion.PROYECTO,
      proyectoId: asignacion?.proyectoId || null,
      actividadId: asignacion?.actividadId || null,
      subproyectoId: asignacion?.subproyectoId || null,
      rolEquipo: asignacion?.rolEquipo || '',
      porcentajeDedicacion: asignacion?.porcentajeDedicacion || 50,
      fechaInicio: asignacion?.fechaInicio?.split('T')[0] || new Date().toISOString().split('T')[0],
      fechaFin: asignacion?.fechaFin?.split('T')[0] || '',
    },
  });

  const tipoAsignacion = form.watch('tipoAsignacion');

  // Reset entidad cuando cambia el tipo
  useEffect(() => {
    if (!isEditing) {
      form.setValue('proyectoId', null);
      form.setValue('actividadId', null);
      form.setValue('subproyectoId', null);
    }
  }, [tipoAsignacion, form, isEditing]);

  const handleSubmit = async (data: AsignacionFormData) => {
    try {
      const submitData: CreateAsignacionDto | UpdateAsignacionDto = {
        personalId: data.personalId,
        tipoAsignacion: data.tipoAsignacion,
        proyectoId: data.proyectoId || undefined,
        actividadId: data.actividadId || undefined,
        subproyectoId: data.subproyectoId || undefined,
        rolEquipo: data.rolEquipo || undefined,
        porcentajeDedicacion: data.porcentajeDedicacion,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin || undefined,
      };
      await onSubmit(submitData);
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const tipos = Object.values(TipoAsignacion);

  // Obtener lista de entidades según tipo
  const getEntidades = () => {
    switch (tipoAsignacion) {
      case TipoAsignacion.PROYECTO:
        return proyectos;
      case TipoAsignacion.ACTIVIDAD:
        return actividades;
      case TipoAsignacion.SUBPROYECTO:
        return subproyectos;
      default:
        return [];
    }
  };

  const getEntidadFieldName = (): 'proyectoId' | 'actividadId' | 'subproyectoId' => {
    switch (tipoAsignacion) {
      case TipoAsignacion.PROYECTO:
        return 'proyectoId';
      case TipoAsignacion.ACTIVIDAD:
        return 'actividadId';
      case TipoAsignacion.SUBPROYECTO:
        return 'subproyectoId';
      default:
        return 'proyectoId';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Asignación' : 'Nueva Asignación'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los datos de la asignación'
              : 'Asigna personal a un proyecto, actividad o subproyecto'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="personalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal *</FormLabel>
                  <Select
                    value={field.value?.toString() || ''}
                    onValueChange={(value) => field.onChange(Number(value))}
                    disabled={isEditing || !!preselectedPersonalId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar personal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {personal
                        .filter((p) => p.activo)
                        .map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {getNombreCompleto(p)} - {p.cargo || 'Sin cargo'}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipoAsignacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isEditing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo de asignación" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tipos.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {getTipoAsignacionLabel(tipo)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={getEntidadFieldName()}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{getTipoAsignacionLabel(tipoAsignacion)} *</FormLabel>
                    <Select
                      value={field.value?.toString() || ''}
                      onValueChange={(value) => field.onChange(Number(value))}
                      disabled={isEditing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={`Seleccionar ${getTipoAsignacionLabel(tipoAsignacion).toLowerCase()}`} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getEntidades().map((ent) => (
                          <SelectItem key={ent.id} value={String(ent.id)}>
                            {ent.codigo} - {ent.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="rolEquipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol en el equipo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Desarrollador, Analista, Líder técnico..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="porcentajeDedicacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Porcentaje de dedicación: {field.value}%</FormLabel>
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      onValueChange={(values) => field.onChange(values[0])}
                      min={1}
                      max={100}
                      step={5}
                      className="py-4"
                    />
                  </FormControl>
                  <FormDescription>
                    Porcentaje del tiempo del personal dedicado a esta asignación
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fechaInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha inicio *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <FormLabel>Fecha fin</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>Opcional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Guardar cambios' : 'Crear asignación'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
