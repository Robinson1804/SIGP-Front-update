import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Calendar, Users, DollarSign, Target,
  FileText, FolderOpen, ClipboardList, BarChart, Folder, GanttChartSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SubproyectoActions } from '@/features/subproyectos/components/subproyecto-actions';
import { AreaUsuariaDisplay } from '@/features/proyectos/components/area-usuaria-display';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={paths.poi.subproyectos.base}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {subproyecto.codigo} - {subproyecto.nombre}
            </h1>
            <p className="text-muted-foreground">
              {subproyecto.proyectoPadre
                ? `Subproyecto de ${subproyecto.proyectoPadre.codigo} - ${subproyecto.proyectoPadre.nombre}`
                : 'Detalle del subproyecto'}
            </p>
          </div>
        </div>

        <SubproyectoActions
          subproyectoId={subproyecto.id}
          subproyectoCodigo={subproyecto.codigo}
          subproyectoNombre={subproyecto.nombre}
        />
      </div>

      {/* Estado y Clasificación */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={estadoVariants[subproyecto.estado as keyof typeof estadoVariants] as any}>
          {subproyecto.estado}
        </Badge>
        {subproyecto.clasificacion && (
          <Badge variant="outline">{subproyecto.clasificacion}</Badge>
        )}
        <Badge variant="outline" className="font-mono">Scrum</Badge>
        {subproyecto.proyectoPadre && (
          <Link href={paths.poi.proyectos.detalles(subproyecto.proyectoPadreId)}>
            <Badge variant="secondary" className="gap-1 cursor-pointer hover:bg-secondary/80">
              <Folder className="h-3 w-3" />
              {subproyecto.proyectoPadre.codigo}
            </Badge>
          </Link>
        )}
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
            {subproyecto.coordinacion && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Coordinación</p>
                <p className="text-base">{subproyecto.coordinacion}</p>
              </div>
            )}
            {subproyecto.areaResponsable && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Área Responsable</p>
                <p className="text-base">{subproyecto.areaResponsable}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Responsables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Responsables
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subproyecto.coordinador && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Coordinador</p>
                <p className="text-base">
                  {subproyecto.coordinador.nombre} {subproyecto.coordinador.apellido}
                </p>
              </div>
            )}
            {subproyecto.scrumMaster && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Scrum Master</p>
                <p className="text-base">
                  {subproyecto.scrumMaster.nombre} {subproyecto.scrumMaster.apellido}
                </p>
              </div>
            )}
            {subproyecto.areaUsuaria && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Área Usuaria (Patrocinador)</p>
                <p className="text-base">
                  {subproyecto.areaUsuaria.nombre} {subproyecto.areaUsuaria.apellido}
                </p>
              </div>
            )}
            {!subproyecto.coordinador && !subproyecto.scrumMaster && !subproyecto.areaUsuaria && (
              <p className="text-muted-foreground text-sm">Sin responsables asignados</p>
            )}
          </CardContent>
        </Card>

        {/* Fechas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Fechas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subproyecto.fechaInicio && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha de Inicio</p>
                <p className="text-base">
                  {new Date(subproyecto.fechaInicio).toLocaleDateString('es-PE', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
            )}
            {subproyecto.fechaFin && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha de Fin</p>
                <p className="text-base">
                  {new Date(subproyecto.fechaFin).toLocaleDateString('es-PE', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha de Creación</p>
              <p className="text-base">
                {new Date(subproyecto.createdAt).toLocaleDateString('es-PE', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Información Financiera */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Información Financiera
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subproyecto.monto ? (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monto Asignado</p>
                <p className="text-2xl font-bold">
                  S/ {Number(subproyecto.monto).toLocaleString('es-PE', {
                    minimumFractionDigits: 2, maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Sin presupuesto asignado</p>
            )}
            {subproyecto.anios && subproyecto.anios.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Años</p>
                <div className="flex gap-2 flex-wrap">
                  {subproyecto.anios.map((anio: number) => (
                    <Badge key={anio} variant="secondary">{anio}</Badge>
                  ))}
                </div>
              </div>
            )}
            {subproyecto.areasFinancieras && subproyecto.areasFinancieras.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Áreas Financieras</p>
                <div className="flex gap-2 flex-wrap">
                  {subproyecto.areasFinancieras.map((area: string) => (
                    <Badge key={area} variant="outline">{area}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secciones del Subproyecto */}
      <Card>
        <CardHeader>
          <CardTitle>Secciones del Subproyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8">
            <Button variant="outline" asChild>
              <Link href={paths.poi.subproyectos.sprints(subproyecto.id)}>
                Sprints
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={paths.poi.subproyectos.backlog(subproyecto.id)}>
                Backlog
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={paths.poi.subproyectos.tablero(subproyecto.id)}>
                Tablero
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={paths.poi.subproyectos.epicas(subproyecto.id)}>
                Épicas
              </Link>
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <Link href={paths.poi.subproyectos.cronograma(subproyecto.id)}>
                <GanttChartSquare className="h-4 w-4" />
                Cronograma
              </Link>
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <Link href={paths.poi.subproyectos.requerimientos(subproyecto.id)}>
                <FileText className="h-4 w-4" />
                Requerimientos
              </Link>
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <Link href={paths.poi.subproyectos.documentos(subproyecto.id)}>
                <FolderOpen className="h-4 w-4" />
                Documentos
              </Link>
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <Link href={paths.poi.subproyectos.actas(subproyecto.id)}>
                <ClipboardList className="h-4 w-4" />
                Actas
              </Link>
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <Link href={paths.poi.subproyectos.informes(subproyecto.id)}>
                <BarChart className="h-4 w-4" />
                Informes
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
