/**
 * PDF Generator
 *
 * Utilidades para generar documentos PDF usando jsPDF
 */

import jsPDF from 'jspdf';

export interface PDFOptions {
  title: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'letter';
}

export interface PDFTableColumn {
  header: string;
  dataKey: string;
  width?: number;
}

export interface PDFTableOptions {
  columns: PDFTableColumn[];
  data: Record<string, any>[];
  startY?: number;
}

// Colores INEI
const COLORS = {
  primary: '#004272',
  secondary: '#6b7280',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  text: '#1f2937',
  lightGray: '#f3f4f6',
};

/**
 * Crear documento PDF base con encabezado SIGP
 */
export function createPDFDocument(options: PDFOptions): jsPDF {
  const doc = new jsPDF({
    orientation: options.orientation || 'portrait',
    unit: 'mm',
    format: options.pageSize || 'a4',
  });

  // Configurar fuente
  doc.setFont('helvetica');

  // Header
  doc.setFillColor(COLORS.primary);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 25, 'F');

  // Título
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(options.title, 15, 12);

  // Subtítulo
  if (options.subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(options.subtitle, 15, 19);
  }

  // Fecha
  doc.setFontSize(8);
  doc.text(
    `Generado: ${new Date().toLocaleDateString('es-PE')}`,
    doc.internal.pageSize.getWidth() - 50,
    19
  );

  // Reset color para contenido
  doc.setTextColor(COLORS.text);

  return doc;
}

/**
 * Agregar tabla al PDF
 */
export function addTableToPDF(
  doc: jsPDF,
  options: PDFTableOptions
): void {
  const { columns, data, startY = 35 } = options;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const tableWidth = pageWidth - margin * 2;
  const colWidth = tableWidth / columns.length;

  let currentY = startY;

  // Header de tabla
  doc.setFillColor(COLORS.lightGray);
  doc.rect(margin, currentY, tableWidth, 8, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.text);

  columns.forEach((col, index) => {
    doc.text(col.header, margin + index * colWidth + 2, currentY + 5);
  });

  currentY += 10;

  // Filas de datos
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  data.forEach((row, rowIndex) => {
    // Nueva página si necesario
    if (currentY > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      currentY = 20;
    }

    // Alternar colores de fila
    if (rowIndex % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, currentY - 2, tableWidth, 7, 'F');
    }

    columns.forEach((col, colIndex) => {
      const value = String(row[col.dataKey] ?? '');
      doc.text(value.substring(0, 30), margin + colIndex * colWidth + 2, currentY + 3);
    });

    currentY += 7;
  });
}

/**
 * Agregar sección con título
 */
export function addSectionToPDF(
  doc: jsPDF,
  title: string,
  content: string,
  startY: number
): number {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary);
  doc.text(title, 15, startY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.text);

  const lines = doc.splitTextToSize(content, doc.internal.pageSize.getWidth() - 30);
  doc.text(lines, 15, startY + 7);

  return startY + 7 + lines.length * 5;
}

/**
 * Agregar footer a todas las páginas
 */
export function addFooterToPDF(doc: jsPDF): void {
  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(COLORS.secondary);
    doc.text(
      `SIGP - Sistema Integrado de Gestión de Proyectos | Página ${i} de ${totalPages}`,
      15,
      doc.internal.pageSize.getHeight() - 10
    );
  }
}

/**
 * Descargar PDF
 */
export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(`${filename}.pdf`);
}

/**
 * Obtener PDF como Blob
 */
export function getPDFBlob(doc: jsPDF): Blob {
  return doc.output('blob');
}
