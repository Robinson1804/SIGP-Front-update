'use client';

/**
 * AsignacionTable Component
 *
 * Tabla de asignaciones con filtros por tipo y estado
 */

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  CheckCircle,
  Briefcase,
  Calendar,
} from 'lucide-react';
import type { Asignacion, Personal } from '../types';
import {
  TipoAsignacion,
  getTipoAsignacionLabel,
  getNombreCompleto,
  getCargaColor,
} from '../types';

interface AsignacionTableProps {
  asignaciones: Asignacion[];
  personal?: Personal[];
  onEdit: (asignacion: Asignacion) => void;
  onDelete: (asignacion: Asignacion) => void;
  onFinalizar: (asignacion: Asignacion) => void;
  onCreate: () => void;
  isLoading?: boolean;
  showPersonal?: boolean;
}

export function AsignacionTable({
  asignaciones,
  personal = [],
  onEdit,
  onDelete,
  onFinalizar,
  onCreate,
  isLoading = false,
  showPersonal = true,
}: AsignacionTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');

  const filteredAsignaciones = asignaciones.filter((a) => {
    const matchesSearch =
      searchTerm === '' ||
      a.personal?.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.personal?.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.proyecto?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.actividad?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.subproyecto?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.rolEquipo?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTipo =
      tipoFilter === 'all' || a.tipoAsignacion === tipoFilter;

    const matchesEstado =
      estadoFilter === 'all' ||
      (estadoFilter === 'activo' && a.activo) ||
      (estadoFilter === 'finalizado' && !a.activo);

    return matchesSearch && matchesTipo && matchesEstado;
  });

  const getPersonalNombre = (asignacion: Asignacion): string => {
    if (!asignacion.personal) return '-';
    return getNombreCompleto(asignacion.personal);
  };

  const getEntidadNombre = (asignacion: Asignacion): string => {
    if (asignacion.proyecto) return asignacion.proyecto.nombre;
    if (asignacion.actividad) return asignacion.actividad.nombre;
    if (asignacion.subproyecto) return asignacion.subproyecto.nombre;
    return '-';
  };

  const getEntidadCodigo = (asignacion: Asignacion): string => {
    if (asignacion.proyecto) return asignacion.proyecto.codigo;
    if (asignacion.actividad) return asignacion.actividad.codigo;
    if (asignacion.subproyecto) return asignacion.subproyecto.codigo;
    return '-';
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTipoBadge = (tipo: TipoAsignacion) => {
    const colorClasses: Record<TipoAsignacion, string> = {
      [TipoAsignacion.PROYECTO]: 'bg-blue-100 text-blue-800 border-blue-200',
      [TipoAsignacion.ACTIVIDAD]: 'bg-green-100 text-green-800 border-green-200',
      [TipoAsignacion.SUBPROYECTO]: 'bg-purple-100 text-purple-800 border-purple-200',
    };

    return (
      <Badge variant="outline" className={colorClasses[tipo]}>
        {getTipoAsignacionLabel(tipo)}
      </Badge>
    );
  };

  const getCargaProgressColor = (porcentaje: number): string => {
    const color = getCargaColor(porcentaje);
    const colorClasses: Record<string, string> = {
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
    };
    return colorClasses[color] || colorClasses.green;
  };

  const tipos = Object.values(TipoAsignacion);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Asignaciones
          </CardTitle>
          <Button onClick={onCreate}>
            <UserPlus className="h-4 w-4 mr-2" />
            Nueva Asignación
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por personal, proyecto, actividad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {tipos.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {getTipoAsignacionLabel(tipo)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="finalizado">Finalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabla */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {showPersonal && <TableHead>Personal</TableHead>}
                <TableHead>Tipo</TableHead>
                <TableHead>Entidad</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Dedicación</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={showPersonal ? 8 : 7} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAsignaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showPersonal ? 8 : 7} className="text-center py-8">
                    <p className="text-muted-foreground">
                      No se encontraron asignaciones con los filtros aplicados
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAsignaciones.map((asignacion) => (
                  <TableRow key={asignacion.id}>
                    {showPersonal && (
                      <TableCell className="font-medium">
                        {getPersonalNombre(asignacion)}
                      </TableCell>
                    )}
                    <TableCell>{getTipoBadge(asignacion.tipoAsignacion)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{getEntidadNombre(asignacion)}</p>
                        <p className="text-sm text-muted-foreground">
                          {getEntidadCodigo(asignacion)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{asignacion.rolEquipo || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <Progress
                          value={asignacion.porcentajeDedicacion}
                          className="h-2 flex-1"
                        />
                        <span className="text-sm font-medium">
                          {asignacion.porcentajeDedicacion}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {formatDate(asignacion.fechaInicio)}
                          {asignacion.fechaFin && ` - ${formatDate(asignacion.fechaFin)}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {asignacion.activo ? (
                        <Badge className="bg-green-500">Activo</Badge>
                      ) : (
                        <Badge variant="secondary">Finalizado</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(asignacion)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {asignacion.activo && (
                            <DropdownMenuItem onClick={() => onFinalizar(asignacion)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Finalizar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onDelete(asignacion)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer con conteo */}
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredAsignaciones.length} de {asignaciones.length} asignaciones
        </div>
      </CardContent>
    </Card>
  );
}
