
"use client";

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Target,
  Users,
  BarChart,
  Bell,
  Search,
} from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationEllipsis,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

type Person = {
  id: number;
  name: string;
  fatherName: string;
  motherName: string;
  functionalUnit: string;
  role: 'Scrum Master' | 'Usuario' | 'Coordinador' | 'Programador';
  skills: string;
  contractType: 'Locador' | 'Nombrado' | 'CAS';
  startDate: string;
  endDate: string;
};

const initialData: Person[] = [
    { id: 1, name: 'Nombre1 Nombre2', fatherName: 'Apellido Paterno', motherName: 'Apellido Materno', functionalUnit: 'Gobernanza', role: 'Scrum Master', skills: 'PHP, Python, .Net', contractType: 'Locador', startDate: '12/02/24', endDate: '12/02/25' },
    { id: 2, name: 'Nombre1 Nombre2', fatherName: 'Apellido Paterno', motherName: 'Apellido Materno', functionalUnit: 'Gobernanza', role: 'Usuario', skills: 'PHP, Python, .Net, Angular', contractType: 'Nombrado', startDate: '12/02/24', endDate: '12/02/25' },
    { id: 3, name: 'Nombre1 Nombre2', fatherName: 'Apellido Paterno', motherName: 'Apellido Materno', functionalUnit: '-', role: 'Coordinador', skills: 'PHP, .Net, Angular', contractType: 'CAS', startDate: '12/02/24', endDate: '12/02/25' },
    { id: 4, name: 'Nombre1 Nombre2', fatherName: 'Apellido Paterno', motherName: 'Apellido Materno', functionalUnit: 'Gobernanza', role: 'Programador', skills: 'Python, .Net, AWS', contractType: 'Locador', startDate: '12/02/24', endDate: '12/02/25' },
    { id: 5, name: 'Nombre1 Nombre2', fatherName: 'Apellido Paterno', motherName: 'Apellido Materno', functionalUnit: 'Gobernanza', role: 'Programador', skills: 'React, Node, FasApi, AWS, Vue, Django', contractType: 'Locador', startDate: '12/02/24', endDate: '12/02/25' },
    { id: 6, name: 'Nombre1 Nombre2', fatherName: 'Apellido Paterno', motherName: 'Apellido Materno', functionalUnit: 'Gobernanza', role: 'Scrum Master', skills: 'React, Vue, Node, Aws, Django', contractType: 'Locador', startDate: '12/02/24', endDate: '12/02/25' },
];

const roleColors: { [key in Person['role']]: string } = {
  'Scrum Master': '#F2DFB5',
  'Usuario': '#CCF3AC',
  'Coordinador': '#F8CFDA',
  'Programador': '#A1BFFF',
};

export default function RecursosHumanosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [role, setRole] = React.useState<string | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    setRole(storedRole);
  }, []);


  const filteredData = initialData.filter((person) =>
    Object.values(person).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (role === null) {
      return <div>Cargando...</div>;
  }

  const isPmo = role === 'pmo';

  return (
    <AppLayout
      isPmo={isPmo}
      breadcrumbs={[{ label: 'RECURSOS HUMANOS' }]}
    >
      <div className="bg-[#D5D5D5] border-y border-[#1A5581]">
        <div className="p-2 flex items-center justify-between w-full">
          <h2 className="font-bold text-black pl-2">RECURSOS HUMANOS</h2>
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-[#F9F9F9] p-6">
        <div className="relative mb-6 w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar..."
            className="pl-10 bg-white"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-[#004272]/10">
              <TableRow>
                <TableHead className="font-bold text-[#004272]">Nombre</TableHead>
                <TableHead className="font-bold text-[#004272]">Apellido Paterno</TableHead>
                <TableHead className="font-bold text-[#004272]">Apellido Materno</TableHead>
                <TableHead className="font-bold text-[#004272]">Unidad Funcional</TableHead>
                <TableHead className="font-bold text-[#004272]">Rol</TableHead>
                <TableHead className="font-bold text-[#004272]">Conocimientos</TableHead>
                <TableHead className="font-bold text-[#004272]">Tipo de contrato</TableHead>
                <TableHead className="font-bold text-[#004272]">Fecha Inicio</TableHead>
                <TableHead className="font-bold text-[#004272]">Fecha Fin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((person) => (
                  <TableRow key={person.id} className="[&>td]:px-4 [&>td]:py-3 even:bg-white odd:bg-gray-50/50">
                    <TableCell>{person.name}</TableCell>
                    <TableCell>{person.fatherName}</TableCell>
                    <TableCell>{person.motherName}</TableCell>
                    <TableCell>{person.functionalUnit}</TableCell>
                    <TableCell>
                      <Badge
                        style={{ backgroundColor: roleColors[person.role], color: '#1f2937' }}
                        className="font-medium"
                      >
                        {person.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{person.skills}</TableCell>
                    <TableCell>{person.contractType}</TableCell>
                    <TableCell>{person.startDate}</TableCell>
                    <TableCell>{person.endDate}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center h-24">
                    No se encontró personal que coincida con la búsqueda
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
            <div className="flex justify-end mt-6">
                <Pagination>
                <PaginationContent>
                    <PaginationItem>
                    <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1))}} />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                        if (totalPages <= 5 || (page === 1) || (page === totalPages) || (page >= currentPage - 1 && page <= currentPage + 1) ) {
                            return (
                                <PaginationItem key={page}>
                                <PaginationLink href="#" isActive={currentPage === page} onClick={(e) => {e.preventDefault(); setCurrentPage(page)}}>
                                    {page}
                                </PaginationLink>
                                </PaginationItem>
                            )
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return <PaginationEllipsis key={page} />
                        }
                        return null;
                    })}
                    
                    <PaginationItem>
                    <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p + 1))}} />
                    </PaginationItem>
                </PaginationContent>
                </Pagination>
            </div>
        )}
      </div>
    </AppLayout>
  );
}
