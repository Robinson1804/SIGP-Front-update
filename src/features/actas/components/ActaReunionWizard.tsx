'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Save,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { EditableList } from './EditableList';
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

const STEPS = [
  { id: 1, title: 'Datos Generales', description: 'Información básica de la reunión' },
  { id: 2, title: 'Asistentes', description: 'Participantes y ausentes' },
  { id: 3, title: 'Agenda', description: 'Puntos a tratar' },
  { id: 4, title: 'Desarrollo', description: 'Temas desarrollados' },
  { id: 5, title: 'Acuerdos', description: 'Compromisos adquiridos' },
  { id: 6, title: 'Próximos Pasos', description: 'Acciones pendientes' },
  { id: 7, title: 'Observaciones', description: 'Notas finales y anexos' },
];

const TIPOS_REUNION: { value: TipoReunion; label: string }[] = [
  { value: 'Planificacion', label: 'Planificación' },
  { value: 'Seguimiento', label: 'Seguimiento' },
  { value: 'Revision', label: 'Revisión' },
  { value: 'Retrospectiva', label: 'Retrospectiva' },
  { value: 'Tecnica', label: 'Técnica' },
  { value: 'Otro', label: 'Otro' },
];

const MODALIDADES: { value: Modalidad; label: string }[] = [
  { value: 'Presencial', label: 'Presencial' },
  { value: 'Virtual', label: 'Virtual' },
  { value: 'Hibrida', label: 'Híbrida' },
];

const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  tipoReunion: z.string().min(1, 'El tipo de reunión es requerido'),
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

interface ActaReunionWizardProps {
  acta?: Acta | null;
  proyectoId: number;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export function ActaReunionWizard({
  acta,
  proyectoId,
  onSave,
  onCancel,
  saving = false,
}: ActaReunionWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);

  // State for complex arrays
  const [asistentes, setAsistentes] = useState<ActaParticipante[]>(
    acta?.asistentes || []
  );
  const [ausentes, setAusentes] = useState<ActaParticipante[]>(
    acta?.ausentes || []
  );
  const [agenda, setAgenda] = useState<ActaAgendaItem[]>(acta?.agenda || []);
  const [temasDesarrollados, setTemasDesarrollados] = useState<ActaTemaDesarrollado[]>(
    acta?.temasDesarrollados || []
  );
  const [acuerdos, setAcuerdos] = useState<ActaAcuerdo[]>(acta?.acuerdos || []);
  const [proximosPasos, setProximosPasos] = useState<ActaProximoPaso[]>(
    acta?.proximosPasos || []
  );
  const [anexosReferenciados, setAnexosReferenciados] = useState<ActaAnexo[]>(
    acta?.anexosReferenciados || []
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

  // Sincronizar estado con el acta cuando cambie (importante para edición)
  useEffect(() => {
    if (acta) {
      // Sincronizar arrays
      setAsistentes(acta.asistentes || []);
      setAusentes(acta.ausentes || []);
      setAgenda(acta.agenda || []);
      setTemasDesarrollados(acta.temasDesarrollados || []);
      setAcuerdos(acta.acuerdos || []);
      setProximosPasos(acta.proximosPasos || []);
      setAnexosReferenciados(acta.anexosReferenciados || []);
      // Sincronizar campos del formulario
      form.reset({
        nombre: acta.nombre || '',
        fecha: acta.fecha || new Date().toISOString().split('T')[0],
        tipoReunion: acta.tipoReunion || '',
        fasePerteneciente: acta.fasePerteneciente || '',
        horaInicio: acta.horaInicio || '',
        horaFin: acta.horaFin || '',
        modalidad: acta.modalidad || '',
        lugarLink: acta.lugarLink || '',
        observaciones: acta.observaciones || '',
        proximaReunionFecha: acta.proximaReunionFecha || '',
      });
    }
  }, [acta, form]);

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

  const goToNextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Column definitions for tables
  const asistentesColumns: ColumnDefinition<ActaParticipante>[] = [
    { key: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Nombre completo', required: true },
    { key: 'cargo', label: 'Cargo', type: 'text', placeholder: 'Cargo' },
    { key: 'organizacion', label: 'Organización', type: 'text', placeholder: 'Dirección/Área' },
  ];

  const ausentesColumns: ColumnDefinition<ActaParticipante>[] = [
    { key: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Nombre completo', required: true },
    { key: 'cargo', label: 'Cargo', type: 'text', placeholder: 'Cargo' },
    { key: 'motivo', label: 'Motivo', type: 'text', placeholder: 'Motivo de ausencia' },
  ];

  const agendaColumns: ColumnDefinition<ActaAgendaItem>[] = [
    { key: 'tema', label: 'Tema', type: 'text', placeholder: 'Punto de agenda', required: true },
    { key: 'descripcion', label: 'Descripción', type: 'text', placeholder: 'Descripción breve' },
  ];

  const temasColumns: ColumnDefinition<ActaTemaDesarrollado>[] = [
    { key: 'tema', label: 'Tema', type: 'text', placeholder: 'Tema tratado', required: true },
    { key: 'notas', label: 'Notas', type: 'textarea', placeholder: 'Notas del tema' },
    { key: 'conclusiones', label: 'Conclusiones', type: 'textarea', placeholder: 'Conclusiones' },
  ];

  const acuerdosColumns: ColumnDefinition<ActaAcuerdo>[] = [
    { key: 'descripcion', label: 'Descripción', type: 'text', placeholder: 'Descripción del acuerdo', required: true },
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
    { key: 'descripcion', label: 'Descripción', type: 'text', placeholder: 'Descripción de la acción', required: true },
    { key: 'responsableNombre', label: 'Responsable', type: 'text', placeholder: 'Nombre del responsable' },
    { key: 'fechaLimite', label: 'Fecha Límite', type: 'date', width: '150px' },
  ];

  const anexosColumns: ColumnDefinition<ActaAnexo>[] = [
    { key: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Nombre del anexo', required: true },
    { key: 'url', label: 'URL', type: 'text', placeholder: 'URL del documento' },
    { key: 'descripcion', label: 'Descripción', type: 'text', placeholder: 'Descripción' },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            {/* Leyenda de campos requeridos */}
            <div className="bg-muted/50 border rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">
                <span className="text-red-500 font-medium">*</span> Los campos marcados con asterisco son obligatorios
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nombre de la Reunión <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej: Reunión de planificación Sprint 1" />
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
                    <FormLabel>
                      Fecha <span className="text-red-500">*</span>
                    </FormLabel>
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
                    <FormLabel>
                      Tipo de Reunión <span className="text-red-500">*</span>
                    </FormLabel>
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
                      <Input {...field} placeholder="Ej: Análisis, Desarrollo, Pruebas" />
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
          </div>
        );

      case 2:
        return (
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
        );

      case 3:
        return (
          <div className="space-y-4">
            <Label className="text-base font-semibold mb-3 block">Puntos de Agenda</Label>
            <DynamicTable
              columns={agendaColumns}
              data={agenda}
              onChange={setAgenda}
              emptyRowTemplate={{ id: '', tema: '', descripcion: '' }}
              addLabel="Agregar punto de agenda"
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <Label className="text-base font-semibold mb-3 block">Temas Desarrollados</Label>
            <DynamicTable
              columns={temasColumns}
              data={temasDesarrollados}
              onChange={setTemasDesarrollados}
              emptyRowTemplate={{ id: '', tema: '', notas: '', conclusiones: '' }}
              addLabel="Agregar tema"
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <Label className="text-base font-semibold mb-3 block">Acuerdos y Compromisos</Label>
            <DynamicTable
              columns={acuerdosColumns}
              data={acuerdos}
              onChange={setAcuerdos}
              emptyRowTemplate={{ id: '', descripcion: '', prioridad: undefined, fechaCompromiso: '' }}
              addLabel="Agregar acuerdo"
            />
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <Label className="text-base font-semibold mb-3 block">Próximos Pasos</Label>
            <DynamicTable
              columns={proximosPasosColumns}
              data={proximosPasos}
              onChange={setProximosPasos}
              emptyRowTemplate={{ id: '', descripcion: '', responsableNombre: '', fechaLimite: '' }}
              addLabel="Agregar acción"
            />
          </div>
        );

      case 7:
        return (
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
                      placeholder="Observaciones adicionales de la reunión..."
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
                  <FormLabel>Próxima Reunión Programada</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>Fecha de la próxima reunión (opcional)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                type="button"
                onClick={() => setCurrentStep(step.id)}
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors',
                  currentStep === step.id
                    ? 'bg-primary text-primary-foreground'
                    : currentStep > step.id
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
              </button>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-12 h-0.5 mx-2',
                    currentStep > step.id ? 'bg-primary/50' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Info */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold">{STEPS[currentStep - 1].title}</h3>
          <p className="text-sm text-muted-foreground">
            {STEPS[currentStep - 1].description}
          </p>
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">{renderStepContent()}</div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={goToPrevStep}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            {currentStep < STEPS.length ? (
              <Button type="button" onClick={goToNextStep}>
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar Acta
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}
