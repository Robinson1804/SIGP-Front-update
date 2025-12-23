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
  Users,
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
import { toast } from '@/lib/hooks/use-toast';
import {
  getActasByProyecto,
  getActaById,
  saveActaPdf,
  getEstadoLabel,
  createActaReunion,
  updateActaReunion,
  createActaConstitucion,
  updateActaConstitucion,
  createActaDaily,
  updateActaDaily,
} from '@/features/documentos/services/actas.service';
import type { Acta, ActasByProyectoResponse, CreateActaDailyInput } from '@/features/documentos/types';
import { ActaReunionForm } from './ActaReunionForm';
import { ActaReunionWizard } from './ActaReunionWizard';
import { ActaReunionView } from './ActaReunionView';
import { ActaConstitucionForm } from './ActaConstitucionForm';
import { ActaConstitucionView } from './ActaConstitucionView';
import { ActaDailyForm } from './ActaDailyForm';
import { ActaDailyView } from './ActaDailyView';

const estadoIcons = {
  Borrador: <Clock className="h-4 w-4" />,
  Pendiente: <AlertCircle className="h-4 w-4" />,
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
  | 'view-constitucion'
  | 'new-daily'
  | 'edit-daily'
  | 'view-daily';

interface ActasTabContentProps {
  proyectoId: number;
}

export function ActasTabContent({ proyectoId }: ActasTabContentProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ActasByProyectoResponse | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<number | null>(null);

  // Vista actual y acta seleccionada
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [selectedActa, setSelectedActa] = useState<Acta | null>(null);
  const [saving, setSaving] = useState(false);
  const [formMode, setFormMode] = useState<'wizard' | 'form'>('form');

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
      const filename = `${acta.tipo === 'Constitucion' ? 'Acta_Constitucion' : 'Acta_Reunion'}_${acta.codigo}.pdf`;
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

  // Navegacion Daily Meeting
  const goToNewDaily = () => {
    setSelectedActa(null);
    setCurrentView('new-daily');
  };

  const goToEditDaily = async (acta: Acta) => {
    try {
      const fullActa = await getActaById(acta.id);
      setSelectedActa(fullActa);
      setCurrentView('edit-daily');
    } catch (error) {
      console.error('Error loading acta:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el acta',
        variant: 'destructive',
      });
    }
  };

  const goToViewDaily = async (acta: Acta) => {
    try {
      const fullActa = await getActaById(acta.id);
      setSelectedActa(fullActa);
      setCurrentView('view-daily');
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
        await createActaReunion({ ...formData, proyectoId });
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

  const handleSaveDaily = async (formData: CreateActaDailyInput) => {
    try {
      setSaving(true);
      if (selectedActa) {
        await updateActaDaily(selectedActa.id, formData);
        toast({
          title: 'Acta actualizada',
          description: 'El acta de daily meeting se ha actualizado correctamente',
        });
      } else {
        await createActaDaily(formData);
        toast({
          title: 'Acta creada',
          description: 'El acta de daily meeting se ha creado correctamente',
        });
      }
      goToList();
      fetchActas();
    } catch (error) {
      console.error('Error saving acta:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el acta de daily meeting',
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
            {selectedActa.estado === 'Borrador' && (
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
          </div>
        </div>

        {/* Vista del acta */}
        <ActaReunionView acta={selectedActa} />
      </div>
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
            {selectedActa.estado === 'Borrador' && (
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
          </div>
        </div>

        {/* Vista del acta */}
        <ActaConstitucionView acta={selectedActa} />
      </div>
    );
  }

  // =============================================
  // VISTA: Nueva/Editar Acta de Daily Meeting
  // =============================================
  if (currentView === 'new-daily' || currentView === 'edit-daily') {
    return (
      <div className="space-y-4">
        {/* Header con navegacion */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={goToList}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="text-xl font-bold">
              {currentView === 'new-daily' ? 'Nueva Acta de Daily Meeting' : 'Editar Acta de Daily Meeting'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentView === 'new-daily'
                ? 'Registre las actividades del daily meeting del equipo'
                : `Editando: ${selectedActa?.codigo}`}
            </p>
          </div>
        </div>

        {/* Formulario */}
        <Card>
          <CardContent className="pt-6">
            <ActaDailyForm
              acta={selectedActa}
              proyectoId={proyectoId}
              onSave={handleSaveDaily}
              onCancel={goToList}
              saving={saving}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // =============================================
  // VISTA: Ver Acta de Daily Meeting
  // =============================================
  if (currentView === 'view-daily' && selectedActa) {
    return (
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
            {selectedActa.estado === 'Borrador' && (
              <Button variant="outline" onClick={() => goToEditDaily(selectedActa)}>
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
          </div>
        </div>

        {/* Vista del acta */}
        <ActaDailyView acta={selectedActa} />
      </div>
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
            {!data?.constitucion && (
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
                  {data.constitucion.estado === 'Borrador' && (
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
            <Button onClick={goToNewReunion}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Acta de Reunion
            </Button>
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
                        {acta.estado === 'Borrador' && (
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

      {/* Actas de Daily Meeting Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Actas de Daily Meetings
              </CardTitle>
              <CardDescription>
                Registro diario del progreso del equipo con las 3 preguntas Scrum
              </CardDescription>
            </div>
            <Button onClick={goToNewDaily}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Acta de Daily
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data?.dailies && data.dailies.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Participantes</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.dailies.map((acta) => (
                  <TableRow key={acta.id}>
                    <TableCell className="font-mono text-sm">{acta.codigo}</TableCell>
                    <TableCell>{acta.nombre}</TableCell>
                    <TableCell>{formatDate(acta.fecha)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        {acta.participantesDaily?.length || 0}
                      </Badge>
                    </TableCell>
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
                          onClick={() => goToViewDaily(acta)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {acta.estado === 'Borrador' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => goToEditDaily(acta)}
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay actas de daily meeting registradas</p>
              <p className="text-sm">
                Crea una nueva acta para documentar los daily meetings del equipo
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
