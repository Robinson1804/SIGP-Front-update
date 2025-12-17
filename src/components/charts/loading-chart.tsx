'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LoadingChartProps {
  title?: string;
  height?: number;
  className?: string;
  variant?: 'line' | 'bar' | 'pie' | 'area';
}

/**
 * Componente de skeleton para graficos mientras cargan
 */
export function LoadingChart({
  title,
  height = 300,
  className,
  variant = 'line',
}: LoadingChartProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case 'pie':
        return (
          <div className="flex flex-col items-center justify-center" style={{ height }}>
            <Skeleton className="w-40 h-40 rounded-full" />
            <div className="flex gap-4 mt-4">
              <Skeleton className="w-16 h-4" />
              <Skeleton className="w-16 h-4" />
              <Skeleton className="w-16 h-4" />
            </div>
          </div>
        );

      case 'bar':
        return (
          <div className="flex items-end justify-between gap-4 px-8" style={{ height }}>
            {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8].map((h, i) => (
              <Skeleton
                key={i}
                className="w-12 rounded-t"
                style={{ height: `${h * height * 0.8}px` }}
              />
            ))}
          </div>
        );

      case 'area':
        return (
          <div className="relative" style={{ height }}>
            <Skeleton className="absolute bottom-0 left-0 right-0 h-3/4 rounded" />
            <div className="absolute bottom-4 left-0 right-0 flex justify-between px-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="w-8 h-3" />
              ))}
            </div>
          </div>
        );

      case 'line':
      default:
        return (
          <div className="relative" style={{ height }}>
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border-b border-gray-100" />
              ))}
            </div>

            {/* Line simulation */}
            <svg
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="none"
            >
              <path
                d="M 0 200 Q 50 180, 100 160 T 200 140 T 300 100 T 400 80"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="3"
                strokeDasharray="1000"
                strokeDashoffset="0"
                className="animate-pulse"
              />
            </svg>

            {/* X-axis labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="w-8 h-3" />
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      {title && (
        <CardHeader>
          <CardTitle className="text-base">
            <Skeleton className="w-40 h-5" />
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {renderSkeleton()}
      </CardContent>
    </Card>
  );
}

export default LoadingChart;
