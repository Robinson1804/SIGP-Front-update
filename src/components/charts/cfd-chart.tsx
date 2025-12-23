'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Layers, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CfdDataPoint {
  fecha: string;
  porHacer: number;
  enProgreso: number;
  enRevision: number;
  finalizado: number;
  total: number;
}

interface CfdChartProps {
  data: CfdDataPoint[];
  loading?: boolean;
  error?: string;
  className?: string;
  title?: string;
}

const COLORS = {
  porHacer: '#94A3B8',    // Gris
  enProgreso: '#3B82F6',  // Azul
  enRevision: '#F59E0B',  // Amarillo
  finalizado: '#22C55E',  // Verde
};

const LABELS = {
  porHacer: 'Por hacer',
  enProgreso: 'En progreso',
  enRevision: 'En revision',
  finalizado: 'Finalizado',
};

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  } catch {
    return dateStr;
  }
}

/**
 * Cumulative Flow Diagram Chart
 *
 * Muestra el flujo acumulado de tareas a traves de estados Kanban
 */
export function CfdChart({
  data,
  loading = false,
  error,
  className,
  title = 'DIAGRAMA DE FLUJO ACUMULADO (CFD)',
}: CfdChartProps) {
  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
            <AlertCircle className="h-10 w-10 mb-2 text-red-500" />
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
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
            <Layers className="h-10 w-10 mb-2 text-gray-300" />
            <p>No hay datos disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preparar datos formateados para el chart
  const chartData = data.map((d) => ({
    ...d,
    fechaFormatted: formatDate(d.fecha),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium mb-2">{label}</p>
        {payload.reverse().map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: entry.fill }}
            />
            <span>{entry.name}:</span>
            <span className="font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Layers className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="fechaFormatted"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="finalizado"
              name={LABELS.finalizado}
              stackId="1"
              stroke={COLORS.finalizado}
              fill={COLORS.finalizado}
            />
            <Area
              type="monotone"
              dataKey="enRevision"
              name={LABELS.enRevision}
              stackId="1"
              stroke={COLORS.enRevision}
              fill={COLORS.enRevision}
            />
            <Area
              type="monotone"
              dataKey="enProgreso"
              name={LABELS.enProgreso}
              stackId="1"
              stroke={COLORS.enProgreso}
              fill={COLORS.enProgreso}
            />
            <Area
              type="monotone"
              dataKey="porHacer"
              name={LABELS.porHacer}
              stackId="1"
              stroke={COLORS.porHacer}
              fill={COLORS.porHacer}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Info del CFD */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          El CFD muestra el flujo acumulado de tareas. Un flujo saludable mantiene
          las bandas consistentes sin cuellos de botella.
        </div>
      </CardContent>
    </Card>
  );
}

export default CfdChart;
