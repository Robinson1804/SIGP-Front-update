'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Loader2, X, UserPlus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
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
import { getPersonal, type Personal } from '@/features/rrhh';

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

const FASES_PROYECTO: { value: string; label: string }[] = [
  { value: 'Analisis', label: 'Analisis' },
  { value: 'Diseno', label: 'Diseño' },
  { value: 'Desarrollo', label: 'Desarrollo' },
  { value: 'Pruebas', label: 'Pruebas' },
  { value: 'Implementacion', label: 'Implementacion' },
  { value: 'Mantenimiento', label: 'Mantenimiento' },
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

  // Estado para errores de validación de arrays
  const [arrayErrors, setArrayErrors] = useState<{
    asistentes?: string;
    agenda?: string;
    temasDesarrollados?: string;
    acuerdos?: string;
  }>({});

  // Estado para selección de personal
  const [personalList, setPersonalList] = useState<Personal[]>([]);
  const [loadingPersonal, setLoadingPersonal] = useState(false);
  const [showPersonalDialog, setShowPersonalDialog] = useState<'asistentes' | 'ausentes' | null>(null);
  const [selectedPersonalIds, setSelectedPersonalIds] = useState<Set<number>>(new Set());

  // Cargar lista de personal al montar el componente
  useEffect(() => {
    const loadPersonal = async () => {
      setLoadingPersonal(true);
      try {
        const data = await getPersonal({ activo: true });
        setPersonalList(data);
      } catch (error) {
        console.error('Error loading personal:', error);
      } finally {
        setLoadingPersonal(false);
      }
    };
    loadPersonal();
  }, []);

  // Función para agregar personal seleccionado a la lista
  const handleAddSelectedPersonal = () => {
    if (!showPersonalDialog) return;

    const selectedPeople = personalList.filter(p => selectedPersonalIds.has(p.id));
    const newParticipants: ActaParticipante[] = selectedPeople.map(p => ({
      id: `personal-${p.id}`,
      nombre: `${p.nombres} ${p.apellidos}`.trim(),
      cargo: p.cargo || '',
      organizacion: p.division?.nombre || '',
      usuarioId: p.usuarioId,
    }));

    if (showPersonalDialog === 'asistentes') {
      setAsistentes(prev => [...prev, ...newParticipants]);
    } else {
      // Para ausentes, incluir campo motivo
      const ausentesWithMotivo = newParticipants.map(p => ({ ...p, motivo: '' }));
      setAusentes(prev => [...prev, ...ausentesWithMotivo]);
    }

    setSelectedPersonalIds(new Set());
    setShowPersonalDialog(null);
  };

  // Toggle selección de personal
  const togglePersonalSelection = (personalId: number) => {
    setSelectedPersonalIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(personalId)) {
        newSet.delete(personalId);
      } else {
        newSet.add(personalId);
      }
      return newSet;
    });
  };

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
      setAsistentes(ensureArray(acta.asistentes));
      setAusentes(ensureArray(acta.ausentes));
      setAgenda(ensureArray(acta.agenda));
      setTemasDesarrollados(ensureArray(acta.temasDesarrollados));
      setAcuerdos(ensureArray(acta.acuerdos));
      setProximosPasos(ensureArray(acta.proximosPasos));
      setAnexosReferenciados(ensureArray(acta.anexosReferenciados));
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

  // Validar arrays requeridos
  const validateArrays = (): boolean => {
    const errors: typeof arrayErrors = {};
    let isValid = true;

    // Filtrar items con datos válidos (no vacíos)
    const asistentesValidos = asistentes.filter(a => a.nombre?.trim());
    const agendaValida = agenda.filter(a => a.tema?.trim());
    const temasValidos = temasDesarrollados.filter(t => t.tema?.trim());
    const acuerdosValidos = acuerdos.filter(a => a.descripcion?.trim());

    if (asistentesValidos.length === 0) {
      errors.asistentes = 'Debe incluir al menos un asistente';
      isValid = false;
    }

    if (agendaValida.length === 0) {
      errors.agenda = 'Debe incluir al menos un tema en la agenda';
      isValid = false;
    }

    if (temasValidos.length === 0) {
      errors.temasDesarrollados = 'Debe incluir al menos un tema desarrollado';
      isValid = false;
    }

    if (acuerdosValidos.length === 0) {
      errors.acuerdos = 'Debe incluir al menos un acuerdo';
      isValid = false;
    }

    setArrayErrors(errors);
    return isValid;
  };

  const onSubmit = async (values: FormValues) => {
    // Limpiar errores previos
    setArrayErrors({});

    // Validar arrays requeridos
    if (!validateArrays()) {
      return;
    }

    // Filtrar items vacíos antes de enviar
    const asistentesValidos = asistentes.filter(a => a.nombre?.trim());
    const ausentesValidos = ausentes.filter(a => a.nombre?.trim());
    const agendaValida = agenda.filter(a => a.tema?.trim());
    const temasValidos = temasDesarrollados.filter(t => t.tema?.trim());
    const acuerdosValidos = acuerdos.filter(a => a.descripcion?.trim());
    const proximosPasosValidos = proximosPasos.filter(p => p.descripcion?.trim());
    const anexosValidos = anexosReferenciados.filter(a => a.nombre?.trim());

    await onSave({
      ...values,
      // Si proximaReunionFecha está vacío, enviar null en lugar de string vacío
      proximaReunionFecha: values.proximaReunionFecha || null,
      asistentes: asistentesValidos,
      ausentes: ausentesValidos,
      agenda: agendaValida,
      temasDesarrollados: temasValidos,
      acuerdos: acuerdosValidos,
      proximosPasos: proximosPasosValidos,
      anexosReferenciados: anexosValidos,
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
        {/* Leyenda de campos requeridos */}
        <div className="bg-muted/50 border rounded-lg p-3 text-sm">
          <p className="text-muted-foreground">
            <span className="text-red-500 font-medium">*</span> Los campos marcados con asterisco son obligatorios
          </p>
        </div>

        {/* Datos Generales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Nombre de la Reunion <span className="text-red-500">*</span>
                </FormLabel>
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
                  Tipo de Reunion <span className="text-red-500">*</span>
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar fase" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {FASES_PROYECTO.map((fase) => (
                      <SelectItem key={fase.value} value={fase.value}>
                        {fase.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          title={<>Asistentes y Ausentes <span className="text-red-500">*</span></>}
          description="Registre los participantes de la reunion (minimo 1 asistente requerido)"
        >
          <div className="space-y-6">
            {arrayErrors.asistentes && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{arrayErrors.asistentes}</AlertDescription>
              </Alert>
            )}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">
                  Asistentes <span className="text-red-500">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPersonalDialog('asistentes')}
                  disabled={loadingPersonal}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Agregar del Personal
                </Button>
              </div>
              <DynamicTable
                columns={asistentesColumns}
                data={asistentes}
                onChange={setAsistentes}
                emptyRowTemplate={{ id: '', nombre: '', cargo: '', organizacion: '' }}
                addLabel="Agregar asistente manual"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">Ausentes</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPersonalDialog('ausentes')}
                  disabled={loadingPersonal}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Agregar del Personal
                </Button>
              </div>
              <DynamicTable
                columns={ausentesColumns}
                data={ausentes}
                onChange={setAusentes}
                emptyRowTemplate={{ id: '', nombre: '', cargo: '', motivo: '' }}
                addLabel="Agregar ausente manual"
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Dialog para selección de personal */}
        <Dialog open={showPersonalDialog !== null} onOpenChange={(open) => !open && setShowPersonalDialog(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                Seleccionar Personal como {showPersonalDialog === 'asistentes' ? 'Asistentes' : 'Ausentes'}
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[400px] overflow-y-auto">
              {loadingPersonal ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : personalList.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay personal disponible</p>
              ) : (
                <div className="space-y-2">
                  {personalList.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                      onClick={() => togglePersonalSelection(p.id)}
                    >
                      <Checkbox
                        checked={selectedPersonalIds.has(p.id)}
                        onCheckedChange={() => togglePersonalSelection(p.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{p.nombres} {p.apellidos}</p>
                        <p className="text-sm text-gray-500">
                          {p.cargo || 'Sin cargo'} • {p.division?.nombre || 'Sin área'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowPersonalDialog(null)}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleAddSelectedPersonal}
                disabled={selectedPersonalIds.size === 0}
              >
                Agregar {selectedPersonalIds.size} seleccionado(s)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Agenda */}
        <CollapsibleSection
          title={<>Agenda <span className="text-red-500">*</span></>}
          description="Puntos a tratar en la reunion (minimo 1 tema requerido)"
        >
          {arrayErrors.agenda && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{arrayErrors.agenda}</AlertDescription>
            </Alert>
          )}
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
          title={<>Temas Desarrollados <span className="text-red-500">*</span></>}
          description="Detalle de los temas tratados durante la reunion (minimo 1 tema requerido)"
        >
          {arrayErrors.temasDesarrollados && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{arrayErrors.temasDesarrollados}</AlertDescription>
            </Alert>
          )}
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
          title={<>Acuerdos y Compromisos <span className="text-red-500">*</span></>}
          description="Compromisos adquiridos durante la reunion (minimo 1 acuerdo requerido)"
        >
          {arrayErrors.acuerdos && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{arrayErrors.acuerdos}</AlertDescription>
            </Alert>
          )}
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
