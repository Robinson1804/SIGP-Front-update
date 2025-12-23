/**
 * Storage Service
 *
 * Servicios para subida de archivos a MinIO mediante URLs presignadas
 */

import { apiClient } from './client';

// ============================================
// TIPOS
// ============================================

/**
 * Tipos de entidad soportados para archivos
 */
export type ArchivoEntidadTipo =
  | 'PROYECTO'
  | 'SUBPROYECTO'
  | 'ACTIVIDAD'
  | 'TAREA'
  | 'SUBTAREA'
  | 'USUARIO';

/**
 * Categorías de archivos
 */
export type ArchivoCategoria =
  | 'documento'
  | 'evidencia'
  | 'acta'
  | 'informe'
  | 'avatar'
  | 'adjunto';

/**
 * Datos para solicitar URL de subida
 */
export interface RequestUploadUrlData {
  entidadTipo: ArchivoEntidadTipo;
  entidadId: number;
  categoria: ArchivoCategoria;
  nombreArchivo: string;
  mimeType: string;
  tamano: number;
  metadata?: Record<string, unknown>;
}

/**
 * Respuesta de solicitud de URL presignada
 */
export interface UploadUrlResponse {
  uploadUrl: string;
  archivoId: string;
  objectKey: string;
  bucket: string;
  expiresIn: number;
  requiredHeaders: Record<string, string>;
}

/**
 * Respuesta de confirmación de subida
 */
export interface ArchivoResponse {
  id: string;
  nombreOriginal: string;
  mimeType: string;
  tamanoBytes: number;
  tamanoLegible: string;
  estado: string;
  createdAt: string;
}

/**
 * Obtener URL de descarga de un archivo a través del backend
 * Esta URL descarga el archivo vía proxy (backend -> MinIO -> browser)
 * Útil porque las presigned URLs de MinIO no funcionan directamente en Docker
 *
 * @param archivoId ID del archivo
 * @returns URL de descarga
 */
export function getArchivoDownloadUrl(archivoId: string): string {
  // Usar la misma URL base que el cliente API (ya incluye /api/v1)
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/api/v1';
  return `${baseUrl}/archivos/${archivoId}/download`;
}

// ============================================
// SERVICIOS
// ============================================

/**
 * Solicitar URL presignada para subida de archivo
 *
 * @param data Datos del archivo a subir
 * @returns URL presignada y datos del archivo
 */
export async function requestUploadUrl(
  data: RequestUploadUrlData
): Promise<UploadUrlResponse> {
  const response = await apiClient.post<UploadUrlResponse>(
    '/upload/request-url',
    data
  );
  return response.data;
}

/**
 * Confirmar que el archivo fue subido exitosamente
 *
 * @param archivoId ID del archivo
 * @param checksumMd5 Checksum MD5 opcional
 * @returns Datos del archivo confirmado
 */
export async function confirmUpload(
  archivoId: string,
  checksumMd5?: string
): Promise<ArchivoResponse> {
  const response = await apiClient.post<ArchivoResponse>('/upload/confirm', {
    archivoId,
    checksumMd5,
  });
  return response.data;
}

/**
 * Corregir URL de MinIO para que sea accesible desde el browser
 * Reemplaza el hostname interno de Docker por localhost
 */
function fixMinioUrl(url: string): string {
  // Si la URL usa el hostname interno de Docker, reemplazarlo por localhost
  if (url.includes('minio:9000')) {
    return url.replace('minio:9000', 'localhost:9000');
  }
  return url;
}

/**
 * Subir archivo directamente a MinIO usando URL presignada
 *
 * @param uploadUrl URL presignada de MinIO
 * @param file Archivo a subir
 * @param requiredHeaders Headers requeridos
 */
export async function uploadFileToMinIO(
  uploadUrl: string,
  file: File,
  requiredHeaders: Record<string, string> = {}
): Promise<void> {
  // Corregir URL para acceso desde browser
  const fixedUrl = fixMinioUrl(uploadUrl);

  const response = await fetch(fixedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
      ...requiredHeaders,
    },
  });

  if (!response.ok) {
    throw new Error(`Error uploading file: ${response.statusText}`);
  }
}

/**
 * Flujo completo de subida de archivo a MinIO
 *
 * 1. Solicita URL presignada
 * 2. Sube el archivo a MinIO
 * 3. Confirma la subida
 *
 * @param file Archivo a subir
 * @param entidadTipo Tipo de entidad
 * @param entidadId ID de la entidad
 * @param categoria Categoría del archivo
 * @param metadata Metadata opcional
 * @returns Datos del archivo subido
 */
export async function uploadFile(
  file: File,
  entidadTipo: ArchivoEntidadTipo,
  entidadId: number,
  categoria: ArchivoCategoria,
  metadata?: Record<string, unknown>
): Promise<ArchivoResponse> {
  // 1. Solicitar URL presignada
  const uploadInfo = await requestUploadUrl({
    entidadTipo,
    entidadId,
    categoria,
    nombreArchivo: file.name,
    mimeType: file.type || 'application/octet-stream',
    tamano: file.size,
    metadata,
  });

  // 2. Subir archivo a MinIO
  await uploadFileToMinIO(uploadInfo.uploadUrl, file, uploadInfo.requiredHeaders);

  // 3. Confirmar subida
  const archivo = await confirmUpload(uploadInfo.archivoId);

  return archivo;
}

/**
 * Subida directa de archivo pequeño (< 10MB) al backend
 *
 * @param file Archivo a subir
 * @param entidadTipo Tipo de entidad
 * @param entidadId ID de la entidad
 * @param categoria Categoría del archivo
 * @returns Datos del archivo subido
 */
export async function uploadFileDirect(
  file: File,
  entidadTipo: ArchivoEntidadTipo,
  entidadId: number,
  categoria: ArchivoCategoria
): Promise<ArchivoResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('entidadTipo', entidadTipo);
  formData.append('entidadId', entidadId.toString());
  formData.append('categoria', categoria);

  const response = await apiClient.post<ArchivoResponse>(
    '/upload/direct',
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
 * Descarga un archivo autenticado y devuelve un Blob URL para preview
 * Usa el token JWT del cliente API para autenticación
 *
 * @param archivoId ID del archivo a descargar
 * @returns Promise con el Blob URL para visualización
 */
export async function downloadArchivoAsBlob(archivoId: string): Promise<string> {
  const response = await apiClient.get(`/archivos/${archivoId}/download`, {
    responseType: 'blob',
  });

  // Crear URL de objeto para el Blob
  const blob = new Blob([response.data], { type: response.headers['content-type'] });
  return URL.createObjectURL(blob);
}

/**
 * Extraer el ID del archivo de una URL de descarga
 * Soporta URLs como: http://localhost:3010/api/v1/archivos/{uuid}/download
 *
 * @param url URL de descarga del archivo
 * @returns ID del archivo (UUID) o null si no es válida
 */
export function extractArchivoIdFromUrl(url: string): string | null {
  // Patrón para extraer UUID de la URL
  const regex = /\/archivos\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/download/i;
  const match = url.match(regex);
  return match ? match[1] : null;
}

/**
 * Determinar si un tipo MIME puede ser previsualizado en el navegador
 *
 * @param mimeType Tipo MIME del archivo
 * @returns true si puede ser previsualizado
 */
export function canPreviewMimeType(mimeType: string): boolean {
  const previewableMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'text/plain',
    'text/html',
  ];
  return previewableMimes.some(mime => mimeType.startsWith(mime.split('/')[0]) || mimeType === mime);
}

/**
 * Determinar el tipo de contenido basado en el nombre del archivo
 *
 * @param filename Nombre del archivo
 * @returns Tipo de contenido: 'image', 'video', 'pdf', 'audio', 'document', 'other'
 */
export function getFileContentType(filename: string): 'image' | 'video' | 'pdf' | 'audio' | 'document' | 'other' {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
  const videoExts = ['mp4', 'webm', 'avi', 'mov', 'mkv'];
  const audioExts = ['mp3', 'wav', 'ogg', 'flac'];
  const docExts = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];

  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  if (ext === 'pdf') return 'pdf';
  if (audioExts.includes(ext)) return 'audio';
  if (docExts.includes(ext)) return 'document';

  return 'other';
}
