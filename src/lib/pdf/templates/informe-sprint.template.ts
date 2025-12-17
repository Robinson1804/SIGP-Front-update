/**
 * Informe de Sprint Template
 *
 * Genera PDF del informe de sprint
 */

import type { InformeSprintData } from '@/features/documentos/types';
import {
  createPDFDocument,
  addHeader,
  addFooter,
  addSection,
  addParagraph,
  addBulletList,
  addTable,
  checkPageBreak,
  formatDateForPDF,
  formatPercentForPDF,
  getPDFBlob,
  PDF_MARGINS,
  PDF_COLORS,
  PDF_FONTS,
} from '../pdf-generator';

/**
 * Genera el PDF del Informe de Sprint
 */
export async function generateInformeSprint(data: InformeSprintData): Promise<Blob> {
  const doc = await createPDFDocument('Informe de Sprint', 'portrait');
  const pageWidth = doc.internal.pageSize.getWidth();

  let currentY = addHeader(
    doc,
    'INFORME DE SPRINT',
    `${data.sprintNombre} - ${data.proyectoNombre}`
  );

  let pageNumber = 1;

  // ===========================================
  // INFORMACION DEL SPRINT
  // ===========================================
  currentY += 5;
  currentY = addSection(doc, '1. INFORMACION DEL SPRINT', currentY);

  // Caja de informacion
  const boxHeight = 28;
  doc.setFillColor('#E8F4FD');
  doc.setDrawColor(PDF_COLORS.SECONDARY);
  doc.roundedRect(PDF_MARGINS.LEFT, currentY, pageWidth - (PDF_MARGINS.LEFT * 2), boxHeight, 3, 3, 'FD');

  const col1X = PDF_MARGINS.LEFT + 5;
  const col2X = PDF_MARGINS.LEFT + 65;
  const col3X = PDF_MARGINS.LEFT + 130;
  let infoY = currentY + 8;

  // Sprint
  doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
  doc.setFontSize(PDF_FONTS.TINY);
  doc.text('Sprint:', col1X, infoY);
  doc.setTextColor(PDF_COLORS.PRIMARY);
  doc.setFontSize(PDF_FONTS.BODY);
  doc.setFont('helvetica', 'bold');
  doc.text(data.sprintNombre, col1X + 20, infoY);

  // Fecha inicio
  doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
  doc.setFontSize(PDF_FONTS.TINY);
  doc.setFont('helvetica', 'normal');
  doc.text('Inicio:', col2X, infoY);
  doc.setTextColor(PDF_COLORS.TEXT);
  doc.setFontSize(PDF_FONTS.BODY);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDateForPDF(data.fechaInicio), col2X + 18, infoY);

  // Fecha fin
  doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
  doc.setFontSize(PDF_FONTS.TINY);
  doc.setFont('helvetica', 'normal');
  doc.text('Fin:', col3X, infoY);
  doc.setTextColor(PDF_COLORS.TEXT);
  doc.setFontSize(PDF_FONTS.BODY);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDateForPDF(data.fechaFin), col3X + 12, infoY);

  // Segunda fila
  infoY += 10;
  doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
  doc.setFontSize(PDF_FONTS.TINY);
  doc.setFont('helvetica', 'normal');
  doc.text('Objetivo del Sprint:', col1X, infoY);

  infoY += 5;
  doc.setTextColor(PDF_COLORS.TEXT);
  doc.setFontSize(PDF_FONTS.SMALL);
  doc.setFont('helvetica', 'normal');
  const goalLines = doc.splitTextToSize(data.sprintGoal, pageWidth - (PDF_MARGINS.LEFT * 2) - 10);
  doc.text(goalLines, col1X, infoY);

  currentY += boxHeight + 10;

  // ===========================================
  // METRICAS CLAVE
  // ===========================================
  const pageCheck1 = checkPageBreak(doc, currentY, 50, pageNumber);
  currentY = pageCheck1.y;
  pageNumber = pageCheck1.page;

  currentY = addSection(doc, '2. METRICAS CLAVE', currentY);

  // Cajas de metricas
  const metricBoxWidth = 42;
  const metricBoxHeight = 30;
  const metricGap = 5;
  let metricX = PDF_MARGINS.LEFT;

  // Funcion para agregar caja de metrica
  const addMetricBox = (
    x: number,
    label: string,
    value: string,
    color: string,
    sublabel?: string
  ) => {
    doc.setFillColor('#FFFFFF');
    doc.setDrawColor(color);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, currentY, metricBoxWidth, metricBoxHeight, 3, 3, 'FD');

    // Valor
    doc.setTextColor(color);
    doc.setFontSize(PDF_FONTS.SUBTITLE);
    doc.setFont('helvetica', 'bold');
    doc.text(value, x + metricBoxWidth / 2, currentY + 12, { align: 'center' });

    // Label
    doc.setTextColor(PDF_COLORS.TEXT);
    doc.setFontSize(PDF_FONTS.TINY);
    doc.setFont('helvetica', 'normal');
    doc.text(label, x + metricBoxWidth / 2, currentY + 20, { align: 'center' });

    // Sublabel
    if (sublabel) {
      doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
      doc.setFontSize(6);
      doc.text(sublabel, x + metricBoxWidth / 2, currentY + 25, { align: 'center' });
    }
  };

  // Story Points Planeados
  addMetricBox(
    metricX,
    'SP Planeados',
    String(data.storyPointsPlaneados),
    PDF_COLORS.PRIMARY
  );
  metricX += metricBoxWidth + metricGap;

  // Story Points Completados
  addMetricBox(
    metricX,
    'SP Completados',
    String(data.storyPointsCompletados),
    data.storyPointsCompletados >= data.storyPointsPlaneados ? PDF_COLORS.SUCCESS : PDF_COLORS.WARNING
  );
  metricX += metricBoxWidth + metricGap;

  // Velocidad
  addMetricBox(
    metricX,
    'Velocidad',
    data.velocidad.toFixed(1),
    PDF_COLORS.SECONDARY,
    'SP/dia'
  );
  metricX += metricBoxWidth + metricGap;

  // Tasa de completitud
  const completitudColor = data.tasaCompletitud >= 80
    ? PDF_COLORS.SUCCESS
    : data.tasaCompletitud >= 60
      ? PDF_COLORS.WARNING
      : PDF_COLORS.DANGER;

  addMetricBox(
    metricX,
    'Completitud',
    formatPercentForPDF(data.tasaCompletitud),
    completitudColor
  );

  currentY += metricBoxHeight + 10;

  // Objetivo cumplido
  doc.setFillColor(data.objetivoCumplido ? '#E8F8E8' : '#FFF8E8');
  doc.setDrawColor(data.objetivoCumplido ? PDF_COLORS.SUCCESS : PDF_COLORS.WARNING);
  doc.roundedRect(PDF_MARGINS.LEFT, currentY, pageWidth - (PDF_MARGINS.LEFT * 2), 12, 2, 2, 'FD');

  doc.setTextColor(data.objetivoCumplido ? PDF_COLORS.SUCCESS : PDF_COLORS.WARNING);
  doc.setFontSize(PDF_FONTS.BODY);
  doc.setFont('helvetica', 'bold');
  const objetivoText = data.objetivoCumplido
    ? 'OBJETIVO DEL SPRINT: CUMPLIDO'
    : 'OBJETIVO DEL SPRINT: NO CUMPLIDO';
  doc.text(objetivoText, pageWidth / 2, currentY + 8, { align: 'center' });

  currentY += 20;

  // ===========================================
  // HISTORIAS COMPLETADAS
  // ===========================================
  const pageCheck2 = checkPageBreak(doc, currentY, 40, pageNumber);
  currentY = pageCheck2.y;
  pageNumber = pageCheck2.page;

  currentY = addSection(doc, '3. HISTORIAS COMPLETADAS', currentY);

  if (data.historiasCompletadas.length > 0) {
    const historiasData = data.historiasCompletadas.map((h) => [
      h.codigo,
      h.titulo,
      String(h.storyPoints),
    ]);

    currentY = addTable(
      doc,
      historiasData,
      ['Codigo', 'Titulo', 'SP'],
      currentY,
      { columnWidths: [25, 130, 20], alternateRowColor: true }
    );

    // Total
    doc.setTextColor(PDF_COLORS.TEXT);
    doc.setFontSize(PDF_FONTS.BODY);
    doc.setFont('helvetica', 'bold');
    const totalSP = data.historiasCompletadas.reduce((sum, h) => sum + h.storyPoints, 0);
    doc.text(
      `Total Story Points Completados: ${totalSP}`,
      pageWidth - PDF_MARGINS.RIGHT,
      currentY + 5,
      { align: 'right' }
    );
    currentY += 10;
  } else {
    doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
    doc.setFontSize(PDF_FONTS.BODY);
    doc.text('No se completaron historias en este sprint.', PDF_MARGINS.LEFT, currentY);
    currentY += 8;
  }

  currentY += 5;

  // ===========================================
  // HISTORIAS INCOMPLETAS
  // ===========================================
  if (data.historiasIncompletas.length > 0) {
    const pageCheck3 = checkPageBreak(doc, currentY, 35, pageNumber);
    currentY = pageCheck3.y;
    pageNumber = pageCheck3.page;

    currentY = addSection(doc, '4. HISTORIAS INCOMPLETAS', currentY);

    const incompletasData = data.historiasIncompletas.map((h) => [
      h.codigo,
      h.titulo,
      String(h.storyPoints),
      h.motivo || 'Sin especificar',
    ]);

    currentY = addTable(
      doc,
      incompletasData,
      ['Codigo', 'Titulo', 'SP', 'Motivo'],
      currentY,
      { columnWidths: [25, 80, 15, 55], alternateRowColor: true }
    );

    currentY += 10;
  }

  // ===========================================
  // BLOQUEOS
  // ===========================================
  if (data.bloqueos.length > 0) {
    const pageCheck4 = checkPageBreak(doc, currentY, 30, pageNumber);
    currentY = pageCheck4.y;
    pageNumber = pageCheck4.page;

    currentY = addSection(doc, '5. BLOQUEOS E IMPEDIMENTOS', currentY);

    data.bloqueos.forEach((bloqueo) => {
      const statusIcon = bloqueo.resuelto ? '[RESUELTO]' : '[PENDIENTE]';
      const statusColor = bloqueo.resuelto ? PDF_COLORS.SUCCESS : PDF_COLORS.DANGER;

      doc.setTextColor(statusColor);
      doc.setFontSize(PDF_FONTS.SMALL);
      doc.setFont('helvetica', 'bold');
      doc.text(statusIcon, PDF_MARGINS.LEFT, currentY);

      doc.setTextColor(PDF_COLORS.TEXT);
      doc.setFont('helvetica', 'normal');
      doc.text(bloqueo.descripcion, PDF_MARGINS.LEFT + 25, currentY);
      currentY += 7;
    });

    currentY += 5;
  }

  // ===========================================
  // RETROSPECTIVA
  // ===========================================
  const pageCheck5 = checkPageBreak(doc, currentY, 50, pageNumber);
  currentY = pageCheck5.y;
  pageNumber = pageCheck5.page;

  currentY = addSection(doc, '6. RETROSPECTIVA', currentY);

  // Que salio bien
  if (data.queSalioBien) {
    doc.setTextColor(PDF_COLORS.SUCCESS);
    doc.setFontSize(PDF_FONTS.BODY);
    doc.setFont('helvetica', 'bold');
    doc.text('Lo que salio bien:', PDF_MARGINS.LEFT, currentY);
    currentY += 5;
    currentY = addParagraph(doc, data.queSalioBien, currentY, { color: PDF_COLORS.TEXT });
  }

  // Que salio mal
  if (data.queSalioMal) {
    doc.setTextColor(PDF_COLORS.DANGER);
    doc.setFontSize(PDF_FONTS.BODY);
    doc.setFont('helvetica', 'bold');
    doc.text('Lo que salio mal:', PDF_MARGINS.LEFT, currentY);
    currentY += 5;
    currentY = addParagraph(doc, data.queSalioMal, currentY, { color: PDF_COLORS.TEXT });
  }

  // Acciones de mejora
  if (data.accionesMejora) {
    doc.setTextColor(PDF_COLORS.PRIMARY);
    doc.setFontSize(PDF_FONTS.BODY);
    doc.setFont('helvetica', 'bold');
    doc.text('Acciones de mejora:', PDF_MARGINS.LEFT, currentY);
    currentY += 5;
    currentY = addParagraph(doc, data.accionesMejora, currentY, { color: PDF_COLORS.TEXT });
  }

  currentY += 5;

  // ===========================================
  // EQUIPO
  // ===========================================
  if (data.equipo.length > 0) {
    const pageCheck6 = checkPageBreak(doc, currentY, 30, pageNumber);
    currentY = pageCheck6.y;
    pageNumber = pageCheck6.page;

    currentY = addSection(doc, '7. EQUIPO DEL SPRINT', currentY);

    const equipoData = data.equipo.map((e) => [e.nombre, e.rol]);

    currentY = addTable(
      doc,
      equipoData,
      ['Nombre', 'Rol'],
      currentY,
      { columnWidths: [100, 80], alternateRowColor: true }
    );
  }

  // Agregar footer a todas las paginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i);
  }

  return getPDFBlob(doc);
}

/**
 * Descarga el PDF del Informe de Sprint
 */
export async function downloadInformeSprint(
  data: InformeSprintData,
  filename?: string
): Promise<void> {
  const blob = await generateInformeSprint(data);

  // Nombre del archivo
  const defaultFilename = `Informe_${data.sprintNombre.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

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
