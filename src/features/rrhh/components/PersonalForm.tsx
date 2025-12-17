'use client';

/**
 * PersonalForm Component
 *
 * Formulario para crear/editar personal
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, User } from 'lucide-react';
import type { Personal, Division, CreatePersonalInput } from '../types';

const personalSchema = z.object({
  codigo: z.string().min(1, 'El código es requerido'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional(),
  divisionId: z.number({ required_error: 'Seleccione una división' }),
  cargo: z.string().min(1, 'El cargo es requerido'),
  rol: z.string().min(1, 'Seleccione un rol'),
  fechaIngreso: z.string().min(1, 'La fecha de ingreso es requerida'),
});

type PersonalFormData = z.infer<typeof personalSchema>;

interface PersonalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personal?: Personal | null;
  divisiones: Division[];
  onSubmit: (data: CreatePersonalInput) => Promise<void>;
  isLoading?: boolean;
}

export function PersonalForm({
  open,
  onOpenChange,
  personal,
  divisiones,
  onSubmit,
  isLoading = false,
}: PersonalFormProps) {
  const isEditing = !!personal;

  const form = useForm<PersonalFormData>({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      codigo: personal?.codigo ?? '',
      nombre: personal?.nombre ?? '',
      apellido: personal?.apellido ?? '',
      email: personal?.email ?? '',
      telefono: personal?.telefono ?? '',
      divisionId: personal?.divisionId ?? undefined,
      cargo: personal?.cargo ?? '',
      rol: personal?.rol ?? '',
      fechaIngreso: personal?.fechaIngreso?.split('T')[0] ?? '',
    },
  });

  const handleSubmit = async (data: PersonalFormData) => {
    await onSubmit(data as CreatePersonalInput);
    onOpenChange(false);
    form.reset();
  };

  const roles = [
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'PMO', label: 'PMO' },
    { value: 'COORDINADOR', label: 'Coordinador' },
    { value: 'SCRUM_MASTER', label: 'Scrum Master' },
    { value: 'DESARROLLADOR', label: 'Desarrollador' },
    { value: 'IMPLEMENTADOR', label: 'Implementador' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-[#004272]" />
            {isEditing ? 'Editar Personal' : 'Nuevo Personal'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Código y División */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                placeholder="P-001"
                {...form.register('codigo')}
              />
              {form.formState.errors.codigo && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.codigo.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="divisionId">División</Label>
              <Select
                value={form.watch('divisionId')?.toString()}
                onValueChange={(value) =>
                  form.setValue('divisionId', Number(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {divisiones.map((div) => (
                    <SelectItem key={div.id} value={String(div.id)}>
                      {div.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.divisionId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.divisionId.message}
                </p>
              )}
            </div>
          </div>

          {/* Nombre y Apellido */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                placeholder="Juan"
                {...form.register('nombre')}
              />
              {form.formState.errors.nombre && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.nombre.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido</Label>
              <Input
                id="apellido"
                placeholder="Pérez"
                {...form.register('apellido')}
              />
              {form.formState.errors.apellido && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.apellido.message}
                </p>
              )}
            </div>
          </div>

          {/* Email y Teléfono */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="juan.perez@example.com"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono (opcional)</Label>
              <Input
                id="telefono"
                placeholder="+51 999 999 999"
                {...form.register('telefono')}
              />
            </div>
          </div>

          {/* Cargo y Rol */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                placeholder="Analista de Sistemas"
                {...form.register('cargo')}
              />
              {form.formState.errors.cargo && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.cargo.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rol">Rol en Sistema</Label>
              <Select
                value={form.watch('rol')}
                onValueChange={(value) => form.setValue('rol', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((rol) => (
                    <SelectItem key={rol.value} value={rol.value}>
                      {rol.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.rol && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.rol.message}
                </p>
              )}
            </div>
          </div>

          {/* Fecha de Ingreso */}
          <div className="space-y-2">
            <Label htmlFor="fechaIngreso">Fecha de Ingreso</Label>
            <Input
              id="fechaIngreso"
              type="date"
              {...form.register('fechaIngreso')}
            />
            {form.formState.errors.fechaIngreso && (
              <p className="text-sm text-destructive">
                {form.formState.errors.fechaIngreso.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : isEditing ? (
                'Actualizar'
              ) : (
                'Crear'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
