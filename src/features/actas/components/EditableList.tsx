'use client';

import { useState, useMemo } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EditableListProps {
  items: string[] | string | null | undefined;
  onChange: (items: string[]) => void;
  placeholder?: string;
  addLabel?: string;
  className?: string;
  disabled?: boolean;
}

// Helper para asegurar que items sea un array
function ensureArray(value: string[] | string | null | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function EditableList({
  items: rawItems,
  onChange,
  placeholder = 'Ingrese un item',
  addLabel = 'Agregar item',
  className,
  disabled = false,
}: EditableListProps) {
  // Normalizar items a array
  const items = useMemo(() => ensureArray(rawItems), [rawItems]);
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim()) {
      onChange([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleUpdate = (index: number, value: string) => {
    const updated = [...items];
    updated[index] = value;
    onChange(updated);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Existing items */}
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
          <Input
            value={item}
            onChange={(e) => handleUpdate(index, e.target.value)}
            disabled={disabled}
            className="flex-1"
          />
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(index)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}

      {/* Add new item */}
      {!disabled && (
        <div className="flex items-center gap-2 pt-2">
          <div className="w-4" /> {/* Spacer for alignment */}
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            disabled={!newItem.trim()}
          >
            <Plus className="h-4 w-4 mr-1" />
            {addLabel}
          </Button>
        </div>
      )}

      {items.length === 0 && disabled && (
        <p className="text-sm text-muted-foreground italic">Sin elementos</p>
      )}
    </div>
  );
}
