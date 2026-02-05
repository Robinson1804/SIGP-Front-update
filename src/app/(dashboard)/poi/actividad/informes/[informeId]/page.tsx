'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/layout/app-layout';
import { paths } from '@/lib/paths';
import { useToast } from '@/lib/hooks/use-toast';
import { useAuth } from '@/stores';
import { ROLES } from '@/lib/definitions';
import { getActividadById } from '@/features/actividades/services/actividades.service';
import { getInformeActividad, InformeActividadView } from '@/features/informes';
import type { Actividad } from '@/features/actividades/types';
import type { InformeActividad } from '@/features/informes';

function InformeActividadDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const informeId = Number(params.informeId);

  const userRole = user?.role;
  const isDesarrollador = userRole === ROLES.DESARROLLADOR;

  // DESARROLLADOR no tiene acceso a Actividades (solo a Proyectos/Scrum)
  useEffect(() => {
    if (isDesarrollador) {
      router.push(paths.poi.base);
    }
  }, [isDesarrollador, router]);

  const actividadIdParam = searchParams.get('actividadId') || searchParams.get('id');

  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [informe, setInforme] = useState<InformeActividad | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Load informe first
      const informeData = await getInformeActividad(informeId);
      setInforme(informeData);

      // Get actividad ID from informe or from params
      const actividadId = informeData.actividadId || (actividadIdParam ? parseInt(actividadIdParam, 10) : null);

      if (actividadId) {
        const actividadData = await getActividadById(actividadId);
        setActividad(actividadData);
      }
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
  }, [informeId, actividadIdParam, toast]);

  useEffect(() => {
    if (informeId) {
      loadData();
    }
  }, [informeId, loadData]);

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

  const getBackUrl = () => {
    const queryParams = actividad ? `?actividadId=${actividad.id}` : '';
    return `/poi/actividad/informes${queryParams}`;
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
          <Button variant="link" onClick={() => router.push(getBackUrl())}>
            Volver a informes
          </Button>
        </div>
      </AppLayout>
    );
  }

  const breadcrumbs = [
    { label: 'POI', href: paths.poi.base },
    { label: actividad?.nombre || 'Actividad', href: `/poi/actividad/tablero?actividadId=${actividad?.id}` },
    { label: 'Informes', href: getBackUrl() },
    { label: `Periodo ${informe.periodo}` },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push(getBackUrl())}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a informes
          </Button>
          <Button onClick={handleDownloadPdf}>
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
        </div>

        {/* Informe View */}
        <InformeActividadView
          informe={informe}
          onAprobacionChange={handleAprobacionChange}
        />
      </div>
    </AppLayout>
  );
}

export default function InformeActividadDetailPage() {
  return (
    <React.Suspense fallback={<div>Cargando...</div>}>
      <InformeActividadDetailContent />
    </React.Suspense>
  );
}
