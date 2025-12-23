'use client';

import { useState } from 'react';
import { Upload, Loader2, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UploadDocumentoFirmadoDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (url: string) => Promise<void>;
}

export function UploadDocumentoFirmadoDialog({
  open,
  onClose,
  onUpload,
}: UploadDocumentoFirmadoDialogProps) {
  const [url, setUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError('Ingrese la URL del documento firmado');
      return;
    }

    try {
      setError(null);
      setUploading(true);
      await onUpload(url.trim());
      setUrl('');
    } catch (err) {
      setError('Error al subir el documento');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setUrl('');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Documento Firmado
          </DialogTitle>
          <DialogDescription>
            Ingrese la URL del documento firmado escaneado o digitalizado.
            Este documento reemplazará el acta generada por el sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <Alert>
              <FileCheck className="h-4 w-4" />
              <AlertDescription>
                <strong>Flujo recomendado:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  <li>Descargue el PDF generado por el sistema</li>
                  <li>Imprima y obtenga las firmas físicas necesarias</li>
                  <li>Escanee el documento firmado</li>
                  <li>Suba el documento a su servicio de almacenamiento</li>
                  <li>Pegue la URL del documento aquí</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="url">URL del documento firmado</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={uploading}
              />
              <p className="text-sm text-muted-foreground">
                Puede ser una URL de Google Drive, OneDrive, MinIO u otro servicio de almacenamiento
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={uploading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={uploading || !url.trim()}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Confirmar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
