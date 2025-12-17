'use client';

/**
 * Página de Requerimientos del Proyecto
 *
 * Gestión de Requerimientos Funcionales (RF) y No Funcionales (RNF)
 * Incluye lista con filtros, formulario modal, y matriz de trazabilidad
 */

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { paths } from '@/lib/paths';
import { RequerimientoList } from '@/features/requerimientos';

export default function RequerimientosPage() {
  const params = useParams();
  const proyectoId = parseInt(params.id as string);

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
              <FileText className="h-6 w-6 text-[#004272]" />
              <h1 className="text-2xl font-bold tracking-tight">Requerimientos</h1>
            </div>
            <p className="text-muted-foreground">
              Gestión de Requerimientos Funcionales y No Funcionales
            </p>
          </div>
        </div>
      </div>

      {/* Lista de requerimientos */}
      <RequerimientoList proyectoId={proyectoId} />
    </div>
  );
}
