import { PermissionGate } from '@/features/auth';
import { ProyectoForm } from '@/features/proyectos';
import { MODULES, PERMISSIONS } from '@/lib/definitions';

export const metadata = {
  title: 'Nuevo Proyecto | SIGP',
  description: 'Crear nuevo proyecto POI',
};

export default function NuevoProyectoPage() {
  return (
    <PermissionGate
      module={MODULES.POI}
      permission={PERMISSIONS.CREATE}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Proyecto</h1>
          <p className="text-muted-foreground">
            Crea un nuevo proyecto POI con metodología Scrum
          </p>
        </div>

        {/* Form */}
        <ProyectoForm mode="create" />
      </div>
    </PermissionGate>
  );
}
