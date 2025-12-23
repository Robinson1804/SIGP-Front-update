'use client';

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  CheckCircle2,
  PlayCircle,
  Flag,
  FileCheck,
  MessageCircle,
  Plus,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EventoActividad, TipoEventoActividad } from '../types';

interface ActividadRecienteFeedProps {
  data: EventoActividad[];
  loading?: boolean;
  error?: string;
  className?: string;
  maxItems?: number;
}

const iconMap: Record<TipoEventoActividad, React.ElementType> = {
  tarea_completada: CheckCircle2,
  tarea_creada: Plus,
  hu_movida: ArrowRight,
  hu_completada: Flag,
  sprint_iniciado: PlayCircle,
  sprint_completado: CheckCircle2,
  documento_aprobado: FileCheck,
  comentario: MessageCircle,
};

const colorMap: Record<TipoEventoActividad, string> = {
  tarea_completada: 'bg-green-100 text-green-600',
  tarea_creada: 'bg-blue-100 text-blue-600',
  hu_movida: 'bg-yellow-100 text-yellow-600',
  hu_completada: 'bg-emerald-100 text-emerald-600',
  sprint_iniciado: 'bg-purple-100 text-purple-600',
  sprint_completado: 'bg-indigo-100 text-indigo-600',
  documento_aprobado: 'bg-cyan-100 text-cyan-600',
  comentario: 'bg-gray-100 text-gray-600',
};

function formatTimeAgo(timestamp: string): string {
  try {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: es,
    });
  } catch {
    return '';
  }
}

/**
 * Feed de actividad reciente de un proyecto
 */
export function ActividadRecienteFeed({
  data,
  loading = false,
  error,
  className,
  maxItems = 20,
}: ActividadRecienteFeedProps) {
  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            ACTIVIDAD RECIENTE
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            ACTIVIDAD RECIENTE
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
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
            <Activity className="h-4 w-4" />
            ACTIVIDAD RECIENTE
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Activity className="h-10 w-10 mb-2 text-gray-300" />
            <p>No hay actividad reciente</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayData = data.slice(0, maxItems);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          ACTIVIDAD RECIENTE
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-6">
          <div className="space-y-4 py-4">
            {displayData.map((evento) => {
              const Icon = iconMap[evento.tipo] || Activity;
              const colorClass = colorMap[evento.tipo] || 'bg-gray-100 text-gray-600';

              return (
                <div
                  key={evento.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0',
                      colorClass
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {evento.titulo}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{evento.descripcion}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {evento.usuarioNombre && (
                        <span className="text-xs text-gray-400">
                          {evento.usuarioNombre}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {formatTimeAgo(evento.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default ActividadRecienteFeed;
