'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/layout/app-layout';
import { paths } from '@/lib/paths';
import { useToast } from '@/lib/hooks/use-toast';
import { getProyectoById } from '@/features/proyectos/services/proyectos.service';
import { getInformeSprint, InformeSprintView } from '@/features/informes';
import type { Proyecto } from '@/lib/definitions';
import type { InformeSprint } from '@/features/informes';

export default function InformeSprintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const proyectoId = Number(params.id);
  const informeId = Number(params.informeId);

  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [informe, setInforme] = useState<InformeSprint | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [proyectoData, informeData] = await Promise.all([
        getProyectoById(proyectoId),
        getInformeSprint(informeId),
      ]);
      setProyecto(proyectoData);
      setInforme(informeData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el informe',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [proyectoId, informeId, toast]);

  useEffect(() => {
    if (proyectoId && informeId) {
      loadData();
    }
  }, [proyectoId, informeId, loadData]);

  const handleDownloadPdf = async () => {
    if (!informe) return;
    // TODO: Implement PDF generation with proper type mapping
    toast({
      title: 'PDF',
      description: 'Funcionalidad de descarga en desarrollo',
    });
  };

  const handleAprobacionChange = () => {
    loadData();
  };

  if (isLoading) {
    return (
      <AppLayout breadcrumbs={[{ label: 'POI', href: paths.poi.base }, { label: 'Informe' }]}>
        <div className="flex items-center justify-center h-64">
          Cargando informe...
        </div>
      </AppLayout>
    );
  }

  if (!informe) {
    return (
      <AppLayout breadcrumbs={[{ label: 'POI', href: paths.poi.base }, { label: 'Informe' }]}>
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <FileText className="h-12 w-12 mb-4" />
          <p>No se encontro el informe</p>
          <Button
            variant="link"
            onClick={() => router.push(`/poi/proyectos/${proyectoId}/informes`)}
          >
            Volver a informes
          </Button>
        </div>
      </AppLayout>
    );
  }

  const breadcrumbs = [
    { label: 'POI', href: paths.poi.base },
    { label: proyecto?.nombre || 'Proyecto', href: `/poi/proyectos/${proyectoId}` },
    { label: 'Informes', href: `/poi/proyectos/${proyectoId}/informes` },
    { label: `Sprint ${informe.sprintNumero || informe.sprintNombre}` },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push(`/poi/proyectos/${proyectoId}/informes`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a informes
          </Button>
          <Button onClick={handleDownloadPdf}>
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
        </div>

        {/* Informe View */}
        <InformeSprintView
          informe={informe}
          onAprobacionChange={handleAprobacionChange}
        />
      </div>
    </AppLayout>
  );
}
