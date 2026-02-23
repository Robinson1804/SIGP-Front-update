'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Calendar,
  User,
  Users,
  Target,
  Layers,
  Edit,
} from 'lucide-react';
import { type HistoriaUsuario, type HistoriaEstado } from '@/features/proyectos/services/historias.service';
import { cn, parseLocalDate } from '@/lib/utils';
import { CriteriosAceptacionSection } from './criterios-aceptacion-section';

interface MiembroEquipo {
  id: number;
  nombre: string;
}

interface HistoriaDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  historia: HistoriaUsuario;
  equipo?: MiembroEquipo[];
  onEdit?: () => void;
}

const estadoColors: Record<HistoriaEstado, string> = {
  'Por hacer': 'bg-gray-100 text-gray-700',
  'En progreso': 'bg-yellow-100 text-yellow-700',
  'Finalizado': 'bg-green-100 text-green-700',
};

const prioridadConfig: Record<string, { label: string; color: string }> = {
  Alta: { label: 'Alta', color: 'bg-red-100 text-red-700 border-red-200' },
  Media: { label: 'Media', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  Baja: { label: 'Baja', color: 'bg-blue-100 text-blue-700 border-blue-200' },
};

export function HistoriaDetailModal({
  open,
  onOpenChange,
  historia,
  equipo = [],
  onEdit,
}: HistoriaDetailModalProps) {
  // Crear mapa de equipo para buscar nombres rápidamente
  const equipoMap = new Map(equipo.map(m => [m.id, m.nombre]));

  // Obtener nombres de los responsables
  const getResponsablesNombres = (): string[] => {
    if (!historia.asignadoA || historia.asignadoA.length === 0) {
      return [];
    }
    return historia.asignadoA.map((id) => {
      const numId = typeof id === 'string' ? parseInt(id, 10) : id;
      return equipoMap.get(numId) || `ID: ${numId}`;
    });
  };
  const formatDisplayDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = parseLocalDate(dateString);
    if (!date) return '-';
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-start justify-between pr-6">
            <div>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-[#018CD1]" />
                {historia.codigo}
              </DialogTitle>
              <DialogDescription className="text-base font-medium text-gray-900 mt-1">
                {historia.titulo}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto flex-1">
          {/* Status and Priority Row */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={cn('font-medium', estadoColors[historia.estado])}>
              {historia.estado}
            </Badge>
            {historia.prioridad && (
              <Badge
                variant="outline"
                className={cn('font-medium', prioridadConfig[historia.prioridad]?.color)}
              >
                {prioridadConfig[historia.prioridad]?.label}
              </Badge>
            )}
            {historia.storyPoints && (
              <Badge variant="secondary" className="font-medium">
                {historia.storyPoints} pts
              </Badge>
            )}
          </div>

          {/* Epic and Sprint */}
          <div className="grid grid-cols-2 gap-4">
            {historia.epica && (
              <div className="flex items-center gap-2 text-sm">
                <Layers className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Epica:</span>
                <div className="flex items-center gap-1">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: historia.epica.color || '#888' }}
                  />
                  <span className="font-medium">{historia.epica.nombre}</span>
                </div>
              </div>
            )}
            {historia.sprint && (
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Sprint:</span>
                <span className="font-medium">Sprint {historia.sprint.numero}</span>
              </div>
            )}
          </div>

          {/* Responsables */}
          <div className="flex items-start gap-2 text-sm">
            <Users className="h-4 w-4 text-gray-400 mt-0.5" />
            <span className="text-gray-500">Responsables:</span>
            <div className="flex flex-wrap gap-1">
              {getResponsablesNombres().length > 0 ? (
                getResponsablesNombres().map((nombre, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {nombre}
                  </Badge>
                ))
              ) : (
                <span className="text-gray-400 italic">Sin asignar</span>
              )}
            </div>
          </div>

          {/* Dates - Only show if sprint has dates */}
          {historia.sprint && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Sprint:</span>
                <span className="font-medium">{historia.sprint.nombre}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Estado:</span>
                <span className="font-medium">{historia.estado}</span>
              </div>
            </div>
          )}

          <Separator />

          {/* User Story Format */}
          {(historia.rol || historia.quiero || historia.para) && (
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                <User className="h-4 w-4" />
                Historia de Usuario
              </h4>
              <div className="space-y-2 text-sm">
                {historia.rol && (
                  <p>
                    <span className="font-medium text-blue-700">Como</span>{' '}
                    <span className="text-blue-900">{historia.rol}</span>
                  </p>
                )}
                {historia.quiero && (
                  <p>
                    <span className="font-medium text-blue-700">Quiero</span>{' '}
                    <span className="text-blue-900">{historia.quiero}</span>
                  </p>
                )}
                {historia.para && (
                  <p>
                    <span className="font-medium text-blue-700">Para</span>{' '}
                    <span className="text-blue-900">{historia.para}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Acceptance Criteria */}
          <CriteriosAceptacionSection historiaId={historia.id} />

          {/* Tasks Summary */}
          {historia.tareas && historia.tareas.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">
                Tareas ({historia.tareas.length})
              </h4>
              <div className="space-y-2">
                {historia.tareas.map((tarea) => (
                  <div
                    key={tarea.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-md text-sm"
                  >
                    <span>{tarea.nombre}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        tarea.estado === 'Finalizado'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : tarea.estado === 'En progreso'
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : 'bg-gray-50 text-gray-600'
                      )}
                    >
                      {tarea.estado}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-gray-400 pt-2 border-t">
            <p>Creado: {formatDisplayDate(historia.createdAt)}</p>
            <p>Actualizado: {formatDisplayDate(historia.updatedAt)}</p>
          </div>
        </div>

        <DialogFooter className="border-t pt-4 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
          {onEdit && historia.estado !== 'En revisión' && historia.estado !== 'Finalizado' && (
            <Button
              type="button"
              onClick={onEdit}
              className="bg-[#018CD1] hover:bg-[#0179b5] flex items-center gap-1"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
