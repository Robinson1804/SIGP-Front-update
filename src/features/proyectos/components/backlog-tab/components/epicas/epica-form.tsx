'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Epica, PrioridadMoSCoW } from '@/features/proyectos/types';
import { createEpica, updateEpica } from '@/features/proyectos/services/epicas.service';

const epicaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200),
  descripcion: z.string().max(1000).optional(),
  prioridad: z.enum(['Must', 'Should', 'Could', 'Wont']).optional(),
  color: z.string().optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
});

type EpicaFormData = z.infer<typeof epicaSchema>;

interface EpicaFormProps {
  proyectoId: number;
  epica?: Epica;
  onSuccess: () => void;
  onCancel: () => void;
}

const COLORS = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#8b5cf6', label: 'Violeta' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#ef4444', label: 'Rojo' },
  { value: '#f97316', label: 'Naranja' },
  { value: '#eab308', label: 'Amarillo' },
  { value: '#22c55e', label: 'Verde' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#0ea5e9', label: 'Celeste' },
  { value: '#3b82f6', label: 'Azul' },
];

export function EpicaForm({ proyectoId, epica, onSuccess, onCancel }: EpicaFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!epica;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EpicaFormData>({
    resolver: zodResolver(epicaSchema),
    defaultValues: {
      nombre: epica?.nombre || '',
      descripcion: epica?.descripcion || '',
      prioridad: epica?.prioridad || undefined,
      color: epica?.color || '#6366f1',
      fechaInicio: epica?.fechaInicio?.split('T')[0] || '',
      fechaFin: epica?.fechaFin?.split('T')[0] || '',
    },
  });

  const selectedColor = watch('color');
  const selectedPrioridad = watch('prioridad');

  const onSubmit = async (data: EpicaFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        ...data,
        proyectoId,
        fechaInicio: data.fechaInicio || undefined,
        fechaFin: data.fechaFin || undefined,
      };

      if (isEditing) {
        await updateEpica(epica.id, payload);
      } else {
        await createEpica(payload);
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error saving epica:', err);
      setError(err.response?.data?.message || 'Error al guardar la epica');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar Epica' : 'Nueva Epica'}</CardTitle>
        <CardDescription>
          {isEditing
            ? 'Modifica los datos de la epica'
            : 'Las epicas agrupan historias de usuario relacionadas'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre"
              placeholder="Ej: Modulo de autenticacion"
              {...register('nombre')}
            />
            {errors.nombre && (
              <p className="text-sm text-red-500">{errors.nombre.message}</p>
            )}
          </div>

          {/* Descripcion */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripcion</Label>
            <Textarea
              id="descripcion"
              placeholder="Describe el alcance y objetivos de esta epica..."
              rows={3}
              {...register('descripcion')}
            />
            {errors.descripcion && (
              <p className="text-sm text-red-500">{errors.descripcion.message}</p>
            )}
          </div>

          {/* Prioridad y Color */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridad (MoSCoW)</Label>
              <Select
                value={selectedPrioridad || ''}
                onValueChange={(value) =>
                  setValue('prioridad', value as PrioridadMoSCoW)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Must">Must Have</SelectItem>
                  <SelectItem value="Should">Should Have</SelectItem>
                  <SelectItem value="Could">Could Have</SelectItem>
                  <SelectItem value="Wont">Won&apos;t Have</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setValue('color', color.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === color.value
                        ? 'border-gray-900 scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fechaInicio">Fecha Inicio</Label>
              <Input
                id="fechaInicio"
                type="date"
                {...register('fechaInicio')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaFin">Fecha Fin</Label>
              <Input
                id="fechaFin"
                type="date"
                {...register('fechaFin')}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Guardar Cambios' : 'Crear Epica'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
