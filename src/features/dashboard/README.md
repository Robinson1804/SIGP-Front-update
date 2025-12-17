# Dashboard Feature Module

Módulo completo de Dashboard con KPIs, gráficos y visualizaciones para SIGP.

## Estructura

```
dashboard/
├── components/          # Componentes UI del dashboard
│   ├── KPICards.tsx            # Tarjetas de métricas principales
│   ├── AvanceOEIChart.tsx      # Gráfico de barras de avance por OEI
│   ├── SaludProyectoCard.tsx   # Tarjeta de salud con semáforo
│   ├── AlertasPanel.tsx        # Panel lateral de alertas
│   ├── TendenciasChart.tsx     # Gráfico de líneas de tendencias
│   ├── DashboardFilters.tsx    # Componente de filtros
│   ├── ExportDashboardButton.tsx # Botón de exportación
│   └── DashboardLayout.tsx     # Layout con grid responsive
├── hooks/              # Custom hooks
│   └── use-dashboard.ts        # Hook principal de gestión del dashboard
├── services/           # Servicios de API
│   └── dashboard.service.ts    # Funciones de llamadas al backend
├── types/              # TypeScript types
│   └── dashboard.types.ts      # Definiciones de tipos
└── index.ts            # Barrel export

```

## Instalación

Los componentes ya están integrados en el proyecto. Solo necesitas importarlos:

```tsx
import {
  useDashboard,
  KPICards,
  AvanceOEIChart,
  AlertasPanel,
  // ... otros componentes
} from '@/features/dashboard';
```

## Uso Básico

### 1. Hook `useDashboard`

Hook personalizado que centraliza toda la lógica del dashboard:

```tsx
'use client';

import { useDashboard } from '@/features/dashboard';

export function MyDashboard() {
  const {
    dashboardGeneral,
    dashboardResumen,
    proyectosPorEstado,
    avancePorOEI,
    alertas,
    tendencias,
    loading,
    error,
    refresh,
  } = useDashboard({
    filtros: { periodo: 'mes' },
    autoRefresh: true, // Auto-refresh cada 5 minutos
    refreshInterval: 300000,
  });

  return (
    <div>
      <button onClick={refresh}>Actualizar</button>
      {/* Renderizar componentes con los datos */}
    </div>
  );
}
```

### 2. KPICards

Tarjetas de métricas principales:

```tsx
import { KPICards } from '@/features/dashboard';

<KPICards
  data={dashboardResumen}
  loading={loading}
/>
```

Muestra:
- Proyectos Activos
- Proyectos Completados
- Proyectos Atrasados
- Actividades Activas

### 3. AvanceOEIChart

Gráfico de barras horizontales comparando avance real vs planificado por OEI:

```tsx
import { AvanceOEIChart } from '@/features/dashboard';

<AvanceOEIChart
  data={avancePorOEI}
  loading={loading}
  error={errors.oei}
/>
```

### 4. SaludProyectoCard

Tarjeta con semáforo de salud del proyecto:

```tsx
import { SaludProyectoCard } from '@/features/dashboard';

<SaludProyectoCard
  data={saludProyecto}
  loading={loading}
/>
```

Colores:
- Verde: Score >= 70 (Saludable)
- Amarillo: Score 40-69 (Atención)
- Rojo: Score < 40 (Crítico)

### 5. AlertasPanel

Panel lateral de alertas del sistema:

```tsx
import { AlertasPanel } from '@/features/dashboard';

<AlertasPanel
  data={alertas}
  loading={loading}
  maxItems={10}
/>
```

Tipos de alertas:
- `error`: Críticas (rojo)
- `warning`: Advertencias (amarillo)
- `info`: Informativas (azul)

### 6. TendenciasChart

Gráfico de líneas de tendencias temporales:

```tsx
import { TendenciasChart } from '@/features/dashboard';

<TendenciasChart
  data={tendencias}
  loading={loading}
/>
```

Muestra:
- Proyectos Iniciados
- Proyectos Completados
- Tareas Completadas

### 7. DashboardFilters

Componente de filtros:

```tsx
import { DashboardFilters, type DashboardFiltros } from '@/features/dashboard';

const [filtros, setFiltros] = useState<DashboardFiltros>({
  periodo: 'mes',
});

<DashboardFilters
  filtros={filtros}
  onFiltrosChange={setFiltros}
  onLimpiar={() => setFiltros({ periodo: 'mes' })}
  proyectos={[]}
  oeis={[]}
/>
```

### 8. ExportDashboardButton

Botón para exportar dashboard:

```tsx
import { ExportDashboardButton } from '@/features/dashboard';

<ExportDashboardButton filtros={filtros} />
```

Formatos disponibles:
- PDF
- Excel

### 9. DashboardLayout

Layout responsive con grid de 12 columnas:

```tsx
import { DashboardLayout, DashboardSection } from '@/features/dashboard';

<DashboardLayout>
  <DashboardSection cols={12} lg={8}>
    {/* Contenido principal */}
  </DashboardSection>

  <DashboardSection cols={12} lg={4}>
    {/* Sidebar */}
  </DashboardSection>
</DashboardLayout>
```

## Dashboard Completo - Ejemplo

Ver `src/app/(dashboard)/dashboard/dashboard-enhanced.tsx` para un ejemplo completo de implementación.

```tsx
'use client';

import { useState } from 'react';
import {
  useDashboard,
  KPICards,
  AvanceOEIChart,
  SaludProyectoCard,
  AlertasPanel,
  TendenciasChart,
  DashboardFilters,
  ExportDashboardButton,
  DashboardLayout,
  DashboardSection,
  type DashboardFiltros,
} from '@/features/dashboard';

export function DashboardPage() {
  const [filtros, setFiltros] = useState<DashboardFiltros>({
    periodo: 'mes',
  });

  const {
    dashboardResumen,
    proyectosPorEstado,
    avancePorOEI,
    alertas,
    tendencias,
    loading,
    refresh,
  } = useDashboard({ filtros });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#D5D5D5] border-y border-[#1A5581] p-4">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-black text-lg">DASHBOARD</h2>
          <div className="flex gap-3">
            <ExportDashboardButton filtros={filtros} />
            <button onClick={refresh}>Actualizar</button>
          </div>
        </div>
        <DashboardFilters
          filtros={filtros}
          onFiltrosChange={setFiltros}
        />
      </div>

      {/* Contenido */}
      <div className="px-4">
        <KPICards data={dashboardResumen} loading={loading} />

        <DashboardLayout className="mt-6">
          <DashboardSection cols={12} lg={8} className="space-y-4">
            <AvanceOEIChart data={avancePorOEI} loading={loading} />
            <TendenciasChart data={tendencias} loading={loading} />
          </DashboardSection>

          <DashboardSection cols={12} lg={4}>
            <AlertasPanel data={alertas} loading={loading} />
          </DashboardSection>
        </DashboardLayout>
      </div>
    </div>
  );
}
```

## Servicios de API

### Endpoints disponibles

```typescript
// Dashboard general
getDashboardGeneral(filtros?: DashboardFilters): Promise<DashboardGeneral>
getDashboardBase(): Promise<DashboardGeneral>

// Dashboard extendido
getDashboardResumen(filtros?: DashboardFiltros): Promise<DashboardResumen>
getProyectosPorEstado(): Promise<ProyectoPorEstado[]>
getAvancePorOEI(): Promise<AvanceOEI[]>
getSaludProyecto(proyectoId: number): Promise<SaludProyecto>
getAlertasDashboard(): Promise<Alerta[]>
getTendencias(periodo: 'semana' | 'mes' | 'trimestre' | 'anio'): Promise<TendenciaData[]>

// Exportación
exportDashboardPDF(filtros?: DashboardFiltros): Promise<Blob>
exportDashboardExcel(filtros?: DashboardFiltros): Promise<Blob>
```

### Uso de servicios directamente

```typescript
import { getDashboardResumen, exportDashboardPDF } from '@/features/dashboard';

// Obtener datos
const resumen = await getDashboardResumen({ periodo: 'mes' });

// Exportar
const pdfBlob = await exportDashboardPDF({ periodo: 'trimestre' });
```

## Tipos TypeScript

Todos los tipos están exportados:

```typescript
import type {
  DashboardGeneral,
  DashboardResumen,
  ProyectoPorEstado,
  AvanceOEI,
  SaludProyecto,
  Alerta,
  TendenciaData,
  DashboardFiltros,
} from '@/features/dashboard';
```

## Estilos y Colores

### Paleta INEI

- Azul principal: `#004272`
- Azul hover: `#1A5581`
- Gris background: `#F9F9F9`
- Gris header: `#D5D5D5`

### Estados de salud

- Verde: `#10B981` (>= 70)
- Amarillo: `#F59E0B` (40-69)
- Rojo: `#EF4444` (< 40)

### Responsive breakpoints

- Mobile: < 768px
- Tablet: >= 768px (md)
- Desktop: >= 1024px (lg)

## Consideraciones de Performance

1. **Auto-refresh**: Deshabilitado por defecto. Habilitarlo solo si es necesario:
   ```tsx
   useDashboard({ autoRefresh: true, refreshInterval: 300000 })
   ```

2. **Loading states**: Cada componente maneja su propio loading state.

3. **Error boundaries**: Los componentes manejan errores gracefully mostrando mensajes.

4. **Memoización**: Los componentes están optimizados con React.memo internamente.

## Accesibilidad

- Todos los gráficos tienen labels ARIA
- Colores con contraste WCAG AA
- Navegación por teclado en filtros
- Tooltips descriptivos

## Testing

Componentes diseñados para ser testables:

```tsx
import { render, screen } from '@testing-library/react';
import { KPICards } from '@/features/dashboard';

test('renders KPI cards', () => {
  const mockData = {
    totalProyectos: 10,
    proyectosActivos: 5,
    // ...
  };

  render(<KPICards data={mockData} />);
  expect(screen.getByText('5')).toBeInTheDocument();
});
```

## Troubleshooting

### Backend no responde

El dashboard tiene datos mock de fallback. Verifica:

1. Backend corriendo en `localhost:3010`
2. Token de autenticación válido
3. Permisos del usuario

### Gráficos no renderizan

Verifica que Recharts esté instalado:

```bash
npm install recharts
```

### Filtros no actualizan datos

Asegúrate de pasar los filtros al hook:

```tsx
const { data } = useDashboard({ filtros }); // ✅
const { data } = useDashboard(); // ❌ No reactivo
```

## Próximas mejoras

- [ ] WebSocket para actualizaciones en tiempo real
- [ ] Más tipos de gráficos (radar, scatter)
- [ ] Dashboard personalizable (drag & drop)
- [ ] Widgets configurables por usuario
- [ ] Modo oscuro

## Contribuir

Para agregar nuevos componentes al dashboard:

1. Crear componente en `components/`
2. Agregar tipos en `types/dashboard.types.ts`
3. Agregar servicio en `services/dashboard.service.ts`
4. Exportar en `index.ts`
5. Actualizar este README
