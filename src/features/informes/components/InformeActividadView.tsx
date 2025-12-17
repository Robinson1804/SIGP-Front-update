/**
 * InformeActividadView Component
 *
 * Vista de un informe de actividad con flujo de aprobación
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, AlertCircle, FileText, TrendingUp } from 'lucide-react';
import {
  AprobacionTimeline,
  AprobacionActions,
  AprobacionBadge,
  useAprobacion,
} from '@/features/aprobaciones';
import { cn } from '@/lib/utils';
import type { InformeActividad } from '../types';

interface InformeActividadViewProps {
  informe: InformeActividad;
  onAprobacionChange?: () => void;
  className?: string;
}

/**
 * Vista detallada de informe de actividad con aprobaciones
 *
 * @example
 * ```tsx
 * <InformeActividadView
 *   informe={informe}
 *   onAprobacionChange={() => refetch()}
 * />
 * ```
 */
export function InformeActividadView({
  informe,
  onAprobacionChange,
  className,
}: InformeActividadViewProps) {
  const {
    flujo,
    historial,
    aprobar,
    rechazar,
    enviar,
    isLoading: isAprobacionLoading,
  } = useAprobacion({
    tipo: 'informe_actividad',
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

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Informe de Actividad - {informe.periodo}
            </h1>
            {informe.actividadNombre && (
              <p className="text-sm text-gray-500 mt-1">{informe.actividadNombre}</p>
            )}
          </div>
          <AprobacionBadge estado={informe.estadoAprobacion} />
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          {informe.creadoPor && <span>Por: {informe.creadoPor.nombre}</span>}
          <span>
            Creado: {new Date(informe.createdAt).toLocaleDateString('es-PE')}
          </span>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tareas Completadas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{informe.tareasCompletadas}</p>
            <p className="text-xs text-gray-500 mt-2">
              {informe.tareasPendientes} pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avance</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{informe.porcentajeAvance}%</p>
            <Badge variant="outline" className="mt-2">
              Progreso
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lead Time</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{informe.leadTime.toFixed(1)}</p>
            <p className="text-xs text-gray-500 mt-2">días promedio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Throughput</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{informe.throughput}</p>
            <p className="text-xs text-gray-500 mt-2">tareas/periodo</p>
          </CardContent>
        </Card>
      </div>

      {/* Contenido Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contenido del informe */}
        <div className="lg:col-span-2 space-y-6">
          {/* Resumen */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resumen del Periodo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{informe.resumen}</p>
            </CardContent>
          </Card>

          {/* Actividades Realizadas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Actividades Realizadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {informe.actividadesRealizadas.map((actividad, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span className="text-gray-700">{actividad}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Dificultades */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Dificultades Encontradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {informe.dificultades.map((dificultad, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span className="text-gray-700">{dificultad}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Recomendaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Recomendaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {informe.recomendaciones.map((recomendacion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span className="text-gray-700">{recomendacion}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Métricas Adicionales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                Métricas de Tiempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Cycle Time</p>
                  <p className="text-lg font-semibold">
                    {informe.cycleTime.toFixed(1)} días
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Lead Time</p>
                  <p className="text-lg font-semibold">
                    {informe.leadTime.toFixed(1)} días
                  </p>
                </div>
              </div>
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
