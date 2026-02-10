import { PermissionGate } from '@/features/auth';
import { SubproyectoForm } from '@/features/subproyectos';
import { MODULES, PERMISSIONS } from '@/lib/definitions';

export const metadata = {
  title: 'Nuevo Subproyecto | SIGP',
  description: 'Crear nuevo subproyecto POI',
};

export default function NuevoSubproyectoPage() {
  return (
    <PermissionGate
      module={MODULES.POI}
      permission={PERMISSIONS.CREATE}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Subproyecto</h1>
          <p className="text-muted-foreground">
            Crea un nuevo subproyecto POI con metodologia Scrum
          </p>
        </div>

        {/* Form */}
        <SubproyectoForm mode="create" />
      </div>
    </PermissionGate>
  );
}
