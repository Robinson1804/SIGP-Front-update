'use client';

/**
 * Modal de Vista Previa de Documento
 *
 * Muestra información detallada del documento y preview si es posible
 * - URLs públicas: Usa Microsoft Office Web Viewer (mejor calidad)
 * - URLs locales: Usa docx-preview como fallback (funciona offline)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Loader2,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RefreshCw,
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

// Tipos de visor disponibles
type ViewerType = 'microsoft' | 'google' | 'docx-preview';

export function DocumentoPreviewModal({
  isOpen,
  onClose,
  documento,
  onDownload,
}: DocumentoPreviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [viewerType, setViewerType] = useState<ViewerType>('microsoft');
  const [iframeError, setIframeError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const tipoArchivo = documento?.archivoUrl || documento?.archivoId;
  const tipoLink = documento?.link && !tipoArchivo;
  const config = estadoConfig[documento?.estado || 'Pendiente'] || estadoConfig['Pendiente'];

  const isPdf = documento?.tipoArchivo?.includes('pdf');
  const isImage = documento?.tipoArchivo?.includes('image');
  const isExcel = documento?.tipoArchivo?.includes('spreadsheet') || documento?.tipoArchivo?.includes('excel');
  const isWord = documento?.tipoArchivo?.includes('word') || documento?.tipoArchivo?.includes('document');

  // Detectar si la URL es local (localhost, 127.0.0.1, IPs privadas)
  const isLocalUrl = useCallback((url: string) => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      return (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.16.') ||
        hostname.endsWith('.local')
      );
    } catch {
      return true; // Si no se puede parsear, asumir local
    }
  }, []);

  // Generar URL para visor externo
  const getExternalViewerUrl = useCallback((url: string, type: ViewerType) => {
    const encodedUrl = encodeURIComponent(url);
    if (type === 'microsoft') {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
    } else if (type === 'google') {
      return `https://docs.google.com/gview?url=${encodedUrl}&embedded=true`;
    }
    return url;
  }, []);

  // Verificar si debemos usar visor externo o local
  const shouldUseExternalViewer = useCallback(() => {
    if (!documento?.archivoUrl) return false;
    return !isLocalUrl(documento.archivoUrl);
  }, [documento?.archivoUrl, isLocalUrl]);

  // Cargar y renderizar documento Word con docx-preview
  const loadWordDocument = useCallback(async (url: string, container: HTMLDivElement) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Iniciando carga de documento Word:', url);

      // Importar docx-preview dinámicamente (solo en cliente)
      const docxPreview = await import('docx-preview');
      console.log('docx-preview importado correctamente');

      // Descargar el archivo
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`No se pudo descargar el documento: ${response.status}`);
      }
      const blob = await response.blob();
      console.log('Documento descargado, tamaño:', blob.size);

      // Limpiar contenedor anterior
      container.innerHTML = '';

      // Renderizar el documento con docx-preview
      await docxPreview.renderAsync(blob, container, undefined, {
        className: 'docx-preview-wrapper',
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true, // Separar páginas
        ignoreLastRenderedPageBreak: false,
        experimental: true,
        trimXmlDeclaration: true,
        useBase64URL: true,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        renderEndnotes: true,
      });

      console.log('Documento renderizado correctamente');
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar documento Word:', err);
      setError('No se pudo cargar la vista previa del documento');
      setLoading(false);
    }
  }, []);

  // Cargar documento Word cuando se abre el modal y el contenedor está listo
  // Solo usar docx-preview si: 1) URL es local, o 2) viewerType es 'docx-preview'
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen && isWord && documento?.archivoUrl && containerRef.current) {
        const useLocalViewer = isLocalUrl(documento.archivoUrl) || viewerType === 'docx-preview';
        if (useLocalViewer) {
          console.log('Usando visor local (docx-preview)...');
          loadWordDocument(documento.archivoUrl, containerRef.current);
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, isWord, documento?.archivoUrl, loadWordDocument, viewerType, isLocalUrl]);

  // Limpiar estado cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setLoading(false);
      setZoom(100);
      setIframeError(false);
      setViewerType('microsoft');
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    }
  }, [isOpen]);

  // Auto-seleccionar vista local cuando la URL es local
  useEffect(() => {
    if (isOpen && isWord && documento?.archivoUrl && isLocalUrl(documento.archivoUrl)) {
      setViewerType('docx-preview');
    }
  }, [isOpen, isWord, documento?.archivoUrl, isLocalUrl]);

  // Manejar error del iframe (visor externo)
  const handleIframeError = useCallback(() => {
    console.log('Error en visor externo, cambiando a fallback...');
    setIframeError(true);
    // Intentar con Google Docs si Microsoft falla
    if (viewerType === 'microsoft') {
      setViewerType('google');
      setIframeError(false);
    } else if (viewerType === 'google') {
      // Si Google también falla, usar docx-preview
      setViewerType('docx-preview');
      setIframeError(false);
    }
  }, [viewerType]);

  // Cambiar visor manualmente
  const cycleViewer = useCallback(() => {
    if (viewerType === 'microsoft') {
      setViewerType('google');
    } else if (viewerType === 'google') {
      setViewerType('docx-preview');
    } else {
      setViewerType('microsoft');
    }
    setIframeError(false);
    setError(null);
  }, [viewerType]);

  // Obtener nombre del visor actual
  const getViewerName = () => {
    switch (viewerType) {
      case 'microsoft': return 'Microsoft Office';
      case 'google': return 'Google Docs';
      case 'docx-preview': return 'Vista local';
      default: return 'Visor';
    }
  };

  if (!documento) return null;

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
      if (documento.creador.nombreCompleto) {
        return documento.creador.nombreCompleto;
      }
      if (documento.creador.nombres && documento.creador.apellidoPaterno) {
        return `${documento.creador.nombres} ${documento.creador.apellidoPaterno}`;
      }
    }
    return `Usuario ${documento.createdBy}`;
  };

  const getAprobadorName = () => {
    if (documento.aprobador) {
      if (documento.aprobador.nombreCompleto) {
        return documento.aprobador.nombreCompleto;
      }
      if (documento.aprobador.nombres && documento.aprobador.apellidoPaterno) {
        return `${documento.aprobador.nombres} ${documento.aprobador.apellidoPaterno}`;
      }
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

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col" showCloseButton={false}>
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

          {/* Preview de PDF, imagen, Word o Excel */}
          {tipoArchivo && documento.archivoUrl && (isPdf || isImage || isWord || isExcel) && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">Vista previa</p>
                {isWord && !loading && !error && (
                  <div className="flex items-center gap-2">
                    {/* Selector de visor */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cycleViewer}
                      className="h-7 px-2 text-xs gap-1"
                      title="Cambiar visor"
                    >
                      <RefreshCw className="h-3 w-3" />
                      {getViewerName()}
                    </Button>
                    {/* Controles de zoom (solo para docx-preview) */}
                    {(viewerType === 'docx-preview' || isLocalUrl(documento?.archivoUrl || '')) && (
                      <>
                        <div className="w-px h-4 bg-gray-300" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleZoomOut}
                          className="h-7 w-7 p-0"
                          disabled={zoom <= 50}
                        >
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground w-12 text-center">{zoom}%</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleZoomIn}
                          className="h-7 w-7 p-0"
                          disabled={zoom >= 200}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="bg-gray-200 rounded-lg overflow-hidden">
                {isPdf ? (
                  <iframe
                    src={documento.archivoUrl}
                    className="w-full h-[500px]"
                    title="Vista previa PDF"
                  />
                ) : isImage ? (
                  <img
                    src={documento.archivoUrl}
                    alt={documento.nombre}
                    className="w-full h-auto max-h-[500px] object-contain"
                  />
                ) : isWord ? (
                  // Vista previa de Word - Visor externo o local según disponibilidad
                  <div className="relative min-h-[500px]">
                    {/* Loading spinner */}
                    {loading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
                        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                        <p className="text-sm text-muted-foreground">
                          Cargando vista previa del documento...
                        </p>
                      </div>
                    )}

                    {/* Error state */}
                    {error && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 p-6 text-center">
                        <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
                        <p className="text-lg font-medium text-gray-700 mb-2">
                          No se pudo cargar la vista previa
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">{error}</p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={cycleViewer}
                            className="gap-2"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Probar otro visor
                          </Button>
                          {onDownload && (
                            <Button
                              onClick={onDownload}
                              className="bg-[#018CD1] hover:bg-[#018CD1]/90 text-white gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Descargar
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Visor externo (Microsoft/Google) - Solo para URLs públicas */}
                    {!isLocalUrl(documento.archivoUrl) && viewerType !== 'docx-preview' && !error && (
                      <iframe
                        ref={iframeRef}
                        src={getExternalViewerUrl(documento.archivoUrl, viewerType)}
                        className="w-full h-[500px] bg-white"
                        title={`Vista previa - ${getViewerName()}`}
                        onError={handleIframeError}
                        onLoad={(e) => {
                          // Detectar errores de carga
                          const iframe = e.target as HTMLIFrameElement;
                          try {
                            // Si no podemos acceder al contenido, puede haber error
                            if (iframe.contentDocument?.body?.innerHTML === '') {
                              handleIframeError();
                            }
                          } catch {
                            // Error de CORS significa que se cargó pero no podemos verificar
                          }
                        }}
                      />
                    )}

                    {/* Mensaje para URL local con visor externo seleccionado */}
                    {isLocalUrl(documento.archivoUrl) && viewerType !== 'docx-preview' && !loading && !error && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10 p-6 text-center">
                        <AlertCircle className="h-12 w-12 text-blue-500 mb-4" />
                        <p className="text-lg font-medium text-gray-700 mb-2">
                          Visor externo no disponible
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          {getViewerName()} requiere una URL pública.<br />
                          El archivo está en un servidor local.
                        </p>
                        <Button
                          onClick={() => setViewerType('docx-preview')}
                          className="bg-[#018CD1] hover:bg-[#018CD1]/90 text-white gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Usar vista local
                        </Button>
                      </div>
                    )}

                    {/* Contenedor para docx-preview (URLs locales o fallback) */}
                    {(isLocalUrl(documento.archivoUrl) || viewerType === 'docx-preview') && !error && (
                      <div
                        ref={containerRef}
                        className="docx-preview-container overflow-auto max-h-[500px] bg-gray-300 p-4"
                        style={{
                          transform: `scale(${zoom / 100})`,
                          transformOrigin: 'top center',
                          minHeight: zoom > 100 ? `${500 * (zoom / 100)}px` : '500px',
                          display: viewerType === 'docx-preview' || isLocalUrl(documento.archivoUrl) ? 'block' : 'none',
                        }}
                      />
                    )}
                  </div>
                ) : isExcel ? (
                  // Excel no tiene preview directo
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white">
                    <FileSpreadsheet className="h-16 w-16 text-green-600 mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Documento Excel
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      La vista previa no está disponible para archivos Excel.
                      <br />
                      Descargue el documento para visualizarlo.
                    </p>
                    {onDownload && (
                      <Button
                        onClick={onDownload}
                        className="bg-[#018CD1] hover:bg-[#018CD1]/90 text-white gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Descargar Excel
                      </Button>
                    )}
                  </div>
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

      {/* Estilos para docx-preview - simula hojas de papel */}
      <style jsx global>{`
        .docx-preview-container .docx-wrapper {
          background: #4a4a4a !important;
          padding: 30px 20px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          gap: 30px !important;
        }
        .docx-preview-container .docx-wrapper > section.docx {
          background: white !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2) !important;
          margin-bottom: 0 !important;
          border-radius: 2px !important;
          min-height: 700px !important;
          width: 100% !important;
          max-width: 650px !important;
        }
        .docx-preview-container .docx-wrapper > section.docx article {
          padding: 60px 70px !important;
        }
        .docx-preview-container .docx-wrapper > section.docx header,
        .docx-preview-container .docx-wrapper > section.docx footer {
          background: #f8f9fa !important;
          border-bottom: 1px solid #e5e7eb !important;
          padding: 10px 20px !important;
        }
        .docx-preview-container .docx-wrapper > section.docx footer {
          border-bottom: none !important;
          border-top: 1px solid #e5e7eb !important;
        }
        .docx-preview-container article {
          overflow: visible !important;
        }
        /* Indicador visual de separación de páginas */
        .docx-preview-container .docx-wrapper > section.docx::after {
          content: '' !important;
          display: block !important;
          height: 0 !important;
        }
      `}</style>
    </Dialog>
  );
}
