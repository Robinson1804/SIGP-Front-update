"use client";

import React, { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

interface DeleteToolbarProps {
  selectedCount: number;
  onDelete: () => void;
  onCancel: () => void;
  deleting?: boolean;
}

export function DeleteToolbar({ selectedCount, onDelete, onCancel, deleting = false }: DeleteToolbarProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white border border-gray-300 rounded-lg shadow-lg px-4 py-3 flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">
          {selectedCount} seleccionado{selectedCount > 1 ? 's' : ''}
        </span>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowConfirm(true)}
          disabled={deleting}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Eliminar seleccionados
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={deleting}
        >
          <X className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar {selectedCount} elemento{selectedCount > 1 ? 's' : ''}?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConfirm(false);
                onDelete();
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
