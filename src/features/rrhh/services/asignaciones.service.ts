/**
 * Servicio para gestión de asignaciones
 */

import { apiClient, ENDPOINTS } from '@/lib/api';

/**
 * Personal con sobrecarga de asignaciones
 */
export interface PersonalSobrecargado {
  personalId: number;
  nombres: string;
  apellidos: string;
  codigoEmpleado: string;
  horasSemanales: number;
  porcentajeTotal: number;
  asignaciones: {
    entidad: string;
    tipo: string;
    porcentaje: number;
    fechaInicio: string;
    fechaFin?: string;
  }[];
}

/**
 * Respuesta de alertas de sobrecarga
 */
export interface AlertaSobrecargaResponse {
  data: PersonalSobrecargado[];
  total: number;
  umbralAlerta: number;
}

/**
 * Obtener personal con asignaciones que exceden 100%
 */
export async function getPersonalSobrecargado(): Promise<AlertaSobrecargaResponse> {
  const response = await apiClient.get<AlertaSobrecargaResponse>(
    ENDPOINTS.RRHH.ASIGNACIONES_ALERTAS
  );
  return response.data;
}

/**
 * Resumen de carga de trabajo de todo el personal con asignaciones activas
 */
export interface ResumenCargaItem {
  personalId: number;
  nombres: string;
  apellidos: string;
  porcentajeTotal: number;
}

/**
 * Obtener carga de trabajo actual de TODO el personal activo (no solo sobrecargados).
 * Retorna solo quienes tienen al menos una asignación activa. Los demás tienen 0%.
 */
export async function getResumenCargaPersonal(): Promise<ResumenCargaItem[]> {
  const response = await apiClient.get<ResumenCargaItem[]>(
    ENDPOINTS.RRHH.ASIGNACIONES_RESUMEN_CARGA
  );
  return response.data;
}

/**
 * Verificar si un personal específico está sobrecargado
 */
export async function verificarSobrecarga(personalId: number): Promise<{
  estaSobrecargado: boolean;
  porcentajeActual: number;
  porcentajeDisponible: number;
  personal?: PersonalSobrecargado;
}> {
  try {
    const alertas = await getPersonalSobrecargado();
    const personal = alertas.data.find(p => p.personalId === personalId);

    if (personal) {
      return {
        estaSobrecargado: true,
        porcentajeActual: personal.porcentajeTotal,
        porcentajeDisponible: 100 - personal.porcentajeTotal,
        personal,
      };
    }

    return {
      estaSobrecargado: false,
      porcentajeActual: 0,
      porcentajeDisponible: 100,
    };
  } catch (error) {
    console.error('Error verificando sobrecarga:', error);
    return {
      estaSobrecargado: false,
      porcentajeActual: 0,
      porcentajeDisponible: 100,
    };
  }
}
