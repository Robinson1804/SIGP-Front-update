'use client';

/**
 * Página principal de RRHH
 *
 * Vista con tabs para gestionar Personal, Divisiones, Habilidades y Asignaciones
 */

import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/app-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/lib/hooks/use-toast';
import { ProtectedRoute } from '@/features/auth';
import { MODULES } from '@/lib/definitions';
import { useRRHH } from '@/features/rrhh/hooks/use-rrhh';
import {
  PersonalTable,
  PersonalForm,
  DivisionTable,
  DivisionForm,
  HabilidadTable,
  HabilidadForm,
  AsignacionTable,
  AsignacionForm,
  RRHHDashboard,
} from '@/features/rrhh/components';
import type {
  Personal,
  Division,
  Habilidad,
  Asignacion,
  RRHHStats,
} from '@/features/rrhh/types';
import type {
  CreatePersonalDto,
  UpdatePersonalDto,
  CreateDivisionDto,
  UpdateDivisionDto,
  CreateHabilidadDto,
  UpdateHabilidadDto,
  CreateAsignacionDto,
  UpdateAsignacionDto,
} from '@/features/rrhh/types/dto';
import {
  Users,
  Building2,
  Sparkles,
  Briefcase,
  AlertTriangle,
  UserCheck,
  Activity,
  LayoutDashboard,
} from 'lucide-react';

export default function RecursosHumanosPage() {
  const { toast } = useToast();
  const {
    // Estado
    personal,
    divisiones,
    habilidades,
    asignaciones,
    alertasSobrecarga,
    stats,
    isLoading,
    error,
    // Personal
    loadPersonal,
    createPersonal,
    updatePersonal,
    deletePersonal,
    selectPersonal,
    selectedPersonal,
    // Divisiones
    loadDivisiones,
    createDivision,
    updateDivision,
    deleteDivision,
    selectDivision,
    selectedDivision,
    // Habilidades
    loadHabilidades,
    createHabilidad,
    updateHabilidad,
    deleteHabilidad,
    selectHabilidad,
    selectedHabilidad,
    // Asignaciones
    loadAsignaciones,
    loadAlertasSobrecarga,
    createAsignacion,
    updateAsignacion,
    finalizarAsignacion,
    deleteAsignacion,
    selectAsignacion,
    selectedAsignacion,
    // Stats
    loadStats,
    // Utils
    clearError,
  } = useRRHH();

  // Estados para modales
  const [personalFormOpen, setPersonalFormOpen] = useState(false);
  const [divisionFormOpen, setDivisionFormOpen] = useState(false);
  const [habilidadFormOpen, setHabilidadFormOpen] = useState(false);
  const [asignacionFormOpen, setAsignacionFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'personal' | 'division' | 'habilidad' | 'asignacion';
    item: Personal | Division | Habilidad | Asignacion;
  } | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadPersonal();
    loadDivisiones();
    loadHabilidades();
    loadAsignaciones();
    loadAlertasSobrecarga();
    loadStats();
  }, []);

  // Mostrar errores
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
      clearError();
    }
  }, [error]);

  // Handlers Personal
  const handleCreatePersonal = () => {
    selectPersonal(null);
    setPersonalFormOpen(true);
  };

  const handleEditPersonal = (persona: Personal) => {
    selectPersonal(persona);
    setPersonalFormOpen(true);
  };

  const handleViewPersonal = (persona: Personal) => {
    // TODO: Navigate to personal detail page
    window.location.href = `/recursos-humanos/personal/${persona.id}`;
  };

  const handleSubmitPersonal = async (data: CreatePersonalDto | UpdatePersonalDto) => {
    if (selectedPersonal) {
      await updatePersonal(selectedPersonal.id, data as UpdatePersonalDto);
      toast({ title: 'Personal actualizado correctamente' });
    } else {
      await createPersonal(data as CreatePersonalDto);
      toast({ title: 'Personal creado correctamente' });
    }
    setPersonalFormOpen(false);
  };

  // Handlers División
  const handleCreateDivision = () => {
    selectDivision(null);
    setDivisionFormOpen(true);
  };

  const handleEditDivision = (division: Division) => {
    selectDivision(division);
    setDivisionFormOpen(true);
  };

  const handleViewDivision = (division: Division) => {
    // TODO: Navigate or show detail
  };

  const handleSubmitDivision = async (data: CreateDivisionDto | UpdateDivisionDto) => {
    if (selectedDivision) {
      await updateDivision(selectedDivision.id, data as UpdateDivisionDto);
      toast({ title: 'División actualizada correctamente' });
    } else {
      await createDivision(data as CreateDivisionDto);
      toast({ title: 'División creada correctamente' });
    }
    setDivisionFormOpen(false);
  };

  // Handlers Habilidad
  const handleCreateHabilidad = () => {
    selectHabilidad(null);
    setHabilidadFormOpen(true);
  };

  const handleEditHabilidad = (habilidad: Habilidad) => {
    selectHabilidad(habilidad);
    setHabilidadFormOpen(true);
  };

  const handleSubmitHabilidad = async (data: CreateHabilidadDto | UpdateHabilidadDto) => {
    if (selectedHabilidad) {
      await updateHabilidad(selectedHabilidad.id, data as UpdateHabilidadDto);
      toast({ title: 'Habilidad actualizada correctamente' });
    } else {
      await createHabilidad(data as CreateHabilidadDto);
      toast({ title: 'Habilidad creada correctamente' });
    }
    setHabilidadFormOpen(false);
  };

  // Handlers Asignación
  const handleCreateAsignacion = () => {
    selectAsignacion(null);
    setAsignacionFormOpen(true);
  };

  const handleEditAsignacion = (asignacion: Asignacion) => {
    selectAsignacion(asignacion);
    setAsignacionFormOpen(true);
  };

  const handleFinalizarAsignacion = async (asignacion: Asignacion) => {
    await finalizarAsignacion(asignacion.id);
    toast({ title: 'Asignación finalizada correctamente' });
  };

  const handleSubmitAsignacion = async (data: CreateAsignacionDto | UpdateAsignacionDto) => {
    if (selectedAsignacion) {
      await updateAsignacion(selectedAsignacion.id, data as UpdateAsignacionDto);
      toast({ title: 'Asignación actualizada correctamente' });
    } else {
      await createAsignacion(data as CreateAsignacionDto);
      toast({ title: 'Asignación creada correctamente' });
    }
    setAsignacionFormOpen(false);
  };

  // Handlers Delete
  const handleDeleteConfirm = (
    type: 'personal' | 'division' | 'habilidad' | 'asignacion',
    item: Personal | Division | Habilidad | Asignacion
  ) => {
    setItemToDelete({ type, item });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      switch (itemToDelete.type) {
        case 'personal':
          await deletePersonal((itemToDelete.item as Personal).id);
          toast({ title: 'Personal eliminado correctamente' });
          break;
        case 'division':
          await deleteDivision((itemToDelete.item as Division).id);
          toast({ title: 'División eliminada correctamente' });
          break;
        case 'habilidad':
          await deleteHabilidad((itemToDelete.item as Habilidad).id);
          toast({ title: 'Habilidad eliminada correctamente' });
          break;
        case 'asignacion':
          await deleteAsignacion((itemToDelete.item as Asignacion).id);
          toast({ title: 'Asignación eliminada correctamente' });
          break;
      }
    } catch {
      // Error already handled by hook
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <ProtectedRoute module={MODULES.RECURSOS_HUMANOS}>
      <AppLayout breadcrumbs={[{ label: 'RECURSOS HUMANOS' }]}>
        <div className="flex-1 flex flex-col bg-[#F9F9F9]">
          {/* Header con KPIs */}
          <div className="bg-gradient-to-r from-[#004272] to-[#005a99] text-white p-6">
            <h1 className="text-2xl font-bold mb-4">Recursos Humanos</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <Card className="bg-white/10 border-white/20">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-sm">Total Personal</p>
                      <p className="text-2xl font-bold text-white">
                        {stats?.totalPersonal || 0}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-white/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-sm">Activos</p>
                      <p className="text-2xl font-bold text-white">
                        {stats?.personalActivo || 0}
                      </p>
                    </div>
                    <UserCheck className="h-8 w-8 text-white/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-sm">Disponibles</p>
                      <p className="text-2xl font-bold text-white">
                        {stats?.personalDisponible || 0}
                      </p>
                    </div>
                    <Activity className="h-8 w-8 text-white/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-sm">Divisiones</p>
                      <p className="text-2xl font-bold text-white">
                        {stats?.totalDivisiones || 0}
                      </p>
                    </div>
                    <Building2 className="h-8 w-8 text-white/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-sm">Alertas</p>
                      <p className="text-2xl font-bold text-white">
                        {stats?.alertasSobrecarga || 0}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-amber-300" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contenido con Tabs */}
          <div className="flex-1 p-6">
            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="personal" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Personal
                </TabsTrigger>
                <TabsTrigger value="divisiones" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Divisiones
                </TabsTrigger>
                <TabsTrigger value="habilidades" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Habilidades
                </TabsTrigger>
                <TabsTrigger value="asignaciones" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Asignaciones
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard">
                <RRHHDashboard
                  stats={stats}
                  personal={personal}
                  divisiones={divisiones}
                  asignaciones={asignaciones}
                  alertasSobrecarga={alertasSobrecarga}
                  isLoading={isLoading}
                />
              </TabsContent>

              <TabsContent value="personal">
                <PersonalTable
                  personal={personal}
                  divisiones={divisiones}
                  onView={handleViewPersonal}
                  onEdit={handleEditPersonal}
                  onDelete={(p) => handleDeleteConfirm('personal', p)}
                  onCreate={handleCreatePersonal}
                  isLoading={isLoading}
                />
              </TabsContent>

              <TabsContent value="divisiones">
                <DivisionTable
                  divisiones={divisiones}
                  onView={handleViewDivision}
                  onEdit={handleEditDivision}
                  onDelete={(d) => handleDeleteConfirm('division', d)}
                  onCreate={handleCreateDivision}
                  isLoading={isLoading}
                />
              </TabsContent>

              <TabsContent value="habilidades">
                <HabilidadTable
                  habilidades={habilidades}
                  onEdit={handleEditHabilidad}
                  onDelete={(h) => handleDeleteConfirm('habilidad', h)}
                  onCreate={handleCreateHabilidad}
                  isLoading={isLoading}
                />
              </TabsContent>

              <TabsContent value="asignaciones">
                <AsignacionTable
                  asignaciones={asignaciones}
                  personal={personal}
                  onEdit={handleEditAsignacion}
                  onDelete={(a) => handleDeleteConfirm('asignacion', a)}
                  onFinalizar={handleFinalizarAsignacion}
                  onCreate={handleCreateAsignacion}
                  isLoading={isLoading}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Formularios */}
        <PersonalForm
          open={personalFormOpen}
          onClose={() => setPersonalFormOpen(false)}
          onSubmit={handleSubmitPersonal}
          personal={selectedPersonal}
          divisiones={divisiones}
          isLoading={isLoading}
        />

        <DivisionForm
          open={divisionFormOpen}
          onClose={() => setDivisionFormOpen(false)}
          onSubmit={handleSubmitDivision}
          division={selectedDivision}
          divisiones={divisiones}
          personal={personal}
          isLoading={isLoading}
        />

        <HabilidadForm
          open={habilidadFormOpen}
          onClose={() => setHabilidadFormOpen(false)}
          onSubmit={handleSubmitHabilidad}
          habilidad={selectedHabilidad}
          isLoading={isLoading}
        />

        <AsignacionForm
          open={asignacionFormOpen}
          onClose={() => setAsignacionFormOpen(false)}
          onSubmit={handleSubmitAsignacion}
          asignacion={selectedAsignacion}
          personal={personal}
          proyectos={[]} // TODO: Load from POI
          actividades={[]} // TODO: Load from POI
          subproyectos={[]} // TODO: Load from POI
          isLoading={isLoading}
        />

        {/* Diálogo de confirmación de eliminación */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de que deseas eliminar este registro?
                Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AppLayout>
    </ProtectedRoute>
  );
}
