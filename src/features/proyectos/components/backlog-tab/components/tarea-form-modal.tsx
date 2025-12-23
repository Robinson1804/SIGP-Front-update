'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Send, Upload, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  type Tarea,
  type TareaEstado,
  type TareaPrioridad,
  type TareaComentario,
  createTarea,
  updateTarea,
  getTareaComentarios,
  agregarComentario,
} from '@/features/proyectos/services/tareas.service';
import { getHistoriaById, type HistoriaUsuario } from '@/features/proyectos/services/historias.service';

const tareaSchema = z.object({
  nombre: z.string().min(1, 'El nombre de la tarea es requerido').max(200, 'Máximo 200 caracteres'),
  descripcion: z.string().min(1, 'La descripción es requerida').max(2000, 'Máximo 2000 caracteres'),
  estado: z.enum(['Por hacer', 'En progreso', 'En revision', 'Finalizado']),
  prioridad: z.enum(['Alta', 'Media', 'Baja']),
  responsableId: z.number().optional(),
  fechaInicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fechaFin: z.string().min(1, 'La fecha de fin es requerida'),
  informador: z.string().optional(),
});

type TareaFormValues = z.infer<typeof tareaSchema>;

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
  { value: 'En revision', label: 'En revisión' },
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
  const [comentarios, setComentarios] = useState<TareaComentario[]>([]);
  const [isLoadingComentarios, setIsLoadingComentarios] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [isSendingComentario, setIsSendingComentario] = useState(false);
  const isEditing = !!tarea;

  const form = useForm<TareaFormValues>({
    resolver: zodResolver(tareaSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      estado: 'Por hacer',
      prioridad: 'Media',
      responsableId: undefined,
      fechaInicio: '',
      fechaFin: '',
      informador: '',
    },
  });

  // Cargar datos de la historia
  useEffect(() => {
    if (open && historiaUsuarioId) {
      getHistoriaById(historiaUsuarioId)
        .then(setHistoria)
        .catch((err) => console.error('Error loading historia:', err));
    }
  }, [open, historiaUsuarioId]);

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

  // Reset form cuando se abre el modal
  useEffect(() => {
    if (open) {
      if (tarea) {
        form.reset({
          nombre: tarea.nombre,
          descripcion: tarea.descripcion || '',
          estado: tarea.estado,
          prioridad: tarea.prioridad,
          responsableId: tarea.responsableId || undefined,
          fechaInicio: tarea.fechaInicio?.split('T')[0] || '',
          fechaFin: tarea.fechaFin?.split('T')[0] || '',
          informador: '',
        });
      } else {
        form.reset({
          nombre: '',
          descripcion: '',
          estado: 'Por hacer',
          prioridad: 'Media',
          responsableId: undefined,
          fechaInicio: '',
          fechaFin: '',
          informador: '',
        });
      }
      setActiveTab('comentarios');
      setComentarios([]);
      setNuevoComentario('');
    }
  }, [open, tarea, form]);

  const onSubmit = async (values: TareaFormValues) => {
    try {
      setIsSubmitting(true);

      const data = {
        nombre: values.nombre,
        descripcion: values.descripcion || undefined,
        estado: values.estado,
        prioridad: values.prioridad,
        responsableId: values.responsableId || undefined,
        fechaInicio: values.fechaInicio || undefined,
        fechaFin: values.fechaFin || undefined,
        historiaUsuarioId,
      };

      if (isEditing && tarea) {
        await updateTarea(tarea.id, data);
      } else {
        await createTarea(data);
      }

      onSuccess();
    } catch (error) {
      console.error('Error al guardar tarea:', error);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="bg-[#0a4a6e] text-white px-6 py-4">
          <DialogTitle className="text-lg font-semibold">
            {isEditing ? 'Editar Tarea' : 'Agregar Tarea'}
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

                {/* Tabs: Actividad, Comentarios, Historial */}
                <div className="pt-2">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3 h-9">
                      <TabsTrigger value="actividad" className="text-xs">
                        Actividad
                      </TabsTrigger>
                      <TabsTrigger
                        value="comentarios"
                        className="text-xs bg-[#018CD1] text-white data-[state=active]:bg-[#018CD1] data-[state=active]:text-white"
                      >
                        Comentarios
                      </TabsTrigger>
                      <TabsTrigger value="historial" className="text-xs">
                        Historial
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="actividad" className="mt-3">
                      <p className="text-sm text-gray-500 text-center py-4">
                        Sin actividad reciente
                      </p>
                    </TabsContent>

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
                      <p className="text-sm text-gray-500 text-center py-4">
                        Sin historial disponible
                      </p>
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
                </div>

                {/* Responsable */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Responsable <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Buscar responsable..."
                    className="border-dashed border-2 border-[#018CD1]"
                  />
                </div>

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
                          Prioridad <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="border-dashed border-2 border-[#018CD1]">
                              <SelectValue placeholder="Seleccionar" />
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
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Fecha Fin <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="border-dashed border-2 border-[#018CD1]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Informador */}
                <FormField
                  control={form.control}
                  name="informador"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Informador
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nombre del informador"
                          className="border-dashed border-2 border-[#018CD1]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Adjuntar */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Adjuntar
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Archivos .jpg o .png (máx. 10MB, máx. 5 archivos)
                  </p>
                  <div className="border-dashed border-2 border-[#018CD1] rounded-md p-4 text-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                    <Upload className="h-5 w-5 mx-auto mb-1 text-gray-400" />
                    <span className="text-sm text-gray-600">Seleccionar archivos</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <DialogFooter className="border-t px-6 py-4 bg-gray-50">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#018CD1] hover:bg-[#0179b5] text-white"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
