'use client';

/**
 * Modal de Aprobación de Documento
 *
 * Permite a PMO aprobar o rechazar un documento
 * Si se rechaza, requiere motivo obligatorio
 */

import { useState, useEffect } from 'react';
import {
  FileText,
  Link as LinkIcon,
  Download,
  ExternalLink,
  Star,
  CheckCircle,
  XCircle,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Documento, AprobarDocumentoInput } from '../types';

interface DocumentoApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  documento: Documento | null;
  onApprove: (id: number, data: AprobarDocumentoInput) => Promise<Documento | null>;
  onDownload?: () => void;
}

export function DocumentoApprovalModal({
  isOpen,
  onClose,
  documento,
  onApprove,
  onDownload,
}: DocumentoApprovalModalProps) {
  const [observacion, setObservacion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setObservacion('');
      setError(null);
    }
  }, [isOpen]);

  if (!documento) return null;

  const tipoArchivo = documento.archivoUrl || documento.archivoId;
  const tipoLink = documento.link && !tipoArchivo;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getCreadorName = () => {
    if (documento.creador) {
      return `${documento.creador.nombres} ${documento.creador.apellidoPaterno}`;
    }
    return `Usuario ${documento.createdBy}`;
  };

  const handleOpenLink = () => {
    if (documento.link) {
      window.open(documento.link, '_blank');
    }
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onApprove(documento.id, {
        estado: 'Aprobado',
        observacion: observacion.trim() || undefined,
      });

      if (result) {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar el documento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!observacion.trim()) {
      setError('Debe ingresar un motivo para rechazar el documento');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onApprove(documento.id, {
        estado: 'No Aprobado',
        observacion: observacion.trim(),
      });

      if (result) {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar el documento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden" showCloseButton={false}>
        <DialogHeader className="p-4 bg-[#004272] text-white flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            Revisar Documento
          </DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Información del documento */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 border">
                {tipoLink ? (
                  <LinkIcon className="h-5 w-5 text-blue-500" />
                ) : (
                  <FileText className="h-5 w-5 text-gray-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">{documento.nombre}</h3>
                  {documento.esObligatorio && (
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
                  )}
                </div>
                {documento.descripcion && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{documento.descripcion}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t">
              <div>
                <span className="text-muted-foreground">Fase:</span>
                <span className="ml-2 font-medium">{documento.fase}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Fecha:</span>
                <span className="ml-2">{formatDate(documento.createdAt)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Subido por:</span>
                <span className="ml-2">{getCreadorName()}</span>
              </div>
            </div>

            {/* Acciones de visualización */}
            <div className="flex gap-2 pt-2 border-t">
              {tipoLink && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenLink}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir enlace
                </Button>
              )}
              {tipoArchivo && onDownload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDownload}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Descargar archivo
                </Button>
              )}
            </div>
          </div>

          {/* Observación */}
          <div>
            <Label className="text-sm font-medium">
              Observación
              <span className="text-muted-foreground font-normal ml-1">(obligatoria si rechaza)</span>
            </Label>
            <Textarea
              placeholder="Ingrese observaciones o motivo de rechazo..."
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              className="mt-1"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3">
            <Button
              onClick={handleApprove}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Aprobar
            </Button>
            <Button
              onClick={handleReject}
              variant="destructive"
              className="flex-1 gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Rechazar
            </Button>
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
