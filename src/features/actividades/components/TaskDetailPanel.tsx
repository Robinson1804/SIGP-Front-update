'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Clock,
  User,
  Calendar,
  Flag,
  Save,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  ExternalLink,
} from 'lucide-react';
import type { TareaKanban, TareaEstado, TareaPrioridad, Subtarea } from '../types';
import { SubtareaList } from './SubtareaList';
import { updateTarea, deleteTarea } from '../services/tareas-kanban.service';
import { getSubtareasByTarea, calcularEstadisticasLocal } from '../services/subtareas.service';

interface TaskDetailPanelProps {
  tarea: TareaKanban | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (tarea: TareaKanban) => void;
  onDelete?: (tareaId: number) => void;
}

const ESTADOS: TareaEstado[] = ['Por hacer', 'En progreso', 'Finalizado'];
const PRIORIDADES: TareaPrioridad[] = ['Alta', 'Media', 'Baja'];

const prioridadColors: Record<TareaPrioridad, string> = {
  'Alta': 'bg-red-100 text-red-800 border-red-200',
  'Media': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Baja': 'bg-green-100 text-green-800 border-green-200',
};

const estadoColors: Record<TareaEstado, string> = {
  'Por hacer': 'bg-slate-100 text-slate-800',
  'En progreso': 'bg-blue-100 text-blue-800',
  'Finalizado': 'bg-green-100 text-green-800',
};

export function TaskDetailPanel({
  tarea,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: TaskDetailPanelProps) {
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<TareaPrioridad>('Media');
  const [estado, setEstado] = useState<TareaEstado>('Por hacer');
  const [subtareas, setSubtareas] = useState<Subtarea[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tarea) {
      setDescripcion(tarea.descripcion || '');
      setPrioridad(tarea.prioridad);
      setEstado(tarea.estado);
      setHasChanges(false);
      setError(null);
      loadSubtareas(tarea.id);
    }
  }, [tarea]);

  const loadSubtareas = async (tareaId: number) => {
    try {
      const data = await getSubtareasByTarea(tareaId);
      setSubtareas(data);
    } catch (err) {
      console.error('Error loading subtareas:', err);
    }
  };

  const handleDescripcionChange = (value: string) => {
    setDescripcion(value);
    setHasChanges(true);
  };

  const handlePrioridadChange = (value: TareaPrioridad) => {
    setPrioridad(value);
    setHasChanges(true);
  };

  const handleEstadoChange = (value: TareaEstado) => {
    setEstado(value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!tarea) return;

    setIsSaving(true);
    setError(null);

    try {
      const updatedTarea = await updateTarea(tarea.id, {
        descripcion,
        prioridad,
        estado,
      });
      setHasChanges(false);
      onUpdate?.(updatedTarea);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar los cambios';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!tarea) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteTarea(tarea.id);
      onDelete?.(tarea.id);
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar la tarea';
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubtareasChange = (updatedSubtareas: Subtarea[]) => {
    setSubtareas(updatedSubtareas);
  };

  if (!tarea) return null;

  const subtareaStats = calcularEstadisticasLocal(subtareas);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-hidden flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="font-mono text-xs">
              {tarea.codigo}
            </Badge>
            <div className="flex items-center gap-2">
              <Badge className={estadoColors[estado]}>{estado}</Badge>
              <Badge className={prioridadColors[prioridad]}>
                <Flag className="w-3 h-3 mr-1" />
                {prioridad}
              </Badge>
            </div>
          </div>
          <SheetTitle className="text-left mt-2">{tarea.nombre}</SheetTitle>
          <SheetDescription className="text-left">
            {tarea.actividad?.nombre || 'Actividad'}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-4">
            {/* Error Alert */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Estado y Prioridad */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <Select value={estado} onValueChange={handleEstadoChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Prioridad</label>
                <Select value={prioridad} onValueChange={handlePrioridadChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORIDADES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Descripcion */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Descripcion</label>
              <Textarea
                value={descripcion}
                onChange={(e) => handleDescripcionChange(e.target.value)}
                placeholder="Describe la tarea..."
                rows={4}
              />
            </div>

            <Separator />

            {/* Informacion */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Informacion</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>
                    {tarea.asignadoAInfo
                      ? `${tarea.asignadoAInfo.nombre} ${tarea.asignadoAInfo.apellido}`
                      : 'Sin asignar'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>
                    {tarea.horasEstimadas ? `${tarea.horasEstimadas}h estimadas` : 'Sin estimar'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {tarea.fechaInicio
                      ? new Date(tarea.fechaInicio).toLocaleDateString('es-PE')
                      : 'Sin fecha inicio'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {tarea.fechaFin
                      ? new Date(tarea.fechaFin).toLocaleDateString('es-PE')
                      : 'Sin fecha fin'}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Subtareas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Subtareas</h4>
                <span className="text-xs text-muted-foreground">
                  {subtareaStats.finalizadas + subtareaStats.validadas}/{subtareaStats.total} completadas
                </span>
              </div>
              {subtareaStats.total > 0 && (
                <Progress
                  value={subtareaStats.porcentajeCompletado}
                  className="h-2"
                />
              )}
              <SubtareaList
                tareaId={tarea.id}
                subtareas={subtareas}
                onSubtareasChange={handleSubtareasChange}
              />
            </div>

            {/* Documento de Evidencias */}
            {tarea.documentoEvidenciasUrl && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Documento de Evidencias</h4>
                  <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-md">
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm flex-1">
                      PDF consolidado con todas las evidencias de subtareas
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0"
                      onClick={() => window.open(tarea.documentoEvidenciasUrl!, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Ver documento
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Validacion */}
            {tarea.validada && (
              <>
                <Separator />
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-md">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">
                    Tarea validada
                    {tarea.validadaEn && ` el ${new Date(tarea.validadaEn).toLocaleDateString('es-PE')}`}
                  </span>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span className="ml-2">Eliminar</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar tarea</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta accion eliminara la tarea &quot;{tarea.nombre}&quot; y todas sus subtareas.
                  Esta accion no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              <X className="w-4 h-4 mr-2" />
              Cerrar
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
