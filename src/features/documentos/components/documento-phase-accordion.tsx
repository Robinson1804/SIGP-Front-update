'use client';

/**
 * Acordeón de Fases de Documentos
 *
 * Muestra las 6 fases del ciclo de vida con sus documentos
 * Incluye indicadores de estado y botón de subida por fase
 */

import { useState, useMemo } from 'react';
import { ChevronDown, Plus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useAuth } from '@/stores';
import { ROLES } from '@/lib/definitions';
import { downloadDocumento, deleteDocumento } from '../services/documentos.service';
import { toast } from '@/lib/hooks/use-toast';
import type { Documento, DocumentoFase, AprobarDocumentoInput } from '../types';

import { PhaseStatusIndicator, getPhaseStats } from './phase-status-indicator';
import { DocumentoListTable } from './documento-list-table';
import { DocumentoPreviewModal } from './documento-preview-modal';
import { DocumentoUploadModal } from './documento-upload-modal';
import { DocumentoApprovalModal } from './documento-approval-modal';

// Configuración de fases
interface FaseConfig {
  key: DocumentoFase;
  label: string;
  sugeridos: string[];
}

const FASES_CONFIG: FaseConfig[] = [
  {
    key: 'Analisis y Planificacion',
    label: '(1) Análisis y Planificación',
    sugeridos: ['Acta de Constitución', 'Plan de Trabajo', 'EDT', 'Presentación Kick Off'],
  },
  {
    key: 'Diseno',
    label: '(2) Diseño',
    sugeridos: ['Prototipo', 'Arquitectura del Sistema', 'Modelo de Datos', 'Especificaciones Técnicas'],
  },
  {
    key: 'Desarrollo',
    label: '(3) Desarrollo',
    sugeridos: ['Código Fuente', 'Manual Técnico', 'Scripts de Base de Datos'],
  },
  {
    key: 'Pruebas',
    label: '(4) Pruebas',
    sugeridos: ['Plan de Pruebas', 'Casos de Prueba', 'Evidencias de Pruebas', 'Reporte de Bugs'],
  },
  {
    key: 'Implementacion',
    label: '(5) Implementación',
    sugeridos: ['Manual de Usuario', 'Acta de Capacitación', 'Acta de Pase a Producción', 'Plan de Despliegue'],
  },
  {
    key: 'Mantenimiento',
    label: '(6) Mantenimiento',
    sugeridos: ['Bitácora de Cambios', 'Reportes de Incidencias', 'SLA'],
  },
];

interface DocumentoPhaseAccordionProps {
  proyectoId: number;
  documentos: Documento[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onApprove?: (id: number | string, data: AprobarDocumentoInput) => Promise<Documento | null>;
}

export function DocumentoPhaseAccordion({
  proyectoId,
  documentos,
  isLoading = false,
  onRefresh,
  onApprove,
}: DocumentoPhaseAccordionProps) {
  const { user } = useAuth();
  const isPmo = user?.role === ROLES.PMO;
  const canUpload = isPmo || user?.role === ROLES.COORDINADOR || user?.role === ROLES.SCRUM_MASTER;

  // Estado de acordeón
  const [openPhases, setOpenPhases] = useState<Set<DocumentoFase>>(new Set());

  // Modales
  const [previewDoc, setPreviewDoc] = useState<Documento | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadModalFase, setUploadModalFase] = useState<DocumentoFase | undefined>();
  const [editingDoc, setEditingDoc] = useState<Documento | null>(null);
  const [approvalDoc, setApprovalDoc] = useState<Documento | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<Documento | null>(null);

  // Agrupar documentos por fase
  const documentosByFase = useMemo(() => {
    const grouped: Record<DocumentoFase, Documento[]> = {
      'Analisis y Planificacion': [],
      'Diseno': [],
      'Desarrollo': [],
      'Pruebas': [],
      'Implementacion': [],
      'Mantenimiento': [],
    };

    documentos.forEach(doc => {
      if (grouped[doc.fase]) {
        grouped[doc.fase].push(doc);
      }
    });

    return grouped;
  }, [documentos]);

  const togglePhase = (fase: DocumentoFase) => {
    const newOpen = new Set(openPhases);
    if (newOpen.has(fase)) {
      newOpen.delete(fase);
    } else {
      newOpen.add(fase);
    }
    setOpenPhases(newOpen);
  };

  const handleOpenUploadModal = (fase?: DocumentoFase) => {
    setUploadModalFase(fase);
    setEditingDoc(null);
    setUploadModalOpen(true);
  };

  const handleEditDocument = (doc: Documento) => {
    setEditingDoc(doc);
    setUploadModalFase(doc.fase);
    setUploadModalOpen(true);
  };

  const handleDeleteDocument = async () => {
    if (!deleteDoc) return;

    try {
      await deleteDocumento(deleteDoc.id);
      toast({
        title: 'Documento eliminado',
        description: 'El documento se ha eliminado correctamente.',
      });
      onRefresh?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el documento.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDoc(null);
    }
  };

  const handleDownloadDocument = async (doc: Documento) => {
    try {
      if (doc.link) {
        window.open(doc.link, '_blank');
      } else {
        await downloadDocumento(doc.id);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo descargar el documento.',
        variant: 'destructive',
      });
    }
  };

  const handleApproveDocument = async (id: number, data: AprobarDocumentoInput) => {
    if (!onApprove) return null;

    const result = await onApprove(id, data);
    if (result) {
      onRefresh?.();
    }
    return result;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {FASES_CONFIG.map((faseConfig) => {
          const faseDocs = documentosByFase[faseConfig.key];
          const stats = getPhaseStats(faseDocs);
          const isOpen = openPhases.has(faseConfig.key);

          return (
            <Card key={faseConfig.key} className="overflow-hidden">
              <Collapsible open={isOpen} onOpenChange={() => togglePhase(faseConfig.key)}>
                <CollapsibleTrigger asChild>
                  <div
                    className={cn(
                      "w-full px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors",
                      isOpen && "bg-muted/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Indicador de estado */}
                      <PhaseStatusIndicator documentos={faseDocs} size="md" />

                      {/* Nombre de fase */}
                      <span className="font-semibold text-sm">{faseConfig.label}</span>

                      {/* Contador */}
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {stats.total} {stats.total === 1 ? 'documento' : 'documentos'}
                      </span>

                      {/* Indicadores adicionales */}
                      {stats.obligatorios > 0 && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          {stats.obligatoriosAprobados}/{stats.obligatorios} obligatorios
                        </span>
                      )}

                      {stats.rechazados > 0 && (
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          {stats.rechazados} rechazado{stats.rechazados > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Documentos sugeridos tooltip */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <p className="font-medium mb-1">Documentos sugeridos:</p>
                          <ul className="text-xs space-y-0.5">
                            {faseConfig.sugeridos.map((sugerido, i) => (
                              <li key={i}>• {sugerido}</li>
                            ))}
                          </ul>
                        </TooltipContent>
                      </Tooltip>

                      {/* Botón subir (solo si tiene permisos) */}
                      {canUpload && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenUploadModal(faseConfig.key);
                          }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Subir
                        </Button>
                      )}

                      {/* Chevron */}
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 text-muted-foreground transition-transform",
                          isOpen && "rotate-180"
                        )}
                      />
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 pb-4">
                    <DocumentoListTable
                      documentos={faseDocs}
                      onView={setPreviewDoc}
                      onEdit={handleEditDocument}
                      onDelete={setDeleteDoc}
                      onDownload={handleDownloadDocument}
                      onApprove={setApprovalDoc}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}

        {/* Botón global para subir documento */}
        {canUpload && (
          <div className="pt-4">
            <Button
              onClick={() => handleOpenUploadModal()}
              className="w-full bg-[#018CD1] hover:bg-[#018CD1]/90 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Subir Nuevo Documento
            </Button>
          </div>
        )}
      </div>

      {/* Modal de preview */}
      <DocumentoPreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        documento={previewDoc}
        onDownload={() => previewDoc && handleDownloadDocument(previewDoc)}
      />

      {/* Modal de subida/edición */}
      <DocumentoUploadModal
        isOpen={uploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false);
          setEditingDoc(null);
        }}
        proyectoId={proyectoId}
        defaultFase={uploadModalFase}
        documento={editingDoc}
        onSuccess={onRefresh}
      />

      {/* Modal de aprobación */}
      <DocumentoApprovalModal
        isOpen={!!approvalDoc}
        onClose={() => setApprovalDoc(null)}
        documento={approvalDoc}
        onApprove={handleApproveDocument}
        onDownload={() => approvalDoc && handleDownloadDocument(approvalDoc)}
      />

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={!!deleteDoc} onOpenChange={() => setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar documento</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea eliminar el documento "{deleteDoc?.nombre}"?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDocument}
              className="bg-red-600 hover:bg-red-700"
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
