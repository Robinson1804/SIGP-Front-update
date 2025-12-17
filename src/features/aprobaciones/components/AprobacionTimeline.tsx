/**
 * AprobacionTimeline Component
 *
 * Timeline visual del flujo de aprobación
 */

'use client';

import { CheckCircle, Clock, XCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FlujoAprobacion } from '../types';

interface AprobacionTimelineProps {
  flujo: FlujoAprobacion;
  className?: string;
}

/**
 * Obtiene el icono según estado del paso
 */
function getStepIcon(completado: boolean, actual: boolean, rechazado: boolean) {
  if (rechazado) {
    return <XCircle className="h-6 w-6 text-red-500" />;
  }
  if (completado) {
    return <CheckCircle className="h-6 w-6 text-green-500" />;
  }
  if (actual) {
    return <Clock className="h-6 w-6 text-yellow-500 animate-pulse" />;
  }
  return <Circle className="h-6 w-6 text-gray-300" />;
}

/**
 * Obtiene el color de la línea conectora
 */
function getLineColor(completado: boolean): string {
  return completado ? 'bg-green-500' : 'bg-gray-300';
}

/**
 * Mapea rol a label
 */
function getRolLabel(rol: string): string {
  const labels: Record<string, string> = {
    SCRUM_MASTER: 'Scrum Master',
    COORDINADOR: 'Coordinador',
    PMO: 'PMO',
    PATROCINADOR: 'Patrocinador',
  };
  return labels[rol] || rol;
}

/**
 * Timeline de flujo de aprobación
 *
 * Muestra los pasos del flujo con indicadores visuales de estado
 *
 * @example
 * ```tsx
 * <AprobacionTimeline flujo={flujo} />
 * ```
 */
export function AprobacionTimeline({ flujo, className }: AprobacionTimelineProps) {
  const esRechazado = flujo.estadoActual === 'rechazado';
  const pasos = flujo.pasos.sort((a, b) => a.orden - b.orden);

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-sm font-medium text-gray-700">Flujo de Aprobación</h3>

      <div className="relative">
        {pasos.map((paso, index) => {
          const isLast = index === pasos.length - 1;
          const isActual = !paso.completado && !esRechazado && index === pasos.findIndex(p => !p.completado);
          const showLine = !isLast;

          return (
            <div key={paso.orden} className="relative">
              {/* Línea conectora */}
              {showLine && (
                <div
                  className={cn(
                    'absolute left-3 top-6 h-12 w-0.5',
                    getLineColor(paso.completado)
                  )}
                />
              )}

              {/* Paso */}
              <div className="flex items-start gap-4 pb-8">
                {/* Icono */}
                <div className="flex-shrink-0">
                  {getStepIcon(paso.completado, isActual, esRechazado && isActual)}
                </div>

                {/* Contenido */}
                <div className="flex-1 pt-0.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={cn(
                          'text-sm font-medium',
                          paso.completado && 'text-green-700',
                          isActual && 'text-yellow-700',
                          !paso.completado && !isActual && 'text-gray-500'
                        )}
                      >
                        {getRolLabel(paso.rol)}
                      </p>

                      {paso.aprobador && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {paso.aprobador.nombre}
                        </p>
                      )}
                    </div>

                    {paso.fecha && (
                      <span className="text-xs text-gray-400">
                        {new Date(paso.fecha).toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>

                  {/* Estado */}
                  {isActual && (
                    <p className="text-xs text-yellow-600 mt-1">
                      Pendiente de aprobación
                    </p>
                  )}
                  {paso.completado && (
                    <p className="text-xs text-green-600 mt-1">
                      Aprobado
                    </p>
                  )}
                  {esRechazado && isActual && (
                    <p className="text-xs text-red-600 mt-1">
                      Rechazado
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Estado final */}
      {flujo.estadoActual === 'aprobado' && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-sm text-green-700 font-medium flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Aprobación completada
          </p>
        </div>
      )}

      {flujo.estadoActual === 'rechazado' && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-700 font-medium flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Rechazado
          </p>
        </div>
      )}
    </div>
  );
}
