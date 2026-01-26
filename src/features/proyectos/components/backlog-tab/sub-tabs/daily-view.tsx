'use client';

/**
 * DailyView Component
 *
 * Vista completa de Daily Meetings con:
 * - Calendario mensual con indicadores
 * - Creación de nuevas dailies
 * - Panel de impedimentos
 * - Historial y exportación PDF
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Loader2,
  Plus,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Target,
  FileDown,
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/lib/hooks/use-toast';
import { useAuth } from '@/stores';
import type { Sprint } from '@/features/proyectos/types';
import { getSprintDailyMeetings } from '@/features/proyectos/services/sprints.service';
import { parseLocalDate } from '@/lib/utils';
import {
  DailyCalendar,
  CreateDailyModal,
  EditDailyModal,
  ImpedimentosPanel,
} from '@/features/daily-meetings/components';
import type { Impedimento } from '@/features/daily-meetings/components';
import {
  createDailyMeeting,
  registrarParticipacion,
  updateDailyMeeting,
  deleteDailyMeeting,
  actualizarParticipacion,
} from '@/features/daily-meetings/services/daily-meeting.service';
import {
  getImpedimentosBySprint,
  createImpedimento,
  updateImpedimento,
  resolveImpedimento,
  type Impedimento as ImpedimentoAPI,
} from '@/features/daily-meetings/services/impedimento.service';
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

interface DailyViewProps {
  proyectoId: number;
  sprints: Sprint[];
  equipo?: { id: number; usuarioId?: number; nombre: string }[];
}

interface DailyMeeting {
  id: number;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  duracion: number;
  participantes: {
    id: number;
    usuarioId?: number;
    personalId?: number;
    nombre: string;
    asistio?: boolean;
    ayer: string;
    hoy: string;
    impedimentos: string | null;
  }[];
  notas: string | null;
  createdAt: string;
}

interface TeamMember {
  id: number;
  usuarioId: number;
  nombre: string;
  email: string;
  rol?: string;
}

export function DailyView({ proyectoId, sprints, equipo: equipoProyecto }: DailyViewProps) {
  const { user } = useAuth();
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  const [dailyMeetings, setDailyMeetings] = useState<DailyMeeting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDaily, setSelectedDaily] = useState<DailyMeeting | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'history'>('calendar');
  const [expandedDailyId, setExpandedDailyId] = useState<number | null>(null);

  // Estados para editar y eliminar
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [dailyToEdit, setDailyToEdit] = useState<DailyMeeting | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dailyToDelete, setDailyToDelete] = useState<DailyMeeting | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sprintActivo = sprints.find((s) => s.estado === 'En progreso' || s.estado === 'Activo');
  const sprintsConMeetings = sprints.filter((s) => s.estado !== 'Por hacer' && s.estado !== 'Planificado');

  // Equipo del sprint seleccionado (mock - reemplazar con datos reales)
  const [equipoSprint, setEquipoSprint] = useState<TeamMember[]>([]);

  // Impedimentos (mock - reemplazar con datos reales del backend)
  const [impedimentos, setImpedimentos] = useState<Impedimento[]>([]);

  useEffect(() => {
    if (sprintActivo && !selectedSprintId) {
      setSelectedSprintId(sprintActivo.id.toString());
    }
  }, [sprintActivo]);

  useEffect(() => {
    if (selectedSprintId) {
      loadDailyMeetings();
      loadEquipoSprint();
      loadImpedimentos(); // Cargar impedimentos desde API
    }
  }, [selectedSprintId, equipoProyecto]);

  // Auto-seleccionar el día de hoy y mostrar su daily si existe
  useEffect(() => {
    if (dailyMeetings.length > 0 && !selectedDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setSelectedDate(today);

      // Buscar si hay daily para hoy
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayKey = `${year}-${month}-${day}`;

      const todaysDaily = dailyMeetings.find(
        (d) => d.fecha.split('T')[0] === todayKey
      );

      if (todaysDaily) {
        setSelectedDaily(todaysDaily);
        setExpandedDailyId(todaysDaily.id);
      }
    }
  }, [dailyMeetings]);

  const loadDailyMeetings = async () => {
    try {
      setIsLoading(true);
      const data = await getSprintDailyMeetings(selectedSprintId);

      // Transformar datos del backend al formato del frontend
      // Backend: participante.usuario.nombre, participante.queHiceAyer
      // Frontend: participante.nombre, participante.ayer
      const mappedData = data.map((daily: any) => ({
        ...daily,
        duracion: daily.duracionMinutos || daily.duracion || 15,
        participantes: (daily.participantes || []).map((p: any) => ({
          id: p.id,
          usuarioId: p.usuarioId,
          nombre: p.usuario
            ? `${p.usuario.nombre || ''} ${p.usuario.apellido || ''}`.trim()
            : p.nombre || 'Sin nombre',
          asistio: p.asistio ?? false,
          ayer: p.queHiceAyer || '',
          hoy: p.queHareHoy || '',
          impedimentos: p.impedimentos || null,
        })),
      }));

      setDailyMeetings(mappedData);
    } catch (err) {
      console.error('Error loading daily meetings:', err);
      setDailyMeetings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEquipoSprint = async () => {
    // Usar el equipo del proyecto (responsables asignados)
    if (equipoProyecto && equipoProyecto.length > 0) {
      // Solo incluir miembros que tengan usuarioId (vinculación con tabla usuarios)
      // El backend requiere usuarioId para los participantes del daily
      const equipoMapeado: TeamMember[] = equipoProyecto
        .filter((miembro) => miembro.usuarioId) // Solo los que tienen usuario vinculado
        .map((miembro) => ({
          id: miembro.id,
          usuarioId: miembro.usuarioId!, // Usar el usuarioId real
          nombre: miembro.nombre,
          email: '', // No disponible desde asignaciones
          rol: 'Responsable',
        }));
      setEquipoSprint(equipoMapeado);
    } else {
      // Si no hay equipo, verificar si el sprint tiene equipo asignado
      const selectedSprint = sprints.find((s) => s.id.toString() === selectedSprintId);
      if (selectedSprint && (selectedSprint as any).equipo) {
        setEquipoSprint((selectedSprint as any).equipo);
      } else {
        // Sin equipo disponible
        setEquipoSprint([]);
      }
    }
  };

  const loadImpedimentos = async () => {
    if (!selectedSprintId) return;

    try {
      // Cargar impedimentos del backend
      const impedimentosData = await getImpedimentosBySprint(parseInt(selectedSprintId));

      // Validar que sea un array antes de mapear
      if (!Array.isArray(impedimentosData)) {
        console.warn('impedimentosData no es un array:', impedimentosData);
        setImpedimentos([]);
        return;
      }

      // Mapear al formato del frontend
      const mappedImpedimentos: Impedimento[] = impedimentosData.map((imp: ImpedimentoAPI) => ({
        id: imp.id,
        descripcion: imp.descripcion,
        reportadoPor: {
          id: imp.reportadoPor?.id || 0,
          nombre: imp.reportadoPor
            ? `${imp.reportadoPor.nombre || ''} ${imp.reportadoPor.apellido || ''}`.trim()
            : 'Desconocido',
        },
        responsable: imp.responsable
          ? {
              id: imp.responsable.id,
              nombre: `${imp.responsable.nombre || ''} ${imp.responsable.apellido || ''}`.trim(),
            }
          : undefined,
        prioridad: imp.prioridad,
        estado: imp.estado,
        fechaReporte: imp.fechaReporte,
        fechaLimite: imp.fechaLimite,
        resolucion: imp.resolucion,
        dailyMeetingId: imp.dailyMeetingId,
      }));

      setImpedimentos(mappedImpedimentos);
    } catch (error) {
      console.error('Error loading impedimentos:', error);
      setImpedimentos([]);
    }
  };

  // Preparar datos para el calendario
  const dailiesForCalendar = useMemo(() => {
    return dailyMeetings.map((daily) => ({
      id: daily.id,
      fecha: daily.fecha,
      hasImpedimentos: daily.participantes.some((p) => p.impedimentos),
      totalParticipantes: daily.participantes.length,
      asistentes: daily.participantes.filter((p) => p.asistio !== false).length,
    }));
  }, [dailyMeetings]);

  const selectedSprint = sprints.find((s) => s.id.toString() === selectedSprintId);

  // Manejar selección de fecha en calendario
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Usar formato local para evitar problemas de zona horaria
    // toISOString() convierte a UTC, lo que puede cambiar el día
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    const existingDaily = dailyMeetings.find(
      (d) => d.fecha.split('T')[0] === dateKey
    );
    if (existingDaily) {
      setSelectedDaily(existingDaily);
      setExpandedDailyId(existingDaily.id);
    } else {
      setSelectedDaily(null);
      // Si es hoy o futuro, podemos crear una nueva daily
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date >= today) {
        setIsCreateModalOpen(true);
      }
    }
  };

  // Manejar creación de nueva daily
  const handleCreateDaily = async (data: {
    fecha: string;
    horaInicio: string;
    duracionMinutos: number;
    notas?: string;
    participantes: {
      usuarioId: number;
      nombre: string;
      asistio: boolean;
      ausenciMotivo?: string;
      queHiceAyer: string;
      queHareHoy: string;
      impedimentos: string;
    }[];
  }) => {
    try {
      // Obtener nombre del sprint para el título
      const sprint = sprints.find((s) => s.id.toString() === selectedSprintId);
      // Usar parseLocalDate para evitar problemas de zona horaria
      // new Date("2026-01-20") interpreta como UTC, causando que muestre el día anterior
      const fechaLocal = parseLocalDate(data.fecha);
      const fechaFormateada = fechaLocal
        ? fechaLocal.toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
        : data.fecha;

      // Preparar participantes con el formato del backend
      // Enviamos TODOS los participantes con su estado de asistencia
      const participantesDto = data.participantes.map((p) => ({
        usuarioId: p.usuarioId,
        asistio: p.asistio,
        // Solo incluir respuestas si asistió
        queHiceAyer: p.asistio ? (p.queHiceAyer || undefined) : undefined,
        queHareHoy: p.asistio ? (p.queHareHoy || undefined) : undefined,
        impedimentos: p.asistio ? (p.impedimentos || undefined) : undefined,
      }));

      // Crear la daily meeting con todos los campos requeridos
      // El sprintId es importante para asociar la daily al sprint correcto
      const newDaily = await createDailyMeeting({
        tipo: 'Proyecto', // Debe coincidir con el enum del backend
        proyectoId: proyectoId,
        sprintId: parseInt(selectedSprintId), // Asociar al sprint seleccionado
        nombre: `Daily ${sprint?.nombre || 'Sprint'} - ${fechaFormateada}`,
        fecha: data.fecha,
        horaInicio: data.horaInicio,
        notas: data.notas,
        participantes: participantesDto.length > 0 ? participantesDto : undefined,
      });

      toast({
        title: 'Daily registrada',
        description: 'La daily meeting se registró correctamente',
      });

      // Recargar los datos del backend
      const freshData = await getSprintDailyMeetings(selectedSprintId);

      // Transformar datos del backend al formato del frontend
      const mappedData = freshData.map((daily: any) => ({
        ...daily,
        duracion: daily.duracionMinutos || daily.duracion || 15,
        participantes: (daily.participantes || []).map((p: any) => ({
          id: p.id,
          usuarioId: p.usuarioId,
          nombre: p.usuario
            ? `${p.usuario.nombre || ''} ${p.usuario.apellido || ''}`.trim()
            : p.nombre || 'Sin nombre',
          asistio: p.asistio ?? false,
          ayer: p.queHiceAyer || '',
          hoy: p.queHareHoy || '',
          impedimentos: p.impedimentos || null,
        })),
      }));

      // Actualizar el estado con los nuevos datos
      setDailyMeetings(mappedData);

      // Seleccionar el daily recién creado
      if (newDaily?.id) {
        const createdDaily = mappedData.find((d: DailyMeeting) => d.id === newDaily.id);
        if (createdDaily) {
          setSelectedDaily(createdDaily);
          setExpandedDailyId(createdDaily.id);
        }
      }
      // Los impedimentos se recargan automáticamente via useEffect cuando dailyMeetings cambia
    } catch (error) {
      console.error('Error creating daily:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la daily meeting',
        variant: 'destructive',
      });
    }
  };

  // Editar daily meeting
  const handleEditDaily = (daily: DailyMeeting) => {
    setDailyToEdit(daily);
    setIsEditModalOpen(true);
  };

  // Guardar cambios de edición
  const handleSaveEdit = async (data: {
    horaInicio?: string;
    horaFin?: string;
    notas?: string;
    participantes?: {
      id: number;
      asistio: boolean;
      ayer: string;
      hoy: string;
      impedimentos: string;
    }[];
  }) => {
    if (!dailyToEdit) return;

    try {
      // Actualizar la daily meeting
      await updateDailyMeeting(dailyToEdit.id, {
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        notas: data.notas,
      });

      // Actualizar cada participante si hay cambios
      if (data.participantes) {
        for (const p of data.participantes) {
          await actualizarParticipacion(p.id, {
            asistio: p.asistio,
            queHiceAyer: p.ayer,
            queHareHoy: p.hoy,
            impedimentos: p.impedimentos,
          });
        }
      }

      toast({
        title: 'Daily actualizada',
        description: 'Los cambios se guardaron correctamente',
      });

      // Guardar el ID del daily que estamos editando para actualizarlo después
      const editedDailyId = dailyToEdit.id;

      setIsEditModalOpen(false);
      setDailyToEdit(null);

      // Recargar los datos del backend
      const freshData = await getSprintDailyMeetings(selectedSprintId);

      // Transformar datos del backend al formato del frontend
      const mappedData = freshData.map((daily: any) => ({
        ...daily,
        duracion: daily.duracionMinutos || daily.duracion || 15,
        participantes: (daily.participantes || []).map((p: any) => ({
          id: p.id,
          usuarioId: p.usuarioId,
          nombre: p.usuario
            ? `${p.usuario.nombre || ''} ${p.usuario.apellido || ''}`.trim()
            : p.nombre || 'Sin nombre',
          asistio: p.asistio ?? false,
          ayer: p.queHiceAyer || '',
          hoy: p.queHareHoy || '',
          impedimentos: p.impedimentos || null,
        })),
      }));

      // Actualizar el estado con los nuevos datos
      setDailyMeetings(mappedData);

      // Actualizar selectedDaily con los datos recargados
      const updatedDaily = mappedData.find((d: DailyMeeting) => d.id === editedDailyId);
      if (updatedDaily) {
        setSelectedDaily(updatedDaily);
      }
      // Los impedimentos se recargan automáticamente via useEffect cuando dailyMeetings cambia
    } catch (error) {
      console.error('Error updating daily:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la daily meeting',
        variant: 'destructive',
      });
    }
  };

  // Confirmar eliminación
  const handleDeleteDaily = (daily: DailyMeeting) => {
    setDailyToDelete(daily);
    setIsDeleteDialogOpen(true);
  };

  // Ejecutar eliminación
  const confirmDelete = async () => {
    if (!dailyToDelete) return;

    try {
      setIsDeleting(true);
      await deleteDailyMeeting(dailyToDelete.id);

      toast({
        title: 'Daily eliminada',
        description: 'La daily meeting fue eliminada correctamente',
      });

      setIsDeleteDialogOpen(false);
      setDailyToDelete(null);
      setSelectedDaily(null);
      loadDailyMeetings();
    } catch (error) {
      console.error('Error deleting daily:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la daily meeting',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Exportar a PDF
  const handleExportPDF = async () => {
    toast({
      title: 'Generando PDF',
      description: 'Por favor espere...',
    });
    // TODO: Implementar generación de PDF
    // Por ahora mostramos un mensaje
    setTimeout(() => {
      toast({
        title: 'PDF generado',
        description: 'Funcionalidad en desarrollo',
      });
    }, 1000);
  };

  // Manejar impedimentos
  const handleCreateImpedimento = async (data: any) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'No se pudo identificar al usuario',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createImpedimento({
        descripcion: data.descripcion,
        proyectoId: proyectoId,
        sprintId: selectedSprintId ? parseInt(selectedSprintId) : undefined,
        reportadoPorId: user.id,
        responsableId: data.responsableId,
        prioridad: data.prioridad,
        fechaLimite: data.fechaLimite,
      });

      toast({
        title: 'Impedimento registrado',
        description: 'El impedimento fue creado correctamente',
      });

      // Recargar impedimentos
      await loadImpedimentos();
    } catch (error) {
      console.error('Error creating impedimento:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el impedimento',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateImpedimento = async (id: number, data: Partial<Impedimento>) => {
    try {
      await updateImpedimento(id, {
        descripcion: data.descripcion,
        responsableId: data.responsable?.id,
        prioridad: data.prioridad,
        estado: data.estado,
        fechaLimite: data.fechaLimite,
      });
      // Recargar impedimentos
      await loadImpedimentos();
    } catch (error) {
      console.error('Error updating impedimento:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el impedimento',
        variant: 'destructive',
      });
    }
  };

  const handleResolveImpedimento = async (id: number, resolucion: string) => {
    try {
      await resolveImpedimento(id, resolucion);
      // Recargar impedimentos
      await loadImpedimentos();
      toast({
        title: 'Impedimento resuelto',
        description: 'El impedimento fue marcado como resuelto',
      });
    } catch (error) {
      console.error('Error resolving impedimento:', error);
      toast({
        title: 'Error',
        description: 'No se pudo resolver el impedimento',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (nombre: string) => {
    if (!nombre) return '??';
    return nombre
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Estadísticas rápidas
  const stats = useMemo(() => {
    const totalDailies = dailyMeetings.length;
    const conImpedimentos = dailyMeetings.filter((d) =>
      d.participantes.some((p) => p.impedimentos)
    ).length;
    const promedioAsistencia =
      totalDailies > 0
        ? Math.round(
            (dailyMeetings.reduce(
              (acc, d) =>
                acc +
                d.participantes.filter((p) => p.asistio !== false).length /
                  d.participantes.length,
              0
            ) /
              totalDailies) *
              100
          )
        : 0;
    const impedimentosAbiertos = impedimentos.filter(
      (i) => i.estado !== 'Resuelto'
    ).length;

    return {
      totalDailies,
      conImpedimentos,
      promedioAsistencia,
      impedimentosAbiertos,
    };
  }, [dailyMeetings, impedimentos]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-600" />
          <h4 className="text-lg font-semibold">Daily Meetings</h4>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedSprintId} onValueChange={setSelectedSprintId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Seleccionar sprint" />
            </SelectTrigger>
            <SelectContent>
              {sprintsConMeetings.map((sprint) => (
                <SelectItem key={sprint.id} value={sprint.id.toString()}>
                  {sprint.nombre}
                  {(sprint.estado === 'En progreso' || sprint.estado === 'Activo') && (
                    <Badge className="ml-2 bg-blue-100 text-blue-800">En progreso</Badge>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ImpedimentosPanel
            impedimentos={impedimentos}
            equipo={equipoSprint.map((m) => ({ id: m.usuarioId, nombre: m.nombre }))}
            onCreateImpedimento={handleCreateImpedimento}
            onUpdateImpedimento={handleUpdateImpedimento}
            onResolveImpedimento={handleResolveImpedimento}
            canManage={true}
          />

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleExportPDF}
            disabled={dailyMeetings.length === 0}
          >
            <FileDown className="h-4 w-4" />
            Exportar PDF
          </Button>

          <Button
            size="sm"
            className="gap-2 bg-purple-600 hover:bg-purple-700"
            disabled={!selectedSprintId}
            onClick={() => {
              setSelectedDate(new Date());
              setIsCreateModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nueva Daily
          </Button>
        </div>
      </div>

      {!selectedSprintId ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">
              Selecciona un sprint para ver sus daily meetings
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalDailies}</p>
                    <p className="text-xs text-gray-500">Dailies realizadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.promedioAsistencia}%</p>
                    <p className="text-xs text-gray-500">Asistencia promedio</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.impedimentosAbiertos}</p>
                    <p className="text-xs text-gray-500">Impedimentos abiertos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {selectedSprint?.fechaInicio
                        ? Math.ceil(
                            (new Date().getTime() -
                              (parseLocalDate(selectedSprint.fechaInicio)?.getTime() || 0)) /
                              (1000 * 60 * 60 * 24)
                          )
                        : 0}
                    </p>
                    <p className="text-xs text-gray-500">Días de sprint</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for Calendar/History */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList>
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="h-4 w-4" />
                Calendario
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                Historial
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendario */}
                <div className="lg:col-span-1">
                  <DailyCalendar
                    dailies={dailiesForCalendar}
                    selectedDate={selectedDate}
                    onSelectDate={handleDateSelect}
                    sprintFechaInicio={selectedSprint?.fechaInicio ?? undefined}
                    sprintFechaFin={selectedSprint?.fechaFin ?? undefined}
                  />
                </div>

                {/* Detalle de la daily seleccionada */}
                <div className="lg:col-span-2">
                  {selectedDaily ? (
                    <DailyDetailCard
                      daily={selectedDaily}
                      onEdit={() => handleEditDaily(selectedDaily)}
                      onDelete={() => handleDeleteDaily(selectedDaily)}
                    />
                  ) : selectedDate ? (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-500 text-center mb-4">
                          No hay daily meeting registrada para el{' '}
                          {selectedDate.toLocaleDateString('es-PE', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </p>
                        {selectedDate >= new Date(new Date().setHours(0, 0, 0, 0)) && (
                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => setIsCreateModalOpen(true)}
                          >
                            <Plus className="h-4 w-4" />
                            Registrar Daily
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-500 text-center">
                          Selecciona un día en el calendario para ver los detalles
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Historial de Daily Meetings</CardTitle>
                  <CardDescription>
                    {dailyMeetings.length} reuniones registradas en el sprint
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {dailyMeetings.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No hay daily meetings registradas</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-4 pr-4">
                        {dailyMeetings
                          .sort(
                            (a, b) =>
                              new Date(b.fecha).getTime() -
                              new Date(a.fecha).getTime()
                          )
                          .map((daily) => (
                            <DailyHistoryCard
                              key={daily.id}
                              daily={daily}
                              isExpanded={expandedDailyId === daily.id}
                              onToggle={() =>
                                setExpandedDailyId(
                                  expandedDailyId === daily.id ? null : daily.id
                                )
                              }
                            />
                          ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Modal de creación */}
      <CreateDailyModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        sprintId={parseInt(selectedSprintId) || 0}
        sprintNombre={selectedSprint?.nombre || ''}
        equipoSprint={equipoSprint}
        fechaPreseleccionada={selectedDate || undefined}
        onSubmit={handleCreateDaily}
      />

      {/* Modal de edición */}
      {dailyToEdit && (
        <EditDailyModal
          open={isEditModalOpen}
          onOpenChange={(open) => {
            setIsEditModalOpen(open);
            if (!open) setDailyToEdit(null);
          }}
          daily={dailyToEdit}
          onSave={handleSaveEdit}
        />
      )}

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Daily Meeting?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la
              daily meeting del{' '}
              {dailyToDelete &&
                (parseLocalDate(dailyToDelete.fecha) || new Date(dailyToDelete.fecha)).toLocaleDateString(
                  'es-PE',
                  {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }
                )}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Componente para mostrar detalle de daily
interface DailyDetailCardProps {
  daily: DailyMeeting;
  onEdit: () => void;
  onDelete?: () => void;
}

function DailyDetailCard({ daily, onEdit, onDelete }: DailyDetailCardProps) {
  // Usar parseLocalDate para evitar problemas de zona horaria
  const fecha = parseLocalDate(daily.fecha) || new Date(daily.fecha);
  const hasImpediments = daily.participantes.some((p) => p.impedimentos);
  const asistentes = daily.participantes.filter((p) => p.asistio !== false);

  const getInitials = (nombre: string) => {
    if (!nombre) return '??';
    return nombre
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-center min-w-[70px] p-3 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {fecha.getDate()}
              </div>
              <div className="text-xs text-purple-500 uppercase">
                {fecha.toLocaleDateString('es-PE', { month: 'short', year: 'numeric' })}
              </div>
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Daily Standup
                {hasImpediments && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Impedimentos
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {daily.horaInicio || '09:00'} - {daily.duracion} min
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {asistentes.length}/{daily.participantes.length} asistentes
                </span>
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              Editar
            </Button>
            {onDelete && (
              <Button variant="outline" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                Eliminar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px]">
          <div className="space-y-4">
            {daily.participantes.map((participante) => (
              <div
                key={participante.id}
                className="p-4 bg-gray-50 rounded-lg space-y-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                      {getInitials(participante.nombre)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">
                      {participante.nombre}
                    </span>
                    {participante.asistio === false && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Ausente
                      </Badge>
                    )}
                  </div>
                </div>
                {participante.asistio !== false && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-gray-500">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        Ayer
                      </div>
                      <p className="text-gray-700">{participante.ayer || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Target className="h-3 w-3 text-blue-500" />
                        Hoy
                      </div>
                      <p className="text-gray-700">{participante.hoy || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-gray-500">
                        <AlertCircle className="h-3 w-3 text-red-500" />
                        Impedimentos
                      </div>
                      <p
                        className={
                          participante.impedimentos
                            ? 'text-red-600 font-medium'
                            : 'text-gray-400'
                        }
                      >
                        {participante.impedimentos || 'Sin impedimentos'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {daily.notas && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-sm font-medium text-yellow-800 mb-1">
                  Notas de la reunión
                </div>
                <p className="text-sm text-yellow-900">{daily.notas}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Componente para historial
interface DailyHistoryCardProps {
  daily: DailyMeeting;
  isExpanded: boolean;
  onToggle: () => void;
}

function DailyHistoryCard({ daily, isExpanded, onToggle }: DailyHistoryCardProps) {
  // Usar parseLocalDate para evitar problemas de zona horaria
  const fecha = parseLocalDate(daily.fecha) || new Date(daily.fecha);
  const hasImpediments = daily.participantes.some((p) => p.impedimentos);
  const asistentes = daily.participantes.filter((p) => p.asistio !== false);

  const getInitials = (nombre: string) => {
    if (!nombre) return '??';
    return nombre
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-center min-w-[50px]">
              <div className="text-xl font-bold text-gray-900">
                {fecha.getDate()}
              </div>
              <div className="text-xs text-gray-500 uppercase">
                {fecha.toLocaleDateString('es-PE', { month: 'short' })}
              </div>
            </div>
            <div>
              <p className="font-medium flex items-center gap-2">
                {fecha.toLocaleDateString('es-PE', { weekday: 'long' })}
                {hasImpediments && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Impedimentos
                  </Badge>
                )}
              </p>
              <p className="text-sm text-gray-500 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {daily.duracion} min
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {asistentes.length}/{daily.participantes.length}
                </span>
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <CardContent className="pt-0 border-t">
          <div className="space-y-3 mt-4">
            {daily.participantes.map((participante) => (
              <div
                key={participante.id}
                className="p-3 bg-gray-50 rounded-lg space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-purple-100 text-purple-700 text-[10px]">
                      {getInitials(participante.nombre)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{participante.nombre}</span>
                  {participante.asistio === false && (
                    <Badge variant="secondary" className="text-xs">
                      Ausente
                    </Badge>
                  )}
                </div>
                {participante.asistio !== false && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        Ayer:
                      </span>
                      <p className="text-gray-700">{participante.ayer || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 flex items-center gap-1">
                        <Target className="h-3 w-3 text-blue-500" />
                        Hoy:
                      </span>
                      <p className="text-gray-700">{participante.hoy || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 text-red-500" />
                        Impedimentos:
                      </span>
                      <p
                        className={
                          participante.impedimentos
                            ? 'text-red-600'
                            : 'text-gray-400'
                        }
                      >
                        {participante.impedimentos || 'Sin impedimentos'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {daily.notas && (
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <span className="text-xs font-medium text-yellow-800">Notas: </span>
                <span className="text-xs text-yellow-900">{daily.notas}</span>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
