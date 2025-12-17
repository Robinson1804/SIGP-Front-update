'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Layout principal del dashboard con grid responsive
 *
 * Grid de 12 columnas que se adapta a diferentes pantallas
 */
export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className={cn('grid grid-cols-12 gap-4', className)}>
      {children}
    </div>
  );
}

/**
 * Props de sección de dashboard
 */
export interface DashboardSectionProps {
  children: ReactNode;
  /** Título de la sección */
  title?: string;
  /** Columnas en pantalla pequeña */
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /** Columnas en pantalla mediana */
  colsMd?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /** Columnas en pantalla grande */
  colsLg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  className?: string;
}

/**
 * Sección de componente en el layout
 */
export function DashboardSection({
  children,
  title,
  cols = 12,
  colsMd,
  colsLg,
  className,
}: DashboardSectionProps) {
  const colsClass = `col-span-${cols}`;
  const colsMdClass = colsMd ? `md:col-span-${colsMd}` : '';
  const colsLgClass = colsLg ? `lg:col-span-${colsLg}` : '';

  return (
    <div className={cn(colsClass, colsMdClass, colsLgClass, className)}>
      {title && (
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      )}
      {children}
    </div>
  );
}
