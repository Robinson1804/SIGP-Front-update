'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Clock, TrendingUp, Zap, BarChart3, Info } from 'lucide-react';

interface KanbanMetricsBarProps {
  leadTime: number | null;
  cycleTime: number | null;
  throughput: number;
  totalTareas: number;
  tareasCompletadas: number;
  tareasEnProgreso: number;
  tareasPorHacer: number;
  tareasEnRevision: number;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description: string;
  variant?: 'default' | 'success' | 'warning' | 'info';
}

const variantStyles = {
  default: 'bg-slate-50 border-slate-200',
  success: 'bg-green-50 border-green-200',
  warning: 'bg-yellow-50 border-yellow-200',
  info: 'bg-blue-50 border-blue-200',
};

function MetricCard({ icon, label, value, description, variant = 'default' }: MetricCardProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`
              flex items-center gap-3 px-4 py-2 rounded-lg border
              ${variantStyles[variant]}
              cursor-help transition-colors hover:opacity-80
            `}
          >
            <div className="text-muted-foreground">{icon}</div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-semibold">{value}</p>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function KanbanMetricsBar({
  leadTime,
  cycleTime,
  throughput,
  totalTareas,
  tareasCompletadas,
  tareasEnProgreso,
  tareasPorHacer,
  tareasEnRevision,
}: KanbanMetricsBarProps) {
  const porcentajeCompletado =
    totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0;

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-background rounded-lg border shadow-sm">
      {/* Lead Time */}
      <MetricCard
        icon={<Clock className="w-5 h-5" />}
        label="Lead Time"
        value={leadTime !== null ? `${leadTime} dias` : '-'}
        description="Tiempo promedio desde que se crea una tarea hasta que se completa"
        variant="info"
      />

      {/* Cycle Time */}
      <MetricCard
        icon={<Zap className="w-5 h-5" />}
        label="Cycle Time"
        value={cycleTime !== null ? `${cycleTime} dias` : '-'}
        description="Tiempo promedio desde que se inicia el trabajo hasta que se completa"
        variant="warning"
      />

      {/* Throughput */}
      <MetricCard
        icon={<TrendingUp className="w-5 h-5" />}
        label="Throughput"
        value={`${throughput}/sem`}
        description="Tareas completadas en la ultima semana"
        variant="success"
      />

      {/* Separator */}
      <div className="hidden md:block h-10 w-px bg-border" />

      {/* Task Counts */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-muted-foreground" />
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-slate-100">
            {tareasPorHacer} Por hacer
          </Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {tareasEnProgreso} En progreso
          </Badge>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            {tareasEnRevision} En revision
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {tareasCompletadas} Completadas
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <div className="ml-auto flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Progreso:</span>
        <Badge
          variant={porcentajeCompletado >= 75 ? 'default' : 'secondary'}
          className={
            porcentajeCompletado >= 75
              ? 'bg-green-600'
              : porcentajeCompletado >= 50
              ? 'bg-yellow-500'
              : 'bg-slate-500'
          }
        >
          {porcentajeCompletado}%
        </Badge>
      </div>
    </div>
  );
}
