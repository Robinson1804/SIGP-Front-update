"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { paths } from '@/lib/paths';

/**
 * This page redirects to the unified activity details page with tab=Dashboard.
 * All activity tabs are now handled in a single page for smoother navigation.
 * The actividadId is stored in localStorage, not in the URL.
 */
export default function DashboardPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the unified details page with Dashboard tab
        router.replace(`${paths.poi.actividad.detalles}?tab=Dashboard`);
    }, [router]);

    return (
        <div className="flex h-screen w-full items-center justify-center">
            Cargando dashboard...
        </div>
    );
}
