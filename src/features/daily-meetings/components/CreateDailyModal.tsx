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

interface ParticipanteInput {
  usuarioId: number;
  nombre: string;
  asistio: boolean;
  ausenciMotivo?: string;
  queHiceAyer: string;
  queHareHoy: string;
  impedimentos: string;
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
          impedimentos: '',
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
          impedimentos: '',
        }))
      );
    }
  }, [open, fechaPreseleccionada, equipoSprint]);

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
    (p) => p.asistio && p.impedimentos.trim()
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
                          ) : participante.impedimentos.trim() ? (
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
                            <div className="space-y-2">
                              <Label className="text-sm flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                ¿Tienes algún impedimento?
                              </Label>
                              <Textarea
                                placeholder="Describe cualquier bloqueo o impedimento que necesite resolverse..."
                                value={participante.impedimentos}
                                onChange={(e) =>
                                  updateParticipante(
                                    participante.usuarioId,
                                    'impedimentos',
                                    e.target.value
                                  )
                                }
                                className={cn(
                                  'min-h-[60px]',
                                  participante.impedimentos.trim() &&
                                    'border-red-300 bg-red-50'
                                )}
                              />
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
