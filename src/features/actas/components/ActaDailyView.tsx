'use client';

/**
 * ActaDailyView Component
 *
 * Vista de solo lectura de un Acta de Daily Meeting
 * Muestra la tabla de participantes con las 3 preguntas Scrum
 */

import {
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import type { Acta } from '@/features/documentos/types';

interface ActaDailyViewProps {
  acta: Acta;
}

export function ActaDailyView({ acta }: ActaDailyViewProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return '-';
    return timeStr;
  };

  const participantes = acta.participantesDaily || [];
  const impedimentosGenerales = acta.impedimentosGenerales || [];

  // Contar impedimentos reportados por participantes
  const participantesConImpedimentos = participantes.filter(
    (p) => p.impedimentos && p.impedimentos.trim() !== ''
  ).length;

  return (
    <div className="space-y-6">
      {/* Informacion General */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informacion del Daily Meeting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Fecha</p>
                <p className="font-medium">{formatDate(acta.fecha)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Horario</p>
                <p className="font-medium">
                  {formatTime(acta.horaInicio)} - {formatTime(acta.horaFin)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Duracion</p>
                <p className="font-medium">{acta.duracionMinutos || 15} minutos</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Participantes</p>
                <p className="font-medium">{participantes.length} personas</p>
              </div>
            </div>
          </div>

          {acta.sprintNombre && (
            <div className="mt-4 pt-4 border-t">
              <Badge variant="outline" className="text-sm">
                Sprint: {acta.sprintNombre}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen de Estado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{participantes.length}</p>
                <p className="text-sm text-blue-600">Participantes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-100">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-700">
                  {participantesConImpedimentos}
                </p>
                <p className="text-sm text-yellow-600">Con impedimentos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">
                  {participantes.length - participantesConImpedimentos}
                </p>
                <p className="text-sm text-green-600">Sin impedimentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Participantes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Reporte de Participantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {participantes.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold">Participante</TableHead>
                    <TableHead className="font-bold">¿Que hizo ayer?</TableHead>
                    <TableHead className="font-bold">¿Que hara hoy?</TableHead>
                    <TableHead className="font-bold">Impedimentos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participantes.map((participante, index) => (
                    <TableRow key={participante.id || index}>
                      <TableCell className="font-medium">
                        <div>
                          <p>{participante.nombre}</p>
                          {participante.cargo && (
                            <p className="text-xs text-muted-foreground">
                              {participante.cargo}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <p className="whitespace-pre-wrap text-sm">
                          {participante.ayer || '-'}
                        </p>
                      </TableCell>
                      <TableCell className="align-top">
                        <p className="whitespace-pre-wrap text-sm">
                          {participante.hoy || '-'}
                        </p>
                      </TableCell>
                      <TableCell className="align-top">
                        {participante.impedimentos && participante.impedimentos.trim() !== '' ? (
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <p className="whitespace-pre-wrap text-sm text-yellow-700">
                              {participante.impedimentos}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sin impedimentos</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay participantes registrados</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Impedimentos Generales */}
      {impedimentosGenerales.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="h-5 w-5" />
              Impedimentos Generales del Equipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {impedimentosGenerales.map((impedimento, index) => (
                <li key={index} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{impedimento}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Notas y Observaciones */}
      {(acta.notasAdicionales || acta.observaciones) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notas y Observaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {acta.notasAdicionales && (
                <div>
                  <h4 className="font-medium mb-2 text-muted-foreground">
                    Notas Adicionales
                  </h4>
                  <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded">
                    {acta.notasAdicionales}
                  </p>
                </div>
              )}
              {acta.observaciones && (
                <div>
                  <h4 className="font-medium mb-2 text-muted-foreground">
                    Observaciones
                  </h4>
                  <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded">
                    {acta.observaciones}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
