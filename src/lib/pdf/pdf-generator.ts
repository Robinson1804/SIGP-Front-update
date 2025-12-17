/**
 * PDF Generator Utilities
 *
 * Utilidades genericas para generacion de documentos PDF
 * Usa jsPDF con importacion dinamica para evitar problemas de SSR
 */

import type { jsPDF } from 'jspdf';

// Colores institucionales INEI
export const PDF_COLORS = {
  PRIMARY: '#004272',      // Azul INEI
  SECONDARY: '#018CD1',    // Azul claro
  ACCENT: '#1A5581',       // Azul medio
  TEXT: '#333333',         // Texto principal
  TEXT_LIGHT: '#666666',   // Texto secundario
  BORDER: '#CCCCCC',       // Bordes
  HEADER_BG: '#004272',    // Fondo header
  ROW_ALT: '#F5F5F5',      // Fila alternada
  SUCCESS: '#006B1A',      // Verde
  WARNING: '#A67C00',      // Amarillo
  DANGER: '#A90000',       // Rojo
} as const;

// Configuracion de fuentes
export const PDF_FONTS = {
  TITLE: 16,
  SUBTITLE: 14,
  HEADING: 12,
  BODY: 10,
  SMALL: 8,
  TINY: 7,
} as const;

// Margenes del documento
export const PDF_MARGINS = {
  TOP: 20,
  BOTTOM: 20,
  LEFT: 15,
  RIGHT: 15,
} as const;

/**
 * Carga dinamica de jsPDF para evitar problemas de SSR
 */
export async function loadJsPDF(): Promise<typeof jsPDF> {
  const { jsPDF } = await import('jspdf');
  return jsPDF;
}

/**
 * Crea un nuevo documento PDF
 */
export async function createPDFDocument(
  title: string,
  orientation: 'portrait' | 'landscape' = 'portrait'
): Promise<jsPDF> {
  const jsPDF = await loadJsPDF();

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  // Metadata del documento
  doc.setProperties({
    title,
    subject: 'SIGP - Sistema Integral de Gestion de Proyectos',
    author: 'INEI',
    creator: 'SIGP Frontend',
  });

  return doc;
}

/**
 * Agrega encabezado al documento
 */
export function addHeader(
  doc: jsPDF,
  title: string,
  subtitle?: string,
  logoPath?: string
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = PDF_MARGINS.TOP;

  // Fondo del header
  doc.setFillColor(PDF_COLORS.PRIMARY);
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Logo placeholder (si se proporciona)
  if (logoPath) {
    // TODO: Agregar logo cuando este disponible
    // doc.addImage(logoPath, 'PNG', PDF_MARGINS.LEFT, 5, 25, 25);
  }

  // Titulo principal
  doc.setTextColor('#FFFFFF');
  doc.setFontSize(PDF_FONTS.TITLE);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), pageWidth / 2, 15, { align: 'center' });

  // Subtitulo
  if (subtitle) {
    doc.setFontSize(PDF_FONTS.BODY);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, pageWidth / 2, 23, { align: 'center' });
  }

  // Linea decorativa
  doc.setDrawColor(PDF_COLORS.SECONDARY);
  doc.setLineWidth(0.5);
  doc.line(PDF_MARGINS.LEFT, 30, pageWidth - PDF_MARGINS.RIGHT, 30);

  // Fecha de generacion
  doc.setTextColor('#FFFFFF');
  doc.setFontSize(PDF_FONTS.TINY);
  const fecha = new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Generado: ${fecha}`, pageWidth - PDF_MARGINS.RIGHT, 7, { align: 'right' });

  return 40; // Retorna la posicion Y despues del header
}

/**
 * Agrega pie de pagina
 */
export function addFooter(doc: jsPDF, pageNumber: number): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Linea separadora
  doc.setDrawColor(PDF_COLORS.BORDER);
  doc.setLineWidth(0.3);
  doc.line(PDF_MARGINS.LEFT, pageHeight - 15, pageWidth - PDF_MARGINS.RIGHT, pageHeight - 15);

  // Texto institucional
  doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
  doc.setFontSize(PDF_FONTS.TINY);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'INEI - Sistema Integral de Gestion de Proyectos (SIGP)',
    PDF_MARGINS.LEFT,
    pageHeight - 10
  );

  // Numero de pagina
  doc.text(
    `Pagina ${pageNumber}`,
    pageWidth - PDF_MARGINS.RIGHT,
    pageHeight - 10,
    { align: 'right' }
  );
}

/**
 * Agrega una tabla al documento
 */
export function addTable(
  doc: jsPDF,
  data: string[][],
  headers: string[],
  startY: number,
  options?: {
    columnWidths?: number[];
    headerColor?: string;
    alternateRowColor?: boolean;
  }
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const tableWidth = pageWidth - PDF_MARGINS.LEFT - PDF_MARGINS.RIGHT;
  const columnCount = headers.length;

  // Anchos de columna por defecto
  const columnWidths = options?.columnWidths ||
    Array(columnCount).fill(tableWidth / columnCount);

  const rowHeight = 8;
  const cellPadding = 2;
  let currentY = startY;

  // Header de tabla
  doc.setFillColor(options?.headerColor || PDF_COLORS.PRIMARY);
  doc.rect(PDF_MARGINS.LEFT, currentY, tableWidth, rowHeight, 'F');

  doc.setTextColor('#FFFFFF');
  doc.setFontSize(PDF_FONTS.SMALL);
  doc.setFont('helvetica', 'bold');

  let currentX = PDF_MARGINS.LEFT;
  headers.forEach((header, index) => {
    doc.text(header, currentX + cellPadding, currentY + 5.5);
    currentX += columnWidths[index];
  });

  currentY += rowHeight;

  // Filas de datos
  doc.setTextColor(PDF_COLORS.TEXT);
  doc.setFont('helvetica', 'normal');

  data.forEach((row, rowIndex) => {
    // Color de fila alternada
    if (options?.alternateRowColor && rowIndex % 2 === 1) {
      doc.setFillColor(PDF_COLORS.ROW_ALT);
      doc.rect(PDF_MARGINS.LEFT, currentY, tableWidth, rowHeight, 'F');
    }

    // Borde de fila
    doc.setDrawColor(PDF_COLORS.BORDER);
    doc.setLineWidth(0.1);
    doc.rect(PDF_MARGINS.LEFT, currentY, tableWidth, rowHeight);

    // Celdas
    currentX = PDF_MARGINS.LEFT;
    row.forEach((cell, cellIndex) => {
      // Truncar texto si es muy largo
      const maxWidth = columnWidths[cellIndex] - (cellPadding * 2);
      const truncatedText = truncateText(doc, cell || '', maxWidth);
      doc.text(truncatedText, currentX + cellPadding, currentY + 5.5);
      currentX += columnWidths[cellIndex];
    });

    currentY += rowHeight;
  });

  return currentY;
}

/**
 * Agrega una seccion con titulo
 */
export function addSection(
  doc: jsPDF,
  title: string,
  startY: number,
  options?: {
    underline?: boolean;
    color?: string;
  }
): number {
  doc.setTextColor(options?.color || PDF_COLORS.PRIMARY);
  doc.setFontSize(PDF_FONTS.HEADING);
  doc.setFont('helvetica', 'bold');
  doc.text(title, PDF_MARGINS.LEFT, startY);

  if (options?.underline !== false) {
    const textWidth = doc.getTextWidth(title);
    doc.setDrawColor(PDF_COLORS.SECONDARY);
    doc.setLineWidth(0.5);
    doc.line(PDF_MARGINS.LEFT, startY + 1, PDF_MARGINS.LEFT + textWidth, startY + 1);
  }

  return startY + 8;
}

/**
 * Agrega parrafo de texto
 */
export function addParagraph(
  doc: jsPDF,
  text: string,
  startY: number,
  options?: {
    maxWidth?: number;
    fontSize?: number;
    color?: string;
    bold?: boolean;
  }
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = options?.maxWidth || (pageWidth - PDF_MARGINS.LEFT - PDF_MARGINS.RIGHT);

  doc.setTextColor(options?.color || PDF_COLORS.TEXT);
  doc.setFontSize(options?.fontSize || PDF_FONTS.BODY);
  doc.setFont('helvetica', options?.bold ? 'bold' : 'normal');

  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, PDF_MARGINS.LEFT, startY);

  const lineHeight = (options?.fontSize || PDF_FONTS.BODY) * 0.5;
  return startY + (lines.length * lineHeight) + 4;
}

/**
 * Agrega lista con viñetas
 */
export function addBulletList(
  doc: jsPDF,
  items: string[],
  startY: number,
  options?: {
    bulletChar?: string;
    indent?: number;
  }
): number {
  const bulletChar = options?.bulletChar || '•';
  const indent = options?.indent || 5;
  let currentY = startY;

  doc.setTextColor(PDF_COLORS.TEXT);
  doc.setFontSize(PDF_FONTS.BODY);
  doc.setFont('helvetica', 'normal');

  items.forEach((item) => {
    doc.text(bulletChar, PDF_MARGINS.LEFT, currentY);
    doc.text(item, PDF_MARGINS.LEFT + indent, currentY);
    currentY += 6;
  });

  return currentY;
}

/**
 * Agrega caja de informacion
 */
export function addInfoBox(
  doc: jsPDF,
  label: string,
  value: string,
  startY: number,
  width?: number
): number {
  const boxWidth = width || 60;
  const boxHeight = 12;

  // Fondo de la caja
  doc.setFillColor('#F0F0F0');
  doc.roundedRect(PDF_MARGINS.LEFT, startY, boxWidth, boxHeight, 2, 2, 'F');

  // Label
  doc.setTextColor(PDF_COLORS.TEXT_LIGHT);
  doc.setFontSize(PDF_FONTS.TINY);
  doc.setFont('helvetica', 'normal');
  doc.text(label, PDF_MARGINS.LEFT + 3, startY + 4);

  // Value
  doc.setTextColor(PDF_COLORS.TEXT);
  doc.setFontSize(PDF_FONTS.BODY);
  doc.setFont('helvetica', 'bold');
  doc.text(value, PDF_MARGINS.LEFT + 3, startY + 10);

  return startY + boxHeight + 4;
}

/**
 * Verifica si hay espacio en la pagina, si no, agrega nueva pagina
 */
export function checkPageBreak(
  doc: jsPDF,
  currentY: number,
  requiredSpace: number,
  pageNumber: number
): { y: number; page: number } {
  const pageHeight = doc.internal.pageSize.getHeight();
  const availableSpace = pageHeight - PDF_MARGINS.BOTTOM - currentY;

  if (availableSpace < requiredSpace) {
    addFooter(doc, pageNumber);
    doc.addPage();
    return { y: PDF_MARGINS.TOP + 10, page: pageNumber + 1 };
  }

  return { y: currentY, page: pageNumber };
}

/**
 * Trunca texto si excede el ancho maximo
 */
function truncateText(doc: jsPDF, text: string, maxWidth: number): string {
  const ellipsis = '...';
  let truncated = text;

  while (doc.getTextWidth(truncated) > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }

  if (truncated !== text) {
    truncated = truncated.slice(0, -3) + ellipsis;
  }

  return truncated;
}

/**
 * Formatea fecha para mostrar en PDF
 */
export function formatDateForPDF(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formatea numero con separador de miles
 */
export function formatNumberForPDF(value: number): string {
  return value.toLocaleString('es-PE');
}

/**
 * Formatea porcentaje
 */
export function formatPercentForPDF(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Descarga el documento PDF
 */
export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename);
}

/**
 * Obtiene el PDF como Blob
 */
export function getPDFBlob(doc: jsPDF): Blob {
  return doc.output('blob');
}

/**
 * Obtiene el PDF como base64
 */
export function getPDFBase64(doc: jsPDF): string {
  return doc.output('datauristring');
}
