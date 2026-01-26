'use client';

import { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
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
import { deleteSprint, type Sprint } from '@/features/proyectos/services/sprints.service';

interface SprintDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprint: Sprint | null;
  onSuccess: () => void;
}

export function SprintDeleteModal({
  open,
  onOpenChange,
  sprint,
  onSuccess,
}: SprintDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!sprint) return;

    try {
      setIsDeleting(true);
      await deleteSprint(sprint.id);
      onSuccess();
    } catch (error) {
      console.error('Error al eliminar sprint:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <AlertDialogTitle>Eliminar Sprint</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            <span className="block mb-2">
              Estas a punto de eliminar el sprint <strong>&quot;{sprint?.nombre}&quot;</strong>.
            </span>
            <span className="block text-red-600 font-medium">
              Esta accion eliminara permanentemente el sprint junto con todas sus historias de usuario y tareas asociadas.
            </span>
            <span className="block mt-2">
              Esta accion no se puede deshacer.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isDeleting ? 'Eliminando...' : 'Eliminar Sprint'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
