'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Info, LinkIcon } from 'lucide-react';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { type Requerimiento } from '../types';

interface MatrizTrazabilidadProps {
  requerimientos: Requerimiento[];
  proyectoId: number;
  // Cuando se implemente HUs, se agregará:
  // historiasUsuario?: HistoriaUsuario[];
  // vinculaciones?: { requerimientoId: number; historiaUsuarioId: number }[];
}

export function MatrizTrazabilidad({
  requerimientos,
  proyectoId,
}: MatrizTrazabilidadProps) {
  // Por ahora no hay HUs implementadas, mostraremos un estado preparado

  // Simulación de datos (cuando se integren las HUs, esto vendrá del backend)
  const historiasUsuario: { id: number; codigo: string; titulo: string }[] = [];
  const vinculaciones: { requerimientoId: number; historiaUsuarioId: number }[] = [];

  // Calcular métricas
  const totalRequerimientos = requerimientos.length;
  const reqsFuncionales = requerimientos.filter((r) => r.tipo === 'Funcional');
  const reqsNoFuncionales = requerimientos.filter((r) => r.tipo !== 'Funcional');

  // Calcular cobertura (cuántos requerimientos tienen al menos 1 HU vinculada)
  const reqsConCobertura = new Set(vinculaciones.map((v) => v.requerimientoId));
  const coberturaTotal =
    totalRequerimientos > 0
      ? Math.round((reqsConCobertura.size / totalRequerimientos) * 100)
      : 0;

  // Función para verificar si un requerimiento está vinculado a una HU
  const isVinculado = (reqId: number, huId: number) =>
    vinculaciones.some((v) => v.requerimientoId === reqId && v.historiaUsuarioId === huId);

  // Contar HUs por requerimiento
  const getHusCount = (reqId: number) =>
    vinculaciones.filter((v) => v.requerimientoId === reqId).length;

  // Si no hay requerimientos
  if (totalRequerimientos === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <LinkIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Sin requerimientos</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            Primero debes crear requerimientos para visualizar la matriz de trazabilidad.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas de cobertura */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cobertura Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold">{coberturaTotal}%</div>
              <Progress value={coberturaTotal} className="flex-1" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {reqsConCobertura.size} de {totalRequerimientos} requerimientos con HUs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Funcionales (RF)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reqsFuncionales.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {reqsFuncionales.filter((r) => reqsConCobertura.has(r.id)).length} con cobertura
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">No Funcionales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reqsNoFuncionales.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {reqsNoFuncionales.filter((r) => reqsConCobertura.has(r.id)).length} con cobertura
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerta si no hay HUs */}
      {historiasUsuario.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Historias de Usuario no disponibles</AlertTitle>
          <AlertDescription>
            El módulo de Historias de Usuario aún no está integrado. Cuando se implemente,
            aquí podrás ver la relación entre requerimientos y las HUs que los implementan.
          </AlertDescription>
        </Alert>
      )}

      {/* Matriz de trazabilidad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Matriz de Trazabilidad
          </CardTitle>
          <CardDescription>
            Relación entre requerimientos e historias de usuario
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historiasUsuario.length === 0 ? (
            // Vista cuando no hay HUs (muestra solo los requerimientos)
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="w-[100px]">Tipo</TableHead>
                  <TableHead className="w-[100px]">Prioridad</TableHead>
                  <TableHead className="w-[120px] text-center">Cobertura</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requerimientos.map((req) => {
                  const husCount = getHusCount(req.id);
                  const hasCobertura = husCount > 0;

                  return (
                    <TableRow key={req.id}>
                      <TableCell className="font-mono font-medium">
                        {req.codigo}
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="text-left">
                              <span className="line-clamp-1">{req.nombre}</span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-sm">
                              <p>{req.descripcion || req.nombre}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {req.tipo === 'Funcional' ? 'RF' : req.tipo === 'No Funcional' ? 'RNF' : req.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            req.prioridad === 'Critica'
                              ? 'destructive'
                              : req.prioridad === 'Alta'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {req.prioridad}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {hasCobertura ? (
                          <div className="flex items-center justify-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{husCount} HU(s)</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                            <span className="text-sm text-muted-foreground">Sin HUs</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            // Vista cuando hay HUs (matriz completa)
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10 min-w-[150px]">
                      Requerimiento
                    </TableHead>
                    {historiasUsuario.map((hu) => (
                      <TableHead
                        key={hu.id}
                        className="text-center min-w-[100px]"
                      >
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="font-mono">{hu.codigo}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{hu.titulo}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                    ))}
                    <TableHead className="text-center min-w-[100px]">
                      Cobertura
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requerimientos.map((req) => {
                    const husCount = getHusCount(req.id);
                    const cobertura =
                      historiasUsuario.length > 0
                        ? Math.round((husCount / historiasUsuario.length) * 100)
                        : 0;

                    return (
                      <TableRow key={req.id}>
                        <TableCell className="sticky left-0 bg-background font-mono font-medium">
                          {req.codigo}
                        </TableCell>
                        {historiasUsuario.map((hu) => (
                          <TableCell key={hu.id} className="text-center">
                            {isVinculado(req.id, hu.id) ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        ))}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Progress value={cobertura} className="w-16" />
                            <span className="text-sm">{cobertura}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leyenda */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Leyenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>HU vinculada al requerimiento</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span>Sin cobertura (gap)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                RF
              </Badge>
              <span>Requerimiento Funcional</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                RNF
              </Badge>
              <span>Requerimiento No Funcional</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
