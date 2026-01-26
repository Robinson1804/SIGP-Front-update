'use client';

/**
 * HabilidadForm Component
 *
 * Formulario para crear y editar habilidades
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
import type { Habilidad } from '../types';
import { HabilidadCategoria, getCategoriaLabel } from '../types';
import type { CreateHabilidadDto, UpdateHabilidadDto } from '../types/dto';
import { VALIDATION_RULES } from '../types/dto';

// Schema de validación
const habilidadSchema = z.object({
  nombre: z
    .string()
    .min(VALIDATION_RULES.nombreHabilidad.minLength, 'El nombre debe tener al menos 2 caracteres')
    .max(VALIDATION_RULES.nombreHabilidad.maxLength, 'El nombre no puede exceder 100 caracteres'),
  categoria: z.nativeEnum(HabilidadCategoria, {
    errorMap: () => ({ message: 'Selecciona una categoría' }),
  }),
  descripcion: z
    .string()
    .max(VALIDATION_RULES.descripcion.maxLength, 'La descripción no puede exceder 500 caracteres')
    .optional()
    .or(z.literal('')),
  activo: z.boolean().optional(),
});

type HabilidadFormData = z.infer<typeof habilidadSchema>;

interface HabilidadFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateHabilidadDto | UpdateHabilidadDto) => Promise<void>;
  habilidad?: Habilidad | null;
  isLoading?: boolean;
}

export function HabilidadForm({
  open,
  onClose,
  onSubmit,
  habilidad,
  isLoading = false,
}: HabilidadFormProps) {
  const isEditing = !!habilidad;

  const form = useForm<HabilidadFormData>({
    resolver: zodResolver(habilidadSchema),
    defaultValues: {
      nombre: '',
      categoria: HabilidadCategoria.OTRO,
      descripcion: '',
      activo: true,
    },
  });

  // Reset form when dialog opens or habilidad changes
  useEffect(() => {
    if (open) {
      form.reset({
        nombre: habilidad?.nombre || '',
        categoria: habilidad?.categoria || HabilidadCategoria.OTRO,
        descripcion: habilidad?.descripcion || '',
        activo: habilidad?.activo ?? true,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, habilidad]);

  const handleSubmit = async (data: HabilidadFormData) => {
    try {
      // For updates, include all fields
      // For creates, exclude activo as backend CreateHabilidadDto doesn't accept it
      const { activo, ...baseFields } = data;

      const submitData = isEditing
        ? {
            ...baseFields,
            activo, // Include activo only for updates
            descripcion: data.descripcion || undefined,
          }
        : {
            ...baseFields,
            // Note: activo is excluded for creates - backend sets default
            descripcion: data.descripcion || undefined,
          };
      await onSubmit(submitData as CreateHabilidadDto | UpdateHabilidadDto);
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

  const categorias = Object.values(HabilidadCategoria);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Habilidad' : 'Nueva Habilidad'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los datos de la habilidad'
              : 'Completa los datos para crear una nueva habilidad'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: TypeScript, React, AWS..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="item-aligned">
                      {categorias.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {getCategoriaLabel(cat)}
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
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripción de la habilidad..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
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
                      <p className="text-sm text-muted-foreground">
                        Habilidad activa en el sistema
                      </p>
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
                {isEditing ? 'Guardar cambios' : 'Crear habilidad'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
