'use client';

import { MoreHorizontal, Eye, Edit, Calendar, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type HistoriaUsuario, type PrioridadMoSCoW } from '@/features/proyectos/services/historias.service';
import { cn } from '@/lib/utils';

interface HistoriaTableProps {
  historias: HistoriaUsuario[];
  showCheckbox?: boolean;
  selectedIds?: number[];
  onSelectionChange?: (ids: number[]) => void;
  onView?: (historia: HistoriaUsuario) => void;
  onEdit?: (historia: HistoriaUsuario) => void;
  onDelete?: (historia: HistoriaUsuario) => void;
  onAssignToSprint?: (historia: HistoriaUsuario) => void;
  showSprintAction?: boolean;
}

const estadoColors: Record<string, string> = {
  'Pendiente': 'bg-gray-100 text-gray-700',
  'En analisis': 'bg-blue-100 text-blue-700',
  'Lista': 'bg-green-100 text-green-700',
  'En desarrollo': 'bg-yellow-100 text-yellow-700',
  'En pruebas': 'bg-purple-100 text-purple-700',
  'En revision': 'bg-orange-100 text-orange-700',
  'Terminada': 'bg-emerald-100 text-emerald-700',
};

const prioridadColors: Record<PrioridadMoSCoW, string> = {
  Must: 'bg-red-100 text-red-700',
  Should: 'bg-orange-100 text-orange-700',
  Could: 'bg-yellow-100 text-yellow-700',
  Wont: 'bg-gray-100 text-gray-600',
};

const prioridadLabels: Record<PrioridadMoSCoW, string> = {
  Must: 'Alta',
  Should: 'Media',
  Could: 'Baja',
  Wont: 'No incluir',
};

export function HistoriaTable({
  historias,
  showCheckbox = false,
  selectedIds = [],
  onSelectionChange,
  onView,
  onEdit,
  onDelete,
  onAssignToSprint,
  showSprintAction = false,
}: HistoriaTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange(historias.map((h) => h.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (historiaId: number, checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange([...selectedIds, historiaId]);
    } else {
      onSelectionChange(selectedIds.filter((id) => id !== historiaId));
    }
  };

  const allSelected =
    historias.length > 0 && historias.every((h) => selectedIds.includes(h.id));
  const someSelected =
    historias.some((h) => selectedIds.includes(h.id)) && !allSelected;

  if (historias.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay historias de usuario
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            {showCheckbox && (
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Seleccionar todas"
                  className={someSelected ? 'opacity-50' : ''}
                />
              </TableHead>
            )}
            <TableHead className="w-20">ID</TableHead>
            <TableHead className="min-w-[200px]">Titulo</TableHead>
            <TableHead className="w-28">Estado</TableHead>
            <TableHead className="w-40">Epica</TableHead>
            <TableHead className="w-20 text-center">Pts</TableHead>
            <TableHead className="w-24">Prioridad</TableHead>
            <TableHead className="w-20 text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {historias.map((historia) => {
            const isSelected = selectedIds.includes(historia.id);
            return (
              <TableRow
                key={historia.id}
                className={cn(
                  'hover:bg-gray-50',
                  isSelected && 'bg-blue-50 hover:bg-blue-100'
                )}
              >
                {showCheckbox && (
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        handleSelectOne(historia.id, checked as boolean)
                      }
                      aria-label={`Seleccionar ${historia.codigo}`}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <button
                    onClick={() => onView?.(historia)}
                    className="text-[#018CD1] hover:underline font-medium"
                  >
                    {historia.codigo}
                  </button>
                </TableCell>
                <TableCell>
                  <span
                    className="cursor-pointer hover:text-[#018CD1]"
                    onClick={() => onView?.(historia)}
                  >
                    {historia.titulo}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn('text-xs', estadoColors[historia.estado])}
                  >
                    {historia.estado}
                  </Badge>
                </TableCell>
                <TableCell>
                  {historia.epica ? (
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: historia.epica.color || '#888' }}
                      />
                      <span className="text-sm truncate max-w-[120px]">
                        {historia.epica.nombre}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm font-medium">
                    {historia.storyPoints || '-'}
                  </span>
                </TableCell>
                <TableCell>
                  {historia.prioridad ? (
                    <Badge
                      variant="secondary"
                      className={cn('text-xs', prioridadColors[historia.prioridad])}
                    >
                      {prioridadLabels[historia.prioridad]}
                    </Badge>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView?.(historia)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit?.(historia)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      {showSprintAction && (
                        <DropdownMenuItem onClick={() => onAssignToSprint?.(historia)}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Asignar a Sprint
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete?.(historia)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
