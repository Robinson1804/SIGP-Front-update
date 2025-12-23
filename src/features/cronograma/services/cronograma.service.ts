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
  responsableId?: number;
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
  createdAt: string;
  updatedAt: string;
  tareas?: BackendTarea[];
}

/**
 * Safely parse a date string, returning a valid Date or a default
 */
function safeParseDate(dateStr: string | undefined | null, defaultDate?: Date): Date {
  if (!dateStr) {
    return defaultDate || new Date();
  }
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
    tipo: backendTarea.esHito ? 'hito' : (backendTarea.tareaPadreId ? 'tarea' : 'proyecto') as TipoTarea,
    responsableId: backendTarea.responsableId,
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
    id: backendCronograma.id,
    proyectoId: backendCronograma.proyectoId,
    nombre: backendCronograma.nombre,
    descripcion: backendCronograma.descripcion,
    tareas,
    dependencias,
    fechaBase: undefined,
    activo: backendCronograma.activo,
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
  // Transform frontend format to backend format
  const backendData = {
    cronogramaId: typeof cronogramaId === 'string' ? parseInt(cronogramaId, 10) : cronogramaId,
    codigo: data.codigo || `T-${Date.now().toString().slice(-6)}`,
    nombre: data.nombre,
    fechaInicio: data.inicio,
    fechaFin: data.fin,
    responsableId: data.responsableId,
    tareaPadreId: data.padre ? parseInt(data.padre, 10) : undefined,
    orden: data.orden,
    descripcion: data.descripcion,
    fase: data.fase,
    esHito: data.tipo === 'hito',
    color: data.color,
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

  // Calcular estadísticas
  const tareasNormales = tareas.filter(t => t.tipo !== 'proyecto');
  const totalTareas = tareasNormales.length;
  const tareasCompletadas = tareasNormales.filter(t => t.progreso >= 100).length;
  const tareasEnProgreso = tareasNormales.filter(t => t.progreso > 0 && t.progreso < 100).length;
  const tareasPendientes = tareasNormales.filter(t => t.progreso === 0).length;
  const progresoGeneral = totalTareas > 0
    ? Math.round(tareasNormales.reduce((sum, t) => sum + (t.progreso || 0), 0) / totalTareas)
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
    wsResumen.getCell(`A${rowNum}`).value = row[0];
    wsResumen.getCell(`A${rowNum}`).font = { bold: true };
    wsResumen.getCell(`B${rowNum}`).value = row[1];
    if (idx % 2 === 0) {
      wsResumen.getRow(rowNum).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
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
    const tareasFase = tareasNormales.filter(t => t.fase === fase);
    if (tareasFase.length > 0) {
      const progresoFase = Math.round(tareasFase.reduce((sum, t) => sum + (t.progreso || 0), 0) / tareasFase.length);
      wsResumen.getCell(`A${faseRow}`).value = `${fasesLabels[fase]}:`;
      wsResumen.getCell(`A${faseRow}`).font = { bold: true };
      wsResumen.getCell(`B${faseRow}`).value = `${tareasFase.length} tareas - ${progresoFase}% completado`;
      if (idx % 2 === 0) {
        wsResumen.getRow(faseRow).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBg } };
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

  // Separar y ordenar tareas por fase
  const faseHeaders = tareas.filter(t => t.tipo === 'proyecto');
  const tareasOrdenadas: typeof tareas = [];

  fases.forEach(fase => {
    const faseHeader = faseHeaders.find(f => f.fase === fase);
    if (faseHeader) {
      tareasOrdenadas.push(faseHeader);
    }
    const tareasDeEstaFase = tareasNormales
      .filter(t => t.fase === fase)
      .sort((a, b) => (a.orden || 0) - (b.orden || 0));
    tareasOrdenadas.push(...tareasDeEstaFase);
  });

  // Tareas sin fase al final
  const tareasSinFase = tareasNormales.filter(t => !t.fase || !fases.includes(t.fase));
  tareasOrdenadas.push(...tareasSinFase);

  // Agregar filas de datos
  tareasOrdenadas.forEach((tarea) => {
    const inicio = new Date(tarea.inicio);
    const fin = new Date(tarea.fin);
    const duracion = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
    const esFase = tarea.tipo === 'proyecto';
    const esHito = tarea.tipo === 'hito' || tarea.esHito;

    const row = wsTareas.addRow([
      tarea.codigo || '',
      esFase ? tarea.nombre : `   ${tarea.nombre}`,
      esFase ? 'FASE' : esHito ? 'HITO' : 'TAREA',
      fasesLabels[tarea.fase || ''] || tarea.fase || '',
      inicio.toLocaleDateString('es-PE'),
      fin.toLocaleDateString('es-PE'),
      duracion,
      tarea.progreso || 0,
      tarea.responsable?.nombre || 'Sin asignar',
      tarea.descripcion || ''
    ]);

    // Estilo para filas de fase
    if (esFase) {
      row.font = { bold: true, color: { argb: 'FFFFFF' } };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: faseBg } };
    } else if (esHito) {
      row.font = { bold: true, color: { argb: '8B4513' } };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8DC' } };
    } else {
      // Alternar colores para tareas normales
      const rowIdx = wsTareas.rowCount;
      if (rowIdx % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FAFAFA' } };
      }
    }

    // Bordes
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'DDDDDD' } },
        left: { style: 'thin', color: { argb: 'DDDDDD' } },
        bottom: { style: 'thin', color: { argb: 'DDDDDD' } },
        right: { style: 'thin', color: { argb: 'DDDDDD' } }
      };
    });
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
        const esFase = tarea.tipo === 'proyecto';
        const esHito = tarea.tipo === 'hito' || tarea.esHito;

        const row = wsFase.addRow([
          tarea.codigo || '',
          tarea.nombre,
          esFase ? 'FASE' : esHito ? 'HITO' : 'TAREA',
          inicio.toLocaleDateString('es-PE'),
          fin.toLocaleDateString('es-PE'),
          duracion,
          tarea.progreso || 0,
          tarea.responsable?.nombre || 'Sin asignar',
        ]);

        if (esFase) {
          row.font = { bold: true, color: { argb: 'FFFFFF' } };
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: faseBg } };
        } else if (esHito) {
          row.font = { bold: true, color: { argb: '8B4513' } };
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8DC' } };
        } else if (idx % 2 === 0) {
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FAFAFA' } };
        }

        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'DDDDDD' } },
            left: { style: 'thin', color: { argb: 'DDDDDD' } },
            bottom: { style: 'thin', color: { argb: 'DDDDDD' } },
            right: { style: 'thin', color: { argb: 'DDDDDD' } }
          };
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
