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
import type { ProyectoEstado, ProyectoClasificacion } from '@/lib/definitions';

interface ProyectoFiltersProps {
  onFilter: (filters: {
    estado?: ProyectoEstado;
    clasificacion?: ProyectoClasificacion;
    search?: string;
  }) => void;
  total: number;
}

export function ProyectoFilters({ onFilter, total }: ProyectoFiltersProps) {
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState<ProyectoEstado | ''>('');
  const [clasificacion, setClasificacion] = useState<ProyectoClasificacion | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    applyFilters({ search: value, estado, clasificacion });
  };

  const handleEstadoChange = (value: string) => {
    const newEstado = value === 'todos' ? '' : (value as ProyectoEstado);
    setEstado(newEstado);
    applyFilters({ search, estado: newEstado, clasificacion });
  };

  const handleClasificacionChange = (value: string) => {
    const newClasificacion = value === 'todos' ? '' : (value as ProyectoClasificacion);
    setClasificacion(newClasificacion);
    applyFilters({ search, estado, clasificacion: newClasificacion });
  };

  const applyFilters = (filters: {
    search?: string;
    estado?: ProyectoEstado | '';
    clasificacion?: ProyectoClasificacion | '';
  }) => {
    onFilter({
      ...(filters.search && { search: filters.search }),
      ...(filters.estado && { estado: filters.estado as ProyectoEstado }),
      ...(filters.clasificacion && {
        clasificacion: filters.clasificacion as ProyectoClasificacion,
      }),
    });
  };

  const clearFilters = () => {
    setSearch('');
    setEstado('');
    setClasificacion('');
    onFilter({});
  };

  const hasActiveFilters = search || estado || clasificacion;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {/* Búsqueda */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar proyectos..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Toggle filtros */}
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
        </Button>

        {/* Limpiar filtros */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
        )}

        {/* Total */}
        <Badge variant="secondary" className="ml-auto">
          {total} {total === 1 ? 'proyecto' : 'proyectos'}
        </Badge>
      </div>

      {/* Filtros avanzados */}
      {showFilters && (
        <div className="flex gap-4 p-4 bg-muted rounded-lg">
          {/* Filtro por estado */}
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Estado</label>
            <Select value={estado || 'todos'} onValueChange={handleEstadoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="En planificacion">En planificación</SelectItem>
                <SelectItem value="En desarrollo">En desarrollo</SelectItem>
                <SelectItem value="Finalizado">Finalizado</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por clasificación */}
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Clasificación</label>
            <Select
              value={clasificacion || 'todos'}
              onValueChange={handleClasificacionChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las clasificaciones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="Al ciudadano">Al ciudadano</SelectItem>
                <SelectItem value="Gestion interna">Gestión interna</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
