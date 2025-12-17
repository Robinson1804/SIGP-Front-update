/**
 * Informe de Actividad Template
 *
 * Genera PDF del informe de actividad (Kanban)
 */

import type { InformeActividadData } from '@/features/documentos/types';
import {
  createPDFDocument,
  addHeader,
  addFooter,
  addSection,
  addTable,
  checkPageBreak,
  formatDateForPDF,
  formatNumberForPDF,
  getPDFBlob,
  PDF_MARGINS,
  PDF_COLORS,
  PDF_FONTS,
} from '../pdf-generator';

/**
 * Genera el PDF del Informe de Actividad
 */
export async function generateInformeActividad(data: InformeActividadData): Promise<Blob> {
  const doc = await createPDFDocument('Informe de Actividad', 'portrait');
  const pageWidth = doc.internal.pageSize.getWidth();

  let currentY = addHeader(
    doc,
    'INFORME DE ACTIVIDAD',
    `${data.actividadNombre} - ${data.proyectoNombre}`
  );

  let pageNumber = 1;

  // ===========================================
  // INFORMACION DEL PERIODO
  // ===========================================
  currentY += 5;
  currentY = addSection(doc, '1. PERIODO DE REPORTE', currentY);

  // Caja de informacion
  const boxHeight = 20;
  doc.setFillColor('#F0F9FF');
  doc.setDrawColor(PDF_COLORS.SECONDARY);
  doc.roundedRect(PDF_MARGINS.LEFT, currentY, pageWidth - (PDF_MARGINS.LEFT * 2), boxHeight, 3, 3, 'FD');

  const col1X = PDF_MARGINS.LEFT + 5;
  const col2X = pageWidth / 2 + 10;
  let infoY = currentY + 8;

  // Actividad
  doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
  doc.setFontSize(PDF_FONTS.TINY);
  doc.text('Actividad:', col1X, infoY);
  doc.setTextColor(PDF_COLORS.PRIMARY);
  doc.setFontSize(PDF_FONTS.BODY);
  doc.setFont('helvetica', 'bold');
  doc.text(data.actividadNombre, col1X + 25, infoY);

  infoY += 8;
  doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
  doc.setFontSize(PDF_FONTS.TINY);
  doc.setFont('helvetica', 'normal');
  doc.text('Periodo:', col1X, infoY);
  doc.setTextColor(PDF_COLORS.TEXT);
  doc.setFontSize(PDF_FONTS.BODY);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${formatDateForPDF(data.fechaInicio)} - ${formatDateForPDF(data.fechaFin)}`,
    col1X + 25,
    infoY
  );

  currentY += boxHeight + 10;

  // ===========================================
  // METRICAS KANBAN
  // ===========================================
  const pageCheck1 = checkPageBreak(doc, currentY, 50, pageNumber);
  currentY = pageCheck1.y;
  pageNumber = pageCheck1.page;

  currentY = addSection(doc, '2. METRICAS KANBAN', currentY);

  // Cajas de metricas
  const metricBoxWidth = 42;
  const metricBoxHeight = 35;
  const metricGap = 5;
  let metricX = PDF_MARGINS.LEFT;

  // Funcion para agregar caja de metrica Kanban
  const addKanbanMetricBox = (
    x: number,
    label: string,
    value: string,
    sublabel: string,
    color: string
  ) => {
    doc.setFillColor('#FFFFFF');
    doc.setDrawColor(color);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, currentY, metricBoxWidth, metricBoxHeight, 3, 3, 'FD');

    // Icono/decoracion
    doc.setFillColor(color);
    doc.rect(x, currentY, metricBoxWidth, 4, 'F');

    // Valor
    doc.setTextColor(color);
    doc.setFontSize(PDF_FONTS.TITLE);
    doc.setFont('helvetica', 'bold');
    doc.text(value, x + metricBoxWidth / 2, currentY + 18, { align: 'center' });

    // Label
    doc.setTextColor(PDF_COLORS.TEXT);
    doc.setFontSize(PDF_FONTS.SMALL);
    doc.setFont('helvetica', 'bold');
    doc.text(label, x + metricBoxWidth / 2, currentY + 26, { align: 'center' });

    // Sublabel
    doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
    doc.setFontSize(PDF_FONTS.TINY);
    doc.setFont('helvetica', 'normal');
    doc.text(sublabel, x + metricBoxWidth / 2, currentY + 32, { align: 'center' });
  };

  // Throughput
  addKanbanMetricBox(
    metricX,
    'Throughput',
    String(data.throughput),
    'tareas/semana',
    PDF_COLORS.SUCCESS
  );
  metricX += metricBoxWidth + metricGap;

  // Lead Time
  addKanbanMetricBox(
    metricX,
    'Lead Time',
    data.leadTime.toFixed(1),
    'dias promedio',
    PDF_COLORS.SECONDARY
  );
  metricX += metricBoxWidth + metricGap;

  // Cycle Time
  addKanbanMetricBox(
    metricX,
    'Cycle Time',
    data.cycleTime.toFixed(1),
    'dias promedio',
    PDF_COLORS.PRIMARY
  );
  metricX += metricBoxWidth + metricGap;

  // WIP Promedio
  addKanbanMetricBox(
    metricX,
    'WIP Prom.',
    data.wipPromedio.toFixed(1),
    'tareas',
    PDF_COLORS.WARNING
  );

  currentY += metricBoxHeight + 15;

  // Explicacion de metricas
  doc.setFillColor('#FFFBEB');
  doc.setDrawColor(PDF_COLORS.WARNING);
  doc.roundedRect(PDF_MARGINS.LEFT, currentY, pageWidth - (PDF_MARGINS.LEFT * 2), 25, 2, 2, 'FD');

  doc.setTextColor(PDF_COLORS.TEXT);
  doc.setFontSize(PDF_FONTS.TINY);
  doc.setFont('helvetica', 'normal');

  let expY = currentY + 5;
  doc.text('Throughput: Cantidad de tareas completadas por unidad de tiempo.', PDF_MARGINS.LEFT + 5, expY);
  expY += 5;
  doc.text('Lead Time: Tiempo desde que se solicita una tarea hasta que se completa.', PDF_MARGINS.LEFT + 5, expY);
  expY += 5;
  doc.text('Cycle Time: Tiempo desde que se inicia el trabajo en una tarea hasta que se completa.', PDF_MARGINS.LEFT + 5, expY);
  expY += 5;
  doc.text('WIP: Work in Progress - Cantidad de tareas en progreso simultaneamente.', PDF_MARGINS.LEFT + 5, expY);

  currentY += 32;

  // ===========================================
  // TAREAS COMPLETADAS
  // ===========================================
  const pageCheck2 = checkPageBreak(doc, currentY, 40, pageNumber);
  currentY = pageCheck2.y;
  pageNumber = pageCheck2.page;

  currentY = addSection(doc, '3. TAREAS COMPLETADAS', currentY);

  if (data.tareasCompletadas.length > 0) {
    const tareasData = data.tareasCompletadas.map((t) => [
      t.titulo,
      `${t.leadTime.toFixed(1)} dias`,
      `${t.cycleTime.toFixed(1)} dias`,
    ]);

    currentY = addTable(
      doc,
      tareasData,
      ['Tarea', 'Lead Time', 'Cycle Time'],
      currentY,
      { columnWidths: [110, 35, 35], alternateRowColor: true }
    );

    // Resumen
    const avgLeadTime = data.tareasCompletadas.reduce((sum, t) => sum + t.leadTime, 0) / data.tareasCompletadas.length;
    const avgCycleTime = data.tareasCompletadas.reduce((sum, t) => sum + t.cycleTime, 0) / data.tareasCompletadas.length;

    currentY += 5;
    doc.setTextColor(PDF_COLORS.TEXT);
    doc.setFontSize(PDF_FONTS.SMALL);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `Total: ${data.tareasCompletadas.length} tareas | Lead Time Prom: ${avgLeadTime.toFixed(1)} dias | Cycle Time Prom: ${avgCycleTime.toFixed(1)} dias`,
      PDF_MARGINS.LEFT,
      currentY
    );
    currentY += 10;
  } else {
    doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
    doc.setFontSize(PDF_FONTS.BODY);
    doc.text('No se completaron tareas en este periodo.', PDF_MARGINS.LEFT, currentY);
    currentY += 10;
  }

  // ===========================================
  // TAREAS EN PROGRESO
  // ===========================================
  if (data.tareasEnProgreso.length > 0) {
    const pageCheck3 = checkPageBreak(doc, currentY, 35, pageNumber);
    currentY = pageCheck3.y;
    pageNumber = pageCheck3.page;

    currentY = addSection(doc, '4. TAREAS EN PROGRESO', currentY);

    const enProgresoData = data.tareasEnProgreso.map((t) => {
      const diasColor = t.diasEnProgreso > 5
        ? PDF_COLORS.DANGER
        : t.diasEnProgreso > 3
          ? PDF_COLORS.WARNING
          : PDF_COLORS.SUCCESS;

      return [t.titulo, `${t.diasEnProgreso} dias`];
    });

    currentY = addTable(
      doc,
      enProgresoData,
      ['Tarea', 'Dias en Progreso'],
      currentY,
      { columnWidths: [140, 40], alternateRowColor: true }
    );

    // Alerta si hay tareas atascadas
    const tareasAtascadas = data.tareasEnProgreso.filter(t => t.diasEnProgreso > 5);
    if (tareasAtascadas.length > 0) {
      currentY += 5;
      doc.setFillColor('#FEE2E2');
      doc.setDrawColor(PDF_COLORS.DANGER);
      doc.roundedRect(PDF_MARGINS.LEFT, currentY, pageWidth - (PDF_MARGINS.LEFT * 2), 10, 2, 2, 'FD');

      doc.setTextColor(PDF_COLORS.DANGER);
      doc.setFontSize(PDF_FONTS.SMALL);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `ALERTA: ${tareasAtascadas.length} tarea(s) con mas de 5 dias en progreso`,
        pageWidth / 2,
        currentY + 7,
        { align: 'center' }
      );
      currentY += 15;
    }

    currentY += 10;
  }

  // ===========================================
  // CUELLOS DE BOTELLA
  // ===========================================
  if (data.cuellosDeBottella.length > 0) {
    const pageCheck4 = checkPageBreak(doc, currentY, 35, pageNumber);
    currentY = pageCheck4.y;
    pageNumber = pageCheck4.page;

    currentY = addSection(doc, '5. CUELLOS DE BOTELLA IDENTIFICADOS', currentY);

    const cuellosData = data.cuellosDeBottella.map((c) => [
      c.etapa,
      `${c.promedioTiempo.toFixed(1)} dias`,
      String(c.tareasAtascadas),
    ]);

    currentY = addTable(
      doc,
      cuellosData,
      ['Etapa', 'Tiempo Promedio', 'Tareas Atascadas'],
      currentY,
      { columnWidths: [80, 50, 50], alternateRowColor: true }
    );

    currentY += 10;
  }

  // ===========================================
  // RENDIMIENTO DEL EQUIPO
  // ===========================================
  if (data.equipo.length > 0) {
    const pageCheck5 = checkPageBreak(doc, currentY, 35, pageNumber);
    currentY = pageCheck5.y;
    pageNumber = pageCheck5.page;

    currentY = addSection(doc, '6. RENDIMIENTO DEL EQUIPO', currentY);

    // Ordenar por tareas completadas
    const equipoOrdenado = [...data.equipo].sort(
      (a, b) => b.tareasCompletadas - a.tareasCompletadas
    );

    const equipoData = equipoOrdenado.map((e, index) => {
      const medal = index === 0 ? '(1)' : index === 1 ? '(2)' : index === 2 ? '(3)' : '';
      return [`${medal} ${e.nombre}`, String(e.tareasCompletadas)];
    });

    currentY = addTable(
      doc,
      equipoData,
      ['Miembro', 'Tareas Completadas'],
      currentY,
      { columnWidths: [130, 50], alternateRowColor: true }
    );

    // Total
    const totalTareas = data.equipo.reduce((sum, e) => sum + e.tareasCompletadas, 0);
    currentY += 5;
    doc.setTextColor(PDF_COLORS.TEXT);
    doc.setFontSize(PDF_FONTS.BODY);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `Total de tareas completadas: ${totalTareas}`,
      pageWidth - PDF_MARGINS.RIGHT,
      currentY,
      { align: 'right' }
    );
  }

  // ===========================================
  // RECOMENDACIONES
  // ===========================================
  const pageCheck6 = checkPageBreak(doc, currentY, 40, pageNumber);
  currentY = pageCheck6.y;
  pageNumber = pageCheck6.page;

  currentY += 10;
  currentY = addSection(doc, '7. RECOMENDACIONES', currentY);

  const recomendaciones: string[] = [];

  // Generar recomendaciones basadas en metricas
  if (data.wipPromedio > 5) {
    recomendaciones.push('Considerar reducir el WIP limit para mejorar el flujo de trabajo.');
  }

  if (data.leadTime > data.cycleTime * 2) {
    recomendaciones.push('El Lead Time es alto en relacion al Cycle Time. Revisar el tiempo de espera antes de iniciar las tareas.');
  }

  if (data.cuellosDeBottella.length > 0) {
    const peorCuello = data.cuellosDeBottella.reduce(
      (prev, curr) => curr.tareasAtascadas > prev.tareasAtascadas ? curr : prev
    );
    recomendaciones.push(`Atender cuello de botella en la etapa "${peorCuello.etapa}" con ${peorCuello.tareasAtascadas} tareas atascadas.`);
  }

  if (data.tareasEnProgreso.filter(t => t.diasEnProgreso > 5).length > 0) {
    recomendaciones.push('Revisar y priorizar las tareas que llevan mas de 5 dias en progreso.');
  }

  if (recomendaciones.length === 0) {
    recomendaciones.push('El flujo de trabajo se encuentra saludable. Mantener las practicas actuales.');
  }

  recomendaciones.forEach((rec, index) => {
    doc.setTextColor(PDF_COLORS.TEXT);
    doc.setFontSize(PDF_FONTS.BODY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${index + 1}. ${rec}`, PDF_MARGINS.LEFT, currentY);
    currentY += 7;
  });

  // Agregar footer a todas las paginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i);
  }

  return getPDFBlob(doc);
}

/**
 * Descarga el PDF del Informe de Actividad
 */
export async function downloadInformeActividad(
  data: InformeActividadData,
  filename?: string
): Promise<void> {
  const blob = await generateInformeActividad(data);

  // Nombre del archivo
  const defaultFilename = `Informe_Actividad_${data.actividadNombre.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

  // Descargar
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || defaultFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
