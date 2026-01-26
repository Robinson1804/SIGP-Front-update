'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Download,
  Loader2,
} from 'lucide-react';
import { type HistoriaUsuario, validarHistoria, regenerarPdfEvidencias } from '@/features/proyectos/services/historias.service';

interface ValidarHuModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  historia: HistoriaUsuario;
  onSuccess: () => void;
}

export function ValidarHuModal({
  open,
  onOpenChange,
  historia,
  onSuccess,
}: ValidarHuModalProps) {
  const [observacion, setObservacion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleValidar = async (aprobado: boolean) => {
    // Si se rechaza, la observacion es obligatoria
    if (!aprobado && !observacion.trim()) {
      setError('Debe ingresar una observacion explicando el motivo del rechazo.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await validarHistoria(historia.id, {
        aprobado,
        observacion: observacion.trim() || undefined,
      });
      onOpenChange(false);
      setObservacion('');
      onSuccess();
    } catch (err: any) {
      console.error('Error validando historia:', err);
      setError(err.response?.data?.message || 'Error al validar la Historia de Usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ver documento: regenera el PDF con imágenes embebidas y lo abre
  const handleDownloadPdf = async () => {
    try {
      setIsLoadingPdf(true);
      setError(null);
      // Regenerar el PDF para asegurar que tenga las imágenes embebidas
      const result = await regenerarPdfEvidencias(historia.id);
      // Abrir el PDF en una nueva pestaña
      window.open(result.url, '_blank');
    } catch (err: any) {
      console.error('Error generando PDF:', err);
      setError(err.response?.data?.message || 'Error al generar el PDF de evidencias');
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setObservacion('');
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[#018CD1]" />
            <DialogTitle>Validar Historia de Usuario</DialogTitle>
          </div>
          <DialogDescription>
            Revise las evidencias y apruebe o rechace esta Historia de Usuario.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informacion de la HU */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-700">{historia.codigo}</Badge>
              <span className="font-medium text-gray-900">{historia.titulo}</span>
            </div>

            {/* User Story Format */}
            {(historia.rol || historia.quiero || historia.para) && (
              <div className="space-y-1 text-sm text-gray-600 pl-2 border-l-2 border-blue-200">
                {historia.rol && (
                  <p>
                    <span className="font-medium text-gray-700">Como</span> {historia.rol}
                  </p>
                )}
                {historia.quiero && (
                  <p>
                    <span className="font-medium text-gray-700">Quiero</span> {historia.quiero}
                  </p>
                )}
                {historia.para && (
                  <p>
                    <span className="font-medium text-gray-700">Para</span> {historia.para}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Mensaje informativo */}
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Esta Historia de Usuario tiene todas sus tareas completadas con evidencias.</p>
              <p className="mt-1 text-amber-700">
                ¿Desea validar y finalizar la HU o rechazarla para correcciones?
              </p>
            </div>
          </div>

          {/* Documento de evidencias */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Documento de Evidencias</Label>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2 h-auto py-3"
              onClick={handleDownloadPdf}
              disabled={isLoadingPdf}
            >
              {isLoadingPdf ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              ) : (
                <FileText className="h-5 w-5 text-red-600" />
              )}
              <div className="flex flex-col items-start">
                <span className="font-medium">
                  {isLoadingPdf ? 'Generando PDF...' : 'Ver documento de evidencias'}
                </span>
                <span className="text-xs text-gray-500">
                  PDF con todas las imágenes de evidencias embebidas
                </span>
              </div>
              {!isLoadingPdf && <Download className="h-4 w-4 ml-auto text-gray-400" />}
            </Button>
          </div>

          {/* Campo de observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observacion" className="text-sm font-medium">
              Observaciones
              <span className="text-gray-500 font-normal ml-1">
                (obligatorio si rechaza)
              </span>
            </Label>
            <Textarea
              id="observacion"
              placeholder="Ingrese las observaciones o motivo del rechazo..."
              value={observacion}
              onChange={(e) => {
                setObservacion(e.target.value);
                if (error) setError(null);
              }}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4 gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleValidar(false)}
            disabled={isSubmitting}
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <AlertTriangle className="h-4 w-4 mr-2" />
            )}
            Rechazar
          </Button>
          <Button
            type="button"
            onClick={() => handleValidar(true)}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Aprobar y Finalizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
