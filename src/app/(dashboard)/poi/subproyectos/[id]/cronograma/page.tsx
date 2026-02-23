'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, GanttChartSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { paths } from '@/lib/paths';
import { CronogramaView } from '@/features/cronograma';
import { getSubproyecto } from '@/features/subproyectos/services/subproyectos.service';
import AppLayout from '@/components/layout/app-layout';

export default function CronogramaSubproyectoPage() {
  const params = useParams();
  const subproyectoId = params.id as string;

  const [subproyectoNombre, setSubproyectoNombre] = useState('Cargando...');
  const [responsables, setResponsables] = useState<{ id: number; nombre: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!subproyectoId) return;
    setIsLoading(true);
    try {
      const subproyecto = await getSubproyecto(Number(subproyectoId));
      setSubproyectoNombre(subproyecto.nombre || 'Subproyecto');

      const responsablesList: { id: number; nombre: string }[] = [];
      const idsAgregados = new Set<number>();

      if (subproyecto.scrumMasterId) {
        const sm = (subproyecto as any).scrumMaster;
        const smNombre = sm
          ? (sm.nombre && sm.apellido ? `${sm.nombre} ${sm.apellido}`.trim() : sm.username || `Usuario ${subproyecto.scrumMasterId}`)
          : `Usuario ${subproyecto.scrumMasterId}`;
        responsablesList.push({ id: subproyecto.scrumMasterId, nombre: `${smNombre} (Scrum Master)` });
        idsAgregados.add(subproyecto.scrumMasterId);
      }

      if (subproyecto.coordinadorId && !idsAgregados.has(subproyecto.coordinadorId)) {
        const coord = (subproyecto as any).coordinador;
        const coordNombre = coord
          ? (coord.nombre && coord.apellido ? `${coord.nombre} ${coord.apellido}`.trim() : coord.username || `Usuario ${subproyecto.coordinadorId}`)
          : `Usuario ${subproyecto.coordinadorId}`;
        responsablesList.push({ id: subproyecto.coordinadorId, nombre: `${coordNombre} (Coordinador)` });
        idsAgregados.add(subproyecto.coordinadorId);
      }

      setResponsables(responsablesList);
    } catch (error) {
      console.error('Error cargando subproyecto:', error);
      setSubproyectoNombre('Error al cargar');
    } finally {
      setIsLoading(false);
    }
  }, [subproyectoId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <AppLayout
      breadcrumbs={[
        { label: 'POI', href: paths.poi.base },
        { label: 'Proyectos', href: paths.poi.proyectos.base },
        { label: subproyectoNombre, href: paths.poi.subproyectos.detalles(subproyectoId) },
        { label: 'Cronograma' },
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={paths.poi.subproyectos.detalles(subproyectoId)}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <GanttChartSquare className="h-6 w-6 text-[#004272]" />
                <h1 className="text-2xl font-bold tracking-tight">Cronograma</h1>
              </div>
              <p className="text-muted-foreground">{subproyectoNombre}</p>
            </div>
          </div>
        </div>

        <CronogramaView
          proyectoId={subproyectoId}
          tipoContenedor="SUBPROYECTO"
          proyectoNombre={subproyectoNombre}
          responsables={responsables}
        />
      </div>
    </AppLayout>
  );
}
