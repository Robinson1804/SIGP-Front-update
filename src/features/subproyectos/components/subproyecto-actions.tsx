'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Edit, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PermissionGate } from '@/features/auth';
import { paths } from '@/lib/paths';
import { MODULES, PERMISSIONS } from '@/lib/definitions';
import { useToast } from '@/lib/hooks/use-toast';
import { deleteSubproyecto } from '../services/subproyectos.service';

interface SubproyectoActionsProps {
  subproyectoId: number;
  subproyectoCodigo: string;
  subproyectoNombre: string;
}

export function SubproyectoActions({
  subproyectoId,
  subproyectoCodigo,
  subproyectoNombre,
}: SubproyectoActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteSubproyecto(subproyectoId);
      toast({
        title: 'Éxito',
        description: 'Subproyecto eliminado correctamente',
      });

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      setIsDeleteModalOpen(false);
      router.push(paths.poi.subproyectos.base);
      router.refresh();
    } catch (error) {
      console.error('Error deleting subproyecto:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el subproyecto';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <PermissionGate module={MODULES.POI} permission={PERMISSIONS.EDIT}>
          <Button asChild>
            <Link href={paths.poi.subproyectos.editar(subproyectoId)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </PermissionGate>

        <PermissionGate module={MODULES.POI} permission={PERMISSIONS.DELETE}>
          <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </PermissionGate>
      </div>

      <Dialog open={isDeleteModalOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar el subproyecto{' '}
              <span className="font-semibold">{subproyectoCodigo} - {subproyectoNombre}</span>?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Sí, eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
