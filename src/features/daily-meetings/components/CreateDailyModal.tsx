'use client';

/**
 * CreateDailyModal Component
 *
 * Modal completo para crear una nueva Daily Meeting
 * Incluye selección de fecha, hora, participantes y sus respuestas
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Calendar,
  Clock,
  Users,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Target,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTareasBySprint } from '@/features/proyectos/services/tareas.service';
import type { Tarea } from '@/features/proyectos/services/tareas.service';

// Schema de validación
const dailySchema = z.object({
  fecha: z.string().min(1, 'La fecha es requerida'),
  horaInicio: z.string().min(1, 'La hora de inicio es requerida'),
  duracionMinutos: z.number().min(5).max(60).default(15),
  notas: z.string().optional(),
});

type DailyFormData = z.infer<typeof dailySchema>;

interface TeamMember {
  id: number;
  usuarioId: number;
  nombre: string;
  email: string;
  rol?: string;
  avatar?: string;
}

export interface ImpedimentoInput {
  descripcion: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  fechaLimite: string; // vacío = sin fecha
}

interface ParticipanteInput {
  usuarioId: number;
  nombre: string;
  asistio: boolean;
  ausenciMotivo?: string;
  queHiceAyer: string;
  queHareHoy: string;
  impedimento: ImpedimentoInput | null;
}

interface CreateDailyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprintId: number;
  sprintNombre: string;
  equipoSprint: TeamMember[];
  fechaPreseleccionada?: Date;
  onSubmit: (data: {
    fecha: string;
    horaInicio: string;
    duracionMinutos: number;
    notas?: string;
    participantes: ParticipanteInput[];
  }) => Promise<void>;
}

export function CreateDailyModal({
  open,
  onOpenChange,
  sprintId,
  sprintNombre,
  equipoSprint,
  fechaPreseleccionada,
  onSubmit,
}: CreateDailyModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [participantes, setParticipantes] = useState<ParticipanteInput[]>([]);
  const [expandedParticipante, setExpandedParticipante] = useState<string>('');
  const [sprintTareas, setSprintTareas] = useState<Tarea[]>([]);

  const form = useForm<DailyFormData>({
    resolver: zodResolver(dailySchema),
    defaultValues: {
      fecha: fechaPreseleccionada
        ? fechaPreseleccionada.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      horaInicio: '09:00',
      duracionMinutos: 15,
      notas: '',
    },
  });

  // Inicializar participantes cuando cambia el equipo
  useEffect(() => {
    if (equipoSprint.length > 0 && participantes.length === 0) {
      setParticipantes(
        equipoSprint.map((miembro) => ({
          usuarioId: miembro.usuarioId,
          nombre: miembro.nombre,
          asistio: true,
          queHiceAyer: '',
          queHareHoy: '',
          impedimento: null,
        }))
      );
    }
  }, [equipoSprint]);

  // Reset cuando se abre el modal
  useEffect(() => {
    if (open) {
      form.reset({
        fecha: fechaPreseleccionada
          ? fechaPreseleccionada.toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        horaInicio: '09:00',
        duracionMinutos: 15,
        notas: '',
      });
      setParticipantes(
        equipoSprint.map((miembro) => ({
          usuarioId: miembro.usuarioId,
          nombre: miembro.nombre,
          asistio: true,
          queHiceAyer: '',
          queHareHoy: '',
          impedimento: null,
        }))
      );
    }
  }, [open, fechaPreseleccionada, equipoSprint]);

  // Fetch tareas del sprint al abrir el modal
  useEffect(() => {
    if (open && sprintId) {
      getTareasBySprint(sprintId)
        .then(setSprintTareas)
        .catch(() => setSprintTareas([]));
    }
  }, [open, sprintId]);

  // Auto-poblar campos queHiceAyer y queHareHoy con tareas del sprint
  useEffect(() => {
    if (sprintTareas.length === 0 || participantes.length === 0) return;

    const fechaDaily = form.getValues('fecha');
    if (!fechaDaily) return;

    const hoy = new Date(fechaDaily + 'T00:00:00');
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    const buildTaskSummary = (usuarioId: number, date: Date): string => {
      return sprintTareas
        .filter((t) => {
          if (t.asignadoA !== usuarioId) return false;
          if (!t.fechaInicio || !t.fechaFin) return false;
          const inicio = new Date(t.fechaInicio + 'T00:00:00');
          const fin = new Date(t.fechaFin + 'T23:59:59');
          return date >= inicio && date <= fin;
        })
        .map((t) => `${t.codigo} - ${t.nombre}`)
        .join('\n');
    };

    setParticipantes((prev) => {
      let changed = false;
      const updated = prev.map((p) => {
        const ayerSummary = p.queHiceAyer === '' ? buildTaskSummary(p.usuarioId, ayer) : p.queHiceAyer;
        const hoySummary = p.queHareHoy === '' ? buildTaskSummary(p.usuarioId, hoy) : p.queHareHoy;
        if (ayerSummary !== p.queHiceAyer || hoySummary !== p.queHareHoy) {
          changed = true;
          return { ...p, queHiceAyer: ayerSummary, queHareHoy: hoySummary };
        }
        return p;
      });
      return changed ? updated : prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sprintTareas, participantes.length]);

  const updateParticipante = (
    usuarioId: number,
    field: keyof ParticipanteInput,
    value: string | boolean
  ) => {
    setParticipantes((prev) =>
      prev.map((p) =>
        p.usuarioId === usuarioId ? { ...p, [field]: value } : p
      )
    );
  };

  const toggleImpedimento = (usuarioId: number, hasImpedimento: boolean) => {
    setParticipantes((prev) =>
      prev.map((p) => {
        if (p.usuarioId !== usuarioId) return p;
        return {
          ...p,
          impedimento: hasImpedimento
            ? { descripcion: '', prioridad: 'Media' as const, fechaLimite: '' }
            : null,
        };
      })
    );
  };

  const updateImpedimentoField = (
    usuarioId: number,
    field: keyof ImpedimentoInput,
    value: string
  ) => {
    setParticipantes((prev) =>
      prev.map((p) => {
        if (p.usuarioId !== usuarioId || !p.impedimento) return p;
        return { ...p, impedimento: { ...p.impedimento, [field]: value } };
      })
    );
  };

  const handleSubmit = async (data: DailyFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...data,
        participantes,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating daily:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (nombre: string) => {
    return nombre
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const asistentes = participantes.filter((p) => p.asistio).length;
  const conImpedimentos = participantes.filter(
    (p) => p.asistio && p.impedimento !== null
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="bg-gradient-to-r from-purple-600 to-purple-800 text-white -m-6 mb-0 p-6 rounded-t-lg">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="h-6 w-6" />
            Nueva Daily Standup
          </DialogTitle>
          <p className="text-purple-200 text-sm mt-1">
            Sprint: {sprintNombre}
          </p>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 overflow-hidden flex flex-col">
          {/* Info básica */}
          <div className="grid grid-cols-3 gap-4 p-4 border-b bg-gray-50">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-gray-500" />
                Fecha
              </Label>
              <Input
                type="date"
                {...form.register('fecha')}
                className="bg-white"
              />
              {form.formState.errors.fecha && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.fecha.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-gray-500" />
                Hora inicio
              </Label>
              <Input
                type="time"
                {...form.register('horaInicio')}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-gray-500" />
                Duración (min)
              </Label>
              <Input
                type="number"
                min={5}
                max={60}
                {...form.register('duracionMinutos', { valueAsNumber: true })}
                className="bg-white"
              />
            </div>
          </div>

          {/* Resumen rápido */}
          <div className="flex items-center gap-4 px-4 py-3 bg-purple-50 border-b">
            <Badge variant="outline" className="bg-white">
              <Users className="h-3 w-3 mr-1" />
              {asistentes}/{participantes.length} asistentes
            </Badge>
            {conImpedimentos > 0 && (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                {conImpedimentos} con impedimentos
              </Badge>
            )}
          </div>

          {/* Lista de participantes */}
          <div className="flex-1 min-h-0 overflow-y-auto max-h-[40vh]">
            <div className="py-4 px-4 space-y-2">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                Participantes y Respuestas
              </h4>

              <Accordion
                type="single"
                collapsible
                value={expandedParticipante}
                onValueChange={setExpandedParticipante}
              >
                {participantes.map((participante) => (
                  <AccordionItem
                    key={participante.usuarioId}
                    value={participante.usuarioId.toString()}
                    className="border rounded-lg mb-2 overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                            {getInitials(participante.nombre)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-sm">
                            {participante.nombre}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mr-2">
                          {!participante.asistio ? (
                            <Badge variant="secondary" className="text-xs">
                              Ausente
                            </Badge>
                          ) : participante.impedimento !== null ? (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Impedimento
                            </Badge>
                          ) : participante.queHiceAyer || participante.queHareHoy ? (
                            <Badge className="bg-green-100 text-green-700 text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Completado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-gray-500">
                              Pendiente
                            </Badge>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4 pt-2">
                        {/* Toggle asistencia */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <Label className="text-sm font-medium">
                              Asistió a la reunión
                            </Label>
                            <p className="text-xs text-gray-500">
                              Marca si el participante estuvo presente
                            </p>
                          </div>
                          <Switch
                            checked={participante.asistio}
                            onCheckedChange={(checked) =>
                              updateParticipante(
                                participante.usuarioId,
                                'asistio',
                                checked
                              )
                            }
                          />
                        </div>

                        {!participante.asistio ? (
                          <div className="space-y-2">
                            <Label className="text-sm">Motivo de ausencia</Label>
                            <Textarea
                              placeholder="Ej: Enfermedad, vacaciones, otro compromiso..."
                              value={participante.ausenciMotivo || ''}
                              onChange={(e) =>
                                updateParticipante(
                                  participante.usuarioId,
                                  'ausenciMotivo',
                                  e.target.value
                                )
                              }
                              className="min-h-[60px]"
                            />
                          </div>
                        ) : (
                          <>
                            {/* Qué hice ayer */}
                            <div className="space-y-2">
                              <Label className="text-sm flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ¿Qué hiciste ayer?
                              </Label>
                              <Textarea
                                placeholder="Describe las tareas completadas o el avance realizado ayer..."
                                value={participante.queHiceAyer}
                                onChange={(e) =>
                                  updateParticipante(
                                    participante.usuarioId,
                                    'queHiceAyer',
                                    e.target.value
                                  )
                                }
                                className="min-h-[80px]"
                              />
                            </div>

                            {/* Qué haré hoy */}
                            <div className="space-y-2">
                              <Label className="text-sm flex items-center gap-2">
                                <Target className="h-4 w-4 text-blue-500" />
                                ¿Qué harás hoy?
                              </Label>
                              <Textarea
                                placeholder="Describe el plan de trabajo para hoy..."
                                value={participante.queHareHoy}
                                onChange={(e) =>
                                  updateParticipante(
                                    participante.usuarioId,
                                    'queHareHoy',
                                    e.target.value
                                  )
                                }
                                className="min-h-[80px]"
                              />
                            </div>

                            {/* Impedimentos */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <Label className="text-sm font-medium flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                    ¿Tiene algún impedimento?
                                  </Label>
                                  <p className="text-xs text-gray-500">
                                    Registra un bloqueo formal
                                  </p>
                                </div>
                                <Switch
                                  checked={participante.impedimento !== null}
                                  onCheckedChange={(checked) =>
                                    toggleImpedimento(participante.usuarioId, checked)
                                  }
                                />
                              </div>

                              {participante.impedimento !== null && (
                                <div className="space-y-3 p-3 bg-red-50 rounded-lg border border-red-200">
                                  <div className="space-y-2">
                                    <Label className="text-sm">Descripción del impedimento</Label>
                                    <Textarea
                                      placeholder="Describe el bloqueo o impedimento..."
                                      value={participante.impedimento.descripcion}
                                      onChange={(e) =>
                                        updateImpedimentoField(
                                          participante.usuarioId,
                                          'descripcion',
                                          e.target.value
                                        )
                                      }
                                      className="min-h-[60px] bg-white border-red-200"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                      <Label className="text-sm">Prioridad</Label>
                                      <Select
                                        value={participante.impedimento.prioridad}
                                        onValueChange={(value) =>
                                          updateImpedimentoField(
                                            participante.usuarioId,
                                            'prioridad',
                                            value
                                          )
                                        }
                                      >
                                        <SelectTrigger className="bg-white border-red-200">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Alta">Alta</SelectItem>
                                          <SelectItem value="Media">Media</SelectItem>
                                          <SelectItem value="Baja">Baja</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-sm">Fecha límite (opcional)</Label>
                                      <Input
                                        type="date"
                                        value={participante.impedimento.fechaLimite}
                                        onChange={(e) =>
                                          updateImpedimentoField(
                                            participante.usuarioId,
                                            'fechaLimite',
                                            e.target.value
                                          )
                                        }
                                        className="bg-white border-red-200"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>

          {/* Notas generales */}
          <div className="p-4 border-t bg-gray-50">
            <Label className="text-sm mb-2 block">Notas de la reunión (opcional)</Label>
            <Textarea
              placeholder="Notas adicionales, decisiones tomadas, puntos importantes..."
              {...form.register('notas')}
              className="min-h-[60px] bg-white"
            />
          </div>

          <DialogFooter className="p-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Registrar Daily
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
