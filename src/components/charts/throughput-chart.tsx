'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThroughputDataPoint {
  periodo: string;
  periodoLabel: string;
  tareasCompletadas: number;
  subtareasCompletadas?: number;
}

interface ThroughputChartProps {
  data: ThroughputDataPoint[];
  throughputPromedio?: number;
  loading?: boolean;
  error?: string;
  className?: string;
  showSubtareas?: boolean;
}

// Colores INEI
const COLORS = {
  tareas: '#004272', // INEI blue
  subtareas: '#018CD1', // INEI accent
  promedio: '#10B981', // Green for average
  grid: '#E5E7EB',
  fill: '#004272',
  fillOpacity: 0.1,
};

/**
 * Componente de grafico de Throughput
 *
 * Muestra las tareas completadas a lo largo del tiempo (Kanban)
 */
export function ThroughputChart({
  data,
  throughputPromedio,
  loading = false,
  error,
  className,
  showSubtareas = false,
}: ThroughputChartProps) {
  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-base">THROUGHPUT</CardTitle>
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
          <CardTitle className="text-base">THROUGHPUT</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
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
          <CardTitle className="text-base">THROUGHPUT</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
            <p>No hay datos de throughput disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular promedio si no se proporciona
  const promedioCalculado =
    throughputPromedio ??
    data.reduce((sum, d) => sum + d.tareasCompletadas, 0) / data.length;

  // Calcular totales
  const totalTareas = data.reduce((sum, d) => sum + d.tareasCompletadas, 0);
  const totalSubtareas = data.reduce((sum, d) => sum + (d.subtareasCompletadas ?? 0), 0);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = data.find((d) => d.periodoLabel === label);
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className="text-sm"
              style={{ color: entry.color }}
            >
              {entry.name}: {entry.value}
            </p>
          ))}
          {dataPoint && showSubtareas && dataPoint.subtareasCompletadas !== undefined && (
            <p className="text-sm text-gray-500 mt-1">
              Total: {dataPoint.tareasCompletadas + dataPoint.subtareasCompletadas}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="text-base">THROUGHPUT</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorTareas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.tareas} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.tareas} stopOpacity={0} />
              </linearGradient>
              {showSubtareas && (
                <linearGradient id="colorSubtareas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.subtareas} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.subtareas} stopOpacity={0} />
                </linearGradient>
              )}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={COLORS.grid}
              vertical={false}
            />
            <XAxis
              dataKey="periodoLabel"
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: COLORS.grid }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: COLORS.grid }}
              tickLine={false}
              label={{
                value: 'Tareas',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12 },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: 20 }}
              iconType="rect"
            />

            {/* Linea de promedio */}
            {promedioCalculado > 0 && (
              <ReferenceLine
                y={promedioCalculado}
                stroke={COLORS.promedio}
                strokeDasharray="5 5"
                label={{
                  value: `Promedio: ${promedioCalculado.toFixed(1)}`,
                  position: 'right',
                  fill: COLORS.promedio,
                  fontSize: 11,
                }}
              />
            )}

            {/* Area de tareas */}
            <Area
              type="monotone"
              dataKey="tareasCompletadas"
              name="Tareas Completadas"
              stroke={COLORS.tareas}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTareas)"
              dot={{ fill: COLORS.tareas, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />

            {/* Area de subtareas (opcional) */}
            {showSubtareas && (
              <Area
                type="monotone"
                dataKey="subtareasCompletadas"
                name="Subtareas Completadas"
                stroke={COLORS.subtareas}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSubtareas)"
                dot={{ fill: COLORS.subtareas, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>

        {/* Resumen */}
        <div className="flex justify-center gap-8 mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: COLORS.tareas }}
            />
            <span>
              Total tareas: <strong>{totalTareas}</strong>
            </span>
          </div>
          {showSubtareas && totalSubtareas > 0 && (
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: COLORS.subtareas }}
              />
              <span>
                Total subtareas: <strong>{totalSubtareas}</strong>
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span>
              Promedio: <strong>{promedioCalculado.toFixed(1)}/periodo</strong>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ThroughputChart;
