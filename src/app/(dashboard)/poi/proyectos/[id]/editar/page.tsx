import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate } from '@/features/auth';
import { ProyectoForm } from '@/features/proyectos';
import { getProyecto } from '@/lib/actions';
import { paths } from '@/lib/paths';
import { MODULES, PERMISSIONS } from '@/lib/definitions';

interface EditarProyectoPageProps {
  params: {
    id: string;
  };
}

export default async function EditarProyectoPage({
  params,
}: EditarProyectoPageProps) {
  const proyecto = await getProyecto(parseInt(params.id));

  if (!proyecto) {
    notFound();
  }

  return (
    <PermissionGate
      module={MODULES.POI}
      permission={PERMISSIONS.EDIT}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={paths.poi.proyectos.detalles(proyecto.id)}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Proyecto</h1>
            <p className="text-muted-foreground">
              {proyecto.codigo} - {proyecto.nombre}
            </p>
          </div>
        </div>

        {/* Form */}
        <ProyectoForm initialData={proyecto} mode="edit" />
      </div>
    </PermissionGate>
  );
}
