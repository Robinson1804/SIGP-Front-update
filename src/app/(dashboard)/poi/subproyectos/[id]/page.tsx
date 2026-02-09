import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Users, DollarSign, Target, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSubproyecto } from '@/lib/actions';
import { paths } from '@/lib/paths';

interface SubproyectoDetallesPageProps {
  params: {
    id: string;
  };
}

const estadoVariants = {
  'Pendiente': 'secondary',
  'En planificacion': 'outline',
  'En desarrollo': 'default',
  'Finalizado': 'success',
  'Cancelado': 'destructive',
} as const;

export default async function SubproyectoDetallesPage({
  params,
}: SubproyectoDetallesPageProps) {
  const subproyecto = await getSubproyecto(parseInt(params.id));

  if (!subproyecto) {
    notFound();
  }

  // Formatear monto
  const formatMonto = (monto: number | string | undefined) => {
    if (!monto) return 'No especificado';
    const num = typeof monto === 'string' ? parseFloat(monto) : monto;
    return `S/ ${num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Formatear fecha
  const formatFecha = (fecha: string | undefined) => {
    if (!fecha) return 'No especificado';
    return new Date(fecha).toLocaleDateString('es-PE');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={paths.poi.proyectos.base}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {subproyecto.codigo} - {subproyecto.nombre}
            </h1>
            <p className="text-muted-foreground">
              Detalles del subproyecto POI
            </p>
          </div>
        </div>
      </div>

      {/* Estado */}
      <div className="flex items-center gap-2">
        <Badge variant={estadoVariants[subproyecto.estado as keyof typeof estadoVariants] || 'secondary'}>
          {subproyecto.estado}
        </Badge>
        <Badge variant="outline" className="font-mono">
          Scrum
        </Badge>
      </div>

      {/* Grid de cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Información Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Código</p>
              <p className="text-base font-mono">{subproyecto.codigo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre</p>
              <p className="text-base">{subproyecto.nombre}</p>
            </div>
            {subproyecto.descripcion && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Descripción</p>
                <p className="text-base">{subproyecto.descripcion}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Presupuesto y Fechas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Presupuesto y Cronograma
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Monto Asignado</p>
              <p className="text-base font-semibold">{formatMonto(subproyecto.monto)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha de Inicio</p>
              <p className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatFecha(subproyecto.fechaInicio)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha de Fin</p>
              <p className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatFecha(subproyecto.fechaFin)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Equipo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Equipo del Subproyecto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subproyecto.scrumMaster && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Scrum Master</p>
                <p className="text-base">
                  {subproyecto.scrumMaster.nombre} {subproyecto.scrumMaster.apellido}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enlaces rápidos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Gestión del Subproyecto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Button variant="outline" className="justify-start" asChild>
                <Link href={`/poi/proyecto/backlog?subproyectoId=${subproyecto.id}`}>
                  📋 Backlog y Tareas
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href={`/poi/proyecto/backlog/tablero?subproyectoId=${subproyecto.id}`}>
                  📊 Tablero Kanban
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href={`/poi/proyecto/backlog/dashboard?subproyectoId=${subproyecto.id}`}>
                  📈 Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nota informativa */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            <strong>Nota:</strong> Este subproyecto forma parte del proyecto padre y comparte los mismos sprints y metodología Scrum.
            Puedes gestionar el backlog, historias de usuario y tareas desde los enlaces de gestión.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
