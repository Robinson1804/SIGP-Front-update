/**
 * AprobacionModal Component
 *
 * Modal para confirmar aprobación o rechazo
 */

'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface AprobacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'aprobar' | 'rechazar';
  onConfirm: (value: string) => Promise<boolean>;
}

// Schemas de validación
const aprobarSchema = z.object({
  comentario: z.string().optional(),
});

const rechazarSchema = z.object({
  motivo: z
    .string()
    .min(10, { message: 'El motivo debe tener al menos 10 caracteres' })
    .max(500, { message: 'El motivo no puede exceder 500 caracteres' }),
});

type AprobarFormData = z.infer<typeof aprobarSchema>;
type RechazarFormData = z.infer<typeof rechazarSchema>;

/**
 * Modal de confirmación para aprobar o rechazar
 *
 * @example
 * ```tsx
 * <AprobacionModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   action="aprobar"
 *   onConfirm={handleConfirm}
 * />
 * ```
 */
export function AprobacionModal({
  isOpen,
  onClose,
  action,
  onConfirm,
}: AprobacionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAprobar = action === 'aprobar';
  const schema = isAprobar ? aprobarSchema : rechazarSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AprobarFormData | RechazarFormData>({
    resolver: zodResolver(schema),
  });

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  const onSubmit = async (data: AprobarFormData | RechazarFormData) => {
    setIsSubmitting(true);

    const value = isAprobar
      ? (data as AprobarFormData).comentario || ''
      : (data as RechazarFormData).motivo;

    const success = await onConfirm(value);

    setIsSubmitting(false);

    if (success) {
      reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isAprobar ? 'Aprobar' : 'Rechazar'}
          </DialogTitle>
          <DialogDescription>
            {isAprobar
              ? 'Puedes agregar un comentario opcional sobre tu aprobación.'
              : 'Debes proporcionar un motivo detallado del rechazo.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor={isAprobar ? 'comentario' : 'motivo'}>
                {isAprobar ? 'Comentario (opcional)' : 'Motivo *'}
              </Label>
              <Textarea
                id={isAprobar ? 'comentario' : 'motivo'}
                placeholder={
                  isAprobar
                    ? 'Escribe un comentario...'
                    : 'Explica el motivo del rechazo...'
                }
                rows={4}
                disabled={isSubmitting}
                {...register(isAprobar ? 'comentario' : 'motivo')}
              />
              {!isAprobar && 'motivo' in errors && errors.motivo && (
                <p className="text-sm text-red-600">
                  {(errors as { motivo?: { message?: string } }).motivo?.message}
                </p>
              )}
              {!isAprobar && (
                <p className="text-xs text-gray-500">
                  Mínimo 10 caracteres, máximo 500
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={
                isAprobar
                  ? 'bg-green-600 hover:bg-green-700'
                  : ''
              }
              variant={isAprobar ? 'default' : 'destructive'}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isAprobar ? 'Aprobar' : 'Rechazar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
