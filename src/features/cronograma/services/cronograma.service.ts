/**
 * Cronograma Service
 *
 * Servicios para gestion de cronogramas/Gantt de proyectos
 */

import { apiClient, del } from '@/lib/api';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type {
  Cronograma,
  TareaCronograma,
  DependenciaCronograma,
  CreateCronogramaInput,
  UpdateCronogramaInput,
  CreateTareaCronogramaInput,
  UpdateTareaCronogramaInput,
  CreateDependenciaInput,
  FormatoExportacion,
  ExportacionResponse,
  ResultadoRutaCritica,
  DatosExportacion,
  TipoTarea,
  TareaEstadoCronograma,
} from '../types';

// ============================================
// TRANSFORMERS - Map backend to frontend types
// ============================================

interface BackendTarea {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin: string;
  estado?: string;
  prioridad?: string;
  porcentajeAvance?: number;
  asignadoA?: string; // 'Scrum Master' | 'Desarrolladores' | 'Todo el equipo'
  tareaPadreId?: number;
  orden?: number;
  dependencias?: number[];
  notas?: string;
  fase?: string;
  esHito?: boolean;
  color?: string;
}

interface BackendCronograma {
  id: number;
  proyectoId: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  version?: number;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  activo: boolean;
  // Campos de aprobación dual
  aprobadoPorPmo?: boolean;
  aprobadoPorPatrocinador?: boolean;
  fechaAprobacionPmo?: string | null;
  fechaAprobacionPatrocinador?: string | null;
  comentarioRechazo?: string | null;
  createdAt: string;
  updatedAt: string;
  tareas?: BackendTarea[];
}

/**
 * Safely parse a date string, returning a valid Date or a default
 *
 * IMPORTANTE: Parsea solo la parte de fecha (YYYY-MM-DD) y crea el Date
 * en hora local al mediodía para evitar problemas de timezone.
 * Esto evita que fechas como "2023-07-05T00:00:00.000Z" se conviertan
 * al día anterior en zonas horarias negativas (ej: UTC-5 Lima).
 */
function safeParseDate(dateStr: string | undefined | null, defaultDate?: Date): Date {
  if (!dateStr) {
    return defaultDate || new Date();
  }

  // Extraer solo la parte de fecha YYYY-MM-DD
  // Puede venir como "2023-07-05" o "2023-07-05T00:00:00.000Z"
  const dateOnly = dateStr.split('T')[0];
  const parts = dateOnly.split('-');

  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Meses van de 0-11
    const day = parseInt(parts[2], 10);

    // Validar valores
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      // Crear fecha en hora LOCAL al mediodía para evitar desfases por timezone
      return new Date(year, month, day, 12, 0, 0);
    }
  }

  // Fallback: intentar parsear normalmente
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    console.warn(`Invalid date string: ${dateStr}`);
    return defaultDate || new Date();
  }
  return parsed;
}

/**
 * Transforma una tarea del backend al formato del frontend
 */
function transformTarea(backendTarea: BackendTarea): TareaCronograma {
  const inicio = safeParseDate(backendTarea.fechaInicio);
  const fin = safeParseDate(backendTarea.fechaFin, inicio);

  return {
    id: String(backendTarea.id),
    codigo: backendTarea.codigo || '',
    nombre: backendTarea.nombre,
    inicio,
    fin,
    progreso: backendTarea.porcentajeAvance || 0,
    estado: (backendTarea.estado as TareaCronograma['estado']) || 'Por hacer',
    tipo: backendTarea.esHito ? 'hito' : (backendTarea.tareaPadreId ? 'tarea' : 'proyecto') as TipoTarea,
    asignadoA: backendTarea.asignadoA as TareaCronograma['asignadoA'],
    color: backendTarea.color,
    dependencias: (backendTarea.dependencias || []).map((depId, index) => ({
      id: `dep-${backendTarea.id}-${depId}-${index}`,
      tareaOrigenId: String(depId),
      tareaDestinoId: String(backendTarea.id),
      tipo: 'FS' as const,
    })),
    orden: backendTarea.orden || 0,
    padre: backendTarea.tareaPadreId ? String(backendTarea.tareaPadreId) : undefined,
    descripcion: backendTarea.descripcion,
    esHito: backendTarea.esHito,
    fase: backendTarea.fase as TareaCronograma['fase'],
  };
}

/**
 * Transforma un cronograma del backend al formato del frontend
 */
function transformCronograma(backendCronograma: BackendCronograma): Cronograma {
  const tareas = (backendCronograma.tareas || []).map(transformTarea);

  // Collect all dependencies from tareas
  const dependencias: DependenciaCronograma[] = tareas.flatMap(t => t.dependencias);

  return {
    // Asegurar que los IDs sean números
    id: Number(backendCronograma.id),
    proyectoId: Number(backendCronograma.proyectoId),
    nombre: backendCronograma.nombre,
    descripcion: backendCronograma.descripcion,
    estado: (backendCronograma.estado || 'Borrador') as Cronograma['estado'],
    tareas,
    dependencias,
    fechaBase: undefined,
    activo: backendCronograma.activo,
    // Campos de aprobación dual (PMO + PATROCINADOR)
    aprobadoPorPmo: backendCronograma.aprobadoPorPmo ?? false,
    aprobadoPorPatrocinador: backendCronograma.aprobadoPorPatrocinador ?? false,
    fechaAprobacionPmo: backendCronograma.fechaAprobacionPmo,
    fechaAprobacionPatrocinador: backendCronograma.fechaAprobacionPatrocinador,
    comentarioRechazo: backendCronograma.comentarioRechazo,
    createdAt: backendCronograma.createdAt,
    updatedAt: backendCronograma.updatedAt,
  };
}

/**
 * Obtener el cronograma de un proyecto
 * Si no existe, devuelve null
 */
export async function getCronogramaByProyecto(
  proyectoId: number | string
): Promise<Cronograma | null> {
  try {
    const response = await apiClient.get<BackendCronograma | BackendCronograma[]>(
      ENDPOINTS.CRONOGRAMAS.BY_PROYECTO(proyectoId)
    );

    // The API might return an array of cronogramas, take the first one
    const data = Array.isArray(response.data) ? response.data[0] : response.data;

    if (!data) {
      return null;
    }

    return transformCronograma(data);
  } catch (error: any) {
    // Si es 404, el cronograma no existe aun
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Obtener un cronograma por ID
 */
export async function getCronogramaById(
  cronogramaId: number | string
): Promise<Cronograma> {
  const response = await apiClient.get<BackendCronograma>(
    ENDPOINTS.CRONOGRAMAS.BY_ID(cronogramaId)
  );
  return transformCronograma(response.data);
}

/**
 * Crear un nuevo cronograma para un proyecto
 */
export async function createCronograma(
  proyectoId: number | string,
  data: CreateCronogramaInput
): Promise<Cronograma> {
  const response = await apiClient.post<BackendCronograma>(
    ENDPOINTS.CRONOGRAMAS.BY_PROYECTO(proyectoId),
    data
  );
  return transformCronograma(response.data);
}

/**
 * Actualizar un cronograma existente
 */
export async function updateCronograma(
  cronogramaId: number | string,
  data: UpdateCronogramaInput
): Promise<Cronograma> {
  const response = await apiClient.patch<BackendCronograma>(
    ENDPOINTS.CRONOGRAMAS.BY_ID(cronogramaId),
    data
  );
  return transformCronograma(response.data);
}

/**
 * Eliminar un cronograma
 */
export async function deleteCronograma(cronogramaId: number | string): Promise<void> {
  await del(ENDPOINTS.CRONOGRAMAS.BY_ID(cronogramaId));
}

// ============================================
// TAREAS DEL CRONOGRAMA
// ============================================

/**
 * Obtener todas las tareas de un cronograma
 */
export async function getTareas(
  cronogramaId: number | string
): Promise<TareaCronograma[]> {
  const response = await apiClient.get<BackendTarea[]>(
    ENDPOINTS.CRONOGRAMAS.TAREAS(cronogramaId)
  );
  return response.data.map(transformTarea);
}

/**
 * Crear una nueva tarea en el cronograma
 * Usa POST /api/v1/tareas-cronograma con cronogramaId en el body
 */
export async function createTarea(
  cronogramaId: number | string,
  data: CreateTareaCronogramaInput
): Promise<TareaCronograma> {
  // Asegurar que cronogramaId sea un número entero
  const cronogramaIdNum = Number(cronogramaId);
  if (isNaN(cronogramaIdNum) || !Number.isInteger(cronogramaIdNum)) {
    throw new Error(`cronogramaId inválido: ${cronogramaId}`);
  }

  // Transform frontend format to backend format
  // El backend genera el código automáticamente en formato T-XXX si no se proporciona
  const backendData = {
    cronogramaId: cronogramaIdNum,
    codigo: data.codigo, // Backend generará T-XXX automáticamente si es undefined
    nombre: data.nombre,
    fechaInicio: data.inicio,
    fechaFin: data.fin,
    responsableId: data.responsableId ? Number(data.responsableId) : undefined,
    tareaPadreId: data.padre ? Number(data.padre) : undefined,
    orden: data.orden ? Number(data.orden) : undefined,
    descripcion: data.descripcion,
    fase: data.fase,
    esHito: data.tipo === 'hito',
    color: data.color,
    asignadoA: data.asignadoA, // 'Scrum Master' | 'Desarrolladores' | 'Todo el equipo'
  };

  const response = await apiClient.post<BackendTarea>(
    '/tareas-cronograma',
    backendData
  );
  return transformTarea(response.data);
}

/**
 * Actualizar una tarea del cronograma
 */
export async function updateTarea(
  cronogramaId: number | string,
  tareaId: string,
  data: UpdateTareaCronogramaInput
): Promise<TareaCronograma> {
  // Transform frontend format to backend format
  const backendData: Record<string, unknown> = {};

  if (data.codigo !== undefined) backendData.codigo = data.codigo;
  if (data.nombre !== undefined) backendData.nombre = data.nombre;
  if (data.inicio !== undefined) backendData.fechaInicio = data.inicio;
  if (data.fin !== undefined) backendData.fechaFin = data.fin;
  if (data.fase !== undefined) backendData.fase = data.fase;
  if (data.responsableId !== undefined) backendData.responsableId = data.responsableId;
  if (data.padre !== undefined) backendData.tareaPadreId = data.padre ? parseInt(data.padre, 10) : null;
  if (data.orden !== undefined) backendData.orden = data.orden;
  if (data.descripcion !== undefined) backendData.descripcion = data.descripcion;
  if (data.progreso !== undefined) backendData.porcentajeAvance = data.progreso;
  if (data.color !== undefined) backendData.color = data.color;
  if (data.tipo !== undefined) backendData.esHito = data.tipo === 'hito';
  if (data.asignadoA !== undefined) backendData.asignadoA = data.asignadoA;

  const response = await apiClient.patch<BackendTarea>(
    ENDPOINTS.CRONOGRAMAS.TAREA_BY_ID(cronogramaId, tareaId),
    backendData
  );
  return transformTarea(response.data);
}

/**
 * Eliminar una tarea del cronograma
 */
export async function deleteTarea(
  cronogramaId: number | string,
  tareaId: string
): Promise<void> {
  await del(ENDPOINTS.CRONOGRAMAS.TAREA_BY_ID(cronogramaId, tareaId));
}

/**
 * Actualizar progreso de una tarea
 */
export async function updateTareaProgreso(
  cronogramaId: number | string,
  tareaId: string,
  progreso: number
): Promise<TareaCronograma> {
  return updateTarea(cronogramaId, tareaId, { progreso });
}

/**
 * Actualizar fechas de una tarea (drag & drop)
 */
export async function updateTareaFechas(
  cronogramaId: number | string,
  tareaId: string,
  inicio: string,
  fin: string
): Promise<TareaCronograma> {
  return updateTarea(cronogramaId, tareaId, { inicio, fin });
}

/**
 * Actualizar SOLO el estado de una tarea del cronograma.
 * Este endpoint funciona incluso cuando el cronograma está aprobado.
 * Solo para roles: ADMIN, SCRUM_MASTER, COORDINADOR
 */
export async function updateTareaEstado(
  tareaId: string | number,
  estado: TareaEstadoCronograma
): Promise<TareaCronograma> {
  const response = await apiClient.patch<BackendTarea>(
    `/tareas-cronograma/${tareaId}/estado`,
    { estado }
  );
  return transformTarea(response.data);
}

// ============================================
// DEPENDENCIAS
// ============================================

/**
 * Obtener dependencias de un cronograma
 */
export async function getDependencias(
  cronogramaId: number | string
): Promise<DependenciaCronograma[]> {
  const response = await apiClient.get<DependenciaCronograma[]>(
    ENDPOINTS.CRONOGRAMAS.DEPENDENCIAS(cronogramaId)
  );
  return response.data;
}

/**
 * Crear una nueva dependencia entre tareas
 */
export async function createDependencia(
  cronogramaId: number | string,
  data: CreateDependenciaInput
): Promise<DependenciaCronograma> {
  const response = await apiClient.post<DependenciaCronograma>(
    ENDPOINTS.CRONOGRAMAS.DEPENDENCIAS(cronogramaId),
    data
  );
  return response.data;
}

/**
 * Eliminar una dependencia
 */
export async function deleteDependencia(
  cronogramaId: number | string,
  dependenciaId: string
): Promise<void> {
  await del(`${ENDPOINTS.CRONOGRAMAS.DEPENDENCIAS(cronogramaId)}/${dependenciaId}`);
}

// ============================================
// EXPORTACION
// ============================================

/**
 * Exportar cronograma a PDF o Excel
 * Utiliza jsPDF para PDF y xlsx para Excel con diseño profesional
 */
export async function exportCronograma(
  cronogramaId: number | string,
  formato: FormatoExportacion
): Promise<ExportacionResponse> {
  // Obtener datos del cronograma
  const cronograma = await getCronogramaById(cronogramaId);

  if (formato === 'pdf') {
    return await exportToPDF(cronograma);
  } else {
    return await exportToExcel(cronograma);
  }
}

/**
 * Exportar cronograma a PDF con diseño profesional
 */
async function exportToPDF(cronograma: Cronograma): Promise<ExportacionResponse> {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colores INEI
  const ineiBLUE = [0, 66, 114]; // #004272
  const headerBg = [240, 244, 248]; // #f0f4f8

  // Header con logo/título
  doc.setFillColor(ineiBLUE[0], ineiBLUE[1], ineiBLUE[2]);
  doc.rect(0, 0, pageWidth, 25, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('CRONOGRAMA DE PROYECTO', pageWidth / 2, 12, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema Integral de Gestión de Proyectos - INEI', pageWidth / 2, 20, { align: 'center' });

  // Info del cronograma
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(cronograma.nombre || 'Cronograma', 14, 35);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const fechaGeneracion = new Date().toLocaleDateString('es-PE', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  doc.text(`Generado: ${fechaGeneracion}`, pageWidth - 14, 35, { align: 'right' });

  // Resumen
  const tareas = cronograma.tareas || [];
  const totalTareas = tareas.length;
  const tareasCompletadas = tareas.filter(t => t.progreso >= 100).length;
  const progresoGeneral = totalTareas > 0
    ? Math.round(tareas.reduce((sum, t) => sum + t.progreso, 0) / totalTareas)
    : 0;

  // Caja de resumen
  doc.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
  doc.rect(14, 40, pageWidth - 28, 18, 'F');

  doc.setFontSize(9);
  doc.setTextColor(0, 66, 114);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN:', 18, 47);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Total Tareas: ${totalTareas}`, 50, 47);
  doc.text(`Completadas: ${tareasCompletadas}`, 100, 47);
  doc.text(`En Progreso: ${totalTareas - tareasCompletadas}`, 150, 47);
  doc.text(`Avance General: ${progresoGeneral}%`, 200, 47);

  // Barra de progreso
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(230, 230, 230);
  doc.rect(250, 44, 30, 5, 'FD');
  doc.setFillColor(ineiBLUE[0], ineiBLUE[1], ineiBLUE[2]);
  if (progresoGeneral > 0) {
    doc.rect(250, 44, 30 * (progresoGeneral / 100), 5, 'F');
  }

  // Tabla de tareas
  let y = 65;

  // Headers de tabla
  const cols = [
    { header: 'Código', width: 25 },
    { header: 'Tarea', width: 70 },
    { header: 'Fase', width: 30 },
    { header: 'Inicio', width: 28 },
    { header: 'Fin', width: 28 },
    { header: 'Duración', width: 22 },
    { header: 'Avance', width: 20 },
    { header: 'Responsable', width: 45 },
  ];

  doc.setFillColor(ineiBLUE[0], ineiBLUE[1], ineiBLUE[2]);
  doc.rect(14, y, pageWidth - 28, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');

  let x = 14;
  cols.forEach(col => {
    doc.text(col.header, x + 2, y + 5.5);
    x += col.width;
  });

  y += 8;

  // Filas de datos
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  // Definir fases en orden
  const fases = ['Analisis', 'Diseno', 'Desarrollo', 'Pruebas', 'Implementacion', 'Mantenimiento'];
  const fasesLabels: Record<string, string> = {
    'Analisis': 'ANÁLISIS',
    'Diseno': 'DISEÑO',
    'Desarrollo': 'DESARROLLO',
    'Pruebas': 'PRUEBAS',
    'Implementacion': 'IMPLEMENTACIÓN',
    'Mantenimiento': 'MANTENIMIENTO'
  };

  // Separar fases (tipo proyecto) y tareas normales
  const faseHeaders = tareas.filter(t => t.tipo === 'proyecto');
  const tareasNormales = tareas.filter(t => t.tipo !== 'proyecto');

  // Crear lista ordenada: fase seguida de sus tareas
  const tareasOrdenadas: typeof tareas = [];

  fases.forEach(fase => {
    // Buscar el header de esta fase
    const faseHeader = faseHeaders.find(f => f.fase === fase);
    if (faseHeader) {
      tareasOrdenadas.push(faseHeader);
    }

    // Agregar todas las tareas de esta fase (ordenadas)
    const tareasDeEstaFase = tareasNormales
      .filter(t => t.fase === fase)
      .sort((a, b) => (a.orden || 0) - (b.orden || 0));

    tareasOrdenadas.push(...tareasDeEstaFase);
  });

  // Agregar tareas sin fase al final
  const tareasSinFase = tareasNormales.filter(t => !t.fase || !fases.includes(t.fase));
  tareasOrdenadas.push(...tareasSinFase);

  let rowIndex = 0;
  tareasOrdenadas.forEach((tarea) => {
    // Nueva página si es necesario
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;

      // Repetir headers
      doc.setFillColor(ineiBLUE[0], ineiBLUE[1], ineiBLUE[2]);
      doc.rect(14, y, pageWidth - 28, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');

      let xh = 14;
      cols.forEach(col => {
        doc.text(col.header, xh + 2, y + 5.5);
        xh += col.width;
      });

      y += 8;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
    }

    // Fila de fase (negrita y fondo especial azul)
    if (tarea.tipo === 'proyecto') {
      doc.setFillColor(0, 66, 114); // Azul INEI
      doc.rect(14, y, pageWidth - 28, 7, 'F');
      doc.setTextColor(255, 255, 255); // Texto blanco
      doc.setFont('helvetica', 'bold');
    } else {
      // Fila alternada para tareas normales
      if (rowIndex % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(14, y, pageWidth - 28, 7, 'F');
      }
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      rowIndex++;
    }

    x = 14;
    const inicio = new Date(tarea.inicio);
    const fin = new Date(tarea.fin);
    const duracion = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));

    // Código
    doc.text((tarea.codigo || '-').substring(0, 12), x + 2, y + 5);
    x += cols[0].width;

    // Nombre (con indentación para tareas bajo una fase)
    const esFaseHeader = tarea.tipo === 'proyecto';
    const nombreText = esFaseHeader ? tarea.nombre : `  ${tarea.nombre}`;
    doc.text(nombreText.substring(0, esFaseHeader ? 40 : 35), x + 2, y + 5);
    x += cols[1].width;

    // Fase
    const faseLabel = fasesLabels[tarea.fase || ''] || tarea.fase || '-';
    doc.text(faseLabel.substring(0, 15), x + 2, y + 5);
    x += cols[2].width;

    // Inicio
    doc.text(inicio.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }), x + 2, y + 5);
    x += cols[3].width;

    // Fin
    doc.text(fin.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }), x + 2, y + 5);
    x += cols[4].width;

    // Duración
    doc.text(`${duracion} días`, x + 2, y + 5);
    x += cols[5].width;

    // Avance
    doc.text(`${tarea.progreso}%`, x + 2, y + 5);
    x += cols[6].width;

    // Responsable
    doc.text((tarea.responsable?.nombre || 'Sin asignar').substring(0, 25), x + 2, y + 5);

    y += 7;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Página 1', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Generar blob y URL
  const pdfBlob = doc.output('blob');
  const url = window.URL.createObjectURL(pdfBlob);
  const filename = `cronograma_${cronograma.id}_${new Date().toISOString().split('T')[0]}.pdf`;

  return { url, filename };
}

/**
 * Exportar cronograma a Excel con diseño profesional usando ExcelJS
 */
async function exportToExcel(cronograma: Cronograma): Promise<ExportacionResponse> {
  const ExcelJS = await import('exceljs');

  const tareas = cronograma.tareas || [];
  const wb = new ExcelJS.Workbook();

  // Colores INEI
  const ineiBLUE = '004272';
  const headerBg = 'F0F4F8';
  const faseBg = '004272';
  const faseFont = 'FFFFFF';

  // Definir fases
  const fases = ['Analisis', 'Diseno', 'Desarrollo', 'Pruebas', 'Implementacion', 'Mantenimiento'];
  const fasesLabels: Record<string, string> = {
    'Analisis': 'Análisis',
    'Diseno': 'Diseño',
    'Desarrollo': 'Desarrollo',
    'Pruebas': 'Pruebas',
    'Implementacion': 'Implementación',
    'Mantenimiento': 'Mantenimiento'
  };

  // Debug: mostrar tareas recibidas
  console.log(`[Excel Export] Cronograma ${cronograma.id} - Tareas recibidas:`, tareas.map(t => ({ codigo: t.codigo, nombre: t.nombre, fase: t.fase })));

  // Calcular estadísticas - usar TODAS las tareas, no filtrar por tipo
  const totalTareas = tareas.length;
  const tareasCompletadas = tareas.filter(t => (t.progreso || 0) >= 100).length;
  const tareasEnProgreso = tareas.filter(t => (t.progreso || 0) > 0 && (t.progreso || 0) < 100).length;
  const tareasPendientes = tareas.filter(t => (t.progreso || 0) === 0).length;
  const progresoGeneral = totalTareas > 0
    ? Math.round(tareas.reduce((sum, t) => sum + (t.progreso || 0), 0) / totalTareas)
    : 0;

  // =============== HOJA RESUMEN ===============
  const wsResumen = wb.addWorksheet('Resumen');

  // Título
  wsResumen.mergeCells('A1:D1');
  const titleCell = wsResumen.getCell('A1');
  titleCell.value = 'CRONOGRAMA DE PROYECTO';
  titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ineiBLUE } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  wsResumen.getRow(1).height = 30;

  // Subtítulo
  wsResumen.mergeCells('A2:D2');
  const subtitleCell = wsResumen.getCell('A2');
  subtitleCell.value = 'Sistema Integral de Gestión de Proyectos - INEI';
  subtitleCell.font = { italic: true, size: 10, color: { argb: '666666' } };
  subtitleCell.alignment = { horizontal: 'center' };

  // Info del cronograma
  wsResumen.getCell('A4').value = 'Nombre:';
  wsResumen.getCell('A4').font = { bold: true };
  wsResumen.getCell('B4').value = cronograma.nombre || 'Cronograma';

  wsResumen.getCell('A5').value = 'Fecha de generación:';
  wsResumen.getCell('A5').font = { bold: true };
  wsResumen.getCell('B5').value = new Date().toLocaleDateString('es-PE', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  // Resumen General - Header
  wsResumen.mergeCells('A7:D7');
  const resumenHeader = wsResumen.getCell('A7');
  resumenHeader.value = 'RESUMEN GENERAL';
  resumenHeader.font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
  resumenHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ineiBLUE } };

  // Datos resumen
  const resumenData = [
    ['Total de Tareas:', totalTareas],
    ['Tareas Completadas:', tareasCompletadas],
    ['Tareas en Progreso:', tareasEnProgreso],
    ['Tareas Pendientes:', tareasPendientes],
    ['Avance General:', `${progresoGeneral}%`],
  ];

  resumenData.forEach((row, idx) => {
    const rowNum = 8 + idx;
    const cellA = wsResumen.getCell(`A${rowNum}`);
    const cellB = wsResumen.getCell(`B${rowNum}`);
    cellA.value = row[0];
    cellA.font = { bold: true };
    cellB.value = row[1];
    // Aplicar fill a cada celda individualmente
    if (idx % 2 === 0) {
      cellA.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
      cellB.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
    }
  });

  // Resumen por Fase - Header
  wsResumen.mergeCells('A14:D14');
  const faseHeader = wsResumen.getCell('A14');
  faseHeader.value = 'RESUMEN POR FASE';
  faseHeader.font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
  faseHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ineiBLUE } };

  let faseRow = 15;
  fases.forEach((fase, idx) => {
    const tareasFase = tareas.filter(t => t.fase === fase);
    if (tareasFase.length > 0) {
      const progresoFase = Math.round(tareasFase.reduce((sum, t) => sum + (t.progreso || 0), 0) / tareasFase.length);
      const cellA = wsResumen.getCell(`A${faseRow}`);
      const cellB = wsResumen.getCell(`B${faseRow}`);
      cellA.value = `${fasesLabels[fase]}:`;
      cellA.font = { bold: true };
      cellB.value = `${tareasFase.length} tareas - ${progresoFase}% completado`;
      if (idx % 2 === 0) {
        cellA.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
        cellB.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
      }
      faseRow++;
    }
  });

  // Anchos de columna
  wsResumen.getColumn('A').width = 25;
  wsResumen.getColumn('B').width = 35;
  wsResumen.getColumn('C').width = 15;
  wsResumen.getColumn('D').width = 15;

  // =============== HOJA TAREAS ===============
  const wsTareas = wb.addWorksheet('Tareas');

  // Headers
  const headers = ['CÓDIGO', 'NOMBRE', 'TIPO', 'FASE', 'FECHA INICIO', 'FECHA FIN', 'DURACIÓN (DÍAS)', 'AVANCE (%)', 'RESPONSABLE', 'DESCRIPCIÓN'];
  const headerRow = wsTareas.addRow(headers);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ineiBLUE } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 25;

  // Bordes para headers
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Ordenar tareas por fase y luego por orden
  // IMPORTANTE: Usar todas las tareas, ordenadas por fase si tienen, o al final si no
  const tareasConFase: typeof tareas = [];
  const tareasSinFase: typeof tareas = [];

  // Separar tareas con fase y sin fase
  tareas.forEach(tarea => {
    if (tarea.fase && fases.includes(tarea.fase)) {
      tareasConFase.push(tarea);
    } else {
      tareasSinFase.push(tarea);
    }
  });

  // Ordenar tareas con fase por el orden de fases definido, luego por orden interno
  const tareasOrdenadas = [
    ...tareasConFase.sort((a, b) => {
      const faseIndexA = fases.indexOf(a.fase || '');
      const faseIndexB = fases.indexOf(b.fase || '');
      if (faseIndexA !== faseIndexB) return faseIndexA - faseIndexB;
      return (a.orden || 0) - (b.orden || 0);
    }),
    ...tareasSinFase.sort((a, b) => (a.orden || 0) - (b.orden || 0))
  ];

  // Debug: verificar que no se pierdan tareas
  console.log(`[Excel Export] Total tareas: ${tareas.length}, Con fase: ${tareasConFase.length}, Sin fase: ${tareasSinFase.length}, Ordenadas: ${tareasOrdenadas.length}`);

  // Agregar filas de datos
  let rowCounter = 0;
  tareasOrdenadas.forEach((tarea) => {
    const inicio = new Date(tarea.inicio);
    const fin = new Date(tarea.fin);
    const duracion = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
    const esHito = tarea.tipo === 'hito' || tarea.esHito;

    const row = wsTareas.addRow([
      tarea.codigo || '',
      tarea.nombre,
      esHito ? 'HITO' : 'TAREA',
      fasesLabels[tarea.fase || ''] || tarea.fase || '',
      inicio.toLocaleDateString('es-PE'),
      fin.toLocaleDateString('es-PE'),
      duracion,
      tarea.progreso || 0,
      tarea.responsable?.nombre || 'Sin asignar',
      tarea.descripcion || ''
    ]);

    // Determinar color de fondo para la fila (alternar colores)
    const bgColor = rowCounter % 2 === 0 ? 'FFFFFF' : 'F5F5F5';

    // Aplicar estilo a cada celda individualmente
    row.eachCell((cell, colNumber) => {
      // Color de fondo alternado
      if (esHito) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8DC' } };
        cell.font = { bold: true, color: { argb: '8B4513' } };
      } else {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      }

      // Bordes
      cell.border = {
        top: { style: 'thin', color: { argb: 'DDDDDD' } },
        left: { style: 'thin', color: { argb: 'DDDDDD' } },
        bottom: { style: 'thin', color: { argb: 'DDDDDD' } },
        right: { style: 'thin', color: { argb: 'DDDDDD' } }
      };

      // Alineación según columna
      if (colNumber === 7 || colNumber === 8) {
        // Duración y Avance centrados
        cell.alignment = { horizontal: 'center' };
      }
    });

    rowCounter++;
  });

  // Anchos de columna
  wsTareas.getColumn(1).width = 12;  // Código
  wsTareas.getColumn(2).width = 45;  // Nombre
  wsTareas.getColumn(3).width = 10;  // Tipo
  wsTareas.getColumn(4).width = 18;  // Fase
  wsTareas.getColumn(5).width = 14;  // Fecha Inicio
  wsTareas.getColumn(6).width = 14;  // Fecha Fin
  wsTareas.getColumn(7).width = 15;  // Duración
  wsTareas.getColumn(8).width = 12;  // Avance
  wsTareas.getColumn(9).width = 25;  // Responsable
  wsTareas.getColumn(10).width = 50; // Descripción

  // Congelar fila de encabezado
  wsTareas.views = [{ state: 'frozen', ySplit: 1 }];

  // =============== HOJA DIAGRAMA GANTT ===============
  const wsGantt = wb.addWorksheet('Diagrama Gantt');

  // Calcular rango de fechas del cronograma
  const allDates = tareasOrdenadas.flatMap(t => [new Date(t.inicio), new Date(t.fin)]);
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

  // Ajustar a inicio de semana (lunes)
  const startDate = new Date(minDate);
  startDate.setDate(startDate.getDate() - startDate.getDay() + 1);
  if (startDate > minDate) startDate.setDate(startDate.getDate() - 7);

  // Ajustar a fin de semana (domingo)
  const endDate = new Date(maxDate);
  endDate.setDate(endDate.getDate() + (7 - endDate.getDay()));

  // Calcular número de días
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const numWeeks = Math.ceil(totalDays / 7);

  // Agregar encabezados de mes/semana
  let currentDate = new Date(startDate);
  const monthStartCols: { month: string; startCol: number; endCol: number }[] = [];
  let lastMonth = '';

  for (let day = 0; day < totalDays; day++) {
    const monthName = currentDate.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' });
    if (monthName !== lastMonth) {
      if (monthStartCols.length > 0) {
        monthStartCols[monthStartCols.length - 1].endCol = 5 + day - 1;
      }
      monthStartCols.push({ month: monthName, startCol: 5 + day, endCol: 5 + day });
      lastMonth = monthName;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  if (monthStartCols.length > 0) {
    monthStartCols[monthStartCols.length - 1].endCol = 5 + totalDays - 1;
  }

  // Fila 1: Encabezados de columnas + Meses
  const ganttHeaderRow = wsGantt.addRow(['Código', 'Tarea', 'Inicio', 'Fin', '%']);
  ganttHeaderRow.height = 20;

  // Fila 2: Celdas vacías para columnas 1-5 + Días del mes
  const daysRow: (string | number)[] = ['', '', '', '', ''];
  currentDate = new Date(startDate);
  for (let day = 0; day < totalDays; day++) {
    daysRow.push(currentDate.getDate());
    currentDate.setDate(currentDate.getDate() + 1);
  }
  const dayHeaderRow = wsGantt.addRow(daysRow);
  dayHeaderRow.height = 18;

  // Combinar celdas verticalmente para los encabezados (columnas 1-5, filas 1-2)
  for (let col = 1; col <= 5; col++) {
    wsGantt.mergeCells(1, col, 2, col);
    const cell = wsGantt.getCell(1, col);
    cell.font = { bold: true, size: 9, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ineiBLUE } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFFFFF' } },
      left: { style: 'thin', color: { argb: 'FFFFFF' } },
      bottom: { style: 'thin', color: { argb: 'FFFFFF' } },
      right: { style: 'thin', color: { argb: 'FFFFFF' } }
    };
  }

  // Agregar meses en fila 1 (columnas de fechas)
  monthStartCols.forEach(m => {
    wsGantt.mergeCells(1, m.startCol + 1, 1, m.endCol + 1);
    const cell = wsGantt.getCell(1, m.startCol + 1);
    cell.value = m.month.toUpperCase();
    cell.font = { bold: true, size: 9, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ineiBLUE } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Estilo para los días (fila 2, columnas de fechas)
  for (let day = 0; day < totalDays; day++) {
    const cell = wsGantt.getCell(2, 6 + day);
    cell.font = { bold: true, size: 8 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  // Colorear fines de semana en header
  currentDate = new Date(startDate);
  for (let day = 0; day < totalDays; day++) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      const cell = wsGantt.getCell(2, 6 + day);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } };
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Colores para fases
  const faseColors: Record<string, string> = {
    'Analisis': '4A90D9',
    'Diseno': '7B68EE',
    'Desarrollo': '32CD32',
    'Pruebas': 'FFA500',
    'Implementacion': '20B2AA',
    'Mantenimiento': '778899'
  };

  // Agregar filas de tareas con barras de Gantt
  tareasOrdenadas.forEach((tarea) => {
    const inicio = new Date(tarea.inicio);
    const fin = new Date(tarea.fin);
    const esFase = tarea.tipo === 'proyecto';
    const esHito = tarea.tipo === 'hito' || tarea.esHito;

    const rowData: (string | number)[] = [
      tarea.codigo || '',
      esFase ? `★ ${tarea.nombre}` : (esHito ? `◆ ${tarea.nombre}` : `   ${tarea.nombre}`),
      inicio.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' }),
      fin.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' }),
      tarea.progreso || 0
    ];

    // Agregar celdas vacías para el Gantt
    for (let day = 0; day < totalDays; day++) {
      rowData.push('');
    }

    const row = wsGantt.addRow(rowData);
    row.height = 20;

    // Estilo de la fila según tipo
    if (esFase) {
      row.font = { bold: true, size: 9, color: { argb: 'FFFFFF' } };
      row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ineiBLUE } };
      row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ineiBLUE } };
      row.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ineiBLUE } };
      row.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ineiBLUE } };
      row.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ineiBLUE } };
    } else if (esHito) {
      row.font = { bold: true, size: 9, color: { argb: 'B8860B' } };
    } else {
      row.font = { size: 9 };
    }

    // Dibujar barra de Gantt
    const tareaColor = faseColors[tarea.fase || ''] || '4A90D9';
    currentDate = new Date(startDate);

    for (let day = 0; day < totalDays; day++) {
      const cellDate = new Date(currentDate);
      const cell = row.getCell(6 + day);

      // Verificar si la fecha está en el rango de la tarea
      if (cellDate >= inicio && cellDate <= fin) {
        if (esHito && cellDate.getTime() === inicio.getTime()) {
          // Hito: solo un día con diamante
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD700' } };
          cell.font = { bold: true };
        } else if (!esHito) {
          // Tarea normal: barra completa
          if (esFase) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ineiBLUE } };
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: tareaColor } };
          }

          // Mostrar progreso con degradado (parte completada más oscura)
          const dayIndex = Math.floor((cellDate.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
          const totalTaskDays = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const progressDays = Math.floor(totalTaskDays * (tarea.progreso || 0) / 100);

          if (dayIndex < progressDays) {
            // Parte completada - color más intenso
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: esFase ? '002244' : tareaColor } };
          } else if (!esFase) {
            // Parte pendiente - color más claro
            const lightColor = tareaColor.split('').map((c, i) => {
              if (i % 2 === 0) return 'D';
              return c;
            }).join('');
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `${lightColor.substring(0, 6)}` } };
          }
        }
      } else {
        // Colorear fines de semana
        const dayOfWeek = cellDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F5F5F5' } };
        }
      }

      // Borde sutil
      cell.border = {
        top: { style: 'thin', color: { argb: 'E0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
        left: { style: 'hair', color: { argb: 'E8E8E8' } },
        right: { style: 'hair', color: { argb: 'E8E8E8' } }
      };

      currentDate.setDate(currentDate.getDate() + 1);
    }
  });

  // Configurar anchos de columna para Gantt
  wsGantt.getColumn(1).width = 10;  // Código
  wsGantt.getColumn(2).width = 35;  // Tarea
  wsGantt.getColumn(3).width = 10;  // Inicio
  wsGantt.getColumn(4).width = 10;  // Fin
  wsGantt.getColumn(5).width = 5;   // %

  // Columnas de días (ancho pequeño para simular barras)
  for (let i = 6; i <= 5 + totalDays; i++) {
    wsGantt.getColumn(i).width = 2.5;
  }

  // Agregar leyenda al final
  const legendaRow = wsGantt.rowCount + 2;
  wsGantt.getCell(`A${legendaRow}`).value = 'LEYENDA:';
  wsGantt.getCell(`A${legendaRow}`).font = { bold: true };

  const legendItems = [
    { label: 'Análisis', color: faseColors['Analisis'] },
    { label: 'Diseño', color: faseColors['Diseno'] },
    { label: 'Desarrollo', color: faseColors['Desarrollo'] },
    { label: 'Pruebas', color: faseColors['Pruebas'] },
    { label: 'Implementación', color: faseColors['Implementacion'] },
    { label: 'Mantenimiento', color: faseColors['Mantenimiento'] },
    { label: 'Hito', color: 'FFD700' },
  ];

  legendItems.forEach((item, idx) => {
    const row = legendaRow + 1 + idx;
    wsGantt.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: item.color } };
    wsGantt.getCell(`B${row}`).value = item.label;
  });

  // Congelar primeras columnas y filas
  wsGantt.views = [{ state: 'frozen', xSplit: 5, ySplit: 2 }];

  // =============== HOJAS POR FASE ===============
  fases.forEach(fase => {
    const tareasFase = tareas.filter(t => t.fase === fase);
    if (tareasFase.length > 0) {
      const wsFase = wb.addWorksheet(fasesLabels[fase].substring(0, 31));

      // Headers
      const faseHeadersRow = wsFase.addRow(['CÓDIGO', 'NOMBRE', 'TIPO', 'FECHA INICIO', 'FECHA FIN', 'DURACIÓN', 'AVANCE (%)', 'RESPONSABLE']);
      faseHeadersRow.font = { bold: true, color: { argb: 'FFFFFF' } };
      faseHeadersRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ineiBLUE } };
      faseHeadersRow.height = 25;
      faseHeadersRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Datos
      tareasFase.forEach((tarea, idx) => {
        const inicio = new Date(tarea.inicio);
        const fin = new Date(tarea.fin);
        const duracion = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
        const esHito = tarea.tipo === 'hito' || tarea.esHito;

        const row = wsFase.addRow([
          tarea.codigo || '',
          tarea.nombre,
          esHito ? 'HITO' : 'TAREA',
          inicio.toLocaleDateString('es-PE'),
          fin.toLocaleDateString('es-PE'),
          duracion,
          tarea.progreso || 0,
          tarea.responsable?.nombre || 'Sin asignar',
        ]);

        // Determinar color de fondo
        const bgColor = idx % 2 === 0 ? 'FFFFFF' : 'F5F5F5';

        // Aplicar estilo a cada celda
        row.eachCell((cell, colNumber) => {
          if (esHito) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8DC' } };
            cell.font = { bold: true, color: { argb: '8B4513' } };
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
          }

          cell.border = {
            top: { style: 'thin', color: { argb: 'DDDDDD' } },
            left: { style: 'thin', color: { argb: 'DDDDDD' } },
            bottom: { style: 'thin', color: { argb: 'DDDDDD' } },
            right: { style: 'thin', color: { argb: 'DDDDDD' } }
          };

          // Centrar duración y avance
          if (colNumber === 6 || colNumber === 7) {
            cell.alignment = { horizontal: 'center' };
          }
        });
      });

      // Anchos
      wsFase.getColumn(1).width = 12;
      wsFase.getColumn(2).width = 45;
      wsFase.getColumn(3).width = 10;
      wsFase.getColumn(4).width = 14;
      wsFase.getColumn(5).width = 14;
      wsFase.getColumn(6).width = 12;
      wsFase.getColumn(7).width = 12;
      wsFase.getColumn(8).width = 25;

      wsFase.views = [{ state: 'frozen', ySplit: 1 }];
    }
  });

  // Generar archivo
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const filename = `cronograma_${cronograma.id}_${new Date().toISOString().split('T')[0]}.xlsx`;

  return { url, filename };
}

/**
 * Descargar archivo exportado
 */
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Limpiar URL si es blob
  if (url.startsWith('blob:')) {
    window.URL.revokeObjectURL(url);
  }
}

// ============================================
// RUTA CRITICA
// ============================================

/**
 * Calcular la ruta critica del cronograma
 */
export async function getRutaCritica(
  cronogramaId: number | string
): Promise<ResultadoRutaCritica> {
  const response = await apiClient.get<ResultadoRutaCritica>(
    `${ENDPOINTS.CRONOGRAMAS.BY_ID(cronogramaId)}/ruta-critica`
  );
  return response.data;
}

/**
 * Recalcular fechas basadas en dependencias
 */
export async function recalcularFechas(
  cronogramaId: number | string
): Promise<TareaCronograma[]> {
  const response = await apiClient.post<BackendTarea[]>(
    `${ENDPOINTS.CRONOGRAMAS.BY_ID(cronogramaId)}/recalcular`
  );
  return response.data.map(transformTarea);
}

// ============================================
// EXPORTACION AVANZADA
// ============================================

/**
 * Exportar cronograma a JSON con datos completos
 */
export async function exportCronogramaJSON(
  cronogramaId: number | string
): Promise<DatosExportacion> {
  const response = await apiClient.get<DatosExportacion>(
    `${ENDPOINTS.CRONOGRAMAS.BY_ID(cronogramaId)}/exportar?formato=json`
  );
  return response.data;
}

/**
 * Exportar cronograma a CSV
 */
export async function exportCronogramaCSV(
  cronogramaId: number | string
): Promise<string> {
  const response = await apiClient.get<string>(
    `${ENDPOINTS.CRONOGRAMAS.BY_ID(cronogramaId)}/exportar?formato=csv`
  );
  return response.data;
}

/**
 * Descargar CSV como archivo
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  downloadFile(url, filename);
}

/**
 * Obtener plantilla de importacion
 */
export async function getPlantillaImportacion(
  cronogramaId: number | string
): Promise<string> {
  const response = await apiClient.get<string>(
    `${ENDPOINTS.CRONOGRAMAS.BY_ID(cronogramaId)}/plantilla-importacion`
  );
  return response.data;
}

// ============================================
// VALIDACION / APROBACION
// ============================================

export interface AprobarCronogramaInput {
  aprobado: boolean;
  comentario?: string;
}

/**
 * Aprobar o rechazar un cronograma
 * Solo para roles PMO y PATROCINADOR
 */
export async function aprobarCronograma(
  cronogramaId: number | string,
  data: AprobarCronogramaInput
): Promise<Cronograma> {
  const response = await apiClient.post<BackendCronograma>(
    `${ENDPOINTS.CRONOGRAMAS.BY_ID(cronogramaId)}/aprobar`,
    data
  );
  return transformCronograma(response.data);
}

/**
 * Enviar cronograma a revisión (cambiar de Borrador a Pendiente)
 * Para que PMO/PATROCINADOR puedan validarlo
 */
export async function enviarARevision(
  cronogramaId: number | string
): Promise<Cronograma> {
  const response = await apiClient.post<BackendCronograma>(
    `${ENDPOINTS.CRONOGRAMAS.BY_ID(cronogramaId)}/enviar-revision`
  );
  return transformCronograma(response.data);
}
