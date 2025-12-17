/**
 * useInformes Hook
 *
 * Hook para gestionar informes de sprint y actividad
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/lib/hooks/use-toast';
import type {
  InformeSprint,
  InformeActividad,
  CreateInformeSprintInput,
  UpdateInformeSprintInput,
  CreateInformeActividadInput,
  UpdateInformeActividadInput,
} from '../types';
import {
  getInformeSprint,
  getInformeBySprint,
  createInformeSprint,
  updateInformeSprint,
  generarInformeSprint,
  getInformeActividad,
  getInformesByActividad,
  createInformeActividad,
  updateInformeActividad,
} from '../services';

// ============================================
// HOOK PARA INFORME DE SPRINT
// ============================================

interface UseInformeSprintOptions {
  informeId?: number;
  sprintId?: number;
  autoFetch?: boolean;
}

interface UseInformeSprintReturn {
  informe: InformeSprint | null;
  isLoading: boolean;
  error: Error | null;
  crear: (data: CreateInformeSprintInput) => Promise<InformeSprint | null>;
  actualizar: (data: UpdateInformeSprintInput) => Promise<InformeSprint | null>;
  generar: (sprintId: number) => Promise<InformeSprint | null>;
  refetch: () => Promise<void>;
}

/**
 * Hook para gestionar un informe de sprint
 *
 * @example
 * ```tsx
 * // Por ID de informe
 * const { informe, actualizar } = useInformeSprint({ informeId: 123 });
 *
 * // Por ID de sprint
 * const { informe, generar } = useInformeSprint({ sprintId: 45 });
 * ```
 */
export function useInformeSprint({
  informeId,
  sprintId,
  autoFetch = true,
}: UseInformeSprintOptions): UseInformeSprintReturn {
  const { toast } = useToast();
  const [informe, setInforme] = useState<InformeSprint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!informeId && !sprintId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = informeId
        ? await getInformeSprint(informeId)
        : sprintId
        ? await getInformeBySprint(sprintId)
        : null;

      setInforme(data);
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast({
        title: 'Error al cargar informe',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [informeId, sprintId, toast]);

  const crear = useCallback(
    async (data: CreateInformeSprintInput): Promise<InformeSprint | null> => {
      setIsLoading(true);
      try {
        const nuevoInforme = await createInformeSprint(data);
        setInforme(nuevoInforme);
        toast({
          title: 'Informe creado',
          description: 'El informe de sprint ha sido creado exitosamente',
        });
        return nuevoInforme;
      } catch (err) {
        const error = err as Error;
        toast({
          title: 'Error al crear informe',
          description: error.message,
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const actualizar = useCallback(
    async (data: UpdateInformeSprintInput): Promise<InformeSprint | null> => {
      setIsLoading(true);
      try {
        const informeActualizado = await updateInformeSprint(data.id, data);
        setInforme(informeActualizado);
        toast({
          title: 'Informe actualizado',
          description: 'El informe de sprint ha sido actualizado exitosamente',
        });
        return informeActualizado;
      } catch (err) {
        const error = err as Error;
        toast({
          title: 'Error al actualizar informe',
          description: error.message,
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const generar = useCallback(
    async (sprintId: number): Promise<InformeSprint | null> => {
      setIsLoading(true);
      try {
        const response = await generarInformeSprint({ sprintId });
        setInforme(response.informe);
        toast({
          title: 'Informe generado',
          description: response.mensaje || 'El informe ha sido generado automáticamente',
        });
        return response.informe;
      } catch (err) {
        const error = err as Error;
        toast({
          title: 'Error al generar informe',
          description: error.message,
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  return {
    informe,
    isLoading,
    error,
    crear,
    actualizar,
    generar,
    refetch: fetchData,
  };
}

// ============================================
// HOOK PARA INFORMES DE ACTIVIDAD
// ============================================

interface UseInformesActividadOptions {
  actividadId: number;
  autoFetch?: boolean;
}

interface UseInformesActividadReturn {
  informes: InformeActividad[];
  isLoading: boolean;
  error: Error | null;
  crear: (data: CreateInformeActividadInput) => Promise<InformeActividad | null>;
  actualizar: (data: UpdateInformeActividadInput) => Promise<InformeActividad | null>;
  refetch: () => Promise<void>;
}

/**
 * Hook para gestionar informes de una actividad
 *
 * @example
 * ```tsx
 * const { informes, crear } = useInformesActividad({ actividadId: 123 });
 * ```
 */
export function useInformesActividad({
  actividadId,
  autoFetch = true,
}: UseInformesActividadOptions): UseInformesActividadReturn {
  const { toast } = useToast();
  const [informes, setInformes] = useState<InformeActividad[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getInformesByActividad(actividadId);
      setInformes(data);
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast({
        title: 'Error al cargar informes',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [actividadId, toast]);

  const crear = useCallback(
    async (data: CreateInformeActividadInput): Promise<InformeActividad | null> => {
      setIsLoading(true);
      try {
        const nuevoInforme = await createInformeActividad(data);
        setInformes((prev) => [...prev, nuevoInforme]);
        toast({
          title: 'Informe creado',
          description: 'El informe de actividad ha sido creado exitosamente',
        });
        return nuevoInforme;
      } catch (err) {
        const error = err as Error;
        toast({
          title: 'Error al crear informe',
          description: error.message,
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const actualizar = useCallback(
    async (data: UpdateInformeActividadInput): Promise<InformeActividad | null> => {
      setIsLoading(true);
      try {
        const informeActualizado = await updateInformeActividad(data.id, data);
        setInformes((prev) =>
          prev.map((inf) => (inf.id === data.id ? informeActualizado : inf))
        );
        toast({
          title: 'Informe actualizado',
          description: 'El informe de actividad ha sido actualizado exitosamente',
        });
        return informeActualizado;
      } catch (err) {
        const error = err as Error;
        toast({
          title: 'Error al actualizar informe',
          description: error.message,
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  return {
    informes,
    isLoading,
    error,
    crear,
    actualizar,
    refetch: fetchData,
  };
}
