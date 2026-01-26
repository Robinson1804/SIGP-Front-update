'use client';

/**
 * DivisionDetailModal Component
 *
 * Modal para mostrar detalles de una división
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Users,
  UserCog,
  Users2,
  Calendar,
  Edit,
} from 'lucide-react';
import type { Division, Personal } from '../types';
import { getNombreCompleto } from '../types';

interface DivisionDetailModalProps {
  open: boolean;
  onClose: () => void;
  onEdit?: (division: Division) => void;
  division: Division | null;
  /** Lista de personal asignado a esta división (excluyendo Coordinador y Scrum Masters) */
  miembros?: Personal[];
}

export function DivisionDetailModal({
  open,
  onClose,
  onEdit,
  division,
  miembros = [],
}: DivisionDetailModalProps) {
  if (!division) return null;

  const handleEdit = () => {
    if (onEdit) {
      onClose();
      onEdit(division);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#004272]" />
            Detalle de División
          </DialogTitle>
          <DialogDescription>
            Información completa de la división y su equipo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información Principal */}
          <div className="bg-gradient-to-r from-[#004272] to-[#005a99] rounded-lg p-4 text-white">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-white/50 text-white font-mono">
                      {division.codigo}
                    </Badge>
                    {division.activo ? (
                      <Badge className="bg-green-500/80">Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </div>
                  {onEdit && (
                    <Button variant="secondary" size="sm" onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  )}
                </div>
                <h2 className="text-xl font-bold">{division.nombre}</h2>
                {division.descripcion && (
                  <p className="text-white/80 text-sm mt-1">{division.descripcion}</p>
                )}
              </div>
            </div>
          </div>

          {/* Coordinador de División */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Coordinador
            </h3>
            {division.coordinador ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-white">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-500 text-white">
                    {division.coordinador.nombres.charAt(0)}
                    {division.coordinador.apellidos.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{getNombreCompleto(division.coordinador)}</p>
                  <p className="text-sm text-muted-foreground">
                    {division.coordinador.email}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground italic p-3 rounded-lg border bg-gray-50">
                Sin coordinador asignado
              </p>
            )}
          </div>

          {/* Scrum Masters */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Users2 className="h-4 w-4" />
              Scrum Masters ({division.scrumMasters?.length || 0})
            </h3>
            {division.scrumMasters && division.scrumMasters.length > 0 ? (
              <div className="space-y-2">
                {division.scrumMasters.map((sm) => (
                  <div key={sm.id} className="flex items-center gap-3 p-3 rounded-lg border bg-white">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-cyan-500 text-white">
                        {sm.nombres.charAt(0)}
                        {sm.apellidos.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{getNombreCompleto(sm)}</p>
                      <p className="text-sm text-muted-foreground">{sm.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic p-3 rounded-lg border bg-gray-50">
                Sin scrum masters asignados
              </p>
            )}
          </div>

          {/* Miembros de la División */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Miembros ({miembros.length})
            </h3>
            {miembros.length > 0 ? (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {miembros.map((miembro) => (
                  <div key={miembro.id} className="flex items-center gap-3 p-3 rounded-lg border bg-white">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gray-500 text-white">
                        {miembro.nombres.charAt(0)}
                        {miembro.apellidos.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{getNombreCompleto(miembro)}</p>
                      <p className="text-sm text-muted-foreground truncate">{miembro.cargo || 'Sin cargo'}</p>
                    </div>
                    {!miembro.activo && (
                      <Badge variant="secondary" className="text-xs">Inactivo</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic p-3 rounded-lg border bg-gray-50">
                Sin otros miembros asignados
              </p>
            )}
          </div>

          <Separator />

          {/* Información Adicional */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border bg-white">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Personal</span>
              </div>
              <p className="text-2xl font-bold">{division.totalPersonal || 0}</p>
            </div>

            {division.divisionPadre && (
              <div className="p-3 rounded-lg border bg-white">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">División Padre</span>
                </div>
                <p className="font-medium">{division.divisionPadre.nombre}</p>
                <p className="text-sm text-muted-foreground">{division.divisionPadre.codigo}</p>
              </div>
            )}
          </div>

          {/* Fechas */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Creado: {formatDate(division.createdAt)}</span>
            {division.updatedAt !== division.createdAt && (
              <>
                <span>•</span>
                <span>Actualizado: {formatDate(division.updatedAt)}</span>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
