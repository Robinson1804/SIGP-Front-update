'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TendenciaMetrica {
  periodo: string;
  periodoLabel: string;
  leadTime: number;
  cycleTime: number;
  throughput: number;
  wipPromedio: number;
}

interface MetricTrendChartProps {
  data: TendenciaMetrica[];
  promedios?: {
    leadTime: number;
    cycleTime: number;
    throughput: number;
  };
  tendencias?: {
    leadTime: 'mejorando' | 'empeorando' | 'estable';
    cycleTime: 'mejorando' | 'empeorando' | 'estable';
    throughput: 'mejorando' | 'empeorando' | 'estable';
  };
  loading?: boolean;
  error?: string;
  className?: string;
}

const COLORS = {
  leadTime: '#EF4444',    // Rojo
  cycleTime: '#F59E0B',   // Amarillo
  throughput: '#22C55E',  // Verde
  wip: '#3B82F6',         // Azul
};

function getTrendIcon(tendencia: 'mejorando' | 'empeorando' | 'estable') {
  switch (tendencia) {
    case 'mejorando':
      return <TrendingUp className="h-3 w-3 text-green-500" />;
    case 'empeorando':
      return <TrendingDown className="h-3 w-3 text-red-500" />;
    default:
      return <Minus className="h-3 w-3 text-gray-500" />;
  }
}

function getTrendBadgeVariant(tendencia: 'mejorando' | 'empeorando' | 'estable'): string {
  switch (tendencia) {
    case 'mejorando':
      return 'bg-green-100 text-green-800';
    case 'empeorando':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Metric Trend Chart
 *
 * Muestra tendencias de metricas Kanban (Lead Time, Cycle Time, Throughput)
 */
export function MetricTrendChart({
  data,
  promedios,
  tendencias,
  loading = false,
  error,
  className,
}: MetricTrendChartProps) {
  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            TENDENCIAS DE METRICAS
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
            <Activity className="h-4 w-4" />
            TENDENCIAS DE METRICAS
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
            <Activity className="h-4 w-4" />
            TENDENCIAS DE METRICAS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
            <Activity className="h-10 w-10 mb-2 text-gray-300" />
            <p>No hay datos disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.stroke }}
            />
            <span>{entry.name}:</span>
            <span className="font-medium">
              {entry.value.toFixed(1)}
              {entry.dataKey === 'throughput' ? ' tareas' : ' dias'}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          TENDENCIAS DE METRICAS
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Metric cards */}
        {promedios && tendencias && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Lead Time Prom.</p>
              <p className="text-lg font-bold text-red-600">
                {promedios.leadTime.toFixed(1)}d
              </p>
              <Badge
                variant="secondary"
                className={cn('mt-1 text-xs', getTrendBadgeVariant(tendencias.leadTime))}
              >
                {getTrendIcon(tendencias.leadTime)}
                <span className="ml-1">{tendencias.leadTime}</span>
              </Badge>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Cycle Time Prom.</p>
              <p className="text-lg font-bold text-yellow-600">
                {promedios.cycleTime.toFixed(1)}d
              </p>
              <Badge
                variant="secondary"
                className={cn('mt-1 text-xs', getTrendBadgeVariant(tendencias.cycleTime))}
              >
                {getTrendIcon(tendencias.cycleTime)}
                <span className="ml-1">{tendencias.cycleTime}</span>
              </Badge>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Throughput Prom.</p>
              <p className="text-lg font-bold text-green-600">
                {promedios.throughput.toFixed(1)}
              </p>
              <Badge
                variant="secondary"
                className={cn('mt-1 text-xs', getTrendBadgeVariant(tendencias.throughput))}
              >
                {getTrendIcon(tendencias.throughput)}
                <span className="ml-1">{tendencias.throughput}</span>
              </Badge>
            </div>
          </div>
        )}

        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="periodoLabel" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="leadTime"
              name="Lead Time"
              stroke={COLORS.leadTime}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="cycleTime"
              name="Cycle Time"
              stroke={COLORS.cycleTime}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="throughput"
              name="Throughput"
              stroke={COLORS.throughput}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Definiciones */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-gray-500">
          <div>
            <span className="font-medium text-red-600">Lead Time:</span> Tiempo
            desde creacion hasta finalizacion
          </div>
          <div>
            <span className="font-medium text-yellow-600">Cycle Time:</span> Tiempo
            activo de trabajo
          </div>
          <div>
            <span className="font-medium text-green-600">Throughput:</span> Tareas
            completadas por semana
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default MetricTrendChart;
