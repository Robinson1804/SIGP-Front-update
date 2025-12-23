'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Check,
  X,
  AlertCircle,
  Loader2,
  GripVertical,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import {
  type CriterioAceptacion,
  type CriterioEstado,
  getCriteriosByHistoria,
  createCriterioForHistoria,
  updateCriterio,
  deleteCriterio,
  verificarCriterio,
} from '@/features/proyectos/services/criterios.service';

interface CriteriosAceptacionSectionProps {
  historiaId: number;
  readOnly?: boolean;
  onCriteriosChange?: (criterios: CriterioAceptacion[]) => void;
}

interface CriterioPendiente {
  id: string;
  given: string;
  when: string;
  then: string;
}

const ESTADO_CONFIG: Record<
  CriterioEstado,
  { icon: React.ElementType; color: string; label: string }
> = {
  Pendiente: {
    icon: Clock,
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    label: 'Pendiente',
  },
  Cumplido: {
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-700 border-green-200',
    label: 'Cumplido',
  },
  Fallido: {
    icon: XCircle,
    color: 'bg-red-100 text-red-700 border-red-200',
    label: 'Fallido',
  },
};

export function CriteriosAceptacionSection({
  historiaId,
  readOnly = false,
  onCriteriosChange,
}: CriteriosAceptacionSectionProps) {
  const [criterios, setCriterios] = useState<CriterioAceptacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  // Form state for new criterio
  const [newGiven, setNewGiven] = useState('');
  const [newWhen, setNewWhen] = useState('');
  const [newThen, setNewThen] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Delete confirmation
  const [deletingCriterio, setDeletingCriterio] = useState<CriterioAceptacion | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadCriterios();
  }, [historiaId]);

  const loadCriterios = async () => {
    try {
      setIsLoading(true);
      const data = await getCriteriosByHistoria(historiaId);
      setCriterios(data);
      onCriteriosChange?.(data);
    } catch (err) {
      console.error('Error loading criterios:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCriterio = async () => {
    if (!newGiven.trim() || !newWhen.trim() || !newThen.trim()) return;

    try {
      setIsSubmitting(true);
      const newCriterio = await createCriterioForHistoria(historiaId, {
        given: newGiven.trim(),
        when: newWhen.trim(),
        then: newThen.trim(),
      });
      setCriterios([...criterios, newCriterio]);
      onCriteriosChange?.([...criterios, newCriterio]);
      setNewGiven('');
      setNewWhen('');
      setNewThen('');
      setIsAddingNew(false);
    } catch (err) {
      console.error('Error creating criterio:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerificar = async (criterio: CriterioAceptacion, estado: CriterioEstado) => {
    try {
      const updated = await verificarCriterio(criterio.id, estado);
      const newCriterios = criterios.map((c) => (c.id === criterio.id ? updated : c));
      setCriterios(newCriterios);
      onCriteriosChange?.(newCriterios);
    } catch (err) {
      console.error('Error updating criterio:', err);
    }
  };

  const handleDelete = async () => {
    if (!deletingCriterio) return;

    try {
      setIsDeleting(true);
      await deleteCriterio(deletingCriterio.id);
      const newCriterios = criterios.filter((c) => c.id !== deletingCriterio.id);
      setCriterios(newCriterios);
      onCriteriosChange?.(newCriterios);
      setDeletingCriterio(null);
    } catch (err) {
      console.error('Error deleting criterio:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const cumplidos = criterios.filter((c) => c.estado === 'Cumplido').length;
  const total = criterios.length;
  const porcentaje = total > 0 ? Math.round((cumplidos / total) * 100) : 0;

  return (
    <div className="space-y-3">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="font-medium text-gray-700">Criterios de Aceptacion</span>
              <Badge variant="secondary" className="text-xs">
                {cumplidos}/{total}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {total > 0 && (
                <span className="text-xs text-gray-500">{porcentaje}% cumplidos</span>
              )}
              <svg
                className={`h-4 w-4 text-gray-500 transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="pt-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Lista de criterios */}
              {criterios.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No hay criterios de aceptacion definidos
                </div>
              ) : (
                <div className="space-y-2">
                  {criterios.map((criterio) => (
                    <CriterioCard
                      key={criterio.id}
                      criterio={criterio}
                      readOnly={readOnly}
                      onVerificar={handleVerificar}
                      onDelete={() => setDeletingCriterio(criterio)}
                    />
                  ))}
                </div>
              )}

              {/* Formulario para agregar nuevo criterio */}
              {!readOnly && (
                <>
                  {isAddingNew ? (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                      <p className="text-sm font-medium text-blue-800">
                        Nuevo Criterio de Aceptacion (Formato GWT)
                      </p>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs text-blue-700">DADO QUE (Given)</Label>
                          <Input
                            placeholder="El usuario esta autenticado"
                            value={newGiven}
                            onChange={(e) => setNewGiven(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-blue-700">CUANDO (When)</Label>
                          <Input
                            placeholder="El usuario hace click en cerrar sesion"
                            value={newWhen}
                            onChange={(e) => setNewWhen(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-blue-700">ENTONCES (Then)</Label>
                          <Input
                            placeholder="El sistema redirige al login"
                            value={newThen}
                            onChange={(e) => setNewThen(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={handleAddCriterio}
                          disabled={
                            isSubmitting ||
                            !newGiven.trim() ||
                            !newWhen.trim() ||
                            !newThen.trim()
                          }
                        >
                          {isSubmitting && (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          )}
                          Agregar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setIsAddingNew(false);
                            setNewGiven('');
                            setNewWhen('');
                            setNewThen('');
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => setIsAddingNew(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Agregar Criterio
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deletingCriterio}
        onOpenChange={() => setDeletingCriterio(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Criterio de Aceptacion</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion eliminara el criterio de aceptacion. Esta accion no se puede
              deshacer.
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

interface CriterioCardProps {
  criterio: CriterioAceptacion;
  readOnly: boolean;
  onVerificar: (criterio: CriterioAceptacion, estado: CriterioEstado) => void;
  onDelete: () => void;
}

function CriterioCard({ criterio, readOnly, onVerificar, onDelete }: CriterioCardProps) {
  const estadoConfig = ESTADO_CONFIG[criterio.estado];
  const EstadoIcon = estadoConfig.icon;

  return (
    <div className={`p-3 rounded-lg border ${estadoConfig.color}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1.5 text-sm">
          <div>
            <span className="font-medium text-gray-600">DADO QUE: </span>
            <span>{criterio.given}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">CUANDO: </span>
            <span>{criterio.when}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">ENTONCES: </span>
            <span>{criterio.then}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!readOnly && (
            <>
              {criterio.estado !== 'Cumplido' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-100"
                  onClick={() => onVerificar(criterio, 'Cumplido')}
                  title="Marcar como Cumplido"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              {criterio.estado !== 'Fallido' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-100"
                  onClick={() => onVerificar(criterio, 'Fallido')}
                  title="Marcar como Fallido"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              {criterio.estado !== 'Pendiente' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                  onClick={() => onVerificar(criterio, 'Pendiente')}
                  title="Marcar como Pendiente"
                >
                  <Clock className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                onClick={onDelete}
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
          <Badge variant="outline" className={`text-xs ${estadoConfig.color}`}>
            <EstadoIcon className="h-3 w-3 mr-1" />
            {estadoConfig.label}
          </Badge>
        </div>
      </div>
    </div>
  );
}
