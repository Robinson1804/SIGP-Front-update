'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { CollapsibleSection } from './CollapsibleSection';
import { EditableList } from './EditableList';
import { DynamicTable, ColumnDefinition } from './DynamicTable';
import type { Acta, ActaEntregable, ActaRiesgo, ActaHito, ActaMiembroEquipo } from '@/features/documentos/types';

const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  objetivoSmart: z.string().optional(),
  justificacion: z.string().optional(),
  alcance: z.array(z.string()).default([]),
  fueraDeAlcance: z.array(z.string()).default([]),
  supuestos: z.array(z.string()).default([]),
  restricciones: z.array(z.string()).default([]),
  presupuestoEstimado: z.number().optional(),
  observaciones: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ActaConstitucionFormProps {
  acta?: Acta | null;
  proyectoId?: number;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export function ActaConstitucionForm({
  acta,
  proyectoId,
  onSave,
  onCancel,
  saving = false,
}: ActaConstitucionFormProps) {
  // State for complex arrays
  const [entregables, setEntregables] = useState<ActaEntregable[]>(
    acta?.entregables || []
  );
  const [riesgos, setRiesgos] = useState<ActaRiesgo[]>(acta?.riesgos || []);
  const [cronogramaHitos, setCronogramaHitos] = useState<ActaHito[]>(
    acta?.cronogramaHitos || []
  );
  const [equipoProyecto, setEquipoProyecto] = useState<ActaMiembroEquipo[]>(
    acta?.equipoProyecto || []
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: acta?.nombre || 'Acta de Constitución del Proyecto',
      fecha: acta?.fecha || new Date().toISOString().split('T')[0],
      objetivoSmart: acta?.objetivoSmart || '',
      justificacion: acta?.justificacion || '',
      alcance: acta?.alcance || [],
      fueraDeAlcance: acta?.fueraDeAlcance || [],
      supuestos: acta?.supuestos || [],
      restricciones: acta?.restricciones || [],
      presupuestoEstimado: acta?.presupuestoEstimado || undefined,
      observaciones: acta?.observaciones || '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    await onSave({
      ...values,
      entregables,
      riesgos,
      cronogramaHitos,
      equipoProyecto,
    });
  };

  // Column definitions for dynamic tables
  const entregablesColumns: ColumnDefinition<ActaEntregable>[] = [
    { key: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Nombre del entregable', required: true },
    { key: 'descripcion', label: 'Descripción', type: 'text', placeholder: 'Descripción' },
    { key: 'fechaEstimada', label: 'Fecha Estimada', type: 'date', width: '150px' },
  ];

  const riesgosColumns: ColumnDefinition<ActaRiesgo>[] = [
    { key: 'descripcion', label: 'Descripción', type: 'text', placeholder: 'Descripción del riesgo', required: true },
    {
      key: 'probabilidad',
      label: 'Probabilidad',
      type: 'select',
      options: [
        { value: 'Alta', label: 'Alta' },
        { value: 'Media', label: 'Media' },
        { value: 'Baja', label: 'Baja' },
      ],
      width: '120px',
    },
    {
      key: 'impacto',
      label: 'Impacto',
      type: 'select',
      options: [
        { value: 'Alto', label: 'Alto' },
        { value: 'Medio', label: 'Medio' },
        { value: 'Bajo', label: 'Bajo' },
      ],
      width: '120px',
    },
    { key: 'mitigacion', label: 'Mitigación', type: 'text', placeholder: 'Plan de mitigación' },
  ];

  const hitosColumns: ColumnDefinition<ActaHito>[] = [
    { key: 'nombre', label: 'Nombre del Hito', type: 'text', placeholder: 'Nombre', required: true },
    { key: 'descripcion', label: 'Descripción', type: 'text', placeholder: 'Descripción' },
    { key: 'fechaEstimada', label: 'Fecha Estimada', type: 'date', width: '150px' },
  ];

  const equipoColumns: ColumnDefinition<ActaMiembroEquipo>[] = [
    { key: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Nombre completo', required: true },
    { key: 'rol', label: 'Rol', type: 'text', placeholder: 'Rol en el proyecto', required: true },
    { key: 'responsabilidad', label: 'Responsabilidad', type: 'text', placeholder: 'Responsabilidad principal' },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Datos básicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Acta</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nombre del acta" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fecha"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Objetivo SMART */}
        <CollapsibleSection
          title="Objetivo del Proyecto"
          description="Defina el objetivo SMART del proyecto"
          required
        >
          <FormField
            control={form.control}
            name="objetivoSmart"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Describa el objetivo del proyecto de forma Específica, Medible, Alcanzable, Relevante y con Tiempo definido (SMART)"
                    rows={4}
                  />
                </FormControl>
                <FormDescription>
                  El objetivo debe ser claro y conciso, siguiendo la metodología SMART
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CollapsibleSection>

        {/* Justificación */}
        <CollapsibleSection
          title="Justificación"
          description="Explique por qué es necesario este proyecto"
        >
          <FormField
            control={form.control}
            name="justificacion"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Describa la justificación del proyecto..."
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CollapsibleSection>

        {/* Alcance */}
        <CollapsibleSection
          title="Alcance del Proyecto"
          description="Defina qué incluye y qué no incluye el proyecto"
        >
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Incluido en el Alcance</Label>
              <EditableList
                items={form.watch('alcance') || []}
                onChange={(items) => form.setValue('alcance', items)}
                placeholder="Agregar item de alcance"
                addLabel="Agregar"
              />
            </div>
            <div>
              <Label className="mb-2 block">Fuera del Alcance</Label>
              <EditableList
                items={form.watch('fueraDeAlcance') || []}
                onChange={(items) => form.setValue('fueraDeAlcance', items)}
                placeholder="Agregar exclusión"
                addLabel="Agregar"
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Entregables */}
        <CollapsibleSection
          title="Entregables Principales"
          description="Liste los entregables principales del proyecto"
        >
          <DynamicTable
            columns={entregablesColumns}
            data={entregables}
            onChange={setEntregables}
            emptyRowTemplate={{ id: '', nombre: '', descripcion: '', fechaEstimada: '' }}
            addLabel="Agregar entregable"
          />
        </CollapsibleSection>

        {/* Supuestos y Restricciones */}
        <CollapsibleSection
          title="Supuestos y Restricciones"
          description="Defina los supuestos y restricciones del proyecto"
        >
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Supuestos</Label>
              <EditableList
                items={form.watch('supuestos') || []}
                onChange={(items) => form.setValue('supuestos', items)}
                placeholder="Agregar supuesto"
                addLabel="Agregar"
              />
            </div>
            <div>
              <Label className="mb-2 block">Restricciones</Label>
              <EditableList
                items={form.watch('restricciones') || []}
                onChange={(items) => form.setValue('restricciones', items)}
                placeholder="Agregar restricción"
                addLabel="Agregar"
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Riesgos */}
        <CollapsibleSection
          title="Riesgos Identificados"
          description="Identifique los riesgos iniciales del proyecto"
        >
          <DynamicTable
            columns={riesgosColumns}
            data={riesgos}
            onChange={setRiesgos}
            emptyRowTemplate={{ id: '', descripcion: '', probabilidad: undefined, impacto: undefined, mitigacion: '' }}
            addLabel="Agregar riesgo"
          />
        </CollapsibleSection>

        {/* Presupuesto */}
        <CollapsibleSection
          title="Presupuesto Estimado"
          description="Indique el presupuesto estimado del proyecto"
        >
          <FormField
            control={form.control}
            name="presupuestoEstimado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto Estimado (S/)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="0.00"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CollapsibleSection>

        {/* Cronograma de Alto Nivel */}
        <CollapsibleSection
          title="Cronograma de Alto Nivel"
          description="Defina los hitos principales del proyecto"
        >
          <DynamicTable
            columns={hitosColumns}
            data={cronogramaHitos}
            onChange={setCronogramaHitos}
            emptyRowTemplate={{ id: '', nombre: '', descripcion: '', fechaEstimada: '' }}
            addLabel="Agregar hito"
          />
        </CollapsibleSection>

        {/* Equipo del Proyecto */}
        <CollapsibleSection
          title="Equipo del Proyecto"
          description="Defina el equipo inicial del proyecto"
        >
          <DynamicTable
            columns={equipoColumns}
            data={equipoProyecto}
            onChange={setEquipoProyecto}
            emptyRowTemplate={{ id: '', nombre: '', rol: '', responsabilidad: '' }}
            addLabel="Agregar miembro"
          />
        </CollapsibleSection>

        {/* Observaciones */}
        <CollapsibleSection
          title="Observaciones"
          description="Notas adicionales"
          defaultOpen={false}
        >
          <FormField
            control={form.control}
            name="observaciones"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Observaciones adicionales..."
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CollapsibleSection>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar Borrador
          </Button>
        </div>
      </form>
    </Form>
  );
}
