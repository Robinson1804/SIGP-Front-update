'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { updateProyecto } from '@/features/proyectos/services/proyectos.service';

interface FinalizarProyectoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proyectoId: number;
  proyectoNombre?: string;
  onSuccess: (finalized: boolean) => void;
}

export function FinalizarProyectoModal({
  open,
  onOpenChange,
  proyectoId,
  proyectoNombre,
  onSuccess,
}: FinalizarProyectoModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFinalizarProyecto = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      await updateProyecto(proyectoId, { estado: 'Finalizado' });

      onSuccess(true);
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error finalizando proyecto:', err);
      setError(err.response?.data?.message || 'Error al finalizar el proyecto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinuar = () => {
    onSuccess(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Todos los Sprints Finalizados
          </DialogTitle>
          <DialogDescription>
            Todos los sprints del proyecto han sido finalizados. ¿Desea finalizar el proyecto o continuar creando mas sprints?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {proyectoNombre && (
            <div className="text-sm text-gray-600">
              <strong>Proyecto:</strong> {proyectoNombre}
            </div>
          )}

          <div className="grid gap-3">
            {/* Opcion: Finalizar proyecto */}
            <button
              type="button"
              onClick={handleFinalizarProyecto}
              disabled={isSubmitting}
              className="flex items-start gap-3 p-4 border rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors text-left disabled:opacity-50"
            >
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">Finalizar Proyecto</div>
                <p className="text-sm text-gray-500 mt-1">
                  El proyecto cambiara a estado &quot;Finalizado&quot; y no se podran crear mas sprints.
                </p>
              </div>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin ml-auto" />}
            </button>

            {/* Opcion: Continuar con mas sprints */}
            <button
              type="button"
              onClick={handleContinuar}
              disabled={isSubmitting}
              className="flex items-start gap-3 p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left disabled:opacity-50"
            >
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">Continuar con mas Sprints</div>
                <p className="text-sm text-gray-500 mt-1">
                  El proyecto se mantendra en estado &quot;En desarrollo&quot; para crear mas sprints.
                </p>
              </div>
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
