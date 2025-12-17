"use client";

/**
 * Hook para manejo de documentos
 *
 * Proporciona estado y operaciones para gestion de documentos
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/lib/hooks/use-toast';
import {
  getDocumentosByProyecto,
  getDocumentoById,
  createDocumento,
  updateDocumento,
  deleteDocumento,
  downloadDocumento,
  cambiarEstadoDocumento,
  aprobarDocumento,
} from '../services/documentos.service';
import type {
  Documento,
  CreateDocumentoInput,
  UpdateDocumentoInput,
  AprobarDocumentoInput,
  DocumentoEstado,
  DocumentoQueryFilters,
} from '../types';

interface UseDocumentosOptions {
  proyectoId: number | string;
  autoFetch?: boolean;
  filters?: DocumentoQueryFilters;
}

interface UseDocumentosReturn {
  documentos: Documento[];
  isLoading: boolean;
  error: string | null;
  selectedDocumento: Documento | null;
  // Acciones
  fetchDocumentos: () => Promise<void>;
  selectDocumento: (doc: Documento | null) => void;
  createNewDocumento: (data: CreateDocumentoInput) => Promise<Documento | null>;
  updateExistingDocumento: (id: number | string, data: UpdateDocumentoInput) => Promise<Documento | null>;
  deleteExistingDocumento: (id: number | string) => Promise<boolean>;
  downloadExistingDocumento: (id: number | string) => Promise<void>;
  changeEstado: (id: number | string, estado: DocumentoEstado) => Promise<Documento | null>;
  aprobarExistingDocumento: (id: number | string, data: AprobarDocumentoInput) => Promise<Documento | null>;
  // Filtros
  setFilters: (filters: DocumentoQueryFilters) => void;
}

export function useDocumentos({
  proyectoId,
  autoFetch = true,
  filters: initialFilters = {},
}: UseDocumentosOptions): UseDocumentosReturn {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocumento, setSelectedDocumento] = useState<Documento | null>(null);
  const [filters, setFiltersState] = useState<DocumentoQueryFilters>(initialFilters);

  /**
   * Obtiene los documentos del proyecto
   */
  const fetchDocumentos = useCallback(async () => {
    if (!proyectoId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getDocumentosByProyecto(proyectoId, filters);
      setDocumentos(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar documentos';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [proyectoId, filters]);

  /**
   * Selecciona un documento
   */
  const selectDocumento = useCallback((doc: Documento | null) => {
    setSelectedDocumento(doc);
  }, []);

  /**
   * Crea un nuevo documento
   */
  const createNewDocumento = useCallback(async (data: CreateDocumentoInput): Promise<Documento | null> => {
    try {
      const newDoc = await createDocumento(data);
      setDocumentos(prev => [...prev, newDoc]);
      toast({
        title: 'Documento creado',
        description: 'El documento se ha creado correctamente.',
      });
      return newDoc;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear documento';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, []);

  /**
   * Actualiza un documento existente
   */
  const updateExistingDocumento = useCallback(async (
    id: number | string,
    data: UpdateDocumentoInput
  ): Promise<Documento | null> => {
    try {
      const updatedDoc = await updateDocumento(id, data);
      setDocumentos(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
      if (selectedDocumento?.id === updatedDoc.id) {
        setSelectedDocumento(updatedDoc);
      }
      toast({
        title: 'Documento actualizado',
        description: 'El documento se ha actualizado correctamente.',
      });
      return updatedDoc;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar documento';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [selectedDocumento]);

  /**
   * Elimina un documento
   */
  const deleteExistingDocumento = useCallback(async (id: number | string): Promise<boolean> => {
    try {
      await deleteDocumento(id);
      setDocumentos(prev => prev.filter(d => d.id !== id));
      if (selectedDocumento?.id === id) {
        setSelectedDocumento(null);
      }
      toast({
        title: 'Documento eliminado',
        description: 'El documento se ha eliminado correctamente.',
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar documento';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  }, [selectedDocumento]);

  /**
   * Descarga un documento
   */
  const downloadExistingDocumento = useCallback(async (id: number | string): Promise<void> => {
    try {
      await downloadDocumento(id);
      toast({
        title: 'Descarga iniciada',
        description: 'El documento se esta descargando.',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al descargar documento';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, []);

  /**
   * Cambia el estado de un documento
   */
  const changeEstado = useCallback(async (
    id: number | string,
    estado: DocumentoEstado
  ): Promise<Documento | null> => {
    try {
      const updatedDoc = await cambiarEstadoDocumento(id, estado);
      setDocumentos(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
      toast({
        title: 'Estado actualizado',
        description: `El documento ahora esta "${estado}".`,
      });
      return updatedDoc;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cambiar estado';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, []);

  /**
   * Aprueba o rechaza un documento (solo PMO)
   */
  const aprobarExistingDocumento = useCallback(async (
    id: number | string,
    data: AprobarDocumentoInput
  ): Promise<Documento | null> => {
    try {
      const updatedDoc = await aprobarDocumento(id, data);
      setDocumentos(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
      if (selectedDocumento?.id === updatedDoc.id) {
        setSelectedDocumento(updatedDoc);
      }
      toast({
        title: data.estado === 'Aprobado' ? 'Documento aprobado' : 'Documento rechazado',
        description: data.estado === 'Aprobado'
          ? 'El documento ha sido aprobado correctamente.'
          : 'El documento ha sido rechazado.',
      });
      return updatedDoc;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al procesar la aprobación';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [selectedDocumento]);

  /**
   * Actualiza los filtros
   */
  const setFilters = useCallback((newFilters: DocumentoQueryFilters) => {
    setFiltersState(newFilters);
  }, []);

  // Auto-fetch al montar o cambiar proyectoId/filters
  useEffect(() => {
    if (autoFetch && proyectoId) {
      fetchDocumentos();
    }
  }, [autoFetch, proyectoId, fetchDocumentos]);

  return {
    documentos,
    isLoading,
    error,
    selectedDocumento,
    fetchDocumentos,
    selectDocumento,
    createNewDocumento,
    updateExistingDocumento,
    deleteExistingDocumento,
    downloadExistingDocumento,
    changeEstado,
    aprobarExistingDocumento,
    setFilters,
  };
}
