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

interface DonutDataPoint {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutDataPoint[];
  title?: string;
  loading?: boolean;
  error?: string;
  className?: string;
  showLegend?: boolean;
  showPercentage?: boolean;
}

/**
 * Gráfico de dona (donut chart) con percentages
 *
 * Versión mejorada del pie chart con centro hueco y mejor visualización
 */
export function DonutChart({
  data,
  title,
  loading = false,
  error,
  className,
  showLegend = true,
  showPercentage = true,
}: DonutChartProps) {
  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        {title && (
          <CardHeader>
            <CardTitle className="text-base">{title}</CardTitle>
          </CardHeader>
        )}
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
        {title && (
          <CardHeader>
            <CardTitle className="text-base">{title}</CardTitle>
          </CardHeader>
        )}
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
        {title && (
          <CardHeader>
            <CardTitle className="text-base">{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
            <p>No hay datos disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular total y porcentajes
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithPercentage = data.map((item) => ({
    ...item,
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0',
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: data.payload.color }}
            />
            <span className="font-semibold text-sm">{data.name}</span>
          </div>
          <p className="text-sm text-gray-600">Cantidad: {data.value}</p>
          {showPercentage && (
            <p className="text-sm text-gray-600">
              Porcentaje: {data.payload.percentage}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom label para mostrar en el gráfico
  const renderLabel = (entry: any) => {
    if (!showPercentage) return '';
    return `${entry.percentage}%`;
  };

  return (
    <Card className={cn('w-full', className)}>
      {title && (
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={dataWithPercentage}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              label={showPercentage ? renderLabel : false}
              labelLine={false}
            >
              {dataWithPercentage.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Centro del donut con total */}
        <div className="flex flex-col items-center justify-center -mt-[140px] mb-[100px] pointer-events-none">
          <span className="text-3xl font-bold text-gray-900">{total}</span>
          <span className="text-sm text-gray-500">Total</span>
        </div>

        {/* Leyenda personalizada */}
        {showLegend && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {dataWithPercentage.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="truncate">
                  {entry.name} ({entry.value})
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DonutChart;
