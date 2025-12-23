'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SprintTimeline } from '@/features/dashboard/types';

interface GanttTimelineProps {
  data: SprintTimeline[];
  rangoInicio?: string;
  rangoFin?: string;
  loading?: boolean;
  error?: string;
  className?: string;
  onSprintClick?: (sprint: SprintTimeline) => void;
}

// Colores INEI
const COLORS = {
  planificado: '#94A3B8', // Slate
  activo: '#004272', // INEI blue
  completado: '#22C55E', // Green
  grid: '#E5E7EB',
  today: '#EF4444', // Red for today marker
};

const getSprintColor = (estado: string) => {
  switch (estado) {
    case 'Activo':
      return COLORS.activo;
    case 'Completado':
      return COLORS.completado;
    default:
      return COLORS.planificado;
  }
};

/**
 * Componente de Timeline Gantt para Sprints
 *
 * Muestra los sprints en una visualizacion tipo Gantt horizontal
 */
export function GanttTimeline({
  data,
  rangoInicio,
  rangoFin,
  loading = false,
  error,
  className,
  onSprintClick,
}: GanttTimelineProps) {
  // Transform data for horizontal bar chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const minDate = rangoInicio
      ? new Date(rangoInicio).getTime()
      : Math.min(...data.map((s) => new Date(s.fechaInicio).getTime()));

    return data.map((sprint) => {
      const inicio = new Date(sprint.fechaInicio).getTime();
      const fin = new Date(sprint.fechaFin).getTime();
      const offset = (inicio - minDate) / (1000 * 60 * 60 * 24); // days from start
      const duration = (fin - inicio) / (1000 * 60 * 60 * 24); // duration in days

      return {
        ...sprint,
        name: `${sprint.proyectoCodigo} - ${sprint.nombre}`,
        offset,
        duration,
        start: inicio,
        end: fin,
      };
    });
  }, [data, rangoInicio]);

  // Calculate today's position
  const todayOffset = useMemo(() => {
    if (!rangoInicio) return null;
    const minDate = new Date(rangoInicio).getTime();
    const today = new Date().getTime();
    return (today - minDate) / (1000 * 60 * 60 * 24);
  }, [rangoInicio]);

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            TIMELINE DE SPRINTS
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
            <Calendar className="h-4 w-4" />
            TIMELINE DE SPRINTS
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
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            TIMELINE DE SPRINTS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
            <p>No hay sprints para mostrar en el timeline</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const sprint = payload[0]?.payload;
      if (!sprint) return null;

      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg max-w-xs">
          <p className="font-semibold text-sm mb-1">{sprint.nombre}</p>
          <p className="text-xs text-gray-500 mb-2">{sprint.proyectoNombre}</p>
          <div className="space-y-1 text-xs">
            <p>
              <span className="text-gray-500">Inicio:</span>{' '}
              {new Date(sprint.fechaInicio).toLocaleDateString('es-PE')}
            </p>
            <p>
              <span className="text-gray-500">Fin:</span>{' '}
              {new Date(sprint.fechaFin).toLocaleDateString('es-PE')}
            </p>
            <p>
              <span className="text-gray-500">Progreso:</span> {sprint.progreso}%
            </p>
            <p>
              <span className="text-gray-500">Story Points:</span>{' '}
              {sprint.storyPointsCompletados}/{sprint.storyPointsTotal}
            </p>
          </div>
          <Badge
            className={cn(
              'mt-2',
              sprint.estado === 'Activo' && 'bg-blue-600',
              sprint.estado === 'Completado' && 'bg-green-600',
              sprint.estado === 'Planificado' && 'bg-gray-500'
            )}
          >
            {sprint.estado}
          </Badge>
        </div>
      );
    }
    return null;
  };

  // Calculate max x-axis value
  const maxDays = Math.max(...chartData.map((d) => d.offset + d.duration)) + 5;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          TIMELINE DE SPRINTS
        </CardTitle>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.activo }} />
            <span>Activo</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.completado }} />
            <span>Completado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.planificado }} />
            <span>Planificado</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 40 + 60)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 150, bottom: 20 }}
            barSize={20}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={COLORS.grid}
              horizontal={false}
            />
            <XAxis
              type="number"
              domain={[0, maxDays]}
              tickFormatter={(value) => {
                if (!rangoInicio) return '';
                const date = new Date(rangoInicio);
                date.setDate(date.getDate() + value);
                return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
              }}
              tick={{ fontSize: 10 }}
              axisLine={{ stroke: COLORS.grid }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11 }}
              width={140}
              axisLine={{ stroke: COLORS.grid }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Today marker */}
            {todayOffset !== null && todayOffset >= 0 && todayOffset <= maxDays && (
              <ReferenceLine
                x={todayOffset}
                stroke={COLORS.today}
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{
                  value: 'Hoy',
                  position: 'top',
                  fill: COLORS.today,
                  fontSize: 10,
                }}
              />
            )}

            {/* Offset bar (invisible, just for positioning) */}
            <Bar dataKey="offset" stackId="a" fill="transparent" />

            {/* Duration bar (visible) */}
            <Bar
              dataKey="duration"
              stackId="a"
              radius={[4, 4, 4, 4]}
              cursor={onSprintClick ? 'pointer' : 'default'}
              onClick={(data) => onSprintClick && onSprintClick(data)}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getSprintColor(entry.estado)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Summary */}
        <div className="flex justify-center gap-6 mt-4 text-sm text-gray-600">
          <span>
            Total: <strong>{data.length} sprints</strong>
          </span>
          <span>
            Activos: <strong>{data.filter((s) => s.estado === 'Activo').length}</strong>
          </span>
          <span>
            Completados: <strong>{data.filter((s) => s.estado === 'Completado').length}</strong>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default GanttTimeline;
