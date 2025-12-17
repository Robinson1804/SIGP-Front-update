"use client";

import Image from "next/image";
import { AtSign, Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { login } from "@/features/auth/services/auth.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthStore } from "@/stores";
import { getDefaultRouteForRole } from "@/lib/permissions";
import type { AuthUser, Role } from "@/lib/definitions";
import { ROLES } from "@/lib/definitions";

// Mock CAPTCHA value (mismo que antes)
const MOCK_CAPTCHA_CODE = "A4B2C";

// Mapeo de roles del backend al frontend
const BACKEND_ROLE_MAP: Record<string, Role> = {
  "ADMIN": ROLES.ADMINISTRADOR,
  "ADMINISTRADOR": ROLES.ADMINISTRADOR,
  "PMO": ROLES.PMO,
  "SCRUM_MASTER": ROLES.SCRUM_MASTER,
  "COORDINADOR": ROLES.COORDINADOR,
  "DESARROLLADOR": ROLES.DESARROLLADOR,
  "IMPLEMENTADOR": ROLES.IMPLEMENTADOR,
  "USUARIO": ROLES.USUARIO,
  "PATROCINADOR": ROLES.COORDINADOR, // Mapear PATROCINADOR a COORDINADOR
};

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar captcha
    if (captcha.toUpperCase() !== MOCK_CAPTCHA_CODE) {
      setError("Código captcha incorrecto.");
      return;
    }

    // Validar campos
    if (!email.trim()) {
      setError("El email es requerido.");
      return;
    }

    if (!password.trim()) {
      setError("La contraseña es requerida.");
      return;
    }

    setIsLoading(true);

    try {
      // Llamar al backend real
      const response = await login({ email, password });

      // Mapear el rol del backend al frontend
      const backendRole = response.user.rol;
      const mappedRole = BACKEND_ROLE_MAP[backendRole] || ROLES.USUARIO;

      // Mapear la respuesta del backend al formato AuthUser
      const authUser: AuthUser = {
        id: response.user.id.toString(),
        username: response.user.username,
        name: `${response.user.nombre} ${response.user.apellido}`.trim(),
        email: response.user.email,
        role: mappedRole,
      };

      // Guardar en el store
      setAuth(authUser, response.accessToken);

      // Redirigir según el rol
      const defaultRoute = getDefaultRouteForRole(authUser.role);
      router.push(defaultRoute);

    } catch (err: any) {
      console.error("Login error:", err);

      // Manejar errores específicos del backend
      if (err.response?.data?.error?.message) {
        setError(err.response.data.error.message);
      } else if (err.response?.status === 401) {
        setError("Credenciales inválidas. Por favor, inténtelo de nuevo.");
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Error de conexión. Verifique que el servidor esté disponible.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-white shadow-2xl border-2 border-white/20">
      <form onSubmit={handleSubmit}>
        <CardHeader className="items-center text-center p-6">
          <Image
            src="/images/logo_inei.svg"
            alt="Logo INEI"
            width={120}
            height={30}
            className="mb-4"
            priority
          />
          <CardTitle className="text-3xl font-bold text-accent">
            Metodología ABC
          </CardTitle>
          <CardDescription className="pt-1">
            Acceso al sistema del INEI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-6">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="usuario@inei.gob.pe"
                required
                className="pl-10 text-base"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                className="pl-10 pr-10 text-base"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="captcha">Código captcha</Label>
            <div className="flex items-center justify-center gap-4 rounded-md border border-input bg-muted/50 p-2">
              <div className="font-bold tracking-[0.5em] text-lg text-foreground select-none">
                {MOCK_CAPTCHA_CODE}
              </div>
            </div>
            <div className="relative mt-2">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="captcha"
                name="captcha"
                type="text"
                placeholder="Ingrese el código de arriba"
                required
                className="pl-10 text-base"
                autoCapitalize="off"
                autoCorrect="off"
                value={captcha}
                onChange={(e) => setCaptcha(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col p-6 pt-2">
          <Button
            type="submit"
            className="w-full text-lg font-bold"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-6 w-6 animate-spin" />}
            Ingresar
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
