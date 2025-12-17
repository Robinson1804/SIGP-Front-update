'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { Alerta } from '../types';

interface AlertasPanelProps {
  data: Alerta[];
  loading?: boolean;
  className?: string;
  maxItems?: number;
}

/**
 * Panel lateral de alertas del sistema
 *
 * Muestra alertas ordenadas por fecha con iconos según tipo
 */
export function AlertasPanel({
  data,
  loading = false,
  className,
  maxItems = 10,
}: AlertasPanelProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">ALERTAS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">ALERTAS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
            <Info className="w-12 h-12 mb-2 text-gray-300" />
            <p className="text-sm">No hay alertas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Ordenar por fecha descendente
  const sortedAlertas = [...data]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, maxItems);

  // Obtener icono según tipo
  const getIcon = (tipo: Alerta['tipo']) => {
    switch (tipo) {
      case 'error':
        return AlertCircle;
      case 'warning':
        return AlertTriangle;
      case 'info':
      default:
        return Info;
    }
  };

  // Obtener color según tipo
  const getColor = (tipo: Alerta['tipo']) => {
    switch (tipo) {
      case 'error':
        return 'text-red-500 bg-red-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'info':
      default:
        return 'text-blue-500 bg-blue-100';
    }
  };

  // Formatear fecha relativa
  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;

    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">ALERTAS</CardTitle>
          <Badge variant="outline" className="text-xs">
            {data.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {sortedAlertas.map((alerta) => {
            const Icon = getIcon(alerta.tipo);
            const colorClass = getColor(alerta.tipo);

            return (
              <div
                key={alerta.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <div className={cn('p-2 rounded-full flex-shrink-0', colorClass)}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-gray-900 leading-tight">
                      {alerta.titulo}
                    </h4>
                    <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                      {formatRelativeDate(alerta.fecha)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {alerta.descripcion}
                  </p>

                  {alerta.proyecto && (
                    <p className="text-xs text-gray-500 mb-1">
                      Proyecto: {alerta.proyecto}
                    </p>
                  )}

                  {alerta.accionUrl && (
                    <Link
                      href={alerta.accionUrl}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
                    >
                      Ver detalles
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {data.length > maxItems && (
          <div className="mt-3 pt-3 border-t text-center">
            <p className="text-xs text-gray-500">
              Mostrando {maxItems} de {data.length} alertas
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
