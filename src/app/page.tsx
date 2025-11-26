
"use client";

import Image from 'next/image';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { LoginForm } from '@/components/auth/login-form';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const bgImage = PlaceHolderImages.find((img) => img.id === 'inei-background');

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole) {
      if (userRole === 'pmo') {
        router.push('/pgd');
      } else {
        router.push('/poi');
      }
    }
  }, [router]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4">
      {bgImage && (
        <Image
          src={bgImage.imageUrl}
          alt={bgImage.description}
          fill
          priority
          className="object-cover -z-10 brightness-50"
          data-ai-hint={bgImage.imageHint}
        />
      )}
      <React.Suspense fallback={<div>Cargando formulario...</div>}>
         <LoginForm />
      </React.Suspense>
    </main>
  );
}
