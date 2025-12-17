/**
 * Acta de Reunion Template (Meeting Minutes)
 *
 * Genera PDF del acta de reunion
 */

import type { ActaReunionData } from '@/features/documentos/types';
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
  getPDFBlob,
  PDF_MARGINS,
  PDF_COLORS,
  PDF_FONTS,
} from '../pdf-generator';

/**
 * Genera el PDF del Acta de Reunion
 */
export async function generateActaReunion(data: ActaReunionData): Promise<Blob> {
  const doc = await createPDFDocument('Acta de Reunion', 'portrait');
  const pageWidth = doc.internal.pageSize.getWidth();

  let currentY = addHeader(
    doc,
    'ACTA DE REUNION',
    `${data.proyectoCodigo} - ${data.proyectoNombre}`
  );

  let pageNumber = 1;

  // ===========================================
  // INFORMACION DE LA REUNION
  // ===========================================
  currentY += 5;
  currentY = addSection(doc, '1. INFORMACION DE LA REUNION', currentY);

  // Caja de informacion
  const boxHeight = 35;
  doc.setFillColor('#F8FAFC');
  doc.setDrawColor(PDF_COLORS.BORDER);
  doc.roundedRect(PDF_MARGINS.LEFT, currentY, pageWidth - (PDF_MARGINS.LEFT * 2), boxHeight, 3, 3, 'FD');

  const col1X = PDF_MARGINS.LEFT + 5;
  const col2X = pageWidth / 2;
  let infoY = currentY + 8;

  // Columna 1
  doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
  doc.setFontSize(PDF_FONTS.TINY);
  doc.setFont('helvetica', 'normal');
  doc.text('Tipo de Reunion:', col1X, infoY);
  doc.setTextColor(PDF_COLORS.TEXT);
  doc.setFontSize(PDF_FONTS.BODY);
  doc.setFont('helvetica', 'bold');
  doc.text(data.tipoReunion, col1X + 35, infoY);

  infoY += 8;
  doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
  doc.setFontSize(PDF_FONTS.TINY);
  doc.setFont('helvetica', 'normal');
  doc.text('Fecha:', col1X, infoY);
  doc.setTextColor(PDF_COLORS.TEXT);
  doc.setFontSize(PDF_FONTS.BODY);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDateForPDF(data.fechaReunion), col1X + 35, infoY);

  infoY += 8;
  doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
  doc.setFontSize(PDF_FONTS.TINY);
  doc.setFont('helvetica', 'normal');
  doc.text('Hora:', col1X, infoY);
  doc.setTextColor(PDF_COLORS.TEXT);
  doc.setFontSize(PDF_FONTS.BODY);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.horaInicio} - ${data.horaFin}`, col1X + 35, infoY);

  // Columna 2
  infoY = currentY + 8;
  doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
  doc.setFontSize(PDF_FONTS.TINY);
  doc.setFont('helvetica', 'normal');
  doc.text('Fase:', col2X, infoY);
  doc.setTextColor(PDF_COLORS.TEXT);
  doc.setFontSize(PDF_FONTS.BODY);
  doc.setFont('helvetica', 'bold');
  doc.text(data.fasePerteneciente, col2X + 25, infoY);

  currentY += boxHeight + 10;

  // ===========================================
  // ASISTENTES
  // ===========================================
  const pageCheck1 = checkPageBreak(doc, currentY, 40, pageNumber);
  currentY = pageCheck1.y;
  pageNumber = pageCheck1.page;

  currentY = addSection(doc, '2. ASISTENTES', currentY);

  if (data.asistentes.length > 0) {
    const asistentesData = data.asistentes.map((a) => [
      a.nombre,
      a.cargo,
      a.direccion,
      a.asistio ? 'Si' : 'No',
    ]);

    currentY = addTable(
      doc,
      asistentesData,
      ['Nombre', 'Cargo', 'Direccion', 'Asistio'],
      currentY,
      { columnWidths: [55, 45, 50, 25], alternateRowColor: true }
    );
  } else {
    doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
    doc.setFontSize(PDF_FONTS.BODY);
    doc.text('No se registraron asistentes.', PDF_MARGINS.LEFT, currentY);
    currentY += 8;
  }

  // Ausentes
  if (data.ausentes.length > 0) {
    currentY += 5;
    doc.setTextColor(PDF_COLORS.TEXT);
    doc.setFontSize(PDF_FONTS.BODY);
    doc.setFont('helvetica', 'bold');
    doc.text('Ausentes:', PDF_MARGINS.LEFT, currentY);
    currentY += 5;

    const ausentesList = data.ausentes.map((a) => `${a.nombre} (${a.cargo})`);
    currentY = addBulletList(doc, ausentesList, currentY);
  }

  currentY += 10;

  // ===========================================
  // AGENDA
  // ===========================================
  const pageCheck2 = checkPageBreak(doc, currentY, 30, pageNumber);
  currentY = pageCheck2.y;
  pageNumber = pageCheck2.page;

  currentY = addSection(doc, '3. AGENDA', currentY);

  if (data.agenda.length > 0) {
    data.agenda.forEach((item, index) => {
      doc.setTextColor(PDF_COLORS.PRIMARY);
      doc.setFontSize(PDF_FONTS.BODY);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${item.tema}`, PDF_MARGINS.LEFT, currentY);
      currentY += 6;

      if (item.descripcion) {
        currentY = addParagraph(doc, item.descripcion, currentY);
      }
    });
  } else {
    doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
    doc.setFontSize(PDF_FONTS.BODY);
    doc.text('No se definio agenda.', PDF_MARGINS.LEFT, currentY);
    currentY += 8;
  }

  currentY += 5;

  // ===========================================
  // REQUERIMIENTOS FUNCIONALES
  // ===========================================
  if (data.requerimientosFuncionales.length > 0) {
    const pageCheck3 = checkPageBreak(doc, currentY, 25, pageNumber);
    currentY = pageCheck3.y;
    pageNumber = pageCheck3.page;

    currentY = addSection(doc, '4. REQUERIMIENTOS FUNCIONALES', currentY);

    const reqList = data.requerimientosFuncionales.map((r) => r.descripcion);
    currentY = addBulletList(doc, reqList, currentY);

    currentY += 5;
  }

  // ===========================================
  // REQUERIMIENTOS NO FUNCIONALES
  // ===========================================
  if (data.requerimientosNoFuncionales.length > 0) {
    const pageCheck4 = checkPageBreak(doc, currentY, 25, pageNumber);
    currentY = pageCheck4.y;
    pageNumber = pageCheck4.page;

    currentY = addSection(doc, '5. REQUERIMIENTOS NO FUNCIONALES', currentY);

    const reqNFList = data.requerimientosNoFuncionales.map((r) => r.descripcion);
    currentY = addBulletList(doc, reqNFList, currentY);

    currentY += 5;
  }

  // ===========================================
  // ENTREGABLES
  // ===========================================
  if (data.entregables.length > 0) {
    const pageCheck5 = checkPageBreak(doc, currentY, 30, pageNumber);
    currentY = pageCheck5.y;
    pageNumber = pageCheck5.page;

    currentY = addSection(doc, '6. ENTREGABLES COMPROMETIDOS', currentY);

    const entregablesData = data.entregables.map((e) => [
      e.descripcion,
      e.responsable,
      formatDateForPDF(e.fechaCompromiso),
    ]);

    currentY = addTable(
      doc,
      entregablesData,
      ['Entregable', 'Responsable', 'Fecha Compromiso'],
      currentY,
      { columnWidths: [90, 50, 40], alternateRowColor: true }
    );

    currentY += 10;
  }

  // ===========================================
  // TEMAS PENDIENTES
  // ===========================================
  if (data.temasPendientes.length > 0) {
    const pageCheck6 = checkPageBreak(doc, currentY, 25, pageNumber);
    currentY = pageCheck6.y;
    pageNumber = pageCheck6.page;

    currentY = addSection(doc, '7. TEMAS PENDIENTES', currentY);

    const pendientesList = data.temasPendientes.map((t) => t.tema);
    currentY = addBulletList(doc, pendientesList, currentY);

    currentY += 5;
  }

  // ===========================================
  // REUNIONES PROGRAMADAS
  // ===========================================
  if (data.reunionesProgramadas.length > 0) {
    const pageCheck7 = checkPageBreak(doc, currentY, 30, pageNumber);
    currentY = pageCheck7.y;
    pageNumber = pageCheck7.page;

    currentY = addSection(doc, '8. PROXIMAS REUNIONES', currentY);

    const reunionesData = data.reunionesProgramadas.map((r) => [
      r.tema,
      formatDateForPDF(r.fecha),
      r.horaInicio,
    ]);

    currentY = addTable(
      doc,
      reunionesData,
      ['Tema', 'Fecha', 'Hora'],
      currentY,
      { columnWidths: [100, 50, 30], alternateRowColor: true }
    );

    currentY += 10;
  }

  // ===========================================
  // OBSERVACIONES
  // ===========================================
  if (data.observaciones) {
    const pageCheck8 = checkPageBreak(doc, currentY, 25, pageNumber);
    currentY = pageCheck8.y;
    pageNumber = pageCheck8.page;

    currentY = addSection(doc, '9. OBSERVACIONES', currentY);
    currentY = addParagraph(doc, data.observaciones, currentY);

    currentY += 5;
  }

  // ===========================================
  // FIRMAS
  // ===========================================
  const pageCheck9 = checkPageBreak(doc, currentY, 40, pageNumber);
  currentY = pageCheck9.y;
  pageNumber = pageCheck9.page;

  currentY += 10;
  currentY = addSection(doc, 'FIRMAS DE CONFORMIDAD', currentY);
  currentY += 10;

  const firmaWidth = 70;
  const firmaGap = 20;

  // Primera fila de firmas (max 2)
  const firstRow = data.asistentes.slice(0, 2);
  let firmaX = PDF_MARGINS.LEFT;

  firstRow.forEach((asistente) => {
    // Linea para firma
    doc.setDrawColor(PDF_COLORS.BORDER);
    doc.setLineWidth(0.3);
    doc.line(firmaX, currentY + 15, firmaX + firmaWidth, currentY + 15);

    // Nombre
    doc.setTextColor(PDF_COLORS.TEXT);
    doc.setFontSize(PDF_FONTS.SMALL);
    doc.setFont('helvetica', 'bold');
    doc.text(asistente.nombre, firmaX + firmaWidth / 2, currentY + 20, { align: 'center' });

    // Cargo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PDF_FONTS.TINY);
    doc.text(asistente.cargo, firmaX + firmaWidth / 2, currentY + 25, { align: 'center' });

    firmaX += firmaWidth + firmaGap;
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
 * Descarga el PDF del Acta de Reunion
 */
export async function downloadActaReunion(
  data: ActaReunionData,
  filename?: string
): Promise<void> {
  const blob = await generateActaReunion(data);

  // Nombre del archivo
  const fecha = new Date(data.fechaReunion).toISOString().split('T')[0];
  const defaultFilename = `Acta_Reunion_${data.proyectoCodigo}_${fecha}.pdf`;

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
