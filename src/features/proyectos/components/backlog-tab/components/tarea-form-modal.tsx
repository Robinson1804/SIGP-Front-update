'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Send, Upload, Info, X, FileText, Image, Trash2, Download, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  type Tarea,
  type TareaEstado,
  type TareaPrioridad,
  type TareaComentario,
  type TareaEvidencia,
  type TareaHistorial,
  createTarea,
  updateTarea,
  cambiarEstadoTarea,
  getTareaComentarios,
  getTareasByHistoria,
  agregarComentario,
  getTareaEvidencias,
  agregarEvidencia,
  eliminarEvidencia,
  getTareaHistorial,
} from '@/features/proyectos/services/tareas.service';
import {
  uploadFileDirect,
  getArchivoDownloadUrl,
  downloadArchivoAsBlob,
  extractArchivoIdFromUrl,
} from '@/lib/api/storage.service';
import { getHistoriaById, type HistoriaUsuario } from '@/features/proyectos/services/historias.service';
import { apiClient, ENDPOINTS, get } from '@/lib/api';
import { useCurrentUser } from '@/stores/auth.store';

interface MiembroEquipo {
  id: number;        // usuarioId - para usar en dropdown y enviar al backend
  personalId: number; // personalId - para referencia
  nombre: string;
}

const tareaSchema = z.object({
  nombre: z.string().min(1, 'El nombre de la tarea es requerido').max(200, 'Máximo 200 caracteres'),
  descripcion: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
  estado: z.enum(['Por hacer', 'En progreso', 'Finalizado']),
  prioridad: z.enum(['Alta', 'Media', 'Baja']).optional(),
  responsableIds: z.array(z.number()).optional(),
  fechaInicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fechaFin: z.string().min(1, 'La fecha de fin es requerida'),
});

type TareaFormValues = z.infer<typeof tareaSchema>;

// Helper para parsear fecha sin timezone issues
function formatDateForDisplay(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  // Tomar solo la parte de la fecha (YYYY-MM-DD)
  const datePart = dateStr.split('T')[0];
  const [year, month, day] = datePart.split('-');
  return `${day}/${month}/${year}`;
}

function getDateInputValue(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return dateStr.split('T')[0];
}

interface TareaFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  historiaUsuarioId: number;
  tarea?: Tarea | null;
  onSuccess: () => void;
}

const estadoOptions: { value: TareaEstado; label: string }[] = [
  { value: 'Por hacer', label: 'Por hacer' },
  { value: 'En progreso', label: 'En progreso' },
  { value: 'Finalizado', label: 'Finalizado' },
];

const prioridadOptions: { value: TareaPrioridad; label: string }[] = [
  { value: 'Alta', label: 'Alta' },
  { value: 'Media', label: 'Media' },
  { value: 'Baja', label: 'Baja' },
];

export function TareaFormModal({
  open,
  onOpenChange,
  historiaUsuarioId,
  tarea,
  onSuccess,
}: TareaFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('comentarios');
  const [historia, setHistoria] = useState<HistoriaUsuario | null>(null);
  const [equipo, setEquipo] = useState<MiembroEquipo[]>([]);
  const [isLoadingEquipo, setIsLoadingEquipo] = useState(false);
  const [comentarios, setComentarios] = useState<TareaComentario[]>([]);
  const [isLoadingComentarios, setIsLoadingComentarios] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [isSendingComentario, setIsSendingComentario] = useState(false);
  const [archivosAdjuntos, setArchivosAdjuntos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [codigoTarea, setCodigoTarea] = useState<string>('');
  const [isGeneratingCodigo, setIsGeneratingCodigo] = useState(false);
  const [evidenciasExistentes, setEvidenciasExistentes] = useState<TareaEvidencia[]>([]);
  const [isLoadingEvidencias, setIsLoadingEvidencias] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [historial, setHistorial] = useState<TareaHistorial[]>([]);
  const [isLoadingHistorial, setIsLoadingHistorial] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const isEditing = !!tarea;

  // Obtener usuario actual para el campo Informador
  const currentUser = useCurrentUser();
  const informadorNombre = currentUser?.name || 'Usuario';
  const isDeveloper = currentUser?.role === 'DESARROLLADOR';

  const form = useForm<TareaFormValues>({
    resolver: zodResolver(tareaSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      estado: 'Por hacer',
      prioridad: undefined,
      responsableIds: [],
      fechaInicio: '',
      fechaFin: '',
    },
  });

  // Calcular rango de fechas de la HU para los inputs
  const huFechaInicio = getDateInputValue(historia?.fechaInicio);
  const huFechaFin = getDateInputValue(historia?.fechaFin);

  // Generar próximo código de tarea (TAR-001, TAR-002, etc.)
  const generarProximoCodigo = async (huId: number): Promise<string> => {
    try {
      const tareasExistentes = await getTareasByHistoria(huId);
      // Extraer números de los códigos existentes (TAR-001 → 1)
      const numeros = tareasExistentes
        .map((t) => {
          const match = t.codigo?.match(/TAR-(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n) => !isNaN(n));

      const maxNumero = numeros.length > 0 ? Math.max(...numeros) : 0;
      const nuevoNumero = maxNumero + 1;
      return `TAR-${String(nuevoNumero).padStart(3, '0')}`;
    } catch {
      // Si hay error, generar código basado en timestamp para evitar duplicados
      return `TAR-${String(Date.now() % 1000).padStart(3, '0')}`;
    }
  };

  // Cargar datos de la historia y responsables asignados a ella
  useEffect(() => {
    if (open && historiaUsuarioId) {
      setIsLoadingEquipo(true);

      // Si es edición, usar el código existente; si es nuevo, generar código
      if (tarea?.codigo) {
        setCodigoTarea(tarea.codigo);
      } else {
        setIsGeneratingCodigo(true);
        generarProximoCodigo(historiaUsuarioId)
          .then(setCodigoTarea)
          .finally(() => setIsGeneratingCodigo(false));
      }

      getHistoriaById(historiaUsuarioId)
        .then(async (historiaData) => {
          setHistoria(historiaData);

          // Obtener los IDs de responsables asignados a la HU
          const asignadoAIds = (historiaData.asignadoA || [])
            .map((id: string | number) => typeof id === 'string' ? parseInt(id, 10) : id)
            .filter((id: number) => !isNaN(id));

          // Solo cargar datos del equipo si hay responsables asignados a la HU
          const contenedorId = historiaData.subproyectoId || historiaData.proyectoId;
          const asignacionesEndpoint = historiaData.subproyectoId
            ? ENDPOINTS.RRHH.ASIGNACIONES_SUBPROYECTO(historiaData.subproyectoId)
            : ENDPOINTS.RRHH.ASIGNACIONES_PROYECTO(historiaData.proyectoId);

          if (contenedorId && asignadoAIds.length > 0) {
            try {
              const asignacionesResponse = await apiClient.get(asignacionesEndpoint);
              const asignaciones = asignacionesResponse.data || [];

              // Filtrar solo los miembros que están asignados a la HU
              // IMPORTANTE: asignadoAIds contiene personalIds (NO usuarioIds)
              // El campo asignadoA de la HU guarda personalId según historia-form-modal.tsx
              console.log('[TareaFormModal] asignadoAIds de la HU (personalIds):', asignadoAIds);

              const equipoMapeado: MiembroEquipo[] = asignaciones
                .map((asignacion: {
                  id: number;
                  personalId: number;
                  personal?: {
                    id: number;
                    nombres?: string;
                    apellidos?: string;
                    usuarioId?: number;
                  };
                }) => {
                  const personalId = asignacion.personalId || asignacion.personal?.id;
                  if (!personalId) return null;

                  // Solo incluir si el personalId está en los asignadoA de la HU
                  // asignadoA de HU contiene personalIds (según historia-form-modal.tsx)
                  if (!asignadoAIds.includes(personalId)) {
                    console.log(`[TareaFormModal] Personal ${personalId} no está en asignadoA de HU`);
                    return null;
                  }

                  // IMPORTANTE: Usar usuarioId como ID para el dropdown
                  // El backend de TAREAS espera usuario_id en tarea.asignadoA
                  const usuarioId = asignacion.personal?.usuarioId;
                  if (!usuarioId) {
                    console.warn(`Personal ${personalId} no tiene usuarioId asociado`);
                    return null;
                  }

                  const nombres = asignacion.personal?.nombres || '';
                  const apellidos = asignacion.personal?.apellidos || '';
                  const nombre = `${nombres} ${apellidos}`.trim() || `Personal #${personalId}`;

                  console.log(`[TareaFormModal] Agregando al equipo: personalId=${personalId}, usuarioId=${usuarioId}, nombre=${nombre}`);

                  // id = usuarioId para que el dropdown envíe el valor correcto al backend de tareas
                  return { id: usuarioId, personalId, nombre };
                })
                .filter((m: MiembroEquipo | null): m is MiembroEquipo => m !== null);

              // Si estamos editando y hay un asignado que no está en el equipo, agregarlo
              if (tarea) {
                const asignadoId = tarea.asignadoA ?? tarea.responsableId;
                const miembroEncontrado = equipoMapeado.find(m => m.id === asignadoId);

                // Debug
                console.log('[TareaFormModal] Equipo cargado:', equipoMapeado.map(m => ({ id: m.id, personalId: m.personalId, nombre: m.nombre })));
                console.log('[TareaFormModal] Tarea asignadoA (usuarioId):', tarea.asignadoA);
                console.log('[TareaFormModal] Tarea asignado objeto:', tarea.asignado);

                if (!miembroEncontrado && asignadoId) {
                  // El asignado no está en el equipo - intentar obtener sus datos
                  if (tarea.asignado) {
                    // Tenemos los datos del asignado
                    const nombreAsignado = `${tarea.asignado.nombre || ''} ${tarea.asignado.apellido || ''}`.trim();
                    console.log('[TareaFormModal] Agregando asignado actual al equipo:', { id: asignadoId, nombre: nombreAsignado });
                    equipoMapeado.push({
                      id: asignadoId,
                      personalId: 0,
                      nombre: nombreAsignado || `Usuario #${asignadoId}`,
                    });
                  } else {
                    // No tenemos los datos del asignado - obtenerlos del API
                    try {
                      console.log('[TareaFormModal] Obteniendo datos del usuario:', asignadoId);
                      // Usar get() que desenvuelve la respuesta correctamente
                      const usuario = await get<{ id: number; nombre?: string; apellido?: string }>(
                        ENDPOINTS.USUARIOS.BY_ID(asignadoId)
                      );
                      console.log('[TareaFormModal] Usuario obtenido del API:', usuario);
                      if (usuario) {
                        const nombreUsuario = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();
                        console.log('[TareaFormModal] Nombre completo:', nombreUsuario);
                        equipoMapeado.push({
                          id: asignadoId,
                          personalId: 0,
                          nombre: nombreUsuario || `Usuario #${asignadoId}`,
                        });
                      }
                    } catch (err) {
                      console.warn('[TareaFormModal] No se pudo obtener el usuario:', asignadoId, err);
                      // Agregar con ID como fallback
                      equipoMapeado.push({
                        id: asignadoId,
                        personalId: 0,
                        nombre: `Usuario #${asignadoId}`,
                      });
                    }
                  }
                } else if (miembroEncontrado) {
                  console.log('[TareaFormModal] ✓ Miembro encontrado:', miembroEncontrado.nombre);
                }
              }
              setEquipo(equipoMapeado);
            } catch (err) {
              console.error('Error loading equipo:', err);
            }
          } else {
            // No hay equipo asignado a la HU, pero si estamos editando y hay un asignado, mostrarlo
            if (tarea) {
              const asignadoId = tarea.asignadoA ?? tarea.responsableId;
              if (asignadoId) {
                if (tarea.asignado) {
                  const nombreAsignado = `${tarea.asignado.nombre || ''} ${tarea.asignado.apellido || ''}`.trim();
                  console.log('[TareaFormModal] Equipo vacío, pero hay asignado:', { id: asignadoId, nombre: nombreAsignado });
                  setEquipo([{
                    id: asignadoId,
                    personalId: 0,
                    nombre: nombreAsignado || `Usuario #${asignadoId}`,
                  }]);
                } else {
                  // Obtener datos del usuario del API
                  try {
                    console.log('[TareaFormModal] Equipo vacío, obteniendo usuario:', asignadoId);
                    // Usar get() que desenvuelve la respuesta correctamente
                    const usuario = await get<{ id: number; nombre?: string; apellido?: string }>(
                      ENDPOINTS.USUARIOS.BY_ID(asignadoId)
                    );
                    console.log('[TareaFormModal] Usuario obtenido del API (equipo vacío):', usuario);
                    if (usuario) {
                      const nombreUsuario = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();
                      console.log('[TareaFormModal] Nombre completo:', nombreUsuario);
                      setEquipo([{
                        id: asignadoId,
                        personalId: 0,
                        nombre: nombreUsuario || `Usuario #${asignadoId}`,
                      }]);
                    } else {
                      setEquipo([]);
                    }
                  } catch (err) {
                    console.warn('[TareaFormModal] No se pudo obtener el usuario:', asignadoId, err);
                    setEquipo([{
                      id: asignadoId,
                      personalId: 0,
                      nombre: `Usuario #${asignadoId}`,
                    }]);
                  }
                }
              } else {
                setEquipo([]);
              }
            } else {
              setEquipo([]);
            }
          }
        })
        .catch((err) => console.error('Error loading historia:', err))
        .finally(() => setIsLoadingEquipo(false));
    }
  }, [open, historiaUsuarioId, tarea?.codigo]);

  // Cargar comentarios si es edición
  useEffect(() => {
    if (open && tarea?.id) {
      setIsLoadingComentarios(true);
      getTareaComentarios(tarea.id)
        .then(setComentarios)
        .catch((err) => console.error('Error loading comentarios:', err))
        .finally(() => setIsLoadingComentarios(false));
    }
  }, [open, tarea?.id]);

  // Cargar evidencias existentes si es edición
  useEffect(() => {
    if (open && tarea?.id) {
      setIsLoadingEvidencias(true);
      getTareaEvidencias(tarea.id)
        .then(setEvidenciasExistentes)
        .catch((err) => console.error('Error loading evidencias:', err))
        .finally(() => setIsLoadingEvidencias(false));
    } else {
      setEvidenciasExistentes([]);
    }
  }, [open, tarea?.id]);

  // Cargar historial si es edición
  useEffect(() => {
    if (open && tarea?.id) {
      setIsLoadingHistorial(true);
      getTareaHistorial(tarea.id)
        .then(setHistorial)
        .catch((err) => console.error('Error loading historial:', err))
        .finally(() => setIsLoadingHistorial(false));
    } else {
      setHistorial([]);
    }
  }, [open, tarea?.id]);

  // Reset form cuando se abre el modal
  useEffect(() => {
    if (open) {
      if (tarea) {
        // Backend retorna asignadoA como usuarioId - el dropdown también usa usuarioId como valor
        const responsableUsuarioId = tarea.asignadoA ?? tarea.responsableId ?? null;
        form.reset({
          nombre: tarea.nombre,
          descripcion: tarea.descripcion || '',
          estado: tarea.estado,
          prioridad: tarea.prioridad,
          responsableIds: responsableUsuarioId ? [responsableUsuarioId] : [],
          fechaInicio: tarea.fechaInicio?.split('T')[0] || '',
          fechaFin: tarea.fechaFin?.split('T')[0] || '',
        });
      } else {
        // For developers, auto-assign themselves when creating
        const autoResponsables = isDeveloper && currentUser?.id
          ? [parseInt(currentUser.id, 10)]
          : [];

        form.reset({
          nombre: '',
          descripcion: '',
          estado: 'Por hacer',
          prioridad: undefined,
          responsableIds: autoResponsables,
          fechaInicio: '',
          fechaFin: '',
        });
      }
      setActiveTab('comentarios');
      setComentarios([]);
      setNuevoComentario('');
      setArchivosAdjuntos([]);
      setHistorial([]);
      // Reset codigo solo si no es edición (se regenera en useEffect)
      if (!tarea) {
        setCodigoTarea('');
      }
    }
  }, [open, tarea, form]);

  // Actualizar responsableIds cuando equipo termine de cargar (al editar)
  // Esto es necesario porque el form se resetea antes de que el equipo cargue
  useEffect(() => {
    if (open && tarea && equipo.length > 0 && !isLoadingEquipo) {
      const responsableUsuarioId = tarea.asignadoA ?? tarea.responsableId ?? null;
      console.log('[TareaFormModal] Sync useEffect - responsableUsuarioId:', responsableUsuarioId, 'equipo ids:', equipo.map(m => m.id));
      if (responsableUsuarioId) {
        // Verificar si el usuarioId existe en el equipo
        const existeEnEquipo = equipo.some(m => m.id === responsableUsuarioId);
        if (existeEnEquipo) {
          // Siempre establecer el valor cuando equipo carga para asegurar que el MultiSelect lo muestre
          console.log('[TareaFormModal] Estableciendo responsableIds:', [responsableUsuarioId]);
          form.setValue('responsableIds', [responsableUsuarioId], { shouldValidate: true });
        } else {
          console.warn(`Usuario ${responsableUsuarioId} asignado a tarea no encontrado en equipo del proyecto`);
        }
      }
    }
  }, [open, tarea, equipo, isLoadingEquipo, form]);

  // Manejar selección de archivos
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 5;

    const newFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Verificar tipo de archivo
      if (!allowedTypes.includes(file.type)) {
        alert(`El archivo "${file.name}" no es válido. Solo se permiten imágenes PNG y JPG.`);
        continue;
      }

      // Verificar tamaño
      if (file.size > maxSize) {
        alert(`El archivo "${file.name}" excede el tamaño máximo de 10MB.`);
        continue;
      }

      newFiles.push(file);
    }

    // Verificar límite de archivos
    const totalFiles = archivosAdjuntos.length + newFiles.length;
    if (totalFiles > maxFiles) {
      alert(`Solo se pueden adjuntar máximo ${maxFiles} archivos.`);
      return;
    }

    setArchivosAdjuntos((prev) => [...prev, ...newFiles]);

    // Limpiar input para permitir seleccionar el mismo archivo nuevamente
    event.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setArchivosAdjuntos((prev) => prev.filter((_, i) => i !== index));
  };

  // Simplificar tipo MIME para cumplir con límite de 50 chars del backend
  const simplifyMimeType = (mimeType: string): string => {
    // Mapeo de tipos comunes a nombres cortos
    const mimeMap: Record<string, string> = {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.ms-excel': 'xls',
      'application/pdf': 'pdf',
      'image/jpeg': 'image/jpeg',
      'image/png': 'image/png',
      'image/gif': 'image/gif',
    };
    return mimeMap[mimeType] || mimeType.substring(0, 50);
  };

  // Subir archivos como evidencias a MinIO y registrarlos
  const uploadEvidencias = async (tareaId: number) => {
    if (archivosAdjuntos.length === 0) return;

    setIsUploadingFiles(true);
    setUploadProgress(0);
    const totalFiles = archivosAdjuntos.length;

    try {
      for (let i = 0; i < totalFiles; i++) {
        const file = archivosAdjuntos[i];
        setUploadProgress(Math.round((i / totalFiles) * 100));

        // 1. Subir archivo al backend (upload directo, evita presigned URL)
        const archivo = await uploadFileDirect(
          file,
          'TAREA',
          tareaId,
          'evidencia'
        );

        // 2. Crear registro de evidencia en la tarea
        await agregarEvidencia(tareaId, {
          nombre: file.name,
          url: getArchivoDownloadUrl(archivo.id),
          tipo: simplifyMimeType(file.type || 'unknown'),
          tamanoBytes: file.size,
        });
      }

      setUploadProgress(100);
      setArchivosAdjuntos([]);
    } catch (error) {
      console.error('Error subiendo evidencias:', error);
      throw error;
    } finally {
      setIsUploadingFiles(false);
    }
  };

  // Eliminar una evidencia existente
  const handleDeleteEvidencia = async (evidenciaId: number) => {
    if (!tarea?.id) return;
    try {
      await eliminarEvidencia(tarea.id, evidenciaId);
      setEvidenciasExistentes((prev) => prev.filter((e) => e.id !== evidenciaId));
    } catch (error) {
      console.error('Error eliminando evidencia:', error);
    }
  };

  // Descargar evidencia con autenticación
  const handleDownloadEvidencia = async (url: string, nombre: string) => {
    try {
      const archivoId = extractArchivoIdFromUrl(url);
      if (!archivoId) {
        console.error('No se pudo extraer el ID del archivo de la URL:', url);
        return;
      }
      const blobUrl = await downloadArchivoAsBlob(archivoId);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = nombre;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error descargando evidencia:', error);
    }
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Obtener icono según tipo de archivo para evidencias existentes
  const getEvidenciaIcon = (tipo: string | null) => {
    if (tipo?.startsWith('image/') || tipo === 'image/jpeg' || tipo === 'image/png' || tipo === 'image/gif') {
      return <Image className="h-4 w-4 text-blue-500" />;
    }
    return <FileText className="h-4 w-4 text-blue-500" />;
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4 text-blue-500" />;
    }
    return <FileText className="h-4 w-4 text-blue-500" />;
  };

  const onSubmit = async (values: TareaFormValues) => {
    try {
      setIsSubmitting(true);

      // Backend usa asignadoA (usuario_id)
      // El form almacena usuarioIds directamente (el dropdown usa id = usuarioId)
      const asignadoA = values.responsableIds && values.responsableIds.length > 0
        ? values.responsableIds[0]
        : null;

      let tareaId: number;

      if (isEditing && tarea) {
        // Actualizar solo los campos que realmente cambiaron
        // Esto evita registrar cambios falsos en el historial
        const updateData: Record<string, any> = {};

        // Comparar y solo incluir campos que cambiaron
        if (values.nombre !== tarea.nombre) {
          updateData.nombre = values.nombre;
        }
        if ((values.descripcion || '') !== (tarea.descripcion || '')) {
          updateData.descripcion = values.descripcion || undefined;
        }
        if (values.prioridad !== tarea.prioridad) {
          updateData.prioridad = values.prioridad;
        }

        // Comparar asignadoA (el valor actual vs el valor original)
        const asignadoActual = tarea.asignadoA ?? tarea.responsableId ?? null;
        console.log('[TareaFormModal] onSubmit - asignadoA nuevo:', asignadoA, typeof asignadoA);
        console.log('[TareaFormModal] onSubmit - asignadoActual (tarea.asignadoA):', asignadoActual, typeof asignadoActual);
        console.log('[TareaFormModal] onSubmit - tarea.asignadoA:', tarea.asignadoA, 'tarea.responsableId:', tarea.responsableId);
        if (asignadoA !== asignadoActual) {
          console.log('[TareaFormModal] onSubmit - CAMBIO DETECTADO, agregando asignadoA a updateData');
          updateData.asignadoA = asignadoA;
        } else {
          console.log('[TareaFormModal] onSubmit - SIN CAMBIO en asignadoA');
        }

        // Comparar fechas (normalizar formato para comparación)
        const fechaInicioOriginal = tarea.fechaInicio?.split('T')[0] || '';
        const fechaFinOriginal = tarea.fechaFin?.split('T')[0] || '';
        if (values.fechaInicio !== fechaInicioOriginal) {
          updateData.fechaInicio = values.fechaInicio || undefined;
        }
        if (values.fechaFin !== fechaFinOriginal) {
          updateData.fechaFin = values.fechaFin || undefined;
        }

        // Solo llamar update si hay cambios
        console.log('[TareaFormModal] onSubmit - updateData final:', updateData);
        if (Object.keys(updateData).length > 0) {
          console.log('[TareaFormModal] onSubmit - Enviando actualización...');
          await updateTarea(tarea.id, updateData);
          console.log('[TareaFormModal] onSubmit - Actualización completada');
        } else {
          console.log('[TareaFormModal] onSubmit - No hay cambios para enviar');
        }
        tareaId = tarea.id;

        // Si el estado cambió, usar el endpoint específico para cambiar estado
        if (values.estado !== tarea.estado) {
          await cambiarEstadoTarea(tarea.id, values.estado);
        }
      } else {
        // Para crear, NO enviamos estado (backend lo pone por defecto como 'Por hacer')
        const createData = {
          codigo: codigoTarea,  // Código generado (TAR-001)
          nombre: values.nombre,
          descripcion: values.descripcion || undefined,
          prioridad: values.prioridad,
          asignadoA,
          fechaInicio: values.fechaInicio || undefined,
          fechaFin: values.fechaFin || undefined,
          historiaUsuarioId,
        };
        const nuevaTarea = await createTarea(createData);
        tareaId = nuevaTarea.id;
      }

      // Subir evidencias si hay archivos seleccionados
      if (archivosAdjuntos.length > 0) {
        await uploadEvidencias(tareaId);

        // Cambiar estado a Finalizado después de subir evidencias
        // (solo si no estaba ya en Finalizado)
        if (values.estado !== 'Finalizado') {
          await cambiarEstadoTarea(tareaId, 'Finalizado');
        }
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error al guardar tarea:', error);
      console.log('Error response data:', error?.response?.data);
      console.log('Error response data.error:', error?.response?.data?.error);

      // Extract error message from backend response or generic error
      let errorMsg = 'Error al guardar la tarea';
      const data = error?.response?.data;

      // Get message from data.error.message or data.message
      let backendMsg = '';
      if (data?.error?.message) {
        backendMsg = String(data.error.message);
      } else if (typeof data?.error === 'string') {
        backendMsg = data.error;
      } else if (data?.message) {
        backendMsg = typeof data.message === 'string' ? data.message : String(data.message?.message || '');
      } else if (error?.message && !error?.response) {
        // Non-axios error (e.g., network error, fetch failure)
        backendMsg = error.message;
      }

      // Check if error is specifically about requiring evidence for SCRUM task
      if (backendMsg && backendMsg.includes('Se requiere al menos una evidencia')) {
        errorMsg = 'Se requiere al menos una evidencia para finalizar una tarea SCRUM.';
      } else if (backendMsg) {
        errorMsg = backendMsg;
      }

      setErrorMessage(errorMsg);
      setIsErrorModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnviarComentario = async () => {
    if (!nuevoComentario.trim() || !tarea?.id) return;

    try {
      setIsSendingComentario(true);
      const comentario = await agregarComentario(tarea.id, nuevoComentario);
      setComentarios((prev) => [...prev, comentario]);
      setNuevoComentario('');
    } catch (error) {
      console.error('Error al enviar comentario:', error);
    } finally {
      setIsSendingComentario(false);
    }
  };

  return (<>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="bg-[#0a4a6e] text-white px-6 py-4">
          <DialogTitle className="text-lg font-semibold flex items-center gap-3">
            <span>{isEditing ? 'Editar Tarea' : 'Agregar Tarea'}</span>
            {/* Mostrar código de la tarea */}
            {codigoTarea && (
              <span className="bg-white/20 text-white px-2 py-0.5 rounded text-sm font-mono">
                {codigoTarea}
              </span>
            )}
            {isGeneratingCodigo && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-hidden">
            <div className="grid grid-cols-2 gap-6 p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Columna Izquierda */}
              <div className="space-y-4">
                {/* Nombre de la tarea */}
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Nombre de la tarea <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ej: Crear formulario digital..."
                          className="border-dashed border-2 border-[#018CD1]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Descripción */}
                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Descripción <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="ej: Implementar validaciones..."
                          className="resize-none border-dashed border-2 border-[#018CD1] min-h-[80px]"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Label Actividad y Tabs: Comentarios, Historial */}
                <div className="pt-2">
                  {/* Actividad como label (no es un tab) */}
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-700">Actividad</span>
                  </div>

                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 h-9">
                      <TabsTrigger
                        value="comentarios"
                        className="text-xs data-[state=active]:bg-[#018CD1] data-[state=active]:text-white"
                      >
                        Comentarios
                      </TabsTrigger>
                      <TabsTrigger
                        value="historial"
                        className="text-xs data-[state=active]:bg-[#018CD1] data-[state=active]:text-white"
                      >
                        Historial
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="comentarios" className="mt-3">
                      {/* Lista de comentarios */}
                      {isLoadingComentarios ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        </div>
                      ) : comentarios.length > 0 ? (
                        <div className="space-y-2 max-h-[100px] overflow-y-auto mb-3">
                          {comentarios.map((c) => (
                            <div key={c.id} className="text-xs p-2 bg-gray-50 rounded">
                              <span className="font-medium">{c.usuario?.nombre || 'Usuario'}: </span>
                              {c.texto}
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {/* Input de comentario */}
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Escribe un comentario..."
                          className="resize-none border-dashed border-2 border-[#018CD1] min-h-[60px]"
                          rows={2}
                          value={nuevoComentario}
                          onChange={(e) => setNuevoComentario(e.target.value)}
                          disabled={!isEditing || isSendingComentario}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleEnviarComentario}
                          disabled={!isEditing || !nuevoComentario.trim() || isSendingComentario}
                          className="bg-[#018CD1] hover:bg-[#0179b5] text-white"
                        >
                          {isSendingComentario ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Send className="h-4 w-4 mr-1" />
                          )}
                          Enviar
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="historial" className="mt-3">
                      {isLoadingHistorial ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        </div>
                      ) : historial.length > 0 ? (
                        <div className="space-y-2 max-h-[150px] overflow-y-auto">
                          {historial.map((item) => (
                            <div key={item.id} className="text-xs p-2 bg-gray-50 rounded border-l-2 border-blue-400">
                              <div className="flex justify-between items-start">
                                <span className="font-medium text-gray-700">
                                  {item.usuario?.nombre || 'Usuario'}
                                </span>
                                <span className="text-gray-400">
                                  {new Date(item.createdAt).toLocaleDateString('es-PE', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <div className="mt-1 text-gray-600">
                                <span className="font-medium">{item.accion}</span>
                                {item.campoModificado && (
                                  <span className="text-gray-500">
                                    {' - '}{item.campoModificado}
                                    {item.valorAnterior && item.valorNuevo && (
                                      <>: <span className="line-through text-red-500">{item.valorAnterior}</span> → <span className="text-green-600">{item.valorNuevo}</span></>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          Sin historial disponible
                        </p>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              {/* Columna Derecha */}
              <div className="space-y-4">
                {/* Principal (Historia) */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Principal
                  </label>
                  <div className="border-dashed border-2 border-[#018CD1] rounded-md px-3 py-2 bg-gray-50">
                    <div className="text-sm font-medium text-gray-800">
                      {historia?.codigo || 'HU-X'}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {historia?.titulo || 'Cargando...'}
                    </div>
                  </div>
                  {/* Info de rango de fechas de la HU */}
                  {historia?.fechaInicio && historia?.fechaFin && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                      <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <span>
                        Las fechas de la tarea deben estar dentro del rango de la HU:
                        <strong className="ml-1">
                          {formatDateForDisplay(historia.fechaInicio)} - {formatDateForDisplay(historia.fechaFin)}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Responsables (MultiSelect) */}
                <FormField
                  control={form.control}
                  name="responsableIds"
                  render={({ field }) => {
                    const options = equipo.map((miembro) => ({
                      value: miembro.id.toString(),
                      label: miembro.nombre,
                    }));

                    const fieldValues = Array.isArray(field.value) ? field.value : [];
                    const selectedStrings = fieldValues
                      .filter((id): id is number => typeof id === 'number' && !isNaN(id))
                      .map((id) => id.toString());

                    // Debug: verificar valores del MultiSelect
                    if (tarea && !isLoadingEquipo) {
                      console.log('[TareaFormModal] MultiSelect render - options:', options.length, 'selected:', selectedStrings);
                    }

                    return (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Responsables
                        </FormLabel>
                        <FormControl>
                          <MultiSelect
                            options={options}
                            selected={selectedStrings}
                            onChange={(newSelected) => {
                              const numericIds = newSelected
                                .map((s) => parseInt(s, 10))
                                .filter((id) => !isNaN(id));
                              field.onChange(numericIds);
                            }}
                            placeholder={isLoadingEquipo ? "Cargando equipo..." : "Seleccionar responsables"}
                            disabled={isDeveloper}
                          />
                        </FormControl>
                        {isDeveloper && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Como Desarrollador, solo puedes asignarte a ti mismo
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* Estado y Prioridad */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Estado <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="border-dashed border-2 border-[#018CD1]">
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {estadoOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="prioridad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Prioridad
                        </FormLabel>
                        <Select
                          value={field.value || ''}
                          onValueChange={(value) => field.onChange(value || undefined)}
                        >
                          <FormControl>
                            <SelectTrigger className="border-dashed border-2 border-[#018CD1]">
                              <SelectValue placeholder="Seleccionar prioridad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {prioridadOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Fecha Inicio y Fecha Fin */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="fechaInicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Fecha Inicio <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="border-dashed border-2 border-[#018CD1]"
                            min={huFechaInicio || undefined}
                            max={huFechaFin || undefined}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fechaFin"
                    render={({ field }) => {
                      const fechaInicioValue = form.watch('fechaInicio');
                      return (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Fecha Fin <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              className="border-dashed border-2 border-[#018CD1]"
                              min={fechaInicioValue || huFechaInicio || undefined}
                              max={huFechaFin || undefined}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                {/* Informador (Creador de la tarea - solo lectura) */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Informador
                  </label>
                  <div className="border-dashed border-2 border-[#018CD1] rounded-md px-3 py-2 bg-gray-100 text-sm text-gray-700">
                    {informadorNombre}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    El creador de la tarea (usted)
                  </p>
                </div>

                {/* Adjuntar */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Adjuntar
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Imágenes .png o .jpg (máx. 10MB, máx. 5 archivos)
                  </p>

                  {/* Evidencias existentes (solo al editar) */}
                  {isEditing && (
                    <div className="mb-3">
                      {isLoadingEvidencias ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Cargando evidencias...</span>
                        </div>
                      ) : evidenciasExistentes.length > 0 ? (
                        <div className="space-y-2">
                          <span className="text-xs font-medium text-gray-600">
                            Evidencias adjuntadas ({evidenciasExistentes.length})
                          </span>
                          {evidenciasExistentes.map((ev) => (
                            <div
                              key={ev.id}
                              className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200 text-sm"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {getEvidenciaIcon(ev.tipo)}
                                <button
                                  type="button"
                                  onClick={() => handleDownloadEvidencia(ev.url, ev.nombre)}
                                  className="text-blue-600 hover:underline truncate text-left"
                                >
                                  {ev.nombre}
                                </button>
                                <span className="text-xs text-gray-400">
                                  {formatFileSize(ev.tamanoBytes)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDownloadEvidencia(ev.url, ev.nombre)}
                                  className="p-1 text-gray-400 hover:text-blue-500"
                                  title="Descargar"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-gray-400 hover:text-red-500"
                                  onClick={() => handleDeleteEvidencia(ev.id)}
                                  title="Eliminar"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Indicador de subida en progreso */}
                  {isUploadingFiles && (
                    <div className="mb-3 p-3 bg-blue-50 rounded border border-blue-200">
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Subiendo archivos... {uploadProgress}%</span>
                      </div>
                      <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Lista de archivos por adjuntar (nuevos) */}
                  {archivosAdjuntos.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {archivosAdjuntos.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded border text-sm"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {getFileIcon(file)}
                            <span className="truncate">{file.name}</span>
                            <span className="text-xs text-gray-400">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-400 hover:text-red-500"
                            onClick={() => handleRemoveFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Input para seleccionar archivos */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    accept=".png,.jpg,.jpeg"
                    multiple
                    disabled={archivosAdjuntos.length >= 5}
                    onChange={handleFileSelect}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed border-2 border-[#018CD1] h-auto p-4 bg-gray-50 hover:bg-gray-100"
                    disabled={archivosAdjuntos.length >= 5}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    <div className="flex flex-col items-center w-full">
                      <Upload className="h-5 w-5 mb-1 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {archivosAdjuntos.length >= 5
                          ? 'Límite de archivos alcanzado'
                          : 'Seleccionar archivos'}
                      </span>
                    </div>
                  </Button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <DialogFooter className="border-t px-6 py-4 bg-gray-50">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting || isUploadingFiles}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isUploadingFiles}
                className="bg-[#018CD1] hover:bg-[#0179b5] text-white"
              >
                {(isSubmitting || isUploadingFiles) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isUploadingFiles ? 'Subiendo archivos...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    {/* Modal de error */}
    <AlertDialog open={isErrorModalOpen} onOpenChange={setIsErrorModalOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            No se puede realizar la acción
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-700">
            {errorMessage}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={() => setIsErrorModalOpen(false)}
            className="bg-[#018CD1] hover:bg-[#0179b5]"
          >
            Entendido
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
