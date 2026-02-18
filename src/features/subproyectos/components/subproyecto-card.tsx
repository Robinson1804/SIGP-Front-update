'use client';

import Link from 'next/link';
import { Calendar, Users, Folder } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { paths } from '@/lib/paths';
import type { Subproyecto } from '../services/subproyectos.service';

interface SubproyectoCardProps {
  data: Subproyecto;
}

const estadoVariants = {
  'Pendiente': 'secondary',
  'En planificacion': 'outline',
  'En desarrollo': 'default',
  'Finalizado': 'success',
  'Cancelado': 'destructive',
} as const;

export function SubproyectoCard({ data }: SubproyectoCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1 flex-1">
          <CardTitle className="text-base">
            <Link
              href={paths.poi.subproyectos.detalles(data.id)}
              className="hover:underline"
            >
              {data.codigo} - {data.nombre}
            </Link>
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {data.descripcion || 'Sin descripción'}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Estado y Clasificación */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={estadoVariants[data.estado as keyof typeof estadoVariants] as any}>
            {data.estado}
          </Badge>
          {data.clasificacion && (
            <Badge variant="outline">
              {data.clasificacion}
            </Badge>
          )}
          <Badge variant="outline" className="font-mono">
            SCRUM
          </Badge>
        </div>

        {/* Proyecto Padre */}
        {data.proyectoPadre && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Folder className="h-3 w-3" />
            <span className="font-medium">Proyecto:</span>
            <Link
              href={paths.poi.proyectos.detalles(data.proyectoPadreId)}
              className="hover:underline"
            >
              {data.proyectoPadre.codigo}
            </Link>
          </div>
        )}

        {/* Scrum Master */}
        {data.scrumMaster && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-3 w-3" />
            <span className="font-medium">SM:</span>
            <span>
              {`${data.scrumMaster.nombre} ${data.scrumMaster.apellido}`.trim()}
            </span>
          </div>
        )}

        {/* Info adicional */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              {data.fechaInicio
                ? new Date(data.fechaInicio).toLocaleDateString('es-PE', {
                    month: 'short',
                    year: 'numeric'
                  })
                : 'Sin fecha'}
            </span>
          </div>

          {data.monto && (
            <div className="font-medium">
              S/ {data.monto.toLocaleString('es-PE')}
            </div>
          )}
        </div>

        {/* Fecha de creación */}
        <div className="pt-2 border-t text-xs text-muted-foreground">
          Creado: {new Date(data.createdAt).toLocaleDateString('es-PE')}
        </div>
      </CardContent>
    </Card>
  );
}
