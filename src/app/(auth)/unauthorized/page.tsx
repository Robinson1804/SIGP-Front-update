'use client';

import { useRouter } from 'next/navigation';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/stores';
import { getDefaultRouteForRole } from '@/lib/permissions';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleGoHome = () => {
    if (user) {
      router.push(getDefaultRouteForRole(user.role));
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 p-4 rounded-full">
            <ShieldX className="h-16 w-16 text-red-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Acceso Denegado
        </h1>

        <p className="text-gray-600 mb-6">
          No tienes permisos para acceder a esta sección del sistema.
          Contacta al administrador si crees que esto es un error.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>

          <Button
            onClick={handleGoHome}
            className="flex items-center gap-2 bg-[#004272] hover:bg-[#003259]"
          >
            <Home className="h-4 w-4" />
            Ir al inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
