import { HardHat } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | SIGP',
  description: 'Panel de control principal del Sistema Integrado de Gestión de Proyectos',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
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
    </div>
  );
}
