/**
 * Documentos Service
 *
 * Servicios para gestion de documentos del proyecto
 */

import { apiClient, del, ENDPOINTS } from '@/lib/api';
import type {
  Documento,
  CreateDocumentoInput,
  UpdateDocumentoInput,
  AprobarDocumentoInput,
  UploadDocumentoResponse,
  DocumentoEstado,
  DocumentoQueryFilters,
} from '../types';
import type { PaginatedResponse } from '@/types';

// Endpoints adicionales para documentos
const DOCUMENTOS_ENDPOINTS = {
  BASE: '/documentos',
  BY_ID: (id: number | string) => `/documentos/${id}`,
  BY_PROYECTO: (proyectoId: number | string) => `/proyectos/${proyectoId}/documentos`,
  DOWNLOAD: (id: number | string) => `/documentos/${id}/download`,
  APROBAR: (id: number | string) => `/documentos/${id}/aprobar`,
  UPLOAD_REQUEST: '/upload/request-url',
  UPLOAD_CONFIRM: '/upload/confirm',
  UPLOAD_DIRECT: '/upload/direct',
};

/**
 * Obtener documentos de un proyecto
 */
export async function getDocumentosByProyecto(
  proyectoId: number | string,
  filters?: DocumentoQueryFilters
): Promise<Documento[]> {
  const response = await apiClient.get<Documento[]>(
    DOCUMENTOS_ENDPOINTS.BY_PROYECTO(proyectoId),
    { params: filters }
  );
  return response.data;
}

/**
 * Obtener un documento por ID
 */
export async function getDocumentoById(id: number | string): Promise<Documento> {
  const response = await apiClient.get<Documento>(
    DOCUMENTOS_ENDPOINTS.BY_ID(id)
  );
  return response.data;
}

/**
 * Crear un nuevo documento
 */
export async function createDocumento(data: CreateDocumentoInput): Promise<Documento> {
  // Agregar tipoContenedor si no viene en data
  const payload = {
    ...data,
    tipoContenedor: data.tipoContenedor || 'PROYECTO',
  };

  const response = await apiClient.post<Documento>(
    DOCUMENTOS_ENDPOINTS.BASE,
    payload
  );
  return response.data;
}

/**
 * Actualizar un documento
 */
export async function updateDocumento(
  id: number | string,
  data: UpdateDocumentoInput
): Promise<Documento> {
  const response = await apiClient.patch<Documento>(
    DOCUMENTOS_ENDPOINTS.BY_ID(id),
    data
  );
  return response.data;
}

/**
 * Eliminar un documento
 */
export async function deleteDocumento(id: number | string): Promise<void> {
  await del(DOCUMENTOS_ENDPOINTS.BY_ID(id));
}

/**
 * Obtener URL de descarga de documento
 */
export async function getDocumentoDownloadUrl(id: number | string): Promise<string> {
  const response = await apiClient.get<{ downloadUrl: string }>(
    DOCUMENTOS_ENDPOINTS.DOWNLOAD(id)
  );
  return response.data.downloadUrl;
}

/**
 * Descargar documento
 * Abre el archivo en una nueva pestana o inicia la descarga
 */
export async function downloadDocumento(id: number | string): Promise<void> {
  try {
    const downloadUrl = await getDocumentoDownloadUrl(id);

    // Abrir en nueva pestana para que el navegador maneje la descarga
    if (typeof window !== 'undefined') {
      window.open(downloadUrl, '_blank');
    }
  } catch (error) {
    console.error('Error al descargar documento:', error);
    throw error;
  }
}

/**
 * Solicitar URL presignada para subida
 */
export async function requestUploadUrl(
  proyectoId: number | string,
  file: {
    nombre: string;
    mimeType: string;
    tamano: number;
  },
  metadata?: Record<string, string>
): Promise<UploadDocumentoResponse> {
  const response = await apiClient.post<UploadDocumentoResponse>(
    DOCUMENTOS_ENDPOINTS.UPLOAD_REQUEST,
    {
      entidadTipo: 'PROYECTO',
      entidadId: proyectoId,
      categoria: 'documento',
      nombreArchivo: file.nombre,
      mimeType: file.mimeType,
      tamano: file.tamano,
      metadata,
    }
  );
  return response.data;
}

/**
 * Confirmar subida de archivo
 */
export async function confirmUpload(
  archivoId: string,
  checksumMd5?: string
): Promise<{
  id: string;
  nombreOriginal: string;
  estado: string;
}> {
  const response = await apiClient.post(
    DOCUMENTOS_ENDPOINTS.UPLOAD_CONFIRM,
    {
      archivoId,
      checksumMd5,
    }
  );
  return response.data;
}

/**
 * Subida directa de archivo (para archivos pequenos)
 */
export async function uploadDirecto(
  proyectoId: number | string,
  file: File,
  metadata?: {
    fase?: string;
    descripcion?: string;
  }
): Promise<{
  id: string;
  nombreOriginal: string;
  tamanoBytes: number;
}> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('entidadTipo', 'PROYECTO');
  formData.append('entidadId', String(proyectoId));
  formData.append('categoria', 'documento');

  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }

  const response = await apiClient.post(
    DOCUMENTOS_ENDPOINTS.UPLOAD_DIRECT,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

/**
 * Cambiar estado de documento (solo PMO)
 * @deprecated Usar aprobarDocumento en su lugar
 */
export async function cambiarEstadoDocumento(
  id: number | string,
  estado: DocumentoEstado
): Promise<Documento> {
  const response = await apiClient.patch<Documento>(
    DOCUMENTOS_ENDPOINTS.BY_ID(id),
    { estado }
  );
  return response.data;
}

/**
 * Aprobar o rechazar documento (solo PMO)
 * @param id - ID del documento
 * @param data - Estado y observación (obligatoria si se rechaza)
 */
export async function aprobarDocumento(
  id: number | string,
  data: AprobarDocumentoInput
): Promise<Documento> {
  const response = await apiClient.post<Documento>(
    DOCUMENTOS_ENDPOINTS.APROBAR(id),
    data
  );
  return response.data;
}
