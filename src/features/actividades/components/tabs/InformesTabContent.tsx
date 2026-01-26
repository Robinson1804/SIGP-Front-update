'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Eye, Download, Send } from 'lucide-react';
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
import { useToast } from '@/lib/hooks/use-toast';
import { getInformesByActividad } from '@/features/informes';
import { post } from '@/lib/api/client';
import type { InformeActividad } from '@/features/informes';

const estadoBadgeColors: Record<string, string> = {
  'Borrador': 'bg-gray-100 text-gray-800',
  'Enviado': 'bg-blue-100 text-blue-800',
  'En revision': 'bg-yellow-100 text-yellow-800',
  'Aprobado': 'bg-green-100 text-green-800',
  'Rechazado': 'bg-red-100 text-red-800',
};

interface InformesTabContentProps {
  actividadId: number;
}

export function InformesTabContent({ actividadId }: InformesTabContentProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [informes, setInformes] = useState<InformeActividad[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const informesData = await getInformesByActividad(actividadId);
        setInformes(informesData);
      } catch (error) {
        console.error('Error loading informes:', error);
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
  }, [actividadId, toast]);

  const handleEnviar = async (informeId: number) => {
    try {
      await post(`/informes-actividad/${informeId}/enviar`, {});
      toast({
        title: 'Informe enviado',
        description: 'El informe ha sido enviado para aprobación',
      });
      // Refresh data
      const informesData = await getInformesByActividad(actividadId);
      setInformes(informesData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo enviar el informe',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadPdf = async (informe: InformeActividad) => {
    toast({
      title: 'PDF',
      description: 'Funcionalidad de descarga en desarrollo',
    });
  };

  const queryParams = `?actividadId=${actividadId}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        Cargando informes...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[#F9F9F9]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Informes de Actividad</h1>
          <p className="text-sm text-gray-500 mt-1">
            Informes periódicos de avance de la actividad
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
              No hay informes de actividad creados aún.
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
                      <DropdownMenu modal={false}>
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
                              Enviar a aprobación
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
  );
}
