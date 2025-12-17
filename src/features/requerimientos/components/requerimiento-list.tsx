'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  MoreVertical,
  FileText,
  AlertCircle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/lib/hooks/use-toast';
import { PermissionGate } from '@/features/auth';
import { MODULES, PERMISSIONS } from '@/lib/definitions';
import {
  type Requerimiento,
  type RequerimientoFilters,
  type RequerimientoTipo,
  REQUERIMIENTO_PRIORIDADES,
  REQUERIMIENTO_ESTADOS,
} from '../types';
import {
  getRequerimientosByProyecto,
  deleteRequerimiento,
  aprobarRequerimiento,
} from '../services';
import { RequerimientoFiltersComponent } from './requerimiento-filters';
import { RequerimientoForm } from './requerimiento-form';
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

// Helper para obtener color del badge según estado
function getEstadoVariant(estado: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const found = REQUERIMIENTO_ESTADOS.find((e) => e.value === estado);
  switch (found?.color) {
    case 'success':
      return 'default';
    case 'destructive':
      return 'destructive';
    case 'secondary':
      return 'secondary';
    default:
      return 'outline';
  }
}

export function RequerimientoList({ proyectoId, initialData = [] }: RequerimientoListProps) {
  const { toast } = useToast();
  const [requerimientos, setRequerimientos] = useState<Requerimiento[]>(initialData);
  const [filteredRequerimientos, setFilteredRequerimientos] = useState<Requerimiento[]>(initialData);
  const [filters, setFilters] = useState<RequerimientoFilters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'funcional' | 'no-funcional' | 'matriz'>('funcional');

  // Modal de formulario
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRequerimiento, setEditingRequerimiento] = useState<Requerimiento | null>(null);

  // Dialog de confirmación
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [aprobarData, setAprobarData] = useState<{ id: number; action: 'aprobar' | 'rechazar' } | null>(null);

  // Cargar requerimientos
  const loadRequerimientos = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getRequerimientosByProyecto(proyectoId, filters);
      setRequerimientos(data);
      applyTabFilter(data, activeTab, filters);
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
  }, [proyectoId, filters, activeTab, toast]);

  useEffect(() => {
    if (initialData.length === 0) {
      loadRequerimientos();
    }
  }, []);

  // Aplicar filtro de tab (tipo) + filtros adicionales
  const applyTabFilter = useCallback(
    (data: Requerimiento[], tab: string, currentFilters: RequerimientoFilters) => {
      let filtered = data;

      // Filtrar por tipo según tab activo
      if (tab === 'funcional') {
        filtered = filtered.filter((r) => r.tipo === 'Funcional');
      } else if (tab === 'no-funcional') {
        filtered = filtered.filter((r) => r.tipo !== 'Funcional');
      }

      // Aplicar filtros adicionales
      if (currentFilters.prioridad) {
        filtered = filtered.filter((r) => r.prioridad === currentFilters.prioridad);
      }
      if (currentFilters.estado) {
        filtered = filtered.filter((r) => r.estado === currentFilters.estado);
      }
      if (currentFilters.search) {
        const searchLower = currentFilters.search.toLowerCase();
        filtered = filtered.filter(
          (r) =>
            r.codigo.toLowerCase().includes(searchLower) ||
            r.nombre.toLowerCase().includes(searchLower)
        );
      }

      setFilteredRequerimientos(filtered);
    },
    []
  );

  // Handler para cambio de filtros
  const handleFilter = useCallback(
    (newFilters: RequerimientoFilters) => {
      setFilters(newFilters);
      applyTabFilter(requerimientos, activeTab, newFilters);
    },
    [requerimientos, activeTab, applyTabFilter]
  );

  // Handler para cambio de tab
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as 'funcional' | 'no-funcional' | 'matriz');
    if (tab !== 'matriz') {
      applyTabFilter(requerimientos, tab, filters);
    }
  };

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

  // Confirmar aprobación/rechazo
  const handleAprobarConfirm = async () => {
    if (!aprobarData) return;

    try {
      await aprobarRequerimiento(aprobarData.id, {
        estado: aprobarData.action === 'aprobar' ? 'Aprobado' : 'Rechazado',
      });
      toast({
        title: aprobarData.action === 'aprobar' ? 'Aprobado' : 'Rechazado',
        description: `El requerimiento ha sido ${aprobarData.action === 'aprobar' ? 'aprobado' : 'rechazado'}`,
      });
      loadRequerimientos();
    } catch (error) {
      console.error('Error actualizando estado:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive',
      });
    } finally {
      setAprobarData(null);
    }
  };

  // Contar por tipo para los tabs
  const countFuncionales = requerimientos.filter((r) => r.tipo === 'Funcional').length;
  const countNoFuncionales = requerimientos.filter((r) => r.tipo !== 'Funcional').length;

  // Renderizar tabla de requerimientos
  const renderTable = () => {
    if (filteredRequerimientos.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay requerimientos</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              {activeTab === 'funcional'
                ? 'No hay requerimientos funcionales registrados'
                : 'No hay requerimientos no funcionales registrados'}
            </p>
            <PermissionGate module={MODULES.POI} permission={PERMISSIONS.CREATE}>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Requerimiento
              </Button>
            </PermissionGate>
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
                <TableHead className="w-[120px]">Estado</TableHead>
                <TableHead className="w-[80px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequerimientos.map((req) => (
                <TableRow key={req.id}>
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
                  <TableCell>
                    <Badge variant={getEstadoVariant(req.estado)}>{req.estado}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <PermissionGate module={MODULES.POI} permission={PERMISSIONS.EDIT}>
                          <DropdownMenuItem onClick={() => handleEdit(req)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                        </PermissionGate>

                        {/* Aprobar/Rechazar solo si está pendiente */}
                        {req.estado === 'Pendiente' && (
                          <PermissionGate module={MODULES.POI} permission={PERMISSIONS.EDIT}>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setAprobarData({ id: req.id, action: 'aprobar' })}
                              className="text-green-600"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Aprobar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setAprobarData({ id: req.id, action: 'rechazar' })}
                              className="text-red-600"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Rechazar
                            </DropdownMenuItem>
                          </PermissionGate>
                        )}

                        <PermissionGate module={MODULES.POI} permission={PERMISSIONS.DELETE}>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteId(req.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </PermissionGate>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
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
            Gestiona los requerimientos funcionales y no funcionales del proyecto
          </p>
        </div>
        <PermissionGate module={MODULES.POI} permission={PERMISSIONS.CREATE}>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Requerimiento
          </Button>
        </PermissionGate>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="funcional" className="gap-2">
            Funcionales (RF)
            <Badge variant="secondary" className="ml-1">
              {countFuncionales}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="no-funcional" className="gap-2">
            No Funcionales
            <Badge variant="secondary" className="ml-1">
              {countNoFuncionales}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="matriz">Matriz de Trazabilidad</TabsTrigger>
        </TabsList>

        {/* Tab Funcionales */}
        <TabsContent value="funcional" className="space-y-4">
          <RequerimientoFiltersComponent
            onFilter={handleFilter}
            total={countFuncionales}
            filteredTotal={filteredRequerimientos.length}
          />
          {renderTable()}
        </TabsContent>

        {/* Tab No Funcionales */}
        <TabsContent value="no-funcional" className="space-y-4">
          <RequerimientoFiltersComponent
            onFilter={handleFilter}
            total={countNoFuncionales}
            filteredTotal={filteredRequerimientos.length}
          />
          {renderTable()}
        </TabsContent>

        {/* Tab Matriz */}
        <TabsContent value="matriz">
          <MatrizTrazabilidad
            requerimientos={requerimientos}
            proyectoId={proyectoId}
          />
        </TabsContent>
      </Tabs>

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

      {/* Dialog de confirmación de aprobación/rechazo */}
      <AlertDialog open={!!aprobarData} onOpenChange={() => setAprobarData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {aprobarData?.action === 'aprobar'
                ? '¿Aprobar requerimiento?'
                : '¿Rechazar requerimiento?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {aprobarData?.action === 'aprobar'
                ? 'El requerimiento será marcado como aprobado.'
                : 'El requerimiento será marcado como rechazado.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAprobarConfirm}
              className={
                aprobarData?.action === 'aprobar'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-destructive'
              }
            >
              {aprobarData?.action === 'aprobar' ? 'Aprobar' : 'Rechazar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
