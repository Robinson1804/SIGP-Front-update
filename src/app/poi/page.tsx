
"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layout/app-layout';
import PmoPoi from '@/components/poi/pmo-poi';
import ScrumMasterPoi from '@/components/poi/scrum-master-poi';


export default function PoiPage() {
    const searchParams = useSearchParams();
    // In a real app, role would come from a session.
    // We simulate it here for demonstration.
    // If we navigate from PGD, we assume PMO. Otherwise, Scrum Master.
    const role = searchParams.get('from') === 'pgd' ? 'PMO' : 'Scrum Master';

    if (role === 'PMO') {
        return <PmoPoi />;
    }
    
    return <ScrumMasterPoi />;
}
