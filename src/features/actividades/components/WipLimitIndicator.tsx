'use client';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface WipLimitIndicatorProps {
  count: number;
  limit: number | null;
  columnName: string;
}

export function WipLimitIndicator({
  count,
  limit,
  columnName,
}: WipLimitIndicatorProps) {
  // If no limit, don't show indicator
  if (limit === null) {
    return (
      <Badge variant="secondary" className="text-xs font-normal">
        {count}
      </Badge>
    );
  }

  const percentage = (count / limit) * 100;
  const isAtLimit = count >= limit;
  const isNearLimit = percentage >= 80 && !isAtLimit;

  const getVariant = () => {
    if (isAtLimit) return 'destructive';
    if (isNearLimit) return 'warning';
    return 'secondary';
  };

  const getBgColor = () => {
    if (isAtLimit) return 'bg-red-100 text-red-800 border-red-300';
    if (isNearLimit) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`text-xs font-medium cursor-help ${getBgColor()}`}
          >
            {isAtLimit && <AlertTriangle className="w-3 h-3 mr-1" />}
            {!isAtLimit && percentage <= 50 && <CheckCircle2 className="w-3 h-3 mr-1" />}
            {count}/{limit}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">{columnName}</p>
            <p className="text-sm text-muted-foreground">
              {isAtLimit ? (
                <span className="text-red-600">
                  Limite WIP alcanzado. No se pueden agregar mas tareas.
                </span>
              ) : isNearLimit ? (
                <span className="text-yellow-600">
                  Cerca del limite WIP ({Math.round(percentage)}% ocupado)
                </span>
              ) : (
                <span>
                  {count} de {limit} tareas ({Math.round(percentage)}% del limite)
                </span>
              )}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Column header with WIP limit indicator
 */
interface ColumnHeaderWithWipProps {
  title: string;
  count: number;
  wipLimit: number | null;
}

export function ColumnHeaderWithWip({
  title,
  count,
  wipLimit,
}: ColumnHeaderWithWipProps) {
  return (
    <div className="flex items-center justify-between w-full">
      <span className="font-medium">{title}</span>
      <WipLimitIndicator count={count} limit={wipLimit} columnName={title} />
    </div>
  );
}
