'use client';

/**
 * DailyMeetingCard Component
 *
 * Tarjeta que muestra el resumen de una daily meeting
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  ChevronRight,
  Play,
  CheckCircle2,
} from 'lucide-react';
import type { DailyMeeting } from '../types';

interface DailyMeetingCardProps {
  daily: DailyMeeting;
  onView?: (daily: DailyMeeting) => void;
  onStart?: (daily: DailyMeeting) => void;
  onFinish?: (daily: DailyMeeting) => void;
}

export function DailyMeetingCard({
  daily,
  onView,
  onStart,
  onFinish,
}: DailyMeetingCardProps) {
  const fechaFormateada = format(new Date(daily.fecha), "EEEE, d 'de' MMMM", {
    locale: es,
  });

  const isEnProgreso = daily.horaInicio && !daily.horaFin;
  const isCompletada = daily.horaInicio && daily.horaFin;
  const isPendiente = !daily.horaInicio;

  const tieneImpedimentos =
    daily.impedimentosGlobales && daily.impedimentosGlobales.length > 0;

  const porcentajeAsistencia =
    daily.totalParticipantes > 0
      ? Math.round((daily.asistentes / daily.totalParticipantes) * 100)
      : 0;

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isEnProgreso ? 'border-blue-500 border-2' : ''
      }`}
      onClick={() => onView?.(daily)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium capitalize">
            {fechaFormateada}
          </CardTitle>
          {isPendiente && (
            <Badge variant="secondary">Pendiente</Badge>
          )}
          {isEnProgreso && (
            <Badge className="bg-blue-500">En Progreso</Badge>
          )}
          {isCompletada && (
            <Badge className="bg-green-500">Completada</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Hora y duración */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{daily.horaInicio || '--:--'}</span>
            {daily.horaFin && <span> - {daily.horaFin}</span>}
          </div>
          {daily.duracionMinutos && (
            <span>({daily.duracionMinutos} min)</span>
          )}
        </div>

        {/* Asistencia */}
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm">
              <span>Asistencia</span>
              <span className="font-medium">
                {daily.asistentes}/{daily.totalParticipantes} ({porcentajeAsistencia}%)
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${porcentajeAsistencia}%` }}
              />
            </div>
          </div>
        </div>

        {/* Impedimentos */}
        {tieneImpedimentos && (
          <div className="flex items-start gap-2 rounded-md bg-amber-50 p-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
            <div>
              <span className="font-medium text-amber-700">
                {daily.impedimentosGlobales!.length} impedimento(s)
              </span>
              <p className="text-amber-600 line-clamp-2">
                {daily.impedimentosGlobales![0]}
              </p>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          {isPendiente && onStart && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onStart(daily);
              }}
            >
              <Play className="h-4 w-4 mr-1" />
              Iniciar
            </Button>
          )}
          {isEnProgreso && onFinish && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onFinish(daily);
              }}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Finalizar
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onView?.(daily);
            }}
          >
            Ver <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
