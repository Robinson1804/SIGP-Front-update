/**
 * useAprobacion Hook
 *
 * Hook para gestionar flujos de aprobación
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/lib/hooks/use-toast';
import type {
  FlujoAprobacion,
  HistorialAprobacion,
  TipoEntidadAprobacion,
  AprobarInput,
  RechazarInput,
} from '../types';
import {
  getFlujoAprobacion,
  getHistorialAprobacion,
  aprobar as aprobarService,
  rechazar as rechazarService,
  enviarARevision as enviarService,
} from '../services';

interface UseAprobacionOptions {
  tipo: TipoEntidadAprobacion;
  entidadId: number;
  autoFetch?: boolean;
}

interface UseAprobacionReturn {
  // Estado
  flujo: FlujoAprobacion | null;
  historial: HistorialAprobacion[];
  isLoading: boolean;
  error: Error | null;

  // Acciones
  aprobar: (comentario?: string) => Promise<boolean>;
  rechazar: (motivo: string) => Promise<boolean>;
  enviar: () => Promise<boolean>;
  refetch: () => Promise<void>;
}

/**
 * Hook para gestionar el flujo de aprobación de una entidad
 *
 * @example
 * ```tsx
 * const { flujo, historial, aprobar, rechazar, isLoading } = useAprobacion({
 *   tipo: 'informe_sprint',
 *   entidadId: 123,
 * });
 *
 * const handleAprobar = async () => {
 *   const success = await aprobar('Aprobado correctamente');
 *   if (success) {
 *     // Navegar o actualizar
 *   }
 * };
 * ```
 */
export function useAprobacion({
  tipo,
  entidadId,
  autoFetch = true,
}: UseAprobacionOptions): UseAprobacionReturn {
  const { toast } = useToast();
  const [flujo, setFlujo] = useState<FlujoAprobacion | null>(null);
  const [historial, setHistorial] = useState<HistorialAprobacion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Cargar datos del flujo y historial
   */
  const fetchData = useCallback(async () => {
    if (!entidadId || !tipo) return;

    setIsLoading(true);
    setError(null);

    try {
      const [flujoData, historialData] = await Promise.all([
        getFlujoAprobacion(tipo, entidadId),
        getHistorialAprobacion(tipo, entidadId),
      ]);

      setFlujo(flujoData);
      setHistorial(historialData);
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast({
        title: 'Error al cargar flujo de aprobación',
        description: error.message || 'No se pudo cargar la información',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [tipo, entidadId, toast]);

  /**
   * Aprobar entidad
   */
  const aprobar = useCallback(
    async (comentario?: string): Promise<boolean> => {
      if (!flujo?.puedeAprobar) {
        toast({
          title: 'Acción no permitida',
          description: 'No tienes permisos para aprobar esta entidad',
          variant: 'destructive',
        });
        return false;
      }

      setIsLoading(true);
      try {
        const data: AprobarInput = { comentario };
        const response = await aprobarService(tipo, entidadId, data);

        toast({
          title: 'Aprobado exitosamente',
          description: response.message || 'La entidad ha sido aprobada',
        });

        await fetchData(); // Recargar datos
        return true;
      } catch (err) {
        const error = err as Error;
        toast({
          title: 'Error al aprobar',
          description: error.message || 'No se pudo aprobar la entidad',
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [tipo, entidadId, flujo?.puedeAprobar, toast, fetchData]
  );

  /**
   * Rechazar entidad
   */
  const rechazar = useCallback(
    async (motivo: string): Promise<boolean> => {
      if (!flujo?.puedeRechazar) {
        toast({
          title: 'Acción no permitida',
          description: 'No tienes permisos para rechazar esta entidad',
          variant: 'destructive',
        });
        return false;
      }

      if (!motivo || motivo.trim().length === 0) {
        toast({
          title: 'Motivo requerido',
          description: 'Debes proporcionar un motivo para rechazar',
          variant: 'destructive',
        });
        return false;
      }

      setIsLoading(true);
      try {
        const data: RechazarInput = { motivo };
        const response = await rechazarService(tipo, entidadId, data);

        toast({
          title: 'Rechazado exitosamente',
          description: response.message || 'La entidad ha sido rechazada',
        });

        await fetchData(); // Recargar datos
        return true;
      } catch (err) {
        const error = err as Error;
        toast({
          title: 'Error al rechazar',
          description: error.message || 'No se pudo rechazar la entidad',
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [tipo, entidadId, flujo?.puedeRechazar, toast, fetchData]
  );

  /**
   * Enviar a revisión (iniciar flujo)
   */
  const enviar = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await enviarService(tipo, entidadId);

      toast({
        title: 'Enviado a revisión',
        description: response.message || 'La entidad ha sido enviada a revisión',
      });

      await fetchData(); // Recargar datos
      return true;
    } catch (err) {
      const error = err as Error;
      toast({
        title: 'Error al enviar',
        description: error.message || 'No se pudo enviar la entidad',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [tipo, entidadId, toast, fetchData]);

  /**
   * Auto-fetch en mount y cuando cambien las dependencias
   */
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  return {
    flujo,
    historial,
    isLoading,
    error,
    aprobar,
    rechazar,
    enviar,
    refetch: fetchData,
  };
}
