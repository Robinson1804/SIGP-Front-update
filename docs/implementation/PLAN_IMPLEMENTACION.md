# PLAN DE IMPLEMENTACION SIGP - MULTI-AGENTE

**Fecha:** 14 de Diciembre 2024
**Estrategia:** Implementacion paralela con 4-5 agentes
**Backend:** Completo en localhost:3010
**Prioridades:** Cronograma, Flujos Aprobacion, Dashboard, WebSocket

---

## ARQUITECTURA DE AGENTES

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CONTEXT-MANAGER (Coordinador)                     │
│   - Mantiene estado global del proyecto                             │
│   - Gestiona dependencias entre modulos                             │
│   - Evita conflictos de contexto                                    │
└─────────────────────────────────────────────────────────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ▼                          ▼                          ▼
┌───────────────┐        ┌───────────────┐        ┌───────────────┐
│ FULLSTACK-DEV │        │ FRONTEND-DEV  │        │ NEXTJS-EXPERT │
│   Agente 1    │        │   Agente 2    │        │   Agente 3    │
│               │        │               │        │               │
│ - Cronograma  │        │ - Dashboard   │        │ - WebSocket   │
│ - Daily Meet  │        │ - Informes    │        │ - Real-time   │
│ - RRHH        │        │ - Graficos    │        │ - Providers   │
└───────────────┘        └───────────────┘        └───────────────┘
        │                          │                          │
        └──────────────────────────┼──────────────────────────┘
                                   │
                                   ▼
                    ┌───────────────────────────┐
                    │      CODE-REVIEWER        │
                    │   (Revision de calidad)   │
                    └───────────────────────────┘
```

---

## FASES DE IMPLEMENTACION

### FASE 0: PREPARACION (Pre-requisitos)
**Duracion estimada:** 30 minutos
**Agente:** context-manager

**Tareas:**
1. [ ] Instalar dependencias nuevas necesarias
   ```bash
   npm install gantt-task-react socket.io-client xlsx
   ```
2. [ ] Crear estructura de carpetas para nuevos modulos
3. [ ] Verificar conexion con backend (localhost:3010)
4. [ ] Crear archivo de contexto compartido

**Archivos a crear:**
- `src/lib/websocket/socket-client.ts`
- `src/contexts/websocket-context.tsx`
- `src/features/cronograma/` (estructura)
- `src/features/informes/` (estructura)
- `src/features/daily-meetings/` (estructura)

---

### FASE 1: MODULO CRONOGRAMA/GANTT
**Prioridad:** CRITICA (10% actual → 100%)
**Agente principal:** fullstack-developer

**1.1 Tipos e Interfaces**
```typescript
// src/features/cronograma/types/index.ts
interface TareaCronograma {
  id: string;
  nombre: string;
  fechaInicio: Date;
  fechaFin: Date;
  progreso: number;
  dependencias: string[];
  tipoDependencia: 'FS' | 'FF' | 'SS' | 'SF';
  responsable?: string;
  color?: string;
}

interface Cronograma {
  id: number;
  proyectoId: number;
  tareas: TareaCronograma[];
  createdAt: Date;
  updatedAt: Date;
}
```

**1.2 Servicios API**
```typescript
// src/features/cronograma/services/cronograma.service.ts
- getCronograma(proyectoId: number)
- createCronograma(proyectoId: number, data: CreateCronogramaDto)
- updateCronograma(id: number, data: UpdateCronogramaDto)
- addTarea(cronogramaId: number, tarea: TareaCronograma)
- updateTarea(cronogramaId: number, tareaId: string, data: Partial<TareaCronograma>)
- deleteTarea(cronogramaId: number, tareaId: string)
- addDependencia(tareaId: string, dependenciaId: string, tipo: TipoDependencia)
- exportCronograma(cronogramaId: number, formato: 'pdf' | 'excel')
```

**1.3 Componentes UI**
```
src/features/cronograma/components/
├── GanttChart.tsx           # Componente principal con gantt-task-react
├── GanttToolbar.tsx         # Barra de herramientas (zoom, filtros)
├── GanttTaskForm.tsx        # Modal crear/editar tarea
├── DependencyModal.tsx      # Modal para dependencias
├── GanttExportButton.tsx    # Boton exportar PDF/Excel
└── index.ts                 # Barrel export
```

**1.4 Pagina**
```typescript
// src/app/(dashboard)/poi/proyecto/cronograma/page.tsx
// src/app/(dashboard)/poi/proyectos/[id]/cronograma/page.tsx
```

**Criterios de aceptacion:**
- [ ] Visualizar tareas en diagrama Gantt
- [ ] Crear/editar/eliminar tareas con drag & drop
- [ ] Definir dependencias (FS, FF, SS, SF)
- [ ] Actualizar fechas arrastrando barras
- [ ] Exportar a PDF y Excel
- [ ] Responsive en pantallas grandes

---

### FASE 2: FLUJOS DE APROBACION
**Prioridad:** CRITICA
**Agente principal:** frontend-developer

**2.1 Sistema de Estados de Aprobacion**
```typescript
// src/features/aprobaciones/types/index.ts
type EstadoAprobacion =
  | 'borrador'
  | 'pendiente_coordinador'
  | 'pendiente_pmo'
  | 'pendiente_patrocinador'
  | 'aprobado'
  | 'rechazado';

interface HistorialAprobacion {
  id: number;
  entidadTipo: 'acta' | 'informe_sprint' | 'informe_actividad' | 'documento';
  entidadId: number;
  estado: EstadoAprobacion;
  aprobadorId: number;
  aprobador: Usuario;
  comentario?: string;
  fecha: Date;
}

interface FlujoaprobacionConfig {
  tipo: string;
  pasos: {
    orden: number;
    rol: Role;
    accion: 'aprobar' | 'rechazar' | 'revisar';
  }[];
}
```

**2.2 Servicios de Aprobacion**
```typescript
// src/features/aprobaciones/services/aprobacion.service.ts
- getHistorialAprobacion(entidadTipo: string, entidadId: number)
- aprobar(entidadTipo: string, entidadId: number, comentario?: string)
- rechazar(entidadTipo: string, entidadId: number, motivo: string)
- enviarARevision(entidadTipo: string, entidadId: number)
- getPendientesAprobacion(rol: Role)
```

**2.3 Componentes de Flujo**
```
src/features/aprobaciones/components/
├── AprobacionTimeline.tsx      # Timeline visual del flujo
├── AprobacionActions.tsx       # Botones aprobar/rechazar
├── AprobacionModal.tsx         # Modal con comentario
├── AprobacionBadge.tsx         # Badge de estado
├── PendientesAprobacion.tsx    # Lista de pendientes
└── index.ts
```

**2.4 Integracion con Actas**
```typescript
// src/features/documentos/components/
├── ActaConstitucionForm.tsx    # Formulario multi-paso
├── ActaConstitucionView.tsx    # Vista con timeline aprobacion
├── ActaReunionForm.tsx         # Formulario con asistentes
├── ActaReunionView.tsx         # Vista con acuerdos
└── ActaAprobacionPanel.tsx     # Panel lateral de aprobacion
```

**2.5 Integracion con Informes Sprint**
```typescript
// src/features/informes/components/
├── InformeSprintView.tsx       # Vista del informe
├── InformeSprintEdit.tsx       # Edicion (solo SM en borrador)
├── InformeSprintMetricas.tsx   # Seccion de metricas
├── InformeSprintAprobacion.tsx # Panel de aprobacion
└── InformeSprintPDF.tsx        # Generacion PDF
```

**2.6 Integracion con Informes Actividad**
```typescript
// src/features/informes/components/
├── InformeActividadView.tsx
├── InformeActividadForm.tsx
├── InformeActividadAprobacion.tsx  # Solo PMO aprueba
└── InformeActividadPDF.tsx
```

**Flujos implementar:**
1. **Acta Constitucion:** SM → Coordinador → Patrocinador
2. **Acta Reunion:** SM → Coordinador → PMO
3. **Informe Sprint:** SM crea → SM edita → Coordinador → PMO
4. **Informe Actividad:** Coordinador crea → PMO aprueba

---

### FASE 3: DASHBOARD COMPLETO
**Prioridad:** ALTA
**Agente principal:** frontend-developer

**3.1 Tipos del Dashboard**
```typescript
// src/features/dashboard/types/dashboard.types.ts (ampliar)
interface DashboardGeneral {
  resumen: {
    totalProyectos: number;
    proyectosActivos: number;
    proyectosAtrasados: number;
    proyectosCompletados: number;
    totalActividades: number;
    actividadesActivas: number;
  };
  porEstado: { estado: string; cantidad: number }[];
  porObjetivo: { oeiId: number; nombre: string; avance: number }[];
  alertas: Alerta[];
  tendencias: TendenciaData[];
}

interface SaludProyecto {
  proyectoId: number;
  score: number;  // 0-100
  color: 'verde' | 'amarillo' | 'rojo';
  factores: {
    avanceReal: number;
    avancePlanificado: number;
    sprintsAtrasados: number;
    tareasBloquedas: number;
    huSinAsignar: number;
  };
  recomendaciones: string[];
}

interface MetricasEquipo {
  equipoId: number;
  velocidadPromedio: number;
  velocidadTendencia: number[];
  burndownData: { fecha: string; ideal: number; real: number }[];
  cumplimientoSprints: number;
}
```

**3.2 Servicios Dashboard**
```typescript
// src/features/dashboard/services/dashboard.service.ts (ampliar)
- getDashboardGeneral(filtros?: DashboardFiltros)
- getSaludProyecto(proyectoId: number)
- getMetricasEquipo(proyectoId: number)
- getAvancePorOEI(oeiId?: number)
- getAlertasActivas()
- exportDashboard(formato: 'pdf' | 'excel')
```

**3.3 Componentes Dashboard**
```
src/features/dashboard/components/
├── DashboardLayout.tsx          # Layout con grid responsive
├── KPICards.tsx                 # Tarjetas de KPIs principales
├── ProyectosPorEstadoChart.tsx  # Grafico dona/pie
├── AvanceOEIChart.tsx           # Grafico barras horizontales
├── TendenciasChart.tsx          # Grafico lineas temporal
├── SaludProyectoCard.tsx        # Semaforo de salud
├── AlertasPanel.tsx             # Panel lateral de alertas
├── VelocidadEquipoChart.tsx     # Grafico velocidad sprints
├── BurndownChart.tsx            # (ya existe, mejorar)
├── ThroughputChart.tsx          # (ya existe, mejorar)
├── DashboardFilters.tsx         # Filtros de periodo/proyecto
├── ExportDashboardButton.tsx    # Exportar PDF/Excel
└── index.ts
```

**3.4 Paginas Dashboard**
```
src/app/(dashboard)/dashboard/
├── page.tsx                     # Dashboard general (mejorar)
├── proyecto/[id]/page.tsx       # Dashboard por proyecto
├── actividad/[id]/page.tsx      # Dashboard por actividad
└── oei/[id]/page.tsx            # Dashboard por OEI
```

**Graficos a implementar:**
1. [ ] Proyectos por estado (Dona)
2. [ ] Avance por OEI (Barras horizontales)
3. [ ] Tendencia mensual (Lineas)
4. [ ] Salud proyectos (Semaforo)
5. [ ] Velocidad equipos (Barras agrupadas)
6. [ ] Burndown por sprint (Lineas con area)
7. [ ] Throughput actividades (Barras)
8. [ ] Distribucion tareas (Treemap)

---

### FASE 4: WEBSOCKET Y TIEMPO REAL
**Prioridad:** ALTA
**Agente principal:** nextjs-architecture-expert

**4.1 Cliente WebSocket**
```typescript
// src/lib/websocket/socket-client.ts
import { io, Socket } from 'socket.io-client';

class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(token: string) {
    this.socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      auth: { token },
      transports: ['websocket'],
    });

    this.setupBaseListeners();
  }

  disconnect() { ... }

  on(event: string, callback: Function) { ... }
  off(event: string, callback: Function) { ... }
  emit(event: string, data: any) { ... }

  private setupBaseListeners() {
    this.socket?.on('connect', () => console.log('WS Connected'));
    this.socket?.on('disconnect', () => console.log('WS Disconnected'));
    this.socket?.on('error', (error) => console.error('WS Error:', error));
  }
}

export const socketClient = new SocketClient();
```

**4.2 WebSocket Provider**
```typescript
// src/contexts/websocket-context.tsx
'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { socketClient } from '@/lib/websocket/socket-client';
import { useAuth } from '@/stores';

interface WebSocketContextValue {
  isConnected: boolean;
  subscribe: (event: string, callback: Function) => () => void;
  emit: (event: string, data: any) => void;
}

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token) {
      socketClient.connect(token);
      return () => socketClient.disconnect();
    }
  }, [isAuthenticated, token]);

  // ...
};

export const useWebSocket = () => useContext(WebSocketContext);
```

**4.3 Hooks de WebSocket**
```typescript
// src/lib/hooks/use-realtime-notifications.ts
export function useRealtimeNotifications() {
  const { subscribe } = useWebSocket();
  const { addNotification } = useNotificationsStore();

  useEffect(() => {
    const unsubscribe = subscribe('notification:new', (data: Notification) => {
      addNotification(data);
    });
    return unsubscribe;
  }, []);
}

// src/lib/hooks/use-realtime-tablero.ts
export function useRealtimeTablero(tableroId: string) {
  const { subscribe, emit } = useWebSocket();
  const [tareas, setTareas] = useState<Tarea[]>([]);

  useEffect(() => {
    const unsubTareaMovida = subscribe('tablero:tarea-movida', (data) => {
      setTareas(prev => actualizarTarea(prev, data));
    });

    const unsubTareaCreada = subscribe('tablero:tarea-creada', (data) => {
      setTareas(prev => [...prev, data.tarea]);
    });

    return () => {
      unsubTareaMovida();
      unsubTareaCreada();
    };
  }, [tableroId]);

  const moverTarea = (tareaId: string, nuevoEstado: string) => {
    emit('tablero:mover-tarea', { tableroId, tareaId, nuevoEstado });
  };

  return { tareas, moverTarea };
}
```

**4.4 Eventos WebSocket a implementar**
```
NOTIFICACIONES:
- notification:new          # Nueva notificacion
- notification:read         # Notificacion leida

TABLERO:
- tablero:join              # Unirse a sala del tablero
- tablero:leave             # Salir de sala
- tablero:tarea-movida      # Tarea cambio de columna
- tablero:tarea-creada      # Nueva tarea
- tablero:tarea-actualizada # Tarea modificada
- tablero:tarea-eliminada   # Tarea eliminada

PROYECTO:
- proyecto:estado-cambiado  # Cambio de estado proyecto
- proyecto:sprint-iniciado  # Sprint inicio
- proyecto:sprint-cerrado   # Sprint cerrado

APROBACIONES:
- aprobacion:pendiente      # Nueva aprobacion pendiente
- aprobacion:completada     # Aprobacion finalizada
```

**4.5 Integracion en Componentes**
```typescript
// Actualizar KanbanBoard para usar WebSocket
// src/components/dnd/KanbanBoard.tsx
export function KanbanBoard({ actividadId }: Props) {
  const { tareas, moverTarea } = useRealtimeTablero(`actividad-${actividadId}`);
  // ... usar tareas y moverTarea
}
```

---

### FASE 5: MODULOS COMPLEMENTARIOS
**Prioridad:** MEDIA
**Agentes:** fullstack-developer, frontend-developer (paralelo)

**5.1 Daily Meetings (fullstack-developer)**
```
src/features/daily-meetings/
├── types/
│   └── index.ts
├── services/
│   └── daily-meeting.service.ts
├── components/
│   ├── DailyMeetingForm.tsx      # Formulario crear daily
│   ├── DailyMeetingCard.tsx      # Tarjeta de daily
│   ├── ParticipanteRespuesta.tsx # Respuestas individuales
│   ├── DailyMeetingHistorial.tsx # Lista historica
│   └── DailyMeetingStats.tsx     # Estadisticas
└── index.ts

// Pagina
src/app/(dashboard)/poi/proyectos/[id]/daily/page.tsx
```

**5.2 RRHH Completo (frontend-developer)**
```
src/features/rrhh/
├── types/
│   └── index.ts
├── services/
│   └── rrhh.service.ts
├── components/
│   ├── PersonalTable.tsx         # Tabla con busqueda
│   ├── PersonalCard.tsx          # Tarjeta de persona
│   ├── PersonalForm.tsx          # Formulario edicion
│   ├── HabilidadesManager.tsx    # Gestion de skills
│   ├── AsignacionesView.tsx      # Ver asignaciones
│   ├── DisponibilidadChart.tsx   # Grafico disponibilidad
│   └── CargaTrabajoChart.tsx     # Carga por persona
└── index.ts

// Pagina mejorada
src/app/(dashboard)/recursos-humanos/page.tsx
```

**5.3 Exportacion PDF/Excel (compartido)**
```
src/lib/export/
├── pdf-generator.ts              # Generador PDF con jsPDF
├── excel-generator.ts            # Generador Excel con xlsx
├── templates/
│   ├── informe-sprint.template.ts
│   ├── informe-actividad.template.ts
│   ├── acta-constitucion.template.ts
│   ├── cronograma.template.ts
│   └── dashboard.template.ts
└── index.ts
```

---

## ORDEN DE EJECUCION

### Sprint 1: Infraestructura Base
```
┌─────────────────────────────────────────────────────────────┐
│  CONTEXT-MANAGER: Preparacion del entorno                   │
│  - Instalar dependencias                                    │
│  - Crear estructura de carpetas                             │
│  - Configurar WebSocket client base                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  En PARALELO (4 agentes):                                   │
│                                                             │
│  [FULLSTACK-1]        [FRONTEND-1]       [NEXTJS-1]        │
│  Cronograma           Dashboard          WebSocket          │
│  - Tipos              - Tipos            - Client           │
│  - Services           - Services         - Provider         │
│  - GanttChart         - KPICards         - Hooks            │
└─────────────────────────────────────────────────────────────┘
```

### Sprint 2: Funcionalidades Core
```
┌─────────────────────────────────────────────────────────────┐
│  En PARALELO (4 agentes):                                   │
│                                                             │
│  [FULLSTACK-1]        [FRONTEND-1]       [FRONTEND-2]      │
│  Cronograma           Aprobaciones       Dashboard          │
│  - Dependencias       - Timeline         - Graficos         │
│  - Export             - Actions          - Filtros          │
│  - Pagina             - Modals           - Paginas          │
│                                                             │
│  [NEXTJS-1]                                                 │
│  WebSocket                                                  │
│  - Tablero RT                                               │
│  - Notif RT                                                 │
└─────────────────────────────────────────────────────────────┘
```

### Sprint 3: Integracion y Complementos
```
┌─────────────────────────────────────────────────────────────┐
│  En PARALELO (3-4 agentes):                                 │
│                                                             │
│  [FULLSTACK-1]        [FRONTEND-1]       [FRONTEND-2]      │
│  Daily Meetings       Informes           RRHH               │
│  - Completo           - Sprint           - Completo         │
│                       - Actividad                           │
│                                                             │
│  [CODE-REVIEWER]                                            │
│  - Revision modulos anteriores                              │
│  - Correccion de bugs                                       │
└─────────────────────────────────────────────────────────────┘
```

### Sprint 4: Finalizacion
```
┌─────────────────────────────────────────────────────────────┐
│  [CONTEXT-MANAGER]                                          │
│  - Integracion final de modulos                             │
│  - Testing de flujos completos                              │
│  - Documentacion actualizada                                │
│                                                             │
│  [CODE-REVIEWER]                                            │
│  - Revision final de codigo                                 │
│  - Validacion de permisos                                   │
│  - Performance check                                        │
│                                                             │
│  [TEST-ENGINEER]                                            │
│  - Tests E2E criticos                                       │
│  - Tests de flujos de aprobacion                            │
└─────────────────────────────────────────────────────────────┘
```

---

## DEPENDENCIAS ENTRE MODULOS

```
                    ┌──────────────┐
                    │   WebSocket  │
                    │   (Base)     │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   Tablero     │  │ Notificaciones│  │  Dashboard    │
│   Real-time   │  │   Real-time   │  │  Real-time    │
└───────────────┘  └───────────────┘  └───────────────┘

┌───────────────┐         ┌───────────────┐
│  Cronograma   │         │  Aprobaciones │
│  (Independ.)  │         │  (Independ.)  │
└───────────────┘         └───────┬───────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
             ┌───────────┐ ┌───────────┐ ┌───────────┐
             │   Actas   │ │ Inf.Sprint│ │ Inf.Activ │
             └───────────┘ └───────────┘ └───────────┘
```

---

## ARCHIVOS DE CONTEXTO COMPARTIDO

Para evitar problemas de contexto entre agentes:

```typescript
// src/shared/context-state.ts
// Este archivo mantiene el estado compartido entre modulos

export const MODULOS_ESTADO = {
  cronograma: { completado: false, archivos: [] },
  aprobaciones: { completado: false, archivos: [] },
  dashboard: { completado: false, archivos: [] },
  websocket: { completado: false, archivos: [] },
  dailyMeetings: { completado: false, archivos: [] },
  rrhh: { completado: false, archivos: [] },
  informes: { completado: false, archivos: [] },
};

export const DEPENDENCIAS = {
  'tablero-realtime': ['websocket'],
  'notificaciones-realtime': ['websocket'],
  'dashboard-realtime': ['websocket'],
  'informes-sprint': ['aprobaciones'],
  'informes-actividad': ['aprobaciones'],
  'actas': ['aprobaciones'],
};
```

---

## CHECKLIST DE VALIDACION

### Por cada modulo implementado:
- [ ] Tipos TypeScript correctos
- [ ] Servicios conectan con backend
- [ ] Componentes funcionan en aislamiento
- [ ] Permisos RBAC respetados
- [ ] Manejo de errores implementado
- [ ] Loading states implementados
- [ ] Responsive design verificado
- [ ] Sin errores de TypeScript
- [ ] Sin errores de ESLint

### Integracion:
- [ ] Navegacion funciona
- [ ] Permisos validan correctamente
- [ ] WebSocket conecta
- [ ] Datos persisten correctamente
- [ ] Exportaciones generan archivos

---

## ESTIMACION DE ARCHIVOS

| Modulo | Archivos Nuevos | Archivos Modificados |
|--------|-----------------|---------------------|
| Cronograma | ~12 | ~3 |
| Aprobaciones | ~10 | ~8 |
| Dashboard | ~15 | ~5 |
| WebSocket | ~8 | ~4 |
| Daily Meetings | ~8 | ~2 |
| RRHH | ~10 | ~3 |
| Informes | ~12 | ~4 |
| Export | ~6 | ~2 |
| **TOTAL** | **~81** | **~31** |

---

## COMANDOS PARA INICIAR

```bash
# 1. Instalar dependencias nuevas
npm install gantt-task-react socket.io-client xlsx @types/xlsx

# 2. Verificar backend
curl http://localhost:3010/api/v1/health

# 3. Iniciar desarrollo
npm run dev
```

---

**SIGUIENTE PASO:** Aprobar este plan para comenzar la implementacion con multiples agentes.
