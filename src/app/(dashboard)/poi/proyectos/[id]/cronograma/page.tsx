'use client';

/**
 * Pagina de Cronograma Gantt del Proyecto
 *
 * Visualizacion del diagrama de Gantt para gestion de cronogramas
 * Usa gantt-task-react y los componentes del feature cronograma
 */

import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, GanttChartSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { paths } from '@/lib/paths';
import { CronogramaView } from '@/features/cronograma';
import { getProyectoById, getProyectoEquipo } from '@/features/proyectos/services/proyectos.service';
import AppLayout from '@/components/layout/app-layout';

export default function CronogramaPage() {
  const params = useParams();
  const proyectoId = params.id as string;

  const [proyectoNombre, setProyectoNombre] = useState('Cargando...');
  const [responsables, setResponsables] = useState<{ id: number; nombre: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos del proyecto y equipo
  const loadProyectoData = useCallback(async () => {
    if (!proyectoId) return;

    setIsLoading(true);
    try {
      // Cargar proyecto y equipo en paralelo
      const [proyecto, equipo] = await Promise.all([
        getProyectoById(proyectoId),
        getProyectoEquipo(proyectoId),
      ]);

      setProyectoNombre(proyecto.nombre || 'Proyecto');

      // Construir lista de responsables: Scrum Master + Equipo asignado
      const responsablesList: { id: number; nombre: string }[] = [];
      const idsAgregados = new Set<number>();

      // 1. Agregar Scrum Master si existe
      if (proyecto.scrumMasterId && proyecto.scrumMaster) {
        const sm = proyecto.scrumMaster;
        const smNombre = (sm.nombre && sm.apellido)
          ? `${sm.nombre} ${sm.apellido}`.trim()
          : sm.username || `Usuario ${proyecto.scrumMasterId}`;
        responsablesList.push({
          id: proyecto.scrumMasterId,
          nombre: `${smNombre} (Scrum Master)`,
        });
        idsAgregados.add(proyecto.scrumMasterId);
      }

      // 2. Agregar Coordinador si existe
      if (proyecto.coordinadorId && proyecto.coordinador && !idsAgregados.has(proyecto.coordinadorId)) {
        const coord = proyecto.coordinador;
        const coordNombre = (coord.nombre && coord.apellido)
          ? `${coord.nombre} ${coord.apellido}`.trim()
          : coord.username || `Usuario ${proyecto.coordinadorId}`;
        responsablesList.push({
          id: proyecto.coordinadorId,
          nombre: `${coordNombre} (Coordinador)`,
        });
        idsAgregados.add(proyecto.coordinadorId);
      }

      // 3. Agregar equipo asignado (personal del proyecto)
      if (Array.isArray(equipo)) {
        for (const miembro of equipo) {
          const membroId = miembro.id || miembro.personalId;
          if (membroId && !idsAgregados.has(membroId)) {
            responsablesList.push({
              id: membroId,
              nombre: miembro.nombre || `Personal ${membroId}`,
            });
            idsAgregados.add(membroId);
          }
        }
      }

      setResponsables(responsablesList);
    } catch (error) {
      console.error('Error cargando datos del proyecto:', error);
      setProyectoNombre('Error al cargar');
    } finally {
      setIsLoading(false);
    }
  }, [proyectoId]);

  useEffect(() => {
    loadProyectoData();
  }, [loadProyectoData]);

  return (
    <AppLayout
      breadcrumbs={[
        { label: 'POI', href: paths.poi.base },
        { label: 'Proyectos', href: paths.poi.proyectos.base },
        { label: proyectoNombre, href: paths.poi.proyectos.detalles(proyectoId) },
        { label: 'Cronograma' },
      ]}
    >
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
    </AppLayout>
  );
}
