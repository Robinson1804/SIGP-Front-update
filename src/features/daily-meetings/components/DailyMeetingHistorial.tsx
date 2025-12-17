'use client';

/**
 * DailyMeetingHistorial Component
 *
 * Vista de historial de todas las daily meetings de un sprint
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  Search,
  Eye,
  Download,
} from 'lucide-react';
import type { DailyMeeting, DailyMeetingSummary } from '../types';

interface DailyMeetingHistorialProps {
  dailies: DailyMeeting[];
  summary?: DailyMeetingSummary;
  onViewDaily: (daily: DailyMeeting) => void;
  onExport?: () => void;
  isLoading?: boolean;
}

export function DailyMeetingHistorial({
  dailies,
  summary,
  onViewDaily,
  onExport,
  isLoading = false,
}: DailyMeetingHistorialProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDailies = dailies.filter((daily) => {
    const fecha = format(new Date(daily.fecha), 'dd/MM/yyyy');
    return (
      fecha.includes(searchTerm) ||
      daily.participantes.some((p) =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Dailies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalDailies}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summary.dailiesCompletadas}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Promedio Asistencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.promedioAsistencia}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Impedimentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {summary.impedimentosAbiertos}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros y acciones */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por fecha o participante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {onExport && (
          <Button variant="outline" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        )}
      </div>

      {/* Tabla de dailies */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fecha
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Hora
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Asistencia
                  </div>
                </TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDailies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">
                      No hay daily meetings registradas
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDailies.map((daily) => {
                  const porcentajeAsistencia =
                    daily.totalParticipantes > 0
                      ? Math.round(
                          (daily.asistentes / daily.totalParticipantes) * 100
                        )
                      : 0;

                  const isCompletada = daily.horaInicio && daily.horaFin;
                  const isEnProgreso = daily.horaInicio && !daily.horaFin;

                  return (
                    <TableRow key={daily.id}>
                      <TableCell className="font-medium">
                        {format(new Date(daily.fecha), "EEEE d 'de' MMMM", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell>
                        {daily.horaInicio || '--:--'}
                        {daily.horaFin && ` - ${daily.horaFin}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>
                            {daily.asistentes}/{daily.totalParticipantes}
                          </span>
                          <Badge
                            variant={
                              porcentajeAsistencia >= 80
                                ? 'default'
                                : porcentajeAsistencia >= 50
                                  ? 'secondary'
                                  : 'destructive'
                            }
                            className="text-xs"
                          >
                            {porcentajeAsistencia}%
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {daily.duracionMinutos
                          ? `${daily.duracionMinutos} min`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {isCompletada && (
                          <Badge className="bg-green-500">Completada</Badge>
                        )}
                        {isEnProgreso && (
                          <Badge className="bg-blue-500">En Progreso</Badge>
                        )}
                        {!daily.horaInicio && (
                          <Badge variant="secondary">Pendiente</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onViewDaily(daily)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
