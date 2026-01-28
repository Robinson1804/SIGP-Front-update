'use client';

/**
 * PersonalTable Component
 *
 * Tabla de personal con búsqueda y filtros
 * Sincronizado con Backend - Dic 2024
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Users,
  UserCheck,
  Shield,
} from 'lucide-react';
import type { Personal, Division } from '../types';
import {
  Modalidad,
  getModalidadLabel,
  getNombreCompleto,
  getRolLabel,
} from '../types';

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
  const [modalidadFilter, setModalidadFilter] = useState<string>('all');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');

  const filteredPersonal = personal.filter((p) => {
    const nombreCompleto = getNombreCompleto(p);
    const matchesSearch =
      searchTerm === '' ||
      nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigoEmpleado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.dni && p.dni.includes(searchTerm));

    const matchesDivision =
      divisionFilter === 'all' || p.divisionId === Number(divisionFilter);

    const matchesModalidad = modalidadFilter === 'all' || p.modalidad === modalidadFilter;

    const matchesEstado =
      estadoFilter === 'all' ||
      (estadoFilter === 'activo' && p.activo) ||
      (estadoFilter === 'inactivo' && !p.activo) ||
      (estadoFilter === 'disponible' && p.disponible);

    return matchesSearch && matchesDivision && matchesModalidad && matchesEstado;
  });

  const getInitials = (personal: Personal) => {
    return `${personal.nombres[0]}${personal.apellidos[0]}`.toUpperCase();
  };

  const getEstadoBadge = (persona: Personal) => {
    if (!persona.activo) {
      return <Badge variant="secondary">Inactivo</Badge>;
    }
    if (persona.disponible) {
      return <Badge className="bg-green-500">Disponible</Badge>;
    }
    return <Badge className="bg-amber-500">Ocupado</Badge>;
  };

  const getModalidadBadge = (modalidad: Modalidad) => {
    const colorClasses: Record<Modalidad, string> = {
      [Modalidad.NOMBRADO]: 'bg-blue-100 text-blue-800 border-blue-200',
      [Modalidad.CAS]: 'bg-purple-100 text-purple-800 border-purple-200',
      [Modalidad.ORDEN_DE_SERVICIO]: 'bg-orange-100 text-orange-800 border-orange-200',
      [Modalidad.PRACTICANTE]: 'bg-green-100 text-green-800 border-green-200',
    };

    return (
      <Badge variant="outline" className={colorClasses[modalidad]}>
        {getModalidadLabel(modalidad)}
      </Badge>
    );
  };

  const modalidades = Object.values(Modalidad);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Personal
          </CardTitle>
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
              placeholder="Buscar por nombre, email, código o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={divisionFilter} onValueChange={setDivisionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="División" />
            </SelectTrigger>
            <SelectContent position="item-aligned">
              <SelectItem value="all">Todas las divisiones</SelectItem>
              {divisiones.map((div) => (
                <SelectItem key={div.id} value={String(div.id)}>
                  {div.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={modalidadFilter} onValueChange={setModalidadFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Modalidad" />
            </SelectTrigger>
            <SelectContent position="item-aligned">
              <SelectItem value="all">Todas</SelectItem>
              {modalidades.map((mod) => (
                <SelectItem key={mod} value={mod}>
                  {getModalidadLabel(mod)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent position="item-aligned">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="inactivo">Inactivo</SelectItem>
              <SelectItem value="disponible">Disponible</SelectItem>
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
                <TableHead>Modalidad</TableHead>
                <TableHead>Horas/Sem</TableHead>
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
                          <AvatarFallback className="bg-[#004272] text-white">
                            {getInitials(persona)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{getNombreCompleto(persona)}</p>
                          <p className="text-sm text-muted-foreground">
                            {persona.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {persona.codigoEmpleado}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{persona.division?.nombre || '-'}</TableCell>
                    <TableCell>{persona.cargo || '-'}</TableCell>
                    <TableCell>{getModalidadBadge(persona.modalidad)}</TableCell>
                    <TableCell>
                      <span className="font-medium">{persona.horasSemanales}h</span>
                    </TableCell>
                    <TableCell>{getEstadoBadge(persona)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu modal={false}>
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
                          {persona.usuarioId && persona.usuario?.rol && (
                            <DropdownMenuItem disabled>
                              <Shield className="h-4 w-4 mr-2" />
                              Rol: {getRolLabel(persona.usuario.rol)}
                            </DropdownMenuItem>
                          )}
                          {persona.usuarioId && !persona.usuario?.rol && (
                            <DropdownMenuItem disabled>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Tiene acceso
                            </DropdownMenuItem>
                          )}
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
