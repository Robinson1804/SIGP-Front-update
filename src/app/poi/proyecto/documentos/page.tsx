

"use client";

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileText,
  Target,
  Users,
  BarChart,
  Bell,
  Search,
  Download,
  CheckSquare,
} from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Project } from '@/lib/definitions';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type DocumentStatus = 'Pendiente' | 'Aprobado' | 'No aprobado';
type Document = {
    id: string;
    phase: string;
    description: string;
    link: string;
    status: DocumentStatus;
};

const initialDocuments: Document[] = [
    { id: '1', phase: 'Análisis y Planificación', description: 'Presentación Kick Off', link: 'Subir', status: 'Aprobado' },
    { id: '2', phase: 'Análisis y Planificación', description: 'Acta de constitucion del proyecto', link: 'https://drive.google.com/file/d/1S0v08cemryRXG3', status: 'Aprobado' },
    { id: '3', phase: 'Análisis y Planificación', description: 'Cronograma de lanzamiento', link: 'Subir', status: 'Aprobado' },
    { id: '4', phase: 'Diseño', description: 'Prototipo', link: 'https://drive.google.com/file/d/1S0v08cemryRXG3', status: 'Pendiente' },
    { id: '5', phase: 'Diseño', description: 'Casos de pruebas unitarias', link: 'Subir', status: 'Pendiente' },
    { id: '6', phase: 'Desarrollo', description: 'Código fuentes del software', link: 'Subir', status: 'Pendiente' },
];

const documentStatusConfig: { [key: string]: { bg: string; text: string } } = {
    'Pendiente': { bg: '#FFF0C8', text: '#A67C00' },
    'Aprobado': { bg: '#B2FBBE', text: '#006B1A' },
    'No aprobado': { bg: '#FFC8C8', text: '#A90000' },
};

const navItems = [
  { label: "PGD", icon: FileText, href: "/pgd" },
  { label: "POI", icon: Target, href: "/poi" },
  { label: "RECURSOS HUMANOS", icon: Users, href: "/recursos-humanos" },
  { label: "DASHBOARD", icon: BarChart, href: "/dashboard" },
  { label: "NOTIFICACIONES", icon: Bell, href: "/notificaciones" },
];

function ProjectDocumentsContent() {
    const [project, setProject] = React.useState<Project | null>(null);
    const router = useRouter();
    const [activeTab, setActiveTab] = React.useState('Documentos');
    const [documents, setDocuments] = React.useState<Document[]>(initialDocuments);

    React.useEffect(() => {
        const savedProjectData = localStorage.getItem('selectedProject');
        if (savedProjectData) {
            setProject(JSON.parse(savedProjectData));
        } else {
            router.push('/poi');
        }
    }, [router]);

    const handleTabClick = (tabName: string) => {
        let route = '';
        if (tabName === 'Detalles') route = '/poi/proyecto/detalles';
        else if (tabName === 'Backlog') route = '/poi/proyecto/backlog';

        if (route) {
            router.push(route);
        } else {
            setActiveTab(tabName);
        }
    };

    const handleDocumentStatusChange = (docId: string, newStatus: DocumentStatus) => {
        setDocuments(documents.map(doc => doc.id === docId ? { ...doc, status: newStatus } : doc));
    };

    if (!project) {
        return (
             <AppLayout navItems={navItems} breadcrumbs={[{ label: 'POI', href: '/poi' }, { label: 'Cargando...' }]}>
                <div className="flex-1 flex items-center justify-center">Cargando...</div>
             </AppLayout>
        )
    }

    const projectCode = `PROY N° ${project.id}`;
    const breadcrumbs = [{ label: "POI", href: "/poi" }, {label: 'Documentos'}];
    const projectTabs = [ { name: 'Detalles' }, { name: 'Documentos' }, { name: 'Backlog' }];

    const secondaryHeader = (
      <>
        <div className="bg-[#D5D5D5] border-b border-t border-[#1A5581]">
            <div className="p-2 flex items-center justify-between w-full">
                <h2 className="font-bold text-black pl-2">
                    {`${projectCode}: ${project.name}`}
                </h2>
            </div>
        </div>
        <div className="sticky top-[104px] z-10 bg-[#F9F9F9] px-6 pt-4">
          <div className="flex items-center gap-2">
            {projectTabs.map(tab => (
                 <Button 
                    key={tab.name}
                    size="sm" 
                    onClick={() => handleTabClick(tab.name)} 
                    className={cn(activeTab === tab.name ? 'bg-[#018CD1] text-white' : 'bg-white text-black border-gray-300')} 
                    variant={activeTab === tab.name ? 'default' : 'outline'}
                >
                    {tab.name}
                </Button>
            ))}
          </div>
        </div>
      </>
    );

    return (
        <AppLayout
            navItems={navItems}
            breadcrumbs={breadcrumbs}
            secondaryHeader={secondaryHeader}
        >
            <div className="flex-1 flex flex-col bg-[#F9F9F9]">
                <div className="p-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText className="h-6 w-6 text-black" />
                            <h3 className="text-xl font-bold">DOCUMENTOS</h3>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input placeholder="Buscar por nombre/descripción" className="pl-10 bg-white" />
                            </div>
                        </div>
                        <div className="rounded-lg border overflow-hidden">
                        <Table className="bg-white">
                            <TableHeader className="bg-[#004272]/10">
                                <TableRow>
                                    <TableHead className="font-bold text-[#004272]">Fase</TableHead>
                                    <TableHead className="font-bold text-[#004272]">Descripción</TableHead>
                                    <TableHead className="font-bold text-[#004272]">Link (Archivo o carpeta)</TableHead>
                                    <TableHead className="font-bold text-[#004272]">Estado</TableHead>
                                    <TableHead className="text-center font-bold text-[#004272]">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {documents.map((doc) => (
                                    <TableRow key={doc.id}>
                                        <TableCell>{doc.phase}</TableCell>
                                        <TableCell>{doc.description}</TableCell>
                                        <TableCell>
                                            {doc.link.startsWith('http') ? 
                                                <a href={doc.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{doc.link}</a> : 
                                                <span className="underline cursor-pointer">{doc.link}</span>
                                            }
                                        </TableCell>
                                        <TableCell>
                                            <Badge style={{ backgroundColor: documentStatusConfig[doc.status].bg, color: documentStatusConfig[doc.status].text }} className="font-semibold">
                                                {doc.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="flex justify-center gap-2">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={doc.status !== 'Pendiente'}>
                                                        <CheckSquare className="h-5 w-5" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-2">
                                                    <div className="text-sm font-semibold p-1">Validar documento</div>
                                                    <div className="flex flex-col gap-1 mt-1">
                                                        <Badge onClick={() => handleDocumentStatusChange(doc.id, 'Aprobado')} style={{ backgroundColor: documentStatusConfig['Aprobado'].bg, color: documentStatusConfig['Aprobado'].text}} className="cursor-pointer justify-center py-1">Aprobado</Badge>
                                                        <Badge onClick={() => handleDocumentStatusChange(doc.id, 'No aprobado')} style={{ backgroundColor: documentStatusConfig['No aprobado'].bg, color: documentStatusConfig['No aprobado'].text}} className="cursor-pointer justify-center py-1">No Aprobado</Badge>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Download className="h-5 w-5" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </div>
                        <Pagination className="mt-4 justify-start">
                            <PaginationContent>
                                <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
                                <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
                                <PaginationItem><PaginationLink href="#" isActive>2</PaginationLink></PaginationItem>
                                <PaginationItem><PaginationLink href="#">3</PaginationLink></PaginationItem>
                                <PaginationItem>...</PaginationItem>
                                <PaginationItem><PaginationNext href="#" /></PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

export default function DocumentsPage() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <ProjectDocumentsContent />
        </React.Suspense>
    )
}
