
"use client";

import React from 'react';
import {
  FileText,
  Target,
  Users,
  BarChart,
  Bell,
  Folder,
  Trash2,
  Pencil,
  Briefcase,
  DollarSign,
  Users as UsersIcon,
  CheckCircle,
  MoreHorizontal,
} from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const project = {
  id: 'PROY N°3',
  name: 'CPV',
  description: 'Implementación de requerimientos y mantenimiento de aplicativo de captura de datos (APK)',
  strategicAction: 'AE1: Modernizar los servidores, sistemas de almacenamiento y redes críticas del INEI',
  classification: 'Gestión interna',
  coordination: 'Son las divisiones',
  financialArea: ['OTIN', 'DCNC'],
  coordinator: 'Coordinador1',
  manager: 'Mario Casas',
  responsibles: ['Angella Trujillo', 'Anayeli Monzon', 'Otro Responsable'],
  years: ['2021', '2022', '2023', '2024'],
  annualAmount: '2,500,000.00',
  managementMethod: 'Scrum',
  startDate: '2025-04',
  endDate: '2025-09',
  status: 'En planificación',
};

const subProjects = [
    { id: '1', name: 'Monitoreo', progress: 80, amount: '640k', devs: 5, status: 'En desarrollo', icon: Briefcase, color: 'bg-[#559FFE]' },
    { id: '2', name: 'Logística', progress: 60, amount: '360k', devs: 4, status: 'En desarrollo', icon: Briefcase, color: 'bg-[#559FFE]' },
    { id: '3', name: 'Captura', progress: 50, amount: '350k', devs: 6, status: 'En desarrollo', icon: Briefcase, color: 'bg-[#559FFE]' },
    { id: '4', name: 'BI', progress: 30, amount: '120k', devs: 3, status: 'En desarrollo', icon: Briefcase, color: 'bg-[#559FFE]' },
];

const sprints = [
  { name: 'Sprint 1', status: 'Finalizado', progress: 100 },
  { name: 'Sprint 2', status: 'En progreso', progress: 50 },
  { name: 'Sprint 3', status: 'En progreso', progress: 25 },
  { name: 'Sprint 4', status: 'Por hacer', progress: 0 },
];


const statusColors: { [key: string]: string } = {
  'Pendiente': 'bg-[#FE9F43] text-black',
  'En planificación': 'bg-[#FFD700] text-black',
  'En desarrollo': 'bg-[#559FFE] text-white',
  'Finalizado': 'bg-[#2FD573] text-white',
};

const subProjectStatusColors: { [key: string]: string } = {
    'Pendiente': 'bg-[#FF9F43] text-black',
    'En planificación': 'bg-[#FFD700] text-black',
    'En desarrollo': 'bg-[#54A0FF] text-white',
    'Finalizado': 'bg-[#2ED573] text-white',
};


const sprintStatusConfig: { [key: string]: { badge: string; progress: string } } = {
    'Por hacer': { badge: 'bg-[#FFD29F] text-black', progress: 'bg-[#FFD29F]' },
    'En progreso': { badge: 'bg-[#BFDBFE] text-black', progress: 'bg-[#BFDBFE]' },
    'Finalizado': { badge: 'bg-[#34D399] text-black', progress: 'bg-[#34D399]' },
};

const InfoField = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div>
        <p className="text-sm font-semibold text-gray-500 mb-1">{label}</p>
        <div className="text-sm p-2 bg-gray-50 rounded-md border min-h-[38px] flex items-center flex-wrap gap-1">
            {children}
        </div>
    </div>
);

const SubProjectCard = ({ subProject }: { subProject: typeof subProjects[0] }) => (
    <Card className="bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
                <subProject.icon className="w-5 h-5 text-gray-500" />
                <CardTitle className="text-base font-bold">{subProject.name}</CardTitle>
            </div>
             <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4" />
            </Button>
        </CardHeader>
        <CardContent>
            <Progress value={subProject.progress} indicatorClassName={subProject.color} />
            <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                <span>{subProject.progress}%</span>
            </div>
            <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-500" />
                    <span>Estado:</span>
                    <Badge className={`${subProjectStatusColors[subProject.status]}`}>{subProject.status}</Badge>
                </div>
                <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span>Monto:</span>
                    <span>S/ {subProject.amount}</span>
                </div>
                 <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4 text-gray-500" />
                    <span>Responsable:</span>
                    <span>{subProject.devs}</span>
                </div>
            </div>
        </CardContent>
    </Card>
);

const navItems = [
  { label: "PGD", icon: FileText, href: "/pmo-dashboard" },
  { label: "POI", icon: Target, href: "/poi" },
  { label: "RECURSOS HUMANOS", icon: Users, href: "#" },
  { label: "DASHBOARD", icon: BarChart, href: "#" },
  { label: "NOTIFICACIONES", icon: Bell, href: "#" },
];

export default function ProjectDetailsPage() {
    const [activeTab, setActiveTab] = React.useState('Detalles');

    const formatMonthYear = (dateString: string) => {
        if (!dateString) return '';
        const [year, month] = dateString.split('-');
        const date = new Date(Number(year), Number(month) - 1);
        return date.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
    }

    return (
        <AppLayout
            navItems={navItems}
            breadcrumbs={[
                { label: 'POI', href: '/poi' },
                { label: 'Detalles' }
            ]}
        >
            <div className="bg-[#D5D5D5] border-y border-[#1A5581]">
                <div className="p-2 flex items-center justify-between w-full">
                    <h2 className="font-bold text-black pl-2">
                        {`${project.id}: ${project.name}`}
                    </h2>
                </div>
            </div>
            <div className="flex-1 flex flex-col bg-[#F9F9F9] p-6">
                <div className="flex items-center mb-6 gap-2">
                     <Button size="sm" onClick={() => setActiveTab('Detalles')} className={activeTab === 'Detalles' ? 'bg-[#018CD1] text-white' : 'bg-white text-black border-gray-300'} variant={activeTab === 'Detalles' ? 'default' : 'outline'}>Detalles</Button>
                    <Button size="sm" onClick={() => setActiveTab('Documentos')} className={activeTab === 'Documentos' ? 'bg-[#018CD1] text-white' : 'bg-white text-black border-gray-300'} variant={activeTab === 'Documentos' ? 'default' : 'outline'}>Documentos</Button>
                    <Button size="sm" onClick={() => setActiveTab('Backlog')} className={activeTab === 'Backlog' ? 'bg-[#018CD1] text-white' : 'bg-white text-black border-gray-300'} variant={activeTab === 'Backlog' ? 'default' : 'outline'}>Backlog</Button>
                </div>

                {activeTab === 'Detalles' && (
                    <>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Folder className="w-6 h-6 text-gray-700" />
                            <h3 className="text-xl font-bold">{`${project.id}: ${project.name}`}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="destructive" size="sm" className="bg-[#EC221F] text-white">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </Button>
                            <Button size="sm" className="bg-[#018CD1] text-white">
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Columna Izquierda */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-500 mb-1">Estado</p>
                                                <Badge className={statusColors[project.status]}>{project.status}</Badge>
                                            </div>
                                            <InfoField label="Descripción"><p>{project.description}</p></InfoField>
                                            <InfoField label="Acción estratégica"><p>{project.strategicAction}</p></InfoField>
                                             <InfoField label="Clasificación"><p>{project.classification}</p></InfoField>
                                             <InfoField label="Coordinación"><p>{project.coordination}</p></InfoField>
                                             <InfoField label="Área Financiera">
                                                    {project.financialArea.map(area => <Badge key={area} variant="secondary">{area}</Badge>)}
                                            </InfoField>
                                        </div>
                                        <div className="space-y-4">
                                             <InfoField label="Coordinador"><p>{project.coordinator}</p></InfoField>
                                            <InfoField label="Gestor/Scrum Master"><p>{project.manager}</p></InfoField>
                                            <InfoField label="Responsable">
                                                    {project.responsibles.map(r => <Badge key={r} variant="secondary">{r}</Badge>)}
                                            </InfoField>
                                            <InfoField label="Año">
                                                    {project.years.map(y => <Badge key={y} variant="secondary">{y}</Badge>)}
                                            </InfoField>
                                            <InfoField label="Monto Anual"><p>S/ {project.annualAmount}</p></InfoField>
                                            <InfoField label="Método de Gestión de Proyecto"><p>{project.managementMethod}</p></InfoField>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-500 mb-1">Fecha inicio</p>
                                                    <div className="text-sm p-2 bg-gray-50 rounded-md border min-h-[38px] flex items-center">
                                                        <p>{formatMonthYear(project.startDate)}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-500 mb-1">Fecha fin</p>
                                                     <div className="text-sm p-2 bg-gray-50 rounded-md border min-h-[38px] flex items-center">
                                                        <p>{formatMonthYear(project.endDate)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        {/* Columna Derecha */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                       <CardTitle className="text-base">Progreso General</CardTitle>
                                       <span className="font-bold text-base">45%</span>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Progress value={45} className="h-2.5" indicatorClassName="bg-[#018CD1]" />
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader>
                                   <CardTitle className="text-base">Progreso por Sprints</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {sprints.map(sprint => (
                                        <div key={sprint.name}>
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="text-sm font-medium">{sprint.name}</p>
                                                <Badge className={`${sprintStatusConfig[sprint.status as keyof typeof sprintStatusConfig].badge} text-xs`}>{sprint.status}</Badge>
                                            </div>
                                            <Progress value={sprint.progress} className="h-2" indicatorClassName={sprintStatusConfig[sprint.status as keyof typeof sprintStatusConfig].progress} />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    
                    <div className="mt-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">SUBPROYECTOS</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {subProjects.map(sub => <SubProjectCard key={sub.id} subProject={sub} />)}
                        </div>
                    </div>
                    </>
                )}

                {activeTab === 'Documentos' && <div className="text-center p-10"><p>Sección de Documentos en construcción.</p></div>}
                {activeTab === 'Backlog' && <div className="text-center p-10"><p>Sección de Backlog en construcción.</p></div>}

            </div>
        </AppLayout>
    );
}

    