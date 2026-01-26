'use client';

/**
 * DivisionTable Component
 *
 * Tabla de divisiones con búsqueda y filtros
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  FolderPlus,
  Building2,
  Users,
} from 'lucide-react';
import type { Division, Personal } from '../types';
import { getNombreCompleto } from '../types';

interface DivisionTableProps {
  divisiones: Division[];
  onView: (division: Division) => void;
  onEdit: (division: Division) => void;
  onDelete: (division: Division) => void;
  onCreate: () => void;
  isLoading?: boolean;
}

export function DivisionTable({
  divisiones,
  onView,
  onEdit,
  onDelete,
  onCreate,
  isLoading = false,
}: DivisionTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');

  const filteredDivisiones = divisiones.filter((d) => {
    const matchesSearch =
      searchTerm === '' ||
      d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.descripcion && d.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesEstado =
      estadoFilter === 'all' ||
      (estadoFilter === 'activo' && d.activo) ||
      (estadoFilter === 'inactivo' && !d.activo);

    return matchesSearch && matchesEstado;
  });

  const getCoordinadorNombre = (division: Division): string => {
    if (!division.coordinador) return '-';
    return getNombreCompleto(division.coordinador);
  };

  const getDivisionPadreNombre = (division: Division): string => {
    if (!division.divisionPadre) return '-';
    return division.divisionPadre.nombre;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Divisiones
          </CardTitle>
          <Button onClick={onCreate}>
            <FolderPlus className="h-4 w-4 mr-2" />
            Nueva División
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, código o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent position="item-aligned">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="inactivo">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabla */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Coordinador</TableHead>
                <TableHead>División Padre</TableHead>
                <TableHead className="text-center">Personal</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredDivisiones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <p className="text-muted-foreground">
                      No se encontraron divisiones con los filtros aplicados
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDivisiones.map((division) => (
                  <TableRow key={division.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {division.codigo}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{division.nombre}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {division.descripcion || '-'}
                    </TableCell>
                    <TableCell>{getCoordinadorNombre(division)}</TableCell>
                    <TableCell>{getDivisionPadreNombre(division)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{division.totalPersonal || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {division.activo ? (
                        <Badge className="bg-green-500">Activo</Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView(division)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(division)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onDelete(division)}
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
          Mostrando {filteredDivisiones.length} de {divisiones.length} divisiones
        </div>
      </CardContent>
    </Card>
  );
}
