'use client';

/**
 * CoordinadoresTable Component
 *
 * Tabla de divisiones con sus coordinadores asignados
 */

import { useState, useEffect } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Search,
  UserCog,
  Building2,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { TablePagination } from '@/components/ui/table-pagination';
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
  const [searchPersonal, setSearchPersonal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredDivisiones = divisiones.filter((d) => {
    const matchesSearch =
      searchTerm === '' ||
      d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.coordinador && getNombreCompleto(d.coordinador).toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch && d.activo;
  });

  const paginatedDivisiones = filteredDivisiones.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const getCoordinadorNombre = (division: Division): string => {
    if (!division.coordinador) return 'Sin asignar';
    return getNombreCompleto(division.coordinador);
  };

  const handleAsignarClick = (division: Division) => {
    setSelectedDivision(division);
    setSelectedPersonalId('');
    setSearchPersonal('');
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
                  paginatedDivisiones.map((division) => (
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

          <TablePagination
            page={currentPage}
            totalPages={Math.ceil(filteredDivisiones.length / PAGE_SIZE)}
            total={filteredDivisiones.length}
            limit={PAGE_SIZE}
            onPageChange={setCurrentPage}
            itemLabel="divisiones"
          />
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

          <div className="py-4 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar personal..."
                value={searchPersonal}
                onChange={(e) => setSearchPersonal(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="border rounded-md max-h-[220px] overflow-y-auto">
              {(() => {
                const disponibles = personalDisponible.filter(p => {
                  const nombre = getNombreCompleto(p).toLowerCase();
                  const div = (p.division?.nombre || '').toLowerCase();
                  const q = searchPersonal.toLowerCase();
                  return nombre.includes(q) || div.includes(q);
                });
                if (disponibles.length === 0) {
                  return <p className="text-sm text-muted-foreground text-center py-4">No se encontró personal.</p>;
                }
                return disponibles.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPersonalId(p.id.toString())}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${selectedPersonalId === p.id.toString() ? 'bg-[#018CD1] text-white font-medium' : 'hover:bg-accent'}`}
                  >
                    <span className="flex-1">{getNombreCompleto(p)}</span>
                    <span className={`text-xs ${selectedPersonalId === p.id.toString() ? 'text-white/80' : 'text-muted-foreground'}`}>{p.division?.nombre || 'Sin división'}</span>
                  </button>
                ));
              })()}
            </div>
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
