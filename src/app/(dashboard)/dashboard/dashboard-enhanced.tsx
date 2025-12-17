'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
import { StatusPieChart } from '@/components/charts';

/**
 * Dashboard mejorado con componentes modulares
 *
 * Utiliza el hook useDashboard para gestión centralizada del estado
 */
export function DashboardEnhanced() {
  const [filtros, setFiltros] = useState<DashboardFiltros>({
    periodo: 'mes',
  });

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
  } = useDashboard({ filtros });

  // Handler para limpiar filtros
  const handleLimpiarFiltros = () => {
    setFiltros({
      periodo: 'mes',
      proyectoId: undefined,
      oeiId: undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header con filtros y acciones */}
      <div className="bg-[#D5D5D5] border-y border-[#1A5581]">
        <div className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="font-bold text-black text-lg">DASHBOARD</h2>
              <p className="text-sm text-gray-600">
                Visualización integral de proyectos y actividades
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <ExportDashboardButton filtros={filtros} />

              <Button
                size="sm"
                variant="outline"
                onClick={refresh}
                disabled={loading}
                className="h-9"
              >
                <RefreshCw
                  className={cn('h-4 w-4 mr-2', loading && 'animate-spin')}
                />
                Actualizar
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <div className="mt-4">
            <DashboardFilters
              filtros={filtros}
              onFiltrosChange={setFiltros}
              onLimpiar={handleLimpiarFiltros}
            />
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 bg-[#F9F9F9] px-4 pb-4">
        <div className="space-y-6">
          {/* KPIs principales */}
          <KPICards data={dashboardResumen} loading={loading} />

          {/* Grid principal */}
          <DashboardLayout>
            {/* Columna izquierda - Gráficos */}
            <DashboardSection cols={12} colsLg={8} className="space-y-4">
              {/* Proyectos y Actividades por estado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatusPieChart
                  data={proyectosPorEstado.map((item) => ({
                    estado: item.estado,
                    cantidad: item.cantidad,
                    color: item.color,
                  }))}
                  title="PROYECTOS POR ESTADO"
                  loading={loading}
                />

                <StatusPieChart
                  data={
                    dashboardGeneral?.actividadesPorEstado.map((item) => ({
                      estado: item.estado,
                      cantidad: item.cantidad,
                      color: item.color,
                    })) ?? []
                  }
                  title="ACTIVIDADES POR ESTADO"
                  loading={loading}
                />
              </div>

              {/* Avance por OEI */}
              <AvanceOEIChart
                data={avancePorOEI}
                loading={loading}
              />

              {/* Tendencias */}
              <TendenciasChart
                data={tendencias}
                loading={loading}
              />
            </DashboardSection>

            {/* Columna derecha - Alertas y Salud */}
            <DashboardSection cols={12} colsLg={4} className="space-y-4">
              {/* Panel de alertas */}
              <AlertasPanel
                data={alertas}
                loading={loading}
                maxItems={8}
              />

              {/* Salud del proyecto (si hay un proyecto seleccionado en filtros) */}
              {filtros.proyectoId && (
                <SaludProyectoCard
                  data={null} // TODO: cargar con getSaludProyecto(filtros.proyectoId)
                  loading={loading}
                />
              )}
            </DashboardSection>
          </DashboardLayout>

          {/* Sección de actividades recientes */}
          {dashboardGeneral?.actividadReciente &&
            dashboardGeneral.actividadReciente.length > 0 && (
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <h3 className="text-base font-semibold mb-4">
                  ACTIVIDAD RECIENTE
                </h3>
                <div className="space-y-3">
                  {dashboardGeneral.actividadReciente.slice(0, 10).map((actividad) => (
                    <div
                      key={actividad.id}
                      className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium">
                        {actividad.usuario.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{actividad.usuario}</span>{' '}
                          {getActionText(actividad.accion)}{' '}
                          <span className="font-medium">{actividad.entidad}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimestamp(actividad.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

// Helper para texto de acción
function getActionText(accion: string): string {
  const textos: Record<string, string> = {
    creado: 'ha creado',
    actualizado: 'ha actualizado',
    cambio_estado: 'ha cambiado el estado de',
    completado: 'ha completado',
    asignado: 'ha sido asignado a',
    comentado: 'ha comentado en',
  };
  return textos[accion] || accion;
}

// Helper para formatear timestamp
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} minutos`;
  if (diffHours < 24) return `Hace ${diffHours} horas`;
  if (diffDays < 7) return `Hace ${diffDays} dias`;

  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
