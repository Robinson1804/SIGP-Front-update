'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { exportDashboardPDF, exportDashboardExcel } from '../services/dashboard.service';
import type { DashboardFiltros } from '../types';

interface ExportDashboardButtonProps {
  filtros?: DashboardFiltros;
  className?: string;
}

/**
 * Botón de exportación del dashboard
 *
 * Permite exportar a PDF o Excel
 */
export function ExportDashboardButton({
  filtros,
  className,
}: ExportDashboardButtonProps) {
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'excel' | null>(null);

  const handleExportPDF = async () => {
    setLoading(true);
    setExportType('pdf');

    try {
      const blob = await exportDashboardPDF(filtros);

      // Crear URL y descargar
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      alert('Error al exportar el dashboard a PDF');
    } finally {
      setLoading(false);
      setExportType(null);
    }
  };

  const handleExportExcel = async () => {
    setLoading(true);
    setExportType('excel');

    try {
      const blob = await exportDashboardExcel(filtros);

      // Crear URL y descargar
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      alert('Error al exportar el dashboard a Excel');
    } finally {
      setLoading(false);
      setExportType(null);
    }
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          className={className}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {loading
            ? exportType === 'pdf'
              ? 'Exportando PDF...'
              : 'Exportando Excel...'
            : 'Exportar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportPDF} disabled={loading}>
          <FileText className="w-4 h-4 mr-2" />
          Exportar como PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportExcel} disabled={loading}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Exportar como Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
