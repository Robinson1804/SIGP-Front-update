'use client';

import { useRouter, useSearchParams } from 'next/navigation';
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
import { paths } from '@/lib/paths';
import { CreateSubproyectoSchema } from '@/lib/definitions';
import type { CreateSubproyectoInput } from '@/lib/definitions';
import type { Subproyecto } from '../services/subproyectos.service';
import {
  getNextSubproyectoCodigo,
  createSubproyecto,
  updateSubproyecto,
} from '../services/subproyectos.service';
import { useState, useEffect, useMemo } from 'react';
import { apiClient, ENDPOINTS } from '@/lib/api';
import type { Proyecto } from '@/lib/definitions';
import { CalendarIcon, InfoIcon } from 'lucide-react';

type FormValues = CreateSubproyectoInput;

interface SubproyectoFormProps {
  initialData?: Subproyecto;
  mode: 'create' | 'edit';
}

export function SubproyectoForm({ initialData, mode }: SubproyectoFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [patrocinadores, setPatrocinadores] = useState<MultiSelectOption[]>([]);
  const [proyectos, setProyectos] = useState<{ id: number; codigo: string; nombre: string; fechaInicio: string | null; fechaFin: string | null }[]>([]);
  const [loadingCodigo, setLoadingCodigo] = useState(false);

  // Obtener proyectoPadreId desde query params si existe (para pre-seleccionar)
  const queryProyectoPadreId = searchParams.get('proyectoPadreId');

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateSubproyectoSchema),
    defaultValues: initialData
      ? {
          proyectoPadreId: initialData.proyectoPadreId,
          codigo: initialData.codigo,
          nombre: initialData.nombre,
          descripcion: initialData.descripcion || '',
          clasificacion: initialData.clasificacion ?? undefined,
          coordinadorId: initialData.coordinadorId ?? undefined,
          scrumMasterId: initialData.scrumMasterId ?? undefined,
          patrocinadorId: initialData.patrocinadorId ?? undefined,
          areaUsuaria: initialData.areaUsuaria || [],
          coordinacion: initialData.coordinacion ?? undefined,
          areaResponsable: initialData.areaResponsable ?? undefined,
          monto: initialData.monto ?? undefined,
          fechaInicio: initialData.fechaInicio
            ? String(initialData.fechaInicio).split('T')[0]
            : undefined,
          fechaFin: initialData.fechaFin
            ? String(initialData.fechaFin).split('T')[0]
            : undefined,
        }
      : {
          proyectoPadreId: queryProyectoPadreId
            ? parseInt(queryProyectoPadreId)
            : undefined as unknown as number,
          codigo: 'Seleccione proyecto padre...',
          nombre: '',
          descripcion: '',
          areaUsuaria: [],
        },
  });

  const selectedProyectoPadreId = form.watch('proyectoPadreId');

  // Info del proyecto padre seleccionado (incluye fechas para referencia y validación)
  const proyectoPadreInfo = useMemo(
    () => proyectos.find((p) => p.id === selectedProyectoPadreId) ?? null,
    [proyectos, selectedProyectoPadreId],
  );

  // Cargar lista de proyectos para el selector de proyecto padre
  useEffect(() => {
    apiClient
      .get(ENDPOINTS.PROYECTOS.BASE, { params: { activo: true } })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const proyectosList = data.map((p: Proyecto) => ({
          id: p.id,
          codigo: p.codigo,
          nombre: p.nombre,
          fechaInicio: p.fechaInicio ? String(p.fechaInicio).split('T')[0] : null,
          fechaFin: p.fechaFin ? String(p.fechaFin).split('T')[0] : null,
        }));
        setProyectos(proyectosList);
      })
      .catch(() => {
        setProyectos([]);
      });
  }, []);

  // Cargar patrocinadores para el MultiSelect de Area Usuaria
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

  // Cargar el proximo codigo disponible cuando se selecciona un proyecto padre
  useEffect(() => {
    if (mode === 'create' && selectedProyectoPadreId) {
      setLoadingCodigo(true);
      getNextSubproyectoCodigo(selectedProyectoPadreId)
        .then((codigo) => {
          form.setValue('codigo', codigo);
        })
        .catch(() => {
          form.setValue('codigo', 'Error al obtener codigo');
        })
        .finally(() => {
          setLoadingCodigo(false);
        });
    }
  }, [mode, selectedProyectoPadreId, form]);

  // Resetear el formulario cuando cambian los datos en modo edicion
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      form.reset({
        proyectoPadreId: initialData.proyectoPadreId,
        codigo: initialData.codigo,
        nombre: initialData.nombre,
        descripcion: initialData.descripcion || '',
        clasificacion: initialData.clasificacion ?? undefined,
        coordinadorId: initialData.coordinadorId ?? undefined,
        scrumMasterId: initialData.scrumMasterId ?? undefined,
        patrocinadorId: initialData.patrocinadorId ?? undefined,
        areaUsuaria: initialData.areaUsuaria || [],
        coordinacion: initialData.coordinacion ?? undefined,
        areaResponsable: initialData.areaResponsable ?? undefined,
        monto: initialData.monto ?? undefined,
        fechaInicio: initialData.fechaInicio
          ? String(initialData.fechaInicio).split('T')[0]
          : undefined,
        fechaFin: initialData.fechaFin
          ? String(initialData.fechaFin).split('T')[0]
          : undefined,
      });
    }
  }, [mode, initialData, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      setError(null);

      if (mode === 'create') {
        // No enviar codigo, el backend lo genera automaticamente
        const { codigo, ...dataWithoutCodigo } = values;
        await createSubproyecto(dataWithoutCodigo);
      } else {
        // En edicion no se envia el codigo ni proyectoPadreId (no son editables)
        const { codigo, proyectoPadreId, ...dataWithoutReadonly } = values;
        await updateSubproyecto(initialData!.id, dataWithoutReadonly);
      }

      router.push(paths.poi.subproyectos.base);
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

        {/* Proyecto Padre */}
        <div className="space-y-4 p-6 border rounded-lg">
          <h3 className="font-semibold text-lg">Proyecto Padre</h3>
          <p className="text-sm text-muted-foreground">
            Selecciona el proyecto al que pertenece este subproyecto
          </p>

          <FormField
            control={form.control}
            name="proyectoPadreId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proyecto Padre *</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value ? String(field.value) : ''}
                  disabled={mode === 'edit'}
                >
                  <FormControl>
                    <SelectTrigger className={mode === 'edit' ? 'bg-muted' : ''}>
                      <SelectValue placeholder="Seleccionar proyecto padre" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {proyectos.map((proyecto) => (
                      <SelectItem key={proyecto.id} value={String(proyecto.id)}>
                        {proyecto.codigo} - {proyecto.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {mode === 'edit'
                    ? 'El proyecto padre no puede modificarse'
                    : 'El subproyecto se creara dentro del proyecto seleccionado'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Etiqueta de rango de fechas del proyecto padre */}
          {proyectoPadreInfo && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Rango de fechas del proyecto:</span>
              {proyectoPadreInfo.fechaInicio && proyectoPadreInfo.fechaFin ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-3 py-0.5 text-xs font-medium text-blue-700">
                  <CalendarIcon className="h-3 w-3" />
                  {new Date(proyectoPadreInfo.fechaInicio + 'T12:00:00').toLocaleDateString('es-PE', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                  {' — '}
                  {new Date(proyectoPadreInfo.fechaFin + 'T12:00:00').toLocaleDateString('es-PE', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-3 py-0.5 text-xs font-medium text-amber-700">
                  Sin fechas definidas
                </span>
              )}
            </div>
          )}
        </div>

        {/* Informacion basica */}
        <div className="space-y-4 p-6 border rounded-lg">
          <h3 className="font-semibold text-lg">Informacion Basica</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="codigo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Codigo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="SUBPROY N X"
                      {...field}
                      disabled={true}
                      className="bg-muted"
                    />
                  </FormControl>
                  <FormDescription>
                    {loadingCodigo
                      ? 'Obteniendo codigo...'
                      : 'Codigo autogenerado del subproyecto'}
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
                  <FormLabel>Clasificacion</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar clasificacion" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Al ciudadano">Al ciudadano</SelectItem>
                      <SelectItem value="Gestion interna">
                        Gestion interna
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
                    placeholder="Nombre del subproyecto"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Nombre descriptivo del subproyecto (3-200 caracteres)
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
                <FormLabel>Descripcion</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descripcion detallada del subproyecto..."
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
            Asigna los responsables del subproyecto
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

          <FormField
            control={form.control}
            name="areaUsuaria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Area Usuaria</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={patrocinadores}
                    selected={field.value?.map(String) || []}
                    onChange={(selected) =>
                      field.onChange(selected.map(Number))
                    }
                    placeholder="Seleccionar patrocinadores"
                  />
                </FormControl>
                <FormDescription>
                  Patrocinadores asignados al subproyecto como Area Usuaria
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Fechas del subproyecto */}
        <div className="space-y-4 p-6 border rounded-lg">
          <h3 className="font-semibold text-lg">Fechas del Subproyecto</h3>

          {/* Referencia de fechas del proyecto padre */}
          {proyectoPadreInfo && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-blue-50 border border-blue-200 text-sm text-blue-800">
              <InfoIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Rango del proyecto padre:</span>{' '}
                {proyectoPadreInfo.fechaInicio && proyectoPadreInfo.fechaFin ? (
                  <>
                    {new Date(proyectoPadreInfo.fechaInicio + 'T12:00:00').toLocaleDateString(
                      'es-PE',
                      { day: '2-digit', month: 'long', year: 'numeric' },
                    )}{' '}
                    —{' '}
                    {new Date(proyectoPadreInfo.fechaFin + 'T12:00:00').toLocaleDateString('es-PE', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </>
                ) : (
                  <span className="text-blue-600 italic">Sin fechas definidas en el proyecto padre</span>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="fechaInicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <CalendarIcon className="inline h-3.5 w-3.5 mr-1" />
                    Fecha de Inicio
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value || ''}
                      min={proyectoPadreInfo?.fechaInicio ?? undefined}
                      max={proyectoPadreInfo?.fechaFin ?? undefined}
                    />
                  </FormControl>
                  {proyectoPadreInfo?.fechaInicio && (
                    <FormDescription>
                      Mínimo: {new Date(proyectoPadreInfo.fechaInicio + 'T12:00:00').toLocaleDateString('es-PE')}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fechaFin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <CalendarIcon className="inline h-3.5 w-3.5 mr-1" />
                    Fecha de Fin
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value || ''}
                      min={form.watch('fechaInicio') || proyectoPadreInfo?.fechaInicio || undefined}
                      max={proyectoPadreInfo?.fechaFin ?? undefined}
                    />
                  </FormControl>
                  {proyectoPadreInfo?.fechaFin && (
                    <FormDescription>
                      Máximo: {new Date(proyectoPadreInfo.fechaFin + 'T12:00:00').toLocaleDateString('es-PE')}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Informacion adicional */}
        <div className="space-y-4 p-6 border rounded-lg">
          <h3 className="font-semibold text-lg">Informacion Adicional</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="monto"
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
                  <FormLabel>Coordinacion</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Direccion de Tecnologia"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="areaResponsable"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Area Responsable</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Area responsable del subproyecto"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Botones de accion */}
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
              ? 'Crear Subproyecto'
              : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
