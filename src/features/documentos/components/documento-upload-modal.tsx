'use client';

/**
 * Modal de Subida de Documento
 *
 * Permite subir documentos por archivo (MinIO) o link
 * Incluye validación de tipos y tamaño, dropzone, y flujo presigned URL
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  FileText,
  Link as LinkIcon,
  X,
  Trash2,
  FileSpreadsheet,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { useAuth } from '@/stores';
import { ROLES } from '@/lib/definitions';
import { toast } from '@/lib/hooks/use-toast';
import {
  requestUploadUrl,
  confirmUpload,
  createDocumento,
  updateDocumento,
} from '../services/documentos.service';
import type { Documento, DocumentoFase, CreateDocumentoInput, UpdateDocumentoInput } from '../types';

// Configuración de archivos permitidos
const ALLOWED_FILE_TYPES: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/zip': '.zip',
  'application/x-rar-compressed': '.rar',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const FASES: { key: DocumentoFase; label: string }[] = [
  { key: 'Analisis y Planificacion', label: '(1) Análisis y Planificación' },
  { key: 'Diseno', label: '(2) Diseño' },
  { key: 'Desarrollo', label: '(3) Desarrollo' },
  { key: 'Pruebas', label: '(4) Pruebas' },
  { key: 'Implementacion', label: '(5) Implementación' },
  { key: 'Mantenimiento', label: '(6) Mantenimiento' },
];

type DeliveryType = 'archivo' | 'link';

interface DocumentoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyectoId: number;
  defaultFase?: DocumentoFase;
  documento?: Documento | null; // Para edición
  onSuccess?: () => void;
}

interface FormData {
  nombre: string;
  descripcion: string;
  fase: DocumentoFase | '';
  tipoEntrega: DeliveryType;
  link: string;
  esObligatorio: boolean;
  file: File | null;
  archivoId: string | null;
}

interface FormErrors {
  nombre?: string;
  fase?: string;
  link?: string;
  file?: string;
  general?: string;
}

export function DocumentoUploadModal({
  isOpen,
  onClose,
  proyectoId,
  defaultFase,
  documento,
  onSuccess,
}: DocumentoUploadModalProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const isPmo = user?.role === ROLES.PMO;
  const canMarkObligatorio = isAdmin || isPmo; // ADMIN y PMO pueden marcar como obligatorio
  const isEditing = !!documento;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    descripcion: '',
    fase: defaultFase || '',
    tipoEntrega: 'archivo',
    link: '',
    esObligatorio: false,
    file: null,
    archivoId: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Resetear formulario cuando se abre/cierra o cambia el documento
  useEffect(() => {
    if (isOpen) {
      if (documento) {
        setFormData({
          nombre: documento.nombre,
          descripcion: documento.descripcion || '',
          fase: documento.fase,
          tipoEntrega: documento.link ? 'link' : 'archivo',
          link: documento.link || '',
          esObligatorio: documento.esObligatorio,
          file: null,
          archivoId: documento.archivoId || null,
        });
      } else {
        setFormData({
          nombre: '',
          descripcion: '',
          fase: defaultFase || '',
          tipoEntrega: 'archivo',
          link: '',
          esObligatorio: false,
          file: null,
          archivoId: null,
        });
      }
      setErrors({});
      setUploadProgress(0);
    }
  }, [isOpen, documento, defaultFase]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    if (!formData.fase) {
      newErrors.fase = 'La fase es obligatoria';
    }

    if (formData.tipoEntrega === 'link') {
      if (!formData.link.trim()) {
        newErrors.link = 'El enlace es obligatorio';
      } else {
        try {
          new URL(formData.link);
        } catch {
          newErrors.link = 'El enlace debe ser una URL válida';
        }
      }
    } else if (formData.tipoEntrega === 'archivo') {
      if (!formData.file && !formData.archivoId) {
        newErrors.file = 'Debe seleccionar un archivo';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileSelect = useCallback((file: File) => {
    // Validar tipo
    if (!ALLOWED_FILE_TYPES[file.type]) {
      setErrors(prev => ({ ...prev, file: 'Tipo de archivo no permitido' }));
      return;
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      setErrors(prev => ({ ...prev, file: 'El archivo excede el límite de 50MB' }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      file,
      archivoId: null, // Reset archivoId si se selecciona nuevo archivo
    }));
    setErrors(prev => ({ ...prev, file: undefined }));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const removeFile = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      file: null,
      archivoId: null,
    }));
  }, []);

  const uploadFileToMinIO = async (file: File): Promise<string> => {
    // 1. Solicitar URL presignada
    setUploadProgress(10);
    const uploadData = await requestUploadUrl(proyectoId, {
      nombre: file.name,
      mimeType: file.type,
      tamano: file.size,
    });

    // 2. Subir archivo a MinIO
    setUploadProgress(30);
    const response = await fetch(uploadData.uploadUrl, {
      method: 'PUT',
      headers: uploadData.requiredHeaders || {},
      body: file,
    });

    if (!response.ok) {
      throw new Error('Error al subir archivo a storage');
    }

    setUploadProgress(80);

    // 3. Confirmar subida
    await confirmUpload(uploadData.archivoId);
    setUploadProgress(100);

    return uploadData.archivoId;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsUploading(true);
    setErrors({});

    try {
      let archivoId = formData.archivoId;

      // Si hay archivo nuevo, subirlo a MinIO
      if (formData.file && formData.tipoEntrega === 'archivo') {
        archivoId = await uploadFileToMinIO(formData.file);
      }

      if (isEditing && documento) {
        // Actualizar documento existente
        const updateData: UpdateDocumentoInput = {
          nombre: formData.nombre,
          descripcion: formData.descripcion || undefined,
          fase: formData.fase as DocumentoFase,
          esObligatorio: canMarkObligatorio ? formData.esObligatorio : undefined,
        };

        if (formData.tipoEntrega === 'link') {
          updateData.link = formData.link;
        } else if (archivoId) {
          updateData.archivoId = archivoId;
        }

        await updateDocumento(documento.id, updateData);
        toast({
          title: 'Documento actualizado',
          description: 'El documento se ha actualizado correctamente.',
        });
      } else {
        // Crear nuevo documento
        const createData: CreateDocumentoInput = {
          proyectoId,
          fase: formData.fase as DocumentoFase,
          nombre: formData.nombre,
          descripcion: formData.descripcion || undefined,
          esObligatorio: canMarkObligatorio ? formData.esObligatorio : false,
        };

        if (formData.tipoEntrega === 'link') {
          createData.link = formData.link;
        } else if (archivoId) {
          createData.archivoId = archivoId;
          // Enviar el tipo MIME del archivo para la vista previa
          if (formData.file) {
            createData.tipoArchivo = formData.file.type;
          }
        }

        await createDocumento(createData);
        toast({
          title: 'Documento creado',
          description: 'El documento se ha creado correctamente.',
        });
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error al guardar documento:', error);
      setErrors({
        general: error instanceof Error ? error.message : 'Error al guardar el documento',
      });
      toast({
        title: 'Error',
        description: 'No se pudo guardar el documento. Intente nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getFileIcon = (fileType?: string) => {
    if (fileType?.includes('spreadsheet') || fileType?.includes('excel')) {
      return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    }
    return <FileText className="h-5 w-5 text-blue-600" />;
  };

  const acceptedExtensions = Object.values(ALLOWED_FILE_TYPES).join(',');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden" showCloseButton={false}>
        <DialogHeader className="p-4 bg-[#004272] text-white flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-bold">
            {isEditing ? 'Editar Documento' : 'Subir Documento'}
          </DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Error general */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              {errors.general}
            </div>
          )}

          {/* Nombre */}
          <div>
            <Label className="text-sm font-medium">
              Nombre del documento <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Ej: Acta de Constitución del Proyecto"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              className={cn("mt-1", errors.nombre && "border-red-500")}
              disabled={isUploading}
            />
            {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
          </div>

          {/* Descripción */}
          <div>
            <Label className="text-sm font-medium">Descripción</Label>
            <Textarea
              placeholder="Descripción opcional del documento..."
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              className="mt-1"
              rows={2}
              disabled={isUploading}
            />
          </div>

          {/* Fase */}
          <div>
            <Label className="text-sm font-medium">
              Fase <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.fase}
              onValueChange={(value) => setFormData(prev => ({ ...prev, fase: value as DocumentoFase }))}
              disabled={isUploading}
            >
              <SelectTrigger className={cn("mt-1", errors.fase && "border-red-500")}>
                <SelectValue placeholder="Seleccionar fase" />
              </SelectTrigger>
              <SelectContent>
                {FASES.map(fase => (
                  <SelectItem key={fase.key} value={fase.key}>{fase.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.fase && <p className="text-red-500 text-xs mt-1">{errors.fase}</p>}
          </div>

          {/* Tipo de entrega */}
          <div>
            <Label className="text-sm font-medium">Tipo de entrega</Label>
            <RadioGroup
              value={formData.tipoEntrega}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                tipoEntrega: value as DeliveryType,
                file: null,
                link: '',
                archivoId: null,
              }))}
              className="flex gap-4 mt-2"
              disabled={isUploading}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="archivo" id="archivo" />
                <Label htmlFor="archivo" className="flex items-center gap-1 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  Archivo
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="link" id="link" />
                <Label htmlFor="link" className="flex items-center gap-1 cursor-pointer">
                  <LinkIcon className="h-4 w-4" />
                  Enlace
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Archivo o Link según tipo seleccionado */}
          {formData.tipoEntrega === 'archivo' ? (
            <div>
              <Label className="text-sm font-medium">
                Archivo <span className="text-red-500">*</span>
              </Label>
              {!formData.file && !formData.archivoId ? (
                <div
                  className={cn(
                    "mt-1 border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                    isDragging ? "border-[#018CD1] bg-blue-50" : "border-gray-300",
                    errors.file && "border-red-300",
                    isUploading && "opacity-50 pointer-events-none"
                  )}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Arrastra tu archivo aquí o</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4" />
                    Seleccionar Archivo
                  </Button>
                  <p className="text-xs text-gray-400 mt-2">
                    PDF, Word, Excel, PowerPoint, ZIP, imágenes (máx. 50MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptedExtensions}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    disabled={isUploading}
                  />
                </div>
              ) : (
                <div className="mt-1 border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getFileIcon(formData.file?.type)}
                      <span className="text-sm text-blue-600 truncate">
                        {formData.file?.name || documento?.archivoNombre || 'Archivo existente'}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                      onClick={removeFile}
                      disabled={isUploading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              {errors.file && <p className="text-red-500 text-xs mt-1">{errors.file}</p>}
            </div>
          ) : (
            <div>
              <Label className="text-sm font-medium">
                Enlace <span className="text-red-500">*</span>
              </Label>
              <Input
                type="url"
                placeholder="https://..."
                value={formData.link}
                onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                className={cn("mt-1", errors.link && "border-red-500")}
                disabled={isUploading}
              />
              {errors.link && <p className="text-red-500 text-xs mt-1">{errors.link}</p>}
              <p className="text-xs text-gray-400 mt-1">Ingrese una URL válida</p>
            </div>
          )}

          {/* Obligatorio (solo ADMIN y PMO) */}
          {canMarkObligatorio && (
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="obligatorio"
                checked={formData.esObligatorio}
                onCheckedChange={(checked) => setFormData(prev => ({
                  ...prev,
                  esObligatorio: checked === true,
                }))}
                disabled={isUploading}
              />
              <Label
                htmlFor="obligatorio"
                className="text-sm font-medium cursor-pointer"
              >
                Marcar como documento obligatorio
              </Label>
            </div>
          )}

          {/* Barra de progreso durante upload */}
          {isUploading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subiendo archivo...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#018CD1] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t bg-gray-50 flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#018CD1] hover:bg-[#018CD1]/90 text-white"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              isEditing ? 'Actualizar' : 'Guardar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
