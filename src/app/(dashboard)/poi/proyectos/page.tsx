import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate } from '@/features/auth';
import { ProyectoList } from '@/features/proyectos';
import { getProyectos } from '@/lib/actions';
import { paths } from '@/lib/paths';
import { MODULES, PERMISSIONS } from '@/lib/definitions';

export const metadata = {
  title: 'Proyectos | SIGP',
  description: 'Gestión de proyectos POI',
};

export default async function ProyectosPage() {
  const proyectos = await getProyectos();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proyectos</h1>
          <p className="text-muted-foreground">
            Gestiona los proyectos POI con metodología Scrum
          </p>
        </div>

        <PermissionGate
          module={MODULES.POI}
          permission={PERMISSIONS.CREATE}
        >
          <Button asChild>
            <Link href={paths.poi.proyectos.nuevo}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proyecto
            </Link>
          </Button>
        </PermissionGate>
      </div>

      {/* Lista */}
      <Suspense fallback={<ProyectoListSkeleton />}>
        <ProyectoList data={proyectos} />
      </Suspense>
    </div>
  );
}

function ProyectoListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );
}
