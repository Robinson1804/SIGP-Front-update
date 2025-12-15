/**
 * API Module - Exports centralizados
 */

export { apiClient, get, post, put, patch, del } from './client';
export { ENDPOINTS } from './endpoints';

// Re-export tipos de axios para conveniencia
export type { AxiosError, AxiosResponse } from 'axios';
