'use client';

import { useState } from 'react';
import { Plus, Loader2, Layers, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Epica } from '@/features/proyectos/types';
import { deleteEpica } from '@/features/proyectos/services/epicas.service';

interface EpicasViewProps {
  proyectoId: number;
  /** ID del subproyecto (si aplica) */
  subproyectoId?: number;
  epicas: Epica[];
  isLoading: boolean;
  onCreateEpica: () => void;
  onEditEpica: (epica: Epica) => void;
  onRefresh: () => void;
  /** Modo solo lectura */
  isReadOnly?: boolean;
}

const PRIORIDAD_COLORS: Record<string, string> = {
  Alta: 'bg-red-100 text-red-800',
  Media: 'bg-orange-100 text-orange-800',
  Baja: 'bg-green-100 text-green-800',
};

const ESTADO_COLORS: Record<string, string> = {
  'Por hacer': 'bg-gray-100 text-gray-800',
  'En progreso': 'bg-blue-100 text-blue-800',
  'Finalizado': 'bg-green-100 text-green-800',
};

export function EpicasView({
  proyectoId,
  subproyectoId,
  epicas,
  isLoading,
  onCreateEpica,
  onEditEpica,
  onRefresh,
  isReadOnly = false,
}: EpicasViewProps) {
  const [deletingEpica, setDeletingEpica] = useState<Epica | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deletingEpica) return;

    try {
      setIsDeleting(true);
      await deleteEpica(deletingEpica.id);
      setDeletingEpica(null);
      onRefresh();
    } catch (err) {
      console.error('Error deleting epica:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-purple-600" />
          <h4 className="text-lg font-semibold">Epicas del Proyecto</h4>
          <Badge variant="secondary">{epicas.length}</Badge>
        </div>
        {!isReadOnly && (
          <Button onClick={onCreateEpica} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Epica
          </Button>
        )}
      </div>

      {/* Epicas Grid */}
      {epicas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center mb-4">
              No hay epicas creadas para este proyecto.
              <br />
              Las epicas agrupan historias de usuario relacionadas.
            </p>
            {!isReadOnly && (
              <Button onClick={onCreateEpica} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Crear primera Epica
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {epicas.map((epica) => (
            <EpicaCard
              key={epica.id}
              epica={epica}
              onEdit={isReadOnly ? undefined : () => onEditEpica(epica)}
              onDelete={isReadOnly ? undefined : () => setDeletingEpica(epica)}
              isReadOnly={isReadOnly}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deletingEpica} onOpenChange={() => setDeletingEpica(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Epica</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion eliminara la epica &quot;{deletingEpica?.nombre}&quot;.
              Las historias de usuario asociadas quedaran sin epica asignada.
              Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface EpicaCardProps {
  epica: Epica;
  onEdit?: () => void;
  onDelete?: () => void;
  isReadOnly?: boolean;
}

function EpicaCard({ epica, onEdit, onDelete, isReadOnly = false }: EpicaCardProps) {
  const husCount = epica.historiasUsuario?.length || 0;
  const husCompletas = epica.historiasUsuario?.filter(
    (h) => h.estado === 'Finalizado'
  ).length || 0;
  const porcentaje = husCount > 0 ? Math.round((husCompletas / husCount) * 100) : 0;
  const totalSP = epica.historiasUsuario?.reduce((sum, h) => sum + (h.puntos || 0), 0) || 0;

  return (
    <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
      {/* Color bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{ backgroundColor: epica.color || '#6366f1' }}
      />

      <CardHeader className="pb-2 pl-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardDescription className="text-xs font-mono">
              {epica.codigo}
            </CardDescription>
            <CardTitle className="text-base">{epica.nombre}</CardTitle>
          </div>
          {!isReadOnly && (onEdit || onDelete) && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pl-5 space-y-3">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={ESTADO_COLORS[epica.estado] || 'bg-gray-100'}>
            {epica.estado}
          </Badge>
          {epica.prioridad && (
            <Badge className={PRIORIDAD_COLORS[epica.prioridad] || 'bg-gray-100'}>
              {epica.prioridad}
            </Badge>
          )}
        </div>

        {/* Description (truncated) */}
        {epica.descripcion && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {epica.descripcion}
          </p>
        )}

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Progreso</span>
            <span>{porcentaje}%</span>
          </div>
          <Progress value={porcentaje} className="h-2" />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-500">
              <strong className="text-gray-900">{husCount}</strong> HUs
            </span>
            <span className="text-gray-500">
              <strong className="text-gray-900">{totalSP}</strong> SP
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {husCompletas}/{husCount} completadas
          </span>
        </div>

      </CardContent>
    </Card>
  );
}
