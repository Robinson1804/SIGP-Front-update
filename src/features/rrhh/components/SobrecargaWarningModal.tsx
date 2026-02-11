'use client';

/**
 * Modal de Advertencia de Sobrecarga
 *
 * Muestra un aviso cuando se intenta asignar personal que ya tiene 100% o más de asignación
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';
import type { PersonalSobrecargado } from '../services/asignaciones.service';

interface SobrecargaWarningModalProps {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
  personal: PersonalSobrecargado;
  porcentajeSolicitado: number;
}

export function SobrecargaWarningModal({
  open,
  onClose,
  onContinue,
  personal,
  porcentajeSolicitado,
}: SobrecargaWarningModalProps) {
  const porcentajeTotal = personal.porcentajeTotal + porcentajeSolicitado;
  const porcentajeExceso = porcentajeTotal - 100;

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-[600px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-xl">
                Personal con Sobrecarga de Asignaciones
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm mt-1">
                {personal.apellidos}, {personal.nombres}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Resumen de asignación */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-amber-900">
                Asignación Actual
              </span>
              <span className="text-lg font-bold text-amber-600">
                {personal.porcentajeTotal.toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-amber-900">
                Nueva Asignación
              </span>
              <span className="text-lg font-bold text-amber-600">
                +{porcentajeSolicitado.toFixed(0)}%
              </span>
            </div>
            <div className="h-px bg-amber-300 my-2"></div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-amber-900">
                Total Proyectado
              </span>
              <span className="text-2xl font-bold text-red-600">
                {porcentajeTotal.toFixed(0)}%
              </span>
            </div>
            {porcentajeExceso > 0 && (
              <p className="text-xs text-red-600 mt-2 font-medium">
                ⚠️ Excede la capacidad en {porcentajeExceso.toFixed(0)}%
              </p>
            )}
          </div>

          {/* Asignaciones actuales */}
          {personal.asignaciones && personal.asignaciones.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-gray-700">
                Asignaciones Actuales:
              </h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {personal.asignaciones.map((asig, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{asig.entidad}</p>
                      <p className="text-gray-500">
                        {asig.tipo} • {asig.fechaInicio}
                        {asig.fechaFin && ` - ${asig.fechaFin}`}
                      </p>
                    </div>
                    <span className="font-semibold text-gray-700">
                      {asig.porcentaje}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advertencia */}
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>⚠️ Advertencia:</strong> Asignar a este personal excederá
              su capacidad disponible. Esto puede afectar negativamente el
              rendimiento del equipo y la calidad de las entregas.
            </p>
          </div>

          {/* Recomendación */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Recomendación:</strong> Considera asignar a otro
              miembro del equipo con disponibilidad o reducir el porcentaje de
              dedicación de esta asignación.
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            Cancelar Asignación
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onContinue}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Continuar de Todas Formas
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
