'use client';

/**
 * Página de Documentos del Proyecto
 *
 * Gestión documental organizada por las 6 fases del ciclo de vida:
 * 1. Análisis y Planificación
 * 2. Diseño
 * 3. Desarrollo
 * 4. Pruebas
 * 5. Implementación
 * 6. Mantenimiento
 */

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { paths } from '@/lib/paths';
import {
  DocumentoPhaseAccordion,
  useDocumentos,
} from '@/features/documentos';

export default function DocumentosPage() {
  const params = useParams();
  const proyectoId = parseInt(params.id as string);

  const {
    documentos,
    isLoading,
    fetchDocumentos,
    aprobarExistingDocumento,
  } = useDocumentos({
    proyectoId,
    autoFetch: true,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={paths.poi.proyectos.detalles(proyectoId)}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <FolderOpen className="h-6 w-6 text-[#004272]" />
              <h1 className="text-2xl font-bold tracking-tight">Documentos del Proyecto</h1>
            </div>
            <p className="text-muted-foreground">
              Gestión documental organizada por fases del ciclo de vida
            </p>
          </div>
        </div>
      </div>

      {/* Acordeón de fases */}
      <DocumentoPhaseAccordion
        proyectoId={proyectoId}
        documentos={documentos}
        isLoading={isLoading}
        onRefresh={fetchDocumentos}
        onApprove={aprobarExistingDocumento}
      />
    </div>
  );
}
