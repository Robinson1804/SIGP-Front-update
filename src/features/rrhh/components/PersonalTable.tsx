'use client';

/**
 * PersonalTable Component
 *
 * Tabla de personal con búsqueda y filtros
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  UserPlus,
  Filter,
} from 'lucide-react';
import type { Personal, Division } from '../types';

interface PersonalTableProps {
  personal: Personal[];
  divisiones: Division[];
  onView: (persona: Personal) => void;
  onEdit: (persona: Personal) => void;
  onDelete: (persona: Personal) => void;
  onCreate: () => void;
  isLoading?: boolean;
}

export function PersonalTable({
  personal,
  divisiones,
  onView,
  onEdit,
  onDelete,
  onCreate,
  isLoading = false,
}: PersonalTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [rolFilter, setRolFilter] = useState<string>('all');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');

  const filteredPersonal = personal.filter((p) => {
    const matchesSearch =
      searchTerm === '' ||
      p.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDivision =
      divisionFilter === 'all' || p.divisionId === Number(divisionFilter);

    const matchesRol = rolFilter === 'all' || p.rol === rolFilter;

    const matchesEstado = estadoFilter === 'all' || p.estado === estadoFilter;

    return matchesSearch && matchesDivision && matchesRol && matchesEstado;
  });

  const getInitials = (nombre: string) => {
    return nombre
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'Activo':
        return <Badge className="bg-green-500">Activo</Badge>;
      case 'Inactivo':
        return <Badge variant="secondary">Inactivo</Badge>;
      case 'Licencia':
        return <Badge className="bg-amber-500">Licencia</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const roles = ['ADMIN', 'PMO', 'COORDINADOR', 'SCRUM_MASTER', 'DESARROLLADOR', 'IMPLEMENTADOR'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Personal</CardTitle>
          <Button onClick={onCreate}>
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Personal
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={divisionFilter} onValueChange={setDivisionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="División" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las divisiones</SelectItem>
              {divisiones.map((div) => (
                <SelectItem key={div.id} value={String(div.id)}>
                  {div.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={rolFilter} onValueChange={setRolFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              {roles.map((rol) => (
                <SelectItem key={rol} value={rol}>
                  {rol}
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
              <SelectItem value="Activo">Activo</SelectItem>
              <SelectItem value="Inactivo">Inactivo</SelectItem>
              <SelectItem value="Licencia">Licencia</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabla */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Personal</TableHead>
                <TableHead>División</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Disponibilidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPersonal.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">
                      No se encontró personal con los filtros aplicados
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPersonal.map((persona) => (
                  <TableRow key={persona.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={persona.avatar} />
                          <AvatarFallback className="bg-[#004272] text-white">
                            {getInitials(persona.nombreCompleto)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{persona.nombreCompleto}</p>
                          <p className="text-sm text-muted-foreground">
                            {persona.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{persona.division?.nombre || '-'}</TableCell>
                    <TableCell>{persona.cargo}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{persona.rol}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-green-500"
                            style={{
                              width: `${persona.disponibilidad || 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm">
                          {persona.disponibilidad || 100}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getEstadoBadge(persona.estado)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView(persona)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(persona)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onDelete(persona)}
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
          Mostrando {filteredPersonal.length} de {personal.length} registros
        </div>
      </CardContent>
    </Card>
  );
}
