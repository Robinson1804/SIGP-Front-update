'use client';

import {
  LineChart,
  Line,
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

interface BurndownDataPoint {
  fecha: string;
  puntosRestantes: number;
  lineaIdeal: number;
  puntosCompletados?: number;
}

interface BurndownChartProps {
  data: BurndownDataPoint[];
  sprintName?: string;
  loading?: boolean;
  error?: string;
  className?: string;
}

// Colores INEI
const COLORS = {
  actual: '#004272', // INEI blue
  ideal: '#9CA3AF', // Gray
  grid: '#E5E7EB',
  today: '#EF4444', // Red for today marker
};

/**
 * Componente de grafico Burndown
 *
 * Muestra el progreso del sprint comparando puntos restantes vs linea ideal
 */
export function BurndownChart({
  data,
  sprintName,
  loading = false,
  error,
  className,
}: BurndownChartProps) {
  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-base">
            BURNDOWN {sprintName && `- ${sprintName}`}
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
          <CardTitle className="text-base">
            BURNDOWN {sprintName && `- ${sprintName}`}
          </CardTitle>
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
          <CardTitle className="text-base">
            BURNDOWN {sprintName && `- ${sprintName}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
            <p>No hay datos disponibles para mostrar el burndown</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Encontrar la fecha de hoy para marcarla
  const today = new Date().toISOString().split('T')[0];
  const todayIndex = data.findIndex((d) => d.fecha === today);

  // Formatear fecha para mostrar
  const formatDate = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold text-sm mb-2">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className="text-sm"
              style={{ color: entry.color }}
            >
              {entry.name}: {entry.value} pts
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="text-base">
          BURNDOWN {sprintName && `- ${sprintName}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={COLORS.grid}
              vertical={false}
            />
            <XAxis
              dataKey="fecha"
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: COLORS.grid }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: COLORS.grid }}
              tickLine={false}
              label={{
                value: 'Story Points',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12 },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: 20 }}
              iconType="line"
            />

            {/* Linea ideal (gris punteada) */}
            <Line
              type="linear"
              dataKey="lineaIdeal"
              name="Ideal"
              stroke={COLORS.ideal}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 4 }}
            />

            {/* Linea actual (azul INEI) */}
            <Line
              type="monotone"
              dataKey="puntosRestantes"
              name="Real"
              stroke={COLORS.actual}
              strokeWidth={3}
              dot={{ fill: COLORS.actual, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />

            {/* Marcador del dia actual */}
            {todayIndex >= 0 && (
              <ReferenceLine
                x={data[todayIndex].fecha}
                stroke={COLORS.today}
                strokeDasharray="3 3"
                label={{
                  value: 'Hoy',
                  position: 'top',
                  fill: COLORS.today,
                  fontSize: 12,
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>

        {/* Resumen */}
        {data.length > 0 && (
          <div className="flex justify-center gap-8 mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS.actual }}
              />
              <span>
                Puntos restantes:{' '}
                <strong>{data[data.length - 1]?.puntosRestantes ?? 0}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS.ideal }}
              />
              <span>
                Ideal:{' '}
                <strong>{data[data.length - 1]?.lineaIdeal ?? 0}</strong>
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BurndownChart;
