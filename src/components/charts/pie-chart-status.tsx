'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusPieDataPoint {
  estado: string;
  cantidad: number;
  color: string;
}

interface StatusPieChartProps {
  data: StatusPieDataPoint[];
  title?: string;
  loading?: boolean;
  error?: string;
  className?: string;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
}

// Colores por defecto para estados comunes
export const DEFAULT_STATUS_COLORS: Record<string, string> = {
  // Estados de tareas
  'Por hacer': '#BFDBFE', // Light blue
  'En progreso': '#FDE68A', // Yellow
  'En revision': '#A78BFA', // Purple
  'Finalizado': '#A7F3D0', // Green
  'Completado': '#A7F3D0', // Green

  // Estados de proyectos
  'Pendiente': '#E5E7EB', // Gray
  'En planificacion': '#BFDBFE', // Light blue
  'En desarrollo': '#FDE68A', // Yellow
  'Cancelado': '#FCA5A5', // Red

  // Estados de historias
  'En analisis': '#93C5FD', // Blue
  'Lista': '#6EE7B7', // Light green
  'En pruebas': '#C4B5FD', // Light purple
  'Terminada': '#A7F3D0', // Green
};

/**
 * Componente de grafico de Pie para mostrar distribucion por estado
 */
export function StatusPieChart({
  data,
  title = 'DISTRIBUCION POR ESTADO',
  loading = false,
  error,
  className,
  showLegend = true,
  innerRadius = 50,
  outerRadius = 70,
}: StatusPieChartProps) {
  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <Skeleton className="h-40 w-40 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
            <AlertCircle className="h-12 w-12 mb-2 text-red-500" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
            <p>No hay datos disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filtrar datos con cantidad > 0
  const filteredData = data.filter((d) => d.cantidad > 0);

  if (filteredData.length === 0) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
            <p>No hay datos para mostrar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular total
  const total = filteredData.reduce((sum, d) => sum + d.cantidad, 0);

  // Aplicar colores por defecto si no se proporciona
  const dataWithColors = filteredData.map((d) => ({
    ...d,
    color: d.color || DEFAULT_STATUS_COLORS[d.estado] || '#9CA3AF',
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const porcentaje = ((data.cantidad / total) * 100).toFixed(1);

      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-semibold text-sm">{data.estado}</span>
          </div>
          <p className="text-sm text-gray-600">
            Cantidad: {data.cantidad}
          </p>
          <p className="text-sm text-gray-600">
            Porcentaje: {porcentaje}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const renderCustomLegend = () => {
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
        {dataWithColors.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span>
              {entry.estado} ({entry.cantidad})
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Renderizar label en el centro (para donut chart)
  const renderCenterLabel = () => {
    return (
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        <tspan
          x="50%"
          dy="-0.5em"
          fontSize="24"
          fontWeight="bold"
          fill="#1F2937"
        >
          {total}
        </tspan>
        <tspan
          x="50%"
          dy="1.5em"
          fontSize="12"
          fill="#6B7280"
        >
          Total
        </tspan>
      </text>
    );
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={dataWithColors}
              dataKey="cantidad"
              nameKey="estado"
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              label={false}
            >
              {dataWithColors.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {/* Centro del donut */}
            {renderCenterLabel()}
          </PieChart>
        </ResponsiveContainer>

        {showLegend && renderCustomLegend()}
      </CardContent>
    </Card>
  );
}

export default StatusPieChart;
