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
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import type { AvanceOEI } from '../types';

interface AvanceOEIChartProps {
  data: AvanceOEI[];
  loading?: boolean;
  error?: string;
  className?: string;
}

/**
 * Gráfico de barras horizontales de avance por OEI
 *
 * Compara avance real vs planificado para cada OEI
 */
export function AvanceOEIChart({
  data,
  loading = false,
  error,
  className,
}: AvanceOEIChartProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">AVANCE POR OEI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 flex-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">AVANCE POR OEI</CardTitle>
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
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">AVANCE POR OEI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
            <p>No hay datos de OEI disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preparar datos para el gráfico
  const chartData = data.map((oei) => ({
    nombre: oei.codigo,
    'Avance Real': oei.avanceReal,
    'Avance Planificado': oei.avancePlanificado,
    diferencia: oei.diferencia,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const oei = data.nombre;
      const real = data['Avance Real'];
      const planificado = data['Avance Planificado'];
      const diff = data.diferencia;

      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold text-sm mb-2">{oei}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#004272]" />
              <span>Real: {real.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-gray-300" />
              <span>Planificado: {planificado.toFixed(1)}%</span>
            </div>
            <div className="pt-1 border-t">
              <span className={diff >= 0 ? 'text-green-600' : 'text-red-600'}>
                Diferencia: {diff >= 0 ? '+' : ''}{diff.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">AVANCE POR OEI</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis
              type="category"
              dataKey="nombre"
              width={80}
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="square"
            />
            <Bar
              dataKey="Avance Real"
              fill="#004272"
              radius={[0, 4, 4, 0]}
              barSize={20}
            />
            <Bar
              dataKey="Avance Planificado"
              fill="#9CA3AF"
              radius={[0, 4, 4, 0]}
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Leyenda de colores */}
        <div className="mt-4 flex justify-center gap-6 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#004272]" />
            <span>Avance Real</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-gray-300" />
            <span>Avance Planificado</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
