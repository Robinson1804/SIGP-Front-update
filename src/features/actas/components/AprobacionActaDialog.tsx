'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AprobacionActaDialogProps {
  open: boolean;
  onClose: () => void;
  onAprobar: (aprobado: boolean, comentario?: string) => Promise<void>;
  tipo: 'Constitucion' | 'Reunion';
}

export function AprobacionActaDialog({
  open,
  onClose,
  onAprobar,
  tipo,
}: AprobacionActaDialogProps) {
  const [comentario, setComentario] = useState('');
  const [processing, setProcessing] = useState(false);
  const [action, setAction] = useState<'aprobar' | 'rechazar' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (aprobado: boolean) => {
    if (!aprobado && !comentario.trim()) {
      setError('Debe ingresar un comentario para rechazar el acta');
      return;
    }

    try {
      setError(null);
      setProcessing(true);
      setAction(aprobado ? 'aprobar' : 'rechazar');
      await onAprobar(aprobado, comentario.trim() || undefined);
      setComentario('');
      setAction(null);
    } catch (err) {
      setError('Error al procesar la aprobación');
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    if (!processing) {
      setComentario('');
      setError(null);
      setAction(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Aprobar Acta de {tipo === 'Constitucion' ? 'Constitución' : 'Reunión'}
          </DialogTitle>
          <DialogDescription>
            Revise el acta y decida si aprobarla o rechazarla.
            {tipo === 'Constitucion'
              ? ' El acta de constitución formaliza el inicio del proyecto.'
              : ' El acta de reunión documenta los acuerdos y compromisos.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="comentario">
              Comentario {action === 'rechazar' ? '(requerido)' : '(opcional)'}
            </Label>
            <Textarea
              id="comentario"
              placeholder="Ingrese un comentario o motivo de rechazo..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              disabled={processing}
              rows={4}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={processing}
            className="sm:order-1"
          >
            Cancelar
          </Button>
          <div className="flex gap-2 w-full sm:w-auto sm:order-2">
            <Button
              type="button"
              variant="destructive"
              onClick={() => handleAction(false)}
              disabled={processing}
              className="flex-1 sm:flex-none"
            >
              {processing && action === 'rechazar' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Rechazar
            </Button>
            <Button
              type="button"
              onClick={() => handleAction(true)}
              disabled={processing}
              className="flex-1 sm:flex-none"
            >
              {processing && action === 'aprobar' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Aprobar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
