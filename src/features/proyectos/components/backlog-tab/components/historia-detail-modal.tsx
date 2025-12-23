'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Target,
  Layers,
  Edit,
} from 'lucide-react';
import { type HistoriaUsuario, type HistoriaEstado } from '@/features/proyectos/services/historias.service';
import { cn } from '@/lib/utils';
import { CriteriosAceptacionSection } from './criterios-aceptacion-section';

interface HistoriaDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  historia: HistoriaUsuario;
  onEdit?: () => void;
}

const estadoColors: Record<HistoriaEstado, string> = {
  Pendiente: 'bg-gray-100 text-gray-700',
  'En analisis': 'bg-blue-100 text-blue-700',
  Lista: 'bg-cyan-100 text-cyan-700',
  'En desarrollo': 'bg-yellow-100 text-yellow-700',
  'En pruebas': 'bg-purple-100 text-purple-700',
  'En revision': 'bg-orange-100 text-orange-700',
  Terminada: 'bg-green-100 text-green-700',
};

const prioridadConfig: Record<string, { label: string; color: string }> = {
  Must: { label: 'Alta - Critico', color: 'bg-red-100 text-red-700 border-red-200' },
  Should: { label: 'Media - Importante', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  Could: { label: 'Baja - Deseable', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  Wont: { label: 'No incluir', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export function HistoriaDetailModal({
  open,
  onOpenChange,
  historia,
  onEdit,
}: HistoriaDetailModalProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#018CD1]" />
                {historia.codigo}
              </DialogTitle>
              <DialogDescription className="text-base font-medium text-gray-900 mt-1">
                {historia.titulo}
              </DialogDescription>
            </div>
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="flex items-center gap-1"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
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

          {/* Description (notas) */}
          {historia.notas && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">Notas</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {historia.notas}
              </p>
            </div>
          )}

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
            <p>Creado: {formatDate(historia.createdAt)}</p>
            <p>Actualizado: {formatDate(historia.updatedAt)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
