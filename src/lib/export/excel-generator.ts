/**
 * Excel Generator
 *
 * Utilidades para generar documentos Excel usando xlsx
 */

import * as XLSX from 'xlsx';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExcelSheetData {
  name: string;
  columns: ExcelColumn[];
  data: Record<string, any>[];
}

export interface ExcelOptions {
  filename: string;
  sheets: ExcelSheetData[];
  author?: string;
}

/**
 * Crear workbook de Excel con múltiples hojas
 */
export function createExcelWorkbook(options: ExcelOptions): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  // Propiedades del documento
  workbook.Props = {
    Title: options.filename,
    Author: options.author || 'SIGP',
    CreatedDate: new Date(),
  };

  // Crear cada hoja
  options.sheets.forEach((sheetData) => {
    const worksheet = createWorksheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetData.name);
  });

  return workbook;
}

/**
 * Crear hoja de Excel
 */
function createWorksheet(sheetData: ExcelSheetData): XLSX.WorkSheet {
  const { columns, data } = sheetData;

  // Preparar headers
  const headers = columns.map((col) => col.header);

  // Preparar filas de datos
  const rows = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key];
      // Formatear fechas
      if (value instanceof Date) {
        return value.toLocaleDateString('es-PE');
      }
      return value ?? '';
    })
  );

  // Crear worksheet con headers y datos
  const worksheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Configurar anchos de columna
  worksheet['!cols'] = columns.map((col) => ({
    wch: col.width || 15,
  }));

  return worksheet;
}

/**
 * Descargar Excel
 */
export function downloadExcel(workbook: XLSX.WorkBook, filename: string): void {
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Obtener Excel como Blob
 */
export function getExcelBlob(workbook: XLSX.WorkBook): Blob {
  const excelBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Crear Excel simple de una tabla
 */
export function createSimpleExcel(
  data: Record<string, any>[],
  columns: ExcelColumn[],
  filename: string
): void {
  const workbook = createExcelWorkbook({
    filename,
    sheets: [
      {
        name: 'Datos',
        columns,
        data,
      },
    ],
  });

  downloadExcel(workbook, filename);
}

/**
 * Exportar a CSV
 */
export function exportToCSV(
  data: Record<string, any>[],
  columns: ExcelColumn[],
  filename: string
): void {
  const headers = columns.map((col) => col.header).join(',');
  const rows = data
    .map((row) =>
      columns
        .map((col) => {
          const value = row[col.key];
          // Escapar comillas y envolver en comillas si contiene coma
          const stringValue = String(value ?? '').replace(/"/g, '""');
          return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
        })
        .join(',')
    )
    .join('\n');

  const csvContent = `${headers}\n${rows}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}
