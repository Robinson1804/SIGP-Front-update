# Dashboard Principal - SIGP

## Descripción General

El Dashboard es el panel de control central del Sistema Integrado de Gestión de Proyectos (SIGP). Proporciona una vista consolidada de todas las métricas clave, estado de proyectos, actividades y sprints activos.

## Componentes del Dashboard

### 1. **KPIs Principales** (Tarjetas Superiores)

Cuatro indicadores clave mostrados en tarjetas interactivas con métricas en tiempo real:

#### **a) Proyectos**
Muestra el total de proyectos activos en el sistema.

**Datos Mostrados:**
- **Valor Principal**: Número total de proyectos activos
- **Variación**: Porcentaje de cambio vs. periodo anterior (ej: +12%)
- **Tendencia**: Indicador visual (↑ verde, ↓ rojo, — gris)
- **Detalles Desglosados**:
  - `En curso`: Proyectos actualmente en ejecución
  - `Finalizados`: Proyectos completados en el periodo
  - `Atrasados`: Proyectos con retraso en cronograma
  - `Pendientes`: Proyectos sin iniciar

**Interacción:**
- **Click en card** → Redirige a `/poi?tipo=Proyecto` (lista filtrada de proyectos)

**Ejemplo Visual:**
```
┌─────────────────────────┐
│ Proyectos        📊     │
│                         │
│ 24      +12% ↑         │
│ vs. periodo anterior    │
│                         │
│ [8 En curso]           │
│ [12 Finalizados]       │
│ [2 Atrasados]          │
└─────────────────────────┘
```

---

#### **b) Actividades**
Muestra el total de actividades (KANBAN) activas en el sistema.

**Datos Mostrados:**
- **Valor Principal**: Número total de actividades activas
- **Variación**: Cambio porcentual vs. periodo anterior
- **Tendencia**: Indicador de crecimiento/decrecimiento
- **Detalles Desglosados**:
  - `En curso`: Actividades en desarrollo
  - `Finalizados`: Actividades completadas
  - `Pendientes`: Actividades planificadas sin iniciar

**Interacción:**
- **Click en card** → Redirige a `/poi?tipo=Actividad` (lista filtrada de actividades)

---

#### **c) Sprints Activos**
Muestra la cantidad de sprints actualmente en progreso.

**Datos Mostrados:**
- **Valor Principal**: Número de sprints en estado "En progreso"
- **Variación**: Cambio vs. periodo anterior
- **Tendencia**: Dirección del cambio
- **Detalles Desglosados**:
  - `En curso`: Sprints actualmente activos
  - `Finalizados`: Sprints completados en el periodo

**Características:**
- Solo cuenta sprints con estado "En progreso" o "Activo"
- No incluye sprints planificados o completados
- Se actualiza automáticamente al iniciar/finalizar sprints

---

#### **d) Tareas del Día**
Muestra las tareas relevantes para hoy basadas en fechas de vencimiento y prioridad.

**Datos Mostrados:**
- **Valor Principal**: Número de tareas programadas o vencidas para hoy
- **Variación**: Cambio en carga de trabajo vs. día anterior
- **Tendencia**: Indicador de volumen de trabajo
- **Detalles Desglosados**:
  - `En curso`: Tareas actualmente siendo trabajadas
  - `Finalizados`: Tareas completadas hoy
  - `Atrasados`: Tareas vencidas sin completar
  - `Pendientes`: Tareas programadas para hoy sin iniciar

**Criterios de Inclusión:**
```typescript
// Una tarea se cuenta como "del día" si:
1. Fecha de vencimiento = HOY
2. Estado ≠ Finalizado
3. Activa en el sistema (no eliminada)
```

**Casos de Uso:**
- **Para Desarrolladores/Implementadores**: Solo muestra SUS tareas asignadas
- **Para Scrum Masters**: Tareas de los proyectos que coordina
- **Para PMO/Coordinadores**: Vista completa de todas las tareas del día

**Algoritmo de Cálculo:**
```sql
-- Backend calcula:
SELECT COUNT(*)
FROM tareas
WHERE
  fechaVencimiento = CURRENT_DATE
  AND estado != 'Finalizado'
  AND activo = true
  AND (filtros por rol/usuario)
```

**Ejemplo Visual:**
```
┌─────────────────────────┐
│ Tareas del Día   ✓     │
│                         │
│ 15      -3% ↓          │
│ vs. periodo anterior    │
│                         │
│ [5 En curso]           │
│ [7 Finalizados]        │
│ [2 Atrasados]          │
│ [1 Pendientes]         │
└─────────────────────────┘
```

---

**Funcionalidad General de KPIs:**
- ✅ Vista rápida de métricas agregadas
- ✅ Comparación con periodo anterior (día/semana/mes según selector)
- ✅ Indicadores visuales de tendencia (colores + íconos)
- ✅ Desglose detallado en badges con colores semánticos
- ✅ Skeleton loaders durante la carga
- ✅ Click para navegar a vista detallada (excepto Sprints y Tareas del Día)
- ✅ Hover effect para indicar interactividad

### 2. **Salud de Proyectos** (Gráfico de Dona)

Visualización circular interactiva que muestra la distribución de proyectos activos según su estado de salud, calculado automáticamente por el sistema.

#### **Categorías de Salud:**

🟢 **VERDE (En tiempo)** - Proyectos saludables
- Progreso real ≥ progreso planificado
- No hay sprints atrasados
- No hay bloqueos críticos
- Cronograma dentro de márgenes aceptables

🟡 **AMARILLO (En riesgo)** - Proyectos con alertas tempranas
- Progreso real ligeramente por debajo de lo planificado
- 1-2 sprints con leve atraso
- Posibles bloqueos en historias de usuario
- Requiere atención preventiva

🔴 **ROJO (Atrasados)** - Proyectos críticos
- Progreso real significativamente por debajo de lo planificado
- Múltiples sprints atrasados
- Bloqueos críticos sin resolver
- Fecha de entrega en riesgo
- Requiere intervención inmediata

---

#### **Interacciones del Usuario:**

**Hover sobre segmentos:**
```
┌─────────────────────┐
│       12            │  ← Cantidad
│    En tiempo        │  ← Categoría
│      (60%)         │  ← Porcentaje
└─────────────────────┘
```
- Muestra cantidad exacta de proyectos
- Nombre de la categoría
- Porcentaje sobre el total

**Centro del gráfico:**
- **Sin hover**: Muestra total general de proyectos
- **Con hover**: Se oculta para dar espacio a los detalles del segmento

**Leyenda interactiva (debajo del gráfico):**
```
┌─────────────────────────────────┐
│ ● En tiempo       12  (60%)     │  ← Click para ver lista
│ ● En riesgo        5  (25%)     │
│ ● Atrasados        3  (15%)     │
└─────────────────────────────────┘
```
- Tarjetas verticales con bordes
- Indicador de color circular
- Contadores y porcentajes
- **Click en tarjeta** → Ejecuta `onSegmentClick` (configurable)

**Click en segmentos del gráfico:**
- Puede configurarse para mostrar modal con lista detallada
- Actualmente logueado en consola (para debug)
- Funcionalidad extensible para dashboard ejecutivo

---

#### **Algoritmo de Cálculo de Salud:**

El backend analiza múltiples factores para determinar la salud:

```typescript
// Pseudocódigo del algoritmo
function calcularSaludProyecto(proyecto) {
  let score = 100;

  // Factor 1: Progreso vs. Tiempo transcurrido
  const tiempoTranscurrido = (hoy - fechaInicio) / (fechaFin - fechaInicio);
  const progresoEsperado = tiempoTranscurrido * 100;
  const desviacion = progresoReal - progresoEsperado;

  if (desviacion < -20) score -= 40;  // Muy atrasado
  else if (desviacion < -10) score -= 20;  // Atrasado
  else if (desviacion < 0) score -= 10;   // Ligeramente atrasado

  // Factor 2: Sprints atrasados
  const sprintsAtrasados = contarSprintsAtrasados(proyecto);
  score -= sprintsAtrasados * 15;

  // Factor 3: Historias bloqueadas
  const historiasBloqueadas = contarHistoriasBloqueadas(proyecto);
  score -= historiasBloqueadas * 5;

  // Factor 4: Story Points sin asignar
  const storyPointsSinAsignar = calcularStoryPointsSinAsignar(proyecto);
  if (storyPointsSinAsignar > 20) score -= 10;

  // Clasificación final
  if (score >= 70) return 'verde';
  if (score >= 40) return 'amarillo';
  return 'rojo';
}
```

**Factores Evaluados:**
1. **Progreso real vs. planificado** (peso: 40%)
2. **Estado de sprints** (peso: 30%)
3. **Bloqueos y dependencias** (peso: 20%)
4. **Asignación de trabajo** (peso: 10%)

---

#### **Ejemplo Visual Completo:**

```
┌─────────────────────────────────────────┐
│  ♥ SALUD DE PROYECTOS                   │
├─────────────────────────────────────────┤
│                                         │
│          ╭─────────╮                    │
│         ╱           ╲                   │
│        │     20      │  ← Total         │
│        │  proyectos  │                  │
│         ╲           ╱                   │
│          ╰─────────╯                    │
│     🟢 60%  🟡 25%  🔴 15%             │
│                                         │
├─────────────────────────────────────────┤
│  ● En tiempo        12  (60%)          │
│  ● En riesgo         5  (25%)          │
│  ● Atrasados         3  (15%)          │
└─────────────────────────────────────────┘
```

---

#### **Actualización de Datos:**

**Cuándo se recalcula:**
- ✅ Al completar/iniciar un sprint
- ✅ Al finalizar tareas de una historia
- ✅ Al cambiar el estado de una historia de usuario
- ✅ Al agregar/quitar bloqueos
- ✅ Cada vez que se carga el dashboard (datos frescos)

**Frecuencia de refresco:**
- Manual: Botón refresh en header del dashboard
- Automático: Al cargar la página
- En tiempo real (futuro): WebSocket para updates instantáneos

---

#### **Casos de Uso:**

**Para PMO:**
- Vista rápida de proyectos que requieren intervención
- Identificar patrones de problemas
- Priorizar apoyo a proyectos en rojo/amarillo

**Para Coordinadores:**
- Monitorear salud de sus proyectos
- Justificar necesidad de recursos adicionales
- Tomar acciones preventivas en proyectos amarillos

**Para Ejecutivos:**
- Dashboard ejecutivo de salud del portafolio
- KPI para reportes gerenciales
- Métricas de calidad de gestión de proyectos

---

#### **Datos Retornados por el Backend:**

```typescript
interface SaludProyectosDetallada {
  verde: ProyectoSaludDetalle[];      // Array de proyectos verdes
  amarillo: ProyectoSaludDetalle[];   // Array de proyectos amarillos
  rojo: ProyectoSaludDetalle[];       // Array de proyectos rojos
  resumen: {
    verde: number;                     // Total verde
    amarillo: number;                  // Total amarillo
    rojo: number;                      // Total rojo
  };
}

interface ProyectoSaludDetalle {
  id: number;
  codigo: string;
  nombre: string;
  salud: 'verde' | 'amarillo' | 'rojo';
  razon: string;  // Explicación del score (ej: "2 sprints atrasados")
}
```

**Endpoint:**
```
GET /api/v1/dashboard/salud-proyectos
```

---

#### **Estados Edge Case:**

**Sin proyectos activos:**
```
┌─────────────────────────────────┐
│  ♥ SALUD DE PROYECTOS           │
├─────────────────────────────────┤
│         💔                      │
│  No hay proyectos para analizar │
└─────────────────────────────────┘
```

**Error al cargar:**
```
┌─────────────────────────────────┐
│  ♥ SALUD DE PROYECTOS           │
├─────────────────────────────────┤
│         ⚠️                      │
│  Error al cargar datos          │
└─────────────────────────────────┘
```

**Cargando:**
```
┌─────────────────────────────────┐
│  ♥ SALUD DE PROYECTOS           │
├─────────────────────────────────┤
│    [Skeleton circular]          │
└─────────────────────────────────┘
```

### 3. **Timeline de Sprints** (Gráfico Gantt)

Línea de tiempo horizontal mostrando todos los sprints activos.

**Información Mostrada:**
- Barras horizontales por sprint
- Fechas de inicio y fin
- Progreso visual
- Proyecto asociado

**Funcionalidad:**
- Click en sprint → Navega a vista detallada del sprint
- Scroll horizontal para sprints fuera de rango
- Identificación de solapamientos

### 4. **Tabla de Proyectos Activos**

Lista de los proyectos actualmente en ejecución.

**Columnas:**
- Código del proyecto
- Nombre
- Coordinador
- Estado
- Progreso (%)
- Acciones

**Funcionalidad:**
- Muestra máximo 5 proyectos
- Botón "Ver todos" → Navega a lista completa de proyectos
- Click en fila → Abre detalles del proyecto
- Ordenamiento por fecha de actualización (más recientes primero)

### 5. **Tabla de Actividades Activas**

Lista de actividades KANBAN en curso.

**Columnas:**
- Código de actividad
- Nombre
- Coordinador/Gestor
- Estado
- Tareas completadas
- Acciones

**Funcionalidad:**
- Muestra máximo 5 actividades
- Botón "Ver todos" → Navega a lista completa de actividades
- Click en fila → Abre detalles de la actividad

## Navegación

### Desde el Dashboard:

```
Dashboard
├─ Click en proyecto → /poi/proyecto/detalles?id={proyectoId}
├─ Click en actividad → /poi/actividad/detalles?id={actividadId}
├─ Click en sprint → /poi/proyecto/detalles?id={proyectoId}&tab=Backlog
├─ "Ver todos proyectos" → /poi
└─ "Ver todos actividades" → /poi
```

## Permisos de Acceso

### Quién puede ver el Dashboard:

| Rol | Acceso | Notas |
|-----|--------|-------|
| ADMINISTRADOR | ❌ No | Solo accede a RRHH |
| PMO | ✅ Sí | Vista completa de todos los proyectos |
| COORDINADOR | ✅ Sí | Ve solo sus proyectos/actividades |
| SCRUM_MASTER | ✅ Sí | Ve solo sprints donde es SM |
| DESARROLLADOR | ✅ Sí | Vista limitada a tareas asignadas |
| IMPLEMENTADOR | ✅ Sí | Vista limitada a tareas asignadas |
| PATROCINADOR | ✅ Sí | Vista de proyectos donde es patrocinador |

**Nota**: El backend filtra automáticamente los datos según el rol del usuario.

## Actualización de Datos

### Cuándo se actualiza:

1. **Al cargar la página**: Fetch inicial de todos los componentes
2. **Después de acciones**:
   - Crear/editar/eliminar proyecto
   - Cambiar estado de sprint
   - Finalizar tareas
3. **Manual**: Refresh del navegador (F5)

### Datos en Tiempo Real:

⚠️ **Nota**: Actualmente NO hay actualización automática en tiempo real. Se planea implementar WebSockets para:
- Notificaciones de cambios
- Actualización automática de métricas
- Alerts de sprints que inician/finalizan

## Arquitectura Técnica

### Componentes:

```
dashboard-content.tsx (Página principal)
├─ KPICards.tsx (Tarjetas de métricas)
├─ SaludProyectosDonut.tsx (Gráfico de salud)
├─ GanttTimeline.tsx (Timeline de sprints)
├─ ProyectosActivosTable.tsx (Tabla de proyectos)
└─ ActividadesActivasTable.tsx (Tabla de actividades)
```

### Servicios API:

```typescript
// Llamadas al backend
GET /api/v1/dashboard/kpis
GET /api/v1/dashboard/salud-proyectos
GET /api/v1/dashboard/proyectos-activos
GET /api/v1/dashboard/actividades-activas
GET /api/v1/dashboard/sprints-activos
```

### Estado:

```typescript
const [loading, setLoading] = useState(true);
const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
const [saludProyectos, setSaludProyectos] = useState<SaludProyectosDetallada | null>(null);
const [proyectos, setProyectos] = useState<ProyectoActivo[]>([]);
const [actividades, setActividades] = useState<ActividadActiva[]>([]);
const [sprints, setSprints] = useState<SprintTimeline[]>([]);
```

## Mejoras Futuras

### En Desarrollo:
- [ ] WebSocket para actualización en tiempo real
- [ ] Exportar dashboard a PDF
- [ ] Filtros de fecha personalizados
- [ ] Comparación período anterior
- [ ] Gráficos de tendencias

### Propuestas:
- [ ] Calendario de hitos importantes
- [ ] Widget de tareas pendientes del usuario
- [ ] Alertas de sprints próximos a vencer
- [ ] Métricas de velocidad por equipo
- [ ] Burndown chart agregado

## Troubleshooting

### Problema: Dashboard no carga
**Solución**: Verificar que el backend esté corriendo en `localhost:3010`

### Problema: Datos desactualizados
**Solución**: Refresh del navegador (F5) o verificar permisos del usuario

### Problema: Gráfico de salud vacío
**Solución**: Verificar que existan proyectos activos en el sistema

### Problema: Timeline no muestra sprints
**Solución**: Confirmar que hay sprints con estado "Activo"

## Contacto y Soporte

Para reportar bugs o sugerir mejoras al Dashboard:
- GitHub Issues: `https://github.com/Robinson1804/SIGP-Front-update/issues`
- Documentación completa: `/docs`
