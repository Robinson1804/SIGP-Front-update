'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Check,
  Loader2,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  getCriteriosByHistoria,
  createCriterioForHistoria,
  toggleCriterioCompletado,
  deleteCriterio,
} from '@/features/proyectos/services/criterios.service';

interface CriteriosAceptacionSectionProps {
  historiaId: number;
  readOnly?: boolean;
  onCriteriosChange?: (criterios: CriterioAceptacion[]) => void;
}

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
  const [newDescripcion, setNewDescripcion] = useState('');

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
    if (!newDescripcion.trim()) return;

    try {
      setIsSubmitting(true);
      const newCriterio = await createCriterioForHistoria(historiaId, {
        descripcion: newDescripcion.trim(),
        completado: false,
      });
      setCriterios([...criterios, newCriterio]);
      onCriteriosChange?.([...criterios, newCriterio]);
      setNewDescripcion('');
    } catch (err) {
      console.error('Error creating criterio:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCompletado = async (criterio: CriterioAceptacion) => {
    try {
      const updated = await toggleCriterioCompletado(criterio.id, !criterio.completado);
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

  const completados = criterios.filter((c) => c.completado).length;
  const total = criterios.length;
  const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;

  return (
    <div className="space-y-3">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="font-medium text-gray-700">Criterios de Aceptacion</span>
              <Badge variant="secondary" className="text-xs">
                {completados}/{total}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {total > 0 && (
                <span className="text-xs text-gray-500">{porcentaje}% completados</span>
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
                      onToggle={() => handleToggleCompletado(criterio)}
                      onDelete={() => setDeletingCriterio(criterio)}
                    />
                  ))}
                </div>
              )}

              {/* Formulario para agregar nuevo criterio */}
              {!readOnly && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Nuevo criterio de aceptacion..."
                    value={newDescripcion}
                    onChange={(e) => setNewDescripcion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddCriterio();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    onClick={handleAddCriterio}
                    disabled={isSubmitting || !newDescripcion.trim()}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
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
  onToggle: () => void;
  onDelete: () => void;
}

function CriterioCard({ criterio, readOnly, onToggle, onDelete }: CriterioCardProps) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border ${
        criterio.completado
          ? 'bg-green-50 border-green-200'
          : 'bg-white border-gray-200'
      }`}
    >
      {!readOnly ? (
        <button
          onClick={onToggle}
          className={`flex-shrink-0 ${
            criterio.completado ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {criterio.completado ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </button>
      ) : (
        <span className={criterio.completado ? 'text-green-600' : 'text-gray-400'}>
          {criterio.completado ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </span>
      )}

      <span
        className={`flex-1 text-sm ${
          criterio.completado ? 'text-gray-500 line-through' : 'text-gray-700'
        }`}
      >
        {criterio.descripcion}
      </span>

      {!readOnly && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
          onClick={onDelete}
          title="Eliminar"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
