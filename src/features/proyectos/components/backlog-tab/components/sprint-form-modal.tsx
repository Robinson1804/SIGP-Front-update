'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
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
import { createSprint } from '@/features/proyectos/services/sprints.service';

const sprintSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'Maximo 100 caracteres'),
  objetivo: z.string().max(500, 'Maximo 500 caracteres').optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
  velocidadPlanificada: z.coerce.number().min(0).optional(),
}).refine((data) => {
  if (data.fechaInicio && data.fechaFin) {
    return new Date(data.fechaInicio) <= new Date(data.fechaFin);
  }
  return true;
}, {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  path: ['fechaFin'],
});

type SprintFormValues = z.infer<typeof sprintSchema>;

interface SprintFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proyectoId: number;
  onSuccess: () => void;
}

export function SprintFormModal({
  open,
  onOpenChange,
  proyectoId,
  onSuccess,
}: SprintFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SprintFormValues>({
    resolver: zodResolver(sprintSchema),
    defaultValues: {
      nombre: '',
      objetivo: '',
      fechaInicio: '',
      fechaFin: '',
      velocidadPlanificada: undefined,
    },
  });

  const onSubmit = async (values: SprintFormValues) => {
    try {
      setIsSubmitting(true);

      await createSprint({
        nombre: values.nombre,
        objetivo: values.objetivo || undefined,
        fechaInicio: values.fechaInicio || undefined,
        fechaFin: values.fechaFin || undefined,
        velocidadPlanificada: values.velocidadPlanificada || undefined,
        proyectoId,
      });

      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Error al crear sprint:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuevo Sprint</DialogTitle>
          <DialogDescription>
            Crea un nuevo sprint para el proyecto
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
                    />
                  </FormControl>
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
                    <FormLabel>Fecha de Inicio</FormLabel>
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
                    <FormLabel>Fecha de Fin</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <Input type="number" min="0" placeholder="Story points esperados" {...field} />
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
                Crear Sprint
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
