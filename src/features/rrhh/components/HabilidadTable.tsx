'use client';

/**
 * HabilidadTable Component
 *
 * Tabla de habilidades con búsqueda y filtros por categoría
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
  Edit,
  Trash2,
  Sparkles,
  Plus,
} from 'lucide-react';
import type { Habilidad } from '../types';
import {
  HabilidadCategoria,
  getCategoriaLabel,
  getCategoriaColor,
} from '../types';

interface HabilidadTableProps {
  habilidades: Habilidad[];
  onEdit: (habilidad: Habilidad) => void;
  onDelete: (habilidad: Habilidad) => void;
  onCreate: () => void;
  isLoading?: boolean;
}

export function HabilidadTable({
  habilidades,
  onEdit,
  onDelete,
  onCreate,
  isLoading = false,
}: HabilidadTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');

  const filteredHabilidades = habilidades.filter((h) => {
    const matchesSearch =
      searchTerm === '' ||
      h.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.descripcion && h.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategoria =
      categoriaFilter === 'all' || h.categoria === categoriaFilter;

    const matchesEstado =
      estadoFilter === 'all' ||
      (estadoFilter === 'activo' && h.activo) ||
      (estadoFilter === 'inactivo' && !h.activo);

    return matchesSearch && matchesCategoria && matchesEstado;
  });

  const getCategoriaBadge = (categoria: HabilidadCategoria) => {
    const color = getCategoriaColor(categoria);
    const colorClasses: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      pink: 'bg-pink-100 text-pink-800 border-pink-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return (
      <Badge variant="outline" className={colorClasses[color] || colorClasses.gray}>
        {getCategoriaLabel(categoria)}
      </Badge>
    );
  };

  const categorias = Object.values(HabilidadCategoria);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Habilidades
          </CardTitle>
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Habilidad
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent position="item-aligned">
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categorias.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {getCategoriaLabel(cat)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredHabilidades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <p className="text-muted-foreground">
                      No se encontraron habilidades con los filtros aplicados
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredHabilidades.map((habilidad) => (
                  <TableRow key={habilidad.id}>
                    <TableCell className="font-medium">{habilidad.nombre}</TableCell>
                    <TableCell>{getCategoriaBadge(habilidad.categoria)}</TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {habilidad.descripcion || '-'}
                    </TableCell>
                    <TableCell>
                      {habilidad.activo ? (
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
                          <DropdownMenuItem onClick={() => onEdit(habilidad)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onDelete(habilidad)}
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
          Mostrando {filteredHabilidades.length} de {habilidades.length} habilidades
        </div>
      </CardContent>
    </Card>
  );
}
