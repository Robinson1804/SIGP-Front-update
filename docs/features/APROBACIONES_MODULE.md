# Módulo de Aprobaciones - Documentación

## Descripción General

El módulo de aprobaciones gestiona los flujos de aprobación para diferentes entidades del sistema SIGP (Actas e Informes). Implementa una arquitectura feature-based siguiendo los patrones del proyecto.

## Ubicación

```
src/features/aprobaciones/
├── components/           # Componentes de UI
│   ├── AprobacionBadge.tsx
│   ├── AprobacionTimeline.tsx
│   ├── AprobacionActions.tsx
│   ├── AprobacionModal.tsx
│   ├── PendientesPanel.tsx
│   └── index.ts
├── hooks/               # Custom hooks
│   ├── use-aprobacion.ts
│   └── index.ts
├── services/            # API services
│   ├── aprobacion.service.ts
│   └── index.ts
├── types/               # TypeScript types
│   └── index.ts
└── index.ts            # Barrel export
```

## Flujos Implementados

### 1. Acta de Constitución
```
Scrum Master → Coordinador → Patrocinador
```

### 2. Acta de Reunión
```
Scrum Master → Coordinador → PMO
```

### 3. Informe de Sprint
```
Scrum Master → Coordinador → PMO
```

### 4. Informe de Actividad
```
Coordinador → PMO
```

## Estados de Aprobación

```typescript
type EstadoAprobacion =
  | 'borrador'                  // Estado inicial
  | 'pendiente_coordinador'     // Esperando aprobación del coordinador
  | 'pendiente_pmo'             // Esperando aprobación del PMO
  | 'pendiente_patrocinador'    // Esperando aprobación del patrocinador
  | 'aprobado'                  // Aprobación completada
  | 'rechazado';                // Rechazado en algún paso
```

## Tipos de Entidades

```typescript
type TipoEntidadAprobacion =
  | 'acta_constitucion'
  | 'acta_reunion'
  | 'informe_sprint'
  | 'informe_actividad';
```

## Componentes

### AprobacionBadge

Badge visual para mostrar el estado de aprobación.

**Props:**
- `estado: EstadoAprobacion` - Estado actual
- `compact?: boolean` - Versión compacta
- `className?: string` - Clases CSS adicionales

**Uso:**
```tsx
import { AprobacionBadge } from '@/features/aprobaciones';

<AprobacionBadge estado="pendiente_coordinador" />
<AprobacionBadge estado="aprobado" compact />
```

### AprobacionTimeline

Timeline visual que muestra el progreso del flujo de aprobación.

**Props:**
- `flujo: FlujoAprobacion` - Datos del flujo
- `className?: string` - Clases CSS adicionales

**Características:**
- Muestra todos los pasos del flujo
- Indica paso actual con animación
- Muestra fechas y aprobadores
- Colores según estado (verde/amarillo/rojo)

**Uso:**
```tsx
import { AprobacionTimeline } from '@/features/aprobaciones';

<AprobacionTimeline flujo={flujo} />
```

### AprobacionActions

Botones de acción para aprobar/rechazar entidades.

**Props:**
- `flujo: FlujoAprobacion` - Datos del flujo
- `onAprobar: (comentario?: string) => Promise<boolean>` - Handler aprobar
- `onRechazar: (motivo: string) => Promise<boolean>` - Handler rechazar
- `onEnviar?: () => Promise<boolean>` - Handler enviar a revisión
- `isLoading?: boolean` - Estado de carga
- `className?: string` - Clases CSS adicionales

**Características:**
- Valida permisos automáticamente
- Deshabilita botones según estado
- Muestra modal de confirmación
- Toast de feedback

**Uso:**
```tsx
import { AprobacionActions } from '@/features/aprobaciones';

<AprobacionActions
  flujo={flujo}
  onAprobar={async (comentario) => {
    const success = await aprobar(comentario);
    return success;
  }}
  onRechazar={async (motivo) => {
    const success = await rechazar(motivo);
    return success;
  }}
  onEnviar={enviar}
/>
```

### AprobacionModal

Modal para confirmar aprobación o rechazo.

**Props:**
- `isOpen: boolean` - Control de visibilidad
- `onClose: () => void` - Handler cierre
- `action: 'aprobar' | 'rechazar'` - Tipo de acción
- `onConfirm: (value: string) => Promise<boolean>` - Handler confirmación

**Validaciones:**
- Aprobar: Comentario opcional
- Rechazar: Motivo obligatorio (min 10 caracteres, max 500)

**Uso:**
```tsx
import { AprobacionModal } from '@/features/aprobaciones';

const [modalOpen, setModalOpen] = useState(false);
const [action, setAction] = useState<'aprobar' | 'rechazar'>('aprobar');

<AprobacionModal
  isOpen={modalOpen}
  onClose={() => setModalOpen(false)}
  action={action}
  onConfirm={async (value) => {
    // value = comentario si aprobar, motivo si rechazar
    const success = await handleAction(value);
    if (success) setModalOpen(false);
    return success;
  }}
/>
```

### PendientesPanel

Panel que muestra las entidades pendientes de aprobación del usuario.

**Props:**
- `className?: string` - Clases CSS adicionales
- `onItemClick?: (pendiente: PendienteAprobacion) => void` - Handler click

**Características:**
- Carga automática de pendientes
- Filtro por tipo de entidad
- Navegación automática
- Contador de pendientes

**Uso:**
```tsx
import { PendientesPanel } from '@/features/aprobaciones';

// Navegación automática
<PendientesPanel />

// Navegación custom
<PendientesPanel
  onItemClick={(pendiente) => {
    router.push(`/custom/${pendiente.id}`);
  }}
/>
```

## Hooks

### useAprobacion

Hook principal para gestionar flujos de aprobación.

**Parámetros:**
```typescript
interface UseAprobacionOptions {
  tipo: TipoEntidadAprobacion;
  entidadId: number;
  autoFetch?: boolean;  // Default: true
}
```

**Retorno:**
```typescript
interface UseAprobacionReturn {
  // Estado
  flujo: FlujoAprobacion | null;
  historial: HistorialAprobacion[];
  isLoading: boolean;
  error: Error | null;

  // Acciones
  aprobar: (comentario?: string) => Promise<boolean>;
  rechazar: (motivo: string) => Promise<boolean>;
  enviar: () => Promise<boolean>;
  refetch: () => Promise<void>;
}
```

**Uso:**
```tsx
import { useAprobacion } from '@/features/aprobaciones';

function InformeView({ informeId }: { informeId: number }) {
  const {
    flujo,
    historial,
    aprobar,
    rechazar,
    enviar,
    isLoading,
    refetch,
  } = useAprobacion({
    tipo: 'informe_sprint',
    entidadId: informeId,
  });

  const handleAprobar = async () => {
    const success = await aprobar('Aprobado correctamente');
    if (success) {
      // Actualizar UI
    }
  };

  const handleRechazar = async () => {
    const success = await rechazar('No cumple con los requisitos');
    if (success) {
      // Actualizar UI
    }
  };

  return (
    <div>
      {flujo && (
        <>
          <AprobacionTimeline flujo={flujo} />
          <AprobacionActions
            flujo={flujo}
            onAprobar={aprobar}
            onRechazar={rechazar}
            onEnviar={enviar}
            isLoading={isLoading}
          />
        </>
      )}
    </div>
  );
}
```

## Servicios

### aprobacion.service.ts

**Funciones disponibles:**

```typescript
// Obtener historial
getHistorialAprobacion(tipo, entidadId): Promise<HistorialAprobacion[]>

// Obtener flujo actual
getFlujoAprobacion(tipo, entidadId): Promise<FlujoAprobacion>

// Aprobar entidad
aprobar(tipo, entidadId, { comentario? }): Promise<AprobacionResponse>

// Rechazar entidad
rechazar(tipo, entidadId, { motivo }): Promise<AprobacionResponse>

// Enviar a revisión (iniciar flujo)
enviarARevision(tipo, entidadId): Promise<AprobacionResponse>

// Obtener pendientes del usuario actual
getMisPendientes(): Promise<PendienteAprobacion[]>

// Obtener todos los pendientes (solo PMO)
getPendientesAprobacion(): Promise<PendienteAprobacion[]>

// Contador de pendientes
getContadorPendientes(): Promise<number>
```

## Integración con Backend

Los endpoints están definidos en `src/lib/api/endpoints.ts`:

```typescript
APROBACIONES: {
  PENDIENTES: '/aprobaciones/pendientes',
  HISTORIAL: (tipo, id) => `/aprobaciones/${tipo}/${id}/historial`,
  APROBAR: (tipo, id) => `/aprobaciones/${tipo}/${id}/aprobar`,
  RECHAZAR: (tipo, id) => `/aprobaciones/${tipo}/${id}/rechazar`,
  MIS_PENDIENTES: '/aprobaciones/mis-pendientes',
}
```

## Ejemplo Completo: Integración en Vista de Informe

```tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AprobacionTimeline,
  AprobacionActions,
  AprobacionBadge,
  useAprobacion,
} from '@/features/aprobaciones';
import type { InformeSprint } from '@/features/informes';

interface InformeSprintPageProps {
  informe: InformeSprint;
  onUpdate: () => void;
}

export function InformeSprintPage({ informe, onUpdate }: InformeSprintPageProps) {
  const {
    flujo,
    aprobar,
    rechazar,
    enviar,
    isLoading,
  } = useAprobacion({
    tipo: 'informe_sprint',
    entidadId: informe.id,
  });

  const handleAprobacionSuccess = async (
    action: (arg?: string) => Promise<boolean>
  ) => {
    return async (arg?: string) => {
      const success = await action(arg);
      if (success) {
        onUpdate(); // Recargar datos
      }
      return success;
    };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Contenido principal */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Informe de Sprint</h1>
          <AprobacionBadge estado={informe.estadoAprobacion} />
        </div>

        {/* ... resto del contenido del informe ... */}
      </div>

      {/* Sidebar de aprobación */}
      <div className="space-y-6">
        {flujo && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Flujo de Aprobación</CardTitle>
              </CardHeader>
              <CardContent>
                <AprobacionTimeline flujo={flujo} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent>
                <AprobacionActions
                  flujo={flujo}
                  onAprobar={handleAprobacionSuccess(aprobar)}
                  onRechazar={handleAprobacionSuccess(rechazar)}
                  onEnviar={enviar}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
```

## Validaciones y Permisos

El sistema valida automáticamente:

1. **Permisos de usuario**: Solo usuarios autorizados pueden aprobar/rechazar
2. **Estado de la entidad**: Solo se puede aprobar/rechazar en estados válidos
3. **Motivo de rechazo**: Es obligatorio y debe tener min 10 caracteres
4. **Comentario de aprobación**: Es opcional

## Toast Notifications

El hook `useAprobacion` muestra automáticamente toasts:

- ✅ Éxito: Al aprobar, rechazar o enviar
- ❌ Error: Cuando falla una operación
- ⚠️ Advertencia: Si no tiene permisos

## Manejo de Errores

```tsx
const { error } = useAprobacion({ tipo, entidadId });

if (error) {
  return <div>Error: {error.message}</div>;
}
```

## Testing

Para testear el módulo:

1. **Crear entidad en borrador**
2. **Enviar a revisión**: Cambia a `pendiente_coordinador`
3. **Aprobar como coordinador**: Cambia a `pendiente_pmo`
4. **Aprobar como PMO**: Cambia a `aprobado`
5. **Rechazar**: En cualquier paso cambia a `rechazado`

## Notas Importantes

1. El **motivo de rechazo es OBLIGATORIO**
2. Una vez rechazado, no se puede continuar el flujo
3. Los estados son **unidireccionales** (no se puede retroceder)
4. Solo el **rol apropiado** puede aprobar en cada paso
5. El historial se mantiene para auditoría

## Dependencias

- `@/lib/api/client` - Cliente HTTP
- `@/lib/hooks/use-toast` - Toast notifications
- `@/components/ui/*` - shadcn/ui components
- `lucide-react` - Iconos
- `react-hook-form` + `zod` - Validación de formularios
