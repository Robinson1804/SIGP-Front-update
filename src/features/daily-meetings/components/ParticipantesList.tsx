'use client';

/**
 * ParticipantesList Component
 *
 * Lista de participantes de una daily meeting con sus respuestas
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  AlertTriangle,
  Edit,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import type { ParticipanteDaily } from '../types';

interface ParticipantesListProps {
  participantes: ParticipanteDaily[];
  onEditParticipante?: (participante: ParticipanteDaily) => void;
  readOnly?: boolean;
}

export function ParticipantesList({
  participantes,
  onEditParticipante,
  readOnly = false,
}: ParticipantesListProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const asistentes = participantes.filter((p) => p.asistio);
  const ausentes = participantes.filter((p) => !p.asistio);
  const conImpedimentos = participantes.filter(
    (p) => p.impedimentos && p.impedimentos.trim() !== ''
  );

  const getInitials = (nombre: string) => {
    return nombre
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span>{asistentes.length} asistentes</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-gray-400" />
          <span>{ausentes.length} ausentes</span>
        </div>
        {conImpedimentos.length > 0 && (
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>{conImpedimentos.length} con impedimentos</span>
          </div>
        )}
      </div>

      {/* Lista de participantes */}
      <div className="space-y-2">
        {participantes.map((participante) => (
          <Collapsible
            key={participante.id}
            open={expandedId === participante.id}
            onOpenChange={(open) =>
              setExpandedId(open ? participante.id : null)
            }
          >
            <Card
              className={`transition-colors ${
                !participante.asistio ? 'opacity-60' : ''
              }`}
            >
              <CardContent className="p-4">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={participante.avatar} />
                        <AvatarFallback className="bg-[#004272] text-white text-xs">
                          {getInitials(participante.nombre)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-medium">{participante.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          {participante.rol}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {participante.asistio ? (
                        <Badge
                          variant="outline"
                          className="border-green-500 text-green-600"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Presente
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Ausente
                        </Badge>
                      )}
                      {participante.impedimentos && (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          expandedId === participante.id ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="pt-4">
                  {participante.asistio ? (
                    <div className="space-y-3 pl-13">
                      {/* Ayer */}
                      <div className="flex gap-2">
                        <ArrowLeft className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            ¿Qué hizo ayer?
                          </p>
                          <p className="text-sm">{participante.ayer || '-'}</p>
                        </div>
                      </div>

                      {/* Hoy */}
                      <div className="flex gap-2">
                        <ArrowRight className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            ¿Qué hará hoy?
                          </p>
                          <p className="text-sm">{participante.hoy || '-'}</p>
                        </div>
                      </div>

                      {/* Impedimentos */}
                      {participante.impedimentos && (
                        <div className="flex gap-2 rounded-md bg-amber-50 p-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-amber-700">
                              Impedimentos
                            </p>
                            <p className="text-sm text-amber-600">
                              {participante.impedimentos}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Notas */}
                      {participante.notas && (
                        <div className="text-sm text-muted-foreground italic">
                          {participante.notas}
                        </div>
                      )}

                      {/* Botón editar */}
                      {!readOnly && onEditParticipante && (
                        <div className="pt-2 border-t">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEditParticipante(participante)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar respuestas
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="pl-13 text-sm text-muted-foreground">
                      No participó en esta daily
                      {!readOnly && onEditParticipante && (
                        <Button
                          size="sm"
                          variant="link"
                          className="ml-2"
                          onClick={() => onEditParticipante(participante)}
                        >
                          Registrar participación
                        </Button>
                      )}
                    </div>
                  )}
                </CollapsibleContent>
              </CardContent>
            </Card>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}
