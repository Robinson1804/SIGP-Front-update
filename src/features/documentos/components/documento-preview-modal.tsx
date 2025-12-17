'use client';

/**
 * Modal de Vista Previa de Documento
 *
 * Muestra información detallada del documento y preview si es posible
 */

import {
  FileText,
  Link as LinkIcon,
  Download,
  ExternalLink,
  Star,
  Calendar,
  User,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Documento } from '../types';

interface DocumentoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documento: Documento | null;
  onDownload?: () => void;
}

const estadoConfig: Record<string, { bg: string; text: string; label: string }> = {
  'Pendiente': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
  'Aprobado': { bg: 'bg-green-100', text: 'text-green-800', label: 'Aprobado' },
  'No Aprobado': { bg: 'bg-red-100', text: 'text-red-800', label: 'Rechazado' },
};

export function DocumentoPreviewModal({
  isOpen,
  onClose,
  documento,
  onDownload,
}: DocumentoPreviewModalProps) {
  if (!documento) return null;

  const tipoArchivo = documento.archivoUrl || documento.archivoId;
  const tipoLink = documento.link && !tipoArchivo;
  const config = estadoConfig[documento.estado] || estadoConfig['Pendiente'];

  const isPdf = documento.tipoArchivo?.includes('pdf');
  const isImage = documento.tipoArchivo?.includes('image');
  const isExcel = documento.tipoArchivo?.includes('spreadsheet') || documento.tipoArchivo?.includes('excel');
  const isWord = documento.tipoArchivo?.includes('word') || documento.tipoArchivo?.includes('document');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatSize = (bytes?: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getCreadorName = () => {
    if (documento.creador) {
      return `${documento.creador.nombres} ${documento.creador.apellidoPaterno}`;
    }
    return `Usuario ${documento.createdBy}`;
  };

  const getAprobadorName = () => {
    if (documento.aprobador) {
      return `${documento.aprobador.nombres} ${documento.aprobador.apellidoPaterno}`;
    }
    if (documento.aprobadoPor) {
      return `Usuario ${documento.aprobadoPor}`;
    }
    return null;
  };

  const handleOpenLink = () => {
    if (documento.link) {
      window.open(documento.link, '_blank');
    }
  };

  const getFileIcon = () => {
    if (isExcel) return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
    if (isWord) return <FileText className="h-8 w-8 text-blue-600" />;
    if (isPdf) return <FileText className="h-8 w-8 text-red-600" />;
    if (isImage) return <FileText className="h-8 w-8 text-purple-600" />;
    return <FileText className="h-8 w-8 text-gray-600" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden flex flex-col" showCloseButton={false}>
        <DialogHeader className="p-4 bg-[#004272] text-white flex flex-row items-center justify-between shrink-0">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            {tipoLink ? (
              <LinkIcon className="h-5 w-5" />
            ) : (
              <FileText className="h-5 w-5" />
            )}
            Detalle del Documento
          </DialogTitle>
          <div className="flex items-center gap-2">
            {onDownload && tipoArchivo && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownload}
                className="text-white hover:bg-white/10 hover:text-white gap-2"
              >
                <Download className="h-4 w-4" />
                Descargar
              </Button>
            )}
            {tipoLink && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenLink}
                className="text-white hover:bg-white/10 hover:text-white gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir enlace
              </Button>
            )}
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        {/* Contenido */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Información principal */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
              {getFileIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold truncate">{documento.nombre}</h3>
                {documento.esObligatorio && (
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
                )}
              </div>
              {documento.descripcion && (
                <p className="text-sm text-muted-foreground">{documento.descripcion}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="secondary"
                  className={cn(config.bg, config.text, 'font-medium')}
                >
                  {config.label}
                </Badge>
                <Badge variant="outline">
                  {tipoLink ? 'Enlace' : 'Archivo'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Detalles */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase">Fase</p>
              <p className="text-sm">{documento.fase}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase">Fecha de subida</p>
              <p className="text-sm flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(documento.createdAt)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase">Subido por</p>
              <p className="text-sm flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {getCreadorName()}
              </p>
            </div>

            {tipoArchivo && documento.archivoTamano && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Tamaño</p>
                <p className="text-sm">{formatSize(documento.archivoTamano)}</p>
              </div>
            )}

            {tipoLink && documento.link && (
              <div className="col-span-2 space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Enlace</p>
                <a
                  href={documento.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline break-all"
                >
                  {documento.link}
                </a>
              </div>
            )}
          </div>

          {/* Estado de aprobación */}
          {documento.estado !== 'Pendiente' && (
            <div className="border-t pt-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Información de {documento.estado === 'Aprobado' ? 'aprobación' : 'rechazo'}
              </p>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                {getAprobadorName() && (
                  <p className="text-sm">
                    <span className="font-medium">Revisado por:</span> {getAprobadorName()}
                  </p>
                )}
                {documento.fechaAprobacion && (
                  <p className="text-sm">
                    <span className="font-medium">Fecha:</span> {formatDate(documento.fechaAprobacion)}
                  </p>
                )}
                {documento.observacionAprobacion && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-1">Observación:</p>
                    <p className="text-sm text-muted-foreground">{documento.observacionAprobacion}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preview de PDF o imagen */}
          {tipoArchivo && documento.archivoUrl && (isPdf || isImage) && (
            <div className="border-t pt-4">
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Vista previa</p>
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                {isPdf ? (
                  <iframe
                    src={documento.archivoUrl}
                    className="w-full h-[400px]"
                    title="Vista previa PDF"
                  />
                ) : isImage ? (
                  <img
                    src={documento.archivoUrl}
                    alt={documento.nombre}
                    className="w-full h-auto max-h-[400px] object-contain"
                  />
                ) : null}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t bg-gray-50 shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
