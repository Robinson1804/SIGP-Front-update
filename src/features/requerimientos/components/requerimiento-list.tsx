'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/lib/hooks/use-toast';
import { useAuth } from '@/stores';
import { ROLES } from '@/lib/definitions';
import {
  type Requerimiento,
  type RequerimientoFilters,
  REQUERIMIENTO_PRIORIDADES,
} from '../types';
import {
  getRequerimientosByProyecto,
  deleteRequerimiento,
} from '../services';
import { RequerimientoFiltersComponent } from './requerimiento-filters';
import { RequerimientoForm } from './requerimiento-form';
import { RequerimientoDetailModal } from './requerimiento-detail-modal';
import { MatrizTrazabilidad } from './matriz-trazabilidad';

interface RequerimientoListProps {
  proyectoId: number;
  initialData?: Requerimiento[];
}

// Helper para obtener color del badge según prioridad
function getPrioridadVariant(prioridad: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const found = REQUERIMIENTO_PRIORIDADES.find((p) => p.value === prioridad);
  switch (found?.color) {
    case 'destructive':
      return 'destructive';
    case 'warning':
      return 'default';
    case 'secondary':
      return 'secondary';
    default:
      return 'outline';
  }
}

export function RequerimientoList({ proyectoId, initialData = [] }: RequerimientoListProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  // Permisos por rol
  // ADMIN: acceso total a todas las funciones
  // SCRUM_MASTER: crear, editar, eliminar
  // COORDINADOR, PMO, PATROCINADOR: solo ver detalle
  // Otros roles: solo ver listado
  const isAdmin = user?.role === ROLES.ADMIN;
  const isScrumMaster = user?.role === ROLES.SCRUM_MASTER;
  const isCoordinador = user?.role === ROLES.COORDINADOR;
  const isPmo = user?.role === ROLES.PMO;
  const isPatrocinador = user?.role === ROLES.PATROCINADOR;
  const canManage = isAdmin || isScrumMaster; // crear, editar, eliminar
  const canViewDetail = isAdmin || isScrumMaster || isCoordinador || isPmo || isPatrocinador; // ver detalle

  const [requerimientos, setRequerimientos] = useState<Requerimiento[]>(initialData);
  const [filteredRequerimientos, setFilteredRequerimientos] = useState<Requerimiento[]>(initialData);
  const [filters, setFilters] = useState<RequerimientoFilters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showMatriz, setShowMatriz] = useState(false);

  // Modal de formulario
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRequerimiento, setEditingRequerimiento] = useState<Requerimiento | null>(null);

  // Dialog de confirmación
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Modal de detalle (solo lectura)
  const [viewingRequerimiento, setViewingRequerimiento] = useState<Requerimiento | null>(null);

  // Cargar requerimientos
  const loadRequerimientos = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getRequerimientosByProyecto(proyectoId);
      setRequerimientos(data);
      applyFilters(data, filters);
    } catch (error) {
      console.error('Error cargando requerimientos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los requerimientos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [proyectoId, toast]);

  useEffect(() => {
    if (initialData.length === 0) {
      loadRequerimientos();
    }
  }, []);

  // Aplicar filtros
  const applyFilters = useCallback(
    (data: Requerimiento[], currentFilters: RequerimientoFilters) => {
      let filtered = data;

      // Filtrar por tipo
      if (currentFilters.tipo) {
        filtered = filtered.filter((r) => r.tipo === currentFilters.tipo);
      }

      // Filtrar por prioridad
      if (currentFilters.prioridad) {
        filtered = filtered.filter((r) => r.prioridad === currentFilters.prioridad);
      }

      // Filtrar por búsqueda
      if (currentFilters.search) {
        const searchLower = currentFilters.search.toLowerCase();
        filtered = filtered.filter(
          (r) =>
            r.codigo.toLowerCase().includes(searchLower) ||
            r.nombre.toLowerCase().includes(searchLower)
        );
      }

      // Ordenar por código (REQ-001, REQ-002, etc.)
      filtered = filtered.sort((a, b) => {
        // Extraer el número del código (ej: REQ-001 -> 1)
        const numA = parseInt(a.codigo.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.codigo.replace(/\D/g, '')) || 0;
        return numA - numB;
      });

      setFilteredRequerimientos(filtered);
    },
    []
  );

  // Handler para cambio de filtros
  const handleFilter = useCallback(
    (newFilters: RequerimientoFilters) => {
      setFilters(newFilters);
      applyFilters(requerimientos, newFilters);
    },
    [requerimientos, applyFilters]
  );

  // Abrir formulario para crear
  const handleCreate = () => {
    setEditingRequerimiento(null);
    setIsFormOpen(true);
  };

  // Abrir formulario para editar
  const handleEdit = (requerimiento: Requerimiento) => {
    setEditingRequerimiento(requerimiento);
    setIsFormOpen(true);
  };

  // Confirmar eliminación
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;

    try {
      await deleteRequerimiento(deleteId);
      toast({
        title: 'Eliminado',
        description: 'El requerimiento ha sido eliminado',
      });
      loadRequerimientos();
    } catch (error) {
      console.error('Error eliminando:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el requerimiento',
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
    }
  };

  // Renderizar tabla de requerimientos
  const renderTable = () => {
    if (filteredRequerimientos.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay requerimientos</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              No hay requerimientos registrados con los filtros seleccionados
            </p>
            {canManage && (
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Requerimiento
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="w-[100px]">Tipo</TableHead>
                <TableHead className="w-[100px]">Prioridad</TableHead>
                {canManage && <TableHead className="w-[80px] text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequerimientos.map((req) => (
                <TableRow
                  key={req.id}
                  className={canViewDetail ? 'cursor-pointer hover:bg-muted/50' : ''}
                  onClick={() => canViewDetail && setViewingRequerimiento(req)}
                >
                  <TableCell className="font-mono font-medium">{req.codigo}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{req.nombre}</p>
                      {req.descripcion && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {req.descripcion}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {req.tipo === 'Funcional' ? 'RF' : req.tipo === 'No Funcional' ? 'RNF' : req.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPrioridadVariant(req.prioridad)}>
                      {req.prioridad}
                    </Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(req)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteId(req.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header con botón crear */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Requerimientos</h2>
          <p className="text-muted-foreground">
            Gestiona los requerimientos del proyecto
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showMatriz ? 'default' : 'outline'}
            onClick={() => setShowMatriz(!showMatriz)}
          >
            {showMatriz ? 'Ver Lista' : 'Matriz de Trazabilidad'}
          </Button>
          {canManage && (
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Requerimiento
            </Button>
          )}
        </div>
      </div>

      {showMatriz ? (
        <MatrizTrazabilidad
          requerimientos={requerimientos}
          proyectoId={proyectoId}
        />
      ) : (
        <div className="space-y-4">
          <RequerimientoFiltersComponent
            onFilter={handleFilter}
            total={requerimientos.length}
            filteredTotal={filteredRequerimientos.length}
          />
          {renderTable()}
        </div>
      )}

      {/* Modal de formulario */}
      <RequerimientoForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingRequerimiento(null);
        }}
        proyectoId={proyectoId}
        requerimiento={editingRequerimiento}
        onSuccess={loadRequerimientos}
      />

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar requerimiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El requerimiento será marcado como
              inactivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de detalle (solo lectura) */}
      <RequerimientoDetailModal
        requerimiento={viewingRequerimiento}
        open={!!viewingRequerimiento}
        onClose={() => setViewingRequerimiento(null)}
      />
    </div>
  );
}
