'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Users, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CargaDesarrollador } from '../types';

interface CargaEquipoChartProps {
  data: CargaDesarrollador[];
  promedioTareasCompletadas?: number;
  totalStoryPoints?: number;
  loading?: boolean;
  error?: string;
  className?: string;
}

function getCargaColor(porcentaje: number): string {
  if (porcentaje >= 80) return '#EF4444'; // Rojo - sobrecargado
  if (porcentaje >= 60) return '#F59E0B'; // Amarillo - carga alta
  if (porcentaje >= 40) return '#22C55E'; // Verde - carga ideal
  return '#3B82F6'; // Azul - subcargado
}

function getCargaLabel(porcentaje: number): string {
  if (porcentaje >= 80) return 'Sobrecargado';
  if (porcentaje >= 60) return 'Carga Alta';
  if (porcentaje >= 40) return 'Carga Ideal';
  return 'Subcargado';
}

/**
 * Grafico de carga del equipo de un proyecto
 */
export function CargaEquipoChart({
  data,
  promedioTareasCompletadas = 0,
  totalStoryPoints = 0,
  loading = false,
  error,
  className,
}: CargaEquipoChartProps) {
  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            CARGA DEL EQUIPO
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
            <Users className="h-4 w-4" />
            CARGA DEL EQUIPO
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
            <Users className="h-4 w-4" />
            CARGA DEL EQUIPO
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
            <Users className="h-10 w-10 mb-2 text-gray-300" />
            <p>No hay miembros del equipo asignados</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preparar datos para el grafico
  const chartData = data.map((dev) => ({
    nombre: dev.nombre.split(' ')[0], // Solo primer nombre para el chart
    nombreCompleto: dev.nombre,
    tareasAsignadas: dev.tareasAsignadas,
    tareasEnProgreso: dev.tareasEnProgreso,
    tareasCompletadas: dev.tareasCompletadas,
    storyPoints: dev.storyPointsAsignados,
    storyPointsCompletados: dev.storyPointsCompletados,
    porcentajeCarga: dev.porcentajeCarga,
    rol: dev.rol,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium">{data.nombreCompleto}</p>
        <p className="text-xs text-gray-500 mb-2">{data.rol}</p>
        <div className="space-y-1 text-sm">
          <p>
            Tareas:{' '}
            <span className="font-medium">
              {data.tareasCompletadas}/{data.tareasAsignadas}
            </span>
          </p>
          <p>
            En progreso: <span className="font-medium">{data.tareasEnProgreso}</span>
          </p>
          <p>
            Story Points:{' '}
            <span className="font-medium">
              {data.storyPointsCompletados}/{data.storyPoints}
            </span>
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span>Carga:</span>
            <span
              className="font-medium"
              style={{ color: getCargaColor(data.porcentajeCarga) }}
            >
              {data.porcentajeCarga}% - {getCargaLabel(data.porcentajeCarga)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          CARGA DEL EQUIPO
        </CardTitle>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>
            Promedio:{' '}
            <strong className="text-gray-700">{promedioTareasCompletadas} tareas</strong>
          </span>
          <span>
            Total SP: <strong className="text-gray-700">{totalStoryPoints}</strong>
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Vista de barras horizontales */}
        <div className="space-y-4">
          {data.map((dev) => (
            <div key={dev.personalId} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                    {dev.nombre.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{dev.nombre}</p>
                    <p className="text-xs text-gray-500">{dev.rol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {dev.tareasCompletadas}/{dev.tareasAsignadas} tareas
                  </p>
                  <p className="text-xs text-gray-500">
                    {dev.storyPointsCompletados}/{dev.storyPointsAsignados} SP
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Progress
                  value={dev.porcentajeCarga}
                  className="h-2 flex-1"
                  style={
                    {
                      '--progress-foreground': getCargaColor(dev.porcentajeCarga),
                    } as React.CSSProperties
                  }
                />
                <span
                  className="text-xs font-medium w-20 text-right"
                  style={{ color: getCargaColor(dev.porcentajeCarga) }}
                >
                  {getCargaLabel(dev.porcentajeCarga)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Leyenda de colores */}
        <div className="flex justify-center gap-4 mt-6 text-xs">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            Subcargado
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            Ideal
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            Alta
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            Sobrecargado
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default CargaEquipoChart;
