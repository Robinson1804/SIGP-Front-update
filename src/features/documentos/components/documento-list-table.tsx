'use client';

/**
 * Tabla de Documentos
 *
 * Muestra una tabla con los documentos de una fase específica
 * Incluye acciones según permisos del usuario
 */

import { useState } from 'react';
import {
  FileText,
  Link as LinkIcon,
  Download,
  Pencil,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Star,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAuth } from '@/stores';
import { ROLES } from '@/lib/definitions';
import type { Documento } from '../types';

interface DocumentoListTableProps {
  documentos: Documento[];
  onView?: (documento: Documento) => void;
  onEdit?: (documento: Documento) => void;
  onDelete?: (documento: Documento) => void;
  onDownload?: (documento: Documento) => void;
  onApprove?: (documento: Documento) => void;
  isLoading?: boolean;
}

const estadoConfig: Record<string, { bg: string; text: string; label: string }> = {
  'Pendiente': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
  'Aprobado': { bg: 'bg-green-100', text: 'text-green-800', label: 'Aprobado' },
  'No Aprobado': { bg: 'bg-red-100', text: 'text-red-800', label: 'Rechazado' },
};

export function DocumentoListTable({
  documentos,
  onView,
  onEdit,
  onDelete,
  onDownload,
  onApprove,
  isLoading = false,
}: DocumentoListTableProps) {
  const { user } = useAuth();
  const userRole = user?.role;

  // ADMIN tiene acceso total a todas las funciones
  const isAdmin = userRole === ROLES.ADMIN;
  // SCRUM_MASTER tiene todas las acciones de gestión (agregar, editar, eliminar)
  const isScrumMaster = userRole === ROLES.SCRUM_MASTER;
  const canEdit = isAdmin || isScrumMaster;

  // PMO y PATROCINADOR solo pueden ver, descargar y validar (aprobar/rechazar)
  const isPmo = userRole === ROLES.PMO;
  const isPatrocinador = userRole === ROLES.PATROCINADOR;
  const canApprove = isAdmin || isPmo || isPatrocinador;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatSize = (bytes?: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getCreadorName = (documento: Documento) => {
    if (documento.creador) {
      // Preferir nombreCompleto si está disponible
      if (documento.creador.nombreCompleto) {
        return documento.creador.nombreCompleto;
      }
      // Fallback a nombres + apellido
      if (documento.creador.nombres && documento.creador.apellidoPaterno) {
        return `${documento.creador.nombres} ${documento.creador.apellidoPaterno}`;
      }
    }
    return `Usuario ${documento.createdBy}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (documentos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mb-2 opacity-50" />
        <p>No hay documentos en esta fase</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[30px]"></TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="w-[100px]">Tipo</TableHead>
              <TableHead className="w-[120px]">Estado</TableHead>
              <TableHead className="w-[100px]">Fecha</TableHead>
              <TableHead>Subido por</TableHead>
              <TableHead className="w-[80px] text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documentos.map((documento) => {
              const tipoArchivo = documento.archivoUrl || documento.archivoId;
              const tipoLink = documento.link && !tipoArchivo;
              const config = estadoConfig[documento.estado] || estadoConfig['Pendiente'];

              return (
                <TableRow
                  key={documento.id}
                  className={cn(
                    'hover:bg-muted/50 transition-colors',
                    documento.estado === 'No Aprobado' && 'bg-red-50/50'
                  )}
                >
                  {/* Indicador obligatorio */}
                  <TableCell className="text-center">
                    {documento.esObligatorio && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        </TooltipTrigger>
                        <TooltipContent>Documento obligatorio</TooltipContent>
                      </Tooltip>
                    )}
                  </TableCell>

                  {/* Nombre */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{documento.nombre}</span>
                      {documento.descripcion && (
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {documento.descripcion}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Tipo */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {tipoLink ? (
                        <>
                          <LinkIcon className="h-4 w-4 text-blue-500" />
                          <span className="text-xs">Link</span>
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-xs">Archivo</span>
                        </>
                      )}
                    </div>
                  </TableCell>

                  {/* Estado */}
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(config.bg, config.text, 'font-medium')}
                    >
                      {config.label}
                    </Badge>
                  </TableCell>

                  {/* Fecha */}
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(documento.createdAt)}
                  </TableCell>

                  {/* Subido por */}
                  <TableCell className="text-sm">
                    {getCreadorName(documento)}
                  </TableCell>

                  {/* Acciones */}
                  <TableCell>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* Ver/Preview */}
                        {onView && (
                          <DropdownMenuItem onClick={() => onView(documento)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver documento
                          </DropdownMenuItem>
                        )}

                        {/* Descargar */}
                        {onDownload && (tipoArchivo || tipoLink) && (
                          <DropdownMenuItem onClick={() => onDownload(documento)}>
                            <Download className="h-4 w-4 mr-2" />
                            {tipoLink ? 'Abrir enlace' : 'Descargar'}
                          </DropdownMenuItem>
                        )}

                        {/* Editar (solo si no está aprobado y tiene permisos) */}
                        {canEdit && documento.estado !== 'Aprobado' && onEdit && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onEdit(documento)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                          </>
                        )}

                        {/* Aprobar/Rechazar (solo PMO) */}
                        {canApprove && documento.estado === 'Pendiente' && onApprove && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onApprove(documento)}>
                              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                              Revisar documento
                            </DropdownMenuItem>
                          </>
                        )}

                        {/* Eliminar (solo si no está aprobado y tiene permisos) */}
                        {canEdit && documento.estado !== 'Aprobado' && onDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(documento)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
