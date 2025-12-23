# Checklist de Integración - Módulos de Aprobaciones e Informes

## Pre-requisitos Backend

### Endpoints que deben existir

#### Aprobaciones
- [ ] `GET /aprobaciones/mis-pendientes` - Obtener pendientes del usuario
- [ ] `GET /aprobaciones/pendientes` - Obtener todos (solo PMO)
- [ ] `GET /aprobaciones/{tipo}/{id}/historial` - Historial de aprobación
- [ ] `POST /aprobaciones/{tipo}/{id}/aprobar` - Aprobar entidad
- [ ] `POST /aprobaciones/{tipo}/{id}/rechazar` - Rechazar entidad
- [ ] `POST /aprobaciones/{tipo}/{id}/enviar` - Enviar a revisión

#### Informes de Sprint
- [ ] `GET /informes-sprint` - Listar informes
- [ ] `GET /informes-sprint/{id}` - Obtener por ID
- [ ] `GET /sprints/{sprintId}/informe` - Obtener informe de un sprint
- [ ] `POST /informes-sprint` - Crear informe
- [ ] `PUT /informes-sprint/{id}` - Actualizar informe
- [ ] `DELETE /informes-sprint/{id}` - Eliminar informe
- [ ] `POST /sprints/{sprintId}/generar-informe` - Generar automáticamente

#### Informes de Actividad
- [ ] `GET /informes-actividad` - Listar informes
- [ ] `GET /informes-actividad/{id}` - Obtener por ID
- [ ] `GET /actividades/{actividadId}/informes` - Obtener informes de actividad
- [ ] `POST /informes-actividad` - Crear informe
- [ ] `PUT /informes-actividad/{id}` - Actualizar informe
- [ ] `DELETE /informes-actividad/{id}` - Eliminar informe

## Validación de Código

### Imports funcionan correctamente

Verificar en un componente de prueba:

```tsx
// Test imports en cualquier componente
import {
  AprobacionBadge,
  AprobacionTimeline,
  AprobacionActions,
  useAprobacion,
} from '@/features/aprobaciones';

import {
  InformeSprintView,
  useInformeSprint,
} from '@/features/informes';
```

### TypeScript compila sin errores

```bash
npm run build
```

### Linter pasa

```bash
npm run lint
```

## Integración en Páginas

### 1. Acta de Constitución

Archivo: `src/app/(dashboard)/poi/proyecto/[proyectoId]/actas/constitucion/[actaId]/page.tsx`

```tsx
'use client';

import { useAprobacion, AprobacionTimeline, AprobacionActions } from '@/features/aprobaciones';

export default function ActaConstitucionPage({ params }) {
  const { flujo, aprobar, rechazar } = useAprobacion({
    tipo: 'acta_constitucion',
    entidadId: parseInt(params.actaId),
  });

  return (
    <div>
      {/* Contenido del acta */}
      {flujo && (
        <>
          <AprobacionTimeline flujo={flujo} />
          <AprobacionActions
            flujo={flujo}
            onAprobar={aprobar}
            onRechazar={rechazar}
          />
        </>
      )}
    </div>
  );
}
```

- [ ] Página creada
- [ ] Hook implementado
- [ ] Timeline visible
- [ ] Botones funcionan
- [ ] Permisos validados

### 2. Acta de Reunión

Similar a acta de constitución, cambiar `tipo: 'acta_reunion'`

- [ ] Página creada
- [ ] Hook implementado
- [ ] Timeline visible
- [ ] Botones funcionan
- [ ] Permisos validados

### 3. Informe de Sprint

Archivo: `src/app/(dashboard)/poi/proyecto/[proyectoId]/informes/sprint/[informeId]/page.tsx`

```tsx
import { InformeSprintView } from '@/features/informes';
import { getInformeSprint } from '@/features/informes/services';

export default async function InformeSprintPage({ params }) {
  const informe = await getInformeSprint(parseInt(params.informeId));

  return <InformeSprintView informe={informe} />;
}
```

- [ ] Página creada
- [ ] Vista renderiza correctamente
- [ ] Métricas visibles
- [ ] Aprobación integrada
- [ ] Responsive

### 4. Informe de Actividad

Similar a informe de sprint, usar `InformeActividadView`

- [ ] Página creada
- [ ] Vista renderiza correctamente
- [ ] Métricas Kanban visibles
- [ ] Aprobación integrada
- [ ] Responsive

### 5. Panel de Pendientes en Dashboard

Archivo: `src/app/(dashboard)/dashboard/page.tsx`

```tsx
import { PendientesPanel } from '@/features/aprobaciones';

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Otros widgets */}
      <PendientesPanel />
    </div>
  );
}
```

- [ ] Panel agregado al dashboard
- [ ] Carga pendientes correctamente
- [ ] Filtros funcionan
- [ ] Navegación funciona
- [ ] Contador visible

## Testing Funcional

### Flujo de Aprobación - Acta de Constitución

1. **Crear Acta (Scrum Master)**
   - [ ] Crear nueva acta de constitución
   - [ ] Estado inicial: `borrador`
   - [ ] Botón "Enviar a Revisión" visible

2. **Enviar a Revisión (Scrum Master)**
   - [ ] Click en "Enviar a Revisión"
   - [ ] Estado cambia a: `pendiente_coordinador`
   - [ ] Toast de confirmación
   - [ ] Timeline actualizada

3. **Aprobar como Coordinador**
   - [ ] Login como Coordinador
   - [ ] Ver acta en pendientes
   - [ ] Botón "Aprobar" visible
   - [ ] Click en "Aprobar"
   - [ ] Agregar comentario (opcional)
   - [ ] Estado cambia a: `pendiente_patrocinador`
   - [ ] Timeline actualizada

4. **Aprobar como Patrocinador**
   - [ ] Login como Patrocinador
   - [ ] Ver acta en pendientes
   - [ ] Click en "Aprobar"
   - [ ] Estado cambia a: `aprobado`
   - [ ] Timeline muestra completado

### Flujo de Rechazo

1. **Rechazar como Coordinador**
   - [ ] Login como Coordinador
   - [ ] Ver documento pendiente
   - [ ] Click en "Rechazar"
   - [ ] Modal abre
   - [ ] Validación: motivo obligatorio
   - [ ] Ingresar motivo (min 10 caracteres)
   - [ ] Confirmar
   - [ ] Estado cambia a: `rechazado`
   - [ ] Motivo visible en historial

### Informe de Sprint

1. **Generar Informe Automáticamente**
   - [ ] Finalizar sprint
   - [ ] Click en "Generar Informe"
   - [ ] Backend calcula métricas
   - [ ] Informe creado con datos
   - [ ] Scrum Master completa campos manualmente

2. **Editar Informe**
   - [ ] Abrir informe en estado `borrador`
   - [ ] Editar campos
   - [ ] Guardar cambios
   - [ ] Cambios persistidos

3. **Flujo de Aprobación**
   - [ ] Enviar a revisión
   - [ ] Coordinador aprueba
   - [ ] PMO aprueba
   - [ ] Estado final: `aprobado`

### Panel de Pendientes

1. **Filtros**
   - [ ] Filtro "Todos" muestra todos
   - [ ] Filtro "Acta Constitución" filtra
   - [ ] Filtro "Informe Sprint" filtra
   - [ ] Contador se actualiza

2. **Navegación**
   - [ ] Click en item navega correctamente
   - [ ] Acta abre en página correcta
   - [ ] Informe abre en página correcta

## Validación de Permisos

### Por Rol

**PMO:**
- [ ] Ve todos los pendientes
- [ ] Puede aprobar nivel 2
- [ ] Ve historial completo

**Coordinador:**
- [ ] Ve sus pendientes
- [ ] Puede aprobar nivel 1
- [ ] Puede crear informes de actividad

**Scrum Master:**
- [ ] Puede crear informes de sprint
- [ ] Puede enviar a revisión
- [ ] Ve estado de sus documentos

**Patrocinador:**
- [ ] Puede aprobar actas de constitución
- [ ] Ve solo pendientes asignados

**Desarrollador/Implementador:**
- [ ] Solo lectura
- [ ] No ve botones de aprobación

## UI/UX Validation

### Desktop (1920x1080)
- [ ] Layout 3 columnas se ve correctamente
- [ ] Sidebar de aprobación visible
- [ ] Timeline no se corta
- [ ] Botones bien alineados

### Tablet (768x1024)
- [ ] Layout 2 columnas funciona
- [ ] Sidebar debajo del contenido
- [ ] Touch targets suficientes

### Mobile (375x667)
- [ ] Layout 1 columna
- [ ] Timeline vertical funciona
- [ ] Modal ocupa pantalla completa
- [ ] Botones apilados verticalmente

### Colores y Accesibilidad
- [ ] Verde para aprobado (contraste 4.5:1)
- [ ] Amarillo para pendiente (contraste 4.5:1)
- [ ] Rojo para rechazado (contraste 4.5:1)
- [ ] Iconos descriptivos
- [ ] Textos alternativos

## Performance

### Bundle Size
```bash
npm run build
# Verificar que no aumentó significativamente
```

- [ ] Bundle size aceptable
- [ ] Tree shaking funciona
- [ ] No duplicados

### Loading States
- [ ] Skeletons mientras carga
- [ ] Spinners en botones
- [ ] Feedback visual

### Error Handling
- [ ] Errores de red manejados
- [ ] Toast de error visible
- [ ] Mensaje claro al usuario

## Documentación

- [ ] README actualizado
- [ ] JSDoc en funciones públicas
- [ ] Ejemplos de uso claros
- [ ] TypeScript types exportados

## Deployment

### Pre-deployment
```bash
npm run build
npm run lint
# npm test (cuando existan tests)
```

### Post-deployment
- [ ] Verificar en producción
- [ ] Probar flujo completo
- [ ] Verificar API calls
- [ ] Monitorear errores

## Checklist Final

- [ ] ✅ Todos los archivos creados
- [ ] ✅ Imports funcionan
- [ ] ✅ TypeScript compila
- [ ] ✅ Linter pasa
- [ ] ✅ Integrado en páginas
- [ ] ✅ Testing funcional completo
- [ ] ✅ Permisos validados
- [ ] ✅ UI/UX responsive
- [ ] ✅ Performance OK
- [ ] ✅ Documentación completa
- [ ] ✅ Backend endpoints listos
- [ ] ✅ Deployment exitoso

## Notas

- La implementación está completa y lista para integración
- Los módulos siguen los patrones del proyecto
- TypeScript es estricto y type-safe
- Todos los componentes son reutilizables
- La documentación es exhaustiva

## Soporte

Para dudas o problemas, revisar:
1. `docs/features/QUICK_START_APROBACIONES.md` - Guía rápida
2. `docs/features/APROBACIONES_MODULE.md` - Documentación detallada
3. `docs/features/INFORMES_MODULE.md` - Informes detallado
4. `IMPLEMENTATION_SUMMARY.md` - Resumen de archivos
