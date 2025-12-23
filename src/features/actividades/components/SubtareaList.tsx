'use client';

import { useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Loader2 } from 'lucide-react';
import type { Subtarea } from '../types';
import { SubtareaItem } from './SubtareaItem';
import { createSubtarea, reordenarSubtareas } from '../services/subtareas.service';

interface SubtareaListProps {
  tareaId: number;
  subtareas: Subtarea[];
  onSubtareasChange: (subtareas: Subtarea[]) => void;
}

export function SubtareaList({
  tareaId,
  subtareas,
  onSubtareasChange,
}: SubtareaListProps) {
  const [newSubtareaNombre, setNewSubtareaNombre] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(subtareas);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Optimistically update UI
    onSubtareasChange(items);

    // Persist to backend
    try {
      const orden = items.map((s) => s.id);
      await reordenarSubtareas(tareaId, orden);
    } catch (error) {
      console.error('Error reordering subtareas:', error);
      // Revert on error
      onSubtareasChange(subtareas);
    }
  };

  const handleAddSubtarea = async () => {
    if (!newSubtareaNombre.trim()) return;

    setIsAdding(true);
    try {
      const newSubtarea = await createSubtarea({
        tareaId,
        nombre: newSubtareaNombre.trim(),
        prioridad: 'Media',
      });
      onSubtareasChange([...subtareas, newSubtarea]);
      setNewSubtareaNombre('');
      setShowAddInput(false);
    } catch (error) {
      console.error('Error creating subtarea:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddSubtarea();
    } else if (e.key === 'Escape') {
      setShowAddInput(false);
      setNewSubtareaNombre('');
    }
  };

  const handleUpdateSubtarea = (updated: Subtarea) => {
    const newSubtareas = subtareas.map((s) =>
      s.id === updated.id ? updated : s
    );
    onSubtareasChange(newSubtareas);
  };

  const handleDeleteSubtarea = (subtareaId: number) => {
    const newSubtareas = subtareas.filter((s) => s.id !== subtareaId);
    onSubtareasChange(newSubtareas);
  };

  return (
    <div className="space-y-2">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="subtareas">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-1"
            >
              {subtareas.map((subtarea, index) => (
                <Draggable
                  key={subtarea.id}
                  draggableId={String(subtarea.id)}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                    >
                      <SubtareaItem
                        subtarea={subtarea}
                        isDragging={snapshot.isDragging}
                        dragHandleProps={provided.dragHandleProps ?? undefined}
                        onUpdate={handleUpdateSubtarea}
                        onDelete={handleDeleteSubtarea}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add Subtarea */}
      {showAddInput ? (
        <div className="flex items-center gap-2">
          <Input
            value={newSubtareaNombre}
            onChange={(e) => setNewSubtareaNombre(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nombre de la subtarea..."
            autoFocus
            disabled={isAdding}
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={handleAddSubtarea}
            disabled={isAdding || !newSubtareaNombre.trim()}
          >
            {isAdding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAddInput(true)}
          className="w-full justify-start text-muted-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar subtarea
        </Button>
      )}

      {/* Empty State */}
      {subtareas.length === 0 && !showAddInput && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No hay subtareas. Agrega una para dividir el trabajo.
        </p>
      )}
    </div>
  );
}
