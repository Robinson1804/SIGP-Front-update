'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Plus,
  Download,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { paths } from '@/lib/paths';
import { toast } from '@/lib/hooks/use-toast';
import {
  getActasByProyecto,
  saveActaPdf,
  getEstadoLabel,
} from '@/features/documentos/services/actas.service';
import type { Acta, ActasByProyectoResponse } from '@/features/documentos/types';

const estadoIcons = {
  Borrador: <Clock className="h-4 w-4" />,
  Pendiente: <AlertCircle className="h-4 w-4" />,
  Aprobado: <CheckCircle className="h-4 w-4" />,
  Rechazado: <XCircle className="h-4 w-4" />,
};

export default function ProyectoActasPage() {
  const params = useParams();
  const router = useRouter();
  const proyectoId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ActasByProyectoResponse | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<number | null>(null);

  const fetchActas = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getActasByProyecto(proyectoId);
      setData(result);
    } catch (error) {
      console.error('Error fetching actas:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las actas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [proyectoId]);

  useEffect(() => {
    fetchActas();
  }, [fetchActas]);

  const handleDownloadPdf = async (acta: Acta) => {
    try {
      setDownloadingPdf(acta.id);
      const filename = `${acta.tipo === 'Constitucion' ? 'Acta_Constitucion' : 'Acta_Reunion'}_${acta.codigo}.pdf`;
      await saveActaPdf(acta.id, filename);
      toast({
        title: 'PDF descargado',
        description: `El archivo ${filename} se ha descargado correctamente`,
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Error',
        description: 'No se pudo descargar el PDF',
        variant: 'destructive',
      });
    } finally {
      setDownloadingPdf(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold tracking-tight">Actas del Proyecto</h1>
            <p className="text-muted-foreground">
              Gestiona las actas de constitución y reuniones del proyecto
            </p>
          </div>
        </div>
      </div>

      {/* Acta de Constitución Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Acta de Constitución
              </CardTitle>
              <CardDescription>
                Documento formal que autoriza el inicio del proyecto
              </CardDescription>
            </div>
            {!data?.constitucion && (
              <Button asChild>
                <Link href={paths.poi.proyectos.actaConstitucionNueva(proyectoId)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Acta de Constitución
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {data?.constitucion ? (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-full bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{data.constitucion.nombre}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{data.constitucion.codigo}</span>
                    <span>•</span>
                    <span>{formatDate(data.constitucion.fecha)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={getEstadoLabel(data.constitucion.estado).variant}>
                  {estadoIcons[data.constitucion.estado]}
                  <span className="ml-1">{getEstadoLabel(data.constitucion.estado).label}</span>
                </Badge>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={paths.poi.proyectos.actaConstitucion(proyectoId)}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  {data.constitucion.estado === 'Borrador' && (
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`${paths.poi.proyectos.actaConstitucion(proyectoId)}?edit=true`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownloadPdf(data.constitucion!)}
                    disabled={downloadingPdf === data.constitucion.id}
                  >
                    {downloadingPdf === data.constitucion.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No se ha creado el acta de constitución</p>
              <p className="text-sm">
                El acta de constitución es el documento que formaliza el inicio del proyecto
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actas de Reunión Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Actas de Reunión
              </CardTitle>
              <CardDescription>
                Registro de las reuniones realizadas durante el proyecto
              </CardDescription>
            </div>
            <Button asChild>
              <Link href={paths.poi.proyectos.actaReunionNueva(proyectoId)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Acta de Reunión
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data?.reuniones && data.reuniones.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.reuniones.map((acta) => (
                  <TableRow key={acta.id}>
                    <TableCell className="font-mono text-sm">{acta.codigo}</TableCell>
                    <TableCell>{acta.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{acta.tipoReunion || 'Sin tipo'}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(acta.fecha)}</TableCell>
                    <TableCell>
                      <Badge variant={getEstadoLabel(acta.estado).variant}>
                        {estadoIcons[acta.estado]}
                        <span className="ml-1">{getEstadoLabel(acta.estado).label}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={paths.poi.proyectos.actaReunion(proyectoId, acta.id)}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {acta.estado === 'Borrador' && (
                          <Button variant="ghost" size="icon" asChild>
                            <Link
                              href={`${paths.poi.proyectos.actaReunion(proyectoId, acta.id)}?edit=true`}
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadPdf(acta)}
                          disabled={downloadingPdf === acta.id}
                        >
                          {downloadingPdf === acta.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay actas de reunión registradas</p>
              <p className="text-sm">
                Crea una nueva acta para documentar las reuniones del proyecto
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
