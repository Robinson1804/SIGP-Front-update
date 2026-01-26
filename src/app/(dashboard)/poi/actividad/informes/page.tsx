"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { paths } from '@/lib/paths';

/**
 * This page redirects to the unified activity details page with tab=Informes.
 * All activity tabs are now handled in a single page for smoother navigation.
 * The actividadId is stored in localStorage, not in the URL.
 */
export default function InformesPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the unified details page with Informes tab
        router.replace(`${paths.poi.actividad.detalles}?tab=Informes`);
    }, [router]);

    return (
        <div className="flex h-screen w-full items-center justify-center">
            Cargando informes...
        </div>
    );
}
