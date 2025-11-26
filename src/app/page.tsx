
"use client";

import Image from 'next/image';
import React from 'react';
import { useRouter } from 'next/navigation';

import { LoginForm } from '@/components/auth/login-form';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const bgImage = PlaceHolderImages.find((img) => img.id === 'inei-background');

export default function LoginPage() {
  // This component will now ONLY render the login form.
  // The redirection logic will be handled by the server action
  // after a successful login, and by middleware or individual page
  // layouts for protecting routes.

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
      <LoginForm />
    </main>
  );
}
