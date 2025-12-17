'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  LabelList,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VelocityDataPoint {
  sprint: string;
  comprometidos: number;
  completados: number;
}

interface VelocityChartProps {
  data: VelocityDataPoint[];
  velocidadPromedio?: number;
  tendencia?: 'creciente' | 'decreciente' | 'estable';
  loading?: boolean;
  error?: string;
  className?: string;
}

// Colores INEI
const COLORS = {
  comprometidos: '#93C5FD', // Light blue
  completados: '#004272', // INEI blue
  promedio: '#EF4444', // Red for average line
  grid: '#E5E7EB',
};

/**
 * Componente de grafico de Velocidad
 *
 * Muestra los story points comprometidos vs completados por sprint
 */
export function VelocityChart({
  data,
  velocidadPromedio,
  tendencia,
  loading = false,
  error,
  className,
}: VelocityChartProps) {
  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-base">VELOCIDAD DEL EQUIPO</CardTitle>
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
          <CardTitle className="text-base">VELOCIDAD DEL EQUIPO</CardTitle>
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
          <CardTitle className="text-base">VELOCIDAD DEL EQUIPO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
            <p>No hay datos de sprints para mostrar la velocidad</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular promedio si no se proporciona
  const promedioCalculado =
    velocidadPromedio ??
    data.reduce((sum, d) => sum + d.completados, 0) / data.length;

  // Icono de tendencia
  const TendenciaIcon = () => {
    switch (tendencia) {
      case 'creciente':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreciente':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const comprometidos = payload.find((p: any) => p.dataKey === 'comprometidos')?.value ?? 0;
      const completados = payload.find((p: any) => p.dataKey === 'completados')?.value ?? 0;
      const porcentaje = comprometidos > 0
        ? Math.round((completados / comprometidos) * 100)
        : 0;

      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold text-sm mb-2">{label}</p>
          <p className="text-sm" style={{ color: COLORS.comprometidos }}>
            Comprometidos: {comprometidos} pts
          </p>
          <p className="text-sm" style={{ color: COLORS.completados }}>
            Completados: {completados} pts
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Cumplimiento: {porcentaje}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">VELOCIDAD DEL EQUIPO</CardTitle>
        {tendencia && (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <TendenciaIcon />
            <span className="capitalize">{tendencia}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            barGap={0}
            barCategoryGap="20%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={COLORS.grid}
              vertical={false}
            />
            <XAxis
              dataKey="sprint"
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

            {/* Barras comprometidos */}
            <Bar
              dataKey="comprometidos"
              name="Comprometidos"
              fill={COLORS.comprometidos}
              radius={[4, 4, 0, 0]}
            />

            {/* Barras completados */}
            <Bar
              dataKey="completados"
              name="Completados"
              fill={COLORS.completados}
              radius={[4, 4, 0, 0]}
            >
              <LabelList
                dataKey="completados"
                position="top"
                fill={COLORS.completados}
                fontSize={11}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Resumen */}
        <div className="flex justify-center gap-8 mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: COLORS.completados }}
            />
            <span>
              Velocidad promedio: <strong>{promedioCalculado.toFixed(1)} pts</strong>
            </span>
          </div>
          {data.length > 0 && (
            <div className="flex items-center gap-2">
              <span>
                Ultimo sprint:{' '}
                <strong>{data[data.length - 1]?.completados ?? 0} pts</strong>
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default VelocityChart;
