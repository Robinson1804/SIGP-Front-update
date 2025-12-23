'use client';

/**
 * DivisionForm Component
 *
 * Formulario para crear y editar divisiones
 */

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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import type { Division, Personal } from '../types';
import { getNombreCompleto } from '../types';
import type { CreateDivisionDto, UpdateDivisionDto } from '../types/dto';
import { VALIDATION_RULES } from '../types/dto';

// Schema de validación
const divisionSchema = z.object({
  codigo: z
    .string()
    .min(VALIDATION_RULES.codigoDivision.minLength, 'El código debe tener al menos 2 caracteres')
    .max(VALIDATION_RULES.codigoDivision.maxLength, 'El código no puede exceder 10 caracteres')
    .regex(VALIDATION_RULES.codigoDivision.pattern, 'El código debe contener solo letras mayúsculas, números y guiones'),
  nombre: z
    .string()
    .min(VALIDATION_RULES.nombreDivision.minLength, 'El nombre debe tener al menos 3 caracteres')
    .max(VALIDATION_RULES.nombreDivision.maxLength, 'El nombre no puede exceder 100 caracteres'),
  descripcion: z
    .string()
    .max(VALIDATION_RULES.descripcion.maxLength, 'La descripción no puede exceder 500 caracteres')
    .optional()
    .or(z.literal('')),
  divisionPadreId: z.number().optional().nullable(),
  jefeId: z.number().optional().nullable(),
  activo: z.boolean().optional(),
});

type DivisionFormData = z.infer<typeof divisionSchema>;

interface DivisionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDivisionDto | UpdateDivisionDto) => Promise<void>;
  division?: Division | null;
  divisiones: Division[];
  personal: Personal[];
  isLoading?: boolean;
}

export function DivisionForm({
  open,
  onClose,
  onSubmit,
  division,
  divisiones,
  personal,
  isLoading = false,
}: DivisionFormProps) {
  const isEditing = !!division;

  const form = useForm<DivisionFormData>({
    resolver: zodResolver(divisionSchema),
    defaultValues: {
      codigo: division?.codigo || '',
      nombre: division?.nombre || '',
      descripcion: division?.descripcion || '',
      divisionPadreId: division?.divisionPadreId || null,
      jefeId: division?.jefeId || null,
      activo: division?.activo ?? true,
    },
  });

  // Filtrar divisiones para evitar seleccionar la misma o sus hijos
  const divisionesDisponibles = divisiones.filter((d) => {
    if (!division) return true;
    // No puede ser padre de sí misma
    if (d.id === division.id) return false;
    // TODO: Evitar ciclos en la jerarquía
    return true;
  });

  const handleSubmit = async (data: DivisionFormData) => {
    try {
      const submitData = {
        ...data,
        descripcion: data.descripcion || undefined,
        divisionPadreId: data.divisionPadreId || undefined,
        jefeId: data.jefeId || undefined,
      };
      await onSubmit(submitData as CreateDivisionDto | UpdateDivisionDto);
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar División' : 'Nueva División'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los datos de la división'
              : 'Completa los datos para crear una nueva división'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="DIV-01"
                        {...field}
                        className="uppercase"
                        disabled={isEditing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre de la división" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripción de la división..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="divisionPadreId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>División Padre</FormLabel>
                  <Select
                    value={field.value?.toString() || 'none'}
                    onValueChange={(value) =>
                      field.onChange(value === 'none' ? null : Number(value))
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar división padre (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sin división padre</SelectItem>
                      {divisionesDisponibles.map((div) => (
                        <SelectItem key={div.id} value={String(div.id)}>
                          {div.codigo} - {div.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    División jerárquicamente superior (opcional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jefeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jefe de División</FormLabel>
                  <Select
                    value={field.value?.toString() || 'none'}
                    onValueChange={(value) =>
                      field.onChange(value === 'none' ? null : Number(value))
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar jefe (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sin jefe asignado</SelectItem>
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

            {isEditing && (
              <FormField
                control={form.control}
                name="activo"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Estado</FormLabel>
                      <FormDescription>
                        División activa en el sistema
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Guardar cambios' : 'Crear división'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
