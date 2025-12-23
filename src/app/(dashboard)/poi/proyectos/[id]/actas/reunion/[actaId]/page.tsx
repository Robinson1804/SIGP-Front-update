'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Upload,
  CheckCircle,
  Edit,
  Loader2,
  List,
  LayoutGrid,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { paths } from '@/lib/paths';
import { toast } from '@/lib/hooks/use-toast';
import {
  getActaById,
  updateActaReunion,
  saveActaPdf,
  subirDocumentoFirmado,
  aprobarActa,
  getEstadoLabel,
} from '@/features/documentos/services/actas.service';
import type { Acta } from '@/features/documentos/types';
import { ActaReunionWizard } from '@/features/actas/components/ActaReunionWizard';
import { ActaReunionForm } from '@/features/actas/components/ActaReunionForm';
import { ActaReunionView } from '@/features/actas/components/ActaReunionView';
import { UploadDocumentoFirmadoDialog } from '@/features/actas/components/UploadDocumentoFirmadoDialog';
import { AprobacionActaDialog } from '@/features/actas/components/AprobacionActaDialog';

type FormMode = 'wizard' | 'form';

export default function ActaReunionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const proyectoId = params.id as string;
  const actaId = params.actaId as string;
  const isEditMode = searchParams.get('edit') === 'true';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [acta, setActa] = useState<Acta | null>(null);
  const [editMode, setEditMode] = useState(isEditMode);
  const [formMode, setFormMode] = useState<FormMode>('wizard');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAprobacionDialog, setShowAprobacionDialog] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fetchActa = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getActaById(actaId);
      setActa(result);
    } catch (error) {
      console.error('Error fetching acta:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el acta de reunión',
        variant: 'destructive',
      });
      router.push(paths.poi.proyectos.actas(proyectoId));
    } finally {
      setLoading(false);
    }
  }, [actaId, proyectoId, router]);

  useEffect(() => {
    fetchActa();
  }, [fetchActa]);

  const handleSave = async (formData: any) => {
    if (!acta) return;

    try {
      setSaving(true);
      const updatedActa = await updateActaReunion(acta.id, formData);
      setActa(updatedActa);
      setEditMode(false);
      toast({
        title: 'Guardado',
        description: 'El acta de reunión se ha actualizado correctamente',
      });
      router.replace(paths.poi.proyectos.actaReunion(proyectoId, actaId));
    } catch (error) {
      console.error('Error saving acta:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el acta',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!acta) return;

    try {
      setDownloadingPdf(true);
      const filename = `Acta_Reunion_${acta.codigo}.pdf`;
      await saveActaPdf(acta.id, filename);
      toast({
        title: 'PDF descargado',
        description: 'El archivo se ha descargado correctamente',
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Error',
        description: 'No se pudo descargar el PDF',
        variant: 'destructive',
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleUploadDocumento = async (url: string) => {
    if (!acta) return;

    try {
      const updatedActa = await subirDocumentoFirmado(acta.id, url);
      setActa(updatedActa);
      setShowUploadDialog(false);
      toast({
        title: 'Documento subido',
        description: 'El documento firmado se ha cargado correctamente',
      });
    } catch (error) {
      console.error('Error uploading documento:', error);
      toast({
        title: 'Error',
        description: 'No se pudo subir el documento',
        variant: 'destructive',
      });
    }
  };

  const handleAprobar = async (aprobado: boolean, comentario?: string) => {
    if (!acta) return;

    try {
      const updatedActa = await aprobarActa(acta.id, { aprobado, comentario });
      setActa(updatedActa);
      setShowAprobacionDialog(false);
      toast({
        title: aprobado ? 'Acta aprobada' : 'Acta rechazada',
        description: aprobado
          ? 'El acta de reunión ha sido aprobada'
          : 'El acta de reunión ha sido rechazada',
      });
    } catch (error) {
      console.error('Error approving acta:', error);
      toast({
        title: 'Error',
        description: 'No se pudo procesar la aprobación',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!acta) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={paths.poi.proyectos.actas(proyectoId)}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                Acta de Reunión
              </h1>
              <Badge variant={getEstadoLabel(acta.estado).variant}>
                {getEstadoLabel(acta.estado).label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {acta.codigo} • {acta.nombre}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editMode && acta.estado === 'Borrador' && (
            <Button variant="outline" onClick={() => setEditMode(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
          >
            {downloadingPdf ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Descargar PDF
          </Button>
          {acta.estado === 'Borrador' && (
            <Button variant="outline" onClick={() => setShowUploadDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Subir Firmado
            </Button>
          )}
          {acta.estado === 'Pendiente' && (
            <Button onClick={() => setShowAprobacionDialog(true)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Aprobar
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {editMode ? 'Editar Acta de Reunion' : 'Detalles del Acta'}
            </CardTitle>
            {editMode && (
              <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                <Button
                  variant={formMode === 'wizard' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFormMode('wizard')}
                  className="gap-2"
                >
                  <List className="h-4 w-4" />
                  Wizard
                </Button>
                <Button
                  variant={formMode === 'form' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFormMode('form')}
                  className="gap-2"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Formulario
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editMode ? (
            formMode === 'wizard' ? (
              <ActaReunionWizard
                proyectoId={parseInt(proyectoId)}
                acta={acta}
                onSave={handleSave}
                onCancel={() => {
                  setEditMode(false);
                  router.replace(paths.poi.proyectos.actaReunion(proyectoId, actaId));
                }}
                saving={saving}
              />
            ) : (
              <ActaReunionForm
                proyectoId={parseInt(proyectoId)}
                acta={acta}
                onSave={handleSave}
                onCancel={() => {
                  setEditMode(false);
                  router.replace(paths.poi.proyectos.actaReunion(proyectoId, actaId));
                }}
                saving={saving}
              />
            )
          ) : (
            <ActaReunionView acta={acta} />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <UploadDocumentoFirmadoDialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUpload={handleUploadDocumento}
      />

      <AprobacionActaDialog
        open={showAprobacionDialog}
        onClose={() => setShowAprobacionDialog(false)}
        onAprobar={handleAprobar}
        tipo="Reunion"
      />
    </div>
  );
}
