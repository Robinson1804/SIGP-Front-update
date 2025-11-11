
"use client";

import React from 'react';
import {
  FileText,
  Target,
  Users,
  BarChart,
  Bell,
  HardHat,
} from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';

const navItems = [
  { label: "PGD", icon: FileText, href: "/pmo-dashboard" },
  { label: "POI", icon: Target, href: "/poi" },
  { label: "RECURSOS HUMANOS", icon: Users, href: "/recursos-humanos" },
  { label: "DASHBOARD", icon: BarChart, href: "/dashboard" },
  { label: "NOTIFICACIONES", icon: Bell, href: "/notificaciones" },
];

export default function DashboardPage() {
  return (
    <AppLayout
      navItems={navItems}
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
