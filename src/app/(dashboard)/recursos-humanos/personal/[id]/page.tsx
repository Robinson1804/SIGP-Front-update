'use client';

/**
 * Página de detalle de Personal
 *
 * Muestra información completa de un empleado:
 * - Datos personales y laborales
 * - Habilidades asignadas
 * - Asignaciones activas
 * - Carga de trabajo
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/lib/hooks/use-toast';
import { ProtectedRoute } from '@/features/auth';
import { MODULES } from '@/lib/definitions';
import { rrhhService } from '@/features/rrhh/services/rrhh.service';
import type {
  Personal,
  PersonalHabilidad,
  Asignacion,
  DisponibilidadResponse,
  Habilidad,
} from '@/features/rrhh/types';
import {
  Modalidad,
  NivelHabilidad,
  TipoAsignacion,
  getModalidadLabel,
  getNombreCompleto,
  getNivelLabel,
  getNivelColor,
  getTipoAsignacionLabel,
  getCargaColor,
  getCategoriaLabel,
  getCategoriaColor,
} from '@/features/rrhh/types';
import type { AsignarHabilidadDto } from '@/features/rrhh/types/dto';
import {
  ArrowLeft,
  Edit,
  User,
  Building2,
  Mail,
  Phone,
  Calendar,
  Clock,
  Briefcase,
  Sparkles,
  AlertTriangle,
  Plus,
  Trash2,
  Loader2,
  Award,
} from 'lucide-react';

export default function PersonalDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  // Estados principales
  const [personal, setPersonal] = useState<Personal | null>(null);
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadResponse | null>(null);
  const [habilidades, setHabilidades] = useState<PersonalHabilidad[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [catalogoHabilidades, setCatalogoHabilidades] = useState<Habilidad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para modales
  const [habilidadDialogOpen, setHabilidadDialogOpen] = useState(false);
  const [deleteHabilidadDialog, setDeleteHabilidadDialog] = useState<PersonalHabilidad | null>(null);
  const [newHabilidad, setNewHabilidad] = useState<AsignarHabilidadDto>({
    habilidadId: 0,
    nivel: NivelHabilidad.BASICO,
    aniosExperiencia: 0,
    certificado: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Cargar datos
  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const personalId = typeof id === 'string' ? id : String(id);

      const [personalData, disponibilidadData, habilidadesData, asignacionesData, catalogoData] =
        await Promise.all([
          rrhhService.getPersonalById(personalId),
          rrhhService.getPersonalDisponibilidad(personalId).catch(() => null),
          rrhhService.getPersonalHabilidades(personalId).catch(() => []),
          rrhhService.getAsignaciones({ personalId: Number(personalId), activo: true }).catch(() => []),
          rrhhService.getHabilidades({ activo: true }).catch(() => []),
        ]);

      setPersonal(personalData);
      setDisponibilidad(disponibilidadData);
      setHabilidades(habilidadesData);
      setAsignaciones(asignacionesData);
      setCatalogoHabilidades(catalogoData);
    } catch (err) {
      console.error('Error loading personal:', err);
      setError('No se pudo cargar la información del personal');
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers
  const handleBack = () => {
    router.push('/recursos-humanos');
  };

  const handleEdit = () => {
    // TODO: Abrir modal de edición o navegar a página de edición
    toast({ title: 'Función de edición', description: 'Próximamente disponible' });
  };

  const handleAddHabilidad = async () => {
    if (!personal || !newHabilidad.habilidadId) {
      toast({ title: 'Error', description: 'Selecciona una habilidad', variant: 'destructive' });
      return;
    }

    try {
      setIsSaving(true);
      await rrhhService.asignarHabilidadPersonal(personal.id, newHabilidad);
      toast({ title: 'Habilidad asignada correctamente' });
      setHabilidadDialogOpen(false);
      setNewHabilidad({
        habilidadId: 0,
        nivel: NivelHabilidad.BASICO,
        aniosExperiencia: 0,
        certificado: false,
      });
      // Recargar habilidades
      const updated = await rrhhService.getPersonalHabilidades(personal.id);
      setHabilidades(updated);
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudo asignar la habilidad', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteHabilidad = async () => {
    if (!personal || !deleteHabilidadDialog) return;

    try {
      setIsSaving(true);
      await rrhhService.removePersonalHabilidad(personal.id, deleteHabilidadDialog.habilidadId);
      toast({ title: 'Habilidad removida correctamente' });
      setDeleteHabilidadDialog(null);
      // Recargar habilidades
      const updated = await rrhhService.getPersonalHabilidades(personal.id);
      setHabilidades(updated);
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudo remover la habilidad', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Helpers
  const getInitials = (p: Personal) => {
    return `${p.nombres[0]}${p.apellidos[0]}`.toUpperCase();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getModalidadBadge = (modalidad: Modalidad) => {
    const colorClasses: Record<Modalidad, string> = {
      [Modalidad.PLANILLA]: 'bg-blue-100 text-blue-800 border-blue-200',
      [Modalidad.CAS]: 'bg-purple-100 text-purple-800 border-purple-200',
      [Modalidad.LOCADOR]: 'bg-orange-100 text-orange-800 border-orange-200',
      [Modalidad.PRACTICANTE]: 'bg-green-100 text-green-800 border-green-200',
    };

    return (
      <Badge variant="outline" className={colorClasses[modalidad]}>
        {getModalidadLabel(modalidad)}
      </Badge>
    );
  };

  const getEstadoBadge = (p: Personal) => {
    if (!p.activo) {
      return <Badge variant="secondary">Inactivo</Badge>;
    }
    if (p.disponible) {
      return <Badge className="bg-green-500">Disponible</Badge>;
    }
    return <Badge className="bg-amber-500">Ocupado</Badge>;
  };

  // Filtrar habilidades disponibles (no asignadas)
  const habilidadesDisponibles = catalogoHabilidades.filter(
    (h) => !habilidades.some((ph) => ph.habilidadId === h.id)
  );

  // Calcular carga total
  const cargaTotal = disponibilidad?.porcentajeAsignado ||
    asignaciones.reduce((acc, a) => acc + a.porcentajeDedicacion, 0);

  if (isLoading) {
    return (
      <ProtectedRoute module={MODULES.RECURSOS_HUMANOS}>
        <AppLayout breadcrumbs={[{ label: 'RECURSOS HUMANOS', href: '/recursos-humanos' }, { label: 'Cargando...' }]}>
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#004272]" />
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (error || !personal) {
    return (
      <ProtectedRoute module={MODULES.RECURSOS_HUMANOS}>
        <AppLayout breadcrumbs={[{ label: 'RECURSOS HUMANOS', href: '/recursos-humanos' }, { label: 'Error' }]}>
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
            <p className="text-lg text-muted-foreground">{error || 'Personal no encontrado'}</p>
            <Button onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute module={MODULES.RECURSOS_HUMANOS}>
      <AppLayout
        breadcrumbs={[
          { label: 'RECURSOS HUMANOS', href: '/recursos-humanos' },
          { label: getNombreCompleto(personal) },
        ]}
      >
        <div className="flex-1 flex flex-col bg-[#F9F9F9]">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#004272] to-[#005a99] text-white p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={handleBack}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-16 w-16 border-2 border-white">
                  <AvatarFallback className="bg-white text-[#004272] text-xl font-bold">
                    {getInitials(personal)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold">{getNombreCompleto(personal)}</h1>
                  <p className="text-white/80">{personal.cargo || 'Sin cargo asignado'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="border-white/50 text-white">
                      {personal.codigoEmpleado}
                    </Badge>
                    {getModalidadBadge(personal.modalidad)}
                    {getEstadoBadge(personal)}
                  </div>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Columna izquierda - Info personal */}
              <div className="space-y-6">
                {/* Información básica */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-5 w-5" />
                      Información Personal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {personal.dni && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">DNI</p>
                          <p className="font-medium">{personal.dni}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Mail className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{personal.email}</p>
                      </div>
                    </div>

                    {personal.telefono && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <Phone className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Teléfono</p>
                          <p className="font-medium">{personal.telefono}</p>
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">División</p>
                        <p className="font-medium">{personal.division?.nombre || '-'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Fecha de Ingreso</p>
                        <p className="font-medium">{formatDate(personal.fechaIngreso)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Horas Semanales</p>
                        <p className="font-medium">{personal.horasSemanales} horas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Carga de trabajo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Briefcase className="h-5 w-5" />
                      Carga de Trabajo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Dedicación Total</span>
                        <span className={`font-bold ${getCargaColor(cargaTotal)}`}>
                          {cargaTotal.toFixed(0)}%
                        </span>
                      </div>
                      <Progress
                        value={Math.min(cargaTotal, 100)}
                        className={`h-3 ${cargaTotal > 100 ? 'bg-red-100' : ''}`}
                      />
                      {cargaTotal > 100 && (
                        <div className="flex items-center gap-2 mt-2 text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm">Sobrecarga de {(cargaTotal - 100).toFixed(0)}%</span>
                        </div>
                      )}
                    </div>

                    {disponibilidad && (
                      <>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Horas Asignadas</p>
                            <p className="font-medium">{disponibilidad.horasAsignadas.toFixed(1)}h</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Horas Disponibles</p>
                            <p className="font-medium">{disponibilidad.horasDisponibles.toFixed(1)}h</p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Columna central - Habilidades */}
              <div>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Sparkles className="h-5 w-5" />
                        Habilidades
                      </CardTitle>
                      <Button size="sm" onClick={() => setHabilidadDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar
                      </Button>
                    </div>
                    <CardDescription>
                      {habilidades.length} habilidades registradas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {habilidades.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No hay habilidades asignadas
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {habilidades.map((ph) => (
                          <div
                            key={ph.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-gray-50"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {ph.habilidad?.nombre || `Habilidad #${ph.habilidadId}`}
                                </span>
                                {ph.certificado && (
                                  <Award className="h-4 w-4 text-amber-500" title="Certificado" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {ph.habilidad && (
                                  <Badge
                                    variant="outline"
                                    className={getCategoriaColor(ph.habilidad.categoria)}
                                  >
                                    {getCategoriaLabel(ph.habilidad.categoria)}
                                  </Badge>
                                )}
                                <Badge className={getNivelColor(ph.nivel)}>
                                  {getNivelLabel(ph.nivel)}
                                </Badge>
                                {ph.aniosExperiencia && ph.aniosExperiencia > 0 && (
                                  <span className="text-sm text-muted-foreground">
                                    {ph.aniosExperiencia} años
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setDeleteHabilidadDialog(ph)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Columna derecha - Asignaciones */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Briefcase className="h-5 w-5" />
                      Asignaciones Activas
                    </CardTitle>
                    <CardDescription>
                      {asignaciones.length} asignaciones actuales
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {asignaciones.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No hay asignaciones activas
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {asignaciones.map((asig) => (
                          <div
                            key={asig.id}
                            className="p-3 rounded-lg border bg-white"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">
                                {getTipoAsignacionLabel(asig.tipoAsignacion)}
                              </Badge>
                              <span className={`font-bold ${getCargaColor(asig.porcentajeDedicacion)}`}>
                                {asig.porcentajeDedicacion}%
                              </span>
                            </div>
                            <p className="font-medium">
                              {asig.proyecto?.nombre ||
                                asig.actividad?.nombre ||
                                asig.subproyecto?.nombre ||
                                'Sin nombre'}
                            </p>
                            {asig.rolEquipo && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Rol: {asig.rolEquipo}
                              </p>
                            )}
                            <div className="mt-2">
                              <Progress value={asig.porcentajeDedicacion} className="h-2" />
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {new Date(asig.fechaInicio).toLocaleDateString('es-PE')}
                                {asig.fechaFin && ` - ${new Date(asig.fechaFin).toLocaleDateString('es-PE')}`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Dialog para agregar habilidad */}
        <Dialog open={habilidadDialogOpen} onOpenChange={setHabilidadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Habilidad</DialogTitle>
              <DialogDescription>
                Asigna una nueva habilidad a {getNombreCompleto(personal)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Habilidad *</Label>
                <Select
                  value={newHabilidad.habilidadId?.toString() || ''}
                  onValueChange={(value) =>
                    setNewHabilidad({ ...newHabilidad, habilidadId: Number(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar habilidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {habilidadesDisponibles.map((h) => (
                      <SelectItem key={h.id} value={String(h.id)}>
                        {h.nombre} ({getCategoriaLabel(h.categoria)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nivel *</Label>
                <Select
                  value={newHabilidad.nivel}
                  onValueChange={(value) =>
                    setNewHabilidad({ ...newHabilidad, nivel: value as NivelHabilidad })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(NivelHabilidad).map((nivel) => (
                      <SelectItem key={nivel} value={nivel}>
                        {getNivelLabel(nivel)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Años de Experiencia</Label>
                <Input
                  type="number"
                  min={0}
                  max={50}
                  value={newHabilidad.aniosExperiencia || ''}
                  onChange={(e) =>
                    setNewHabilidad({
                      ...newHabilidad,
                      aniosExperiencia: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="0"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Certificado</Label>
                  <p className="text-sm text-muted-foreground">
                    Cuenta con certificación oficial
                  </p>
                </div>
                <Switch
                  checked={newHabilidad.certificado}
                  onCheckedChange={(checked) =>
                    setNewHabilidad({ ...newHabilidad, certificado: checked })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setHabilidadDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddHabilidad} disabled={isSaving || !newHabilidad.habilidadId}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Agregar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmación de eliminación de habilidad */}
        <AlertDialog
          open={!!deleteHabilidadDialog}
          onOpenChange={() => setDeleteHabilidadDialog(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover Habilidad</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de que deseas remover la habilidad{' '}
                <strong>{deleteHabilidadDialog?.habilidad?.nombre}</strong> de este personal?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteHabilidad}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AppLayout>
    </ProtectedRoute>
  );
}
