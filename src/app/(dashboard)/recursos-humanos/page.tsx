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
  DivisionDetailModal,
  HabilidadTable,
  HabilidadForm,
  AsignacionTable,
  AsignacionForm,
  RRHHDashboard,
  CoordinadoresTable,
  ScrumMastersTable,
  UsuariosTable,
  CrearAccesoModal,
} from '@/features/rrhh/components';
import type {
  Personal,
  Division,
  Habilidad,
  Asignacion,
  RRHHStats,
  Usuario,
  Role,
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
import { apiClient } from '@/lib/api/client';

// Tipo para proyectos básicos del POI
interface ProyectoBasico {
  id: number;
  codigo: string;
  nombre: string;
}
import {
  Users,
  Building2,
  Sparkles,
  Briefcase,
  AlertTriangle,
  UserCheck,
  Activity,
  LayoutDashboard,
  UserCog,
  Users2,
  Shield,
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
    // Coordinadores y Scrum Masters
    asignarCoordinador,
    removerCoordinador,
    asignarScrumMaster,
    removerScrumMaster,
    // Usuarios
    usuarios,
    loadUsuarios,
    agregarRol,
    removerRol,
    resetearPassword,
    toggleUsuarioActivo,
    // Stats
    loadStats,
    // Utils
    clearError,
  } = useRRHH();

  // Estados para modales
  const [personalFormOpen, setPersonalFormOpen] = useState(false);
  const [divisionFormOpen, setDivisionFormOpen] = useState(false);
  const [divisionDetailOpen, setDivisionDetailOpen] = useState(false);
  const [viewDivision, setViewDivision] = useState<Division | null>(null);
  const [habilidadFormOpen, setHabilidadFormOpen] = useState(false);
  const [asignacionFormOpen, setAsignacionFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'personal' | 'division' | 'habilidad' | 'asignacion';
    item: Personal | Division | Habilidad | Asignacion;
  } | null>(null);

  // Estado para modal de crear acceso
  const [crearAccesoModalOpen, setCrearAccesoModalOpen] = useState(false);
  const [personalParaAcceso, setPersonalParaAcceso] = useState<Personal | null>(null);

  // Estado para proyectos del POI (para asignaciones)
  const [proyectos, setProyectos] = useState<ProyectoBasico[]>([]);

  // Función para cargar proyectos del POI
  const loadProyectos = async () => {
    try {
      const response = await apiClient.get('/proyectos');
      const proyectosData = response.data?.data || response.data || [];
      setProyectos(
        proyectosData.map((p: { id: number; codigo: string; nombre: string }) => ({
          id: p.id,
          codigo: p.codigo,
          nombre: p.nombre,
        }))
      );
    } catch (err) {
      console.error('Error loading proyectos:', err);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadPersonal();
    loadDivisiones();
    loadHabilidades();
    loadAsignaciones();
    loadAlertasSobrecarga();
    loadUsuarios();
    loadStats();
    loadProyectos();
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

  const handleCrearAcceso = (persona: Personal) => {
    setPersonalParaAcceso(persona);
    setCrearAccesoModalOpen(true);
  };

  const handleCrearAccesoSubmit = async (personalId: number, rol: Role) => {
    const response = await apiClient.post(`/usuarios/para-personal/${personalId}`, { rol });
    // Recargar ambos: personal y usuarios para mantener sincronizados
    await Promise.all([loadPersonal(), loadUsuarios()]);
    return response.data.data || response.data;
  };

  const handleCambiarRol = async (persona: Personal, nuevoRol: Role) => {
    if (!persona.usuarioId) return;
    try {
      await apiClient.patch(`/usuarios/${persona.usuarioId}`, { rol: nuevoRol });
      // Recargar ambos: personal y usuarios para mantener sincronizados
      await Promise.all([loadPersonal(), loadUsuarios()]);
      toast({ title: 'Rol actualizado correctamente' });
    } catch (error) {
      console.error('Error al cambiar rol:', error);
      toast({ title: 'Error al cambiar rol', variant: 'destructive' });
    }
  };

  const handleRevocarAcceso = async (persona: Personal) => {
    if (!persona.usuarioId) return;
    if (!confirm(`¿Está seguro de desactivar el acceso de ${persona.nombres} ${persona.apellidos}? El usuario será desactivado.`)) {
      return;
    }
    try {
      await apiClient.patch(`/usuarios/${persona.usuarioId}`, { activo: false });
      // Recargar ambos: personal y usuarios para mantener sincronizados
      await Promise.all([loadPersonal(), loadUsuarios()]);
      toast({ title: 'Acceso revocado correctamente' });
    } catch (error) {
      console.error('Error al revocar acceso:', error);
      toast({ title: 'Error al revocar acceso', variant: 'destructive' });
    }
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
    setViewDivision(division);
    setDivisionDetailOpen(true);
  };

  const handleEditDivisionFromDetail = (division: Division) => {
    setViewDivision(null);
    setDivisionDetailOpen(false);
    handleEditDivision(division);
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
          toast({ title: 'División desactivada correctamente' });
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
              <TabsList className="mb-6 flex-wrap">
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
                <TabsTrigger value="coordinadores" className="flex items-center gap-2">
                  <UserCog className="h-4 w-4" />
                  Coordinadores
                </TabsTrigger>
                <TabsTrigger value="scrum-masters" className="flex items-center gap-2">
                  <Users2 className="h-4 w-4" />
                  Scrum Masters
                </TabsTrigger>
                <TabsTrigger value="usuarios" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Usuarios
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
                  onCrearAcceso={handleCrearAcceso}
                  onCambiarRol={handleCambiarRol}
                  onRevocarAcceso={handleRevocarAcceso}
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

              <TabsContent value="coordinadores">
                <CoordinadoresTable
                  divisiones={divisiones}
                  personal={personal}
                  onAsignarCoordinador={asignarCoordinador}
                  onRemoverCoordinador={removerCoordinador}
                  isLoading={isLoading}
                />
              </TabsContent>

              <TabsContent value="scrum-masters">
                <ScrumMastersTable
                  divisiones={divisiones}
                  personal={personal}
                  onAsignarScrumMaster={asignarScrumMaster}
                  onRemoverScrumMaster={removerScrumMaster}
                  isLoading={isLoading}
                />
              </TabsContent>

              <TabsContent value="usuarios">
                <UsuariosTable
                  usuarios={usuarios}
                  onResetearPassword={resetearPassword}
                  onToggleActivo={toggleUsuarioActivo}
                  onAgregarRol={agregarRol}
                  onRemoverRol={removerRol}
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
          isLoading={isLoading}
        />

        <DivisionDetailModal
          open={divisionDetailOpen}
          onClose={() => {
            setDivisionDetailOpen(false);
            setViewDivision(null);
          }}
          onEdit={handleEditDivisionFromDetail}
          division={viewDivision}
          miembros={
            viewDivision
              ? personal.filter((p) => {
                  // Solo personal de esta división
                  if (p.divisionId !== viewDivision.id) return false;
                  // Excluir al coordinador
                  if (viewDivision.coordinador?.id === p.id) return false;
                  // Excluir a los scrum masters
                  if (viewDivision.scrumMasters?.some((sm) => sm.id === p.id)) return false;
                  return true;
                })
              : []
          }
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
          proyectos={proyectos}
          actividades={[]} // TODO: Load from POI
          subproyectos={[]} // TODO: Load from POI
          isLoading={isLoading}
        />

        <CrearAccesoModal
          open={crearAccesoModalOpen}
          onClose={() => {
            setCrearAccesoModalOpen(false);
            setPersonalParaAcceso(null);
          }}
          personal={personalParaAcceso}
          onCrearAcceso={handleCrearAccesoSubmit}
        />

        {/* Diálogo de confirmación de eliminación */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {itemToDelete?.type === 'division' ? 'Confirmar desactivación' : 'Confirmar eliminación'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {itemToDelete?.type === 'division' ? (
                  <>
                    ¿Estás seguro de que deseas desactivar esta división?
                    La división quedará inactiva y no estará disponible para asignaciones.
                    Puedes reactivarla posteriormente desde la opción de editar.
                  </>
                ) : (
                  <>
                    ¿Estás seguro de que deseas eliminar este registro?
                    Esta acción no se puede deshacer.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {itemToDelete?.type === 'division' ? 'Desactivar' : 'Eliminar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AppLayout>
    </ProtectedRoute>
  );
}
