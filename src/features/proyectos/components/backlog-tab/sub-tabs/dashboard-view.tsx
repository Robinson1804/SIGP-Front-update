'use client';

import {
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Edit3,
  PlusCircle,
  Clock,
  Target,
  FileText,
  CheckSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useDashboardData } from '../hooks/use-dashboard-data';
import { cn } from '@/lib/utils';

interface DashboardViewProps {
  proyectoId: number;
  subproyectoId?: number;
}

// Colores para avatares
const avatarColors = [
  'bg-amber-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-cyan-500',
];

function getAvatarColor(name: string): string {
  const index = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[index];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Componente de gráfico de dona simplificado
function DonutChart({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  if (total === 0) {
    return (
      <div className="w-40 h-40 rounded-full bg-gray-100 flex items-center justify-center">
        <span className="text-gray-400 text-sm">Sin datos</span>
      </div>
    );
  }

  // Calcular ángulos para el SVG
  let currentAngle = 0;
  const segments = data.map((d) => {
    const percentage = d.value / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return { ...d, startAngle, angle, percentage };
  });

  // Función para calcular el path del arco
  const describeArc = (
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number
  ) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [
      'M',
      start.x,
      start.y,
      'A',
      r,
      r,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
      'L',
      cx,
      cy,
      'Z',
    ].join(' ');
  };

  const polarToCartesian = (
    cx: number,
    cy: number,
    r: number,
    angleInDegrees: number
  ) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians),
    };
  };

  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      {segments.map((segment, index) => (
        <path
          key={index}
          d={describeArc(80, 80, 70, segment.startAngle, segment.startAngle + segment.angle)}
          fill={segment.color}
        />
      ))}
      {/* Centro blanco para crear el efecto dona */}
      <circle cx="80" cy="80" r="45" fill="white" />
    </svg>
  );
}

// Componente de barra horizontal
function HorizontalBar({
  label,
  value,
  maxValue,
  color,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-12">{label}</span>
      <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
        <div
          className="h-full rounded transition-all duration-300"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-800 w-8 text-right">{value}</span>
    </div>
  );
}

export function DashboardView({ proyectoId, subproyectoId }: DashboardViewProps) {
  const {
    summaryCards,
    estadoStats,
    prioridadStats,
    progressData,
    activityFeed,
    activeSprint,
    isLoading,
    error,
    refresh,
  } = useDashboardData(proyectoId, subproyectoId);

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#018CD1]" />
        <span className="ml-2 text-gray-500">Cargando dashboard...</span>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 1) return 'hace un momento';
    if (diffMins < 60) return `hace ${diffMins} min`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    return `hace ${diffDays}d`;
  };

  // Preparar datos para el gráfico de dona
  const donutData = [
    { label: 'Finalizado', value: estadoStats.find((s) => s.estado === 'Finalizado')?.cantidad || 0, color: '#10B981' },
    { label: 'En progreso', value: estadoStats.find((s) => s.estado === 'En progreso')?.cantidad || 0, color: '#3B82F6' },
    { label: 'Por hacer', value: estadoStats.find((s) => s.estado === 'Por hacer')?.cantidad || 0, color: '#9CA3AF' },
    { label: 'Revisión', value: estadoStats.find((s) => s.estado === 'En revisión')?.cantidad || 0, color: '#8B5CF6' },
  ];

  // Calcular totales para resumen
  const totalEstado = donutData.reduce((acc, d) => acc + d.value, 0);

  // Preparar datos para el gráfico de prioridad
  const prioridadData = [
    { label: 'Baja', value: prioridadStats.find((p) => p.prioridad === 'Could' || p.prioridad === 'Wont' || p.prioridad === 'Baja')?.cantidad || 0, color: '#FBBF24' },
    { label: 'Media', value: prioridadStats.find((p) => p.prioridad === 'Should' || p.prioridad === 'Media')?.cantidad || 0, color: '#F97316' },
    { label: 'Alta', value: prioridadStats.find((p) => p.prioridad === 'Must' || p.prioridad === 'Alta')?.cantidad || 0, color: '#3B82F6' },
  ];
  const maxPrioridadValue = Math.max(...prioridadData.map((p) => p.value), 1);

  // Calcular porcentajes para tipos de trabajo
  const totalItems = progressData.epicas.total + progressData.historias.total + progressData.tareas.total;
  const epicasPercent = totalItems > 0 ? Math.round((progressData.epicas.total / totalItems) * 100) : 0;
  const historiasPercent = totalItems > 0 ? Math.round((progressData.historias.total / totalItems) * 100) : 0;
  const tareasPercent = totalItems > 0 ? Math.round((progressData.tareas.total / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {activeSprint && (
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Sprint {activeSprint.numero} Activo
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Summary Cards - 4 columnas */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{summaryCards.finalizadas}</p>
                <p className="text-sm text-gray-500">Finalizadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Edit3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{summaryCards.enProgreso}</p>
                <p className="text-sm text-gray-500">En Progreso</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <PlusCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{summaryCards.creadas}</p>
                <p className="text-sm text-gray-500">Creadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{summaryCards.porVencer}</p>
                <p className="text-sm text-gray-500">Vencen Pronto</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid - 3 columnas */}
      <div className="grid grid-cols-3 gap-6">
        {/* RESUMEN DE ESTADO - Donut Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
              Resumen de Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-6">
              <DonutChart data={donutData} />
              <div className="space-y-2">
                {donutData.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-600">{item.label} ({item.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RESUMEN DE PRIORIDAD - Bar Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
              Resumen de Prioridad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {prioridadData.map((item) => (
              <HorizontalBar
                key={item.label}
                label={item.label}
                value={item.value}
                maxValue={maxPrioridadValue}
                color={item.color}
              />
            ))}
          </CardContent>
        </Card>

        {/* ACTIVIDAD RECIENTE */}
        <Card className="border-0 shadow-sm row-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
              Actividad Reciente
            </CardTitle>
            <p className="text-xs text-gray-500">Mantente al día de lo que sucede en todo el proyecto</p>
          </CardHeader>
          <CardContent>
            {activityFeed.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No hay actividad reciente
              </p>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 mb-3">Anteriores</p>
                <div className="space-y-4">
                  {activityFeed.map((activity, index) => (
                    <div
                      key={`${activity.id}-${index}`}
                      className="flex items-start gap-3"
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0',
                          getAvatarColor(activity.usuario)
                        )}
                      >
                        {getInitials(activity.usuario)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold text-gray-900">{activity.usuario}</span>
                          {' '}{activity.accion}{' '}
                          <span className="font-medium">"{activity.objeto}"</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                            {activity.codigo}
                          </Badge>
                          <Badge
                            className={cn(
                              'text-[10px] px-1.5 py-0 font-normal',
                              activity.estado === 'Finalizado'
                                ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                : activity.estado === 'En progreso'
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                                : activity.estado === 'En revisión'
                                ? 'bg-purple-100 text-purple-700 hover:bg-purple-100'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                            )}
                          >
                            {activity.estado}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] px-1.5 py-0 font-normal',
                              activity.tipo === 'historia' ? 'border-blue-300 text-blue-600' : 'border-orange-300 text-orange-600'
                            )}
                          >
                            {activity.tipo === 'historia' ? 'HU' : 'Tarea'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* TIPOS DE TRABAJO */}
        <Card className="border-0 shadow-sm col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
              Tipos de Trabajo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {/* Épica */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-40">
                <Target className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">Épica ({progressData.epicas.total})</span>
              </div>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${epicasPercent}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-800 w-12 text-right">{epicasPercent}%</span>
            </div>

            {/* Historia de Usuario */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-40">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">Historia de Usuario ({progressData.historias.total})</span>
              </div>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${historiasPercent}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-800 w-12 text-right">{historiasPercent}%</span>
            </div>

            {/* Tarea */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-40">
                <CheckSquare className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">Tarea ({progressData.tareas.total})</span>
              </div>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400 rounded-full transition-all duration-300"
                  style={{ width: `${tareasPercent}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-800 w-12 text-right">{tareasPercent}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
