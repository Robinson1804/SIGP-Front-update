'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  Send,
  Upload,
  X,
  MessageSquare,
  FileText,
  User,
  Calendar,
  Clock,
  Link as LinkIcon,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Circle,
  Eye,
  Download,
  Image as ImageIcon,
  Video,
  FileAudio,
  History,
  Activity,
  ArrowRight,
  Edit,
  Plus,
  Minus,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn, parseLocalDate } from '@/lib/utils';
import {
  type Tarea,
  type TareaEstado,
  type TareaPrioridad,
  type TareaComentario,
  type TareaEvidencia,
  type TareaHistorial,
  type CreateEvidenciaData,
  getTareaById,
  updateTarea,
  getTareaComentarios,
  agregarComentario,
  asignarTarea,
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
  getFileContentType,
} from '@/lib/api/storage.service';
import { getHistoriaById, type HistoriaUsuario } from '@/features/proyectos/services/historias.service';
import { getProyectoEquipo } from '@/features/proyectos/services/proyectos.service';
import { useToast } from '@/lib/hooks/use-toast';

interface TeamMember {
  id: number;
  nombre: string;
  email: string;
  rol?: string;
  avatar?: string;
}

interface TareaDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tareaId: number;
  proyectoId: number;
  onUpdate?: () => void;
}

const estadoColors: Record<TareaEstado, string> = {
  'Por hacer': 'bg-slate-100 text-slate-700 border-slate-300',
  'En progreso': 'bg-blue-100 text-blue-700 border-blue-300',
  'En revision': 'bg-yellow-100 text-yellow-700 border-yellow-300',
  'Finalizado': 'bg-green-100 text-green-700 border-green-300',
};

const prioridadColors: Record<TareaPrioridad, string> = {
  'Alta': 'bg-red-100 text-red-700 border-red-300',
  'Media': 'bg-orange-100 text-orange-700 border-orange-300',
  'Baja': 'bg-gray-100 text-gray-700 border-gray-300',
};

const estadoOptions: TareaEstado[] = ['Por hacer', 'En progreso', 'En revision', 'Finalizado'];
const prioridadOptions: TareaPrioridad[] = ['Alta', 'Media', 'Baja'];

export function TareaDetailModal({
  open,
  onOpenChange,
  tareaId,
  proyectoId,
  onUpdate,
}: TareaDetailModalProps) {
  const { toast } = useToast();

  // Estados principales
  const [tarea, setTarea] = useState<Tarea | null>(null);
  const [historia, setHistoria] = useState<HistoriaUsuario | null>(null);
  const [equipo, setEquipo] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de comentarios
  const [comentarios, setComentarios] = useState<TareaComentario[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [isSendingComentario, setIsSendingComentario] = useState(false);

  // Estados de evidencias
  const [evidencias, setEvidencias] = useState<TareaEvidencia[]>([]);
  const [isLoadingEvidencias, setIsLoadingEvidencias] = useState(false);

  // Estados de historial
  const [historial, setHistorial] = useState<TareaHistorial[]>([]);
  const [isLoadingHistorial, setIsLoadingHistorial] = useState(false);
  const [showEvidenciaForm, setShowEvidenciaForm] = useState(false);
  const [evidenciaMode, setEvidenciaMode] = useState<'archivo' | 'enlace'>('archivo');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [nuevaEvidencia, setNuevaEvidencia] = useState<CreateEvidenciaData>({
    nombre: '',
    descripcion: '',
    url: '',
    tipo: 'enlace',
  });
  const [isSubmittingEvidencia, setIsSubmittingEvidencia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Estados para preview de evidencia
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewType, setPreviewType] = useState<'image' | 'video' | 'pdf' | 'audio' | 'document' | 'other'>('other');
  const [previewName, setPreviewName] = useState('');

  // Estados de actualización
  const [isUpdating, setIsUpdating] = useState(false);

  // Tab activa
  const [activeTab, setActiveTab] = useState('comentarios');

  // Cargar datos iniciales
  const loadData = useCallback(async () => {
    if (!tareaId || !proyectoId) return;

    setIsLoading(true);
    try {
      // Cargar tarea, equipo en paralelo
      const [tareaData, equipoData] = await Promise.all([
        getTareaById(tareaId),
        getProyectoEquipo(proyectoId).catch(() => []),
      ]);

      setTarea(tareaData);
      setEquipo(equipoData || []);

      // Cargar historia si existe
      if (tareaData.historiaUsuarioId) {
        const historiaData = await getHistoriaById(tareaData.historiaUsuarioId);
        setHistoria(historiaData);
      }

      // Cargar comentarios, evidencias e historial
      const [comentariosData, evidenciasData, historialData] = await Promise.all([
        getTareaComentarios(tareaId).catch(() => []),
        getTareaEvidencias(tareaId).catch(() => []),
        getTareaHistorial(tareaId).catch(() => []),
      ]);

      setComentarios(comentariosData || []);
      setEvidencias(evidenciasData || []);
      setHistorial(historialData || []);

    } catch (error) {
      console.error('Error loading tarea details:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los detalles de la tarea',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [tareaId, proyectoId, toast]);

  useEffect(() => {
    if (open && tareaId) {
      loadData();
    }
  }, [open, tareaId, loadData]);

  // Cambiar estado de la tarea
  const handleEstadoChange = async (nuevoEstado: TareaEstado) => {
    if (!tarea) return;

    setIsUpdating(true);
    try {
      const updated = await updateTarea(tarea.id, { estado: nuevoEstado });
      setTarea(updated);
      toast({
        title: 'Estado actualizado',
        description: `La tarea ahora está "${nuevoEstado}"`,
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error updating estado:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Cambiar prioridad
  const handlePrioridadChange = async (nuevaPrioridad: TareaPrioridad) => {
    if (!tarea) return;

    setIsUpdating(true);
    try {
      const updated = await updateTarea(tarea.id, { prioridad: nuevaPrioridad });
      setTarea(updated);
      toast({
        title: 'Prioridad actualizada',
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error updating prioridad:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la prioridad',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Asignar responsable
  const handleAsignarResponsable = async (responsableId: number | null) => {
    if (!tarea) return;

    setIsUpdating(true);
    try {
      const updated = await asignarTarea(tarea.id, responsableId);
      setTarea(updated);
      toast({
        title: responsableId ? 'Responsable asignado' : 'Responsable removido',
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error asignando responsable:', error);
      toast({
        title: 'Error',
        description: 'No se pudo asignar el responsable',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Enviar comentario
  const handleEnviarComentario = async () => {
    if (!nuevoComentario.trim() || !tarea) return;

    setIsSendingComentario(true);
    try {
      const comentario = await agregarComentario(tarea.id, nuevoComentario);
      setComentarios((prev) => [...prev, comentario]);
      setNuevoComentario('');
      toast({
        title: 'Comentario agregado',
      });
    } catch (error) {
      console.error('Error enviando comentario:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar el comentario',
        variant: 'destructive',
      });
    } finally {
      setIsSendingComentario(false);
    }
  };

  // Agregar evidencia (archivo o enlace)
  const handleAgregarEvidencia = async () => {
    if (!tarea) return;

    // Validar según el modo
    if (evidenciaMode === 'archivo') {
      if (!selectedFile) {
        toast({
          title: 'Error',
          description: 'Debe seleccionar un archivo',
          variant: 'destructive',
        });
        return;
      }
    } else {
      if (!nuevaEvidencia.nombre.trim() || !nuevaEvidencia.url.trim()) {
        toast({
          title: 'Error',
          description: 'Debe completar nombre y URL',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSubmittingEvidencia(true);
    try {
      if (evidenciaMode === 'archivo' && selectedFile) {
        // Subir archivo a MinIO vía backend
        const archivoSubido = await uploadFileDirect(
          selectedFile,
          'TAREA',
          tarea.id,
          'evidencia'
        );

        // Registrar evidencia con la URL de descarga del archivo
        const downloadUrl = getArchivoDownloadUrl(archivoSubido.id);
        const evidencia = await agregarEvidencia(tarea.id, {
          nombre: selectedFile.name,
          descripcion: nuevaEvidencia.descripcion,
          url: downloadUrl,
          tipo: selectedFile.type.startsWith('image/') ? 'imagen' :
                selectedFile.type.includes('video') ? 'video' : 'documento',
          tamanoBytes: selectedFile.size,
        });

        setEvidencias((prev) => [...prev, evidencia]);
        toast({
          title: 'Evidencia subida',
          description: `Archivo "${selectedFile.name}" subido correctamente`,
        });
      } else {
        // Agregar enlace
        const evidencia = await agregarEvidencia(tarea.id, nuevaEvidencia);
        setEvidencias((prev) => [...prev, evidencia]);
        toast({
          title: 'Evidencia agregada',
          description: 'El enlace se ha registrado correctamente',
        });
      }

      // Limpiar formulario
      setNuevaEvidencia({ nombre: '', descripcion: '', url: '', tipo: 'enlace' });
      setSelectedFile(null);
      setShowEvidenciaForm(false);
      setUploadProgress(0);

    } catch (error) {
      console.error('Error agregando evidencia:', error);
      toast({
        title: 'Error',
        description: 'No se pudo agregar la evidencia',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingEvidencia(false);
    }
  };

  // Manejar selección de archivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setNuevaEvidencia((prev) => ({ ...prev, nombre: file.name }));
    }
  };

  // Eliminar evidencia
  const handleEliminarEvidencia = async (evidenciaId: number) => {
    if (!tarea) return;

    try {
      await eliminarEvidencia(tarea.id, evidenciaId);
      setEvidencias((prev) => prev.filter((e) => e.id !== evidenciaId));
      toast({
        title: 'Evidencia eliminada',
      });
    } catch (error) {
      console.error('Error eliminando evidencia:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la evidencia',
        variant: 'destructive',
      });
    }
  };

  // Abrir preview de evidencia
  const handlePreviewEvidencia = async (evidencia: TareaEvidencia) => {
    // Si es un enlace externo, abrir en nueva pestaña
    if (evidencia.tipo === 'enlace' || !evidencia.url.includes('/archivos/')) {
      window.open(evidencia.url, '_blank');
      return;
    }

    // Extraer ID del archivo de la URL
    const archivoId = extractArchivoIdFromUrl(evidencia.url);
    if (!archivoId) {
      toast({
        title: 'Error',
        description: 'No se pudo obtener el archivo',
        variant: 'destructive',
      });
      return;
    }

    // Determinar tipo de archivo
    const fileType = getFileContentType(evidencia.nombre);
    setPreviewType(fileType);
    setPreviewName(evidencia.nombre);
    setPreviewLoading(true);
    setPreviewOpen(true);

    try {
      // Descargar archivo con autenticación y crear blob URL
      const blobUrl = await downloadArchivoAsBlob(archivoId);
      setPreviewUrl(blobUrl);
    } catch (error) {
      console.error('Error cargando preview:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el archivo para preview',
        variant: 'destructive',
      });
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Cerrar preview y limpiar URL
  const handleClosePreview = () => {
    setPreviewOpen(false);
    // Liberar memoria del blob URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  // Descargar archivo directamente
  const handleDownloadEvidencia = async (evidencia: TareaEvidencia) => {
    if (evidencia.tipo === 'enlace' || !evidencia.url.includes('/archivos/')) {
      window.open(evidencia.url, '_blank');
      return;
    }

    const archivoId = extractArchivoIdFromUrl(evidencia.url);
    if (!archivoId) {
      toast({
        title: 'Error',
        description: 'No se pudo obtener el archivo',
        variant: 'destructive',
      });
      return;
    }

    try {
      const blobUrl = await downloadArchivoAsBlob(archivoId);
      // Crear link temporal y forzar descarga
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = evidencia.nombre;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error descargando archivo:', error);
      toast({
        title: 'Error',
        description: 'No se pudo descargar el archivo',
        variant: 'destructive',
      });
    }
  };

  // Obtener iniciales del nombre
  const getInitials = (nombre: string) => {
    return nombre
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Formatear fecha
  const formatTareaDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = parseLocalDate(dateString);
    if (!date) return '-';
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (!open) return null;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="bg-gradient-to-r from-[#0a4a6e] to-[#1a6494] text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  {isLoading ? 'Cargando...' : tarea?.nombre || 'Detalle de Tarea'}
                </DialogTitle>
                {tarea?.codigo && (
                  <p className="text-sm text-white/70">{tarea.codigo}</p>
                )}
              </div>
            </div>
            {tarea && (
              <div className="flex items-center gap-2">
                <Badge className={cn('border', estadoColors[tarea.estado])}>
                  {tarea.estado}
                </Badge>
                <Badge className={cn('border', prioridadColors[tarea.prioridad])}>
                  {tarea.prioridad}
                </Badge>
              </div>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-[#018CD1]" />
          </div>
        ) : tarea ? (
          <div className="flex-1 overflow-hidden grid grid-cols-[1fr_320px]">
            {/* Panel Izquierdo - Contenido Principal */}
            <div className="flex flex-col border-r overflow-hidden">
              <ScrollArea className="flex-1 p-6">
                {/* Descripción */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-black mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Descripción
                  </h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {tarea.descripcion || 'Sin descripción'}
                  </p>
                </div>

                {/* Historia de Usuario */}
                {historia && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-black mb-2">
                      Historia de Usuario
                    </h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-100 text-blue-700">
                          {historia.codigo}
                        </Badge>
                        <span className="text-sm font-medium text-blue-900">
                          {historia.titulo}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <Separator className="my-4" />

                {/* Sección Actividad */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-black mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Actividad
                  </h3>

                  {/* Tabs: Comentarios e Historial */}
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 h-10 mb-4">
                      <TabsTrigger value="comentarios" className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Comentarios ({comentarios.length})
                      </TabsTrigger>
                      <TabsTrigger value="historial" className="gap-2">
                        <History className="h-4 w-4" />
                        Historial ({historial.length})
                      </TabsTrigger>
                    </TabsList>

                  {/* Tab Comentarios */}
                  <TabsContent value="comentarios" className="mt-0">
                    {/* Lista de comentarios */}
                    <div className="space-y-3 mb-4 max-h-[200px] overflow-y-auto">
                      {comentarios.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No hay comentarios aún. ¡Sé el primero en comentar!
                        </p>
                      ) : (
                        comentarios.map((comentario) => (
                          <div
                            key={comentario.id}
                            className="flex gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-[#018CD1] text-white">
                                {getInitials(comentario.usuario?.nombre || 'U')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-900">
                                  {comentario.usuario?.nombre || 'Usuario'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatTareaDate(comentario.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">
                                {comentario.texto}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Input nuevo comentario */}
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Escribe un comentario..."
                        className="resize-none min-h-[60px] border-[#018CD1]"
                        value={nuevoComentario}
                        onChange={(e) => setNuevoComentario(e.target.value)}
                        disabled={isSendingComentario}
                      />
                      <Button
                        onClick={handleEnviarComentario}
                        disabled={!nuevoComentario.trim() || isSendingComentario}
                        className="bg-[#018CD1] hover:bg-[#0179b5] self-end"
                      >
                        {isSendingComentario ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Tab Historial */}
                    <TabsContent value="historial" className="mt-0">
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {historial.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No hay cambios registrados para esta tarea.
                          </p>
                        ) : (
                          historial.map((item) => (
                            <div
                              key={item.id}
                              className="flex gap-3 p-3 bg-gray-50 rounded-lg border"
                            >
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#018CD1]/10 flex items-center justify-center">
                                {item.accion === 'CREACION' && <Plus className="h-4 w-4 text-green-600" />}
                                {item.accion === 'ACTUALIZACION' && <Edit className="h-4 w-4 text-blue-600" />}
                                {item.accion === 'CAMBIO_ESTADO' && <ArrowRight className="h-4 w-4 text-amber-600" />}
                                {item.accion === 'ASIGNACION' && <User className="h-4 w-4 text-purple-600" />}
                                {item.accion === 'REASIGNACION' && <User className="h-4 w-4 text-purple-600" />}
                                {item.accion === 'ELIMINACION' && <Minus className="h-4 w-4 text-red-600" />}
                                {item.accion === 'VALIDACION' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                                {!['CREACION', 'ACTUALIZACION', 'CAMBIO_ESTADO', 'ASIGNACION', 'REASIGNACION', 'ELIMINACION', 'VALIDACION'].includes(item.accion) && (
                                  <History className="h-4 w-4 text-gray-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-gray-900">
                                    {item.usuario?.nombre || 'Sistema'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatTareaDate(item.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">
                                  {item.accion === 'CREACION' && 'Creó la tarea'}
                                  {item.accion === 'ACTUALIZACION' && item.campoModificado && (
                                    <>
                                      Actualizó <span className="font-medium">{item.campoModificado}</span>
                                      {item.valorAnterior && item.valorNuevo && (
                                        <>
                                          {' de '}
                                          <span className="text-gray-500 line-through">
                                            {JSON.parse(item.valorAnterior)}
                                          </span>
                                          {' a '}
                                          <span className="font-medium text-[#018CD1]">
                                            {JSON.parse(item.valorNuevo)}
                                          </span>
                                        </>
                                      )}
                                    </>
                                  )}
                                  {item.accion === 'CAMBIO_ESTADO' && (
                                    <>
                                      Cambió el estado de{' '}
                                      <span className="text-gray-500">
                                        {item.valorAnterior ? JSON.parse(item.valorAnterior) : ''}
                                      </span>
                                      {' → '}
                                      <span className="font-medium text-[#018CD1]">
                                        {item.valorNuevo ? JSON.parse(item.valorNuevo) : ''}
                                      </span>
                                    </>
                                  )}
                                  {item.accion === 'ASIGNACION' && 'Asignó la tarea'}
                                  {item.accion === 'REASIGNACION' && 'Reasignó la tarea'}
                                  {item.accion === 'ELIMINACION' && 'Eliminó la tarea'}
                                  {item.accion === 'VALIDACION' && 'Validó la tarea'}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </ScrollArea>
            </div>

            {/* Panel Derecho - Detalles */}
            <div className="bg-gray-50 p-4 overflow-y-auto">
              <h3 className="text-sm font-semibold text-black mb-4">Detalles</h3>

              {/* Estado */}
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-500 block mb-1.5">
                  Estado
                </label>
                <Select
                  value={tarea.estado}
                  onValueChange={(value) => handleEstadoChange(value as TareaEstado)}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {estadoOptions.map((estado) => (
                      <SelectItem key={estado} value={estado}>
                        <div className="flex items-center gap-2">
                          <Circle className={cn('h-3 w-3', {
                            'fill-slate-400 text-slate-400': estado === 'Por hacer',
                            'fill-blue-400 text-blue-400': estado === 'En progreso',
                            'fill-yellow-400 text-yellow-400': estado === 'En revision',
                            'fill-green-400 text-green-400': estado === 'Finalizado',
                          })} />
                          {estado}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Prioridad */}
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-500 block mb-1.5">
                  Prioridad
                </label>
                <Select
                  value={tarea.prioridad}
                  onValueChange={(value) => handlePrioridadChange(value as TareaPrioridad)}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {prioridadOptions.map((prioridad) => (
                      <SelectItem key={prioridad} value={prioridad}>
                        <Badge className={cn('border text-xs', prioridadColors[prioridad])}>
                          {prioridad}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator className="my-4" />

              {/* Responsable */}
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-500 block mb-1.5 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Responsable
                </label>
                <Select
                  value={tarea.responsableId?.toString() || 'none'}
                  onValueChange={(value) =>
                    handleAsignarResponsable(value === 'none' ? null : Number(value))
                  }
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-gray-500">Sin asignar</span>
                    </SelectItem>
                    {equipo.map((miembro) => (
                      <SelectItem key={miembro.id} value={miembro.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[10px] bg-[#018CD1] text-white">
                              {getInitials(miembro.nombre)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{miembro.nombre}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {tarea.responsable && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-white rounded border">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-[#018CD1] text-white">
                        {getInitials(tarea.responsable.nombre)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{tarea.responsable.nombre}</p>
                      <p className="text-xs text-gray-500">{tarea.responsable.email}</p>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Fechas */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Fecha Inicio
                  </label>
                  <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                    {formatTareaDate(tarea.fechaInicio)}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Fecha Fin
                  </label>
                  <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                    {formatTareaDate(tarea.fechaFin)}
                  </p>
                </div>
                {tarea.fechaLimite && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Fecha Límite
                    </label>
                    <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                      {formatTareaDate(tarea.fechaLimite)}
                    </p>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Horas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    Horas Estimadas
                  </label>
                  <p className="text-sm font-semibold text-gray-900 bg-white p-2 rounded border text-center">
                    {tarea.horasEstimadas || '-'}h
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    Horas Reales
                  </label>
                  <p className="text-sm font-semibold text-gray-900 bg-white p-2 rounded border text-center">
                    {tarea.horasReales || '-'}h
                  </p>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Metadatos */}
              <div className="space-y-2 text-xs text-gray-500">
                <p>Creado: {formatTareaDate(tarea.createdAt)}</p>
                <p>Actualizado: {formatTareaDate(tarea.updatedAt)}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No se encontró la tarea
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Modal de Preview de Evidencia */}
    <Dialog open={previewOpen} onOpenChange={handleClosePreview}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header del Preview */}
        <DialogHeader className="bg-gradient-to-r from-[#0a4a6e] to-[#1a6494] text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                {previewType === 'image' && <ImageIcon className="h-5 w-5" />}
                {previewType === 'video' && <Video className="h-5 w-5" />}
                {previewType === 'pdf' && <FileText className="h-5 w-5" />}
                {previewType === 'audio' && <FileAudio className="h-5 w-5" />}
                {(previewType === 'document' || previewType === 'other') && <FileText className="h-5 w-5" />}
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  Vista Previa
                </DialogTitle>
                <p className="text-sm text-white/70 truncate max-w-[400px]">{previewName}</p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Contenido del Preview */}
        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center min-h-[400px] p-4">
          {previewLoading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-[#018CD1]" />
              <p className="text-sm text-gray-600">Cargando archivo...</p>
            </div>
          ) : previewUrl ? (
            <>
              {/* Imagen */}
              {previewType === 'image' && (
                <img
                  src={previewUrl}
                  alt={previewName}
                  className="max-w-full max-h-[70vh] object-contain rounded shadow-lg"
                />
              )}

              {/* PDF */}
              {previewType === 'pdf' && (
                <iframe
                  src={previewUrl}
                  title={previewName}
                  className="w-full h-[70vh] rounded shadow-lg bg-white"
                />
              )}

              {/* Video */}
              {previewType === 'video' && (
                <video
                  src={previewUrl}
                  controls
                  className="max-w-full max-h-[70vh] rounded shadow-lg"
                >
                  Tu navegador no soporta la reproducción de video.
                </video>
              )}

              {/* Audio */}
              {previewType === 'audio' && (
                <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-lg shadow-lg">
                  <FileAudio className="h-20 w-20 text-[#018CD1]" />
                  <p className="text-lg font-medium text-gray-800">{previewName}</p>
                  <audio src={previewUrl} controls className="w-full max-w-md">
                    Tu navegador no soporta la reproducción de audio.
                  </audio>
                </div>
              )}

              {/* Documento u Otro tipo no previsualizable */}
              {(previewType === 'document' || previewType === 'other') && (
                <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-lg shadow-lg text-center">
                  <FileText className="h-20 w-20 text-gray-400" />
                  <p className="text-lg font-medium text-gray-800">{previewName}</p>
                  <p className="text-sm text-gray-500">
                    Este tipo de archivo no puede ser previsualizado directamente.
                  </p>
                  <Button
                    onClick={() => {
                      if (previewUrl) {
                        const link = document.createElement('a');
                        link.href = previewUrl;
                        link.download = previewName;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }
                    }}
                    className="bg-[#018CD1] hover:bg-[#0179b5]"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar archivo
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>No se pudo cargar el archivo</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
