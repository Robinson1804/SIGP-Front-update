'use client';

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
  Layers,
  ChevronRight,
  Timer,
  TrendingUp,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { paths } from '@/lib/paths';
import type { ActividadActiva } from '../types';

interface ActividadesActivasTableProps {
  data: ActividadActiva[];
  loading?: boolean;
  error?: string;
  className?: string;
  maxItems?: number;
  onViewAll?: () => void;
}

const estadoColors: Record<string, string> = {
  'En ejecucion': 'bg-blue-100 text-blue-800',
  Pendiente: 'bg-yellow-100 text-yellow-800',
  Finalizado: 'bg-green-100 text-green-800',
  Suspendido: 'bg-red-100 text-red-800',
};

/**
 * Tabla de Actividades Activas para Dashboard Gerencial
 */
export function ActividadesActivasTable({
  data = [],
  loading = false,
  error,
  className,
  maxItems = 5,
  onViewAll,
}: ActividadesActivasTableProps) {
  const router = useRouter();

  const handleRowClick = (actividad: ActividadActiva) => {
    router.push(paths.poi.actividad.byId(actividad.id));
  };

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4" />
            ACTIVIDADES ACTIVAS
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
            <Layers className="h-4 w-4" />
            ACTIVIDADES ACTIVAS
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
            <Layers className="h-4 w-4" />
            ACTIVIDADES ACTIVAS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Layers className="h-10 w-10 mb-2 text-gray-300" />
            <p>No hay actividades activas</p>
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
          <Layers className="h-4 w-4" />
          ACTIVIDADES ACTIVAS
        </CardTitle>
        {onViewAll && data.length > maxItems && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            Ver todas ({data.length})
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Actividad</TableHead>
              <TableHead className="text-center">Tareas/Mes</TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Timer className="h-3 w-3" />
                  Lead Time
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Throughput
                </div>
              </TableHead>
              <TableHead className="text-center">Progreso</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.map((actividad) => (
              <TableRow
                key={actividad.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleRowClick(actividad)}
              >
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{actividad.codigo}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[200px]">
                      {actividad.nombre}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium">{actividad.tareasCompletadasMes}</span>
                  <span className="text-xs text-gray-400">/{actividad.tareasTotal}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      actividad.leadTimePromedio > 10
                        ? 'text-red-600'
                        : actividad.leadTimePromedio > 5
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    )}
                  >
                    {actividad.leadTimePromedio.toFixed(1)}d
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm font-medium">
                    {actividad.throughputSemanal}
                  </span>
                  <span className="text-xs text-gray-400">/sem</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={actividad.progreso}
                      className="h-2 w-16"
                    />
                    <span className="text-xs font-medium">
                      {actividad.progreso}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs',
                      estadoColors[actividad.estado] || 'bg-gray-100'
                    )}
                  >
                    {actividad.estado}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRowClick(actividad);
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Legend */}
        <div className="mt-4 text-xs text-gray-500 flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Timer className="h-3 w-3" />
            Lead Time: dias desde creacion hasta finalizacion
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Throughput: tareas completadas por semana
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default ActividadesActivasTable;
