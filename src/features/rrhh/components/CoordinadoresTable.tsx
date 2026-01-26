'use client';

/**
 * CoordinadoresTable Component
 *
 * Tabla de divisiones con sus coordinadores asignados
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Search,
  UserCog,
  Building2,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import type { Division, Personal } from '../types';
import { getNombreCompleto } from '../types';

interface CoordinadoresTableProps {
  divisiones: Division[];
  personal: Personal[];
  onAsignarCoordinador: (divisionId: number, personalId: number) => Promise<void>;
  onRemoverCoordinador: (divisionId: number) => Promise<void>;
  isLoading?: boolean;
}

export function CoordinadoresTable({
  divisiones,
  personal,
  onAsignarCoordinador,
  onRemoverCoordinador,
  isLoading = false,
}: CoordinadoresTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null);
  const [selectedPersonalId, setSelectedPersonalId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredDivisiones = divisiones.filter((d) => {
    const matchesSearch =
      searchTerm === '' ||
      d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.coordinador && getNombreCompleto(d.coordinador).toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch && d.activo;
  });

  const getCoordinadorNombre = (division: Division): string => {
    if (!division.coordinador) return 'Sin asignar';
    return getNombreCompleto(division.coordinador);
  };

  const handleAsignarClick = (division: Division) => {
    setSelectedDivision(division);
    setSelectedPersonalId('');
    setIsDialogOpen(true);
  };

  const handleAsignar = async () => {
    if (!selectedDivision || !selectedPersonalId) return;

    setIsSubmitting(true);
    try {
      await onAsignarCoordinador(selectedDivision.id, parseInt(selectedPersonalId));
      setIsDialogOpen(false);
      setSelectedDivision(null);
      setSelectedPersonalId('');
    } catch (error) {
      console.error('Error al asignar coordinador:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemover = async (division: Division) => {
    if (confirm(`¿Está seguro de remover a ${getCoordinadorNombre(division)} como coordinador de ${division.nombre}?`)) {
      try {
        await onRemoverCoordinador(division.id);
      } catch (error) {
        console.error('Error al remover coordinador:', error);
      }
    }
  };

  // Filtrar personal disponible para asignar (que no sea ya coordinador en otra división)
  const personalDisponible = personal.filter(p => {
    return p.activo && divisiones.every(d => d.coordinadorId !== p.id);
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Coordinadores por División
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por división o coordinador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabla */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>División</TableHead>
                  <TableHead>Coordinador</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredDivisiones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">
                        No se encontraron divisiones
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
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {division.nombre}
                        </div>
                      </TableCell>
                      <TableCell>
                        {division.coordinador ? (
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                              {division.coordinador.nombres.charAt(0)}
                              {division.coordinador.apellidos.charAt(0)}
                            </div>
                            <span>{getNombreCompleto(division.coordinador)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Sin asignar</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {division.coordinador?.email || '-'}
                      </TableCell>
                      <TableCell>
                        {division.coordinador ? (
                          <Badge className="bg-green-500">Asignado</Badge>
                        ) : (
                          <Badge variant="secondary">Pendiente</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAsignarClick(division)}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            {division.coordinador ? 'Cambiar' : 'Asignar'}
                          </Button>
                          {division.coordinador && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleRemover(division)}
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer con conteo */}
          <div className="text-sm text-muted-foreground">
            {filteredDivisiones.filter(d => d.coordinador).length} de {filteredDivisiones.length} divisiones con coordinador asignado
          </div>
        </CardContent>
      </Card>

      {/* Dialog para asignar coordinador */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Coordinador</DialogTitle>
            <DialogDescription>
              Seleccione el personal que será coordinador de la división{' '}
              <strong>{selectedDivision?.nombre}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select value={selectedPersonalId} onValueChange={setSelectedPersonalId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione personal..." />
              </SelectTrigger>
              <SelectContent position="item-aligned">
                {personalDisponible.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {getNombreCompleto(p)} - {p.division?.nombre || 'Sin división'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAsignar}
              disabled={!selectedPersonalId || isSubmitting}
            >
              {isSubmitting ? 'Asignando...' : 'Asignar Coordinador'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
