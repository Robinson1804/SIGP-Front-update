'use client';

/**
 * ScrumMastersTable Component
 *
 * Tabla de divisiones con sus scrum masters asignados (Many-to-Many)
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
  Users2,
  Building2,
  UserPlus,
  X,
} from 'lucide-react';
import type { Division, Personal } from '../types';
import { getNombreCompleto } from '../types';

interface ScrumMastersTableProps {
  divisiones: Division[];
  personal: Personal[];
  onAsignarScrumMaster: (divisionId: number, personalId: number) => Promise<void>;
  onRemoverScrumMaster: (divisionId: number, personalId: number) => Promise<void>;
  isLoading?: boolean;
}

export function ScrumMastersTable({
  divisiones,
  personal,
  onAsignarScrumMaster,
  onRemoverScrumMaster,
  isLoading = false,
}: ScrumMastersTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null);
  const [selectedPersonalId, setSelectedPersonalId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredDivisiones = divisiones.filter((d) => {
    const scrumMastersNames = d.scrumMasters?.map(sm => getNombreCompleto(sm)).join(' ') || '';
    const matchesSearch =
      searchTerm === '' ||
      d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scrumMastersNames.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch && d.activo;
  });

  const handleAgregarClick = (division: Division) => {
    setSelectedDivision(division);
    setSelectedPersonalId('');
    setIsDialogOpen(true);
  };

  const handleAsignar = async () => {
    if (!selectedDivision || !selectedPersonalId) return;

    setIsSubmitting(true);
    try {
      await onAsignarScrumMaster(selectedDivision.id, parseInt(selectedPersonalId));
      setIsDialogOpen(false);
      setSelectedDivision(null);
      setSelectedPersonalId('');
    } catch (error) {
      console.error('Error al asignar scrum master:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemover = async (division: Division, scrumMaster: Personal) => {
    if (confirm(`¿Está seguro de remover a ${getNombreCompleto(scrumMaster)} como Scrum Master de ${division.nombre}?`)) {
      try {
        await onRemoverScrumMaster(division.id, scrumMaster.id);
      } catch (error) {
        console.error('Error al remover scrum master:', error);
      }
    }
  };

  // Personal disponible para asignar (que no sea ya scrum master en esta división)
  const getPersonalDisponible = (division: Division) => {
    const scrumMasterIds = division.scrumMasters?.map(sm => sm.id) || [];
    return personal.filter(p => p.activo && !scrumMasterIds.includes(p.id));
  };

  // Contar total de scrum masters
  const totalScrumMasters = filteredDivisiones.reduce(
    (acc, d) => acc + (d.scrumMasters?.length || 0),
    0
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users2 className="h-5 w-5" />
              Scrum Masters por División
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por división o scrum master..."
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
                  <TableHead>Scrum Masters</TableHead>
                  <TableHead className="text-center">Cantidad</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredDivisiones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
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
                        {division.scrumMasters && division.scrumMasters.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {division.scrumMasters.map((sm) => (
                              <Badge
                                key={sm.id}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                <div className="h-5 w-5 rounded-full bg-cyan-500 flex items-center justify-center text-white text-xs font-medium">
                                  {sm.nombres.charAt(0)}
                                  {sm.apellidos.charAt(0)}
                                </div>
                                {getNombreCompleto(sm)}
                                <button
                                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                                  onClick={() => handleRemover(division, sm)}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Sin asignar</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {division.scrumMasters?.length || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAgregarClick(division)}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Agregar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer con conteo */}
          <div className="text-sm text-muted-foreground">
            {totalScrumMasters} scrum masters asignados en {filteredDivisiones.length} divisiones
          </div>
        </CardContent>
      </Card>

      {/* Dialog para agregar scrum master */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Scrum Master</DialogTitle>
            <DialogDescription>
              Seleccione el personal que será Scrum Master de la división{' '}
              <strong>{selectedDivision?.nombre}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select value={selectedPersonalId} onValueChange={setSelectedPersonalId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione personal..." />
              </SelectTrigger>
              <SelectContent position="item-aligned">
                {selectedDivision && getPersonalDisponible(selectedDivision).map((p) => (
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
              {isSubmitting ? 'Asignando...' : 'Agregar Scrum Master'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
