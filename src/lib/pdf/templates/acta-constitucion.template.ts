/**
 * Acta de Constitucion Template (Project Charter)
 *
 * Genera PDF del acta de constitucion del proyecto
 */

import type { ActaConstitucionData } from '@/features/documentos/types';
import {
  createPDFDocument,
  addHeader,
  addFooter,
  addSection,
  addParagraph,
  addBulletList,
  addTable,
  addInfoBox,
  checkPageBreak,
  formatDateForPDF,
  formatNumberForPDF,
  downloadPDF,
  getPDFBlob,
  PDF_MARGINS,
  PDF_COLORS,
  PDF_FONTS,
} from '../pdf-generator';

/**
 * Genera el PDF del Acta de Constitucion
 */
export async function generateActaConstitucion(data: ActaConstitucionData): Promise<Blob> {
  const doc = await createPDFDocument('Acta de Constitucion', 'portrait');
  const pageWidth = doc.internal.pageSize.getWidth();

  let currentY = addHeader(
    doc,
    'ACTA DE CONSTITUCION DEL PROYECTO',
    `${data.proyectoCodigo} - ${data.proyectoNombre}`
  );

  let pageNumber = 1;

  // ===========================================
  // INFORMACION GENERAL
  // ===========================================
  currentY += 5;
  currentY = addSection(doc, '1. INFORMACION GENERAL', currentY);

  // Fila de cajas de info
  const boxWidth = 55;
  const gap = 5;
  let boxX = PDF_MARGINS.LEFT;

  // Codigo
  doc.setFillColor('#E8F4FD');
  doc.roundedRect(boxX, currentY, boxWidth, 15, 2, 2, 'F');
  doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
  doc.setFontSize(PDF_FONTS.TINY);
  doc.text('Codigo del Proyecto', boxX + 3, currentY + 5);
  doc.setTextColor(PDF_COLORS.PRIMARY);
  doc.setFontSize(PDF_FONTS.BODY);
  doc.setFont('helvetica', 'bold');
  doc.text(data.proyectoCodigo, boxX + 3, currentY + 12);

  // Version
  boxX += boxWidth + gap;
  doc.setFillColor('#E8F4FD');
  doc.roundedRect(boxX, currentY, boxWidth, 15, 2, 2, 'F');
  doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
  doc.setFontSize(PDF_FONTS.TINY);
  doc.text('Version', boxX + 3, currentY + 5);
  doc.setTextColor(PDF_COLORS.PRIMARY);
  doc.setFontSize(PDF_FONTS.BODY);
  doc.setFont('helvetica', 'bold');
  doc.text(data.version, boxX + 3, currentY + 12);

  // Fecha
  boxX += boxWidth + gap;
  doc.setFillColor('#E8F4FD');
  doc.roundedRect(boxX, currentY, boxWidth, 15, 2, 2, 'F');
  doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
  doc.setFontSize(PDF_FONTS.TINY);
  doc.text('Fecha de Creacion', boxX + 3, currentY + 5);
  doc.setTextColor(PDF_COLORS.PRIMARY);
  doc.setFontSize(PDF_FONTS.BODY);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDateForPDF(data.fechaCreacion), boxX + 3, currentY + 12);

  currentY += 22;

  // Nombre del proyecto
  doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
  doc.setFontSize(PDF_FONTS.SMALL);
  doc.setFont('helvetica', 'normal');
  doc.text('Nombre del Proyecto:', PDF_MARGINS.LEFT, currentY);
  doc.setTextColor(PDF_COLORS.TEXT);
  doc.setFontSize(PDF_FONTS.BODY);
  doc.setFont('helvetica', 'bold');
  doc.text(data.proyectoNombre, PDF_MARGINS.LEFT, currentY + 6);

  currentY += 15;

  // ===========================================
  // ROLES PRINCIPALES
  // ===========================================
  const pageCheck = checkPageBreak(doc, currentY, 40, pageNumber);
  currentY = pageCheck.y;
  pageNumber = pageCheck.page;

  currentY = addSection(doc, '2. ROLES PRINCIPALES', currentY);

  const rolesData: string[][] = [];

  if (data.patrocinador) {
    rolesData.push(['Patrocinador', data.patrocinador.nombre, data.patrocinador.cargo]);
  }
  if (data.scrumMaster) {
    rolesData.push(['Scrum Master', data.scrumMaster.nombre, data.scrumMaster.cargo]);
  }
  if (data.coordinador) {
    rolesData.push(['Coordinador', data.coordinador.nombre, data.coordinador.cargo]);
  }

  currentY = addTable(
    doc,
    rolesData,
    ['Rol', 'Nombre', 'Cargo'],
    currentY,
    { columnWidths: [50, 70, 60], alternateRowColor: true }
  );

  currentY += 10;

  // ===========================================
  // JUSTIFICACION
  // ===========================================
  const pageCheck2 = checkPageBreak(doc, currentY, 30, pageNumber);
  currentY = pageCheck2.y;
  pageNumber = pageCheck2.page;

  currentY = addSection(doc, '3. JUSTIFICACION', currentY);
  currentY = addParagraph(doc, data.justificacion, currentY);

  currentY += 5;

  // ===========================================
  // OBJETIVOS
  // ===========================================
  const pageCheck3 = checkPageBreak(doc, currentY, 40, pageNumber);
  currentY = pageCheck3.y;
  pageNumber = pageCheck3.page;

  currentY = addSection(doc, '4. OBJETIVOS', currentY);

  // Objetivo general
  doc.setTextColor(PDF_COLORS.TEXT);
  doc.setFontSize(PDF_FONTS.BODY);
  doc.setFont('helvetica', 'bold');
  doc.text('Objetivo General:', PDF_MARGINS.LEFT, currentY);
  currentY += 5;
  currentY = addParagraph(doc, data.objetivoGeneral, currentY);

  // Objetivos especificos
  doc.setFont('helvetica', 'bold');
  doc.text('Objetivos Especificos:', PDF_MARGINS.LEFT, currentY);
  currentY += 5;
  currentY = addBulletList(doc, data.objetivosEspecificos, currentY);

  currentY += 5;

  // ===========================================
  // ALCANCE
  // ===========================================
  const pageCheck4 = checkPageBreak(doc, currentY, 40, pageNumber);
  currentY = pageCheck4.y;
  pageNumber = pageCheck4.page;

  currentY = addSection(doc, '5. ALCANCE', currentY);

  // Incluido
  doc.setTextColor(PDF_COLORS.SUCCESS);
  doc.setFontSize(PDF_FONTS.BODY);
  doc.setFont('helvetica', 'bold');
  doc.text('Incluido:', PDF_MARGINS.LEFT, currentY);
  currentY += 5;
  doc.setTextColor(PDF_COLORS.TEXT);
  currentY = addBulletList(doc, data.alcanceIncluido, currentY, { bulletChar: '+' });

  // Excluido
  doc.setTextColor(PDF_COLORS.DANGER);
  doc.setFont('helvetica', 'bold');
  doc.text('Excluido:', PDF_MARGINS.LEFT, currentY);
  currentY += 5;
  doc.setTextColor(PDF_COLORS.TEXT);
  currentY = addBulletList(doc, data.alcanceExcluido, currentY, { bulletChar: '-' });

  currentY += 5;

  // ===========================================
  // CRITERIOS DE EXITO
  // ===========================================
  const pageCheck5 = checkPageBreak(doc, currentY, 30, pageNumber);
  currentY = pageCheck5.y;
  pageNumber = pageCheck5.page;

  currentY = addSection(doc, '6. CRITERIOS DE EXITO', currentY);
  currentY = addBulletList(doc, data.criteriosExito, currentY);

  currentY += 5;

  // ===========================================
  // SUPUESTOS Y RESTRICCIONES
  // ===========================================
  const pageCheck6 = checkPageBreak(doc, currentY, 30, pageNumber);
  currentY = pageCheck6.y;
  pageNumber = pageCheck6.page;

  currentY = addSection(doc, '7. SUPUESTOS Y RESTRICCIONES', currentY);

  if (data.supuestos.length > 0) {
    doc.setTextColor(PDF_COLORS.TEXT);
    doc.setFont('helvetica', 'bold');
    doc.text('Supuestos:', PDF_MARGINS.LEFT, currentY);
    currentY += 5;
    currentY = addBulletList(doc, data.supuestos, currentY);
  }

  if (data.restricciones.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Restricciones:', PDF_MARGINS.LEFT, currentY);
    currentY += 5;
    currentY = addBulletList(doc, data.restricciones, currentY);
  }

  currentY += 5;

  // ===========================================
  // RIESGOS IDENTIFICADOS
  // ===========================================
  if (data.riesgosIdentificados.length > 0) {
    const pageCheck7 = checkPageBreak(doc, currentY, 30, pageNumber);
    currentY = pageCheck7.y;
    pageNumber = pageCheck7.page;

    currentY = addSection(doc, '8. RIESGOS IDENTIFICADOS', currentY);

    const riesgosData = data.riesgosIdentificados.map((r) => [
      r.descripcion,
      r.probabilidad,
      r.impacto,
    ]);

    currentY = addTable(
      doc,
      riesgosData,
      ['Descripcion', 'Probabilidad', 'Impacto'],
      currentY,
      { columnWidths: [110, 35, 35], alternateRowColor: true }
    );

    currentY += 10;
  }

  // ===========================================
  // EQUIPO INICIAL
  // ===========================================
  if (data.equipoInicial.length > 0) {
    const pageCheck8 = checkPageBreak(doc, currentY, 30, pageNumber);
    currentY = pageCheck8.y;
    pageNumber = pageCheck8.page;

    currentY = addSection(doc, '9. EQUIPO INICIAL', currentY);

    const equipoData = data.equipoInicial.map((e) => [
      e.nombre,
      e.rol,
      e.dedicacion,
    ]);

    currentY = addTable(
      doc,
      equipoData,
      ['Nombre', 'Rol', 'Dedicacion'],
      currentY,
      { columnWidths: [80, 60, 40], alternateRowColor: true }
    );

    currentY += 10;
  }

  // ===========================================
  // CRONOGRAMA
  // ===========================================
  const pageCheck9 = checkPageBreak(doc, currentY, 40, pageNumber);
  currentY = pageCheck9.y;
  pageNumber = pageCheck9.page;

  currentY = addSection(doc, '10. CRONOGRAMA', currentY);

  // Fechas
  doc.setTextColor(PDF_COLORS.TEXT);
  doc.setFontSize(PDF_FONTS.BODY);
  doc.text(
    `Fecha de Inicio Estimada: ${formatDateForPDF(data.fechaInicioEstimada)}`,
    PDF_MARGINS.LEFT,
    currentY
  );
  currentY += 6;
  doc.text(
    `Fecha de Fin Estimada: ${formatDateForPDF(data.fechaFinEstimada)}`,
    PDF_MARGINS.LEFT,
    currentY
  );
  currentY += 10;

  // Hitos
  if (data.hitos.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Hitos Principales:', PDF_MARGINS.LEFT, currentY);
    currentY += 5;

    const hitosData = data.hitos.map((h) => [
      h.nombre,
      formatDateForPDF(h.fechaEstimada),
    ]);

    currentY = addTable(
      doc,
      hitosData,
      ['Hito', 'Fecha Estimada'],
      currentY,
      { columnWidths: [120, 60], alternateRowColor: true }
    );
  }

  currentY += 10;

  // ===========================================
  // PRESUPUESTO
  // ===========================================
  if (data.presupuestoEstimado) {
    const pageCheck10 = checkPageBreak(doc, currentY, 20, pageNumber);
    currentY = pageCheck10.y;
    pageNumber = pageCheck10.page;

    currentY = addSection(doc, '11. PRESUPUESTO', currentY);
    doc.setTextColor(PDF_COLORS.TEXT);
    doc.setFontSize(PDF_FONTS.BODY);
    doc.text(
      `Presupuesto Estimado: S/ ${formatNumberForPDF(data.presupuestoEstimado)}`,
      PDF_MARGINS.LEFT,
      currentY
    );
    currentY += 15;
  }

  // ===========================================
  // FIRMAS
  // ===========================================
  const pageCheck11 = checkPageBreak(doc, currentY, 50, pageNumber);
  currentY = pageCheck11.y;
  pageNumber = pageCheck11.page;

  currentY = addSection(doc, 'APROBACIONES', currentY);
  currentY += 5;

  const firmaWidth = 50;
  const firmaGap = 15;
  let firmaX = PDF_MARGINS.LEFT;

  // Funcion para agregar caja de firma
  const addFirmaBox = (rol: string, nombre: string, cargo: string) => {
    doc.setDrawColor(PDF_COLORS.BORDER);
    doc.setLineWidth(0.3);

    // Linea para firma
    doc.line(firmaX, currentY + 15, firmaX + firmaWidth, currentY + 15);

    // Nombre
    doc.setTextColor(PDF_COLORS.TEXT);
    doc.setFontSize(PDF_FONTS.SMALL);
    doc.setFont('helvetica', 'bold');
    doc.text(nombre, firmaX + firmaWidth / 2, currentY + 20, { align: 'center' });

    // Cargo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PDF_FONTS.TINY);
    doc.text(cargo, firmaX + firmaWidth / 2, currentY + 25, { align: 'center' });

    // Rol
    doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
    doc.text(rol, firmaX + firmaWidth / 2, currentY + 30, { align: 'center' });
  };

  if (data.patrocinador) {
    addFirmaBox('Patrocinador', data.patrocinador.nombre, data.patrocinador.cargo);
    firmaX += firmaWidth + firmaGap;
  }

  if (data.coordinador) {
    addFirmaBox('Coordinador', data.coordinador.nombre, data.coordinador.cargo);
    firmaX += firmaWidth + firmaGap;
  }

  if (data.scrumMaster) {
    addFirmaBox('Scrum Master', data.scrumMaster.nombre, data.scrumMaster.cargo);
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
 * Descarga el PDF del Acta de Constitucion
 */
export async function downloadActaConstitucion(
  data: ActaConstitucionData,
  filename?: string
): Promise<void> {
  const doc = await createPDFDocument('Acta de Constitucion', 'portrait');

  // Generar contenido
  const blob = await generateActaConstitucion(data);

  // Nombre del archivo
  const defaultFilename = `Acta_Constitucion_${data.proyectoCodigo}_${new Date().toISOString().split('T')[0]}.pdf`;

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
