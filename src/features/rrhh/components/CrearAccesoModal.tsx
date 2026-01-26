'use client';

/**
 * CrearAccesoModal Component
 *
 * Modal para crear un usuario del sistema desde un personal existente
 * Implementa el flujo: Personal → Usuario
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, UserPlus, Key, Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/lib/hooks/use-toast';
import type { Personal } from '../types';
import { Role, getRolLabel, getNombreCompleto } from '../types';

interface CrearAccesoModalProps {
  open: boolean;
  onClose: () => void;
  personal: Personal | null;
  onCrearAcceso: (personalId: number, rol: Role) => Promise<{
    usuarioId: number;
    username: string;
    email: string;
    passwordTemporal: string;
    rol: string;
    mensaje: string;
  }>;
}

interface CredencialesCreadas {
  username: string;
  email: string;
  passwordTemporal: string;
  rol: string;
}

export function CrearAccesoModal({
  open,
  onClose,
  personal,
  onCrearAcceso,
}: CrearAccesoModalProps) {
  const { toast } = useToast();
  const [selectedRol, setSelectedRol] = useState<Role>(Role.DESARROLLADOR);
  const [isLoading, setIsLoading] = useState(false);
  const [credenciales, setCredenciales] = useState<CredencialesCreadas | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Roles disponibles para asignar (excluye ADMIN por seguridad)
  const rolesDisponibles = [
    Role.PMO,
    Role.COORDINADOR,
    Role.SCRUM_MASTER,
    Role.PATROCINADOR,
    Role.DESARROLLADOR,
    Role.IMPLEMENTADOR,
  ];

  const handleCrearAcceso = async () => {
    if (!personal) return;

    setIsLoading(true);
    try {
      const resultado = await onCrearAcceso(personal.id, selectedRol);
      setCredenciales({
        username: resultado.username,
        email: resultado.email,
        passwordTemporal: resultado.passwordTemporal,
        rol: resultado.rol,
      });
      toast({
        title: 'Usuario creado',
        description: `Se creó el acceso para ${getNombreCompleto(personal)}`,
      });
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast({
        title: 'Error al crear usuario',
        description: axiosError.response?.data?.message || 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleClose = () => {
    setCredenciales(null);
    setSelectedRol(Role.DESARROLLADOR);
    onClose();
  };

  if (!personal) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#004272]" />
            Crear Acceso al Sistema
          </DialogTitle>
          <DialogDescription>
            {credenciales
              ? 'Usuario creado exitosamente. Guarde las credenciales.'
              : `Crear cuenta de usuario para ${getNombreCompleto(personal)}`}
          </DialogDescription>
        </DialogHeader>

        {!credenciales ? (
          // Formulario de selección de rol
          <>
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="font-medium">{getNombreCompleto(personal)}</p>
                <p className="text-sm text-muted-foreground">{personal.email}</p>
                <p className="text-xs text-muted-foreground">{personal.codigoEmpleado}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rol">Rol en el sistema</Label>
                <Select
                  value={selectedRol}
                  onValueChange={(value) => setSelectedRol(value as Role)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {rolesDisponibles.map((rol) => (
                      <SelectItem key={rol} value={rol}>
                        {getRolLabel(rol)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Este rol determinará los permisos del usuario en el sistema
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleCrearAcceso} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Usuario
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Mostrar credenciales creadas
          <>
            <div className="space-y-4 py-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Usuario creado exitosamente</AlertTitle>
                <AlertDescription className="text-green-700">
                  Comparta estas credenciales de forma segura con el usuario.
                  La contraseña debe ser cambiada en el primer inicio de sesión.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Usuario</p>
                    <p className="font-mono font-medium">{credenciales.username}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(credenciales.username, 'username')}
                  >
                    {copiedField === 'username' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-mono font-medium">{credenciales.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(credenciales.email, 'email')}
                  >
                    {copiedField === 'email' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div>
                    <p className="text-xs text-amber-700 flex items-center gap-1">
                      <Key className="h-3 w-3" />
                      Contraseña temporal
                    </p>
                    <p className="font-mono font-medium text-amber-900">
                      {credenciales.passwordTemporal}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(credenciales.passwordTemporal, 'password')}
                  >
                    {copiedField === 'password' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Rol asignado</p>
                    <p className="font-medium">{getRolLabel(credenciales.rol as Role)}</p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>
                Cerrar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
