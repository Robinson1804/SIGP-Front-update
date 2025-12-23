'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  FolderKanban,
  ChevronRight,
  Calendar,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { paths } from '@/lib/paths';
import type { ProyectoActivo } from '../types';

interface ProyectosActivosTableProps {
  data: ProyectoActivo[];
  loading?: boolean;
  error?: string;
  className?: string;
  showPagination?: boolean;
  maxItems?: number;
  onViewAll?: () => void;
}

const saludColors = {
  verde: 'bg-green-500',
  amarillo: 'bg-yellow-500',
  rojo: 'bg-red-500',
};

const saludLabels = {
  verde: 'En tiempo',
  amarillo: 'En riesgo',
  rojo: 'Atrasado',
};

const estadoColors: Record<string, string> = {
  'En desarrollo': 'bg-blue-100 text-blue-800',
  'En planificacion': 'bg-yellow-100 text-yellow-800',
  Finalizado: 'bg-green-100 text-green-800',
  Pendiente: 'bg-gray-100 text-gray-800',
};

/**
 * Tabla de Proyectos Activos para Dashboard Gerencial
 */
export function ProyectosActivosTable({
  data = [],
  loading = false,
  error,
  className,
  maxItems = 5,
  onViewAll,
}: ProyectosActivosTableProps) {
  const router = useRouter();

  const handleRowClick = (proyecto: ProyectoActivo) => {
    router.push(paths.poi.proyectos.detalles(proyecto.id));
  };

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FolderKanban className="h-4 w-4" />
            PROYECTOS ACTIVOS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FolderKanban className="h-4 w-4" />
            PROYECTOS ACTIVOS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <AlertCircle className="h-10 w-10 mb-2 text-red-500" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FolderKanban className="h-4 w-4" />
            PROYECTOS ACTIVOS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <FolderKanban className="h-10 w-10 mb-2 text-gray-300" />
            <p>No hay proyectos activos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayData = maxItems ? data.slice(0, maxItems) : data;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <FolderKanban className="h-4 w-4" />
          PROYECTOS ACTIVOS
        </CardTitle>
        {onViewAll && data.length > maxItems && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            Ver todos ({data.length})
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Salud</TableHead>
              <TableHead>Proyecto</TableHead>
              <TableHead>Sprint Actual</TableHead>
              <TableHead className="text-center">Story Points</TableHead>
              <TableHead className="text-center">Avance</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.map((proyecto) => (
              <TableRow
                key={proyecto.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleRowClick(proyecto)}
              >
                <TableCell>
                  <div
                    className={cn(
                      'w-3 h-3 rounded-full',
                      saludColors[proyecto.salud]
                    )}
                    title={saludLabels[proyecto.salud]}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{proyecto.codigo}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[200px]">
                      {proyecto.nombre}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {proyecto.sprintActual ? (
                    <span className="text-sm">{proyecto.sprintActual.nombre}</span>
                  ) : (
                    <span className="text-xs text-gray-400">Sin sprint</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm font-medium">
                    {proyecto.storyPointsCompletados}
                  </span>
                  <span className="text-xs text-gray-400">
                    /{proyecto.storyPointsTotal}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={proyecto.porcentajeAvance}
                      className="h-2 w-16"
                    />
                    <span className="text-xs font-medium">
                      {proyecto.porcentajeAvance}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs',
                      estadoColors[proyecto.estado] || 'bg-gray-100'
                    )}
                  >
                    {proyecto.estado}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRowClick(proyecto);
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Fecha proxima */}
        {displayData.some((p) => p.proximaFecha) && (
          <div className="mt-4 text-xs text-gray-500 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Proximos cierres de sprint marcados en la columna de sprint
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ProyectosActivosTable;
