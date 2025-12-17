/**
 * InformeSprintView Component
 *
 * Vista de un informe de sprint con flujo de aprobación
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Target, CheckCircle, AlertCircle, Lightbulb, TrendingUp } from 'lucide-react';
import {
  AprobacionTimeline,
  AprobacionActions,
  AprobacionBadge,
  useAprobacion,
} from '@/features/aprobaciones';
import { cn } from '@/lib/utils';
import type { InformeSprint } from '../types';

interface InformeSprintViewProps {
  informe: InformeSprint;
  onAprobacionChange?: () => void;
  className?: string;
}

/**
 * Vista detallada de informe de sprint con aprobaciones
 *
 * @example
 * ```tsx
 * <InformeSprintView
 *   informe={informe}
 *   onAprobacionChange={() => refetch()}
 * />
 * ```
 */
export function InformeSprintView({
  informe,
  onAprobacionChange,
  className,
}: InformeSprintViewProps) {
  const {
    flujo,
    historial,
    aprobar,
    rechazar,
    enviar,
    isLoading: isAprobacionLoading,
  } = useAprobacion({
    tipo: 'informe_sprint',
    entidadId: informe.id,
  });

  const wrapWithCallback = <T extends (...args: any[]) => Promise<boolean>>(
    action: T
  ): T => {
    return (async (...args: Parameters<T>) => {
      const success = await action(...args);
      if (success && onAprobacionChange) {
        onAprobacionChange();
      }
      return success;
    }) as T;
  };

  const porcentajeCompletado =
    informe.historiasPlaneadas > 0
      ? Math.round((informe.historiasCompletadas / informe.historiasPlaneadas) * 100)
      : 0;

  const porcentajePuntos =
    informe.puntosPlaneados > 0
      ? Math.round((informe.puntosCompletados / informe.puntosPlaneados) * 100)
      : 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Informe de Sprint {informe.sprintNumero || informe.sprintNombre}
            </h1>
            {informe.proyectoNombre && (
              <p className="text-sm text-gray-500 mt-1">{informe.proyectoNombre}</p>
            )}
          </div>
          <AprobacionBadge estado={informe.estadoAprobacion} />
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>
            {new Date(informe.fechaInicio).toLocaleDateString('es-PE')} -{' '}
            {new Date(informe.fechaFin).toLocaleDateString('es-PE')}
          </span>
          {informe.creadoPor && <span>Por: {informe.creadoPor.nombre}</span>}
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Historias Completadas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {informe.historiasCompletadas}/{informe.historiasPlaneadas}
            </p>
            <Badge variant="outline" className="mt-2">
              {porcentajeCompletado}%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Puntos Completados</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {informe.puntosCompletados}/{informe.puntosPlaneados}
            </p>
            <Badge variant="outline" className="mt-2">
              {porcentajePuntos}%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Velocidad</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{informe.velocidad}</p>
            <p className="text-xs text-gray-500 mt-2">puntos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Duración</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {Math.ceil(
                (new Date(informe.fechaFin).getTime() -
                  new Date(informe.fechaInicio).getTime()) /
                  (1000 * 60 * 60 * 24)
              )}
            </p>
            <p className="text-xs text-gray-500 mt-2">días</p>
          </CardContent>
        </Card>
      </div>

      {/* Contenido Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contenido del informe */}
        <div className="lg:col-span-2 space-y-6">
          {/* Objetivo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Objetivo del Sprint
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{informe.objetivo}</p>
            </CardContent>
          </Card>

          {/* Resumen */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen Ejecutivo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{informe.resumen}</p>
            </CardContent>
          </Card>

          {/* Logros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Logros Alcanzados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {informe.logrosAlcanzados.map((logro, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span className="text-gray-700">{logro}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Desafíos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Desafíos Enfrentados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {informe.desafiosEnfrentados.map((desafio, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span className="text-gray-700">{desafio}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Lecciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                Lecciones Aprendidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {informe.leccionesAprendidas.map((leccion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span className="text-gray-700">{leccion}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Próximos Pasos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Próximos Pasos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {informe.proximosPasos.map((paso, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span className="text-gray-700">{paso}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Flujo de Aprobación */}
        <div className="space-y-6">
          {/* Timeline */}
          {flujo && (
            <Card>
              <CardHeader>
                <CardTitle>Aprobación</CardTitle>
              </CardHeader>
              <CardContent>
                <AprobacionTimeline flujo={flujo} />
              </CardContent>
            </Card>
          )}

          {/* Acciones */}
          {flujo && (
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent>
                <AprobacionActions
                  flujo={flujo}
                  onAprobar={wrapWithCallback(aprobar)}
                  onRechazar={wrapWithCallback(rechazar)}
                  onEnviar={enviar}
                  isLoading={isAprobacionLoading}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
