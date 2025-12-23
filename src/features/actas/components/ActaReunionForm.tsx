'use client';

import { useState, useMemo } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CollapsibleSection } from './CollapsibleSection';
import { DynamicTable, ColumnDefinition } from './DynamicTable';
import type {
  Acta,
  TipoReunion,
  Modalidad,
  ActaParticipante,
  ActaAgendaItem,
  ActaTemaDesarrollado,
  ActaAcuerdo,
  ActaProximoPaso,
  ActaAnexo,
} from '@/features/documentos/types';

const TIPOS_REUNION: { value: TipoReunion; label: string }[] = [
  { value: 'Planificacion', label: 'Planificacion' },
  { value: 'Seguimiento', label: 'Seguimiento' },
  { value: 'Revision', label: 'Revision' },
  { value: 'Retrospectiva', label: 'Retrospectiva' },
  { value: 'Tecnica', label: 'Tecnica' },
  { value: 'Otro', label: 'Otro' },
];

const MODALIDADES: { value: Modalidad; label: string }[] = [
  { value: 'Presencial', label: 'Presencial' },
  { value: 'Virtual', label: 'Virtual' },
  { value: 'Hibrida', label: 'Hibrida' },
];

const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  tipoReunion: z.string().min(1, 'El tipo de reunion es requerido'),
  fasePerteneciente: z.string().optional(),
  horaInicio: z.string().optional(),
  horaFin: z.string().optional(),
  modalidad: z.string().optional(),
  lugarLink: z.string().optional(),
  moderadorId: z.number().optional(),
  observaciones: z.string().optional(),
  proximaReunionFecha: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Helper para asegurar que un valor sea un array
function ensureArray<T>(value: T[] | string | null | undefined): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

interface ActaReunionFormProps {
  acta?: Acta | null;
  proyectoId: number;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export function ActaReunionForm({
  acta,
  proyectoId,
  onSave,
  onCancel,
  saving = false,
}: ActaReunionFormProps) {
  // State for complex arrays - normalized with ensureArray
  const [asistentes, setAsistentes] = useState<ActaParticipante[]>(
    ensureArray(acta?.asistentes)
  );
  const [ausentes, setAusentes] = useState<ActaParticipante[]>(
    ensureArray(acta?.ausentes)
  );
  const [agenda, setAgenda] = useState<ActaAgendaItem[]>(
    ensureArray(acta?.agenda)
  );
  const [temasDesarrollados, setTemasDesarrollados] = useState<ActaTemaDesarrollado[]>(
    ensureArray(acta?.temasDesarrollados)
  );
  const [acuerdos, setAcuerdos] = useState<ActaAcuerdo[]>(
    ensureArray(acta?.acuerdos)
  );
  const [proximosPasos, setProximosPasos] = useState<ActaProximoPaso[]>(
    ensureArray(acta?.proximosPasos)
  );
  const [anexosReferenciados, setAnexosReferenciados] = useState<ActaAnexo[]>(
    ensureArray(acta?.anexosReferenciados)
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: acta?.nombre || '',
      fecha: acta?.fecha || new Date().toISOString().split('T')[0],
      tipoReunion: acta?.tipoReunion || '',
      fasePerteneciente: acta?.fasePerteneciente || '',
      horaInicio: acta?.horaInicio || '',
      horaFin: acta?.horaFin || '',
      modalidad: acta?.modalidad || '',
      lugarLink: acta?.lugarLink || '',
      observaciones: acta?.observaciones || '',
      proximaReunionFecha: acta?.proximaReunionFecha || '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    await onSave({
      ...values,
      asistentes,
      ausentes,
      agenda,
      temasDesarrollados,
      acuerdos,
      proximosPasos,
      anexosReferenciados,
    });
  };

  // Column definitions for tables
  const asistentesColumns: ColumnDefinition<ActaParticipante>[] = [
    { key: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Nombre completo', required: true },
    { key: 'cargo', label: 'Cargo', type: 'text', placeholder: 'Cargo' },
    { key: 'organizacion', label: 'Organizacion', type: 'text', placeholder: 'Direccion/Area' },
  ];

  const ausentesColumns: ColumnDefinition<ActaParticipante>[] = [
    { key: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Nombre completo', required: true },
    { key: 'cargo', label: 'Cargo', type: 'text', placeholder: 'Cargo' },
    { key: 'motivo', label: 'Motivo', type: 'text', placeholder: 'Motivo de ausencia' },
  ];

  const agendaColumns: ColumnDefinition<ActaAgendaItem>[] = [
    { key: 'tema', label: 'Tema', type: 'text', placeholder: 'Punto de agenda', required: true },
    { key: 'descripcion', label: 'Descripcion', type: 'text', placeholder: 'Descripcion breve' },
  ];

  const temasColumns: ColumnDefinition<ActaTemaDesarrollado>[] = [
    { key: 'tema', label: 'Tema', type: 'text', placeholder: 'Tema tratado', required: true },
    { key: 'notas', label: 'Notas', type: 'textarea', placeholder: 'Notas del tema' },
    { key: 'conclusiones', label: 'Conclusiones', type: 'textarea', placeholder: 'Conclusiones' },
  ];

  const acuerdosColumns: ColumnDefinition<ActaAcuerdo>[] = [
    { key: 'descripcion', label: 'Descripcion', type: 'text', placeholder: 'Descripcion del acuerdo', required: true },
    {
      key: 'prioridad',
      label: 'Prioridad',
      type: 'select',
      options: [
        { value: 'Alta', label: 'Alta' },
        { value: 'Media', label: 'Media' },
        { value: 'Baja', label: 'Baja' },
      ],
      width: '120px',
    },
    { key: 'fechaCompromiso', label: 'Fecha Compromiso', type: 'date', width: '150px' },
  ];

  const proximosPasosColumns: ColumnDefinition<ActaProximoPaso>[] = [
    { key: 'descripcion', label: 'Descripcion', type: 'text', placeholder: 'Descripcion de la accion', required: true },
    { key: 'responsableNombre', label: 'Responsable', type: 'text', placeholder: 'Nombre del responsable' },
    { key: 'fechaLimite', label: 'Fecha Limite', type: 'date', width: '150px' },
  ];

  const anexosColumns: ColumnDefinition<ActaAnexo>[] = [
    { key: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Nombre del anexo', required: true },
    { key: 'url', label: 'URL', type: 'text', placeholder: 'URL del documento' },
    { key: 'descripcion', label: 'Descripcion', type: 'text', placeholder: 'Descripcion' },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Datos Generales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la Reunion</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ej: Reunion de planificacion Sprint 1" />
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tipoReunion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Reunion</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIPOS_REUNION.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
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
            name="fasePerteneciente"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fase del Proyecto</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ej: Analisis, Desarrollo, Pruebas" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="horaInicio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora de Inicio</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="horaFin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora de Fin</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="modalidad"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modalidad</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar modalidad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MODALIDADES.map((mod) => (
                      <SelectItem key={mod.value} value={mod.value}>
                        {mod.label}
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
            name="lugarLink"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lugar / Link</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Sala de reuniones / URL de Meet" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Asistentes y Ausentes */}
        <CollapsibleSection
          title="Asistentes y Ausentes"
          description="Registre los participantes de la reunion"
        >
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold mb-3 block">Asistentes</Label>
              <DynamicTable
                columns={asistentesColumns}
                data={asistentes}
                onChange={setAsistentes}
                emptyRowTemplate={{ id: '', nombre: '', cargo: '', organizacion: '' }}
                addLabel="Agregar asistente"
              />
            </div>
            <div>
              <Label className="text-base font-semibold mb-3 block">Ausentes</Label>
              <DynamicTable
                columns={ausentesColumns}
                data={ausentes}
                onChange={setAusentes}
                emptyRowTemplate={{ id: '', nombre: '', cargo: '', motivo: '' }}
                addLabel="Agregar ausente"
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Agenda */}
        <CollapsibleSection
          title="Agenda"
          description="Puntos a tratar en la reunion"
        >
          <DynamicTable
            columns={agendaColumns}
            data={agenda}
            onChange={setAgenda}
            emptyRowTemplate={{ id: '', tema: '', descripcion: '' }}
            addLabel="Agregar punto de agenda"
          />
        </CollapsibleSection>

        {/* Temas Desarrollados */}
        <CollapsibleSection
          title="Temas Desarrollados"
          description="Detalle de los temas tratados durante la reunion"
        >
          <DynamicTable
            columns={temasColumns}
            data={temasDesarrollados}
            onChange={setTemasDesarrollados}
            emptyRowTemplate={{ id: '', tema: '', notas: '', conclusiones: '' }}
            addLabel="Agregar tema"
          />
        </CollapsibleSection>

        {/* Acuerdos */}
        <CollapsibleSection
          title="Acuerdos y Compromisos"
          description="Compromisos adquiridos durante la reunion"
        >
          <DynamicTable
            columns={acuerdosColumns}
            data={acuerdos}
            onChange={setAcuerdos}
            emptyRowTemplate={{ id: '', descripcion: '', prioridad: undefined, fechaCompromiso: '' }}
            addLabel="Agregar acuerdo"
          />
        </CollapsibleSection>

        {/* Proximos Pasos */}
        <CollapsibleSection
          title="Proximos Pasos"
          description="Acciones pendientes y responsables"
        >
          <DynamicTable
            columns={proximosPasosColumns}
            data={proximosPasos}
            onChange={setProximosPasos}
            emptyRowTemplate={{ id: '', descripcion: '', responsableNombre: '', fechaLimite: '' }}
            addLabel="Agregar accion"
          />
        </CollapsibleSection>

        {/* Observaciones y Anexos */}
        <CollapsibleSection
          title="Observaciones y Anexos"
          description="Notas adicionales y documentos referenciados"
        >
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Observaciones adicionales de la reunion..."
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Label className="text-base font-semibold mb-3 block">Anexos Referenciados</Label>
              <DynamicTable
                columns={anexosColumns}
                data={anexosReferenciados}
                onChange={setAnexosReferenciados}
                emptyRowTemplate={{ id: '', nombre: '', url: '', descripcion: '' }}
                addLabel="Agregar anexo"
              />
            </div>

            <FormField
              control={form.control}
              name="proximaReunionFecha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proxima Reunion Programada</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>Fecha de la proxima reunion (opcional)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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
            Guardar Acta
          </Button>
        </div>
      </form>
    </Form>
  );
}
