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
import type { Sprint } from '@/features/proyectos/types';
import { getSprintDailyMeetings } from '@/features/proyectos/services/sprints.service';
import {
  DailyCalendar,
  CreateDailyModal,
  ImpedimentosPanel,
} from '@/features/daily-meetings/components';
import type { Impedimento } from '@/features/daily-meetings/components';
import {
  createDailyMeeting,
  registrarParticipacion,
} from '@/features/daily-meetings/services/daily-meeting.service';

interface DailyViewProps {
  proyectoId: number;
  sprints: Sprint[];
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

export function DailyView({ proyectoId, sprints }: DailyViewProps) {
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  const [dailyMeetings, setDailyMeetings] = useState<DailyMeeting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDaily, setSelectedDaily] = useState<DailyMeeting | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'history'>('calendar');
  const [expandedDailyId, setExpandedDailyId] = useState<number | null>(null);

  const sprintActivo = sprints.find((s) => s.estado === 'Activo');
  const sprintsConMeetings = sprints.filter((s) => s.estado !== 'Planificado');

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
      loadImpedimentos();
    }
  }, [selectedSprintId]);

  const loadDailyMeetings = async () => {
    try {
      setIsLoading(true);
      const data = await getSprintDailyMeetings(selectedSprintId);
      setDailyMeetings(data);
    } catch (err) {
      console.error('Error loading daily meetings:', err);
      setDailyMeetings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEquipoSprint = async () => {
    // TODO: Cargar equipo real del sprint desde el backend
    // Por ahora usamos datos de ejemplo
    const selectedSprint = sprints.find((s) => s.id.toString() === selectedSprintId);
    if (selectedSprint && (selectedSprint as any).equipo) {
      setEquipoSprint((selectedSprint as any).equipo);
    } else {
      // Datos de ejemplo
      setEquipoSprint([
        { id: 1, usuarioId: 1, nombre: 'Juan Pérez', email: 'juan@test.com', rol: 'Desarrollador' },
        { id: 2, usuarioId: 2, nombre: 'María García', email: 'maria@test.com', rol: 'Desarrollador' },
        { id: 3, usuarioId: 3, nombre: 'Carlos López', email: 'carlos@test.com', rol: 'QA' },
      ]);
    }
  };

  const loadImpedimentos = async () => {
    // TODO: Cargar impedimentos reales del backend
    // Por ahora extraemos de las dailies existentes
    const impedimentosFromDailies: Impedimento[] = [];
    dailyMeetings.forEach((daily) => {
      daily.participantes.forEach((p) => {
        if (p.impedimentos) {
          impedimentosFromDailies.push({
            id: Math.random(),
            descripcion: p.impedimentos,
            reportadoPor: { id: p.id, nombre: p.nombre },
            prioridad: 'Media',
            estado: 'Abierto',
            fechaReporte: daily.fecha,
            dailyMeetingId: daily.id,
            fechaDaily: daily.fecha,
          });
        }
      });
    });
    setImpedimentos(impedimentosFromDailies);
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
    const dateKey = date.toISOString().split('T')[0];
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
      // Crear la daily meeting
      const newDaily = await createDailyMeeting({
        sprintId: parseInt(selectedSprintId),
        fecha: data.fecha,
        horaInicio: data.horaInicio,
        notas: data.notas,
      });

      // Registrar participaciones
      for (const p of data.participantes) {
        await registrarParticipacion(selectedSprintId, newDaily.id, {
          personalId: p.usuarioId,
          asistio: p.asistio,
          ayer: p.queHiceAyer,
          hoy: p.queHareHoy,
          impedimentos: p.impedimentos,
          notas: p.ausenciMotivo,
        });
      }

      toast({
        title: 'Daily registrada',
        description: 'La daily meeting se registró correctamente',
      });
      loadDailyMeetings();
      loadImpedimentos();
    } catch (error) {
      console.error('Error creating daily:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la daily meeting',
        variant: 'destructive',
      });
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
    // TODO: Implementar creación de impedimento en backend
    const newImpedimento: Impedimento = {
      id: Date.now(),
      descripcion: data.descripcion,
      reportadoPor: { id: 1, nombre: 'Usuario Actual' }, // TODO: Usuario real
      responsable: data.responsableId
        ? equipoSprint.find((m) => m.usuarioId === data.responsableId)
          ? { id: data.responsableId, nombre: equipoSprint.find((m) => m.usuarioId === data.responsableId)!.nombre }
          : undefined
        : undefined,
      prioridad: data.prioridad,
      estado: 'Abierto',
      fechaReporte: new Date().toISOString(),
      fechaLimite: data.fechaLimite,
    };
    setImpedimentos((prev) => [...prev, newImpedimento]);
    toast({
      title: 'Impedimento registrado',
      description: 'El impedimento fue creado correctamente',
    });
  };

  const handleUpdateImpedimento = async (id: number, data: Partial<Impedimento>) => {
    setImpedimentos((prev) =>
      prev.map((imp) => (imp.id === id ? { ...imp, ...data } : imp))
    );
  };

  const handleResolveImpedimento = async (id: number, resolucion: string) => {
    setImpedimentos((prev) =>
      prev.map((imp) =>
        imp.id === id
          ? { ...imp, estado: 'Resuelto' as const, resolucion }
          : imp
      )
    );
    toast({
      title: 'Impedimento resuelto',
      description: 'El impedimento fue marcado como resuelto',
    });
  };

  const getInitials = (nombre: string) => {
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
                  {sprint.estado === 'Activo' && (
                    <Badge className="ml-2 bg-blue-100 text-blue-800">Activo</Badge>
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
                              new Date(selectedSprint.fechaInicio).getTime()) /
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
                      onEdit={() => toast({ title: 'Edición', description: 'Funcionalidad en desarrollo' })}
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
    </div>
  );
}

// Componente para mostrar detalle de daily
interface DailyDetailCardProps {
  daily: DailyMeeting;
  onEdit: () => void;
}

function DailyDetailCard({ daily, onEdit }: DailyDetailCardProps) {
  const fecha = new Date(daily.fecha);
  const hasImpediments = daily.participantes.some((p) => p.impedimentos);
  const asistentes = daily.participantes.filter((p) => p.asistio !== false);

  const getInitials = (nombre: string) => {
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
          <Button variant="outline" size="sm" onClick={onEdit}>
            Editar
          </Button>
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
  const fecha = new Date(daily.fecha);
  const hasImpediments = daily.participantes.some((p) => p.impedimentos);
  const asistentes = daily.participantes.filter((p) => p.asistio !== false);

  const getInitials = (nombre: string) => {
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
