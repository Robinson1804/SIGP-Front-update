'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { apiClient, ENDPOINTS } from '@/lib/api';

interface AreaUsuariaDisplayProps {
  userIds: number[];
}

interface PatrocinadorInfo {
  id: number;
  usuarioId?: number;
  nombres: string;
  apellidos: string;
}

export function AreaUsuariaDisplay({ userIds }: AreaUsuariaDisplayProps) {
  const [nombres, setNombres] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userIds || userIds.length === 0) {
      setLoading(false);
      return;
    }

    apiClient
      .get(ENDPOINTS.RRHH.PERSONAL_PATROCINADORES)
      .then((res) => {
        const data: PatrocinadorInfo[] = Array.isArray(res.data) ? res.data : [];
        const map = new Map<number, string>();
        for (const p of data) {
          const uid = p.usuarioId || p.id;
          map.set(uid, `${p.apellidos}, ${p.nombres}`);
        }
        setNombres(map);
      })
      .catch(() => {
        // Silently fail - will show IDs as fallback
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userIds]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando...</p>;
  }

  return (
    <div className="flex gap-2 flex-wrap mt-1">
      {userIds.map((uid) => (
        <Badge key={uid} variant="secondary">
          {nombres.get(uid) || `Usuario ID: ${uid}`}
        </Badge>
      ))}
    </div>
  );
}
