'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  Download,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Trash2,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
import { toast } from '@/lib/hooks/use-toast';
import { useAuth } from '@/stores';
import { ROLES } from '@/lib/definitions';
import {
  getActasByProyecto,
  getActaById,
  saveActaPdf,
  getEstadoLabel,
  createActaReunion,
  updateActaReunion,
  createActaConstitucion,
  updateActaConstitucion,
  deleteActa,
  aprobarActa,
  enviarActaARevision,
} from '@/features/documentos/services/actas.service';
import type { Acta, ActasByProyectoResponse } from '@/features/documentos/types';
import { ActaReunionForm } from './ActaReunionForm';
import { ActaReunionWizard } from './ActaReunionWizard';
import { ActaReunionView } from './ActaReunionView';
import { ActaConstitucionForm } from './ActaConstitucionForm';
import { ActaConstitucionView } from './ActaConstitucionView';
import { AprobacionActaDialog } from './AprobacionActaDialog';

const estadoIcons = {
  Borrador: <Clock className="h-4 w-4" />,
  'En revisión': <AlertCircle className="h-4 w-4" />,
  Aprobado: <CheckCircle className="h-4 w-4" />,
  Rechazado: <XCircle className="h-4 w-4" />,
};

// Tipos de vistas internas
type ViewType =
  | 'list'
  | 'new-reunion'
  | 'edit-reunion'
  | 'view-reunion'
  | 'new-constitucion'
  | 'edit-constitucion'
  | 'view-constitucion';

interface ActasTabContentProps {
  proyectoId: number;
}

export function ActasTabContent({ proyectoId }: ActasTabContentProps) {
  const { user } = useAuth();

  // Permisos por rol
  // ADMIN: acceso total a todas las funciones
  // SCRUM_MASTER/COORDINADOR: crear, editar, eliminar, ver, descargar, enviar a revisión
  // PMO y PATROCINADOR: solo ver, descargar, validar (aprobar/rechazar cuando estado = En revisión)
  const isAdmin = user?.role === ROLES.ADMIN;
  const isScrumMaster = user?.role === ROLES.SCRUM_MASTER;
  const isCoordinador = user?.role === ROLES.COORDINADOR;
  const isPmo = user?.role === ROLES.PMO;
  const isPatrocinador = user?.role === ROLES.PATROCINADOR;

  const canManageActas = isAdmin || isScrumMaster || isCoordinador; // crear, editar, eliminar, enviar a revisión
  const canApprove = isPmo || isPatrocinador; // aprobar/rechazar (solo cuando estado = En revisión)

  // Verifica si el usuario actual puede aprobar un acta específica
  // PMO no puede aprobar si ya aprobó, PATROCINADOR igual
  const canCurrentUserApproveActa = (acta: Acta): boolean => {
    if (acta.estado !== 'En revisión') return false;
    if (isPmo && acta.aprobadoPorPmo) return false; // PMO ya aprobó
    if (isPatrocinador && acta.aprobadoPorPatrocinador) return false; // PATROCINADOR ya aprobó
    return canApprove;
  };

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ActasByProyectoResponse | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<number | null>(null);

  // Vista actual y acta seleccionada
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [selectedActa, setSelectedActa] = useState<Acta | null>(null);
  const [saving, setSaving] = useState(false);
  const [formMode, setFormMode] = useState<'wizard' | 'form'>('form');

  // Estados para eliminación
  const [deletingActa, setDeletingActa] = useState<Acta | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados para aprobación/rechazo
  const [approvingActa, setApprovingActa] = useState<Acta | null>(null);

  // Estados para enviar a revisión
  const [sendingToReview, setSendingToReview] = useState(false);

  const fetchActas = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getActasByProyecto(proyectoId.toString());
      setData(result);
    } catch (error) {
      console.error('Error fetching actas:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las actas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [proyectoId]);

  useEffect(() => {
    fetchActas();
  }, [fetchActas]);

  const handleDownloadPdf = async (acta: Acta) => {
    try {
      setDownloadingPdf(acta.id);
      let filename = 'Acta_Reunion';
      if (acta.tipo === 'Acta de Constitucion') {
        filename = 'Acta_Constitucion';
      }
      filename = `${filename}_${acta.codigo}.pdf`;
      await saveActaPdf(acta.id, filename);
      toast({
        title: 'PDF descargado',
        description: `El archivo ${filename} se ha descargado correctamente`,
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Error',
        description: 'No se pudo descargar el PDF',
        variant: 'destructive',
      });
    } finally {
      setDownloadingPdf(null);
    }
  };

  const handleDeleteActa = async () => {
    if (!deletingActa) return;

    try {
      setIsDeleting(true);
      await deleteActa(deletingActa.id);
      toast({
        title: 'Acta eliminada',
        description: `El acta ${deletingActa.codigo} se ha eliminado correctamente`,
      });
      fetchActas();
    } catch (error) {
      console.error('Error deleting acta:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el acta',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeletingActa(null);
    }
  };

  const handleAprobarActa = async (aprobado: boolean, comentario?: string) => {
    if (!approvingActa) return;

    try {
      await aprobarActa(approvingActa.id, {
        aprobado,
        comentario,
      });
      toast({
        title: aprobado ? 'Acta aprobada' : 'Acta rechazada',
        description: aprobado
          ? `El acta ${approvingActa.codigo} ha sido aprobada correctamente`
          : `El acta ${approvingActa.codigo} ha sido rechazada`,
        variant: aprobado ? 'default' : 'destructive',
      });
      fetchActas();
      setApprovingActa(null);
    } catch (error) {
      console.error('Error approving acta:', error);
      toast({
        title: 'Error',
        description: 'No se pudo procesar la aprobación del acta',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleEnviarARevision = async (acta: Acta) => {
    try {
      setSendingToReview(true);
      await enviarActaARevision(acta.id);
      toast({
        title: 'Acta enviada a revisión',
        description: `El acta ${acta.codigo} ha sido enviada a PMO y Patrocinador para su aprobación`,
      });
      fetchActas();
      // Si estamos en la vista de detalle, actualizar el acta seleccionada
      if (selectedActa?.id === acta.id) {
        const updatedActa = await getActaById(acta.id);
        setSelectedActa(updatedActa);
      }
    } catch (error) {
      console.error('Error sending to review:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar el acta a revisión',
        variant: 'destructive',
      });
    } finally {
      setSendingToReview(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Navegacion interna
  const goToList = () => {
    setCurrentView('list');
    setSelectedActa(null);
  };

  const goToNewReunion = () => {
    setSelectedActa(null);
    setCurrentView('new-reunion');
  };

  const goToEditReunion = async (acta: Acta) => {
    // Cargar el acta completa con todos sus datos
    try {
      const fullActa = await getActaById(acta.id);
      setSelectedActa(fullActa);
      setCurrentView('edit-reunion');
    } catch (error) {
      console.error('Error loading acta:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el acta',
        variant: 'destructive',
      });
    }
  };

  const goToViewReunion = async (acta: Acta) => {
    try {
      const fullActa = await getActaById(acta.id);
      setSelectedActa(fullActa);
      setCurrentView('view-reunion');
    } catch (error) {
      console.error('Error loading acta:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el acta',
        variant: 'destructive',
      });
    }
  };

  const goToNewConstitucion = () => {
    setSelectedActa(null);
    setCurrentView('new-constitucion');
  };

  const goToEditConstitucion = async (acta: Acta) => {
    try {
      const fullActa = await getActaById(acta.id);
      setSelectedActa(fullActa);
      setCurrentView('edit-constitucion');
    } catch (error) {
      console.error('Error loading acta:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el acta',
        variant: 'destructive',
      });
    }
  };

  const goToViewConstitucion = async (acta: Acta) => {
    try {
      const fullActa = await getActaById(acta.id);
      setSelectedActa(fullActa);
      setCurrentView('view-constitucion');
    } catch (error) {
      console.error('Error loading acta:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el acta',
        variant: 'destructive',
      });
    }
  };

  // Handlers de guardado
  const handleSaveReunion = async (formData: any) => {
    try {
      setSaving(true);
      if (selectedActa) {
        await updateActaReunion(selectedActa.id, formData);
        toast({
          title: 'Acta actualizada',
          description: 'El acta de reunion se ha actualizado correctamente',
        });
      } else {
        // Generar código automático si no existe
        const reunionesCount = data?.reuniones?.length || 0;
        const codigo = `AR-${proyectoId}-${String(reunionesCount + 1).padStart(3, '0')}`;
        // El moderadorId es el usuario que genera el acta
        const moderadorId = user?.id ? (typeof user.id === 'string' ? parseInt(user.id, 10) : user.id) : undefined;
        await createActaReunion({ ...formData, proyectoId, codigo, moderadorId });
        toast({
          title: 'Acta creada',
          description: 'El acta de reunion se ha creado correctamente',
        });
      }
      goToList();
      fetchActas();
    } catch (error) {
      console.error('Error saving acta:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el acta de reunion',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConstitucion = async (formData: any) => {
    try {
      setSaving(true);
      if (selectedActa) {
        await updateActaConstitucion(selectedActa.id, formData);
        toast({
          title: 'Acta actualizada',
          description: 'El acta de constitucion se ha actualizado correctamente',
        });
      } else {
        await createActaConstitucion({ ...formData, proyectoId });
        toast({
          title: 'Acta creada',
          description: 'El acta de constitucion se ha creado correctamente',
        });
      }
      goToList();
      fetchActas();
    } catch (error) {
      console.error('Error saving acta:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el acta de constitucion',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // =============================================
  // VISTA: Nueva/Editar Acta de Reunion
  // =============================================
  if (currentView === 'new-reunion' || currentView === 'edit-reunion') {
    return (
      <div className="space-y-4">
        {/* Header con navegacion */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={goToList}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h3 className="text-xl font-bold">
                {currentView === 'new-reunion' ? 'Nueva Acta de Reunion' : 'Editar Acta de Reunion'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {currentView === 'new-reunion'
                  ? 'Complete los datos para crear una nueva acta de reunion'
                  : `Editando: ${selectedActa?.codigo}`}
              </p>
            </div>
          </div>
          <Tabs value={formMode} onValueChange={(v) => setFormMode(v as 'wizard' | 'form')}>
            <TabsList>
              <TabsTrigger value="form">Formulario</TabsTrigger>
              <TabsTrigger value="wizard">Wizard</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Formulario */}
        <Card>
          <CardContent className="pt-6">
            {formMode === 'form' ? (
              <ActaReunionForm
                acta={selectedActa}
                proyectoId={proyectoId}
                onSave={handleSaveReunion}
                onCancel={goToList}
                saving={saving}
              />
            ) : (
              <ActaReunionWizard
                acta={selectedActa}
                proyectoId={proyectoId}
                onSave={handleSaveReunion}
                onCancel={goToList}
                saving={saving}
              />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // =============================================
  // VISTA: Ver Acta de Reunion
  // =============================================
  if (currentView === 'view-reunion' && selectedActa) {
    return (
      <>
        <div className="space-y-4">
          {/* Header con navegacion */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={goToList}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h3 className="text-xl font-bold">{selectedActa.nombre}</h3>
                <p className="text-sm text-muted-foreground">{selectedActa.codigo}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canManageActas && selectedActa.estado === 'Borrador' && (
                <Button variant="outline" onClick={() => goToEditReunion(selectedActa)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => handleDownloadPdf(selectedActa)}
                disabled={downloadingPdf === selectedActa.id}
              >
                {downloadingPdf === selectedActa.id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Descargar PDF
              </Button>
              {canCurrentUserApproveActa(selectedActa) && (
                <Button onClick={() => setApprovingActa(selectedActa)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Validar
                </Button>
              )}
            </div>
          </div>

          {/* Vista del acta */}
          <ActaReunionView acta={selectedActa} />
        </div>

        {/* Dialog de aprobación/rechazo */}
        <AprobacionActaDialog
          open={!!approvingActa}
          onClose={() => setApprovingActa(null)}
          onAprobar={handleAprobarActa}
          tipo="Reunion"
        />
      </>
    );
  }

  // =============================================
  // VISTA: Nueva/Editar Acta de Constitucion
  // =============================================
  if (currentView === 'new-constitucion' || currentView === 'edit-constitucion') {
    return (
      <div className="space-y-4">
        {/* Header con navegacion */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={goToList}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="text-xl font-bold">
              {currentView === 'new-constitucion' ? 'Nueva Acta de Constitucion' : 'Editar Acta de Constitucion'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentView === 'new-constitucion'
                ? 'Complete los datos para crear el acta de constitucion del proyecto'
                : `Editando: ${selectedActa?.codigo}`}
            </p>
          </div>
        </div>

        {/* Formulario */}
        <Card>
          <CardContent className="pt-6">
            <ActaConstitucionForm
              acta={selectedActa}
              proyectoId={proyectoId}
              onSave={handleSaveConstitucion}
              onCancel={goToList}
              saving={saving}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // =============================================
  // VISTA: Ver Acta de Constitucion
  // =============================================
  if (currentView === 'view-constitucion' && selectedActa) {
    return (
      <>
        <div className="space-y-4">
          {/* Header con navegacion */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={goToList}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h3 className="text-xl font-bold">{selectedActa.nombre}</h3>
                <p className="text-sm text-muted-foreground">{selectedActa.codigo}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canManageActas && selectedActa.estado === 'Borrador' && (
                <Button variant="outline" onClick={() => goToEditConstitucion(selectedActa)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => handleDownloadPdf(selectedActa)}
                disabled={downloadingPdf === selectedActa.id}
              >
                {downloadingPdf === selectedActa.id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Descargar PDF
              </Button>
              {/* Botón Enviar a Revisión: solo SCRUM_MASTER/COORDINADOR cuando estado = Borrador */}
              {canManageActas && selectedActa.estado === 'Borrador' && (
                <Button
                  onClick={() => handleEnviarARevision(selectedActa)}
                  disabled={sendingToReview}
                >
                  {sendingToReview ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Enviar a Revisión
                </Button>
              )}
              {/* Botón Validar: solo PMO/PATROCINADOR cuando estado = En revisión y no hayan aprobado aún */}
              {canCurrentUserApproveActa(selectedActa) && (
                <Button onClick={() => setApprovingActa(selectedActa)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Validar
                </Button>
              )}
            </div>
          </div>

          {/* Vista del acta */}
          <ActaConstitucionView acta={selectedActa} />
        </div>

        {/* Dialog de aprobación/rechazo */}
        <AprobacionActaDialog
          open={!!approvingActa}
          onClose={() => setApprovingActa(null)}
          onAprobar={handleAprobarActa}
          tipo="Constitucion"
        />
      </>
    );
  }

  // =============================================
  // VISTA: Lista de Actas (vista principal)
  // =============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-gray-700" />
          Actas del Proyecto
        </h3>
      </div>

      {/* Acta de Constitucion Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Acta de Constitucion
              </CardTitle>
              <CardDescription>
                Documento formal que autoriza el inicio del proyecto
              </CardDescription>
            </div>
            {!data?.constitucion && canManageActas && (
              <Button onClick={goToNewConstitucion}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Acta de Constitucion
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {data?.constitucion ? (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-full bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{data.constitucion.nombre}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{data.constitucion.codigo}</span>
                    <span>-</span>
                    <span>{formatDate(data.constitucion.fecha)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={getEstadoLabel(data.constitucion.estado).variant}>
                  {estadoIcons[data.constitucion.estado]}
                  <span className="ml-1">{getEstadoLabel(data.constitucion.estado).label}</span>
                </Badge>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => goToViewConstitucion(data.constitucion!)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canManageActas && data.constitucion.estado === 'Borrador' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => goToEditConstitucion(data.constitucion!)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownloadPdf(data.constitucion!)}
                    disabled={downloadingPdf === data.constitucion.id}
                  >
                    {downloadingPdf === data.constitucion.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                  {/* Botón Enviar a Revisión: solo SCRUM_MASTER/COORDINADOR cuando estado = Borrador */}
                  {canManageActas && data.constitucion.estado === 'Borrador' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEnviarARevision(data.constitucion!)}
                      disabled={sendingToReview}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      title="Enviar a revisión"
                    >
                      {sendingToReview ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  {/* Botón Validar: solo PMO/PATROCINADOR cuando estado = En revisión y no hayan aprobado aún */}
                  {canCurrentUserApproveActa(data.constitucion) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setApprovingActa(data.constitucion!)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      title="Validar acta"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  {canManageActas && data.constitucion.estado === 'Borrador' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingActa(data.constitucion!)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No se ha creado el acta de constitucion</p>
              <p className="text-sm">
                El acta de constitucion es el documento que formaliza el inicio del proyecto
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actas de Reunion Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Actas de Reunion
              </CardTitle>
              <CardDescription>
                Registro de las reuniones realizadas durante el proyecto
              </CardDescription>
            </div>
            {canManageActas && (
              <Button onClick={goToNewReunion}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Acta de Reunion
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {data?.reuniones && data.reuniones.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.reuniones.map((acta) => (
                  <TableRow key={acta.id}>
                    <TableCell className="font-mono text-sm">{acta.codigo}</TableCell>
                    <TableCell>{acta.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{acta.tipoReunion || 'Sin tipo'}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(acta.fecha)}</TableCell>
                    <TableCell>
                      <Badge variant={getEstadoLabel(acta.estado).variant}>
                        {estadoIcons[acta.estado]}
                        <span className="ml-1">{getEstadoLabel(acta.estado).label}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => goToViewReunion(acta)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canManageActas && acta.estado === 'Borrador' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => goToEditReunion(acta)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadPdf(acta)}
                          disabled={downloadingPdf === acta.id}
                        >
                          {downloadingPdf === acta.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                        {canCurrentUserApproveActa(acta) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setApprovingActa(acta)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Validar acta"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {canManageActas && acta.estado === 'Borrador' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingActa(acta)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay actas de reunion registradas</p>
              <p className="text-sm">
                Crea una nueva acta para documentar las reuniones del proyecto
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={!!deletingActa} onOpenChange={(open) => !open && setDeletingActa(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar acta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el acta <strong>{deletingActa?.codigo}</strong> ({deletingActa?.nombre}).
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteActa}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de aprobación/rechazo */}
      <AprobacionActaDialog
        open={!!approvingActa}
        onClose={() => setApprovingActa(null)}
        onAprobar={handleAprobarActa}
        tipo={
          approvingActa?.tipo === 'Acta de Constitucion'
            ? 'Constitucion'
            : 'Reunion'
        }
      />
    </div>
  );
}
