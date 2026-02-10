import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate } from '@/features/auth';
import { SubproyectoList, getSubproyectos } from '@/features/subproyectos';
import { MODULES, PERMISSIONS } from '@/lib/definitions';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subproyectos | SIGP',
  description: 'Gestión de subproyectos POI',
};

export default async function SubproyectosPage() {
  // Obtener todos los subproyectos activos
  const { data: subproyectos } = await getSubproyectos({ activo: true });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subproyectos</h1>
          <p className="text-muted-foreground">
            Gestiona los subproyectos del POI
          </p>
        </div>

        <PermissionGate module={MODULES.POI} permission={PERMISSIONS.CREATE}>
          <Button asChild>
            <Link href="/poi/subproyectos/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Subproyecto
            </Link>
          </Button>
        </PermissionGate>
      </div>

      {/* Lista de subproyectos */}
      <Suspense fallback={<div>Cargando...</div>}>
        <SubproyectoList data={subproyectos} />
      </Suspense>
    </div>
  );
}
