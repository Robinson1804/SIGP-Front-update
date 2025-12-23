'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, FileText, Calendar, Eye, Download, Send, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';
import { paths } from '@/lib/paths';
import { useToast } from '@/lib/hooks/use-toast';
import { getActividadById } from '@/features/actividades/services/actividades.service';
import { getInformesByActividad } from '@/features/informes';
import { post } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { ROLES } from '@/lib/definitions';
import { useAuth } from '@/stores';
import type { Actividad } from '@/features/actividades/types';
import type { InformeActividad } from '@/features/informes';

const estadoBadgeColors: Record<string, string> = {
  'Borrador': 'bg-gray-100 text-gray-800',
  'Enviado': 'bg-blue-100 text-blue-800',
  'En revision': 'bg-yellow-100 text-yellow-800',
  'Aprobado': 'bg-green-100 text-green-800',
  'Rechazado': 'bg-red-100 text-red-800',
};

function InformesActividadContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const actividadId = searchParams.get('actividadId') || searchParams.get('id');

  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [informes, setInformes] = useState<InformeActividad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab] = useState('Informes');

  const isImplementador = user?.role === ROLES.IMPLEMENTADOR;

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);

        let id: number | null = null;

        if (actividadId) {
          id = parseInt(actividadId, 10);
        } else {
          // Fallback to localStorage
          const savedProjectData = localStorage.getItem('selectedProject');
          if (savedProjectData) {
            const projectData = JSON.parse(savedProjectData);
            if (projectData.type !== 'Actividad') {
              router.push(paths.poi.base);
              return;
            }
            id = projectData.id;
          }
        }

        if (!id) {
          toast({
            title: 'Error',
            description: 'No se encontro el ID de la actividad',
            variant: 'destructive',
          });
          router.push(paths.poi.base);
          return;
        }

        const [actividadData, informesData] = await Promise.all([
          getActividadById(id),
          getInformesByActividad(id),
        ]);
        setActividad(actividadData);
        setInformes(informesData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los informes',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [actividadId, router, toast]);

  const handleEnviar = async (informeId: number) => {
    try {
      await post(`/informes-actividad/${informeId}/enviar`, {});
      toast({
        title: 'Informe enviado',
        description: 'El informe ha sido enviado para aprobacion',
      });
      // Refresh data
      if (actividad) {
        const informesData = await getInformesByActividad(actividad.id);
        setInformes(informesData);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo enviar el informe',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadPdf = async (informe: InformeActividad) => {
    // TODO: Implement PDF generation with proper type mapping
    toast({
      title: 'PDF',
      description: 'Funcionalidad de descarga en desarrollo',
    });
  };

  // Tab navigation handler - State-driven Navigation
  const handleTabClick = (tabName: string) => {
    let route = '';
    if (tabName === 'Detalles') route = paths.poi.actividad.detalles;
    else if (tabName === 'Lista') route = paths.poi.actividad.lista;
    else if (tabName === 'Tablero') route = paths.poi.actividad.tablero;
    else if (tabName === 'Dashboard') route = paths.poi.actividad.dashboard;

    if (route) {
      const queryParams = actividad ? `?actividadId=${actividad.id}` : '';
      router.push(`${route}${queryParams}`);
    }
  };

  if (isLoading) {
    return (
      <AppLayout breadcrumbs={[{ label: 'POI', href: paths.poi.base }, { label: 'Informes' }]}>
        <div className="flex items-center justify-center h-64">
          Cargando informes...
        </div>
      </AppLayout>
    );
  }

  const breadcrumbs = [
    { label: 'POI', href: paths.poi.base },
    { label: 'Informes' },
  ];

  const queryParams = actividad ? `?actividadId=${actividad.id}` : '';
  const activityCode = actividad ? `ACT N°${actividad.id}` : '';

  // IMPLEMENTADOR no tiene acceso a Detalles
  const allActivityTabs = [{ name: 'Detalles' }, { name: 'Lista' }, { name: 'Tablero' }, { name: 'Dashboard' }, { name: 'Informes' }];
  const activityTabs = isImplementador
    ? allActivityTabs.filter(tab => tab.name !== 'Detalles')
    : allActivityTabs;

  const secondaryHeader = (
    <div className="bg-[#D5D5D5] border-b border-t border-[#1A5581]">
      <div className="p-2 flex items-center justify-between w-full">
        <h2 className="font-bold text-black pl-2">
          {activityCode}: {actividad?.nombre}
        </h2>
      </div>
    </div>
  );

  return (
    <AppLayout breadcrumbs={breadcrumbs} secondaryHeader={secondaryHeader}>
      {/* Tabs */}
      <div className="flex items-center gap-2 p-4 bg-[#F9F9F9]">
        {activityTabs.map(tab => (
          <Button
            key={tab.name}
            size="sm"
            onClick={() => handleTabClick(tab.name)}
            className={cn(activeTab === tab.name ? 'bg-[#018CD1] text-white' : 'bg-white text-black border-gray-300')}
            variant={activeTab === tab.name ? 'default' : 'outline'}
          >
            {tab.name}
          </Button>
        ))}
      </div>

      <div className="p-6 space-y-6 bg-[#F9F9F9]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Informes de Actividad</h1>
            <p className="text-sm text-gray-500 mt-1">
              Informes periodicos de avance de la actividad
            </p>
          </div>
          <Button onClick={() => router.push(`/poi/actividad/informes/nuevo${queryParams}`)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Informe
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Informes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{informes.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Aprobados</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {informes.filter((i) => i.estado === 'Aprobado').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pendientes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">
                {informes.filter((i) => ['Borrador', 'Enviado', 'En revision'].includes(i.estado)).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Rechazados</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {informes.filter((i) => i.estado === 'Rechazado').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Lista de Informes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {informes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay informes de actividad creados aun.
                <br />
                <Button
                  variant="link"
                  onClick={() => router.push(`/poi/actividad/informes/nuevo${queryParams}`)}
                >
                  Crear el primer informe
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Tareas Completadas</TableHead>
                    <TableHead>Avance</TableHead>
                    <TableHead>Throughput</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {informes.map((informe) => (
                    <TableRow key={informe.id}>
                      <TableCell className="font-medium">{informe.periodo}</TableCell>
                      <TableCell>
                        <span className="font-medium">{informe.tareasCompletadas}</span>
                        <span className="text-gray-400"> tareas</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{informe.porcentajeAvance}%</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{informe.throughput}</span>
                        <span className="text-gray-400">/periodo</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={estadoBadgeColors[informe.estado] || 'bg-gray-100'}>
                          {(informe.estado || 'Borrador').replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(informe.createdAt).toLocaleDateString('es-PE')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/poi/actividad/informes/${informe.id}${queryParams}`)
                              }
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalle
                            </DropdownMenuItem>
                            {informe.estado === 'Borrador' && (
                              <DropdownMenuItem onClick={() => handleEnviar(informe.id)}>
                                <Send className="h-4 w-4 mr-2" />
                                Enviar a aprobacion
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDownloadPdf(informe)}>
                              <Download className="h-4 w-4 mr-2" />
                              Descargar PDF
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

export default function InformesActividadPage() {
  return (
    <React.Suspense fallback={<div>Cargando...</div>}>
      <InformesActividadContent />
    </React.Suspense>
  );
}
