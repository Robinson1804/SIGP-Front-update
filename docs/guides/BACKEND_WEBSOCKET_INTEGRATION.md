# Backend WebSocket Integration Guide

Guía de integración del sistema WebSocket en el backend NestJS.

---

## Instalación de Dependencias

```bash
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
```

---

## Estructura de Archivos

```
src/
├── websocket/
│   ├── websocket.module.ts
│   ├── websocket.gateway.ts
│   └── websocket.service.ts
└── main.ts (configurar CORS)
```

---

## 1. WebSocket Gateway

**src/websocket/websocket.gateway.ts**

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket'],
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  private connectedUsers = new Map<string, string>(); // socketId -> userId

  constructor(private readonly jwtService: JwtService) {}

  /**
   * Autenticar cliente al conectar
   */
  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      // Obtener token del handshake
      const token = client.handshake.auth.token;

      if (!token) {
        this.logger.warn(`Cliente sin token: ${client.id}`);
        client.disconnect();
        return;
      }

      // Verificar token JWT
      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub || payload.id;

      // Guardar mapeo socket -> usuario
      this.connectedUsers.set(client.id, userId);

      // Unir a sala personal del usuario
      client.join(`user:${userId}`);

      this.logger.log(`Usuario ${userId} conectado (socket: ${client.id})`);
    } catch (error) {
      this.logger.error(`Error de autenticación: ${error.message}`);
      client.disconnect();
    }
  }

  /**
   * Limpiar al desconectar
   */
  handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      this.logger.log(`Usuario ${userId} desconectado (socket: ${client.id})`);
      this.connectedUsers.delete(client.id);
    }
  }

  /**
   * Unirse a una sala
   */
  @SubscribeMessage('room:join')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() { room }: { room: string },
  ) {
    client.join(room);
    this.logger.debug(`Socket ${client.id} se unió a sala: ${room}`);
  }

  /**
   * Salir de una sala
   */
  @SubscribeMessage('room:leave')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() { room }: { room: string },
  ) {
    client.leave(room);
    this.logger.debug(`Socket ${client.id} salió de sala: ${room}`);
  }

  /**
   * Manejar movimiento de tarea
   */
  @SubscribeMessage('tablero:tarea-movida')
  handleTareaMovida(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    const room = `tablero:${data.tableroTipo}:${data.tableroId}`;

    // Broadcast a todos en la sala EXCEPTO el que lo envió
    client.to(room).emit('tablero:tarea-movida', {
      ...data,
      movidoPor: this.connectedUsers.get(client.id),
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Tarea movida en ${room}: ${data.tareaId} -> ${data.nuevoEstado}`);
  }

  /**
   * Ping/Pong para mantener conexión
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong');
  }

  // ========================================
  // MÉTODOS PÚBLICOS PARA OTROS SERVICIOS
  // ========================================

  /**
   * Enviar notificación a un usuario específico
   */
  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification:new', notification);
  }

  /**
   * Broadcast a una sala específica
   */
  emitToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }

  /**
   * Broadcast a todos los conectados
   */
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }
}
```

---

## 2. WebSocket Service

**src/websocket/websocket.service.ts**

```typescript
import { Injectable } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';

@Injectable()
export class WebSocketService {
  constructor(private readonly gateway: WebSocketGateway) {}

  /**
   * Notificar sobre nueva tarea creada
   */
  notifyTareaCreada(tableroId: string, tableroTipo: 'sprint' | 'actividad', tarea: any) {
    const room = `tablero:${tableroTipo}:${tableroId}`;
    this.gateway.emitToRoom(room, 'tablero:tarea-creada', {
      tableroId,
      tableroTipo,
      tarea,
    });
  }

  /**
   * Notificar sobre tarea actualizada
   */
  notifyTareaActualizada(
    tableroId: string,
    tableroTipo: 'sprint' | 'actividad',
    tarea: any,
    cambios: Record<string, any>,
  ) {
    const room = `tablero:${tableroTipo}:${tableroId}`;
    this.gateway.emitToRoom(room, 'tablero:tarea-actualizada', {
      tableroId,
      tableroTipo,
      tarea,
      cambios,
    });
  }

  /**
   * Notificar sobre tarea eliminada
   */
  notifyTareaEliminada(tableroId: string, tableroTipo: 'sprint' | 'actividad', tareaId: string) {
    const room = `tablero:${tableroTipo}:${tableroId}`;
    this.gateway.emitToRoom(room, 'tablero:tarea-eliminada', {
      tableroId,
      tableroTipo,
      tareaId,
    });
  }

  /**
   * Notificar sobre proyecto actualizado
   */
  notifyProyectoActualizado(proyectoId: string, cambios: Record<string, any>) {
    const room = `proyecto:${proyectoId}`;
    this.gateway.emitToRoom(room, 'proyecto:actualizado', {
      proyectoId,
      cambios,
    });
  }

  /**
   * Notificar sobre cambio de estado de proyecto
   */
  notifyProyectoEstadoCambiado(proyectoId: string, nuevoEstado: string) {
    const room = `proyecto:${proyectoId}`;
    this.gateway.emitToRoom(room, 'proyecto:estado-cambiado', {
      proyectoId,
      nuevoEstado,
    });
  }

  /**
   * Notificar sobre sprint iniciado
   */
  notifySprintIniciado(sprintId: string, proyectoId: string) {
    const room = `proyecto:${proyectoId}`;
    this.gateway.emitToRoom(room, 'sprint:iniciado', {
      sprintId,
      proyectoId,
    });
  }

  /**
   * Notificar sobre sprint cerrado
   */
  notifySprintCerrado(sprintId: string, proyectoId: string) {
    const room = `proyecto:${proyectoId}`;
    this.gateway.emitToRoom(room, 'sprint:cerrado', {
      sprintId,
      proyectoId,
    });
  }

  /**
   * Enviar notificación personal a un usuario
   */
  sendNotificationToUser(userId: string, notification: {
    tipo: 'info' | 'warning' | 'error' | 'success';
    titulo: string;
    mensaje: string;
    url?: string;
  }) {
    this.gateway.sendNotificationToUser(userId, {
      id: crypto.randomUUID(),
      ...notification,
      createdAt: new Date().toISOString(),
      leido: false,
    });
  }

  /**
   * Notificar sobre nueva aprobación pendiente
   */
  notifyAprobacionPendiente(aprobadorId: string, documentoId: string, tipo: string, titulo: string, solicitante: string) {
    this.gateway.sendNotificationToUser(aprobadorId, {
      tipo: 'info',
      titulo: 'Nueva aprobación pendiente',
      mensaje: `${solicitante} solicita aprobación de ${tipo}`,
      url: `/documentos/${documentoId}`,
    });

    // También emitir evento específico de aprobación
    this.gateway.emitToRoom(`user:${aprobadorId}`, 'aprobacion:pendiente', {
      documentoId,
      tipo,
      titulo,
      solicitante,
    });
  }

  /**
   * Notificar sobre nuevo comentario
   */
  notifyComentarioNuevo(
    entidadId: string,
    entidadTipo: 'tarea' | 'historia' | 'documento' | 'sprint',
    autor: any,
    contenido: string,
    mencionados: string[] = [],
  ) {
    // Enviar a todos los mencionados
    mencionados.forEach(userId => {
      this.gateway.sendNotificationToUser(userId, {
        tipo: 'info',
        titulo: `${autor.nombre} te mencionó`,
        mensaje: contenido.substring(0, 100),
        url: `/${entidadTipo}/${entidadId}`,
      });
    });

    // Emitir evento de comentario
    const room = `${entidadTipo}:${entidadId}`;
    this.gateway.emitToRoom(room, 'comentario:nuevo', {
      comentarioId: crypto.randomUUID(),
      entidadId,
      entidadTipo,
      autor,
      contenido,
      mencionados,
      timestamp: new Date().toISOString(),
    });
  }
}
```

---

## 3. WebSocket Module

**src/websocket/websocket.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [WebSocketGateway, WebSocketService],
  exports: [WebSocketService],
})
export class WebSocketModule {}
```

---

## 4. Integración en Main

**src/main.ts**

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para WebSocket
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  await app.listen(3010);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
```

---

## 5. Integración en App Module

**src/app.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { WebSocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    // ... otros módulos
    WebSocketModule,
  ],
})
export class AppModule {}
```

---

## 6. Uso en Servicios

### Ejemplo: Tareas Service

**src/agile/tareas/tareas.service.ts**

```typescript
import { Injectable } from '@nestjs/common';
import { WebSocketService } from '@/websocket/websocket.service';

@Injectable()
export class TareasService {
  constructor(
    private readonly websocketService: WebSocketService,
    // ... otros servicios
  ) {}

  async crearTarea(createTareaDto: CreateTareaDto) {
    // Crear tarea en base de datos
    const tarea = await this.tareasRepository.save(createTareaDto);

    // Notificar en tiempo real
    const tableroId = tarea.tipo === 'SCRUM' ? tarea.historiaUsuario.sprint.id : tarea.actividad.id;
    const tableroTipo = tarea.tipo === 'SCRUM' ? 'sprint' : 'actividad';

    this.websocketService.notifyTareaCreada(tableroId, tableroTipo, tarea);

    return tarea;
  }

  async actualizarTarea(id: string, updateTareaDto: UpdateTareaDto) {
    const tareaAnterior = await this.findOne(id);
    const tarea = await this.tareasRepository.save({ ...tareaAnterior, ...updateTareaDto });

    // Determinar cambios
    const cambios = Object.keys(updateTareaDto).reduce((acc, key) => {
      if (tareaAnterior[key] !== tarea[key]) {
        acc[key] = { anterior: tareaAnterior[key], nuevo: tarea[key] };
      }
      return acc;
    }, {});

    // Notificar en tiempo real
    const tableroId = tarea.tipo === 'SCRUM' ? tarea.historiaUsuario.sprint.id : tarea.actividad.id;
    const tableroTipo = tarea.tipo === 'SCRUM' ? 'sprint' : 'actividad';

    this.websocketService.notifyTareaActualizada(tableroId, tableroTipo, tarea, cambios);

    return tarea;
  }

  async eliminarTarea(id: string) {
    const tarea = await this.findOne(id);

    await this.tareasRepository.delete(id);

    // Notificar en tiempo real
    const tableroId = tarea.tipo === 'SCRUM' ? tarea.historiaUsuario.sprint.id : tarea.actividad.id;
    const tableroTipo = tarea.tipo === 'SCRUM' ? 'sprint' : 'actividad';

    this.websocketService.notifyTareaEliminada(tableroId, tableroTipo, id);

    return { success: true };
  }
}
```

### Ejemplo: Proyectos Service

**src/poi/proyectos/proyectos.service.ts**

```typescript
import { Injectable } from '@nestjs/common';
import { WebSocketService } from '@/websocket/websocket.service';

@Injectable()
export class ProyectosService {
  constructor(
    private readonly websocketService: WebSocketService,
    // ... otros servicios
  ) {}

  async actualizarProyecto(id: string, updateDto: UpdateProyectoDto) {
    const proyecto = await this.proyectosRepository.save({ id, ...updateDto });

    // Notificar en tiempo real
    this.websocketService.notifyProyectoActualizado(id, updateDto);

    return proyecto;
  }

  async cambiarEstado(id: string, nuevoEstado: string) {
    const proyecto = await this.proyectosRepository.save({ id, estado: nuevoEstado });

    // Notificar en tiempo real
    this.websocketService.notifyProyectoEstadoCambiado(id, nuevoEstado);

    return proyecto;
  }
}
```

### Ejemplo: Sprints Service

**src/agile/sprints/sprints.service.ts**

```typescript
import { Injectable } from '@nestjs/common';
import { WebSocketService } from '@/websocket/websocket.service';

@Injectable()
export class SprintsService {
  constructor(
    private readonly websocketService: WebSocketService,
    // ... otros servicios
  ) {}

  async iniciarSprint(id: string) {
    const sprint = await this.sprintsRepository.save({
      id,
      estado: 'Activo',
      fecha_inicio: new Date(),
    });

    // Notificar en tiempo real
    this.websocketService.notifySprintIniciado(id, sprint.proyecto.id);

    return sprint;
  }

  async cerrarSprint(id: string) {
    const sprint = await this.sprintsRepository.save({
      id,
      estado: 'Completado',
      fecha_fin: new Date(),
    });

    // Notificar en tiempo real
    this.websocketService.notifySprintCerrado(id, sprint.proyecto.id);

    return sprint;
  }
}
```

---

## Variables de Entorno

**.env**

```env
# WebSocket
FRONTEND_URL=http://localhost:3000

# JWT (debe coincidir con el usado en AuthModule)
JWT_SECRET=your-secret-key
```

---

## Testing

### Verificar Conexión

1. Iniciar backend
2. Verificar logs: `Usuario {userId} conectado (socket: {socketId})`

### Verificar Eventos

1. Abrir dos navegadores con el mismo tablero
2. Mover una tarea en navegador A
3. Ver actualización en navegador B
4. Verificar logs del backend

### Testing Manual con Postman/Thunder Client

**Socket.IO Client** (JavaScript en consola del navegador):

```javascript
const socket = io('ws://localhost:3010', {
  auth: { token: 'YOUR_JWT_TOKEN' },
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('Conectado:', socket.id);
});

socket.emit('room:join', { room: 'tablero:sprint:123' });

socket.on('tablero:tarea-movida', (data) => {
  console.log('Tarea movida:', data);
});
```

---

## Escalabilidad

Para múltiples servidores (load balancing), usar **Redis Adapter**:

```bash
npm install @socket.io/redis-adapter redis
```

**websocket.gateway.ts**:

```typescript
import { RedisAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class WebSocketGateway implements OnGatewayInit {
  async afterInit(server: Server) {
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    server.adapter(new RedisAdapter(pubClient, subClient));
  }
}
```

---

## Monitoreo

### Logs Estructurados

```typescript
this.logger.log({
  action: 'tarea-movida',
  tableroId,
  tareaId,
  nuevoEstado,
  userId,
  timestamp: new Date().toISOString(),
});
```

### Métricas

- Número de conexiones activas
- Eventos emitidos por segundo
- Latencia de eventos
- Errores de autenticación

---

## Seguridad

1. **Validar JWT en cada conexión**
2. **Autorizar acceso a salas**: Verificar que el usuario tenga permiso para unirse a una sala
3. **Rate limiting**: Limitar eventos por usuario
4. **Validar datos de entrada**: Usar DTOs en `@MessageBody()`
5. **Logs de auditoría**: Registrar quién hizo qué

---

## Referencias

- NestJS WebSockets: https://docs.nestjs.com/websockets/gateways
- Socket.IO Server: https://socket.io/docs/v4/server-api/
- Redis Adapter: https://socket.io/docs/v4/redis-adapter/
