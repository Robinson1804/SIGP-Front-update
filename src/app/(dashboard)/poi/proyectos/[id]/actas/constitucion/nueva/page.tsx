'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { paths } from '@/lib/paths';
import { toast } from '@/lib/hooks/use-toast';
import { createActaConstitucion } from '@/features/documentos/services/actas.service';
import { ActaConstitucionForm } from '@/features/actas/components/ActaConstitucionForm';

export default function NuevaActaConstitucionPage() {
  const params = useParams();
  const router = useRouter();
  const proyectoId = parseInt(params.id as string);

  const [saving, setSaving] = useState(false);

  const handleSave = async (formData: any) => {
    try {
      setSaving(true);
      const acta = await createActaConstitucion({
        ...formData,
        proyectoId,
      });
      toast({
        title: 'Acta creada',
        description: 'El acta de constitución se ha creado correctamente',
      });
      router.push(paths.poi.proyectos.actaConstitucion(proyectoId));
    } catch (error) {
      console.error('Error creating acta:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el acta de constitución',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={paths.poi.proyectos.actas(proyectoId)}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Nueva Acta de Constitución
          </h1>
          <p className="text-muted-foreground">
            Crea el acta de constitución para formalizar el inicio del proyecto
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Datos del Acta de Constitución</CardTitle>
          <CardDescription>
            Complete la información requerida para el acta de constitución del proyecto.
            Puede guardar como borrador y completar después.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActaConstitucionForm
            proyectoId={proyectoId}
            onSave={handleSave}
            onCancel={() => router.push(paths.poi.proyectos.actas(proyectoId))}
            saving={saving}
          />
        </CardContent>
      </Card>
    </div>
  );
}
