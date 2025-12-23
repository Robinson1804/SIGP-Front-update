'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Trash2, ListTodo } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  type HistoriaUsuario,
  type PrioridadMoSCoW,
  createHistoria,
  updateHistoria,
} from '@/features/proyectos/services/historias.service';
import { getEpicasByProyecto, type Epica } from '@/features/proyectos/services/epicas.service';
import {
  createTarea,
  getTareasByHistoria,
  type Tarea,
  type TareaPrioridad,
} from '@/features/proyectos/services/tareas.service';

// Tipo para tareas pendientes (no guardadas aun)
interface TareaPendiente {
  id: string; // ID temporal
  nombre: string;
  prioridad: TareaPrioridad;
}

const historiaSchema = z.object({
  codigo: z.string().min(1, 'El codigo es requerido').max(20, 'Maximo 20 caracteres'),
  titulo: z.string().min(1, 'El titulo es requerido').max(200, 'Maximo 200 caracteres'),
  notas: z.string().max(2000, 'Maximo 2000 caracteres').optional(),
  rol: z.string().max(500, 'Maximo 500 caracteres').optional(),
  quiero: z.string().max(500, 'Maximo 500 caracteres').optional(),
  para: z.string().max(500, 'Maximo 500 caracteres').optional(),
  epicaId: z.string().optional(),
  prioridad: z.enum(['Must', 'Should', 'Could', 'Wont']).optional(),
  storyPoints: z.coerce.number().min(1).max(100).optional(),
});

type HistoriaFormValues = z.infer<typeof historiaSchema>;

interface HistoriaFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proyectoId: number;
  historia?: HistoriaUsuario | null;
  sprintId?: number;
  onSuccess: () => void;
}

const prioridadOptions: { value: PrioridadMoSCoW; label: string }[] = [
  { value: 'Must', label: 'Alta - Critico' },
  { value: 'Should', label: 'Media - Importante' },
  { value: 'Could', label: 'Baja - Deseable' },
  { value: 'Wont', label: 'No incluir' },
];

export function HistoriaFormModal({
  open,
  onOpenChange,
  proyectoId,
  historia,
  sprintId,
  onSuccess,
}: HistoriaFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [epicas, setEpicas] = useState<Epica[]>([]);
  const [isLoadingEpicas, setIsLoadingEpicas] = useState(false);
  const isEditing = !!historia;

  // State para tareas
  const [existingTareas, setExistingTareas] = useState<Tarea[]>([]);
  const [pendingTareas, setPendingTareas] = useState<TareaPendiente[]>([]);
  const [newTareaTitle, setNewTareaTitle] = useState('');
  const [newTareaPrioridad, setNewTareaPrioridad] = useState<TareaPrioridad>('Media');
  const [isLoadingTareas, setIsLoadingTareas] = useState(false);

  const form = useForm<HistoriaFormValues>({
    resolver: zodResolver(historiaSchema),
    defaultValues: {
      codigo: '',
      titulo: '',
      notas: '',
      rol: '',
      quiero: '',
      para: '',
      epicaId: undefined,
      prioridad: undefined,
      storyPoints: undefined,
    },
  });

  useEffect(() => {
    if (open) {
      fetchEpicas();
      setPendingTareas([]);
      setNewTareaTitle('');
      setNewTareaPrioridad('Media');

      if (historia) {
        form.reset({
          codigo: historia.codigo,
          titulo: historia.titulo,
          notas: historia.notas || '',
          rol: historia.rol || '',
          quiero: historia.quiero || '',
          para: historia.para || '',
          epicaId: historia.epicaId ? historia.epicaId.toString() : undefined,
          prioridad: historia.prioridad || undefined,
          storyPoints: historia.storyPoints || undefined,
        });
        // Cargar tareas existentes
        fetchExistingTareas(historia.id);
      } else {
        form.reset();
        setExistingTareas([]);
      }
    }
  }, [open, historia, form]);

  const fetchExistingTareas = async (historiaId: number) => {
    try {
      setIsLoadingTareas(true);
      const tareas = await getTareasByHistoria(historiaId);
      setExistingTareas(tareas);
    } catch (err) {
      console.error('Error fetching tareas:', err);
    } finally {
      setIsLoadingTareas(false);
    }
  };

  const handleAddPendingTarea = () => {
    if (!newTareaTitle.trim()) return;

    const newTarea: TareaPendiente = {
      id: `temp-${Date.now()}`,
      nombre: newTareaTitle.trim(),
      prioridad: newTareaPrioridad,
    };

    setPendingTareas((prev) => [...prev, newTarea]);
    setNewTareaTitle('');
    setNewTareaPrioridad('Media');
  };

  const handleRemovePendingTarea = (id: string) => {
    setPendingTareas((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchEpicas = async () => {
    try {
      setIsLoadingEpicas(true);
      const data = await getEpicasByProyecto(proyectoId);
      setEpicas(data);
    } catch (err) {
      console.error('Error fetching epicas:', err);
    } finally {
      setIsLoadingEpicas(false);
    }
  };

  const onSubmit = async (values: HistoriaFormValues) => {
    try {
      setIsSubmitting(true);

      const data = {
        codigo: values.codigo,
        titulo: values.titulo,
        notas: values.notas || undefined,
        rol: values.rol || undefined,
        quiero: values.quiero || undefined,
        para: values.para || undefined,
        epicaId: values.epicaId && values.epicaId !== '__none__' ? parseInt(values.epicaId) : undefined,
        prioridad: values.prioridad || undefined,
        storyPoints: values.storyPoints || undefined,
        proyectoId,
        sprintId: sprintId || undefined,
      };

      let historiaId: number;

      if (isEditing) {
        await updateHistoria(historia.id, data);
        historiaId = historia.id;
      } else {
        const newHistoria = await createHistoria(data);
        historiaId = newHistoria.id;
      }

      // Crear tareas pendientes
      if (pendingTareas.length > 0) {
        await Promise.all(
          pendingTareas.map((tarea) =>
            createTarea({
              nombre: tarea.nombre,
              prioridad: tarea.prioridad,
              historiaUsuarioId: historiaId,
            })
          )
        );
      }

      onSuccess();
    } catch (error) {
      console.error('Error al guardar historia:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Historia de Usuario' : 'Nueva Historia de Usuario'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los datos de la historia de usuario'
              : 'Crea una nueva historia para el backlog del proyecto'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Codigo *</FormLabel>
                    <FormControl>
                      <Input placeholder="HU-001" {...field} disabled={isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titulo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Titulo de la historia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* User Story Format */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-3">
              <p className="text-sm font-medium text-blue-800">Historia de Usuario</p>
              <FormField
                control={form.control}
                name="rol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-700">Como...</FormLabel>
                    <FormControl>
                      <Input placeholder="usuario del sistema" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quiero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-700">Quiero...</FormLabel>
                    <FormControl>
                      <Input placeholder="poder realizar una accion" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="para"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-700">Para...</FormLabel>
                    <FormControl>
                      <Input placeholder="obtener un beneficio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas adicionales"
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="epicaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Epica</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoadingEpicas}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Sin epica</SelectItem>
                        {epicas.map((epica) => (
                          <SelectItem key={epica.id} value={epica.id.toString()}>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: epica.color || '#888' }}
                              />
                              {epica.nombre}
                            </div>
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
                    <FormLabel>Prioridad</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
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

            <FormField
              control={form.control}
              name="storyPoints"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Story Points</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="100" placeholder="Ej: 5" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Estimacion de complejidad (1-100)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Seccion de Tareas */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <ListTodo className="h-4 w-4" />
                  Tareas
                </p>
                <Badge variant="secondary" className="text-xs">
                  {existingTareas.length + pendingTareas.length}
                </Badge>
              </div>

              {/* Tareas existentes (solo si editando) */}
              {isEditing && existingTareas.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 mb-2">Tareas existentes:</p>
                  {isLoadingTareas ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    existingTareas.map((tarea) => (
                      <div
                        key={tarea.id}
                        className="flex items-center justify-between p-2 bg-white rounded border text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              tarea.prioridad === 'Alta'
                                ? 'bg-red-500'
                                : tarea.prioridad === 'Baja'
                                ? 'bg-green-500'
                                : 'bg-amber-500'
                            }`}
                          />
                          <span className="text-gray-700">{tarea.nombre}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {tarea.estado}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tareas pendientes (nuevas) */}
              {pendingTareas.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 mb-2">Nuevas tareas:</p>
                  {pendingTareas.map((tarea) => (
                    <div
                      key={tarea.id}
                      className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            tarea.prioridad === 'Alta'
                              ? 'bg-red-500'
                              : tarea.prioridad === 'Baja'
                              ? 'bg-green-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        <span className="text-gray-700">{tarea.nombre}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-400 hover:text-red-500"
                        onClick={() => handleRemovePendingTarea(tarea.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Agregar nueva tarea */}
              <div className="flex items-end gap-2 pt-2 border-t border-gray-200">
                <div className="flex-1">
                  <Input
                    placeholder="Titulo de la nueva tarea"
                    value={newTareaTitle}
                    onChange={(e) => setNewTareaTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPendingTarea();
                      }
                    }}
                  />
                </div>
                <Select
                  value={newTareaPrioridad}
                  onValueChange={(v) => setNewTareaPrioridad(v as TareaPrioridad)}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Media">Media</SelectItem>
                    <SelectItem value="Baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddPendingTarea}
                  disabled={!newTareaTitle.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#018CD1] hover:bg-[#0179b5]">
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? 'Guardar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
