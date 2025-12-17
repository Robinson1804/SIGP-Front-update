'use client';

import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  iconColor?: string;
  suffix?: string;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
  className?: string;
}

/**
 * Componente de tarjeta de metrica
 *
 * Muestra una metrica destacada con icono y tendencia opcional
 */
export function MetricCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-blue-500',
  suffix,
  description,
  trend,
  loading = false,
  className,
}: MetricCardProps) {
  if (loading) {
    return (
      <Card className={cn('flex items-center p-4 gap-4', className)}>
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-4 w-24" />
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('flex items-center p-4 gap-4', className)}>
      <div className={cn('p-2 rounded-full bg-gray-100', iconColor.replace('text-', 'bg-').replace('500', '100'))}>
        <Icon className={cn('w-6 h-6', iconColor)} />
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-1">
          <p className="text-2xl font-bold">{value}</p>
          {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
          {trend && (
            <span
              className={cn(
                'ml-2 text-xs font-medium',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{title}</p>
        {description && (
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        )}
      </div>
    </Card>
  );
}

export default MetricCard;
