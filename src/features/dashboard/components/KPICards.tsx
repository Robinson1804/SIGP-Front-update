'use client';

import {
  Briefcase,
  CheckCircle,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react';
import { MetricCard } from '@/components/charts';
import type { DashboardResumen } from '../types';

interface KPICardsProps {
  data: DashboardResumen | null;
  loading?: boolean;
}

/**
 * Tarjetas de KPIs principales del dashboard
 *
 * Muestra métricas clave: Proyectos activos, completados, atrasados y actividades
 */
export function KPICards({ data, loading = false }: KPICardsProps) {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <MetricCard
            key={i}
            title="Cargando..."
            value={0}
            icon={Briefcase}
            loading={true}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Proyectos Activos"
        value={data.proyectosActivos}
        icon={Briefcase}
        iconColor="text-[#004272]"
        description={`${data.totalProyectos} total`}
      />

      <MetricCard
        title="Proyectos Completados"
        value={data.proyectosCompletados}
        icon={CheckCircle}
        iconColor="text-green-600"
        description={`${((data.proyectosCompletados / data.totalProyectos) * 100).toFixed(0)}% del total`}
      />

      <MetricCard
        title="Proyectos Atrasados"
        value={data.proyectosAtrasados}
        icon={AlertTriangle}
        iconColor="text-red-600"
        description={data.proyectosAtrasados > 0 ? 'Requieren atención' : 'Sin atrasos'}
      />

      <MetricCard
        title="Actividades Activas"
        value={data.actividadesActivas}
        icon={ClipboardList}
        iconColor="text-blue-600"
        description={`${data.totalActividades} total`}
      />
    </div>
  );
}
