
"use client";

import Image from "next/image";
import { User } from "lucide-react";

import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const userAvatar = PlaceHolderImages.find((img) => img.id === "user-avatar");

const user = {
  name: "Eduardo",
  lastName: "Corilla",
  phone: "987654321",
  location: "Lima, Perú",
  email: "eduardo.corilla@inei.gob.pe",
  role: "PMO",
  roleDescription: "Project Manager",
};

const InfoField = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1">
    <Label htmlFor={label.toLowerCase()}>{label}</Label>
    <Input id={label.toLowerCase()} value={value} readOnly className="bg-gray-100" />
  </div>
);

export default function ProfilePage() {
  return (
    <AppLayout
      breadcrumbs={[{ label: "PERFIL" }]}
    >
      <div className="bg-[#D5D5D5] border-y border-[#1A5581]">
        <div className="p-2 flex items-center w-full">
          <h2 className="font-bold text-black pl-2">
            Bienvenido, {user.name} {user.lastName}
          </h2>
        </div>
      </div>

      <main className="flex-1 bg-[#F9F9F9] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <User className="h-6 w-6 text-black" />
            <h3 className="text-lg font-bold text-black">INFORMACIÓN PERSONAL</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 items-start">
            <Card className="md:col-span-1 lg:col-span-1">
              <CardContent className="p-6 flex flex-col items-center text-center">
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
                  Hola, {user.name} {user.lastName}
                </p>
                <p className="text-muted-foreground">{user.roleDescription}</p>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField label="Nombres" value={user.name} />
                <InfoField label="Apellidos" value={user.lastName} />
                <InfoField label="Teléfono celular" value={user.phone} />
                <InfoField label="Ubicación" value={user.location} />
                <div className="md:col-span-2">
                   <InfoField label="Correo institucional" value={user.email} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
