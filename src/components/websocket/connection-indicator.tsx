'use client';

import { useWebSocket } from '@/contexts/websocket-context';
import { Wifi, WifiOff } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Indicador visual del estado de conexión WebSocket
 *
 * Muestra un icono en la UI que indica si el WebSocket está conectado.
 * Útil para debugging y para informar al usuario del estado de tiempo real.
 *
 * @example
 * ```tsx
 * // En el Header o AppLayout
 * import { ConnectionIndicator } from '@/components/websocket/connection-indicator';
 *
 * function Header() {
 *   return (
 *     <header>
 *       <ConnectionIndicator />
 *     </header>
 *   );
 * }
 * ```
 */
export function ConnectionIndicator() {
  const { isConnected, socketId } = useWebSocket();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 transition-colors hover:bg-accent"
            aria-label={isConnected ? 'Conectado en tiempo real' : 'Desconectado'}
          >
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </p>
            {isConnected && socketId && (
              <p className="text-xs text-muted-foreground">ID: {socketId.substring(0, 8)}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {isConnected
                ? 'Actualizaciones en tiempo real activas'
                : 'Sin conexión en tiempo real'}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
