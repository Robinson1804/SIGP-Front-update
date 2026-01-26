'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2, Loader2 } from 'lucide-react';
import type { Subtarea, SubtareaEstado } from '../types';
import { updateSubtarea, deleteSubtarea } from '../services/subtareas.service';

interface SubtareaItemProps {
  subtarea: Subtarea;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  onUpdate: (subtarea: Subtarea) => void;
  onDelete: (subtareaId: number) => void;
}

const prioridadColors: Record<string, string> = {
  'Alta': 'bg-red-100 text-red-700',
  'Media': 'bg-yellow-100 text-yellow-700',
  'Baja': 'bg-green-100 text-green-700',
};

export function SubtareaItem({
  subtarea,
  isDragging = false,
  dragHandleProps,
  onUpdate,
  onDelete,
}: SubtareaItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isCompleted = subtarea.estado === 'Finalizado';

  const handleToggleComplete = async () => {
    setIsUpdating(true);
    try {
      const nuevoEstado: SubtareaEstado = isCompleted ? 'Por hacer' : 'Finalizado';
      const updated = await updateSubtarea(subtarea.id, { estado: nuevoEstado });
      onUpdate(updated);
    } catch (error) {
      console.error('Error updating subtarea:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteSubtarea(subtarea.id);
      onDelete(subtarea.id);
    } catch (error) {
      console.error('Error deleting subtarea:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={`
        flex items-center gap-2 p-2 rounded-md border bg-background
        ${isDragging ? 'opacity-50 shadow-lg' : ''}
        ${isCompleted ? 'bg-muted/50' : ''}
        group hover:bg-muted/30 transition-colors
      `}
    >
      {/* Drag Handle */}
      <div
        {...dragHandleProps}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Checkbox */}
      <Checkbox
        checked={isCompleted}
        onCheckedChange={handleToggleComplete}
        disabled={isUpdating}
        className="data-[state=checked]:bg-green-600"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <span
          className={`text-sm ${isCompleted ? 'line-through text-muted-foreground' : ''}`}
        >
          {subtarea.nombre}
        </span>
      </div>

      {/* Priority Badge */}
      <Badge
        variant="secondary"
        className={`text-xs ${prioridadColors[subtarea.prioridad] || ''}`}
      >
        {subtarea.prioridad}
      </Badge>

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="icon"
        className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
        )}
      </Button>
    </div>
  );
}
