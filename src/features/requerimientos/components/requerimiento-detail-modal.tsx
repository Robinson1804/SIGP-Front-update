'use client';

/**
 * RequerimientoDetailModal Component
 *
 * Modal para visualizar el detalle de un requerimiento (solo lectura)
 * Disponible para: ADMIN, SCRUM_MASTER, COORDINADOR, PMO, PATROCINADOR
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { X, FileText, CheckCircle, Circle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  type Requerimiento,
  REQUERIMIENTO_PRIORIDADES,
  REQUERIMIENTO_TIPOS,
} from '../types';

interface RequerimientoDetailModalProps {
  requerimiento: Requerimiento | null;
  open: boolean;
  onClose: () => void;
}

// Helper para obtener color del badge según prioridad
function getPrioridadVariant(prioridad: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const found = REQUERIMIENTO_PRIORIDADES.find((p) => p.value === prioridad);
  switch (found?.color) {
    case 'destructive':
      return 'destructive';
    case 'warning':
      return 'default';
    case 'secondary':
      return 'secondary';
    default:
      return 'outline';
  }
}

// Helper para obtener label del tipo
function getTipoLabel(tipo: string): string {
  const found = REQUERIMIENTO_TIPOS.find((t) => t.value === tipo);
  return found?.label || tipo;
}

export function RequerimientoDetailModal({
  requerimiento,
  open,
  onClose,
}: RequerimientoDetailModalProps) {
  if (!requerimiento) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {requerimiento.codigo}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Detalle del requerimiento
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nombre */}
          <div>
            <h3 className="text-lg font-semibold">{requerimiento.nombre}</h3>
          </div>

          {/* Badges: Tipo y Prioridad */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="text-sm">
              {getTipoLabel(requerimiento.tipo)}
            </Badge>
            <Badge variant={getPrioridadVariant(requerimiento.prioridad)} className="text-sm">
              Prioridad: {requerimiento.prioridad}
            </Badge>
          </div>

          <Separator />

          {/* Descripcion */}
          {requerimiento.descripcion && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Descripcion</h4>
              <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                {requerimiento.descripcion}
              </p>
            </div>
          )}

          {/* Criterios de Aceptacion */}
          {requerimiento.criteriosAceptacion && requerimiento.criteriosAceptacion.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Criterios de Aceptacion ({requerimiento.criteriosAceptacion.length})
              </h4>
              <div className="space-y-2 bg-muted/50 p-3 rounded-lg">
                {requerimiento.criteriosAceptacion.map((criterio, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    {criterio.cumplido ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    )}
                    <span className={criterio.cumplido ? 'line-through text-muted-foreground' : ''}>
                      {criterio.descripcion}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observaciones */}
          {requerimiento.observaciones && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Observaciones</h4>
              <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                {requerimiento.observaciones}
              </p>
            </div>
          )}

          <Separator />

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Creado:</span>
              <p className="font-medium">
                {format(new Date(requerimiento.createdAt), "dd 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Actualizado:</span>
              <p className="font-medium">
                {format(new Date(requerimiento.updatedAt), "dd 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
