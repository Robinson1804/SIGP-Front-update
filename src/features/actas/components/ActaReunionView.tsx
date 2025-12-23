'use client';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Acta } from '@/features/documentos/types';

interface ActaReunionViewProps {
  acta: Acta;
}

export function ActaReunionView({ acta }: ActaReunionViewProps) {
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string | null | undefined) => {
    if (!timeStr) return '-';
    return timeStr;
  };

  return (
    <div className="space-y-6">
      {/* Datos Generales */}
      <Card>
        <CardHeader>
          <CardTitle>Datos Generales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha</p>
              <p>{formatDate(acta.fecha)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tipo de Reunión</p>
              <Badge variant="outline">{acta.tipoReunion || 'No especificado'}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fase</p>
              <p>{acta.fasePerteneciente || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Horario</p>
              <p>
                {formatTime(acta.horaInicio)} - {formatTime(acta.horaFin)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Modalidad</p>
              <Badge variant="secondary">{acta.modalidad || 'No especificada'}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Lugar/Link</p>
              <p className="truncate">{acta.lugarLink || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asistentes */}
      <Card>
        <CardHeader>
          <CardTitle>Asistentes</CardTitle>
        </CardHeader>
        <CardContent>
          {acta.asistentes && acta.asistentes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Organización</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {acta.asistentes.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.nombre}</TableCell>
                    <TableCell>{item.cargo || '-'}</TableCell>
                    <TableCell>{item.organizacion || item.direccion || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground italic">No hay asistentes registrados</p>
          )}

          {acta.ausentes && acta.ausentes.length > 0 && (
            <>
              <Separator className="my-4" />
              <h4 className="font-medium mb-2">Ausentes</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {acta.ausentes.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.nombre}</TableCell>
                      <TableCell>{item.cargo || '-'}</TableCell>
                      <TableCell>{item.motivo || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      {/* Agenda */}
      <Card>
        <CardHeader>
          <CardTitle>Agenda</CardTitle>
        </CardHeader>
        <CardContent>
          {acta.agenda && acta.agenda.length > 0 ? (
            <ol className="list-decimal list-inside space-y-2">
              {acta.agenda.map((item, index) => (
                <li key={index}>
                  <span className="font-medium">{item.tema}</span>
                  {item.descripcion && (
                    <p className="ml-6 text-sm text-muted-foreground">
                      {item.descripcion}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-muted-foreground italic">No hay puntos de agenda registrados</p>
          )}
        </CardContent>
      </Card>

      {/* Desarrollo de Temas */}
      <Card>
        <CardHeader>
          <CardTitle>Desarrollo de Temas</CardTitle>
        </CardHeader>
        <CardContent>
          {acta.temasDesarrollados && acta.temasDesarrollados.length > 0 ? (
            <div className="space-y-4">
              {acta.temasDesarrollados.map((item, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">{item.tema}</h4>
                  {item.notas && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-muted-foreground">Notas</p>
                      <p className="whitespace-pre-wrap">{item.notas}</p>
                    </div>
                  )}
                  {item.conclusiones && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Conclusiones</p>
                      <p className="whitespace-pre-wrap">{item.conclusiones}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground italic">No hay temas desarrollados</p>
          )}
        </CardContent>
      </Card>

      {/* Acuerdos */}
      <Card>
        <CardHeader>
          <CardTitle>Acuerdos y Compromisos</CardTitle>
        </CardHeader>
        <CardContent>
          {acta.acuerdos && acta.acuerdos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-[100px]">Prioridad</TableHead>
                  <TableHead className="w-[150px]">Fecha Compromiso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {acta.acuerdos.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.descripcion}</TableCell>
                    <TableCell>
                      {item.prioridad ? (
                        <Badge
                          variant={
                            item.prioridad === 'Alta'
                              ? 'destructive'
                              : item.prioridad === 'Media'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {item.prioridad}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{formatDate(item.fechaCompromiso)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground italic">No hay acuerdos registrados</p>
          )}
        </CardContent>
      </Card>

      {/* Próximos Pasos */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Pasos</CardTitle>
        </CardHeader>
        <CardContent>
          {acta.proximosPasos && acta.proximosPasos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead className="w-[150px]">Fecha Límite</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {acta.proximosPasos.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.descripcion}</TableCell>
                    <TableCell>{item.responsableNombre || '-'}</TableCell>
                    <TableCell>{formatDate(item.fechaLimite)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground italic">No hay próximos pasos registrados</p>
          )}
        </CardContent>
      </Card>

      {/* Observaciones */}
      {acta.observaciones && (
        <Card>
          <CardHeader>
            <CardTitle>Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{acta.observaciones}</p>
          </CardContent>
        </Card>
      )}

      {/* Anexos */}
      {acta.anexosReferenciados && acta.anexosReferenciados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Anexos Referenciados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>URL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {acta.anexosReferenciados.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.nombre}</TableCell>
                    <TableCell>{item.descripcion || '-'}</TableCell>
                    <TableCell>
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Ver documento
                        </a>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Próxima Reunión */}
      {acta.proximaReunionFecha && (
        <Card>
          <CardHeader>
            <CardTitle>Próxima Reunión</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Programada para: {formatDate(acta.proximaReunionFecha)}</p>
          </CardContent>
        </Card>
      )}

      {/* Documento Firmado */}
      {acta.documentoFirmadoUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Documento Firmado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge variant="default">Documento cargado</Badge>
              <a
                href={acta.documentoFirmadoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Ver documento firmado
              </a>
              {acta.documentoFirmadoFecha && (
                <span className="text-sm text-muted-foreground">
                  Cargado el {formatDate(acta.documentoFirmadoFecha)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rechazo */}
      {acta.estado === 'Rechazado' && acta.comentarioRechazo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Motivo de Rechazo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-destructive">{acta.comentarioRechazo}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
