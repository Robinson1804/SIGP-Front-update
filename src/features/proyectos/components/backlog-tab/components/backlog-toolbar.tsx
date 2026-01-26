'use client';

import { Search, HelpCircle, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { type Epica } from '@/features/proyectos/services/epicas.service';

interface SprintCounts {
  total: number;
  activo: number;
  planificados: number;
  finalizados: number;
}

interface BacklogToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedEpicaId: string;
  onEpicaChange: (epicaId: string) => void;
  epicas: Epica[];
  // Filtro de estado de sprint
  selectedSprintEstado?: string;
  onSprintEstadoChange?: (estado: string) => void;
  sprintCounts?: SprintCounts;
}

export function BacklogToolbar({
  searchTerm,
  onSearchChange,
  selectedEpicaId,
  onEpicaChange,
  epicas,
  selectedSprintEstado = 'todos',
  onSprintEstadoChange,
  sprintCounts,
}: BacklogToolbarProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar en el backlog"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Epic filter */}
      <Select value={selectedEpicaId} onValueChange={onEpicaChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Epica" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las epicas</SelectItem>
          {epicas.map((epica) => (
            <SelectItem key={epica.id} value={epica.id.toString()}>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: epica.color || '#888' }}
                />
                <span className="truncate max-w-[120px]">{epica.nombre}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sprint estado filter */}
      {onSprintEstadoChange && sprintCounts && (
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={selectedSprintEstado} onValueChange={onSprintEstadoChange}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filtrar sprints" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">
                Todos ({sprintCounts.total})
              </SelectItem>
              <SelectItem value="en_progreso">
                En progreso ({sprintCounts.activo})
              </SelectItem>
              <SelectItem value="por_hacer">
                Por hacer ({sprintCounts.planificados})
              </SelectItem>
              <SelectItem value="finalizado">
                Finalizado ({sprintCounts.finalizados})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Help tooltip */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="text-gray-400 hover:text-gray-600">
              <HelpCircle className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <p className="text-sm">
              <strong>Product Backlog</strong>
              <br />
              Gestiona las historias de usuario del proyecto.
              Las historias sin sprint asignado aparecen en la seccion &quot;Backlog&quot;.
              Usa los checkboxes para seleccionar y asignar multiples historias a un sprint.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
