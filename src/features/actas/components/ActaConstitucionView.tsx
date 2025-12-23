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
import { CollapsibleSection } from './CollapsibleSection';
import type { Acta } from '@/features/documentos/types';

interface ActaConstitucionViewProps {
  acta: Acta;
}

export function ActaConstitucionView({ acta }: ActaConstitucionViewProps) {
  // Helper para asegurar que un campo sea un array (puede venir como string JSON)
  const ensureArray = <T,>(value: T[] | string | null | undefined): T[] => {
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
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Objetivo del Proyecto */}
      <CollapsibleSection title="Objetivo del Proyecto" defaultOpen>
        {acta.objetivoSmart ? (
          <p className="whitespace-pre-wrap">{acta.objetivoSmart}</p>
        ) : (
          <p className="text-muted-foreground italic">No especificado</p>
        )}
      </CollapsibleSection>

      {/* Justificación */}
      <CollapsibleSection title="Justificación">
        {acta.justificacion ? (
          <p className="whitespace-pre-wrap">{acta.justificacion}</p>
        ) : (
          <p className="text-muted-foreground italic">No especificada</p>
        )}
      </CollapsibleSection>

      {/* Alcance */}
      <CollapsibleSection title="Alcance del Proyecto">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Incluido en el Alcance</h4>
            {ensureArray<string>(acta.alcance).length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {ensureArray<string>(acta.alcance).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground italic">No especificado</p>
            )}
          </div>
          <Separator />
          <div>
            <h4 className="font-medium mb-2">Fuera del Alcance</h4>
            {ensureArray<string>(acta.fueraDeAlcance).length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {ensureArray<string>(acta.fueraDeAlcance).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground italic">No especificado</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Entregables */}
      <CollapsibleSection title="Entregables Principales">
        {ensureArray(acta.entregables).length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="w-[150px]">Fecha Estimada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ensureArray(acta.entregables).map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.nombre}</TableCell>
                  <TableCell>{item.descripcion || '-'}</TableCell>
                  <TableCell>{formatDate(item.fechaEstimada)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground italic">No hay entregables registrados</p>
        )}
      </CollapsibleSection>

      {/* Supuestos y Restricciones */}
      <CollapsibleSection title="Supuestos y Restricciones">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Supuestos</h4>
            {ensureArray<string>(acta.supuestos).length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {ensureArray<string>(acta.supuestos).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground italic">No especificados</p>
            )}
          </div>
          <Separator />
          <div>
            <h4 className="font-medium mb-2">Restricciones</h4>
            {ensureArray<string>(acta.restricciones).length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {ensureArray<string>(acta.restricciones).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground italic">No especificadas</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Riesgos */}
      <CollapsibleSection title="Riesgos Identificados">
        {ensureArray(acta.riesgos).length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead className="w-[100px]">Probabilidad</TableHead>
                <TableHead className="w-[100px]">Impacto</TableHead>
                <TableHead>Mitigación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ensureArray(acta.riesgos).map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.descripcion}</TableCell>
                  <TableCell>
                    {item.probabilidad ? (
                      <Badge
                        variant={
                          item.probabilidad === 'Alta'
                            ? 'destructive'
                            : item.probabilidad === 'Media'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {item.probabilidad}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {item.impacto ? (
                      <Badge
                        variant={
                          item.impacto === 'Alto'
                            ? 'destructive'
                            : item.impacto === 'Medio'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {item.impacto}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{item.mitigacion || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground italic">No hay riesgos registrados</p>
        )}
      </CollapsibleSection>

      {/* Presupuesto */}
      <CollapsibleSection title="Presupuesto Estimado">
        <p className="text-2xl font-bold">
          {formatCurrency(acta.presupuestoEstimado)}
        </p>
      </CollapsibleSection>

      {/* Cronograma */}
      <CollapsibleSection title="Cronograma de Alto Nivel">
        {ensureArray(acta.cronogramaHitos).length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hito</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="w-[150px]">Fecha Estimada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ensureArray(acta.cronogramaHitos).map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.nombre}</TableCell>
                  <TableCell>{item.descripcion || '-'}</TableCell>
                  <TableCell>{formatDate(item.fechaEstimada)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground italic">No hay hitos registrados</p>
        )}
      </CollapsibleSection>

      {/* Equipo */}
      <CollapsibleSection title="Equipo del Proyecto">
        {ensureArray(acta.equipoProyecto).length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Responsabilidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ensureArray(acta.equipoProyecto).map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.nombre}</TableCell>
                  <TableCell>{item.rol}</TableCell>
                  <TableCell>{item.responsabilidad || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground italic">No hay miembros registrados</p>
        )}
      </CollapsibleSection>

      {/* Observaciones */}
      {acta.observaciones && (
        <CollapsibleSection title="Observaciones">
          <p className="whitespace-pre-wrap">{acta.observaciones}</p>
        </CollapsibleSection>
      )}

      {/* Documento Firmado */}
      {acta.documentoFirmadoUrl && (
        <CollapsibleSection title="Documento Firmado">
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
        </CollapsibleSection>
      )}

      {/* Rechazo */}
      {acta.estado === 'Rechazado' && acta.comentarioRechazo && (
        <CollapsibleSection title="Motivo de Rechazo">
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-destructive">{acta.comentarioRechazo}</p>
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}
