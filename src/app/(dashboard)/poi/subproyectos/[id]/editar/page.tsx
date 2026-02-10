import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate } from '@/features/auth';
import { SubproyectoForm } from '@/features/subproyectos';
import { getSubproyecto } from '@/lib/actions';
import { paths } from '@/lib/paths';
import { MODULES, PERMISSIONS } from '@/lib/definitions';

interface EditarSubproyectoPageProps {
  params: {
    id: string;
  };
}

export const metadata = {
  title: 'Editar Subproyecto | SIGP',
  description: 'Editar subproyecto POI',
};

export default async function EditarSubproyectoPage({
  params,
}: EditarSubproyectoPageProps) {
  const subproyecto = await getSubproyecto(parseInt(params.id));

  if (!subproyecto) {
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
            <Link href={paths.poi.subproyectos.detalles(subproyecto.id)}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Editar: {subproyecto.codigo} - {subproyecto.nombre}
            </h1>
            <p className="text-muted-foreground">
              Modifica los datos del subproyecto POI
            </p>
          </div>
        </div>

        {/* Form */}
        <SubproyectoForm mode="edit" initialData={subproyecto} />
      </div>
    </PermissionGate>
  );
}
