/**
 * PendientesPanel Component
 *
 * Panel de entidades pendientes de aprobación
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, FileText, Calendar, User, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { AprobacionBadge } from './AprobacionBadge';
import { getMisPendientes } from '../services';
import type { PendienteAprobacion, TipoEntidadAprobacion } from '../types';
import { TIPO_ENTIDAD_LABELS } from '../types';

interface PendientesPanelProps {
  className?: string;
  onItemClick?: (pendiente: PendienteAprobacion) => void;
}

/**
 * Panel de entidades pendientes de aprobación del usuario
 *
 * @example
 * ```tsx
 * <PendientesPanel />
 * <PendientesPanel onItemClick={(p) => router.push(`/path/${p.id}`)} />
 * ```
 */
export function PendientesPanel({ className, onItemClick }: PendientesPanelProps) {
  const router = useRouter();
  const [pendientes, setPendientes] = useState<PendienteAprobacion[]>([]);
  const [filteredPendientes, setFilteredPendientes] = useState<PendienteAprobacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<TipoEntidadAprobacion | 'todos'>('todos');

  // Cargar pendientes
  useEffect(() => {
    const fetchPendientes = async () => {
      setIsLoading(true);
      try {
        const data = await getMisPendientes();
        setPendientes(data);
        setFilteredPendientes(data);
      } catch (error) {
        console.error('Error al cargar pendientes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendientes();
  }, []);

  // Filtrar por tipo
  useEffect(() => {
    if (filtroTipo === 'todos') {
      setFilteredPendientes(pendientes);
    } else {
      setFilteredPendientes(pendientes.filter((p) => p.tipo === filtroTipo));
    }
  }, [filtroTipo, pendientes]);

  const handleItemClick = (pendiente: PendienteAprobacion) => {
    if (onItemClick) {
      onItemClick(pendiente);
    } else {
      // Navegación por defecto según tipo
      const routes: Record<TipoEntidadAprobacion, (p: PendienteAprobacion) => string> = {
        acta_constitucion: (p) => `/poi/proyecto/${p.proyectoId}/actas/${p.id}`,
        acta_reunion: (p) => `/poi/proyecto/${p.proyectoId}/actas/${p.id}`,
        informe_sprint: (p) => `/poi/proyecto/${p.proyectoId}/informes/${p.id}`,
        informe_actividad: (p) => `/poi/actividad/${p.actividadId}/informes/${p.id}`,
      };

      const route = routes[pendiente.tipo](pendiente);
      router.push(route);
    }
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pendientes de Aprobación</CardTitle>
            <CardDescription>
              {filteredPendientes.length === 0
                ? 'No tienes pendientes'
                : `${filteredPendientes.length} ${filteredPendientes.length === 1 ? 'pendiente' : 'pendientes'}`}
            </CardDescription>
          </div>

          {/* Filtro por tipo */}
          <Select
            value={filtroTipo}
            onValueChange={(value) => setFiltroTipo(value as TipoEntidadAprobacion | 'todos')}
          >
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="acta_constitucion">
                {TIPO_ENTIDAD_LABELS.acta_constitucion}
              </SelectItem>
              <SelectItem value="acta_reunion">
                {TIPO_ENTIDAD_LABELS.acta_reunion}
              </SelectItem>
              <SelectItem value="informe_sprint">
                {TIPO_ENTIDAD_LABELS.informe_sprint}
              </SelectItem>
              <SelectItem value="informe_actividad">
                {TIPO_ENTIDAD_LABELS.informe_actividad}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredPendientes.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {filtroTipo === 'todos'
                ? 'No tienes pendientes de aprobación'
                : 'No hay pendientes de este tipo'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPendientes.map((pendiente) => (
              <div
                key={`${pendiente.tipo}-${pendiente.id}`}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleItemClick(pendiente)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {pendiente.titulo}
                      </h4>
                      <AprobacionBadge estado={pendiente.estadoActual} compact />
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {TIPO_ENTIDAD_LABELS[pendiente.tipo]}
                    </p>
                  </div>
                </div>

                {pendiente.descripcion && (
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                    {pendiente.descripcion}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{pendiente.solicitante.nombre}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(pendiente.fechaSolicitud).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  {pendiente.proyectoNombre && (
                    <div className="text-xs text-blue-600">
                      {pendiente.proyectoNombre}
                    </div>
                  )}
                  {pendiente.actividadNombre && (
                    <div className="text-xs text-purple-600">
                      {pendiente.actividadNombre}
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    Revisar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
