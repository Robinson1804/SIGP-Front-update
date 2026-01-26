'use client';

/**
 * ActaDailyForm Component
 *
 * Formulario para crear/editar Actas de Daily Meeting
 * Incluye tabla de participantes con las 3 preguntas Scrum
 */

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Save,
  X,
  Plus,
  Trash2,
  Clock,
  Users,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type {
  Acta,
  ActaDailyParticipante,
  CreateActaDailyInput,
} from '@/features/documentos/types';

// Schema de validacion
const participanteSchema = z.object({
  id: z.string().optional(),
  personalId: z.number().optional(),
  nombre: z.string().min(1, 'El nombre es requerido'),
  cargo: z.string().optional(),
  ayer: z.string().min(1, 'Este campo es requerido'),
  hoy: z.string().min(1, 'Este campo es requerido'),
  impedimentos: z.string().default(''),
});

const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre del acta es requerido'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  horaInicio: z.string().optional(),
  horaFin: z.string().optional(),
  sprintId: z.number().optional(),
  duracionMinutos: z.number().optional(),
  participantesDaily: z.array(participanteSchema).min(1, 'Debe agregar al menos un participante'),
  impedimentosGenerales: z.array(z.string()).optional(),
  notasAdicionales: z.string().optional(),
  observaciones: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Sprint {
  id: number;
  nombre: string;
}

interface TeamMember {
  id: number;
  nombre: string;
  cargo?: string;
}

interface ActaDailyFormProps {
  acta?: Acta | null;
  proyectoId: number;
  sprints?: Sprint[];
  equipo?: TeamMember[];
  onSave: (data: CreateActaDailyInput) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export function ActaDailyForm({
  acta,
  proyectoId,
  sprints = [],
  equipo = [],
  onSave,
  onCancel,
  saving = false,
}: ActaDailyFormProps) {
  const [newImpedimento, setNewImpedimento] = useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: acta?.nombre || `Daily Meeting - ${new Date().toLocaleDateString('es-PE')}`,
      fecha: acta?.fecha?.split('T')[0] || new Date().toISOString().split('T')[0],
      horaInicio: acta?.horaInicio || '09:00',
      horaFin: acta?.horaFin || '09:15',
      sprintId: acta?.sprintId || undefined,
      duracionMinutos: acta?.duracionMinutos || 15,
      participantesDaily: acta?.participantesDaily || [],
      impedimentosGenerales: acta?.impedimentosGenerales || [],
      notasAdicionales: acta?.notasAdicionales || '',
      observaciones: acta?.observaciones || '',
    },
  });

  const {
    fields: participantes,
    append: appendParticipante,
    remove: removeParticipante,
  } = useFieldArray({
    control: form.control,
    name: 'participantesDaily',
  });

  const impedimentosGenerales = form.watch('impedimentosGenerales') || [];

  const addParticipante = (member?: TeamMember) => {
    appendParticipante({
      id: crypto.randomUUID(),
      personalId: member?.id,
      nombre: member?.nombre || '',
      cargo: member?.cargo || '',
      ayer: '',
      hoy: '',
      impedimentos: '',
    });
  };

  const addImpedimentoGeneral = () => {
    if (newImpedimento.trim()) {
      form.setValue('impedimentosGenerales', [...impedimentosGenerales, newImpedimento.trim()]);
      setNewImpedimento('');
    }
  };

  const removeImpedimentoGeneral = (index: number) => {
    form.setValue(
      'impedimentosGenerales',
      impedimentosGenerales.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = async (data: FormData) => {
    await onSave({
      proyectoId,
      nombre: data.nombre,
      fecha: data.fecha,
      horaInicio: data.horaInicio,
      horaFin: data.horaFin,
      sprintId: data.sprintId,
      duracionMinutos: data.duracionMinutos,
      participantesDaily: data.participantesDaily as ActaDailyParticipante[],
      impedimentosGenerales: data.impedimentosGenerales,
      notasAdicionales: data.notasAdicionales,
      observaciones: data.observaciones,
    });
  };

  // Calcular duracion automaticamente
  useEffect(() => {
    const horaInicio = form.watch('horaInicio');
    const horaFin = form.watch('horaFin');
    if (horaInicio && horaFin) {
      const [hI, mI] = horaInicio.split(':').map(Number);
      const [hF, mF] = horaFin.split(':').map(Number);
      const duracion = (hF * 60 + mF) - (hI * 60 + mI);
      if (duracion > 0) {
        form.setValue('duracionMinutos', duracion);
      }
    }
  }, [form.watch('horaInicio'), form.watch('horaFin')]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Leyenda de campos requeridos */}
        <div className="bg-muted/50 border rounded-lg p-3 text-sm">
          <p className="text-muted-foreground">
            <span className="text-red-500 font-medium">*</span> Los campos marcados con asterisco son obligatorios.
            Debe agregar al menos un participante con las 3 preguntas Scrum completadas.
          </p>
        </div>

        {/* Datos basicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Nombre del Acta <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Daily Meeting - Sprint X" />
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="horaInicio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora Inicio</FormLabel>
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
                <FormLabel>Hora Fin</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duracionMinutos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duracion (min)</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      className="w-20"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {sprints.length > 0 && (
            <FormField
              control={form.control}
              name="sprintId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sprint</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(parseInt(val))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar sprint" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sprints.map((sprint) => (
                        <SelectItem key={sprint.id} value={sprint.id.toString()}>
                          {sprint.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Tabla de Participantes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5" />
                Participantes del Daily <span className="text-red-500">*</span>
              </CardTitle>
              <div className="flex items-center gap-2">
                {equipo.length > 0 && (
                  <Select onValueChange={(val) => {
                    const member = equipo.find((m) => m.id.toString() === val);
                    if (member) addParticipante(member);
                  }}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Agregar del equipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipo.map((member) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          {member.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addParticipante()}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {participantes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay participantes agregados</p>
                <p className="text-sm">Agregue los miembros que participaron en el daily</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">
                        Participante <span className="text-red-500">*</span>
                      </TableHead>
                      <TableHead>
                        ¿Que hiciste ayer? <span className="text-red-500">*</span>
                      </TableHead>
                      <TableHead>
                        ¿Que haras hoy? <span className="text-red-500">*</span>
                      </TableHead>
                      <TableHead>¿Tienes impedimentos?</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participantes.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`participantesDaily.${index}.nombre`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} placeholder="Nombre" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`participantesDaily.${index}.ayer`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    placeholder="Tareas realizadas ayer..."
                                    className="min-h-[80px]"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`participantesDaily.${index}.hoy`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    placeholder="Tareas planificadas para hoy..."
                                    className="min-h-[80px]"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`participantesDaily.${index}.impedimentos`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    placeholder="Bloqueos o impedimentos..."
                                    className="min-h-[80px]"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeParticipante(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {form.formState.errors.participantesDaily && (
              <p className="text-sm text-red-500 mt-2">
                {form.formState.errors.participantesDaily.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Impedimentos Generales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Impedimentos Generales del Equipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newImpedimento}
                  onChange={(e) => setNewImpedimento(e.target.value)}
                  placeholder="Describir impedimento..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addImpedimentoGeneral();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addImpedimentoGeneral}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {impedimentosGenerales.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {impedimentosGenerales.map((imp, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {imp}
                      <button
                        type="button"
                        onClick={() => removeImpedimentoGeneral(index)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notas y Observaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="notasAdicionales"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas Adicionales</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Notas del facilitador..."
                    className="min-h-[100px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="observaciones"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observaciones</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Observaciones generales..."
                    className="min-h-[100px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Clock className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {acta ? 'Actualizar Acta' : 'Guardar Acta'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
