'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, List, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { paths } from '@/lib/paths';
import { toast } from '@/lib/hooks/use-toast';
import { createActaReunion } from '@/features/documentos/services/actas.service';
import { ActaReunionWizard } from '@/features/actas/components/ActaReunionWizard';
import { ActaReunionForm } from '@/features/actas/components/ActaReunionForm';

type FormMode = 'wizard' | 'form';

export default function NuevaActaReunionPage() {
  const params = useParams();
  const router = useRouter();
  const proyectoId = parseInt(params.id as string);

  const [saving, setSaving] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('wizard');

  const handleSave = async (formData: any) => {
    try {
      setSaving(true);
      const acta = await createActaReunion({
        ...formData,
        proyectoId,
      });
      toast({
        title: 'Acta creada',
        description: 'El acta de reunión se ha creado correctamente',
      });
      router.push(paths.poi.proyectos.actas(proyectoId));
    } catch (error) {
      console.error('Error creating acta:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el acta de reunión',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

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
            <h1 className="text-2xl font-bold tracking-tight">
              Nueva Acta de Reunion
            </h1>
            <p className="text-muted-foreground">
              {formMode === 'wizard'
                ? 'Registra los detalles de la reunion en 7 pasos'
                : 'Completa el formulario con todos los detalles de la reunion'}
            </p>
          </div>
        </div>

        {/* Mode Selector */}
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
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Acta de Reunion</CardTitle>
          <CardDescription>
            {formMode === 'wizard'
              ? 'Complete cada paso del asistente para registrar el acta de reunion'
              : 'Complete las secciones del formulario para registrar el acta de reunion'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formMode === 'wizard' ? (
            <ActaReunionWizard
              proyectoId={proyectoId}
              onSave={handleSave}
              onCancel={() => router.push(paths.poi.proyectos.actas(proyectoId))}
              saving={saving}
            />
          ) : (
            <ActaReunionForm
              proyectoId={proyectoId}
              onSave={handleSave}
              onCancel={() => router.push(paths.poi.proyectos.actas(proyectoId))}
              saving={saving}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
