# Quick Start - Módulo de Aprobaciones

Guía rápida para usar el módulo de aprobaciones en el proyecto SIGP.

## Instalación

No requiere instalación. Los módulos ya están creados en `src/features/`.

## Caso de Uso 1: Agregar Aprobación a un Documento Existente

### Paso 1: Importar componentes

```tsx
'use client';

import {
  AprobacionTimeline,
  AprobacionActions,
  AprobacionBadge,
  useAprobacion,
} from '@/features/aprobaciones';
```

### Paso 2: Usar el hook

```tsx
function DocumentoView({ documento }) {
  const {
    flujo,
    aprobar,
    rechazar,
    enviar,
    isLoading,
  } = useAprobacion({
    tipo: 'acta_constitucion', // o 'acta_reunion', 'informe_sprint', 'informe_actividad'
    entidadId: documento.id,
  });

  if (!flujo) return <div>Cargando...</div>;

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Contenido principal */}
      <div className="col-span-2">
        <h1>{documento.titulo}</h1>
        <AprobacionBadge estado={flujo.estadoActual} />
        {/* ... resto del contenido ... */}
      </div>

      {/* Sidebar de aprobación */}
      <div className="space-y-4">
        <AprobacionTimeline flujo={flujo} />
        <AprobacionActions
          flujo={flujo}
          onAprobar={aprobar}
          onRechazar={rechazar}
          onEnviar={enviar}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
```

## Caso de Uso 2: Panel de Pendientes en Dashboard

```tsx
import { PendientesPanel } from '@/features/aprobaciones';

export default function DashboardPage() {
  return (
    <div className="container">
      <h1>Dashboard</h1>

      <div className="grid grid-cols-2 gap-6">
        {/* Otros widgets */}
        <div>...</div>

        {/* Panel de pendientes */}
        <PendientesPanel />
      </div>
    </div>
  );
}
```

## Caso de Uso 3: Vista de Informe de Sprint

```tsx
import { InformeSprintView } from '@/features/informes';
import { getInformeSprint } from '@/features/informes/services';

export default async function InformePage({ params }) {
  const informe = await getInformeSprint(params.id);

  return (
    <div className="container py-6">
      <InformeSprintView
        informe={informe}
        onAprobacionChange={() => {
          // Revalidar o refetch
        }}
      />
    </div>
  );
}
```

## Caso de Uso 4: Crear Informe Automáticamente

```tsx
'use client';

import { generarInformeSprint } from '@/features/informes/services';
import { useRouter } from 'next/navigation';

function FinalizarSprintButton({ sprintId }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerar = async () => {
    setIsLoading(true);
    try {
      const response = await generarInformeSprint({ sprintId });
      router.push(`/informes/${response.informe.id}`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button onClick={handleGenerar} disabled={isLoading}>
      {isLoading ? 'Generando...' : 'Generar Informe'}
    </button>
  );
}
```

## Caso de Uso 5: Custom Navigation en Pendientes

```tsx
import { PendientesPanel } from '@/features/aprobaciones';
import { useRouter } from 'next/navigation';

function MisPendientes() {
  const router = useRouter();

  return (
    <PendientesPanel
      onItemClick={(pendiente) => {
        // Navegación personalizada
        switch (pendiente.tipo) {
          case 'acta_constitucion':
            router.push(`/actas/constitucion/${pendiente.id}`);
            break;
          case 'informe_sprint':
            router.push(`/informes/sprint/${pendiente.id}`);
            break;
          // ...
        }
      }}
    />
  );
}
```

## Tipos Disponibles

```typescript
// Estados
type EstadoAprobacion =
  | 'borrador'
  | 'pendiente_coordinador'
  | 'pendiente_pmo'
  | 'pendiente_patrocinador'
  | 'aprobado'
  | 'rechazado';

// Tipos de entidad
type TipoEntidadAprobacion =
  | 'acta_constitucion'
  | 'acta_reunion'
  | 'informe_sprint'
  | 'informe_actividad';
```

## Hooks Disponibles

### useAprobacion

```typescript
const {
  flujo,           // FlujoAprobacion | null
  historial,       // HistorialAprobacion[]
  aprobar,         // (comentario?: string) => Promise<boolean>
  rechazar,        // (motivo: string) => Promise<boolean>
  enviar,          // () => Promise<boolean>
  isLoading,       // boolean
  error,           // Error | null
  refetch,         // () => Promise<void>
} = useAprobacion({
  tipo: 'informe_sprint',
  entidadId: 123,
  autoFetch: true,  // default
});
```

### useInformeSprint

```typescript
const {
  informe,         // InformeSprint | null
  crear,           // (data) => Promise<InformeSprint | null>
  actualizar,      // (data) => Promise<InformeSprint | null>
  generar,         // (sprintId) => Promise<InformeSprint | null>
  isLoading,
  error,
  refetch,
} = useInformeSprint({
  informeId: 123,
  // o
  sprintId: 456,
});
```

### useInformesActividad

```typescript
const {
  informes,        // InformeActividad[]
  crear,           // (data) => Promise<InformeActividad | null>
  actualizar,      // (data) => Promise<InformeActividad | null>
  isLoading,
  error,
  refetch,
} = useInformesActividad({
  actividadId: 789,
});
```

## Servicios Disponibles

```typescript
import {
  // Aprobaciones
  aprobar,
  rechazar,
  enviarARevision,
  getMisPendientes,
  getHistorialAprobacion,
  getFlujoAprobacion,
} from '@/features/aprobaciones';

import {
  // Informes Sprint
  getInformeSprint,
  createInformeSprint,
  updateInformeSprint,
  generarInformeSprint,

  // Informes Actividad
  getInformeActividad,
  createInformeActividad,
  updateInformeActividad,
} from '@/features/informes';
```

## Validaciones Automáticas

### Rechazar (obligatorio)
```tsx
// ✅ Válido
await rechazar('El documento no cumple con los estándares establecidos');

// ❌ Inválido (menos de 10 caracteres)
await rechazar('No');
```

### Aprobar (opcional)
```tsx
// ✅ Válido
await aprobar('Aprobado correctamente');
await aprobar(); // Sin comentario
```

## Permisos

El sistema valida automáticamente:

- **Scrum Master**: Puede crear informes de sprint
- **Coordinador**: Puede aprobar (nivel 1) y crear informes de actividad
- **PMO**: Puede aprobar (nivel 2)
- **Patrocinador**: Puede aprobar actas de constitución

## Debugging

### Ver flujo en consola
```tsx
const { flujo } = useAprobacion({ tipo, entidadId });

useEffect(() => {
  console.log('Flujo actual:', flujo);
}, [flujo]);
```

### Ver errores
```tsx
const { error } = useAprobacion({ tipo, entidadId });

if (error) {
  console.error('Error de aprobación:', error);
}
```

## Tips

1. **Usar onAprobacionChange**: Recarga datos después de aprobar/rechazar
2. **Validar estado**: Verifica `flujo.puedeAprobar` antes de mostrar botones
3. **Loading states**: Usa `isLoading` para deshabilitar botones
4. **Toast automático**: Los hooks ya muestran feedback
5. **Permisos**: Usa `PermissionGate` para UI condicional

## Ejemplos Completos

Ver:
- `docs/features/APROBACIONES_MODULE.md` - Documentación detallada
- `docs/features/INFORMES_MODULE.md` - Informes con ejemplos
- `src/features/informes/components/InformeSprintView.tsx` - Ejemplo real
