'use client';

import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { KpiConVariacion } from '@/features/dashboard/types';

interface KpiCardEnhancedProps {
  title: string;
  kpi: KpiConVariacion;
  icon: LucideIcon;
  iconColor?: string;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * KPI Card Mejorado para Dashboard Gerencial
 *
 * Muestra KPI con variacion vs periodo anterior y detalles
 */
export function KpiCardEnhanced({
  title,
  kpi,
  icon: Icon,
  iconColor = 'text-blue-500',
  loading = false,
  className,
  onClick,
}: KpiCardEnhancedProps) {
  if (loading) {
    return (
      <Card className={cn('cursor-default', className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-20" />
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = kpi.tendencia === 'up' ? TrendingUp : kpi.tendencia === 'down' ? TrendingDown : Minus;
  const trendColor = kpi.tendencia === 'up' ? 'text-green-600' : kpi.tendencia === 'down' ? 'text-red-600' : 'text-gray-500';
  const trendBg = kpi.tendencia === 'up' ? 'bg-green-50' : kpi.tendencia === 'down' ? 'bg-red-50' : 'bg-gray-50';

  // Generate details badges
  const detailBadges = Object.entries(kpi.detalles)
    .filter(([, value]) => value !== undefined && value > 0)
    .map(([key, value]) => {
      const labels: Record<string, { label: string; color: string }> = {
        enCurso: { label: 'En curso', color: 'bg-blue-100 text-blue-700' },
        finalizados: { label: 'Finalizados', color: 'bg-green-100 text-green-700' },
        atrasados: { label: 'Atrasados', color: 'bg-red-100 text-red-700' },
        pendientes: { label: 'Pendientes', color: 'bg-yellow-100 text-yellow-700' },
      };
      const config = labels[key] || { label: key, color: 'bg-gray-100 text-gray-700' };
      return { key, value, ...config };
    });

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:border-blue-300',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn('p-2 rounded-lg', iconColor.replace('text-', 'bg-').replace('500', '100').replace('600', '100'))}>
          <Icon className={cn('h-4 w-4', iconColor)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className="text-3xl font-bold">{kpi.valor}</div>
          <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', trendBg, trendColor)}>
            <TrendIcon className="h-3 w-3" />
            <span>{kpi.variacion > 0 ? '+' : ''}{kpi.variacion}%</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          vs. periodo anterior
        </p>

        {detailBadges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {detailBadges.map(({ key, value, label, color }) => (
              <span
                key={key}
                className={cn('px-2 py-0.5 rounded-full text-xs font-medium', color)}
              >
                {value} {label}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default KpiCardEnhanced;
