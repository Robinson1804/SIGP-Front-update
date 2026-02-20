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
import { MultiSelect } from '@/components/ui/multi-select';
import type { MultiSelectOption } from '@/components/ui/multi-select';
import { createProyecto, updateProyecto } from '@/lib/actions';
import { paths } from '@/lib/paths';
import { CreateProyectoSchema } from '@/lib/definitions';
import type { Proyecto, CreateProyectoInput } from '@/lib/definitions';
import { useState, useEffect } from 'react';
import { getNextProyectoCodigo } from '../services/proyectos.service';
import { apiClient, ENDPOINTS } from '@/lib/api';

type FormValues = CreateProyectoInput;

interface ProyectoFormProps {
  initialData?: Proyecto;
  mode: 'create' | 'edit';
}

export function ProyectoForm({ initialData, mode }: ProyectoFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [patrocinadores, setPatrocinadores] = useState<MultiSelectOption[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateProyectoSchema),
    defaultValues: initialData
      ? {
          codigo: initialData.codigo,
          nombre: initialData.nombre,
          descripcion: initialData.descripcion || '',
          // Asegurar que clasificacion sea el valor exacto del backend o undefined
          clasificacion: initialData.clasificacion ?? undefined,
          coordinadorId: initialData.coordinadorId ?? undefined,
          scrumMasterId: initialData.scrumMasterId ?? undefined,
          areaUsuariaId: initialData.areaUsuariaId ?? undefined,
          coordinacion: initialData.coordinacion ?? undefined,
          montoAnual: initialData.montoAnual ?? undefined,
        }
      : {
          codigo: 'Cargando...',
          nombre: '',
          descripcion: '',
          areaUsuariaId: undefined,
        },
  });

  // Cargar patrocinadores para el MultiSelect de Área Usuaria
  useEffect(() => {
    apiClient
      .get(ENDPOINTS.RRHH.PERSONAL_PATROCINADORES)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        const options: MultiSelectOption[] = data.map(
          (p: { usuarioId?: number; id: number; apellidos: string; nombres: string }) => ({
            value: String(p.usuarioId || p.id),
            label: `${p.apellidos}, ${p.nombres}`,
          }),
        );
        setPatrocinadores(options);
      })
      .catch(() => {
        setPatrocinadores([]);
      });
  }, []);

  // Cargar el próximo código disponible en modo crear
  useEffect(() => {
    if (mode === 'create') {
      getNextProyectoCodigo()
        .then((codigo) => {
          form.setValue('codigo', codigo);
        })
        .catch(() => {
          form.setValue('codigo', 'Error al obtener código');
        });
    }
  }, [mode, form]);

  // Resetear el formulario cuando cambian los datos en modo edición
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      form.reset({
        codigo: initialData.codigo,
        nombre: initialData.nombre,
        descripcion: initialData.descripcion || '',
        clasificacion: initialData.clasificacion ?? undefined,
        coordinadorId: initialData.coordinadorId ?? undefined,
        scrumMasterId: initialData.scrumMasterId ?? undefined,
        areaUsuariaId: initialData.areaUsuariaId ?? undefined,
        coordinacion: initialData.coordinacion ?? undefined,
        montoAnual: initialData.montoAnual ?? undefined,
      });
    }
  }, [mode, initialData, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      setError(null);

      if (mode === 'create') {
        // No enviar codigo, el backend lo genera automáticamente
        const { codigo, ...dataWithoutCodigo } = values;
        await createProyecto(dataWithoutCodigo);
      } else {
        // En edición tampoco se envía el código (no es editable)
        const { codigo, ...dataWithoutCodigo } = values;
        await updateProyecto({ id: initialData!.id, ...dataWithoutCodigo });
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
                  <FormLabel>Código</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="PROY N°X"
                      {...field}
                      disabled={true}
                      className="bg-muted"
                    />
                  </FormControl>
                  <FormDescription>
                    Código autogenerado del proyecto
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
                    value={field.value || ''}
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

          </div>

          <FormField
            control={form.control}
            name="areaUsuariaId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Área Usuaria (Patrocinador)</FormLabel>
                <Select
                  onValueChange={(value) => {
                    const numValue = parseInt(value, 10);
                    field.onChange(isNaN(numValue) ? undefined : numValue);
                  }}
                  value={field.value ? String(field.value) : undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar patrocinador" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {patrocinadores.map((pat) => (
                      <SelectItem key={pat.value} value={pat.value}>
                        {pat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Patrocinador del proyecto (Área Usuaria)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
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
                  <FormLabel>Monto Total (S/)</FormLabel>
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
