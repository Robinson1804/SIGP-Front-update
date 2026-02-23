'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  type Requerimiento,
  type RequerimientoTipo,
  type RequerimientoPrioridad,
  type CriterioAceptacion,
  REQUERIMIENTO_TIPOS,
  REQUERIMIENTO_PRIORIDADES,
  generateCodigo,
} from '../types';
import {
  createRequerimiento,
  updateRequerimiento,
  countRequerimientosByProyecto,
  countRequerimientosBySubproyecto,
} from '../services';

// Schema de validación
const requerimientoSchema = z.object({
  tipo: z.enum(['Funcional', 'No Funcional', 'Tecnico', 'Negocio'] as const),
  codigo: z.string().min(1, 'El código es requerido').max(20, 'Máximo 20 caracteres'),
  nombre: z.string().min(3, 'Mínimo 3 caracteres').max(200, 'Máximo 200 caracteres'),
  descripcion: z.string().min(10, 'Mínimo 10 caracteres').optional().or(z.literal('')),
  prioridad: z.enum(['Baja', 'Media', 'Alta', 'Critica'] as const),
  observaciones: z.string().optional(),
});

type FormValues = z.infer<typeof requerimientoSchema>;

interface RequerimientoFormProps {
  isOpen: boolean;
  onClose: () => void;
  proyectoId: number;
  subproyectoId?: number; // Opcional: para requerimientos de subproyectos
  tipoContenedor?: 'PROYECTO' | 'SUBPROYECTO'; // Opcional: por defecto 'PROYECTO'
  requerimiento?: Requerimiento | null;
  onSuccess: () => void;
}

export function RequerimientoForm({
  isOpen,
  onClose,
  proyectoId,
  subproyectoId,
  tipoContenedor = 'PROYECTO',
  requerimiento,
  onSuccess,
}: RequerimientoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [criterios, setCriterios] = useState<CriterioAceptacion[]>([]);
  const [newCriterio, setNewCriterio] = useState('');

  const isEditing = !!requerimiento;

  const form = useForm<FormValues>({
    resolver: zodResolver(requerimientoSchema),
    defaultValues: {
      tipo: 'Funcional',
      codigo: '',
      nombre: '',
      descripcion: '',
      prioridad: 'Media',
      observaciones: '',
    },
  });

  // Generar código inicial para nuevo requerimiento (REQ-001, REQ-002, etc.)
  const generateInitialCodigo = async () => {
    try {
      const count =
        tipoContenedor === 'SUBPROYECTO' && subproyectoId
          ? await countRequerimientosBySubproyecto(subproyectoId)
          : await countRequerimientosByProyecto(proyectoId);
      const codigo = generateCodigo(count);
      form.setValue('codigo', codigo);
    } catch (error) {
      console.error('Error generando código:', error);
    }
  };

  // Cargar datos del requerimiento al editar o generar código al crear
  useEffect(() => {
    if (isOpen) {
      if (requerimiento) {
        form.reset({
          tipo: requerimiento.tipo,
          codigo: requerimiento.codigo,
          nombre: requerimiento.nombre,
          descripcion: requerimiento.descripcion || '',
          prioridad: requerimiento.prioridad,
          observaciones: requerimiento.observaciones || '',
        });
        setCriterios(requerimiento.criteriosAceptacion || []);
      } else {
        // Al crear, resetear y generar código automático
        form.reset({
          tipo: 'Funcional',
          codigo: '',
          nombre: '',
          descripcion: '',
          prioridad: 'Media',
          observaciones: '',
        });
        setCriterios([]);
        // Generar código secuencial (REQ-001, REQ-002, etc.)
        generateInitialCodigo();
      }
    }
  }, [isOpen, requerimiento, form, proyectoId]);

  // Agregar criterio de aceptación
  const addCriterio = () => {
    if (newCriterio.trim()) {
      setCriterios([...criterios, { descripcion: newCriterio.trim(), cumplido: false }]);
      setNewCriterio('');
    }
  };

  // Eliminar criterio de aceptación
  const removeCriterio = (index: number) => {
    setCriterios(criterios.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      setCriterios([]);
      setNewCriterio('');
      onClose();
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      if (isEditing && requerimiento) {
        await updateRequerimiento(requerimiento.id, {
          nombre: values.nombre,
          descripcion: values.descripcion || undefined,
          tipo: values.tipo,
          prioridad: values.prioridad,
          criteriosAceptacion: criterios.length > 0 ? criterios : undefined,
          observaciones: values.observaciones || undefined,
        });
      } else {
        await createRequerimiento({
          proyectoId: tipoContenedor === 'SUBPROYECTO' ? undefined : proyectoId,
          subproyectoId: tipoContenedor === 'SUBPROYECTO' ? subproyectoId : undefined,
          codigo: values.codigo,
          nombre: values.nombre,
          descripcion: values.descripcion || undefined,
          tipo: values.tipo,
          prioridad: values.prioridad,
          criteriosAceptacion: criterios.length > 0 ? criterios : undefined,
          observaciones: values.observaciones || undefined,
        });
      }

      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error guardando requerimiento:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Requerimiento' : 'Nuevo Requerimiento'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los datos del requerimiento'
              : 'Completa los datos para crear un nuevo requerimiento'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Tipo de requerimiento */}
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Requerimiento *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-wrap gap-4"
                      disabled={isEditing}
                    >
                      {REQUERIMIENTO_TIPOS.map((tipo) => (
                        <div key={tipo.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={tipo.value} id={tipo.value} />
                          <Label htmlFor={tipo.value} className="cursor-pointer">
                            {tipo.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Código y Nombre */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="RF-001"
                        {...field}
                        disabled
                        readOnly
                        className="font-mono bg-muted"
                      />
                    </FormControl>
                    <FormDescription>Autogenerado</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nombre corto del requerimiento"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Descripción */}
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe detalladamente el requerimiento..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Prioridad */}
            <FormField
              control={form.control}
              name="prioridad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridad *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar prioridad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {REQUERIMIENTO_PRIORIDADES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Criterios de Aceptación */}
            <div className="space-y-3">
              <Label>Criterios de Aceptación</Label>

              {/* Lista de criterios */}
              {criterios.length > 0 && (
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  {criterios.map((criterio, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 text-sm"
                    >
                      <span className="text-muted-foreground">{index + 1}.</span>
                      <span className="flex-1">{criterio.descripcion}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => removeCriterio(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Agregar nuevo criterio */}
              <div className="flex gap-2">
                <Input
                  placeholder="Agregar criterio de aceptación..."
                  value={newCriterio}
                  onChange={(e) => setNewCriterio(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCriterio();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addCriterio}
                  disabled={!newCriterio.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Presiona Enter o el botón + para agregar
              </p>
            </div>

            {/* Observaciones */}
            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas adicionales..."
                      className="min-h-[60px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Guardar Cambios' : 'Crear Requerimiento'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
