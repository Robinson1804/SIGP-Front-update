'use client';

/**
 * UsuariosTable Component
 *
 * Tabla de usuarios del sistema con gestión de roles
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Users,
  MoreHorizontal,
  KeyRound,
  UserCheck,
  UserX,
  Shield,
  ShieldPlus,
  ShieldMinus,
} from 'lucide-react';
import type { Usuario, Role } from '../types';
import { getRolLabel, getRolColor, getTodosLosRoles } from '../types';

interface UsuariosTableProps {
  usuarios: Usuario[];
  onResetearPassword: (usuarioId: number) => Promise<{ passwordTemporal: string }>;
  onToggleActivo: (usuarioId: number, activo: boolean) => Promise<void>;
  onAgregarRol: (usuarioId: number, rol: Role) => Promise<void>;
  onRemoverRol: (usuarioId: number, rol: Role) => Promise<void>;
  isLoading?: boolean;
}

const ROLES_DISPONIBLES: Role[] = [
  'ADMIN' as Role,
  'PMO' as Role,
  'COORDINADOR' as Role,
  'SCRUM_MASTER' as Role,
  'PATROCINADOR' as Role,
  'DESARROLLADOR' as Role,
  'IMPLEMENTADOR' as Role,
];

export function UsuariosTable({
  usuarios,
  onResetearPassword,
  onToggleActivo,
  onAgregarRol,
  onRemoverRol,
  isLoading = false,
}: UsuariosTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [rolFilter, setRolFilter] = useState<string>('all');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [isRolDialogOpen, setIsRolDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isResetPasswordConfirmOpen, setIsResetPasswordConfirmOpen] = useState(false);
  const [isToggleActivoConfirmOpen, setIsToggleActivoConfirmOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [selectedRol, setSelectedRol] = useState<string>('');
  const [rolAction, setRolAction] = useState<'agregar' | 'remover'>('agregar');
  const [passwordTemporal, setPasswordTemporal] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredUsuarios = usuarios.filter((u) => {
    const todosRoles = getTodosLosRoles(u);
    const matchesSearch =
      searchTerm === '' ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.apellido.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRol =
      rolFilter === 'all' ||
      todosRoles.includes(rolFilter as Role);

    const matchesEstado =
      estadoFilter === 'all' ||
      (estadoFilter === 'activo' && u.activo) ||
      (estadoFilter === 'inactivo' && !u.activo);

    return matchesSearch && matchesRol && matchesEstado;
  });

  const handleAgregarRolClick = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setSelectedRol('');
    setRolAction('agregar');
    setIsRolDialogOpen(true);
  };

  const handleRemoverRolClick = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setSelectedRol('');
    setRolAction('remover');
    setIsRolDialogOpen(true);
  };

  const handleRolSubmit = async () => {
    if (!selectedUsuario || !selectedRol) return;

    setIsSubmitting(true);
    try {
      if (rolAction === 'agregar') {
        await onAgregarRol(selectedUsuario.id, selectedRol as Role);
      } else {
        await onRemoverRol(selectedUsuario.id, selectedRol as Role);
      }
      setIsRolDialogOpen(false);
      setSelectedUsuario(null);
      setSelectedRol('');
    } catch (error) {
      console.error('Error al gestionar rol:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetearPasswordClick = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setIsResetPasswordConfirmOpen(true);
  };

  const handleResetearPasswordConfirm = async () => {
    if (!selectedUsuario) return;
    setIsSubmitting(true);
    try {
      const result = await onResetearPassword(selectedUsuario.id);
      setPasswordTemporal(result.passwordTemporal);
      setIsResetPasswordConfirmOpen(false);
      setIsPasswordDialogOpen(true);
    } catch (error) {
      console.error('Error al resetear contraseña:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActivoClick = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setIsToggleActivoConfirmOpen(true);
  };

  const handleToggleActivoConfirm = async () => {
    if (!selectedUsuario) return;
    setIsSubmitting(true);
    try {
      await onToggleActivo(selectedUsuario.id, !selectedUsuario.activo);
      setIsToggleActivoConfirmOpen(false);
      setSelectedUsuario(null);
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Roles disponibles para agregar (que el usuario no tenga)
  const getRolesParaAgregar = (usuario: Usuario) => {
    const todosRoles = getTodosLosRoles(usuario);
    return ROLES_DISPONIBLES.filter(r => !todosRoles.includes(r));
  };

  // Roles que se pueden remover (adicionales, no el principal)
  const getRolesParaRemover = (usuario: Usuario) => {
    return usuario.rolesAdicionales || [];
  };

  const getRolBadgeColor = (rol: Role): string => {
    // Mapeo directo de rol a clases de Tailwind para evitar purge
    const roleColorMap: Record<string, string> = {
      ADMIN: 'bg-red-500 text-white',
      PMO: 'bg-purple-500 text-white',
      COORDINADOR: 'bg-blue-500 text-white',
      SCRUM_MASTER: 'bg-sky-500 text-white',
      PATROCINADOR: 'bg-orange-500 text-white',
      DESARROLLADOR: 'bg-emerald-500 text-white',
      IMPLEMENTADOR: 'bg-indigo-500 text-white',
    };
    return roleColorMap[rol] || 'bg-gray-500 text-white';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestión de Usuarios
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por usuario, email o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={rolFilter} onValueChange={setRolFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent position="item-aligned">
                <SelectItem value="all">Todos los roles</SelectItem>
                {ROLES_DISPONIBLES.map((rol) => (
                  <SelectItem key={rol} value={rol}>
                    {getRolLabel(rol)}
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
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Rol Principal</TableHead>
                  <TableHead>Roles Adicionales</TableHead>
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
                ) : filteredUsuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">
                        No se encontraron usuarios
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell className="font-mono">
                        {usuario.username}
                      </TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell className="font-medium">
                        {usuario.nombre} {usuario.apellido}
                      </TableCell>
                      <TableCell>
                        <Badge className={getRolBadgeColor(usuario.rol)}>
                          <Shield className="h-3 w-3 mr-1" />
                          {getRolLabel(usuario.rol)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {usuario.rolesAdicionales && usuario.rolesAdicionales.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {usuario.rolesAdicionales.map((rol) => (
                              <Badge
                                key={rol}
                                variant="outline"
                                className="text-xs"
                              >
                                {getRolLabel(rol)}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {usuario.activo ? (
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
                            <DropdownMenuItem onClick={() => handleAgregarRolClick(usuario)}>
                              <ShieldPlus className="h-4 w-4 mr-2" />
                              Agregar rol
                            </DropdownMenuItem>
                            {usuario.rolesAdicionales && usuario.rolesAdicionales.length > 0 && (
                              <DropdownMenuItem onClick={() => handleRemoverRolClick(usuario)}>
                                <ShieldMinus className="h-4 w-4 mr-2" />
                                Remover rol
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleResetearPasswordClick(usuario)}>
                              <KeyRound className="h-4 w-4 mr-2" />
                              Resetear contraseña
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleActivoClick(usuario)}>
                              {usuario.activo ? (
                                <>
                                  <UserX className="h-4 w-4 mr-2" />
                                  Desactivar
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Activar
                                </>
                              )}
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
            Mostrando {filteredUsuarios.length} de {usuarios.length} usuarios
          </div>
        </CardContent>
      </Card>

      {/* Dialog para gestionar roles */}
      <Dialog open={isRolDialogOpen} onOpenChange={setIsRolDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {rolAction === 'agregar' ? 'Agregar Rol' : 'Remover Rol'}
            </DialogTitle>
            <DialogDescription>
              {rolAction === 'agregar'
                ? `Seleccione el rol a agregar al usuario ${selectedUsuario?.username}`
                : `Seleccione el rol a remover del usuario ${selectedUsuario?.username}`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select value={selectedRol} onValueChange={setSelectedRol}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione rol..." />
              </SelectTrigger>
              <SelectContent position="item-aligned">
                {selectedUsuario && (
                  rolAction === 'agregar'
                    ? getRolesParaAgregar(selectedUsuario).map((rol) => (
                        <SelectItem key={rol} value={rol}>
                          {getRolLabel(rol)}
                        </SelectItem>
                      ))
                    : getRolesParaRemover(selectedUsuario).map((rol) => (
                        <SelectItem key={rol} value={rol}>
                          {getRolLabel(rol)}
                        </SelectItem>
                      ))
                )}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRolDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleRolSubmit}
              disabled={!selectedRol || isSubmitting}
              variant={rolAction === 'remover' ? 'destructive' : 'default'}
            >
              {isSubmitting
                ? 'Procesando...'
                : rolAction === 'agregar'
                ? 'Agregar Rol'
                : 'Remover Rol'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para mostrar contraseña temporal */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contraseña Reseteada</DialogTitle>
            <DialogDescription>
              La contraseña del usuario <strong>{selectedUsuario?.username}</strong> ha sido reseteada.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">Nueva contraseña temporal:</p>
              <p className="text-lg font-mono font-bold">{passwordTemporal}</p>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              El usuario deberá cambiar esta contraseña en su próximo inicio de sesión.
            </p>
          </div>

          <DialogFooter>
            <Button onClick={() => {
              setIsPasswordDialogOpen(false);
              setPasswordTemporal('');
              setSelectedUsuario(null);
            }}>
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para resetear contraseña */}
      <Dialog open={isResetPasswordConfirmOpen} onOpenChange={setIsResetPasswordConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-amber-500" />
              Resetear Contraseña
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro de resetear la contraseña del usuario <strong>{selectedUsuario?.username}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                Se generará una nueva contraseña temporal que el usuario deberá cambiar en su próximo inicio de sesión.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsResetPasswordConfirmOpen(false);
                setSelectedUsuario(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleResetearPasswordConfirm}
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {isSubmitting ? 'Procesando...' : 'Resetear Contraseña'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para activar/desactivar usuario */}
      <Dialog open={isToggleActivoConfirmOpen} onOpenChange={setIsToggleActivoConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedUsuario?.activo ? (
                <>
                  <UserX className="h-5 w-5 text-red-500" />
                  Desactivar Usuario
                </>
              ) : (
                <>
                  <UserCheck className="h-5 w-5 text-green-500" />
                  Activar Usuario
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro de {selectedUsuario?.activo ? 'desactivar' : 'activar'} al usuario <strong>{selectedUsuario?.username}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {selectedUsuario?.activo ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  El usuario no podrá acceder al sistema mientras esté desactivado.
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  El usuario podrá volver a acceder al sistema con sus credenciales.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsToggleActivoConfirmOpen(false);
                setSelectedUsuario(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleToggleActivoConfirm}
              disabled={isSubmitting}
              variant={selectedUsuario?.activo ? 'destructive' : 'default'}
              className={!selectedUsuario?.activo ? 'bg-green-500 hover:bg-green-600' : ''}
            >
              {isSubmitting ? 'Procesando...' : (selectedUsuario?.activo ? 'Desactivar' : 'Activar')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
