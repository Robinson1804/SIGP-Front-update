import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogOut } from "lucide-react";

export default function PmoDashboardPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-accent">PMO Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">¡Bienvenido, usuario PMO!</p>
          <p className="mt-4">Ha iniciado sesión correctamente en el sistema.</p>
          <Button asChild className="mt-6 w-full">
            <Link href="/">
              <LogOut className="mr-2 h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
