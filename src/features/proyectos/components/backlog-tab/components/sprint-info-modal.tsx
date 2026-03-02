'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
  ListTodo,
  FileCheck,
  UserCheck,
} from 'lucide-react';

interface SprintInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SprintInfoModal({ open, onOpenChange }: SprintInfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Play className="h-5 w-5 text-[#018CD1]" />
            ¿Cómo funciona la gestión de Sprints?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">

          {/* Regla principal */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-blue-800 text-sm">Regla principal</p>
              <p className="text-sm text-blue-700 mt-1">
                Solo puede haber <strong>un sprint activo a la vez</strong> por proyecto.
                Un sprint debe finalizar para que el siguiente pueda iniciarse.
              </p>
            </div>
          </div>

          {/* Flujo del sprint */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Ciclo de vida de un Sprint</p>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <Badge variant="secondary" className="bg-gray-200 text-gray-700">Por hacer</Badge>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <div className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2">
                <Play className="h-4 w-4 text-green-600" />
                <Badge variant="secondary" className="bg-green-100 text-green-700">En progreso</Badge>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">Finalizado</Badge>
              </div>
            </div>
          </div>

          {/* Inicio del sprint */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">¿Cómo inicia un sprint?</p>
            <div className="space-y-2 pl-2">
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <span className="w-5 h-5 rounded-full bg-[#018CD1] text-white text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span><strong>Manual:</strong> El Scrum Master hace clic en <strong>"Iniciar Sprint"</strong> en el encabezado del sprint (solo disponible cuando no hay otro sprint activo).</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <span className="w-5 h-5 rounded-full bg-[#018CD1] text-white text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span><strong>Automático:</strong> El sprint pasa a "En progreso" automáticamente cuando alguna Historia de Usuario del sprint comienza a trabajarse (se crea su primera tarea).</span>
              </div>
            </div>
          </div>

          {/* Finalización del sprint */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">¿Cómo finaliza un sprint?</p>
            <div className="space-y-2 pl-2">
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <span className="w-5 h-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span><strong>Automático:</strong> El sprint finaliza cuando <strong>todas las HUs son validadas</strong> por el Scrum Master (estado "Finalizado").</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <span className="w-5 h-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span><strong>Manual:</strong> El Scrum Master puede cerrar el sprint antes de tiempo. Las HUs pendientes se pueden mover al backlog o al siguiente sprint.</span>
              </div>
            </div>
          </div>

          {/* Flujo de HUs */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Flujo automático de una Historia de Usuario (HU)</p>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-start gap-3 border rounded-lg p-3 bg-gray-50">
                <Clock className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-700">Por hacer → En progreso</p>
                  <p className="text-xs text-gray-500 mt-0.5">Automático al crear la primera tarea de la HU.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 border rounded-lg p-3 bg-amber-50">
                <ListTodo className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-800">En progreso → En revisión</p>
                  <p className="text-xs text-amber-700 mt-0.5">Automático cuando <strong>todas las tareas</strong> de la HU son finalizadas con evidencia. Se genera un PDF de evidencias.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 border rounded-lg p-3 bg-purple-50">
                <FileCheck className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-purple-800">En revisión → Finalizado</p>
                  <p className="text-xs text-purple-700 mt-0.5">El <strong>Scrum Master valida</strong> la HU revisando el documento de evidencias generado.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 border rounded-lg p-3 bg-green-50">
                <UserCheck className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-green-800">Todas las HUs finalizadas → Sprint Finalizado</p>
                  <p className="text-xs text-green-700 mt-0.5">El sprint cierra automáticamente y el siguiente sprint puede iniciar.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
