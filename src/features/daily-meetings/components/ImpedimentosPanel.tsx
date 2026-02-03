'use client';

/**
 * ImpedimentosPanel Component
 *
 * Panel lateral que muestra y gestiona los impedimentos del proyecto/sprint
 * Permite crear, actualizar y resolver impedimentos
 */

import { useState } from 'react';
import {
  AlertTriangle,
  Plus,
  Clock,
  User,
  CheckCircle2,
  Circle,
  ArrowRight,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export interface Impedimento {
  id: number;
  descripcion: string;
  reportadoPor: {
    id: number;
    nombre: string;
  };
  responsable?: {
    id: number;
    nombre: string;
  };
  prioridad: 'Alta' | 'Media' | 'Baja';
  estado: 'Abierto' | 'En proceso' | 'Resuelto';
  fechaReporte: string;
  fechaLimite?: string;
  resolucion?: string;
  dailyMeetingId?: number;
  fechaDaily?: string;
}

interface TeamMember {
  id: number;
  nombre: string;
}

interface ImpedimentosPanelProps {
  impedimentos: Impedimento[];
  equipo: TeamMember[];
  onCreateImpedimento?: (data: CreateImpedimentoData) => Promise<void>;
  onUpdateImpedimento?: (id: number, data: Partial<Impedimento>) => Promise<void>;
  onResolveImpedimento?: (id: number, resolucion: string) => Promise<void>;
  canManage?: boolean;
}

interface CreateImpedimentoData {
  descripcion: string;
  responsableId?: number;
  prioridad: 'Alta' | 'Media' | 'Baja';
  fechaLimite?: string;
}

const prioridadColors = {
  Alta: 'bg-red-100 text-red-700 border-red-300',
  Media: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  Baja: 'bg-gray-100 text-gray-700 border-gray-300',
};

const estadoIcons = {
  Abierto: Circle,
  'En proceso': ArrowRight,
  Resuelto: CheckCircle2,
};

const estadoColors = {
  Abierto: 'text-red-500',
  'En proceso': 'text-yellow-500',
  Resuelto: 'text-green-500',
};

export function ImpedimentosPanel({
  impedimentos,
  equipo,
  onCreateImpedimento,
  onUpdateImpedimento,
  onResolveImpedimento,
  canManage = false,
}: ImpedimentosPanelProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [selectedImpedimento, setSelectedImpedimento] = useState<Impedimento | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolucion, setResolucion] = useState('');

  const [newImpedimento, setNewImpedimento] = useState<CreateImpedimentoData>({
    descripcion: '',
    prioridad: 'Media',
  });

  const abiertos = impedimentos.filter((i) => i.estado === 'Abierto');
  const enProceso = impedimentos.filter((i) => i.estado === 'En proceso');
  const resueltos = impedimentos.filter((i) => i.estado === 'Resuelto');

  const handleCreate = async () => {
    if (!onCreateImpedimento || !newImpedimento.descripcion.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateImpedimento(newImpedimento);
      setIsCreateOpen(false);
      setNewImpedimento({ descripcion: '', prioridad: 'Media' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async () => {
    if (!onResolveImpedimento || !selectedImpedimento || !resolucion.trim()) return;
    setIsSubmitting(true);
    try {
      await onResolveImpedimento(selectedImpedimento.id, resolucion);
      setIsResolveOpen(false);
      setSelectedImpedimento(null);
      setResolucion('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEstado = async (impedimento: Impedimento, nuevoEstado: Impedimento['estado']) => {
    if (!onUpdateImpedimento) return;
    if (nuevoEstado === 'Resuelto') {
      setSelectedImpedimento(impedimento);
      setIsResolveOpen(true);
    } else {
      await onUpdateImpedimento(impedimento.id, { estado: nuevoEstado });
    }
  };

  const getInitials = (nombre: string) => {
    return nombre
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
    });
  };

  return (
    <>
      <Sheet modal={false}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'gap-2',
              abiertos.length > 0 && 'border-red-300 text-red-700 hover:bg-red-50'
            )}
          >
            <AlertTriangle className="h-4 w-4" />
            Impedimentos
            {abiertos.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {abiertos.length}
              </Badge>
            )}
          </Button>
        </SheetTrigger>

        <SheetContent className="w-[450px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Gestión de Impedimentos
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Resumen */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">{abiertos.length}</div>
                <div className="text-xs text-red-700">Abiertos</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">{enProceso.length}</div>
                <div className="text-xs text-yellow-700">En proceso</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{resueltos.length}</div>
                <div className="text-xs text-green-700">Resueltos</div>
              </div>
            </div>

            {/* Botón crear */}
            {canManage && (
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                Nuevo Impedimento
              </Button>
            )}

            {/* Lista de impedimentos */}
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="space-y-3 pr-4">
                {impedimentos.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No hay impedimentos registrados</p>
                  </div>
                ) : (
                  impedimentos.map((impedimento) => {
                    const EstadoIcon = estadoIcons[impedimento.estado];
                    return (
                      <div
                        key={impedimento.id}
                        className={cn(
                          'p-4 rounded-lg border',
                          impedimento.estado === 'Resuelto' && 'bg-gray-50 opacity-75'
                        )}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <EstadoIcon
                              className={cn('h-4 w-4', estadoColors[impedimento.estado])}
                            />
                            <Badge
                              variant="outline"
                              className={cn('text-xs', prioridadColors[impedimento.prioridad])}
                            >
                              {impedimento.prioridad}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(impedimento.fechaReporte)}
                          </span>
                        </div>

                        {/* Descripción */}
                        <p className="text-sm text-gray-700 mb-3">
                          {impedimento.descripcion}
                        </p>

                        {/* Info adicional */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>Reportó: {impedimento.reportadoPor.nombre}</span>
                          </div>
                          {impedimento.responsable && (
                            <div className="flex items-center gap-1">
                              <Avatar className="h-4 w-4">
                                <AvatarFallback className="text-[8px]">
                                  {getInitials(impedimento.responsable.nombre)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{impedimento.responsable.nombre}</span>
                            </div>
                          )}
                          {impedimento.fechaLimite && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Límite: {formatDate(impedimento.fechaLimite)}</span>
                            </div>
                          )}
                        </div>

                        {/* Resolución si existe */}
                        {impedimento.resolucion && (
                          <div className="p-2 bg-green-50 rounded border border-green-200 mb-3">
                            <p className="text-xs text-green-800">
                              <strong>Resolución:</strong> {impedimento.resolucion}
                            </p>
                          </div>
                        )}

                        {/* Acciones */}
                        {canManage && impedimento.estado !== 'Resuelto' && (
                          <div className="flex gap-2">
                            {impedimento.estado === 'Abierto' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleUpdateEstado(impedimento, 'En proceso')
                                }
                              >
                                Iniciar
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 hover:bg-green-50"
                              onClick={() => {
                                setSelectedImpedimento(impedimento);
                                setIsResolveOpen(true);
                              }}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Resolver
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Modal crear impedimento */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Impedimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Descripción del impedimento</Label>
              <Textarea
                placeholder="Describe el impedimento o bloqueo..."
                value={newImpedimento.descripcion}
                onChange={(e) =>
                  setNewImpedimento((prev) => ({
                    ...prev,
                    descripcion: e.target.value,
                  }))
                }
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select
                  value={newImpedimento.prioridad}
                  onValueChange={(value: 'Alta' | 'Media' | 'Baja') =>
                    setNewImpedimento((prev) => ({ ...prev, prioridad: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Media">Media</SelectItem>
                    <SelectItem value="Baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Responsable de resolver</Label>
                <Select
                  value={newImpedimento.responsableId?.toString() || ''}
                  onValueChange={(value) =>
                    setNewImpedimento((prev) => ({
                      ...prev,
                      responsableId: value ? parseInt(value) : undefined,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {equipo.map((miembro) => (
                      <SelectItem key={miembro.id} value={miembro.id.toString()}>
                        {miembro.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fecha límite (opcional)</Label>
              <Input
                type="date"
                value={newImpedimento.fechaLimite || ''}
                onChange={(e) =>
                  setNewImpedimento((prev) => ({
                    ...prev,
                    fechaLimite: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Impedimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal resolver impedimento */}
      <Dialog open={isResolveOpen} onOpenChange={setIsResolveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Resolver Impedimento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedImpedimento && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{selectedImpedimento.descripcion}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>¿Cómo se resolvió?</Label>
              <Textarea
                placeholder="Describe la solución aplicada..."
                value={resolucion}
                onChange={(e) => setResolucion(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsResolveOpen(false);
                setResolucion('');
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleResolve}
              disabled={isSubmitting || !resolucion.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Marcar como Resuelto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
