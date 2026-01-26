'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Download,
  Upload,
  CheckCircle,
  Edit,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { paths } from '@/lib/paths';
import { toast } from '@/lib/hooks/use-toast';
import { useAuth } from '@/stores';
import { ROLES } from '@/lib/definitions';
import {
  getActasByProyecto,
  updateActaConstitucion,
  saveActaPdf,
  subirDocumentoFirmado,
  aprobarActa,
  getEstadoLabel,
} from '@/features/documentos/services/actas.service';
import type { Acta } from '@/features/documentos/types';
import { ActaConstitucionForm } from '@/features/actas/components/ActaConstitucionForm';
import { ActaConstitucionView } from '@/features/actas/components/ActaConstitucionView';
import { UploadDocumentoFirmadoDialog } from '@/features/actas/components/UploadDocumentoFirmadoDialog';
import { AprobacionActaDialog } from '@/features/actas/components/AprobacionActaDialog';

export default function ActaConstitucionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const proyectoId = params.id as string;
  const isEditMode = searchParams.get('edit') === 'true';

  // Permisos por rol
  const isAdmin = user?.role === ROLES.ADMIN;
  const isScrumMaster = user?.role === ROLES.SCRUM_MASTER;
  const isPmo = user?.role === ROLES.PMO;
  const isPatrocinador = user?.role === ROLES.PATROCINADOR;
  const canManageActas = isAdmin || isScrumMaster;
  const canApprove = isAdmin || isPmo || isPatrocinador;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [acta, setActa] = useState<Acta | null>(null);
  const [editMode, setEditMode] = useState(isEditMode);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAprobacionDialog, setShowAprobacionDialog] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fetchActa = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getActasByProyecto(proyectoId);
      if (result.constitucion) {
        setActa(result.constitucion);
      } else {
        // Si no existe, redirigir a crear nueva
        router.push(paths.poi.proyectos.actaConstitucionNueva(proyectoId));
      }
    } catch (error) {
      console.error('Error fetching acta:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el acta de constitución',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [proyectoId, router]);

  useEffect(() => {
    fetchActa();
  }, [fetchActa]);

  const handleSave = async (formData: any) => {
    if (!acta) return;

    try {
      setSaving(true);
      const updatedActa = await updateActaConstitucion(acta.id, formData);
      setActa(updatedActa);
      setEditMode(false);
      toast({
        title: 'Guardado',
        description: 'El acta de constitución se ha actualizado correctamente',
      });
      // Update URL without edit param
      router.replace(paths.poi.proyectos.actaConstitucion(proyectoId));
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
      const filename = `Acta_Constitucion_${acta.codigo}.pdf`;
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
          ? 'El acta de constitución ha sido aprobada'
          : 'El acta de constitución ha sido rechazada',
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
                Acta de Constitución
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
          {!editMode && canManageActas && acta.estado === 'Borrador' && (
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
          {canApprove && acta.estado === 'En revisión' && (
            <Button onClick={() => setShowAprobacionDialog(true)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Validar
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {editMode ? 'Editar Acta de Constitución' : 'Detalles del Acta'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <ActaConstitucionForm
              acta={acta}
              onSave={handleSave}
              onCancel={() => {
                setEditMode(false);
                router.replace(paths.poi.proyectos.actaConstitucion(proyectoId));
              }}
              saving={saving}
            />
          ) : (
            <ActaConstitucionView acta={acta} />
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
        tipo="Constitucion"
      />
    </div>
  );
}
