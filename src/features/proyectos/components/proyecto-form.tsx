'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createProyecto, updateProyecto } from '@/lib/actions';
import { paths } from '@/lib/paths';
import { CreateProyectoSchema } from '@/lib/definitions';
import type { Proyecto, CreateProyectoInput } from '@/lib/definitions';
import { useState } from 'react';

type FormValues = CreateProyectoInput;

interface ProyectoFormProps {
  initialData?: Proyecto;
  mode: 'create' | 'edit';
}

export function ProyectoForm({ initialData, mode }: ProyectoFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateProyectoSchema),
    defaultValues: initialData
      ? {
          codigo: initialData.codigo,
          nombre: initialData.nombre,
          descripcion: initialData.descripcion || '',
          clasificacion: initialData.clasificacion || undefined,
          coordinadorId: initialData.coordinadorId || undefined,
          scrumMasterId: initialData.scrumMasterId || undefined,
          patrocinadorId: initialData.patrocinadorId || undefined,
          coordinacion: initialData.coordinacion || undefined,
          montoAnual: initialData.montoAnual || undefined,
          fechaInicio: initialData.fechaInicio || undefined,
          fechaFin: initialData.fechaFin || undefined,
        }
      : {
          codigo: '',
          nombre: '',
          descripcion: '',
        },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setError(null);

      if (mode === 'create') {
        await createProyecto(values);
      } else {
        await updateProyecto({ id: initialData!.id, ...values });
      }

      router.push(paths.poi.proyectos.base);
      router.refresh();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error submitting form:', err);
    }
  };

  const isLoading = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Error general */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Información básica */}
        <div className="space-y-4 p-6 border rounded-lg">
          <h3 className="font-semibold text-lg">Información Básica</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="codigo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="PRY001"
                      {...field}
                      disabled={mode === 'edit'}
                    />
                  </FormControl>
                  <FormDescription>
                    Código único del proyecto (3-20 caracteres)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clasificacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clasificación</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar clasificación" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Al ciudadano">Al ciudadano</SelectItem>
                      <SelectItem value="Gestion interna">
                        Gestión interna
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Sistema de Gestión de Proyectos"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Nombre descriptivo del proyecto (3-200 caracteres)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="descripcion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descripción detallada del proyecto..."
                    className="resize-none min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Responsables */}
        <div className="space-y-4 p-6 border rounded-lg">
          <h3 className="font-semibold text-lg">Responsables</h3>
          <p className="text-sm text-muted-foreground">
            Asigna los responsables del proyecto
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="coordinadorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coordinador</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="ID del coordinador"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scrumMasterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scrum Master</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="ID del Scrum Master"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="patrocinadorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patrocinador</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="ID del patrocinador"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Información financiera y fechas */}
        <div className="space-y-4 p-6 border rounded-lg">
          <h3 className="font-semibold text-lg">Información Adicional</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="montoAnual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto Anual (S/)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="500000"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coordinacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coordinación</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Dirección de Tecnología"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fechaInicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Inicio</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ''} />
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
                  <FormLabel>Fecha de Fin</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancelar
          </Button>

          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? 'Guardando...'
              : mode === 'create'
              ? 'Crear Proyecto'
              : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
