'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import type { Sprint, HistoriaUsuario } from '@/features/proyectos/types';
import { getSprintHistorias } from '@/features/proyectos/services/sprints.service';
import { apiClient } from '@/lib/api';

interface CerrarSprintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprint: Sprint;
  onSuccess: () => void;
  /** Todos los sprints del proyecto para verificar si es el último */
  allSprints?: Sprint[];
  /** Callback cuando todos los sprints están finalizados */
  onAllSprintsFinalized?: () => void;
}

type AccionHUs = 'mover_siguiente' | 'devolver_backlog';

export function CerrarSprintModal({
  open,
  onOpenChange,
  sprint,
  onSuccess,
  allSprints,
  onAllSprintsFinalized,
}: CerrarSprintModalProps) {
  const [historias, setHistorias] = useState<HistoriaUsuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accionHUs, setAccionHUs] = useState<AccionHUs>('devolver_backlog');
  const [linkEvidencia, setLinkEvidencia] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadHistorias();
    }
  }, [open, sprint.id]);

  const loadHistorias = async () => {
    try {
      setIsLoading(true);
      const data = await getSprintHistorias(sprint.id);
      setHistorias(data);
    } catch (err) {
      console.error('Error loading historias:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      await apiClient.patch(`/sprints/${sprint.id}/cerrar`, {
        linkEvidencia: linkEvidencia || undefined,
        accionHUsPendientes: husIncompletas.length > 0 ? accionHUs : undefined,
      });

      // Verificar si todos los sprints estarán finalizados después de cerrar este
      if (allSprints && onAllSprintsFinalized) {
        const otherSprints = allSprints.filter(s => s.id !== sprint.id);
        const allOthersFinalized = otherSprints.every(s => s.estado === 'Finalizado');

        if (allOthersFinalized) {
          // Todos los demás sprints ya están finalizados, y este se acaba de cerrar
          onSuccess();
          onOpenChange(false);
          // Disparar el modal de finalización de proyecto
          onAllSprintsFinalized();
          return;
        }
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error closing sprint:', err);
      setError(err.response?.data?.message || 'Error al cerrar el sprint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const husCompletas = historias.filter((h) => h.estado === 'Finalizado');
  const husIncompletas = historias.filter((h) => h.estado !== 'Finalizado');
  const spCompletados = husCompletas.reduce((sum, h) => sum + (h.storyPoints || 0), 0);
  const spIncompletos = husIncompletas.reduce((sum, h) => sum + (h.storyPoints || 0), 0);
  const spTotal = spCompletados + spIncompletos;
  const porcentajeCompletado = spTotal > 0 ? Math.round((spCompletados / spTotal) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Cerrar Sprint: {sprint.nombre}
          </DialogTitle>
          <DialogDescription>
            Revisa el resumen del sprint antes de cerrarlo
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Resumen del Sprint */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-green-600">
                      {husCompletas.length}
                    </div>
                    <div className="text-sm text-gray-500">HUs Completadas</div>
                    <div className="text-xs text-gray-400">{spCompletados} SP</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-orange-500">
                      {husIncompletas.length}
                    </div>
                    <div className="text-sm text-gray-500">HUs Incompletas</div>
                    <div className="text-xs text-gray-400">{spIncompletos} SP</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-600">
                      {porcentajeCompletado}%
                    </div>
                    <div className="text-sm text-gray-500">Avance</div>
                    <div className="text-xs text-gray-400">
                      {spCompletados}/{spTotal} SP
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Historias incompletas */}
            {husIncompletas.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Que hacer con las {husIncompletas.length} historias incompletas?
                </Label>

                <RadioGroup
                  value={accionHUs}
                  onValueChange={(value) => setAccionHUs(value as AccionHUs)}
                  className="space-y-3"
                >
                  <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="devolver_backlog" id="devolver" />
                    <label htmlFor="devolver" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 font-medium">
                        <RotateCcw className="h-4 w-4 text-blue-600" />
                        Devolver al Backlog
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Las historias volveran al Product Backlog para ser reprioriza das
                      </p>
                    </label>
                  </div>

                  <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="mover_siguiente" id="mover" />
                    <label htmlFor="mover" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 font-medium">
                        <ArrowRight className="h-4 w-4 text-green-600" />
                        Mover al Siguiente Sprint
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Las historias se moveran automaticamente al proximo sprint planificado
                      </p>
                    </label>
                  </div>
                </RadioGroup>

                {/* Lista de HUs incompletas */}
                <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-sm font-medium text-orange-800 mb-2">
                    Historias que seran movidas:
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {husIncompletas.map((hu) => (
                      <div
                        key={hu.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gray-500">
                            {hu.codigo}
                          </span>
                          <span className="truncate max-w-xs">{hu.titulo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {hu.estado}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {hu.puntos || 0} SP
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Link de evidencia */}
            <div className="space-y-2">
              <Label htmlFor="linkEvidencia">Link de Evidencia (opcional)</Label>
              <Input
                id="linkEvidencia"
                type="url"
                placeholder="https://..."
                value={linkEvidencia}
                onChange={(e) => setLinkEvidencia(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Enlace a documentacion, grabacion de la retrospectiva, etc.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleClose}
            disabled={isLoading || isSubmitting}
            variant="destructive"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Cerrar Sprint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
