'use client';

/**
 * DependencySelector Component
 *
 * Componente para seleccionar y gestionar dependencias entre tareas
 * Incluye explicacion de tipos de dependencia PDM
 */

import { useState, useMemo } from 'react';
import { Link2, Trash2, Info, ArrowRight, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type {
  TareaCronograma,
  DependenciaCronograma,
  TipoDependencia,
  CreateDependenciaInput,
} from '../types';
import { DEPENDENCIA_DESCRIPTIONS } from '../types';

interface DependencySelectorProps {
  /** Controla si el modal esta abierto */
  open: boolean;
  /** Callback cuando se cierra el modal */
  onClose: () => void;
  /** Tarea actual (destino de las dependencias) */
  tareaActual: TareaCronograma;
  /** Lista de todas las tareas disponibles */
  todasLasTareas: TareaCronograma[];
  /** Dependencias existentes de la tarea actual */
  dependenciasExistentes: DependenciaCronograma[];
  /** Callback cuando se agrega una dependencia */
  onAddDependencia: (data: CreateDependenciaInput) => Promise<DependenciaCronograma | null | void>;
  /** Callback cuando se elimina una dependencia */
  onRemoveDependencia: (dependenciaId: string) => Promise<boolean | void>;
  /** Indica si esta procesando */
  isLoading?: boolean;
}

/**
 * Selector de dependencias para tareas del cronograma
 *
 * @example
 * <DependencySelector
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   tareaActual={selectedTask}
 *   todasLasTareas={tareas}
 *   dependenciasExistentes={deps}
 *   onAddDependencia={handleAdd}
 *   onRemoveDependencia={handleRemove}
 * />
 */
export function DependencySelector({
  open,
  onClose,
  tareaActual,
  todasLasTareas,
  dependenciasExistentes,
  onAddDependencia,
  onRemoveDependencia,
  isLoading = false,
}: DependencySelectorProps) {
  const [selectedTareaOrigen, setSelectedTareaOrigen] = useState<string>('');
  const [selectedTipo, setSelectedTipo] = useState<TipoDependencia>('FS');
  const [showHelp, setShowHelp] = useState(false);

  // Tareas disponibles para agregar como predecesoras
  const tareasDisponibles = useMemo(() => {
    // Excluir la tarea actual y las que ya son predecesoras
    const idsExistentes = new Set(
      dependenciasExistentes.map((d) => d.tareaOrigenId)
    );
    idsExistentes.add(tareaActual.id);

    return todasLasTareas.filter((t) => !idsExistentes.has(t.id));
  }, [todasLasTareas, dependenciasExistentes, tareaActual.id]);

  // Obtener nombre de tarea por ID
  const getNombreTarea = (tareaId: string): string => {
    const tarea = todasLasTareas.find((t) => t.id === tareaId);
    return tarea ? tarea.nombre : 'Desconocida';
  };

  // Manejar agregar dependencia
  const handleAddDependencia = async () => {
    if (!selectedTareaOrigen) return;

    await onAddDependencia({
      tareaOrigenId: selectedTareaOrigen,
      tareaDestinoId: tareaActual.id,
      tipo: selectedTipo,
    });

    // Reset seleccion
    setSelectedTareaOrigen('');
    setSelectedTipo('FS');
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Dependencias de: {tareaActual.nombre}
          </DialogTitle>
          <DialogDescription>
            Gestione las tareas predecesoras que deben completarse antes de esta tarea
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Boton de ayuda */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHelp(!showHelp)}
              className="text-blue-600"
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              {showHelp ? 'Ocultar ayuda' : 'Ver tipos de dependencia'}
            </Button>
          </div>

          {/* Panel de ayuda */}
          {showHelp && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-blue-800">
                  Tipos de Dependencia (PDM)
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                {(Object.entries(DEPENDENCIA_DESCRIPTIONS) as [TipoDependencia, { nombre: string; descripcion: string }][]).map(
                  ([tipo, info]) => (
                    <div key={tipo} className="flex items-start gap-2">
                      <Badge variant="outline" className="shrink-0 mt-0.5">
                        {tipo}
                      </Badge>
                      <div>
                        <p className="font-medium text-blue-900">{info.nombre}</p>
                        <p className="text-blue-700 text-xs">{info.descripcion}</p>
                      </div>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          )}

          {/* Agregar nueva dependencia */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Agregar Predecesora</CardTitle>
              <CardDescription>
                Seleccione una tarea que debe completarse antes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3">
                {/* Selector de tarea origen */}
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">
                    Tarea Predecesora
                  </label>
                  <Select
                    value={selectedTareaOrigen}
                    onValueChange={setSelectedTareaOrigen}
                    disabled={tareasDisponibles.length === 0 || isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          tareasDisponibles.length === 0
                            ? 'No hay tareas disponibles'
                            : 'Seleccionar tarea...'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {tareasDisponibles.map((tarea) => (
                        <SelectItem key={tarea.id} value={tarea.id}>
                          <div className="flex items-center gap-2">
                            {tarea.codigo && (
                              <span className="text-gray-500">
                                [{tarea.codigo}]
                              </span>
                            )}
                            {tarea.nombre}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Selector de tipo */}
                <div className="w-[120px]">
                  <label className="text-xs text-gray-500 mb-1 block">
                    Tipo
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Select
                            value={selectedTipo}
                            onValueChange={(v) =>
                              setSelectedTipo(v as TipoDependencia)
                            }
                            disabled={isLoading}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(
                                Object.entries(DEPENDENCIA_DESCRIPTIONS) as [
                                  TipoDependencia,
                                  { nombre: string; descripcion: string }
                                ][]
                              ).map(([tipo, info]) => (
                                <SelectItem key={tipo} value={tipo}>
                                  {tipo} - {info.nombre.split(' ')[0]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="max-w-xs">
                          {DEPENDENCIA_DESCRIPTIONS[selectedTipo].descripcion}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Boton agregar */}
                <Button
                  onClick={handleAddDependencia}
                  disabled={!selectedTareaOrigen || isLoading}
                  className="bg-[#004272] hover:bg-[#003156]"
                >
                  Agregar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de dependencias existentes */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Dependencias Actuales ({dependenciasExistentes.length})
            </h4>

            {dependenciasExistentes.length === 0 ? (
              <Card className="bg-gray-50">
                <CardContent className="py-8 text-center text-gray-500">
                  <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Esta tarea no tiene predecesoras</p>
                  <p className="text-xs mt-1">
                    Agregue dependencias para definir el orden de ejecucion
                  </p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {dependenciasExistentes.map((dep) => (
                    <Card key={dep.id} className="bg-gray-50">
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Tarea origen */}
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">
                                {getNombreTarea(dep.tareaOrigenId)}
                              </p>
                              <p className="text-xs text-gray-500">Predecesora</p>
                            </div>

                            {/* Tipo de dependencia */}
                            <div className="flex items-center gap-1">
                              <Badge variant="secondary" className="text-xs">
                                {dep.tipo}
                              </Badge>
                              <ArrowRight className="h-4 w-4 text-gray-400" />
                            </div>

                            {/* Tarea destino (actual) */}
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate text-blue-600">
                                {tareaActual.nombre}
                              </p>
                              <p className="text-xs text-gray-500">Sucesora</p>
                            </div>
                          </div>

                          {/* Boton eliminar */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onRemoveDependencia(dep.id)}
                                  disabled={isLoading}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Eliminar dependencia
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Componente compacto para mostrar dependencias inline
 */
export function DependencyBadges({
  dependencias,
  tareas,
  onRemove,
  maxShow = 3,
}: {
  dependencias: DependenciaCronograma[];
  tareas: TareaCronograma[];
  onRemove?: (depId: string) => void;
  maxShow?: number;
}) {
  const getNombreTarea = (id: string) =>
    tareas.find((t) => t.id === id)?.nombre || 'Desconocida';

  const visibles = dependencias.slice(0, maxShow);
  const restantes = dependencias.length - maxShow;

  return (
    <div className="flex flex-wrap gap-1">
      {visibles.map((dep) => (
        <Badge
          key={dep.id}
          variant="outline"
          className="text-xs group cursor-default"
        >
          <span className="text-gray-500 mr-1">{dep.tipo}</span>
          <span className="truncate max-w-[100px]">
            {getNombreTarea(dep.tareaOrigenId)}
          </span>
          {onRemove && (
            <button
              onClick={() => onRemove(dep.id)}
              className="ml-1 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}
      {restantes > 0 && (
        <Badge variant="secondary" className="text-xs">
          +{restantes} mas
        </Badge>
      )}
    </div>
  );
}
