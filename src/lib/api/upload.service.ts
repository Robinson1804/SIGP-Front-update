/**
 * Upload Service - Servicio para subir archivos a MinIO
 */

import { apiClient } from './client';

export type EntidadTipo = 'PROYECTO' | 'SUBPROYECTO' | 'ACTIVIDAD' | 'TAREA' | 'SUBTAREA' | 'USUARIO';
export type CategoriaArchivo = 'documento' | 'evidencia' | 'acta' | 'informe' | 'avatar' | 'adjunto';

export interface ArchivoResponse {
  id: string;
  nombreOriginal: string;
  extension: string;
  mimeType: string;
  tamanoBytes: number;
  tamanoLegible: string;
  entidadTipo: EntidadTipo;
  entidadId: number;
  categoria: CategoriaArchivo;
  estado: string;
  version: number;
  esVersionActual: boolean;
  esPublico: boolean;
  downloadUrl?: string; // URL de descarga presignada
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface UploadParams {
  file: File;
  entidadTipo: EntidadTipo;
  entidadId: number;
  categoria: CategoriaArchivo;
  metadata?: Record<string, any>;
  onProgress?: (progress: number) => void;
}

/**
 * Sube un archivo directamente a MinIO
 *
 * @param params - Parámetros de subida
 * @returns Información del archivo subido
 */
export async function uploadFile(params: UploadParams): Promise<ArchivoResponse> {
  const { file, entidadTipo, entidadId, categoria, metadata, onProgress } = params;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('entidadTipo', entidadTipo);
  formData.append('entidadId', entidadId.toString());
  formData.append('categoria', categoria);

  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }

  const response = await apiClient.post<ArchivoResponse>('/upload/direct', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  });

  return response.data;
}

/**
 * Sube múltiples archivos
 *
 * @param files - Array de archivos a subir
 * @param entidadTipo - Tipo de entidad
 * @param entidadId - ID de la entidad
 * @param categoria - Categoría del archivo
 * @returns Array de archivos subidos
 */
export async function uploadMultipleFiles(
  files: File[],
  entidadTipo: EntidadTipo,
  entidadId: number,
  categoria: CategoriaArchivo
): Promise<ArchivoResponse[]> {
  const uploadPromises = files.map(file =>
    uploadFile({ file, entidadTipo, entidadId, categoria })
  );

  return Promise.all(uploadPromises);
}

/**
 * Obtiene la URL de descarga de un archivo
 *
 * @param archivoId - ID del archivo
 * @returns URL de descarga presignada
 */
export async function getFileDownloadUrl(archivoId: string): Promise<string> {
  const response = await apiClient.get<{ url: string }>(`/archivos/${archivoId}/download-url`);
  return response.data.url;
}
