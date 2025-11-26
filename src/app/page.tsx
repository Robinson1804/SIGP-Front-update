
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { paths } from '@/lib/paths';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(paths.login);
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <p>Redirigiendo a la página de inicio de sesión...</p>
    </div>
  );
}
