import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Users, DollarSign, Target, FileText, FolderOpen, ClipboardList, BarChart, Plus, FolderTree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProyectoActions } from '@/features/proyectos';
import { AreaUsuariaDisplay } from '@/features/proyectos/components/area-usuaria-display';
import { PermissionGate } from '@/features/auth';
import { getProyecto } from '@/lib/actions';
import { getSubproyectosByProyecto } from '@/features/subproyectos/services/subproyectos.service';
import { paths } from '@/lib/paths';
import { MODULES, PERMISSIONS } from '@/lib/definitions';

interface ProyectoDetallesPageProps {
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

export default async function ProyectoDetallesPage({
  params,
}: ProyectoDetallesPageProps) {
  const proyecto = await getProyecto(parseInt(params.id));

  if (!proyecto) {
    notFound();
  }

  // Cargar subproyectos del proyecto
  const subproyectos = await getSubproyectosByProyecto(parseInt(params.id)).catch(() => []);

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
              {proyecto.codigo} - {proyecto.nombre}
            </h1>
            <p className="text-muted-foreground">
              Detalles del proyecto POI
            </p>
          </div>
        </div>

        <ProyectoActions
          proyectoId={proyecto.id}
          proyectoCodigo={proyecto.codigo}
          proyectoNombre={proyecto.nombre}
        />
      </div>

      {/* Estado y Clasificación */}
      <div className="flex items-center gap-2">
        <Badge variant={estadoVariants[proyecto.estado] as any}>
          {proyecto.estado}
        </Badge>
        {proyecto.clasificacion && (
          <Badge variant="outline">
            {proyecto.clasificacion}
          </Badge>
        )}
        <Badge variant="outline" className="font-mono">
          {proyecto.metodoGestion}
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
              <p className="text-base font-mono">{proyecto.codigo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre</p>
              <p className="text-base">{proyecto.nombre}</p>
            </div>
            {proyecto.descripcion && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Descripción</p>
                <p className="text-base">{proyecto.descripcion}</p>
              </div>
            )}
            {proyecto.coordinacion && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Coordinación</p>
                <p className="text-base">{proyecto.coordinacion}</p>
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
            {proyecto.coordinadorId && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Coordinador</p>
                <p className="text-base">ID: {proyecto.coordinadorId}</p>
              </div>
            )}
            {proyecto.scrumMasterId && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Scrum Master</p>
                <p className="text-base">ID: {proyecto.scrumMasterId}</p>
              </div>
            )}
            {proyecto.areaUsuaria && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Área Usuaria (Patrocinador)</p>
                <p className="text-base">
                  {proyecto.areaUsuaria.nombre} {proyecto.areaUsuaria.apellido}
                </p>
              </div>
            )}
            {!proyecto.coordinadorId && !proyecto.scrumMasterId && !proyecto.areaUsuaria && (
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
            {proyecto.fechaInicio && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha de Inicio</p>
                <p className="text-base">
                  {new Date(proyecto.fechaInicio).toLocaleDateString('es-PE', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}
            {proyecto.fechaFin && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha de Fin</p>
                <p className="text-base">
                  {new Date(proyecto.fechaFin).toLocaleDateString('es-PE', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha de Creación</p>
              <p className="text-base">
                {new Date(proyecto.createdAt).toLocaleDateString('es-PE', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            {proyecto.updatedAt && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Última Actualización</p>
                <p className="text-base">
                  {new Date(proyecto.updatedAt).toLocaleDateString('es-PE', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}
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
            {proyecto.montoAnual ? (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monto Total</p>
                <p className="text-2xl font-bold">
                  S/ {proyecto.montoAnual.toLocaleString('es-PE')}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Sin presupuesto asignado</p>
            )}
            {proyecto.anios && proyecto.anios.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Años</p>
                <div className="flex gap-2 flex-wrap">
                  {proyecto.anios.map((anio) => (
                    <Badge key={anio} variant="secondary">
                      {anio}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {proyecto.areasFinancieras && proyecto.areasFinancieras.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Áreas Financieras</p>
                <div className="flex gap-2 flex-wrap">
                  {proyecto.areasFinancieras.map((area) => (
                    <Badge key={area} variant="outline">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subproyectos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Subproyectos
          </CardTitle>
          <PermissionGate module={MODULES.POI} permission={PERMISSIONS.CREATE}>
            <Button asChild size="sm">
              <Link href={`${paths.poi.subproyectos.nuevo}?proyectoPadreId=${proyecto.id}`}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Subproyecto
              </Link>
            </Button>
          </PermissionGate>
        </CardHeader>
        <CardContent>
          {subproyectos.length > 0 ? (
            <div className="space-y-2">
              {subproyectos.map((subproyecto) => (
                <div
                  key={subproyecto.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <Link
                      href={`/poi/subproyecto/detalles?id=${subproyecto.id}`}
                      className="font-medium hover:underline"
                    >
                      {subproyecto.codigo} - {subproyecto.nombre}
                    </Link>
                    {subproyecto.descripcion && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {subproyecto.descripcion}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={estadoVariants[subproyecto.estado] as any}>
                      {subproyecto.estado}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FolderTree className="mx-auto h-12 w-12 mb-2 opacity-50" />
              <p>Este proyecto no tiene subproyectos</p>
              <PermissionGate module={MODULES.POI} permission={PERMISSIONS.CREATE}>
                <Button asChild variant="outline" className="mt-4">
                  <Link href={`${paths.poi.subproyectos.nuevo}?proyectoPadreId=${proyecto.id}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear el primer subproyecto
                  </Link>
                </Button>
              </PermissionGate>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enlaces rápidos a secciones del proyecto */}
      <Card>
        <CardHeader>
          <CardTitle>Secciones del Proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8">
            <Button variant="outline" asChild>
              <Link href={paths.poi.proyectos.sprints(proyecto.id)}>
                Sprints
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={paths.poi.proyectos.backlog(proyecto.id)}>
                Backlog
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={paths.poi.proyectos.tablero(proyecto.id)}>
                Tablero
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={paths.poi.proyectos.epicas(proyecto.id)}>
                Épicas
              </Link>
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <Link href={paths.poi.proyectos.requerimientos(proyecto.id)}>
                <FileText className="h-4 w-4" />
                Requerimientos
              </Link>
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <Link href={paths.poi.proyectos.documentos(proyecto.id)}>
                <FolderOpen className="h-4 w-4" />
                Documentos
              </Link>
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <Link href={paths.poi.proyectos.actas(proyecto.id)}>
                <ClipboardList className="h-4 w-4" />
                Actas
              </Link>
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <Link href={paths.poi.proyectos.informes(proyecto.id)}>
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
