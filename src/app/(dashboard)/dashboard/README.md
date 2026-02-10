# Dashboard Principal - SIGP

## Descripción General

El Dashboard es el panel de control central del Sistema Integrado de Gestión de Proyectos (SIGP). Proporciona una vista consolidada de todas las métricas clave, estado de proyectos, actividades y sprints activos.

## Componentes del Dashboard

### 1. **KPIs Principales** (Tarjetas Superiores)

Cuatro indicadores clave mostrados en tarjetas:

- **Proyectos Activos**: Total de proyectos en ejecución
- **Actividades Activas**: Total de actividades en curso
- **Sprints en Progreso**: Cantidad de sprints actualmente activos
- **Tasa de Completitud**: Porcentaje promedio de avance

**Funcionalidad:**
- Vista rápida de métricas agregadas
- Actualización automática al cargar la página
- Skeleton loaders durante la carga

### 2. **Salud de Proyectos** (Gráfico de Dona)

Visualización circular que muestra la distribución de proyectos por estado de salud.

**Categorías:**
- 🟢 **Verde (En tiempo)**: Proyectos que van según cronograma
- 🟡 **Amarillo (En riesgo)**: Proyectos con riesgo de atraso
- 🔴 **Rojo (Atrasados)**: Proyectos con problemas críticos o atrasos

**Interacciones:**
- **Hover**: Muestra cantidad, categoría y porcentaje
- **Click**: Puede configurarse para mostrar lista de proyectos (onSegmentClick)
- **Centro**: Muestra total de proyectos cuando no hay hover
- **Leyenda**: Clickeable para acceder a detalles por categoría

**Cálculo de Salud:**
- El backend analiza fechas de inicio/fin, progreso y estado
- Algoritmo compara fechas actuales vs cronograma planificado
- Se actualiza automáticamente con cada cambio en proyectos

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
