"use client";

import Image from "next/image";
import { AtSign, Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { authenticate, type AuthenticateResult } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthStore } from "@/stores";

function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full text-lg font-bold" aria-disabled={pending} disabled={pending}>
      {pending && <Loader2 className="mr-2 h-6 w-6 animate-spin" />}
      Ingresar
    </Button>
  );
}

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, dispatch] = useFormState<AuthenticateResult | undefined, FormData>(authenticate, undefined);
  const setUser = useAuthStore((state) => state.setUser);

  // Cuando la autenticación es exitosa, usar el Zustand store para hacer login
  useEffect(() => {
    if (state?.user) {
      setUser(state.user);
    }
  }, [state?.user, setUser]);

  const handleFormAction = (formData: FormData) => {
    dispatch(formData);
  };

  return (
    <Card className="w-full max-w-md bg-white shadow-2xl border-2 border-white/20">
      <form action={handleFormAction}>
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
            <Label htmlFor="username">Nombre de usuario</Label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Ingresar usuario"
                required
                className="pl-10 text-base"
                aria-describedby="username-error"
              />
            </div>
            {state?.errors?.username && (
              <div id="username-error" aria-live="polite" className="text-sm font-medium text-destructive pt-1">
                {state.errors.username.map((error: string) => (
                    <p key={error}>{error}</p>
                ))}
              </div>
            )}
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
                aria-describedby="password-error"
                defaultValue="password"
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
             {state?.errors?.password && (
              <div id="password-error" aria-live="polite" className="text-sm font-medium text-destructive pt-1">
                {state.errors.password.map((error: string) => (
                    <p key={error}>{error}</p>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="captcha">Código captcha</Label>
            <div className="flex items-center justify-center gap-4 rounded-md border border-input bg-muted/50 p-2">
              <div className="font-bold tracking-[0.5em] text-lg text-foreground select-none">
                A4B2C
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
                aria-describedby="captcha-error"
                defaultValue="A4B2C"
              />
            </div>
             {state?.errors?.captcha && (
              <div id="captcha-error" aria-live="polite" className="text-sm font-medium text-destructive pt-1">
                 {state.errors.captcha.map((error: string) => (
                    <p key={error}>{error}</p>
                ))}
              </div>
            )}
          </div>
           {state?.message && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col p-6 pt-2">
           <LoginButton />
        </CardFooter>
      </form>
    </Card>
  );
}
