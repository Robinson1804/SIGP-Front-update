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
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import type { TendenciaData } from '../types';

interface TendenciasChartProps {
  data: TendenciaData[];
  loading?: boolean;
  error?: string;
  className?: string;
}

/**
 * Gráfico de líneas de tendencias temporales
 *
 * Muestra evolución de proyectos y tareas en el tiempo
 */
export function TendenciasChart({
  data,
  loading = false,
  error,
  className,
}: TendenciasChartProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">TENDENCIAS</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">TENDENCIAS</CardTitle>
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
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">TENDENCIAS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
            <p>No hay datos de tendencias disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold text-sm mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: entry.color }}
                />
                <span>{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">TENDENCIAS</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="periodo"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6B7280' }}
            />
            <YAxis
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6B7280' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="proyectosIniciados"
              stroke="#004272"
              strokeWidth={2}
              dot={{ fill: '#004272', r: 4 }}
              activeDot={{ r: 6 }}
              name="Proyectos Iniciados"
            />
            <Line
              type="monotone"
              dataKey="proyectosCompletados"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ fill: '#10B981', r: 4 }}
              activeDot={{ r: 6 }}
              name="Proyectos Completados"
            />
            <Line
              type="monotone"
              dataKey="tareasCompletadas"
              stroke="#6366F1"
              strokeWidth={2}
              dot={{ fill: '#6366F1', r: 4 }}
              activeDot={{ r: 6 }}
              name="Tareas Completadas"
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Leyenda de colores */}
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#004272]" />
            <span>Proyectos Iniciados</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <span>Proyectos Completados</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-indigo-500" />
            <span>Tareas Completadas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
