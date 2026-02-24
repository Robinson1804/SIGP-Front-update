'use client';

/**
 * EditDailyModal Component
 *
 * Modal para editar una Daily Meeting existente
 * Permite modificar hora, notas y respuestas de participantes
 */

import { useState, useEffect } from 'react';
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
  AlertCircle,
  CheckCircle2,
  Target,
  MessageSquare,
  Save,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, parseLocalDate } from '@/lib/utils';
import type { ImpedimentoInput } from './CreateDailyModal';

interface Participante {
  id: number;
  usuarioId?: number;
  nombre: string;
  asistio: boolean;
  ayer: string;
  hoy: string;
  impedimento: ImpedimentoInput | null;
}

interface DailyMeeting {
  id: number;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  duracion: number;
  participantes: {
    id: number;
    usuarioId?: number;
    nombre: string;
    asistio?: boolean;
    ayer: string;
    hoy: string;
    impedimentos: string | null;
  }[];
  notas: string | null;
}

interface EditDailyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  daily: DailyMeeting;
  onSave: (data: {
    horaInicio?: string;
    horaFin?: string;
    notas?: string;
    participantes?: {
      id: number;
      usuarioId?: number;
      asistio: boolean;
      ayer: string;
      hoy: string;
      impedimento: ImpedimentoInput | null;
    }[];
  }) => Promise<void>;
}

export function EditDailyModal({
  open,
  onOpenChange,
  daily,
  onSave,
}: EditDailyModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [horaInicio, setHoraInicio] = useState(daily.horaInicio || '09:00');
  const [horaFin, setHoraFin] = useState(daily.horaFin || '');
  const [notas, setNotas] = useState(daily.notas || '');
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [expandedParticipante, setExpandedParticipante] = useState<string>('');

  // Inicializar datos cuando se abre el modal
  useEffect(() => {
    if (open && daily) {
      setHoraInicio(daily.horaInicio || '09:00');
      setHoraFin(daily.horaFin || '');
      setNotas(daily.notas || '');
      setParticipantes(
        daily.participantes.map((p) => ({
          id: p.id,
          usuarioId: p.usuarioId,
          nombre: p.nombre,
          asistio: p.asistio ?? false,
          ayer: p.ayer || '',
          hoy: p.hoy || '',
          // Convertir texto existente a estructura; si hay texto → impedimento con prioridad Media
          impedimento: p.impedimentos
            ? { descripcion: p.impedimentos, prioridad: 'Media' as const, fechaLimite: '' }
            : null,
        }))
      );
    }
  }, [open, daily]);

  const updateParticipante = (
    id: number,
    field: keyof Participante,
    value: string | boolean
  ) => {
    setParticipantes((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      )
    );
  };

  const toggleImpedimento = (id: number, hasImpedimento: boolean) => {
    setParticipantes((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
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
    id: number,
    field: keyof ImpedimentoInput,
    value: string
  ) => {
    setParticipantes((prev) =>
      prev.map((p) => {
        if (p.id !== id || !p.impedimento) return p;
        return { ...p, impedimento: { ...p.impedimento, [field]: value } };
      })
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSave({
        horaInicio,
        horaFin: horaFin || undefined,
        notas: notas || undefined,
        participantes: participantes.map((p) => ({
          id: p.id,
          usuarioId: p.usuarioId,
          asistio: p.asistio,
          ayer: p.ayer,
          hoy: p.hoy,
          impedimento: p.impedimento,
        })),
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating daily:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (nombre: string) => {
    if (!nombre) return '??';
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

  // Usar parseLocalDate para evitar problemas de zona horaria
  const fechaDaily = parseLocalDate(daily.fecha) || new Date(daily.fecha);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white -m-6 mb-0 p-6 rounded-t-lg">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="h-6 w-6" />
            Editar Daily Standup
          </DialogTitle>
          <p className="text-blue-200 text-sm mt-1">
            {fechaDaily.toLocaleDateString('es-PE', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Info básica */}
          <div className="grid grid-cols-3 gap-4 p-4 border-b bg-gray-50">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-gray-500" />
                Fecha
              </Label>
              <Input
                type="text"
                value={fechaDaily.toLocaleDateString('es-PE')}
                disabled
                className="bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-gray-500" />
                Hora inicio
              </Label>
              <Input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-gray-500" />
                Hora fin
              </Label>
              <Input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className="bg-white"
              />
            </div>
          </div>

          {/* Resumen rápido */}
          <div className="flex items-center gap-4 px-4 py-3 bg-blue-50 border-b">
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
                <MessageSquare className="h-5 w-5 text-blue-600" />
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
                    key={participante.id}
                    value={participante.id.toString()}
                    className="border rounded-lg mb-2 overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
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
                          ) : participante.ayer || participante.hoy ? (
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
                              Asistio a la reunion
                            </Label>
                            <p className="text-xs text-gray-500">
                              Marca si el participante estuvo presente
                            </p>
                          </div>
                          <Switch
                            checked={participante.asistio}
                            onCheckedChange={(checked) =>
                              updateParticipante(
                                participante.id,
                                'asistio',
                                checked
                              )
                            }
                          />
                        </div>

                        {participante.asistio && (
                          <>
                            {/* Que hice ayer */}
                            <div className="space-y-2">
                              <Label className="text-sm flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                Que hiciste ayer?
                              </Label>
                              <Textarea
                                placeholder="Describe las tareas completadas o el avance realizado ayer..."
                                value={participante.ayer}
                                onChange={(e) =>
                                  updateParticipante(
                                    participante.id,
                                    'ayer',
                                    e.target.value
                                  )
                                }
                                className="min-h-[80px]"
                              />
                            </div>

                            {/* Que hare hoy */}
                            <div className="space-y-2">
                              <Label className="text-sm flex items-center gap-2">
                                <Target className="h-4 w-4 text-blue-500" />
                                Que haras hoy?
                              </Label>
                              <Textarea
                                placeholder="Describe el plan de trabajo para hoy..."
                                value={participante.hoy}
                                onChange={(e) =>
                                  updateParticipante(
                                    participante.id,
                                    'hoy',
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
                                    toggleImpedimento(participante.id, checked)
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
                                          participante.id,
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
                                            participante.id,
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
                                            participante.id,
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
            <Label className="text-sm mb-2 block">Notas de la reunion (opcional)</Label>
            <Textarea
              placeholder="Notas adicionales, decisiones tomadas, puntos importantes..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
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
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
