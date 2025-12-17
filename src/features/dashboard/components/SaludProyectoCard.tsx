'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { SaludProyecto } from '../types';

interface SaludProyectoCardProps {
  data: SaludProyecto | null;
  loading?: boolean;
  className?: string;
}

/**
 * Tarjeta de salud del proyecto con semáforo
 *
 * Verde: >= 70, Amarillo: 40-69, Rojo: < 40
 */
export function SaludProyectoCard({
  data,
  loading = false,
  className,
}: SaludProyectoCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (loading || !data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">SALUD DEL PROYECTO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[200px]">
            <Skeleton className="w-32 h-32 rounded-full mb-4" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determinar color y estilo según score
  const getHealthColor = () => {
    if (data.score >= 70) return 'bg-green-500';
    if (data.score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getHealthIcon = () => {
    if (data.score >= 70) return CheckCircle;
    if (data.score >= 40) return AlertTriangle;
    return AlertCircle;
  };

  const HealthIcon = getHealthIcon();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">SALUD DEL PROYECTO</CardTitle>
        <p className="text-sm text-gray-600 truncate">{data.nombre}</p>
      </CardHeader>
      <CardContent>
        {/* Círculo de score */}
        <div className="flex flex-col items-center justify-center mb-4">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="12"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke={data.score >= 70 ? '#10B981' : data.score >= 40 ? '#F59E0B' : '#EF4444'}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(data.score / 100) * 352} 352`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <HealthIcon
                className={cn(
                  'w-8 h-8 mb-1',
                  data.score >= 70 ? 'text-green-500' : data.score >= 40 ? 'text-yellow-500' : 'text-red-500'
                )}
              />
              <span className="text-2xl font-bold">{data.score}</span>
            </div>
          </div>

          <Badge
            variant="outline"
            className={cn(
              'mt-2',
              data.score >= 70 && 'border-green-500 text-green-700',
              data.score >= 40 && data.score < 70 && 'border-yellow-500 text-yellow-700',
              data.score < 40 && 'border-red-500 text-red-700'
            )}
          >
            {data.color === 'verde' ? 'Saludable' : data.color === 'amarillo' ? 'Atención' : 'Crítico'}
          </Badge>
        </div>

        {/* Factores */}
        <div className="space-y-2 mb-4">
          <div className="text-xs font-semibold text-gray-700 mb-2">Factores:</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex flex-col">
              <span className="text-gray-500">Avance Real</span>
              <span className="font-semibold">{data.factores.avanceReal}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500">Planificado</span>
              <span className="font-semibold">{data.factores.avancePlanificado}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500">Sprints Atrasados</span>
              <span className={cn('font-semibold', data.factores.sprintsAtrasados > 0 && 'text-red-600')}>
                {data.factores.sprintsAtrasados}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500">Tareas Bloqueadas</span>
              <span className={cn('font-semibold', data.factores.tareasBloquedas > 0 && 'text-red-600')}>
                {data.factores.tareasBloquedas}
              </span>
            </div>
          </div>
        </div>

        {/* Recomendaciones expandibles */}
        {data.recomendaciones.length > 0 && (
          <div className="border-t pt-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center justify-between w-full text-xs font-semibold text-gray-700 hover:text-gray-900"
            >
              <span>Recomendaciones ({data.recomendaciones.length})</span>
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {expanded && (
              <ul className="mt-2 space-y-1 text-xs text-gray-600">
                {data.recomendaciones.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
