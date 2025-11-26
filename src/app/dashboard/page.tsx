
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  HardHat,
} from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';

export default function DashboardPage() {
    const [role, setRole] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const storedRole = localStorage.getItem("userRole");
        setRole(storedRole);
    }, []);

    if (role === null) {
        return <div className="flex h-screen w-full items-center justify-center">Cargando...</div>;
    }

    if (role !== 'pmo') {
        return (
            <AppLayout
                isPmo={false}
                breadcrumbs={[{ label: 'ACCESO DENEGADO' }]}
            >
                <div className="flex-1 flex flex-col items-center justify-center bg-[#F9F9F9] p-6 text-gray-500">
                    <h3 className="text-2xl font-bold">Acceso Denegado</h3>
                    <p>No tienes permiso para ver esta página.</p>
                </div>
            </AppLayout>
        );
    }

  return (
    <AppLayout
      isPmo
      breadcrumbs={[{ label: 'DASHBOARD' }]}
    >
      <div className="bg-[#D5D5D5] border-y border-[#1A5581]">
        <div className="p-2 flex items-center justify-between w-full">
          <h2 className="font-bold text-black pl-2">DASHBOARD</h2>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F9F9F9] p-6 text-gray-500">
        <HardHat className="h-24 w-24 mb-4" />
        <h3 className="text-2xl font-bold">Módulo en Construcción</h3>
        <p>Esta sección estará disponible próximamente.</p>
      </div>
    </AppLayout>
  );
}
