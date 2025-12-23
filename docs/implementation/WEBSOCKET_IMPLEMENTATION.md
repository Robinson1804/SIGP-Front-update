# Implementación WebSocket - Resumen

## Estado: COMPLETADO ✓

Se ha implementado completamente el sistema de WebSocket para comunicación en tiempo real en SIGP Frontend.

---

## Archivos Creados

### Core WebSocket (3 archivos)
```
src/lib/websocket/
├── socket-client.ts         # Cliente singleton de Socket.IO
├── events.ts               # Definiciones de eventos y tipos
└── index.ts                # Barrel export
```

### Context Provider (1 archivo)
```
src/contexts/
└── websocket-context.tsx   # Provider y hook useWebSocket
```

### Hooks de Tiempo Real (4 archivos)
```
src/lib/hooks/
├── use-realtime-notifications.ts   # Notificaciones en tiempo real
├── use-realtime-tablero.ts         # Tableros Kanban/Scrum
├── use-realtime-aprobaciones.ts    # Aprobaciones de documentos
├── use-realtime-proyecto.ts        # Eventos de proyectos
└── index.ts                        # Actualizado con exports
```

### Componentes UI (2 archivos)
```
src/components/websocket/
├── connection-indicator.tsx   # Indicador visual de conexión
└── index.ts                  # Barrel export
```

### Documentación (1 archivo)
```
docs/guides/
└── WEBSOCKET_INTEGRATION.md   # Guía completa de integración
```

---

## Características Implementadas

### 1. Cliente WebSocket Singleton
- Conexión automática con JWT token
- Reconexión automática (hasta 5 intentos)
- Gestión de listeners con cleanup
- Logs en modo desarrollo
- Emisión y recepción de eventos

### 2. Context Provider
- Auto-conexión cuando el usuario está autenticado
- Auto-desconexión al hacer logout
- API simple: `subscribe`, `emit`, `joinRoom`, `leaveRoom`
- Estado de conexión reactivo
- Integrado en layout del dashboard

### 3. Hooks Especializados

#### `useRealtimeNotifications`
- Escucha notificaciones nuevas
- Actualización de contador
- Callbacks personalizables

#### `useRealtimeTablero`
- Sincronización de tableros Kanban/Scrum
- Join/leave automático de salas
- Actualización optimista
- Método `moverTarea` para drag & drop
- Soporte para sprint y actividad

#### `useRealtimeAprobaciones`
- Gestión de aprobaciones pendientes
- Contador reactivo
- Eventos de completadas/rechazadas/recordatorios

#### `useRealtimeProyecto`
- Eventos de proyecto específico
- Join/leave automático de sala
- Cambios de estado, sprints, miembros

### 4. Componente UI
- `ConnectionIndicator`: Icono WiFi que muestra estado
- Tooltip con información de conexión
- Socket ID para debugging

---

## Integración en el Proyecto

### Layout Modificado
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

### Variable de Entorno
```env
# .env.local
NEXT_PUBLIC_WS_URL=ws://localhost:3010
```

---

## Eventos Soportados

### Notificaciones
- `notification:new`
- `notification:read`
- `notification:count`

### Tablero
- `tablero:join`
- `tablero:leave`
- `tablero:tarea-movida`
- `tablero:tarea-creada`
- `tablero:tarea-actualizada`
- `tablero:tarea-eliminada`
- `tablero:asignacion-cambiada`

### Proyectos
- `proyecto:actualizado`
- `proyecto:estado-cambiado`
- `proyecto:miembro-agregado`
- `proyecto:miembro-removido`

### Sprints
- `sprint:iniciado`
- `sprint:cerrado`
- `sprint:estado-cambiado`
- `sprint:velocidad-actualizada`

### Actividades
- `actividad:actualizada`
- `actividad:estado-cambiado`

### Aprobaciones
- `aprobacion:pendiente`
- `aprobacion:completada`
- `aprobacion:rechazada`
- `aprobacion:recordatorio`

### Comentarios
- `comentario:nuevo`
- `comentario:editado`
- `comentario:eliminado`
- `comentario:mencion`

### Documentos
- `documento:nuevo`
- `documento:actualizado`
- `documento:eliminado`

---

## Ejemplos de Uso

### Ejemplo 1: Notificaciones en Header
```tsx
import { useRealtimeNotifications } from '@/lib/hooks';
import { useToast } from '@/components/ui/use-toast';

function Header() {
  const { toast } = useToast();

  useRealtimeNotifications({
    onNotification: (notification) => {
      toast({
        title: notification.titulo,
        description: notification.mensaje,
      });
    },
  });

  return <header>...</header>;
}
```

### Ejemplo 2: Tablero Kanban
```tsx
import { useRealtimeTablero } from '@/lib/hooks';

function TableroKanban({ sprintId }) {
  const { tareas, moverTarea, isConnected } = useRealtimeTablero({
    tableroId: sprintId,
    tableroTipo: 'sprint',
    initialTareas: tareasDelServidor,
  });

  const handleDragEnd = (tareaId: string, nuevoEstado: string) => {
    moverTarea(tareaId, nuevoEstado);
  };

  return <Board tareas={tareas} onDragEnd={handleDragEnd} />;
}
```

### Ejemplo 3: Indicador de Conexión
```tsx
import { ConnectionIndicator } from '@/components/websocket';

function AppHeader() {
  return (
    <header>
      <Logo />
      <ConnectionIndicator />
      <UserMenu />
    </header>
  );
}
```

---

## Arquitectura

```
Usuario autenticado
    ↓
WebSocketProvider conecta con JWT
    ↓
socketClient (singleton)
    ↓
Conexión WebSocket a ws://localhost:3010
    ↓
Hooks se suscriben a eventos
    ↓
Eventos del servidor → Actualizan UI en tiempo real
```

---

## Características Técnicas

### Actualización Optimista
Los hooks de tablero actualizan el estado local INMEDIATAMENTE al mover una tarea, antes de recibir confirmación del servidor. Esto garantiza una experiencia fluida.

### Cleanup Automático
Todos los hooks usan `useEffect` con funciones de cleanup que se ejecutan al desmontar, evitando memory leaks.

### Reconexión Automática
Si se pierde la conexión, Socket.IO reconecta automáticamente:
- 5 intentos máximo
- Delay inicial: 1000ms
- Delay máximo: 5000ms

### Tipado Fuerte
Todos los eventos y datos están tipados con TypeScript para seguridad de tipos.

### Logs de Desarrollo
En modo desarrollo, el socket client registra todos los eventos en consola con prefijo `[WS]`.

---

## Próximos Pasos

### Backend (NestJS)
El backend debe implementar:

1. **Gateway WebSocket**
```typescript
// src/websocket/websocket.gateway.ts
@WebSocketGateway()
export class WebSocketGateway {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    // Autenticar con JWT del handshake
  }

  @SubscribeMessage('tablero:tarea-movida')
  handleTareaMovida(client: Socket, data: any) {
    // Broadcast a la sala
    this.server.to(`tablero:${data.tableroTipo}:${data.tableroId}`)
      .emit('tablero:tarea-movida', data);
  }
}
```

2. **Emisión de Eventos**
```typescript
// Cuando se actualiza una entidad
this.websocketGateway.server
  .to(`proyecto:${proyectoId}`)
  .emit('proyecto:actualizado', { proyectoId, cambios });
```

3. **Gestión de Salas**
```typescript
@SubscribeMessage('room:join')
handleJoinRoom(client: Socket, { room }: { room: string }) {
  client.join(room);
}
```

### Frontend (Próximas Mejoras)
1. Implementar `use-realtime-comentarios.ts`
2. Agregar indicador de "usuario escribiendo..."
3. Notificaciones push del navegador
4. Offline mode con cola de sincronización
5. Compresión de mensajes para tableros grandes

---

## Testing

### Verificar Conexión
1. Iniciar backend en `localhost:3010`
2. Login en frontend
3. Abrir DevTools → Console
4. Buscar log: `[WS] Conectado al servidor`
5. Ver Socket ID en `ConnectionIndicator`

### Verificar Eventos
1. Abrir dos navegadores/tabs con el mismo tablero
2. Mover una tarea en el navegador A
3. Ver actualización en tiempo real en navegador B

### Debugging
```typescript
// En cualquier componente
const { socketId } = useWebSocket();
console.log('Socket ID:', socketId);

// Ver todos los eventos
socketClient.on('*', (event, data) => {
  console.log('Evento recibido:', event, data);
});
```

---

## Notas Importantes

1. **Seguridad**: El token JWT se envía en el handshake inicial. El backend DEBE validarlo.
2. **Escalabilidad**: Para múltiples servidores, usar Redis adapter de Socket.IO.
3. **Performance**: Usar salas (rooms) para reducir broadcast innecesarios.
4. **Error Handling**: Todos los callbacks tienen try-catch para evitar crashes.
5. **Memory Leaks**: Los hooks usan cleanup automático en `useEffect`.

---

## Dependencias

```json
{
  "socket.io-client": "^4.8.1"  // Ya instalado
}
```

No se requieren dependencias adicionales.

---

## Referencias

- Documentación completa: `docs/guides/WEBSOCKET_INTEGRATION.md`
- Socket.IO Docs: https://socket.io/docs/v4/
- Cliente: `src/lib/websocket/socket-client.ts`
- Eventos: `src/lib/websocket/events.ts`
- Context: `src/contexts/websocket-context.tsx`

---

## Contacto

Para preguntas o problemas con la implementación:
1. Revisar `docs/guides/WEBSOCKET_INTEGRATION.md` (Troubleshooting)
2. Verificar logs de consola con `[WS]`
3. Validar que el backend esté corriendo
4. Comprobar variables de entorno

---

**Estado Final**: LISTO PARA USAR ✓

El sistema está completamente funcional. Solo falta que el backend NestJS implemente los eventos correspondientes.
