'use client';

/**
 * PersonalForm Component
 *
 * Formulario para crear/editar personal
 * Sincronizado con Backend - Dic 2024
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, User } from 'lucide-react';
import type { Personal, Division } from '../types';
import { Modalidad, getModalidadLabel } from '../types';
import type { CreatePersonalDto, UpdatePersonalDto } from '../types/dto';
import { VALIDATION_RULES } from '../types/dto';

// Schema de validación
const personalSchema = z.object({
  codigoEmpleado: z
    .string()
    .max(VALIDATION_RULES.codigoEmpleado.maxLength, 'El código no puede exceder 20 caracteres')
    .regex(VALIDATION_RULES.codigoEmpleado.pattern, VALIDATION_RULES.codigoEmpleado.message)
    .optional()
    .or(z.literal('')),
  dni: z
    .string()
    .regex(VALIDATION_RULES.dni.pattern, VALIDATION_RULES.dni.message)
    .optional()
    .or(z.literal('')),
  nombres: z
    .string()
    .min(VALIDATION_RULES.nombres.minLength, 'Los nombres deben tener al menos 2 caracteres')
    .max(VALIDATION_RULES.nombres.maxLength, 'Los nombres no pueden exceder 100 caracteres'),
  apellidos: z
    .string()
    .min(VALIDATION_RULES.apellidos.minLength, 'Los apellidos deben tener al menos 2 caracteres')
    .max(VALIDATION_RULES.apellidos.maxLength, 'Los apellidos no pueden exceder 100 caracteres'),
  email: z.string().email('Email inválido'),
  telefono: z
    .string()
    .max(VALIDATION_RULES.telefono.maxLength)
    .optional()
    .or(z.literal('')),
  divisionId: z.number({ required_error: 'Seleccione una división' }),
  cargo: z
    .string()
    .max(VALIDATION_RULES.cargo.maxLength)
    .optional()
    .or(z.literal('')),
  modalidad: z.nativeEnum(Modalidad, {
    errorMap: () => ({ message: 'Seleccione una modalidad' }),
  }),
  horasSemanales: z
    .number()
    .min(VALIDATION_RULES.horasSemanales.min, 'Mínimo 1 hora')
    .max(VALIDATION_RULES.horasSemanales.max, 'Máximo 48 horas'),
  fechaIngreso: z.string().min(1, 'La fecha de ingreso es requerida'),
  activo: z.boolean().optional(),
});

type PersonalFormData = z.infer<typeof personalSchema>;

interface PersonalFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePersonalDto | UpdatePersonalDto) => Promise<void>;
  personal?: Personal | null;
  divisiones: Division[];
  isLoading?: boolean;
}

export function PersonalForm({
  open,
  onClose,
  onSubmit,
  personal,
  divisiones,
  isLoading = false,
}: PersonalFormProps) {
  const isEditing = !!personal;
  const [nextCode, setNextCode] = useState<string>('');

  const form = useForm<PersonalFormData>({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      codigoEmpleado: '',
      dni: '',
      nombres: '',
      apellidos: '',
      email: '',
      telefono: '',
      divisionId: undefined,
      cargo: '',
      modalidad: Modalidad.NOMBRADO,
      horasSemanales: VALIDATION_RULES.horasSemanales.default,
      fechaIngreso: new Date().toISOString().split('T')[0],
      activo: true,
    },
  });

  // Fetch next code when creating new personal
  useEffect(() => {
    if (open && !personal) {
      apiClient.get('/personal/next-code')
        .then((response) => {
          const code = response.data?.data || response.data;
          setNextCode(code);
        })
        .catch((err) => {
          console.error('Error fetching next code:', err);
          setNextCode('');
        });
    }
  }, [open, personal]);

  // Reset form when dialog opens or personal changes
  useEffect(() => {
    if (open) {
      form.reset({
        codigoEmpleado: personal?.codigoEmpleado || '',
        dni: personal?.dni || '',
        nombres: personal?.nombres || '',
        apellidos: personal?.apellidos || '',
        email: personal?.email || '',
        telefono: personal?.telefono || '',
        divisionId: personal?.divisionId || undefined,
        cargo: personal?.cargo || '',
        modalidad: personal?.modalidad || Modalidad.NOMBRADO,
        horasSemanales: personal?.horasSemanales ? Number(personal.horasSemanales) : VALIDATION_RULES.horasSemanales.default,
        fechaIngreso: personal?.fechaIngreso?.split('T')[0] || new Date().toISOString().split('T')[0],
        activo: personal?.activo ?? true,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, personal]);

  const handleSubmit = async (data: PersonalFormData) => {
    try {
      // For updates, exclude codigoEmpleado as backend doesn't allow updating it
      // For creates, exclude activo as backend CreatePersonalDto doesn't accept it
      const { codigoEmpleado, activo, ...baseFields } = data;

      const submitData = isEditing
        ? {
            ...baseFields,
            activo, // Include activo only for updates
            dni: data.dni || undefined,
            telefono: data.telefono || undefined,
            cargo: data.cargo || undefined,
          }
        : {
            // Solo incluir codigoEmpleado si tiene valor, sino el backend lo genera
            ...(codigoEmpleado ? { codigoEmpleado } : {}),
            ...baseFields,
            // Note: activo is excluded for creates - backend sets default
            dni: data.dni || undefined,
            telefono: data.telefono || undefined,
            cargo: data.cargo || undefined,
          };
      await onSubmit(submitData as CreatePersonalDto | UpdatePersonalDto);
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const modalidades = Object.values(Modalidad);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-[#004272]" />
            {isEditing ? 'Editar Personal' : 'Nuevo Personal'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los datos del personal'
              : 'Completa los datos para registrar nuevo personal'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Código y DNI */}
            <div className="grid grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>Código Empleado</FormLabel>
                <FormControl>
                  <Input
                    value={isEditing ? (personal?.codigoEmpleado || '') : nextCode}
                    className="uppercase bg-muted"
                    disabled
                    readOnly
                  />
                </FormControl>
                {!isEditing && (
                  <FormDescription>
                    Código auto-generado por el sistema
                  </FormDescription>
                )}
              </FormItem>

              <FormField
                control={form.control}
                name="dni"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DNI</FormLabel>
                    <FormControl>
                      <Input placeholder="12345678" maxLength={8} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Nombres y Apellidos */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombres"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombres *</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan Carlos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apellidos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellidos *</FormLabel>
                    <FormControl>
                      <Input placeholder="Pérez García" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Email y Teléfono */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="juan.perez@inei.gob.pe"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="+51 999 999 999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* División y Cargo */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="divisionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>División *</FormLabel>
                    <Select
                      value={field.value?.toString() || ''}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar división" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="item-aligned">
                        {divisiones
                          .filter((d) => d.activo)
                          .map((div) => (
                            <SelectItem key={div.id} value={String(div.id)}>
                              {div.codigo} - {div.nombre}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cargo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <FormControl>
                      <Input placeholder="Analista de Sistemas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Modalidad y Horas */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="modalidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modalidad *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar modalidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="item-aligned">
                        {modalidades.map((mod) => (
                          <SelectItem key={mod} value={mod}>
                            {getModalidadLabel(mod)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="horasSemanales"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horas Semanales *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={48}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Horas de trabajo por semana</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fecha de Ingreso */}
            <FormField
              control={form.control}
              name="fechaIngreso"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Ingreso *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Estado (solo para edición) */}
            {isEditing && (
              <FormField
                control={form.control}
                name="activo"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Estado</FormLabel>
                      <FormDescription>
                        Personal activo en el sistema
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Guardar cambios' : 'Crear personal'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
