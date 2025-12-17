"use client";

import React, { useState, useCallback } from 'react';
import { Download, Loader2, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from '@/lib/hooks/use-toast';
import type {
  ActaConstitucionData,
  ActaReunionData,
  InformeSprintData,
  InformeActividadData,
} from '@/features/documentos/types';

/**
 * Tipos de templates disponibles
 */
export type PDFTemplateType =
  | 'acta-constitucion'
  | 'acta-reunion'
  | 'informe-sprint'
  | 'informe-actividad';

/**
 * Union de todos los tipos de datos posibles
 */
export type PDFTemplateData =
  | ActaConstitucionData
  | ActaReunionData
  | InformeSprintData
  | InformeActividadData;

/**
 * Props del componente
 */
export interface PDFDownloadButtonProps {
  /** Tipo de template a generar */
  template: PDFTemplateType;
  /** Datos para generar el PDF */
  data: PDFTemplateData;
  /** Nombre del archivo a descargar */
  filename?: string;
  /** Deshabilitado */
  disabled?: boolean;
  /** Clase CSS adicional */
  className?: string;
  /** Variante del boton */
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  /** Tamano del boton */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Mostrar solo icono */
  iconOnly?: boolean;
  /** Texto personalizado */
  label?: string;
  /** Callback al completar descarga */
  onDownloadComplete?: () => void;
  /** Callback en caso de error */
  onError?: (error: Error) => void;
}

/**
 * Componente para descargar PDFs generados
 *
 * Usa importacion dinamica de jsPDF para evitar problemas de SSR
 */
export function PDFDownloadButton({
  template,
  data,
  filename,
  disabled = false,
  className = '',
  variant = 'outline',
  size = 'default',
  iconOnly = false,
  label,
  onDownloadComplete,
  onError,
}: PDFDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Genera y descarga el PDF
   */
  const handleDownload = useCallback(async () => {
    if (isGenerating || disabled) return;

    setIsGenerating(true);

    try {
      // Importar dinamicamente el template correspondiente
      let generateFn: (data: any) => Promise<Blob>;
      let downloadFn: (data: any, filename?: string) => Promise<void>;

      switch (template) {
        case 'acta-constitucion': {
          const { generateActaConstitucion, downloadActaConstitucion } =
            await import('@/lib/pdf/templates/acta-constitucion.template');
          generateFn = generateActaConstitucion;
          downloadFn = downloadActaConstitucion;
          break;
        }
        case 'acta-reunion': {
          const { generateActaReunion, downloadActaReunion } =
            await import('@/lib/pdf/templates/acta-reunion.template');
          generateFn = generateActaReunion;
          downloadFn = downloadActaReunion;
          break;
        }
        case 'informe-sprint': {
          const { generateInformeSprint, downloadInformeSprint } =
            await import('@/lib/pdf/templates/informe-sprint.template');
          generateFn = generateInformeSprint;
          downloadFn = downloadInformeSprint;
          break;
        }
        case 'informe-actividad': {
          const { generateInformeActividad, downloadInformeActividad } =
            await import('@/lib/pdf/templates/informe-actividad.template');
          generateFn = generateInformeActividad;
          downloadFn = downloadInformeActividad;
          break;
        }
        default:
          throw new Error(`Template desconocido: ${template}`);
      }

      // Generar y descargar
      await downloadFn(data, filename);

      // Notificar exito
      toast({
        title: 'PDF generado',
        description: 'El documento se ha descargado correctamente.',
      });

      onDownloadComplete?.();
    } catch (error) {
      console.error('Error al generar PDF:', error);

      const errorMessage = error instanceof Error
        ? error.message
        : 'Error desconocido al generar el PDF';

      toast({
        title: 'Error al generar PDF',
        description: errorMessage,
        variant: 'destructive',
      });

      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsGenerating(false);
    }
  }, [template, data, filename, disabled, isGenerating, onDownloadComplete, onError]);

  /**
   * Obtener el label por defecto segun el template
   */
  const getDefaultLabel = () => {
    switch (template) {
      case 'acta-constitucion':
        return 'Descargar Acta de Constitucion';
      case 'acta-reunion':
        return 'Descargar Acta de Reunion';
      case 'informe-sprint':
        return 'Descargar Informe de Sprint';
      case 'informe-actividad':
        return 'Descargar Informe de Actividad';
      default:
        return 'Descargar PDF';
    }
  };

  const buttonLabel = label || getDefaultLabel();
  const isDisabled = disabled || isGenerating;

  // Version solo icono
  if (iconOnly) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size="icon"
              disabled={isDisabled}
              onClick={handleDownload}
              className={className}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isGenerating ? 'Generando PDF...' : buttonLabel}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      disabled={isDisabled}
      onClick={handleDownload}
      className={className}
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Generando...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          {buttonLabel}
        </>
      )}
    </Button>
  );
}

/**
 * Props para el componente de preview y descarga
 */
export interface PDFPreviewDownloadProps {
  template: PDFTemplateType;
  data: PDFTemplateData;
  filename?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Componente con preview del tipo de documento
 */
export function PDFPreviewCard({
  template,
  data,
  filename,
  disabled = false,
  className = '',
}: PDFPreviewDownloadProps) {
  /**
   * Obtener informacion del template
   */
  const getTemplateInfo = () => {
    switch (template) {
      case 'acta-constitucion':
        return {
          title: 'Acta de Constitucion',
          description: 'Documento oficial de constitucion del proyecto',
          icon: FileText,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
        };
      case 'acta-reunion':
        return {
          title: 'Acta de Reunion',
          description: 'Registro de la reunion del proyecto',
          icon: FileText,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        };
      case 'informe-sprint':
        return {
          title: 'Informe de Sprint',
          description: 'Resumen del sprint completado',
          icon: FileText,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
        };
      case 'informe-actividad':
        return {
          title: 'Informe de Actividad',
          description: 'Metricas y desempeno de la actividad',
          icon: FileText,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
        };
      default:
        return {
          title: 'Documento PDF',
          description: 'Documento generado',
          icon: FileText,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
        };
    }
  };

  const info = getTemplateInfo();
  const Icon = info.icon;

  return (
    <div className={`border rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${info.bgColor}`}>
          <Icon className={`h-8 w-8 ${info.color}`} />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{info.title}</h4>
          <p className="text-sm text-gray-500 mt-1">{info.description}</p>
          <div className="mt-3">
            <PDFDownloadButton
              template={template}
              data={data}
              filename={filename}
              disabled={disabled}
              variant="default"
              size="sm"
              label="Descargar PDF"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PDFDownloadButton;
