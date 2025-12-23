/**
 * Acta de Daily Meeting Template
 *
 * Genera PDF del acta de daily meeting con la tabla de las 3 preguntas Scrum
 */

import type { Acta } from '@/features/documentos/types';
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
 * Datos para el PDF de Daily Meeting
 */
export interface ActaDailyData {
  codigo: string;
  nombre: string;
  proyectoNombre: string;
  proyectoCodigo: string;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  duracionMinutos?: number;
  sprintNombre?: string;
  participantes: {
    nombre: string;
    cargo?: string;
    ayer: string;
    hoy: string;
    impedimentos: string;
  }[];
  impedimentosGenerales?: string[];
  notasAdicionales?: string;
  observaciones?: string;
}

/**
 * Convierte un Acta a ActaDailyData
 */
export function actaToActaDailyData(
  acta: Acta,
  proyectoNombre: string,
  proyectoCodigo: string
): ActaDailyData {
  return {
    codigo: acta.codigo,
    nombre: acta.nombre,
    proyectoNombre,
    proyectoCodigo,
    fecha: acta.fecha,
    horaInicio: acta.horaInicio || undefined,
    horaFin: acta.horaFin || undefined,
    duracionMinutos: acta.duracionMinutos || undefined,
    sprintNombre: acta.sprintNombre || undefined,
    participantes: (acta.participantesDaily || []).map((p) => ({
      nombre: p.nombre,
      cargo: p.cargo,
      ayer: p.ayer,
      hoy: p.hoy,
      impedimentos: p.impedimentos,
    })),
    impedimentosGenerales: acta.impedimentosGenerales || undefined,
    notasAdicionales: acta.notasAdicionales || undefined,
    observaciones: acta.observaciones || undefined,
  };
}

/**
 * Genera el PDF del Acta de Daily Meeting
 */
export async function generateActaDaily(data: ActaDailyData): Promise<Blob> {
  const doc = await createPDFDocument('Acta de Daily Meeting', 'landscape');
  const pageWidth = doc.internal.pageSize.getWidth();

  let currentY = addHeader(
    doc,
    'ACTA DE DAILY MEETING',
    `${data.proyectoCodigo} - ${data.proyectoNombre}`
  );

  let pageNumber = 1;

  // ===========================================
  // INFORMACION DEL DAILY
  // ===========================================
  currentY += 5;
  currentY = addSection(doc, '1. INFORMACION DEL DAILY MEETING', currentY);

  // Caja de informacion
  const boxHeight = 25;
  doc.setFillColor('#F8FAFC');
  doc.setDrawColor(PDF_COLORS.BORDER);
  doc.roundedRect(PDF_MARGINS.LEFT, currentY, pageWidth - (PDF_MARGINS.LEFT * 2), boxHeight, 3, 3, 'FD');

  const col1X = PDF_MARGINS.LEFT + 5;
  const col2X = PDF_MARGINS.LEFT + 80;
  const col3X = PDF_MARGINS.LEFT + 150;
  const col4X = PDF_MARGINS.LEFT + 220;
  let infoY = currentY + 8;

  // Columna 1 - Fecha
  doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
  doc.setFontSize(PDF_FONTS.TINY);
  doc.setFont('helvetica', 'normal');
  doc.text('Fecha:', col1X, infoY);
  doc.setTextColor(PDF_COLORS.TEXT);
  doc.setFontSize(PDF_FONTS.BODY);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDateForPDF(data.fecha), col1X + 20, infoY);

  // Columna 2 - Hora
  doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
  doc.setFontSize(PDF_FONTS.TINY);
  doc.setFont('helvetica', 'normal');
  doc.text('Horario:', col2X, infoY);
  doc.setTextColor(PDF_COLORS.TEXT);
  doc.setFontSize(PDF_FONTS.BODY);
  doc.setFont('helvetica', 'bold');
  const horario = data.horaInicio && data.horaFin
    ? `${data.horaInicio} - ${data.horaFin}`
    : '-';
  doc.text(horario, col2X + 25, infoY);

  // Columna 3 - Duracion
  doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
  doc.setFontSize(PDF_FONTS.TINY);
  doc.setFont('helvetica', 'normal');
  doc.text('Duracion:', col3X, infoY);
  doc.setTextColor(PDF_COLORS.TEXT);
  doc.setFontSize(PDF_FONTS.BODY);
  doc.setFont('helvetica', 'bold');
  doc.text(data.duracionMinutos ? `${data.duracionMinutos} min` : '-', col3X + 25, infoY);

  // Columna 4 - Sprint
  if (data.sprintNombre) {
    doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
    doc.setFontSize(PDF_FONTS.TINY);
    doc.setFont('helvetica', 'normal');
    doc.text('Sprint:', col4X, infoY);
    doc.setTextColor(PDF_COLORS.TEXT);
    doc.setFontSize(PDF_FONTS.BODY);
    doc.setFont('helvetica', 'bold');
    doc.text(data.sprintNombre, col4X + 20, infoY);
  }

  // Segunda linea - Participantes
  infoY += 10;
  doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
  doc.setFontSize(PDF_FONTS.TINY);
  doc.setFont('helvetica', 'normal');
  doc.text('Participantes:', col1X, infoY);
  doc.setTextColor(PDF_COLORS.TEXT);
  doc.setFontSize(PDF_FONTS.BODY);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.participantes.length} personas`, col1X + 35, infoY);

  currentY += boxHeight + 10;

  // ===========================================
  // TABLA DE PARTICIPANTES CON LAS 3 PREGUNTAS
  // ===========================================
  const pageCheck1 = checkPageBreak(doc, currentY, 60, pageNumber);
  currentY = pageCheck1.y;
  pageNumber = pageCheck1.page;

  currentY = addSection(doc, '2. REPORTE DEL EQUIPO', currentY);

  if (data.participantes.length > 0) {
    // Encabezados de la tabla
    const headers = [
      'Participante',
      '¿Que hizo ayer?',
      '¿Que hara hoy?',
      'Impedimentos',
    ];

    // Datos de la tabla
    const tableData = data.participantes.map((p) => [
      p.nombre + (p.cargo ? `\n(${p.cargo})` : ''),
      p.ayer || '-',
      p.hoy || '-',
      p.impedimentos || 'Sin impedimentos',
    ]);

    // Configuracion de columnas (landscape tiene mas espacio)
    const colWidths = [45, 70, 70, 70];

    currentY = addTable(
      doc,
      tableData,
      headers,
      currentY,
      { columnWidths: colWidths, alternateRowColor: true }
    );

    currentY += 10;
  } else {
    doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
    doc.setFontSize(PDF_FONTS.BODY);
    doc.text('No se registraron participantes.', PDF_MARGINS.LEFT, currentY);
    currentY += 8;
  }

  // ===========================================
  // RESUMEN DE IMPEDIMENTOS
  // ===========================================
  // Contar impedimentos reportados
  const participantesConImpedimentos = data.participantes.filter(
    (p) => p.impedimentos && p.impedimentos.trim() !== '' && p.impedimentos !== 'Sin impedimentos'
  );

  if (participantesConImpedimentos.length > 0) {
    const pageCheck2 = checkPageBreak(doc, currentY, 30, pageNumber);
    currentY = pageCheck2.y;
    pageNumber = pageCheck2.page;

    currentY = addSection(doc, '3. RESUMEN DE IMPEDIMENTOS', currentY);

    const impedimentosList = participantesConImpedimentos.map(
      (p) => `${p.nombre}: ${p.impedimentos}`
    );
    currentY = addBulletList(doc, impedimentosList, currentY);

    currentY += 5;
  }

  // ===========================================
  // IMPEDIMENTOS GENERALES
  // ===========================================
  if (data.impedimentosGenerales && data.impedimentosGenerales.length > 0) {
    const pageCheck3 = checkPageBreak(doc, currentY, 25, pageNumber);
    currentY = pageCheck3.y;
    pageNumber = pageCheck3.page;

    const sectionNum = participantesConImpedimentos.length > 0 ? '4' : '3';
    currentY = addSection(doc, `${sectionNum}. IMPEDIMENTOS GENERALES DEL EQUIPO`, currentY);

    currentY = addBulletList(doc, data.impedimentosGenerales, currentY);

    currentY += 5;
  }

  // ===========================================
  // NOTAS ADICIONALES
  // ===========================================
  if (data.notasAdicionales) {
    const pageCheck4 = checkPageBreak(doc, currentY, 25, pageNumber);
    currentY = pageCheck4.y;
    pageNumber = pageCheck4.page;

    currentY = addSection(doc, 'NOTAS DEL FACILITADOR', currentY);
    currentY = addParagraph(doc, data.notasAdicionales, currentY);

    currentY += 5;
  }

  // ===========================================
  // OBSERVACIONES
  // ===========================================
  if (data.observaciones) {
    const pageCheck5 = checkPageBreak(doc, currentY, 25, pageNumber);
    currentY = pageCheck5.y;
    pageNumber = pageCheck5.page;

    currentY = addSection(doc, 'OBSERVACIONES', currentY);
    currentY = addParagraph(doc, data.observaciones, currentY);

    currentY += 5;
  }

  // ===========================================
  // PIE DE PAGINA
  // ===========================================
  const pageCheck6 = checkPageBreak(doc, currentY, 30, pageNumber);
  currentY = pageCheck6.y;
  pageNumber = pageCheck6.page;

  currentY += 10;

  // Linea de cierre
  doc.setDrawColor(PDF_COLORS.BORDER);
  doc.setLineWidth(0.5);
  doc.line(PDF_MARGINS.LEFT, currentY, pageWidth - PDF_MARGINS.LEFT, currentY);

  currentY += 10;

  // Texto de generacion
  doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
  doc.setFontSize(PDF_FONTS.TINY);
  doc.setFont('helvetica', 'italic');
  doc.text(
    `Documento generado el ${new Date().toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`,
    PDF_MARGINS.LEFT,
    currentY
  );

  // Agregar footer a todas las paginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i);
  }

  return getPDFBlob(doc);
}

/**
 * Descarga el PDF del Acta de Daily Meeting
 */
export async function downloadActaDaily(
  data: ActaDailyData,
  filename?: string
): Promise<void> {
  const blob = await generateActaDaily(data);

  // Nombre del archivo
  const fecha = new Date(data.fecha).toISOString().split('T')[0];
  const defaultFilename = `Acta_Daily_${data.proyectoCodigo}_${fecha}.pdf`;

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
