'use client';

import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, Filter, Flag, User } from 'lucide-react';
import type { TareaPrioridad } from '../types';

export interface TaskFiltersState {
  search: string;
  prioridad: TareaPrioridad | 'todas';
  asignadoA: number | 'todos';
  conSubtareas: boolean | null;
}

interface TaskFiltersProps {
  filters: TaskFiltersState;
  onFiltersChange: (filters: TaskFiltersState) => void;
  usuarios?: { id: number; nombre: string; apellido: string }[];
}

const PRIORIDADES: { value: TareaPrioridad | 'todas'; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'Alta', label: 'Alta' },
  { value: 'Media', label: 'Media' },
  { value: 'Baja', label: 'Baja' },
];

const prioridadColors: Record<TareaPrioridad, string> = {
  'Alta': 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
  'Media': 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
  'Baja': 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
};

export function TaskFilters({
  filters,
  onFiltersChange,
  usuarios = [],
}: TaskFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search);

  const handleSearchChange = useCallback(
    (value: string) => {
      setLocalSearch(value);
      // Debounce search
      const timeoutId = setTimeout(() => {
        onFiltersChange({ ...filters, search: value });
      }, 300);
      return () => clearTimeout(timeoutId);
    },
    [filters, onFiltersChange]
  );

  const handlePrioridadClick = (prioridad: TareaPrioridad) => {
    const newPrioridad = filters.prioridad === prioridad ? 'todas' : prioridad;
    onFiltersChange({ ...filters, prioridad: newPrioridad });
  };

  const handleAsignadoChange = (value: string) => {
    const asignadoA = value === 'todos' ? 'todos' : parseInt(value, 10);
    onFiltersChange({ ...filters, asignadoA });
  };

  const handleClearFilters = () => {
    setLocalSearch('');
    onFiltersChange({
      search: '',
      prioridad: 'todas',
      asignadoA: 'todos',
      conSubtareas: null,
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.prioridad !== 'todas' ||
    filters.asignadoA !== 'todos' ||
    filters.conSubtareas !== null;

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg border">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Buscar tareas..."
          className="pl-9"
        />
        {localSearch && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6"
            onClick={() => handleSearchChange('')}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Priority Chips */}
      <div className="flex items-center gap-1">
        <Flag className="w-4 h-4 text-muted-foreground mr-1" />
        {(['Alta', 'Media', 'Baja'] as TareaPrioridad[]).map((prioridad) => (
          <Badge
            key={prioridad}
            variant="outline"
            className={`cursor-pointer transition-colors ${
              filters.prioridad === prioridad
                ? prioridadColors[prioridad]
                : 'hover:bg-muted'
            }`}
            onClick={() => handlePrioridadClick(prioridad)}
          >
            {prioridad}
          </Badge>
        ))}
      </div>

      {/* Assignee Filter */}
      {usuarios.length > 0 && (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <Select
            value={String(filters.asignadoA)}
            onValueChange={handleAsignadoChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Asignado a..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {usuarios.map((usuario) => (
                <SelectItem key={usuario.id} value={String(usuario.id)}>
                  {usuario.nombre} {usuario.apellido}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="text-muted-foreground"
        >
          <X className="w-4 h-4 mr-1" />
          Limpiar filtros
        </Button>
      )}

      {/* Active Filters Count */}
      {hasActiveFilters && (
        <Badge variant="secondary" className="ml-auto">
          <Filter className="w-3 h-3 mr-1" />
          {[
            filters.search && 'busqueda',
            filters.prioridad !== 'todas' && 'prioridad',
            filters.asignadoA !== 'todos' && 'asignado',
          ]
            .filter(Boolean)
            .length}{' '}
          filtros activos
        </Badge>
      )}
    </div>
  );
}
