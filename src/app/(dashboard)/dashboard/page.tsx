import type { Metadata } from 'next';
import { DashboardContent } from './dashboard-content';

export const metadata: Metadata = {
  title: 'Dashboard | SIGP',
  description: 'Panel de control principal del Sistema Integrado de Gestión de Proyectos',
};

export default function DashboardPage() {
  return <DashboardContent />;
}
