'use client';

/**
 * RRHHDashboard Component
 *
 * Dashboard con estadísticas visuales de recursos humanos:
 * - KPIs principales
 * - Distribución por división
 * - Distribución por modalidad
 * - Alertas de sobrecarga
 * - Personal más demandado
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Users,
  UserCheck,
  Activity,
  Building2,
  AlertTriangle,
  TrendingUp,
  Briefcase,
} from 'lucide-react';
import type {
  Personal,
  Division,
  Asignacion,
  AlertaSobrecarga,
  RRHHStats,
} from '../types';
import {
  Modalidad,
  getModalidadLabel,
  getNombreCompleto,
  getCargaColor,
} from '../types';

interface RRHHDashboardProps {
  stats: RRHHStats | null;
  personal: Personal[];
  divisiones: Division[];
  asignaciones: Asignacion[];
  alertasSobrecarga: AlertaSobrecarga[];
  isLoading?: boolean;
}

export function RRHHDashboard({
  stats,
  personal,
  divisiones,
  asignaciones,
  alertasSobrecarga,
  isLoading = false,
}: RRHHDashboardProps) {
  // Calcular distribución por división
  const distribucionDivisiones = divisiones
    .filter((d) => d.activo)
    .map((d) => ({
      ...d,
      cantidad: personal.filter((p) => p.divisionId === d.id && p.activo).length,
    }))
    .filter((d) => d.cantidad > 0)
    .sort((a, b) => b.cantidad - a.cantidad);

  // Calcular distribución por modalidad
  const distribucionModalidad = Object.values(Modalidad).map((mod) => ({
    modalidad: mod,
    cantidad: personal.filter((p) => p.modalidad === mod && p.activo).length,
  })).filter((m) => m.cantidad > 0);

  // Personal más asignado (top 5)
  const personalMasAsignado = personal
    .filter((p) => p.activo)
    .map((p) => {
      const asignacionesPersona = asignaciones.filter(
        (a) => a.personalId === p.id && a.activo
      );
      // Convertir a número para evitar concatenación de strings
      const cargaTotal = asignacionesPersona.reduce(
        (acc, a) => acc + Number(a.porcentajeDedicacion),
        0
      );
      return {
        ...p,
        cargaTotal,
        numAsignaciones: asignacionesPersona.length,
      };
    })
    .filter((p) => p.numAsignaciones > 0)
    .sort((a, b) => b.cargaTotal - a.cargaTotal)
    .slice(0, 5);

  const totalActivos = personal.filter((p) => p.activo).length;

  const getModalidadColor = (modalidad: Modalidad): string => {
    const colors: Record<Modalidad, string> = {
      [Modalidad.NOMBRADO]: 'bg-blue-500',
      [Modalidad.CAS]: 'bg-purple-500',
      [Modalidad.ORDEN_DE_SERVICIO]: 'bg-orange-500',
      [Modalidad.PRACTICANTE]: 'bg-green-500',
    };
    return colors[modalidad];
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-16 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Personal
                </p>
                <p className="text-3xl font-bold">{stats?.totalPersonal || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.personalActivo || 0} activos
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Disponibles
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {stats?.personalDisponible || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.promedioDisponibilidad?.toFixed(0) || 0}% del total
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Asignaciones Activas
                </p>
                <p className="text-3xl font-bold">{stats?.totalAsignaciones || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  En proyectos y actividades
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Alertas Sobrecarga
                </p>
                <p className={`text-3xl font-bold ${(stats?.alertasSobrecarga || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {stats?.alertasSobrecarga || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Personal con +100% carga
                </p>
              </div>
              <div className={`h-12 w-12 rounded-full ${(stats?.alertasSobrecarga || 0) > 0 ? 'bg-red-100' : 'bg-green-100'} flex items-center justify-center`}>
                <AlertTriangle className={`h-6 w-6 ${(stats?.alertasSobrecarga || 0) > 0 ? 'text-red-600' : 'text-green-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribución por División */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Por División
            </CardTitle>
            <CardDescription>
              Distribución de personal activo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {distribucionDivisiones.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Sin datos
              </p>
            ) : (
              <div className="space-y-4">
                {distribucionDivisiones.map((div) => (
                  <div key={div.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium truncate pr-2" title={div.nombre}>
                        {div.nombre}
                      </span>
                      <span className="text-muted-foreground">
                        {div.cantidad} ({((div.cantidad / totalActivos) * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <Progress
                      value={(div.cantidad / totalActivos) * 100}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribución por Modalidad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Por Modalidad
            </CardTitle>
            <CardDescription>
              Tipos de contratación
            </CardDescription>
          </CardHeader>
          <CardContent>
            {distribucionModalidad.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Sin datos
              </p>
            ) : (
              <div className="space-y-4">
                {distribucionModalidad.map((m) => (
                  <div key={m.modalidad}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getModalidadColor(m.modalidad)}`} />
                        <span className="font-medium">
                          {getModalidadLabel(m.modalidad)}
                        </span>
                      </div>
                      <span className="text-muted-foreground">
                        {m.cantidad} ({((m.cantidad / totalActivos) * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <Progress
                      value={(m.cantidad / totalActivos) * 100}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personal más demandado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Más Demandados
            </CardTitle>
            <CardDescription>
              Personal con mayor carga de trabajo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {personalMasAsignado.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Sin asignaciones activas
              </p>
            ) : (
              <div className="space-y-4">
                {personalMasAsignado.map((p, index) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                      {index + 1}
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-[#004272] text-white text-xs">
                        {p.nombres[0]}{p.apellidos[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {getNombreCompleto(p)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.numAsignaciones} asignación{p.numAsignaciones !== 1 ? 'es' : ''}
                      </p>
                    </div>
                    <Badge className={getCargaColor(p.cargaTotal)}>
                      {p.cargaTotal}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alertas de sobrecarga (si hay) */}
      {alertasSobrecarga.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Sobrecarga
            </CardTitle>
            <CardDescription className="text-red-600">
              Personal con dedicación superior al 100%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alertasSobrecarga.map((alerta) => (
                <div
                  key={alerta.personalId}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white border border-red-200"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-red-600 text-white">
                      {alerta.nombres[0]}{alerta.apellidos[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {alerta.nombres} {alerta.apellidos}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {alerta.codigoEmpleado}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">
                      {alerta.porcentajeTotal}%
                    </p>
                    <p className="text-xs text-red-500">
                      +{alerta.exceso}% exceso
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen de divisiones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Resumen por Divisiones
          </CardTitle>
          <CardDescription>
            {stats?.totalDivisiones || 0} divisiones activas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {divisiones
              .filter((d) => d.activo)
              .map((div) => {
                const personalDiv = personal.filter(
                  (p) => p.divisionId === div.id && p.activo
                ).length;
                const disponiblesDiv = personal.filter(
                  (p) => p.divisionId === div.id && p.activo && p.disponible
                ).length;

                return (
                  <div
                    key={div.id}
                    className="p-4 rounded-lg border bg-white text-center hover:border-[#004272] transition-colors"
                  >
                    <p className="font-medium text-sm truncate" title={div.nombre}>
                      {div.codigo}
                    </p>
                    <p className="text-2xl font-bold mt-1">{personalDiv}</p>
                    <p className="text-xs text-muted-foreground">personal</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs text-green-600">
                        {disponiblesDiv} disponibles
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
