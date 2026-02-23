'use client';

import { useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface ColumnDefinition<T> {
  key: keyof T;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select' | 'number';
  placeholder?: string;
  options?: { value: string; label: string }[];
  width?: string;
  required?: boolean;
}

interface DynamicTableProps<T extends Record<string, any>> {
  columns: ColumnDefinition<T>[];
  data: T[] | string | null | undefined;
  onChange: (data: T[]) => void;
  emptyRowTemplate: T;
  addLabel?: string;
  className?: string;
  disabled?: boolean;
}

// Helper para asegurar que data sea un array
function ensureArray<T>(value: T[] | string | null | undefined): T[] {
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

export function DynamicTable<T extends Record<string, any>>({
  columns,
  data: rawData,
  onChange,
  emptyRowTemplate,
  addLabel = 'Agregar fila',
  className,
  disabled = false,
}: DynamicTableProps<T>) {
  // Normalizar data a array
  const data = useMemo(() => ensureArray<T>(rawData), [rawData]);
  const handleAdd = () => {
    const maxId = data.reduce((max, item) => {
      const itemId = typeof item.id === 'number' ? item.id : 0;
      return Math.max(max, itemId);
    }, 0);
    onChange([...data, { ...emptyRowTemplate, id: maxId + 1 }]);
  };

  const handleRemove = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const handleUpdate = (index: number, key: keyof T, value: any) => {
    const updated = [...data];
    updated[index] = { ...updated[index], [key]: value };
    onChange(updated);
  };

  const renderCell = (row: T, rowIndex: number, column: ColumnDefinition<T>) => {
    const value = row[column.key] as any;

    if (disabled) {
      if (column.type === 'select' && column.options) {
        const option = column.options.find((o) => o.value === value);
        return <span>{option?.label || value || '-'}</span>;
      }
      return <span>{value || '-'}</span>;
    }

    switch (column.type) {
      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleUpdate(rowIndex, column.key, e.target.value)}
            placeholder={column.placeholder}
            rows={2}
            className="min-h-[60px]"
          />
        );

      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={(v) => handleUpdate(rowIndex, column.key, v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={column.placeholder || 'Seleccionar'} />
            </SelectTrigger>
            <SelectContent>
              {column.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => handleUpdate(rowIndex, column.key, e.target.value)}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => handleUpdate(rowIndex, column.key, e.target.value)}
            placeholder={column.placeholder}
          />
        );

      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleUpdate(rowIndex, column.key, e.target.value)}
            placeholder={column.placeholder}
          />
        );
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {data.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={String(column.key)}
                    style={{ width: column.width }}
                  >
                    {column.label}
                    {column.required && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </TableHead>
                ))}
                {!disabled && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow key={row.id || rowIndex}>
                  {columns.map((column) => (
                    <TableCell key={String(column.key)}>
                      {renderCell(row, rowIndex, column)}
                    </TableCell>
                  ))}
                  {!disabled && (
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(rowIndex)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground border rounded-lg border-dashed">
          <p className="text-sm">No hay elementos registrados</p>
        </div>
      )}

      {!disabled && (
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1" />
          {addLabel}
        </Button>
      )}
    </div>
  );
}
