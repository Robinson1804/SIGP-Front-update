'use client';

/**
 * DailyMeetingForm Component
 *
 * Formulario para registrar participación en la daily meeting
 * Con las 3 preguntas estándar de Scrum
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, MessageSquare } from 'lucide-react';

const participacionSchema = z.object({
  asistio: z.boolean(),
  ayer: z.string().min(1, 'Describe lo que hiciste ayer'),
  hoy: z.string().min(1, 'Describe lo que harás hoy'),
  impedimentos: z.string().optional(),
  notas: z.string().optional(),
});

type ParticipacionFormData = z.infer<typeof participacionSchema>;

interface DailyMeetingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participante?: {
    id: number;
    nombre: string;
    ayer?: string;
    hoy?: string;
    impedimentos?: string;
    asistio?: boolean;
  };
  onSubmit: (data: ParticipacionFormData) => Promise<void>;
  isLoading?: boolean;
}

export function DailyMeetingForm({
  open,
  onOpenChange,
  participante,
  onSubmit,
  isLoading = false,
}: DailyMeetingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ParticipacionFormData>({
    resolver: zodResolver(participacionSchema),
    defaultValues: {
      asistio: participante?.asistio ?? true,
      ayer: participante?.ayer ?? '',
      hoy: participante?.hoy ?? '',
      impedimentos: participante?.impedimentos ?? '',
      notas: '',
    },
  });

  const handleSubmit = async (data: ParticipacionFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error al registrar participación:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const asistio = form.watch('asistio');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#004272]" />
            {participante ? `Daily - ${participante.nombre}` : 'Registrar Participación'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Asistencia */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label>Asistió a la reunión</Label>
              <p className="text-sm text-muted-foreground">
                Marca si el participante estuvo presente
              </p>
            </div>
            <Switch
              checked={asistio}
              onCheckedChange={(checked) => form.setValue('asistio', checked)}
            />
          </div>

          {asistio && (
            <>
              {/* Qué hice ayer */}
              <div className="space-y-2">
                <Label htmlFor="ayer" className="text-sm font-medium">
                  ¿Qué hiciste ayer?
                </Label>
                <Textarea
                  id="ayer"
                  placeholder="Describe las tareas en las que trabajaste ayer..."
                  className="min-h-[80px]"
                  {...form.register('ayer')}
                />
                {form.formState.errors.ayer && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.ayer.message}
                  </p>
                )}
              </div>

              {/* Qué haré hoy */}
              <div className="space-y-2">
                <Label htmlFor="hoy" className="text-sm font-medium">
                  ¿Qué harás hoy?
                </Label>
                <Textarea
                  id="hoy"
                  placeholder="Describe las tareas que planeas completar hoy..."
                  className="min-h-[80px]"
                  {...form.register('hoy')}
                />
                {form.formState.errors.hoy && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.hoy.message}
                  </p>
                )}
              </div>

              {/* Impedimentos */}
              <div className="space-y-2">
                <Label htmlFor="impedimentos" className="text-sm font-medium">
                  ¿Tienes algún impedimento o bloqueo?
                </Label>
                <Textarea
                  id="impedimentos"
                  placeholder="Describe cualquier obstáculo que te impida avanzar (opcional)..."
                  className="min-h-[60px]"
                  {...form.register('impedimentos')}
                />
              </div>

              {/* Notas adicionales */}
              <div className="space-y-2">
                <Label htmlFor="notas" className="text-sm font-medium">
                  Notas adicionales (opcional)
                </Label>
                <Textarea
                  id="notas"
                  placeholder="Cualquier información adicional..."
                  className="min-h-[60px]"
                  {...form.register('notas')}
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
