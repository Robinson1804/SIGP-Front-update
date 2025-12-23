'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { getProyectoById } from '@/features/proyectos/services/proyectos.service';
import { get, post } from '@/lib/api/client';
import type { Proyecto } from '@/lib/definitions';

interface InformeSprint {
  id: number;
  codigo: string;
  numeroSprint: number;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  puntosPlanificados: number;
  puntosCompletados: number;
  createdAt: string;
}

const estadoBadgeColors: Record<string, string> = {
  'BORRADOR': 'bg-gray-100 text-gray-800',
  'ENVIADO': 'bg-blue-100 text-blue-800',
  'EN_REVISION': 'bg-yellow-100 text-yellow-800',
  'APROBADO': 'bg-green-100 text-green-800',
  'RECHAZADO': 'bg-red-100 text-red-800',
};

export default function InformesSprintPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const proyectoId = Number(params.id);

  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [informes, setInformes] = useState<InformeSprint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [proyectoData, informesData] = await Promise.all([
          getProyectoById(proyectoId),
          get<InformeSprint[]>(`/proyectos/${proyectoId}/informes-sprint`),
        ]);
        setProyecto(proyectoData);
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

    if (proyectoId) {
      loadData();
    }
  }, [proyectoId, toast]);

  const handleEnviar = async (informeId: number) => {
    try {
      await post(`/informes-sprint/${informeId}/enviar`, {});
      toast({
        title: 'Informe enviado',
        description: 'El informe ha sido enviado para aprobacion',
      });
      // Refresh data
      const informesData = await get<InformeSprint[]>(`/proyectos/${proyectoId}/informes-sprint`);
      setInformes(informesData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo enviar el informe',
        variant: 'destructive',
      });
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
    { label: proyecto?.nombre || 'Proyecto', href: `/poi/proyectos/${proyectoId}` },
    { label: 'Informes de Sprint' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Informes de Sprint</h1>
            <p className="text-sm text-gray-500 mt-1">
              Informes de avance por cada sprint del proyecto
            </p>
          </div>
          <Button onClick={() => router.push(`/poi/proyectos/${proyectoId}/informes/nuevo`)}>
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
                {informes.filter((i) => i.estado === 'APROBADO').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pendientes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">
                {informes.filter((i) => ['BORRADOR', 'ENVIADO', 'EN_REVISION'].includes(i.estado)).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Rechazados</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {informes.filter((i) => i.estado === 'RECHAZADO').length}
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
                No hay informes de sprint creados aun.
                <br />
                <Button
                  variant="link"
                  onClick={() => router.push(`/poi/proyectos/${proyectoId}/informes/nuevo`)}
                >
                  Crear el primer informe
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Sprint</TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Puntos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {informes.map((informe) => (
                    <TableRow key={informe.id}>
                      <TableCell className="font-mono text-sm">{informe.codigo}</TableCell>
                      <TableCell>Sprint {informe.numeroSprint}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(informe.fechaInicio).toLocaleDateString('es-PE')} -{' '}
                        {new Date(informe.fechaFin).toLocaleDateString('es-PE')}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{informe.puntosCompletados}</span>
                        <span className="text-gray-400">/{informe.puntosPlanificados}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={estadoBadgeColors[informe.estado] || 'bg-gray-100'}>
                          {informe.estado.replace('_', ' ')}
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
                                router.push(`/poi/proyectos/${proyectoId}/informes/${informe.id}`)
                              }
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalle
                            </DropdownMenuItem>
                            {informe.estado === 'BORRADOR' && (
                              <DropdownMenuItem onClick={() => handleEnviar(informe.id)}>
                                <Send className="h-4 w-4 mr-2" />
                                Enviar a aprobacion
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
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
