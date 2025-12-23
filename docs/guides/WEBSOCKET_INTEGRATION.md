# Guía de Integración WebSocket

Esta guía explica cómo integrar la funcionalidad de WebSocket en tiempo real en SIGP Frontend.

## Índice
1. [Arquitectura](#arquitectura)
2. [Configuración](#configuración)
3. [Hooks Disponibles](#hooks-disponibles)
4. [Ejemplos de Uso](#ejemplos-de-uso)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Arquitectura

### Componentes Principales

```
WebSocket System
├── socket-client.ts         # Cliente singleton de Socket.IO
├── events.ts               # Definiciones de eventos
├── websocket-context.tsx   # Context Provider
└── hooks/
    ├── use-realtime-notifications.ts
    ├── use-realtime-tablero.ts
    ├── use-realtime-aprobaciones.ts
    └── use-realtime-proyecto.ts
```

### Flujo de Conexión

1. Usuario se autentica → obtiene JWT token
2. `WebSocketProvider` detecta autenticación → conecta con token
3. `socketClient` establece conexión WebSocket con backend
4. Hooks se suscriben a eventos específicos
5. Eventos del servidor → actualizan UI en tiempo real

---

## Configuración

### Variables de Entorno

En `.env.local`:

```env
NEXT_PUBLIC_WS_URL=ws://localhost:3010
```

### Integración en Layout

El `WebSocketProvider` ya está integrado en el layout del dashboard:

```tsx
// src/app/(dashboard)/layout.tsx
import { WebSocketProvider } from '@/contexts/websocket-context';

export default function DashboardLayout({ children }) {
  return (
    <WebSocketProvider>
      <AppLayout>{children}</AppLayout>
    </WebSocketProvider>
  );
}
```

**IMPORTANTE**: El provider está DENTRO del layout protegido porque necesita acceso al token de autenticación.

---

## Hooks Disponibles

### 1. `useRealtimeNotifications`

Recibe notificaciones en tiempo real.

```tsx
import { useRealtimeNotifications } from '@/lib/hooks';
import { useToast } from '@/components/ui/use-toast';

function NotificationListener() {
  const { toast } = useToast();

  useRealtimeNotifications({
    onNotification: (notification) => {
      toast({
        title: notification.titulo,
        description: notification.mensaje,
        variant: notification.tipo === 'error' ? 'destructive' : 'default',
      });
    },
    onCountUpdate: (count) => {
      console.log('Notificaciones pendientes:', count);
    },
  });

  return null; // Este es un listener sin UI
}
```

### 2. `useRealtimeTablero`

Sincroniza tableros Kanban/Scrum en tiempo real.

```tsx
import { useRealtimeTablero } from '@/lib/hooks';

function TableroKanban({ sprintId, tareasIniciales }) {
  const { tareas, moverTarea, isConnected } = useRealtimeTablero({
    tableroId: sprintId,
    tableroTipo: 'sprint',
    initialTareas: tareasIniciales,
    onTareaMovida: (data) => {
      toast.success(`Tarea movida a ${data.nuevoEstado}`);
    },
    onTareaCreada: (data) => {
      toast.info('Nueva tarea creada');
    },
  });

  const handleDragEnd = (tareaId: string, nuevoEstado: string) => {
    // Actualización optimista + broadcast a otros usuarios
    moverTarea(tareaId, nuevoEstado);
  };

  return (
    <DndContext onDragEnd={(e) => handleDragEnd(e.active.id, e.over.id)}>
      {tareas.map(tarea => (
        <TareaCard key={tarea.id} tarea={tarea} />
      ))}
    </DndContext>
  );
}
```

### 3. `useRealtimeAprobaciones`

Gestiona aprobaciones de documentos en tiempo real.

```tsx
import { useRealtimeAprobaciones } from '@/lib/hooks';

function AprobacionesPendientes() {
  const [count, setCount] = useState(0);

  useRealtimeAprobaciones({
    onNuevaAprobacion: (aprobacion) => {
      toast({
        title: 'Nueva aprobación pendiente',
        description: aprobacion.titulo,
        action: <Button onClick={() => navigate(aprobacion.url)}>Ver</Button>,
      });
      setCount(prev => prev + 1);
    },
    onAprobacionCompletada: () => {
      toast.success('Aprobación completada');
      setCount(prev => prev - 1);
    },
  });

  return <Badge variant="destructive">{count}</Badge>;
}
```

### 4. `useRealtimeProyecto`

Escucha eventos de un proyecto específico.

```tsx
import { useRealtimeProyecto } from '@/lib/hooks';

function ProyectoDetail({ proyectoId }) {
  const [proyecto, setProyecto] = useState<Proyecto>();

  useRealtimeProyecto({
    proyectoId,
    onProyectoActualizado: (data) => {
      setProyecto(prev => ({ ...prev, ...data.cambios }));
    },
    onSprintIniciado: (data) => {
      toast.success(`Sprint iniciado`);
      refreshSprints();
    },
    onMiembroAgregado: (data) => {
      toast.info(`${data.miembro.nombre} se unió al proyecto`);
      refreshMiembros();
    },
  });

  return <ProyectoCard proyecto={proyecto} />;
}
```

---

## Ejemplos de Uso

### Ejemplo 1: Header con Indicador de Conexión

```tsx
// src/components/layout/header.tsx
import { ConnectionIndicator } from '@/components/websocket';

function Header() {
  return (
    <header className="flex items-center justify-between">
      <Logo />
      <div className="flex items-center gap-4">
        <NotificationBell />
        <ConnectionIndicator /> {/* Icono WiFi */}
        <UserMenu />
      </div>
    </header>
  );
}
```

### Ejemplo 2: Tablero Scrum con Drag & Drop

```tsx
// src/app/(dashboard)/poi/proyecto/backlog/tablero/page.tsx
'use client';

import { useRealtimeTablero } from '@/lib/hooks';
import { DndContext, DragEndEvent } from '@dnd-kit/core';

export default function TableroSprintPage({ params }) {
  const [tareas, setTareas] = useState([]);

  // Fetch inicial del servidor
  useEffect(() => {
    const fetchTareas = async () => {
      const data = await getTareasDelSprint(params.sprintId);
      setTareas(data);
    };
    fetchTareas();
  }, [params.sprintId]);

  // Sincronización en tiempo real
  const { moverTarea, isConnected } = useRealtimeTablero({
    tableroId: params.sprintId,
    tableroTipo: 'sprint',
    initialTareas: tareas,
    onTareaMovida: (data) => {
      // El hook ya actualiza el estado, solo notificamos
      if (data.movidoPor !== currentUserId) {
        toast.info(`${data.movidoPor} movió una tarea`);
      }
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const tareaId = active.id as string;
    const nuevoEstado = over.id as string;

    moverTarea(tareaId, nuevoEstado);
  };

  return (
    <div>
      <StatusBadge connected={isConnected} />
      <DndContext onDragEnd={handleDragEnd}>
        <Board tareas={tareas} />
      </DndContext>
    </div>
  );
}
```

### Ejemplo 3: Notificaciones Toast Automáticas

```tsx
// src/components/layout/app-layout.tsx
'use client';

import { useRealtimeNotifications } from '@/lib/hooks';
import { useToast } from '@/components/ui/use-toast';

function AppLayout({ children }) {
  const { toast } = useToast();

  // Listener global de notificaciones
  useRealtimeNotifications({
    onNotification: (notification) => {
      toast({
        title: notification.titulo,
        description: notification.mensaje,
        variant: notification.tipo === 'error' ? 'destructive' : 'default',
        action: notification.url ? (
          <Link href={notification.url}>
            <Button variant="outline">Ver</Button>
          </Link>
        ) : undefined,
      });
    },
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

---

## Best Practices

### 1. Usar el Hook Correcto

Cada hook está optimizado para un caso de uso:

- **Notificaciones globales**: `useRealtimeNotifications` en layout/header
- **Tablero específico**: `useRealtimeTablero` en página del tablero
- **Proyecto específico**: `useRealtimeProyecto` en detalle de proyecto
- **Aprobaciones**: `useRealtimeAprobaciones` en módulo de documentos

### 2. Cleanup Automático

Los hooks ya manejan cleanup automáticamente:

```tsx
// ✅ CORRECTO - El hook limpia al desmontar
function MyComponent() {
  useRealtimeTablero({ tableroId, tableroTipo: 'sprint' });
  return <div>...</div>;
}

// ❌ INCORRECTO - No usar subscribe directamente
function MyComponent() {
  const { subscribe } = useWebSocket();

  useEffect(() => {
    subscribe('evento', callback); // Falta cleanup!
  }, []);
}
```

### 3. Manejo de Reconexión

El cliente WebSocket reconecta automáticamente. Para manejar estados:

```tsx
function TableroKanban() {
  const { isConnected } = useRealtimeTablero({ ... });

  return (
    <div>
      {!isConnected && (
        <Alert variant="warning">
          Reconectando... Los cambios se sincronizarán automáticamente.
        </Alert>
      )}
      <Board />
    </div>
  );
}
```

### 4. Actualización Optimista

Los hooks de tablero ya implementan actualización optimista:

```tsx
// El estado local se actualiza INMEDIATAMENTE
// El servidor se notifica en segundo plano
moverTarea(tareaId, nuevoEstado);

// ✅ La UI responde instantáneamente
// ✅ Otros usuarios ven el cambio vía WebSocket
```

### 5. No Duplicar Listeners

Evitar múltiples instancias del mismo hook en una página:

```tsx
// ❌ MAL - Duplica listeners
function TableroPage() {
  useRealtimeTablero({ tableroId: '1' });
  useRealtimeTablero({ tableroId: '1' }); // Duplicado!
}

// ✅ BIEN - Un solo listener
function TableroPage() {
  useRealtimeTablero({ tableroId: '1' });
}
```

---

## Eventos Disponibles

### Notificaciones
- `notification:new` - Nueva notificación
- `notification:read` - Notificación leída
- `notification:count` - Actualización de contador

### Tablero
- `tablero:tarea-movida` - Tarea movida (drag & drop)
- `tablero:tarea-creada` - Nueva tarea
- `tablero:tarea-actualizada` - Tarea editada
- `tablero:tarea-eliminada` - Tarea eliminada
- `tablero:asignacion-cambiada` - Cambio de asignación

### Proyectos
- `proyecto:actualizado` - Proyecto editado
- `proyecto:estado-cambiado` - Cambio de estado
- `proyecto:miembro-agregado` - Nuevo miembro
- `proyecto:miembro-removido` - Miembro removido

### Sprints
- `sprint:iniciado` - Sprint iniciado
- `sprint:cerrado` - Sprint cerrado
- `sprint:estado-cambiado` - Cambio de estado

### Aprobaciones
- `aprobacion:pendiente` - Nueva aprobación
- `aprobacion:completada` - Aprobación completada
- `aprobacion:rechazada` - Aprobación rechazada
- `aprobacion:recordatorio` - Recordatorio

---

## Troubleshooting

### WebSocket no conecta

**Problema**: El indicador muestra "Desconectado"

**Solución**:
1. Verificar que el backend esté corriendo en `localhost:3010`
2. Verificar `NEXT_PUBLIC_WS_URL` en `.env.local`
3. Revisar consola del navegador para errores
4. Verificar que el token JWT sea válido

```bash
# Verificar backend WebSocket
curl http://localhost:3010/health
```

### No recibo eventos

**Problema**: Los eventos del servidor no llegan

**Solución**:
1. Verificar que estás en la sala correcta (tablero, proyecto, etc.)
2. Revisar consola del navegador (logs de `[WS]`)
3. Verificar que el backend esté emitiendo el evento correcto

```tsx
// Debugging
function MyComponent() {
  const { subscribe, socketId } = useWebSocket();

  useEffect(() => {
    console.log('Socket ID:', socketId);

    const unsub = subscribe('mi-evento', (data) => {
      console.log('Evento recibido:', data);
    });

    return unsub;
  }, [subscribe, socketId]);
}
```

### Múltiples conexiones

**Problema**: El backend reporta múltiples conexiones del mismo usuario

**Solución**:
1. Asegurar que `WebSocketProvider` está en el layout, no en múltiples lugares
2. Verificar que no hay hot-reload rápido (normal en desarrollo)
3. Limpiar localStorage y refrescar

```tsx
// ❌ MAL - Múltiples providers
function App() {
  return (
    <WebSocketProvider>
      <Page1>
        <WebSocketProvider> {/* Duplicado! */}
          ...
        </WebSocketProvider>
      </Page1>
    </WebSocketProvider>
  );
}

// ✅ BIEN - Un solo provider en el root
function DashboardLayout() {
  return (
    <WebSocketProvider>
      <AppLayout>...</AppLayout>
    </WebSocketProvider>
  );
}
```

### Actualizaciones duplicadas

**Problema**: La UI se actualiza dos veces al mover una tarea

**Solución**:
El hook `useRealtimeTablero` ya maneja actualización optimista. No actualices manualmente:

```tsx
// ❌ MAL - Duplica la actualización
const handleDragEnd = (tareaId, nuevoEstado) => {
  setTareas(prev => ...); // Actualización manual
  moverTarea(tareaId, nuevoEstado); // Hook también actualiza
};

// ✅ BIEN - Solo usar el hook
const handleDragEnd = (tareaId, nuevoEstado) => {
  moverTarea(tareaId, nuevoEstado); // Hook maneja todo
};
```

---

## Próximos Pasos

1. Implementar eventos de comentarios en tiempo real
2. Agregar indicadores de "usuario está escribiendo..."
3. Sincronización de cursores en documentos colaborativos
4. Notificaciones push del navegador
5. Offline mode con sincronización al reconectar

---

## Referencias

- Socket.IO Client Docs: https://socket.io/docs/v4/client-api/
- Next.js Real-time: https://nextjs.org/docs/app/building-your-application/routing/route-handlers#websockets
- Zustand Persist: https://docs.pmnd.rs/zustand/integrations/persisting-store-data
