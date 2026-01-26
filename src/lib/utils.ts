import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normaliza una fecha para evitar problemas de timezone.
 * Funciona tanto si la fecha viene como "2021-01-02" como si viene como "2021-01-02T00:00:00.000Z".
 *
 * @param dateStr - String de fecha en cualquier formato ISO
 * @returns Date object interpretado en la zona horaria local, o null si la entrada es inválida
 */
export function parseLocalDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;

  // Si la fecha ya tiene "T", extraer solo la parte de la fecha (YYYY-MM-DD)
  const dateOnly = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;

  // Crear la fecha agregando T00:00:00 para interpretar en zona horaria local
  return new Date(dateOnly + 'T00:00:00');
}

/**
 * Formatea una fecha para mostrar en el UI usando el locale es-PE.
 *
 * @param dateStr - String de fecha en cualquier formato ISO
 * @param options - Opciones de formato para toLocaleDateString
 * @returns String formateado o '--' si la fecha es inválida
 */
export function formatDate(
  dateStr: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' }
): string {
  const date = parseLocalDate(dateStr);
  if (!date) return '--';
  return date.toLocaleDateString('es-PE', options);
}

/**
 * Extrae solo la parte de fecha (YYYY-MM-DD) de un string de fecha.
 * Útil para asignar valores a inputs de tipo date.
 *
 * @param dateStr - String de fecha en cualquier formato ISO
 * @returns String en formato YYYY-MM-DD o vacío si la entrada es inválida
 */
export function extractDateString(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.substring(0, 10);
}
