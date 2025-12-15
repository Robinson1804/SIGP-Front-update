'use client';

import { useState } from 'react';
import { ProyectoCard } from './proyecto-card';
import { ProyectoFilters } from './proyecto-filters';
import type { Proyecto, ProyectoEstado } from '@/lib/definitions';

interface ProyectoListProps {
  data: Proyecto[];
}

export function ProyectoList({ data }: ProyectoListProps) {
  const [filteredData, setFilteredData] = useState(data);

  const handleFilter = (filters: {
    estado?: ProyectoEstado;
    clasificacion?: string;
    search?: string;
  }) => {
    let filtered = data;

    // Filtrar por estado
    if (filters.estado) {
      filtered = filtered.filter((item) => item.estado === filters.estado);
    }

    // Filtrar por clasificación
    if (filters.clasificacion) {
      filtered = filtered.filter(
        (item) => item.clasificacion === filters.clasificacion
      );
    }

    // Filtrar por búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.nombre.toLowerCase().includes(searchLower) ||
          item.codigo.toLowerCase().includes(searchLower) ||
          item.descripcion?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredData(filtered);
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground text-lg">
          No hay proyectos registrados
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Comienza creando tu primer proyecto
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ProyectoFilters onFilter={handleFilter} total={filteredData.length} />

      {filteredData.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No se encontraron proyectos con los filtros aplicados
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredData.map((item) => (
            <ProyectoCard key={item.id} data={item} />
          ))}
        </div>
      )}
    </div>
  );
}
