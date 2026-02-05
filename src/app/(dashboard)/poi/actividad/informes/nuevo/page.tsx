'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, FileText, Calendar, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/components/layout/app-layout';
import { paths } from '@/lib/paths';
import { useToast } from '@/lib/hooks/use-toast';
import { useAuth } from '@/stores';
import { ROLES } from '@/lib/definitions';
import { getActividadById } from '@/features/actividades/services/actividades.service';
import { createInformeActividad } from '@/features/informes';
import type { Actividad } from '@/features/actividades/types';

type PeriodoInforme = 'Semanal' | 'Quincenal' | 'Mensual' | 'Bimestral' | 'Trimestral';

const periodoOptions: { value: PeriodoInforme; label: string }[] = [
  { value: 'Semanal', label: 'Semanal' },
  { value: 'Quincenal', label: 'Quincenal' },
  { value: 'Mensual', label: 'Mensual' },
  { value: 'Bimestral', label: 'Bimestral' },
  { value: 'Trimestral', label: 'Trimestral' },
];

function NuevoInformeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const userRole = user?.role;
  const isDesarrollador = userRole === ROLES.DESARROLLADOR;

  // DESARROLLADOR no tiene acceso a Actividades (solo a Proyectos/Scrum)
  useEffect(() => {
    if (isDesarrollador) {
      router.push(paths.poi.base);
    }
  }, [isDesarrollador, router]);

  const actividadIdParam = searchParams.get('actividadId') || searchParams.get('id');

  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [periodo, setPeriodo] = useState<PeriodoInforme>('Mensual');
  const [numeroPeriodo, setNumeroPeriodo] = useState(1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [logros, setLogros] = useState('');
  const [problemas, setProblemas] = useState('');
  const [proximasAcciones, setProximasAcciones] = useState('');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);

        let id: number | null = null;

        if (actividadIdParam) {
          id = parseInt(actividadIdParam, 10);
        } else {
          const savedProjectData = localStorage.getItem('selectedProject');
          if (savedProjectData) {
            const projectData = JSON.parse(savedProjectData);
            if (projectData.type !== 'Actividad') {
              router.push(paths.poi.base);
              return;
            }
            id = parseInt(projectData.id, 10);
          }
        }

        if (!id) {
          toast({
            title: 'Error',
            description: 'No se encontro el ID de la actividad',
            variant: 'destructive',
          });
          router.push(paths.poi.base);
          return;
        }

        const actividadData = await getActividadById(id);
        setActividad(actividadData);

        // Set default periodo based on actividad's periodicidadInforme
        if (actividadData.periodicidadInforme) {
          setPeriodo(actividadData.periodicidadInforme as PeriodoInforme);
        }

        // Set default dates (current month)
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setFechaInicio(firstDay.toISOString().split('T')[0]);
        setFechaFin(lastDay.toISOString().split('T')[0]);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Error',
          description: 'No se pudo cargar la actividad',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [actividadIdParam, router, toast]);

  const generateCodigo = () => {
    if (!actividad) return '';
    // Máximo 20 caracteres: INF-37-M1-2025 (14 chars)
    const periodoAbrev = periodo.charAt(0).toUpperCase();
    return `INF-${actividad.id}-${periodoAbrev}${numeroPeriodo}-${anio}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!actividad) return;

    setIsSaving(true);

    try {
      const logrosArray = logros.split('\n').filter(l => l.trim());
      const proximasAccionesArray = proximasAcciones.split('\n').filter(a => a.trim());
      const problemasArray = problemas.split('\n').filter(p => p.trim()).map(p => ({
        descripcion: p,
        resuelto: false,
      }));

      await createInformeActividad({
        actividadId: actividad.id,
        codigo: generateCodigo(),
        periodo,
        numeroPeriodo,
        anio,
        fechaInicio,
        fechaFin,
        logros: logrosArray.length > 0 ? logrosArray : undefined,
        problemas: problemasArray.length > 0 ? problemasArray : undefined,
        proximasAcciones: proximasAccionesArray.length > 0 ? proximasAccionesArray : undefined,
        observaciones: observaciones || undefined,
      });

      toast({
        title: 'Informe creado',
        description: 'El informe de actividad ha sido creado exitosamente',
      });

      // Navigate back to informes list
      const queryParams = `?actividadId=${actividad.id}`;
      router.push(`/poi/actividad/informes${queryParams}`);
    } catch (error) {
      console.error('Error creating informe:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el informe',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getBackUrl = () => {
    const queryParams = actividad ? `?actividadId=${actividad.id}` : '';
    return `/poi/actividad/informes${queryParams}`;
  };

  if (isLoading) {
    return (
      <AppLayout breadcrumbs={[{ label: 'POI', href: paths.poi.base }, { label: 'Nuevo Informe' }]}>
        <div className="flex items-center justify-center h-64">
          Cargando...
        </div>
      </AppLayout>
    );
  }

  if (!actividad) {
    return (
      <AppLayout breadcrumbs={[{ label: 'POI', href: paths.poi.base }, { label: 'Nuevo Informe' }]}>
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <FileText className="h-12 w-12 mb-4" />
          <p>No se encontro la actividad</p>
          <Button variant="link" onClick={() => router.push(paths.poi.base)}>
            Volver a POI
          </Button>
        </div>
      </AppLayout>
    );
  }

  const breadcrumbs = [
    { label: 'POI', href: paths.poi.base },
    { label: actividad.nombre, href: `/poi/actividad/tablero?actividadId=${actividad.id}` },
    { label: 'Informes', href: getBackUrl() },
    { label: 'Nuevo Informe' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push(getBackUrl())}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a informes
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informacion del Informe
              </CardTitle>
              <CardDescription>
                Configure los datos basicos del informe de actividad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Codigo (auto-generado)</Label>
                  <Input value={generateCodigo()} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Actividad</Label>
                  <Input value={actividad.nombre} disabled />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="periodo">Periodo</Label>
                  <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoInforme)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {periodoOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numeroPeriodo">Numero de Periodo</Label>
                  <Input
                    id="numeroPeriodo"
                    type="number"
                    min={1}
                    max={52}
                    value={numeroPeriodo}
                    onChange={(e) => setNumeroPeriodo(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="anio">Ano</Label>
                  <Input
                    id="anio"
                    type="number"
                    min={2020}
                    max={2030}
                    value={anio}
                    onChange={(e) => setAnio(parseInt(e.target.value, 10) || new Date().getFullYear())}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date Range */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Rango de Fechas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                  <Input
                    id="fechaInicio"
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaFin">Fecha Fin</Label>
                  <Input
                    id="fechaFin"
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Contenido del Informe
              </CardTitle>
              <CardDescription>
                Ingrese los logros, problemas y proximas acciones (uno por linea)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logros">Logros del Periodo</Label>
                <Textarea
                  id="logros"
                  placeholder="Ingrese los logros alcanzados, uno por linea..."
                  value={logros}
                  onChange={(e) => setLogros(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="problemas">Problemas Encontrados</Label>
                <Textarea
                  id="problemas"
                  placeholder="Ingrese los problemas o impedimentos, uno por linea..."
                  value={problemas}
                  onChange={(e) => setProblemas(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proximasAcciones">Proximas Acciones</Label>
                <Textarea
                  id="proximasAcciones"
                  placeholder="Ingrese las proximas acciones planificadas, una por linea..."
                  value={proximasAcciones}
                  onChange={(e) => setProximasAcciones(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones Adicionales</Label>
                <Textarea
                  id="observaciones"
                  placeholder="Observaciones o comentarios adicionales..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(getBackUrl())}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Crear Informe'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

export default function NuevoInformeActividadPage() {
  return (
    <React.Suspense fallback={<div>Cargando...</div>}>
      <NuevoInformeContent />
    </React.Suspense>
  );
}
