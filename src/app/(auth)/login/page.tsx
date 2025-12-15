
"use client";

import Image from 'next/image';
import React from 'react';

import { LoginForm } from '@/features/auth';

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4">
      <Image
        src="/images/inei.jpg"
        alt="Fondo INEI"
        fill
        priority
        className="object-cover -z-20"
      />
      <div className="absolute inset-0 -z-10 bg-[#004272]/50" />
      <LoginForm />
    </main>
  );
}
