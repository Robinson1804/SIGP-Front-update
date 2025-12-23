"use client";

/**
 * Hook para manejo de actas
 *
 * Proporciona estado y operaciones para gestion de actas
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/lib/hooks/use-toast';
import {
  getActasByProyecto,
  getActaById,
  createActaReunion,
  createActaConstitucion,
  updateActaReunion,
  updateActaConstitucion,
  deleteActa,
  aprobarActa,
  saveActaPdf,
  subirDocumentoFirmado,
} from '../services/actas.service';
import type {
  Acta,
  ActasByProyectoResponse,
  CreateActaReunionInput,
  CreateActaConstitucionInput,
  UpdateActaReunionInput,
  UpdateActaConstitucionInput,
} from '../types';

interface UseActasOptions {
  proyectoId?: number | string;
  autoFetch?: boolean;
}

interface UseActasReturn {
  // State
  data: ActasByProyectoResponse | null;
  isLoading: boolean;
  error: string | null;
  selectedActa: Acta | null;

  // Actions
  fetchActas: () => Promise<void>;
  selectActa: (acta: Acta | null) => void;

  // CRUD
  createReunion: (data: CreateActaReunionInput) => Promise<Acta | null>;
  createConstitucion: (data: CreateActaConstitucionInput) => Promise<Acta | null>;
  updateReunion: (id: number | string, data: UpdateActaReunionInput) => Promise<Acta | null>;
  updateConstitucion: (id: number | string, data: UpdateActaConstitucionInput) => Promise<Acta | null>;
  deleteExistingActa: (id: number | string) => Promise<boolean>;

  // Workflow
  aprobar: (id: number | string, aprobado: boolean, comentario?: string) => Promise<Acta | null>;
  subirDocumento: (id: number | string, url: string) => Promise<Acta | null>;
  descargarPdf: (id: number | string, filename?: string) => Promise<boolean>;
}

export function useActas({
  proyectoId,
  autoFetch = true,
}: UseActasOptions = {}): UseActasReturn {
  const [data, setData] = useState<ActasByProyectoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedActa, setSelectedActa] = useState<Acta | null>(null);

  /**
   * Obtiene las actas del proyecto
   */
  const fetchActas = useCallback(async () => {
    if (!proyectoId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getActasByProyecto(proyectoId);
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar actas';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [proyectoId]);

  /**
   * Selecciona un acta
   */
  const selectActa = useCallback(async (acta: Acta | null) => {
    if (acta && acta.id) {
      try {
        const fullActa = await getActaById(acta.id);
        setSelectedActa(fullActa);
      } catch (err) {
        setSelectedActa(acta);
      }
    } else {
      setSelectedActa(null);
    }
  }, []);

  /**
   * Crea un nuevo acta de reunión
   */
  const createReunion = useCallback(async (input: CreateActaReunionInput): Promise<Acta | null> => {
    try {
      const newActa = await createActaReunion(input);
      await fetchActas();
      toast({
        title: 'Acta creada',
        description: 'El acta de reunión se ha creado correctamente.',
      });
      return newActa;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear acta';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [fetchActas]);

  /**
   * Crea un nuevo acta de constitución
   */
  const createConstitucion = useCallback(async (input: CreateActaConstitucionInput): Promise<Acta | null> => {
    try {
      const newActa = await createActaConstitucion(input);
      await fetchActas();
      toast({
        title: 'Acta creada',
        description: 'El acta de constitución se ha creado correctamente.',
      });
      return newActa;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear acta';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [fetchActas]);

  /**
   * Actualiza un acta de reunión
   */
  const updateReunion = useCallback(async (
    id: number | string,
    input: UpdateActaReunionInput
  ): Promise<Acta | null> => {
    try {
      const updatedActa = await updateActaReunion(id, input);
      await fetchActas();
      if (selectedActa?.id === updatedActa.id) {
        setSelectedActa(updatedActa);
      }
      toast({
        title: 'Acta actualizada',
        description: 'El acta se ha actualizado correctamente.',
      });
      return updatedActa;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar acta';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [fetchActas, selectedActa]);

  /**
   * Actualiza un acta de constitución
   */
  const updateConstitucion = useCallback(async (
    id: number | string,
    input: UpdateActaConstitucionInput
  ): Promise<Acta | null> => {
    try {
      const updatedActa = await updateActaConstitucion(id, input);
      await fetchActas();
      if (selectedActa?.id === updatedActa.id) {
        setSelectedActa(updatedActa);
      }
      toast({
        title: 'Acta actualizada',
        description: 'El acta se ha actualizado correctamente.',
      });
      return updatedActa;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar acta';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [fetchActas, selectedActa]);

  /**
   * Elimina un acta
   */
  const deleteExistingActa = useCallback(async (id: number | string): Promise<boolean> => {
    try {
      await deleteActa(id);
      await fetchActas();
      if (selectedActa?.id === Number(id)) {
        setSelectedActa(null);
      }
      toast({
        title: 'Acta eliminada',
        description: 'El acta se ha eliminado correctamente.',
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar acta';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchActas, selectedActa]);

  /**
   * Aprueba o rechaza un acta
   */
  const aprobar = useCallback(async (
    id: number | string,
    aprobado: boolean,
    comentario?: string
  ): Promise<Acta | null> => {
    try {
      const updatedActa = await aprobarActa(id, { aprobado, comentario });
      await fetchActas();
      if (selectedActa?.id === updatedActa.id) {
        setSelectedActa(updatedActa);
      }
      toast({
        title: aprobado ? 'Acta aprobada' : 'Acta rechazada',
        description: aprobado
          ? 'El acta ha sido aprobada correctamente.'
          : 'El acta ha sido rechazada.',
      });
      return updatedActa;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al procesar aprobación';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [fetchActas, selectedActa]);

  /**
   * Sube un documento firmado
   */
  const subirDocumento = useCallback(async (
    id: number | string,
    url: string
  ): Promise<Acta | null> => {
    try {
      const updatedActa = await subirDocumentoFirmado(id, url);
      await fetchActas();
      if (selectedActa?.id === updatedActa.id) {
        setSelectedActa(updatedActa);
      }
      toast({
        title: 'Documento subido',
        description: 'El documento firmado se ha cargado correctamente.',
      });
      return updatedActa;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al subir documento';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [fetchActas, selectedActa]);

  /**
   * Descarga el PDF del acta
   */
  const descargarPdf = useCallback(async (
    id: number | string,
    filename?: string
  ): Promise<boolean> => {
    try {
      await saveActaPdf(id, filename);
      toast({
        title: 'PDF descargado',
        description: 'El archivo se ha descargado correctamente.',
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al descargar PDF';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  }, []);

  // Auto-fetch al montar o cambiar proyectoId
  useEffect(() => {
    if (autoFetch && proyectoId) {
      fetchActas();
    }
  }, [autoFetch, proyectoId, fetchActas]);

  return {
    data,
    isLoading,
    error,
    selectedActa,
    fetchActas,
    selectActa,
    createReunion,
    createConstitucion,
    updateReunion,
    updateConstitucion,
    deleteExistingActa,
    aprobar,
    subirDocumento,
    descargarPdf,
  };
}
