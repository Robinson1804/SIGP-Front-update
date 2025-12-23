# Módulo de Informes - Documentación

## Descripción General

El módulo de informes gestiona la creación, visualización y aprobación de informes de Sprint (Scrum) e Informes de Actividad (Kanban). Se integra con el módulo de aprobaciones para manejar los flujos de revisión.

## Ubicación

```
src/features/informes/
├── components/           # Componentes de UI
│   ├── InformeSprintView.tsx
│   ├── InformeActividadView.tsx
│   └── index.ts
├── hooks/               # Custom hooks
│   ├── use-informes.ts
│   └── index.ts
├── services/            # API services
│   ├── informes.service.ts
│   └── index.ts
├── types/               # TypeScript types
│   └── index.ts
└── index.ts            # Barrel export
```

## Tipos de Informes

### 1. Informe de Sprint (Scrum)

Generado al finalizar cada sprint, contiene:

**Métricas:**
- Historias completadas vs planeadas
- Puntos completados vs planeados
- Velocidad del equipo
- Duración del sprint

**Contenido:**
- Objetivo del sprint
- Resumen ejecutivo
- Logros alcanzados
- Desafíos enfrentados
- Lecciones aprendidas
- Próximos pasos

**Flujo de Aprobación:**
```
Scrum Master (crea) → Coordinador → PMO
```

### 2. Informe de Actividad (Kanban)

Generado periódicamente (mensual/trimestral):

**Métricas:**
- Tareas completadas
- Tareas pendientes
- Porcentaje de avance
- Lead Time (días promedio)
- Cycle Time (días promedio)
- Throughput (tareas por periodo)

**Contenido:**
- Resumen del periodo
- Actividades realizadas
- Dificultades encontradas
- Recomendaciones

**Flujo de Aprobación:**
```
Coordinador (crea) → PMO
```

## Componentes

### InformeSprintView

Vista completa de un informe de sprint con integración de aprobaciones.

**Props:**
```typescript
interface InformeSprintViewProps {
  informe: InformeSprint;
  onAprobacionChange?: () => void;  // Callback cuando cambia aprobación
  className?: string;
}
```

**Características:**
- Muestra todas las métricas del sprint
- Timeline de aprobación en sidebar
- Botones de acción según permisos
- Layout responsive (3 columnas en desktop)

**Uso:**
```tsx
import { InformeSprintView } from '@/features/informes';

export default function InformePage({ params }: { params: { id: string } }) {
  const { informe, refetch } = useInformeSprint({
    informeId: parseInt(params.id),
  });

  if (!informe) return <div>Cargando...</div>;

  return (
    <InformeSprintView
      informe={informe}
      onAprobacionChange={refetch}
    />
  );
}
```

### InformeActividadView

Vista completa de un informe de actividad con integración de aprobaciones.

**Props:**
```typescript
interface InformeActividadViewProps {
  informe: InformeActividad;
  onAprobacionChange?: () => void;
  className?: string;
}
```

**Características:**
- Muestra métricas Kanban (Lead Time, Throughput)
- Timeline de aprobación en sidebar
- Botones de acción según permisos
- Layout responsive

**Uso:**
```tsx
import { InformeActividadView } from '@/features/informes';

<InformeActividadView
  informe={informe}
  onAprobacionChange={() => refetch()}
/>
```

## Hooks

### useInformeSprint

Hook para gestionar un informe de sprint.

**Parámetros:**
```typescript
interface UseInformeSprintOptions {
  informeId?: number;    // Cargar por ID de informe
  sprintId?: number;     // Cargar por ID de sprint
  autoFetch?: boolean;   // Default: true
}
```

**Retorno:**
```typescript
interface UseInformeSprintReturn {
  informe: InformeSprint | null;
  isLoading: boolean;
  error: Error | null;
  crear: (data: CreateInformeSprintInput) => Promise<InformeSprint | null>;
  actualizar: (data: UpdateInformeSprintInput) => Promise<InformeSprint | null>;
  generar: (sprintId: number) => Promise<InformeSprint | null>;  // Generación automática
  refetch: () => Promise<void>;
}
```

**Ejemplo - Cargar informe existente:**
```tsx
const { informe, actualizar, isLoading } = useInformeSprint({
  informeId: 123,
});

const handleActualizar = async () => {
  await actualizar({
    id: 123,
    resumen: 'Resumen actualizado...',
  });
};
```

**Ejemplo - Generar informe automático:**
```tsx
const { generar, isLoading } = useInformeSprint({
  autoFetch: false,
});

const handleGenerar = async () => {
  const nuevoInforme = await generar(sprintId);
  if (nuevoInforme) {
    router.push(`/informes/${nuevoInforme.id}`);
  }
};
```

### useInformesActividad

Hook para gestionar informes de una actividad.

**Parámetros:**
```typescript
interface UseInformesActividadOptions {
  actividadId: number;
  autoFetch?: boolean;
}
```

**Retorno:**
```typescript
interface UseInformesActividadReturn {
  informes: InformeActividad[];
  isLoading: boolean;
  error: Error | null;
  crear: (data: CreateInformeActividadInput) => Promise<InformeActividad | null>;
  actualizar: (data: UpdateInformeActividadInput) => Promise<InformeActividad | null>;
  refetch: () => Promise<void>;
}
```

**Ejemplo:**
```tsx
const { informes, crear } = useInformesActividad({
  actividadId: 456,
});

const handleCrear = async () => {
  await crear({
    actividadId: 456,
    periodo: '2024-12',
    resumen: 'Resumen del mes...',
    actividadesRealizadas: ['Actividad 1', 'Actividad 2'],
    dificultades: ['Dificultad 1'],
    recomendaciones: ['Recomendación 1'],
  });
};
```

## Servicios

### informes.service.ts

**Informes de Sprint:**
```typescript
// CRUD básico
getInformesSprint(): Promise<InformeSprint[]>
getInformeSprint(id): Promise<InformeSprint>
getInformeBySprint(sprintId): Promise<InformeSprint | null>
createInformeSprint(data): Promise<InformeSprint>
updateInformeSprint(id, data): Promise<InformeSprint>
deleteInformeSprint(id): Promise<void>

// Generación automática
generarInformeSprint({ sprintId }): Promise<GenerarInformeResponse>
```

**Informes de Actividad:**
```typescript
getInformesActividad(): Promise<InformeActividad[]>
getInformeActividad(id): Promise<InformeActividad>
getInformesByActividad(actividadId): Promise<InformeActividad[]>
createInformeActividad(data): Promise<InformeActividad>
updateInformeActividad(id, data): Promise<InformeActividad>
deleteInformeActividad(id): Promise<void>
```

## Endpoints Backend

Definidos en `src/lib/api/endpoints.ts`:

```typescript
INFORMES: {
  SPRINT: {
    BASE: '/informes-sprint',
    BY_ID: (id) => `/informes-sprint/${id}`,
    BY_SPRINT: (sprintId) => `/sprints/${sprintId}/informe`,
    GENERAR: (sprintId) => `/sprints/${sprintId}/generar-informe`,
    APROBAR: (id) => `/informes-sprint/${id}/aprobar`,
    RECHAZAR: (id) => `/informes-sprint/${id}/rechazar`,
    HISTORIAL: (id) => `/informes-sprint/${id}/historial`,
  },
  ACTIVIDAD: {
    BASE: '/informes-actividad',
    BY_ID: (id) => `/informes-actividad/${id}`,
    BY_ACTIVIDAD: (actividadId) => `/actividades/${actividadId}/informes`,
    APROBAR: (id) => `/informes-actividad/${id}/aprobar`,
    RECHAZAR: (id) => `/informes-actividad/${id}/rechazar`,
    HISTORIAL: (id) => `/informes-actividad/${id}/historial`,
  },
}
```

## Integración con Aprobaciones

Los componentes de vista (`InformeSprintView`, `InformeActividadView`) integran automáticamente:

1. **useAprobacion hook** - Gestiona el flujo
2. **AprobacionTimeline** - Muestra progreso
3. **AprobacionActions** - Botones aprobar/rechazar
4. **AprobacionBadge** - Estado visual

```tsx
// Dentro de InformeSprintView.tsx
const {
  flujo,
  aprobar,
  rechazar,
  enviar,
  isLoading: isAprobacionLoading,
} = useAprobacion({
  tipo: 'informe_sprint',
  entidadId: informe.id,
});

// Wrapper para recargar datos después de aprobar/rechazar
const handleAprobacionSuccess = async (
  action: (arg?: string) => Promise<boolean>
) => {
  return async (arg?: string) => {
    const success = await action(arg);
    if (success && onAprobacionChange) {
      onAprobacionChange();  // Recargar informe
    }
    return success;
  };
};

// Render
<AprobacionActions
  flujo={flujo}
  onAprobar={handleAprobacionSuccess(aprobar)}
  onRechazar={handleAprobacionSuccess(rechazar)}
  onEnviar={enviar}
  isLoading={isAprobacionLoading}
/>
```

## Ejemplo Completo: Página de Informe de Sprint

```tsx
// app/(dashboard)/poi/proyecto/[proyectoId]/informes/[id]/page.tsx

import { InformeSprintView } from '@/features/informes';
import { getInformeSprint } from '@/features/informes/services';

interface PageProps {
  params: { id: string };
}

export default async function InformeSprintPage({ params }: PageProps) {
  const informe = await getInformeSprint(parseInt(params.id));

  return (
    <div className="container mx-auto py-6">
      <InformeSprintViewWrapper informe={informe} />
    </div>
  );
}

// Client component para manejar refetch
'use client';

function InformeSprintViewWrapper({ informe: initialInforme }) {
  const { informe, refetch } = useInformeSprint({
    informeId: initialInforme.id,
    autoFetch: false,  // Ya tenemos datos iniciales
  });

  return (
    <InformeSprintView
      informe={informe || initialInforme}
      onAprobacionChange={refetch}
    />
  );
}
```

## Generación Automática de Informes

El sistema puede generar informes automáticamente basándose en métricas:

```tsx
import { generarInformeSprint } from '@/features/informes/services';

// En página de finalización de sprint
const handleFinalizarSprint = async () => {
  // 1. Cerrar sprint
  await completarSprint(sprintId);

  // 2. Generar informe automático
  const response = await generarInformeSprint({ sprintId });

  // 3. Navegar al informe generado
  router.push(`/informes/${response.informe.id}`);
};
```

El backend calculará automáticamente:
- Historias completadas vs planeadas
- Puntos completados vs planeados
- Velocidad del equipo
- Métricas de tiempo

El Scrum Master debe completar manualmente:
- Resumen ejecutivo
- Logros, desafíos, lecciones
- Próximos pasos

## Validación de Datos

**Informe de Sprint:**
```typescript
{
  sprintId: number;                    // Requerido
  resumen: string;                     // Requerido, min 50 caracteres
  logrosAlcanzados: string[];          // Array no vacío
  desafiosEnfrentados: string[];       // Array no vacío
  leccionesAprendidas: string[];       // Array no vacío
  proximosPasos: string[];             // Array no vacío
}
```

**Informe de Actividad:**
```typescript
{
  actividadId: number;                 // Requerido
  periodo: string;                     // "YYYY-MM" o "YYYY-Qn"
  resumen: string;                     // Requerido, min 50 caracteres
  actividadesRealizadas: string[];     // Array no vacío
  dificultades: string[];              // Array no vacío
  recomendaciones: string[];           // Array no vacío
}
```

## Estados del Informe

Los informes heredan los estados del flujo de aprobación:

1. **borrador** - Recién creado, editable
2. **pendiente_coordinador** - En revisión del coordinador
3. **pendiente_pmo** - En revisión del PMO
4. **aprobado** - Aprobado, no editable
5. **rechazado** - Rechazado, requiere correcciones

## Permisos

**Crear Informe de Sprint:**
- Scrum Master del proyecto

**Crear Informe de Actividad:**
- Coordinador de la actividad

**Aprobar:**
- Coordinador (primer nivel)
- PMO (segundo nivel)

**Ver:**
- Todos los usuarios con acceso al POI

## Mejores Prácticas

1. **Generar automáticamente**: Use `generarInformeSprint()` para obtener métricas
2. **Completar manualmente**: Agregue contexto y análisis cualitativo
3. **Revisar antes de enviar**: Valide que todos los campos estén completos
4. **Adjuntar evidencias**: Link a documentos, capturas, etc.
5. **Ser específico**: Evite generalidades, use datos concretos

## Notas Importantes

- Los informes **NO son editables** una vez aprobados
- Las métricas se calculan al momento de creación
- El periodo de Actividad debe ser único por actividad
- Solo puede haber **un informe por sprint**
