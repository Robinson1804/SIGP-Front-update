'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  REQUERIMIENTO_PRIORIDADES,
  REQUERIMIENTO_TIPOS,
  type RequerimientoPrioridad,
  type RequerimientoTipo,
  type RequerimientoFilters,
} from '../types';

interface RequerimientoFiltersProps {
  onFilter: (filters: RequerimientoFilters) => void;
  total: number;
  filteredTotal: number;
}

export function RequerimientoFiltersComponent({
  onFilter,
  total,
  filteredTotal,
}: RequerimientoFiltersProps) {
  const [search, setSearch] = useState('');
  const [tipo, setTipo] = useState<RequerimientoTipo | ''>('');
  const [prioridad, setPrioridad] = useState<RequerimientoPrioridad | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  const applyFilters = (newFilters: Partial<RequerimientoFilters>) => {
    const filters: RequerimientoFilters = {
      ...(search && { search }),
      ...(tipo && { tipo }),
      ...(prioridad && { prioridad }),
      ...newFilters,
    };

    // Limpiar propiedades vacías
    Object.keys(filters).forEach((key) => {
      if (!filters[key as keyof RequerimientoFilters]) {
        delete filters[key as keyof RequerimientoFilters];
      }
    });

    onFilter(filters);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    applyFilters({ search: value || undefined });
  };

  const handleTipoChange = (value: string) => {
    const newTipo = value === 'todos' ? '' : (value as RequerimientoTipo);
    setTipo(newTipo);
    applyFilters({ tipo: newTipo || undefined });
  };

  const handlePrioridadChange = (value: string) => {
    const newPrioridad = value === 'todos' ? '' : (value as RequerimientoPrioridad);
    setPrioridad(newPrioridad);
    applyFilters({ prioridad: newPrioridad || undefined });
  };

  const clearFilters = () => {
    setSearch('');
    setTipo('');
    setPrioridad('');
    onFilter({});
  };

  const hasActiveFilters = search || tipo || prioridad;
  const activeFilterCount = [search, tipo, prioridad].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Barra principal de búsqueda y controles */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código o nombre..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Toggle filtros avanzados */}
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {/* Limpiar filtros */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Limpiar
          </Button>
        )}

        {/* Contador de resultados */}
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline">
            {filteredTotal === total
              ? `${total} requerimientos`
              : `${filteredTotal} de ${total}`}
          </Badge>
        </div>
      </div>

      {/* Filtros avanzados */}
      {showFilters && (
        <div className="flex gap-4 p-4 bg-muted/50 rounded-lg flex-wrap">
          {/* Filtro por tipo */}
          <div className="min-w-[180px]">
            <label className="text-sm font-medium mb-2 block">Tipo</label>
            <Select value={tipo || 'todos'} onValueChange={handleTipoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                {REQUERIMIENTO_TIPOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por prioridad */}
          <div className="min-w-[180px]">
            <label className="text-sm font-medium mb-2 block">Prioridad</label>
            <Select value={prioridad || 'todos'} onValueChange={handlePrioridadChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las prioridades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                {REQUERIMIENTO_PRIORIDADES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
