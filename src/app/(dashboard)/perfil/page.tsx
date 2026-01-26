"use client";

import Image from "next/image";
import { User as UserIcon } from "lucide-react";

import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useAuth } from '@/stores';
import { ProtectedRoute } from "@/features/auth";
import { ROLES, type Role } from "@/lib/definitions";

const userAvatar = PlaceHolderImages.find((img) => img.id === "user-avatar");

// Mapeo de roles a nombres legibles
const ROLE_DISPLAY_NAMES: Record<Role, string> = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.PMO]: 'Project Manager',
  [ROLES.SCRUM_MASTER]: 'Scrum Master',
  [ROLES.DESARROLLADOR]: 'Desarrollador',
  [ROLES.IMPLEMENTADOR]: 'Implementador',
  [ROLES.COORDINADOR]: 'Coordinador',
  [ROLES.USUARIO]: 'Usuario',
  [ROLES.PATROCINADOR]: 'Patrocinador',
};

const InfoField = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1">
    <Label htmlFor={label.toLowerCase()}>{label}</Label>
    <Input id={label.toLowerCase()} value={value} readOnly className="bg-gray-100" />
  </div>
);

export default function ProfilePage() {
  const { user } = useAuth();

  // Extraer nombre y apellido del nombre completo
  const nameParts = user?.name.split(' ') || ['', ''];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return (
    <ProtectedRoute>
      <AppLayout breadcrumbs={[{ label: "PERFIL" }]}>
        <div className="bg-[#D5D5D5] border-y border-[#1A5581]">
          <div className="p-2 flex items-center w-full">
            <h2 className="font-bold text-black pl-2">
              Bienvenido, {user?.name}
            </h2>
          </div>
        </div>

        <main className="flex-1 bg-[#F9F9F9] p-6 flex items-center justify-center">
          <div className="max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-2 mb-6">
              <UserIcon className="h-6 w-6 text-black" />
              <h3 className="text-lg font-bold text-black">INFORMACIÓN PERSONAL</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 items-stretch">
              <Card className="md:col-span-1 lg:col-span-1 flex flex-col">
                <CardContent className="p-6 flex flex-col items-center text-center flex-grow justify-center">
                  {userAvatar && (
                    <Image
                      src={userAvatar.imageUrl}
                      alt={userAvatar.description}
                      width={150}
                      height={150}
                      className="rounded-full mb-4"
                      data-ai-hint={userAvatar.imageHint}
                    />
                  )}
                  <p className="text-xl font-bold">
                    Hola, {user?.name}
                  </p>
                  <p className="text-muted-foreground">
                    {user?.role ? ROLE_DISPLAY_NAMES[user.role] : ''}
                  </p>
                </CardContent>
              </Card>

              <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="p-6 grid grid-cols-1 gap-6">
                  <InfoField label="Nombres" value={firstName} />
                  <InfoField label="Apellidos" value={lastName} />
                  <InfoField label="Usuario" value={user?.username || ''} />
                  <InfoField label="Correo institucional" value={user?.email || ''} />
                  <InfoField label="Rol" value={user?.role ? ROLE_DISPLAY_NAMES[user.role] : ''} />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  );
}
