'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SaludProyectosDetallada, ProyectoSaludDetalle } from '../types';

interface SaludProyectosDonutProps {
  data: SaludProyectosDetallada | null;
  loading?: boolean;
  error?: string;
  className?: string;
  onSegmentClick?: (salud: 'verde' | 'amarillo' | 'rojo', proyectos: ProyectoSaludDetalle[]) => void;
}

const COLORS = {
  verde: '#22C55E',
  amarillo: '#EAB308',
  rojo: '#EF4444',
};

const LABELS = {
  verde: 'En tiempo',
  amarillo: 'En riesgo',
  rojo: 'Atrasados',
};

/**
 * Dona de Salud de Proyectos
 *
 * Muestra distribución de proyectos activos por estado de salud:
 * - Verde: Proyectos que van en tiempo según cronograma
 * - Amarillo: Proyectos en riesgo de atraso
 * - Rojo: Proyectos atrasados o con problemas críticos
 *
 * Funcionalidad:
 * - Hover sobre segmentos muestra detalles específicos
 * - Click en segmentos o leyenda ejecuta onSegmentClick (si está configurado)
 * - Centro muestra total de proyectos cuando no hay hover
 */
export function SaludProyectosDonut({
  data,
  loading = false,
  error,
  className,
  onSegmentClick,
}: SaludProyectosDonutProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4" />
            SALUD DE PROYECTOS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <Skeleton className="h-[200px] w-[200px] rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4" />
            SALUD DE PROYECTOS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
            <AlertCircle className="h-10 w-10 mb-2 text-red-500" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || (data.resumen.verde === 0 && data.resumen.amarillo === 0 && data.resumen.rojo === 0)) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4" />
            SALUD DE PROYECTOS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
            <Heart className="h-10 w-10 mb-2 text-gray-300" />
            <p>No hay proyectos para analizar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    { name: 'verde', value: data.resumen.verde, color: COLORS.verde, label: LABELS.verde },
    { name: 'amarillo', value: data.resumen.amarillo, color: COLORS.amarillo, label: LABELS.amarillo },
    { name: 'rojo', value: data.resumen.rojo, color: COLORS.rojo, label: LABELS.rojo },
  ].filter((item) => item.value > 0);

  const total = data.resumen.verde + data.resumen.amarillo + data.resumen.rojo;

  // Active shape renderer for hover effect
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;

    return (
      <g>
        <text x={cx} y={cy - 10} textAnchor="middle" fill="#333" className="text-lg font-bold">
          {payload.value}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#666" className="text-xs">
          {payload.label}
        </text>
        <text x={cx} y={cy + 25} textAnchor="middle" fill="#999" className="text-xs">
          ({(percent * 100).toFixed(0)}%)
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 4}
          outerRadius={innerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  const handleClick = (entry: any, index: number) => {
    if (onSegmentClick) {
      const salud = entry.name as 'verde' | 'amarillo' | 'rojo';
      onSegmentClick(salud, data[salud]);
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Heart className="h-4 w-4" />
          SALUD DE PROYECTOS
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Contenedor del gráfico con posicionamiento relativo */}
        <div className="relative flex items-center justify-center">
          <ResponsiveContainer width={220} height={220}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                activeIndex={activeIndex ?? undefined}
                activeShape={renderActiveShape}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onClick={handleClick}
                cursor={onSegmentClick ? 'pointer' : 'default'}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Texto central cuando no hay hover - posicionado dentro del gráfico */}
          {activeIndex === null && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">{total}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">proyectos</p>
              </div>
            </div>
          )}
        </div>

        {/* Leyenda con indicadores de color y contadores */}
        <div className="flex flex-col gap-2 mt-6 px-2">
          {chartData.map((item) => (
            <button
              key={item.name}
              className={cn(
                'flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-all',
                'border border-gray-200',
                onSegmentClick && 'hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm cursor-pointer'
              )}
              onClick={() => onSegmentClick && handleClick(item, 0)}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium text-gray-700">
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">{item.value}</span>
                <span className="text-xs text-gray-500">
                  ({((item.value / total) * 100).toFixed(0)}%)
                </span>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default SaludProyectosDonut;
