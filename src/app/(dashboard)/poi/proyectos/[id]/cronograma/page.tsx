'use client';

/**
 * Pagina de Cronograma Gantt del Proyecto
 *
 * Visualizacion del diagrama de Gantt para gestion de cronogramas
 * Usa gantt-task-react y los componentes del feature cronograma
 */

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, GanttChartSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { paths } from '@/lib/paths';
import { CronogramaView } from '@/features/cronograma';

export default function CronogramaPage() {
  const params = useParams();
  const proyectoId = params.id as string;

  // TODO: Cargar datos del proyecto y equipo desde el servidor
  // Por ahora usando datos mock
  const [proyectoNombre, setProyectoNombre] = useState('Proyecto');
  const [responsables, setResponsables] = useState<{ id: number; nombre: string }[]>([]);

  useEffect(() => {
    // Simular carga de datos del proyecto
    // En produccion, esto vendria de getProyecto y getProyectoEquipo
    setProyectoNombre('Sistema de Gestion de Proyectos');
    setResponsables([
      { id: 1, nombre: 'Juan Perez' },
      { id: 2, nombre: 'Maria Garcia' },
      { id: 3, nombre: 'Carlos Lopez' },
      { id: 4, nombre: 'Ana Martinez' },
    ]);
  }, [proyectoId]);

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
              <GanttChartSquare className="h-6 w-6 text-[#004272]" />
              <h1 className="text-2xl font-bold tracking-tight">Cronograma</h1>
            </div>
            <p className="text-muted-foreground">{proyectoNombre}</p>
          </div>
        </div>
      </div>

      {/* Vista del Cronograma */}
      <CronogramaView
        proyectoId={proyectoId}
        proyectoNombre={proyectoNombre}
        responsables={responsables}
      />
    </div>
  );
}
