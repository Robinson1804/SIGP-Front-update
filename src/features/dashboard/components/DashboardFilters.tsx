'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import type { DashboardFiltros, PeriodoFiltro } from '../types';

interface DashboardFiltersProps {
  filtros: DashboardFiltros;
  onFiltrosChange: (filtros: DashboardFiltros) => void;
  onLimpiar?: () => void;
  proyectos?: { id: number; nombre: string }[];
  oeis?: { id: number; codigo: string; nombre: string }[];
  className?: string;
}

/**
 * Componente de filtros para el dashboard
 *
 * Permite filtrar por período, proyecto y OEI
 */
export function DashboardFilters({
  filtros,
  onFiltrosChange,
  onLimpiar,
  proyectos = [],
  oeis = [],
  className,
}: DashboardFiltersProps) {
  const handlePeriodoChange = (value: string) => {
    onFiltrosChange({
      ...filtros,
      periodo: value as PeriodoFiltro,
    });
  };

  const handleProyectoChange = (value: string) => {
    onFiltrosChange({
      ...filtros,
      proyectoId: value === 'todos' ? undefined : parseInt(value),
    });
  };

  const handleOEIChange = (value: string) => {
    onFiltrosChange({
      ...filtros,
      oeiId: value === 'todos' ? undefined : parseInt(value),
    });
  };

  const handleLimpiar = () => {
    if (onLimpiar) {
      onLimpiar();
    } else {
      onFiltrosChange({
        periodo: 'mes',
        proyectoId: undefined,
        oeiId: undefined,
      });
    }
  };

  const hasFiltrosActivos =
    filtros.periodo !== 'mes' || filtros.proyectoId || filtros.oeiId;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Filter className="w-4 h-4" />
          <span>Filtros:</span>
        </div>

        {/* Periodo */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">Período:</label>
          <Select
            value={filtros.periodo || 'mes'}
            onValueChange={handlePeriodoChange}
          >
            <SelectTrigger className="w-[140px] h-9 text-sm">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semana">Esta semana</SelectItem>
              <SelectItem value="mes">Este mes</SelectItem>
              <SelectItem value="trimestre">Trimestre</SelectItem>
              <SelectItem value="anno">Este año</SelectItem>
              <SelectItem value="todo">Todo el período</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Proyecto */}
        {proyectos.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">Proyecto:</label>
            <Select
              value={filtros.proyectoId?.toString() || 'todos'}
              onValueChange={handleProyectoChange}
            >
              <SelectTrigger className="w-[180px] h-9 text-sm">
                <SelectValue placeholder="Todos los proyectos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los proyectos</SelectItem>
                {proyectos.map((proyecto) => (
                  <SelectItem key={proyecto.id} value={proyecto.id.toString()}>
                    {proyecto.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* OEI */}
        {oeis.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">OEI:</label>
            <Select
              value={filtros.oeiId?.toString() || 'todos'}
              onValueChange={handleOEIChange}
            >
              <SelectTrigger className="w-[200px] h-9 text-sm">
                <SelectValue placeholder="Todos los OEI" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los OEI</SelectItem>
                {oeis.map((oei) => (
                  <SelectItem key={oei.id} value={oei.id.toString()}>
                    {oei.codigo} - {oei.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Botón limpiar */}
        {hasFiltrosActivos && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleLimpiar}
            className="h-9 gap-2"
          >
            <X className="w-4 h-4" />
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
